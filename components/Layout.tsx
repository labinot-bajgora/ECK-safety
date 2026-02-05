
import React from 'react';
import { TrainingStep, LearnerData } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentStep: TrainingStep;
  learner?: LearnerData | null;
}

const Layout: React.FC<LayoutProps> = ({ children, currentStep, learner }) => {
  const getStepNumber = () => {
    switch (currentStep) {
      case TrainingStep.INTRO: return 1;
      case TrainingStep.VIDEO: return 2;
      case TrainingStep.TEST: return 3;
      default: return 0;
    }
  };

  const stepNum = getStepNumber();
  const progress = (stepNum / 3) * 100;
  const isVideoStep = currentStep === TrainingStep.VIDEO;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 shadow-sm pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex justify-between items-center sm:gap-8 flex-1">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-black text-blue-900 leading-tight tracking-tighter">SafetyHub</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Portali i Sigurisë</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {learner && (
                <div className="hidden md:flex flex-col items-end mr-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pjesëmarrësi</span>
                  <span className="text-xs font-bold text-blue-900">{learner.firstName} {learner.lastName}</span>
                </div>
              )}
              {stepNum > 0 && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-200">
                  Hapi {stepNum} / 3
                </span>
              )}
            </div>
          </div>
          {stepNum > 0 && (
            <div className="w-full sm:max-w-xs bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className="bg-blue-900 h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(30,58,138,0.3)]" 
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        {/* Mobile identity display */}
        {learner && (
          <div className="md:hidden pt-2 mt-2 border-t border-slate-100 flex justify-between items-center px-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pjesëmarrësi:</span>
            <span className="text-[10px] font-black text-blue-900 uppercase tracking-tight">{learner.firstName} {learner.lastName}</span>
          </div>
        )}
      </header>

      <main className={`flex-1 w-full mx-auto py-8 md:py-12 pb-[calc(2rem+env(safe-area-inset-bottom))] transition-all duration-500 ${isVideoStep ? 'max-w-none px-0 md:px-6' : 'max-w-5xl px-4'}`}>
        <div className="w-full h-full">
          {children}
        </div>
      </main>

      <footer className="py-8 px-4 border-t border-slate-200 bg-white pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Ofruar nga European College of Kosovo (ECK)
            </p>
            <a href="https://www.eck-edu.org" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-900 hover:underline">
              www.eck-edu.org
            </a>
          </div>
        </div>
      </footer>
      
      {/* Mobile navigation bottom spacing */}
      <div className="h-[env(safe-area-inset-bottom)] md:hidden bg-white" />
    </div>
  );
};

export default Layout;
