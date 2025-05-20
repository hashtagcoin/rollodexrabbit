// app/(agreements)/SignaturePad.web.tsx
import React, { useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SignaturePadRef } from './SignaturePad.native'; // Import ref type for consistency

interface SignaturePadWebProps {
  style?: any;
  onSave: (result: { encoded: string; pathName: string }) => void;
  onDraw: () => void;
}

const SignaturePadWeb = forwardRef<SignaturePadRef, SignaturePadWebProps>(
  (props, ref) => {
    useImperativeHandle(ref, () => ({
      saveImage: () => {
        console.warn('saveImage called on web SignaturePad');
      },
      resetImage: () => {
        console.warn('resetImage called on web SignaturePad');
      },
    }));

    return (
      <View style={[styles.container, props.style]}>
        <Text style={styles.message}>
          Signature capture is not available on the web. Please use the mobile app to sign.
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  message: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 16,
  },
});

export default SignaturePadWeb;
