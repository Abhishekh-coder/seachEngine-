// Frontend JavaScript for the search engine web interface

class SearchApp {
  constructor() {
    this.searchForm = document.getElementById('searchForm');
    this.searchInput = document.getElementById('searchInput');
    this.suggestions = document.getElementById('suggestions');
    this.resultsPanel = document.getElementById('results');

    this.debounceTimer = null;
    this.currentQuery = '';

    this.init();
  }

  init() {
    // Form submit handler
    this.searchForm.addEventListener('submit', (e) => this.handleSubmit(e));

    // Input handler for suggestions
    this.searchInput.addEventListener('input', (e) => this.handleInput(e));

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.searchForm.contains(e.target)) {
        this.hideSuggestions();
      }
    });

    // Keyboard navigation for suggestions
    this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  async handleSubmit(event) {
    event.preventDefault();

    const query = this.searchInput.value.trim();
    if (!query) return;

    this.currentQuery = query;
    this.hideSuggestions();
    await this.performSearch(query);
  }

  async handleInput(event) {
    const value = event.target.value.trim();

    // Clear previous debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (value.length < 2) {
      this.hideSuggestions();
      return;
    }

    // Debounce suggestion requests
    this.debounceTimer = setTimeout(() => {
      this.fetchSuggestions(value);
    }, 300);
  }

  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.hideSuggestions();
      this.searchInput.blur();
    }

    // Arrow key navigation could be added here
  }

  async fetchSuggestions(query) {
    try {
      const response = await fetch(`/suggestions?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();

      if (data.success && data.suggestions.length > 0) {
        this.showSuggestions(data.suggestions);
      } else {
        this.hideSuggestions();
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      this.hideSuggestions();
    }
  }

  showSuggestions(suggestions) {
    this.suggestions.innerHTML = suggestions.map(s => `
      <div class="suggestion-item" data-value="${s.term}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 8px;">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        ${this.highlightQuery(s.term, this.searchInput.value)}
      </div>
    `).join('');

    // Add click handlers
    this.suggestions.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        this.searchInput.value = item.dataset.value;
        this.hideSuggestions();
        this.performSearch(item.dataset.value);
      });
    });

    this.suggestions.style.display = 'block';
  }

  hideSuggestions() {
    this.suggestions.style.display = 'none';
  }

  highlightQuery(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  async performSearch(query) {
    this.showLoading();

    try {
      const response = await fetch(`/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();

      if (data.success) {
        this.displayResults(data);
      } else {
        this.showError(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Failed to connect to search engine. Please try again.');
    }
  }

  showLoading() {
    this.resultsPanel.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Searching...</p>
      </div>
    `;
    this.resultsPanel.style.display = 'block';
  }

  displayResults(data) {
    const { results, totalResults, query } = data;

    if (!results || results.length === 0) {
      this.resultsPanel.innerHTML = `
        <div class="empty-state">
          <h2>No results found</h2>
          <p>No pages matched your search for "${query}". Try different keywords.</p>
        </div>
      `;
      return;
    }

    const resultsHtml = results.map(result => `
      <div class="result-item">
        <h3 class="result-title">
          <a href="${result.url}" target="_blank">${result.title}</a>
        </h3>
        <div class="result-url">${result.url}</div>
        <div class="result-snippet">${result.snippet}</div>
        ${result.score ? `<div class="result-score">Score: ${result.score}</div>` : ''}
      </div>
    `).join('');

    this.resultsPanel.innerHTML = `
      <div class="results-header">
        <p>Found <strong>${totalResults}</strong> results for "${query}"</p>
      </div>
      ${resultsHtml}
    `;
  }

  showError(message) {
    this.resultsPanel.innerHTML = `
      <div class="error-state">
        <h3>⚠️ Error</h3>
        <p>${message}</p>
      </div>
    `;
    this.resultsPanel.style.display = 'block';
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.searchApp = new SearchApp();
  console.log('Search app initialized');
});