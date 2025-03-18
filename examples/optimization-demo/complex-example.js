/**
 * Complex example with multiple optimization opportunities
 */

/**
 * Generic validator function for data objects
 * @param {Object} data - The data to validate
 * @param {string} type - Type of data (e.g., 'User', 'Product')
 * @param {string[]} requiredFields - Fields that must be present
 * @returns {boolean} - Whether the data is valid
 */
function validateData(data, type, requiredFields) {
  if (!data) {
    console.error(`${type} data is required`);
    return false;
  }
  
  for (const field of requiredFields) {
    if (!data[field]) {
      console.error(`${type} ${field} is required`);
      return false;
    }
  }
  
  return true;
}

// Specialized validators using the generic validator
function validateUserData(userData) {
  return validateData(userData, 'User', ['name', 'email']);
}

function validateProductData(productData) {
  return validateData(productData, 'Product', ['name', 'price']);
}

// Dead code - never used
function unusedFunction() {
  const data = [];
  for (let i = 0; i < 100; i++) {
    data.push({
      id: i,
      value: Math.random()
    });
  }
  return data;
}

// Inefficient string concatenation
function buildReport(items) {
  let report = '';
  
  report += '=== Report ===\n';
  report += 'Generated: ' + new Date().toISOString() + '\n';
  report += 'Items: ' + items.length + '\n\n';
  
  for (let i = 0; i < items.length; i++) {
    report += 'Item #' + (i + 1) + '\n';
    report += '  ID: ' + items[i].id + '\n';
    report += '  Name: ' + items[i].name + '\n';
    report += '  Price: $' + items[i].price.toFixed(2) + '\n';
    report += '  Stock: ' + items[i].stock + '\n';
    report += '\n';
  }
  
  report += '=== End of Report ===';
  
  return report;
}

// Complex function with high cyclomatic complexity
function processOrder(order, user, inventory, shipping, payment, discounts) {
  // Validate order
  if (!order) {
    return { success: false, error: 'Order is required' };
  }
  
  if (!order.items || order.items.length === 0) {
    return { success: false, error: 'Order must contain items' };
  }
  
  // Validate user
  if (!user) {
    return { success: false, error: 'User is required' };
  }
  
  if (!user.id) {
    return { success: false, error: 'User ID is required' };
  }
  
  // Check inventory
  const unavailableItems = [];
  
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    const inventoryItem = inventory.find(invItem => invItem.id === item.id);
    
    if (!inventoryItem) {
      unavailableItems.push(item.id);
      continue;
    }
    
    if (inventoryItem.stock < item.quantity) {
      unavailableItems.push(item.id);
    }
  }
  
  if (unavailableItems.length > 0) {
    return {
      success: false,
      error: 'Some items are unavailable',
      unavailableItems
    };
  }
  
  // Calculate total
  let total = 0;
  
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    const inventoryItem = inventory.find(invItem => invItem.id === item.id);
    total += inventoryItem.price * item.quantity;
  }
  
  // Apply discounts
  if (discounts && discounts.length > 0) {
    for (let i = 0; i < discounts.length; i++) {
      const discount = discounts[i];
      
      if (discount.type === 'percentage') {
        total *= (1 - discount.value / 100);
      } else if (discount.type === 'fixed') {
        total -= discount.value;
      } else if (discount.type === 'item' && discount.itemId) {
        const discountItem = order.items.find(item => item.id === discount.itemId);
        
        if (discountItem) {
          const inventoryItem = inventory.find(invItem => invItem.id === discountItem.id);
          total -= inventoryItem.price * discount.value;
        }
      }
    }
  }
  
  // Add shipping cost
  if (shipping) {
    if (shipping.type === 'fixed') {
      total += shipping.cost;
    } else if (shipping.type === 'weight') {
      let totalWeight = 0;
      
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        const inventoryItem = inventory.find(invItem => invItem.id === item.id);
        totalWeight += inventoryItem.weight * item.quantity;
      }
      
      total += shipping.baseCost + (totalWeight * shipping.costPerUnit);
    }
    
    // Free shipping threshold
    if (shipping.freeThreshold && total > shipping.freeThreshold) {
      if (shipping.type === 'fixed') {
        total -= shipping.cost;
      } else if (shipping.type === 'weight') {
        total -= shipping.baseCost;
      }
    }
  }
  
  // Process payment
  let paymentResult;
  
  if (payment.type === 'credit') {
    paymentResult = processCreditPayment(payment, total);
  } else if (payment.type === 'paypal') {
    paymentResult = processPayPalPayment(payment, total);
  } else if (payment.type === 'crypto') {
    paymentResult = processCryptoPayment(payment, total);
  } else {
    return { success: false, error: 'Invalid payment type' };
  }
  
  if (!paymentResult.success) {
    return {
      success: false,
      error: 'Payment failed',
      paymentError: paymentResult.error
    };
  }
  
  // Update inventory
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    const inventoryItem = inventory.find(invItem => invItem.id === item.id);
    inventoryItem.stock -= item.quantity;
  }
  
  // Create order record
  const orderRecord = {
    id: generateOrderId(),
    userId: user.id,
    items: order.items,
    total,
    payment: {
      type: payment.type,
      transactionId: paymentResult.transactionId
    },
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  
  return {
    success: true,
    order: orderRecord
  };
}

/**
 * Creates a payment validator function
 * @param {Object} config - Validation configuration
 * @param {string[]} config.requiredFields - Fields that must be present
 * @param {string} config.errorMessage - Error message to return if validation fails
 * @returns {Function} - Validator function
 */
function createPaymentValidator(config) {
  const { requiredFields, errorMessage } = config;
  
  return function(payment) {
    // Check if all required fields are present
    const missingField = requiredFields.some(field => !payment[field]);
    
    if (missingField) {
      return { valid: false, error: errorMessage };
    }
    
    return { valid: true };
  };
}

/**
 * Generic payment processor function
 * @param {Object} payment - Payment details
 * @param {number} amount - Payment amount
 * @param {string} type - Payment type (e.g., 'CC', 'PP', 'CR')
 * @param {Function} validateFn - Function to validate payment details
 * @returns {Object} - Payment result
 */
function processPayment(payment, amount, type, validateFn) {
  // Validate payment details
  const validationResult = validateFn(payment);
  if (!validationResult.valid) {
    return { success: false, error: validationResult.error };
  }
  
  // In a real application, this would call the appropriate payment service
  return {
    success: true,
    transactionId: `${type}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };
}

// Create validators for different payment types
const validateCreditCard = createPaymentValidator({
  requiredFields: ['cardNumber', 'expiryDate', 'cvv'],
  errorMessage: 'Invalid card details'
});

const validatePayPal = createPaymentValidator({
  requiredFields: ['email'],
  errorMessage: 'PayPal email is required'
});

const validateCrypto = createPaymentValidator({
  requiredFields: ['walletAddress', 'currency'],
  errorMessage: 'Wallet address and currency are required'
});

// Payment processor functions using the validators
function processCreditPayment(payment, amount) {
  return processPayment(payment, amount, 'CC', validateCreditCard);
}

function processPayPalPayment(payment, amount) {
  return processPayment(payment, amount, 'PP', validatePayPal);
}

function processCryptoPayment(payment, amount) {
  return processPayment(payment, amount, 'CR', validateCrypto);
}

// Helper functions
function generateOrderId() {
  return 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Export functions
module.exports = {
  validateUserData,
  validateProductData,
  buildReport,
  processOrder,
  processCreditPayment,
  processPayPalPayment,
  processCryptoPayment
};
