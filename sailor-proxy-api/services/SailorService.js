/**
 * Service class for orchestrating sailing data providers
 * Uses Strategy pattern to support multiple data providers
 * No parsing logic - delegates all data processing to providers
 */
class SailorService {
  constructor(provider) {
    this.provider = provider;
  }

  /**
   * Sets the data provider strategy
   * @param {BaseProvider} provider Provider instance
   */
  setProvider(provider) {
    this.provider = provider;
  }

  /**
   * Gets the current provider name
   * @returns {string} Provider name
   */
  getProviderName() {
    return this.provider ? this.provider.getProviderName() : 'None';
  }

  /**
   * Main method to get sailing events from the provider
   * @returns {Promise<Object>} Result object with events and metadata
   */
  async getSailingEvents() {
    if (!this.provider) {
      return {
        success: false,
        error: 'No provider configured',
        message: 'Sailing data provider is not configured',
        timestamp: new Date().toISOString()
      };
    }

    try {
      console.log(`Using ${this.getProviderName()} provider to fetch sailing data`);
      
      const events = await this.provider.getSailingEvents();
      
      return {
        success: true,
        events: events,
        contentFound: events.length > 0,
        provider: this.getProviderName(),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`${this.getProviderName()} provider error:`, error.message);
      
      let errorDetails = error.message;
      if (error.response) {
        errorDetails = `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`;
      }
      
      return {
        success: false,
        error: errorDetails,
        message: `Failed to fetch sailing data from ${this.getProviderName()}`,
        provider: this.getProviderName(),
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = SailorService;
