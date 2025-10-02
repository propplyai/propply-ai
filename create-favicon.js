const fs = require('fs');
const path = require('path');

// Create a simple favicon.ico file
// This is a basic implementation - in production you'd want to use a proper image conversion library

// For now, let's just copy the PNG as the favicon
const sourceFile = path.join(__dirname, 'propply-logo-transparent.png');
const targetFile = path.join(__dirname, 'favicon.ico');

try {
  fs.copyFileSync(sourceFile, targetFile);
  console.log('Favicon created successfully!');
} catch (error) {
  console.error('Error creating favicon:', error);
}
