import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handler = e => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = evt => {
    evt.preventDefault();
    if (!promptInstall) return;
    promptInstall.prompt();
    promptInstall.userChoice.then(choiceResult => {
      if (choiceResult.outcome === 'accepted') {
        setSupportsPWA(false);
      }
    });
  };

  if (!supportsPWA || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 animate-slide-up">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 max-w-sm mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/20 text-orange-400 p-2 rounded-xl">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">Install GovTracker App</h4>
            <p className="text-slate-400 text-xs">Add to home screen for quick access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onClick}
            className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Install
          </button>
          <button 
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-white p-1"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
