import { ensureSignerNips } from '../../../common/utils/signers';
import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    Printer, Download, X, 
    RectangleVertical, RectangleHorizontal, 
    Eye, EyeOff, FileText, User, Map, Filter, BarChart2
} from 'lucide-react';
import { formatIndoDate } from '../../../common/utils/helpers';
import { PrintPreviewModal, KopSurat, SignatureSection } from './ReportShared';

// ============================================================================
// 1. MODAL REKAM JEJAK SISWA (INDIVIDUAL RECORD)
// ============================================================================
export const IndividualReportModal = ({ isOpen, onClose, journals = [], students = [], studentId, settings }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showLetterhead, setShowLetterhead] = useState(true);
    const [orientation, setOrientation] = useState('portrait'); 
    const [paperSize, setPaperSize] = useState('a4'); 
    const [privacyMode, setPrivacyMode] = useState(false);
    const [signOptions, setSignOptions] = useState({ counselor: true, principal: true });

    const selectedStudent = useMemo(() => students.find(s => s.id === studentId) || null, [students, studentId]);
    
    const studentHistory = useMemo(() => {
        if (!studentId) return [];
        return journals.filter(j => 
            (j.studentIds && j.studentIds.includes(studentId)) || 
            (j.studentId && j.studentId === studentId)
        ).sort((a,b) => new Date(a.date) - new Date(b.date));
    }, [journals, studentId]);

    useEffect(() => { 
        if (isOpen) { 
            setPrivacyMode(false); 
            setSignOptions({ counselor: true, principal: true }); 
        } else { 
            setPreviewUrl(null); 
        } 
    }, [isOpen, studentId]);

    useEffect(() => { 
        if (isOpen && selectedStudent) { 
            const timer = setTimeout(() => handlePreview(), 100); 
            return () => clearTimeout(timer); 
        } 
    }, [isOpen, selectedStudent, showLetterhead, orientation, paperSize, signOptions, privacyMode]);

    useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

    const createPDFDoc = () => {
        if (!selectedStudent) return new jsPDF();
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

        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('REKAM JEJAK LAYANAN BIMBINGAN DAN KONSELING', centerX, currentY, { align: 'center' });
        doc.line(centerX - 50, currentY + 1, centerX + 50, currentY + 1); currentY += 8;

        const margin = 14; 
        const availableTableWidth = pageWidth - (margin * 2);
        const col0_LabelWidth = 35; const col2_LabelWidth = 32; 
        const remainingWidth = availableTableWidth - col0_LabelWidth - col2_LabelWidth; const valueColumnWidth = remainingWidth / 2;
        const infoColStyles = { 0: { cellWidth: col0_LabelWidth, fontStyle: 'bold' }, 1: { cellWidth: valueColumnWidth }, 2: { cellWidth: col2_LabelWidth, fontStyle: 'bold' }, 3: { cellWidth: 'auto' } };
        const genderLabel = selectedStudent.gender === 'L' ? 'Laki-laki' : (selectedStudent.gender === 'P' ? 'Perempuan' : '-');
        
        autoTable(doc, { 
            startY: currentY, 
            body: [
                [`Nama Siswa`, `: ${selectedStudent.name}`, `Kelas`, `: ${selectedStudent.class}`], 
                [`NISN`, `: ${selectedStudent.nisn || '-'}`, `Jenis Kelamin`, `: ${genderLabel}`], 
                [`Orang Tua / Wali`, `: ${selectedStudent.parentName || selectedStudent.parent || '-'}`, `Wali Kelas`, `: ${selectedStudent.homeroomTeacher || '-'}`], 
                [`Semester/T.A`, `: ${settings?.semester || 'Ganjil'} / ${settings?.academicYear || ''}`, `Guru Wali`, `: ${selectedStudent.guardianTeacher || '-'}`]
            ], 
            theme: 'plain', 
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5 }, 
            columnStyles: infoColStyles, 
            margin: { left: margin, right: margin } 
        });

        currentY = doc.lastAutoTable.finalY + 3;
        const tableBody = studentHistory.length > 0 ? studentHistory.map((j, i) => {
            const isPrivate = j.isPrivate || (j.serviceType && (String(j.serviceType).toLowerCase().includes('pribadi') || String(j.serviceType).toLowerCase().includes('individual')));
            const mask = privacyMode && isPrivate;
            return [
                i + 1, 
                formatIndoDate(j.date), 
                j.serviceType || '-', 
                mask ? '--- LAYANAN BERSIFAT PRIVASI ---' : `${j.description || '-'}`, 
                mask ? '---' : `${j.resultEval || j.result || '-'}\n(TL: ${j.followUp || '-'})`
            ];
        }) : [['-', '-', '-', 'Belum ada riwayat layanan.', '-']];
        
        const colStyles = orientation === 'landscape' 
            ? { 0: {cellWidth: 10, halign: 'center'}, 1: {cellWidth: 35}, 2: {cellWidth: 40}, 3: {cellWidth: 'auto'}, 4: {cellWidth: 70} } 
            : { 0: {cellWidth: 10, halign: 'center'}, 1: {cellWidth: 28}, 2: {cellWidth: 30}, 3: {cellWidth: 'auto'}, 4: {cellWidth: 45} };
        
        autoTable(doc, { 
            startY: currentY, 
            head: [['No', 'Tanggal', 'Jenis Layanan', 'Masalah / Topik', 'Hasil / Tindak Lanjut']], 
            body: tableBody, 
            theme: 'grid', 
            headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'center' }, 
            styles: { fontSize: 9, cellPadding: 2 }, 
            columnStyles: colStyles, 
            didParseCell: (data) => { 
                if (data.section === 'body' && (data.column.index === 3 || data.column.index === 4)) { 
                    if (data.cell.raw === '--- LAYANAN BERSIFAT PRIVASI ---' || data.cell.raw === '---') { 
                        data.cell.styles.fontStyle = 'italic'; data.cell.styles.textColor = [100,100,100]; 
                    } 
                } 
            }, 
            margin: { left: 14, right: 14 } 
        });

        let finalY = doc.lastAutoTable.finalY + 10; 
        if (finalY > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); finalY = 20; }
        const city = settings?.city || 'Tempat'; 
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11); const leftX = 50; const rightX = pageWidth - 50;
        
        const renderSig = (title, name, nip, x, right) => { 
            if (right) doc.text(`${city}, ${dateStr}`, x, finalY, { align: 'center' }); 
            doc.text(title, x, finalY + 5, { align: 'center' }); 
            doc.setFont('helvetica', 'bold'); doc.text(name, x, finalY + 30, { align: 'center' }); 
            doc.setLineWidth(0.3); doc.line(x - (doc.getTextWidth(name)/2), finalY + 31, x + (doc.getTextWidth(name)/2), finalY + 31); 
            doc.setFont('helvetica', 'normal'); 
            if(nip && nip !== '-') doc.text(`NIP. ${nip}`, x, finalY + 36, { align: 'center' }); 
        };
        
        const p_bk = { t: 'Guru BK / Konselor', n: settings?.counselor || '................', nip: settings?.nipCounselor };
        const p_ks = { t: 'Kepala Sekolah', n: settings?.headmaster || '................', nip: settings?.nipHeadmaster };
        
        if (signOptions.principal && signOptions.counselor) { 
            doc.text("Mengetahui,", leftX, finalY, { align: 'center' }); 
            renderSig(p_ks.t, p_ks.n, p_ks.nip, leftX, false); 
            renderSig(p_bk.t, p_bk.n, p_bk.nip, rightX, true); 
        } else if (signOptions.counselor) renderSig(p_bk.t, p_bk.n, p_bk.nip, rightX, true); 
        else if (signOptions.principal) renderSig(p_ks.t, p_ks.n, p_ks.nip, rightX, true);
        
        return doc;
    };

    const handlePreview = () => { try { setPreviewUrl(URL.createObjectURL(createPDFDoc().output('blob'))); } catch(e){} };
    const handleDownload = () => {
        if (!ensureSignerNips(settings, signOptions)) return; createPDFDoc().save(`Rekam_Jejak_${selectedStudent?.name || 'Siswa'}.pdf`); };
    const toggleSign = (key) => { setSignOptions(p => ({ ...p, [key]: !p[key] })); };

    if (!isOpen) return null;
    if (!selectedStudent) return <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex items-center justify-center backdrop-blur-sm"><div className="bg-white p-6 rounded-lg text-center shadow-xl"><p className="text-red-500 font-bold mb-4">Siswa belum dipilih!</p><button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300 font-bold text-sm">Tutup</button></div></div>;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-white border-b px-4 py-3 flex flex-col lg:flex-row justify-between items-center gap-4 flex-shrink-0 shadow-sm relative z-10">
                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
                    <div className="flex items-center gap-3"><div className="bg-orange-100 p-2 rounded-lg text-orange-600"><User size={20}/></div><div><h2 className="text-lg font-bold text-slate-800 leading-tight">Rekam Jejak</h2><p className="text-xs text-slate-500 line-clamp-1">{selectedStudent.name}</p></div></div>
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={24}/></button>
                </div>
                <div className="w-full lg:w-auto overflow-x-auto hide-scrollbar">
                    <div className="flex items-center gap-3 min-w-max mx-auto lg:mx-0 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        <div className="flex bg-white rounded border border-slate-200 p-0.5"><button onClick={()=>setPaperSize('a4')} className={`px-3 py-1.5 text-xs font-bold rounded ${paperSize==='a4'?'bg-blue-100 text-blue-700 shadow-sm':'text-slate-500 hover:bg-slate-50'}`}>A4</button><button onClick={()=>setPaperSize('f4')} className={`px-3 py-1.5 text-xs font-bold rounded ${paperSize==='f4'?'bg-blue-100 text-blue-700 shadow-sm':'text-slate-500 hover:bg-slate-50'}`}>F4</button></div>
                        <div className="flex bg-white rounded border border-slate-200 p-0.5"><button onClick={()=>setOrientation('portrait')} className={`p-1.5 rounded ${orientation==='portrait'?'bg-blue-100 text-blue-700 shadow-sm':'text-slate-500 hover:bg-slate-50'}`} title="Potrait"><RectangleVertical size={16}/></button><button onClick={()=>setOrientation('landscape')} className={`p-1.5 rounded ${orientation==='landscape'?'bg-blue-100 text-blue-700 shadow-sm':'text-slate-500 hover:bg-slate-50'}`} title="Landscape"><RectangleHorizontal size={16}/></button></div>
                        <div className="w-px h-6 bg-slate-300"></div>
                        <button onClick={()=>setPrivacyMode(!privacyMode)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-bold transition-all ${privacyMode?'bg-orange-50 border-orange-200 text-orange-700':'bg-white border-slate-200 text-slate-500 hover:text-slate-700'}`} title={privacyMode ? "Tampilkan Data Asli" : "Samarkan Data Privasi"}>{privacyMode ? <EyeOff size={14} className="text-orange-600"/> : <Eye size={14}/>}{privacyMode ? "Privasi On" : "Privasi Off"}</button>
                        <div className="w-px h-6 bg-slate-300"></div>
                        <div className="flex items-center gap-4 px-2">
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${showLetterhead?'text-blue-700 font-bold':'text-slate-600'}`}><input type="checkbox" checked={showLetterhead} onChange={()=>setShowLetterhead(!showLetterhead)} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Kop</label>
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${signOptions.counselor?'text-blue-700 font-bold':'text-slate-600'}`}><input type="checkbox" checked={signOptions.counselor} onChange={()=>toggleSign('counselor')} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> BK</label>
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${signOptions.principal?'text-blue-700 font-bold':'text-slate-600'}`}><input type="checkbox" checked={signOptions.principal} onChange={()=>toggleSign('principal')} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Kepsek</label>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:flex gap-2"><button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-colors">Tutup</button><button onClick={handleDownload} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"><Download size={16}/> Download PDF</button></div>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-200 relative flex flex-col items-center">{previewUrl ? (<iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />) : (<div className="flex items-center justify-center h-full text-slate-500 font-bold animate-pulse flex-col gap-2"><Printer size={32} className="opacity-50"/><span>Memproses PDF...</span></div>)}<div className="lg:hidden absolute bottom-6 right-6 flex gap-2"><button onClick={handleDownload} className="p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 active:scale-90 transition-transform"><Download size={24}/></button></div></div>
        </div>
    );
};

