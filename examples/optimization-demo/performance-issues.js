/**
 * Example file with performance issues for demonstration
 */

// Inefficient string concatenation in a loop
function inefficientStringConcatenation(items) {
  let result = '';
  
  for (let i = 0; i < items.length; i++) {
    // Using += in a loop with strings is inefficient
    result += items[i] + ', ';
  }
  
  return result.slice(0, -2);
}

// Inefficient DOM manipulation
function inefficientDOMManipulation(items) {
  // Assuming this runs in a browser environment
  const container = document.getElementById('container');
  
  // Inefficient: causes multiple reflows and repaints
  for (let i = 0; i < items.length; i++) {
    const div = document.createElement('div');
    div.textContent = items[i];
    container.appendChild(div);
  }
}

// Memory leak with event listeners
function setupEventListeners() {
  const button = document.getElementById('button');
  
  // Memory leak: event listener is added but never removed
  button.addEventListener('click', function() {
    console.log('Button clicked');
    // This creates a closure that holds references to variables
    const largeData = new Array(10000).fill('data');
    console.log(largeData.length);
  });
}

// Inefficient array operations
function findDuplicates(array) {
  const duplicates = [];
  
  // O(n²) operation - inefficient for large arrays
  for (let i = 0; i < array.length; i++) {
    for (let j = i + 1; j < array.length; j++) {
      if (array[i] === array[j] && !duplicates.includes(array[i])) {
        duplicates.push(array[i]);
      }
    }
  }
  
  return duplicates;
}

// Blocking the main thread
function blockingOperation() {
  const start = Date.now();
  
  // This will block the main thread for a long time
  while (Date.now() - start < 5000) {
    // Do nothing, just block
  }
  
  return 'Operation completed';
}

// Inefficient data access
function inefficientDataAccess(data) {
  let total = 0;
  
  // Inefficient: accessing deep nested properties repeatedly
  for (let i = 0; i < data.length; i++) {
    total += data[i].user.profile.preferences.theme.color.brightness;
  }
  
  return total;
}

// Excessive function calls
function excessiveFunctionCalls(numbers) {
  let total = 0;
  
  function add(a, b) {
    return a + b;
  }
  
  // Inefficient: calling a function in a loop for a simple operation
  for (let i = 0; i < numbers.length; i++) {
    total = add(total, numbers[i]);
  }
  
  return total;
}

// Export functions
module.exports = {
  inefficientStringConcatenation,
  inefficientDOMManipulation,
  setupEventListeners,
  findDuplicates,
  blockingOperation,
  inefficientDataAccess,
  excessiveFunctionCalls
};
