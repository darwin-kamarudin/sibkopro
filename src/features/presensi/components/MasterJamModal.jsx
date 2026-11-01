import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function MasterJamModal({ isOpen, onClose, masterJam, onSave }) {
    const [jams, setJams] = useState([]);
    const [newJam, setNewJam] = useState({ nama: '', mulai: '', selesai: '' });
    
    // State untuk Animasi & Feedback
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && masterJam) {
            setJams(masterJam);
            setShowSuccess(false); // Reset status sukses saat modal dibuka kembali
        }
    }, [isOpen, masterJam]);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!newJam.nama || !newJam.mulai || !newJam.selesai) {
            alert("Harap isi Nama Jam, Waktu Mulai, dan Waktu Selesai!");
            return;
        }
        setJams(prev => [...prev, { id: Date.now().toString(), ...newJam }]);
        setNewJam({ nama: '', mulai: '', selesai: '' });
        setShowSuccess(false); // Sembunyikan pesan sukses jika user menambah item baru lagi
    };

    const handleRemove = (id) => {
        setJams(prev => prev.filter(j => j.id !== id));
        setShowSuccess(false);
    };

    // Fungsi Simpan dengan Animasi
    const handleProcessSave = async () => {
        setIsSaving(true);
        try {
            // Memanggil fungsi onSave dari props (Firestore)
            await onSave(jams);
            
            // Tampilkan feedback sukses
            setIsSaving(false);
            setShowSuccess(true);
            
            // Sembunyikan notifikasi sukses setelah 3 detik
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);

        } catch (error) {
            setIsSaving(false);
            alert("Gagal menyimpan data: " + error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-slate-800">Setting Jam Pembelajaran</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 p-1">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-5 space-y-4">
                    {/* Input Area */}
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 space-y-3">
                        <div className="grid grid-cols-1 gap-2">
                            <label className="text-xs font-bold text-blue-800 uppercase tracking-wider">Label Jam</label>
                            <input 
                                type="text" 
                                value={newJam.nama} 
                                onChange={e => setNewJam({...newJam, nama: e.target.value})} 
                                placeholder="Contoh: Jam ke-1" 
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-blue-800 uppercase tracking-wider">Mulai</label>
                                <input type="time" value={newJam.mulai} onChange={e => setNewJam({...newJam, mulai: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-800 uppercase tracking-wider">Selesai</label>
                                <input type="time" value={newJam.selesai} onChange={e => setNewJam({...newJam, selesai: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                            </div>
                        </div>
                        <button onClick={handleAdd} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold text-sm transition-colors">
                            <Plus size={18} /> Tambahkan ke Daftar
                        </button>
                    </div>

                    {/* List Area */}
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Daftar Jam Terinput:</p>
                        {jams.map((jam) => (
                            <div key={jam.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <div>
                                    <p className="font-bold text-sm text-slate-800">{jam.nama}</p>
                                    <p className="text-xs text-slate-500 font-medium">{jam.mulai} — {jam.selesai}</p>
                                </div>
                                <button onClick={() => handleRemove(jam.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer dengan Notifikasi Sukses */}
                <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
                    <div className="flex-1">
                        {showSuccess && (
                            <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-left-2 duration-300">
                                <CheckCircle2 size={18} />
                                <span className="text-xs font-bold">Berhasil disimpan!</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={onClose} 
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-50"
                        >
                            Tutup
                        </button>
                        <button 
                            onClick={handleProcessSave} 
                            disabled={jams.length === 0 || isSaving}
                            className="min-w-[140px] px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 font-bold transition-all shadow-md shadow-emerald-100"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Simpan</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}