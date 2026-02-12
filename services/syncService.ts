
import { SessionAttendance } from '../types';

// Using a public key-value store for simplified sync without a complex backend
const BASE_URL = 'https://api.keyvalue.xyz';

export const syncService = {
  /**
   * Generates a new unique class code
   */
  generateCode: () => {
    return 'IFET-IT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  /**
   * Pushes local records to the cloud
   */
  push: async (classCode: string, records: Record<string, SessionAttendance>) => {
    try {
      const response = await fetch(`${BASE_URL}/${classCode}`, {
        method: 'POST',
        body: JSON.stringify(records),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Sync push failed:', error);
      return false;
    }
  },

  /**
   * Pulls records from the cloud and merges them with local records
   */
  pull: async (classCode: string, localRecords: Record<string, SessionAttendance>) => {
    try {
      const response = await fetch(`${BASE_URL}/${classCode}`);
      if (!response.ok) return localRecords;

      const cloudRecords: Record<string, SessionAttendance> = await response.json();
      
      // Merge Strategy: Combine records. Cloud records take precedence on conflicts, 
      // but we combine the hour arrays for the same student on the same date.
      const merged: Record<string, SessionAttendance> = { ...localRecords };

      Object.entries(cloudRecords).forEach(([date, cloudAtt]) => {
        if (!merged[date]) {
          merged[date] = cloudAtt;
        } else {
          // Merge hours per student for the same date
          const mergedHours: Record<string, number[]> = { ...merged[date].hours };
          
          Object.entries(cloudAtt.hours).forEach(([studentId, hours]) => {
            const localHours = mergedHours[studentId] || [];
            // Union of hours
            mergedHours[studentId] = Array.from(new Set([...localHours, ...hours])).sort((a, b) => a - b);
          });
          
          merged[date] = { hours: mergedHours };
        }
      });

      return merged;
    } catch (error) {
      console.error('Sync pull failed:', error);
      return localRecords;
    }
  }
};
