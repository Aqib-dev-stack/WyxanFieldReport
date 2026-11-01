import { usePreventRemove } from '@react-navigation/native';
import { Camera, Images, Smartphone } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  ActionSheet,
  AppButton,
  PermissionNotice,
  PHOTO_GRID_COLUMNS,
  PHOTO_GRID_GAP,
  PhotoGrid,
  Screen,
  useToast,
} from '@components';
import {
  COLORS,
  RADIUS,
  REPORT_LIMITS,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '@config';
import { useComposeForm } from '@hooks/useComposeForm';
import { usePhotoPicker } from '@hooks/usePhotoPicker';

import type { PhotoSource } from '@app-types';
import type { ActionSheetOption } from '@components';
import type { RootStackScreenProps } from '@navigation/types';
import type { ReportDraftErrors } from '@utils/validation';

const SAVED_MESSAGE = 'Saved on phone. It will upload automatically.';

/** Counter turns amber in the last 10% so the limit is never a surprise. */
const COUNTER_WARN_AT = REPORT_LIMITS.descriptionMaxLength * 0.9;

const DESCRIPTION_ERRORS: Record<
  NonNullable<ReportDraftErrors['description']>,
  string
> = {
  required: 'Add a short description of what you found.',
  tooLong: `Keep the description under ${REPORT_LIMITS.descriptionMaxLength} characters.`,
};

/** "To save, add a description and at least 1 photo." */
const missingHint = (errors: ReportDraftErrors): string | null => {
  const missing = [
    errors.description === 'required' ? 'a description' : null,
    errors.photos === 'required' ? 'at least 1 photo' : null,
  ].filter(Boolean);
  return missing.length > 0 ? `To save, add ${missing.join(' and ')}.` : null;
};

/**
 * New report: description + 1–5 photos. Saving is local and instant; the
 * upload happens later, on its own. Leaving with unsaved input asks first.
 */
const Compose = ({ navigation }: RootStackScreenProps<'Compose'>) => {
  const form = useComposeForm();
  const picker = usePhotoPicker();
  const showToast = useToast();
  const { width } = useWindowDimensions();
  const [sheetOpen, setSheetOpen] = useState(false);

  const tileSize = Math.floor(
    (width - SPACING.lg * 2 - PHOTO_GRID_GAP * (PHOTO_GRID_COLUMNS - 1)) /
      PHOTO_GRID_COLUMNS,
  );

  // Ask before throwing away a half-written report (back button, gesture).
  usePreventRemove(form.isDirty && form.phase === 'editing', ({ data }) => {
    Alert.alert(
      'Discard this report?',
      'The description and photos you added will be lost.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });

  // Navigate only after the "saved" state has rendered, so the discard
  // guard above is already off.
  useEffect(() => {
    if (form.phase === 'saved') {
      showToast(
        SAVED_MESSAGE,
        <Smartphone size={SIZES.iconMd} color={COLORS.onPrimary} />,
      );
      navigation.popTo('MainTabs', { screen: 'Outbox' });
    }
  }, [form.phase, navigation, showToast]);

  const { pick } = picker;
  const { addPhotos, remainingPhotos } = form;
  const pickFrom = useCallback(
    async (source: PhotoSource) => {
      addPhotos(await pick(source, remainingPhotos));
    },
    [addPhotos, pick, remainingPhotos],
  );

  const sheetOptions: ActionSheetOption[] = [
    {
      key: 'camera',
      label: 'Take photo',
      icon: <Camera size={SIZES.iconMd} color={COLORS.textPrimary} />,
      onPress: () => {
        pickFrom('camera').catch(() => undefined);
      },
    },
    {
      key: 'gallery',
      label: 'Choose from gallery',
      icon: <Images size={SIZES.iconMd} color={COLORS.textPrimary} />,
      onPress: () => {
        pickFrom('gallery').catch(() => undefined);
      },
    },
  ];

  const descriptionLength = form.description.length;
  const descriptionError =
    form.descriptionTouched && form.errors.description
      ? DESCRIPTION_ERRORS[form.errors.description]
      : null;
  const hint = missingHint(form.errors);

  return (
    <Screen padded={false} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Description */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label} nativeID="descriptionLabel">
              Description
            </Text>
            <Text
              style={[
                styles.counter,
                descriptionLength >= COUNTER_WARN_AT && styles.counterWarn,
              ]}
              accessibilityLabel={`${descriptionLength} of ${REPORT_LIMITS.descriptionMaxLength} characters`}
            >
              {descriptionLength} / {REPORT_LIMITS.descriptionMaxLength}
            </Text>
          </View>
          <TextInput
            value={form.description}
            onChangeText={form.setDescription}
            onBlur={form.touchDescription}
            placeholder="What did you find, and where exactly?"
            placeholderTextColor={COLORS.textDisabled}
            multiline
            textAlignVertical="top"
            maxLength={REPORT_LIMITS.descriptionMaxLength}
            accessibilityLabelledBy="descriptionLabel"
            accessibilityLabel="Description"
            style={[styles.input, descriptionError && styles.inputError]}
          />
          {descriptionError ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {descriptionError}
            </Text>
          ) : null}
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Photos</Text>
            <Text style={styles.counter}>
              {form.photos.length} of {REPORT_LIMITS.maxImages}
            </Text>
          </View>
          <Text style={styles.helper}>
            Add {REPORT_LIMITS.minImages} to {REPORT_LIMITS.maxImages} photos.
            The first one is the cover.
          </Text>

          {picker.blockedSource ? (
            <PermissionNotice
              source={picker.blockedSource}
              onOpenSettings={picker.openSettings}
              onDismiss={picker.dismissBlocked}
            />
          ) : null}

          <PhotoGrid
            photos={form.photos}
            max={REPORT_LIMITS.maxImages}
            tileSize={tileSize}
            onAdd={() => setSheetOpen(true)}
            onRemove={form.removePhoto}
          />
        </View>
      </ScrollView>

      {/* Footer stays above the keyboard and the navigation bar. */}
      <View style={styles.footer}>
        {hint ? <Text style={styles.footerHint}>{hint}</Text> : null}
        <AppButton
          title="Save report"
          disabled={!form.isValid}
          loading={form.phase === 'saving'}
          accessibilityHint={hint ?? 'Saves the report on this phone'}
          onPress={() => {
            form.submit().catch(() => undefined);
          }}
        />
      </View>

      <ActionSheet
        visible={sheetOpen}
        title="Add a photo"
        options={sheetOptions}
        onClose={() => setSheetOpen(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.xl },
  section: { gap: SPACING.sm },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  label: { ...TYPOGRAPHY.headline, color: COLORS.textPrimary },
  counter: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  counterWarn: { color: COLORS.warning, fontWeight: '600' },
  helper: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  input: {
    ...TYPOGRAPHY.body,
    minHeight: 132,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
  },
  inputError: { borderColor: COLORS.danger },
  error: { ...TYPOGRAPHY.caption, color: COLORS.danger },
  footer: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  footerHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default Compose;
