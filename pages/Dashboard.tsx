
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Student, SessionAttendance } from '../types';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { 
  Calendar, 
  UserCheck, 
  Copy, 
  ChevronRight, 
  ClipboardCheck,
  Search,
  CheckCircle2,
  Cloud,
  RefreshCw,
  X,
  Share2,
  Key,
  GraduationCap
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

  useEffect(() => {
    const code = storageService.getSyncCode();
    if (code) {
      handlePullSync(code, false);
    }
  }, []);

  const handlePullSync = async (code: string, notify = true) => {
    if (!code) return;
    setIsSyncing(true);
    try {
      const merged = await syncService.pull(code, existingRecords);
      storageService.saveRecords(merged);
      const now = storageService.updateLastSync();
      setLastSynced(now);
      if (notify) {
        setToastMessage('Data Synchronized!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (e) { console.error(e); } finally { setIsSyncing(false); }
  };

  const handlePushSync = async () => {
    if (!syncCode) return;
    setIsSyncing(true);
    const success = await syncService.push(syncCode, existingRecords);
    if (success) {
      const now = storageService.updateLastSync();
      setLastSynced(now);
      setToastMessage('Cloud updated!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
    setIsSyncing(false);
  };

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
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  };

  const handleCopy = () => {
    const displayDate = formatDateForDisplay(selectedDate);
    
    // Categorize students
    const fullDayAbsentees = students.filter(s => (attendance.hours[s.id]?.length === 7));
    
    const fnAbsentees = students.filter(s => {
      const h = attendance.hours[s.id] || [];
      return h.some(hr => FN_HOURS.includes(hr)) && h.length < 7;
    }).map(s => ({ ...s, missed: attendance.hours[s.id].filter(hr => FN_HOURS.includes(hr)) }));

    const anAbsentees = students.filter(s => {
      const h = attendance.hours[s.id] || [];
      return h.some(hr => AN_HOURS.includes(hr)) && h.length < 7;
    }).map(s => ({ ...s, missed: attendance.hours[s.id].filter(hr => AN_HOURS.includes(hr)) }));

    if (fullDayAbsentees.length === 0 && fnAbsentees.length === 0 && anAbsentees.length === 0) {
      navigator.clipboard.writeText(`Date: ${displayDate}\nAll present`);
      setToastMessage('Report Copied!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }

    let globalIndex = 1;
    let reportLines = [`Date: ${displayDate}\n`];

    if (fnAbsentees.length > 0) {
      reportLines.push("Forenoon");
      fnAbsentees.forEach(s => {
        const idShort = s.regNumber.slice(-3);
        const suffix = s.missed.length === 1 ? 'hr' : 'hrs';
        const hourStr = ` (${s.missed.join(',')} ${suffix})`;
        reportLines.push(`${globalIndex++})${idShort} ${s.name}${hourStr}`);
      });
      reportLines.push(""); 
    }

    if (anAbsentees.length > 0) {
      reportLines.push("Afternoon");
      anAbsentees.forEach(s => {
        const idShort = s.regNumber.slice(-3);
        const suffix = s.missed.length === 1 ? 'hr' : 'hrs';
        const hourStr = ` (${s.missed.join(',')} ${suffix})`;
        reportLines.push(`${globalIndex++})${idShort} ${s.name}${hourStr}`);
      });
      reportLines.push("");
    }

    if (fullDayAbsentees.length > 0) {
      reportLines.push("Full day");
      fullDayAbsentees.forEach(s => {
        const idShort = s.regNumber.slice(-3);
        reportLines.push(`${globalIndex++})${idShort} ${s.name}`);
      });
      reportLines.push("");
    }

    // Total unique students missing
    const uniqueAbsenteesCount = Object.keys(attendance.hours).length;
    reportLines.push(`Total absentees: ${uniqueAbsenteesCount}`);
    
    navigator.clipboard.writeText(reportLines.join('\n').trim()).then(() => {
      setToastMessage('Report Copied!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  };

  const handleSave = async () => {
    onSave(selectedDate, attendance);
    if (syncCode) await handlePushSync();
    alert('Attendance saved and cloud updated!');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="bg-white shadow-sm border-b shrink-0 z-30">
        <div className="p-3 flex flex-col items-center border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between w-full mb-2">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                 <GraduationCap size={24} />
               </div>
               <div>
                 <h2 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">IFET</h2>
                 <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight">Engineering</h2>
               </div>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => setShowSyncModal(true)} className={`p-2 rounded-xl border ${syncCode ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  <Cloud size={16} className={isSyncing ? 'animate-pulse' : ''} />
                </button>
                <div className="bg-rose-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-md transform -skew-x-12 shadow-sm">AUTONOMOUS</div>
             </div>
          </div>
        </div>

        <div className="p-3 flex items-center justify-between bg-white">
          <div className="flex items-center gap-1.5">
            <ClipboardCheck size={18} className="text-indigo-600" />
            <span className="text-base font-bold text-slate-800">ClassTrack Pro</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200">
            <Calendar size={12} className="text-slate-500" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none outline-none text-slate-700 text-[11px] font-bold cursor-pointer" />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="sticky top-0 p-3 bg-white border-b z-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl border border-transparent focus:border-indigo-500 outline-none text-sm transition-all" />
          </div>
        </div>

        <div className="p-3 space-y-2">
          {filteredStudents.map(student => {
            const studentHours = attendance.hours[student.id] || [];
            const isFullDay = studentHours.length === 7;
            return (
              <div key={student.id} className="flex flex-col p-3 rounded-xl border bg-white border-slate-100 shadow-sm gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => navigate(`/student/${student.id}`)}>
                    <h3 className="font-bold text-slate-800 text-xs truncate">{student.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">{student.regNumber}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Full Day Toggle */}
                    <button onClick={() => toggleFullDay(student.id)} className={`w-5.5 h-5.5 rounded-md text-[9px] font-black border transition-all ${isFullDay ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>F</button>
                    
                    {/* FN Hours */}
                    <div className="flex gap-0.5 bg-slate-50 p-0.5 rounded-md">
                      {FN_HOURS.map(h => (
                        <button key={h} onClick={() => toggleHour(student.id, h)} className={`w-5.5 h-5.5 rounded text-[8px] font-bold border transition-all ${studentHours.includes(h) ? 'bg-rose-500 border-rose-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}>{h}</button>
                      ))}
                    </div>

                    {/* AN Hours */}
                    <div className="flex gap-0.5 bg-slate-50 p-0.5 rounded-md">
                      {AN_HOURS.map(h => (
                        <button key={h} onClick={() => toggleHour(student.id, h)} className={`w-5.5 h-5.5 rounded text-[8px] font-bold border transition-all ${studentHours.includes(h) ? 'bg-orange-500 border-orange-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}>{h}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 pb-20">
          <div className="bg-white border border-slate-200 shadow-lg p-4 space-y-3 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"></div>
                <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Live Summary</h2>
              </div>
              <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-700 text-[10px] font-bold transition-all active:scale-95">
                <Copy size={10} /> Copy Report
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-indigo-50 rounded-xl p-2 border border-indigo-100">
                <div className="flex justify-between items-center border-b border-indigo-200/50 mb-1 pb-1">
                  <span className="text-[9px] font-black text-indigo-700 uppercase">Unique Absentees</span>
                  <span className="text-[11px] font-black text-indigo-600">{Object.keys(attendance.hours).length}</span>
                </div>
                <div className="text-[9px] text-indigo-800/70 italic">Total students missing at least one hour.</div>
              </div>
            </div>

            <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 text-xs uppercase tracking-widest transition-colors">
              <UserCheck size={16} /> Submit & Sync
            </button>
          </div>
        </div>
      </div>

      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[28px] p-6 shadow-2xl space-y-5 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                  <Cloud size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Cloud Sync</h3>
              </div>
              <button onClick={() => setShowSyncModal(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sync Access Code</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input type="text" value={syncCode} onChange={(e) => setSyncCode(e.target.value.toUpperCase())} placeholder="ENTER ACCESS CODE" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-mono font-bold text-indigo-600 text-sm focus:bg-white focus:border-indigo-400 outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={setupSync} className="flex flex-col items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl active:scale-95 text-[10px] font-black uppercase shadow-md shadow-indigo-100 transition-colors"><Share2 size={16} /> Push</button>
                <button onClick={() => handlePullSync(syncCode)} disabled={!syncCode || isSyncing} className="flex flex-col items-center justify-center gap-2 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase transition-colors"><RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> Pull</button>
              </div>
              {lastSynced && (
                <div className="text-center bg-slate-50 py-2 rounded-lg">
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Last Synced: {new Date(lastSynced).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-full text-[10px] font-bold shadow-2xl z-50 flex items-center gap-2 border border-white/10 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 size={12} className="text-emerald-500" /> {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
