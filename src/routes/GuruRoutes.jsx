import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import GuruDashboard from '../features/dashboard/GuruDashboard';
import PresensiSiswa from '../features/presensi/PresensiSiswa';
import StudentManager from '../features/students/StudentManager';
import Journal from '../features/counseling/Journal';
import PointManager from '../features/points/PointManager';
import StudentPointBook from '../features/points/StudentPointBook';
import SanctionBook from '../features/sanctions/SanctionBook';
import CounselingHistory from '../features/counseling/CounselingHistory';
import Reports from '../features/reports/Reports';
import LetterManager from '../features/letters/LetterManager';
import MasterDataSettings from '../features/settings/MasterDataSettings';
import SchoolSettings from '../features/settings/SchoolSettings';
import AccountSettings from '../features/settings/AccountSettings';

import { addStudent, updateStudent, deleteStudent, importStudents, moveStudentsClass } from '../features/students/studentsService';
import { addJournal, updateJournal, deleteJournal } from '../features/counseling/journalService';
import { addPointLog, updatePointLog, deletePointLog } from '../features/points/pointsService';
import { saveSchoolSettings, saveMasterPoints, saveSanctionRules } from '../common/services/schoolSettingsService';

export default function GuruRoutes({
    appUser,
    students,
    journals,
    pointLogs,
    mySettings,
    masterPoints,
    sanctionRules,
    onUpdatePassword,
}) {
    const teacherId = appUser.id;

    return (
        <Routes>
            <Route path="/" element={
                <GuruDashboard students={students} journals={journals} user={appUser} pointLogs={pointLogs} settings={mySettings} />
            } />
            <Route path="/presensi" element={
                <PresensiSiswa user={appUser} students={students} settings={mySettings} />
            } />
            <Route path="/students" element={
                <StudentManager
                    students={students} journals={journals} pointLogs={pointLogs} sanctionRules={sanctionRules} user={appUser}
                    onAdd={(d) => addStudent(teacherId, d)}
                    onEdit={(d) => updateStudent(d.id, d)}
                    onDelete={(id) => deleteStudent(id)}
                    onImport={(list) => importStudents(teacherId, list)}
                    onMoveClass={(ids, cls) => moveStudentsClass(ids, cls)}
                />
            } />
            <Route path="/journal" element={
                <Journal
                    students={students} journals={journals} settings={mySettings}
                    onAdd={(d) => addJournal(teacherId, d)}
                    onUpdate={(d) => updateJournal(d.id, d)}
                    onDelete={(id) => deleteJournal(id)}
                />
            } />
            <Route path="/points" element={
                <PointManager
                    students={students} pointLogs={pointLogs} masterPoints={masterPoints} sanctionRules={sanctionRules} settings={mySettings}
                    onAddPoint={(d) => addPointLog(teacherId, d)}
                    onUpdatePoint={(d) => updatePointLog(d.id, d)}
                    onDeletePoint={(id) => deletePointLog(id)}
                />
            } />
            <Route path="/point-book" element={
                <StudentPointBook students={students} pointLogs={pointLogs} journals={journals} settings={mySettings} sanctionRules={sanctionRules} />
            } />
            <Route path="/sanction-book" element={
                <SanctionBook students={students} pointLogs={pointLogs} sanctionRules={sanctionRules} settings={mySettings} />
            } />
            <Route path="/counseling-history" element={
                <CounselingHistory students={students} journals={journals} settings={mySettings} user={appUser} />
            } />
            <Route path="/reports" element={
                <Reports journals={journals} students={students} pointLogs={pointLogs} settings={mySettings} />
            } />
            <Route path="/letters" element={
                <LetterManager
                    students={students}
                    user={appUser}
                    settings={mySettings}
                    pointLogs={pointLogs}
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
