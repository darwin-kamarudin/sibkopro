import React, { useState, useMemo } from 'react';
import { 
    Printer, Users, BookOpen, Map, FileText, FileCheck, 
    ChevronRight, ChevronDown, Eye, Search, X, Info
} from 'lucide-react';
import { formatIndoDate } from '../../common/utils/helpers';

// IMPORT KOMPONEN
import { PrintPreviewModal, MONTH_NAMES, getAcademicPeriod } from './components/ReportShared';
import { JournalReportModal, ClassReportModal, ServiceProofModal } from './components/ActivityReports';
import { IndividualReportModal, RiskMapReportModal } from './components/StudentReports';

const Reports = ({ journals = [], students = [], pointLogs = [], settings = {} }) => {
    const [activeTab, setActiveTab] = useState('journal');
    const [modals, setModals] = useState({ journal: false, classReport: false, serviceProof: false, individual: false, riskMap: false });

    // --- FILTER STATE ---
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [filterClass, setFilterClass] = useState(''); 
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
    const [selectedJournalId, setSelectedJournalId] = useState('');
    const [proofFilterMode, setProofFilterMode] = useState('month'); 
    const [proofDate, setProofDate] = useState(new Date().toISOString().slice(0, 7));
    const [proofSearch, setProofSearch] = useState('');
    const [filterRisk, setFilterRisk] = useState('all'); 
    const [filterRiskClass, setFilterRiskClass] = useState(''); 

    const handleOpenPreview = () => setModals(prev => ({ ...prev, [activeTab]: true }));
    const handleCloseModal = (key) => setModals(prev => ({ ...prev, [key]: false }));

    const dynamicYearOptions = useMemo(() => {
        const currYear = new Date().getFullYear();
        const existingYears = (journals || []).map(j => { const d = new Date(j.date); return !isNaN(d.getFullYear()) ? d.getFullYear() : null; }).filter(y => y !== null);
        const minYear = Math.min(...existingYears, currYear - 5);
        const maxYear = Math.max(...existingYears, currYear + 5);
        const years = []; for (let y = minYear; y <= maxYear; y++) years.push(y);
        return years.sort((a, b) => a - b);
    }, [journals]);

    const uniqueClasses = useMemo(() => { if (!students) return []; return [...new Set(students.map(s => s.class))].sort(); }, [students]);
    
    const filteredStudents = useMemo(() => { 
        if (!students || !studentSearch) return []; 
        return students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).slice(0, 10); 
    }, [students, studentSearch]);

    const filteredJournalsForProof = useMemo(() => {
        if (!journals) return [];
        return journals.filter(j => {
            let dateMatch = true;
            if (proofFilterMode === 'month') dateMatch = j.date.startsWith(proofDate);
            if (proofFilterMode === 'year') dateMatch = j.date.startsWith(proofDate.slice(0, 4));
            const searchLower = proofSearch.toLowerCase();
            const textMatch = !proofSearch || j.serviceType.toLowerCase().includes(searchLower) || j.description.toLowerCase().includes(searchLower);
            return dateMatch && textMatch;
        }).sort((a,b) => b.date.localeCompare(a.date));
    }, [journals, proofFilterMode, proofDate, proofSearch]);

    const REPORT_TYPES = [
        { id: 'journal', label: 'Jurnal Bulanan', icon: BookOpen, desc: 'Laporan aktivitas harian' },
        { id: 'classReport', label: 'Laporan Klasikal', icon: Users, desc: 'Rekap bimbingan kelas' },
        { id: 'individual', label: 'Rekam Jejak', icon: FileText, desc: 'History layanan per siswa' },
        { id: 'riskMap', label: 'Peta Kerawanan', icon: Map, desc: 'Analisis tingkat resiko' },
        { id: 'serviceProof', label: 'Bukti Layanan', icon: FileCheck, desc: 'Dokumen fisik (LPL)' },
    ];

    // --- RENDER FILTER FORM ---
    const renderFilterForm = () => {
        const currentType = REPORT_TYPES.find(t => t.id === activeTab);
        const { semester, academicYear } = getAcademicPeriod(selectedMonth, selectedYear);
        
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="border-b pb-4 mb-4">
                        <h2 className="text-lg font-bold text-slate-800">{currentType?.label}</h2>
                        <p className="text-sm text-slate-500">Atur filter data sebelum mencetak dokumen.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 mb-6">
                        {/* INPUTS FOR JOURNAL & CLASS REPORT */}
                        {(activeTab === 'journal' || activeTab === 'classReport') && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Bulan</label>
                                        <div className="relative">
                                            <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                                                {MONTH_NAMES.map((m, idx) => (<option key={idx} value={idx}>{m}</option>))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16}/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tahun</label>
                                        <div className="relative">
                                            <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                                                {dynamicYearOptions.map((y) => (<option key={y} value={y}>{y}</option>))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex flex-col gap-1 text-xs text-blue-800">
                                    <div className="font-bold flex items-center gap-2"><Info size={14}/> Info Periode Laporan:</div>
                                    <div>Semester: <b>{semester}</b></div>
                                    <div>Tahun Pelajaran: <b>{academicYear}</b></div>
                                </div>
                                {activeTab === 'classReport' && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Filter Kelas (Opsional)</label>
                                        <div className="relative">
                                            <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                                                <option value="">-- Semua Kelas --</option>
                                                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16}/>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* INPUTS FOR INDIVIDUAL */}
                        {activeTab === 'individual' && (
                            <div className="relative">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Cari Nama Siswa</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                                    <input type="text" className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ketik nama siswa..." value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setIsStudentDropdownOpen(true); setSelectedStudentId(''); }} onFocus={() => setIsStudentDropdownOpen(true)} />
                                    {selectedStudentId && (<button onClick={() => { setSelectedStudentId(''); setStudentSearch(''); }} className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500"><X size={16}/></button>)}
                                </div>
                                {isStudentDropdownOpen && studentSearch && !selectedStudentId && (
                                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                                        {filteredStudents.length > 0 ? (filteredStudents.map(s => (
                                            <div key={s.id} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0" onClick={() => { setSelectedStudentId(s.id); setStudentSearch(`${s.name} (${s.class})`); setIsStudentDropdownOpen(false); }}>
                                                <div className="font-bold text-slate-700">{s.name}</div>
                                                <div className="text-xs text-slate-500">{s.class} | {s.nisn}</div>
                                            </div>
                                        ))) : (<div className="p-3 text-sm text-slate-400 text-center">Siswa tidak ditemukan</div>)}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* INPUTS FOR SERVICE PROOF */}
                        {activeTab === 'serviceProof' && (
                            <div className="space-y-4">
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    {['all', 'month', 'year'].map(mode => (
                                        <button key={mode} onClick={() => setProofFilterMode(mode)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${proofFilterMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{mode === 'all' ? 'Semua' : mode === 'month' ? 'Bulan' : 'Tahun'}</button>
                                    ))}
                                </div>
                                {proofFilterMode !== 'all' && (
                                    <div><input type={proofFilterMode === 'month' ? 'month' : 'number'} placeholder={proofFilterMode === 'year' ? 'YYYY' : ''} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" value={proofDate} onChange={e => setProofDate(e.target.value)} /></div>
                                )}
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                                    <input type="text" className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Cari kegiatan (Klasikal, Individu...)" value={proofSearch} onChange={e => setProofSearch(e.target.value)} />
                                </div>
                                <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto bg-slate-50">
                                    {filteredJournalsForProof.length > 0 ? (filteredJournalsForProof.map(j => (
                                        <div key={j.id} onClick={() => setSelectedJournalId(j.id)} className={`p-3 border-b last:border-0 cursor-pointer transition-colors ${selectedJournalId === j.id ? 'bg-blue-100 border-blue-200' : 'hover:bg-white'}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-bold bg-white border px-1.5 rounded text-slate-600">{formatIndoDate(j.date)}</span>
                                                <span className="text-[10px] text-slate-400">{j.serviceType}</span>
                                            </div>
                                            <div className="text-xs font-bold text-slate-700 line-clamp-1">{j.studentName}</div>
                                            <div className="text-[10px] text-slate-500 italic line-clamp-1">{j.description}</div>
                                        </div>
                                    ))) : (<div className="p-4 text-center text-xs text-slate-400">Data jurnal tidak ditemukan.</div>)}
                                </div>
                            </div>
                        )}
                        
                        {/* INPUTS FOR RISK MAP */}
                        {activeTab === 'riskMap' && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 text-blue-700 p-3 rounded text-sm">Dokumen ini akan mencetak data siswa yang dikelompokkan per kelas dan diurutkan berdasarkan kerawanan.</div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Filter Tingkat Kerawanan</label>
                                    <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none" value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
                                        <option value="all">Semua Level</option>
                                        <option value="High">Tinggi (High)</option>
                                        <option value="Medium">Sedang (Medium)</option>
                                        <option value="Low">Rendah (Low)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Filter Kelas</label>
                                    <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none" value={filterRiskClass} onChange={e => setFilterRiskClass(e.target.value)}>
                                        <option value="">-- Semua Kelas --</option>
                                        {uniqueClasses.map(c => (<option key={c} value={c}>{c}</option>))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                        {((activeTab === 'individual' && !selectedStudentId) || (activeTab === 'serviceProof' && !selectedJournalId)) ? (
                            <button disabled className="bg-slate-200 text-slate-400 px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 cursor-not-allowed w-full md:w-auto justify-center"><Eye size={18}/> Lengkapi Filter</button>
                        ) : (
                            <button onClick={handleOpenPreview} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 w-full md:w-auto justify-center"><Eye size={18}/> Lihat Pratinjau & Cetak</button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* HEADER */}
            <div className="bg-white border-b px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm flex-shrink-0">
                <div>
                    <h1 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Printer className="text-blue-600" /> Pusat Laporan
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 hidden md:block">Kelola dan cetak dokumen administrasi BK.</p>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full no-scrollbar">
                <div className="max-w-7xl mx-auto">
                    {/* Mobile Navigation */}
                    <div className="md:hidden space-y-3">
                        {REPORT_TYPES.map(tab => (
                            <div key={tab.id} className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${activeTab === tab.id ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'border-slate-200'}`}>
                                <button onClick={() => { setActiveTab(tab.id); setSelectedStudentId(''); setStudentSearch(''); setSelectedJournalId(''); }} className={`w-full flex items-center justify-between p-4 text-left transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'}`}><tab.icon size={20} /></div>
                                        <div><span className="font-bold text-sm block">{tab.label}</span><span className="text-[10px] opacity-70">{tab.desc}</span></div>
                                    </div>
                                    {activeTab === tab.id ? <ChevronDown size={20}/> : <ChevronRight size={20} className="text-slate-400"/>}
                                </button>
                                {activeTab === tab.id && <div className="p-4 border-t border-blue-100 bg-slate-50/50">{renderFilterForm()}</div>}
                            </div>
                        ))}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex gap-6 items-start h-full">
                        <aside className="w-72 flex-shrink-0">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                                <div className="p-4 border-b bg-slate-50"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jenis Dokumen</span></div>
                                <nav className="p-2 space-y-1">
                                    {REPORT_TYPES.map(tab => (
                                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedStudentId(''); setStudentSearch(''); setSelectedJournalId(''); }} className={`w-full flex items-center text-left px-3 py-3 rounded-lg transition-all ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                                            <div className={`p-2 rounded-md mr-3 ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'}`}><tab.icon size={18} /></div>
                                            <div><div className="font-bold text-sm">{tab.label}</div><div className="text-[10px] opacity-70">{tab.desc}</div></div>
                                            {activeTab === tab.id && <ChevronRight size={16} className="ml-auto text-blue-400"/>}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </aside>
                        <main className="flex-1 w-full">{renderFilterForm()}</main>
                    </div>
                </div>
            </div>

            {/* --- MODAL SECTION --- */}
            
            <JournalReportModal 
                isOpen={modals.journal} 
                onClose={() => handleCloseModal('journal')} 
                journals={journals} 
                selectedMonth={selectedMonth} 
                selectedYear={selectedYear} 
                settings={settings}
            />
            
            <ClassReportModal 
                isOpen={modals.classReport} 
                onClose={() => handleCloseModal('classReport')} 
                journals={journals} 
                students={students}  
                selectedMonth={selectedMonth} 
                selectedYear={selectedYear} 
                filterClass={filterClass} 
                settings={settings} 
            />

            <ServiceProofModal 
                isOpen={modals.serviceProof} 
                onClose={() => handleCloseModal('serviceProof')} 
                journals={journals} 
                journalId={selectedJournalId} 
                settings={settings} 
            />
            
            <IndividualReportModal 
                isOpen={modals.individual} 
                onClose={() => handleCloseModal('individual')} 
                journals={journals} 
                students={students} 
                studentId={selectedStudentId} 
                settings={settings} 
            />

            <RiskMapReportModal 
                isOpen={modals.riskMap} 
                onClose={() => handleCloseModal('riskMap')} 
                students={students} 
                pointLogs={pointLogs} 
                year={`${selectedYear}/${selectedYear+1}`} 
                settings={settings} 
                filterRisk={filterRisk} 
                filterRiskClass={filterRiskClass} 
            />
        </div>
    );
};

export default Reports;