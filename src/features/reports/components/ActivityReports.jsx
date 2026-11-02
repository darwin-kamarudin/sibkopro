import { ensureSignerNips } from '../../../common/utils/signers';
import { inRange, normalizeRange, rangeLabel, rangeFileTag, PeriodRangePicker } from './PeriodRange';
import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    Printer, Download, X, 
    RectangleVertical, RectangleHorizontal, 
    Calendar, Eye, EyeOff, Save, Users, Filter, FileCheck
} from 'lucide-react';
import { formatIndoDate } from '../../../common/utils/helpers';
import { PrintPreviewModal, MONTH_NAMES, getAcademicPeriod, KopSurat, SignatureSection } from './ReportShared';

// ============================================================================
// 1. MODAL LAPORAN JURNAL (VERSI FINAL - BK & KEPSEK)
// ============================================================================
export const JournalReportModal = ({ isOpen, onClose, journals = [], rangeFrom, rangeTo, settings }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [localFrom, setLocalFrom] = useState(rangeFrom);
    const [localTo, setLocalTo] = useState(rangeTo);
    const [showLetterhead, setShowLetterhead] = useState(true);
    const [orientation, setOrientation] = useState('portrait'); 
    const [paperSize, setPaperSize] = useState('a4'); 
    const [privacyMode, setPrivacyMode] = useState(false);
    
    const [signOptions, setSignOptions] = useState({ counselor: true, principal: true });

    // Dependensi primitif agar tidak reset setiap render induk
    const fm = rangeFrom.month, fy = rangeFrom.year, tm = rangeTo.month, ty = rangeTo.year;
    useEffect(() => {
        if (isOpen) {
            setLocalFrom({ month: fm, year: fy });
            setLocalTo({ month: tm, year: ty });
            setSignOptions({ counselor: true, principal: true });
            setPrivacyMode(false);
        } else {
            setPreviewUrl(null);
        }
    }, [isOpen, fm, fy, tm, ty]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => handlePreview(), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, localFrom, localTo, showLetterhead, orientation, paperSize, signOptions, privacyMode]);

    useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

    const { from, to } = normalizeRange(localFrom, localTo);
    const { semester, academicYear } = getAcademicPeriod(from.month, from.year);
    const periodText = rangeLabel(from, to);
    
    const dataLogs = journals.filter(j => inRange(j.date, from, to)).sort((a,b) => new Date(a.date) - new Date(b.date));

    const yearOptions = useMemo(() => {
        const currYear = new Date().getFullYear();
        const years = [];
        for (let y = currYear - 5; y <= currYear + 2; y++) years.push(y);
        return years;
    }, []);

    const createPDFDoc = () => {
        const format = paperSize === 'f4' ? [215, 330] : 'a4';
        const doc = new jsPDF({ orientation, unit: 'mm', format });
        doc.setFont('helvetica', 'normal');
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        let currentY = 12;
        if (showLetterhead) {
            doc.setFontSize(12);
            doc.text((settings?.government || 'PEMERINTAH PROVINSI ...').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 6;
            doc.text((settings?.department || 'DINAS PENDIDIKAN').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 7;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
            doc.text((settings?.name || 'NAMA SEKOLAH ANDA').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 6;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
            doc.text(settings?.address || 'Alamat Sekolah...', centerX, currentY, { align: 'center' });
            if (settings?.address2) { currentY += 5; doc.setFont('helvetica', 'italic'); doc.text(settings?.address2, centerX, currentY, { align: 'center' }); }
            const logoY = 12; const logoSize = 24; const logoMargin = orientation === 'landscape' ? 20 : 12;
            if (settings?.logo) try { doc.addImage(settings.logo, 'PNG', logoMargin, logoY, logoSize, logoSize); } catch(e){}
            if (settings?.logo2) try { doc.addImage(settings.logo2, 'PNG', pageWidth - logoMargin - logoSize, logoY, logoSize, logoSize); } catch(e){}
            currentY += 6; doc.setLineWidth(0.5); doc.line(10, currentY, pageWidth - 10, currentY); doc.setLineWidth(0.1); currentY += 10;
        } else { currentY = 20; }

        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text('JURNAL KEGIATAN BIMBINGAN DAN KONSELING', centerX, currentY, { align: 'center' });
        doc.line(centerX - 45, currentY + 1, centerX + 45, currentY + 1);
        currentY += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Periode: ${periodText}  |  Semester: ${semester} ${academicYear}`, centerX, currentY, { align: 'center' });

        currentY += 8;
        const tableBody = dataLogs.length > 0 ? dataLogs.map((j, i) => {
            const isPrivateService = j.isPrivate || (j.serviceType && (String(j.serviceType).toLowerCase().includes('pribadi') || String(j.serviceType).toLowerCase().includes('individual')));
            const shouldMask = privacyMode && isPrivateService;
            const descriptionContent = shouldMask ? '--- LAYANAN BERSIFAT PRIVASI ---' : `${j.description || '-'}\n${j.technique ? `(Teknik: ${j.technique})` : ''}`;
            const resultContent = shouldMask ? '---' : `${j.resultEval || j.result || '-'}\n(TL: ${j.followUp || '-'})`;
            return [i + 1, formatIndoDate(j.date), j.studentNames?.join(', ') || j.studentName || '-', j.serviceType || '-', descriptionContent, resultContent];
        }) : [['-', '-', '-', 'Belum ada data jurnal.', '-', '-']];

        autoTable(doc, {
            startY: currentY,
            head: [['No', 'Hari/Tgl', 'Sasaran', 'Layanan', 'Kegiatan / Masalah', 'Hasil / TL']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold', halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0,0,0], fontSize: 9 },
            styles: { fontSize: 9, valign: 'top', lineWidth: 0.1, lineColor: [0,0,0], cellPadding: 2 },
            columnStyles: { 0: {cellWidth: 10, halign: 'center'}, 1: {cellWidth: 28}, 2: {cellWidth: 35}, 3: {cellWidth: 30}, 4: {cellWidth: 'auto'}, 5: {cellWidth: 40} },
            didParseCell: function(data) {
                if (data.section === 'body' && (data.column.index === 4 || data.column.index === 5)) {
                    if (data.cell.raw === '--- LAYANAN BERSIFAT PRIVASI ---' || data.cell.raw === '---') {
                        data.cell.styles.fontStyle = 'italic';
                        data.cell.styles.textColor = [100, 100, 100];
                    }
                }
            },
            margin: { left: 14, right: 14 }
        });

        let finalY = doc.lastAutoTable.finalY + 10;
        if (finalY > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); finalY = 20; }
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const city = settings?.city || 'Tempat';
        doc.setFontSize(11); doc.setFont('helvetica', 'normal');
        const leftX = 50; const rightX = pageWidth - 50;
        
        const renderSigBlock = (title, name, nip, xPos, isRightSide) => {
            if (isRightSide) doc.text(`${city}, ${dateStr}`, xPos, finalY, { align: 'center' });
            doc.text(title, xPos, finalY + 5, { align: 'center' });
            doc.setFont('helvetica', 'bold');
            doc.text(name, xPos, finalY + 30, { align: 'center' });
            const nameWidth = doc.getTextWidth(name);
            doc.setLineWidth(0.3); doc.line(xPos - (nameWidth/2) - 2, finalY + 31, xPos + (nameWidth/2) + 2, finalY + 31);
            doc.setFont('helvetica', 'normal');
            if(nip && nip !== '-') doc.text(`NIP. ${nip}`, xPos, finalY + 36, { align: 'center' });
        };

        const p_counselor = { title: 'Guru BK / Konselor', name: settings?.counselor || '(................)', nip: settings?.nipCounselor };
        const p_head = { title: 'Kepala Sekolah', name: settings?.headmaster || '(................)', nip: settings?.nipHeadmaster };
        let row1_Left = null, row1_Right = null;
        if (signOptions.principal && signOptions.counselor) { row1_Left = p_head; row1_Right = p_counselor; }
        else if (signOptions.counselor) { row1_Right = p_counselor; }
        else if (signOptions.principal) { row1_Right = p_head; }

        if (row1_Left) { if (row1_Left === p_head) doc.text("Mengetahui,", leftX, finalY, { align: 'center' }); renderSigBlock(row1_Left.title, row1_Left.name, row1_Left.nip, leftX, false); }
        if (row1_Right) { renderSigBlock(row1_Right.title, row1_Right.name, row1_Right.nip, rightX, true); }
        return doc;
    };

    const handlePreview = () => { try { const doc = createPDFDoc(); setPreviewUrl(URL.createObjectURL(doc.output('blob'))); } catch (e) { console.error(e); } };
    const handleDownload = () => {
        if (!ensureSignerNips(settings, signOptions)) return; try { const doc = createPDFDoc(); doc.save(`Jurnal_BK_${rangeFileTag(from, to)}.pdf`); } catch (e) { alert(e.message); } };
    const toggleSign = (key) => { setSignOptions(p => ({ ...p, [key]: !p[key] })); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-white border-b px-4 py-3 flex flex-col lg:flex-row justify-between items-center gap-4 flex-shrink-0 shadow-sm relative z-10">
                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Printer size={20}/></div>
                        <div><h2 className="text-lg font-bold text-slate-800 leading-tight">Cetak Jurnal</h2><p className="text-xs text-slate-500">{periodText}</p></div>
                    </div>
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={24}/></button>
                </div>
                <div className="w-full lg:w-auto overflow-x-auto hide-scrollbar">
                    <div className="flex items-center gap-3 min-w-max mx-auto lg:mx-0 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        <PeriodRangePicker compact from={localFrom} to={localTo} onChange={({ from: f, to: t }) => { setLocalFrom(f); setLocalTo(t); }} />
                        <div className="w-px h-6 bg-slate-300"></div>
                        <div className="flex bg-white rounded border border-slate-200 p-0.5"><button onClick={() => setPaperSize('a4')} className={`px-3 py-1.5 text-xs font-bold rounded ${paperSize === 'a4' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>A4</button><button onClick={() => setPaperSize('f4')} className={`px-3 py-1.5 text-xs font-bold rounded ${paperSize === 'f4' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>F4</button></div>
                        <div className="w-px h-6 bg-slate-300"></div>
                        <div className="flex bg-white rounded border border-slate-200 p-0.5"><button onClick={() => setOrientation('portrait')} className={`p-1.5 rounded ${orientation === 'portrait' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`} title="Potrait"><RectangleVertical size={16}/></button><button onClick={() => setOrientation('landscape')} className={`p-1.5 rounded ${orientation === 'landscape' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`} title="Landscape"><RectangleHorizontal size={16}/></button></div>
                        <div className="w-px h-6 bg-slate-300"></div>
                        <button onClick={() => setPrivacyMode(!privacyMode)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-bold transition-all ${privacyMode ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'}`} title={privacyMode ? "Tampilkan Data Asli" : "Samarkan Data Privasi"}>{privacyMode ? <EyeOff size={14} className="text-orange-600"/> : <Eye size={14}/>}{privacyMode ? "Privasi On" : "Privasi Off"}</button>
                        <div className="w-px h-6 bg-slate-300"></div>
                        <div className="flex items-center gap-4 px-2">
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${showLetterhead ? 'text-blue-700 font-bold' : 'text-slate-600'}`}><input type="checkbox" checked={showLetterhead} onChange={() => setShowLetterhead(!showLetterhead)} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Kop</label>
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${signOptions.counselor ? 'text-blue-700 font-bold' : 'text-slate-600'}`}><input type="checkbox" checked={signOptions.counselor} onChange={() => toggleSign('counselor')} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Guru BK</label>
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${signOptions.principal ? 'text-blue-700 font-bold' : 'text-slate-600'}`}><input type="checkbox" checked={signOptions.principal} onChange={() => toggleSign('principal')} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Kepsek</label>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:flex gap-2"><button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-colors">Tutup</button><button onClick={handleDownload} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"><Download size={16}/> Download PDF</button></div>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-200 relative flex flex-col items-center">
                {previewUrl ? (<iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />) : (<div className="flex items-center justify-center h-full text-slate-500 font-bold animate-pulse flex-col gap-2"><Printer size={32} className="opacity-50"/><span>Memproses PDF...</span></div>)}
                <div className="lg:hidden absolute bottom-6 right-6 flex gap-2"><button onClick={handleDownload} className="p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 active:scale-90 transition-transform"><Download size={24}/></button></div>
            </div>
        </div>
    );
};

// ============================================================================
// 2. MODAL LAPORAN KLASIKAL (VERSI FINAL - DENGAN FILTER KELAS LENGKAP)
// ============================================================================
export const ClassReportModal = ({ isOpen, onClose, journals = [], students = [], selectedMonth, selectedYear, filterClass: initialFilterClass, settings }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [localMonth, setLocalMonth] = useState(selectedMonth);
    const [localYear, setLocalYear] = useState(selectedYear);
    const [localFilterClass, setLocalFilterClass] = useState(initialFilterClass || "");
    const [showLetterhead, setShowLetterhead] = useState(true);
    const [orientation, setOrientation] = useState('landscape'); 
    const [paperSize, setPaperSize] = useState('a4'); 
    const [signOptions, setSignOptions] = useState({ counselor: true, principal: true });

    useEffect(() => {
        if (isOpen) {
            setLocalMonth(selectedMonth);
            setLocalYear(selectedYear);
            setLocalFilterClass(initialFilterClass || "");
            setSignOptions({ counselor: true, principal: true });
        } else {
            setPreviewUrl(null);
        }
    }, [isOpen, selectedMonth, selectedYear, initialFilterClass]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => handlePreview(), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, localMonth, localYear, localFilterClass, showLetterhead, orientation, paperSize, signOptions]);

    useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

    const { semester, academicYear } = getAcademicPeriod(localMonth, localYear);
    const monthName = MONTH_NAMES[localMonth];

    const dataLogs = journals.filter(j => {
        const d = new Date(j.date);
        return d.getMonth() === localMonth && 
               d.getFullYear() === localYear && 
               j.serviceType === 'Bimbingan Klasikal' && 
               (!localFilterClass || j.studentName.includes(localFilterClass) || j.targetClass === localFilterClass);
    }).sort((a,b) => new Date(a.date) - new Date(b.date));

    const availableClasses = useMemo(() => {
        const classSet = new Set();
        if(students && Array.isArray(students)) {
            students.forEach(s => { 
                if(s.class) classSet.add(String(s.class).trim()); 
            });
        }
        if(journals && Array.isArray(journals)) {
            journals.forEach(j => { 
                if(j.targetClass) classSet.add(String(j.targetClass).trim()); 
            });
        }
        return Array.from(classSet).filter(Boolean).sort();
    }, [students, journals]);

    const yearOptions = useMemo(() => {
        const currYear = new Date().getFullYear();
        const years = [];
        for (let y = currYear - 5; y <= currYear + 2; y++) years.push(y);
        return years;
    }, []);

    const createPDFDoc = () => {
        const format = paperSize === 'f4' ? [215, 330] : 'a4';
        const doc = new jsPDF({ orientation, unit: 'mm', format });
        doc.setFont('helvetica', 'normal');
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        let currentY = 12;
        if (showLetterhead) {
            doc.setFontSize(12);
            doc.text((settings?.government || 'PEMERINTAH PROVINSI ...').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 6;
            doc.text((settings?.department || 'DINAS PENDIDIKAN').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 7;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
            doc.text((settings?.name || 'NAMA SEKOLAH ANDA').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 6;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
            doc.text(settings?.address || 'Alamat Sekolah...', centerX, currentY, { align: 'center' });
            if (settings?.address2) { currentY += 5; doc.setFont('helvetica', 'italic'); doc.text(settings?.address2, centerX, currentY, { align: 'center' }); }
            const logoY = 12; const logoSize = 24; const logoMargin = orientation === 'landscape' ? 20 : 12;
            if (settings?.logo) try { doc.addImage(settings.logo, 'PNG', logoMargin, logoY, logoSize, logoSize); } catch(e){}
            if (settings?.logo2) try { doc.addImage(settings.logo2, 'PNG', pageWidth - logoMargin - logoSize, logoY, logoSize, logoSize); } catch(e){}
            currentY += 6; doc.setLineWidth(0.5); doc.line(10, currentY, pageWidth - 10, currentY); doc.setLineWidth(0.1); currentY += 10;
        } else { currentY = 20; }

        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text('LAPORAN LAYANAN BIMBINGAN KLASIKAL', centerX, currentY, { align: 'center' });
        doc.line(centerX - 45, currentY + 1, centerX + 45, currentY + 1);
        currentY += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Bulan: ${monthName} ${localYear} ${localFilterClass ? ` | Kelas: ${localFilterClass}` : ''} | Semester: ${semester} ${academicYear}`, centerX, currentY, { align: 'center' });

        currentY += 8;
        const tableBody = dataLogs.length > 0 ? dataLogs.map((j, i) => [
            i + 1, 
            `${formatIndoDate(j.date)}\n(Jam ke-${j.time || '-'})`, 
            j.studentNames?.join(', ') || j.studentName || '-', 
            `${j.description || '-'}\n(Bidang: ${j.skkpd || '-'})`,
            `Proses: ${j.processEval || '-'}\nHasil: ${j.resultEval || '-'}`,
            j.followUp || '-'
        ]) : [['-', '-', '-', 'Belum ada data klasikal.', '-', '-']];

        const colStyles = orientation === 'landscape' 
            ? { 0: {cellWidth: 10, halign: 'center'}, 1: {cellWidth: 30, halign: 'center'}, 2: {cellWidth: 20, halign: 'center'}, 3: {cellWidth: 'auto'}, 4: {cellWidth: 80}, 5: {cellWidth: 40} }
            : { 0: {cellWidth: 8, halign: 'center'}, 1: {cellWidth: 25, halign: 'center'}, 2: {cellWidth: 15, halign: 'center'}, 3: {cellWidth: 'auto'}, 4: {cellWidth: 50}, 5: {cellWidth: 30} };

        autoTable(doc, {
            startY: currentY,
            head: [['No', 'Hari/Tgl', 'Kelas', 'Topik / Materi', 'Evaluasi (Proses & Hasil)', 'Tindak Lanjut']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold', halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0,0,0], fontSize: 9 },
            styles: { fontSize: 9, valign: 'top', lineWidth: 0.1, lineColor: [0,0,0], cellPadding: 2 },
            columnStyles: colStyles,
            margin: { left: 14, right: 14 }
        });

        let finalY = doc.lastAutoTable.finalY + 10;
        if (finalY > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); finalY = 20; }
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const city = settings?.city || 'Tempat';
        doc.setFontSize(11); doc.setFont('helvetica', 'normal');
        const leftX = 50; const rightX = pageWidth - 50;
        
        const renderSigBlock = (title, name, nip, xPos, isRightSide) => {
            if (isRightSide) doc.text(`${city}, ${dateStr}`, xPos, finalY, { align: 'center' });
            doc.text(title, xPos, finalY + 5, { align: 'center' });
            doc.setFont('helvetica', 'bold');
            doc.text(name, xPos, finalY + 30, { align: 'center' });
            const nameWidth = doc.getTextWidth(name);
            doc.setLineWidth(0.3); doc.line(xPos - (nameWidth/2) - 2, finalY + 31, xPos + (nameWidth/2) + 2, finalY + 31);
            doc.setFont('helvetica', 'normal');
            if(nip && nip !== '-') doc.text(`NIP. ${nip}`, xPos, finalY + 36, { align: 'center' });
        };

        const p_counselor = { title: 'Guru BK / Konselor', name: settings?.counselor || '(................)', nip: settings?.nipCounselor };
        const p_head = { title: 'Kepala Sekolah', name: settings?.headmaster || '(................)', nip: settings?.nipHeadmaster };
        let row1_Left = null, row1_Right = null;
        if (signOptions.principal && signOptions.counselor) { row1_Left = p_head; row1_Right = p_counselor; }
        else if (signOptions.counselor) { row1_Right = p_counselor; }
        else if (signOptions.principal) { row1_Right = p_head; }

        if (row1_Left) { if (row1_Left === p_head) doc.text("Mengetahui,", leftX, finalY, { align: 'center' }); renderSigBlock(row1_Left.title, row1_Left.name, row1_Left.nip, leftX, false); }
        if (row1_Right) { renderSigBlock(row1_Right.title, row1_Right.name, row1_Right.nip, rightX, true); }
        return doc;
    };

    const handlePreview = () => { try { const doc = createPDFDoc(); setPreviewUrl(URL.createObjectURL(doc.output('blob'))); } catch (e) { console.error(e); } };
    const handleDownload = () => {
        if (!ensureSignerNips(settings, signOptions)) return; try { const doc = createPDFDoc(); doc.save(`Laporan_Klasikal_${monthName}_${localYear}.pdf`); } catch (e) { alert(e.message); } };
    const toggleSign = (key) => { setSignOptions(p => ({ ...p, [key]: !p[key] })); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-white border-b px-4 py-3 flex flex-col lg:flex-row justify-between items-center gap-4 flex-shrink-0 shadow-sm relative z-10">
                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Users size={20}/></div>
                        <div><h2 className="text-lg font-bold text-slate-800 leading-tight">Cetak Klasikal</h2><p className="text-xs text-slate-500">{monthName} {localYear}</p></div>
                    </div>
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={24}/></button>
                </div>
                <div className="w-full lg:w-auto overflow-x-auto hide-scrollbar">
                    <div className="flex items-center gap-3 min-w-max mx-auto lg:mx-0 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        <div className="flex bg-white rounded border border-slate-200 p-0.5 items-center">
                            <div className="flex items-center px-2 text-slate-400"><Calendar size={14}/></div>
                            <select className="bg-transparent text-xs font-bold text-slate-700 py-1.5 px-1 outline-none cursor-pointer hover:bg-slate-50 rounded" value={localMonth} onChange={(e) => setLocalMonth(parseInt(e.target.value))}>{MONTH_NAMES.map((m, idx) => (<option key={idx} value={idx}>{m}</option>))}</select>
                            <div className="w-px h-4 bg-slate-200 mx-1"></div>
                            <select className="bg-transparent text-xs font-bold text-slate-700 py-1.5 px-1 pr-2 outline-none cursor-pointer hover:bg-slate-50 rounded" value={localYear} onChange={(e) => setLocalYear(parseInt(e.target.value))}>{yearOptions.map(y => (<option key={y} value={y}>{y}</option>))}</select>
                        </div>
                        <div className="w-px h-6 bg-slate-300"></div>
                        <div className="flex bg-white rounded border border-slate-200 p-0.5 items-center">
                            <div className="flex items-center px-2 text-slate-400"><Filter size={14}/></div>
                            <select 
                                className="bg-transparent text-xs font-bold text-slate-700 py-1.5 px-2 outline-none cursor-pointer hover:bg-slate-50 rounded max-w-[120px]" 
                                value={localFilterClass} 
                                onChange={(e) => setLocalFilterClass(e.target.value)}
                            >
                                <option value="">Semua Kelas</option>
                                {availableClasses.length > 0 ? (
                                    availableClasses.map(c => <option key={c} value={c}>{c}</option>)
                                ) : (
                                    <option disabled>Data Kosong</option>
                                )}
                            </select>
                        </div>
                        <div className="w-px h-6 bg-slate-300"></div>
                        <div className="flex bg-white rounded border border-slate-200 p-0.5"><button onClick={() => setPaperSize('a4')} className={`px-3 py-1.5 text-xs font-bold rounded ${paperSize === 'a4' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>A4</button><button onClick={() => setPaperSize('f4')} className={`px-3 py-1.5 text-xs font-bold rounded ${paperSize === 'f4' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>F4</button></div>
                        <div className="w-px h-6 bg-slate-300"></div>
                        <div className="flex bg-white rounded border border-slate-200 p-0.5"><button onClick={() => setOrientation('portrait')} className={`p-1.5 rounded ${orientation === 'portrait' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`} title="Potrait"><RectangleVertical size={16}/></button><button onClick={() => setOrientation('landscape')} className={`p-1.5 rounded ${orientation === 'landscape' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`} title="Landscape"><RectangleHorizontal size={16}/></button></div>
                        <div className="w-px h-6 bg-slate-300"></div>
                        <div className="flex items-center gap-4 px-2">
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${showLetterhead ? 'text-blue-700 font-bold' : 'text-slate-600'}`}><input type="checkbox" checked={showLetterhead} onChange={() => setShowLetterhead(!showLetterhead)} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Kop</label>
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${signOptions.counselor ? 'text-blue-700 font-bold' : 'text-slate-600'}`}><input type="checkbox" checked={signOptions.counselor} onChange={() => toggleSign('counselor')} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Guru BK</label>
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${signOptions.principal ? 'text-blue-700 font-bold' : 'text-slate-600'}`}><input type="checkbox" checked={signOptions.principal} onChange={() => toggleSign('principal')} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Kepsek</label>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:flex gap-2"><button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-colors">Tutup</button><button onClick={handleDownload} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"><Download size={16}/> Download PDF</button></div>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-200 relative flex flex-col items-center">
                {previewUrl ? (<iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />) : (<div className="flex items-center justify-center h-full text-slate-500 font-bold animate-pulse flex-col gap-2"><Printer size={32} className="opacity-50"/><span>Memproses PDF...</span></div>)}
                <div className="lg:hidden absolute bottom-6 right-6 flex gap-2"><button onClick={handleDownload} className="p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 active:scale-90 transition-transform"><Download size={24}/></button></div>
            </div>
        </div>
    );
};

// ============================================================================
// 3. MODAL BUKTI LAYANAN (LPL) - VERSI FINAL (FILTER BULAN/TAHUN & KEGIATAN)
// ============================================================================
export const ServiceProofModal = ({ isOpen, onClose, journals = [], journalId, settings }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    
    // --- STATE FILTERS ---
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [activeJournalId, setActiveJournalId] = useState(journalId);

    // --- PDF OPTIONS ---
    const [showLetterhead, setShowLetterhead] = useState(true);
    const [orientation, setOrientation] = useState('portrait'); 
    const [paperSize, setPaperSize] = useState('a4'); 
    const [signOptions, setSignOptions] = useState({ counselor: true, principal: true });

    // Sync Props when Open
    useEffect(() => {
        if (isOpen) {
            if(journalId) {
                // Jika membuka jurnal spesifik, set filter sesuai bulan/tahun jurnal tersebut
                const j = journals.find(x => x.id === journalId);
                if(j) {
                    const d = new Date(j.date);
                    setFilterMonth(d.getMonth());
                    setFilterYear(d.getFullYear());
                    setActiveJournalId(journalId);
                }
            } else {
                // Jika membuka modal kosong, reset filter ke bulan sekarang
                setFilterMonth(new Date().getMonth());
                setFilterYear(new Date().getFullYear());
                setActiveJournalId('');
            }
            setSignOptions({ counselor: true, principal: true });
        } else {
            setPreviewUrl(null);
        }
    }, [isOpen, journalId, journals]);

    // Update PDF Preview when Active Journal changes
    useEffect(() => {
        if (isOpen && activeJournalId) {
            const timer = setTimeout(() => {
                try {
                    const doc = createPDFDoc();
                    setPreviewUrl(URL.createObjectURL(doc.output('blob')));
                } catch(e) { console.error("PDF Error:", e); }
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setPreviewUrl(null);
        }
    }, [isOpen, activeJournalId, showLetterhead, orientation, paperSize, signOptions]);

    useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

    // --- DATA LOGIC: Filter Journals based on Month & Year ---
    const filteredJournals = useMemo(() => {
        if (!isOpen) return [];
        return journals.filter(j => {
            const d = new Date(j.date);
            const matchMonth = d.getMonth() === filterMonth;
            const matchYear = d.getFullYear() === filterYear;
            return matchMonth && matchYear;
        }).sort((a,b) => new Date(b.date) - new Date(a.date)); // Newest first
    }, [journals, filterMonth, filterYear, isOpen]);

    // Auto-select first journal if current activeJournalId is not in filtered list
    useEffect(() => {
        if(isOpen && filteredJournals.length > 0) {
            const currentExists = filteredJournals.find(j => j.id === activeJournalId);
            if(!currentExists) {
                // Pilih yang pertama dari list hasil filter
                setActiveJournalId(filteredJournals[0].id);
            }
        } else if (isOpen && filteredJournals.length === 0) {
            setActiveJournalId(''); // Kosongkan jika tidak ada hasil
        }
    }, [filteredJournals, isOpen]); // removed activeJournalId dependency to avoid loop, only reset on list change

    // Active Journal Object
    const j = useMemo(() => journals.find(x => x.id === activeJournalId), [journals, activeJournalId]);

    const yearOptions = useMemo(() => { const y = new Date().getFullYear(); return Array.from({length: 8}, (_, i) => y - 5 + i); }, []);

    const createPDFDoc = () => {
        if (!j) return new jsPDF();
        const format = paperSize === 'f4' ? [215, 330] : 'a4';
        const doc = new jsPDF({ orientation, unit: 'mm', format });
        doc.setFont('helvetica', 'normal');
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        let currentY = 12;

        if (showLetterhead) {
            doc.setFontSize(12); doc.text((settings?.government || '').toUpperCase(), centerX, currentY, { align: 'center' }); currentY += 6;
            doc.text((settings?.department || '').toUpperCase(), centerX, currentY, { align: 'center' }); currentY += 7;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text((settings?.name || '').toUpperCase(), centerX, currentY, { align: 'center' }); currentY += 6;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(settings?.address || '', centerX, currentY, { align: 'center' });
            if (settings?.address2) { currentY += 5; doc.setFont('helvetica', 'italic'); doc.text(settings?.address2, centerX, currentY, { align: 'center' }); }
            const logoY = 12; const logoSize = 24; const logoMargin = orientation === 'landscape' ? 20 : 12;
            if (settings?.logo) try { doc.addImage(settings.logo, 'PNG', logoMargin, logoY, logoSize, logoSize); } catch(e){}
            if (settings?.logo2) try { doc.addImage(settings.logo2, 'PNG', pageWidth - logoMargin - logoSize, logoY, logoSize, logoSize); } catch(e){}
            currentY += 6; doc.setLineWidth(0.5); doc.line(10, currentY, pageWidth - 10, currentY); doc.setLineWidth(0.1); currentY += 10;
        } else { currentY = 20; }

        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text('LAPORAN PELAKSANAAN LAYANAN (LPL)', centerX, currentY, { align: 'center' }); currentY += 6;
        doc.text('BIMBINGAN DAN KONSELING', centerX, currentY, { align: 'center' }); currentY += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Semester: ${j.semester || '-'}  Tahun: ${j.academicYear || '-'}`, centerX, currentY, { align: 'center' });
        currentY += 10;

        // KONTEN LPL (SAFE SPLIT)
        doc.setFontSize(11);
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        const labelWidth = 45;
        const colonWidth = 5;
        const valueWidth = contentWidth - labelWidth - colonWidth;

        const safeSplit = (text, width) => {
            const str = (text !== null && text !== undefined) ? String(text) : '-';
            return doc.splitTextToSize(str, width);
        };

        const addRow = (label, value) => {
            doc.setFont('helvetica', 'bold'); doc.text(label, margin, currentY);
            doc.text(':', margin + labelWidth, currentY);
            doc.setFont('helvetica', 'normal');
            const lines = safeSplit(value, valueWidth);
            doc.text(lines, margin + labelWidth + colonWidth, currentY);
            currentY += (lines.length * 6) + 2; 
        };

        addRow('1. Jenis Layanan', j.serviceType);
        addRow('2. Bidang', j.skkpd);
        addRow('3. Topik / Masalah', j.description);
        addRow('4. Sasaran', j.studentNames?.join(', ') || j.studentName);
        addRow('5. Hari / Tanggal', formatIndoDate(j.date));
        addRow('6. Waktu / Tempat', `${j.time || '-'} / ${j.place || '-'}`);
        addRow('7. Teknik', j.technique);

        currentY += 4;
        doc.setLineDash([1, 1], 0); doc.line(margin, currentY, pageWidth - margin, currentY); doc.setLineDash([]); 
        currentY += 8;

        doc.setFont('helvetica', 'bold'); doc.text('8. Evaluasi & Hasil:', margin, currentY); currentY += 6;
        doc.setFont('helvetica', 'normal');
        doc.text('Proses:', margin + 5, currentY); 
        const procLines = safeSplit(j.processEval, valueWidth - 5);
        doc.text(procLines, margin + 25, currentY); currentY += (procLines.length * 6) + 4;

        doc.text('Hasil:', margin + 5, currentY); 
        const resLines = safeSplit(j.resultEval || j.result, valueWidth - 5);
        doc.text(resLines, margin + 25, currentY); currentY += (resLines.length * 6) + 4;

        doc.setFont('helvetica', 'bold'); doc.text('9. Tindak Lanjut:', margin, currentY); currentY += 6;
        doc.setFont('helvetica', 'normal');
        const tlLines = safeSplit(j.followUp, contentWidth - 5);
        doc.text(tlLines, margin + 5, currentY); currentY += (tlLines.length * 6) + 10;

        // TANDA TANGAN
        if (currentY > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); currentY = 20; }
        const city = settings?.city || 'Tempat'; const dateStr = formatIndoDate(j.date);
        const leftX = 50; const rightX = pageWidth - 50;
        
        const renderSig = (title, name, nip, x, right) => { 
            if (right) doc.text(`${city}, ${dateStr}`, x, currentY, { align: 'center' }); 
            doc.text(title, x, currentY + 5, { align: 'center' }); 
            doc.setFont('helvetica', 'bold'); doc.text(name, x, currentY + 30, { align: 'center' }); 
            doc.setLineWidth(0.3); doc.line(x - (doc.getTextWidth(name)/2), currentY + 31, x + (doc.getTextWidth(name)/2), currentY + 31); 
            doc.setFont('helvetica', 'normal'); if(nip && nip !== '-') doc.text(`NIP. ${nip}`, x, currentY + 36, { align: 'center' }); 
        };
        const p_bk = { t: 'Guru BK / Konselor', n: settings?.counselor || '................', nip: settings?.nipCounselor };
        const p_ks = { t: 'Kepala Sekolah', n: settings?.headmaster || '................', nip: settings?.nipHeadmaster };
        
        if (signOptions.principal && signOptions.counselor) { 
            doc.text("Mengetahui,", leftX, currentY, { align: 'center' }); 
            renderSig(p_ks.t, p_ks.n, p_ks.nip, leftX, false); 
            renderSig(p_bk.t, p_bk.n, p_bk.nip, rightX, true); 
        } 
        else if (signOptions.counselor) renderSig(p_bk.t, p_bk.n, p_bk.nip, rightX, true); 
        else if (signOptions.principal) renderSig(p_ks.t, p_ks.n, p_ks.nip, rightX, true);
        
        return doc;
    };

    const handleDownload = () => {
        if (!ensureSignerNips(settings, signOptions)) return; if(j) createPDFDoc().save(`Bukti_Layanan_${j.studentName || 'Siswa'}.pdf`); };
    const toggleSign = (key) => { setSignOptions(p => ({ ...p, [key]: !p[key] })); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col animate-in fade-in duration-200 backdrop-blur-sm">
            
            {/* HEADER TOOLBAR */}
            <div className="bg-white border-b px-4 py-3 flex flex-col lg:flex-row justify-between items-center gap-4 flex-shrink-0 shadow-sm relative z-10">
                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600"><FileCheck size={20}/></div>
                        <div><h2 className="text-lg font-bold text-slate-800 leading-tight">Bukti Layanan (LPL)</h2><p className="text-xs text-slate-500">Pilih & Cetak</p></div>
                    </div>
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={24}/></button>
                </div>
                
                <div className="w-full lg:w-auto overflow-x-auto hide-scrollbar">
                    <div className="flex items-center gap-3 min-w-max mx-auto lg:mx-0 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        
                        {/* A. FILTER BULAN & TAHUN */}
                        <div className="flex bg-white rounded border border-slate-200 p-0.5 items-center">
                            <div className="flex items-center px-2 text-slate-400"><Calendar size={14}/></div>
                            <select className="bg-transparent text-xs font-bold text-slate-700 py-1.5 px-1 outline-none cursor-pointer hover:bg-slate-50 rounded" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))}>{MONTH_NAMES.map((m, idx) => (<option key={idx} value={idx}>{m}</option>))}</select>
                            <div className="w-px h-4 bg-slate-200 mx-1"></div>
                            <select className="bg-transparent text-xs font-bold text-slate-700 py-1.5 px-1 pr-2 outline-none cursor-pointer hover:bg-slate-50 rounded" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))}>{yearOptions.map(y => (<option key={y} value={y}>{y}</option>))}</select>
                        </div>

                        <div className="w-px h-6 bg-slate-300"></div>

                        {/* B. KEGIATAN SELECTOR (Tanpa Search Nama) */}
                        <div className="flex bg-white rounded border border-slate-200 p-0.5 items-center">
                            <select 
                                className="bg-transparent text-xs font-bold text-blue-700 py-1.5 px-2 outline-none cursor-pointer hover:bg-blue-50 rounded max-w-[200px]" 
                                value={activeJournalId || ''} 
                                onChange={(e) => setActiveJournalId(e.target.value)}
                            >
                                {filteredJournals.length > 0 ? (
                                    filteredJournals.map(j => (
                                        <option key={j.id} value={j.id}>
                                            {new Date(j.date).getDate()} - {j.studentName} ({j.serviceType})
                                        </option>
                                    ))
                                ) : (
                                    <option disabled value="">Tidak ada data.</option>
                                )}
                            </select>
                        </div>

                        <div className="w-px h-6 bg-slate-300"></div>

                        {/* C. Paper & Orientation */}
                        <div className="flex bg-white rounded border border-slate-200 p-0.5">
                            <button onClick={()=>setPaperSize('a4')} className={`px-3 py-1.5 text-xs font-bold rounded ${paperSize==='a4'?'bg-blue-100 text-blue-700 shadow-sm':'text-slate-500 hover:bg-slate-50'}`}>A4</button>
                            <button onClick={()=>setPaperSize('f4')} className={`px-3 py-1.5 text-xs font-bold rounded ${paperSize==='f4'?'bg-blue-100 text-blue-700 shadow-sm':'text-slate-500 hover:bg-slate-50'}`}>F4</button>
                        </div>
                        <div className="flex bg-white rounded border border-slate-200 p-0.5">
                            <button onClick={()=>setOrientation('portrait')} className={`p-1.5 rounded ${orientation==='portrait'?'bg-blue-100 text-blue-700 shadow-sm':'text-slate-500 hover:bg-slate-50'}`} title="Potrait"><RectangleVertical size={16}/></button>
                            <button onClick={()=>setOrientation('landscape')} className={`p-1.5 rounded ${orientation==='landscape'?'bg-blue-100 text-blue-700 shadow-sm':'text-slate-500 hover:bg-slate-50'}`} title="Landscape"><RectangleHorizontal size={16}/></button>
                        </div>

                        <div className="w-px h-6 bg-slate-300"></div>

                        {/* D. Signatures */}
                        <div className="flex items-center gap-4 px-2">
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${showLetterhead?'text-blue-700 font-bold':'text-slate-600'}`}><input type="checkbox" checked={showLetterhead} onChange={()=>setShowLetterhead(!showLetterhead)} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Kop</label>
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${signOptions.counselor?'text-blue-700 font-bold':'text-slate-600'}`}><input type="checkbox" checked={signOptions.counselor} onChange={()=>toggleSign('counselor')} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Guru BK</label>
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${signOptions.principal?'text-blue-700 font-bold':'text-slate-600'}`}><input type="checkbox" checked={signOptions.principal} onChange={()=>toggleSign('principal')} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Kepsek</label>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-colors">Tutup</button>
                    {j && <button onClick={handleDownload} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"><Download size={16}/> Download PDF</button>}
                </div>
            </div>
            
            <div className="flex-1 overflow-hidden bg-slate-200 relative flex flex-col items-center">
                {previewUrl ? (<iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />) : (
                    <div className="flex items-center justify-center h-full text-slate-500 font-bold flex-col gap-2">
                        {filteredJournals.length === 0 ? "Tidak ada data yang sesuai filter." : "Memproses PDF..."}
                    </div>
                )}
                <div className="lg:hidden absolute bottom-6 right-6 flex gap-2">
                    {j && <button onClick={handleDownload} className="p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 active:scale-90 transition-transform"><Download size={24}/></button>}
                </div>
            </div>
        </div>
    );
};