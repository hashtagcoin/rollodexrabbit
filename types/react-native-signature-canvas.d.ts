declare module 'react-native-signature-canvas' {
  import * as React from 'react';
  export interface SignatureCanvasProps {
    onOK: (signature: string) => void;
    onEmpty?: () => void;
    descriptionText?: string;
    clearText?: string;
    confirmText?: string;
    webStyle?: string;
  }
  const Signature: React.ComponentType<SignatureCanvasProps>;
  export default Signature;
}
