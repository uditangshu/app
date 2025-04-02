const fs = require('fs');
const { createCanvas } = require('canvas');

// Create assets directory if it doesn't exist
if (!fs.existsSync('./assets')) {
    fs.mkdirSync('./assets');
}

// Function to create a placeholder image
function createPlaceholderImage(width, height, filename, text) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = '#1C8D3A';
    ctx.fillRect(0, 0, width, height);

    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = `${width/10}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width/2, height/2);

    // Save the image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./assets/${filename}`, buffer);
}

// Generate all required images
createPlaceholderImage(1024, 1024, 'icon.png', 'Icon');
createPlaceholderImage(1242, 2436, 'splash.png', 'Splash');
createPlaceholderImage(1024, 1024, 'adaptive-icon.png', 'Adaptive');
createPlaceholderImage(32, 32, 'favicon.png', 'F'); 