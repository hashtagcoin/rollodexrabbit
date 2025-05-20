declare module 'react-native-signature-canvas' {
  import * as React from 'react';
  export interface SignatureCanvasProps {
    onOK: (signature: string) => void;
    onEmpty?: () => void;
    onClear?: () => void;
    descriptionText?: string;
    clearText?: string;
    confirmText?: string;
    webStyle?: string;
    autoClear?: boolean;
    style?: object;
  }
  export interface SignatureViewRef {
    clearSignature(): void;
    readSignature(): void;
    changePenColor(color: string): void;
    changePenSize(size: number): void;
    cropWhitespace(): void;
  }
  const Signature: React.ForwardRefExoticComponent<
    SignatureCanvasProps & React.RefAttributes<SignatureViewRef>
  >;
  export default Signature;
}
