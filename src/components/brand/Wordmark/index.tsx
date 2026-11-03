import { Image, StyleSheet } from 'react-native';

/** Width ÷ height of the WYXAN wordmark artwork (1208 × 212 on wyxan.com). */
const ASPECT = 1208 / 212;

export type WordmarkProps = {
  /** Height in dp; the width follows the artwork's proportions. */
  height: number;
};

/**
 * "WYXAN" in the brand's own lettering: white letters, red square with the
 * X cut out. For dark surfaces (header, splash). @1x/@2x/@3x PNGs.
 */
const Wordmark = ({ height }: WordmarkProps) => (
  <Image
    source={require('../../../assets/brand/wordmark.png')}
    style={[styles.image, { height, width: height * ASPECT }]}
    accessibilityRole="image"
    accessibilityLabel="WYXAN"
  />
);

const styles = StyleSheet.create({
  image: { resizeMode: 'contain' },
});

export default Wordmark;
