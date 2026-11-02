import React, { useState, useRef } from 'react';
import { Plus, Trash2, Download, FileUp, Gavel, Trophy, AlertTriangle, ListOrdered } from 'lucide-react';
import * as XLSX from 'xlsx';
import { normalizeKategori, KATEGORI_LABEL } from '../../common/utils/tataTertib';

const SUB_TABS = [
    { id: 'pasal', label: 'Pasal Pelanggaran', icon: AlertTriangle },
    { id: 'prestasi', label: 'Prestasi', icon: Trophy },
    { id: 'sp', label: 'Ambang SP', icon: ListOrdered },
];

const emptyPasal = { butir: '', kategori: 'ringan', uraian: '' };
const emptyPrestasi = { kode: '', bidang: '', kriteria: '', sertifikat: '', waktu: '', penanggung: '' };
const emptySp = { level: 'SP1', ringan: 0, sedang: 0, berat: 0, tindakan: '' };

const TataTertibSettings = ({ tataTertib, sanctionMode, onSaveMode, onSaveTataTertib }) => {
    const [sub, setSub] = useState('pasal');
    const [selected, setSelected] = useState([]);
    const [formPasal, setFormPasal] = useState(emptyPasal);
    const [formPrestasi, setFormPrestasi] = useState(emptyPrestasi);
    const [formSp, setFormSp] = useState(emptySp);
    const fileRef = useRef(null);

    const pasal = tataTertib?.pasal || [];
    const prestasi = tataTertib?.prestasi || [];
    const spRules = tataTertib?.spRules || [];

    const saveAll = (next) => onSaveTataTertib({ pasal, prestasi, spRules, ...next });

    // ---------- Tambah manual ----------
    const addPasal = () => {
        if (!formPasal.butir || !formPasal.uraian) return alert('Butir dan uraian wajib diisi');
        const item = { ...formPasal, butir: String(formPasal.butir).trim(), id: `p-${Date.now()}` };
        saveAll({ pasal: [...pasal, item] });
        setFormPasal(emptyPasal);
    };
    const addPrestasi = () => {
        if (!formPrestasi.kriteria) return alert('Kriteria wajib diisi');
        const item = { ...formPrestasi, kode: formPrestasi.kode || `PR${prestasi.length + 1}`, id: `r-${Date.now()}` };
        saveAll({ prestasi: [...prestasi, item] });
        setFormPrestasi(emptyPrestasi);
    };
    const addSp = () => {
        if (!formSp.level) return alert('Level SP wajib diisi');
        const item = {
            ...formSp,
            ringan: Number(formSp.ringan) || 0,
            sedang: Number(formSp.sedang) || 0,
            berat: Number(formSp.berat) || 0,
            id: `s-${Date.now()}`
        };
        const next = [...spRules, item].sort((a, b) => a.level.localeCompare(b.level, undefined, { numeric: true }));
        saveAll({ spRules: next });
        setFormSp(emptySp);
    };

    // ---------- Hapus ----------
    const removeSelected = () => {
        if (!selected.length) return;
        if (!confirm(`Hapus ${selected.length} data terpilih?`)) return;
        if (sub === 'pasal') saveAll({ pasal: pasal.filter(i => !selected.includes(i.id)) });
        if (sub === 'prestasi') saveAll({ prestasi: prestasi.filter(i => !selected.includes(i.id)) });
        if (sub === 'sp') saveAll({ spRules: spRules.filter(i => !selected.includes(i.id)) });
        setSelected([]);
    };

    // ---------- Template ----------
    const downloadTemplate = () => {
        // Semua template disimpan sebagai file Excel, bukan di dalam kode
        const files = {
            pasal: 'Template_Pasal_Pelanggaran.xlsx',
            prestasi: 'Template_Prestasi.xlsx',
            sp: 'Template_Ambang_SP.xlsx',
        };
        const a = document.createElement('a');
        a.href = `/templates/${files[sub]}`;
        a.download = files[sub];
        a.click();
        return;
    };

    // ---------- Import ----------
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                const stamp = Date.now();
                if (sub === 'pasal') {
                    const items = rows.map((r, i) => {
                        const kategori = normalizeKategori(r.kategori);
                        return { id: `pi-${stamp}-${i}`, butir: String(r.butir || '').trim(), kategori, uraian: String(r.uraian || '') };
                    }).filter(x => x.butir && x.kategori);
                    const bad = rows.length - items.length;
                    saveAll({ pasal: [...pasal, ...items] });
                    alert(`Berhasil mengimpor ${items.length} pasal.${bad ? ` ${bad} baris dilewati (butir/kategori tidak valid).` : ''}`);
                } else if (sub === 'prestasi') {
                    const items = rows.map((r, i) => ({
                        id: `ri-${stamp}-${i}`, kode: String(r.kode || `PR${i + 1}`), bidang: String(r.bidang || ''),
                        kriteria: String(r.kriteria || ''), sertifikat: String(r.sertifikat || ''),
                        waktu: String(r.waktu || ''), penanggung: String(r.penanggung || '')
                    })).filter(x => x.kriteria);
                    saveAll({ prestasi: [...prestasi, ...items] });
                    alert(`Berhasil mengimpor ${items.length} prestasi.`);
                } else {
                    const items = rows.map((r, i) => ({
                        id: `si-${stamp}-${i}`, level: String(r.level || '').toUpperCase(),
                        ringan: Number(r.ringan) || 0, sedang: Number(r.sedang) || 0, berat: Number(r.berat) || 0,
                        tindakan: String(r.tindakan || '')
                    })).filter(x => x.level);
                    const merged = [...spRules, ...items].sort((a, b) => a.level.localeCompare(b.level, undefined, { numeric: true }));
                    saveAll({ spRules: merged });
                    alert(`Berhasil mengimpor ${items.length} ambang SP.`);
                }
            } catch (err) {
                alert('Gagal membaca file: ' + err.message);
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = null;
    };

    const toggleSelect = (id) =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const currentList = sub === 'pasal' ? pasal : sub === 'prestasi' ? prestasi : spRules;

    return (
        <div className="space-y-6">
            {/* MODE SANKSI */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Mode Sanksi Sekolah</div>
                <div className="flex flex-col md:flex-row gap-3">
                    {[
                        { id: 'poin', label: 'Berbasis Poin', desc: 'Sanksi dihitung dari total poin pelanggaran (perilaku lama).' },
                        { id: 'pasal', label: 'Berbasis Pasal', desc: 'Pelanggaran dicatat per butir pasal; kategori dan rekomendasi SP mengikuti tata tertib.' },
                    ].map(m => (
                        <button key={m.id} onClick={() => sanctionMode !== m.id && onSaveMode(m.id)}
                            className={`flex-1 text-left p-3 rounded-lg border transition-all ${sanctionMode === m.id ? 'bg-white border-blue-400 ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <div className="font-bold text-sm text-slate-800">{sanctionMode === m.id ? '● ' : '○ '}{m.label}</div>
                            <div className="text-xs text-slate-500 mt-1">{m.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* SUB TAB */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                {SUB_TABS.map(t => (
                    <button key={t.id} onClick={() => { setSub(t.id); setSelected([]); }}
                        className={`px-3 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${sub === t.id ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                        <t.icon size={15} /> {t.label}
                    </button>
                ))}
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-wrap gap-2 justify-between items-center">
                <p className="text-xs text-slate-500">
                    {sub === 'pasal' && 'Daftar butir pasal pelanggaran. Kategori menentukan alur penanganan dan akumulasi.'}
                    {sub === 'prestasi' && 'Daftar kriteria prestasi sesuai Pasal 18 tata tertib.'}
                    {sub === 'sp' && 'Ambang Surat Peringatan. Isi 0 jika ambang tidak dipakai. Sistem hanya merekomendasikan.'}
                </p>
                <div className="flex gap-2">
                    <button onClick={downloadTemplate} className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1"><Download size={14} /> Template</button>
                    <button onClick={() => fileRef.current?.click()} className="px-3 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"><FileUp size={14} /> Import Excel</button>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
                    {selected.length > 0 && (
                        <button onClick={removeSelected} className="px-3 py-2 text-xs font-bold bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center gap-1"><Trash2 size={14} /> Hapus ({selected.length})</button>
                    )}
                </div>
            </div>

            {/* FORM TAMBAH */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
                {sub === 'pasal' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                        <div className="md:col-span-2"><label className="text-[10px] font-bold uppercase text-slate-500">Butir</label>
                            <input className="w-full p-2 border rounded text-sm" placeholder="13.1" value={formPasal.butir} onChange={e => setFormPasal({ ...formPasal, butir: e.target.value })} /></div>
                        <div className="md:col-span-2"><label className="text-[10px] font-bold uppercase text-slate-500">Kategori</label>
                            <select className="w-full p-2 border rounded text-sm" value={formPasal.kategori} onChange={e => setFormPasal({ ...formPasal, kategori: e.target.value })}>
                                <option value="ringan">Ringan</option><option value="sedang">Sedang</option><option value="berat">Berat</option>
                            </select></div>
                        <div className="md:col-span-7"><label className="text-[10px] font-bold uppercase text-slate-500">Uraian pelanggaran</label>
                            <input className="w-full p-2 border rounded text-sm" value={formPasal.uraian} onChange={e => setFormPasal({ ...formPasal, uraian: e.target.value })} /></div>
                        <div className="md:col-span-1"><button onClick={addPasal} className="w-full bg-green-500 text-white rounded p-2 hover:bg-green-600"><Plus size={16} className="mx-auto" /></button></div>
                    </div>
                )}
                {sub === 'prestasi' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                        <div className="md:col-span-2"><label className="text-[10px] font-bold uppercase text-slate-500">Kode</label>
                            <input className="w-full p-2 border rounded text-sm" value={formPrestasi.kode} onChange={e => setFormPrestasi({ ...formPrestasi, kode: e.target.value })} /></div>
                        <div className="md:col-span-2"><label className="text-[10px] font-bold uppercase text-slate-500">Bidang</label>
                            <input className="w-full p-2 border rounded text-sm" value={formPrestasi.bidang} onChange={e => setFormPrestasi({ ...formPrestasi, bidang: e.target.value })} /></div>
                        <div className="md:col-span-4"><label className="text-[10px] font-bold uppercase text-slate-500">Kriteria</label>
                            <input className="w-full p-2 border rounded text-sm" value={formPrestasi.kriteria} onChange={e => setFormPrestasi({ ...formPrestasi, kriteria: e.target.value })} /></div>
                        <div className="md:col-span-3"><label className="text-[10px] font-bold uppercase text-slate-500">Sertifikat</label>
                            <input className="w-full p-2 border rounded text-sm" value={formPrestasi.sertifikat} onChange={e => setFormPrestasi({ ...formPrestasi, sertifikat: e.target.value })} /></div>
                        <div className="md:col-span-1"><button onClick={addPrestasi} className="w-full bg-green-500 text-white rounded p-2 hover:bg-green-600"><Plus size={16} className="mx-auto" /></button></div>
                    </div>
                )}
                {sub === 'sp' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                        <div className="md:col-span-1"><label className="text-[10px] font-bold uppercase text-slate-500">Level</label>
                            <input className="w-full p-2 border rounded text-sm" value={formSp.level} onChange={e => setFormSp({ ...formSp, level: e.target.value.toUpperCase() })} /></div>
                        <div className="md:col-span-1"><label className="text-[10px] font-bold uppercase text-slate-500">Ringan</label>
                            <input type="number" className="w-full p-2 border rounded text-sm" value={formSp.ringan} onChange={e => setFormSp({ ...formSp, ringan: e.target.value })} /></div>
                        <div className="md:col-span-1"><label className="text-[10px] font-bold uppercase text-slate-500">Sedang</label>
                            <input type="number" className="w-full p-2 border rounded text-sm" value={formSp.sedang} onChange={e => setFormSp({ ...formSp, sedang: e.target.value })} /></div>
                        <div className="md:col-span-1"><label className="text-[10px] font-bold uppercase text-slate-500">Berat</label>
                            <input type="number" className="w-full p-2 border rounded text-sm" value={formSp.berat} onChange={e => setFormSp({ ...formSp, berat: e.target.value })} /></div>
                        <div className="md:col-span-7"><label className="text-[10px] font-bold uppercase text-slate-500">Tindakan</label>
                            <input className="w-full p-2 border rounded text-sm" value={formSp.tindakan} onChange={e => setFormSp({ ...formSp, tindakan: e.target.value })} /></div>
                        <div className="md:col-span-1"><button onClick={addSp} className="w-full bg-green-500 text-white rounded p-2 hover:bg-green-600"><Plus size={16} className="mx-auto" /></button></div>
                    </div>
                )}
            </div>

            {/* DAFTAR */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                            <th className="p-3 w-10"><input type="checkbox" checked={currentList.length > 0 && selected.length === currentList.length}
                                onChange={e => setSelected(e.target.checked ? currentList.map(i => i.id) : [])} /></th>
                            {sub === 'pasal' && <><th className="p-3">Butir</th><th className="p-3">Kategori</th><th className="p-3">Uraian</th></>}
                            {sub === 'prestasi' && <><th className="p-3">Kode</th><th className="p-3">Bidang</th><th className="p-3">Kriteria</th><th className="p-3">Sertifikat</th></>}
                            {sub === 'sp' && <><th className="p-3">Level</th><th className="p-3">Ringan</th><th className="p-3">Sedang</th><th className="p-3">Berat</th><th className="p-3">Tindakan</th></>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentList.length === 0 && (
                            <tr><td colSpan="6" className="p-6 text-center text-slate-400 italic">Belum ada data. Tambah manual atau import Excel.</td></tr>
                        )}
                        {sub === 'pasal' && pasal.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="p-3"><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                                <td className="p-3 font-mono font-bold">{p.butir}</td>
                                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${p.kategori === 'berat' ? 'bg-red-100 text-red-700' : p.kategori === 'sedang' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{KATEGORI_LABEL[p.kategori]}</span></td>
                                <td className="p-3">{p.uraian}</td>
                            </tr>
                        ))}
                        {sub === 'prestasi' && prestasi.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="p-3"><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                                <td className="p-3 font-mono">{p.kode}</td>
                                <td className="p-3">{p.bidang}</td>
                                <td className="p-3 font-bold">{p.kriteria}</td>
                                <td className="p-3 text-slate-500">{p.sertifikat}</td>
                            </tr>
                        ))}
                        {sub === 'sp' && spRules.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50">
                                <td className="p-3"><input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} /></td>
                                <td className="p-3 font-bold">{s.level}</td>
                                <td className="p-3">{s.ringan}</td>
                                <td className="p-3">{s.sedang}</td>
                                <td className="p-3">{s.berat}</td>
                                <td className="p-3 text-slate-600">{s.tindakan}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TataTertibSettings;
