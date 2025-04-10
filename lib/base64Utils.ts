/**
 * Utility functions for working with base64 data
 */

/**
 * Decode a base64 string to an ArrayBuffer for use with Supabase storage
 */
export function decode(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
