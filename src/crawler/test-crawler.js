// Test crawler script
// This will crawl seed URLs and populate the index

const SearchEngineAPI = require('./api/server');

async function testCrawl() {
  console.log('Starting test crawl...');

  // Seed URLs for testing
  const seedUrls = [
    'https://example.com',
    'https://www.wikipedia.org',
    'https://www.google.com',
    'https://news.ycombinator.com',
    'https://github.com'
  ];

  console.log('Seed URLs:', seedUrls);

  // Start the crawl
  await SearchEngineAPI.crawl(seedUrls);

  console.log('Test crawl completed!');
}

// Run the test
testCrawl().catch(console.error);