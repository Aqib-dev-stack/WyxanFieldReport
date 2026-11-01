import { Plus, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SIZES, SPACING, TYPOGRAPHY } from '@config';

import PhotoThumbnail from '../PhotoThumbnail';

import type { DraftPhoto } from '@app-types';

export type PhotoGridProps = {
  photos: DraftPhoto[];
  /** Total slots, i.e. the photo limit. */
  max: number;
  /** Width of one tile; the parent works it out from the screen width. */
  tileSize: number;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

const COLUMNS = 3;
export const PHOTO_GRID_GAP = SPACING.sm;
export const PHOTO_GRID_COLUMNS = COLUMNS;

/**
 * Fixed grid of `max` slots, so the limit can be seen at a glance: filled
 * photos, then one "Add photo" tile, then empty slots. With every slot full
 * there is no add tile, so a 6th photo can't be added.
 */
const PhotoGrid = ({
  photos,
  max,
  tileSize,
  onAdd,
  onRemove,
}: PhotoGridProps) => {
  const emptySlots = Math.max(0, max - photos.length - 1);
  const canAdd = photos.length < max;

  return (
    <View style={styles.grid}>
      {photos.map((photo, index) => (
        <View key={photo.id} style={{ width: tileSize, height: tileSize }}>
          {/* Grouped for screen readers; the remove button stays separate. */}
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Photo ${index + 1} of ${photos.length}${
              index === 0 ? ', cover photo' : ''
            }`}
          >
            <PhotoThumbnail uri={photo.uri} size={tileSize} />
            {index === 0 ? (
              <View style={styles.coverBadge}>
                <Text style={styles.coverText}>Cover</Text>
              </View>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove photo ${index + 1}`}
            onPress={() => onRemove(photo.id)}
            // 28dp visible circle, 48dp touch area.
            hitSlop={10}
            style={({ pressed }) => [
              styles.removeButton,
              pressed && styles.pressed,
            ]}
          >
            <X size={SIZES.iconSm} color={COLORS.onPrimary} strokeWidth={3} />
          </Pressable>
        </View>
      ))}

      {canAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add photo, ${photos.length} of ${max} added`}
          onPress={onAdd}
          android_ripple={{ color: COLORS.ripple }}
          style={({ pressed }) => [
            styles.tile,
            styles.addTile,
            { width: tileSize, height: tileSize },
            pressed && styles.pressed,
          ]}
        >
          <Plus size={SIZES.iconLg} color={COLORS.primary} />
          <Text style={styles.addText}>Add photo</Text>
        </Pressable>
      ) : null}

      {Array.from({ length: emptySlots }, (_, i) => (
        <View
          key={`empty-${i}`}
          importantForAccessibility="no"
          style={[
            styles.tile,
            styles.emptyTile,
            { width: tileSize, height: tileSize },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: PHOTO_GRID_GAP },
  tile: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addTile: {
    gap: SPACING.xs,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: '#E8F0FA',
  },
  addText: { ...TYPOGRAPHY.label, color: COLORS.primary },
  emptyTile: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  coverBadge: {
    position: 'absolute',
    left: SPACING.xs,
    bottom: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(20, 32, 46, 0.75)',
  },
  coverText: { ...TYPOGRAPHY.caption, color: COLORS.onPrimary },
  removeButton: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 28,
    height: 28,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 32, 46, 0.75)',
  },
  pressed: { opacity: 0.7 },
});

export default PhotoGrid;
