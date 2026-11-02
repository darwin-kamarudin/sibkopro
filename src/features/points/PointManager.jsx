import React, { useState, useMemo, useEffect } from 'react';
import { 
    Trophy, AlertTriangle, Search, AlertOctagon, ChevronRight, ChevronLeft, 
    PlusCircle 
} from 'lucide-react';
import PointInputModal from './components/PointInputModal';
import PointHistoryModal from './components/PointHistoryModal';

const PointManager = ({ 
    students, pointLogs, masterPoints, sanctionRules, settings, tataTertib, 
    onAddPoint, onUpdatePoint, onDeletePoint, onUpdateStudent 
}) => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState('violation'); // 'violation' atau 'achievement'
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal Input State
    const [selectedStudent, setSelectedStudent] = useState(null); 
    const [isInputModalOpen, setIsInputModalOpen] = useState(false); 

    // Modal History State
    const [historyStudent, setHistoryStudent] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    
    // --- STATE PAGINATION ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    useEffect(() => { setCurrentPage(1); }, [searchTerm, activeTab]);

    // --- DATA PROCESSING ---
    const processedStudents = useMemo(() => {
        return students.map(s => {
            const logs = pointLogs.filter(p => p.studentId === s.id);
            const violationTotal = logs.filter(p => p.type === 'violation').reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
            const achievementTotal = logs.filter(p => p.type === 'achievement').reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
            const netScore = violationTotal - achievementTotal;
            
            // Sanksi tetap dihitung di background untuk data, tapi tidak ditampilkan di tabel (sesuai request sebelumnya)
            const activeSanction = (sanctionRules || []).sort((a,b) => b.max - a.max).find(rule => netScore >= rule.min && netScore <= rule.max);
            
            return { ...s, violationTotal, achievementTotal, netScore, activeSanction };
        });
    }, [students, pointLogs, sanctionRules]);

    const filteredStudents = useMemo(() => {
        return processedStudents.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.class.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => a.name.localeCompare(b.name)); 
    }, [processedStudents, searchTerm]);

    const paginatedStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredStudents, currentPage]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    // --- HANDLERS ---
    
    // Handler Input: Membuka modal sesuai tab yang sedang aktif
    const handleOpenInput = (student) => {
        setSelectedStudent(student);
        setIsInputModalOpen(true);
        // Kita tidak perlu mengubah activeTab di sini karena modal akan mengikuti activeTab dari state halaman
    };

    const handleOpenHistory = (student) => { 
        setHistoryStudent(student); 
        setIsHistoryModalOpen(true); 
    };

    const handleStudentDataUpdate = (studentId, newData) => {
        if (onUpdateStudent) {
            onUpdateStudent(studentId, newData);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative animate-in fade-in">
            {/* HEADER */}
            <div className="bg-white px-4 pt-4 pb-0 shadow-sm border-b sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-slate-800">Catatan Poin</h1>
                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        Total Siswa: {filteredStudents.length}
                    </div>
                </div>

                {/* TABS (Mengontrol Mode Halaman) */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('violation')} 
                        className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all flex items-center justify-center gap-2 ${activeTab === 'violation' ? 'border-red-500 text-red-600 bg-red-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <AlertTriangle size={18}/> Catat Pelanggaran
                    </button>
                    <button 
                        onClick={() => setActiveTab('achievement')} 
                        className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all flex items-center justify-center gap-2 ${activeTab === 'achievement' ? 'border-green-500 text-green-600 bg-green-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <Trophy size={18}/> Catat Prestasi
                    </button>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="p-4 bg-white border-b border-slate-100 sticky top-[108px] z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder={activeTab === 'violation' ? "Cari Siswa untuk Pelanggaran..." : "Cari Siswa Berprestasi..."} 
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 transition-all ${activeTab === 'violation' ? 'focus:ring-red-200 border-red-100' : 'focus:ring-green-200 border-green-100'}`} 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* LIST SISWA */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 text-center">No</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama & Kelas</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24">Poin</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-40">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedStudents.length > 0 ? (
                                    paginatedStudents.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-4 text-center text-sm text-slate-500 font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{student.name}</div>
                                                <div className="text-xs text-slate-500 font-medium mt-0.5">
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 mr-1.5">{student.class}</span> - {student.nisn || 'NISN: -'}
                                                </div>
                                            </td>
                                            
                                            {/* Kolom Poin (Klik untuk Riwayat) */}
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => handleOpenHistory(student)} 
                                                    className={`inline-flex items-center justify-center min-w-[40px] h-8 px-2 rounded-lg font-black text-sm shadow-sm transition-transform active:scale-95 hover:scale-110 cursor-pointer border border-transparent hover:border-slate-300 hover:shadow-md ${student.netScore >= 50 ? 'bg-red-100 text-red-700' : student.netScore >= 20 ? 'bg-orange-100 text-orange-700' : student.netScore > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`} 
                                                    title="Lihat Riwayat Lengkap"
                                                >
                                                    {student.netScore}
                                                </button>
                                            </td>

                                            {/* Kolom Aksi (Satu Tombol Dinamis Sesuai Tab) */}
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleOpenInput(student)}
                                                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition-transform active:scale-95 ml-auto w-full md:w-auto ${
                                                        activeTab === 'violation' 
                                                        ? 'bg-red-600 hover:bg-red-700' 
                                                        : 'bg-green-600 hover:bg-green-700'
                                                    }`}
                                                >
                                                    {activeTab === 'violation' ? <AlertOctagon size={14}/> : <Trophy size={14}/>}
                                                    <span className="whitespace-nowrap">
                                                        {activeTab === 'violation' ? 'Catat Pelanggaran' : 'Catat Prestasi'}
                                                    </span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="p-12 text-center text-slate-400"><p className="font-medium">Siswa tidak ditemukan.</p></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {filteredStudents.length > 0 && (
                        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-xs text-slate-500 font-medium hidden md:block">Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} siswa</div>
                            <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"><ChevronLeft size={16}/></button>
                                <span className="flex items-center text-xs font-bold bg-slate-50 px-3 rounded-lg md:hidden">Hal {currentPage} / {totalPages}</span>
                                <div className="hidden md:flex items-center gap-1">
                                    {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                        let pageNum = i + 1;
                                        if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 3 + i;
                                        if(pageNum > totalPages) return null;
                                        return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pageNum}</button>;
                                    })}
                                </div>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"><ChevronRight size={16}/></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL INPUT */}
            <PointInputModal 
                sanctionMode={settings?.sanctionMode || 'poin'}
                isOpen={isInputModalOpen}
                onClose={() => setIsInputModalOpen(false)}
                student={selectedStudent}
                activeTab={activeTab} // Modal akan mengikuti tab yang aktif
                setActiveTab={setActiveTab}
                masterPoints={masterPoints}
                pointLogs={pointLogs}
                onSubmit={onAddPoint}
                onUpdate={onUpdatePoint}
                onDelete={onDeletePoint}
            />

            {/* MODAL HISTORY */}
            <PointHistoryModal 
                sanctionMode={settings?.sanctionMode || 'poin'}
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                student={historyStudent}
                pointLogs={pointLogs}
                settings={settings}
                sanctionRules={sanctionRules}
                tataTertib={tataTertib}
                onUpdateStudent={handleStudentDataUpdate}
            />
        </div>
    );
};

export default PointManager;