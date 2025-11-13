// src/services/memberImportService.js
// Helper functions for member import pipeline (Sprint 7)

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  limit as limitQuery,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';

import { app, db } from './firebase';

const MEMBER_IMPORT_PREFIX = 'uploads';

// Usar el bucket por defecto de Firebase (ya configurado en firebase.js)
// Las reglas de Storage están configuradas para permitir uploads autenticados
const memberImportStorage = getStorage(app);

const ensureCsvFile = (file) => {
  if (!file) {
    throw new Error('Selecciona un archivo para continuar.');
  }

  const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (!allowedTypes.includes(file.type) && fileExtension !== 'csv') {
    throw new Error('El archivo debe estar en formato CSV (.csv).');
  }
};

const generateJobId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `job_${Date.now()}`;
};

export const uploadMemberCsv = async (orgId, file, { uploadedBy, uploaderEmail } = {}) => {
  if (!orgId) {
    throw new Error('No se encontró la organización activa.');
  }

  ensureCsvFile(file);

  const jobId = generateJobId();
  const sanitizedName = file.name ? file.name.replace(/\s+/g, '_') : 'members.csv';
  const storagePath = `${MEMBER_IMPORT_PREFIX}/${orgId}/member_imports/${jobId}/${sanitizedName}`;

  const metadata = {
    contentType: 'text/csv',
    customMetadata: {
      orgId,
      jobId,
      uploadedBy: uploadedBy || '',
      uploaderEmail: uploaderEmail || '',
      originalFilename: file.name || '',
    },
  };

  const fileRef = ref(memberImportStorage, storagePath);
  await uploadBytes(fileRef, file, metadata);

  return {
    jobId,
    storagePath,
  };
};

export const createImportJob = async (
  orgId,
  { jobId, storagePath, originalFilename, uploadedBy, uploaderEmail }
) => {
  if (!orgId || !jobId) {
    throw new Error('Faltan datos para crear el registro de importación.');
  }

  const jobsRef = collection(db, 'organizations', orgId, 'importJobs');
  const jobRef = doc(jobsRef, jobId);
  const timestamp = serverTimestamp();

  await setDoc(
    jobRef,
    {
      status: 'pending',
      storagePath,
      originalFilename: originalFilename || 'members.csv',
      uploadedBy: uploadedBy || '',
      uploaderEmail: uploaderEmail || '',
      createdAt: timestamp,
      updatedAt: timestamp,
      summary: {
        total: 0,
        created: 0,
        updated: 0,
        failed: 0,
      },
      failedRows: [],
      hasErrors: false,
    },
    { merge: true }
  );

  return jobRef.id;
};

export const subscribeToImportJobs = (orgId, callback, maxEntries = 5) => {
  if (!orgId) {
    return () => {};
  }

  const jobsRef = collection(db, 'organizations', orgId, 'importJobs');
  const jobsQuery = query(jobsRef, orderBy('createdAt', 'desc'), limitQuery(maxEntries));

  return onSnapshot(
    jobsQuery,
    (snapshot) => {
      const jobs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      callback(jobs);
    },
    (error) => {
      console.error('[memberImportService] Error escuchando importJobs:', error);
      callback([]);
    }
  );
};

export const subscribeToImportJob = (orgId, jobId, callback) => {
  if (!orgId || !jobId) {
    callback(null);
    return () => {};
  }

  const jobRef = doc(db, 'organizations', orgId, 'importJobs', jobId);

  return onSnapshot(
    jobRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },
    (error) => {
      console.error('[memberImportService] Error escuchando importJob:', error);
      callback(null);
    }
  );
};

export default {
  uploadMemberCsv,
  createImportJob,
  listenToImportJobs: subscribeToImportJobs,
  listenToSingleImportJob: subscribeToImportJob
};
