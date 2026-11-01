// src/utils/constants.js
import { CheckCircle, AlertTriangle } from 'lucide-react';

export const COLLECTION_PATHS = {
    users: 'users',
    students: 'students',
    journals: 'journals',
    settings: 'settings'
};

export const INITIAL_ADMIN = {
    username: 'admin',
    password: 'admin123',
    fullName: 'Administrator SIBKO',
    role: 'admin',
    createdAt: new Date().toISOString(),
    accessExpiry: null 
};

export const ACCESS_OPTIONS = [
    { label: '7 Hari', value: 7 },
    { label: '30 Hari', value: 30 },
    { label: '6 Bulan', value: 180 },
    { label: '12 Bulan', value: 365 },
    { label: 'Selamanya (Full Time)', value: -1 }
];

export const LAYANAN_TYPES = [
  'Konseling Individu', 'Konseling Kelompok', 'Bimbingan Klasikal',
  'Bimbingan Kelompok', 'Konferensi Kasus', 'Home Visit',
  'Alih Tangan Kasus (Referal)', 'Konsultasi', 'Kolaborasi', 'Mediasi'
];

export const SKKPD_LIST = [
  "Landasan Hidup Religius", "Landasan Perilaku Etis", "Kematangan Emosi",
  "Kematangan Intelektual", "Kesadaran Tanggung Jawab Sosial", "Kesadaran Gender",
  "Pengembangan Pribadi", "Perilaku Kewirausahaan (Kemandirian)",
  "Wawasan dan Kesiapan Karir", "Kematangan Hubungan Teman Sebaya"
];

export const MASALAH_KATEGORI = ['Pribadi', 'Sosial', 'Belajar', 'Karir', 'Kedisiplinan', 'Keluarga'];

export const RISK_LEVELS = {
  LOW: { label: 'Rendah', color: 'bg-green-100 text-green-800', icon: CheckCircle, badge: 'bg-green-500' },
  MEDIUM: { label: 'Sedang', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, badge: 'bg-yellow-500' },
  HIGH: { label: 'Tinggi', color: 'bg-red-100 text-red-800', icon: AlertTriangle, badge: 'bg-red-500' },
};

export const TEKNIK_KONSELING = [
  "Client Centered (Mendengarkan Aktif)", "Behavioral (Penguatan/Kontrak)",
  "REBT (Rational Emotive Behavior)", "SFBT (Fokus Solusi)", "Reality Therapy (WDEP)",
  "Trait & Factor (Karir)", "Diskusi Kelompok", "Psikodrama", "Sosiodrama", "Lainnya"
];