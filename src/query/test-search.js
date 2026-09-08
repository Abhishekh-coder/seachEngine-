// Test search script
// This will test the complete search pipeline

const Indexer = require('../indexer/indexer');
const Searcher = require('./searcher');

async function testSearch() {
  console.log('Testing Search Engine...');
  console.log('='.repeat(50));

  // Initialize indexer with test data
  const indexer = new Indexer();
  await indexer.initialize();

  // Create test documents
  const documents = [
    {
      url: 'https://example.com/nodejs',
      title: 'Node.js Official Website',
      description: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine',
      textContent: 'Node.js is an open-source, cross-platform JavaScript runtime environment that runs on the V8 engine'
    },
    {
      url: 'https://example.com/search',
      title: 'Search Engine Tutorial',
      description: 'Learn how to build a search engine from scratch',
      textContent: 'This tutorial teaches you how to build a search engine with crawling, indexing, and ranking'
    },
    {
      url: 'https://example.com/web',
      title: 'Web Development',
      description: 'Everything about web development',
      textContent: 'Web development encompasses many skills including HTML, CSS, JavaScript and server-side programming'
    }
  ];

  console.log('\nIndexing documents...');
  await indexer.indexBatch(documents);

  const searcher = new Searcher(indexer);
  searcher.ranker.setIndexer(indexer);

  // Test queries
  const queries = ['node', 'search', 'web', 'javascript'];

  for (const query of queries) {
    console.log(`\nQuery: "${query}"`);
    console.log('-'.repeat(30));

    const results = searcher.search(query, { limit: 5 });

    console.log(`Total results: ${results.total}`);
    results.results.forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.title} (Score: ${result.score})`);
      console.log(`   URL: ${result.url}`);
    });
  }

  // Test suggestions
  console.log('\n\nTesting Suggestions...');
  console.log('-'.repeat(30));

  const suggestions = searcher.getSuggestions('sea', 5);
  console.log('Suggestions for "sea":', suggestions);

  console.log('\n✅ Test complete!');
}

testSearch().catch(console.error);