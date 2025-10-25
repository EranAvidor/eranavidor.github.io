/**
 * Abstract base class for sailing data providers
 * Defines the interface that all providers must implement
 */
class BaseProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Fetches and parses sailing data from the provider
   * @returns {Promise<Array<Object>>} Array of structured sailing event objects
   * @throws {Error} If fetching or parsing fails
   */
  async getSailingEvents() {
    throw new Error('getSailingEvents() must be implemented by provider');
  }

  /**
   * Gets the provider name for logging/debugging
   * @returns {string} Provider name
   */
  getProviderName() {
    throw new Error('getProviderName() must be implemented by provider');
  }
}

module.exports = BaseProvider;
