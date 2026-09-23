import React, { useState } from 'react';
import { Smartphone, Download, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'drawer' | 'compact' | 'bottom-nav' | 'banner';
  companyName?: string;
}

export function PWAInstallButton({
  variant = 'header',
  companyName = 'Sofia Travel'
}: PWAInstallButtonProps) {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  const handleClick = async () => {
    // If native prompt is available, trigger directly
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'manual_guide') {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  // If already installed in standalone mode, show a small badge or hide
  if (isInstalled && variant === 'header') {
    return (
      <div 
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-400 font-bold"
        title="Running as installed app"
      >
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden xl:inline">App Installed</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleClick}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer shrink-0 border border-blue-400/30"
          title="Install Sofia Travel Mobile App (Android & iOS)"
        >
          <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-200" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden text-[11px]">Install</span>
        </button>
      )}

      {variant === 'drawer' && (
        <button
          onClick={() => {
            setShowModal(true);
          }}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/40 text-blue-200 hover:text-white hover:bg-blue-600/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="font-bold text-white">Install Mobile App</p>
              <p className="text-[10px] text-blue-300/80 font-normal">Add to Android or iOS Home Screen</p>
            </div>
          </div>
          <Download className="w-4 h-4 text-blue-400" />
        </button>
      )}

      {variant === 'compact' && (
        <button
          onClick={handleClick}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title="Install Mobile App"
        >
          <Smartphone className="w-4 h-4 text-cyan-400" />
        </button>
      )}

      <PWAInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        companyName={companyName}
      />
    </>
  );
}
