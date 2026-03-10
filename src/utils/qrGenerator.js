import QRCode from 'react-native-qrcode-svg';

// Generate QR code component for React Native
export const generateQRCode = (text) => {
  return text; // Just return the text, component will handle QR generation
};

// Legacy pattern generator (fallback)
export const generateQRPattern = (text, size = 120) => {
  const modules = 21; // Standard QR code size
  const moduleSize = Math.floor(size / modules);
  
  // Create a simple pattern based on text hash
  const hash = simpleHash(text);
  const pattern = [];
  
  for (let row = 0; row < modules; row++) {
    pattern[row] = [];
    for (let col = 0; col < modules; col++) {
      // Create finder patterns (corners)
      if (isFinderPattern(row, col, modules)) {
        pattern[row][col] = 1;
      }
      // Create data pattern based on hash
      else {
        const index = row * modules + col;
        pattern[row][col] = (hash >> (index % 32)) & 1;
      }
    }
  }
  
  return { pattern, moduleSize, modules };
};

const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

const isFinderPattern = (row, col, size) => {
  // Top-left finder pattern
  if (row < 7 && col < 7) {
    return (row === 0 || row === 6 || col === 0 || col === 6 || 
            (row >= 2 && row <= 4 && col >= 2 && col <= 4));
  }
  // Top-right finder pattern
  if (row < 7 && col >= size - 7) {
    const c = col - (size - 7);
    return (row === 0 || row === 6 || c === 0 || c === 6 || 
            (row >= 2 && row <= 4 && c >= 2 && c <= 4));
  }
  // Bottom-left finder pattern
  if (row >= size - 7 && col < 7) {
    const r = row - (size - 7);
    return (r === 0 || r === 6 || col === 0 || col === 6 || 
            (r >= 2 && r <= 4 && col >= 2 && col <= 4));
  }
  return false;
};