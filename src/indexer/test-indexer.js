// Test indexer script
// This will test indexing functionality

const Indexer = require('./indexer');

async function testIndexer() {
  console.log('Testing Indexer...');

  const indexer = new Indexer();

  // Test documents
  const documents = [
    {
      url: 'https://example.com/page1',
      title: 'Example Page 1',
      description: 'This is an example page for testing',
      textContent: 'This page contains example content for testing the search engine'
    },
    {
      url: 'https://example.com/page2',
      title: 'Example Page 2',
      description: 'Another example page for search engine testing',
      textContent: 'Search engines use inverted indexes to efficiently find documents'
    },
    {
      url: 'https://example.com/page3',
      title: 'Testing Search',
      description: 'Testing search functionality with multiple documents',
      textContent: 'The quick brown fox jumps over the lazy dog'
    }
  ];

  console.log('Indexing', documents.length, 'documents...');

  await indexer.initialize();
  await indexer.indexBatch(documents);

  // Search for something
  console.log('\nSearching for "example"...');
  const results = indexer.index.searchMultiple(['example']);
  console.log('Results:', results);

  // Save index
  await indexer.save();

  console.log('\nTest complete!');
  console.log('Stats:', indexer.getStats());
}

testIndexer().catch(console.error);