
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Student } from '../types';
import { storageService } from '../services/storageService';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Hash, 
  AlertCircle,
  Clock,
  CalendarDays
} from 'lucide-react';

interface StudentDetailProps {
  students: Student[];
}

const StudentDetail: React.FC<StudentDetailProps> = ({ students }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const student = students.find(s => s.id === id);
  const absenceHistory = id ? storageService.getStudentAbsenceHistory(id) : [];

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-10 text-center">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h1 className="text-xl font-bold">Student Not Found</h1>
        <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 font-medium">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const totalHoursMissed = absenceHistory.reduce((acc, h) => acc + h.hours.length, 0);
  const totalAbsentDays = absenceHistory.length;

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-white border-b p-4 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
        >
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">Student Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Profile Card */}
        <div className="bg-indigo-50 rounded-[32px] p-8 border border-indigo-100 flex flex-col items-center text-center shadow-md shadow-indigo-100/50">
          <div className="w-24 h-24 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white mb-5 shadow-xl shadow-indigo-200">
            <User size={48} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">{student.name}</h2>
          <div className="flex items-center gap-1.5 mt-2 text-indigo-600 bg-white/80 px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm">
            <Hash size={14} className="opacity-60" />
            <span className="text-xs font-mono font-bold tracking-widest">{student.regNumber}</span>
          </div>
        </div>

        {/* High Visibility Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl text-center shadow-sm">
            <div className="flex justify-center mb-2 text-rose-500">
               <Clock size={16} />
            </div>
            <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest mb-1">Total Hours Missed</p>
            <p className="text-3xl font-black text-rose-700">{totalHoursMissed}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 p-5 rounded-3xl text-center shadow-sm">
            <div className="flex justify-center mb-2 text-orange-500">
               <CalendarDays size={16} />
            </div>
            <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mb-1">Total Absent Days</p>
            <p className="text-3xl font-black text-orange-700">{totalAbsentDays}</p>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-5 pb-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
              <Calendar size={18} />
            </div>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Absence History</h3>
          </div>
          
          <div className="space-y-3">
            {absenceHistory.length > 0 ? (
              absenceHistory.map((item) => (
                <div 
                  key={item.date}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                >
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">
                      {new Date(item.date).toLocaleDateString('en-GB', { 
                        weekday: 'short', 
                        day: '2-digit',
                        month: 'short', 
                        year: 'numeric'
                      })}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.hours.map(h => (
                        <span key={h} className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg shadow-sm ${
                          h <= 4 ? 'bg-rose-500 text-white' : 'bg-orange-500 text-white'
                        }`}>
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-emerald-50/50 border-2 border-dashed border-emerald-100 p-10 rounded-[32px] text-center">
                <p className="text-emerald-700 font-black text-sm uppercase tracking-tight">Perfect Attendance!</p>
                <p className="text-[10px] text-emerald-500 mt-1 font-bold uppercase tracking-widest">No recorded absences yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
