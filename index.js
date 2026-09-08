// Main entry point for the search engine application
// Initializes components and starts the server

const SearchEngineAPI = require('./src/api/server');

const options = {
  port: 3000,
  host: 'localhost'
};

const api = new SearchEngineAPI(options);

api.start().then(() => {
  console.log('✅ Search Engine is running!');
  console.log('Visit: http://localhost:3000');
  console.log('Visit API docs: http://localhost:3000/docs');
  console.log('Try: http://localhost:3000/search?q=example');
}).catch(error => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});