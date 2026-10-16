import { Subject } from '../types';

export interface CurriculumTemplate {
  id: string;
  title: string;
  description: string;
  subjects: Subject[];
}

export const PRESET_CURRICULA: CurriculumTemplate[] = [
  {
    id: 'kpss-gygk',
    title: 'KPSS Genel Yetenek & Genel Kültür',
    description: 'Vatandaşlık, Coğrafya, Matematik & Problemler, Geometri ve Tarih için eksiksiz konu müfredatı.',
    subjects: [
      {
        id: 'vatandaslik',
        name: 'Vatandaşlık & Anayasa Hukuku',
        maxDailyHours: 3,
        url: 'https://youtube.com/playlist?list=PL8xiaE-wCWlbZ76PTYidbtuI-HO8gcIDl',
        topics: [
          'Temel Hukuk Kavramları & Normlar Hiyerarşisi',
          'Devlet Biçimleri, Hükümet Sistemleri ve Demokrasi',
          'Anayasa Tarihi (1921, 1924, 1961, 1982)',
          'Temel Hak ve Ödevler (Kişi, Sosyal, Siyasal Haklar)',
          'Yasama Organı (TBMM Yapısı, Görevleri, Kanunlaşma Süreci)',
          'Yürütme Organı (Cumhurbaşkanı, CB Kararnameleri, OHAL)',
          'Yargı Organı (Anayasa Mahkemesi, Yüksek Mahkemeler, HSK)',
          'İdare Hukuku ve Türkiye İdari Teşkilatı',
          'Uluslararası Kuruluşlar ve Güncel Olaylar'
        ],
      },
      {
        id: 'cografya',
        name: 'Coğrafya',
        maxDailyHours: 3,
        url: 'https://www.youtube.com/playlist?list=PLnBnugScc-7ImTQrm8DvvMFHByN5Pg31V',
        topics: [
          'Türkiye Coğrafi Konumu ve Jeopolitik Önemi',
          'Türkiye Yerşekilleri (Dağlar, Platolar, Ovalar, Karstik Şekiller)',
          'Türkiye İklimi ve Bitki Örtüsü',
          'Türkiye Su Varlığı (Akarsular, Göller, Yeraltı Suları)',
          'Türkiye Nüfus, Yerleşme ve Göç Dinamikleri',
          'Türkiye Tarım, Hayvancılık ve Ormancılık',
          'Türkiye Madenleri ve Enerji Kaynakları',
          'Türkiye Sanayi, Ticaret, Ulaşım ve Turizm',
          'Bölgesel Kalkınma Projeleri (GAP, DOKAP, KOP, ZBK)'
        ],
      },
      {
        id: 'matematik',
        name: 'Matematik Problemler & Sayılar',
        maxDailyHours: 4,
        url: 'https://youtube.com/playlist?list=PLKnwXmWGonPlQ_hNBRNZ1a7GSbqgosHNt',
        topics: [
          'Temel Kavramlar, Asal Sayılar ve Faktöriyel',
          'Sayı Basamakları ve Bölünebilme Kuralları',
          'EBOB - EKOK ve Periyodik Tekrar Eden Problemler',
          'Rasyonel ve Ondalık Sayılar',
          'Basit Eşitsizlikler ve Mutlak Değer',
          'Üslü ve Köklü Sayılar',
          'Çarpanlara Ayırma ve Özdeşlikler',
          'Oran - Orantı ve Sayı-Kesir Problemleri',
          'Yaş ve Yüzde - Kar - Zarar Problemleri',
          'Karışım, İşçi ve Hız-Hareket Problemleri',
          'Grafik & Tablo Yorumlama ve Mantık Soruları',
          'Kümeler, Fonksiyonlar, Permütasyon - Kombinasyon ve Olasılık'
        ],
      },
      {
        id: 'geometri',
        name: 'Geometri',
        maxDailyHours: 3,
        url: '',
        topics: [
          'Doğruda ve Üçgende Açılar',
          'Özel Üçgenler (Dik, İkizkenar, Eşkenar)',
          'Üçgende Açıortay ve Kenarortay Bağıntıları',
          'Üçgende Benzerlik ve Alan',
          'Çokgenler ve Özel Dörtgenler (Yamuk, Paralelkenar)',
          'Çember ve Daire (Açı, Uzunluk, Alan)',
          'Analitik Geometri (Nokta ve Doğrunun Analitiği)',
          'Katı Cisimler (Prizma, Silindir, Koni)'
        ],
      },
      {
        id: 'tarih',
        name: 'Tarih',
        maxDailyHours: 3,
        url: '',
        topics: [
          'İslamiyet Öncesi Türk Tarihi & Kültür Medeniyeti',
          'İlk Türk - İslam Devletleri ve Teşkilat Yapısı',
          'Türkiye (Anadolu) Selçuklu Devleti ve Beylikler',
          'Osmanlı Devleti Kuruluş ve Yükselme Dönemi',
          'Osmanlı Kültür ve Medeniyeti (Divan, Toprak, Ordu)',
          'Osmanlı Islahatları ve Dağılma Dönemi',
          'XX. Yüzyıl Başlarında Osmanlı ve I. Dünya Savaşı',
          'Kurtuluş Savaşı Hazırlık Dönemi (Genelgeler ve Kongreler)',
          'I. TBMM ve Kurtuluş Savaşı Muharebeleri',
          'Atatürk İnkılapları ve İlkeleri',
          'Çağdaş Türk ve Dünya Tarihi'
        ],
      }
    ]
  },
  {
    id: 'yks-tyt',
    title: 'YKS / TYT Genel Tekrar & Pekiştirme',
    description: 'TYT Türkçe, Matematik, Fen ve Sosyal için ana omurga konuları.',
    subjects: [
      {
        id: 'tyt-turkce',
        name: 'TYT Türkçe & Paragraf',
        maxDailyHours: 2,
        topics: [
          'Sözcükte ve Cümlede Anlam',
          'Paragrafta Yapı, Ana Fikir ve Yardımcı Fikirler',
          'Paragrafta Anlatım Teknikleri ve Hızlı Okuma Taktikleri',
          'Ses Bilgisi ve Yazım Kuralları',
          'Noktalama İşaretleri',
          'Sözcük Türleri (İsim, Sıfat, Zamir, Zarf, Edat, Bağlaç)',
          'Fiiller, Ek Eylem ve Fiilde Çatı',
          'Cümlenin Ögeleri ve Cümle Türleri',
          'Anlatım Bozuklukları'
        ],
      },
      {
        id: 'tyt-matematik',
        name: 'TYT Temel Matematik',
        maxDailyHours: 4,
        topics: [
          'Temel Kavramlar ve Sayı Kümeleri',
          'Basamak Kavramı ve Bölünebilme',
          'Rasyonel Sayılar, Eşitsizlik, Mutlak Değer',
          'Üslü ve Köklü İfadeler',
          'Çarpanlara Ayırma',
          'TYT Yeni Nesil Problemler (Sayı, Kesir, Yaş, Yüzde)',
          'Hız, Karışım ve Rutin Olmayan Problemler',
          'Fonksiyonlar ve Polinomlar Temel',
          'Olasılık ve Veri İstatistiği'
        ],
      },
      {
        id: 'tyt-fen',
        name: 'TYT Fen Bilimleri (Fizik, Kimya, Biyo)',
        maxDailyHours: 3,
        topics: [
          'Fizik: Madde ve Özellikleri, Hareket, Kuvvet',
          'Fizik: Enerji, Isı ve Sıcaklık, Optik',
          'Kimya: Kimya Disiplinleri, Atom ve Periyodik Sistem',
          'Kimya: Kimyasal Türler Arası Etkileşimler, Asit-Baz-Tuz',
          'Biyoloji: Canlıların Ortak Özellikleri, Hücre ve Organeller',
          'Biyoloji: Canlılar Dünyası, Kalıtım ve Ekoloji'
        ],
      }
    ]
  },
  {
    id: 'ozel-bos',
    title: 'Özel / Kendi Derslerimi Belirlemek İstiyorum',
    description: 'Sıfırdan dilediğiniz dersleri ve alt konuları elle yazıp ekleyin.',
    subjects: [
      {
        id: 'ders-1',
        name: '1. Dersim (Örn: Hukuk / Tıp / Programlama)',
        maxDailyHours: 3,
        topics: [
          'Temel Kavramlar ve Giriş',
          '2. Ünite ve Kritik Konular',
          'Uygulama ve Pratik Soru Çözümü'
        ],
      }
    ]
  }
];
