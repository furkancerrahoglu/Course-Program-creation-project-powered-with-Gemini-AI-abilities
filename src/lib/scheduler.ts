import { SubjectWithVideos, VideoItem, CustomSchedulePlan } from '../types';

export interface ScheduledVideo {
  video: VideoItem;
  subjectName: string;
  startTime: string; // e.g. "12:00"
  endTime: string;   // e.g. "12:45"
}

export interface DaySchedule {
  dayIndex: number; // 0 to totalDays - 1
  dayNumber: number; // 1 to totalDays
  videos: ScheduledVideo[];
  totalMinutes: number;
}

export interface SchedulerOptions {
  totalDays?: number;
  startHour?: number;
  compressToFit?: boolean;
  customPlan?: CustomSchedulePlan;
}

export function generateSchedule(
  subjects: SubjectWithVideos[],
  options: SchedulerOptions = {}
): DaySchedule[] {
  const totalDays = Math.max(1, options.totalDays || 7);
  const startHour = options.startHour !== undefined ? options.startHour : 12;
  const compressToFit = options.compressToFit !== undefined ? options.compressToFit : true;

  const daySchedules: DaySchedule[] = Array.from({ length: totalDays }, (_, i) => ({
    dayIndex: i,
    dayNumber: i + 1,
    videos: [],
    totalMinutes: 0
  }));

  // Her dersin kalan videolarını ve toplam süresini takip etmek için state oluştur
  const subjectState = subjects.map(s => {
    const totalMins = s.videos.reduce((sum, v) => sum + v.durationMins, 0);
    return {
      ...s,
      remainingVideos: [...s.videos],
      totalRemainingMins: totalMins
    };
  });

  // Kullanıcı özel günlük dağılım şablonu tanımlamış ve en az 1 güne saat girmiş mi?
  const isCustomPlanActive = Boolean(
    options.customPlan?.enabled &&
    options.customPlan.days &&
    options.customPlan.days.length > 0 &&
    options.customPlan.days.some(d => Object.values(d.allocations || {}).some(h => Number(h) > 0))
  );

  if (isCustomPlanActive) {
    // -------------------------------------------------------------
    // MOD A: Kullanıcının Elle Belirlediği Günlük Ders & Süre Şablonu
    // -------------------------------------------------------------
    const cycleDays = Math.max(1, options.customPlan!.cycleDays || options.customPlan!.days.length || 7);
    const planDays = options.customPlan!.days;

    for (let day = 0; day < totalDays; day++) {
      const cycleDayIdx = day % cycleDays;
      const currentPlan = planDays[cycleDayIdx] || planDays[0];
      let currentMinutesFromMidnight = startHour * 60;
      let dayTotalMins = 0;

      for (const sub of subjectState) {
        const plannedHours = currentPlan.allocations[sub.id] || 0;
        if (plannedHours <= 0) continue;
        if (sub.remainingVideos.length === 0) continue;

        const plannedMins = plannedHours * 60;
        let subDayMins = 0;

        while (sub.remainingVideos.length > 0) {
          const video = sub.remainingVideos[0];

          // En az 1 video eklendiyse ve planlanan süreyi aştıysak bu ders için bugünlük yeter
          if (subDayMins >= plannedMins && subDayMins > 0) {
            break;
          }

          // Videoyu plana ekle
          sub.remainingVideos.shift();
          subDayMins += video.durationMins;
          dayTotalMins += video.durationMins;
          sub.totalRemainingMins -= video.durationMins;

          const startH = Math.floor(currentMinutesFromMidnight / 60);
          const startM = currentMinutesFromMidnight % 60;
          currentMinutesFromMidnight += video.durationMins;
          const endH = Math.floor(currentMinutesFromMidnight / 60);
          const endM = currentMinutesFromMidnight % 60;

          const startTime = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
          const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

          daySchedules[day].videos.push({
            video,
            subjectName: sub.name,
            startTime,
            endTime
          });
        }
      }

      daySchedules[day].totalMinutes = dayTotalMins;
    }

    // Sıkıştırma modu aktifse ve kullanıcı kotaları düşük tuttuğu için dışarıda kalan video varsa
    if (compressToFit) {
      for (const sub of subjectState) {
        while (sub.remainingVideos.length > 0) {
          const video = sub.remainingVideos.shift()!;
          const lastDay = daySchedules[totalDays - 1];

          let lastEndMinutes = startHour * 60;
          if (lastDay.videos.length > 0) {
            const lastVid = lastDay.videos[lastDay.videos.length - 1];
            const [h, m] = lastVid.endTime.split(':').map(Number);
            lastEndMinutes = h * 60 + m;
          }

          const startH = Math.floor(lastEndMinutes / 60);
          const startM = lastEndMinutes % 60;
          const endTotal = lastEndMinutes + video.durationMins;
          const endH = Math.floor(endTotal / 60);
          const endM = endTotal % 60;

          const startTime = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
          const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

          lastDay.videos.push({
            video,
            subjectName: sub.name,
            startTime,
            endTime
          });
          lastDay.totalMinutes += video.durationMins;
        }
      }
    }

    return daySchedules;
  }

  // -------------------------------------------------------------
  // MOD B: Akıllı Otomatik Dağıtım (Varsayılan Algoritma)
  // -------------------------------------------------------------
  for (let day = 0; day < totalDays; day++) {
    const remainingDays = totalDays - day;
    let currentMinutesFromMidnight = startHour * 60; // Gün belirtilen saatte başlar (örn: 12:00)
    let dayTotalMins = 0;

    // Kalan süresi / günlük kotası en yüksek olan derse öncelik ver
    subjectState.sort((a, b) => {
      const aWeight = a.totalRemainingMins / Math.max(1, a.maxDailyHours);
      const bWeight = b.totalRemainingMins / Math.max(1, b.maxDailyHours);
      return bWeight - aWeight;
    });

    for (const sub of subjectState) {
      if (sub.remainingVideos.length === 0) continue;

      let subDayMins = 0;
      // Bugün bu ders için hedeflenen dakika (kalan süreyi kalan günlere eşit paylaştır)
      const targetToday = Math.ceil(sub.totalRemainingMins / remainingDays);

      // Sıkıştırma modunda: Eğer gün sayısı az ve hedeflenen süre maxDailyHours'tan yüksekse,
      // videoların hedeflenen gün sayısında bitmesi için günlük kotayı dinamik olarak esnet
      const allowedSubjectDailyMins = compressToFit
        ? Math.max(sub.maxDailyHours * 60, targetToday)
        : sub.maxDailyHours * 60;

      while (sub.remainingVideos.length > 0) {
        const video = sub.remainingVideos[0];

        // Sınır kontrolleri:
        // 1. Hedeflenen günlük süreye ulaştıysak ve en az 1 video eklendiyse (son gün değilse)
        if (remainingDays > 1 && subDayMins >= targetToday && subDayMins > 0) {
          break;
        }

        // 2. Bu dersin günlük maksimum limitini aşıyorsa (son gün değilse ve en az 1 video eklendiyse)
        if (remainingDays > 1 && subDayMins + video.durationMins > allowedSubjectDailyMins && subDayMins > 0) {
          break;
        }

        // Videoyu programa ekle
        sub.remainingVideos.shift();
        subDayMins += video.durationMins;
        dayTotalMins += video.durationMins;
        sub.totalRemainingMins -= video.durationMins;

        // Başlangıç ve bitiş saatlerini hesapla
        const startH = Math.floor(currentMinutesFromMidnight / 60);
        const startM = currentMinutesFromMidnight % 60;
        currentMinutesFromMidnight += video.durationMins;
        const endH = Math.floor(currentMinutesFromMidnight / 60);
        const endM = currentMinutesFromMidnight % 60;

        const startTime = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
        const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

        daySchedules[day].videos.push({
          video,
          subjectName: sub.name,
          startTime,
          endTime
        });
      }
    }

    daySchedules[day].totalMinutes = dayTotalMins;
  }

  // Son güne kadar herhangi bir derste arta kalan video varsa, son güne ekle
  for (const sub of subjectState) {
    while (sub.remainingVideos.length > 0) {
      const video = sub.remainingVideos.shift()!;
      const lastDay = daySchedules[totalDays - 1];

      let lastEndMinutes = startHour * 60;
      if (lastDay.videos.length > 0) {
        const lastVid = lastDay.videos[lastDay.videos.length - 1];
        const [h, m] = lastVid.endTime.split(':').map(Number);
        lastEndMinutes = h * 60 + m;
      }

      const startH = Math.floor(lastEndMinutes / 60);
      const startM = lastEndMinutes % 60;
      const endTotal = lastEndMinutes + video.durationMins;
      const endH = Math.floor(endTotal / 60);
      const endM = endTotal % 60;

      const startTime = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
      const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

      lastDay.videos.push({
        video,
        subjectName: sub.name,
        startTime,
        endTime
      });
      lastDay.totalMinutes += video.durationMins;
    }
  }

  return daySchedules;
}
