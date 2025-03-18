/**
 * Test file to verify duplicate code detection
 */

// Test case 1: Simple function duplication with slight differences
function processOrder(order) {
  if (!order) {
    console.error('Order is required');
    return null;
  }
  
  const result = {
    id: order.id,
    items: order.items,
    total: calculateTotal(order.items),
    status: 'processed',
    timestamp: new Date().toISOString()
  };
  
  console.log(`Order ${order.id} processed successfully`);
  return result;
}

function processInvoice(invoice) {
  if (!invoice) {
    console.error('Invoice is required');
    return null;
  }
  
  const result = {
    id: invoice.id,
    items: invoice.items,
    total: calculateTotal(invoice.items),
    status: 'processed',
    timestamp: new Date().toISOString()
  };
  
  console.log(`Invoice ${invoice.id} processed successfully`);
  return result;
}

// Test case 2: Nested duplications
function validateUserCredentials(user) {
  // Common validation pattern 1
  if (!user) {
    return { valid: false, error: 'User object is required' };
  }
  
  if (!user.username || user.username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (!user.password || user.password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  // Common pattern 2 - appears in multiple places
  const userInfo = {
    id: user.id || generateId(),
    username: user.username.toLowerCase(),
    email: user.email ? user.email.toLowerCase() : null,
    role: user.role || 'user',
    lastLogin: new Date().toISOString()
  };
  
  return { valid: true, user: userInfo };
}

function validateAdminCredentials(admin) {
  // Common validation pattern 1 (duplicated)
  if (!admin) {
    return { valid: false, error: 'Admin object is required' };
  }
  
  if (!admin.username || admin.username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (!admin.password || admin.password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  // Additional admin validation
  if (!admin.securityKey) {
    return { valid: false, error: 'Security key is required for admin' };
  }
  
  // Common pattern 2 (duplicated) - appears in multiple places
  const adminInfo = {
    id: admin.id || generateId(),
    username: admin.username.toLowerCase(),
    email: admin.email ? admin.email.toLowerCase() : null,
    role: 'admin',
    lastLogin: new Date().toISOString()
  };
  
  return { valid: true, admin: adminInfo };
}

// Test case 3: Multi-level duplication
class UserService {
  getUserById(id) {
    // Common pattern - appears in multiple classes
    if (!id) {
      throw new Error('ID is required');
    }
    
    // Simulate database query
    return { id, name: 'Test User' };
  }
  
  updateUser(user) {
    // Common pattern - appears in multiple classes
    if (!user || !user.id) {
      throw new Error('Valid user with ID is required');
    }
    
    console.log(`Updating user: ${user.id}`);
    return user;
  }
}

class ProductService {
  getProductById(id) {
    // Common pattern - appears in multiple classes (duplicated)
    if (!id) {
      throw new Error('ID is required');
    }
    
    // Simulate database query
    return { id, name: 'Test Product' };
  }
  
  updateProduct(product) {
    // Common pattern - appears in multiple classes (duplicated)
    if (!product || !product.id) {
      throw new Error('Valid product with ID is required');
    }
    
    console.log(`Updating product: ${product.id}`);
    return product;
  }
}

// Helper functions
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

module.exports = {
  processOrder,
  processInvoice,
  validateUserCredentials,
  validateAdminCredentials,
  UserService,
  ProductService
};
