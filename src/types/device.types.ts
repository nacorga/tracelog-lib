/**
 * Device type classification for analytics segmentation
 *
 * **Detection Logic**:
 * - Mobile: User agent contains mobile keywords (iPhone, Android phone, etc.)
 * - Tablet: User agent contains tablet keywords (iPad, Android tablet, etc.)
 * - Desktop: Default fallback for non-mobile/tablet devices
 * - Unknown: User agent not detectable or SSR environment
 *
 * **Use Cases**:
 * - Device-specific analytics and dashboards
 * - User experience optimization by device type
 * - Performance monitoring segmented by device
 *
 * @see src/utils/browser/device-detector.utils.ts for detection implementation
 */
export enum DeviceType {
  /** Mobile phones (iPhone, Android phones) */
  Mobile = 'mobile',
  /** Tablet devices (iPad, Android tablets) */
  Tablet = 'tablet',
  /** Desktop computers and laptops */
  Desktop = 'desktop',
  /** Unable to determine device type */
  Unknown = 'unknown',
}
