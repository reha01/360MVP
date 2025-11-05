/**
 * Dead Letter Queue (DLQ) Service
 * Handles failed operations and retry logic
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Alert, AlertType, AlertSeverity } from '../../models/alert.model';
import { getActiveOrgId } from '../firestore';

class DLQService {
  constructor() {
    this.collectionName = 'dlq';
    this.alertsCollectionName = 'alerts';
    this.maxRetries = 3;
    this.retryDelays = [1000, 5000, 15000]; // Exponential backoff: 1s, 5s, 15s
  }

  /**
   * Get DLQ collection reference
   */
  getDLQCollectionRef() {
    const orgId = getActiveOrgId();
    if (!orgId) throw new Error('No active organization');
    return collection(db, 'organizations', orgId, this.collectionName);
  }

  /**
   * Get alerts collection reference
   */
  getAlertsCollectionRef() {
    const orgId = getActiveOrgId();
    if (!orgId) throw new Error('No active organization');
    return collection(db, 'organizations', orgId, this.alertsCollectionName);
  }

  /**
   * Add failed item to DLQ
   */
  async addToDLQ(action, payload, error, metadata = {}) {
    try {
      const orgId = getActiveOrgId();
      
      // Create DLQ entry
      const dlqEntry = {
        orgId,
        action,
        payload,
        error: {
          message: error.message || error.toString(),
          stack: error.stack || null,
          code: error.code || null
        },
        metadata: {
          ...metadata,
          userAgent: navigator?.userAgent || null,
          timestamp: new Date().toISOString(),
          url: window?.location?.href || null
        },
        retryCount: 0,
        maxRetries: this.maxRetries,
        canRetry: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
        lastRetryAt: null,
        nextRetryAt: new Date(Date.now() + this.retryDelays[0]).toISOString()
      };

      // Save to DLQ collection
      const docRef = doc(this.getDLQCollectionRef());
      await setDoc(docRef, dlqEntry);

      // Create an alert for this DLQ entry
      const alert = Alert.createDLQAlert(orgId, action, payload, error);
      alert.sourceId = docRef.id;
      
      const alertRef = doc(this.getAlertsCollectionRef());
      await setDoc(alertRef, alert.toFirestore());

      console.log('[DLQService] Added to DLQ:', docRef.id);
      console.log('[DLQService] Created alert:', alertRef.id);

      return {
        dlqId: docRef.id,
        alertId: alertRef.id
      };
    } catch (error) {
      console.error('[DLQService] Error adding to DLQ:', error);
      // Don't throw here - we don't want DLQ failures to break the app
      return null;
    }
  }

  /**
   * Get all DLQ entries
   */
  async getDLQEntries(filters = {}) {
    try {
      let q = this.getDLQCollectionRef();

      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.action) {
        q = query(q, where('action', '==', filters.action));
      }

      if (filters.canRetry !== undefined) {
        q = query(q, where('canRetry', '==', filters.canRetry));
      }

      // Order by creation date
      q = query(q, orderBy('createdAt', 'desc'));

      // Apply limit
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const entries = [];

      querySnapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`[DLQService] Retrieved ${entries.length} DLQ entries`);
      return entries;
    } catch (error) {
      console.error('[DLQService] Error getting DLQ entries:', error);
      throw error;
    }
  }

  /**
   * Get DLQ entry by ID
   */
  async getDLQEntry(entryId) {
    try {
      const docRef = doc(this.getDLQCollectionRef(), entryId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('DLQ entry not found');
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('[DLQService] Error getting DLQ entry:', error);
      throw error;
    }
  }

  /**
   * Retry a DLQ entry
   */
  async retryDLQEntry(entryId, retryFn) {
    try {
      const entry = await this.getDLQEntry(entryId);

      if (!entry.canRetry) {
        throw new Error('Entry cannot be retried');
      }

      if (entry.retryCount >= entry.maxRetries) {
        throw new Error('Maximum retries exceeded');
      }

      console.log(`[DLQService] Retrying entry ${entryId}, attempt ${entry.retryCount + 1}`);

      // Update entry status
      await this.updateDLQEntry(entryId, {
        status: 'retrying',
        lastRetryAt: new Date().toISOString()
      });

      try {
        // Execute retry function
        const result = await retryFn(entry.payload);

        // Success - mark as resolved
        await this.resolveDLQEntry(entryId, result);
        console.log(`[DLQService] Retry successful for ${entryId}`);
        
        return {
          success: true,
          result
        };
      } catch (retryError) {
        // Retry failed
        console.error(`[DLQService] Retry failed for ${entryId}:`, retryError);
        
        const newRetryCount = entry.retryCount + 1;
        const canRetryAgain = newRetryCount < entry.maxRetries;
        
        // Update entry with new error
        await this.updateDLQEntry(entryId, {
          status: canRetryAgain ? 'pending' : 'failed',
          retryCount: newRetryCount,
          canRetry: canRetryAgain,
          lastError: {
            message: retryError.message || retryError.toString(),
            timestamp: new Date().toISOString()
          },
          nextRetryAt: canRetryAgain ? 
            new Date(Date.now() + this.retryDelays[newRetryCount]).toISOString() : 
            null
        });

        return {
          success: false,
          error: retryError,
          canRetryAgain
        };
      }
    } catch (error) {
      console.error('[DLQService] Error in retry process:', error);
      throw error;
    }
  }

  /**
   * Update DLQ entry
   */
  async updateDLQEntry(entryId, updates) {
    try {
      const docRef = doc(this.getDLQCollectionRef(), entryId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      console.log('[DLQService] Updated entry:', entryId);
    } catch (error) {
      console.error('[DLQService] Error updating entry:', error);
      throw error;
    }
  }

  /**
   * Resolve DLQ entry (mark as successful)
   */
  async resolveDLQEntry(entryId, result = null) {
    try {
      await this.updateDLQEntry(entryId, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        result,
        canRetry: false
      });

      // Update associated alert if exists
      await this.resolveAssociatedAlert(entryId);

      console.log('[DLQService] Resolved entry:', entryId);
    } catch (error) {
      console.error('[DLQService] Error resolving entry:', error);
      throw error;
    }
  }

  /**
   * Resolve associated alert
   */
  async resolveAssociatedAlert(dlqEntryId) {
    try {
      const alertsRef = this.getAlertsCollectionRef();
      const q = query(alertsRef, where('sourceId', '==', dlqEntryId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const alertDoc = snapshot.docs[0];
        await updateDoc(doc(alertsRef, alertDoc.id), {
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          notes: [...(alertDoc.data().notes || []), {
            text: 'Resolved via DLQ retry',
            timestamp: new Date().toISOString()
          }]
        });
        console.log('[DLQService] Resolved associated alert:', alertDoc.id);
      }
    } catch (error) {
      console.error('[DLQService] Error resolving associated alert:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Delete DLQ entry
   */
  async deleteDLQEntry(entryId) {
    try {
      const docRef = doc(this.getDLQCollectionRef(), entryId);
      await deleteDoc(docRef);
      console.log('[DLQService] Deleted entry:', entryId);
    } catch (error) {
      console.error('[DLQService] Error deleting entry:', error);
      throw error;
    }
  }

  /**
   * Clear resolved entries (cleanup)
   */
  async clearResolvedEntries() {
    try {
      const q = query(this.getDLQCollectionRef(), where('status', '==', 'resolved'));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);
      console.log(`[DLQService] Cleared ${snapshot.size} resolved entries`);
      
      return snapshot.size;
    } catch (error) {
      console.error('[DLQService] Error clearing resolved entries:', error);
      throw error;
    }
  }

  /**
   * Get DLQ statistics
   */
  async getDLQStats() {
    try {
      const entries = await this.getDLQEntries();
      
      const stats = {
        total: entries.length,
        pending: entries.filter(e => e.status === 'pending').length,
        retrying: entries.filter(e => e.status === 'retrying').length,
        resolved: entries.filter(e => e.status === 'resolved').length,
        failed: entries.filter(e => e.status === 'failed').length,
        canRetry: entries.filter(e => e.canRetry).length,
        byAction: {}
      };

      // Group by action
      entries.forEach(entry => {
        if (!stats.byAction[entry.action]) {
          stats.byAction[entry.action] = 0;
        }
        stats.byAction[entry.action]++;
      });

      return stats;
    } catch (error) {
      console.error('[DLQService] Error getting DLQ stats:', error);
      throw error;
    }
  }

  /**
   * Process pending retries (called periodically)
   */
  async processPendingRetries(retryHandlers = {}) {
    try {
      const now = new Date().toISOString();
      const q = query(
        this.getDLQCollectionRef(),
        where('status', '==', 'pending'),
        where('canRetry', '==', true),
        where('nextRetryAt', '<=', now)
      );

      const snapshot = await getDocs(q);
      console.log(`[DLQService] Found ${snapshot.size} entries ready for retry`);

      const retryPromises = snapshot.docs.map(async (doc) => {
        const entry = { id: doc.id, ...doc.data() };
        const handler = retryHandlers[entry.action];
        
        if (handler) {
          return this.retryDLQEntry(entry.id, handler);
        } else {
          console.warn(`[DLQService] No handler for action: ${entry.action}`);
          return null;
        }
      });

      const results = await Promise.allSettled(retryPromises);
      
      const summary = {
        total: results.length,
        successful: results.filter(r => r.status === 'fulfilled' && r.value?.success).length,
        failed: results.filter(r => r.status === 'rejected' || !r.value?.success).length
      };

      console.log('[DLQService] Retry processing complete:', summary);
      return summary;
    } catch (error) {
      console.error('[DLQService] Error processing pending retries:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new DLQService();
