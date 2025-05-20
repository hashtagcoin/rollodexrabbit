import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Pdf from 'react-native-pdf';

interface PdfViewerProps {
  uri: string;
  style?: any;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ uri, style }) => {
  const source = { uri, cache: true };
  return (
    <View style={[styles.container, style]}>
      <Pdf
        source={source}
        style={styles.pdf}
        onError={error => {
          console.warn('PDF load error:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height / 2,
  },
});

export default PdfViewer;
