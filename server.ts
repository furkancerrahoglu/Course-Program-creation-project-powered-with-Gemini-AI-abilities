import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini AI client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Resilient Gemini caller with automatic retry and model fallback (e.g. 503 high demand)
async function callGeminiWithFallback(params: any, retries = 2): Promise<any> {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const isTransient =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('429');
        if (isTransient && attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        break;
      }
    }
  }
  throw lastError;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * AI Curriculum Analysis:
 * Rates importance, exam relevance, difficulty, key pitfalls, and study strategy.
 */
app.post('/api/assistant/analyze-curriculum', async (req, res) => {
  try {
    const { subjects, totalDays = 21, dailyHours = 6 } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'Geçerli ders ve konu listesi gereklidir.' });
    }

    const prompt = `Aşağıdaki dersleri ve alt konularını titizlikle incele. Öğrenci bu konuları ${totalDays} günlük (yaklaşık ${Math.ceil(
      totalDays / 7
    )} haftalık) yoğun bir çalışma programında, günde ortalama ${dailyHours} saat çalışarak bitirmeyi hedefliyor.

Dersler ve Konular:
${JSON.stringify(subjects, null, 2)}

Lütfen her ders ve alt konusu için:
1. Önem derecesi ("Kritik", "Yüksek", "Orta", "Temel") ve önem skoru (1-10).
2. Sınavlarda (KPSS / ÖSYM vb.) çıkma ağırlığı ve soru potansiyeli.
3. Çalışılırken dikkat edilmesi gereken en kritik püf noktalar, tuzak noktalar veya akılda tutma yöntemleri.
4. Tahmini gereken çalışma süresi (saat).
5. Genel 3 haftalık / belirlenen süre için stratejik çalışma yol haritası ve tavsiyeler.

Yanıtı kesinlikle belirtilen JSON şemasına uygun olarak üret.`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction:
          'Sen Türkiye genel sınavları (KPSS, YKS, ALES, DGS, Üniversite) ve pedagojik öğrenme teknikleri konusunda uzmanlaşmış kıdemli bir Akademik Koç ve Eğitim Danışmanısın. Konuları önem derecelerine ve sınav ağırlıklarına göre en gerçekçi, yapıcı ve stratejik şekilde analiz et.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallStrategy: {
              type: Type.STRING,
              description: 'Tüm program için genel stratejik planlama ve haftalık dağılım önerileri.',
            },
            keyRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Öğrencinin mutlaka uyması gereken 4-6 altın kural.',
            },
            subjectsAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subjectId: { type: Type.STRING },
                  subjectName: { type: Type.STRING },
                  overallImportance: { type: Type.STRING },
                  recommendedTotalHours: { type: Type.NUMBER },
                  strategySummary: { type: Type.STRING },
                  topics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        topicName: { type: Type.STRING },
                        importance: { type: Type.STRING }, // "Kritik", "Yüksek", "Orta", "Temel"
                        importanceScore: { type: Type.NUMBER }, // 1-10
                        difficulty: { type: Type.STRING }, // "Kolay", "Orta", "Zor"
                        examWeight: { type: Type.STRING },
                        estimatedHours: { type: Type.NUMBER },
                        keyTips: { type: Type.STRING },
                        commonPitfalls: { type: Type.STRING },
                      },
                      required: ['topicName', 'importance', 'importanceScore', 'examWeight', 'estimatedHours', 'keyTips'],
                    },
                  },
                },
                required: ['subjectName', 'overallImportance', 'recommendedTotalHours', 'strategySummary', 'topics'],
              },
            },
          },
          required: ['overallStrategy', 'keyRecommendations', 'subjectsAnalysis'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.warn('Gemini curriculum analysis fallback activated:', error?.message);
    const fallbackReport = generateCurriculumAnalysisFallback(
      req.body.subjects,
      req.body.totalDays || 21,
      req.body.dailyHours || 6
    );
    res.json(fallbackReport);
  }
});

