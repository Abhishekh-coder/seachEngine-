// Indexer module: Orchestrates tokenization and inverted index
// Handles document ingestion, indexing, and persistence

const Tokenizer = require('./tokenizer');
const InvertedIndex = require('./inverted-index');
const fs = require('fs').promises;
const path = require('path');

class Indexer {
  constructor(options = {}) {
    this.tokenizer = new Tokenizer();
    this.index = new InvertedIndex();
    this.documents = {};  // documentId -> document metadata
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data');
    this.indexFile = path.join(this.dataDir, 'index.json');
    this.documentsFile = path.join(this.dataDir, 'documents.json');
  }

  /**
   * Initialize the indexer (load existing data if available)
   */
  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });

      // Load existing index
      try {
        const indexData = await fs.readFile(this.indexFile, 'utf8');
        this.index.import(JSON.parse(indexData));
        console.log(`Loaded existing index with ${this.index.getTotalDocuments()} documents`);
      } catch (error) {
        console.log('No existing index found, starting fresh');
      }

      // Load existing documents
      try {
        const documentsData = await fs.readFile(this.documentsFile, 'utf8');
        this.documents = JSON.parse(documentsData);
        console.log(`Loaded ${Object.keys(this.documents).length} document records`);
      } catch (error) {
        console.log('No existing documents found');
      }
    } catch (error) {
      console.error('Failed to initialize indexer:', error.message);
      throw error;
    }
  }

  /**
   * Index a single document
   */
  async indexDocument(document) {
    const documentId = document.url;
    const documentContent = this.getDocumentText(document);

    // Tokenize and process text
    const tokens = this.tokenizer.process(documentContent);

    // Add to index
    this.index.addDocument(documentId, tokens);

    // Store document metadata
    this.documents[documentId] = {
      url: document.url,
      title: document.title || '',
      description: document.description || '',
      crawlTime: document.crawlTime,
      contentLength: documentContent.length,
      tokenCount: tokens.length
    };
  }

  /**
   * Index multiple documents in batch
   */
  async indexBatch(documents) {
    console.log(`Indexing ${documents.length} documents...`);

    for (const document of documents) {
      await this.indexDocument(document);
    }

    console.log(`Indexing complete. Total documents: ${Object.keys(this.documents).length}`);
  }

  /**
   * Extract searchable text from a document
   */
  getDocumentText(document) {
    const parts = [
      document.title || '',
      document.description || '',
      document.textContent || ''
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * Get document metadata by ID
   */
  getDocument(documentId) {
    return this.documents[documentId] || null;
  }

  /**
   * Save index and documents to disk
   */
  async save() {
    const stats = this.index.getStats();
    console.log(`Saving index...`);

    try {
      await fs.writeFile(this.indexFile, JSON.stringify(this.index.export()));
      await fs.writeFile(this.documentsFile, JSON.stringify(this.documents));

      console.log(`Index saved:
        - Documents: ${stats.documents}
        - Unique terms: ${stats.terms}
        - Index file: ${this.indexFile}
        - Documents file: ${this.documentsFile}`);
    } catch (error) {
      console.error('Failed to save index:', error.message);
      throw error;
    }
  }

  /**
   * Load index from disk
   */
  async load() {
    await this.initialize();
  }

  /**
   * Delete a document from the index
   */
  async deleteDocument(documentId) {
    this.index.removeDocument(documentId);
    delete this.documents[documentId];
    await this.save();
  }

  /**
   * Clear all indexed data
   */
  async clear() {
    this.index.clear();
    this.documents = {};
    await this.save();
  }

  /**
   * Get indexer statistics
   */
  getStats() {
    return {
      ...this.index.getStats(),
      documents: Object.keys(this.documents).length
    };
  }
}

module.exports = Indexer;