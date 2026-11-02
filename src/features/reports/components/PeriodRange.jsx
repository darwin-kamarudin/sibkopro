import React from 'react';
import { Calendar } from 'lucide-react';
import { MONTH_NAMES } from './ReportShared';

// Periode dinyatakan sebagai { month: 0-11, year: 2026 }

// Apakah tanggal berada dalam rentang [from .. to] (ikut seluruh bulan)
export const inRange = (date, from, to) => {
    const d = new Date(date);
    if (isNaN(d)) return false;
    const start = new Date(from.year, from.month, 1);
    const end = new Date(to.year, to.month + 1, 0, 23, 59, 59, 999);
    return d >= start && d <= end;
};

// Urutan bulan ke bilangan (untuk validasi rentang)
const ordinal = (p) => p.year * 12 + p.month;

// Rentang dibalik otomatis jika "dari" lebih besar dari "sampai"
export const normalizeRange = (from, to) =>
    ordinal(from) <= ordinal(to) ? { from, to } : { from: to, to: from };

// Label rentang untuk judul dan dokumen, mis. "Januari 2026 – Maret 2026"
export const rangeLabel = (from, to) => {
    const a = `${MONTH_NAMES[from.month]} ${from.year}`;
    const b = `${MONTH_NAMES[to.month]} ${to.year}`;
    return a === b ? a : `${a} – ${b}`;
};

// Nama berkas aman dari label rentang
export const rangeFileTag = (from, to) =>
    rangeLabel(from, to).replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');

export const yearOptionsList = () => {
    const curr = new Date().getFullYear();
    const years = [];
    for (let y = curr - 5; y <= curr + 2; y++) years.push(y);
    return years;
};

// Pemilih rentang: Dari [bulan][tahun]  s/d  [bulan][tahun]
export const PeriodRangePicker = ({ from, to, onChange, compact = false }) => {
    const years = yearOptionsList();
    const selectClass = compact
        ? 'bg-transparent text-xs font-bold text-slate-700 py-1.5 px-1 outline-none cursor-pointer hover:bg-slate-50 rounded'
        : 'w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500';

    const set = (which, field, value) => {
        const next = which === 'from'
            ? { from: { ...from, [field]: value }, to }
            : { from, to: { ...to, [field]: value } };
        onChange(normalizeRange(next.from, next.to));
    };

    const monthSel = (which, p) => (
        <select className={selectClass} value={p.month} onChange={e => set(which, 'month', parseInt(e.target.value))}>
            {MONTH_NAMES.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
        </select>
    );
    const yearSel = (which, p) => (
        <select className={selectClass} value={p.year} onChange={e => set(which, 'year', parseInt(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
    );

    if (compact) {
        return (
            <div className="flex items-center gap-1 bg-white rounded border border-slate-200 p-0.5">
                <div className="flex items-center px-1 text-slate-400"><Calendar size={14} /></div>
                {monthSel('from', from)}{yearSel('from', from)}
                <span className="text-[10px] font-bold text-slate-400 px-1">s/d</span>
                {monthSel('to', to)}{yearSel('to', to)}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Dari Bulan</label>
                <div className="grid grid-cols-2 gap-2">{monthSel('from', from)}{yearSel('from', from)}</div>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Sampai Bulan</label>
                <div className="grid grid-cols-2 gap-2">{monthSel('to', to)}{yearSel('to', to)}</div>
            </div>
        </div>
    );
};

export default PeriodRangePicker;
