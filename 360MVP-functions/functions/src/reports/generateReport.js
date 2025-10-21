// 360MVP-functions/functions/src/reports/generateReport.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ReportGenerator = require('./reportGenerator');

/**
 * Cloud Function para generar reportes
 */
exports.generateReport = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { evaluationId, type = 'individual', forceRegenerate = false } = data;

  if (!evaluationId) {
    throw new functions.https.HttpsError('invalid-argument', 'evaluationId is required.');
  }

  const db = admin.firestore();
  const userId = context.auth.uid;

  try {
    // Verificar que el usuario tiene acceso a esta evaluación
    const evaluationDoc = await db.collection('evaluations').doc(evaluationId).get();
    
    if (!evaluationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Evaluation not found.');
    }

    const evaluation = evaluationDoc.data();
    
    // Verificar permisos
    if (evaluation.userId !== userId && !evaluation.participants?.includes(userId)) {
      throw new functions.https.HttpsError('permission-denied', 'You do not have access to this evaluation.');
    }

    // Verificar si ya existe un reporte y no se está forzando regeneración
    if (evaluation.reportId && !forceRegenerate) {
      const existingReport = await db.collection('reports').doc(evaluation.reportId).get();
      if (existingReport.exists) {
        return {
          success: true,
          reportId: evaluation.reportId,
          cached: true,
          message: 'Report already exists'
        };
      }
    }

    // Obtener plan del usuario
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();
    const plan = user.plan || 'gratuito';

    // Generar el reporte
    const reportGenerator = new ReportGenerator();
    const result = await reportGenerator.generateReport(evaluationId, {
      type,
      plan,
      includeNarrative: true,
      includeBenchmarks: plan === 'premium',
      includeRecommendations: plan === 'premium'
    });

    // Log del evento
    await db.collection('reportEvents').add({
      reportId: result.reportId,
      evaluationId,
      userId,
      type,
      plan,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      forceRegenerate
    });

    return {
      success: true,
      reportId: result.reportId,
      cached: false,
      message: 'Report generated successfully'
    };

  } catch (error) {
    console.error('Error generating report:', error);
    throw new functions.https.HttpsError('internal', `Failed to generate report: ${error.message}`);
  }
});

/**
 * Cloud Function para obtener un reporte
 */
exports.getReport = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { reportId } = data;

  if (!reportId) {
    throw new functions.https.HttpsError('invalid-argument', 'reportId is required.');
  }

  const db = admin.firestore();
  const userId = context.auth.uid;

  try {
    // Obtener el reporte
    const reportDoc = await db.collection('reports').doc(reportId).get();
    
    if (!reportDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Report not found.');
    }

    const report = reportDoc.data();
    
    // Verificar permisos
    if (report.metadata.userId !== userId) {
      // Verificar si es parte de un proceso organizacional
      const hasAccess = await checkOrganizationalAccess(userId, report.metadata.evaluationId, db);
      if (!hasAccess) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have access to this report.');
      }
    }

    // Incrementar contador de vistas
    await db.collection('reports').doc(reportId).update({
      viewCount: admin.firestore.FieldValue.increment(1),
      lastViewedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      report
    };

  } catch (error) {
    console.error('Error getting report:', error);
    throw new functions.https.HttpsError('internal', `Failed to get report: ${error.message}`);
  }
});

/**
 * Cloud Function para listar reportes del usuario
 */
exports.listReports = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { limit = 10, startAfter = null, type = null } = data;
  const db = admin.firestore();
  const userId = context.auth.uid;

  try {
    let query = db.collection('reports')
      .where('metadata.userId', '==', userId)
      .orderBy('generatedAt', 'desc')
      .limit(limit);

    if (type) {
      query = query.where('type', '==', type);
    }

    if (startAfter) {
      const startDoc = await db.collection('reports').doc(startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.get();
    const reports = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        type: data.type,
        plan: data.plan,
        generatedAt: data.generatedAt,
        metadata: {
          userName: data.metadata.userName,
          evaluationType: data.metadata.evaluationType,
          globalScore: data.metrics.globalScore
        }
      });
    });

    return {
      success: true,
      reports,
      hasMore: reports.length === limit
    };

  } catch (error) {
    console.error('Error listing reports:', error);
    throw new functions.https.HttpsError('internal', `Failed to list reports: ${error.message}`);
  }
});

/**
 * Verifica si el usuario tiene acceso organizacional
 */
async function checkOrganizationalAccess(userId, evaluationId, db) {
  try {
    // Verificar si el usuario es líder de un proceso que incluye esta evaluación
    const processesSnapshot = await db.collection('processes')
      .where('leaderId', '==', userId)
      .get();

    for (const doc of processesSnapshot.docs) {
      const process = doc.data();
      if (process.evaluations && process.evaluations.includes(evaluationId)) {
        return true;
      }
    }

    // Verificar si el usuario es administrador del tenant
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const user = userDoc.data();
      if (user.role === 'admin' || user.role === 'leader') {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking organizational access:', error);
    return false;
  }
}











