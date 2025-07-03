// FDA Food Safety Guidelines for Storage Times
// Based on USDA FoodKeeper App and FDA recommendations

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

// Storage type mapping
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

/**
 * Estimate expiry date based on FDA guidelines
 */
export function estimateExpiryDate(itemName, category = 'Other', storageType = null) {
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
      storageType: storage,
      confidence: exactMatch ? 'high' : 'medium',
      guideline: guideline,
      recommendations: getStorageRecommendations(itemName, storage)
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
    storageType: storage,
    confidence: 'low',
    recommendations: getStorageRecommendations(itemName, storage)
  };
}

/**
 * Get storage recommendations for better food safety
 */
export function getStorageRecommendations(itemName, storageType) {
  const recommendations = {
    refrigerator: [
      "Store at 40°F (4°C) or below",
      "Keep in original packaging or airtight container",
      "Place on appropriate shelf (raw meat on bottom)",
      "Check temperature regularly"
    ],
    freezer: [
      "Store at 0°F (-18°C) or below", 
      "Use freezer-safe containers or wrap",
      "Label with date frozen",
      "Use within recommended timeframe for best quality"
    ],
    room: [
      "Store in cool, dry place",
      "Keep away from direct sunlight",
      "Ensure good air circulation",
      "Check for signs of spoilage regularly"
    ]
  };
  
  return recommendations[storageType] || recommendations.refrigerator;
}

/**
 * Get all food items that match a search term
 */
export function searchFDADatabase(searchTerm) {
  const term = searchTerm.toLowerCase();
  return Object.keys(FDA_STORAGE_GUIDELINES)
    .filter(item => item.toLowerCase().includes(term))
    .map(item => ({
      name: item,
      guidelines: FDA_STORAGE_GUIDELINES[item]
    }));
}

/**
 * Get food safety tips based on item type
 */
export function getFoodSafetyTips(itemName, category) {
  const tips = {
    'Dairy': [
      "Always check smell and texture before consuming",
      "Don't leave dairy products at room temperature for more than 2 hours",
      "Store milk in the main body of refrigerator, not the door"
    ],
    'Meat': [
      "Use a food thermometer to ensure safe cooking temperatures",
      "Never leave raw meat at room temperature for more than 2 hours",
      "Store raw meat on the bottom shelf to prevent drips"
    ],
    'Vegetables': [
      "Wash thoroughly before eating, even pre-washed items",
      "Store most vegetables in the refrigerator crisper drawer",
      "Some vegetables like potatoes and onions prefer cool, dark places"
    ],
    'Fruits': [
      "Some fruits continue to ripen after purchase",
      "Store ethylene-producing fruits separately",
      "Wash fruits just before eating to prevent premature spoilage"
    ]
  };
  
  return tips[category] || [
    "Follow the 'when in doubt, throw it out' rule",
    "Trust your senses - look, smell, and feel for signs of spoilage",
    "Keep your refrigerator clean and at proper temperature"
  ];
}

export { FDA_STORAGE_GUIDELINES, STORAGE_TYPES };