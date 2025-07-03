const express = require('express');
const router = express.Router();

// In-memory storage for now (you can later replace with database)
let foodItems = [];
let nextId = 1;

// FDA Guidelines (copied from your client-side file)
const FDA_STORAGE_GUIDELINES = {
  // Dairy Products
  'Milk': { refrigerator: 7, freezer: 90, room: 2 },
  'Cheese (hard)': { refrigerator: 180, freezer: 240, room: 1 },
  'Cheese (soft)': { refrigerator: 14, freezer: 60, room: 1 },
  'Yogurt': { refrigerator: 21, freezer: 60, room: 2 },
  'Butter': { refrigerator: 90, freezer: 270, room: 1 },
  'Cream': { refrigerator: 10, freezer: 120, room: 2 },
  'Sour Cream': { refrigerator: 21, freezer: 60, room: 2 },

  // Meat & Poultry
  'Chicken (raw)': { refrigerator: 2, freezer: 270, room: 2 },
  'Beef (raw)': { refrigerator: 5, freezer: 365, room: 2 },
  'Pork (raw)': { refrigerator: 5, freezer: 180, room: 2 },
  'Ground Meat': { refrigerator: 2, freezer: 120, room: 2 },
  'Deli Meat': { refrigerator: 5, freezer: 60, room: 2 },
  'Bacon': { refrigerator: 7, freezer: 30, room: 2 },
  'Ham': { refrigerator: 7, freezer: 60, room: 2 },

  // Seafood
  'Fish (fresh)': { refrigerator: 2, freezer: 180, room: 2 },
  'Shrimp': { refrigerator: 2, freezer: 270, room: 2 },
  'Salmon': { refrigerator: 2, freezer: 90, room: 2 },
  'Canned Fish': { refrigerator: 1095, freezer: 1095, room: 1095 },

  // Vegetables
  'Lettuce': { refrigerator: 10, freezer: null, room: 1 },
  'Carrots': { refrigerator: 30, freezer: 300, room: 3 },
  'Broccoli': { refrigerator: 7, freezer: 300, room: 1 },
  'Spinach': { refrigerator: 7, freezer: 300, room: 1 },
  'Tomatoes': { refrigerator: 7, freezer: 240, room: 3 },
  'Potatoes': { refrigerator: 90, freezer: null, room: 14 },
  'Onions': { refrigerator: 60, freezer: 240, room: 30 },
  'Bell Peppers': { refrigerator: 10, freezer: 240, room: 2 },
  'Cucumbers': { refrigerator: 7, freezer: null, room: 2 },

  // Fruits
  'Apples': { refrigerator: 30, freezer: 240, room: 7 },
  'Bananas': { refrigerator: 7, freezer: 60, room: 5 },
  'Oranges': { refrigerator: 21, freezer: 300, room: 7 },
  'Grapes': { refrigerator: 7, freezer: 300, room: 2 },
  'Strawberries': { refrigerator: 7, freezer: 240, room: 1 },
  'Blueberries': { refrigerator: 10, freezer: 300, room: 2 },
  'Avocados': { refrigerator: 7, freezer: 120, room: 3 },

  // Pantry Items
  'Bread': { refrigerator: 7, freezer: 90, room: 3 },
  'Rice (cooked)': { refrigerator: 7, freezer: 180, room: 1 },
  'Pasta (cooked)': { refrigerator: 5, freezer: 90, room: 1 },
  'Canned Goods': { refrigerator: 1095, freezer: 1095, room: 730 },
  'Cereal': { refrigerator: 365, freezer: 365, room: 365 },
  'Flour': { refrigerator: 365, freezer: 730, room: 240 },
  'Sugar': { refrigerator: 1095, freezer: 1095, room: 1095 },

  // Beverages
  'Orange Juice': { refrigerator: 7, freezer: 300, room: 1 },
  'Wine (opened)': { refrigerator: 5, freezer: null, room: 1 },
  'Beer': { refrigerator: 180, freezer: null, room: 180 },

  // Eggs
  'Eggs (whole)': { refrigerator: 35, freezer: 365, room: 1 },
  'Egg Whites': { refrigerator: 4, freezer: 365, room: 2 },

  // Leftovers
  'Pizza': { refrigerator: 4, freezer: 60, room: 2 },
  'Soup': { refrigerator: 4, freezer: 90, room: 2 },
  'Casserole': { refrigerator: 4, freezer: 90, room: 2 }
};

