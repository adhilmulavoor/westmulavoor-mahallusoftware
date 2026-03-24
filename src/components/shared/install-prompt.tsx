'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

export function InstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Basic checks
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    setIsIOS(isIOSDevice);
    setIsStandalone(isStandaloneMode);

    // If we're already standalone, don't show the prompt
    if (isStandaloneMode) {
      return;
    }

    // Only show if not dismissed
    const hasDismissed = localStorage.getItem('install-prompt-dismissed') === 'true';
    if (!hasDismissed) {
      setDismissed(false);
    }

    // Handle standard Android/Chrome install
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setDismissed(true);
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We can't use the prompt again
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  if (dismissed || isStandalone) {
    return null;
  }

  // If mobile, we might want to show it. iOS Safari specifically doesn't support beforeinstallprompt
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-slate-200 shadow-lg rounded-2xl p-4 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-center gap-4 flex-1">
        <div className="h-10 w-10 bg-mahallu-light rounded-xl flex items-center justify-center shrink-0">
          <Download className="text-mahallu-primary w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-sm">Install Mahallu App</span>
          <span className="text-xs text-slate-500">
            {isIOS 
              ? "Tap the Share icon below, then select 'Add to Home Screen'"
              : "Add to your home screen for a better experience"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!isIOS && isInstallable && (
          <button 
            onClick={handleInstallClick}
            className="bg-mahallu-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-mahallu-dark transition-colors"
          >
            Install
          </button>
        )}
        <button 
          onClick={handleDismiss}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
