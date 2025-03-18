/**
 * Edge case test file for duplicate detection
 */

// Edge case 1: Very short duplicated blocks
function isAdmin(user) {
  return user && user.role === 'admin';
}

function isEditor(user) {
  return user && user.role === 'editor';
}

// Edge case 2: Similar structure but different variables and literals
function calculateTax(amount, rate) {
  const tax = amount * rate;
  return {
    original: amount,
    tax: tax,
    total: amount + tax
  };
}

function calculateDiscount(price, percent) {
  const discount = price * percent;
  return {
    original: price,
    discount: discount,
    total: price - discount
  };
}

// Edge case 3: Code that looks similar but has completely different logic
function sumArray(arr) {
  let result = 0;
  for (let i = 0; i < arr.length; i++) {
    result += arr[i];
  }
  return result;
}

function findMax(arr) {
  let result = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > result) {
      result = arr[i];
    }
  }
  return result;
}

// Edge case 4: Code with duplicated structure but different import/require statements
// This shouldn't be detected as duplication because the imports make it unique
const fs = require('fs');
function readFile(path) {
  try {
    return fs.readFileSync(path, 'utf8');
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return null;
  }
}

const http = require('http');
function fetchUrl(url) {
  try {
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { resolve(data); });
      }).on('error', reject);
    });
  } catch (error) {
    console.error(`Error fetching URL: ${error.message}`);
    return null;
  }
}

module.exports = {
  isAdmin,
  isEditor,
  calculateTax,
  calculateDiscount,
  sumArray,
  findMax,
  readFile,
  fetchUrl
};
