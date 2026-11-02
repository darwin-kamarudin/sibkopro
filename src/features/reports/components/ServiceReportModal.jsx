import { ensureSignerNips } from '../../../common/utils/signers';
import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Printer, Download, X,
    RectangleVertical, RectangleHorizontal,
    Eye, EyeOff
} from 'lucide-react';
import { formatIndoDate } from '../../../common/utils/helpers';
import { getAcademicPeriod } from './ReportShared';
import { LAYANAN_TYPES } from '../../../common/utils/constants';
import { inRange, normalizeRange, rangeLabel, rangeFileTag, PeriodRangePicker } from './PeriodRange';

const KLASIKAL = 'Bimbingan Klasikal';

// ============================================================================
// MODAL LAPORAN PER JENIS LAYANAN
// Rentang bulan (dari - sampai) + jenis layanan. Untuk Bimbingan Klasikal
// tersedia filter kelas. Sumber data: journals (menu Input Layanan / Jurnal).
// ============================================================================
export const ServiceReportModal = ({
    isOpen, onClose, journals = [], rangeFrom, rangeTo,
    initialServiceType, settings
}) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [localFrom, setLocalFrom] = useState(rangeFrom);
    const [localTo, setLocalTo] = useState(rangeTo);
    const [localServiceType, setLocalServiceType] = useState(initialServiceType || LAYANAN_TYPES[0]);
    const [localClass, setLocalClass] = useState('');
    const [showLetterhead, setShowLetterhead] = useState(true);
    const [orientation, setOrientation] = useState('landscape');
    const [paperSize, setPaperSize] = useState('a4');
    const [privacyMode, setPrivacyMode] = useState(false);
    const [signOptions, setSignOptions] = useState({ counselor: true, principal: true });

    // Dependensi primitif agar tidak reset setiap render induk
    const fm = rangeFrom.month, fy = rangeFrom.year, tm = rangeTo.month, ty = rangeTo.year;

    useEffect(() => {
        if (isOpen) {
            setLocalFrom({ month: fm, year: fy });
            setLocalTo({ month: tm, year: ty });
            setLocalServiceType(initialServiceType || LAYANAN_TYPES[0]);
            setLocalClass('');
            setSignOptions({ counselor: true, principal: true });
        } else {
            setPreviewUrl(null);
        }
    }, [isOpen, fm, fy, tm, ty, initialServiceType]);

    const { from, to } = normalizeRange(localFrom, localTo);
    const isKlasikal = localServiceType === KLASIKAL;

    // Daftar kelas dari jurnal Bimbingan Klasikal
    const classOptions = useMemo(() => {
        const set = new Set();
        (journals || []).forEach(j => {
            if (j.serviceType === KLASIKAL && j.targetClass) set.add(String(j.targetClass).trim());
        });
        return [...set].sort();
    }, [journals]);

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => handlePreview(), 100);
        return () => clearTimeout(timer);
    }, [isOpen, fm, fy, tm, ty, localFrom, localTo, localServiceType, localClass, showLetterhead, orientation, paperSize, signOptions, privacyMode]);

    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    const { semester, academicYear } = getAcademicPeriod(from.month, from.year);
    const periodText = rangeLabel(from, to);

    // Filter: jenis layanan + rentang bulan + (kelas bila klasikal)
    const dataLogs = useMemo(() => {
        return (journals || [])
            .filter(j => {
                if (j.serviceType !== localServiceType) return false;
                if (!inRange(j.date, from, to)) return false;
                if (isKlasikal && localClass && String(j.targetClass || '').trim() !== localClass) return false;
                return true;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [journals, from.month, from.year, to.month, to.year, localServiceType, localClass]);

    // Rekap: jumlah sesi dan jumlah siswa unik yang dilayani
    const rekap = useMemo(() => {
        const siswa = new Set();
        dataLogs.forEach(j => {
            const names = j.studentNames?.length ? j.studentNames : [j.studentName].filter(Boolean);
            names.forEach(n => siswa.add(n));
        });
        return { sesi: dataLogs.length, siswa: siswa.size };
    }, [dataLogs]);

    const maskName = (name) => {
        if (!privacyMode || !name) return name;
        return name.split(' ').map(w => (w[0] || '') + '*'.repeat(Math.max(w.length - 1, 2))).join(' ');
    };

    const createPDFDoc = () => {
        const format = paperSize === 'f4' ? [215, 330] : 'a4';
        const doc = new jsPDF({ orientation, unit: 'mm', format });
        doc.setFont('helvetica', 'normal');
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        let currentY = 12;
        if (showLetterhead) {
            doc.setFontSize(12);
            doc.text((settings?.government || 'PEMERINTAH DAERAH').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 6;
            doc.text((settings?.department || 'DINAS PENDIDIKAN').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 7;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
            doc.text((settings?.name || 'NAMA SEKOLAH ANDA').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 6;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
            doc.text(settings?.address || 'Alamat Sekolah...', centerX, currentY, { align: 'center' });
            if (settings?.address2) { currentY += 5; doc.setFont('helvetica', 'italic'); doc.text(settings.address2, centerX, currentY, { align: 'center' }); }
            const logoY = 12; const logoSize = 24; const logoMargin = orientation === 'landscape' ? 20 : 12;
            if (settings?.logo) try { doc.addImage(settings.logo, 'PNG', logoMargin, logoY, logoSize, logoSize); } catch (e) {}
            if (settings?.logo2) try { doc.addImage(settings.logo2, 'PNG', pageWidth - logoMargin - logoSize, logoY, logoSize, logoSize); } catch (e) {}
            currentY += 6; doc.setLineWidth(0.5); doc.line(10, currentY, pageWidth - 10, currentY); doc.setLineWidth(0.1); currentY += 10;
        } else {
            currentY = 20;
        }

        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text(`LAPORAN LAYANAN: ${localServiceType.toUpperCase()}`, centerX, currentY, { align: 'center' });
        doc.line(centerX - 50, currentY + 1, centerX + 50, currentY + 1);
        currentY += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        const kelasText = isKlasikal && localClass ? ` | Kelas: ${localClass}` : '';
        doc.text(`Periode: ${periodText}${kelasText} | Semester: ${semester} ${academicYear}`, centerX, currentY, { align: 'center' });

        currentY += 8;
        const tableBody = dataLogs.length > 0
            ? dataLogs.map((j, i) => [
                i + 1,
                `${formatIndoDate(j.date)}\n(Jam ke-${j.time || '-'})`,
                maskName((j.studentNames?.join(', ')) || j.studentName || '-') + (j.targetClass ? `\n(Kelas: ${j.targetClass})` : ''),
                `${j.description || '-'}\n(Bidang: ${j.skkpd || '-'})`,
                `Proses: ${j.processEval || '-'}\nHasil: ${j.resultEval || '-'}`,
                j.followUp || '-'
            ])
            : [['-', '-', '-', `Belum ada data layanan "${localServiceType}" pada periode ini.`, '-', '-']];

        const colStyles = orientation === 'landscape'
            ? { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 30, halign: 'center' }, 2: { cellWidth: 40 }, 3: { cellWidth: 'auto' }, 4: { cellWidth: 75 }, 5: { cellWidth: 35 } }
            : { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 30 }, 3: { cellWidth: 'auto' }, 4: { cellWidth: 45 }, 5: { cellWidth: 25 } };

        autoTable(doc, {
            startY: currentY,
            head: [['No', 'Hari/Tgl', 'Siswa / Kelas', 'Topik / Materi', 'Evaluasi (Proses & Hasil)', 'Tindak Lanjut']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0, 0, 0], fontSize: 9 },
            styles: { fontSize: 9, valign: 'top', lineWidth: 0.1, lineColor: [0, 0, 0], cellPadding: 2 },
            columnStyles: colStyles,
            margin: { left: 14, right: 14 }
        });

        let finalY = doc.lastAutoTable.finalY + 8;
        if (finalY > doc.internal.pageSize.getHeight() - 70) { doc.addPage(); finalY = 20; }

        doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
        doc.text('Rekapitulasi:', 14, finalY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Jumlah sesi layanan: ${rekap.sesi}`, 14, finalY + 5);
        doc.text(`Jumlah siswa yang dilayani: ${rekap.siswa}`, 14, finalY + 10);
        finalY += 20;

        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const city = settings?.city || 'Tempat';
        doc.setFontSize(11);
        const leftX = 50; const rightX = pageWidth - 50;

        const renderSigBlock = (title, name, nip, xPos, isRightSide) => {
            if (isRightSide) doc.text(`${city}, ${dateStr}`, xPos, finalY, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.text(title, xPos, finalY + 5, { align: 'center' });
            doc.setFont('helvetica', 'bold');
            doc.text(name, xPos, finalY + 30, { align: 'center' });
            const nameWidth = doc.getTextWidth(name);
            doc.setLineWidth(0.3); doc.line(xPos - (nameWidth / 2) - 2, finalY + 31, xPos + (nameWidth / 2) + 2, finalY + 31);
            doc.setFont('helvetica', 'normal');
            if (nip && nip !== '-') doc.text(`NIP. ${nip}`, xPos, finalY + 36, { align: 'center' });
        };

        const p_counselor = { title: 'Guru BK / Konselor', name: settings?.counselor || '(................)', nip: settings?.nipCounselor };
        const p_head = { title: 'Kepala Sekolah', name: settings?.headmaster || '(................)', nip: settings?.nipHeadmaster };

        if (signOptions.principal) {
            doc.text('Mengetahui,', leftX, finalY, { align: 'center' });
            renderSigBlock(p_head.title, p_head.name, p_head.nip, leftX, false);
        }
        if (signOptions.counselor) {
            renderSigBlock(p_counselor.title, p_counselor.name, p_counselor.nip, rightX, true);
        }
        return doc;
    };

    const handlePreview = () => {
        try {
            const doc = createPDFDoc();
            setPreviewUrl(URL.createObjectURL(doc.output('blob')));
        } catch (e) { console.error(e); }
    };

    const handleDownload = () => {
        if (!ensureSignerNips(settings, signOptions)) return;
        try {
            const doc = createPDFDoc();
            const safe = localServiceType.replace(/[^a-zA-Z0-9]+/g, '_');
            doc.save(`Layanan_${safe}_${rangeFileTag(from, to)}.pdf`);
        } catch (e) { alert(e.message); }
    };

    const toggleSign = (key) => setSignOptions(p => ({ ...p, [key]: !p[key] }));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-white border-b px-4 py-3 flex flex-col lg:flex-row justify-between items-center gap-4 flex-shrink-0 shadow-sm relative z-10">
                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Printer size={20} /></div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 leading-tight">Cetak Laporan Layanan</h2>
                            <p className="text-xs text-slate-500">{localServiceType} · {periodText}{isKlasikal && localClass ? ` · ${localClass}` : ''}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                </div>

                <div className="w-full lg:w-auto overflow-x-auto">
                    <div className="flex items-center gap-3 min-w-max mx-auto lg:mx-0 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        <select className="bg-white text-xs font-bold text-slate-700 py-1.5 px-2 rounded border border-slate-200 outline-none cursor-pointer max-w-[220px]" value={localServiceType} onChange={e => { setLocalServiceType(e.target.value); setLocalClass(''); }}>
                            {LAYANAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {isKlasikal && (
                            <select className="bg-white text-xs font-bold text-slate-700 py-1.5 px-2 rounded border border-slate-200 outline-none cursor-pointer" value={localClass} onChange={e => setLocalClass(e.target.value)}>
                                <option value="">Semua Kelas</option>
                                {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        )}
                        <PeriodRangePicker
                            compact
                            from={localFrom}
                            to={localTo}
                            onChange={({ from: f, to: t }) => { setLocalFrom(f); setLocalTo(t); }}
                        />
                        <div className="flex bg-white rounded border border-slate-200 p-0.5">
                            <button onClick={() => setPaperSize('a4')} className={`px-3 py-1.5 text-xs font-bold rounded ${paperSize === 'a4' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>A4</button>
                            <button onClick={() => setPaperSize('f4')} className={`px-3 py-1.5 text-xs font-bold rounded ${paperSize === 'f4' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>F4</button>
                        </div>
                        <div className="flex bg-white rounded border border-slate-200 p-0.5">
                            <button onClick={() => setOrientation('portrait')} className={`p-1.5 rounded ${orientation === 'portrait' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`} title="Portrait"><RectangleVertical size={16} /></button>
                            <button onClick={() => setOrientation('landscape')} className={`p-1.5 rounded ${orientation === 'landscape' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`} title="Landscape"><RectangleHorizontal size={16} /></button>
                        </div>
                        <button onClick={() => setPrivacyMode(!privacyMode)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-bold ${privacyMode ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                            {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />} {privacyMode ? 'Privasi On' : 'Privasi Off'}
                        </button>
                        <div className="flex items-center gap-4 px-2">
                            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"><input type="checkbox" checked={showLetterhead} onChange={() => setShowLetterhead(!showLetterhead)} className="accent-blue-600 w-4 h-4" /> Kop</label>
                            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"><input type="checkbox" checked={signOptions.counselor} onChange={() => toggleSign('counselor')} className="accent-blue-600 w-4 h-4" /> Guru BK</label>
                            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"><input type="checkbox" checked={signOptions.principal} onChange={() => toggleSign('principal')} className="accent-blue-600 w-4 h-4" /> Kepsek</label>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold">Tutup</button>
                    <button onClick={handleDownload} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md"><Download size={16} /> Download PDF</button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-200 relative flex flex-col items-center">
                {previewUrl ? (
                    <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 font-bold animate-pulse flex-col gap-2">
                        <Printer size={32} className="opacity-50" /><span>Memproses PDF...</span>
                    </div>
                )}
                <div className="lg:hidden absolute bottom-6 right-6">
                    <button onClick={handleDownload} className="p-4 bg-blue-600 text-white rounded-full shadow-xl"><Download size={24} /></button>
                </div>
            </div>
        </div>
    );
};

export default ServiceReportModal;
