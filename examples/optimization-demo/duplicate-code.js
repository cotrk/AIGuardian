/**
 * Example file with duplicate code for demonstration
 */

/**
 * Common field processors that can be reused
 */
const commonProcessors = {
  name: (value) => value.trim(),
  email: (value) => value.toLowerCase(),
  price: (value) => parseFloat(value)
};

/**
 * Generic data processor that handles validation and processing
 * @param {Object} data - The data to process
 * @param {Object} options - Processing options
 * @param {string} options.type - Type of data being processed ('user' or 'product')
 * @param {string[]} options.requiredFields - Fields that must be present
 * @param {Object} options.processors - Custom processors for specific fields
 * @returns {Object|null} - Processed data or null if validation fails
 */
function processData(data, options) {
  const { type, requiredFields, processors } = options;
  
  // Validation
  if (!data) {
    console.error(`${type} data is required`);
    return null;
  }
  
  // Check required fields
  for (const field of requiredFields) {
    if (!data[field]) {
      console.error(`${type} ${field} is required`);
      return null;
    }
  }
  
  // Processing
  const processedData = {
    id: Math.random().toString(36).substring(2, 15),
    createdAt: new Date().toISOString()
  };
  
  // Process each field
  for (const [field, value] of Object.entries(data)) {
    if (processors && processors[field]) {
      // Apply custom processor
      processedData[field] = processors[field](value);
    } else if (value !== undefined) {
      // Use value as is
      processedData[field] = value;
    }
  }
  
  return processedData;
}

/**
 * Creates a data processor function for a specific entity type
 * @param {Object} config - Configuration for the processor
 * @param {string} config.type - Type of entity (e.g., 'User', 'Product')
 * @param {string[]} config.requiredFields - Fields that must be present
 * @param {Object} config.processors - Field processors to apply
 * @returns {Function} - A function that processes data for the specified entity type
 */
function createDataProcessor(config) {
  return function(data) {
    return processData(data, config);
  };
}

// Create specialized data processors using the factory
const processUserData = createDataProcessor({
  type: 'User',
  requiredFields: ['name', 'email'],
  processors: {
    name: commonProcessors.name,
    email: commonProcessors.email
  }
});

const processProductData = createDataProcessor({
  type: 'Product',
  requiredFields: ['name', 'price'],
  processors: {
    name: commonProcessors.name,
    price: commonProcessors.price
  }
});

// Dead code that's never used
function unusedFunction() {
  console.log('This function is never called');
  return true;
}

// Complex function with high cyclomatic complexity
function calculateTotalPrice(cart, user, discounts, taxes, shipping) {
  let total = 0;
  
  // Add up all item prices
  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    total += item.price * item.quantity;
    
    // Apply item-specific discounts
    if (item.discount) {
      if (item.discountType === 'percentage') {
        total -= (item.price * item.quantity * item.discount / 100);
      } else if (item.discountType === 'fixed') {
        total -= item.discount;
      } else if (item.discountType === 'buyOneGetOne' && item.quantity > 1) {
        const freeItems = Math.floor(item.quantity / 2);
        total -= freeItems * item.price;
      }
    }
  }
  
  // Apply user-specific discounts
  if (user && user.membershipLevel) {
    if (user.membershipLevel === 'gold') {
      total *= 0.9; // 10% discount
    } else if (user.membershipLevel === 'silver') {
      total *= 0.95; // 5% discount
    } else if (user.membershipLevel === 'bronze') {
      total *= 0.98; // 2% discount
    }
    
    // Additional discount for long-time members
    if (user.memberSince) {
      const memberYears = new Date().getFullYear() - new Date(user.memberSince).getFullYear();
      if (memberYears > 5) {
        total *= 0.95; // Additional 5% discount
      } else if (memberYears > 2) {
        total *= 0.98; // Additional 2% discount
      }
    }
  }
  
  // Apply general discounts
  if (discounts && discounts.length > 0) {
    for (let i = 0; i < discounts.length; i++) {
      const discount = discounts[i];
      if (discount.type === 'percentage') {
        total *= (1 - discount.value / 100);
      } else if (discount.type === 'fixed') {
        total -= discount.value;
      }
    }
  }
  
  // Apply taxes
  if (taxes && taxes.length > 0) {
    for (let i = 0; i < taxes.length; i++) {
      const tax = taxes[i];
      if (tax.type === 'percentage') {
        total *= (1 + tax.value / 100);
      } else if (tax.type === 'fixed') {
        total += tax.value;
      }
    }
  }
  
  // Add shipping costs
  if (shipping) {
    if (shipping.type === 'fixed') {
      total += shipping.cost;
    } else if (shipping.type === 'weight') {
      total += shipping.baseCost + (cart.reduce((sum, item) => sum + item.weight * item.quantity, 0) * shipping.costPerUnit);
    } else if (shipping.type === 'distance') {
      total += shipping.baseCost + (shipping.distance * shipping.costPerUnit);
    }
    
    // Free shipping threshold
    if (shipping.freeThreshold && total > shipping.freeThreshold) {
      total -= shipping.cost || shipping.baseCost || 0;
    }
  }
  
  return parseFloat(total.toFixed(2));
}

// Performance issue: inefficient array operation
function findDuplicateItems(items) {
  const duplicates = [];
  
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      // Inefficient comparison (comparing all items with all items)
      if (i !== j && items[i].id === items[j].id) {
        // Inefficient check (could add duplicates multiple times)
        if (!duplicates.includes(items[i])) {
          duplicates.push(items[i]);
        }
      }
    }
  }
  
  return duplicates;
}

// Export functions
module.exports = {
  processUserData,
  processProductData,
  calculateTotalPrice,
  findDuplicateItems
};
