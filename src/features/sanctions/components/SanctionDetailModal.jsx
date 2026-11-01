import React, { useState, useRef, useCallback } from 'react';
import { X, AlertTriangle, Activity, GripVertical, User, Info } from 'lucide-react';

const SanctionDetailModal = ({ isOpen, onClose, student }) => {
    // --- STATE RESIZING ---
    const [drawerWidth, setDrawerWidth] = useState(450); // Lebar default
    const isResizingRef = useRef(false);

    // --- LOGIC RESIZING (Sama seperti PointInputModal) ---
    const startResizing = useCallback((e) => {
        isResizingRef.current = true;
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'ew-resize';
        e.preventDefault();
    }, []);

    const stopResizing = useCallback(() => {
        isResizingRef.current = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
    }, []);

    const resize = useCallback((e) => {
        if (!isResizingRef.current) return;
        const newWidth = window.innerWidth - e.clientX;
        // Batasi lebar min 350px dan max 90% layar
        if (newWidth > 350 && newWidth < window.innerWidth * 0.9) {
            setDrawerWidth(newWidth);
        }
    }, []);

    if (!isOpen || !student) return null;
    
    // Ambil data aturan (Pastikan fallback ke object kosong jika null)
    const rule = student.activeRule || {};

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* BACKDROP */}
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* SIDE DRAWER RESIZABLE */}
            <div 
                className="relative h-full bg-white shadow-2xl flex animate-in slide-in-from-right duration-300"
                style={{ width: `${drawerWidth}px` }}
            >
                {/* --- HANDLE GESER --- */}
                <div 
                    onMouseDown={startResizing}
                    className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 hover:bg-blue-400 cursor-ew-resize z-10 transition-colors flex items-center justify-center group"
                    title="Geser untuk mengubah lebar panel"
                >
                    <GripVertical size={12} className="text-slate-400 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"/>
                </div>

                {/* KONTEN DRAWER */}
                <div className="flex-1 flex flex-col h-full border-l border-slate-200 bg-slate-50/50">
                    
                    {/* HEADER */}
                    <div className="p-6 border-b flex justify-between items-start bg-white border-blue-100 flex-shrink-0">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                    <Activity size={24}/>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-blue-900">
                                        Detail Tindak Lanjut
                                    </h2>
                                    <p className="text-sm text-slate-500 font-medium">Instruksi penanganan pelanggaran siswa</p>
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
                             <span className="text-xs text-slate-400 uppercase font-bold">Total Poin</span>
                             <div className="text-xl font-black text-red-600">
                                 {student.netScore}
                             </div>
                        </div>
                    </div>

                    {/* BODY (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        
                        {/* KARTU STATUS SANKSI */}
                        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <AlertTriangle size={80} className="text-red-500"/>
                            </div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Status Sanksi Saat Ini</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                    <AlertTriangle size={24}/>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-800 leading-none">
                                        {rule.penalty || rule.action || "Tidak Terdefinisi"}
                                    </div>
                                    <p className="text-sm text-red-600 font-medium mt-1">
                                        Akumulasi Poin: {rule.min} - {rule.max}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* KARTU TINDAK LANJUT */}
                        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Info size={80} className="text-blue-500"/>
                            </div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Tindak Lanjut Diperlukan</h4>
                            
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 bg-blue-100 text-blue-600 p-1.5 rounded-md">
                                        <Activity size={18}/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base text-slate-700 font-medium leading-relaxed">
                                            {rule.action || "Belum ada instruksi tindak lanjut khusus untuk level poin ini."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <h5 className="text-xs font-bold text-slate-500 mb-2">Langkah-langkah yang disarankan:</h5>
                                <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                                    <li>Periksa kembali riwayat poin siswa untuk memastikan akurasi.</li>
                                    <li>Lakukan komunikasi persuasif dengan siswa terlebih dahulu.</li>
                                    <li>Jika diperlukan, cetak <b>Surat Panggilan</b> melalui tombol yang tersedia di halaman sebelumnya.</li>
                                    <li>Catat hasil pembinaan di <b>Jurnal Harian</b> atau <b>Riwayat Konseling</b>.</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                    
                    {/* FOOTER */}
                    <div className="p-4 border-t bg-white flex justify-end">
                        <button 
                            onClick={onClose} 
                            className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Tutup Panel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SanctionDetailModal;