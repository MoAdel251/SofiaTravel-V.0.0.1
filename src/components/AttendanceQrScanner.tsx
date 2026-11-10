import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, QrCode, X, ScanLine, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AttendanceQrScannerProps {
  open: boolean;
  onClose: () => void;
  /** Called with the raw scanned/pasted token (or full QR URL). */
  onToken: (token: string) => void;
}

/**
 * Camera scanner for the company attendance QR code.
 *
 * Uses the native BarcodeDetector API (Chrome/Android, Edge) so no extra
 * scanner dependency ships to the browser. When the API or the camera is not
 * available the employee can paste the code/link manually. The scanned token
 * is only forwarded to the caller; the server validates it and still requires
 * GPS coordinates before any attendance is recorded.
 */
export function AttendanceQrScanner({ open, onClose, onToken }: AttendanceQrScannerProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handledRef = useRef(false);

  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(false);

  const stopCamera = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleDetected = (raw: string) => {
    if (handledRef.current) return;
    const value = String(raw || '').trim();
    if (!value) return;
    handledRef.current = true;
    stopCamera();
    onToken(value);
  };

  const startCamera = async () => {
    setError('');
    handledRef.current = false;
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      setError(
        isAr
          ? 'المتصفح لا يدعم مسح رمز QR بالكاميرا. أدخل الرمز أو افتح الرابط يدوياً.'
          : 'This browser cannot scan QR codes with the camera. Paste the code or open the link manually.'
      );
      return;
    }
    try {
      detectorRef.current = new Detector({ formats: ['qr_code'] });
    } catch {
      detectorRef.current = new Detector();
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      scanTimerRef.current = setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || handledRef.current) return;
        try {
          const codes = await detectorRef.current.detect(video);
          const value = codes?.[0]?.rawValue;
          if (value) handleDetected(value);
        } catch {
          // Ignore transient decode errors and keep scanning.
        }
      }, 500);
    } catch (err: any) {
      setError(
        err?.name === 'NotAllowedError'
          ? (isAr ? 'تم رفض إذن الكاميرا.' : 'Camera permission was denied.')
          : (isAr ? 'تعذر تشغيل الكاميرا على هذا الجهاز.' : 'Could not start the camera on this device.')
      );
      stopCamera();
    }
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      setManualCode('');
      setError('');
      return;
    }
    setScannerSupported(typeof window !== 'undefined' && Boolean((window as any).BarcodeDetector));
    void startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-300" />
            <h3 className="text-sm font-extrabold">
              {isAr ? 'مسح رمز الحضور' : 'Scan Attendance QR'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => { stopCamera(); onClose(); }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {isAr
              ? 'وجّه الكاميرا نحو رمز QR الرسمي للشركة. سيتم التحقق من موقعك الجغرافي على السيرفر قبل تسجيل الحضور أو الانصراف.'
              : 'Point the camera at the official company QR code. Your GPS location is still verified on the server before check-in or check-out is recorded.'}
          </p>

          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-square">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
            />
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                <CameraOff className="w-8 h-8" />
                <span className="text-[11px] font-semibold">
                  {isAr ? 'الكاميرا غير مفعّلة' : 'Camera is off'}
                </span>
              </div>
            )}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-cyan-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]" />
                <ScanLine className="w-6 h-6 text-cyan-300 absolute animate-pulse" />
              </div>
            )}
          </div>

          {!cameraActive && (
            <button
              type="button"
              onClick={() => void startCamera()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              <Camera className="w-4 h-4" />
              {isAr ? 'تشغيل الكاميرا' : 'Start Camera'}
            </button>
          )}

          {!scannerSupported && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                {isAr
                  ? 'المسح بالكاميرا غير مدعوم في هذا المتصفح. استخدم إدخال الرمز اليدوي أدناه.'
                  : 'Camera scanning is not supported in this browser. Use the manual code entry below.'}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600">
              {isAr ? 'أو أدخل رمز QR / الرابط يدوياً' : 'Or paste the QR code / link manually'}
            </label>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="ATTQR-..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => handleDetected(manualCode)}
                disabled={!manualCode.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
              >
                {isAr ? 'تأكيد' : 'Apply'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
