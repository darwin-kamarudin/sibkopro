// ============================================================================
// PEJABAT PENANDATANGAN
// Sumber: Pengaturan Sekolah > Pejabat Penandatangan
//   principal / nipPrincipal           -> Kepala Sekolah
//   studentAffairs / nipStudentAffairs -> Waka Kesiswaan
//   counselor / nipCounselor           -> Guru BK / Konselor
//
// Modul cetak membaca nama lama (headmaster, viceStudent, counselor).
// withSigners() menambahkan alias tersebut dari field Pejabat, sehingga
// semua dokumen cetak memakai sumber yang sama. Surat (LetterManager)
// tidak memakai alias ini dan tetap memakai pengaturan aslinya.
// ============================================================================

const pick = (...vals) => vals.find(v => v && String(v).trim()) || '';

export const withSigners = (s) => {
    if (!s) return s;
    return {
        ...s,
        headmaster: pick(s.principal, s.headmaster),
        nipHeadmaster: pick(s.nipPrincipal, s.nipHeadmaster),
        viceStudent: pick(s.studentAffairs, s.viceStudent),
        nipViceStudent: pick(s.nipStudentAffairs, s.nipViceStudent),
        counselor: s.counselor || '',
        nipCounselor: s.nipCounselor || ''
    };
};

export const SIGNER_LABEL = {
    kepsek: 'Kepala Sekolah',
    waka: 'Waka Kesiswaan',
    bk: 'Guru BK / Konselor'
};

// Kunci opsi tanda tangan di modul cetak -> pejabat
const OPTION_TO_SIGNER = { principal: 'kepsek', vicePrincipal: 'waka', counselor: 'bk' };

// Daftar pejabat yang dipilih untuk dicetak tetapi nama/NIP-nya belum lengkap
export const missingSignerNips = (settings, signOptions = {}) => {
    const s = withSigners(settings) || {};
    const names = { kepsek: s.headmaster, waka: s.viceStudent, bk: s.counselor };
    const nips = { kepsek: s.nipHeadmaster, waka: s.nipViceStudent, bk: s.nipCounselor };
    return Object.entries(OPTION_TO_SIGNER)
        .filter(([opt]) => signOptions[opt])
        .map(([, key]) => key)
        .filter(key => !String(names[key] || '').trim() || !String(nips[key] || '').trim())
        .map(key => SIGNER_LABEL[key]);
};

// Dipanggil sebelum mencetak. Jika ada NIP/nama kosong, cetak dihentikan.
export const ensureSignerNips = (settings, signOptions = {}) => {
    const missing = missingSignerNips(settings, signOptions);
    if (missing.length) {
        alert(
            'Lengkapi nama dan NIP pejabat di Pengaturan Sekolah > Pejabat Penandatangan sebelum mencetak.\n\n' +
            'Belum lengkap: ' + missing.join(', ')
        );
        return false;
    }
    return true;
};
