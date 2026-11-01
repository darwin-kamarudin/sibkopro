import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AdminDashboard from '../features/dashboard/AdminDashboard';
import AdminUserManagement from '../features/settings/AdminUserManagement';
import LetterManager from '../features/letters/LetterManager';
import SchoolSettings from '../features/settings/SchoolSettings';
import AccountSettings from '../features/settings/AccountSettings';

import { saveSchoolSettings } from '../common/services/schoolSettingsService';

export default function AdminRoutes({
    appUser,
    allUsers,
    students,
    mySettings,
    pointLogs,
    masterPoints,
    sanctionRules,
    onUpdatePassword,
}) {
    return (
        <Routes>
            <Route path="/" element={<AdminDashboard users={allUsers} />} />
            <Route path="/users" element={<AdminUserManagement users={allUsers} />} />
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
            <Route path="/settings" element={
                <SchoolSettings
                    settings={mySettings}
                    onSave={(d) => saveSchoolSettings(mySettings, appUser.id, d)}
                />
            } />
            <Route path="/account" element={<AccountSettings user={appUser} onUpdatePassword={onUpdatePassword} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
