import React, { useState, useRef, useEffect } from 'react';
import { 
    Plus, Trash2, Save, AlertTriangle, Trophy, Gavel, List, 
    Download, FileUp, Edit, CheckSquare, Square, X, Check 
} from 'lucide-react';
import * as XLSX from 'xlsx';

const MasterDataSettings = ({ masterPoints, onSavePoints, sanctionRules, onSaveSanctions }) => {
    // Tab Utama: 'points' vs 'sanctions'
    const [activeTab, setActiveTab] = useState('points');
    // Sub Tab untuk Poin: 'violation' vs 'achievement'
    const [pointSubTab, setPointSubTab] = useState('violation'); 

    const fileInputRef = useRef(null);

    // State untuk Seleksi & Edit
    const [selectedIds, setSelectedIds] = useState([]);
    const [editingItem, setEditingItem] = useState(null); 
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // --- STATE DATA UTAMA ---
    const [pointItems, setPointItems] = useState(masterPoints || []);
    const [sanctionItems, setSanctionItems] = useState(sanctionRules || []);

    // State Form Tambah Baru
    const [newPoint, setNewPoint] = useState({ code: '', label: '', point: 5 });
    const [newSanction, setNewSanction] = useState({ min: 0, max: 0, action: '', penalty: '' });

    // Reset seleksi saat ganti tab
    useEffect(() => {
        setSelectedIds([]);
        setEditingItem(null);
        setIsEditModalOpen(false);
    }, [activeTab, pointSubTab]);

    // FILTER DATA POIN BERDASARKAN SUB-TAB
    const filteredPoints = pointItems.filter(item => item.type === pointSubTab);

    // HELPER: Label Konteks Saat Ini
    const getCurrentContextLabel = () => {
        if (activeTab === 'sanctions') return 'Aturan Sanksi';
        return pointSubTab === 'violation' ? 'Poin Pelanggaran' : 'Poin Prestasi';
    };

    // ==========================================
    // 1. LOGIC SELEKSI & MASAL (BULK ACTIONS)
    // ==========================================
    
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const visibleIds = activeTab === 'points' 
                ? filteredPoints.map(i => i.id) 
                : sanctionItems.map(i => i.id);
            setSelectedIds(visibleIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDelete = () => {
        if (!confirm(`Yakin ingin menghapus ${selectedIds.length} data terpilih dari ${getCurrentContextLabel()}?`)) return;

        if (activeTab === 'points') {
            const updated = pointItems.filter(i => !selectedIds.includes(i.id));
            setPointItems(updated);
            onSavePoints(updated); 
        } else {
            const updated = sanctionItems.filter(i => !selectedIds.includes(i.id));
            setSanctionItems(updated);
            onSaveSanctions(updated);
        }
        setSelectedIds([]);
    };

    // ==========================================
    // 2. LOGIC CRUD (ADD / EDIT / DELETE)
    // ==========================================

    const handleAddPoint = () => {
        if (!newPoint.code || !newPoint.label) return alert("Kode dan Nama wajib diisi");
        
        const payload = { 
            ...newPoint, 
            id: Date.now().toString(), 
            type: pointSubTab 
        };

        const updated = [...pointItems, payload];
        setPointItems(updated);
        setNewPoint({ code: '', label: '', point: 5 }); 
        onSavePoints(updated);
    };

    const handleDeletePoint = (id) => {
        if(confirm("Hapus item ini?")) {
            const updated = pointItems.filter(i => i.id !== id);
            setPointItems(updated);
            onSavePoints(updated);
        }
    };

    const handleAddSanction = () => {
        if (!newSanction.action) return alert("Tindak lanjut wajib diisi");
        const updated = [...sanctionItems, { ...newSanction, id: Date.now().toString() }];
        updated.sort((a,b) => a.min - b.min);
        setSanctionItems(updated);
        setNewSanction({ min: 0, max: 0, action: '', penalty: '' });
        onSaveSanctions(updated);
    };

    const handleDeleteSanction = (id) => {
        if(confirm("Hapus aturan sanksi ini?")) {
            const updated = sanctionItems.filter(i => i.id !== id);
            setSanctionItems(updated);
            onSaveSanctions(updated);
        }
    };

    // Buka Modal Edit
    const handleEditClick = (item) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
    };

    // Simpan Perubahan Edit
    const handleSaveEdit = () => {
        if (activeTab === 'points') {
            const updated = pointItems.map(i => i.id === editingItem.id ? editingItem : i);
            setPointItems(updated);
            onSavePoints(updated);
        } else {
            const updated = sanctionItems.map(i => i.id === editingItem.id ? editingItem : i);
            updated.sort((a,b) => a.min - b.min); 
            setSanctionItems(updated);
            onSaveSanctions(updated);
        }
        setIsEditModalOpen(false);
        setEditingItem(null);
    };

    // ==========================================
    // 3. FITUR EXCEL (IMPORT / EXPORT KONTEKSTUAL)
    // ==========================================

    const handleDownloadTemplate = () => {
        let data = [];
        let fileName = "";

        if (activeTab === 'points') {
            // Tentukan Nama File & Isi berdasarkan Sub-Tab yang aktif
            if(pointSubTab === 'violation') {
                fileName = "Template_Poin_Pelanggaran.xlsx";
                data = [
                    { code: "A01", label: "Terlambat Masuk Sekolah", point: 5 },
                    { code: "A02", label: "Tidak Memakai Dasi", point: 10 },
                    { code: "B01", label: "Membolos Jam Pelajaran", point: 20 },
                ];
            } else {
                fileName = "Template_Poin_Prestasi.xlsx";
                data = [
                    { code: "PR01", label: "Juara 1 Tingkat Kelas", point: 10 },
                    { code: "PR02", label: "Juara Lomba Tingkat Kota", point: 25 },
                    { code: "PR03", label: "Menjadi Petugas Upacara", point: 5 },
                ];
            }
        } else {
            fileName = "Template_Aturan_Sanksi.xlsx";
            data = [
                { min: 10, max: 25, action: "Panggilan Wali Kelas", penalty: "Teguran Lisan" },
                { min: 26, max: 50, action: "Panggilan Orang Tua 1", penalty: "Skorsing 3 Hari" },
            ];
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, fileName);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const jsonData = XLSX.utils.sheet_to_json(ws);

            if (activeTab === 'points') {
                // Mapping data & PAKSA tipe sesuai tab yang aktif
                const formattedData = jsonData.map((item, index) => {
                    return {
                        id: `import-${Date.now()}-${index}`,
                        code: item.code ? String(item.code) : `UKN-${index}`,
                        label: item.label || 'Tanpa Keterangan',
                        point: parseInt(item.point) || 0,
                        type: pointSubTab // <--- KUNCI: Otomatis masuk ke Pelanggaran/Prestasi sesuai tab
                    };
                });
                
                const merged = [...pointItems, ...formattedData];
                setPointItems(merged);
                onSavePoints(merged);
                alert(`Berhasil mengimpor ${formattedData.length} data ke dalam daftar ${pointSubTab === 'violation' ? 'PELANGGARAN' : 'PRESTASI'}!`);

            } else {
                const formattedData = jsonData.map((item, index) => ({
                    id: `import-${Date.now()}-${index}`,
                    min: parseInt(item.min) || 0,
                    max: parseInt(item.max) || 0,
                    action: item.action || 'Tindak Lanjut Standar',
                    penalty: item.penalty || ''
                }));

                const merged = [...sanctionItems, ...formattedData].sort((a,b) => a.min - b.min);
                setSanctionItems(merged);
                onSaveSanctions(merged);
                alert(`Berhasil mengimpor ${formattedData.length} aturan sanksi!`);
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = null; 
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            {/* --- HEADER UTAMA --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b pb-4 gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Master Data & Aturan</h2>
                    <p className="text-xs text-slate-500">Kelola poin pelanggaran dan aturan sanksi otomatis.</p>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('points')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'points' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <List size={16}/> Master Poin
                    </button>
                    <button 
                        onClick={() => setActiveTab('sanctions')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'sanctions' ? 'bg-white shadow text-red-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Gavel size={16}/> Aturan Sanksi
                    </button>
                </div>
            </div>

            {/* --- KONTEN TAB 1: MASTER POIN --- */}
            {activeTab === 'points' && (
                <div className="animate-in fade-in">
                    
                    {/* SUB TAB NAVIGASI (Pelanggaran vs Prestasi) */}
                    <div className="flex gap-4 mb-4 border-b border-slate-200">
                        <button 
                            onClick={() => setPointSubTab('violation')}
                            className={`pb-2 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${pointSubTab === 'violation' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            <AlertTriangle size={16}/> Data Pelanggaran
                        </button>
                        <button 
                            onClick={() => setPointSubTab('achievement')}
                            className={`pb-2 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${pointSubTab === 'achievement' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            <Trophy size={16}/> Data Prestasi
                        </button>
                    </div>

                    {/* --- TOOLBAR KONTEKSTUAL --- */}
                    <div className="flex flex-wrap gap-3 mb-6 bg-slate-50 p-3 rounded-lg items-center border border-slate-100">
                        {selectedIds.length > 0 ? (
                            <div className="flex items-center gap-2 mr-auto animate-in fade-in">
                                <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-300">
                                    {selectedIds.length} Dipilih
                                </span>
                                <button onClick={handleBulkDelete} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-700">
                                    <Trash2 size={14}/> Hapus
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs font-bold text-slate-500 mr-auto uppercase tracking-wide">
                                Menu {pointSubTab === 'violation' ? 'Pelanggaran' : 'Prestasi'}:
                            </p>
                        )}
                        
                        <button onClick={handleDownloadTemplate} className="bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50">
                            <Download size={14}/> Template {pointSubTab === 'violation' ? 'Pelanggaran' : 'Prestasi'}
                        </button>

                        <div className="relative">
                            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />
                            <button onClick={() => fileInputRef.current.click()} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-green-700">
                                <FileUp size={14}/> Import {pointSubTab === 'violation' ? 'Pelanggaran' : 'Prestasi'}
                            </button>
                        </div>
                    </div>

                    {/* Form Tambah Manual (Sesuai Sub Tab) */}
                    <div className={`grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 p-4 rounded-lg border ${pointSubTab === 'violation' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                        <div className="md:col-span-4 mb-1">
                            <h4 className={`text-xs font-bold uppercase ${pointSubTab === 'violation' ? 'text-red-600' : 'text-green-600'}`}>
                                + Tambah {pointSubTab === 'violation' ? 'Pelanggaran' : 'Prestasi'} Manual
                            </h4>
                        </div>
                        <input placeholder="Kode (Cth: A01)" className="p-2 border rounded text-sm uppercase bg-white" value={newPoint.code} onChange={e => setNewPoint({...newPoint, code: e.target.value.toUpperCase()})} />
                        <input placeholder="Keterangan / Nama" className="p-2 border rounded text-sm md:col-span-2 bg-white" value={newPoint.label} onChange={e => setNewPoint({...newPoint, label: e.target.value})} />
                        <div className="flex gap-2">
                            <input type="number" placeholder="Poin" className="p-2 border rounded text-sm w-20 bg-white" value={newPoint.point} onChange={e => setNewPoint({...newPoint, point: parseInt(e.target.value)})} />
                            <button onClick={handleAddPoint} className={`flex-1 text-white rounded hover:opacity-90 flex items-center justify-center ${pointSubTab === 'violation' ? 'bg-red-600' : 'bg-green-600'}`}>
                                <Plus size={18}/> Tambah
                            </button>
                        </div>
                    </div>

                    {/* Tabel Data (Filtered) */}
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="p-3 w-10 text-center">
                                        <input type="checkbox" onChange={handleSelectAll} checked={filteredPoints.length > 0 && selectedIds.length === filteredPoints.length} />
                                    </th>
                                    <th className="p-3">Kode</th>
                                    <th className="p-3">Keterangan</th>
                                    <th className="p-3 text-center">Poin</th>
                                    <th className="p-3 text-center w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredPoints.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50' : ''}`}>
                                        <td className="p-3 text-center">
                                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelectOne(item.id)} />
                                        </td>
                                        <td className="p-3 font-mono font-bold text-slate-700">{item.code}</td>
                                        <td className="p-3">{item.label}</td>
                                        <td className={`p-3 text-center font-bold ${pointSubTab === 'violation' ? 'text-red-600' : 'text-green-600'}`}>
                                            {item.point}
                                        </td>
                                        <td className="p-3 flex justify-center gap-2">
                                            <button onClick={() => handleEditClick(item)} className="text-blue-400 hover:text-blue-600 p-1 rounded hover:bg-blue-100">
                                                <Edit size={16}/>
                                            </button>
                                            <button onClick={() => handleDeletePoint(item.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-100">
                                                <Trash2 size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredPoints.length === 0 && (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">
                                        Tidak ada data {pointSubTab === 'violation' ? 'pelanggaran' : 'prestasi'}.<br/>
                                        Gunakan form di atas atau import excel.
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- TAB CONTENT 2: SANKSI --- */}
            {activeTab === 'sanctions' && (
                <div className="animate-in fade-in">
                    
                    {/* --- TOOLBAR SANKSI --- */}
                    <div className="flex flex-wrap gap-3 mb-6 bg-slate-50 p-3 rounded-lg items-center border border-slate-100">
                        {selectedIds.length > 0 ? (
                            <div className="flex items-center gap-2 mr-auto animate-in fade-in">
                                <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-300">
                                    {selectedIds.length} Dipilih
                                </span>
                                <button onClick={handleBulkDelete} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-700">
                                    <Trash2 size={14}/> Hapus
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs font-bold text-slate-500 mr-auto uppercase tracking-wide">
                                Menu Aturan Sanksi:
                            </p>
                        )}
                        
                        <button onClick={handleDownloadTemplate} className="bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50">
                            <Download size={14}/> Template Sanksi
                        </button>

                        <div className="relative">
                            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" ref={fileInputRef} />
                            <button onClick={() => fileInputRef.current.click()} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-green-700">
                                <FileUp size={14}/> Import Sanksi
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Min</label>
                            <input type="number" className="p-2 border rounded text-sm w-full" value={newSanction.min} onChange={e => setNewSanction({...newSanction, min: parseInt(e.target.value)})} />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Max</label>
                            <input type="number" className="p-2 border rounded text-sm w-full" value={newSanction.max} onChange={e => setNewSanction({...newSanction, max: parseInt(e.target.value)})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Tindak Lanjut</label>
                            <input placeholder="Aksi Guru..." className="p-2 border rounded text-sm w-full" value={newSanction.action} onChange={e => setNewSanction({...newSanction, action: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">Sanksi</label>
                                <input placeholder="Hukuman Siswa..." className="p-2 border rounded text-sm w-full" value={newSanction.penalty} onChange={e => setNewSanction({...newSanction, penalty: e.target.value})} />
                            </div>
                            <button onClick={handleAddSanction} className="bg-green-500 text-white rounded hover:bg-green-600 px-3 py-2 h-[38px]"><Plus size={18}/></button>
                        </div>
                    </div>

                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-3 w-10 text-center">
                                        <input type="checkbox" onChange={handleSelectAll} checked={sanctionItems.length > 0 && selectedIds.length === sanctionItems.length} />
                                    </th>
                                    <th className="p-3 w-32">Range Poin</th>
                                    <th className="p-3">Tindak Lanjut (Untuk Guru)</th>
                                    <th className="p-3">Sanksi (Untuk Siswa)</th>
                                    <th className="p-3 text-center w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {sanctionItems.map((item) => (
                                    <tr key={item.id} className={`hover:bg-blue-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50' : ''}`}>
                                        <td className="p-3 text-center">
                                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelectOne(item.id)} />
                                        </td>
                                        <td className="p-3 font-bold text-red-600">
                                            {item.min} - {item.max} Poin
                                        </td>
                                        <td className="p-3">{item.action}</td>
                                        <td className="p-3 italic text-slate-500">{item.penalty || '-'}</td>
                                        <td className="p-3 flex justify-center gap-2">
                                            <button onClick={() => handleEditClick(item)} className="text-blue-400 hover:text-blue-600 p-1 rounded hover:bg-blue-100">
                                                <Edit size={16}/>
                                            </button>
                                            <button onClick={() => handleDeleteSanction(item.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-100">
                                                <Trash2 size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {sanctionItems.length === 0 && (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Belum ada aturan sanksi.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- MODAL EDIT (DINAMIS) --- */}
            {isEditModalOpen && editingItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Edit size={20} className="text-blue-600"/> Edit {activeTab === 'points' ? (editingItem.type === 'violation' ? 'Pelanggaran' : 'Prestasi') : 'Aturan Sanksi'}
                        </h3>
                        
                        <div className="space-y-3">
                            {activeTab === 'points' ? (
                                <>
                                    {/* Tidak perlu edit Type karena sudah fix di tab masing-masing */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Kode</label>
                                        <input className="w-full p-2 border rounded" value={editingItem.code} onChange={e => setEditingItem({...editingItem, code: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Keterangan</label>
                                        <input className="w-full p-2 border rounded" value={editingItem.label} onChange={e => setEditingItem({...editingItem, label: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Poin</label>
                                        <input type="number" className="w-full p-2 border rounded" value={editingItem.point} onChange={e => setEditingItem({...editingItem, point: parseInt(e.target.value)})} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-slate-500">Min</label>
                                            <input type="number" className="w-full p-2 border rounded" value={editingItem.min} onChange={e => setEditingItem({...editingItem, min: parseInt(e.target.value)})} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-slate-500">Max</label>
                                            <input type="number" className="w-full p-2 border rounded" value={editingItem.max} onChange={e => setEditingItem({...editingItem, max: parseInt(e.target.value)})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Tindak Lanjut</label>
                                        <input className="w-full p-2 border rounded" value={editingItem.action} onChange={e => setEditingItem({...editingItem, action: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Sanksi</label>
                                        <input className="w-full p-2 border rounded" value={editingItem.penalty} onChange={e => setEditingItem({...editingItem, penalty: e.target.value})} />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
                            <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan Perubahan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterDataSettings;