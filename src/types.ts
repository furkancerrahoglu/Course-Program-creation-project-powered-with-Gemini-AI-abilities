export type SelectionMode = 'from_index' | 'custom_indices';

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  durationMins: number;
  playlistIndex: number;
}

export interface Subject {
  id: string;
  name: string;
  topics: string[];
  topicsInput?: string;
  maxDailyHours: number;
  url?: string; // Optional YouTube playlist link
  selectionMode?: SelectionMode;
  startVideoIndex?: number;
  customIndicesStr?: string;
}

export interface SubjectWithVideos extends Subject {
  videos: VideoItem[];
  allVideos?: VideoItem[];
  originalTotalVideos?: number;
}

export interface TopicAnalysisItem {
  topicName: string;
  importance: 'Kritik' | 'Yüksek' | 'Orta' | 'Temel' | string;
  importanceScore: number; // 1-10
  difficulty: 'Kolay' | 'Orta' | 'Zor' | string;
  examWeight: string;
  estimatedHours: number;
  keyTips: string;
  commonPitfalls?: string;
}

export interface SubjectAnalysisItem {
  subjectId?: string;
  subjectName: string;
  overallImportance: string;
  recommendedTotalHours: number;
  strategySummary: string;
  topics: TopicAnalysisItem[];
}

export interface CurriculumAnalysisResult {
  overallStrategy: string;
  keyRecommendations: string[];
  subjectsAnalysis: SubjectAnalysisItem[];
}

export interface StudySession {
  subjectName: string;
  topicName: string;
  startTime: string; // e.g. "12:00"
  endTime: string;   // e.g. "13:30"
  durationMins: number;
  targetGoal: string;
  isRevision?: boolean;
  completed?: boolean;
  videoUrl?: string;
}

export interface ScheduledDay {
  dayIndex: number; // 1 to totalDays
  dayLabel: string; // e.g. "1. Hafta Pazartesi"
  weekNumber: number;
  focusTheme?: string;
  sessions: StudySession[];
}

export interface GeneratedSchedule {
  scheduleTitle: string;
  summary: string;
  days: ScheduledDay[];
}

export interface RagDocument {
  id: string;
  name: string;
  content: string;
  type: 'txt' | 'pdf' | 'md' | 'note' | string;
  uploadedAt: string;
  size: number;
  chunkCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  citations?: string[];
  isError?: boolean;
}

export interface DayPlan {
  dayIndex: number;
  dayLabel: string;
  allocations: Record<string, number>;
}

export interface CustomSchedulePlan {
  enabled: boolean;
  cycleDays: number;
  days: DayPlan[];
}
