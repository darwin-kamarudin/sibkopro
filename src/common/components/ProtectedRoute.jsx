import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ user, children }) => {
    const location = useLocation();

    // Logika: Jika user tidak ada (null/false), lempar ke login
    if (!user) {
        // 'state={{ from: location }}' berguna agar setelah login sukses, 
        // kita bisa mengembalikan user ke halaman yang tadi mereka coba buka.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Jika user ada, render halaman (children)
    return children;
};

export default ProtectedRoute;