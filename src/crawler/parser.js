// HTML parser module for extracting structured data from web pages

const cheerio = require('cheerio');

class HTMLParser {
  constructor(html, baseUrl) {
    this.html = html;
    this.baseUrl = baseUrl;
    this.$ = cheerio.load(html);
  }

  /**
   * Extract the page title
   */
  getTitle() {
    return this.$('title').text().trim() ||
           this.$('meta[property="og:title"]').attr('content') ||
           this.$('h1').first().text().trim() ||
           '';
  }

  /**
   * Extract meta description
   */
  getDescription() {
    return this.$('meta[name="description"]').attr('content') ||
           this.$('meta[property="og:description"]').attr('content') ||
           '';
  }

  /**
   * Extract all headings from the page
   */
  getHeadings() {
    const headings = [];
    this.$('h1, h2, h3, h4, h5, h6').each((i, el) => {
      const heading = this.$(el).text().trim();
      if (heading) {
        headings.push({
          level: parseInt(el.tagName[1]),
          text: heading
        });
      }
    });
    return headings;
  }

  /**
   * Extract all links from the page
   */
  getLinks() {
    const links = [];
    this.$('a[href]').each((i, el) => {
      const href = this.$(el).attr('href');
      const text = this.$(el).text().trim();
      if (href && text) {
        links.push({
          href,
          text
        });
      }
    });
    return links;
  }

  /**
   * Extract the main text content (removes scripts, styles, etc.)
   */
  getTextContent() {
    const clone = this.$.clone();

    // Remove unwanted elements
    clone.find('script, style, nav, footer, header, aside, .ad, .ads').remove();

    // Get text content
    let text = clone.text();

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Extract structured data (meta tags, Open Graph, etc.)
   */
  getMetadata() {
    const meta = {};

    // Standard meta tags
    this.$('meta').each((i, el) => {
      const name = this.$(el).attr('name') || this.$(el).attr('property');
      const content = this.$(el).attr('content');
      if (name && content) {
        meta[name] = content;
      }
    });

    return meta;
  }

  /**
   * Extract keywords
   */
  getKeywords() {
    const keywords = this.$('meta[name="keywords"]').attr('content');
    return keywords ? keywords.split(',').map(k => k.trim()) : [];
  }

  /**
   * Extract canonical URL
   */
  getCanonicalUrl() {
    return this.$('link[rel="canonical"]').attr('href') || this.baseUrl;
  }
}

module.exports = HTMLParser;