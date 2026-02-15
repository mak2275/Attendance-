
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

  const handlePullSync = async (code: string, notify = true) => {
    if (!code) return;
    setIsSyncing(true);
    try {
      const merged = await syncService.pull(code, existingRecords);
      storageService.saveRecords(merged);
      const now = storageService.updateLastSync();
      setLastSynced(now);
      if (notify) {
        setToastMessage('Cloud Data Synced');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const handlePushSync = async () => {
    if (!syncCode) return;
    setIsSyncing(true);
    const success = await syncService.push(syncCode, existingRecords);
    if (success) {
      const now = storageService.updateLastSync();
      setLastSynced(now);
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    const code = storageService.getSyncCode();
    if (code) {
      handlePullSync(code, false);
      const onFocus = () => handlePullSync(code, false);
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
    }
  }, []);

  const setupSync = () => {
    if (!syncCode) {
      const newCode = syncService.generateCode();
      setSyncCode(newCode);
      storageService.setSyncCode(newCode);
      handlePushSync();
    } else {
      storageService.setSyncCode(syncCode);
      handlePullSync(syncCode);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.regNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const toggleHour = (studentId: string, hour: number) => {
    setAttendance(prev => {
      const currentHours = prev.hours[studentId] || [];
      const newHours = currentHours.includes(hour)
        ? currentHours.filter(h => h !== hour)
        : [...currentHours, hour].sort((a, b) => a - b);
      
      const updatedHours = { ...prev.hours };
      if (newHours.length === 0) delete updatedHours[studentId];
      else updatedHours[studentId] = newHours;
      return { hours: updatedHours };
    });
  };

  const toggleFullDay = (studentId: string) => {
    setAttendance(prev => {
      const currentHours = prev.hours[studentId] || [];
      const isFull = currentHours.length === 7;
      const updatedHours = { ...prev.hours };
      
      if (isFull) delete updatedHours[studentId];
      else updatedHours[studentId] = [...ALL_HOURS];
      
      return { hours: updatedHours };
    });
  };

  const formatDateForDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  const reportData = useMemo(() => {
    const absentees = Object.keys(attendance.hours);
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

    return { fullDayAbsentees, fnAbsentees, anAbsentees, totalCount: absentees.length };
  }, [students, attendance]);

  const reportText = useMemo(() => {
    const { fullDayAbsentees, fnAbsentees, anAbsentees, totalCount } = reportData;
    const displayDate = formatDateForDisplay(selectedDate);
    
    if (totalCount === 0) {
      return `Date: ${displayDate}\n\nAll present`;
    }

    let reportLines = [`Date: ${displayDate}\n`];

    reportLines.push("Forenoon Absent:");
    if (fnAbsentees.length > 0) {
      fnAbsentees.forEach((s, idx) => {
        const idShort = s.regNumber.slice(-3);
        const suffix = s.missed.length === 1 ? 'hr' : 'hrs';
        const hourStr = ` (${s.missed.join(',')} ${suffix})`;
        reportLines.push(`${idx + 1})${idShort} ${s.name}${hourStr}`);
      });
    } else {
      reportLines.push("Nil");
    }
    reportLines.push(""); 

    reportLines.push("Afternoon Absent:");
    if (anAbsentees.length > 0) {
      anAbsentees.forEach((s, idx) => {
        const idShort = s.regNumber.slice(-3);
        const suffix = s.missed.length === 1 ? 'hr' : 'hrs';
        const hourStr = ` (${s.missed.join(',')} ${suffix})`;
        reportLines.push(`${idx + 1})${idShort} ${s.name}${hourStr}`);
      });
    } else {
      reportLines.push("Nil");
    }
    reportLines.push("");

    reportLines.push("Full-day Absent:");
    if (fullDayAbsentees.length > 0) {
      fullDayAbsentees.forEach((s, idx) => {
        const idShort = s.regNumber.slice(-3);
        reportLines.push(`${idx + 1})${idShort} ${s.name}`);
      });
    } else {
      reportLines.push("Nil");
    }
    reportLines.push("");

    reportLines.push(`Total Absent: ${totalCount}`);
    
    return reportLines.join('\n');
  }, [reportData, selectedDate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText).then(() => {
      setToastMessage('Report Copied!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  };

  const handleSave = async () => {
    onSave(selectedDate, attendance);
    if (syncCode) {
      await handlePushSync();
      setToastMessage('Attendance Saved & Synced');
    } else {
      setToastMessage('Saved Locally');
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="bg-white shadow-sm border-b shrink-0 z-30">
        <div className="p-3 flex flex-col border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between w-full">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md">
                 <GraduationCap size={24} />
               </div>
               <div>
                 <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">IFET</h2>
                    <span className="bg-rose-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter">Autonomous</span>
                 </div>
                 <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none">College of Engineering</h2>
               </div>
             </div>
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSyncModal(true)} 
                  className={`p-2 rounded-xl border transition-all active:scale-95 ${syncCode ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                >
                  <Cloud size={16} className={isSyncing ? 'animate-pulse' : ''} />
                </button>
             </div>
          </div>
        </div>

        <div className="p-3 flex items-center justify-between bg-white">
          <div className="flex items-center gap-1.5">
            <ClipboardCheck size={18} className="text-indigo-600" />
            <span className="text-sm font-black text-slate-800 tracking-tight">ClassTrack Pro</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
            <Calendar size={12} className="text-slate-500" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="bg-transparent border-none outline-none text-slate-700 text-[10px] font-black cursor-pointer uppercase" 
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="sticky top-0 p-3 bg-white/90 backdrop-blur-md border-b z-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100/50 rounded-xl border border-transparent focus:border-indigo-500 outline-none text-[13px] transition-all" 
            />
          </div>
        </div>

        <div className="p-3 space-y-2">
          {filteredStudents.map(student => {
            const studentHours = attendance.hours[student.id] || [];
            const isFullDay = studentHours.length === 7;
            return (
              <div key={student.id} className="flex flex-col p-3 rounded-xl border bg-white border-slate-100 shadow-sm gap-2 active:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/student/${student.id}`)}>
                    <h3 className="font-bold text-slate-800 text-[11px] truncate uppercase">{student.name}</h3>
                    <p className="text-[9px] text-slate-400 font-mono leading-none mt-1">{student.regNumber}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0 items-end">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => toggleFullDay(student.id)} 
                        className={`w-6 h-6 min-w-[24px] rounded-md text-[10px] font-black border transition-all active:scale-90 ${isFullDay ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                      >
                        F
                      </button>
                      <div className="flex gap-0.5 bg-slate-50 p-0.5 rounded-md border border-slate-100">
                        {FN_HOURS.map(h => (
                          <button 
                            key={h} 
                            onClick={() => toggleHour(student.id, h)} 
                            className={`w-6 h-6 min-w-[24px] rounded text-[9px] font-bold border transition-all active:scale-90 ${studentHours.includes(h) ? 'bg-rose-500 border-rose-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-0.5 bg-slate-50 p-0.5 rounded-md border border-slate-100">
                      {AN_HOURS.map(h => (
                        <button 
                          key={h} 
                          onClick={() => toggleHour(student.id, h)} 
                          className={`w-6 h-6 min-w-[24px] rounded text-[9px] font-bold border transition-all active:scale-90 ${studentHours.includes(h) ? 'bg-orange-500 border-orange-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="mt-8 mb-10">
            <div className="bg-white border border-slate-200 shadow-xl rounded-[24px] overflow-hidden flex flex-col">
              <div className="px-5 py-4 bg-slate-50/80 backdrop-blur-sm border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600 shadow-inner">
                      <FileText size={16} />
                   </div>
                   <div className="flex flex-col">
                     <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Absent Report Preview</h3>
                     <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">Summary Preview</span>
                   </div>
                </div>
                <button 
                  onClick={handleCopy} 
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
              
              <div className="p-5 bg-white">
                 <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 shadow-inner">
                   <pre className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
                     {reportText}
                   </pre>
                 </div>
              </div>

              <div className="p-5 bg-white border-t">
                <button 
                  onClick={handleSave} 
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] text-[12px] uppercase tracking-[0.1em] transition-all"
                >
                  <UserCheck size={20} /> Submit & Sync
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Cloud size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Collaboration</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Multi-User Sync</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSyncModal(false)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-center">
                <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase">Enter the class code to sync records automatically.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Classroom Code</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    value={syncCode} 
                    onChange={(e) => setSyncCode(e.target.value.toUpperCase())} 
                    placeholder="IFET-IT-ROOM1" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono font-bold text-indigo-600 text-sm focus:bg-white focus:border-indigo-400 outline-none transition-all shadow-inner" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                  onClick={setupSync} 
                  className="flex flex-col items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-[24px] active:scale-95 text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  <Share2 size={20} />
                  <span>Push</span>
                </button>
                <button 
                  onClick={() => handlePullSync(syncCode)} 
                  disabled={!syncCode || isSyncing} 
                  className="flex flex-col items-center justify-center gap-3 py-5 bg-white border-2 border-slate-100 text-slate-700 rounded-[24px] active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase hover:border-indigo-200 transition-all"
                >
                  <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                  <span>Pull</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-full text-[11px] font-black shadow-2xl z-50 flex items-center gap-3 border border-white/10 animate-in slide-in-from-bottom-5 duration-300 uppercase tracking-widest">
          <CheckCircle2 size={16} className="text-emerald-400" /> {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
