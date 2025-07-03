const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Helper function to convert audio buffer to base64
 */
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: mimeType,
    },
  };
}

/**
 * POST /api/ai/voice-to-food
 * Convert voice input to food item data
 */
router.post('/voice-to-food', upload.single('audio'), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert audio to base64
    const audioPart = fileToGenerativePart(req.file.buffer, req.file.mimetype);

    const prompt = `
      Listen to this audio and extract food-related information. 
      The user is trying to add food items to their inventory tracker.
      
      Please analyze the audio and return ONLY a JSON object with the following structure:
      {
        "items": [
          {
            "name": "item name",
            "category": "one of: Dairy, Meat, Vegetables, Fruits, Pantry, Frozen, Beverages, Other",
            "quantity": "quantity mentioned or '1' if not specified",
            "notes": "any additional details mentioned"
          }
        ],
        "confidence": "high/medium/low"
      }
      
      If multiple items are mentioned, include them all in the items array.
      If no food items are clearly mentioned, return an empty items array.
      
      Examples:
      - "Add milk to my fridge" -> {"items":[{"name":"milk","category":"Dairy","quantity":"1","notes":""}],"confidence":"high"}
      - "I bought two pounds of chicken and some bread" -> {"items":[{"name":"chicken","category":"Meat","quantity":"2 pounds","notes":""},{"name":"bread","category":"Pantry","quantity":"1","notes":""}],"confidence":"high"}
    `;

    const result = await model.generateContent([prompt, audioPart]);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to parse AI response',
        rawResponse: text
      });
    }

    res.json({
      success: true,
      data: parsedResponse,
      rawResponse: text
    });

  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice input',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/analyze-photo
 * Analyze photo to extract food items
 */
router.post('/analyze-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo provided'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert image to base64
    const imagePart = fileToGenerativePart(req.file.buffer, req.file.mimetype);

    const prompt = `
      Analyze this image and identify any food items visible. 
      This could be groceries, food in a refrigerator, pantry items, or any edible products.
      
      Please return ONLY a JSON object with the following structure:
      {
        "items": [
          {
            "name": "item name",
            "category": "one of: Dairy, Meat, Vegetables, Fruits, Pantry, Frozen, Beverages, Other",
            "quantity": "estimated quantity or '1' if unclear",
            "notes": "any relevant details about condition, brand, etc."
          }
        ],
        "confidence": "high/medium/low",
        "description": "brief description of what you see in the image"
      }
      
      Guidelines:
      - Only include items that are clearly identifiable food products
      - Estimate quantities when possible (e.g., "6 eggs", "1 bottle", "bunch")
      - Note any visible expiry dates in the notes field
      - If you see packaging with text, try to read product names
      - If no food items are visible, return an empty items array
      
      Categories:
      - Dairy: milk, cheese, yogurt, butter, etc.
      - Meat: chicken, beef, pork, fish, etc.
      - Vegetables: lettuce, carrots, tomatoes, etc.
      - Fruits: apples, bananas, oranges, etc.
      - Pantry: bread, pasta, rice, canned goods, etc.
      - Frozen: frozen vegetables, ice cream, etc.
      - Beverages: juice, soda, water, etc.
      - Other: anything that doesn't fit the above categories
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to parse AI response',
        rawResponse: text
      });
    }

    res.json({
      success: true,
      data: parsedResponse,
      rawResponse: text
    });

  } catch (error) {
    console.error('Photo analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze photo',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/analyze-receipt
 * Analyze receipt photo to extract purchased food items
 */
router.post('/analyze-receipt', upload.single('receipt'), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No receipt image provided'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert image to base64
    const imagePart = fileToGenerativePart(req.file.buffer, req.file.mimetype);

    const prompt = `
      Analyze this receipt image and extract all food items that were purchased.
      Look for grocery items, food products, and beverages.
      
      Please return ONLY a JSON object with the following structure:
      {
        "items": [
          {
            "name": "item name (cleaned up, without brand if possible)",
            "category": "one of: Dairy, Meat, Vegetables, Fruits, Pantry, Frozen, Beverages, Other",
            "quantity": "quantity from receipt or '1' if not clear",
            "price": "price if visible",
            "notes": "any relevant details like brand, size, etc."
          }
        ],
        "store": "store name if visible",
        "date": "purchase date if visible (YYYY-MM-DD format)",
        "total": "total amount if visible",
        "confidence": "high/medium/low"
      }
      
      Guidelines:
      - Focus only on food and beverage items, ignore non-food purchases
      - Clean up product names (e.g., "COCA COLA 12PK" -> "Coca Cola")
      - Estimate reasonable categories for each item
      - Include quantity if mentioned (e.g., "2x" or "3 LB")
      - If you can't read the receipt clearly, set confidence to "low"
      - Common receipt abbreviations: LB=pound, OZ=ounce, PK=pack, etc.
      
      Categories:
      - Dairy: milk, cheese, yogurt, butter, eggs, etc.
      - Meat: chicken, beef, pork, fish, deli meats, etc.
      - Vegetables: fresh produce, salads, etc.
      - Fruits: fresh fruits, fruit cups, etc.
      - Pantry: bread, pasta, rice, canned goods, snacks, etc.
      - Frozen: frozen meals, ice cream, frozen vegetables, etc.
      - Beverages: soda, juice, water, coffee, etc.
      - Other: anything that doesn't fit the above categories
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to parse AI response',
        rawResponse: text
      });
    }

    res.json({
      success: true,
      data: parsedResponse,
      rawResponse: text
    });

  } catch (error) {
    console.error('Receipt analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze receipt',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/recipe-suggestions
 * Get recipe suggestions based on expiring items
 */
router.post('/recipe-suggestions', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured'
      });
    }

    const { items, preferences } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided for recipe suggestions'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const itemsList = items.map(item => `${item.name} (${item.quantity || '1'})`).join(', ');
    const preferencesText = preferences ? `Dietary preferences: ${preferences}` : '';

    const prompt = `
      I have these food items that are expiring soon and need to be used: ${itemsList}
      ${preferencesText}
      
      Please suggest 3-5 recipes that use these ingredients effectively.
      Return ONLY a JSON object with this structure:
      {
        "recipes": [
          {
            "name": "Recipe Name",
            "description": "Brief description",
            "ingredients_used": ["ingredient1", "ingredient2"],
            "cooking_time": "prep + cook time",
            "difficulty": "easy/medium/hard",
            "instructions": "Brief step-by-step instructions"
          }
        ],
        "tips": ["tip1", "tip2", "tip3"]
      }
      
      Guidelines:
      - Prioritize recipes that use the most expiring ingredients
      - Keep recipes practical and not overly complex
      - Include quick/easy options for busy people
      - Add useful tips for ingredient substitutions or storage
      - Focus on commonly available ingredients for any missing items
    `;

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    let parsedResponse;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to parse AI response',
        rawResponse: text
      });
    }

    res.json({
      success: true,
      data: parsedResponse
    });

  } catch (error) {
    console.error('Recipe suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recipe suggestions',
      error: error.message
    });
  }
});

/**
 * GET /api/ai/status
 * Check AI service status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    gemini_configured: !!process.env.GEMINI_API_KEY,
    available_features: [
      'voice-to-food',
      'analyze-photo',
      'analyze-receipt',
      'recipe-suggestions'
    ]
  });
});

module.exports = router;