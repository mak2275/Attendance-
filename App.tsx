
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import StudentDetail from './pages/StudentDetail';
import { storageService } from './services/storageService';
import { Student, SessionAttendance } from './types';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, SessionAttendance>>({});

  useEffect(() => {
    setStudents(storageService.getStudents());
    setAttendanceRecords(storageService.getRecords());
  }, []);

  const handleSaveAttendance = (date: string, sessionAttendance: SessionAttendance) => {
    storageService.saveAttendance(date, sessionAttendance);
    setAttendanceRecords(storageService.getRecords());
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-xl overflow-hidden flex flex-col relative">
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                students={students} 
                existingRecords={attendanceRecords} 
                onSave={handleSaveAttendance} 
              />
            } 
          />
          <Route 
            path="/student/:id" 
            element={<StudentDetail students={students} />} 
          />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
