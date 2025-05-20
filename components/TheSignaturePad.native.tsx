import React from 'react';
import { Platform } from 'react-native';
import SignatureCapture from 'react-native-signature-capture';
// Assuming SignaturePadRef is now defined in app/(agreements)/SignaturePad.native.tsx
import type { SignaturePadRef } from '../app/(agreements)/SignaturePad.native';

interface TheSignaturePadNativeProps {
  signatureRef: React.RefObject<SignaturePadRef | null>; // Use the imported SignaturePadRef
  onSaveEvent: (result: { encoded: string; pathName: string; }) => void;
  onDragEvent: () => void;
  style: any; // Style for the SignatureCapture component itself
}

const TheSignaturePad: React.FC<TheSignaturePadNativeProps> = (props) => {
  return (
    <SignatureCapture
      ref={props.signatureRef as any} // Cast to any due to potential library ref type complexities
      style={props.style}
      onSaveEvent={props.onSaveEvent}
      onDragEvent={props.onDragEvent}
      saveImageFileInExtStorage={false}
      showNativeButtons={false}
      showTitleLabel={false}
      {...(Platform.OS === 'android' ? { minStrokeWidth: 4, maxStrokeWidth: 8 } : {})}
    />
  );
};

export default TheSignaturePad;
