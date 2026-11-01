import { Image as ImageIcon } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { COLORS, RADIUS, SIZES } from '@config';

export type PhotoThumbnailProps = {
  /** Local file URI; `null` shows a neutral placeholder (mock data, missing file). */
  uri: string | null;
  size?: number;
};

/** Square photo preview. Decorative: the parent describes the report. */
const PhotoThumbnail = ({ uri, size = 64 }: PhotoThumbnailProps) => (
  <View
    style={[styles.frame, { width: size, height: size }]}
    importantForAccessibility="no-hide-descendants"
  >
    {uri ? (
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
        // Decode a small bitmap, not the full 4000x3000 original (memory, jank).
        resizeMethod="resize"
      />
    ) : (
      <ImageIcon size={SIZES.iconMd} color={COLORS.textDisabled} />
    )}
  </View>
);

const styles = StyleSheet.create({
  frame: {
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
});

export default PhotoThumbnail;
