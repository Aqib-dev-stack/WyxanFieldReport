import {
  CircleAlert,
  CircleCheck,
  Clock,
  CloudCog,
  CloudOff,
  CloudUpload,
  ImageDown,
} from 'lucide-react-native';

import type { ReportImageStatus, ReportStatus } from '@app-types';
import type { LucideIcon } from 'lucide-react-native';

export type StatusAppearance = {
  icon: LucideIcon;
  /** Text and icon colour. All pass WCAG AA (4.5:1) on white. */
  color: string;
  /** Soft background for the badge. */
  tint: string;
};

/**
 * Every status has its own colour AND its own icon, so no state depends on
 * colour alone (colour-blind users, glare on the screen outdoors).
 */
export const STATUS_APPEARANCE: Record<ReportStatus, StatusAppearance> = {
  queued: { icon: Clock, color: '#4A5A6E', tint: '#EDF0F4' },
  waitingNet: { icon: CloudOff, color: '#8A5A00', tint: '#FBF3E4' },
  compressing: { icon: ImageDown, color: '#6B4FB3', tint: '#F1EDFA' },
  uploading: { icon: CloudUpload, color: '#1F5FAD', tint: '#E8F0FA' },
  committing: { icon: CloudCog, color: '#0F6E73', tint: '#E4F3F3' },
  uploaded: { icon: CircleCheck, color: '#2E7D4F', tint: '#E7F4EC' },
  failed: { icon: CircleAlert, color: '#C62828', tint: '#FBEAEA' },
};

/** A photo's state as shown in Report detail; `sending` = the one in flight. */
export type PhotoDisplayStatus = ReportImageStatus | 'sending';

export const PHOTO_STATUS_APPEARANCE: Record<
  PhotoDisplayStatus,
  StatusAppearance & { label: string }
> = {
  pending: { label: 'Waiting', ...STATUS_APPEARANCE.queued },
  compressed: { label: 'Ready to send', ...STATUS_APPEARANCE.compressing },
  sending: { label: 'Sending…', ...STATUS_APPEARANCE.uploading },
  uploaded: { label: 'On server', ...STATUS_APPEARANCE.uploaded },
  failed: { label: 'Not sent', ...STATUS_APPEARANCE.failed },
};
