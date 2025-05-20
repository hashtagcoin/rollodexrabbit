/**
 * Converts a base64 string to an ArrayBuffer
 * @param base64 - The base64 string to convert
 * @returns The converted ArrayBuffer
 */
export function decode(base64: string): ArrayBuffer;

/**
 * Converts an ArrayBuffer to a base64 string
 * @param buffer - The ArrayBuffer to convert
 * @returns The base64 encoded string
 */
export function encode(buffer: ArrayBuffer): string;
