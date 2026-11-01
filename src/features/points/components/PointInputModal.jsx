import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    X, Search, ChevronDown, Edit, Trash2, 
    RefreshCcw, PlusCircle, AlertTriangle, Trophy, Calendar, Clock, GripVertical
} from 'lucide-react';

const PointInputModal = ({ 
    isOpen, onClose, student, activeTab, setActiveTab,
    masterPoints, pointLogs, onSubmit, onUpdate, onDelete 
}) => {
    // --- STATE FORM ---
    // Note: 'description' tetap ada di state untuk menampung hasil pilihan dropdown, tapi tidak ada input manualnya.
    const [formData, setFormData] = useState({
        code: '', value: 5, description: '', date: new Date().toISOString().slice(0, 10)
    });
    const [editingLogId, setEditingLogId] = useState(null);

    // --- STATE UI ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownSearch, setDropdownSearch] = useState('');
    // State untuk lebar drawer dinamis (default 500px)
    const [drawerWidth, setDrawerWidth] = useState(500);
    
    // --- REFS ---
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const isResizingRef = useRef(false); // Ref untuk melacak status resizing

    // --- EFFECTS ---
    useEffect(() => {
        if (isOpen) resetForm();
    }, [isOpen, student]);

    // Auto-focus search dropdown
    useEffect(() => {
        if (isDropdownOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current.focus(), 100);
        } else {
            setDropdownSearch('');
        }
    }, [isDropdownOpen]);

    // Close dropdown click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- RESIZING LOGIC (PENGATUR LEBAR DINAMIS) ---
    const startResizing = useCallback((e) => {
        isResizingRef.current = true;
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'ew-resize'; // Ubah kursor saat menggeser
        e.preventDefault(); // Mencegah seleksi teks
    }, []);

    const stopResizing = useCallback(() => {
        isResizingRef.current = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default'; // Kembalikan kursor
    }, []);

    const resize = useCallback((e) => {
        if (!isResizingRef.current) return;
        // Hitung lebar baru: Lebar layar total - posisi mouse X (karena drawer di kanan)
        const newWidth = window.innerWidth - e.clientX;
        // Batasi lebar minimum (misal 350px) dan maksimum (90% layar)
        if (newWidth > 350 && newWidth < window.innerWidth * 0.9) {
             setDrawerWidth(newWidth);
        }
    }, []);


    // --- BUSINESS LOGIC ---
    const filteredOptions = useMemo(() => {
        const options = (masterPoints || []).filter(item => item.type === activeTab);
        if (!dropdownSearch) return options;
        const lower = dropdownSearch.toLowerCase();
        return options.filter(item => 
            String(item.code).toLowerCase().includes(lower) || 
            item.label.toLowerCase().includes(lower)
        );
    }, [masterPoints, activeTab, dropdownSearch]);

    const studentHistory = useMemo(() => {
        if (!student) return [];
        return (pointLogs || [])
            .filter(log => log.studentId === student.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [student, pointLogs]);

    const resetForm = () => {
        setFormData({ code: '', value: 5, description: '', date: new Date().toISOString().slice(0, 10) });
        setEditingLogId(null);
    };

    const handleSelectOption = (item) => {
        // OTOMATISASI DESKRIPSI: Gabungkan Kode dan Label
        const autoDescription = `${item.code} - ${item.label}`;
        setFormData(prev => ({ 
            ...prev, 
            code: String(item.code), 
            description: autoDescription, 
            value: item.point 
        }));
        setIsDropdownOpen(false);
    };

    const handleEditLog = (log) => {
        if (log.type !== activeTab) setActiveTab(log.type);
        setEditingLogId(log.id);
        setFormData({ code: log.code || '', value: log.value, description: log.description, date: log.date });
    };

    const handleSubmit = () => {
        // Validasi sederhana: pastikan sudah memilih jenis pelanggaran/prestasi
        if (!formData.code || !formData.description) {
            alert(`Harap pilih jenis ${activeTab === 'violation' ? 'pelanggaran' : 'prestasi'} terlebih dahulu.`);
            return;
        }

        const payload = {
            type: activeTab,
            value: formData.value,
            description: formData.description, // Deskripsi otomatis terkirim
            studentId: student.id,
            studentName: student.name,
            class: student.class,
            date: formData.date,
            code: formData.code
        };

        if (editingLogId) {
            onUpdate({ id: editingLogId, ...payload });
            alert("Data diperbarui!");
        } else {
            onSubmit(payload);
            alert("Data tersimpan!");
        }
        resetForm();
    };

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* BACKDROP */}
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* PANEL SAMPING RESIZABLE */}
            <div 
                className="relative h-full bg-white shadow-2xl flex animate-in slide-in-from-right duration-300"
                style={{ width: `${drawerWidth}px` }} // Menggunakan style width dinamis
            >
                {/* --- RESIZE HANDLE (PEGANGAN GESER) --- */}
                <div 
                    onMouseDown={startResizing}
                    className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 hover:bg-blue-400 cursor-ew-resize z-10 transition-colors flex items-center justify-center group"
                    title="Geser untuk mengubah lebar"
                >
                    {/* Icon Grip opsional agar lebih jelas */}
                    <GripVertical size={12} className="text-slate-400 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"/>
                </div>
                
                {/* KONTEN DRAWER (Dibungkus div flex-col agar rapi) */}
                <div className="flex-1 flex flex-col h-full border-l border-slate-200 bg-slate-50/50">
                    
                    {/* HEADER */}
                    <div className={`p-6 border-b flex justify-between items-start flex-shrink-0 bg-white ${activeTab === 'violation' ? 'border-red-100' : 'border-green-100'}`}>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className={`p-2 rounded-lg ${activeTab === 'violation' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {editingLogId ? <Edit size={24}/> : (activeTab === 'violation' ? <AlertTriangle size={24}/> : <Trophy size={24}/>)}
                                </div>
                                <div>
                                    <h2 className={`text-xl font-bold ${activeTab === 'violation' ? 'text-red-700' : 'text-green-700'}`}>
                                        {editingLogId ? 'Edit Catatan' : (activeTab === 'violation' ? 'Catat Pelanggaran' : 'Catat Prestasi')}
                                    </h2>
                                    <p className="text-sm text-slate-500 font-medium">Input data poin siswa ke sistem</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <X size={24}/>
                        </button>
                    </div>

                    {/* INFO SISWA (Sticky) */}
                    <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">
                                {student.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{student.name}</h3>
                                <p className="text-xs text-slate-500">{student.class} • {student.nisn || 'No NISN'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="text-xs text-slate-400 uppercase font-bold">Total Poin Net</span>
                             <div className={`text-xl font-black ${student.netScore >= 50 ? 'text-red-600' : student.netScore >= 20 ? 'text-orange-500' : 'text-blue-600'}`}>
                                 {student.netScore}
                             </div>
                        </div>
                    </div>

                    {/* BODY (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        
                        {/* FORM SECTION */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b pb-2 mb-4">Form Input</h4>
                            
                            {/* DROPDOWN (DESKRIPSI OTOMATIS DARI SINI) */}
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                    Jenis {activeTab === 'violation' ? 'Pelanggaran' : 'Prestasi'} <span className="text-red-500">*</span>
                                </label>
                                <div 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                                    className={`w-full p-3.5 border rounded-xl flex justify-between items-center cursor-pointer transition-all bg-slate-50 hover:bg-white hover:border-blue-400 ${isDropdownOpen ? 'ring-2 ring-blue-500 border-blue-500 bg-white' : 'border-slate-300'}`}
                                >
                                    <span className={`text-sm font-medium ${!formData.description ? 'text-slate-400' : 'text-slate-800'} line-clamp-1`}>
                                        {formData.description || "-- Pilih dari daftar --"}
                                    </span>
                                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}/>
                                </div>

                                {isDropdownOpen && (
                                    <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-60">
                                        <div className="p-2 border-b bg-slate-50 sticky top-0">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                                                <input ref={searchInputRef} type="text" placeholder="Cari kode atau nama..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-blue-500 bg-white" value={dropdownSearch} onChange={(e) => setDropdownSearch(e.target.value)}/>
                                            </div>
                                        </div>
                                        <div className="overflow-y-auto flex-1">
                                            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                                                <div key={opt.id} onClick={() => handleSelectOption(opt)} className={`p-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer flex justify-between gap-3 ${formData.code === String(opt.code) ? 'bg-blue-50' : ''}`}>
                                                    <div className="flex-1">
                                                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Kode: {opt.code}</span>
                                                        <p className="text-sm text-slate-700 font-medium">{opt.label}</p>
                                                    </div>
                                                    <div className={`font-bold text-xs px-2 py-1 h-fit rounded ${activeTab === 'violation' ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>{opt.point} Poin</div>
                                                </div>
                                            )) : <div className="p-4 text-center text-xs text-slate-400">Tidak ditemukan.</div>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Nilai Poin</label>
                                    <input type="number" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Tanggal Kejadian</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-400" size={18}/>
                                        <input type="date" className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                                    </div>
                                </div>
                            </div>
                            
                            {/* --- TEXTAREA KETERANGAN TAMBAHAN TELAH DIHAPUS --- */}

                            {/* TOMBOL AKSI */}
                            <div className="flex gap-3 pt-4">
                                {editingLogId && <button onClick={resetForm} className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">Batal Edit</button>}
                                <button onClick={handleSubmit} className={`flex-1 py-3 rounded-xl text-white font-bold shadow-md flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all ${editingLogId ? 'bg-orange-500' : (activeTab === 'violation' ? 'bg-red-600' : 'bg-green-600')}`}>
                                    {editingLogId ? <RefreshCcw size={18}/> : <PlusCircle size={18}/>} 
                                    {editingLogId ? 'Simpan Perubahan' : 'Simpan Data'}
                                </button>
                            </div>
                        </div>

                        {/* HISTORY LIST */}
                        <div>
                             <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                 <Clock size={16}/> Riwayat Poin Siswa
                             </h4>
                             <div className="space-y-3">
                                {studentHistory.map(log => (
                                    <div key={log.id} className={`bg-white p-4 rounded-xl border shadow-sm transition-all flex gap-3 group ${editingLogId === log.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${log.type === 'violation' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {log.type === 'violation' ? <AlertTriangle size={14}/> : <Trophy size={14}/>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${log.type === 'violation' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                                        {log.type === 'violation' ? 'Pelanggaran' : 'Prestasi'}
                                                    </span>
                                                    <span className="text-xs text-slate-400 ml-2">{log.date}</span>
                                                </div>
                                                <span className="font-bold text-slate-800 text-sm">{log.value} Poin</span>
                                            </div>
                                            <p className="text-sm text-slate-700 mt-1 leading-snug font-medium">{log.description}</p>
                                            
                                            <div className="flex gap-2 mt-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                                <button onClick={() => handleEditLog(log)} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors">
                                                    <Edit size={12}/> Edit
                                                </button>
                                                <button onClick={() => onDelete(log.id)} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors">
                                                    <Trash2 size={12}/> Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {studentHistory.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                                        <p className="text-sm">Belum ada riwayat poin.</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PointInputModal;