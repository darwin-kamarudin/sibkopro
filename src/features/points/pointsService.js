import { addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '../../common/config/firebase';

export const addPointLog = (teacherId, data) =>
    addDoc(collection(db, 'point_logs'), { ...data, teacherId });

export const updatePointLog = (id, data) =>
    updateDoc(doc(db, 'point_logs', id), data);

export const deletePointLog = (id) =>
    deleteDoc(doc(db, 'point_logs', id));
