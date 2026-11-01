// src/utils/helpers.js

export const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    try {
        if (dateString && typeof dateString === 'object' && dateString.seconds) {
            return new Date(dateString.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
};

export const parseImportDate = (dateStr) => {
    if (!dateStr) return '';
    const cleanStr = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;

    const monthsIndo = {
        'januari': '01', 'februari': '02', 'maret': '03', 'april': '04', 'mei': '05', 'juni': '06',
        'juli': '07', 'agustus': '08', 'september': '09', 'oktober': '10', 'november': '11', 'desember': '12',
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'jun': '06',
        'jul': '07', 'agu': '08', 'sep': '09', 'okt': '10', 'nov': '11', 'des': '12',
        'agust': '08'
    };

    const parts = cleanStr.split(/[\s\-\/]+/);
    if (parts.length === 3) {
        let day, month, year;
        if (parts[0].length === 4) { year = parts[0]; month = parts[1]; day = parts[2]; } 
        else { day = parts[0]; month = parts[1]; year = parts[2]; }

        if (isNaN(month)) {
            const monthLower = month.toLowerCase();
            if (monthsIndo[monthLower]) month = monthsIndo[monthLower];
            else return '';
        }
        day = day.padStart(2, '0');
        month = month.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return '';
};

export const generateCredentials = (name) => {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toLowerCase().substring(0, 6);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const username = `${cleanName}${randNum}`;
    const password = Math.random().toString(36).slice(-8); 
    return { username, password };
};

export const calculateExpiry = (days) => {
    if (parseInt(days) === -1) return null; 
    const date = new Date();
    date.setDate(date.getDate() + parseInt(days));
    return date.toISOString();
};