import { addDoc, updateDoc, deleteDoc, doc, writeBatch, collection } from 'firebase/firestore';
import { db, getCollectionRef } from '../../common/config/firebase';
import { COLLECTION_PATHS } from '../../common/utils/constants';

export const addStudent = (teacherId, data) =>
    addDoc(getCollectionRef(COLLECTION_PATHS.students), {
        ...data,
        teacherId,
        createdAt: new Date().toISOString(),
    });

export const updateStudent = (id, data) =>
    updateDoc(doc(getCollectionRef(COLLECTION_PATHS.students), id), data);

export const deleteStudent = (id) =>
    deleteDoc(doc(getCollectionRef(COLLECTION_PATHS.students), id));

export const importStudents = (teacherId, list) => {
    const batch = writeBatch(db);
    list.forEach(s => batch.set(doc(collection(db, COLLECTION_PATHS.students)), {
        ...s,
        teacherId,
        createdAt: new Date().toISOString(),
    }));
    return batch.commit().then(() => alert("Import Berhasil"));
};

export const moveStudentsClass = (ids, cls) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.update(doc(getCollectionRef(COLLECTION_PATHS.students), id), { class: cls }));
    return batch.commit().then(() => alert("Pindah Kelas Berhasil"));
};
