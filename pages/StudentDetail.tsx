
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Student } from '../types';
import { storageService } from '../services/storageService';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Hash, 
  XCircle, 
  AlertCircle 
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

  const totalAbsences = absenceHistory.reduce((acc, h) => acc + h.hours.length, 0);

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-white border-b p-4 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Student Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col items-center text-center shadow-sm">
          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg">
            <User size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
          <div className="flex items-center gap-1 mt-1 text-indigo-600 bg-indigo-100/50 px-3 py-1 rounded-full">
            <Hash size={14} />
            <span className="text-sm font-mono font-semibold">{student.regNumber}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-center">
            <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mb-1">Total Hours Missed</p>
            <p className="text-3xl font-black text-rose-700">{totalAbsences}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center flex flex-col items-center justify-center">
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Status</p>
            <p className="text-lg font-bold text-emerald-700">Active</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-800">Absence History</h3>
          </div>
          
          <div className="space-y-3 pb-8">
            {absenceHistory.length > 0 ? (
              absenceHistory.map((item, index) => (
                <div 
                  key={item.date}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700">
                      {new Date(item.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.hours.map(h => (
                        <span key={h} className={`text-[9px] font-black w-6 h-6 flex items-center justify-center rounded-md ${
                          h <= 4 ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                  <XCircle size={20} className="text-rose-500 shrink-0" />
                </div>
              ))
            ) : (
              <div className="bg-emerald-50/50 border border-dashed border-emerald-200 p-8 rounded-2xl text-center">
                <p className="text-emerald-600 font-medium">Perfect attendance! ✨</p>
                <p className="text-xs text-emerald-500 mt-1">This student has never been marked absent.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
