
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import VideoSection from './components/VideoSection';
import TestSection from './components/TestSection';
import AdminDashboard from './components/AdminDashboard';
import { apiService } from './services/api';
import { TrainingStep, LearnerData, AccessCode, Course } from './types';
import { ADMIN_PIN } from './constants';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<TrainingStep>(TrainingStep.ENTRY);
  const [isAdmin, setIsAdmin] = useState(false);
  const [learner, setLearner] = useState<LearnerData | null>(null);
  const [activeCodeInfo, setActiveCodeInfo] = useState<AccessCode | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [completionId, setCompletionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefilledCode, setPrefilledCode] = useState('');

  const stepsOrder = [
    TrainingStep.ENTRY,
    TrainingStep.INTRO,
    TrainingStep.VIDEO,
    TrainingStep.TEST,
    TrainingStep.RESULT
  ];

  useEffect(() => {
    // Check for ?code= in URL for automated onboarding
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setPrefilledCode(codeParam.toUpperCase());
    }

    // Restore session if exists
    const savedLearner = localStorage.getItem('sh_learner');
    const savedStep = localStorage.getItem('sh_step');
    if (savedLearner && savedStep && savedStep !== TrainingStep.RESULT) {
      try {
        const parsedLearner = JSON.parse(savedLearner);
        const validation = apiService.validateCode(parsedLearner.accessCode);
        if (validation.valid) {
          setLearner(parsedLearner);
          setCurrentStep(savedStep as TrainingStep);
          setActiveCodeInfo(validation.codeInfo!);
          setActiveCourse(validation.course!);
        }
      } catch (e) {
        console.warn("Session restore failed.");
      }
    }
  }, []);

  const handleEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const code = (formData.get('accessCode') as string).trim().toUpperCase();
    
    if (code === ADMIN_PIN) {
      setIsAdmin(true);
      return;
    }

    const validation = apiService.validateCode(code);
    if (!validation.valid) {
      setError(validation.message || "Qasja u refuzua.");
      return;
    }

    const data: LearnerData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      companyName: validation.codeInfo!.companyName,
      jobPosition: formData.get('jobPosition') as string,
      accessCode: code
    };

    setLearner(data);
    setActiveCodeInfo(validation.codeInfo!);
    setActiveCourse(validation.course!);
    saveAndNext(TrainingStep.INTRO);
  };

  const finishTest = (score: number) => {
    setFinalScore(score);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    if (score >= 80 || newAttempts >= 2) {
      if (learner && activeCourse) {
        const id = apiService.saveResult(learner, score, newAttempts, activeCourse.id);
        setCompletionId(id);
      }
      setCurrentStep(TrainingStep.RESULT);
      localStorage.removeItem('sh_learner');
      localStorage.removeItem('sh_step');
    }
  };

  const saveAndNext = (step: TrainingStep) => {
    setCurrentStep(step);
    localStorage.setItem('sh_step', step);
    if (learner) localStorage.setItem('sh_learner', JSON.stringify(learner));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const debugJump = (direction: 'prev' | 'next') => {
    const currentIndex = stepsOrder.indexOf(currentStep);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < stepsOrder.length) {
      const nextStep = stepsOrder[nextIndex];
      
      if (currentStep === TrainingStep.ENTRY && direction === 'next' && !learner) {
        const demoData: LearnerData = {
          firstName: "Test",
          lastName: "User",
          companyName: "Debug Corp",
          accessCode: "DEBUG"
        };
        setLearner(demoData);
        setActiveCourse(apiService.getCourses()[0]);
      }

      if (nextStep === TrainingStep.RESULT && finalScore === null) {
        setFinalScore(100);
        setCompletionId("DEBUG-MODE");
      }

      setCurrentStep(nextStep);
    }
  };

  if (isAdmin) return <AdminDashboard onExit={() => setIsAdmin(false)} />;

  return (
    <Layout currentStep={currentStep} learner={learner}>
      {/* Floating Debug Controls */}
      <div className="fixed bottom-24 left-4 z-[9999] flex gap-2 opacity-5 hover:opacity-80 transition-opacity p-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl pointer-events-auto">
        <button onClick={() => debugJump('prev')} className="px-3 py-2 bg-slate-700 text-white text-[10px] font-black uppercase rounded-lg">←</button>
        <button onClick={() => debugJump('next')} className="px-3 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg">→</button>
      </div>

      {currentStep === TrainingStep.ENTRY && (
        <div className="max-w-md mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-24">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-blue-900 tracking-tighter">SafetyHub</h2>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.25em]">Portali i Autorizuar për Siguri</p>
          </div>
          
          <form onSubmit={handleEntry} className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kodi i Qasjes</label>
                <input required name="accessCode" defaultValue={prefilledCode} autoComplete="off" autoCorrect="off" autoCapitalize="characters" className="w-full px-5 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-900 outline-none font-mono text-xl text-blue-900 transition-all" placeholder="000000" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Emri</label>
                  <input required name="firstName" autoComplete="given-name" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-900 transition-all" placeholder="Emri juaj" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mbiemri</label>
                  <input required name="lastName" autoComplete="family-name" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-900 transition-all" placeholder="Mbiemri juaj" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pozita e Punës</label>
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Opsionale</span>
                </div>
                <input name="jobPosition" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-900 transition-all" placeholder="p.sh. Menaxher, Operator" />
              </div>
            </div>

            {error && <div className="p-5 bg-red-50 text-red-600 rounded-2xl text-xs font-black border border-red-100 animate-in shake">{error}</div>}
            
            <button type="submit" className="w-full py-6 bg-blue-900 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-yellow-400 hover:text-blue-900 transition-all active:scale-[0.98] text-lg">
              FILLO TRAJNIMIN
            </button>
          </form>
        </div>
      )}

      {currentStep === TrainingStep.INTRO && activeCourse && (
        <div className="max-w-3xl mx-auto space-y-10 pb-40">
          <div className="bg-white p-8 md:p-16 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                 <p className="text-blue-900 text-2xl font-black tracking-tight leading-none">Mirë se vini, {learner?.firstName}</p>
                 <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Profili: {activeCodeInfo?.companyName}</p>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">{activeCourse.title}</h2>
            </div>
            <div className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap font-medium">{activeCourse.introText}</div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <button onClick={() => saveAndNext(TrainingStep.VIDEO)} className="w-full max-w-3xl mx-auto block py-6 bg-blue-900 text-white font-black rounded-2xl text-xl shadow-xl shadow-blue-900/10 hover:bg-yellow-400 hover:text-blue-900 transition-all active:scale-[0.98]">
              FILLO MODULIN VIDEO
            </button>
          </div>
        </div>
      )}

      {currentStep === TrainingStep.VIDEO && activeCourse && <VideoSection course={activeCourse} onComplete={() => saveAndNext(TrainingStep.TEST)} onBack={() => setCurrentStep(TrainingStep.INTRO)} />}
      {currentStep === TrainingStep.TEST && activeCourse && <TestSection course={activeCourse} onFinish={finishTest} attempts={attempts} />}
      
      {currentStep === TrainingStep.RESULT && (
        <div className="max-w-2xl mx-auto text-center space-y-12 py-10 px-4">
          <div className={`w-32 h-32 md:w-36 md:h-36 rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center mx-auto text-white text-6xl md:text-7xl font-black shadow-xl ${finalScore! >= 80 ? 'bg-green-600 shadow-green-900/20' : 'bg-red-600 shadow-red-900/20'}`}>
            {finalScore! >= 80 ? '✓' : '!'}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black text-blue-900 tracking-tight">{finalScore! >= 80 ? 'Trajnimi u Përfundua' : 'Ende nuk është përfunduar'}</h2>
            <p className="text-slate-500 font-medium">Rezultati Final: {finalScore}%</p>
          </div>
          {finalScore! >= 80 && (
            <div className="p-8 md:p-10 bg-white rounded-[2.5rem] border-2 border-slate-100 inline-block w-full max-w-md shadow-sm">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">ID e Verifikimit</p>
              <p className="font-mono font-black text-blue-900 text-3xl md:text-4xl break-all">{completionId}</p>
              <p className="mt-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">{activeCourse?.title}</p>
              <div className="mt-6 pt-6 border-t border-slate-50">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Verifikuar nga SafetyHub Compliance</p>
              </div>
            </div>
          )}
          <button onClick={() => window.location.assign('/')} className="w-full py-6 bg-white text-slate-500 font-black rounded-2xl border-2 border-slate-100 hover:bg-yellow-100 hover:text-blue-900 transition-all text-lg uppercase tracking-widest active:scale-[0.98]">
            DALJA NGA PORTALI
          </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
