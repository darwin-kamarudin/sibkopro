import React, { useMemo, useState } from 'react';
import { Search, Printer, Trophy, Filter } from 'lucide-react';
import { formatIndoDate } from '../../common/utils/helpers';
import PointHistoryModal from '../points/components/PointHistoryModal';

// ============================================================================
// BUKU PRESTASI SISWA
// Daftar siswa dengan rekap prestasi. Data mengikuti mode sanksi aktif
// (pointLogs sudah disaring di rute sesuai basis pasal/poin).
// ============================================================================
const AchievementBook = ({ students = [], pointLogs = [], settings, sanctionMode = 'poin', sanctionRules = [], tataTertib }) => {
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [selected, setSelected] = useState(null);

    const classes = useMemo(
        () => [...new Set((students || []).map(s => s.class).filter(Boolean))].sort(),
        [students]
    );

    // Rekap prestasi per siswa
    const rekap = useMemo(() => {
        const map = {};
        (pointLogs || []).forEach(l => {
            if (l.type !== 'achievement') return;
            if (!map[l.studentId]) map[l.studentId] = { count: 0, last: null };
            map[l.studentId].count += 1;
            const d = new Date(l.date);
            if (!map[l.studentId].last || d > map[l.studentId].last) map[l.studentId].last = d;
        });
        return map;
    }, [pointLogs]);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (students || [])
            .filter(s => !classFilter || s.class === classFilter)
            .filter(s => !q || (s.name || '').toLowerCase().includes(q) || (s.nisn || '').includes(q))
            .map(s => ({ ...s, achievementCount: rekap[s.id]?.count || 0, lastDate: rekap[s.id]?.last || null }))
            .sort((a, b) => b.achievementCount - a.achievementCount || (a.name || '').localeCompare(b.name || ''));
    }, [students, search, classFilter, rekap]);

    const totalSiswaBerprestasi = rows.filter(r => r.achievementCount > 0).length;

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Trophy size={22} className="text-green-600" /> Buku Prestasi Siswa</h1>
                    <p className="text-sm text-slate-500">
                        {sanctionMode === 'pasal' ? 'Mode berbasis pasal: prestasi dicatat per bidang.' : 'Mode berbasis poin: prestasi dicatat dengan nilai poin.'}
                    </p>
                </div>
                <div className="flex gap-3 text-sm">
                    <div className="px-4 py-2 rounded-lg bg-white border border-slate-200"><span className="text-slate-400 text-xs uppercase font-bold block">Siswa</span><span className="font-bold text-slate-800">{rows.length}</span></div>
                    <div className="px-4 py-2 rounded-lg bg-white border border-slate-200"><span className="text-slate-400 text-xs uppercase font-bold block">Berprestasi</span><span className="font-bold text-green-700">{totalSiswaBerprestasi}</span></div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" placeholder="Cari nama atau NISN..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="relative md:w-56">
                    <Filter size={16} className="absolute left-3 top-3 text-slate-400" />
                    <select className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                        <option value="">Semua Kelas</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="p-4">Nama Siswa</th>
                            <th className="p-4">Kelas</th>
                            <th className="p-4 text-center">Jumlah Prestasi</th>
                            <th className="p-4">Terakhir</th>
                            <th className="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.length === 0 && (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Tidak ada siswa yang cocok.</td></tr>
                        )}
                        {rows.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50">
                                <td className="p-4 font-bold text-slate-800">{r.name}</td>
                                <td className="p-4 text-slate-600">{r.class || '-'}</td>
                                <td className="p-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.achievementCount > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{r.achievementCount}</span>
                                </td>
                                <td className="p-4 text-slate-500">{r.lastDate ? formatIndoDate(r.lastDate) : '-'}</td>
                                <td className="p-4 text-center">
                                    <button onClick={() => setSelected(r)} className="px-3 py-1.5 bg-white border border-slate-300 hover:border-green-400 hover:text-green-700 rounded-lg text-xs font-bold flex items-center gap-1.5 mx-auto">
                                        <Printer size={14} /> Riwayat & Cetak
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PointHistoryModal
                reportKind="prestasi"
                isOpen={!!selected}
                onClose={() => setSelected(null)}
                student={selected}
                pointLogs={pointLogs}
                settings={settings}
                sanctionMode={sanctionMode}
                sanctionRules={sanctionRules}
                tataTertib={tataTertib}
            />
        </div>
    );
};

export default AchievementBook;
