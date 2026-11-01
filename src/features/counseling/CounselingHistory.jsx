import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Search, Printer, ShieldAlert, BookOpen, X, ChevronDown, 
    FileText, Lock, Eye, EyeOff, Trash2
} from 'lucide-react';
import { formatIndoDate } from '../../common/utils/helpers';
import CounselingHistoryModal from './components/CounselingHistoryModal'; // Import Modal Baru

const CounselingHistory = ({ students, journals, settings, user, onUpdateStudent }) => {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    
    // --- STATE PENCARIAN SISWA ---
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef(null);

    // --- MODAL STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return students;
        return students.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.nisn?.includes(searchQuery) ||
            s.class?.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a,b) => a.name.localeCompare(b.name));
    }, [students, searchQuery]);

    const student = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

    // FILTER DATA JURNAL (Untuk Tampilan List Awal)
    const counselingHistory = useMemo(() => {
        if (!student) return [];
        return journals.filter(j => 
            j.studentId === student.id || (j.studentIds && j.studentIds.includes(student.id))
        ).sort((a,b) => b.date.localeCompare(a.date));
    }, [student, journals]);

    const handleSelectStudent = (s) => {
        setSelectedStudentId(s.id);
        setSearchQuery(s.name);
        setIsSearchOpen(false);
    };

    // Fungsi Update NIP (jika diperlukan passing ke modal)
    const handleStudentDataUpdate = (studentId, newData) => {
        if (onUpdateStudent) {
            onUpdateStudent(studentId, newData);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative animate-in fade-in">
            
            {/* Header Toolbar */}
            <div className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-purple-600"/> Riwayat Layanan Konseling
                    </h1>
                    <p className="text-xs text-slate-500">Cetak rekam jejak bimbingan siswa.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                    
                    {/* INPUT PENCARIAN */}
                    <div className="relative w-full md:w-80" ref={searchRef}>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                            <input 
                                type="text"
                                className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ketik nama siswa..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsSearchOpen(true);
                                    if(e.target.value === '') setSelectedStudentId('');
                                }}
                                onFocus={() => setIsSearchOpen(true)}
                            />
                            {selectedStudentId ? (
                                <button onClick={() => { setSelectedStudentId(''); setSearchQuery(''); setIsSearchOpen(true); }} className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500">
                                    <X size={16}/>
                                </button>
                            ) : (
                                <ChevronDown className="absolute right-3 top-2.5 text-slate-400" size={16}/>
                            )}
                        </div>

                        {/* DROPDOWN HASIL PENCARIAN */}
                        {isSearchOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map(s => (
                                        <div key={s.id} onClick={() => handleSelectStudent(s)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0">
                                            <div className="font-bold text-slate-800 text-sm">{s.name}</div>
                                            <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                                                <span>Kelas: {s.class}</span>
                                                <span>NISN: {s.nisn || '-'}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-slate-400 text-sm italic">Siswa tidak ditemukan.</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button disabled={!selectedStudentId} onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all flex-1 md:flex-none">
                            <Printer size={18}/> Cetak Laporan
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content (Preview List Sederhana) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {student ? (
                    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden min-h-[400px]">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="font-bold text-lg text-slate-800">Daftar Layanan Konseling</h2>
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{counselingHistory.length} Sesi</span>
                            </div>
                            
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3 w-32">Tanggal</th>
                                        <th className="px-6 py-3">Layanan</th>
                                        <th className="px-6 py-3">Topik</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {counselingHistory.length > 0 ? counselingHistory.map((h) => {
                                        const isPrivate = h.isPrivate || (h.serviceType && h.serviceType.toLowerCase().includes('pribadi'));
                                        return (
                                            <tr key={h.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">{formatIndoDate(h.date)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700 flex items-center gap-2">
                                                        {h.serviceType}
                                                        {isPrivate && <Lock size={12} className="text-red-500" title="Rahasia"/>}
                                                    </div>
                                                    <div className="text-xs text-slate-400">{h.technique}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 line-clamp-2">{h.description}</td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="3" className="p-12 text-center text-slate-400 italic">Belum ada data layanan.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <BookOpen size={64} className="mb-4 text-slate-300"/>
                        <p className="text-lg font-medium">Cari dan pilih siswa untuk melihat riwayat</p>
                    </div>
                )}
            </div>

            {/* MODAL CETAK (BARU) */}
            <CounselingHistoryModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                student={student}
                journals={journals}
                settings={settings}
                onUpdateStudent={handleStudentDataUpdate}
            />

        </div>
    );
};

export default CounselingHistory;