// ============================================================================
// 2. MODAL PETA KERAWANAN (RISK MAP REPORT) - DESAIN DASHBOARD MODERN
// ============================================================================
export const RiskMapReportModal = ({ isOpen, onClose, students = [], pointLogs = [], year, settings, filterRisk: initRisk, filterRiskClass: initClass }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showLetterhead, setShowLetterhead] = useState(true);
    const [orientation, setOrientation] = useState('portrait'); 
    const [paperSize, setPaperSize] = useState('a4'); 
    const [signOptions, setSignOptions] = useState({ counselor: true, principal: true });
    
    const [localRisk, setLocalRisk] = useState(initRisk || 'all');
    const [localClass, setLocalClass] = useState(initClass || '');

    useEffect(() => {
        if (isOpen) {
            setLocalRisk(initRisk || 'all');
            setLocalClass(initClass || '');
            setSignOptions({ counselor: true, principal: true });
        } else {
            setPreviewUrl(null);
        }
    }, [isOpen, initRisk, initClass]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                try {
                    const doc = createPDFDoc();
                    setPreviewUrl(URL.createObjectURL(doc.output('blob')));
                } catch(e) { console.error("PDF Error", e); }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, localRisk, localClass, showLetterhead, orientation, paperSize, signOptions, pointLogs, students]);

    useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

    // --- DATA PROCESSING ---
    const dataStats = useMemo(() => {
        if (!students) return { grouped: {}, sortedClassNames: [], chartData: {}, attentionGroups: {} };
        
        const totalStudents = students.length;
        const studentsWithViolations = new Set(pointLogs.filter(p => p.type === 'violation').map(p => p.studentId)).size;
        const studentsWithAchievements = new Set(pointLogs.filter(p => p.type === 'achievement').map(p => p.studentId)).size;

        const violationCountsByClass = {};
        pointLogs.filter(p => p.type === 'violation').forEach(p => {
            const s = students.find(std => std.id === p.studentId);
            if(s && s.class) {
                violationCountsByClass[s.class] = (violationCountsByClass[s.class] || 0) + 1;
            }
        });

        const attentionGroups = { priority: 0, watch: 0, guide: 0 };
        students.forEach(s => {
            const totalPoints = pointLogs
                .filter(p => p.studentId === s.id && p.type === 'violation')
                .reduce((a,b) => a + parseInt(b.value||0), 0);
            
            if (totalPoints >= 75) attentionGroups.priority++; 
            else if (totalPoints >= 25) attentionGroups.watch++; 
            else if (totalPoints > 0) attentionGroups.guide++; 
        });

        const filtered = students.filter(s => {
            const riskMatch = localRisk === 'all' || (s.riskLevel || 'Low').toLowerCase() === localRisk.toLowerCase();
            const classMatch = !localClass || s.class === localClass;
            return riskMatch && classMatch;
        });

        const groups = {};
        filtered.forEach(s => {
            const cls = s.class || 'Tanpa Kelas';
            if (!groups[cls]) groups[cls] = [];
            groups[cls].push(s);
        });

        const classNames = Object.keys(groups).sort();
        classNames.forEach(cls => {
            groups[cls].sort((a,b) => {
                const r = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                return (r[b.riskLevel || 'LOW'] || 0) - (r[a.riskLevel || 'LOW'] || 0);
            });
        });

        return { 
            grouped: groups, 
            sortedClassNames: classNames, 
            chartData: {
                total: totalStudents,
                violation: studentsWithViolations,
                achievement: studentsWithAchievements,
                classViolations: violationCountsByClass
            },
            attentionGroups
        };
    }, [students, pointLogs, localRisk, localClass]);

    const availableClasses = useMemo(() => {
        const classSet = new Set();
        if(students) students.forEach(s => { if(s.class) classSet.add(s.class); });
        return Array.from(classSet).sort();
    }, [students]);

    // --- HELPER UNTUK MENGGAMBAR "KARTU GRAFIK" (TABLE-LIKE LAYOUT) ---
    const drawModernChartCard = (doc, title, labels, values, colors, x, y, width, height) => {
        // 1. Bingkai Kartu (Border)
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(255, 255, 255);
        doc.rect(x, y, width, height, 'FD'); // Fill White, Draw Grey

        // 2. Header Kartu
        doc.setFillColor(30, 58, 138); // Biru Tua (Professional)
        doc.rect(x, y, width, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(title, x + 3, y + 5.5);

        // 3. Isi Grafik (Bar Chart)
        let chartY = y + 14;
        const maxVal = Math.max(...values, 1);
        const availableW = width - 45; // Space for labels and bars
        const barH = 5;
        const gap = 6;

        labels.forEach((label, i) => {
            const val = values[i];
            const barW = (val / maxVal) * availableW;
            
            // Label (Kiri)
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(label, x + 3, chartY + 4);

            // Bar
            doc.setFillColor(...colors[i % colors.length]);
            doc.rect(x + 35, chartY, barW, barH, 'F'); // Bar mulai dari x+35

            // Angka (Kanan Bar)
            doc.setFont('helvetica', 'bold');
            doc.text(String(val), x + 35 + barW + 2, chartY + 4);

            chartY += barH + gap;
        });
    };

    const createPDFDoc = () => {
        const format = paperSize === 'f4' ? [215, 330] : 'a4';
        const doc = new jsPDF({ orientation, unit: 'mm', format });
        doc.setFont('helvetica', 'normal'); const pageWidth = doc.internal.pageSize.getWidth(); const centerX = pageWidth / 2;
        let currentY = 12;

        // --- 1. KOP SURAT ---
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

        // --- 2. JUDUL ---
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('ANALISIS PETA KERAWANAN & POTENSI SISWA', centerX, currentY, { align: 'center' });
        doc.line(centerX - 60, currentY + 1, centerX + 60, currentY + 1); currentY += 6;
        
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        const textTA = settings?.academicYear ? settings.academicYear : (year || '-');
        const textSem = settings?.semester ? settings.semester : '-';
        doc.text(`Tahun Ajaran: ${textTA}  |  Semester: ${textSem}`, centerX, currentY, { align: 'center' });
        currentY += 10;

        // --- 3. DASHBOARD GRID SYSTEM ---
        // Kita akan membuat 3 Kotak (Card)
        // Baris 1: Statistik Umum (Kiri) & Kategori Perhatian (Kanan)
        // Baris 2: Sebaran Kelas (Full Width)

        const margin = 14;
        const availableW = pageWidth - (margin * 2);
        const gap = 4;
        const colW = (availableW - gap) / 2; // Lebar kolom untuk Baris 1
        
        const stats = dataStats.chartData;
        const att = dataStats.attentionGroups;
        const classViolations = dataStats.chartData.classViolations;
        const sortedClasses = Object.entries(classViolations).sort((a,b) => b[1] - a[1]).slice(0, 5);

        // --- BARIS 1: KIRI (Statistik) & KANAN (Perhatian) ---
        const heightRow1 = 50; 
        
        // Card 1: Statistik Umum
        drawModernChartCard(
            doc,
            "STATISTIK UMUM SISWA",
            ["Total", "Melanggar", "Berprestasi"],
            [stats.total, stats.violation, stats.achievement],
            [[100, 149, 237], [220, 38, 38], [22, 163, 74]], // Biru, Merah, Hijau
            margin, currentY, colW, heightRow1
        );

        // Card 2: Kategori Perhatian
        drawModernChartCard(
            doc,
            "KATEGORI PERHATIAN (POIN)",
            ["Prioritas", "Pantauan", "Binaan"],
            [att.priority, att.watch, att.guide],
            [[185, 28, 28], [234, 88, 12], [250, 204, 21]], // Merah Tua, Orange, Kuning
            margin + colW + gap, currentY, colW, heightRow1
        );

        currentY += heightRow1 + gap + 2;

        // --- BARIS 2: SEBARAN KELAS (FULL WIDTH) ---
        if (sortedClasses.length > 0) {
            const heightRow2 = 65; // Lebih tinggi karena datanya mungkin 5 baris
            
            drawModernChartCard(
                doc,
                "TOP 5 KELAS DENGAN KASUS TERTINGGI",
                sortedClasses.map(c => `Kelas ${c[0]}`),
                sortedClasses.map(c => c[1]),
                [[59, 130, 246]], // Biru untuk semua
                margin, currentY, availableW, heightRow2
            );
            currentY += heightRow2 + 10;
        } else {
            doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(100);
            doc.text("Belum ada data sebaran kasus per kelas.", margin, currentY + 5);
            currentY += 15;
        }

        // --- 4. TABEL DETAIL DATA SISWA ---
        // Cek halaman baru sebelum tabel
        if (currentY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); currentY = 20; }
        
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0);
        doc.setFillColor(240, 240, 240); // Header Background Abu-abu
        doc.rect(margin, currentY, availableW, 8, 'F');
        doc.text("DETAIL DATA SISWA PER KELAS", margin + 3, currentY + 5.5);
        currentY += 10;

        if (dataStats.sortedClassNames.length > 0) {
            dataStats.sortedClassNames.forEach(cls => {
                if (currentY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); currentY = 20; }
                
                // Sub-header Kelas
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
                doc.text(`Kelas: ${cls} (${dataStats.grouped[cls].length} Siswa)`, margin, currentY);
                currentY += 2;

                autoTable(doc, {
                    startY: currentY,
                    head: [['No', 'Nama Siswa', 'NISN', 'Status Kerawanan', 'Keterangan']],
                    body: dataStats.grouped[cls].map((s, i) => [
                        i+1, 
                        s.name, 
                        s.nisn||'-', 
                        s.riskLevel === 'HIGH' ? 'TINGGI' : (s.riskLevel === 'MEDIUM' ? 'SEDANG' : 'RENDAH'), 
                        `${s.parent||'-'} ${s.parentPhone ? `(${s.parentPhone})` : ''}`
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [50, 50, 50], textColor: 255, fontStyle: 'bold', halign: 'center' },
                    styles: { fontSize: 8, cellPadding: 2 },
                    columnStyles: { 0: {cellWidth: 8, halign: 'center'}, 2: {cellWidth: 25, halign: 'center'}, 3: {cellWidth: 30, halign: 'center'} },
                    didParseCell: (data) => {
                        if (data.section === 'body' && data.column.index === 3) {
                            const val = data.cell.raw;
                            if (val === 'TINGGI') data.cell.styles.textColor = [220, 38, 38]; 
                            else if (val === 'SEDANG') data.cell.styles.textColor = [202, 138, 4]; 
                            else data.cell.styles.textColor = [22, 163, 74]; 
                            data.cell.styles.fontStyle = 'bold';
                        }
                    },
                    margin: { left: margin, right: margin }
                });
                currentY = doc.lastAutoTable.finalY + 8;
            });
        } else {
            doc.setFont('helvetica', 'italic'); doc.setTextColor(100);
            doc.text("Tidak ada data siswa yang sesuai filter.", centerX, currentY + 10, { align: 'center' });
            currentY += 20;
        }

        // --- 5. TANDA TANGAN ---
        if (currentY > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); currentY = 20; }
        const city = settings?.city || 'Tempat'; const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11); doc.setTextColor(0); const leftX = 50; const rightX = pageWidth - 50;
        
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

    const handlePreview = () => { try { setPreviewUrl(URL.createObjectURL(createPDFDoc().output('blob'))); } catch(e){} };
    const handleDownload = () => {
        if (!ensureSignerNips(settings, signOptions)) return; createPDFDoc().save(`Peta_Kerawanan_${localRisk}.pdf`); };
    const toggleSign = (key) => { setSignOptions(p => ({ ...p, [key]: !p[key] })); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col animate-in fade-in duration-200 backdrop-blur-sm">
            {/* Header Toolbar */}
            <div className="bg-white border-b px-4 py-3 flex flex-col lg:flex-row justify-between items-center gap-4 flex-shrink-0 shadow-sm relative z-10">
                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg text-red-600"><BarChart2 size={20}/></div>
                        <div><h2 className="text-lg font-bold text-slate-800 leading-tight">Peta Kerawanan</h2><p className="text-xs text-slate-500">Analisis & Visualisasi Data</p></div>
                    </div>
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={24}/></button>
                </div>
                
                <div className="w-full lg:w-auto overflow-x-auto hide-scrollbar">
                    <div className="flex items-center gap-3 min-w-max mx-auto lg:mx-0 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        {/* Filter Risk & Class */}
                        <div className="flex bg-white rounded border border-slate-200 p-0.5 items-center">
                            <div className="flex items-center px-2 text-slate-400"><Filter size={14}/></div>
                            <select 
                                className="bg-transparent text-xs font-bold text-slate-700 py-1.5 px-2 outline-none cursor-pointer hover:bg-slate-50 rounded" 
                                value={localRisk} 
                                onChange={(e) => setLocalRisk(e.target.value)}
                            >
                                <option value="all">Semua Level</option>
                                <option value="High">Tinggi (High)</option>
                                <option value="Medium">Sedang (Medium)</option>
                                <option value="Low">Rendah (Low)</option>
                            </select>
                            <div className="w-px h-4 bg-slate-200 mx-1"></div>
                            <select 
                                className="bg-transparent text-xs font-bold text-slate-700 py-1.5 px-2 outline-none cursor-pointer hover:bg-slate-50 rounded max-w-[120px]" 
                                value={localClass} 
                                onChange={(e) => setLocalClass(e.target.value)}
                            >
                                <option value="">Semua Kelas</option>
                                {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="w-px h-6 bg-slate-300"></div>

                        {/* Paper & Orientation */}
                        <div className="flex bg-white rounded border border-slate-200 p-0.5"><button onClick={()=>setPaperSize('a4')} className={`px-3 py-1.5 text-xs font-bold rounded ${paperSize==='a4'?'bg-blue-100 text-blue-700 shadow-sm':'text-slate-500 hover:bg-slate-50'}`}>A4</button><button onClick={()=>setPaperSize('f4')} className={`px-3 py-1.5 text-xs font-bold rounded ${paperSize==='f4'?'bg-blue-100 text-blue-700 shadow-sm':'text-slate-500 hover:bg-slate-50'}`}>F4</button></div>
                        <div className="flex bg-white rounded border border-slate-200 p-0.5"><button onClick={()=>setOrientation('portrait')} className={`p-1.5 rounded ${orientation==='portrait'?'bg-blue-100 text-blue-700 shadow-sm':'text-slate-500 hover:bg-slate-50'}`} title="Potrait"><RectangleVertical size={16}/></button><button onClick={()=>setOrientation('landscape')} className={`p-1.5 rounded ${orientation==='landscape'?'bg-blue-100 text-blue-700 shadow-sm':'text-slate-500 hover:bg-slate-50'}`} title="Landscape"><RectangleHorizontal size={16}/></button></div>

                        <div className="w-px h-6 bg-slate-300"></div>

                        {/* Signatures */}
                        <div className="flex items-center gap-4 px-2">
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${showLetterhead?'text-blue-700 font-bold':'text-slate-600'}`}><input type="checkbox" checked={showLetterhead} onChange={()=>setShowLetterhead(!showLetterhead)} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Kop</label>
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${signOptions.counselor?'text-blue-700 font-bold':'text-slate-600'}`}><input type="checkbox" checked={signOptions.counselor} onChange={()=>toggleSign('counselor')} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> BK</label>
                            <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors ${signOptions.principal?'text-blue-700 font-bold':'text-slate-600'}`}><input type="checkbox" checked={signOptions.principal} onChange={()=>toggleSign('principal')} className="accent-blue-600 w-4 h-4 rounded cursor-pointer"/> Kepsek</label>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-colors">Tutup</button>
                    <button onClick={handleDownload} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"><Download size={16}/> Download PDF</button>
                </div>
            </div>
            
            <div className="flex-1 overflow-hidden bg-slate-200 relative flex flex-col items-center">
                {previewUrl ? (<iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />) : (<div className="flex items-center justify-center h-full text-slate-500 font-bold animate-pulse flex-col gap-2"><Printer size={32} className="opacity-50"/><span>Memproses PDF...</span></div>)}
                <div className="lg:hidden absolute bottom-6 right-6 flex gap-2">
                    <button onClick={handleDownload} className="p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 active:scale-90 transition-transform"><Download size={24}/></button>
                </div>
            </div>
        </div>
    );
};