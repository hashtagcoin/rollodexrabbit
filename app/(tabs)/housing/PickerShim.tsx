import React from 'react';
import { Platform } from 'react-native';

// Use the community picker if available, otherwise fallback to native select for web
let Picker: any;
try {
  Picker = require('@react-native-picker/picker').Picker;
} catch {
  Picker = ({ selectedValue, onValueChange, children, style }: any) => (
    <select
      value={selectedValue}
      onChange={e => onValueChange(e.target.value)}
      style={{ ...style, padding: 8, borderRadius: 8, borderColor: '#ccc', borderWidth: 1 }}
    >
      {React.Children.map(children, child =>
        React.cloneElement(child, { value: child.props.value })
      )}
    </select>
  );
}

export { Picker };

export default function PickerShimPlaceholder() {
  return null;
}
