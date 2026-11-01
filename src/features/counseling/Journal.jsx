import React, { useState, useMemo } from 'react';
import { 
    BookOpen, Search, X, Calendar, Edit, ClipboardList, 
    Save, RefreshCcw, Users, Clock, MapPin, AlignLeft, 
    CheckCircle2, Plus, History, ChevronRight, GraduationCap, 
    Target, FileText, Activity, Info, Trash2, Shield, Lock // Tambah icon Shield & Lock
} from 'lucide-react';
import { formatIndoDate } from '../../common/utils/helpers';
import { LAYANAN_TYPES, MASALAH_KATEGORI, SKKPD_LIST, TEKNIK_KONSELING } from '../../common/utils/constants';

const Journal = ({ students, journals, onAdd, onUpdate, onDelete, settings }) => {
    // UI State
    const [activeTab, setActiveTab] = useState('form'); 
    
    // Data State
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedClass, setSelectedClass] = useState(''); 
    const [searchStudent, setSearchStudent] = useState('');
    const [editingId, setEditingId] = useState(null);
    
    const [form, setForm] = useState({ 
        date: new Date().toISOString().slice(0,10), 
        time: '',
        place: '',
        serviceType: LAYANAN_TYPES[0], 
        
        // Data Dropdown
        category: MASALAH_KATEGORI[0],
        skkpd: '',    // Ini digunakan sebagai "Bidang Bimbingan"
        technique: '', // Teknik Konseling
        
        description: '', 
        isPrivate: false, // --- STATE BARU: BIMBINGAN PRIVASI ---

        processEval: '',
        resultEval: '',
        followUp: 'Selesai' 
    });

    const isClassical = form.serviceType === 'Bimbingan Klasikal';
    const classes = useMemo(() => [...new Set(students.map(s => s.class))].sort(), [students]);

    // --- LOGIC ---

    const handleSelectStudent = (student) => {
        if (!selectedStudents.find(s => s.id === student.id)) {
            setSelectedStudents([...selectedStudents, student]);
        }
        setSearchStudent('');
    };

    const handleRemoveStudent = (id) => {
        setSelectedStudents(selectedStudents.filter(s => s.id !== id));
    };

    const handleClassSelect = (className) => {
        setSelectedClass(className);
        setSelectedStudents([]);
    };

    const handleEditClick = (journal) => {
        setEditingId(journal.id);
        setActiveTab('form'); 
        
        setSelectedStudents([]);
        setSelectedClass('');

        setForm({
            date: journal.date,
            time: journal.time || '',
            place: journal.place || '',
            serviceType: journal.serviceType,
            
            // Load Data Dropdown
            category: journal.category || MASALAH_KATEGORI[0],
            skkpd: journal.skkpd || '', // Bidang Bimbingan
            technique: journal.technique || '', // Teknik
            
            description: journal.description || '',
            isPrivate: journal.isPrivate || false, // Load status privasi

            processEval: journal.processEval || '',
            resultEval: journal.resultEval || journal.result || '',
            followUp: journal.followUp || 'Selesai'
        });
        
        const isJournalClassical = journal.serviceType === 'Bimbingan Klasikal';

        if (isJournalClassical) {
            const className = journal.studentName.replace('Kelas ', ''); 
            setSelectedClass(className);
        } else {
            if (journal.studentIds && journal.studentIds.length > 0) {
                const foundStudents = students.filter(s => journal.studentIds.includes(s.id));
                setSelectedStudents(foundStudents);
            } else if (journal.studentId) { 
                const found = students.find(s => s.id === journal.studentId);
                if(found) setSelectedStudents([found]);
            }
        }
    };

    const resetForm = () => {
        setForm({ 
            date: new Date().toISOString().slice(0,10), description: '', 
            processEval: '', resultEval: '', time: '', place: '', 
            
            technique: '', 
            category: MASALAH_KATEGORI[0],
            skkpd: '', 
            isPrivate: false,

            serviceType: LAYANAN_TYPES[0], followUp: 'Selesai'
        });
        setSelectedStudents([]);
        setSelectedClass('');
        setEditingId(null);
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isClassical && !selectedClass) return alert("Silakan pilih Kelas Sasaran!");
        if (!isClassical && selectedStudents.length === 0) return alert("Pilih minimal satu siswa!");

        const payload = { 
            ...form, 
            academicYear: settings?.academicYear || '2024/2025', 
            semester: settings?.semester || 'Ganjil',
            
            studentIds: isClassical ? [] : selectedStudents.map(s => s.id),
            studentNames: isClassical ? [`Kelas ${selectedClass}`] : selectedStudents.map(s => s.name),
            studentName: isClassical ? `Kelas ${selectedClass}` : (selectedStudents.length === 1 ? selectedStudents[0].name : `${selectedStudents.length} Siswa`),
            targetClass: isClassical ? selectedClass : ''
        };
        
        if (editingId) {
            onUpdate({ id: editingId, ...payload });
        } else {
            onAdd(payload);
        }
        
        resetForm();
        if(window.innerWidth < 768) setActiveTab('history'); 
    };

    const studentSuggestions = students.filter(s => 
        s.name.toLowerCase().includes(searchStudent.toLowerCase()) && 
        !selectedStudents.find(sel => sel.id === s.id)
    );

    return (
        <div className="flex flex-col h-full bg-slate-100 md:flex-row md:overflow-hidden relative">
            
            {/* MOBILE TAB NAVIGATION */}
            <div className="md:hidden bg-white border-b sticky top-0 z-20 flex shadow-sm">
                <button 
                    onClick={() => setActiveTab('form')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'form' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500'}`}
                >
                    <Edit size={18}/> Input
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500'}`}
                >
                    <History size={18}/> Riwayat
                </button>
            </div>

            {/* --- LEFT COLUMN: INPUT FORM --- */}
            <div className={`flex-1 overflow-y-auto p-4 md:p-6 md:w-5/12 lg:w-1/3 md:border-r border-slate-200 bg-white shadow-xl z-10 ${activeTab === 'history' ? 'hidden md:block' : 'block'}`}>
                
                <div className="mb-4">
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 mb-2">
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                            <BookOpen size={20}/> 
                        </div>
                        {editingId ? 'Edit Jurnal' : 'Jurnal Baru'}
                    </h2>
                    
                    <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border border-blue-100">
                        <Info size={14}/>
                        <span>Periode Aktif: <b>{settings?.semester || 'Semester ?'} {settings?.academicYear || ''}</b></span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 pb-20 md:pb-0">
                    
                    {/* SECTION 1: WAKTU & TEMPAT */}
                    <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 space-y-4">
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2 mb-1">
                            <Clock size={14}/> Waktu & Tempat
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Tanggal</label>
                                <input type="date" className="w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} required/>
                            </div>
                            <div className="w-1/3">
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Jam Ke-</label>
                                <input type="text" className="w-full p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700" placeholder="1-2" value={form.time} onChange={e=>setForm({...form, time:e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Tempat Layanan</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-3 text-blue-400"/>
                                <input className="w-full pl-9 p-2.5 border border-blue-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700" placeholder="R. BK / Kelas" value={form.place} onChange={e=>setForm({...form, place:e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: JENIS & SASARAN */}
                    <div className="bg-purple-50/60 p-5 rounded-2xl border border-purple-100 space-y-4">
                        <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2 mb-1">
                            <Target size={14}/> Jenis & Sasaran
                        </h3>
                        
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Jenis Layanan</label>
                            <select 
                                className="w-full p-2.5 border border-purple-200 rounded-xl text-sm font-bold text-purple-700 bg-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer" 
                                value={form.serviceType} 
                                onChange={e=> { setForm({...form, serviceType:e.target.value}); setSelectedStudents([]); setSelectedClass(''); }}
                            >
                                {LAYANAN_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-sm">
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block flex justify-between">
                                {isClassical ? 'Pilih Kelas (Klasikal)' : 'Cari Siswa / Konseli'}
                                <span className="text-purple-600 bg-purple-100 px-2 rounded-full text-[10px]">{isClassical ? (selectedClass || '-') : selectedStudents.length}</span>
                            </label>
                            
                            {isClassical ? (
                                <select 
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 font-bold text-slate-800 focus:ring-2 focus:ring-purple-500" 
                                    onChange={(e) => handleClassSelect(e.target.value)}
                                    value={selectedClass}
                                >
                                    <option value="">-- Pilih Kelas --</option>
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            ) : (
                                <>
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                                        <input 
                                            className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                                            placeholder="Ketik nama siswa..." 
                                            value={searchStudent}
                                            onChange={e=>setSearchStudent(e.target.value)}
                                        />
                                        {searchStudent && (
                                            <div className="absolute z-10 w-full bg-white border shadow-xl max-h-48 overflow-y-auto mt-1 rounded-lg">
                                                {studentSuggestions.map(s => (
                                                    <div key={s.id} onClick={() => handleSelectStudent(s)} className="p-3 hover:bg-purple-50 cursor-pointer text-sm border-b flex justify-between items-center group">
                                                        <span>{s.name} <span className="text-xs text-slate-400">({s.class})</span></span>
                                                        <Plus size={14} className="text-purple-500 opacity-0 group-hover:opacity-100"/>
                                                    </div>
                                                ))}
                                                {studentSuggestions.length === 0 && <div className="p-3 text-xs text-slate-400">Siswa tidak ditemukan</div>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                                        {selectedStudents.map(s => (
                                            <span key={s.id} className="bg-purple-50 border border-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs flex items-center gap-1 font-bold">
                                                {s.name} 
                                                <button type="button" onClick={() => handleRemoveStudent(s.id)} className="text-purple-400 hover:text-red-500"><X size={12}/></button>
                                            </span>
                                        ))}
                                        {selectedStudents.length === 0 && <span className="text-xs text-slate-400 italic p-1">Belum ada siswa dipilih.</span>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: ISI KONTEN */}
                    <div className="space-y-4 pt-2">
                        <InputGroup label="Topik / Masalah" icon={<FileText size={14}/>} value={form.description} onChange={e=>setForm({...form, description:e.target.value})} textarea placeholder="Uraikan topik atau masalah..." />
                        
                        {/* INPUT BARU: CHECKBOX PRIVASI */}
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                            <div className="pt-0.5">
                                <input 
                                    type="checkbox" 
                                    id="privacyCheck"
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                                    checked={form.isPrivate}
                                    onChange={e => setForm({...form, isPrivate: e.target.checked})}
                                />
                            </div>
                            <label htmlFor="privacyCheck" className="cursor-pointer select-none">
                                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                                    <Shield size={16} className="text-yellow-600"/>
                                    Tandai sebagai Bimbingan Privasi
                                </div>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Topik layanan akan disembunyikan saat fitur "Samarkan Topik" diaktifkan pada dokumen.
                                </p>
                            </label>
                        </div>

                        {/* Dropdown Kategori & Bidang */}
                        <div className="grid grid-cols-2 gap-4">
                            <SelectGroup label="Kategori" value={form.category} onChange={e=>setForm({...form, category:e.target.value})} options={MASALAH_KATEGORI} />
                            <SelectGroup label="Bidang Bimbingan" value={form.skkpd} onChange={e=>setForm({...form, skkpd:e.target.value})} options={SKKPD_LIST} placeholder="-- Pilih --"/>
                        </div>
                        
                        {/* Dropdown Teknik */}
                        <SelectGroup label="Teknik Konseling" icon={<GraduationCap size={14}/>} value={form.technique} onChange={e=>setForm({...form, technique:e.target.value})} options={TEKNIK_KONSELING} placeholder="-- Pilih Teknik --"/>
                        
                        {/* EVALUASI */}
                        <div className="bg-teal-50/60 p-5 rounded-2xl border border-teal-100 space-y-4 mt-2">
                            <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider flex items-center gap-2 mb-1">
                                <Activity size={14}/> Evaluasi & Tindak Lanjut
                            </h3>
                            <InputGroup label="Evaluasi Proses" value={form.processEval} onChange={e=>setForm({...form, processEval:e.target.value})} textarea rows={2} placeholder="Respon siswa..." customBorder="border-teal-200 focus:ring-teal-500" />
                            <InputGroup label="Evaluasi Hasil" value={form.resultEval} onChange={e=>setForm({...form, resultEval:e.target.value})} textarea rows={2} placeholder="Pemahaman baru..." customBorder="border-teal-200 focus:ring-teal-500" />
                            <div className="pt-1">
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Status Akhir</label>
                                <select className="w-full p-2.5 border border-teal-300 rounded-xl text-sm font-bold text-teal-800 bg-white" value={form.followUp} onChange={e=>setForm({...form, followUp:e.target.value})}>
                                    <option value="Masalah Selesai">Masalah Selesai</option>
                                    <option value="Perlu Pantauan Berkala">Perlu Pantauan Berkala</option>
                                    <option value="Konseling Lanjutan">Jadwalkan Konseling Lanjutan</option>
                                    <option value="Konferensi Kasus">Konferensi Kasus</option>
                                    <option value="Alih Tangan Kasus">Alih Tangan Kasus</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* BUTTONS */}
                    <div className="sticky bottom-0 bg-white/95 backdrop-blur pt-4 pb-2 border-t border-slate-100 flex gap-3 z-10">
                        {editingId && (
                            <button type="button" onClick={resetForm} className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200">
                                Batal
                            </button>
                        )}
                        <button type="submit" className={`flex-1 py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg text-white transition-transform active:scale-95 ${editingId ? 'bg-orange-600 shadow-orange-200 hover:bg-orange-700' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'}`}>
                            {editingId ? <><RefreshCcw size={18}/> Update Jurnal</> : <><Save size={18}/> Simpan Jurnal</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- RIGHT COLUMN: HISTORY LIST --- */}
            <div className={`flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6 md:w-7/12 lg:w-2/3 ${activeTab === 'form' ? 'hidden md:block' : 'block'}`}>
                
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <History className="text-blue-600"/> Riwayat Jurnal
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Daftar aktivitas layanan yang telah tersimpan.</p>
                    </div>
                </div>

                <div className="space-y-4 pb-24 md:pb-10">
                    {journals.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(j => (
                        <div key={j.id} className={`bg-white border rounded-2xl p-5 transition-all hover:shadow-lg hover:border-blue-200 group relative ${editingId === j.id ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-200' : 'border-slate-200'}`}>
                            
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditClick(j)} className="p-2 rounded-full text-blue-400 hover:text-white hover:bg-blue-600 transition-colors shadow-sm bg-slate-50 border border-slate-100"><Edit size={16}/></button>
                                <button onClick={() => onDelete(j.id)} className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-600 transition-colors shadow-sm bg-slate-50 border border-slate-100"><Trash2 size={16}/></button>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                                    <Calendar size={12}/> {formatIndoDate(j.date)}
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wide ${j.serviceType?.includes('Klasikal') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {j.serviceType}
                                </span>
                                {j.isPrivate && <Lock size={12} className="text-red-500" />}
                            </div>

                            <h4 className="font-bold text-slate-800 mb-2 line-clamp-1 text-lg">
                                {j.studentName}
                            </h4>
                            
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                                <p className="text-sm text-slate-600 italic line-clamp-2">"{j.description}"</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 border-t pt-3 mt-auto">
                                <div>
                                    <span className="font-bold block text-slate-400 text-[10px] uppercase mb-0.5">Teknik & Bidang</span>
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{j.technique || '-'} • {j.skkpd || '-'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-slate-400 text-[10px] uppercase mb-0.5">Status Akhir</span>
                                    <span className={`inline-flex items-center justify-end gap-1 px-2 py-0.5 rounded-full font-bold ${j.followUp === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {j.followUp === 'Selesai' && <CheckCircle2 size={12}/>}
                                        {j.followUp}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {journals.length === 0 && (
                        <div className="text-center py-20 opacity-50">
                            <ClipboardList size={64} className="mx-auto mb-4 text-slate-300"/>
                            <p className="text-base font-medium text-slate-400">Belum ada jurnal tersimpan.</p>
                        </div>
                    )}
                </div>
                
                {/* MOBILE FAB */}
                <button onClick={() => setActiveTab('form')} className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-transform active:scale-95 z-30 ring-4 ring-blue-50"><Plus size={28}/></button>
            </div>
        </div>
    );
};

const InputGroup = ({ label, icon, value, onChange, placeholder, textarea, rows=3, customBorder }) => (
    <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
            {icon && <span className="text-blue-500">{icon}</span>} {label}
        </label>
        {textarea ? (
            <textarea className={`w-full p-3 border rounded-xl text-sm bg-white focus:ring-2 outline-none transition-all ${customBorder || 'border-slate-300 focus:ring-blue-500'}`} rows={rows} placeholder={placeholder} value={value} onChange={onChange} />
        ) : (
            <input className={`w-full p-3 border rounded-xl text-sm bg-white focus:ring-2 outline-none transition-all ${customBorder || 'border-slate-300 focus:ring-blue-500'}`} placeholder={placeholder} value={value} onChange={onChange} />
        )}
    </div>
);

const SelectGroup = ({ label, icon, value, onChange, options, placeholder }) => (
    <div className="flex-1">
        <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
            {icon && <span className="text-purple-500">{icon}</span>} {label}
        </label>
        <select className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-slate-700" value={value} onChange={onChange}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

export default Journal;