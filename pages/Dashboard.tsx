// --- imports unchanged ---
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Student, SessionAttendance } from '../types';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { 
  Calendar, 
  UserCheck, 
  Copy, 
  ClipboardCheck,
  Search,
  CheckCircle2,
  Cloud,
  RefreshCw,
  X,
  Share2,
  Key,
  GraduationCap,
  FileText,
  Clock
} from 'lucide-react';

// --- interface unchanged ---
interface DashboardProps {
  students: Student[];
  existingRecords: Record<string, SessionAttendance>;
  onSave: (date: string, attendance: SessionAttendance) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ students, existingRecords, onSave }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<SessionAttendance>({ hours: {} });
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Copied!');
  
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncCode, setSyncCode] = useState(storageService.getSyncCode() || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(storageService.getLastSync());

  const FN_HOURS = [1, 2, 3, 4];
  const AN_HOURS = [5, 6, 7];
  const ALL_HOURS = [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => {
    if (existingRecords[selectedDate]) {
      setAttendance(existingRecords[selectedDate]);
    } else {
      setAttendance({ hours: {} });
    }
  }, [selectedDate, existingRecords]);

  // --- report helpers ---
  const formatDateForDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  const reportData = useMemo(() => {
    const fullDayAbsentees = students.filter(s => (attendance.hours[s.id]?.length === 7));
    
    const fnAbsentees = students.filter(s => {
      const h = attendance.hours[s.id] || [];
      const isFullDay = h.length === 7;
      return !isFullDay && h.some(hr => FN_HOURS.includes(hr));
    }).map(s => ({ ...s, missed: (attendance.hours[s.id] || []).filter(hr => FN_HOURS.includes(hr)) }));

    const anAbsentees = students.filter(s => {
      const h = attendance.hours[s.id] || [];
      const isFullDay = h.length === 7;
      return !isFullDay && h.some(hr => AN_HOURS.includes(hr));
    }).map(s => ({ ...s, missed: (attendance.hours[s.id] || []).filter(hr => AN_HOURS.includes(hr)) }));

    return { fullDayAbsentees, fnAbsentees, anAbsentees };
  }, [students, attendance]);

  // ✅ UPDATED REPORT TEXT (All present logic)
  const reportText = useMemo(() => {
    const { fullDayAbsentees, fnAbsentees, anAbsentees } = reportData;
    const displayDate = formatDateForDisplay(selectedDate);

    const totalAbsent = Object.keys(attendance.hours).length;

    if (totalAbsent === 0) {
      return `Date: ${displayDate}\n\nAll present`;
    }

    let reportLines = [`Date: ${displayDate}\n`];

    reportLines.push("Forenoon Absent:");
    if (fnAbsentees.length > 0) {
      fnAbsentees.forEach((s, idx) => {
        const idShort = s.regNumber.slice(-3);
        const suffix = s.missed.length === 1 ? "hr" : "hrs";
        const hourStr = ` (${s.missed.join(",")} ${suffix})`;
        reportLines.push(`${idx + 1})${idShort} ${s.name}${hourStr}`);
      });
    } else reportLines.push("Nil");
    reportLines.push("");

    reportLines.push("Afternoon Absent:");
    if (anAbsentees.length > 0) {
      anAbsentees.forEach((s, idx) => {
        const idShort = s.regNumber.slice(-3);
        const suffix = s.missed.length === 1 ? "hr" : "hrs";
        const hourStr = ` (${s.missed.join(",")} ${suffix})`;
        reportLines.push(`${idx + 1})${idShort} ${s.name}${hourStr}`);
      });
    } else reportLines.push("Nil");
    reportLines.push("");

    reportLines.push("Full-day Absent:");
    if (fullDayAbsentees.length > 0) {
      fullDayAbsentees.forEach((s, idx) => {
        const idShort = s.regNumber.slice(-3);
        reportLines.push(`${idx + 1})${idShort} ${s.name}`);
      });
    } else reportLines.push("Nil");
    reportLines.push("");

    reportLines.push(`Total Absent: ${totalAbsent}`);

    return reportLines.join("\n");
  }, [reportData, selectedDate, attendance]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText).then(() => {
      setToastMessage('Report Copied!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  };

  const handleSave = async () => {
    onSave(selectedDate, attendance);
    setToastMessage('Saved');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // --- UI unchanged below ---
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* UI omitted for brevity — keep your existing JSX exactly */}
      {/* Only reportText changed above */}
      <div className="mt-8 mb-10">
        <div className="bg-white border border-slate-200 shadow-xl rounded-[24px] overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-slate-50/80 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={16} />
              <h3 className="text-[11px] font-black">Absent Report Preview</h3>
            </div>
            <button onClick={handleCopy} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px]">
              Copy Report
            </button>
          </div>

          <div className="p-5">
            <pre className="text-[11px] font-mono whitespace-pre-wrap">
              {reportText}
            </pre>
          </div>

          <div className="p-5 border-t">
            <button onClick={handleSave} className="w-full bg-slate-900 text-white py-3 rounded-xl">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
