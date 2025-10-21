import React, { forwardRef } from 'react';
import type { QRCodeCanvasProps } from '@rc-component/qrcode';
import { QRCodeCanvas } from '@rc-component/qrcode';

/**
 * Lightweight compatibility wrapper that re-exports the canvas-based QRCode component
 * from `@rc-component/qrcode` using the same named/default export convention as
 * `qrcode.react`. This allows the rest of the codebase to import `QRCode` from
 * `qrcode.react` without relying on the external CDN service that was previously
 * used to fetch QR images.
 */
const QRCode = forwardRef<HTMLCanvasElement, QRCodeCanvasProps>((props, ref) => (
  <QRCodeCanvas ref={ref} {...props} />
));

QRCode.displayName = 'QRCode';

export type { QRCodeCanvasProps as QRCodeProps };
export { QRCode };
export default QRCode;
