// Inverted index implementation for the search engine
// Stores term -> document mappings for efficient search

class InvertedIndex {
  constructor() {
    this.index = {};  // term -> { documents: Set, frequencies: Map }
    this.documentLengths = {};  // documentId -> length (for cosine similarity)
    this.termStats = {}; // term -> { df: document frequency }
    this.idfCache = {}; // term -> idf value (computed on demand)
  }

  /**
   * Add a document to the index
   */
  addDocument(documentId, tokens) {
    if (!documentId || !tokens || tokens.length === 0) {
      return;
    }

    // Calculate document length (Euclidean length of TF vector)
    const documentLength = Math.sqrt(tokens.length);
    this.documentLengths[documentId] = documentLength;

    // Process tokens and update index
    tokens.forEach((token, position) => {
      if (!this.index[token]) {
        this.index[token] = {
          documents: new Set(),
          positions: new Map(),
          frequencies: new Map()
        };
        this.termStats[token] = {
          df: 0
        };
      }

      const termInfo = this.index[token];
      termInfo.documents.add(documentId);

      // Track positions for phrase search
      if (!termInfo.positions.has(documentId)) {
        termInfo.positions.set(documentId, []);
      }
      termInfo.positions.get(documentId).push(position);

      // Track frequency for TF calculation
      const currentFreq = termInfo.frequencies.get(documentId) || 0;
      termInfo.frequencies.set(documentId, currentFreq + 1);

      // Update document frequency
      this.termStats[token].df++;
    });
  }

  /**
   * Remove a document from the index
   */
  removeDocument(documentId) {
    if (!documentId) return;

    Object.keys(this.index).forEach(term => {
      const termInfo = this.index[term];

      if (termInfo.documents.has(documentId)) {
        termInfo.documents.delete(documentId);

        // Remove positions for this document
        if (termInfo.positions.has(documentId)) {
          termInfo.positions.delete(documentId);
        }

        // Remove frequency for this document
        termInfo.frequencies.delete(documentId);

        // Remove term from stats if no documents contain it
        if (termInfo.documents.size === 0) {
          delete this.index[term];
          delete this.termStats[term];
          delete this.idfCache[term];
        } else {
          // Decrement document frequency
          this.termStats[term].df--;
        }
      }
    });

    // Remove document length
    delete this.documentLengths[documentId];
  }

  /**
   * Get document frequency for a term
   */
  getDocumentFrequency(term) {
    return this.termStats[term]?.df || 0;
  }

  /**
   * Get inverse document frequency for a term
   */
  getIdf(term) {
    if (!this.idfCache[term]) {
      const N = this.getTotalDocuments();
      const df = this.getDocumentFrequency(term);
      this.idfCache[term] = Math.log(N / (df || 1)) + 1;
    }
    return this.idfCache[term];
  }

  /**
   * Get total number of documents in the collection
   */
  getTotalDocuments() {
    return Object.keys(this.documentLengths).length;
  }

  /**
   * Search for a term in the index
   */
  search(term) {
    const termInfo = this.index[term];
    if (!termInfo) {
      return [];
    }

    const results = [];
    const idf = this.getIdf(term);

    termInfo.documents.forEach(documentId => {
      const tf = termInfo.frequencies.get(documentId) || 0;
      const tfidf = tf * idf;
      const docLength = this.documentLengths[documentId] || 1;

      // Normalize TF-IDF score
      const score = tfidf / docLength;

      results.push({
        documentId,
        score,
        frequency: tf
      });
    });

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Search for multiple terms (AND logic - documents containing all terms)
   */
  searchMultiple(terms) {
    if (terms.length === 0) return [];

    // Get results for each term
    const termResults = terms.map(term => this.search(term));

    // Intersect results (documents containing all terms)
    return this.intersectResults(termResults);
  }

  /**
   * Intersect multiple result sets
   */
  intersectResults(resultSets) {
    if (resultSets.length === 0) return [];

    // Start with the first result set
    const intersection = new Map();
    const firstSet = resultSets[0];

    firstSet.forEach(result => {
      intersection.set(result.documentId, result.score);
    });

    // Intersect with each subsequent result set
    for (let i = 1; i < resultSets.length; i++) {
      const currentSet = resultSets[i];
      const newIntersection = new Map();

      currentSet.forEach(result => {
        if (intersection.has(result.documentId)) {
          // Combine scores (e.g., sum, average, or max)
          const combinedScore = intersection.get(result.documentId) + result.score;
          newIntersection.set(result.documentId, combinedScore);
        }
      });

      intersection.clear();
      intersection.set(newIntersection);
    }

    // Convert to array and sort by score
    const results = Array.from(intersection.values()).map((score, documentId) => ({
      documentId,
      score,
      // Note: we don't have exact frequency info for multiple terms
    }));

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Get posting list for a term (term -> { documents, positions })
   */
  getPostingList(term) {
    return this.index[term] || null;
  }

  /**
   * Get all terms in the index
   */
  getTerms() {
    return Object.keys(this.index);
  }

  /**
   * Get document count for a term
   */
  getDocumentCount(term) {
    return this.termStats[term]?.df || 0;
  }

  /**
   * Clear the entire index
   */
  clear() {
    this.index = {};
    this.documentLengths = {};
    this.termStats = {};
    this.idfCache = {};
  }

  /**
   * Export index to JSON (for persistence)
   */
  export() {
    return {
      index: this.index,
      documentLengths: this.documentLengths,
      termStats: this.termStats
    };
  }

  /**
   * Import index from JSON (for persistence)
   */
  import(data) {
    this.index = data.index || {};
    this.documentLengths = data.documentLengths || {};
    this.termStats = data.termStats || {};

    // Recompute IDF cache
    this.idfCache = {};
    Object.keys(this.index).forEach(term => {
      this.getIdf(term); // Compute and cache IDF
    });
  }

  /**
   * Get index statistics
   */
  getStats() {
    const terms = Object.keys(this.index).length;
    const documents = this.getTotalDocuments();
    const avgDocumentLength = documents > 0
      ? Object.values(this.documentLengths).reduce((a, b) => a + b, 0) / documents
      : 0;

    return {
      terms,
      documents,
      avgDocumentLength,
      uniqueTerms: terms
    };
  }
}

module.exports = InvertedIndex;