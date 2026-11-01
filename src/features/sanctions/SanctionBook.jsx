import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, ShieldAlert, FileText, CheckCircle2,
    ChevronLeft, ChevronRight, MousePointerClick, Info,
    Calendar, User
} from 'lucide-react';
import PointHistoryModal from '../points/components/PointHistoryModal';
import SanctionDetailModal from './components/SanctionDetailModal';

const SanctionBook = ({ students, pointLogs, sanctionRules, settings }) => {
    const navigate = useNavigate();
    
    // State Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // State Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    // --- STATE MODAL ---
    const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);
    const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);

    // --- 1. LOGIKA UTAMA ---
    const processedData = useMemo(() => {
        setCurrentPage(1); // Reset halaman saat filter berubah

        const classes = [...new Set(students.map(s => s.class))].sort();

        const data = students.map(student => {
            const studentLogs = pointLogs.filter(l => l.studentId === student.id);
            
            const vTotal = studentLogs
                .filter(l => l.type === 'violation')
                .reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);
            
            const aTotal = studentLogs
                .filter(l => l.type === 'achievement')
                .reduce((acc, curr) => acc + parseInt(curr.value || 0), 0);

            const netScore = vTotal - aTotal;

            let activeRule = sanctionRules
                .sort((a,b) => b.max - a.max)
                .find(rule => netScore >= rule.min && netScore <= rule.max);

            let severity = 'safe';
            if (netScore > 0) severity = 'warning';
            if (activeRule && activeRule.penalty) severity = 'danger';
            if (netScore >= 50) severity = 'critical';

            if (!activeRule) {
                activeRule = {
                    penalty: "Siswa Taat Aturan",
                    action: "Pertahankan prestasi.",
                    min: 0, max: 0
                };
            }

            return {
                ...student,
                netScore,
                violationTotal: vTotal, 
                achievementTotal: aTotal,
                violationCount: studentLogs.filter(l => l.type === 'violation').length,
                lastViolationDate: studentLogs
                    .filter(l => l.type === 'violation')
                    .sort((a,b) => new Date(b.date) - new Date(a.date))[0]?.date || null,
                activeRule: activeRule, 
                activeSanction: activeRule.penalty || "Dalam Pembinaan",
                sanctionRange: activeRule.max > 0 ? `${activeRule.min}-${activeRule.max}` : "-",
                severity
            };
        });

        const filtered = data
            .filter(s => {
                const matchName = s.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchClass = selectedClass ? s.class === selectedClass : true;
                const matchStatus = statusFilter ? s.severity === statusFilter : true;
                return matchName && matchClass && matchStatus;
            })
            .sort((a, b) => b.netScore - a.netScore);

        return { classes, students: filtered };
    }, [students, pointLogs, sanctionRules, searchTerm, selectedClass, statusFilter]);

    // --- Pagination ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = processedData.students.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(processedData.students.length / itemsPerPage);

    // --- Handlers ---
    const handleCreateLetter = (student) => {
        navigate('/letters', { 
            state: { 
                preSelectedStudentId: student.id,
                suggestedTemplateKeyword: student.activeSanction 
            } 
        });
    };

    const handleViewPoints = (student) => setSelectedStudentForHistory(student);
    const handleViewDetail = (student) => setSelectedStudentForDetail(student);

    const getStatusBadge = (severity, text) => {
        const styles = {
            safe: "bg-green-100 text-green-700 border-green-200",
            warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
            danger: "bg-orange-100 text-orange-700 border-orange-200",
            critical: "bg-red-100 text-red-700 border-red-200 font-bold"
        };
        return (
            <span className={`inline-block px-2.5 py-1 rounded-md text-xs border whitespace-normal text-left leading-tight ${styles[severity] || styles.safe}`}>
                {text}
            </span>
        );
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
            
            {/* HEADER & STATS (Responsive Grid) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldAlert className="text-red-600"/> Buku Sanksi
                    </h1>
                    <p className="text-slate-500 text-xs md:text-sm mt-1">
                        Monitoring poin & status sanksi.
                    </p>
                </div>
                
                {/* Stats Cards (Grid on Mobile for better fit) */}
                <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                    <div className="bg-red-50 border border-red-100 px-3 py-2 rounded-lg text-center">
                        <span className="block text-lg font-bold text-red-600">
                            {processedData.students.filter(s => s.netScore >= 50).length}
                        </span>
                        <span className="text-[10px] text-red-400 font-bold uppercase">Kritis</span>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 px-3 py-2 rounded-lg text-center">
                        <span className="block text-lg font-bold text-orange-600">
                            {processedData.students.filter(s => s.netScore > 0 && s.netScore < 50).length}
                        </span>
                        <span className="text-[10px] text-orange-400 font-bold uppercase">Pelanggar</span>
                    </div>
                </div>
            </div>

            {/* FILTER TOOLBAR (Stack on Mobile) */}
            <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-col md:flex-row gap-3 items-center flex-shrink-0">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Cari nama / NISN..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select 
                        className="flex-1 md:flex-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 cursor-pointer"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">Semua Kelas</option>
                        {processedData.classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select 
                        className="flex-1 md:flex-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Semua Status</option>
                        <option value="safe">Aman</option>
                        <option value="warning">Peringatan</option>
                        <option value="danger">Sanksi</option>
                        <option value="critical">Kritis</option>
                    </select>
                </div>
            </div>

            {/* KONTEN UTAMA */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto custom-scrollbar flex-1 bg-slate-50 md:bg-white">
                    
                    {/* --- TAMPILAN MOBILE (Card View) --- */}
                    <div className="block md:hidden p-3 space-y-3">
                        {currentStudents.length > 0 ? (
                            currentStudents.map((student, index) => {
                                const globalRank = indexOfFirstItem + index + 1;
                                return (
                                    <div key={student.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                                        
                                        {/* Mobile Card Header */}
                                        <div className="flex justify-between items-start border-b border-slate-50 pb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${globalRank <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    #{globalRank}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                                                    <div className="text-xs text-slate-500">{student.class} • {student.nisn || '-'}</div>
                                                </div>
                                            </div>
                                            
                                            {/* Poin di Pojok Kanan Atas */}
                                            <button 
                                                onClick={() => handleViewPoints(student)}
                                                className="flex flex-col items-end group"
                                            >
                                                <span className="text-xl font-black text-blue-600 group-active:scale-95 transition-transform">{student.netScore}</span>
                                                <span className="text-[10px] text-slate-400">Poin</span>
                                            </button>
                                        </div>

                                        {/* Status & Info */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-start justify-between bg-slate-50 p-2 rounded-lg">
                                                <div className="flex-1">
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Status Sanksi</div>
                                                    {getStatusBadge(student.severity, student.activeSanction)}
                                                    {student.violationCount > 0 && (
                                                        <div className="text-[10px] text-red-500 mt-1 italic">{student.violationCount}x Pelanggaran</div>
                                                    )}
                                                </div>
                                            </div>
                                            {student.lastViolationDate && (
                                                <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
                                                    <Calendar size={12}/>
                                                    <span>Terakhir: {new Date(student.lastViolationDate).toLocaleDateString('id-ID')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons Grid */}
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <button 
                                                onClick={() => handleViewDetail(student)}
                                                className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg active:bg-slate-100"
                                            >
                                                <Info size={14}/> Tindak Lanjut
                                            </button>
                                            <button 
                                                onClick={() => handleCreateLetter(student)}
                                                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold rounded-lg active:bg-blue-100"
                                            >
                                                <FileText size={14}/> Surat
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                                <CheckCircle2 size={32}/>
                                <p className="text-sm">Tidak ada data.</p>
                            </div>
                        )}
                    </div>

                    {/* --- TAMPILAN DESKTOP (Table View) --- */}
                    <div className="hidden md:block">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase w-16 text-center">Rank</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase w-auto min-w-[200px]">Identitas Siswa</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center w-32">Akumulasi Poin</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase w-80">Status Sanksi</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase w-40">Terakhir Melanggar</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentStudents.length > 0 ? (
                                    currentStudents.map((student, index) => {
                                        const globalRank = indexOfFirstItem + index + 1;
                                        return (
                                            <tr key={student.id} className="hover:bg-blue-50/50 transition-colors group">
                                                <td className="p-4 text-center align-top">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mx-auto ${globalRank <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {globalRank}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-top">
                                                    <div className="font-bold text-slate-800 break-words">{student.name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 whitespace-nowrap">{student.class}</span>
                                                        <span className="hidden sm:inline whitespace-nowrap">• NISN: {student.nisn || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center align-top">
                                                    <button onClick={() => handleViewPoints(student)} className="group/btn flex flex-col items-center justify-center mx-auto hover:bg-blue-50 p-2 rounded-lg transition-all" title="Klik untuk melihat detail poin">
                                                        <div className="font-mono text-lg font-bold text-blue-600 underline decoration-blue-300 decoration-2 underline-offset-2 group-hover/btn:text-blue-700">{student.netScore}</div>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 group-hover/btn:text-blue-500 mt-0.5"><MousePointerClick size={10} /><span>Detail</span></div>
                                                    </button>
                                                </td>
                                                <td className="p-4 align-top">
                                                    <div className="flex flex-col items-start gap-1">
                                                        {getStatusBadge(student.severity, student.activeSanction)}
                                                        <div className="flex flex-col gap-0.5 mt-1">
                                                            {student.sanctionRange !== '-' && <span className="text-[11px] text-slate-500 font-medium">Range: {student.sanctionRange} Poin</span>}
                                                            {student.violationCount > 0 && <span className="text-[10px] text-slate-400 italic">{student.violationCount}x kali melakukan pelanggaran</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-top">
                                                    {student.lastViolationDate ? <div className="text-sm text-slate-600">{new Date(student.lastViolationDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</div> : <span className="text-xs text-slate-400 italic">Belum ada data</span>}
                                                </td>
                                                <td className="p-4 text-right align-top">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleViewDetail(student)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap" title="Lihat Detail Tindak Lanjut"><Info size={14}/><span className="hidden sm:inline">Tindak Lanjut</span></button>
                                                        <button onClick={() => handleCreateLetter(student)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap" title="Buat Surat"><FileText size={14}/><span className="hidden sm:inline">Surat</span></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colspan="6" className="p-12 text-center text-slate-400"><div className="flex flex-col items-center gap-3"><CheckCircle2 size={32} className="text-slate-300"/><p>Tidak ada data siswa yang sesuai filter.</p></div></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* FOOTER PAGINATION */}
                <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <span>Menampilkan <b>{currentStudents.length}</b> dari <b>{processedData.students.length}</b> siswa</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16}/></button>
                        <span className="font-medium px-2">Hal {currentPage} / {totalPages || 1}</span>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16}/></button>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            <PointHistoryModal 
                isOpen={!!selectedStudentForHistory}
                onClose={() => setSelectedStudentForHistory(null)}
                student={selectedStudentForHistory}
                pointLogs={pointLogs} 
                sanctionRules={sanctionRules}
                settings={settings} 
            />

            <SanctionDetailModal 
                isOpen={!!selectedStudentForDetail}
                onClose={() => setSelectedStudentForDetail(null)}
                student={selectedStudentForDetail}
            />
        </div>
    );
};

export default SanctionBook;