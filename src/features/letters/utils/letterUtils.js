import { formatIndoDate } from '../../../common/utils/helpers';

// --- KOP SURAT TERBARU (HELVETICA, 1.0 SPACING, UKURAN KHUSUS) ---
export const getKopSuratHTML = (settings, useSecondAddress = true) => {
    // Style Dasar: Helvetica, Single Spacing (line-height: 1)
    const containerStyle = "font-family: 'Helvetica', Arial, sans-serif; line-height: 1.0; margin-bottom: 20px; color: #000;";
    const borderStyle = "border-bottom: 3px double black; padding-bottom: 10px; margin-bottom: 20px;";
    
    // Style Font per Bagian (Sesuai Request)
    const fontPemerintah = "font-size: 12pt; margin: 0; text-transform: uppercase; font-weight: bold;"; // 12pt
    const fontDinas = "font-size: 12pt; margin: 0; text-transform: uppercase; font-weight: bold;"; // 12pt
    const fontSekolah = "font-size: 16pt; margin: 5px 0; text-transform: uppercase; font-weight: bold;"; // 16pt
    const fontAlamat = "font-size: 8pt; margin: 0; font-style: italic;"; // 8pt & Italic

    // Logic Address 2 (Opsional: Ditampilkan jika useSecondAddress = true DAN datanya ada)
    const address2HTML = (useSecondAddress && (settings?.address2 || settings?.website)) 
        ? `<p style="${fontAlamat}">${settings?.address2 || settings?.website || ''}</p>` 
        : '';

    return `
    <div style="${containerStyle}">
        <div style="display: flex; align-items: center; justify-content: space-between; ${borderStyle}">
            
            <div style="width: 80px; text-align: center;">
                ${settings?.logo ? `<img src="${settings.logo}" width="80" height="auto" />` : ''}
            </div>
            
            <div style="flex: 1; text-align: center; padding: 0 10px;">
                <h4 style="${fontPemerintah}">${settings?.government || 'PEMERINTAH PROVINSI ...'}</h4>
                <h4 style="${fontDinas}">${settings?.department || 'DINAS PENDIDIKAN'}</h4>
                <h2 style="${fontSekolah}">${settings?.name || 'NAMA SEKOLAH'}</h2>
                <p style="${fontAlamat}">${settings?.address || 'Alamat Sekolah...'}</p>
                ${address2HTML}
                <p style="${fontAlamat}">${settings?.city || 'Kota...'} - Kode Pos: ${settings?.postalCode || '...'}</p>
            </div>

            <div style="width: 80px; text-align: center;">
                ${settings?.logo2 ? `<img src="${settings.logo2}" width="80" height="auto" />` : ''}
            </div>
        </div>
    </div>
    `;
};

export const getTandaTanganHTML = (settings, user) => {
    return `
    <div style="margin-top: 30px; float: right; width: 220px; text-align: center; font-family: 'Times New Roman', serif; line-height: 1.15;">
        <p>${settings?.city || '...'}, [TANGGAL_SEKARANG]</p>
        <p>Guru BK / Konselor</p>
        <br/><br/><br/><br/>
        <p style="font-weight: bold; text-decoration: underline;">${settings?.counselor || user?.fullName || '...'}</p>
        <p>NIP. ${settings?.nipCounselor || '-'}</p>
    </div>
    <div style="clear: both;"></div>
    `;
};

// Fungsi getViolationListHTML tetap dibiarkan ada untuk kompatibilitas, 
// meskipun di LetterCreator terbaru kita sudah mengosongkan penggunaannya.
export const getViolationListHTML = (studentId, pointLogs, sanctionRules) => {
    // ... (Isi fungsi lama tetap sama, tidak perlu diubah karena jarang dipakai di format baru)
    return ''; 
};