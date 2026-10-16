import { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  BookOpen,
  MessageSquare,
  Award,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  BrainCircuit,
  Bot
} from 'lucide-react';
import { initGoogleAuth, requestAccessToken, getAccessToken } from './lib/auth';
import { PRESET_CURRICULA } from './lib/curricula';
import { Subject, CurriculumAnalysisResult, GeneratedSchedule } from './types';
import { fetchCurriculumAnalysis, fetchGeneratedSchedule } from './lib/assistantApi';
import { CurriculumManager } from './components/CurriculumManager';
import { AnalysisReportView } from './components/AnalysisReportView';
import { RagChatAssistant } from './components/RagChatAssistant';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';

export function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'curriculum' | 'report' | 'schedule' | 'assistant'>('curriculum');

  // Subjects state (loaded from local storage or default preset)
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem('study_subjects');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return JSON.parse(JSON.stringify(PRESET_CURRICULA[0].subjects));
  });

  // Target days and study hours
  const [totalDays, setTotalDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('study_total_days');
      if (saved) return parseInt(saved) || 21;
    } catch (e) {}
    return 21; // 3 weeks default
  });

  const [startHour, setStartHour] = useState<number>(12);
  const [endHour, setEndHour] = useState<number>(19);
  const [preferences, setPreferences] = useState<string>('Hafta sonu deneme sınavı ve genel tekrar');

  // AI Analysis Report state
  const [analysisReport, setAnalysisReport] = useState<CurriculumAnalysisResult | null>(() => {
    try {
      const saved = localStorage.getItem('study_analysis_report');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Generated Schedule state
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(() => {
    try {
      const saved = localStorage.getItem('study_generated_schedule');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Google OAuth for Sheets export
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthInit, setIsAuthInit] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('study_subjects', JSON.stringify(subjects));
    } catch (e) {}
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem('study_total_days', totalDays.toString());
    } catch (e) {}
  }, [totalDays]);

  useEffect(() => {
    if (analysisReport) {
      try {
        localStorage.setItem('study_analysis_report', JSON.stringify(analysisReport));
      } catch (e) {}
    }
  }, [analysisReport]);

  useEffect(() => {
    if (generatedSchedule) {
      try {
        localStorage.setItem('study_generated_schedule', JSON.stringify(generatedSchedule));
      } catch (e) {}
    }
  }, [generatedSchedule]);

  // Init Google Auth
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        initGoogleAuth(
          (token) => {
            setAccessToken(token);
            setAuthError(null);
          },
          (err) => {
            console.warn('Google auth warning:', err);
          }
        );
        setIsAuthInit(true);
      } catch (e) {
        console.warn('Auth init failed:', e);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSignIn = () => {
    try {
      requestAccessToken();
    } catch (e: any) {
      setAuthError('Google girişi başlatılamadı: ' + (e.message || 'Lütfen popup pencerelerine izin verin.'));
    }
  };

  // Trigger AI Curriculum Analysis
  const handleAnalyzeCurriculum = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setActiveTab('report');

    try {
      const report = await fetchCurriculumAnalysis(
        subjects,
        totalDays,
        Math.max(1, endHour - startHour)
      );
      setAnalysisReport(report);
    } catch (err: any) {
      console.error('Error in analyze curriculum:', err);
      setAnalysisError(err.message || 'Ders analiz raporu alınırken hata oluştu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger Schedule Generation
  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    setScheduleError(null);
    setActiveTab('schedule');

    try {
      const sched = await fetchGeneratedSchedule(
        subjects,
        totalDays,
        startHour,
        endHour,
        preferences
      );
      setGeneratedSchedule(sched);
    } catch (err: any) {
      console.error('Error generating schedule:', err);
      setScheduleError(err.message || 'Çalışma programı oluşturulurken hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg text-slate-900 tracking-tight">
                  Çalışma Asistanı
                </h1>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  AI & RAG
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Akıllı Müfredat Analizi, 3 Haftalık Program ve Soru-Cevap Koçu
              </p>
            </div>
          </div>

          {/* Right Header: Google Sheets connection status */}
          <div className="flex items-center gap-3">
            {accessToken ? (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold hidden sm:inline">Google Bağlandı</span>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                title="Google Sheets'e doğrudan aktarım için bağlanın"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Google ile Bağlan</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto border-t border-slate-100 py-1.5">
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'curriculum'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            1. Program & Konular
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'report'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            2. Önem & Strateji Raporu
            {analysisReport && (
              <span className="w-2 h-2 rounded-full bg-amber-300" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            3. Çalışma Tablosu ({totalDays} Gün)
            {generatedSchedule && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'assistant'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            4. Soru-Cevap & Not Asistanı (RAG)
            <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.2 rounded font-bold">
              AI
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {authError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{authError}</span>
          </div>
        )}

        {analysisError && activeTab === 'report' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{analysisError}</span>
          </div>
        )}

        {scheduleError && activeTab === 'schedule' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{scheduleError}</span>
          </div>
        )}

        {/* Tab 1: Curriculum & Subjects Manager */}
        {activeTab === 'curriculum' && (
          <CurriculumManager
            subjects={subjects}
            setSubjects={setSubjects}
            totalDays={totalDays}
            setTotalDays={setTotalDays}
            startHour={startHour}
            setStartHour={setStartHour}
            endHour={endHour}
            setEndHour={setEndHour}
            preferences={preferences}
            setPreferences={setPreferences}
            onAnalyze={handleAnalyzeCurriculum}
            onGenerateSchedule={handleGenerateSchedule}
            isAnalyzing={isAnalyzing}
            isGenerating={isGenerating}
            analysisResult={analysisReport}
            generatedSchedule={generatedSchedule}
          />
        )}

        {/* Tab 2: AI Importance Analysis Report */}
        {activeTab === 'report' && (
          <AnalysisReportView
            report={analysisReport}
            onRefresh={handleAnalyzeCurriculum}
            isAnalyzing={isAnalyzing}
            onGoToSchedule={handleGenerateSchedule}
          />
        )}

        {/* Tab 3: Generated 3-Week Schedule Calendar */}
        {activeTab === 'schedule' && (
          <ScheduleCalendarView
            schedule={generatedSchedule}
            onRegenerate={handleGenerateSchedule}
            isGenerating={isGenerating}
            accessToken={accessToken}
            onGoogleSignIn={handleGoogleSignIn}
          />
        )}

        {/* Tab 4: Interactive RAG Q&A Chat Assistant */}
        {activeTab === 'assistant' && (
          <RagChatAssistant
            subjects={subjects}
            generatedSchedule={generatedSchedule}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>
          Çalışma Asistanı • Yapay Zeka Destekli Ders & Konu Stratejisi, RAG Not Tabanı ve Google Sheets Entegrasyonu
        </p>
      </footer>
    </div>
  );
}

export default App;
