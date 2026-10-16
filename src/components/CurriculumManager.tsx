import React, { useState } from 'react';
import {
  Subject,
  CurriculumAnalysisResult,
  GeneratedSchedule
} from '../types';
import { PRESET_CURRICULA } from '../lib/curricula';
import {
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Layers,
  ChevronDown,
  BookOpen,
  HelpCircle,
  Video,
  ListPlus,
  CheckCircle2,
  BrainCircuit,
  Sliders,
  AlertCircle
} from 'lucide-react';

interface Props {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  totalDays: number;
  setTotalDays: (days: number) => void;
  startHour: number;
  setStartHour: (hour: number) => void;
  endHour: number;
  setEndHour: (hour: number) => void;
  preferences: string;
  setPreferences: (pref: string) => void;
  onAnalyze: () => void;
  onGenerateSchedule: () => void;
  isAnalyzing: boolean;
  isGenerating: boolean;
  analysisResult: CurriculumAnalysisResult | null;
  generatedSchedule: GeneratedSchedule | null;
}

export const CurriculumManager: React.FC<Props> = ({
  subjects,
  setSubjects,
  totalDays,
  setTotalDays,
  startHour,
  setStartHour,
  endHour,
  setEndHour,
  preferences,
  setPreferences,
  onAnalyze,
  onGenerateSchedule,
  isAnalyzing,
  isGenerating,
  analysisResult,
  generatedSchedule,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('kpss-gygk');
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(subjects[0]?.id || null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopicInput, setNewTopicInput] = useState<Record<string, string>>({});

  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = PRESET_CURRICULA.find((p) => p.id === presetId);
    if (preset) {
      setSubjects(JSON.parse(JSON.stringify(preset.subjects)));
      if (preset.subjects[0]) {
        setExpandedSubjectId(preset.subjects[0].id);
      }
    }
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const newSubject: Subject = {
      id: `subj-${Date.now()}`,
      name: newSubjectName.trim(),
      maxDailyHours: 3,
      topics: ['Giriş ve Temel Kavramlar'],
    };
    setSubjects([...subjects, newSubject]);
    setNewSubjectName('');
    setExpandedSubjectId(newSubject.id);
  };

  const handleRemoveSubject = (id: string) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const handleAddTopic = (subjectId: string) => {
    const text = (newTopicInput[subjectId] || '').trim();
    if (!text) return;

    // Handle multiline or comma separated
    const addedTopics = text
      .split(/[\n,]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setSubjects(
      subjects.map((s) => {
        if (s.id === subjectId) {
          return {
            ...s,
            topics: [...s.topics, ...addedTopics],
          };
        }
        return s;
      })
    );

    setNewTopicInput({ ...newTopicInput, [subjectId]: '' });
  };

  const handleRemoveTopic = (subjectId: string, topicIndex: number) => {
    setSubjects(
      subjects.map((s) => {
        if (s.id === subjectId) {
          const updated = [...s.topics];
          updated.splice(topicIndex, 1);
          return { ...s, topics: updated };
        }
        return s;
      })
    );
  };

  const handleUpdateSubject = (subjectId: string, updates: Partial<Subject>) => {
    setSubjects(
      subjects.map((s) => (s.id === subjectId ? { ...s, ...updates } : s))
    );
  };

  const totalTopicsCount = subjects.reduce((acc, s) => acc + s.topics.length, 0);

  return (
    <div className="space-y-8">
      {/* Hero Banner / Instructions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            Yapay Zeka Destekli Yeni Nesil Çalışma Sistemi
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Konu ve Alt Başlıklarını Belirle, Akıllı Programını Çıkar
          </h2>
          <p className="mt-2 text-sm md:text-base text-blue-100/90 leading-relaxed">
            Playlist zorunluluğu olmadan dilediğin dersleri ve alt konuları gir. Asistanımız konuların önem derecesini, sınav ağırlığını ve püf noktalarını raporlasın; seçtiğin hafta sayısına göre dengeli bir çalışma tablosu üretsin.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs md:text-sm text-blue-200">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> <b>{subjects.length}</b> Ders
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> <b>{totalTopicsCount}</b> Alt Konu
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-blue-300" /> <b>{totalDays} Gün ({Math.ceil(totalDays / 7)} Hafta)</b> Hedef
            </span>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Preset Curricula Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Müfredat Şablonu Seç veya Özelleştir
            </h3>
            <p className="text-xs text-slate-500">
              Tek tıkla hazır sınav müfredatını yükleyebilir veya kendi derslerini ekleyebilirsin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESET_CURRICULA.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.id)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-semibold text-sm flex items-center justify-between">
                  <span>{preset.title}</span>
                  {isSelected && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-md font-medium">Seçili</span>}
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule Duration & Time Constraints */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-blue-600" />
          Zaman & Program Hedef Ayarları
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Days Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Program Süresi (Toplam Gün Sayısı)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                { label: '1 Hafta (7 Gün)', value: 7 },
                { label: '2 Hafta (14 Gün)', value: 14 },
                { label: '3 Hafta (21 Gün)', value: 21 },
                { label: '1 Ay (30 Gün)', value: 30 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTotalDays(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    totalDays === opt.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="90"
                value={totalDays}
                onChange={(e) => setTotalDays(Math.max(1, parseInt(e.target.value) || 21))}
                className="w-24 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-500">
                Günde ~{Math.ceil(totalTopicsCount / Math.max(1, totalDays))} konu / gün
              </span>
            </div>
          </div>

          {/* Daily Study Hours Interval */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Günlük Çalışma Saat Aralığı
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(parseInt(e.target.value))}
                  className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-slate-400">-</span>
              <select
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value))}
                className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500 font-medium">
                (Günde {Math.max(0, endHour - startHour)} saat)
              </span>
            </div>
          </div>

          {/* Special preferences */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Özel Çalışma İsteği / Notu (İsteğe Bağlı)
            </label>
            <input
              type="text"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="Örn: Hafta sonları soru çözümü & deneme olsun"
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Subject & Sub-topics List */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Dersler ve Alt Başlıklar
            </h3>
            <p className="text-xs text-slate-500">
              Her dersin alt konularını ekleyebilir, silebilir ve günlük maksimum çalışma süresini ayarlayabilirsin.
            </p>
          </div>

          {/* Add Subject Bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
              placeholder="Yeni Ders Ekle (Örn: Hukuk)"
              className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleAddSubject}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Ders Ekle
            </button>
          </div>
        </div>

        {/* Subjects Accordion / Cards */}
        <div className="space-y-4">
          {subjects.map((subject, sIdx) => {
            const isExpanded = expandedSubjectId === subject.id;

            return (
              <div
                key={subject.id}
                className="border border-slate-200 rounded-xl overflow-hidden transition-all bg-slate-50/50"
              >
                {/* Header */}
                <div
                  onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 select-none bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                      {sIdx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        {subject.name}
                        {subject.url && (
                          <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                            <Video className="w-2.5 h-2.5" /> Video Destekli
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {subject.topics.length} Alt Konu • Günlük Max {subject.maxDailyHours} Saat
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleRemoveSubject(subject.id)}
                      disabled={subjects.length <= 1}
                      title="Dersi Sil"
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isExpanded ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-4">
                    {/* Controls Row: Max hours & optional playlist URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Günlük Maksimum Çalışma Süresi (Saat)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={subject.maxDailyHours}
                            onChange={(e) =>
                              handleUpdateSubject(subject.id, {
                                maxDailyHours: Math.max(1, parseInt(e.target.value) || 3),
                              })
                            }
                            className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                          />
                          <span className="text-slate-500">saat / gün</span>
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          İsteğe Bağlı YouTube Oynatma Listesi URL'si
                        </label>
                        <input
                          type="url"
                          value={subject.url || ''}
                          onChange={(e) =>
                            handleUpdateSubject(subject.id, { url: e.target.value })
                          }
                          placeholder="İsteğe bağlı: https://youtube.com/playlist?list=..."
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Topics badges and editor */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Alt Konular ({subject.topics.length})
                        </label>
                      </div>

                      {/* Topic Tags */}
                      <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200 mb-3">
                        {subject.topics.map((topic, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md border border-slate-200 group hover:border-slate-300"
                          >
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{tIdx + 1}
                            </span>
                            <span className="max-w-[260px] truncate">{topic}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTopic(subject.id, tIdx)}
                              className="text-slate-400 hover:text-red-500 rounded p-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}

                        {subject.topics.length === 0 && (
                          <p className="text-xs text-slate-400 italic p-1">
                            Henüz alt konu eklenmedi. Aşağıdan konularınızı ekleyin.
                          </p>
                        )}
                      </div>

                      {/* Add Topic Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTopicInput[subject.id] || ''}
                          onChange={(e) =>
                            setNewTopicInput({
                              ...newTopicInput,
                              [subject.id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTopic(subject.id)}
                          placeholder="Konu adı yazın veya birden fazla konuyu virgülle ayırın..."
                          className="flex-1 px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTopic(subject.id)}
                          className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 text-xs font-medium rounded-lg inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Konu Ekle
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Decision Buttons */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
        <div>
          <h4 className="text-lg font-bold flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            Asistanı Devreye Sok
          </h4>
          <p className="text-xs text-slate-300 mt-1">
            Girdiğin {subjects.length} ders ve {totalTopicsCount} konuyu yapay zeka incelesin veya doğrudan çalışma programını çıkarsın.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* AI Importance Report Button */}
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || subjects.length === 0}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Konular Analiz Ediliyor...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Önem Raporu Al
              </>
            )}
          </button>

          {/* Generate Schedule Button */}
          <button
            onClick={onGenerateSchedule}
            disabled={isGenerating || subjects.length === 0}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Program Oluşturuluyor...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                {totalDays} Günlük Programı Çıkar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
