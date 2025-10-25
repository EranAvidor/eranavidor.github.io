const axios = require('axios');
const BaseProvider = require('./BaseProvider');
const SailingHTMLParser = require('../utils/SailingHTMLParser');

/**
 * ScrapingBee provider for fetching sailing data
 * Handles all ScrapingBee API interactions and HTML parsing
 */
class ScrapingBeeProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || 'SOME_VALUE';
    this.scrapingBeeUrl = 'https://app.scrapingbee.com/api/v1/';
    this.targetUrl = 'https://sailor.co.il/הפלגותתלמידים';
  }

  /**
   * Fetches sailing data from ScrapingBee
   * @returns {Promise<string>} HTML content
   */
  async fetchSailingData() {
    console.log('Fetching sailing data with ScrapingBee...');
    
    const params = {
      api_key: this.apiKey,
      url: this.targetUrl,
      render_js: 'true', // Enable JavaScript rendering
      wait: '3000', // Wait 3 seconds for JS to load
      premium_proxy: 'true', // Use premium proxy for better success rate
      country_code: 'il' // Use Israel proxy
    };
    
    console.log('Making request to ScrapingBee...');
    const response = await axios.get(this.scrapingBeeUrl, { params });
    
    const html = response.data;
    console.log('ScrapingBee response received, length:', html.length);
    
    return html;
  }

  /**
   * Main method to fetch and parse sailing events
   * @returns {Promise<Array<Object>>} Array of structured sailing event objects
   */
  async getSailingEvents() {
    try {
      const html = await this.fetchSailingData();
      
      if (!SailingHTMLParser.validateSailingContent(html)) {
        console.log('No sailing content found in HTML');
        return [];
      }
      
      const events = SailingHTMLParser.parseSailingEvents(html);
      console.log(`Successfully parsed ${events.length} sailing events`);
      
      return events;
      
    } catch (error) {
      console.error('ScrapingBee provider error:', error.message);
      throw error;
    }
  }

  /**
   * Gets the provider name for logging/debugging
   * @returns {string} Provider name
   */
  getProviderName() {
    return 'ScrapingBee';
  }
}

module.exports = ScrapingBeeProvider;
