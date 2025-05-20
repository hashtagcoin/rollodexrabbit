/**
 * Cross-platform PDF viewer selector.
 * Only import this file in shared code. Never import .native or .web directly.
 *
 * - On native (iOS/Android): uses react-native-pdf
 * - On web: uses react-pdf (if enabled) or shows a fallback message
 */
import { Platform } from 'react-native';

let PdfViewer: any;
if (Platform.OS === 'web') {
  PdfViewer = require('./PdfViewer.web').default;
} else {
  PdfViewer = require('./PdfViewer.native').default;
}

export default PdfViewer;
