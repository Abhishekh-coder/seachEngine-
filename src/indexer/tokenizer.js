// Tokenizer module for text processing
// Handles tokenization, stemming, and stop word removal

const natural = require('natural');

class Tokenizer {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.stopWords = this.getStopWords();
  }

  /**
   * Default English stop words
   */
  getStopWords() {
    return new Set([
      'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
      'any', 'are', "aren't", 'as', 'at', 'be', 'because', 'been', 'before', 'being',
      'below', 'between', 'both', 'but', 'by', "can't", 'cannot', 'could', "couldn't",
      'did', "didn't", 'do', 'does', "doesn't", 'doing', "don't", 'down', 'during',
      'each', 'few', 'for', 'from', 'further', 'had', "hadn't", 'has', "hasn't",
      'have', "haven't", 'having', 'he', "he'd", "he'll", "he's", 'her', 'here',
      "here's", 'hers', 'herself', 'him', 'himself', 'his', 'how', "how's", 'i',
      "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is', "isn't", 'it', "it's",
      'its', 'itself', "let's", 'me', 'more', 'most', "mustn't", 'my', 'myself',
      'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought',
      'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', "shan't", 'she',
      "she'd", "she'll", "she's", 'should', "shouldn't", 'so', 'some', 'such',
      'than', 'that', "that's", 'the', 'their', 'theirs', 'them', 'themselves',
      'then', 'there', "there's", 'these', 'they', "they'd", "they'll", "they're",
      "they've", 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
      'very', 'was', "wasn't", 'we', "we'd", "we'll", "we're", "we've", 'were',
      "weren't", 'what', "what's", 'when', "when's", 'where', "where's", 'which',
      'while', 'who', "who's", 'whom', 'why', "why's", 'with', "won't", 'would',
      "wouldn't", 'you', "you'd", "you'll", "you're", "you've", 'your', 'yours',
      'yourself', 'yourselves'
    ]);
  }

  /**
   * Tokenize text into words
   */
  tokenize(text) {
    if (!text) return [];

    // Convert to lowercase and split on non-alphanumeric characters
    return text.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
  }

  /**
   * Remove stop words from tokens
   */
  removeStopWords(tokens) {
    return tokens.filter(token => !this.stopWords.has(token));
  }

  /**
   * Apply stemming to tokens
   */
  stem(tokens) {
    return tokens.map(token => this.stemmer.stem(token));
  }

  /**
   * Full pipeline: tokenize, remove stop words, and stem
   */
  process(text) {
    const tokens = this.tokenize(text);
    const withoutStopWords = this.removeStopWords(tokens);
    const stemmed = this.stem(withoutStopWords);
    return stemmed;
  }

  /**
   * Process text and return with positions (for phrase search)
   */
  processWithPositions(text) {
    const tokens = this.tokenize(text);
    const result = [];

    tokens.forEach((token, position) => {
      if (!this.stopWords.has(token)) {
        const stemmed = this.stemmer.stem(token);
        result.push({
          token: stemmed,
          original: token,
          position
        });
      }
    });

    return result;
  }
}

module.exports = Tokenizer;