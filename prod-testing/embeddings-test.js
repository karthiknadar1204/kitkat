require('dotenv').config();
const fs = require('fs');
const Kyra = require('kyra-observability-sdk');

// Initialize Kyra SDK
const kyra = new Kyra();

// Simple test texts to embed
const testTexts = [
  "The quick brown fox jumps over the lazy dog",
  "Machine learning is a subset of artificial intelligence",
  "JavaScript is a popular programming language for web development",
  "Climate change is affecting global weather patterns",
  "Quantum computing uses quantum mechanics principles"
];

// Calculate cosine similarity between two vectors
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

async function testEmbeddings() {
  console.log('\n🧮 Kyra Embeddings Test');
  console.log('📊 Project:', process.env.KYRA_PROJECT);
  console.log('🔗 Endpoint:', process.env.KYRA_ENDPOINT);
  console.log('\n📝 Creating embeddings for', testTexts.length, 'test texts...\n');

  try {
    // Create embeddings using Kyra SDK (automatically traced!)
    const response = await kyra.embeddings({
      model: 'text-embedding-3-small',
      input: testTexts,
    });

    console.log('✅ Embeddings created successfully!');
    console.log('📊 Total tokens used:', response.usage.total_tokens);
    console.log('📏 Embedding dimension:', response.data[0].embedding.length);
    console.log('🔢 Number of embeddings:', response.data.length);

    // Store embeddings locally
    const embeddings = response.data.map((item, index) => ({
      text: testTexts[index],
      embedding: item.embedding,
      index: item.index
    }));

    fs.writeFileSync(
      'embeddings-store.json',
      JSON.stringify(embeddings, null, 2)
    );

    console.log('\n💾 Embeddings saved to embeddings-store.json');

    // Test similarity search
    console.log('\n🔍 Testing Semantic Search...\n');
    
    const query = "Tell me about AI and ML";
    console.log('Query:', query);
    
    const queryResponse = await kyra.embeddings({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = queryResponse.data[0].embedding;

    // Calculate similarities
    const similarities = embeddings.map((item, idx) => ({
      text: item.text,
      similarity: cosineSimilarity(queryEmbedding, item.embedding),
      index: idx
    }));

    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);

    console.log('\n📊 Top 3 most similar texts:\n');
    similarities.slice(0, 3).forEach((item, idx) => {
      console.log(`${idx + 1}. [${(item.similarity * 100).toFixed(2)}%] ${item.text}`);
    });

    console.log('\n✅ Embeddings test complete!');
    console.log('🎯 Check your dashboard for traces!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
  }
}

testEmbeddings();

