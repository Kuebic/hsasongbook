// Icon generator that creates both SVG and PNG files
// Uses sharp to convert SVG to PNG for proper icon files

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an SVG icon with HSA text
const createSVGIcon = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.1 : 0;
  const safeZone = size - padding * 2;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#1e293b"/>

  <!-- Safe zone for maskable -->
  ${isMaskable ? `<rect x="${padding}" y="${padding}" width="${safeZone}" height="${safeZone}" fill="none" stroke="#ffffff" stroke-width="${size / 100}" opacity="0.3"/>` : ''}

  <!-- HSA Text -->
  <text x="${size / 2}" y="${size / 2 - size / 10}"
        font-family="Arial, sans-serif"
        font-size="${size / 4}"
        font-weight="bold"
        fill="#ffffff"
        text-anchor="middle"
        dominant-baseline="middle">HSA</text>

  <!-- Music Note -->
  <text x="${size / 2}" y="${size / 2 + size / 6}"
        font-family="Arial, sans-serif"
        font-size="${size / 3}"
        fill="#ffffff"
        text-anchor="middle"
        dominant-baseline="middle">♪</text>

  <!-- Border -->
  <rect x="${padding + 2}" y="${padding + 2}"
        width="${size - (padding + 2) * 2}"
        height="${size - (padding + 2) * 2}"
        fill="none"
        stroke="#ffffff"
        stroke-width="${size / 50}"/>
</svg>`;

  return svg;
};

// Icon configuration
const icons = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-192-maskable.png', size: 192, maskable: true },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180 },
];

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate both SVG and PNG icons
const generateIcons = async () => {
  for (const { name, size, maskable } of icons) {
    const actualSize = size || 192;

    // Create SVG version
    const svgName = name.replace('.png', '.svg');
    const svgPath = path.join(iconsDir, svgName);
    const svgContent = createSVGIcon(actualSize, maskable);
    fs.writeFileSync(svgPath, svgContent);
    console.log(`Created ${svgName} (${actualSize}x${actualSize})`);

    // Convert SVG to PNG using sharp
    try {
      const pngPath = path.join(iconsDir, name);
      await sharp(Buffer.from(svgContent))
        .resize(actualSize, actualSize)
        .png()
        .toFile(pngPath);
      console.log(`Created ${name} (${actualSize}x${actualSize} PNG)`);
    } catch (err) {
      console.error(`Failed to create PNG ${name}:`, err.message);
      // Fallback: write SVG content if PNG conversion fails
      const pngPath = path.join(iconsDir, name);
      fs.writeFileSync(pngPath, svgContent);
      console.log(`Created ${name} (SVG fallback)`);
    }
  }
};

// Run the async function
generateIcons().then(() => {
  console.log('Icon generation complete');
}).catch(err => {
  console.error('Icon generation failed:', err);
});

// After icon generation, copy files and create additional assets
const createAdditionalFiles = async () => {
  // Wait for icons to be generated first
  await generateIcons();

  // Copy apple-touch-icon to public root
  const sourcePath = path.join(iconsDir, 'apple-touch-icon.png');
  const destPath = path.join(__dirname, '..', 'public', 'apple-touch-icon.png');
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log('Copied apple-touch-icon.png to public root');
  }

  // Create favicon.svg
  const faviconPath = path.join(__dirname, '..', 'public', 'favicon.svg');
  const faviconContent = createSVGIcon(32, false);
  fs.writeFileSync(faviconPath, faviconContent);
  console.log('Created favicon.svg');

  // Create favicon.ico as PNG
  try {
    const faviconIcoPath = path.join(__dirname, '..', 'public', 'favicon.ico');
    await sharp(Buffer.from(faviconContent))
      .resize(32, 32)
      .png()
      .toFile(faviconIcoPath);
    console.log('Created favicon.ico (32x32 PNG)');
  } catch (err) {
    console.error('Failed to create favicon.ico:', err.message);
  }

  // Create robots.txt
  const robotsContent = `User-agent: *
Allow: /

Sitemap: /sitemap.xml`;
  const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
  fs.writeFileSync(robotsPath, robotsContent);
  console.log('Created robots.txt');

  console.log('\nAll icons created successfully!');
  console.log('Note: These are placeholder icons. Replace them with proper branded icons before production.');
};

// Run the entire process
createAdditionalFiles().catch(err => {
  console.error('Failed to create files:', err);
  process.exit(1);
});