function generateCurriculumAnalysisFallback(subjects: any[], totalDays: number, dailyHours: number) {
  const totalWeeks = Math.ceil(totalDays / 7);
  const subjectsAnalysis = subjects.map((subj) => {
    const topics = (subj.topics || []).map((topicName: string, idx: number) => {
      const lower = topicName.toLowerCase();
      let importance = 'Orta';
      let score = 7;
      let examWeight = 'Sınavlarda ortalama 1-2 soru potansiyeline sahiptir.';
      let keyTips = 'Temel tanımları net kavrayın ve soru tiplerine göre pratik yapın.';
      let pitfalls = 'Kavram yanılgılarına ve çeldirici şıklara dikkat edilmelidir.';
      let difficulty = 'Orta';

      if (
        lower.includes('problem') ||
        lower.includes('yasama') ||
        lower.includes('yürütme') ||
        lower.includes('yargı') ||
        lower.includes('yerşekilleri') ||
        lower.includes('maden') ||
        lower.includes('üçgen') ||
        lower.includes('inkılap')
      ) {
        importance = 'Kritik';
        score = 9;
        difficulty = 'Zor';
        examWeight = 'Her yıl mutlaka en az 2-4 belirleyici soru gelir; sınavın ana omurgasıdır.';
        keyTips = 'ÖSYM kalıplarını ve çıkmış soruları mutlaka çözün. Formülleri mantığıyla öğrenin.';
        pitfalls = 'Zaman kaybettiren uzun işlem adımlarına veya istisnai anayasa maddelerine takılmayın.';
      } else if (
        lower.includes('iklim') ||
        lower.includes('fonksiyon') ||
        lower.includes('paragraf') ||
        lower.includes('nüfus') ||
        lower.includes('sayı') ||
        lower.includes('özdeşlik')
      ) {
        importance = 'Yüksek';
        score = 8;
        examWeight = 'Her sınav döneminde kesinlikle soru gelen kritik konu başlıklarındandır.';
        keyTips = 'Soru çözme hızınızı artırmak için süre tutarak çalışın.';
      } else if (idx === 0) {
        importance = 'Temel';
        score = 6;
        difficulty = 'Kolay';
        examWeight = 'Sonraki ileri konuların anlaşılması için olmazsa olmaz temel konudur.';
        keyTips = 'Konunun mantığını oturtup hızlıca soru çözümüne geçin.';
      }

      return {
        topicName,
        importance,
        importanceScore: score,
        difficulty,
        examWeight,
        estimatedHours: Math.max(2, Math.min(6, Math.round(dailyHours * 0.7))),
        keyTips,
        commonPitfalls: pitfalls,
      };
    });

    return {
      subjectId: subj.id || subj.name,
      subjectName: subj.name,
      overallImportance: topics.some((t: any) => t.importance === 'Kritik') ? 'Kritik' : 'Yüksek',
      recommendedTotalHours: Math.round((dailyHours * totalDays) / Math.max(1, subjects.length)),
      strategySummary: `${subj.name} dersinde konuların mantıksal sıralamasına sadık kalınmalı, her konudan sonra en az 40 soru taranmalıdır.`,
      topics,
    };
  });

  return {
    overallStrategy: `${totalDays} günlük (${totalWeeks} haftalık) bu yoğun çalışma döneminde dengeli ve sürdürülebilir bir tempo esastır. 1. hafta temel kavramlar ve konu oturtma, 2. hafta problem ve çıkmış soru taraması, 3. hafta ise branş denemeleri ve hata defteri tekrarı ile tamamlanmalıdır.`,
    keyRecommendations: [
      'Günde en fazla 2 veya 3 farklı ders çalışarak zihinsel yorgunluğu önleyin.',
      'Kritik olarak işaretlenen konulara %40 daha fazla soru çözüm zamanı ayırın.',
      'Her pazar gününü o haftanın yanlış yapılan sorularını yeniden çözmeye ayırın.',
      'Ders çalışırken her 50 dakikada bir 10 dakika mola verin (Pomodoro tekniği).',
      'Yüklediğiniz ders notlarını ve formül kağıtlarını günün ilk 15 dakikasında hızlıca gözden geçirin.',
    ],
    subjectsAnalysis,
  };
}

