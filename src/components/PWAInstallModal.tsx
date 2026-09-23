import React, { useState } from 'react';
import { 
  Smartphone, 
  Share, 
  PlusSquare, 
  Download, 
  CheckCircle2, 
  X, 
  Globe2, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  ArrowRight,
  MoreVertical,
  Laptop
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
}

export function PWAInstallModal({
  isOpen,
  onClose,
  companyName = 'Sofia Travel'
}: PWAInstallModalProps) {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'android';
  });
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success'>('idle');

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    setInstallStatus('installing');
    const result = await install();
    if (result === 'accepted') {
      setInstallStatus('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setInstallStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 border-b border-slate-800/80">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-blue-500/20 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                <img 
                  src="/sofia-logo.png" 
                  alt="Sofia Travel App Logo" 
                  className="w-11 h-11 object-contain rounded-xl p-0.5 bg-white" 
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/sofia-logo.svg';
                  }}
                />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                Mobile App Ready
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Install {companyName} App
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Fast, responsive mobile access for Android & iOS
              </p>
            </div>
          </div>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex bg-slate-950/60 p-1.5 border-b border-slate-800/80 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Android</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-slate-200" />
            <span>iOS (iPhone / iPad)</span>
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Laptop className="w-4 h-4 text-cyan-400" />
            <span>PC / Mac</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Direct Install Button if supported */}
          {isInstallable && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-blue-800/30 to-indigo-900/40 border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left w-full sm:w-auto">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Instant 1-Click Install Detected
                </p>
                <p className="text-[11px] text-blue-200 mt-0.5">
                  Your browser supports direct installation to home screen
                </p>
              </div>
              <button
                onClick={handleNativeInstall}
                disabled={installStatus === 'installing'}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{installStatus === 'installing' ? 'Installing...' : 'Install App Now'}</span>
              </button>
            </div>
          )}

          {/* Android Steps */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                Android Installation Guide (Chrome / Edge / Samsung Internet)
              </h3>
              
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">Tap the 3 dots menu in your browser</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Located in the top right corner of Chrome or Edge (<MoreVertical className="inline w-3.5 h-3.5 text-slate-300" />)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white">Select "Install app" or "Add to Home screen"</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      The browser will prompt: "Install Sofia Travel Management System"
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white">Confirm "Install"</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      The app icon will immediately appear on your home screen and app launcher.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* iOS Steps */}
          {activeTab === 'ios' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                iOS Installation Guide (Safari on iPhone & iPad)
              </h3>
              
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <span>Tap the Share button in Safari</span>
                      <Share className="w-3.5 h-3.5 text-blue-400" />
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      The square icon with an arrow pointing upward at the bottom navigation bar of Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <span>Scroll down and select "Add to Home Screen"</span>
                      <PlusSquare className="w-3.5 h-3.5 text-slate-200" />
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Look for the plus icon in the Safari sharing sheet.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white">Tap "Add" in the top right</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sofia Travel OS will now open as a standalone fullscreen app without the Safari browser address bar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Steps */}
          {activeTab === 'desktop' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                Desktop Installation (Chrome / Edge / Windows / Mac)
              </h3>
              
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">Click the Install icon in the browser address bar</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Located on the right side of the URL bar (computer screen icon with a down arrow).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white">Click "Install" to create a desktop window</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Launches in its own dedicated, clutter-free desktop window with taskbar pinning.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features Highlights */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-[11px]">
                <p className="font-bold text-white">Instant Launch</p>
                <p className="text-slate-400 text-[10px]">No app store download</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-[11px]">
                <p className="font-bold text-white">Live Cloud Sync</p>
                <p className="text-slate-400 text-[10px]">Connected to Firestore</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="text-[11px]">
                <p className="font-bold text-white">Mobile Safe UI</p>
                <p className="text-slate-400 text-[10px]">All menus within screen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {isInstalled ? '✅ App is already installed on this device.' : 'Compatible with all modern smartphones'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
}
