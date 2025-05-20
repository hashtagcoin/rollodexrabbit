import React from 'react';
import { View, Text } from 'react-native';

interface TheSignaturePadWebProps {
  style?: any; // Style for the container
  messageStyle?: any; // Style for the message text
  // Accept same props as native for API compatibility, even if not used
  signatureRef?: React.RefObject<any | null>;
  onSaveEvent?: (result: { encoded: string; pathName: string; }) => void;
  onDragEvent?: () => void;
}

const TheSignaturePad: React.FC<TheSignaturePadWebProps> = ({ style, messageStyle }) => {
  return (
    <View style={style || {padding: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ccc', marginVertical: 10}}>
      <Text style={messageStyle || {textAlign: 'center', color: '#555'}}>
        Signature capture is not available on the web. Please use the mobile app to sign.
      </Text>
    </View>
  );
};

export default TheSignaturePad;
