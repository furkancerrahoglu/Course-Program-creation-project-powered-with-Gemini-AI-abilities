import {
  Subject,
  CurriculumAnalysisResult,
  GeneratedSchedule,
  RagDocument,
  ChatMessage,
} from '../types';

export async function fetchCurriculumAnalysis(
  subjects: Subject[],
  totalDays: number = 21,
  dailyHours: number = 6
): Promise<CurriculumAnalysisResult> {
  const payload = {
    subjects: subjects.map((s) => ({
      id: s.id,
      name: s.name,
      topics: s.topics,
      maxDailyHours: s.maxDailyHours,
    })),
    totalDays,
    dailyHours,
  };

  const res = await fetch('/api/assistant/analyze-curriculum', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ders analiz raporu alınırken hata oluştu.');
  }

  return res.json();
}

export async function fetchGeneratedSchedule(
  subjects: Subject[],
  totalDays: number = 21,
  startHour: number = 12,
  endHour: number = 19,
  preferences?: string
): Promise<GeneratedSchedule> {
  const payload = {
    subjects: subjects.map((s) => ({
      name: s.name,
      topics: s.topics,
      url: s.url,
      maxDailyHours: s.maxDailyHours,
    })),
    totalDays,
    startHour,
    endHour,
    preferences,
  };

  const res = await fetch('/api/assistant/generate-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Çalışma programı oluşturulurken hata oluştu.');
  }

  return res.json();
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  contextDocs: RagDocument[],
  subjects: Subject[],
  activeScheduleSummary?: string
): Promise<{ answer: string; citations?: string[] }> {
  const formattedHistory = history.map((m) => ({
    role: m.role,
    text: m.content,
  }));

  const payload = {
    message,
    history: formattedHistory,
    contextDocs: contextDocs.map((d) => ({
      name: d.name,
      content: d.content,
      type: d.type,
    })),
    subjects: subjects.map((s) => ({
      name: s.name,
      topics: s.topics,
    })),
    activeScheduleSummary,
  };

  const res = await fetch('/api/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Soru-cevap asistanı ile bağlantı kurulamadı.');
  }

  return res.json();
}
