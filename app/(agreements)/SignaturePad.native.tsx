// app/(agreements)/SignaturePad.native.tsx
import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import SignatureCapture from 'react-native-signature-capture'; // Native import

export interface SignaturePadRef {
  saveImage: () => void;
  resetImage: () => void;
}

interface SignaturePadNativeProps {
  onSave: (result: { encoded: string; pathName: string }) => void;
  onDraw: () => void;
  style?: any;
}

const SignaturePadNative = forwardRef<SignaturePadRef, SignaturePadNativeProps>(
  (props, ref) => {
    const nativeSignatureRef = useRef<SignatureCapture>(null);

    useImperativeHandle(ref, () => ({
      saveImage: () => {
        nativeSignatureRef.current?.saveImage();
      },
      resetImage: () => {
        nativeSignatureRef.current?.resetImage();
      },
    }));

    return (
      <SignatureCapture
        ref={nativeSignatureRef}
        style={[styles.defaultCanvas, props.style]}
        onSaveEvent={props.onSave}
        onDragEvent={props.onDraw}
        saveImageFileInExtStorage={false}
        showNativeButtons={false}
        showTitleLabel={false}
        {...(Platform.OS === 'android' ? { minStrokeWidth: 4, maxStrokeWidth: 8 } : {})}
      />
    );
  }
);

const styles = StyleSheet.create({
  defaultCanvas: {
    width: '100%', // Default width
    height: 200,   // Default height
  },
});

export default SignaturePadNative;
