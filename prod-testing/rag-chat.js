require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const pdf = require('pdf-parse');
const Kyra = require('kyra-observability-sdk');

// Initialize Kyra SDK
const kyra = new Kyra();

const RAG_STORE_FILE = 'resume-embeddings.json';

// Calculate cosine similarity
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Chunk text into smaller pieces
function chunkText(text, chunkSize = 500) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
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

  return chunks;
}

// Initialize RAG system
async function initializeRAG() {
  console.log('\n📄 Initializing RAG System with Resume...\n');

  // Check if embeddings already exist
  if (fs.existsSync(RAG_STORE_FILE)) {
    console.log('✅ Found existing embeddings, loading...');
    const data = JSON.parse(fs.readFileSync(RAG_STORE_FILE, 'utf8'));
    console.log(`📊 Loaded ${data.chunks.length} chunks from storage\n`);
    return data;
  }

  console.log('📖 Parsing Resume.pdf...');
  
  // Parse PDF
  const dataBuffer = fs.readFileSync('Resume.pdf');
  const pdfData = await pdf(dataBuffer);
  const text = pdfData.text;

  console.log('✅ PDF parsed successfully');
  console.log('📏 Total characters:', text.length);

  // Chunk the text
  console.log('✂️  Chunking text...');
  const chunks = chunkText(text, 600);
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
              content: 'You are a helpful assistant. Answer questions based on the provided context from a resume. Be specific and cite information from the context.'
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

  console.log('💬 RAG System Ready! Ask questions about the resume.');
  console.log('\n💡 Try asking:');
  console.log('  - "What are the technical skills?"');
  console.log('  - "Tell me about work experience"');
  console.log('  - "What projects are mentioned?"');
  console.log('  - "What education background?"');
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
        
        console.log('📑 Sources used:');
        result.sources.forEach((source, idx) => {
          console.log(`  ${idx + 1}. [${(source.similarity * 100).toFixed(1)}%] ${source.text.substring(0, 100)}...`);
        });
        
        console.log(`\n🔗 Trace ID: ${result.traceId}`);
        console.log('');

      } catch (error) {
        console.error('\n❌ Error:', error.message, '\n');
      }

      chat();
    });
  }

  chat();
}

startRAGChat();

