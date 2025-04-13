declare module 'react-native-shadow' {
  import { ReactNode } from 'react';
  import { ViewStyle } from 'react-native';

  interface BoxShadowSettings {
    width: number;
    height: number;
    color?: string;
    border?: number;
    radius?: number;
    opacity?: number;
    x?: number;
    y?: number;
    style?: ViewStyle;
  }

  interface BoxShadowProps {
    setting: BoxShadowSettings;
    children?: ReactNode;
  }

  export class BoxShadow extends React.Component<BoxShadowProps> {}
}