const STORAGE_TYPES = {
  'Dairy': 'refrigerator',
  'Meat': 'refrigerator', 
  'Vegetables': 'refrigerator',
  'Fruits': 'refrigerator',
  'Pantry': 'room',
  'Frozen': 'freezer',
  'Beverages': 'refrigerator',
  'Other': 'refrigerator'
};

// Helper function to estimate expiry date using FDA guidelines
function estimateExpiryDate(itemName, category = 'Other', storageType = null) {
  const normalizedName = itemName.toLowerCase().trim();
  
  let guideline = null;
  const exactMatch = Object.keys(FDA_STORAGE_GUIDELINES).find(key => 
    key.toLowerCase() === normalizedName
  );
  
  if (exactMatch) {
    guideline = FDA_STORAGE_GUIDELINES[exactMatch];
  } else {
    const partialMatch = Object.keys(FDA_STORAGE_GUIDELINES).find(key =>
      key.toLowerCase().includes(normalizedName) || 
      normalizedName.includes(key.toLowerCase())
    );
    
    if (partialMatch) {
      guideline = FDA_STORAGE_GUIDELINES[partialMatch];
    }
  }
  
  const storage = storageType || STORAGE_TYPES[category] || 'refrigerator';
  
  if (guideline && guideline[storage]) {
    const daysToAdd = guideline[storage];
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);
    
    return {
      found: true,
      estimatedDate: estimatedDate.toISOString().split('T')[0],
      daysFromNow: daysToAdd,
      confidence: exactMatch ? 'high' : 'medium'
    };
  }
  
  const fallbackDays = {
    'Dairy': 7,
    'Meat': 3,
    'Vegetables': 7,
    'Fruits': 5,
    'Pantry': 30,
    'Frozen': 90,
    'Beverages': 7,
    'Other': 7
  };
  
  const days = fallbackDays[category] || 7;
  const fallbackDate = new Date();
  fallbackDate.setDate(fallbackDate.getDate() + days);
  
  return {
    found: false,
    estimatedDate: fallbackDate.toISOString().split('T')[0],
    daysFromNow: days,
    confidence: 'low'
  };
}

// GET /api/food - Get all food items
router.get('/', (req, res) => {
  try {
    // Recalculate status for all items before returning
    const updatedItems = foodItems.map(item => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      const expiry = new Date(item.expiryDate);
      expiry.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      
      return {
        ...item,
        daysUntilExpiry,
        status: getExpiryStatus(daysUntilExpiry)
      };
    });
    
    // Sort by expiry date (closest first)
    const sortedItems = updatedItems.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    
    res.json({
      success: true,
      data: sortedItems,
      count: sortedItems.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food items',
      error: error.message
    });
  }
});

