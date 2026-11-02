import { withSigners } from '../common/utils/signers';
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import GuruDashboard from '../features/dashboard/GuruDashboard';
import PresensiSiswa from '../features/presensi/PresensiSiswa';
import StudentManager from '../features/students/StudentManager';
import Journal from '../features/counseling/Journal';
import PointManager from '../features/points/PointManager';
import StudentPointBook from '../features/points/StudentPointBook';
import AchievementBook from '../features/achievements/AchievementBook';
import SanctionBook from '../features/sanctions/SanctionBook';
import Reports from '../features/reports/Reports';
import LetterManager from '../features/letters/LetterManager';
import MasterDataSettings from '../features/settings/MasterDataSettings';
import SchoolSettings from '../features/settings/SchoolSettings';
import AccountSettings from '../features/settings/AccountSettings';

import { addStudent, updateStudent, deleteStudent, importStudents, moveStudentsClass } from '../features/students/studentsService';
import { addJournal, updateJournal, deleteJournal } from '../features/counseling/journalService';
import { addPointLog, updatePointLog, deletePointLog } from '../features/points/pointsService';
import { saveSchoolSettings, saveMasterPoints, saveSanctionRules, saveTataTertib } from '../common/services/schoolSettingsService';
import { pasalToMasterItems, prestasiToMasterItems, filterLogsByMode } from '../common/utils/tataTertib';

export default function GuruRoutes({
    appUser,
    students,
    journals,
    pointLogs,
    mySettings,
    masterPoints,
    sanctionRules,
    tataTertib,
    onUpdatePassword,
}) {
    const teacherId = appUser.id;

    // Mode sanksi: 'poin' (perilaku lama) atau 'pasal' (tata tertib)
    const sanctionMode = mySettings?.sanctionMode || 'poin';
    // Pejabat penandatangan dari Pengaturan Sekolah (alias untuk modul cetak)
    const signedSettings = withSigners(mySettings);
    const tata = tataTertib || { pasal: [], prestasi: [], spRules: [] };
    // Daftar pilihan input pelanggaran/prestasi mengikuti mode sekolah
    // Hanya catatan sesuai basis aktif yang diteruskan ke seluruh tampilan & cetak
    const pointLogsMode = filterLogsByMode(pointLogs, sanctionMode);
    const inputMasterPoints = sanctionMode === 'pasal'
        ? [...pasalToMasterItems(tata.pasal), ...prestasiToMasterItems(tata.prestasi)]
        : masterPoints;

    return (
        <Routes>
            <Route path="/" element={
                <GuruDashboard students={students} journals={journals} user={appUser} pointLogs={pointLogsMode} settings={signedSettings} />
            } />
            <Route path="/presensi" element={
                <PresensiSiswa user={appUser} students={students} settings={signedSettings} />
            } />
            <Route path="/students" element={
                <StudentManager
                    students={students} journals={journals} pointLogs={pointLogsMode} sanctionRules={sanctionRules} user={appUser}
                    onAdd={(d) => addStudent(teacherId, d)}
                    onEdit={(d) => updateStudent(d.id, d)}
                    onDelete={(id) => deleteStudent(id)}
                    onImport={(list) => importStudents(teacherId, list)}
                    onMoveClass={(ids, cls) => moveStudentsClass(ids, cls)}
                />
            } />
            <Route path="/journal" element={
                <Journal
                    students={students} journals={journals} settings={signedSettings}
                    onAdd={(d) => addJournal(teacherId, d)}
                    onUpdate={(d) => updateJournal(d.id, d)}
                    onDelete={(id) => deleteJournal(id)}
                />
            } />
            <Route path="/points" element={
                <PointManager
                    students={students} pointLogs={pointLogsMode} masterPoints={inputMasterPoints} sanctionRules={sanctionRules} settings={signedSettings} tataTertib={tata}
                    onAddPoint={(d) => addPointLog(teacherId, d)}
                    onUpdatePoint={(d) => updatePointLog(d.id, d)}
                    onDeletePoint={(id) => deletePointLog(id)}
                />
            } />
            <Route path="/point-book" element={
                <StudentPointBook students={students} pointLogs={pointLogsMode} journals={journals} settings={signedSettings} sanctionRules={sanctionRules} sanctionMode={sanctionMode} tataTertib={tata} />
            } />
            <Route path="/achievement-book" element={
                <AchievementBook students={students} pointLogs={pointLogsMode} settings={signedSettings} sanctionMode={sanctionMode} sanctionRules={sanctionRules} tataTertib={tata} />
            } />
            <Route path="/sanction-book" element={
                <SanctionBook students={students} pointLogs={pointLogsMode} sanctionRules={sanctionRules} settings={signedSettings} tataTertib={tata} sanctionMode={sanctionMode} />
            } />
            <Route path="/reports" element={
                <Reports journals={journals} students={students} pointLogs={pointLogsMode} settings={signedSettings} />
            } />
            <Route path="/letters" element={
                <LetterManager
                    students={students}
                    user={appUser}
                    settings={mySettings}
                    pointLogs={pointLogsMode}
                    masterPoints={masterPoints}
                    sanctionRules={sanctionRules}
                />
            } />
            <Route path="/master-points" element={
                <div className="space-y-8 animate-in fade-in pb-10 p-4 md:p-6">
                    <MasterDataSettings
                        masterPoints={masterPoints}
                        onSavePoints={(items) => saveMasterPoints(teacherId, items)}
                        sanctionRules={sanctionRules}
                        onSaveSanctions={(items) => saveSanctionRules(teacherId, items)}
                        tataTertib={tata}
                        sanctionMode={sanctionMode}
                        onSaveMode={(m) => saveSchoolSettings(mySettings, teacherId, { sanctionMode: m })}
                        onSaveTataTertib={(d) => saveTataTertib(teacherId, d)}
                    />
                </div>
            } />
            <Route path="/settings" element={
                <SchoolSettings settings={mySettings} onSave={(d) => saveSchoolSettings(mySettings, teacherId, d)} />
            } />
            <Route path="/account" element={<AccountSettings user={appUser} onUpdatePassword={onUpdatePassword} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
