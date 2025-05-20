/**
 * Converts a base64 string to an ArrayBuffer
 * @param {string} base64 - The base64 string to convert
 * @returns {ArrayBuffer} - The converted ArrayBuffer
 */
export function decode(base64) {
  // Remove data URL prefix if present
  const base64Data = base64.split(',')[1] || base64;
  
  // Convert base64 to binary string
  const binaryString = atob(base64Data);
  
  // Create ArrayBuffer with the length of the binary string
  const bytes = new Uint8Array(binaryString.length);
  
  // Fill the ArrayBuffer with binary data
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Converts an ArrayBuffer to a base64 string
 * @param {ArrayBuffer} buffer - The ArrayBuffer to convert
 * @returns {string} - The base64 encoded string
 */
export function encode(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}
