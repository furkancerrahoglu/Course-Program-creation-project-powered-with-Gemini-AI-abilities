import React, { useState } from 'react';
import {
  GeneratedSchedule,
  StudySession,
  ScheduledDay
} from '../types';
import { createTopicScheduleSpreadsheet } from '../lib/sheets';
import {
  Calendar,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Share2,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Printer,
  Check,
  Video,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Props {
  schedule: GeneratedSchedule | null;
  onRegenerate: () => void;
  isGenerating: boolean;
  accessToken: string | null;
  onGoogleSignIn: () => void;
}

export const ScheduleCalendarView: React.FC<Props> = ({
  schedule,
  onRegenerate,
  isGenerating,
  accessToken,
  onGoogleSignIn,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [completedSessions, setCompletedSessions] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('study_completed_sessions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const toggleSessionCompletion = (sessionId: string) => {
    const updated = { ...completedSessions, [sessionId]: !completedSessions[sessionId] };
    setCompletedSessions(updated);
    try {
      localStorage.setItem('study_completed_sessions', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleExportToSheets = async () => {
    if (!schedule) return;

    if (!accessToken) {
      onGoogleSignIn();
      return;
    }

    setIsExportingSheets(true);
    setExportError(null);

    try {
      const url = await createTopicScheduleSpreadsheet(
        schedule.scheduleTitle,
        schedule.days,
        accessToken
      );
      setExportedSheetUrl(url);
    } catch (err: any) {
      console.error('Error exporting to Sheets:', err);
      setExportError(err.message || 'Google Sheets tablosu oluşturulurken bir hata oluştu.');
    } finally {
      setIsExportingSheets(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">
          Çalışma Programınız Oluşturuluyor...
        </h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
          Yapay zeka asistanı alt konuları mantıklı bir sırayla günlere paylaştırıyor, haftalık tekrarları ve deneme seanslarını planlıyor.
        </p>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Henüz Çalışma Programı Oluşturulmadı
        </h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
          "Program & Konular" sekmesinden derslerinizi ve alt konularınızı onaylayıp "Çalışma Programını Çıkar" butonuna tıklayarak haftalık tablonuzu oluşturabilirsiniz.
        </p>
        <button
          onClick={onRegenerate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Programı Şimdi Oluştur
        </button>
      </div>
    );
  }

  const totalDays = schedule.days.length;
  const totalWeeks = Math.ceil(totalDays / 7);

  // Calculate completed stats
  let totalSessionsCount = 0;
  let completedCount = 0;

  schedule.days.forEach((day) => {
    day.sessions.forEach((s, sIdx) => {
      totalSessionsCount++;
      const id = `${day.dayIndex}-${sIdx}-${s.topicName}`;
      if (completedSessions[id]) {
        completedCount++;
      }
    });
  });

  const progressPercentage =
    totalSessionsCount > 0 ? Math.round((completedCount / totalSessionsCount) * 100) : 0;

  const visibleDays = schedule.days.filter((day) => {
    if (selectedWeek === 'all') return true;
    return day.weekNumber === selectedWeek;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold mb-2 text-blue-200 border border-blue-400/30">
            <Calendar className="w-3.5 h-3.5 text-blue-300" /> {totalWeeks} Haftalık ({totalDays} Gün) Çalışma Tablosu
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {schedule.scheduleTitle}
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl">
            {schedule.summary}
          </p>
        </div>

        {/* Action Buttons: Google Sheets Export & Print */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Yazdır
          </button>

          <button
            onClick={handleExportToSheets}
            disabled={isExportingSheets}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50"
          >
            {isExportingSheets ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> E-Tabloya Aktarılıyor...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" /> Google Sheets'e Aktar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export feedback message */}
      {exportedSheetUrl && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-900">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <b>Harika!</b> Çalışma tablonuz Google Sheets üzerinde başarıyla oluşturuldu.
            </span>
          </div>
          <a
            href={exportedSheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors"
          >
            Tabloyu Aç <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {exportError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* Progress & Week Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Week Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedWeek('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedWeek === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tüm Program ({totalDays} Gün)
          </button>
          {Array.from({ length: totalWeeks }).map((_, wIdx) => {
            const wNum = wIdx + 1;
            return (
              <button
                key={wNum}
                onClick={() => setSelectedWeek(wNum)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedWeek === wNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {wNum}. Hafta
              </button>
            );
          })}
        </div>

        {/* Completion Progress Bar */}
        <div className="flex items-center gap-3 w-full md:w-64">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>İlerleme:</span>
              <span className="font-bold text-slate-800">
                {completedCount} / {totalSessionsCount} Konu (%{progressPercentage})
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Days Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleDays.map((day) => {
          const daySessionsCompleted = day.sessions.every((s, sIdx) => {
            const id = `${day.dayIndex}-${sIdx}-${s.topicName}`;
            return completedSessions[id];
          });

          return (
            <div
              key={day.dayIndex}
              className={`rounded-xl border overflow-hidden transition-all bg-white shadow-sm flex flex-col ${
                daySessionsCompleted ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              {/* Day Header */}
              <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                      {day.dayIndex}
                    </span>
                    <h4 className="font-bold text-sm text-slate-800">{day.dayLabel}</h4>
                  </div>
                  {day.focusTheme && (
                    <p className="text-[11px] text-slate-500 mt-0.5 ml-8">{day.focusTheme}</p>
                  )}
                </div>

                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {day.weekNumber}. Hafta
                </span>
              </div>

              {/* Day Sessions List */}
              <div className="p-3 space-y-2.5 flex-1">
                {day.sessions.map((session, sIdx) => {
                  const id = `${day.dayIndex}-${sIdx}-${session.topicName}`;
                  const isDone = !!completedSessions[id];

                  return (
                    <div
                      key={sIdx}
                      onClick={() => toggleSessionCompletion(id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200 text-slate-500'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs text-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSessionCompletion(id);
                            }}
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                              isDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white hover:border-slate-400'
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                              {session.subjectName}
                            </span>
                            <h5
                              className={`font-semibold text-xs mt-0.5 ${
                                isDone ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                            >
                              {session.topicName}
                            </h5>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {session.startTime}-{session.endTime}
                        </span>
                      </div>

                      {/* Goal / Description */}
                      <p className="text-[11px] text-slate-500 mt-2 pl-6">
                        🎯 <b>Hedef:</b> {session.targetGoal}
                      </p>

                      {/* Optional Video link */}
                      {session.videoUrl && (
                        <div className="mt-2 pl-6">
                          <a
                            href={session.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-medium"
                          >
                            <Video className="w-3 h-3" /> Konu Videosunu Aç
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}

                {day.sessions.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400 italic">
                    Bugün için planlanan ders bulunmuyor (Dinlenme / Serbest Gün).
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
