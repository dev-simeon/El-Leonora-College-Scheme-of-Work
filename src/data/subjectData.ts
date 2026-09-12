export interface Subject {
  id: string;
  classId: string;
  name: string;
  code: string;
  image: string;
  weekProgress: string;
  classCode: string;
  progressPercent: number;
  progressColor: string;
}

export const SUBJECTS: Subject[] = [];
