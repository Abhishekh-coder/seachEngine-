// Search engine API server
// REST API endpoints for crawling and searching

const express = require('express');
const path = require('path');
const cors = require('cors');

const WebCrawler = require('../crawler/crawler');
const Indexer = require('../indexer/indexer');
const Searcher = require('../query/searcher');
const ResultsFormatter = require('../query/results');

class SearchEngineAPI {
  constructor(options = {}) {
    this.app = express();
    this.port = options.port || 3000;
    this.host = options.host || 'localhost';

    // Initialize components
    this.crawler = new WebCrawler();
    this.indexer = new Indexer();
    this.searcher = new Searcher(this.indexer);
    this.formatter = new ResultsFormatter();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupStaticFiles();
  }

  setupMiddleware() {
    // Enable CORS
    this.app.use(cors());

    // Parse JSON requests
    this.app.use(express.json({ limit: '10mb' }));

    // Parse URL-encoded requests
    this.app.use(express.urlencoded({ extended: true }));

    // Set up ETag for caching
    this.app.set('etag', true);
  }

  setupRoutes() {
    // Search endpoint
    this.app.get('/search', async (req, res) => {
      try {
        const { q, limit, offset, phrase } = req.query;
        const options = {
          limit: parseInt(limit) || 10,
          offset: parseInt(offset) || 0,
          includeMetadata: true
        };

        let results;

        if (phrase === 'true') {
          // Phrase search
          results = this.searcher.searchPhrase(q, options);
        } else {
          // Normal search
          results = this.searcher.search(q, options);
        }

        // Format results
        const formattedResults = this.formatter.format(results);

        res.json({
          success: true,
          query: q,
          results: formattedResults,
          totalResults: results.total,
          page: results.page,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({
          success: false,
          error: 'Search failed',
          message: error.message
        });
      }
    });

    // Start crawling endpoint
    this.app.post('/crawl', async (req, res) => {
      try {
        const { seedUrls } = req.body;

        if (!seedUrls || !Array.isArray(seedUrls)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid request',
            message: 'seedUrls array is required'
          });
        }

        // Set up indexer for crawler
        this.crawler.setIndexer(this.indexer);

        // Start indexing
        await this.indexer.initialize();

        // Process seed URLs
        const documents = []; // This would be populated by the crawler
        for (const url of seedUrls) {
          const document = await this.crawler.processUrl(url, 0);
          documents.push(document);
        }

        // Index documents
        await this.indexer.indexBatch(documents);

        // Save index
        await this.indexer.save();

        res.json({
          success: true,
          message: `Crawled ${documents.length} pages`,
          documentsIndexed: documents.length
        });
      } catch (error) {
        console.error('Crawl error:', error.message);
        res.status(500).json({
          success: false,
          error: 'Crawl failed',
          message: error.message
        });
      }
    });

    // Get crawl status endpoint
    this.app.get('/status', async (req, res) => {
      try {
        const stats = {
          crawler: this.crawler.getStats(),
          indexer: this.indexer.getStats(),
          timestamp: new Date().toISOString()
        };

        res.json({
          success: true,
          stats
        });
      } catch (error) {
        console.error('Status error:', error.message);
        res.status(500).json({
          success: false,
          error: 'Failed to get status',
          message: error.message
        });
      }
    });

    // Get search suggestions endpoint
    this.app.get('/suggestions', async (req, res) => {
      try {
        const { q, limit } = req.query;
        const suggestions = this.searcher.getSuggestions(q, parseInt(limit) || 5);

        res.json({
          success: true,
          query: q,
          suggestions: this.formatter.createSuggestions(suggestions)
        });
      } catch (error) {
        console.error('Suggestions error:', error.message);
        res.status(500).json({
          success: false,
          error: 'Failed to get suggestions',
          message: error.message
        });
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });

    // API documentation endpoint
    this.app.get('/api/docs', (req, res) => {
      res.json({
        endpoints: {
          '/search': {
            method: 'GET',
            description: 'Search for content',
            parameters: {
              q: 'Search query (required)',
              limit: 'Number of results (default: 10)',
              offset: 'Result offset for pagination (default: 0)',
              phrase: 'Enable phrase search (default: false)'
            },
            response: 'JSON object with search results'
          },
          '/crawl': {
            method: 'POST',
            description: 'Start crawling and indexing pages',
            body: 'JSON object with seedUrls array',
            response: 'JSON object with crawl status'
          },
          '/status': {
            method: 'GET',
            description: 'Get current status of crawler and indexer',
            response: 'JSON object with statistics'
          },
          '/suggestions': {
            method: 'GET',
            description: 'Get search suggestions',
            parameters: {
              q: 'Partial query for suggestions (required)',
              limit: 'Number of suggestions (default: 5)'
            },
            response: 'JSON object with suggestions'
          }
        }
      });
    });
  }

  setupStaticFiles() {
    // Serve static files from public directory
    this.app.use(express.static(path.join(__dirname, '../public')));

    // Serve API docs as HTML
    this.app.get('/docs', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Search Engine API Documentation</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            .endpoint { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .method { font-weight: bold; color: #007bff; }
            .code { background: #f4f4f4; padding: 5px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h1>Search Engine API</h1>
          <p><a href="/api/docs">JSON Documentation</a></p>
          <div class="endpoint">
            <h3><span class="method">GET</span> /search</h3>
            <p>Search for content in the indexed documents.</p>
            <p>Parameters: <code>?q=search+query</code></p>
          </div>
          <div class="endpoint">
            <h3><span class="method">POST</span> /crawl</h3>
            <p>Start crawling and indexing pages.</p>
            <p>Example: <code>curl -X POST -H "Content-Type: application/json" -d '{"seedUrls": ["https://example.com"]}' /crawl</code></p>
          </div>
          <div class="endpoint">
            <h3><span class="method">GET</span> /status</h3>
            <p>Get current status of crawler and indexer.</p>
          </div>
        </body>
        </html>
      `);
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Search Engine API server running at http://${this.host}:${this.port}`);
        console.log(`API documentation: http://${this.host}:${this.port}/docs`);
        resolve(this.server);
      }).on('error', (error) => {
        console.error('Failed to start server:', error.message);
        reject(error);
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = SearchEngineAPI;