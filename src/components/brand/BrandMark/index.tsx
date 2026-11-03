import Svg, { Path, Rect } from 'react-native-svg';

import { COLORS } from '@config';

export type BrandMarkProps = {
  size: number;
  /**
   * Colour of the X. In the WYXAN logo the X is cut out of the red square,
   * so it shows whatever is behind it: pass the background colour.
   */
  xColor?: string;
};

/**
 * The WYXAN mark as a vector: a red square with a four-pointed X whose
 * points reach the corners. Vector, so it is sharp at every size (the
 * bitmap logos available were 211 px).
 */
const BrandMark = ({ size, xColor = COLORS.header }: BrandMarkProps) => (
  <Svg width={size} height={size} viewBox="0 0 96 96" accessible={false}>
    <Rect x={0} y={0} width={96} height={96} fill={COLORS.brand} />
    <Path
      d="M0,0 L48,39.55 L96,0 L56.45,48 L96,96 L48,56.45 L0,96 L39.55,48 Z"
      fill={xColor}
    />
  </Svg>
);

export default BrandMark;
