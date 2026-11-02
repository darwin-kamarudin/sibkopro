import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatIndoDate } from '../../common/utils/helpers';
import { hitungStatusPasal } from '../../common/utils/tataTertib';

// ============================================================================
// PDF BUKU SIWA
// Isi mengikuti tampilan cetak: identitas, ringkasan, status sanksi,
// pelanggaran, prestasi, konseling (opsional), dan tanda tangan terpilih.
// ============================================================================
export const buildBukuSiswaPdf = ({
    student, pointData, counselingHistory = [], counselingPrivacy = 'mask',
    settings, isPasal, tataTertib, signOptions = {},
    showSanctionHistory = true, showCounselingHistory = true
}) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const centerX = pageW / 2;
    const margin = 14;

    const headStyle = { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [0, 0, 0], font: 'helvetica', cellPadding: 1.8 };
    const bodyStyle = { font: 'helvetica', fontSize: 9, lineWidth: 0.1, lineColor: [0, 0, 0], cellPadding: 1.8, valign: 'top' };
    const grid = { theme: 'grid', headStyles: headStyle, styles: bodyStyle, margin: { left: margin, right: margin } };
    const sectionTitle = (text, y) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(text, margin, y); };
    const ensureSpace = (y, need) => { if (y + need > pageH - 20) { doc.addPage(); return 20; } return y; };

    const logs = pointData?.logs || [];
    const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const violations = sorted.filter(l => l.type === 'violation');
    const achievements = sorted.filter(l => l.type === 'achievement');

    // Kop (sama dengan dokumen Buku Sanksi: logo kiri-kanan, teks tengah)
    let y = 12;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
    doc.text((settings?.government || 'PEMERINTAH PROVINSI ...').toUpperCase(), centerX, y, { align: 'center' }); y += 6;
    doc.text((settings?.department || 'DINAS PENDIDIKAN').toUpperCase(), centerX, y, { align: 'center' }); y += 7;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text((settings?.name || 'NAMA SEKOLAH ANDA').toUpperCase(), centerX, y, { align: 'center' }); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(settings?.address || 'Alamat Sekolah...', centerX, y, { align: 'center' });
    if (settings?.address2) { y += 5; doc.setFont('helvetica', 'italic'); doc.text(settings.address2, centerX, y, { align: 'center' }); }
    const logoSize = 24, logoY = 12, logoMargin = 12;
    if (settings?.logo) { try { doc.addImage(settings.logo, 'PNG', logoMargin, logoY, logoSize, logoSize); } catch (e) {} }
    if (settings?.logo2) { try { doc.addImage(settings.logo2, 'PNG', pageW - logoMargin - logoSize, logoY, logoSize, logoSize); } catch (e) {} }
    y += 6; doc.setLineWidth(0.5); doc.line(10, y, pageW - 10, y); doc.setLineWidth(0.1); y += 10;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('BUKU CATATAN REKAM JEJAK SISWA', centerX, y, { align: 'center' });
    doc.line(centerX - 60, y + 1, centerX + 60, y + 1);
    y += 6;

    // Identitas
    autoTable(doc, {
        startY: y,
        body: [
            ['Nama Siswa', `: ${student.name}`, 'Kelas', `: ${student.class || '-'}`],
            ['NISN', `: ${student.nisn || '-'}`, 'Jenis Kelamin', `: ${student.gender === 'L' ? 'Laki-laki' : student.gender === 'P' ? 'Perempuan' : '-'}`],
            ['Wali Kelas', `: ${student.homeroomTeacher || '-'}`, 'Guru Wali', `: ${student.guardianTeacher || '-'}`],
            ['Thn Ajaran', `: ${settings?.academicYear || '-'} / ${settings?.semester || '-'}`, '', ''],
        ],
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.2 },
        columnStyles: { 0: { cellWidth: 26, fontStyle: 'bold' }, 1: { cellWidth: 62 }, 2: { cellWidth: 28, fontStyle: 'bold' }, 3: { cellWidth: 62 } },
        margin: { left: margin, right: margin }
    });
    y = doc.lastAutoTable.finalY + 6;

    // Ringkasan
    sectionTitle('RINGKASAN', y); y += 2;
    if (isPasal) {
        const st = hitungStatusPasal(logs, tataTertib?.pasal || [], tataTertib?.spRules || []);
        autoTable(doc, {
            ...grid, startY: y,
            head: [['Pelanggaran Ringan', 'Pelanggaran Sedang', 'Pelanggaran Berat', 'Prestasi']],
            body: [[st.raw.ringan, st.efektif.sedang, st.efektif.berat, achievements.length]],
            bodyStyles: { ...bodyStyle, halign: 'center', fontStyle: 'bold', fontSize: 10 },
        });
        y = doc.lastAutoTable.finalY + 6;

        if (showSanctionHistory && st.totalPelanggaran > 0) {
            sectionTitle('STATUS SANKSI (BERBASIS PASAL)', y); y += 2;
            autoTable(doc, {
                ...grid, startY: y,
                headStyles: { ...headStyle, fillColor: [254, 242, 242], textColor: [185, 28, 28] },
                head: [['Ambang SP Tercapai', 'Tindakan', 'Menuju SP Berikutnya']],
                body: [[
                    st.spTercapai ? st.spTercapai.level : 'Belum mencapai SP',
                    st.spTercapai ? (st.spTercapai.tindakan || '-') : '-',
                    st.menujuSp ? `${st.menujuSp.level}: kurang ${st.menujuSp.kurang}` : 'Tertinggi'
                ]],
            });
            y = doc.lastAutoTable.finalY + 6;
        }
    } else {
        autoTable(doc, {
            ...grid, startY: y,
            head: [['Total Poin Pelanggaran', 'Total Poin Prestasi', 'Poin Bersih']],
            body: [[pointData?.violationTotal ?? 0, pointData?.achievementTotal ?? 0, pointData?.netScoreRaw ?? 0]],
            bodyStyles: { ...bodyStyle, halign: 'center', fontStyle: 'bold', fontSize: 10 },
        });
        y = doc.lastAutoTable.finalY + 6;

        const rule = pointData?.activeSanction;
        if (showSanctionHistory && rule) {
            sectionTitle('KETENTUAN SANKSI (BERBASIS POIN)', y); y += 2;
            autoTable(doc, {
                ...grid, startY: y,
                headStyles: { ...headStyle, fillColor: [254, 242, 242], textColor: [185, 28, 28] },
                head: [['Rentang Poin', 'Tindakan', 'Sanksi Siswa']],
                body: [[`${rule.min} - ${rule.max}`, rule.action || '-', rule.penalty || '-']],
            });
            y = doc.lastAutoTable.finalY + 6;
        }
    }

    // A. Pelanggaran
    y = ensureSpace(y, 30);
    sectionTitle('A. CATATAN PELANGGARAN', y); y += 2;
    autoTable(doc, {
        ...grid, startY: y,
        headStyles: { ...headStyle, fillColor: [254, 242, 242], textColor: [185, 28, 28] },
        didParseCell: (d) => { if (d.section === 'body' && d.column.index === 3) d.cell.styles.textColor = [220, 38, 38]; },
        head: [['No', 'Tanggal', 'Uraian Pelanggaran', isPasal ? 'Kategori' : 'Poin']],
        body: violations.length
            ? violations.map((l, i) => [i + 1, formatIndoDate(l.date), l.description || '-', isPasal ? (l.kategori ? (l.kategori.charAt(0).toUpperCase() + l.kategori.slice(1)) : '-') : l.value])
            : [['-', '-', 'Tidak ada catatan pelanggaran.', '-']],
        columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 28, halign: 'center' } },
    });
    y = doc.lastAutoTable.finalY + 6;

    // B. Prestasi
    y = ensureSpace(y, 30);
    sectionTitle('B. CATATAN PRESTASI', y); y += 2;
    autoTable(doc, {
        ...grid, startY: y,
        headStyles: { ...headStyle, fillColor: [240, 253, 244], textColor: [21, 128, 61] },
        didParseCell: (d) => { if (d.section === 'body' && d.column.index === 3) d.cell.styles.textColor = [22, 163, 74]; },
        head: [['No', 'Tanggal', 'Uraian Prestasi', isPasal ? 'Bidang' : 'Poin']],
        body: achievements.length
            ? achievements.map((l, i) => [i + 1, formatIndoDate(l.date), l.description || '-', isPasal ? (l.bidang || '-') : l.value])
            : [['-', '-', 'Tidak ada catatan prestasi.', '-']],
        columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 28, halign: 'center' } },
    });
    y = doc.lastAutoTable.finalY + 6;

    // C. Konseling
    if (showCounselingHistory && counselingHistory.length) {
        y = ensureSpace(y, 30);
        sectionTitle('C. RIWAYAT LAYANAN KONSELING', y); y += 2;
        if (counselingPrivacy === 'mask') {
            doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
            doc.text('*Topik yang bersifat privasi disamarkan.', margin, y + 3);
            y += 5;
        }
        autoTable(doc, {
            ...grid, startY: y,
            headStyles: { ...headStyle, fillColor: [239, 246, 255], textColor: [29, 78, 216] },
            head: [['No', 'Tanggal', 'Layanan', 'Topik / Uraian', 'Hasil']],
            body: counselingHistory.map((h, i) => {
                const isPrivate = h.isPrivate || (h.serviceType && h.serviceType.toLowerCase().includes('pribadi'));
                const masked = isPrivate && counselingPrivacy === 'mask';
                return [
                    i + 1,
                    formatIndoDate(h.date),
                    h.serviceType || '-',
                    masked ? '--- Privasi (Disamarkan) ---' : (h.description || '-'),
                    masked ? '-' : (h.resultEval || '-'),
                ];
            }),
            columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 26, halign: 'center' }, 2: { cellWidth: 32 } },
        });
        y = doc.lastAutoTable.finalY + 6;
    }

    // Tanda tangan (sesuai pilihan)
    const signers = [];
    if (signOptions.parent) signers.push({ kind: 'parent' });
    if (signOptions.counselor) signers.push({ kind: 'counselor' });
    if (signers.length) {
        y = ensureSpace(y, 45);
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const cols = signers.length === 1 ? [centerX] : [margin + 45, pageW - margin - 45];
        signers.forEach((sg, i) => {
            const x = cols[i];
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
            if (sg.kind === 'parent') {
                doc.text('Mengetahui,', x, y, { align: 'center' });
                doc.text('Orang Tua / Wali', x, y + 5, { align: 'center' });
                const n = `( ${student.parent || '....................................'} )`;
                doc.setFont('helvetica', 'bold'); doc.text(n, x, y + 30, { align: 'center' });
            } else {
                doc.text(`${settings?.city || 'Tempat'}, ${dateStr}`, x, y, { align: 'center' });
                doc.text('Guru BK / Konselor', x, y + 5, { align: 'center' });
                const n = settings?.counselor || '(................)';
                doc.setFont('helvetica', 'bold'); doc.text(n, x, y + 30, { align: 'center' });
                const w = doc.getTextWidth(n);
                doc.setLineWidth(0.3); doc.line(x - w / 2 - 2, y + 31, x + w / 2 + 2, y + 31);
                doc.setFont('helvetica', 'normal');
                if (settings?.nipCounselor) doc.text(`NIP. ${settings.nipCounselor}`, x, y + 36, { align: 'center' });
            }
        });
    }

    return doc;
};

export default buildBukuSiswaPdf;
