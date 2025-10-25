const fs = require('fs');
const path = require('path');
const BaseProvider = require('./BaseProvider');
const SailingHTMLParser = require('../utils/SailingHTMLParser');

/**
 * Static HTML provider for fetching sailing data from local files
 * Useful for testing and development
 */
class StaticHTMLProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.htmlFilePath = config.htmlFilePath || path.join(__dirname, '../data/sailor-website-export.html');
  }

  /**
   * Reads HTML content from static file
   * @returns {Promise<string>} HTML content
   */
  async readHTMLFile() {
    try {
      console.log(`Reading HTML from file: ${this.htmlFilePath}`);
      const html = fs.readFileSync(this.htmlFilePath, 'utf8');
      console.log(`Static HTML file read successfully, length: ${html.length}`);
      return html;
    } catch (error) {
      console.error('Error reading static HTML file:', error.message);
      throw new Error(`Failed to read HTML file: ${error.message}`);
    }
  }

  /**
   * Main method to fetch and parse sailing events from static HTML
   * @returns {Promise<Array<Object>>} Array of structured sailing event objects
   */
  async getSailingEvents() {
    try {
      const html = await this.readHTMLFile();
      
      if (!SailingHTMLParser.validateSailingContent(html)) {
        console.log('No sailing content found in static HTML file');
        return [];
      }
      
      const events = SailingHTMLParser.parseSailingEvents(html);
      console.log(`Successfully parsed ${events.length} sailing events from static HTML`);
      
      return events;
      
    } catch (error) {
      console.error('StaticHTMLProvider error:', error.message);
      throw error;
    }
  }

  /**
   * Gets the provider name for logging/debugging
   * @returns {string} Provider name
   */
  getProviderName() {
    return 'StaticHTML';
  }
}

module.exports = StaticHTMLProvider;
