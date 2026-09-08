// Web crawler module for search engine
// Handles fetching pages and managing the URL queue

const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

class WebCrawler {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 2;
    this.maxPages = options.maxPages || 100;
    this.userAgent = options.userAgent || 'WebSearchEngine/1.0';
    this.visitedUrls = new Set();
    this.urlQueue = [];
    this.crawledCount = 0;
    this.indexedCount = 0;
    this.indexer = null; // Will be set by the server
  }

  setIndexer(indexer) {
    this.indexer = indexer;
  }

  async startCrawl(seedUrls = []) {
    console.log('Starting web crawl...');
    console.log(`Max depth: ${this.maxDepth}, Max pages: ${this.maxPages}`);

    // Add seed URLs to queue
    seedUrls.forEach(url => {
      this.urlQueue.push({ url, depth: 0 });
    });

    // Process queue
    while (this.urlQueue.length > 0 && this.crawledCount < this.maxPages) {
      const { url, depth } = this.urlQueue.shift();

      if (this.visitedUrls.has(url)) {
        continue;
      }

      try {
        await this.processUrl(url, depth);
        this.crawledCount++;
      } catch (error) {
        console.error(`Error crawling ${url}:`, error.message);
      }
    }

    console.log(`\nCrawl completed. Crawled: ${this.crawledCount} pages, Indexed: ${this.indexedCount} pages`);
  }

  async processUrl(url, depth) {
    console.log(`[${this.crawledCount}/${this.maxPages}] Crawling: ${url}`);

    // Mark as visited
    this.visitedUrls.add(url);

    // Fetch page content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': this.userAgent
      },
      timeout: 10000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract metadata
    const title = $('title').text() || '';
    const description = $('meta[name="description"]').attr('content') || '';

    // Extract all links
    const links = this.extractLinks($, url);

    // Extract text content for indexing
    const textContent = this.extractText($);

    // Save extracted data
    const document = {
      url,
      title,
      description,
      links,
      textContent,
      crawlTime: new Date().toISOString(),
      depth
    };

    // Store document (to be indexed by indexer)
    await this.storeDocument(document);

    // Add new links to queue if within depth limit
    if (depth < this.maxDepth) {
      links.forEach(link => {
        if (!this.visitedUrls.has(link) && this.isValidUrl(link)) {
          this.urlQueue.push({ url: link, depth: depth + 1 });
        }
      });
    }
  }

  extractLinks($, baseUrl) {
    const links = [];
    const baseUrlObj = new URL(baseUrl);

    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      if (href) {
        const absoluteUrl = this.resolveUrl(href, baseUrl);
        links.push(absoluteUrl);
      }
    });

    return links.filter(link => this.isValidUrl(link));
  }

  extractText($) {
    // Remove script and style elements
    $('script, style').remove();

    // Get text content
    return $.text()
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
  }

  resolveUrl(path, baseUrl) {
    try {
      return new URL(path, baseUrl).href;
    } catch (error) {
      return null;
    }
  }

  isValidUrl(url) {
    try {
      const parsedUrl = new URL(url);
      // Only crawl http/https URLs
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  async storeDocument(document) {
    // Index the document if indexer is available
    if (this.indexer) {
      await this.indexer.indexDocument(document);
    }
    this.indexedCount++;
    console.log(`Indexed: ${this.indexedCount} - ${document.title || document.url}`);
  }

  getStats() {
    return {
      crawledCount: this.crawledCount,
      indexedCount: this.indexedCount,
      queueLength: this.urlQueue.length,
      visitedUrlsCount: this.visitedUrls.size
    };
  }
}

module.exports = WebCrawler;