/**
 * AI-assisted Day-by-Day Schedule Generator
 */
app.post('/api/assistant/generate-schedule', async (req, res) => {
  try {
    const { subjects, totalDays = 21, startHour = 12, endHour = 19, preferences } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'Geçerli ders ve konu listesi gereklidir.' });
    }

    const prompt = `Öğrenci için ${totalDays} günlük (saat ${startHour}:00 ile ${endHour}:00 arasında) kapsamlı, dengeli bir çalışma tablosu oluştur.
Dersler ve Alt Başlıklar:
${JSON.stringify(subjects, null, 2)}
Özel Tercihler: ${preferences || 'Her gün dengeli ders dağılımı, haftanın son günü tekrar ve soru çözümü.'}

Kurallar:
- Her gün için gün numarası (1'den ${totalDays}'e), gün etiketi (Örn: "1. Hafta Pazartesi", "1. Gün"), o gün çalışılacak dersler, konular, başlama-bitiş saatleri ve çalışma hedefi belirtilmelidir.
- Konular birbirini takip eden mantıksal bir sırayla yerleştirilmelidir.
- Haftada en az 1 tekrar/deneme veya soru pekiştirme seansı eklenmelidir.
- Yanıtı sadece belirtilen JSON şeması ile ver.`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction:
          'Sen uzman bir çalışma programı mimarısın. Öğrencinin seçtiği ders ve konuları belirtilen gün sayısına mantıklı, yormayan ve verimli şekilde dağıt.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scheduleTitle: { type: Type.STRING },
            summary: { type: Type.STRING },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayIndex: { type: Type.NUMBER }, // 1 to totalDays
                  dayLabel: { type: Type.STRING },
                  weekNumber: { type: Type.NUMBER },
                  focusTheme: { type: Type.STRING },
                  sessions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        subjectName: { type: Type.STRING },
                        topicName: { type: Type.STRING },
                        startTime: { type: Type.STRING }, // "12:00"
                        endTime: { type: Type.STRING },   // "13:30"
                        durationMins: { type: Type.NUMBER },
                        targetGoal: { type: Type.STRING },
                        isRevision: { type: Type.BOOLEAN },
                      },
                      required: ['subjectName', 'topicName', 'startTime', 'endTime', 'durationMins', 'targetGoal'],
                    },
                  },
                },
                required: ['dayIndex', 'dayLabel', 'weekNumber', 'sessions'],
              },
            },
          },
          required: ['scheduleTitle', 'summary', 'days'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.warn('Gemini schedule generation fallback activated:', error?.message);
    const fallbackSchedule = generateScheduleFallback(
      req.body.subjects,
      req.body.totalDays || 21,
      req.body.startHour || 12,
      req.body.endHour || 19
    );
    res.json(fallbackSchedule);
  }
});

