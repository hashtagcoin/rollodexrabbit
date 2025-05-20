// app/(agreements)/SignaturePad.tsx
import { Platform } from 'react-native';
import SignaturePadNativeComponent from './SignaturePad.native';
import SignaturePadWebComponent from './SignaturePad.web';
// SignaturePadRef is exported from .native.tsx and should be suitable for both platforms
// or a combined/generic ref type should be defined if they diverge significantly.
import type { SignaturePadRef as ActualSignaturePadRef } from './SignaturePad.native';

const SignaturePadComponent = Platform.select({
  native: SignaturePadNativeComponent, // This covers 'ios' and 'android'
  web: SignaturePadWebComponent,
  default: SignaturePadWebComponent, // Fallback for any other platforms, e.g., windows, macos
});

// Re-export the SignaturePadRef type so service-agreement.tsx can import it from './SignaturePad'
export type SignaturePadRef = ActualSignaturePadRef;

export default SignaturePadComponent;
