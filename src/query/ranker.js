// Ranker module: Implements various ranking algorithms
// Uses TF-IDF, BM25, and other scoring methods

const natural = require('natural');

class Ranker {
  constructor(options = {}) {
    this.options = {
      useBM25: options.useBM25 || true,
      k1: options.k1 || 1.5, // BM25 parameter
      b: options.b || 0.75,   // BM25 parameter
      ...options
    };
  }

  /**
   * Rank search results using BM25 or TF-IDF
   */
  rank(results, query, queryTokens) {
    if (results.length === 0) return results;

    const docLengths = this.getDocumentLengths();
    const avgDocLength = this.getAverageDocumentLength(docLengths);
    const totalDocs = Object.keys(docLengths).length;

    // Calculate scores for each result
    const rankedResults = results.map(result => {
      let score = result.score;

      if (this.options.useBM25) {
        score = this.calculateBM25(
          result,
          queryTokens,
          docLengths[result.url],
          avgDocLength,
          totalDocs
        );
      }

      // Generate snippet
      const snippet = this.generateSnippet(result, queryTokens);

      return {
        ...result,
        score: Math.round(score * 1000) / 1000, // Round to 3 decimal places
        snippet: snippet,
        // Add ranking metadata
        ranking: {
          algorithm: this.options.useBM25 ? 'BM25' : 'TF-IDF',
          score: result.score,
          bm25: this.options.useBM25 ? score : null
        }
      };
    });

    // Sort by score (descending)
    rankedResults.sort((a, b) => b.score - a.score);

    return rankedResults;
  }

  /**
   * Calculate BM25 score for a document
   * BM25 = sum over terms of: idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * (dl / avgdl)))
   */
  calculateBM25(result, queryTokens, docLength, avgDocLength, totalDocs) {
    if (!docLength || avgDocLength === 0) return result.score;

    const k1 = this.options.k1;
    const b = this.options.b;

    let score = 0;

    // Get term frequencies from the indexer
    const indexer = this.indexer || null;

    for (const token of queryTokens) {
      const tf = this.getTermFrequency(token, result.url);
      const idf = this.getInverseDocumentFrequency(token, totalDocs);

      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));

      score += idf * (numerator / denominator);
    }

    return score;
  }

  /**
   * Calculate TF-IDF score (simplified version)
   */
  calculateTFIDF(result, queryTokens) {
    let score = result.score; // Start with the index score

    // Boost score based on query term positions in document
    const titleBoost = this.calculateTitleBoost(result, queryTokens);
    const descriptionBoost = this.calculateDescriptionBoost(result, queryTokens);

    score *= (1 + titleBoost + descriptionBoost);

    return score;
  }

  /**
   * Calculate boost for terms appearing in title
   */
  calculateTitleBoost(result, queryTokens) {
    const title = (result.title || '').toLowerCase();
    let boost = 0;

    for (const token of queryTokens) {
      if (title.includes(token)) {
        boost += 0.5; // 50% boost for title match
      }
    }

    return boost;
  }

  /**
   * Calculate boost for terms appearing in description
   */
  calculateDescriptionBoost(result, queryTokens) {
    const description = (result.description || '').toLowerCase();
    let boost = 0;

    for (const token of queryTokens) {
      if (description.includes(token)) {
        boost += 0.2; // 20% boost for description match
      }
    }

    return boost;
  }

  /**
   * Generate a search snippet from the document content
   */
  generateSnippet(result, queryTokens, snippetLength = 200) {
    const content = result.description || result.title || '';

    if (!content) return '';

    // Find the first occurrence of any query term
    let bestPosition = -1;
    let bestScore = Infinity;

    for (const token of queryTokens) {
      const position = content.toLowerCase().indexOf(token);
      if (position !== -1 && position < bestScore) {
        bestScore = position;
        bestPosition = position;
      }
    }

    if (bestPosition === -1) {
      // No query terms found, return beginning of content
      return content.length > snippetLength
        ? content.substring(0, snippetLength) + '...'
        : content;
    }

    // Extract snippet around the best position
    const start = Math.max(0, bestPosition - snippetLength / 2);
    const end = Math.min(content.length, start + snippetLength);

    let snippet = content.substring(start, end);

    // Add ellipsis if truncated
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Get document length for a document ID
   */
  getDocumentLengths() {
    // This will be provided by the indexer
    return this.indexer?.index?.documentLengths || {};
  }

  /**
   * Get average document length
   */
  getAverageDocumentLength(docLengths) {
    const lengths = Object.values(docLengths);
    if (lengths.length === 0) return 0;

    return lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  }

  /**
   * Get term frequency in a document
   */
  getTermFrequency(term, documentId) {
    const termInfo = this.indexer?.index?.index?.[term];
    if (!termInfo) return 0;

    return termInfo.frequencies.get(documentId) || 0;
  }

  /**
   * Get inverse document frequency
   */
  getInverseDocumentFrequency(term, totalDocs) {
    const df = this.indexer?.index?.getDocumentFrequency(term) || 0;
    if (df === 0) return 0;

    return Math.log(totalDocs / df) + 1;
  }

  /**
   * Set the indexer reference (needed for BM25 calculations)
   */
  setIndexer(indexer) {
    this.indexer = indexer;
  }
}

module.exports = Ranker;