function generateScheduleFallback(
  subjects: any[],
  totalDays: number,
  startHour: number,
  endHour: number
) {
  const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const days: any[] = [];
  const totalWeeks = Math.ceil(totalDays / 7);

  // Flatten all subject topics into a prioritized queue
  interface TopicQueueItem {
    subjectName: string;
    topicName: string;
    videoUrl?: string;
  }
  const queue: TopicQueueItem[] = [];

  subjects.forEach((s) => {
    (s.topics || []).forEach((t: string) => {
      queue.push({
        subjectName: s.name,
        topicName: t,
        videoUrl: s.url,
      });
    });
  });

  let queueIdx = 0;
  const availableDailyHours = Math.max(3, endHour - startHour);
  const sessionDuration = 90; // 1.5 hours per session

  for (let day = 1; day <= totalDays; day++) {
    const dayOfWeek = (day - 1) % 7;
    const weekNumber = Math.ceil(day / 7);
    const dayLabel = `${weekNumber}. Hafta ${dayNames[dayOfWeek]} (${day}. Gün)`;
    const sessions: any[] = [];

    // Is it a review / rest day? (Sunday or every 7th day)
    const isReviewDay = day % 7 === 0;

    let currentMinute = startHour * 60;

    if (isReviewDay) {
      // Review day structure
      const reviewThemes = [
        {
          name: 'Haftalık Konu Tekrarı',
          goal: 'Bu hafta işlenen tüm ders özetlerinin gözden geçirilmesi ve formül kartı tekrarı',
        },
        {
          name: 'Haftalık Soru Bankası Taraması',
          goal: 'Yanlış yapılan ve boş bırakılan soruların analiz edilmesi, en az 50 soru çözümü',
        },
        {
          name: 'Branş Denemesi & Zaman Provası',
          goal: 'Süre tutarak karma branş deneme çözümü ve net analizi',
        },
      ];

      reviewThemes.forEach((item) => {
        const startH = Math.floor(currentMinute / 60)
          .toString()
          .padStart(2, '0');
        const startM = (currentMinute % 60).toString().padStart(2, '0');
        currentMinute += sessionDuration;
        const endH = Math.floor(currentMinute / 60)
          .toString()
          .padStart(2, '0');
        const endM = (currentMinute % 60).toString().padStart(2, '0');
        currentMinute += 15; // 15 min break

        sessions.push({
          subjectName: 'Genel Tekrar & Deneme',
          topicName: item.name,
          startTime: `${startH}:${startM}`,
          endTime: `${endH}:${endM}`,
          durationMins: sessionDuration,
          targetGoal: item.goal,
          isRevision: true,
        });
      });

      days.push({
        dayIndex: day,
        dayLabel,
        weekNumber,
        focusTheme: 'Haftalık Pekiştirme, Soru Çözümü ve Deneme Günü',
        sessions,
      });
    } else {
      // Normal study day: 2-3 sessions
      const sessionsPerDay = Math.min(3, Math.max(2, Math.floor(availableDailyHours / 1.5)));

      for (let s = 0; s < sessionsPerDay; s++) {
        let topicItem: TopicQueueItem;
        if (queue.length > 0) {
          topicItem = queue[queueIdx % queue.length];
          queueIdx++;
        } else {
          topicItem = {
            subjectName: subjects[s % subjects.length]?.name || 'Ders',
            topicName: 'Soru Çözümü ve Pekiştirme',
          };
        }

        const startH = Math.floor(currentMinute / 60)
          .toString()
          .padStart(2, '0');
        const startM = (currentMinute % 60).toString().padStart(2, '0');
        currentMinute += sessionDuration;
        const endH = Math.floor(currentMinute / 60)
          .toString()
          .padStart(2, '0');
        const endM = (currentMinute % 60).toString().padStart(2, '0');
        currentMinute += 15; // 15 min break

        sessions.push({
          subjectName: topicItem.subjectName,
          topicName: topicItem.topicName,
          startTime: `${startH}:${startM}`,
          endTime: `${endH}:${endM}`,
          durationMins: sessionDuration,
          targetGoal: 'Konu kavrama, kilit notların çıkarılması ve en az 30 örnek soru çözümü',
          isRevision: false,
          videoUrl: topicItem.videoUrl,
        });
      }

      days.push({
        dayIndex: day,
        dayLabel,
        weekNumber,
        focusTheme: `${sessions.map((x) => x.subjectName).filter((v, i, a) => a.indexOf(v) === i).join(' & ')} Odaklı Çalışma`,
        sessions,
      });
    }
  }

  return {
    scheduleTitle: `${totalDays} Günlük (${totalWeeks} Haftalık) Stratejik Çalışma Tablosu`,
    summary: `${subjects.length} ders ve tüm alt konular, saat ${startHour}:00 ile ${endHour}:00 arasında dengeli seanslar, dinlenme aralıkları ve haftalık deneme günleri ile planlandı.`,
    days,
  };
}

