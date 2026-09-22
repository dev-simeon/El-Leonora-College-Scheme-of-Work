export interface Topic {
  id: string;
  title: string;
  completed: boolean;
  strand?: string | null;
}

export interface WeekData {
  weekNumber: number;
  topics: Topic[];
}

export interface SubjectTopics {
  subjectId: string;
  subjectName: string;
  term: string;
  completionPercent: number;
  weeks: WeekData[];
}

export const SUBJECT_TOPICS: Record<string, SubjectTopics> = {
  "1": {
    subjectId: "1",
    subjectName: "Mathematics - SS2",
    term: "1st Term",
    completionPercent: 30,
    weeks: [
      {
        weekNumber: 1,
        topics: [
          { id: "1-1", title: "Algebra", completed: true },
          { id: "1-2", title: "Geometry", completed: true },
          { id: "1-3", title: "Statistics", completed: false },
        ],
      },
      {
        weekNumber: 2,
        topics: [
          { id: "2-1", title: "Trigonometry", completed: false },
          { id: "2-2", title: "Calculus", completed: false },
        ],
      },
      {
        weekNumber: 3,
        topics: [
          { id: "3-1", title: "Probability", completed: false },
        ],
      },
    ],
  },
  "2": {
    subjectId: "2",
    subjectName: "English Language - SS2",
    term: "1st Term",
    completionPercent: 40,
    weeks: [
      {
        weekNumber: 1,
        topics: [
          { id: "1-1", title: "Speech Work", completed: true },
          { id: "1-2", title: "Grammar", completed: true },
          { id: "1-3", title: "Reading & Comprehension", completed: false },
        ],
      },
      {
        weekNumber: 2,
        topics: [
          { id: "2-1", title: "Speech Work", completed: false },
          { id: "2-2", title: "Writing Skills", completed: false },
        ],
      },
      {
        weekNumber: 3,
        topics: [
          { id: "3-1", title: "Critical Thinking", completed: false },
        ],
      },
    ],
  },
  "3": {
    subjectId: "3",
    subjectName: "Basic Science - SS2",
    term: "1st Term",
    completionPercent: 15,
    weeks: [
      {
        weekNumber: 1,
        topics: [
          { id: "1-1", title: "Scientific Method", completed: true },
          { id: "1-2", title: "Matter and Energy", completed: false },
        ],
      },
      {
        weekNumber: 2,
        topics: [
          { id: "2-1", title: "Living Things", completed: false },
          { id: "2-2", title: "Cells and Tissues", completed: false },
        ],
      },
    ],
  },
  "4": {
    subjectId: "4",
    subjectName: "Social Studies - SS2",
    term: "1st Term",
    completionPercent: 0,
    weeks: [
      {
        weekNumber: 1,
        topics: [
          { id: "1-1", title: "Culture and Society", completed: false },
          { id: "1-2", title: "Government Systems", completed: false },
        ],
      },
      {
        weekNumber: 2,
        topics: [
          { id: "2-1", title: "Economics", completed: false },
          { id: "2-2", title: "Human Rights", completed: false },
        ],
      },
    ],
  },
  "5": {
    subjectId: "5",
    subjectName: "Computer Studies - SS2",
    term: "1st Term",
    completionPercent: 75,
    weeks: [
      {
        weekNumber: 1,
        topics: [
          { id: "1-1", title: "Introduction to Programming", completed: true },
          { id: "1-2", title: "Data Structures", completed: true },
          { id: "1-3", title: "Algorithms", completed: true },
        ],
      },
      {
        weekNumber: 2,
        topics: [
          { id: "2-1", title: "Web Development", completed: true },
          { id: "2-2", title: "Databases", completed: true },
        ],
      },
      {
        weekNumber: 3,
        topics: [
          { id: "3-1", title: "Networking", completed: false },
        ],
      },
    ],
  },
  "6": {
    subjectId: "6",
    subjectName: "French - SS2",
    term: "1st Term",
    completionPercent: 5,
    weeks: [
      {
        weekNumber: 1,
        topics: [
          { id: "1-1", title: "Basic Greetings", completed: true },
          { id: "1-2", title: "Numbers and Counting", completed: false },
        ],
      },
      {
        weekNumber: 2,
        topics: [
          { id: "2-1", title: "Daily Routines", completed: false },
          { id: "2-2", title: "Family Members", completed: false },
        ],
      },
    ],
  },
};
