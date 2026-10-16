import React, { useState } from 'react';
import {
  CurriculumAnalysisResult,
  SubjectAnalysisItem,
  TopicAnalysisItem
} from '../types';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Filter,
  Download,
  Share2,
  RefreshCw,
  Award,
  Lightbulb,
  ShieldAlert,
  Flame,
  Star
} from 'lucide-react';

interface Props {
  report: CurriculumAnalysisResult | null;
  onRefresh: () => void;
  isAnalyzing: boolean;
  onGoToSchedule: () => void;
}

export const AnalysisReportView: React.FC<Props> = ({
  report,
  onRefresh,
  isAnalyzing,
  onGoToSchedule,
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [importanceFilter, setImportanceFilter] = useState<string>('all');

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">
          Ders ve Konu Başlıkları Değerlendiriliyor...
        </h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
          Yapay zeka asistanı konuların sınav ağırlıklarını, geçmiş soru frekanslarını, kritik püf noktalarını ve tahmini çalışma sürelerini hesaplıyor.
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Henüz Analiz Raporu Oluşturulmadı
        </h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
          Derslerinizi ve alt konularınızı girdikten sonra "Önem Raporu Al" butonuna tıklayarak kapsamlı strateji raporunu görüntüleyebilirsiniz.
        </p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Şimdi Konuları Analiz Et
        </button>
      </div>
    );
  }

  const getImportanceBadge = (importance: string) => {
    const lower = (importance || '').toLowerCase();
    if (lower.includes('kritik')) {
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-red-200">
          <Flame className="w-3 h-3 text-red-600" /> Kritik Önem
        </span>
      );
    }
    if (lower.includes('yüksek')) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-200">
          <Star className="w-3 h-3 text-amber-600" /> Yüksek Önem
        </span>
      );
    }
    if (lower.includes('orta')) {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">
          Orta Düzey
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
        Temel / Destek
      </span>
    );
  };

  const getDifficultyBadge = (difficulty: string) => {
    const lower = (difficulty || '').toLowerCase();
    if (lower.includes('zor')) {
      return <span className="text-xs text-rose-600 font-medium">Zorluk: Yüksek</span>;
    }
    if (lower.includes('orta')) {
      return <span className="text-xs text-amber-600 font-medium">Zorluk: Orta</span>;
    }
    return <span className="text-xs text-emerald-600 font-medium">Zorluk: Temel/Kolay</span>;
  };

  // Filter subjects
  const filteredSubjects = report.subjectsAnalysis.filter((subj) => {
    if (selectedSubjectFilter !== 'all' && subj.subjectName !== selectedSubjectFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full text-xs font-semibold mb-2 text-amber-100">
            <Award className="w-3.5 h-3.5 text-amber-300" /> Yapay Zeka Stratejik Danışmanlık Raporu
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Konu Önem Dereceleri & Çalışma Raporu
          </h2>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-1 max-w-2xl">
            Asistan tarafından hazırlanan bu raporda, hangi konulara ağırlık vermeniz gerektiği, sınav çıkma potansiyelleri ve kritik püf noktaları listelenmiştir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Yeniden Değerlendir
          </button>
          <button
            onClick={onGoToSchedule}
            className="inline-flex items-center gap-1.5 bg-white text-orange-900 hover:bg-amber-50 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            Programa Geç <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Strategic Summary & Golden Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Strategy */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Genel Çalışma Stratejisi & Yol Haritası
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {report.overallStrategy}
          </p>
        </div>

        {/* Key Recommendations */}
        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-sm border border-slate-800">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4" />
            Uymanız Gereken Altın Kurallar
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.keyRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Ders Filtrele:</span>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
          >
            <option value="all">Tüm Dersler ({report.subjectsAnalysis.length})</option>
            {report.subjectsAnalysis.map((s, idx) => (
              <option key={idx} value={s.subjectName}>
                {s.subjectName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Önem Filtrele:</span>
          <select
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
          >
            <option value="all">Tümü</option>
            <option value="kritik">Sadece Kritik</option>
            <option value="yüksek">Yüksek ve Kritik</option>
          </select>
        </div>
      </div>

      {/* Subject Details & Topic Breakdown */}
      <div className="space-y-6">
        {filteredSubjects.map((subj, sIdx) => {
          const visibleTopics = subj.topics.filter((t) => {
            if (importanceFilter === 'kritik') {
              return t.importance?.toLowerCase().includes('kritik');
            }
            if (importanceFilter === 'yüksek') {
              const lower = t.importance?.toLowerCase() || '';
              return lower.includes('kritik') || lower.includes('yüksek');
            }
            return true;
          });

          return (
            <div
              key={sIdx}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">{subj.subjectName}</h3>
                    {getImportanceBadge(subj.overallImportance)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    {subj.strategySummary}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Önerilen Toplam: ~{subj.recommendedTotalHours} Saat
                  </span>
                </div>
              </div>

              {/* Topics Table / Cards */}
              <div className="divide-y divide-slate-100">
                {visibleTopics.map((topic, tIdx) => (
                  <div key={tIdx} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                          {tIdx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-slate-800">{topic.topicName}</h4>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {getImportanceBadge(topic.importance)}
                        <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono font-bold">
                          Skor: {topic.importanceScore}/10
                        </span>
                        {getDifficultyBadge(topic.difficulty)}
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ~{topic.estimatedHours}s
                        </span>
                      </div>
                    </div>

                    {/* Weight & Tips Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                      {/* Sınav Ağırlığı */}
                      <div className="bg-amber-50/60 rounded-lg p-3 border border-amber-150">
                        <span className="font-bold text-amber-900 block mb-0.5 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-700" />
                          Sınav Çıkma Potansiyeli
                        </span>
                        <p className="text-amber-800/90 leading-relaxed">
                          {topic.examWeight}
                        </p>
                      </div>

                      {/* Püf Noktaları */}
                      <div className="bg-indigo-50/60 rounded-lg p-3 border border-indigo-150">
                        <span className="font-bold text-indigo-950 block mb-0.5 flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
                          Kritik Püf Noktalar & Taktikler
                        </span>
                        <p className="text-indigo-900/90 leading-relaxed">
                          {topic.keyTips}
                        </p>
                      </div>
                    </div>

                    {/* Common Pitfalls if any */}
                    {topic.commonPitfalls && (
                      <div className="mt-2 text-xs bg-rose-50 text-rose-800 rounded-lg p-2.5 border border-rose-150 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span>
                          <b>Tuzak Noktalar / Sık Yapılan Hatalar:</b> {topic.commonPitfalls}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {visibleTopics.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Seçili filtreye uygun alt konu bulunamadı.
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