/**
 * RAG & Interactive AI Chat Assistant:
 * Combines uploaded documents & notes with Gemini knowledge.
 */
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      contextDocs = [],
      subjects = [],
      activeScheduleSummary = '',
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Soru mesajı gereklidir.' });
    }

    // Prepare RAG context from uploaded documents
    let ragContextText = '';
    const citedDocs: string[] = [];

    if (Array.isArray(contextDocs) && contextDocs.length > 0) {
      ragContextText += '=== KULLANICININ YÜKLEDİĞİ BELGELER VE NOTLAR (RAG BİLGİ TABANI) ===\n';
      contextDocs.forEach((doc: { name: string; content: string; type?: string }, idx: number) => {
        const snippet = doc.content ? doc.content.slice(0, 12000) : '';
        ragContextText += `--- BELGE ${idx + 1}: ${doc.name} ---\n${snippet}\n\n`;
        if (!citedDocs.includes(doc.name)) {
          citedDocs.push(doc.name);
        }
      });
      ragContextText += '=== BELGE BİLGİ TABANI SONU ===\n\n';
    }

    let subjectsContext = '';
    if (Array.isArray(subjects) && subjects.length > 0) {
      subjectsContext = `Öğrencinin Çalıştığı Dersler ve Konular:\n${JSON.stringify(
        subjects.map((s: any) => ({ name: s.name, topics: s.topics })),
        null,
        2
      )}\n\n`;
    }

    if (activeScheduleSummary) {
      subjectsContext += `Mevcut Çalışma Takvimi Özeti:\n${activeScheduleSummary}\n\n`;
    }

    const systemInstruction = `Sen "Çalışma Asistanı" adlı, üst düzey yapay zeka destekli bir çalışma koçu, konu anlatım uzmanı ve soru-cevap asistanısın.

Önemli Görevlerin ve Kuralların:
1. RAG BİLGİ TABANI KULLANIMI: Kullanıcının yüklediği belgeler ve notlar varsa, kullanıcının sorusuna cevap verirken öncelikle bu belgelerdeki bilgileri temel al ve açıkça "Yüklediğiniz [Belge Adı] notunuza göre..." veya "[Kaynak: Belge Adı]" şeklinde referans ver.
2. DAİMA CEVAP VERME VE YAPAY ZEKA GÜCÜ: Kullanıcının sorusu yüklenen belgelerde bulunmasa bile veya hiç belge yüklenmemiş olsa dahi, kendi geniş akademik ve sınav bilginle devreye gir. Asla "bilmiyorum" veya "notlarda yok" deyip kestirip atma; konuyu derinlemesine açıkla, mantığını kavrat, püf noktalarını söyle ve örnek sorularla destekle.
3. ÇALIŞMA PROGRAMI REHBERLİĞİ: Öğrencinin dersleri, alt konuları ve 3 haftalık programı hakkında sorduğu sorulara rehberlik et. "Bugün ne çalışmalıyım?", "Bu konuyu nasıl tekrar etmeliyim?" gibi sorularına motive edici ve somut öneriler sun.
4. KAPSAMLI VE ANLAŞILIR DİL: Yanıtlarını Türkçe, açık, pedagojik ve gerektiğinde madde işaretleriyle düzenle. Matematik veya teknik konularda adım adım çözüm göster. Soru sorduğunda ise açıklayıcı ve pekiştirici geri bildirim ver.`;

    // Format chat contents
    const contents: any[] = [];

    // Include prior conversation turns if provided
    if (Array.isArray(history) && history.length > 0) {
      // Keep last 10 messages for context
      const recentHistory = history.slice(-10);
      for (const turn of recentHistory) {
        if (turn.role === 'user' || turn.role === 'model') {
          contents.push({
            role: turn.role,
            parts: [{ text: turn.text || turn.content || '' }],
          });
        }
      }
    }

    // Add current user prompt with context
    const userPromptWithContext = `${ragContextText}${subjectsContext}Kullanıcı Sorusu: ${message}`;
    contents.push({
      role: 'user',
      parts: [{ text: userPromptWithContext }],
    });

    const response = await callGeminiWithFallback({
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const answer = response.text || 'Üzgünüm, cevap üretilirken bir sorun oluştu.';
    res.json({
      answer,
      citations: contextDocs.length > 0 ? citedDocs : [],
    });
  } catch (error: any) {
    console.warn('Gemini chat fallback activated:', error?.message);
    const fallbackResponse = generateChatFallback(
      req.body.message,
      req.body.contextDocs || [],
      req.body.subjects || []
    );
    res.json(fallbackResponse);
  }
});

