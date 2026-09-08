# 🔍 Web Search Engine

A full-stack web search engine built with **Node.js**, **Express**, and **Vanilla HTML/CSS/JS**. Featuring an automated web crawler, an inverted-index text processing engine with BM25 ranking, and an interactive real-time web UI.

---

## 🚀 Features

- **🕸️ Web Crawler**:
  - Breadth-First Search (BFS) page crawler with configurable max depth and page limits.
  - HTML parsing and sanitization via `cheerio`.
  - Automatic extraction of titles, descriptions, headings, links, and body text.

- **⚡ Inverted Index & Tokenizer**:
  - Full NLP pipeline: tokenization, English stop-word removal, and Porter stemming (`natural`).
  - Inverted index storing document frequencies, term frequencies, and positional indices for phrase search.
  - TF-IDF and BM25 relevance calculation.

- **🎯 Query Engine & Ranking**:
  - BM25 ranking algorithm with document length normalization.
  - Field boosts for keyword matches in titles (+50%) and descriptions (+20%).
  - Positional phrase search for exact word matches.
  - Live query autocomplete / term suggestions.
  - Contextual snippet generation with query term highlighting.

- **🌐 REST API & Web UI**:
  - Clean, responsive search interface with real-time suggestion dropdown.
  - Complete REST API (`/search`, `/crawl`, `/suggestions`, `/status`, `/docs`).

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express 5
- **NLP & Indexing**: Natural (Porter Stemmer), Cheerio, Axios
- **Frontend**: Vanilla JavaScript, HTML5, CSS3

---

## 🚦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Search Engine
```bash
node index.js
```

### 3. Open in Browser
- **Web Search UI**: [http://localhost:3000](http://localhost:3000)
- **API Documentation**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **Search Endpoint**: `http://localhost:3000/search?q=your+query`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/search?q={query}` | Search indexed pages (supports `&limit=`, `&phrase=true`) |
| `POST` | `/crawl` | Crawl and index pages from seed URLs |
| `GET` | `/suggestions?q={prefix}` | Autocomplete search suggestions |
| `GET` | `/status` | Status of crawler and indexed documents |
| `GET` | `/docs` | Interactive HTML documentation |

---

## 📄 License
ISC
