const SailorService = require('../services/SailorService');
const ScrapingBeeProvider = require('../providers/ScrapingBeeProvider');
const StaticHTMLProvider = require('../providers/StaticHTMLProvider');

module.exports = async (req, res) => {
  // Enable CORS for GitHub Pages
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Determine provider based on query parameter
    const providerType = req.query.provider || 'static'; // Default to static HTML provider
    
    let provider;
    if (providerType === 'scrapingbee') {
      provider = new ScrapingBeeProvider({
        apiKey: 'SOME_VALUE'
      });
    } else {
      // Default to StaticHTMLProvider
      provider = new StaticHTMLProvider();
    }
    
    // Create SailorService with the selected provider
    const sailorService = new SailorService(provider);
    
    // Fetch sailing events
    const result = await sailorService.getSailingEvents();
    
    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};