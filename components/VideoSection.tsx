
import React, { useState, useEffect, useRef } from 'react';
import { Course, Checkpoint } from '../types';
import { VIDEO_STORYBOARD } from '../constants';

interface VideoSectionProps {
  course: Course;
  onComplete: () => void;
  onBack: () => void;
}

const VideoSection: React.FC<VideoSectionProps> = ({ course, onComplete, onBack }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTimeReached, setMaxTimeReached] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [checkpointAnswered, setCheckpointAnswered] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [volume, setVolume] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Quality & Performance State
  const [isBuffering, setIsBuffering] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'480p' | '720p' | '1080p'>('720p');

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);
  const duration = 110; // Simulated duration based on storyboard

  // Fullscreen tracking
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Bandwidth & Mobile Detection
  useEffect(() => {
    // Check connection speed if available
    const nav = navigator as any;
    if (nav.connection) {
      const { effectiveType, saveData } = nav.connection;
      if (saveData || effectiveType === '2g' || effectiveType === '3g') {
        setIsSlowConnection(true);
        setSelectedQuality('480p');
      }
    }
    // Mobile detection check
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      if (!isSlowConnection) setSelectedQuality('720p'); // Cap mobile at 720p by default
    }
  }, []);

  // Load saved progress on mount
  useEffect(() => {
    const savedTime = localStorage.getItem(`sh_video_time_${course.id}`);
    const savedMax = localStorage.getItem(`sh_video_max_${course.id}`);
    if (savedTime) {
      const parsedTime = parseFloat(savedTime);
      setCurrentTime(parsedTime);
      setMaxTimeReached(savedMax ? parseFloat(savedMax) : parsedTime);
      // Sync video element time if it exists
      if (videoRef.current) {
        videoRef.current.currentTime = parsedTime;
      }
    }
  }, [course.id]);

  // Periodic Save Progress
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(`sh_video_time_${course.id}`, currentTime.toString());
      if (currentTime > maxTimeReached) {
        setMaxTimeReached(currentTime);
        localStorage.setItem(`sh_video_max_${course.id}`, currentTime.toString());
      }
    }, 2000); // Save every 2 seconds for reliability
    return () => clearInterval(interval);
  }, [currentTime, maxTimeReached, course.id]);

  // Playback timer (Simulated for v1, but connects to real video events below)
  useEffect(() => {
    if (isPlaying && !activeCheckpoint && !videoEnded) {
      timerRef.current = window.setInterval(() => {
        if (!isBuffering) {
          setCurrentTime(prev => {
            const next = prev + 1;
            if (next >= duration) {
              setIsPlaying(false);
              setVideoEnded(true);
              return duration;
            }
            return next;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, activeCheckpoint, videoEnded, isBuffering]);

  // Checkpoint trigger logic
  useEffect(() => {
    const checkpoint = course.checkpoints.find(c => 
      Math.floor(currentTime) === c.time && 
      !activeCheckpoint && 
      !localStorage.getItem(`cp_done_${course.id}_${c.time}`)
    );
    if (checkpoint) {
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
      setActiveCheckpoint(checkpoint);
    }
  }, [currentTime, course.checkpoints, activeCheckpoint, course.id]);

  const currentSlide = VIDEO_STORYBOARD.find(s => currentTime >= s.start && currentTime < s.end) || VIDEO_STORYBOARD[VIDEO_STORYBOARD.length - 1];

  const handleCheckpointAnswer = () => {
    setCheckpointAnswered(true);
    if (activeCheckpoint) {
      localStorage.setItem(`cp_done_${course.id}_${activeCheckpoint.time}`, 'true');
    }
    setTimeout(() => {
      setActiveCheckpoint(null);
      setCheckpointAnswered(false);
      setIsPlaying(true);
      if (videoRef.current) videoRef.current.play().catch(() => {});
    }, 1500);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (val <= maxTimeReached) {
      setCurrentTime(val);
      if (videoRef.current) videoRef.current.currentTime = val;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handlePlayToggle = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          setVideoError("Dështoi fillimi. Ju lutem kontrolloni lidhjen tuaj.");
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  const retryVideo = () => {
    setVideoError(null);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.currentTime = currentTime;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const progressPercent = (currentTime / duration) * 100;

  // Handle Multi-Quality Sources (assuming videoUrl could be JSON or string)
  let videoSrc = course.videoUrl;
  try {
    const sources = JSON.parse(course.videoUrl);
    videoSrc = sources[selectedQuality] || Object.values(sources)[0] as string;
  } catch (e) {
    // Standard URL
  }

  return (
    <div className={`w-full mx-auto space-y-6 pb-24 animate-in fade-in duration-500 ${isFullscreen ? 'max-w-none' : 'max-w-7xl'}`}>
      {!isFullscreen && (
        <div className="text-center space-y-2 px-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hapi 2 nga 3</p>
          <h2 className="text-2xl md:text-3xl font-black text-blue-900 tracking-tight leading-none">Moduli i Trajnimit</h2>
        </div>
      )}

      <div 
        ref={containerRef}
        className={`bg-black overflow-hidden relative group transition-all duration-500 ${isFullscreen ? 'h-screen w-screen' : 'rounded-none md:rounded-[2rem] border-y md:border border-slate-200 shadow-2xl aspect-video'}`}
      >
        {/* Actual Video Element - Hidden if not active/error */}
        {videoSrc && (
          <video
            ref={videoRef}
            className="w-full h-full"
            preload="metadata"
            playsInline
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onTimeUpdate={() => {
              if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
            }}
            onEnded={() => setVideoEnded(true)}
            onError={() => setVideoError("Problem me lidhjen. Prekni për të provuar përsëri.")}
            style={{ display: isPlaying || videoEnded ? 'block' : 'none' }}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}

        {/* Visual Content Placeholder (Storyboarding fallback) */}
        {!isPlaying && !videoEnded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="space-y-4 max-w-2xl animate-in fade-in duration-700">
              <h3 className="text-yellow-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">{currentSlide.subtitle}</h3>
              <h2 className="text-white text-3xl md:text-5xl font-black tracking-tighter leading-none">{currentSlide.title}</h2>
              <p className="text-slate-300 text-base md:text-xl font-medium leading-relaxed">{currentSlide.body}</p>
            </div>
          </div>
        )}

        {/* Tap to Play / Buffering / Error Overlays */}
        {(!isPlaying || isBuffering || videoError) && !activeCheckpoint && !videoEnded && (
          <div 
            onClick={videoError ? retryVideo : handlePlayToggle}
            className={`absolute inset-0 bg-blue-900/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center cursor-pointer group transition-opacity ${isPlaying && !isBuffering && !videoError ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            {isBuffering && !videoError ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-white text-[10px] font-black uppercase tracking-widest">Duke u ngarkuar...</p>
              </div>
            ) : videoError ? (
              <div className="text-center space-y-4 p-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                  <span className="text-white text-3xl">!</span>
                </div>
                <p className="text-white text-xs font-black uppercase tracking-widest">{videoError}</p>
                <button className="px-6 py-3 bg-white text-blue-900 rounded-xl font-black text-[10px] uppercase">Provo përsëri</button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button className="w-24 h-24 bg-white/95 rounded-full flex items-center justify-center shadow-2xl transition-all group-hover:scale-110 active:scale-90">
                  <div className="w-0 h-0 border-t-[14px] border-t-transparent border-l-[24px] border-l-blue-900 border-b-[14px] border-b-transparent ml-2" />
                </button>
                <p className="mt-6 text-white text-xs font-black uppercase tracking-[0.2em] drop-shadow-lg">Prekni për të filluar trajnimin</p>
                {isSlowConnection && (
                  <p className="mt-2 text-white/60 text-[10px] font-bold">U përshtat në {selectedQuality} për shkak të shpejtësisë së rrjetit.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Captions Overlay */}
        {showCaptions && isPlaying && !isBuffering && (
          <div className="absolute bottom-24 left-0 right-0 px-6 z-10 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md text-white text-center p-4 rounded-xl border border-white/10 mx-auto max-w-2xl shadow-2xl">
              <p className="text-sm md:text-lg font-bold leading-tight">{currentSlide.body}</p>
            </div>
          </div>
        )}

        {/* Checkpoint Modal */}
        {activeCheckpoint && (
          <div className="absolute inset-0 bg-blue-950/95 backdrop-blur-xl z-20 flex items-center justify-center p-6 animate-in zoom-in duration-300">
            <div className="max-w-md w-full space-y-8">
              <div className="text-center space-y-3">
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest bg-yellow-400/10 px-4 py-1.5 rounded-full border border-yellow-400/20">Pikë Kontrolli</span>
                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">{activeCheckpoint.question}</h3>
              </div>
              <div className="grid gap-3">
                {activeCheckpoint.options.map((opt, i) => (
                  <button
                    key={i}
                    disabled={checkpointAnswered}
                    onClick={handleCheckpointAnswer}
                    className="w-full p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-left text-base md:text-lg transition-all active:scale-98"
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <p className="text-center text-white/40 text-[10px] font-bold uppercase tracking-widest">Përgjigjuni për të vazhduar trajnimin</p>
            </div>
          </div>
        )}

        {/* Integrated Immersive Controls */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 z-30 ${isPlaying || videoEnded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col gap-4">
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-white/70 tabular-nums w-10 text-right">{Math.floor(currentTime)}s</span>
              <div className="flex-1 relative h-1.5 bg-white/20 rounded-full overflow-hidden group/seek">
                <div className="absolute inset-0 bg-white/30" style={{ width: `${(maxTimeReached / duration) * 100}%` }} />
                <div className="absolute inset-y-0 left-0 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]" style={{ width: `${progressPercent}%` }} />
                <input 
                  type="range" 
                  min="0" 
                  max={duration} 
                  value={currentTime} 
                  onChange={handleSeek}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                />
              </div>
              <span className="text-[10px] font-black text-white/70 tabular-nums w-10">{duration}s</span>
            </div>

            {/* Main Control Row */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handlePlayToggle}
                  className="text-white hover:text-yellow-400 transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                
                <button onClick={() => setVolume(volume === 0 ? 80 : 0)} className="text-white hover:text-yellow-400 transition-colors hidden sm:block">
                  {volume === 0 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM3 9v6h4l5 5V4L7 9H3z"/></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                  )}
                </button>

                {isBuffering && (
                  <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest animate-pulse hidden md:block">Duke u optimizuar...</span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowCaptions(!showCaptions)} 
                  className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all ${showCaptions ? 'bg-yellow-400 text-blue-900 border-yellow-400' : 'text-white border-white/30 hover:border-white'}`}
                >
                  CC
                </button>
                <button 
                  onClick={toggleFullscreen}
                  className="text-white hover:text-yellow-400 transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Video Summary & Action */}
      <div className={`px-4 transition-all duration-500 ${isFullscreen ? 'hidden' : ''}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-4 flex-1">
                {videoEnded ? (
                  <div className="space-y-4 animate-in slide-in-from-left-4">
                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest">Kujtesat Kryesore për Siguri</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "Raportoni rreziqet menjëherë",
                        "Mos prekni pajisjet elektrike të dëmtuara",
                        "Mbani daljet e emergjencës të lira",
                        "Ndiqni rrugët e evakuimit"
                      ].map((txt, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="w-2 h-2 bg-blue-900 rounded-full" />
                          {txt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4 text-slate-400">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center animate-pulse">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Ju lutemi përfundoni videon për të zhbllokuar vlerësimin</p>
                    </div>
                    {isSlowConnection && (
                      <p className="ml-14 text-[9px] text-blue-900/60 font-bold uppercase tracking-tight">Lidhje e ngadaltë. Cilësia u optimizua për internet mobil.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex w-full md:w-auto gap-3 shrink-0">
                <button onClick={onBack} className="flex-1 md:flex-none px-8 py-5 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-50 border border-slate-100 transition-all">Mbrapa</button>
                {videoEnded && (
                  <button 
                    onClick={onComplete} 
                    className="flex-[2] md:flex-none px-12 py-5 bg-green-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-yellow-400 hover:text-blue-900 transition-all shadow-xl shadow-green-600/20 active:scale-95 animate-in slide-in-from-right-4"
                  >
                    Fillo Vlerësimin Final
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSection;
