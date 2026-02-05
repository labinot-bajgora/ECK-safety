
import React, { useState, useEffect } from 'react';
import { Course } from '../types';

interface TestSectionProps {
  course: Course;
  onFinish: (score: number) => void;
  attempts: number;
}

const TestSection: React.FC<TestSectionProps> = ({ course, onFinish, attempts }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [testResultView, setTestResultView] = useState<{ score: number; passed: boolean } | null>(null);

  const STORAGE_KEY_ANSWERS = `sh_quiz_answers_${course.id}`;
  const STORAGE_KEY_INDEX = `sh_quiz_index_${course.id}`;

  // Load saved quiz progress on mount
  useEffect(() => {
    const savedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
    const savedIndex = localStorage.getItem(STORAGE_KEY_INDEX);
    if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
    if (savedIndex) setCurrentQuestionIndex(parseInt(savedIndex));
  }, [course.id]);

  // Persist answers and index whenever they change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(answers));
    }
    localStorage.setItem(STORAGE_KEY_INDEX, currentQuestionIndex.toString());
  }, [answers, currentQuestionIndex, course.id]);

  const currentQuestion = course.questions[currentQuestionIndex];
  const totalQuestions = course.questions.length;

  const handleSelect = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    let correctCount = 0;
    course.questions.forEach(q => {
      if (answers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 80;
    
    // Clear quiz progress on completion
    localStorage.removeItem(STORAGE_KEY_ANSWERS);
    localStorage.removeItem(STORAGE_KEY_INDEX);

    if (!passed && attempts < 1) {
      setTestResultView({ score, passed });
    } else {
      onFinish(score);
    }
  };

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const questionsRemaining = totalQuestions - (currentQuestionIndex + 1);

  if (testResultView && !testResultView.passed) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-12 animate-in fade-in duration-500 py-12">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 text-4xl font-black">!</div>
        <div className="space-y-4 px-4">
          <h2 className="text-3xl font-black text-blue-900 tracking-tight leading-tight">Vlerësimi dështoi ({testResultView.score}%)</h2>
          <p className="text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
            Nuk e keni arritur rezultatin e kërkuar (80%) këtë herë. 
            Ju lutemi rishikoni videon dhe provoni përsëri. Keni edhe një tentim tjetër.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center px-6">
          <button 
            onClick={() => {
               localStorage.removeItem(STORAGE_KEY_ANSWERS);
               localStorage.removeItem(STORAGE_KEY_INDEX);
               window.location.reload();
            }} 
            className="w-full sm:flex-1 py-6 bg-blue-900 text-white font-black rounded-2xl shadow-xl hover:bg-yellow-400 hover:text-blue-900 transition-all uppercase tracking-widest text-xs"
          >
            Rishiko Videon
          </button>
          <button 
            onClick={() => {
              setTestResultView(null);
              setCurrentQuestionIndex(0);
              setAnswers({});
            }} 
            className="w-full sm:flex-1 py-6 bg-white border-2 border-slate-100 text-blue-900 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
          >
            Provo Përsëri
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-40 px-4">
      <div className="text-center space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hapi 3 nga 3</p>
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-blue-900 tracking-tight leading-none">Vlerësimi Final</h2>
          <p className="text-slate-500 text-sm font-medium">
            Zgjidhni përgjigjen më të saktë për secilën pyetje.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between items-end text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Pyetja {currentQuestionIndex + 1} nga {totalQuestions}</span>
              <span className="text-blue-900">{questionsRemaining > 0 ? `${questionsRemaining} mbetur` : 'Pyetja e fundit'}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className="bg-blue-900 h-full transition-all duration-700 ease-out" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>

          <div className="space-y-6">
            {currentQuestion.imageUrl && (
              <div className="w-full h-32 md:h-40 bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-50 flex items-center justify-center no-select">
                <img 
                  src={currentQuestion.imageUrl.replace('q=80', 'q=60').replace('w=600', 'w=400')} 
                  alt="Ilustrim i Sigurisë" 
                  className="w-full h-full object-cover opacity-90"
                  loading="lazy"
                />
              </div>
            )}

            <h3 className="text-lg md:text-xl font-black text-blue-950 leading-tight tracking-tight">
              {currentQuestion.text}
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full min-h-[72px] p-6 text-left rounded-2xl border-2 transition-all flex items-center justify-between group touch-manipulation ${
                    answers[currentQuestion.id] === idx
                      ? 'border-blue-900 bg-blue-50/50'
                      : 'border-slate-100 bg-white hover:border-yellow-400 hover:bg-yellow-50 active:bg-slate-50'
                  }`}
                >
                  <span className={`text-base font-bold leading-tight ${answers[currentQuestion.id] === idx ? 'text-blue-900' : 'text-slate-600'}`}>
                    {option}
                  </span>
                  <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0 ml-4 ${
                    answers[currentQuestion.id] === idx ? 'border-blue-900 bg-blue-900 shadow-[0_0_0_4px_rgba(30,58,138,0.1)]' : 'border-slate-200 group-hover:border-yellow-400'
                  }`}>
                    {answers[currentQuestion.id] === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto flex gap-4">
          {currentQuestionIndex > 0 && (
            <button 
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="w-24 sm:w-32 py-5 text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[11px] border border-slate-100"
            >
              Mbrapa
            </button>
          )}
          <button
            onClick={nextQuestion}
            disabled={answers[currentQuestion.id] === undefined}
            className={`flex-1 py-5 rounded-2xl font-black text-white shadow-xl transition-all uppercase tracking-widest text-sm active:scale-[0.98] ${
              answers[currentQuestion.id] !== undefined
                ? 'bg-blue-900 hover:bg-yellow-400 hover:text-blue-900'
                : 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none'
            }`}
          >
            {currentQuestionIndex === totalQuestions - 1 ? 'Përfundo Vlerësimin' : 'Pyetja Tjetër'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestSection;
