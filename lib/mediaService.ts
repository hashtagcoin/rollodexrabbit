import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

// Supported file types and their MIME types
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
];

const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
];

// Maximum file sizes in bytes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Error types
export enum MediaErrorType {
  UNSUPPORTED_TYPE = 'UNSUPPORTED_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  INVALID_FILE = 'INVALID_FILE',
}

export class MediaError extends Error {
  type: MediaErrorType;
  
  constructor(message: string, type: MediaErrorType) {
    super(message);
    this.type = type;
    this.name = 'MediaError';
  }
}

// Media bucket types
export type BucketName = 
  | 'avatars'
  | 'group-avatars'
  | 'group-posts'
  | 'housing-listings'
  | 'service-providers'
  | 'ndis-documents';

// Validate file based on type and size
export function validateFile(
  file: File | Blob,
  type: 'image' | 'video' | 'document',
): boolean {
  const fileType = file.type;
  const fileSize = file.size;
  
  switch (type) {
    case 'image':
      if (!SUPPORTED_IMAGE_TYPES.includes(fileType)) {
        throw new MediaError(
          `Unsupported image type: ${fileType}. Supported types: ${SUPPORTED_IMAGE_TYPES.join(', ')}`,
          MediaErrorType.UNSUPPORTED_TYPE
        );
      }
      if (fileSize > MAX_IMAGE_SIZE) {
        throw new MediaError(
          `Image too large: ${(fileSize / (1024 * 1024)).toFixed(2)}MB. Maximum size: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
          MediaErrorType.FILE_TOO_LARGE
        );
      }
      break;
      
    case 'video':
      if (!SUPPORTED_VIDEO_TYPES.includes(fileType)) {
        throw new MediaError(
          `Unsupported video type: ${fileType}. Supported types: ${SUPPORTED_VIDEO_TYPES.join(', ')}`,
          MediaErrorType.UNSUPPORTED_TYPE
        );
      }
      if (fileSize > MAX_VIDEO_SIZE) {
        throw new MediaError(
          `Video too large: ${(fileSize / (1024 * 1024)).toFixed(2)}MB. Maximum size: ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`,
          MediaErrorType.FILE_TOO_LARGE
        );
      }
      break;
      
    case 'document':
      if (!SUPPORTED_DOCUMENT_TYPES.includes(fileType)) {
        throw new MediaError(
          `Unsupported document type: ${fileType}. Supported types: ${SUPPORTED_DOCUMENT_TYPES.join(', ')}`,
          MediaErrorType.UNSUPPORTED_TYPE
        );
      }
      if (fileSize > MAX_DOCUMENT_SIZE) {
        throw new MediaError(
          `Document too large: ${(fileSize / (1024 * 1024)).toFixed(2)}MB. Maximum size: ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB`,
          MediaErrorType.FILE_TOO_LARGE
        );
      }
      break;
      
    default:
      throw new MediaError(
        `Invalid file type category: ${type}`,
        MediaErrorType.INVALID_FILE
      );
  }
  
  return true;
}

// Generate a unique filename
export function generateUniqueFilename(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const fileExt = originalName.split('.').pop();
  
  return `${userId}-${timestamp}-${randomString}.${fileExt}`;
}

// Upload file to Supabase Storage with improved error handling and file processing
export async function uploadMedia(
  file: File | Blob,
  bucket: BucketName,
  path: string,
  fileType: 'image' | 'video' | 'document',
  isPublic: boolean = false,
  metadata: Record<string, string> = {}
): Promise<string> {
  try {
    // Validate file
    validateFile(file, fileType);
    
    console.log(`Uploading file to ${bucket}/${path}, size: ${file.size} bytes, type: ${file.type}`);
    
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Changed to true to overwrite any existing files with the same name
        contentType: file.type,
      });
      
    if (error) {
      console.error('Upload error details:', error);
      throw new MediaError(
        `Failed to upload file: ${error.message}`,
        MediaErrorType.UPLOAD_FAILED
      );
    }
    
    console.log('File uploaded successfully. Getting URL...');
    
    // Get URL based on access type
    if (isPublic) {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      
      console.log('Got public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } else {
      const { data: urlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days expiry
        
      if (signedUrlError) {
        console.error('Signed URL error details:', signedUrlError);
        throw new MediaError(
          `Failed to generate signed URL: ${signedUrlError.message}`,
          MediaErrorType.DOWNLOAD_FAILED
        );
      }
      
      console.log('Got signed URL:', urlData.signedUrl);
      return urlData.signedUrl;
    }
  } catch (error) {
    if (error instanceof MediaError) {
      throw error;
    }
    
    console.error('Unexpected upload error:', error);
    throw new MediaError(
      `Unexpected error during upload: ${error instanceof Error ? error.message : String(error)}`,
      MediaErrorType.UPLOAD_FAILED
    );
  }
}

// Alternative upload method using Expo FileSystem for more reliable handling
export async function uploadFromUri(
  uri: string,
  bucket: BucketName,
  path: string,
  fileType: 'image' | 'video' | 'document',
  isPublic: boolean = false
): Promise<string> {
  try {
    console.log(`Starting upload from URI: ${uri}`);
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new MediaError(
        `File does not exist at path: ${uri}`,
        MediaErrorType.INVALID_FILE
      );
    }
    
    console.log(`File exists, size: ${fileInfo.size} bytes`);
    
    // Check file size
    if (fileType === 'image' && fileInfo.size > MAX_IMAGE_SIZE) {
      throw new MediaError(
        `Image too large: ${(fileInfo.size / (1024 * 1024)).toFixed(2)}MB. Maximum size: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
        MediaErrorType.FILE_TOO_LARGE
      );
    }
    
    // Convert to base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    if (!base64) {
      throw new MediaError(
        'Failed to read file as base64',
        MediaErrorType.INVALID_FILE
      );
    }
    
    console.log(`File converted to base64, length: ${base64.length}`);
    
    // Create array buffer from base64
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;
    
    // Determine content type based on file extension
    const fileExt = uri.split('.').pop()?.toLowerCase() || '';
    let contentType = 'application/octet-stream';
    
    if (fileType === 'image') {
      switch (fileExt) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
      }
    }
    
    console.log(`Uploading with content type: ${contentType}`);
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType,
        upsert: true,
      });
      
    if (error) {
      console.error('Upload error details:', error);
      throw new MediaError(
        `Failed to upload file: ${error.message}`,
        MediaErrorType.UPLOAD_FAILED
      );
    }
    
    console.log('File uploaded successfully through FileSystem API');
    
    // Get URL based on access type
    if (isPublic) {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      
      console.log('Got public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } else {
      const { data: urlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60 * 24 * 7);
        
      if (signedUrlError) {
        throw new MediaError(
          `Failed to generate signed URL: ${signedUrlError.message}`,
          MediaErrorType.DOWNLOAD_FAILED
        );
      }
      
      console.log('Got signed URL:', urlData.signedUrl);
      return urlData.signedUrl;
    }
  } catch (error) {
    if (error instanceof MediaError) {
      throw error;
    }
    
    console.error('Unexpected uploadFromUri error:', error);
    throw new MediaError(
      `Unexpected error during upload from URI: ${error instanceof Error ? error.message : String(error)}`,
      MediaErrorType.UPLOAD_FAILED
    );
  }
}

