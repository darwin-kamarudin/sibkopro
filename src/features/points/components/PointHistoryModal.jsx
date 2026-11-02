import { ensureSignerNips } from '../../../common/utils/signers';
import React, { useState, useEffect, useMemo } from 'react';
import { 
    History, X, Calendar, Printer, Download, ChevronLeft, 
    FileText, ArrowUpDown, AlertOctagon, Clock, PenTool, FileImage, Save,
    RectangleVertical, RectangleHorizontal 
} from 'lucide-react';
import { KATEGORI_LABEL, hitungStatusPasal } from '../../../common/utils/tataTertib';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatIndoDate } from '../../../common/utils/helpers';

const PointHistoryModal = ({ isOpen, onClose, student, pointLogs, settings, sanctionRules, onUpdateStudent, sanctionMode = 'poin', tataTertib, reportKind = 'all' }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    
    // --- OPSI CETAK DINAMIS ---
    const [showLetterhead, setShowLetterhead] = useState(true);
    const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'
    const [paperSize, setPaperSize] = useState('a4'); // 'a4' | 'f4'
    
    const [signOptions, setSignOptions] = useState({
        homeroom: true,       
        counselor: true,      
        vicePrincipal: false, 
        principal: false      
    });

    // STATE LOKAL NIP WALI KELAS
    const [homeroomNip, setHomeroomNip] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setPreviewUrl(null);
            // Reset ke default
            setSignOptions({ homeroom: true, counselor: true, vicePrincipal: false, principal: false });
            setShowLetterhead(true);
            setOrientation('portrait');
            setPaperSize('a4');
        } else if (student) {
            setHomeroomNip(student.homeroomTeacherNip || ''); 
        }
    }, [isOpen, student]);

    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    // Handler Simpan NIP
    const handleSaveNip = () => {
        if (onUpdateStudent && student) {
            onUpdateStudent(student.id, { homeroomTeacherNip: homeroomNip });
            alert('NIP Wali Kelas berhasil disimpan ke data siswa.');
        }
    };

    // --- LOGIKA DATA (KRONOLOGI) ---
    const logsWithBalance = useMemo(() => {
        if (!student || !pointLogs) return [];
        const logs = pointLogs.filter(p => p.studentId === student.id);
        
        logs.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() === dateB.getTime()) return (a.createdAt || 0) - (b.createdAt || 0); 
            return dateA - dateB;
        });

        let currentBalance = 0;
        return logs.map(log => {
            const val = parseInt(log.value) || 0;
            if (log.type === 'violation') currentBalance += val;
            else currentBalance -= val;
            if (currentBalance < 0) currentBalance = 0; 

            const historicSanction = (sanctionRules || [])
                .sort((a,b) => b.max - a.max)
                .find(rule => currentBalance >= rule.min && currentBalance <= rule.max);

            return { 
                ...log, 
                balanceSnapshot: currentBalance,
                sanctionSnapshot: historicSanction ? (historicSanction.penalty || historicSanction.action) : '-'
            };
        });
    }, [student, pointLogs, sanctionRules]);

    const displayLogs = logsWithBalance;
    // Laporan Buku Sanksi hanya memuat pelanggaran (prestasi tidak ikut dicetak)
    const pdfRows = reportKind === 'pelanggaran' ? displayLogs.filter(l => l.type === 'violation')
        : reportKind === 'prestasi' ? displayLogs.filter(l => l.type === 'achievement')
        : displayLogs;
    const reportTitle = reportKind === 'prestasi' ? 'LAPORAN RIWAYAT PRESTASI SISWA' : 'LAPORAN RIWAYAT PELANGGARAN DAN SANKSI';
    const listRows = reportKind === 'prestasi' ? displayLogs.filter(l => l.type === 'achievement') : displayLogs;

    if (!isOpen || !student) return null;

    const activeSanction = (sanctionRules || [])
        .sort((a,b) => b.max - a.max)
        .find(rule => student.netScore >= rule.min && student.netScore <= rule.max);

    // --- FUNGSI GENERATE PDF ---
    const createPDFDoc = () => {
        // 1. Setup Kertas Dinamis
        const format = paperSize === 'f4' ? [215, 330] : 'a4';
        const doc = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: format
        });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const centerX = pageWidth / 2;
        
        // 2. KOP SEKOLAH
        let currentY = 20; 
        if (showLetterhead) {
            currentY = 12;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
            doc.text((settings?.government || 'PEMERINTAH PROVINSI ...').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 6;
            doc.text((settings?.department || 'DINAS PENDIDIKAN').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 7;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
            doc.text((settings?.name || 'NAMA SEKOLAH ANDA').toUpperCase(), centerX, currentY, { align: 'center' });
            currentY += 6;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
            doc.text(settings?.address || 'Alamat Sekolah...', centerX, currentY, { align: 'center' });
            if (settings?.address2) {
                currentY += 5;
                doc.setFont('helvetica', 'italic');
                doc.text(settings?.address2, centerX, currentY, { align: 'center' });
            }

            // Logo Dinamis (Ikut Orientasi)
            const logoSize = 24; 
            const logoY = 12;
            const logoMargin = orientation === 'landscape' ? 20 : 12; // Lebih ke dalam jika landscape

            if (settings?.logo) { try { doc.addImage(settings.logo, 'PNG', logoMargin, logoY, logoSize, logoSize); } catch (e) {} }
            if (settings?.logo2) { try { doc.addImage(settings.logo2, 'PNG', pageWidth - logoMargin - logoSize, logoY, logoSize, logoSize); } catch (e) {} }

            currentY += 6;
            doc.setLineWidth(0.5); doc.line(10, currentY, pageWidth - 10, currentY); doc.setLineWidth(0.1); 
            currentY += 10;
        } else {
            currentY = 25; 
        }

        // 3. JUDUL DOKUMEN
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12); 
        doc.text(reportTitle, centerX, currentY, { align: 'center' });
        doc.line(centerX - (doc.getTextWidth(reportTitle)/2), currentY + 1, centerX + (doc.getTextWidth(reportTitle)/2), currentY + 1);

        // 4. IDENTITAS SISWA (DINAMIS & SEIMBANG)
        currentY += 8;
        
        // --- LOGIKA LEBAR KOLOM DINAMIS ---
        // Hitung lebar area tabel (Page Width - Margin Kiri Kanan)
        const margin = 14;
        const availableTableWidth = pageWidth - (margin * 2);
        
        // Tentukan lebar Label yang FIXED (Tetap) agar teks tidak turun baris
        const col0_LabelWidth = 35; // Cukup untuk "Orang Tua / Wali"
        const col2_LabelWidth = 32; // Cukup untuk "Jenis Kelamin" & "Wali Kelas" (dinaikkan jadi 32 agar aman)

        // Sisa ruang dibagi dua untuk Value (Nama Siswa & Nama Guru)
        // Ini memastikan di Landscape, kedua kolom value melebar sama rata mengisi kertas
        const remainingWidth = availableTableWidth - col0_LabelWidth - col2_LabelWidth;
        const valueColumnWidth = remainingWidth / 2;

        const infoColStyles = {
            0: { cellWidth: col0_LabelWidth, fontStyle: 'bold' }, 
            1: { cellWidth: valueColumnWidth }, // Dinamis: Setengah sisa ruang
            2: { cellWidth: col2_LabelWidth, fontStyle: 'bold' }, 
            3: { cellWidth: 'auto' } // Otomatis mengisi sisanya (sama dengan valueColumnWidth)
        };

        autoTable(doc, {
            startY: currentY,
            body: [
                [`Nama Siswa`, `: ${student.name}`, `Kelas`, `: ${student.class}`],
                [`NISN`, `: ${student.nisn || '-'}`, `Jenis Kelamin`, `: ${student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`], // Jenis Kelamin aman dengan lebar 32
                [`Orang Tua / Wali`, `: ${student.parentName || student.parent || '-'}`, `Wali Kelas`, `: ${student.homeroomTeacher || '-'}`],
                [`Semester/T.A`, `: ${settings?.semester || 'Ganjil'} / ${settings?.academicYear || ''}`, `Guru Wali`, `: ${student.guardianTeacher || '-'}`],
            ],
            theme: 'plain',
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5 },
            columnStyles: infoColStyles,
            margin: { left: margin, right: margin }
        });

        if (reportKind === 'prestasi') {
            const headStyle = { fillColor: [240, 253, 244], textColor: [21, 128, 61], fontStyle: 'bold', halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0, 0, 0], font: 'helvetica', cellPadding: 2 };
            currentY = doc.lastAutoTable.finalY + 6;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
            doc.text('A. REKAP PRESTASI', 14, currentY - 0);
            const achievementRows = pdfRows;
            if (sanctionMode === 'pasal') {
                const perBidang = {};
                achievementRows.forEach(r => { const k = r.bidang || '-'; perBidang[k] = (perBidang[k] || 0) + 1; });
                const bidangBody = Object.entries(perBidang).sort((a, b) => a[0].localeCompare(b[0])).map(([b, n]) => [b, n]);
                autoTable(doc, {
                    startY: currentY + 2, head: [['Bidang', 'Jumlah']],
                    body: bidangBody.length ? bidangBody : [['-', 0]],
                    theme: 'grid', headStyles: headStyle, styles: { font: 'helvetica', fontSize: 9, halign: 'center', lineWidth: 0.1, lineColor: [0, 0, 0] },
                    columnStyles: { 0: { halign: 'left' } }, margin: { left: 14, right: 14 }
                });
                doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
                doc.text(`Total prestasi: ${achievementRows.length}`, 14, doc.lastAutoTable.finalY + 3);
                currentY = doc.lastAutoTable.finalY + 10;
            } else {
                const totalPoin = achievementRows.reduce((acc, r) => acc + (parseInt(r.value) || 0), 0);
                autoTable(doc, {
                    startY: currentY + 2, head: [['Total Poin Prestasi', 'Jumlah Catatan']],
                    body: [[totalPoin, achievementRows.length]],
                    theme: 'grid', headStyles: headStyle, styles: { font: 'helvetica', fontSize: 10, halign: 'center', fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0] },
                    margin: { left: 14, right: 14 }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }
            doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
            doc.text('B. KRONOLOGI PRESTASI', 14, currentY - 2);
            autoTable(doc, {
                startY: currentY,
                head: [['No', 'Tanggal', 'Uraian Prestasi', sanctionMode === 'pasal' ? 'Bidang' : 'Poin']],
                body: achievementRows.length
                    ? achievementRows.map((r, i) => [i + 1, formatIndoDate(r.date), r.description || '-', sanctionMode === 'pasal' ? (r.bidang || '-') : (r.value ?? '-')])
                    : [['-', '-', 'Belum ada catatan prestasi.', '-']],
                theme: 'grid', headStyles: headStyle,
                styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5, valign: 'top', lineWidth: 0.1, lineColor: [0, 0, 0] },
                columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 35, halign: 'center' } },
                margin: { left: 14, right: 14 }
            });
        } else if (sanctionMode === 'pasal') {
            const st = hitungStatusPasal(displayLogs, tataTertib?.pasal || [], tataTertib?.spRules || []);
            const prestasiCount = displayLogs.filter(l => l.type === 'achievement').length;
            const headStyle = { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0, 0, 0], font: 'helvetica', cellPadding: 2 };
            const bodyStyle = { font: 'helvetica', fontSize: 10, halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0, 0, 0], fontStyle: 'bold', cellPadding: 2 };
            const pageW = doc.internal.pageSize.getWidth();

            // A. RINGKASAN KATEGORI
            currentY = doc.lastAutoTable.finalY + 5;
            autoTable(doc, {
                startY: currentY,
                head: reportKind === 'pelanggaran'
                    ? [['Pelanggaran Ringan', 'Pelanggaran Sedang', 'Pelanggaran Berat']]
                    : [['Pelanggaran Ringan', 'Pelanggaran Sedang', 'Pelanggaran Berat', 'Prestasi']],
                body: reportKind === 'pelanggaran'
                    ? [[st.raw.ringan, st.efektif.sedang, st.efektif.berat]]
                    : [[st.raw.ringan, st.efektif.sedang, st.efektif.berat, prestasiCount]],
                theme: 'grid', headStyles: headStyle, bodyStyles: bodyStyle,
                margin: { left: margin, right: margin }
            });
            currentY = doc.lastAutoTable.finalY + 10;

            // B. STATUS SANKSI BERBASIS PASAL
            if (st.totalPelanggaran > 0) {
                doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
                doc.text('A. STATUS SANKSI', margin, currentY - 3);
                autoTable(doc, {
                    startY: currentY,
                    head: [['Ambang SP Tercapai', 'Tindakan', 'Menuju SP Berikutnya']],
                    body: [[
                        st.spTercapai ? st.spTercapai.level : 'Belum mencapai SP',
                        st.spTercapai ? (st.spTercapai.tindakan || '-') : '-',
                        st.menujuSp ? `${st.menujuSp.level}: kurang ${st.menujuSp.kurang}` : 'Tertinggi'
                    ]],
                    theme: 'grid',
                    headStyles: { ...headStyle, fillColor: [254, 242, 242], textColor: [185, 28, 28] },
                    bodyStyles: { ...bodyStyle, fontSize: 9, fontStyle: 'normal' },
                    margin: { left: margin, right: margin }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            } else {
                currentY = doc.lastAutoTable.finalY + 10;
            }

            // C. TRACK RECORD (KRONOLOGI)
            doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
            doc.text('C. RIWAYAT PELANGGARAN', margin, currentY - 3);
            autoTable(doc, {
                startY: currentY,
                head: [['No', 'Tanggal', 'Uraian', 'Kategori / Bidang', 'Jenis']],
                body: pdfRows.map((log, i) => [
                    i + 1,
                    formatIndoDate(log.date),
                    log.description,
                    log.type === 'violation' ? (KATEGORI_LABEL[log.kategori] || '-') : (log.bidang || '-'),
                    log.type === 'violation' ? 'Pelanggaran' : 'Prestasi'
                ]),
                theme: 'grid',
                headStyles: headStyle,
                styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5, valign: 'top', lineWidth: 0.1, lineColor: [0, 0, 0] },
                columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 35, halign: 'center' }, 4: { cellWidth: 28, halign: 'center' } },
                margin: { left: margin, right: margin }
            });
        } else {
        // 5. RINGKASAN
        currentY = doc.lastAutoTable.finalY + 5;
        autoTable(doc, {
            startY: currentY,
            head: [['Poin Pelanggaran', 'Poin Prestasi', 'Akumulasi Poin Akhir']],
            body: [[student.violationTotal, student.achievementTotal, student.netScore]],
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold', halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0,0,0], font: 'helvetica', cellPadding: 2 },
            bodyStyles: { font: 'helvetica', fontSize: 10, halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0,0,0], fontStyle: 'bold', cellPadding: 2 },
            didParseCell: function(data) {
                if (data.section === 'body') {
                    if (data.column.index === 0) data.cell.styles.textColor = [220, 38, 38];
                    if (data.column.index === 1) data.cell.styles.textColor = [22, 163, 74];
                    if (data.column.index === 2) data.cell.styles.textColor = [37, 99, 235];
                }
            },
            margin: { left: margin, right: margin }
        });

        // 6. STATUS SANKSI (JIKA ADA)
        if (activeSanction && student.netScore > 0) {
            currentY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(10); doc.setFont('helvetica', 'bold');
            doc.text("A. STATUS SANKSI SAAT INI", margin, currentY - 3);
            
            // Kolom Sanksi: Dinamis lebar di Landscape
            const sanctionColStyles = orientation === 'landscape' 
                ? { 0: {cellWidth: 40}, 1: {cellWidth: 'auto'}, 2: {cellWidth: 'auto'} }
                : { 0: {cellWidth: 30}, 1: {cellWidth: 'auto', halign: 'left'}, 2: {cellWidth: 'auto', halign: 'left'} };

            autoTable(doc, {
                startY: currentY,
                head: [['Range Poin', 'Tindak Lanjut', 'Sanksi']],
                body: [[`${activeSanction.min} - ${activeSanction.max}`, activeSanction.action || '-', activeSanction.penalty || '-']],
                theme: 'grid',
                headStyles: { fillColor: [254, 242, 242], textColor: [185, 28, 28], fontStyle: 'bold', halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0,0,0], font: 'helvetica', cellPadding: 2 },
                bodyStyles: { font: 'helvetica', fontSize: 10, halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0,0,0], cellPadding: 2 },
                columnStyles: sanctionColStyles,
                margin: { left: margin, right: margin }
            });
        }

        // 7. KRONOLOGI TABEL UTAMA
        currentY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text("B. KRONOLOGI PERUBAHAN POIN", margin, currentY - 3);
        
        const tableRows = pdfRows.map((log, index) => {
            const isViolation = log.type === 'violation';
            const categoryLabel = isViolation ? 'PELANGGARAN' : 'PRESTASI';
            return [index + 1, formatIndoDate(log.date), `${categoryLabel}\n${log.description}`, (isViolation ? '+' : '-') + log.value, log.balanceSnapshot, log.sanctionSnapshot];
        });

        // Kolom Tabel: Dinamis Portrait vs Landscape
        const tableColStyles = orientation === 'portrait'
            ? { // Portrait (Rapat & Efisien)
                0: { cellWidth: 12, halign: 'center' }, 
                1: { cellWidth: 30, halign: 'center' }, 
                2: { cellWidth: 'auto' }, 
                3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }, 
                4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }, 
                5: { cellWidth: 40, halign: 'center', fontSize: 9 } 
              }
            : { // Landscape (Lebih Luas)
                0: { cellWidth: 15, halign: 'center' }, 
                1: { cellWidth: 35, halign: 'center' }, 
                2: { cellWidth: 'auto' }, // Deskripsi ambil sisa ruang
                3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }, 
                4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }, 
                5: { cellWidth: 60, halign: 'center', fontSize: 9 } 
              };

        autoTable(doc, {
            startY: currentY,
            head: [["No", "Tanggal", "Keterangan / Uraian", "Perubahan", "Saldo", "Status Sanksi"]],
            body: tableRows,
            theme: 'grid',
            headStyles: { 
                fillColor: [255, 247, 237], 
                textColor: [0, 0, 0], 
                fontStyle: 'bold', 
                halign: 'center', 
                valign: 'middle', 
                font: 'helvetica', 
                fontSize: 9, 
                lineWidth: 0.1, 
                lineColor: [0,0,0],
                cellPadding: 2 
            },
            styles: { 
                font: 'helvetica', 
                fontSize: 9, 
                cellPadding: 1.5, // Padding isi rapat (1.5)
                valign: 'top', 
                lineWidth: 0.1, 
                lineColor: [0,0,0] 
            },
            columnStyles: tableColStyles,
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 3) data.cell.styles.textColor = (pdfRows[data.row.index].type === 'violation') ? [220, 38, 38] : [22, 163, 74];
                if (data.section === 'body' && data.column.index === 4) data.cell.styles.textColor = [37, 99, 235];
            },
            margin: { left: margin, right: margin }
        });

        }

        // 8. TANDA TANGAN DINAMIS (POSISI MENYESUAIKAN LEBAR KERTAS)
        let finalY = doc.lastAutoTable.finalY + 15;
        if (finalY > pageHeight - 60) { doc.addPage(); finalY = 20; }

        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const city = settings?.city || 'Tempat';
        doc.setFontSize(11); doc.setFont('helvetica', 'normal');

        // Koordinat Dinamis berdasarkan PageWidth
        const leftX = 50; 
        const rightX = pageWidth - 50; 
        const centerXCoord = pageWidth / 2;

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

        const p_homeroom = { title: 'Wali Kelas', name: student.homeroomTeacher || '(................)', nip: homeroomNip || '-' };
        const p_counselor = { title: 'Guru BK / Konselor', name: settings?.counselor || '(................)', nip: settings?.nipCounselor };
        const p_vice = { title: 'Waka Kesiswaan', name: settings?.viceStudent || '(................)', nip: settings?.nipViceStudent };
        const p_head = { title: 'Kepala Sekolah', name: settings?.headmaster || '(................)', nip: settings?.nipHeadmaster };

        let row1_Left = null, row1_Right = null;
        let row2_Left = null, row2_Right = null, row2_Center = null;

        const hasHR = signOptions.homeroom;
        const hasBK = signOptions.counselor;
        const hasWK = signOptions.vicePrincipal;
        const hasKS = signOptions.principal;

        // --- LOGIKA POSISI TANDA TANGAN ---

        // 1. SEMUA DIPILIH (Wali + BK + Waka + Kepsek)
        // Posisi: Wali (Kiri), BK (Kanan) -> Bawahnya: Waka (Kiri), Kepsek (Kanan)
        if (hasHR && hasBK && hasWK && hasKS) {
            row1_Left = p_homeroom;
            row1_Right = p_counselor;
            row2_Left = p_vice;
            row2_Right = p_head;
        }
        // 2. Wali + BK + (Salah satu Atasan: Kepsek ATAU Waka)
        // Posisi: Wali (Kiri), BK (Kanan) -> Bawahnya: Atasan (Tengah)
        else if (hasHR && hasBK && (hasKS || hasWK)) {
            row1_Left = p_homeroom;
            row1_Right = p_counselor;
            row2_Center = hasKS ? p_head : p_vice;
        }
        // 3. Hanya Wali + BK
        // Posisi: Wali (Kiri), BK (Kanan)
        else if (hasHR && hasBK) {
            row1_Left = p_homeroom;
            row1_Right = p_counselor;
        }
        // 4. BK + (Kepsek ATAU Waka) -> TANPA Wali Kelas
        // Posisi: Atasan (Kiri - Mengetahui), BK (Kanan - Ada Tanggal)
        else if (hasBK && !hasHR && (hasKS || hasWK)) {
            row1_Left = hasKS ? p_head : p_vice; // Atasan di kiri
            row1_Right = p_counselor;            // BK di kanan
        }
        // 5. Hanya BK
        // Posisi: BK (Kanan - Ada Tanggal)
        else if (hasBK && !hasHR && !hasWK && !hasKS) {
            row1_Right = p_counselor;
        }
        // Fallback (Logika default lainnya)
        else {
            // Jika hanya Wali Kelas
            if (hasHR && !hasBK && !hasWK && !hasKS) row1_Right = p_homeroom;
            // Jika ada Wali dan Atasan saja (jarang terjadi tapi dicover)
            else if (hasHR && (hasKS || hasWK)) {
                row1_Left = p_homeroom;
                row1_Right = hasKS ? p_head : p_vice;
            }
        }

        // --- RENDER LOGIC ---

        // Helper: Cek apakah object di kiri adalah Atasan (agar muncul "Mengetahui")
        // Ini khusus untuk Kasus No. 4
        const isApprover = (obj) => obj === p_head || obj === p_vice;

        // Render Baris 1
        if (row1_Left) {
            // Jika Atasan ada di Kiri (Kasus 4), tambahkan "Mengetahui," di atasnya
            if (isApprover(row1_Left)) {
                doc.text("Mengetahui,", leftX, finalY, { align: 'center' });
            }
            renderSigBlock(row1_Left.title, row1_Left.name, row1_Left.nip, leftX, false);
        }
        if (row1_Right) {
            // Param true = Tampilkan Tanggal di atasnya
            renderSigBlock(row1_Right.title, row1_Right.name, row1_Right.nip, rightX, true);
        }

        // Render Baris 2 (Jika ada)
        if (row2_Left || row2_Right || row2_Center) {
            finalY += 45; // Turun baris
            
            // Label Mengetahui untuk Baris 2 (Tengah/Umum)
            doc.text("Mengetahui,", centerXCoord, finalY - 5, { align: 'center' });

            if (row2_Center) {
                renderSigBlock(row2_Center.title, row2_Center.name, row2_Center.nip, centerXCoord, false);
            } else {
                if (row2_Left) renderSigBlock(row2_Left.title, row2_Left.name, row2_Left.nip, leftX, false);
                if (row2_Right) renderSigBlock(row2_Right.title, row2_Right.name, row2_Right.nip, rightX, false);
            }
        }

        return doc;
    };

    const handlePreview = () => { try { const doc = createPDFDoc(); setPreviewUrl(URL.createObjectURL(doc.output('blob'))); } catch (error) { alert(`Gagal preview: ${error.message}`); } };
    const handleDownload = () => {
        if (!ensureSignerNips(settings, signOptions)) return; try { const doc = createPDFDoc(); doc.save(`Kronologi_Poin_${student.name.replace(/\s+/g, '_')}.pdf`); } catch (error) { alert(`Gagal download: ${error.message}`); } };
    const toggleSign = (key) => setSignOptions(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom-5 duration-300 flex flex-col">
            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-sm sticky top-0 z-20 gap-4">
                <div>
                    <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                        {previewUrl ? <FileText size={24} className="text-red-600"/> : <History size={24} className="text-blue-600"/>} 
                        {previewUrl ? 'Pratinjau Dokumen PDF' : (reportKind === 'prestasi' ? 'Riwayat Prestasi Siswa' : (reportKind === 'pelanggaran' ? 'Riwayat Pelanggaran & Sanksi' : 'Track Record Siswa'))}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1"><span className="font-bold text-slate-700">{student.name}</span> • {student.class} • Saldo: <span className="font-bold text-blue-600">{student.netScore}</span></p>
                </div>

                {!previewUrl && (
                    <div className="flex flex-col gap-2">
                        {/* INPUT NIP WALI KELAS */}
                        {signOptions.homeroom && (
                            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded border border-yellow-200">
                                <span className="text-xs font-bold text-yellow-700">NIP Wali:</span>
                                <input 
                                    type="text" 
                                    value={homeroomNip} 
                                    onChange={(e) => setHomeroomNip(e.target.value)}
                                    placeholder="Masukkan NIP..."
                                    className="text-xs border border-yellow-300 rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                />
                                <button onClick={handleSaveNip} className="p-1 bg-yellow-600 text-white rounded hover:bg-yellow-700" title="Simpan NIP"><Save size={12}/></button>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 items-center">
                            
                            {/* PAPER SIZE TOGGLE */}
                            <div className="flex bg-white rounded border border-slate-200 p-1 gap-1">
                                <button onClick={() => setPaperSize('a4')} className={`px-2 py-1 text-xs font-bold rounded ${paperSize === 'a4' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100'}`} title="Kertas A4">A4</button>
                                <button onClick={() => setPaperSize('f4')} className={`px-2 py-1 text-xs font-bold rounded ${paperSize === 'f4' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100'}`} title="Kertas F4">F4</button>
                            </div>

                            <div className="w-px h-6 bg-slate-300 mx-1"></div>

                            {/* ORIENTATION TOGGLE */}
                            <div className="flex bg-white rounded border border-slate-200 p-1 gap-1">
                                <button onClick={() => setOrientation('portrait')} className={`p-1 rounded flex items-center gap-1 ${orientation === 'portrait' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100'}`} title="Portrait"><RectangleVertical size={14}/></button>
                                <button onClick={() => setOrientation('landscape')} className={`p-1 rounded flex items-center gap-1 ${orientation === 'landscape' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100'}`} title="Landscape"><RectangleHorizontal size={14}/></button>
                            </div>

                            <div className="w-px h-6 bg-slate-300 mx-1"></div>

                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none bg-white px-2 py-1 rounded border border-slate-200 shadow-sm hover:border-blue-400 transition-colors">
                                <input type="checkbox" checked={showLetterhead} onChange={() => setShowLetterhead(!showLetterhead)} className="rounded text-blue-600 focus:ring-blue-500"/> <FileImage size={14}/> Kop
                            </label>
                            
                            <div className="w-px h-6 bg-slate-300 mx-1"></div>
                            
                            <label className="flex items-center gap-1 cursor-pointer text-xs font-medium text-slate-700 select-none hover:bg-slate-200 px-2 py-1 rounded transition-colors"><input type="checkbox" checked={signOptions.homeroom} onChange={() => toggleSign('homeroom')} className="rounded text-blue-600 focus:ring-blue-500"/> Wali Kelas</label>
                            <label className="flex items-center gap-1 cursor-pointer text-xs font-medium text-slate-700 select-none hover:bg-slate-200 px-2 py-1 rounded transition-colors"><input type="checkbox" checked={signOptions.counselor} onChange={() => toggleSign('counselor')} className="rounded text-blue-600 focus:ring-blue-500"/> Guru BK</label>
                            <label className="flex items-center gap-1 cursor-pointer text-xs font-medium text-slate-700 select-none hover:bg-slate-200 px-2 py-1 rounded transition-colors"><input type="checkbox" checked={signOptions.vicePrincipal} onChange={() => toggleSign('vicePrincipal')} className="rounded text-blue-600 focus:ring-blue-500"/> Waka</label>
                            <label className="flex items-center gap-1 cursor-pointer text-xs font-medium text-slate-700 select-none hover:bg-slate-200 px-2 py-1 rounded transition-colors"><input type="checkbox" checked={signOptions.principal} onChange={() => toggleSign('principal')} className="rounded text-blue-600 focus:ring-blue-500"/> Kepsek</label>
                        </div>
                    </div>
                )}
                
                <div className="flex items-center gap-3">
                    {previewUrl ? (
                        <>
                            <button onClick={() => setPreviewUrl(null)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ChevronLeft size={18}/> Kembali</button>
                            <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md hover:shadow-lg active:scale-95"><Download size={18}/> Download File</button>
                        </>
                    ) : (
                        <button onClick={handlePreview} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Printer size={18}/> Cetak Laporan</button>
                    )}
                    <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-colors"><X size={28}/></button>
                </div>
            </div>

            {/* BODY CONTENT FULL */}
            <div className="flex-1 overflow-hidden bg-slate-50 relative">
                {previewUrl ? <iframe src={previewUrl} className="w-full h-full border-none bg-slate-200" title="PDF Preview" /> : (
                    <div className="h-full overflow-y-auto max-w-6xl mx-auto p-6 md:p-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pelanggaran</span><span className="text-3xl font-black text-red-600">+{student.violationTotal}</span></div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Prestasi</span><span className="text-3xl font-black text-green-600">-{student.achievementTotal}</span></div>
                            <div className="bg-white p-5 rounded-xl border border-blue-100 bg-blue-50/50 shadow-sm flex flex-col items-center text-center relative overflow-hidden"><span className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Saldo Poin Akhir</span><span className="text-4xl font-black text-blue-700">{student.netScore}</span></div>
                            <div className="bg-white p-5 rounded-xl border border-orange-100 bg-orange-50/50 shadow-sm flex flex-col items-center text-center"><span className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">Status Sanksi</span><span className="text-sm font-bold text-orange-700 mt-2">{activeSanction ? (activeSanction.penalty || activeSanction.action) : 'Normal'}</span></div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center"><h4 className="font-bold text-slate-700 flex items-center gap-2"><Clock size={18} className="text-blue-600"/> Kronologi Perubahan Poin</h4><span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded">{displayLogs.length} Catatan (Terlama → Terbaru)</span></div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs border-b border-slate-200"><tr><th className="px-6 py-3 w-16 text-center">No</th><th className="px-6 py-3 w-32">Tanggal</th><th className="px-6 py-3">Keterangan</th><th className="px-6 py-3 text-center">Perubahan</th><th className="px-6 py-3 text-center">Saldo</th><th className="px-6 py-3 w-48">Status Sanksi</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {listRows.length > 0 ? listRows.map((log, idx) => {
                                        const isViolation = log.type === 'violation';
                                        return (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 text-center text-slate-500">{idx + 1}</td>
                                                <td className="px-6 py-4 font-medium">{formatIndoDate(log.date)}<div className="text-[10px] text-slate-400 mt-0.5">{log.createdAt ? new Date(log.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : ''}</div></td>
                                                <td className="px-6 py-4"><div className={`text-[10px] font-bold uppercase mb-1 ${isViolation ? 'text-red-600' : 'text-green-600'}`}>{isViolation ? 'Pelanggaran' : 'Prestasi'}</div><div className="text-slate-700">{log.description}</div></td>
                                                <td className="px-6 py-4 text-center"><span className={`font-bold px-2 py-1 rounded text-xs ${isViolation ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{sanctionMode === 'pasal' ? (isViolation ? (KATEGORI_LABEL[log.kategori] || '-') : (log.bidang || '-')) : <>{isViolation ? '+' : '-'}{log.value}</>}</span></td>
                                                <td className="px-6 py-4 text-center"><span className="font-bold text-blue-600 text-base">{log.balanceSnapshot}</span></td>
                                                <td className="px-6 py-4">{log.sanctionSnapshot !== '-' ? (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded text-xs font-bold"><AlertOctagon size={12}/> {log.sanctionSnapshot}</span>) : (<span className="text-slate-400 italic text-xs">-</span>)}</td>
                                            </tr>
                                        );
                                    }) : <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Belum ada data riwayat poin.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PointHistoryModal;