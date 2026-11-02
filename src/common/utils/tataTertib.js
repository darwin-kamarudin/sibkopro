// ============================================================================
// LOGIKA TATA TERTIB (SANKSI BERBASIS PASAL)
// Murni (tanpa React/Firebase) agar mudah diuji.
//
// Aturan yang dipakai (sesuai keputusan pengguna):
// - Setiap kejadian dicatat dengan satu butir pasal.
// - Kategori (ringan/sedang/berat) diambil dari pasal, bukan dipilih manual.
// - Tidak ada konversi otomatis. Guru mencatat butir 12.1 (10 ringan = sedang) secara manual.
// - Ambang Surat Peringatan (SP) dibaca dari master data "spRules" agar
//   bisa diubah sekolah. Sistem hanya MEREKOMENDASIKAN; keputusan di tangan guru.
// ============================================================================

export const KATEGORI_LIST = ['ringan', 'sedang', 'berat'];

export const KATEGORI_LABEL = {
    ringan: 'Ringan',
    sedang: 'Sedang',
    berat: 'Berat'
};

// Alur penanganan per kategori (Pasal 14, ringkasan)
export const ALUR_PENANGANAN = {
    ringan: 'Guru → Guru Piket → Wali Kelas → Guru BK → Pembinaan → Monitoring',
    sedang: 'Guru → Guru Piket → Wali Kelas → Guru BK → Wakasek Kesiswaan → Orang Tua → Pembinaan → Monitoring',
    berat: 'Guru → Guru Piket → Wali Kelas → Guru BK → Wakasek Kesiswaan → Orang Tua → Tim Disiplin/Dewan Guru → Kepala Sekolah → Keputusan dan Pembinaan Lanjutan'
};

// Normalisasi kategori dari input Excel / teks
export const normalizeKategori = (raw) => {
    const k = String(raw || '').trim().toLowerCase();
    if (k.startsWith('ring')) return 'ringan';
    if (k.startsWith('sed')) return 'sedang';
    if (k.startsWith('ber')) return 'berat';
    return null;
};

// Master pasal pelanggaran -> bentuk yang dipakai PointInputModal (dropdown)
// code  : nomor butir (mis. "13.1")
// label : uraian + kategori, supaya guru melihat kategori saat memilih
export const pasalToMasterItems = (pasal = []) =>
    pasal.map(p => ({
        id: `pasal-${p.id}`,
        code: String(p.butir),
        label: p.uraian,
        point: 1,
        type: 'violation',
        pasalId: p.id,
        kategori: p.kategori
    }));

// Master prestasi -> bentuk yang dipakai PointInputModal
export const prestasiToMasterItems = (prestasi = []) =>
    prestasi.map(p => ({
        id: `prestasi-${p.id}`,
        code: String(p.kode || p.id),
        label: p.kriteria,
        point: 1,
        bidang: p.bidang || '-',
        type: 'achievement',
        prestasiId: p.id
    }));

// Cari kategori sebuah catatan pelanggaran.
// Prioritas: field kategori di log -> lookup kode butir di master pasal.
export const kategoriDariLog = (log, pasal = []) => {
    if (log.kategori && normalizeKategori(log.kategori)) return normalizeKategori(log.kategori);
    const found = pasal.find(p => String(p.butir) === String(log.code));
    return found ? found.kategori : null;
};

// Hitung akumulasi + rekomendasi SP untuk satu siswa (tanpa konversi otomatis).
// logs  : pointLogs milik siswa (type === 'violation')
// pasal : master pasal
// spRules: [{ level:'SP1', ringan, sedang, berat, tindakan }]
export const hitungStatusPasal = (logs = [], pasal = [], spRules = []) => {
    const violations = logs.filter(l => l.type === 'violation');

    const raw = { ringan: 0, sedang: 0, berat: 0 };
    let tanpaKategori = 0;
    violations.forEach(l => {
        const k = kategoriDariLog(l, pasal);
        if (k) raw[k] += 1;
        else tanpaKategori += 1;
    });

    // Efektif = jumlah yang dicatat guru apa adanya
    const efektif = { ringan: raw.ringan, sedang: raw.sedang, berat: raw.berat };

    // SP tercapai bila salah satu ambang terpenuhi (ambang 0 = tidak dipakai)
    const rulesSorted = [...spRules].sort((a, b) => spIndex(a.level) - spIndex(b.level));
    const reachesRule = (rule) =>
        (rule.ringan > 0 && efektif.ringan >= rule.ringan) ||
        (rule.sedang > 0 && efektif.sedang >= rule.sedang) ||
        (rule.berat > 0 && efektif.berat >= rule.berat);

    let spTercapai = null;
    rulesSorted.forEach(r => { if (reachesRule(r)) spTercapai = r; });

    // SP berikutnya = SP setelah SP tertinggi yang sudah tercapai
    const batasIdx = spTercapai ? spIndex(spTercapai.level) : 0;
    const spBerikut = rulesSorted.find(r => spIndex(r.level) > batasIdx && !reachesRule(r)) || null;

    // Selisih menuju SP berikutnya (ditampilkan sebagai informasi)
    let menujuSp = null;
    if (spBerikut) {
        const selisih = [];
        if (spBerikut.ringan > 0) selisih.push(`${Math.max(spBerikut.ringan - efektif.ringan, 0)} ringan`);
        if (spBerikut.sedang > 0) selisih.push(`${Math.max(spBerikut.sedang - efektif.sedang, 0)} sedang`);
        if (spBerikut.berat > 0) selisih.push(`${Math.max(spBerikut.berat - efektif.berat, 0)} berat`);
        menujuSp = { level: spBerikut.level, kurang: selisih.join(' atau ') };
    }

    // Rekomendasi (guru tetap memutuskan)
    const rekomendasi = [];
    if (raw.berat > 0) rekomendasi.push(ALUR_PENANGANAN.berat);
    else if (efektif.sedang > 0) rekomendasi.push(ALUR_PENANGANAN.sedang);
    else if (efektif.ringan > 0) rekomendasi.push(ALUR_PENANGANAN.ringan);

    return {
        raw,
        efektif,
        tanpaKategori,
        totalPelanggaran: violations.length,
        spTercapai,           // rule SP tertinggi yang tercapai, atau null
        menujuSp,             // { level, kurang } atau null
        rekomendasi,          // daftar teks alur penanganan
        tindakanSp: spTercapai ? spTercapai.tindakan : null
    };
};

// Tingkat keparahan untuk warna di tabel (sama skala dengan mode poin)
export const severityPasal = (status) => {
    if (!status.spTercapai) return status.totalPelanggaran > 0 ? 'warning' : 'safe';
    const idx = spIndex(status.spTercapai.level);
    if (idx >= 3) return 'critical';
    return 'danger';
};

// "SP2" -> 2, dipakai untuk urutan
export const spIndex = (level) => {
    const m = String(level || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
};

// ----------------------------------------------------------------------------
// BASIS DATA CATATAN (poin / pasal)
// Setiap catatan baru menyimpan field `basis`. Catatan lama (sebelum field ini)
// dikenali dari isinya: punya kategori/bidang pasal = pasal, selain itu = poin.
// ----------------------------------------------------------------------------
export const logBasis = (log) => {
    if (log.basis === 'pasal' || log.basis === 'poin') return log.basis;
    return (log.kategori || log.bidang) ? 'pasal' : 'poin';
};

// Hanya catatan yang sesuai basis sekolah aktif yang boleh dirender
export const filterLogsByMode = (logs = [], mode = 'poin') =>
    (logs || []).filter(l => logBasis(l) === (mode === 'pasal' ? 'pasal' : 'poin'));
