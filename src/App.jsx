import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './common/components/ProtectedRoute';
import Layout from './common/components/Layout';
import Login from './features/auth/Login';

import { useAuthSession } from './common/hooks/useAuthSession';
import { useAdminUsers } from './common/hooks/useAdminUsers';
import { useSharedSettings } from './common/hooks/useSharedSettings';
import { useGuruRecords } from './common/hooks/useGuruRecords';

import AdminRoutes from './routes/AdminRoutes';
import GuruRoutes from './routes/GuruRoutes';

export default function App() {
    const {
        authUser,
        appUser,
        loading,
        setLoading,
        loginLoading,
        loginError,
        handleLogin,
        handleLogout,
        handleUpdatePassword,
    } = useAuthSession();

    // Data lintas-role & spesifik-role. Masing-masing hook menangani listener
    // Firestore-nya sendiri dan reset otomatis saat role/appUser berubah.
    const allUsers = useAdminUsers(authUser, appUser, () => setLoading(false));
    const { mySettings, masterPoints, sanctionRules } = useSharedSettings(authUser, appUser);
    const { students, journals, pointLogs } = useGuruRecords(authUser, appUser, () => setLoading(false));

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center text-slate-500 font-bold animate-pulse">
                Loading System...
            </div>
        );
    }

    return (
        <Routes>
            <Route
                path="/login"
                element={!appUser ? (
                    <Login onLogin={handleLogin} loading={loginLoading} error={loginError} />
                ) : (
                    <Navigate to="/" replace />
                )}
            />

            <Route path="/*" element={
                <ProtectedRoute user={appUser}>
                    <Layout userRole={appUser?.role} userName={appUser?.fullName} onLogout={handleLogout}>
                        {appUser?.role === 'admin' ? (
                            <AdminRoutes
                                appUser={appUser}
                                allUsers={allUsers}
                                students={students}
                                mySettings={mySettings}
                                pointLogs={pointLogs}
                                masterPoints={masterPoints}
                                sanctionRules={sanctionRules}
                                onUpdatePassword={handleUpdatePassword}
                            />
                        ) : (
                            <GuruRoutes
                                appUser={appUser}
                                students={students}
                                journals={journals}
                                pointLogs={pointLogs}
                                mySettings={mySettings}
                                masterPoints={masterPoints}
                                sanctionRules={sanctionRules}
                                onUpdatePassword={handleUpdatePassword}
                            />
                        )}
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
}
