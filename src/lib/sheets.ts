import { DaySchedule } from './scheduler';

export async function createScheduleSpreadsheet(daySchedules: DaySchedule[], accessToken: string): Promise<string> {
  const totalDays = daySchedules.length;
  const totalWeeks = Math.ceil(totalDays / 7);

  // 1. Create a new Spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `Çalışma Programı (${totalDays} Günlük) - ${new Date().toLocaleDateString('tr-TR')}`,
      },
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    throw new Error(`Failed to create spreadsheet: ${errorData.error?.message || createResponse.statusText}`);
  }

  const spreadsheet = await createResponse.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const sheetTitle = spreadsheet.sheets[0].properties.title;
  const sheetId = spreadsheet.sheets[0].properties.sheetId;
  
  // 2. Format Data (Dynamic Weeks, 14 Columns per Week)
  const sheetData: string[][] = [];
  const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  
  for (let week = 0; week < totalWeeks; week++) {
    if (week > 0) {
      sheetData.push(new Array(14).fill(''));
    }
    
    // Hafta başlığı
    const weekHeader = new Array(14).fill('');
    const startDayNum = week * 7 + 1;
    const endDayNum = Math.min(totalDays, (week + 1) * 7);
    weekHeader[0] = totalWeeks === 1
      ? `Çalışma Programı (${totalDays} Günlük)`
      : `Hafta ${week + 1} (${startDayNum}. Gün - ${endDayNum}. Gün)`;
    sheetData.push(weekHeader);
    
    // Gün ve Saat başlıkları (Pzt Saat | Pazartesi | Salı Saat | Salı ...)
    const dayHeaders: string[] = [];
    for (let d = 0; d < 7; d++) {
      const dayIdx = week * 7 + d;
      if (dayIdx < totalDays) {
        dayHeaders.push(`${days[d]} Saat`);
        dayHeaders.push(`${days[d]} (Gün ${dayIdx + 1})`);
      } else {
        dayHeaders.push('');
        dayHeaders.push('');
      }
    }
    sheetData.push(dayHeaders);
    
    // Bu haftaya ait günlük maksimum video sayısını bulalım
    let maxVideosInWeek = 0;
    for (let d = 0; d < 7; d++) {
      const dayIndex = week * 7 + d;
      if (dayIndex < totalDays && daySchedules[dayIndex] && daySchedules[dayIndex].videos.length > maxVideosInWeek) {
        maxVideosInWeek = daySchedules[dayIndex].videos.length;
      }
    }
    
    // Satırları doldur (Her video için bir satır)
    for (let r = 0; r < maxVideosInWeek; r++) {
      const row: string[] = [];
      for (let d = 0; d < 7; d++) {
        const dayIndex = week * 7 + d;
        if (dayIndex < totalDays && daySchedules[dayIndex] && r < daySchedules[dayIndex].videos.length) {
          const scheduledVid = daySchedules[dayIndex].videos[r];
          // E-tablolarda virgül (,) ve noktalı virgül (;) hatasını çözmek için escape edip noktalı virgül (;) kullanıyoruz.
          const safeTitle = (scheduledVid.video.title || 'Video').replace(/"/g, '""');
          row.push(`[${scheduledVid.startTime}-${scheduledVid.endTime}]`);
          row.push(`=HYPERLINK("${scheduledVid.video.url}"; "${safeTitle}")`);
        } else {
          row.push('');
          row.push('');
        }
      }
      sheetData.push(row);
    }
  }

  // 3. Write Data to Spreadsheet
  const range = `'${sheetTitle}'!A1`; 
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: sheetData,
      }),
    }
  );

  if (!updateResponse.ok) {
    const errorData = await updateResponse.json().catch(() => ({}));
    throw new Error(`Failed to write data: ${errorData.error?.message || updateResponse.statusText}`);
  }

  // Auto-resize columns
  const resizeResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 14,
            },
          },
        },
      ],
    }),
  });

  if (!resizeResponse.ok) {
    const errorData = await resizeResponse.json().catch(() => ({}));
    console.warn(`Failed to resize columns: ${errorData.error?.message || resizeResponse.statusText}`);
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

export async function createTopicScheduleSpreadsheet(
  scheduleTitle: string,
  days: {
    dayIndex: number;
    dayLabel: string;
    weekNumber: number;
    sessions: {
      subjectName: string;
      topicName: string;
      startTime: string;
      endTime: string;
      durationMins: number;
      targetGoal: string;
      videoUrl?: string;
    }[];
  }[],
  accessToken: string
): Promise<string> {
  const totalDays = days.length;
  const totalWeeks = Math.ceil(totalDays / 7);

  // 1. Create Spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `Çalışma Asistanı Programı (${totalDays} Günlük) - ${new Date().toLocaleDateString('tr-TR')}`,
      },
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    throw new Error(`Failed to create spreadsheet: ${errorData.error?.message || createResponse.statusText}`);
  }

  const spreadsheet = await createResponse.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const sheetTitle = spreadsheet.sheets[0].properties.title;
  const sheetId = spreadsheet.sheets[0].properties.sheetId;

  // 2. Format Data: 14 Columns per Week (Saat | Ders - Konu - Hedef)
  const sheetData: string[][] = [];
  const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  for (let week = 0; week < totalWeeks; week++) {
    if (week > 0) {
      sheetData.push(new Array(14).fill(''));
    }

    const startDayNum = week * 7 + 1;
    const endDayNum = Math.min(totalDays, (week + 1) * 7);
    const weekHeader = new Array(14).fill('');
    weekHeader[0] = `Hafta ${week + 1} (${startDayNum}. Gün - ${endDayNum}. Gün) - ${scheduleTitle}`;
    sheetData.push(weekHeader);

    // Gün & Saat Başlıkları
    const dayHeaders: string[] = [];
    for (let d = 0; d < 7; d++) {
      const dayIdx = week * 7 + d;
      if (dayIdx < totalDays) {
        dayHeaders.push(`${dayNames[d]} Saat`);
        dayHeaders.push(`${dayNames[d]} (${dayIdx + 1}. Gün) Konu & Hedef`);
      } else {
        dayHeaders.push('');
        dayHeaders.push('');
      }
    }
    sheetData.push(dayHeaders);

    // Hafta içindeki maksimum session sayısını bul
    let maxSessions = 0;
    for (let d = 0; d < 7; d++) {
      const dayIdx = week * 7 + d;
      if (dayIdx < totalDays && days[dayIdx] && days[dayIdx].sessions.length > maxSessions) {
        maxSessions = days[dayIdx].sessions.length;
      }
    }

    for (let r = 0; r < maxSessions; r++) {
      const row: string[] = [];
      for (let d = 0; d < 7; d++) {
        const dayIdx = week * 7 + d;
        if (dayIdx < totalDays && days[dayIdx] && r < days[dayIdx].sessions.length) {
          const session = days[dayIdx].sessions[r];
          row.push(`[${session.startTime}-${session.endTime}]`);
          const label = `[${session.subjectName}] ${session.topicName} (${session.targetGoal})`;
          const safeLabel = label.replace(/"/g, '""');
          if (session.videoUrl) {
            row.push(`=HYPERLINK("${session.videoUrl}"; "${safeLabel}")`);
          } else {
            row.push(safeLabel);
          }
        } else {
          row.push('');
          row.push('');
        }
      }
      sheetData.push(row);
    }
  }

  // 3. Write Data
  const range = `'${sheetTitle}'!A1`;
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: sheetData,
      }),
    }
  );

  if (!updateResponse.ok) {
    const errorData = await updateResponse.json().catch(() => ({}));
    throw new Error(`Failed to write data: ${errorData.error?.message || updateResponse.statusText}`);
  }

  // Auto-resize columns
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 14,
            },
          },
        },
      ],
    }),
  }).catch(() => {});

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}
