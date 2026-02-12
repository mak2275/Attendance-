
import { Student, SessionAttendance } from '../types';
import { INITIAL_STUDENTS } from '../constants';

const STORAGE_KEY_RECORDS = 'classtrack_records_v3';
const STORAGE_KEY_STUDENTS = 'classtrack_students';
const STORAGE_KEY_SYNC_CODE = 'classtrack_sync_code';
const STORAGE_KEY_LAST_SYNC = 'classtrack_last_sync';

export const storageService = {
  getStudents: (): Student[] => {
    const data = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(data);
  },

  getRecords: (): Record<string, SessionAttendance> => {
    const data = localStorage.getItem(STORAGE_KEY_RECORDS);
    return data ? JSON.parse(data) : {};
  },

  saveRecords: (records: Record<string, SessionAttendance>) => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  },

  saveAttendance: (date: string, sessionAttendance: SessionAttendance) => {
    const records = storageService.getRecords();
    records[date] = sessionAttendance;
    storageService.saveRecords(records);
  },

  getSyncCode: () => localStorage.getItem(STORAGE_KEY_SYNC_CODE),
  setSyncCode: (code: string | null) => {
    if (code) localStorage.setItem(STORAGE_KEY_SYNC_CODE, code);
    else localStorage.removeItem(STORAGE_KEY_SYNC_CODE);
  },

  getLastSync: () => localStorage.getItem(STORAGE_KEY_LAST_SYNC),
  updateLastSync: () => {
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, now);
    return now;
  },

  getStudentAbsenceHistory: (studentId: string): { date: string; hours: number[] }[] => {
    const records = storageService.getRecords();
    const history: { date: string; hours: number[] }[] = [];
    
    Object.entries(records).forEach(([date, attendance]) => {
      const studentHours = attendance.hours[studentId];
      if (studentHours && studentHours.length > 0) {
        history.push({ date, hours: studentHours });
      }
    });
    
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
};