// Delete file from Supabase Storage
export async function deleteMedia(
  bucket: BucketName,
  path: string
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
      
    if (error) {
      throw new MediaError(
        `Failed to delete file: ${error.message}`,
        MediaErrorType.DELETE_FAILED
      );
    }
  } catch (error) {
    if (error instanceof MediaError) {
      throw error;
    }
    
    throw new MediaError(
      `Unexpected error during deletion: ${error instanceof Error ? error.message : String(error)}`,
      MediaErrorType.DELETE_FAILED
    );
  }
}

// Get a signed URL for a file (for private files)
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn: number = 60 * 60 // 1 hour by default
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
      
    if (error) {
      throw new MediaError(
        `Failed to generate signed URL: ${error.message}`,
        MediaErrorType.DOWNLOAD_FAILED
      );
    }
    
    return data.signedUrl;
  } catch (error) {
    if (error instanceof MediaError) {
      throw error;
    }
    
    throw new MediaError(
      `Unexpected error getting signed URL: ${error instanceof Error ? error.message : String(error)}`,
      MediaErrorType.DOWNLOAD_FAILED
    );
  }
}

// Get a public URL for a file (for public files)
export function getPublicUrl(
  bucket: BucketName,
  path: string
): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
    
  return data.publicUrl;
}

// Helper to extract filename from a URL
export function getFilenameFromUrl(url: string): string {
  return url.split('/').pop() || '';
}

// Helper to determine if a URL is from Supabase Storage
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage/v1/object/public') || 
         url.includes('supabase.co/storage/v1/object/sign');
}
