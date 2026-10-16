import { VideoItem, Subject, SubjectWithVideos } from '../types';

export function parseVideoIndices(input: string): number[] {
  if (!input || !input.trim()) return [];
  const parts = input.split(/[,;\s]+/);
  const indices = new Set<number>();

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // Check range like 14-18
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
        for (let i = start; i <= end; i++) {
          indices.add(i);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num > 0) {
        indices.add(num);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

export function extractPlaylistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Eğer doğrudan liste ID'si girilmişse (örn: PL... veya 10+ karakter)
  if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const urlString = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    const parsedUrl = new URL(urlString);
    const list = parsedUrl.searchParams.get('list');
    if (list) return list.trim();
  } catch (error) {
    // URL parse hatası durumunda regex fallback
  }

  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (match) return match[1].trim();

  return null;
}

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  return h * 60 + m + Math.ceil(s / 60);
}

function cleanTitles(videos: VideoItem[]) {
  if (videos.length < 2) return;

  // Bulunan ortak prefix'i sil
  let prefix = videos[0].title;
  for (const v of videos) {
    let i = 0;
    while (i < prefix.length && i < v.title.length && prefix[i] === v.title[i]) i++;
    prefix = prefix.substring(0, i);
  }

  const lastSep = Math.max(prefix.lastIndexOf(' - '), prefix.lastIndexOf(' | '), prefix.lastIndexOf(': '));
  if (lastSep !== -1) {
    prefix = prefix.substring(0, lastSep + 3);
  } else {
    prefix = '';
  }

  // Bulunan ortak suffix'i sil
  let suffix = videos[0].title;
  for (const v of videos) {
    let i = 0;
    while (i < suffix.length && i < v.title.length && suffix[suffix.length - 1 - i] === v.title[v.title.length - 1 - i]) i++;
    suffix = suffix.substring(suffix.length - i);
  }

  const firstSep = Math.min(
    suffix.indexOf(' - ') !== -1 ? suffix.indexOf(' - ') : 999,
    suffix.indexOf(' | ') !== -1 ? suffix.indexOf(' | ') : 999
  );
  if (firstSep !== 999) {
    suffix = suffix.substring(firstSep);
  } else {
    suffix = '';
  }

  for (const v of videos) {
    let newTitle = v.title;
    if (prefix && newTitle.startsWith(prefix)) newTitle = newTitle.substring(prefix.length);
    if (suffix && newTitle.endsWith(suffix)) newTitle = newTitle.substring(0, newTitle.length - suffix.length);

    v.title = newTitle.trim() || v.title.trim();
  }
}

export async function fetchRawPlaylistVideos(subject: Subject, accessToken: string): Promise<VideoItem[]> {
  const playlistId = extractPlaylistId(subject.url);
  if (!playlistId) {
    throw new Error(`"${subject.name}" için geçerli bir oynatma listesi bağlantısı (URL) bulunamadı.`);
  }

  let pageToken = '';
  const videoIds: string[] = [];

  // 1. Oynatma listesindeki video ID'lerini topla
  do {
    const response = await fetch(
      `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&pageToken=${pageToken}`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiMsg = errorData.error?.message || response.statusText;
      if (response.status === 404 || apiMsg.includes('cannot be found') || apiMsg.includes('playlistNotFound')) {
        throw new Error(
          `"${subject.name}" dersi için girilen oynatma listesi YouTube'da bulunamadı (ID: ${playlistId}). Lütfen oynatma listesinin herkese açık olduğunu ve bağlantının eksiksiz kopyalandığını kontrol edin.`
        );
      }
      throw new Error(`"${subject.name}" oynatma listesi alınırken hata: ${apiMsg}`);
    }

    const data = await response.json();
    if (data.items) {
      for (const item of data.items) {
        const videoId = item.snippet?.resourceId?.videoId;
        if (videoId) videoIds.push(videoId);
      }
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  if (videoIds.length === 0) {
    throw new Error(`"${subject.name}" oynatma listesinde hiç video bulunamadı.`);
  }

  // 2. Video süreleri ve başlıkları için ID'leri batch (50'şerli) olarak sorgula
  const videoDetailsMap = new Map<string, { title: string; durationMins: number }>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const batchIds = videoIds.slice(i, i + 50).join(',');
    const response = await fetch(
      `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${batchIds}`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `"${subject.name}" video detayları alınamadı.`);
    }

    const data = await response.json();
    if (data.items) {
      for (const item of data.items) {
        videoDetailsMap.set(item.id, {
          title: item.snippet?.title || 'Video',
          durationMins: parseISO8601Duration(item.contentDetails?.duration || '')
        });
      }
    }
  }

  // Oynatma listesindeki orijinal sıraya sadık kalarak videoları oluştur
  const videos: VideoItem[] = [];
  videoIds.forEach((vId, idx) => {
    const details = videoDetailsMap.get(vId);
    if (details) {
      videos.push({
        id: vId,
        title: details.title,
        url: `https://www.youtube.com/watch?v=${vId}`,
        durationMins: details.durationMins,
        playlistIndex: idx + 1
      });
    }
  });

  // Başlıkları temizle (gereksiz ortak önek ve sonekleri kaldır)
  cleanTitles(videos);

  return videos;
}

export async function fetchSubjectVideos(subject: Subject, accessToken: string): Promise<SubjectWithVideos> {
  const allVideos = await fetchRawPlaylistVideos(subject, accessToken);
  const originalTotalVideos = allVideos.length;

  let selectedVideos: VideoItem[] = [];

  if (subject.selectionMode === 'custom_indices') {
    const desiredIndices = parseVideoIndices(subject.customIndicesStr || '');
    if (desiredIndices.length === 0) {
      throw new Error(
        `"${subject.name}" için özel video seçimi aktif ancak hiç video numarası girilmedi. Örnek format: 14, 16, 18, 21, 22`
      );
    }

    const indicesSet = new Set(desiredIndices);
    // Seçilen videoları girilen sıra numaralarına göre al
    selectedVideos = allVideos.filter(v => indicesSet.has(v.playlistIndex));

    if (selectedVideos.length === 0) {
      throw new Error(
        `"${subject.name}" listesinde girilen sıra numaralarına (${desiredIndices.join(', ')}) ait video bulunamadı. Listede toplam ${originalTotalVideos} video bulunmaktadır.`
      );
    }
  } else {
    // Varsayılan: Başlangıç video sırasından itibaren al
    const startIdx = Math.max(1, subject.startVideoIndex || 1);

    if (originalTotalVideos > 0 && startIdx > originalTotalVideos) {
      throw new Error(
        `"${subject.name}" listesinde ${originalTotalVideos} video var, ancak başlangıç sırası ${startIdx}. video olarak girilmiş. Lütfen 1 ile ${originalTotalVideos} arasında bir değer girin.`
      );
    }

    selectedVideos = allVideos.slice(startIdx - 1);
  }

  return {
    ...subject,
    videos: selectedVideos,
    allVideos,
    originalTotalVideos
  };
}
