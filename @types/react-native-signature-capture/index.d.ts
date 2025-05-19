import * as React from 'react';

export interface SignatureCaptureRef {
  resetImage: () => void;
  saveImage: () => void;
}

export interface SignatureCaptureProps {
  ref?: React.RefObject<SignatureCaptureRef>;
  style?: any;
  onSaveEvent?: (result: { encoded: string; pathName: string }) => void;
  onDragEvent?: () => void;
  saveImageFileInExtStorage?: boolean;
  showNativeButtons?: boolean;
  showTitleLabel?: boolean;
  viewMode?: 'portrait' | 'landscape';
  minStrokeWidth?: number;
  maxStrokeWidth?: number;
}

declare const SignatureCapture: React.FC<SignatureCaptureProps>;

export default SignatureCapture;
