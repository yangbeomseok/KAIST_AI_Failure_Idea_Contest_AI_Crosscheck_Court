const aiService = require('../services/aiService');

const processQuery = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid query',
        message: 'Query must be a non-empty string'
      });
    }

    console.log(`Processing query: ${query}`);
    
    const result = await aiService.processMultiAIQuery(query);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error.message
    });
  }
};

const getAvailableModels = (req, res) => {
  try {
    const models = aiService.getAvailableModels();
    res.json({
      success: true,
      models: models
    });
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({
      error: 'Failed to get available models',
      message: error.message
    });
  }
};

module.exports = {
  processQuery,
  getAvailableModels
};