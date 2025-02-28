// This is an example file that only uses chalk
const chalk = require('chalk');

// Log a colorful message
console.log(chalk.blue('Hello') + ' ' + chalk.red('World'));

// Function to display a formatted message
function displayMessage(message, type = 'info') {
  switch(type) {
    case 'error':
      console.log(chalk.red(`ERROR: ${message}`));
      break;
    case 'warning':
      console.log(chalk.yellow(`WARNING: ${message}`));
      break;
    case 'success':
      console.log(chalk.green(`SUCCESS: ${message}`));
      break;
    default:
      console.log(chalk.blue(`INFO: ${message}`));
  }
}

// Export the function
module.exports = {
  displayMessage
};
