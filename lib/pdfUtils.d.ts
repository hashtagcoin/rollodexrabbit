/**
 * Creates a simple PDF document with the given content
 * @param title - The title of the document
 * @param content - The content to include in the PDF
 * @returns A promise that resolves to the generated PDF as a Uint8Array
 */
export declare function createSimplePdf(title: string, content: string): Promise<Uint8Array>;

/**
 * Saves a PDF file to the device's document directory
 * @param pdfBytes - The PDF data as a Uint8Array
 * @param filename - The name of the file to save
 * @returns A promise that resolves to the path where the file was saved
 */
export declare function savePdfToDevice(pdfBytes: Uint8Array, filename: string): Promise<string>;

/**
 * Opens a PDF file using the device's default PDF viewer
 * @param fileUri - The URI of the PDF file to open
 * @returns A promise that resolves when the PDF is opened
 */
export declare function openPdf(fileUri: string): Promise<void>;
