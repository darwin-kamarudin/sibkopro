import React, { useState, useEffect } from 'react';
import { X, Search, Clock, Save, AlertCircle, History } from 'lucide-react';

const STATUS_OPTIONS = [
    'Alpa (Tidak masuk)', 
    'Masuk Terlambat', 
    'Bolos Kelas', 
    'Masuk Setelah Bolos', 
    'Izin', 
    'Sakit'
];

// PASTIKAN menambahkan prop 'presensiLogs' di sini
export default function PresensiFormModal({ isOpen, onClose, students, masterJam, presensiLogs, onSave }) {
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [hasFoundPreviousBolos, setHasFoundPreviousBolos] = useState(false);
    const savedTimezone = localStorage.getItem('defaultTimezone') || 'WIB';

    const [form, setForm] = useState({
        status: 'Alpa (Tidak masuk)',
        jamMulaiMaster: '',    // Jam Pembelajaran Ke (Master) - Mulai
        jamMulaiManual: '',    // Jam Real Pukul:Menit - Mulai
        jamSelesaiMaster: '',  // Jam Pembelajaran Ke (Master) - Kembali/Selesai
        jamSelesaiManual: '',  // Jam Real Pukul:Menit - Kembali/Selesai
        zonaWaktu: savedTimezone,
        keterangan: ''
    });

    // Reset zona waktu ke default setiap modal dibuka
    useEffect(() => {
        if (isOpen) {
            setForm(prev => ({ ...prev, zonaWaktu: localStorage.getItem('defaultTimezone') || 'WIB' }));
        }
    }, [isOpen]);

    // -------------------------------------------------------------
    // LOGIKA AUTO-FILL (Penyempurnaan Ekstraksi Data yang Lebih Akurat)
    // -------------------------------------------------------------
    useEffect(() => {
        if (isOpen && selectedStudent && form.status === 'Masuk Setelah Bolos') {
            const today = new Date().toISOString().split('T')[0];
            
            // Mencari log "Bolos Kelas" untuk siswa ini di hari yang sama
            const previousLog = presensiLogs?.find(log => 
                log.studentId === selectedStudent.id && 
                log.date === today && 
                log.status === 'Bolos Kelas'
            );

            if (previousLog && previousLog.jamMulai) {
                // Contoh Data yang tersimpan: "Sesi 1 (07:15 WIB)" atau hanya "Jam Ke-2"
                
                // 1. Ekstrak Jam Real / Waktu Manual (Misal: ambil "07:15" dari "(07:15 WIB)")
                const manualMatch = previousLog.jamMulai.match(/\((\d{2}:\d{2})/);
                
                // 2. Ekstrak Jam Master (Menghapus semua teks di dalam kurung beserta spasinya)
                const masterValue = previousLog.jamMulai.replace(/\(.*\)/, '').trim();

                setForm(prev => ({
                    ...prev,
                    jamMulaiMaster: masterValue || '',
                    jamMulaiManual: manualMatch ? manualMatch[1] : '',
                }));
                
                setHasFoundPreviousBolos(true);
            } else {
                // Jika hari ini siswa tersebut tidak punya catatan bolos
                setHasFoundPreviousBolos(false);
                setForm(prev => ({ ...prev, jamMulaiMaster: '', jamMulaiManual: '' }));
            }
        } else if (form.status !== 'Masuk Setelah Bolos') {
            // Reset state alert jika ganti status selain Masuk Setelah Bolos
            setHasFoundPreviousBolos(false);
        }
    }, [selectedStudent, form.status, isOpen, presensiLogs]);


    if (!isOpen) return null;

    const filteredStudents = search 
        ? students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
        : [];

    const showMulai = ['Masuk Terlambat', 'Bolos Kelas', 'Masuk Setelah Bolos'].includes(form.status);
    const showSelesai = form.status === 'Masuk Setelah Bolos';
    const noTimeNeeded = ['Alpa (Tidak masuk)', 'Izin', 'Sakit'].includes(form.status);

    const handleSetDefaultTimezone = () => {
        localStorage.setItem('defaultTimezone', form.zonaWaktu);
        alert(`Zona waktu default sistem berhasil diatur ke ${form.zonaWaktu}`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedStudent) return alert('Pilih siswa terlebih dahulu!');
        
        // Validasi Dasar
        if (showMulai && !form.jamMulaiMaster) return alert('Harap pilih Jam Pembelajaran!');
        if (showSelesai && !form.jamSelesaiMaster) return alert('Harap pilih Jam Pembelajaran masuk kembali!');

        onSave({
            studentId: selectedStudent.id,
            studentName: selectedStudent.name,
            studentClass: selectedStudent.class,
            status: form.status,
            jamMulai: `${form.jamMulaiMaster} ${form.jamMulaiManual ? `(${form.jamMulaiManual} ${form.zonaWaktu})` : ''}`.trim(),
            jamSelesai: showSelesai ? `${form.jamSelesaiMaster} ${form.jamSelesaiManual ? `(${form.jamSelesaiManual} ${form.zonaWaktu})` : ''}`.trim() : '',
            keterangan: form.keterangan,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        });
        
        setSearch(''); 
        setSelectedStudent(null);
        setForm({ status: 'Alpa (Tidak masuk)', jamMulaiMaster: '', jamMulaiManual: '', jamSelesaiMaster: '', jamSelesaiManual: '', zonaWaktu: savedTimezone, keterangan: '' });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-slate-800">Catat Presensi Siswa</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"><X size={20}/></button>
                </div>

                <div className="p-5 max-h-[75vh] overflow-y-auto">
                    {/* Pencarian Siswa */}
                    {!selectedStudent ? (
                        <div className="mb-5">
                            <label className="text-sm font-bold text-slate-700 block mb-2">Cari Nama Siswa</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ketik nama siswa..." className="w-full pl-10 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            {search && (
                                <ul className="mt-2 border border-slate-200 rounded-lg divide-y bg-white shadow-sm">
                                    {filteredStudents.map(s => (
                                        <li key={s.id} onClick={() => setSelectedStudent(s)} className="p-3 text-sm cursor-pointer hover:bg-blue-50 flex justify-between items-center">
                                            <span className="font-semibold text-slate-800">{s.name}</span>
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{s.class}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center shadow-sm">
                            <div>
                                <p className="text-xs font-bold text-blue-500 uppercase mb-1">Siswa Terpilih</p>
                                <p className="font-bold text-blue-900">{selectedStudent.name} ({selectedStudent.class})</p>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200">Ganti</button>
                        </div>
                    )}

                    <form id="presensiForm" onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">Status Kehadiran</label>
                                <select value={form.status} onChange={e => setForm({...form, status: e.target.value, jamMulaiMaster: '', jamMulaiManual: '', jamSelesaiMaster: '', jamSelesaiManual: ''})} className="w-full p-2.5 border rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            {noTimeNeeded && (
                                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <AlertCircle size={16} />
                                    <p className="text-xs font-medium">Status ini tidak memerlukan pencatatan waktu khusus.</p>
                                </div>
                            )}

                            {/* ALERT JIKA DATA DITEMUKAN */}
                            {hasFoundPreviousBolos && (
                                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100 animate-in fade-in zoom-in duration-300 shadow-sm">
                                    <History size={18} className="animate-pulse" />
                                    <p className="text-xs font-bold">Sistem menemukan catatan BOLOS siswa ini sebelumnya. Data Kejadian (Mulai Bolos) telah diisi otomatis.</p>
                                </div>
                            )}

                            {/* BAGIAN MULAI (Data Kejadian Bolos) */}
                            {showMulai && (
                                <div className={`pt-2 border-t border-slate-200 space-y-3 ${hasFoundPreviousBolos ? 'opacity-80 pointer-events-none bg-slate-100 p-3 rounded-lg border border-slate-200 shadow-inner' : ''}`}>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        {hasFoundPreviousBolos && <History size={12} />} Data Kejadian (Bolos Mulai)
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-700 block mb-1 uppercase">Jam Pembelajaran</label>
                                            <select value={form.jamMulaiMaster} onChange={e => setForm({...form, jamMulaiMaster: e.target.value})} className={`w-full p-2 border rounded-lg text-xs ${hasFoundPreviousBolos ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}>
                                                <option value="">-- Pilih --</option>
                                                {masterJam.map(j => <option key={j.id} value={j.nama}>{j.nama}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-700 block mb-1 uppercase">Waktu Real (Opsional)</label>
                                            <input type="time" value={form.jamMulaiManual} onChange={e => setForm({...form, jamMulaiManual: e.target.value})} className={`w-full p-2 border rounded-lg text-xs ${hasFoundPreviousBolos ? 'bg-slate-100 text-slate-500' : 'bg-white'}`} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* BAGIAN SELESAI (Khusus Masuk Setelah Bolos) */}
                            {showSelesai && (
                                <div className="pt-2 border-t border-slate-200 space-y-3">
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Data Masuk Kembali</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-700 block mb-1 uppercase">Jam Pembelajaran</label>
                                            <select value={form.jamSelesaiMaster} onChange={e => setForm({...form, jamSelesaiMaster: e.target.value})} className="w-full p-2 border rounded-lg text-xs bg-white">
                                                <option value="">-- Pilih --</option>
                                                {masterJam.map(j => <option key={j.id} value={j.nama}>{j.nama}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-700 block mb-1 uppercase">Waktu Real (Opsional)</label>
                                            <input type="time" value={form.jamSelesaiManual} onChange={e => setForm({...form, jamSelesaiManual: e.target.value})} className="w-full p-2 border rounded-lg text-xs bg-white" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ZONA WAKTU (Hanya muncul jika ada input manual) */}
                            {(form.jamMulaiManual || form.jamSelesaiManual) && (
                                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 mt-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Zona Waktu</span>
                                    <div className="flex gap-1">
                                        <select value={form.zonaWaktu} onChange={e => setForm({...form, zonaWaktu: e.target.value})} className="text-xs p-1 border rounded bg-slate-50">
                                            <option value="WIB">WIB</option><option value="WITA">WITA</option><option value="WIT">WIT</option>
                                        </select>
                                        <button type="button" onClick={handleSetDefaultTimezone} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Set Default"><Save size={14}/></button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-bold text-slate-700 block mb-2">Keterangan Tambahan</label>
                            <textarea value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows="2" placeholder="Catatan opsional..."></textarea>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-slate-600 rounded-lg hover:bg-slate-200">Batal</button>
                    <button type="submit" form="presensiForm" disabled={!selectedStudent} className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 shadow-md transition-all">Simpan Catatan</button>
                </div>
            </div>
        </div>
    );
}