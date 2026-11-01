import React, { useState, useEffect, useMemo } from 'react';
import { 
    History, X, Calendar, Printer, Download, ChevronLeft, 
    FileText, Eye, EyeOff, Trash2, PenTool, FileImage, Save, Lock,
    RectangleVertical, RectangleHorizontal 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatIndoDate } from '../../../common/utils/helpers';

const CounselingHistoryModal = ({ isOpen, onClose, student, journals, settings, onUpdateStudent }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    
    // --- OPSI CETAK DINAMIS ---
    const [showLetterhead, setShowLetterhead] = useState(true);
    const [privacyMode, setPrivacyMode] = useState('mask'); // 'show', 'mask', 'hide'
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
            // Reset ke default saat modal ditutup
            setSignOptions({ homeroom: true, counselor: true, vicePrincipal: false, principal: false });
            setShowLetterhead(true);
            setPrivacyMode('mask');
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

    // --- LOGIKA DATA KONSELING ---
    const counselingLogs = useMemo(() => {
        if (!student || !journals) return [];
        
        let logs = journals.filter(j => 
            j.studentId === student.id || (j.studentIds && j.studentIds.includes(student.id))
        );

        // Sort Kronologis (Terlama -> Terbaru)
        logs.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Filter Privacy
        if (privacyMode === 'hide') {
            logs = logs.filter(j => {
                const isPrivate = j.isPrivate || (j.serviceType && j.serviceType.toLowerCase().includes('pribadi'));
                return !isPrivate;
            });
        }

        return logs;
    }, [student, journals, privacyMode]);

    if (!isOpen || !student) return null;

    // --- FUNGSI GENERATE PDF ---
    const createPDFDoc = () => {
        // Logika Ukuran Kertas F4 (Folio: 215x330mm)
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
        
        // 1. KOP SEKOLAH
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

            // Logo Adjustment (Posisi dinamis berdasarkan orientasi)
            const logoSize = 24; 
            const logoY = 12;
            const logoMargin = orientation === 'landscape' ? 20 : 12;

            if (settings?.logo) { try { doc.addImage(settings.logo, 'PNG', logoMargin, logoY, logoSize, logoSize); } catch (e) {} }
            if (settings?.logo2) { try { doc.addImage(settings.logo2, 'PNG', pageWidth - logoMargin - logoSize, logoY, logoSize, logoSize); } catch (e) {} }

            currentY += 6;
            doc.setLineWidth(0.5); doc.line(10, currentY, pageWidth - 10, currentY); doc.setLineWidth(0.1); 
            currentY += 10;
        } else {
            currentY = 25; 
        }

        // 2. JUDUL
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12); 
        doc.text('LAPORAN RIWAYAT LAYANAN BIMBINGAN KONSELING', centerX, currentY, { align: 'center' });
        doc.line(centerX - (doc.getTextWidth('LAPORAN RIWAYAT LAYANAN BIMBINGAN KONSELING')/2), currentY + 1, centerX + (doc.getTextWidth('LAPORAN RIWAYAT LAYANAN BIMBINGAN KONSELING')/2), currentY + 1);

        // 3. IDENTITAS SISWA (Optimasi Lebar Kolom)
        currentY += 8;
        
        const infoColStyles = {
            0: { cellWidth: 32, fontStyle: 'bold' }, // Label Kiri (Cukup untuk Orang Tua)
            1: { cellWidth: 50 }, // Value Kiri (Nama Siswa) - Dipersempit agar kanan luas
            2: { cellWidth: 23, fontStyle: 'bold' }, // Label Kanan (Wali Kelas) - Dipersempit
            3: { cellWidth: 'auto' } // Value Kanan (Nama Guru) - Otomatis sisa ruang yang luas
        };

        autoTable(doc, {
            startY: currentY,
            body: [
                [`Nama Siswa`, `: ${student.name}`, `Kelas`, `: ${student.class}`],
                [`NISN`, `: ${student.nisn || '-'}`, `Jenis Kelamin`, `: ${student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`],
                [`Orang Tua / Wali`, `: ${student.parentName || student.parent || '-'}`, `Wali Kelas`, `: ${student.homeroomTeacher || '-'}`],
                [`Semester/T.A`, `: ${settings?.semester || 'Ganjil'} / ${settings?.academicYear || ''}`, `Guru Wali`, `: ${student.guardianTeacher || '-'}`],
            ],
            theme: 'plain',
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5, overflow: 'visible' },
            columnStyles: infoColStyles,
            margin: { left: 14, right: 14 }
        });

        // 4. TABEL RIWAYAT KONSELING
        currentY = doc.lastAutoTable.finalY + 10;
        
        if (privacyMode === 'mask') {
            doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(100);
            doc.text("*Topik layanan yang bersifat privasi disamarkan pada dokumen ini.", 14, currentY - 2);
            doc.setTextColor(0);
        }

        const tableColumn = ["No", "Tanggal", "Jenis & Detail Layanan", "Topik / Masalah", "Tindak Lanjut"];
        const tableRows = counselingLogs.map((log, index) => {
            const isPrivate = log.isPrivate || (log.serviceType && log.serviceType.toLowerCase().includes('pribadi'));
            let description = log.description;
            if (isPrivate && privacyMode === 'mask') description = "--- Privasi (Disamarkan) ---";

            // Menggabungkan detail agar lebih rapat
            const detailsText = `Bidang: ${log.skkpd || '-'}  •  Kategori: ${log.category || '-'}  •  Teknik: ${log.technique || '-'}`;
            const serviceContent = `${log.serviceType}\n${detailsText}`; 

            return [index + 1, formatIndoDate(log.date), serviceContent, description, log.followUp || '-'];
        });

        if (tableRows.length === 0) tableRows.push(['-', '-', 'Belum ada riwayat layanan.', '-', '-']);

        const tableColStyles = orientation === 'portrait' 
            ? { // Portrait (Standard)
                0: { cellWidth: 12, halign: 'center' },
                1: { cellWidth: 30, halign: 'center' },
                2: { cellWidth: 60 }, 
                3: { cellWidth: 'auto' }, 
                4: { cellWidth: 35 } 
              }
            : { // Landscape (Expanded)
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 35, halign: 'center' },
                2: { cellWidth: 80 }, 
                3: { cellWidth: 'auto' },
                4: { cellWidth: 50 } 
              };

        autoTable(doc, {
            startY: currentY,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', valign: 'middle', font: 'helvetica', fontSize: 10, lineWidth: 0.1, lineColor: [0,0,0], cellPadding: 2 },
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5, valign: 'top', lineWidth: 0.1, lineColor: [0,0,0] },
            columnStyles: tableColStyles,
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 3) {
                    if (data.cell.raw === "--- Privasi (Disamarkan) ---") {
                        data.cell.styles.fontStyle = 'italic';
                        data.cell.styles.textColor = [100, 100, 100];
                    }
                }
            },
            margin: { left: 14, right: 14 }
        });

        // 7. TANDA TANGAN DINAMIS
        let finalY = doc.lastAutoTable.finalY + 15;
        if (finalY > pageHeight - 60) { doc.addPage(); finalY = 20; }

        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const city = settings?.city || 'Tempat';
        doc.setFontSize(11); doc.setFont('helvetica', 'normal');

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

        // --- LOGIKA POSISI TANDA TANGAN (SAMA DENGAN POIN) ---

        // 1. SEMUA DIPILIH
        if (hasHR && hasBK && hasWK && hasKS) {
            row1_Left = p_homeroom;
            row1_Right = p_counselor;
            row2_Left = p_vice;
            row2_Right = p_head;
        }
        // 2. Wali + BK + (Salah satu Atasan)
        else if (hasHR && hasBK && (hasKS || hasWK)) {
            row1_Left = p_homeroom;
            row1_Right = p_counselor;
            row2_Center = hasKS ? p_head : p_vice;
        }
        // 3. Hanya Wali + BK
        else if (hasHR && hasBK) {
            row1_Left = p_homeroom;
            row1_Right = p_counselor;
        }
        // 4. BK + (Kepsek ATAU Waka) -> TANPA Wali Kelas
        // Permintaan: Kepsek di kiri (Mengetahui), BK di kanan
        else if (hasBK && !hasHR && (hasKS || hasWK)) {
            row1_Left = hasKS ? p_head : p_vice; 
            row1_Right = p_counselor;           
        }
        // 5. Hanya BK
        else if (hasBK && !hasHR && !hasWK && !hasKS) {
            row1_Right = p_counselor;
        }
        // Fallback
        else {
            if (hasHR && !hasBK) row1_Right = p_homeroom;
            else if (hasHR && (hasKS || hasWK)) {
                row1_Left = p_homeroom;
                row1_Right = hasKS ? p_head : p_vice;
            }
        }

        // --- RENDER LOGIC ---
        const isApprover = (obj) => obj === p_head || obj === p_vice;

        if (row1_Left) {
            if (isApprover(row1_Left)) {
                doc.text("Mengetahui,", leftX, finalY, { align: 'center' });
            }
            renderSigBlock(row1_Left.title, row1_Left.name, row1_Left.nip, leftX, false);
        }
        if (row1_Right) {
            renderSigBlock(row1_Right.title, row1_Right.name, row1_Right.nip, rightX, true);
        }

        if (row2_Left || row2_Right || row2_Center) {
            finalY += 45; 
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
    const handleDownload = () => { try { const doc = createPDFDoc(); doc.save(`Riwayat_Konseling_${student.name.replace(/\s+/g, '_')}.pdf`); } catch (error) { alert(`Gagal download: ${error.message}`); } };
    const toggleSign = (key) => setSignOptions(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom-5 duration-300 flex flex-col">
            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-sm sticky top-0 z-20 gap-4">
                <div>
                    <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                        {previewUrl ? <FileText size={24} className="text-red-600"/> : <History size={24} className="text-blue-600"/>} 
                        {previewUrl ? 'Pratinjau PDF' : 'Riwayat Konseling'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1"><span className="font-bold text-slate-700">{student.name}</span> • {student.class}</p>
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
                            
                            {/* OPSI PRIVASI DI HEADER */}
                            <div className="flex bg-white rounded border border-slate-200 p-1 gap-1">
                                <button onClick={() => setPrivacyMode('show')} className={`p-1 rounded ${privacyMode === 'show' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100'}`} title="Tampilkan Semua"><Eye size={14}/></button>
                                <button onClick={() => setPrivacyMode('mask')} className={`p-1 rounded ${privacyMode === 'mask' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100'}`} title="Samarkan Topik"><EyeOff size={14}/></button>
                                <button onClick={() => setPrivacyMode('hide')} className={`p-1 rounded ${privacyMode === 'hide' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100'}`} title="Sembunyikan Baris"><Trash2 size={14}/></button>
                            </div>

                            <div className="w-px h-6 bg-slate-300 mx-1"></div>

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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Layanan</span><span className="text-3xl font-black text-blue-600">{counselingLogs.length}</span></div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pribadi / Rahasia</span><span className="text-3xl font-black text-red-600">{counselingLogs.filter(l => l.isPrivate || (l.serviceType && l.serviceType.toLowerCase().includes('pribadi'))).length}</span></div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Layanan Terakhir</span><span className="text-sm font-bold text-slate-700 mt-2">{counselingLogs.length > 0 ? formatIndoDate(counselingLogs[counselingLogs.length-1].date) : '-'}</span></div>
                        </div>

                        {/* TABEL DATA (UI) */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center"><h4 className="font-bold text-slate-700 flex items-center gap-2"><FileText size={18} className="text-blue-600"/> Riwayat Layanan</h4><span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded">{counselingLogs.length} Catatan</span></div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs border-b border-slate-200">
                                    <tr><th className="px-6 py-3 w-16 text-center">No</th><th className="px-6 py-3 w-32">Tanggal</th><th className="px-6 py-3">Jenis & Detail</th><th className="px-6 py-3">Topik / Masalah</th><th className="px-6 py-3 w-48">Tindak Lanjut</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {counselingLogs.length > 0 ? counselingLogs.map((log, idx) => {
                                        const isPrivate = log.isPrivate || (log.serviceType && log.serviceType.toLowerCase().includes('pribadi'));
                                        const isMasked = isPrivate && privacyMode === 'mask';
                                        return (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 text-center text-slate-500">{idx + 1}</td>
                                                <td className="px-6 py-4 font-medium">{formatIndoDate(log.date)}</td>
                                                <td className="px-6 py-4"><div className="font-bold text-blue-700 mb-1 flex items-center gap-1">{log.serviceType}{isPrivate && <Lock size={12} className="text-red-500"/>}</div><div className="text-[10px] text-slate-500 space-y-0.5"><div>B: {log.skkpd}</div><div>K: {log.category}</div></div></td>
                                                <td className="px-6 py-4"><div className={`text-slate-700 ${isMasked ? 'italic text-gray-400' : ''}`}>{isMasked ? '--- Privasi (Disamarkan) ---' : log.description}</div></td>
                                                <td className="px-6 py-4 text-slate-600">{log.followUp || '-'}</td>
                                            </tr>
                                        );
                                    }) : <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Belum ada riwayat layanan.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CounselingHistoryModal;