function generateChatFallback(message: string, contextDocs: any[], subjects: any[]) {
  const queryWords = message
    .toLowerCase()
    .replace(/[.,?!:;]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const citedDocs: string[] = [];
  let bestDocSnippet = '';
  let bestMatchScore = 0;
  let bestDocName = '';

  for (const doc of contextDocs) {
    const content = doc.content || '';
    const contentLower = content.toLowerCase();
    let score = 0;
    queryWords.forEach((word) => {
      if (contentLower.includes(word)) {
        score++;
      }
    });

    if (score > bestMatchScore) {
      bestMatchScore = score;
      bestDocName = doc.name;
      // Extract lines or sentences containing the words
      const lines = content.split('\n');
      const matchedLines = lines.filter((l: string) =>
        queryWords.some((w) => l.toLowerCase().includes(w))
      );
      bestDocSnippet = matchedLines.slice(0, 5).join('\n') || content.slice(0, 400);
    }
  }

  if (bestMatchScore > 0 && bestDocName) {
    citedDocs.push(bestDocName);
    return {
      answer: `Yüklediğiniz **${bestDocName}** belgeniz ve notlarınız incelendiğinde bu konuyla ilgili şu önemli bilgiler yer almaktadır:\n\n📌 **Notlarınızdan İlgili Bölüm:**\n${bestDocSnippet}\n\n💡 **Akademik Tavsiye:** Bu bilgiler sınavda doğrudan veya öncüllü sorularda belirleyici olabilir. Konunun mantığını kavramak için ilgili ünite testlerini süre tutarak çözmenizi öneririm.`,
      citations: citedDocs,
    };
  }

  // General subject tutor guidance
  const lowerMsg = message.toLowerCase();
  let subjectAdvice = '';

  if (lowerMsg.includes('vatandaşlık') || lowerMsg.includes('anayasa') || lowerMsg.includes('tbmm')) {
    subjectAdvice =
      'Vatandaşlık ve Anayasa Hukukunda özellikle **Yasama (TBMM yapısı, kanunlaşma), Yürütme (Cumhurbaşkanı kararnameleri) ve Yargı (Anayasa Mahkemesi üye yapısı)** ünitelerine yoğunlaşın. Sayısal çoğunlukları (301, 360, 400) ve kanun-kararname hiyerarşisini tablo halinde ezberleyin.';
  } else if (lowerMsg.includes('coğrafya') || lowerMsg.includes('iklim') || lowerMsg.includes('harita')) {
    subjectAdvice =
      "Coğrafyada ezber yerine mutlaka **dilsiz harita** üzerinde çalışın. Türkiye'nin fay hatları, dağları, platoları ve maden yataklarının bölgesel dağılımını görselleştirerek çalışmak kalıcılığı en üst seviyeye çıkaracaktır.";
  } else if (lowerMsg.includes('problem') || lowerMsg.includes('matematik') || lowerMsg.includes('sayı')) {
    subjectAdvice =
      'Matematik problemlerinde başarı, denklemi hızlı ve doğru kurmaktan geçer. Sayı, kesir, yaş ve yüzde problemlerinde her gün düzenli olarak en az 20 soru çözerek işlem hızınızı ve okuduğunu anlama pratiğinizi koruyun.';
  } else {
    subjectAdvice =
      '3 haftalık çalışma programınızda her konunun ardından çıkmış soruları tarayın. Eksik hissettiğiniz noktaları sol taraftaki RAG Not Bilgi Tabanına yapıştırırsanız, o notlar üzerinden size özel soru üretebilir ve kavramları açıklayabilirim.';
  }

  return {
    answer: `Merhaba! Sorunuzu ve çalışma hedeflerinizi değerlendirdim:\n\n${subjectAdvice}\n\nKonuyla ilgili kafanıza takılan belirli bir soru, formül veya yüklediğiniz notlardan detaylı soru-cevap yapmak istediğiniz bir bölüm varsa lütfen yazın, birlikte çözelim! 🚀`,
    citations: citedDocs,
  };
}

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: Number(PORT),
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
