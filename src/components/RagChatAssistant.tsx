import React, { useState, useEffect, useRef } from 'react';
import {
  RagDocument,
  ChatMessage,
  Subject,
  GeneratedSchedule
} from '../types';
import { sendChatMessage } from '../lib/assistantApi';
import {
  Send,
  Upload,
  FileText,
  Trash2,
  Sparkles,
  Bot,
  User,
  Paperclip,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  PlusCircle,
  FileCode,
  ShieldCheck,
  ChevronDown,
  Layers,
  Search
} from 'lucide-react';

interface Props {
  subjects: Subject[];
  generatedSchedule: GeneratedSchedule | null;
}

export const RagChatAssistant: React.FC<Props> = ({ subjects, generatedSchedule }) => {
  const [documents, setDocuments] = useState<RagDocument[]>(() => {
    try {
      const saved = localStorage.getItem('study_assistant_docs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default initial sample study note to jumpstart RAG experience immediately
    return [
      {
        id: 'doc-sample-1',
        name: 'Vatandaşlık_Önemli_Notlar_2026.txt',
        content: `VATANDAŞLIK VE ANAYASA HUKUKU ÖNEMLİ DERS NOTLARI:
1. TBMM Üye Sayısı: 600 milletvekilidir. Genel seçimler 5 yılda bir yapılır.
2. TBMM Başkanı seçimi 4 turludur. İlk 2 turda üye tamsayısının 2/3'ü (400), 3. turda salt çoğunluk (301) aranır.
3. Cumhurbaşkanlığı Kararnameleri: Yürütme yetkisine ilişkin konularda çıkarılır. Anayasada münhasıran kanunla düzenlenmesi öngörülen konularda çıkarılamaz. Kanunla kararname çatışırsa kanun hükümleri uygulanır.
4. Olağanüstü Hal (OHAL): Cumhurbaşkanı tarafından en fazla 6 aylığına ilan edilir. TBMM onayına sunulur. TBMM süreyi her defasında 4 ayı geçmemek üzere uzatabilir.
5. Anayasa Mahkemesi: 15 üyeden oluşur. 3 üyeyi TBMM, 12 üyeyi Cumhurbaşkanı seçer. Görev süreleri 12 yıldır.`,
        type: 'txt',
        uploadedAt: new Date().toLocaleDateString('tr-TR'),
        size: 1420,
        chunkCount: 1,
      },
    ];
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('study_assistant_chat');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'msg-welcome',
        role: 'model',
        content:
          'Merhaba! Ben senin yapay zeka destekli Çalışma Asistanınım. 📚\n\nBana derslerinle, alt konularınla veya sınav stratejinle ilgili dilediğin soruyu sorabilirsin. Yüklediğin ders notlarından ve belgelerden (RAG Bilgi Tabanı) referans alarak cevap verebilirim. Yüklediğin notlarda olmasa bile geniş akademik ve sınav bilgimle her zaman yanındayım!\n\nNasıl yardımcı olabilirim?',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [customNoteTitle, setCustomNoteTitle] = useState('');
  const [customNoteContent, setCustomNoteContent] = useState('');
  const [showDocsPanel, setShowDocsPanel] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save docs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('study_assistant_docs', JSON.stringify(documents));
    } catch (e) {}
  }, [documents]);

  // Save chat to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('study_assistant_chat', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const newDoc: RagDocument = {
          id: `doc-${Date.now()}-${i}`,
          name: file.name,
          content: text,
          type: file.name.split('.').pop() || 'txt',
          uploadedAt: new Date().toLocaleDateString('tr-TR'),
          size: file.size,
          chunkCount: Math.ceil(text.length / 1000),
        };
        setDocuments((prev) => [newDoc, ...prev]);
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddCustomNote = () => {
    if (!customNoteContent.trim()) return;
    const title = customNoteTitle.trim() || `Ders Notu - ${new Date().toLocaleDateString('tr-TR')}`;
    const newDoc: RagDocument = {
      id: `doc-${Date.now()}`,
      name: `${title}.txt`,
      content: customNoteContent.trim(),
      type: 'note',
      uploadedAt: new Date().toLocaleDateString('tr-TR'),
      size: customNoteContent.length,
      chunkCount: Math.ceil(customNoteContent.length / 1000),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setCustomNoteTitle('');
    setCustomNoteContent('');
    setShowNoteModal(false);
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      const scheduleSummary = generatedSchedule
        ? `Program: ${generatedSchedule.scheduleTitle}, Toplam ${generatedSchedule.days.length} Gün.`
        : '';

      const res = await sendChatMessage(
        query,
        newHistory,
        documents,
        subjects,
        scheduleSummary
      );

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        citations: res.citations && res.citations.length > 0 ? res.citations : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Üzgünüm, cevap üretilirken bir hata oluştu: ${error.message || 'Bağlantı hatası.'}`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (confirm('Sohbet geçmişini temizlemek istediğine emin misin?')) {
      setMessages([
        {
          id: 'msg-welcome-new',
          role: 'model',
          content: 'Sohbet temizlendi. Derslerinle veya notlarınla ilgili sormak istediğin bir konu var mı?',
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const sampleQuestions = [
    'Yüklediğim notlara göre Anayasa Mahkemesi üye seçim kuralları nelerdir?',
    'Vatandaşlık Yasama ve Yürütme farklarını sınav odaklı özetle.',
    'Coğrafya Türkiye iklimi ve bitki örtüsünden 3 adet test sorusu sor.',
    'Matematikte problemler için en kritik formül ve taktikleri ver.',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left Column: Knowledge Base / Uploaded Documents (RAG) */}
      <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-800">
              RAG Not Bilgi Tabanı ({documents.length})
            </h3>
          </div>
          <button
            onClick={() => setShowDocsPanel(!showDocsPanel)}
            className="lg:hidden text-xs text-slate-500 hover:text-slate-800"
          >
            {showDocsPanel ? 'Gizle' : 'Göster'}
          </button>
        </div>

        {/* Panel Body */}
        {showDocsPanel && (
          <div className="p-4 space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Kendi özetlerini, PDF/TXT notlarını veya soru çözümlerini buraya yükle. Asistan sorularını yanıtlarken öncelikle bu belgelerinden faydalanacaktır.
            </p>

            {/* Action Buttons: File Upload & Custom Note Paste */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.json,.csv,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Dosya / Not Yükle (.txt, .md)
              </label>

              <button
                type="button"
                onClick={() => setShowNoteModal(true)}
                className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Metin / Ders Notu Yapıştır
              </button>
            </div>

            {/* Uploaded Documents List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pt-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition-colors flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {doc.uploadedAt} • ~{Math.round(doc.size / 1024 * 10) / 10} KB
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveDoc(doc.id)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded"
                    title="Notu Kaldır"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400 italic">
                  Henüz belge yüklenmedi.
                </div>
              )}
            </div>

            {/* RAG Status info */}
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <b>RAG Aktif:</b> Sorularınız önce bu notlarda taranır, bulunamayan veya genel konularda yapay zekanın kendi bilgisi otomatik devreye girer.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Interactive Chat Interface */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                Akademik Çalışma Asistanı
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-500">
                Gemini 3.8 Flash • RAG Destekli & Soru-Cevap Koçu
              </p>
            </div>
          </div>

          <button
            onClick={handleClearChat}
            className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors flex items-center gap-1"
            title="Sohbeti Temizle"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Temizle
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isBot = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isBot
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {isBot ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] space-y-1 ${isBot ? '' : 'text-right'}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed text-left whitespace-pre-wrap ${
                      isBot
                        ? msg.isError
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-sm shadow-sm'
                        : 'bg-indigo-600 text-white rounded-tr-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Citations / Sources Pill */}
                  {isBot && msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                      <span className="font-semibold text-indigo-700">Referans Alınan Belgeler:</span>
                      {msg.citations.map((cite, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[10px]"
                        >
                          <FileText className="w-2.5 h-2.5" /> {cite}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta: Timestamp & Copy */}
                  <div
                    className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 ${
                      isBot ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {isBot && (
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="hover:text-slate-600 transition-colors"
                        title="Yanıtı Kopyala"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-sm p-3.5 text-xs text-slate-500 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Asistan yanıt hazırlıyor ve notlarınızı tarıyor...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompts */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">Hızlı Sorular:</span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs shrink-0 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Asistana soru sor, konu özeti iste veya notlarından soru üretmesini söyle..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl disabled:opacity-40 transition-colors shadow-sm"
              title="Gönder"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Modal: Metin / Not Yapıştır */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              Ders Notu / Özet Metni Ekle
            </h3>
            <p className="text-xs text-slate-500">
              Ders kitaplarından, hocanın özetlerinden veya kendi tuttuğun notlardan metin yapıştır. RAG sistemi bu notu anında indeksler.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Not Başlığı
              </label>
              <input
                type="text"
                value={customNoteTitle}
                onChange={(e) => setCustomNoteTitle(e.target.value)}
                placeholder="Örn: Coğrafya Madenler ve Sanayi Özeti"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Not İçeriği
              </label>
              <textarea
                rows={7}
                value={customNoteContent}
                onChange={(e) => setCustomNoteContent(e.target.value)}
                placeholder="Buraya konu özetinizi veya notlarınızı yapıştırın..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleAddCustomNote}
                disabled={!customNoteContent.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-40"
              >
                Notu Bilgi Tabanına Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
