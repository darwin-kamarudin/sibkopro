import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../common/config/firebase';
import { Plus, Settings, Info, Printer, Edit2, Trash2 } from 'lucide-react';
import PresensiFormModal from './components/PresensiFormModal';
import MasterJamModal from './components/MasterJamModal';
import PrintPresensiModal from './components/PrintPresensiModal';

export default function PresensiSiswa({ user, students, settings }) {
    // Kumpulan State (Jangan sampai terhapus)
    const [presensiLogs, setPresensiLogs] = useState([]);
    const [masterJam, setMasterJam] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isMasterOpen, setIsMasterOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false); 
    const [editingLog, setEditingLog] = useState(null); 

    // Fetch Master Jam Pembelajaran
    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, 'settings', `master_jam_${user.id}`), (doc) => {
            if (doc.exists()) setMasterJam(doc.data().items || []);
        });
        return () => unsub();
    }, [user]);

    // Fetch Riwayat Presensi
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'presensi_logs'), where('teacherId', '==', user.id));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPresensiLogs(data.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
        });
        return () => unsub();
    }, [user]);

    // Fungsi Aksi Database
    const handleSaveMasterJam = async (newJams) => {
        await setDoc(doc(db, 'settings', `master_jam_${user.id}`), { items: newJams });
        setIsMasterOpen(false);
    };

    const handleSavePresensi = async (data) => {
        if (editingLog) {
            await updateDoc(doc(db, 'presensi_logs', editingLog.id), data);
            setEditingLog(null);
        } else {
            await addDoc(collection(db, 'presensi_logs'), { ...data, teacherId: user.id });
        }
        setIsFormOpen(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data presensi ini?")) {
            await deleteDoc(doc(db, 'presensi_logs', id));
        }
    };

    const openEdit = (log) => {
        setEditingLog(log);
        setIsFormOpen(true);
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* ACTION BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                    <Info size={18} />
                    <p className="text-sm font-medium">Siswa yang tidak dicatat otomatis dianggap Hadir.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsPrintOpen(true)} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 transition-colors">
                        <Printer size={16} /> Cetak
                    </button>
                    <button onClick={() => setIsMasterOpen(true)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-slate-300">
                        <Settings size={16} /> Setting Jam Pembelajaran
                    </button>
                    <button onClick={() => { setEditingLog(null); setIsFormOpen(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md">
                        <Plus size={16} /> Catat Presensi
                    </button>
                </div>
            </div>

            {/* TABEL REKAPAN */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b font-bold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Tanggal</th>
                                <th className="p-4">Nama Siswa</th>
                                <th className="p-4">Kelas</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Waktu</th>
                                <th className="p-4">Keterangan</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {presensiLogs.length > 0 ? presensiLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 whitespace-nowrap">{new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    <td className="p-4 font-bold text-slate-800">{log.studentName}</td>
                                    <td className="p-4">{log.studentClass}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            log.status.includes('Bolos') ? 'bg-red-100 text-red-700' : 
                                            log.status === 'Terlambat' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-blue-600">
                                        {log.jamMulai ? `${log.jamMulai} ${log.jamSelesai ? 's/d ' + log.jamSelesai : ''}` : '-'}
                                    </td>
                                    <td className="p-4 text-slate-500 italic">{log.keterangan || '-'}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => openEdit(log)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors" title="Edit Data">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(log.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus Data">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-slate-400">Belum ada catatan presensi/pelanggaran.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* KUMPULAN MODAL (Pop-up) */}
            <MasterJamModal isOpen={isMasterOpen} onClose={() => setIsMasterOpen(false)} masterJam={masterJam} onSave={handleSaveMasterJam} />
            <PresensiFormModal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingLog(null); }} students={students} masterJam={masterJam} presensiLogs={presensiLogs} editData={editingLog} onSave={handleSavePresensi} />
            
            <PrintPresensiModal 
                isOpen={isPrintOpen} 
                onClose={() => setIsPrintOpen(false)} 
                logs={presensiLogs} 
                userName={user?.fullName || "Guru BK"} 
                settings={settings} 
            />
        </div>
    );
}