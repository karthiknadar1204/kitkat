require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const Kyra = require('kyra-observability-sdk');

// Initialize Kyra SDK
const kyra = new Kyra();

const RAG_STORE_FILE = 'rag-embeddings.json';

// Sample resume content (since PDF parsing is having issues)
const resumeText = `
Karthik Nadar
Software Engineer | Full Stack Developer
Email: karthik@example.com | Phone: +1-234-567-8900
Location: San Francisco, CA

SUMMARY
Experienced software engineer with 5+ years in full-stack development. Specialized in React, Node.js, and cloud technologies. Strong background in building scalable web applications and microservices architecture.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java, Go
Frontend: React, Next.js, Vue.js, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express, FastAPI, Spring Boot
Databases: PostgreSQL, MongoDB, Redis, MySQL
Cloud: AWS (EC2, S3, Lambda), Google Cloud, Docker, Kubernetes
Tools: Git, CI/CD, Jenkins, GitHub Actions, Webpack

WORK EXPERIENCE

Senior Software Engineer | TechCorp Inc. | Jan 2021 - Present
- Led development of microservices architecture serving 2M+ users
- Implemented real-time chat features using WebSockets and Redis
- Optimized database queries reducing response time by 60%
- Mentored 5 junior developers and conducted code reviews
- Technologies: React, Node.js, PostgreSQL, AWS, Docker

Software Engineer | StartupXYZ | Jun 2019 - Dec 2020
- Built responsive web applications using React and Redux
- Developed RESTful APIs with Node.js and Express
- Integrated payment systems using Stripe API
- Implemented CI/CD pipelines with GitHub Actions
- Technologies: React, Node.js, MongoDB, AWS

Junior Developer | WebSolutions Co. | Jan 2018 - May 2019
- Created interactive UI components with React
- Maintained legacy PHP applications
- Collaborated with design team on UX improvements
- Technologies: React, PHP, MySQL, jQuery

EDUCATION
Bachelor of Science in Computer Science
Stanford University | 2014 - 2018
GPA: 3.8/4.0

PROJECTS

E-Commerce Platform
- Built full-stack e-commerce platform with React and Node.js
- Implemented shopping cart, payment processing, and order management
- Deployed on AWS with auto-scaling capabilities
- Tech Stack: React, Node.js, PostgreSQL, Stripe, AWS

Real-Time Analytics Dashboard
- Developed real-time analytics dashboard for monitoring application metrics
- Used WebSockets for live data updates
- Implemented data visualization with Chart.js
- Tech Stack: React, Node.js, Socket.io, MongoDB

AI Chatbot Application
- Created AI-powered chatbot using OpenAI API
- Integrated with Slack for team communication
- Implemented conversation history and context management
- Tech Stack: Python, FastAPI, OpenAI, PostgreSQL

CERTIFICATIONS
- AWS Certified Solutions Architect
- Google Cloud Professional Developer
- MongoDB Certified Developer
`;

// Calculate cosine similarity
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Chunk text into smaller pieces
function chunkText(text, chunkSize = 400) {
  // Split by double newlines (paragraphs)
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  const chunks = [];

  for (const para of paragraphs) {
    if (para.length <= chunkSize) {
      chunks.push(para.trim());
    } else {
      // Split long paragraphs by sentences
      const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
      let currentChunk = '';
      
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      }
      
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }
  }

  return chunks;
}

// Initialize RAG system
async function initializeRAG() {
  console.log('\n📄 Initializing RAG System...\n');

  // Check if embeddings already exist
  if (fs.existsSync(RAG_STORE_FILE)) {
    console.log('✅ Found existing embeddings, loading...');
    const data = JSON.parse(fs.readFileSync(RAG_STORE_FILE, 'utf8'));
    console.log(`📊 Loaded ${data.chunks.length} chunks from storage\n`);
    return data;
  }

  console.log('📝 Processing resume text...');
  
  // Chunk the text
  console.log('✂️  Chunking text...');
  const chunks = chunkText(resumeText);
  console.log(`📦 Created ${chunks.length} chunks\n`);

  // Create embeddings for all chunks
  console.log('🧮 Creating embeddings (this may take a moment)...');
  
  const response = await kyra.embeddings({
    model: 'text-embedding-3-small',
    input: chunks,
  });

  console.log('✅ Embeddings created!');
  console.log('📊 Tokens used:', response.usage.total_tokens);

  // Store embeddings
  const ragData = {
    chunks: chunks.map((chunk, idx) => ({
      text: chunk,
      embedding: response.data[idx].embedding,
      index: idx
    })),
    metadata: {
      totalChunks: chunks.length,
      model: 'text-embedding-3-small',
      createdAt: new Date().toISOString()
    }
  };

  fs.writeFileSync(RAG_STORE_FILE, JSON.stringify(ragData, null, 2));
  console.log('💾 Embeddings saved to', RAG_STORE_FILE);
  console.log('');

  return ragData;
}

