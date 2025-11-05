/**
 * Campaign Service
 * Handles all campaign-related operations
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
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Campaign, CampaignStatus } from '../../models/campaign.model';
import { getActiveOrgId } from '../firestore';

class CampaignService {
  constructor() {
    this.collectionName = 'campaigns';
  }

  /**
   * Get campaigns collection reference for current org
   */
  getCollectionRef() {
    const orgId = getActiveOrgId();
    if (!orgId) throw new Error('No active organization');
    return collection(db, 'organizations', orgId, this.collectionName);
  }

  /**
   * Create a new campaign
   */
  async createCampaign(campaignData) {
    try {
      const orgId = getActiveOrgId();
      if (!orgId) throw new Error('No active organization');

      const campaign = new Campaign({
        ...campaignData,
        orgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Validate
      const validation = campaign.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Create document
      const docRef = doc(this.getCollectionRef());
      await setDoc(docRef, campaign.toFirestore());

      campaign.id = docRef.id;
      console.log('[CampaignService] Campaign created:', docRef.id);
      return campaign;
    } catch (error) {
      console.error('[CampaignService] Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId) {
    try {
      const docRef = doc(this.getCollectionRef(), campaignId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Campaign not found');
      }

      return Campaign.fromFirestore(docSnap);
    } catch (error) {
      console.error('[CampaignService] Error getting campaign:', error);
      throw error;
    }
  }

  /**
   * Get all campaigns for current org
   */
  async getCampaigns(filters = {}) {
    try {
      let q = this.getCollectionRef();

      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }

      // Order by creation date
      q = query(q, orderBy('createdAt', 'desc'));

      // Apply limit
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const campaigns = [];

      querySnapshot.forEach((doc) => {
        campaigns.push(Campaign.fromFirestore(doc));
      });

      console.log(`[CampaignService] Retrieved ${campaigns.length} campaigns`);
      return campaigns;
    } catch (error) {
      console.error('[CampaignService] Error getting campaigns:', error);
      throw error;
    }
  }

  /**
   * Get active campaigns
   */
  async getActiveCampaigns() {
    return this.getCampaigns({ status: CampaignStatus.ACTIVE });
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId, updates) {
    try {
      const docRef = doc(this.getCollectionRef(), campaignId);
      
      // Add updated timestamp
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(docRef, updateData);
      console.log('[CampaignService] Campaign updated:', campaignId);
      
      return await this.getCampaignById(campaignId);
    } catch (error) {
      console.error('[CampaignService] Error updating campaign:', error);
      throw error;
    }
  }

  /**
   * Update campaign metrics
   */
  async updateCampaignMetrics(campaignId, metrics) {
    try {
      const docRef = doc(this.getCollectionRef(), campaignId);
      
      await updateDoc(docRef, {
        metrics: {
          ...metrics,
          lastUpdated: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      });

      console.log('[CampaignService] Metrics updated for campaign:', campaignId);
    } catch (error) {
      console.error('[CampaignService] Error updating metrics:', error);
      throw error;
    }
  }

  /**
   * Change campaign status
   */
  async changeCampaignStatus(campaignId, newStatus) {
    try {
      await this.updateCampaign(campaignId, { status: newStatus });
      console.log(`[CampaignService] Campaign ${campaignId} status changed to ${newStatus}`);
    } catch (error) {
      console.error('[CampaignService] Error changing status:', error);
      throw error;
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId) {
    try {
      const docRef = doc(this.getCollectionRef(), campaignId);
      await deleteDoc(docRef);
      console.log('[CampaignService] Campaign deleted:', campaignId);
    } catch (error) {
      console.error('[CampaignService] Error deleting campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId) {
    try {
      const campaign = await this.getCampaignById(campaignId);
      
      // Calculate additional stats
      const stats = {
        ...campaign.metrics,
        progress: campaign.getProgress(),
        responseRate: campaign.getResponseRate(),
        isActive: campaign.isActive(),
        daysRemaining: campaign.endDate ? 
          Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
      };

      return stats;
    } catch (error) {
      console.error('[CampaignService] Error getting campaign stats:', error);
      throw error;
    }
  }

  /**
   * Batch update multiple campaigns
   */
  async batchUpdateCampaigns(campaignIds, updates) {
    try {
      const batch = writeBatch(db);
      const orgId = getActiveOrgId();

      campaignIds.forEach(campaignId => {
        const docRef = doc(db, 'organizations', orgId, this.collectionName, campaignId);
        batch.update(docRef, {
          ...updates,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      console.log(`[CampaignService] Batch updated ${campaignIds.length} campaigns`);
    } catch (error) {
      console.error('[CampaignService] Error in batch update:', error);
      throw error;
    }
  }

  /**
   * Get campaigns with assignments count
   */
  async getCampaignsWithAssignments() {
    try {
      const campaigns = await this.getCampaigns();
      const orgId = getActiveOrgId();
      
      // For each campaign, get assignment count
      const campaignsWithCounts = await Promise.all(
        campaigns.map(async (campaign) => {
          const assignmentsRef = collection(
            db, 
            'organizations', 
            orgId, 
            'assignments'
          );
          
          const q = query(assignmentsRef, where('campaignId', '==', campaign.id));
          const snapshot = await getDocs(q);
          
          return {
            ...campaign,
            assignmentCount: snapshot.size
          };
        })
      );

      return campaignsWithCounts;
    } catch (error) {
      console.error('[CampaignService] Error getting campaigns with assignments:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new CampaignService();