// POST /api/food - Add new food item with FDA estimation
router.post('/', (req, res) => {
  try {
    const { name, category, expiryDate, quantity, notes, useEstimation } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    let finalExpiryDate = expiryDate;
    let estimationUsed = false;
    let estimationInfo = null;

    // If no expiry date provided or user requested estimation, use FDA guidelines
    if (!expiryDate || useEstimation) {
      const estimation = estimateExpiryDate(name, category);
      finalExpiryDate = estimation.estimatedDate;
      estimationUsed = true;
      estimationInfo = estimation;
    }

    // Calculate days until expiry with proper date handling
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const expiry = new Date(finalExpiryDate);
    expiry.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    let finalNotes = notes || '';
    if (estimationUsed && estimationInfo) {
      const estimationNote = `FDA Estimated: ${estimationInfo.daysFromNow} days (${estimationInfo.confidence} confidence)`;
      finalNotes = finalNotes ? `${finalNotes} | ${estimationNote}` : estimationNote;
    }

    const newItem = {
      id: nextId++,
      name: name.trim(),
      category: category || 'Other',
      expiryDate: finalExpiryDate,
      quantity: quantity || '1',
      notes: finalNotes,
      daysUntilExpiry,
      status: getExpiryStatus(daysUntilExpiry),
      addedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      estimationUsed,
      estimationInfo
    };

    foodItems.push(newItem);

    res.status(201).json({
      success: true,
      message: 'Food item added successfully',
      data: newItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add food item',
      error: error.message
    });
  }
});

// GET /api/food/estimate - Get FDA estimation for a food item
router.get('/estimate', (req, res) => {
  try {
    const { name, category } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required'
      });
    }

    const estimation = estimateExpiryDate(name, category);
    
    res.json({
      success: true,
      data: estimation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to estimate expiry date',
      error: error.message
    });
  }
});

// PUT /api/food/:id - Update food item
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, expiryDate, quantity, notes } = req.body;

    const itemIndex = foodItems.findIndex(item => item.id === parseInt(id));
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Update item with proper date calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate || foodItems[itemIndex].expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    foodItems[itemIndex] = {
      ...foodItems[itemIndex],
      name: name || foodItems[itemIndex].name,
      category: category || foodItems[itemIndex].category,
      expiryDate: expiryDate || foodItems[itemIndex].expiryDate,
      quantity: quantity || foodItems[itemIndex].quantity,
      notes: notes || foodItems[itemIndex].notes,
      daysUntilExpiry,
      status: getExpiryStatus(daysUntilExpiry),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Food item updated successfully',
      data: foodItems[itemIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update food item',
      error: error.message
    });
  }
});

// DELETE /api/food/:id - Delete food item
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const itemIndex = foodItems.findIndex(item => item.id === parseInt(id));
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    const deletedItem = foodItems.splice(itemIndex, 1)[0];

    res.json({
      success: true,
      message: 'Food item deleted successfully',
      data: deletedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete food item',
      error: error.message
    });
  }
});

// GET /api/food/expiring - Get items expiring soon
router.get('/expiring', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7; // Default to 7 days
    
    // Recalculate for all items
    const updatedItems = foodItems.map(item => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(item.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      
      return {
        ...item,
        daysUntilExpiry,
        status: getExpiryStatus(daysUntilExpiry)
      };
    });
    
    const expiringItems = updatedItems.filter(item => 
      item.daysUntilExpiry <= days && item.daysUntilExpiry >= 0
    );

    res.json({
      success: true,
      data: expiringItems,
      count: expiringItems.length,
      message: `Found ${expiringItems.length} items expiring within ${days} days`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring items',
      error: error.message
    });
  }
});

// GET /api/food/expired - Get expired items
router.get('/expired', (req, res) => {
  try {
    // Recalculate for all items
    const updatedItems = foodItems.map(item => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(item.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      
      return {
        ...item,
        daysUntilExpiry,
        status: getExpiryStatus(daysUntilExpiry)
      };
    });
    
    const expiredItems = updatedItems.filter(item => item.daysUntilExpiry < 0);

    res.json({
      success: true,
      data: expiredItems,
      count: expiredItems.length,
      message: `Found ${expiredItems.length} expired items`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expired items',
      error: error.message
    });
  }
});

// Helper function to determine expiry status
function getExpiryStatus(daysUntilExpiry) {
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 2) return 'critical';
  if (daysUntilExpiry <= 7) return 'warning';
  return 'fresh';
}

module.exports = router;