// Retrieve relevant chunks
async function retrieveContext(query, ragData, topK = 3) {
  console.log('🔍 Searching for relevant context...');
  
  // Create query embedding
  const queryResponse = await kyra.embeddings({
    model: 'text-embedding-3-small',
    input: query,
  });

  const queryEmbedding = queryResponse.data[0].embedding;

  // Calculate similarities
  const similarities = ragData.chunks.map(chunk => ({
    text: chunk.text,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    index: chunk.index
  }));

  // Sort and get top K
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topChunks = similarities.slice(0, topK);

  console.log(`✅ Found ${topK} relevant chunks\n`);

  return topChunks;
}

// RAG query with chat
async function ragQuery(query, ragData) {
  // Retrieve relevant context
  const relevantChunks = await retrieveContext(query, ragData);

  // Build context for the LLM
  const context = relevantChunks.map((chunk, idx) => 
    `[Chunk ${idx + 1} - ${(chunk.similarity * 100).toFixed(1)}% relevant]:\n${chunk.text}`
  ).join('\n\n');

  // Use wrapChain to trace the full RAG pipeline
  const steps = [
    {
      name: 'retrieval',
      fn: async () => ({ retrievedChunks: relevantChunks.length }),
      params: { query },
      tokens: { input: 0, output: 0 }
    },
    {
      name: 'generation',
      fn: async () => {
        return await kyra.chatCompletions({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant. Answer questions based on the provided resume context. Be specific and cite information from the context.'
            },
            {
              role: 'user',
              content: `Context from resume:\n\n${context}\n\nQuestion: ${query}\n\nAnswer based on the context above:`
            }
          ]
        });
      },
      params: { query, contextLength: context.length }
    }
  ];

  const { results, traceId } = await kyra.wrapChain(steps, process.env.KYRA_PROJECT);
  const response = results[1];

  return {
    answer: response.choices[0].message.content,
    sources: relevantChunks,
    traceId
  };
}

// Interactive RAG chat
async function startRAGChat() {
  console.log('\n📚 Kyra RAG (Retrieval-Augmented Generation) Test');
  console.log('📊 Project:', process.env.KYRA_PROJECT);
  console.log('🔗 Endpoint:', process.env.KYRA_ENDPOINT);

  // Initialize RAG
  const ragData = await initializeRAG();

  console.log('💬 RAG System Ready! Ask questions about Karthik\'s resume.');
  console.log('\n💡 Try these questions:');
  console.log('  1. "What are Karthik\'s technical skills?"');
  console.log('  2. "Tell me about his work experience at TechCorp"');
  console.log('  3. "What projects has he built?"');
  console.log('  4. "Where did he go to university?"');
  console.log('  5. "What certifications does he have?"');
  console.log('  6. "What programming languages does he know?"');
  console.log('  7. "Describe his e-commerce project"');
  console.log('  8. "What databases has he worked with?"');
  console.log('\nType "exit" to quit\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function chat() {
    rl.question('You: ', async (question) => {
      if (!question.trim()) {
        return chat();
      }

      if (question.toLowerCase() === 'exit') {
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);
      }

      try {
        console.log('\n⏳ Processing RAG query...\n');
        
        const result = await ragQuery(question, ragData);

        console.log(`🤖 Answer: ${result.answer}\n`);
        
        console.log('📑 Sources used (by relevance):');
        result.sources.forEach((source, idx) => {
          const preview = source.text.substring(0, 120).replace(/\n/g, ' ');
          console.log(`  ${idx + 1}. [${(source.similarity * 100).toFixed(1)}% match] ${preview}...`);
        });
        
        console.log(`\n🔗 Trace ID: ${result.traceId}`);
        console.log('📊 Check your dashboard to see the full RAG pipeline!\n');

      } catch (error) {
        console.error('\n❌ Error:', error.message, '\n');
      }

      chat();
    });
  }

  chat();
}

startRAGChat();

