// Results formatting module
// Handles formatting of search results for display

class ResultsFormatter {
  constructor(options = {}) {
    this.options = {
      snippetLength: options.snippetLength || 200,
      maxTitleLength: options.maxTitleLength || 70,
      maxDescriptionLength: options.maxDescriptionLength || 160,
      ...options
    };
  }

  /**
   * Format a single result
   */
  format(result) {
    return {
      title: this.formatTitle(result.title),
      url: result.url,
      snippet: this.formatSnippet(result.snippet || result.description),
      score: result.score ? this.formatScore(result.score) : null,
      metadata: result.metadata ? this.formatMetadata(result.metadata) : null
    };
  }

  /**
   * Format result title
   */
  formatTitle(title) {
    if (!title) return 'Untitled';

    if (title.length > this.options.maxTitleLength) {
      return title.substring(0, this.options.maxTitleLength) + '...';
    }

    return title;
  }

  /**
   * Format result snippet
   */
  formatSnippet(snippet) {
    if (!snippet) return '';

    if (snippet.length > this.options.snippetLength) {
      return snippet.substring(0, this.options.snippetLength) + '...';
    }

    return snippet;
  }

  /**
   * Format score to readable string
   */
  formatScore(score) {
    if (score === undefined || score === null) return null;
    return Math.round(score * 100) / 100;
  }

  /**
   * Format metadata for display
   */
  formatMetadata(metadata) {
    return {
      crawlTime: metadata?.crawlTime ? this.formatDate(metadata.crawlTime) : null,
      contentType: metadata?.contentType || null
    };
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Format results for display as HTML
   */
  formatAsHTML(results, query = '') {
    const html = results.map(result => {
      const title = this.formatTitle(result.title);
      const snippet = this.formatSnippet(result.snippet);

      return `
        <div class="result-item">
          <h3 class="result-title">
            <a href="${result.url}" target="_blank">${title}</a>
          </h3>
          <div class="result-url">${result.url}</div>
          <div class="result-snippet">${snippet}</div>
          ${result.score ? `<div class="result-score">Score: ${result.score}</div>` : ''}
        </div>
      `;
    }).join('\n');

    return `
      <div class="search-results">
        <div class="results-header">
          <p>Found ${results.length} results for "${query}"</p>
        </div>
        ${html}
      </div>
    `;
  }

  /**
   * Format results for JSON API response
   */
  formatJSON(results, query = '') {
    // Ensure results is always an array
    const resultArray = Array.isArray(results) ? results : [results];
    return {
      query: query,
      totalResults: resultArray.length,
      results: resultArray.map(result => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        score: result.score
      }))
    };
  }

  /**
   * Add highlighting to results
   */
  highlight(text, queryTokens) {
    if (!text || !queryTokens || queryTokens.length === 0) {
      return text;
    }

    let highlighted = text;

    for (const token of queryTokens) {
      const regex = new RegExp(`(${token})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    }

    return highlighted;
  }

  /**
   * Create autocomplete suggestions
   */
  createSuggestions(suggestions) {
    return suggestions.map(suggestion => ({
      term: suggestion,
      label: suggestion,
      value: suggestion
    }));
  }
}

module.exports = ResultsFormatter;