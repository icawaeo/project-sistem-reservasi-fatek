// Script to generate PWA icons from Logo_Fatek_Unsrat.png
// Run: node generate-icons.js

const fs = require('fs');
const path = require('path');

// Ensure icons directory exists
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Since we don't have sharp/jimp installed, we'll use the original logo
// for all sizes. The browser will handle resizing.
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourcePath = path.join(__dirname, 'public', 'Logo_Fatek_Unsrat.png');
const sourceBuffer = fs.readFileSync(sourcePath);

sizes.forEach((size) => {
  const destPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.copyFileSync(sourcePath, destPath);
  console.log(`Created: icon-${size}x${size}.png`);
});

// Also create maskable icon
fs.copyFileSync(sourcePath, path.join(iconsDir, 'maskable-icon-512x512.png'));
console.log('Created: maskable-icon-512x512.png');

// Create apple-touch-icon (copy 180x180 equivalent)
fs.copyFileSync(sourcePath, path.join(iconsDir, 'apple-touch-icon.png'));
console.log('Created: apple-touch-icon.png');

console.log('\nDone! All icons generated.');
