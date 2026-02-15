
export interface Student {
  id: string;
  name: string;
  regNumber: string;
}

export interface SessionAttendance {
  // studentId -> array of missed hour numbers (1, 2, 3, 4, 5, 6, 7)
  hours: Record<string, number[]>;
  isNoClass?: boolean;
}

export interface ClassroomData {
  students: Student[];
  records: Record<string, SessionAttendance>; // date string -> { hours: { "id": [1, 2] } }
}

export interface SyncStatus {
  lastSynced: string | null;
  classCode: string | null;
  isSyncing: boolean;
}
