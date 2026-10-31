/**
 * File uploads are intentionally disabled. Keeping binary payloads out of
 * Firestore protects the free-tier write quota and keeps list reads fast.
 */
export const FILE_UPLOADS_ENABLED = false;

export const FILE_UPLOAD_DISABLED_MESSAGE =
  'File uploads are disabled to protect database performance. Existing documents and image presets remain available.';
