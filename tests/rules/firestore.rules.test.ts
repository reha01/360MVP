// tests/rules/firestore.rules.test.ts
// Firestore Security Rules v1 Tests - Multi-organization and roles

import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';

// Test environment setup
let testEnv: any;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'rules-test',
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{db}/documents {
            function isActiveMember(orgId) {
              return request.auth != null
                     && exists(/databases/$(db)/documents/organization_members/$(orgId + ':' + request.auth.uid))
                     && get(/databases/$(db)/documents/organization_members/$(orgId + ':' + request.auth.uid)).data.status == 'active';
            }
            
            function hasRole(orgId, allowedRoles) {
              return isActiveMember(orgId)
                     && get(/databases/$(db)/documents/organization_members/$(orgId + ':' + request.auth.uid)).data.role in allowedRoles;
            }

            // Orgs (metadatos)
            match /organizations/{orgId} {
              allow read: if isActiveMember(orgId);
              allow create, update, delete: if hasRole(orgId, ['owner','admin']);
            }

            // Subcolecciones bajo org (evaluations, reports, etc.)
            match /organizations/{orgId}/{collection}/{docId} {
              allow read: if isActiveMember(orgId);
              allow create: if hasRole(orgId, ['owner','admin','member']);
              allow update, delete: if hasRole(orgId, ['owner','admin']);
            }

            // Colección plana de memberships (solo admins/owners)
            match /organization_members/{membershipId} {
              allow read: if request.auth != null
                          && resource.data.user_id == request.auth.uid;
              allow create, update, delete: if request.auth != null
                          && request.resource.data.role in ['owner','admin'];
            }

            // Denegar todo lo no contemplado
            match /{document=**} { allow read, write: if false; }
          }
        }
      `,
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

// Test data setup
const orgId = 'org_demo';
const ownerUid = 'owner_user_123';
const memberUid = 'member_user_456';
const viewerUid = 'viewer_user_789';
const extUserUid = 'external_user_999';

describe('Firestore Security Rules v1 - Multi-organization', () => {
  
  beforeEach(async () => {
    // Clear all data before each test
    await testEnv.clearFirestore();
    
    // Seed test data
    await testEnv.withSecurityRulesDisabled(async (context: any) => {
      const db = context.firestore();
      
      // Create organization
      await setDoc(doc(db, 'organizations', orgId), {
        id: orgId,
        name: 'Demo Organization',
        displayName: 'Demo Corp',
        type: 'corporate',
        createdAt: new Date(),
      });
      
      // Create memberships (using both field variations for compatibility)
      await setDoc(doc(db, 'organization_members', `${orgId}:${ownerUid}`), {
        orgId: orgId,
        org_id: orgId, // Both fields for compatibility
        userId: ownerUid,
        user_id: ownerUid, // Both fields for compatibility
        role: 'owner',
        status: 'active',
        createdAt: new Date(),
      });
      
      await setDoc(doc(db, 'organization_members', `${orgId}:${memberUid}`), {
        orgId: orgId,
        org_id: orgId, // Both fields for compatibility
        userId: memberUid,
        user_id: memberUid, // Both fields for compatibility
        role: 'member',
        status: 'active',
        createdAt: new Date(),
      });
      
      await setDoc(doc(db, 'organization_members', `${orgId}:${viewerUid}`), {
        orgId: orgId,
        org_id: orgId, // Both fields for compatibility
        userId: viewerUid,
        user_id: viewerUid, // Both fields for compatibility
        role: 'viewer',
        status: 'active',
        createdAt: new Date(),
      });
      
      // Create test documents in subcollections
      await setDoc(doc(db, 'organizations', orgId, 'evaluations', 'e1'), {
        id: 'e1',
        title: 'Test Evaluation',
        orgId: orgId,
        createdBy: ownerUid,
        createdAt: new Date(),
      });
      
      await setDoc(doc(db, 'organizations', orgId, 'reports', 'r1'), {
        id: 'r1',
        title: 'Test Report',
        orgId: orgId,
        createdBy: ownerUid,
        createdAt: new Date(),
      });
    });
  });

  describe('Organization Access', () => {
    test('Owner can read organization metadata', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      await assertSucceeds(getDoc(doc(db, 'organizations', orgId)));
    });

    test('Member can read organization metadata', async () => {
      const memberContext = testEnv.authenticatedContext(memberUid);
      const db = memberContext.firestore();
      
      await assertSucceeds(getDoc(doc(db, 'organizations', orgId)));
    });

    test('Viewer can read organization metadata', async () => {
      const viewerContext = testEnv.authenticatedContext(viewerUid);
      const db = viewerContext.firestore();
      
      await assertSucceeds(getDoc(doc(db, 'organizations', orgId)));
    });

    test('External user cannot read organization metadata', async () => {
      const extContext = testEnv.authenticatedContext(extUserUid);
      const db = extContext.firestore();
      
      await assertFails(getDoc(doc(db, 'organizations', orgId)));
    });

    test('Owner can update organization metadata', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      await assertSucceeds(updateDoc(doc(db, 'organizations', orgId), {
        displayName: 'Updated Demo Corp',
      }));
    });

    test('Member cannot update organization metadata', async () => {
      const memberContext = testEnv.authenticatedContext(memberUid);
      const db = memberContext.firestore();
      
      await assertFails(updateDoc(doc(db, 'organizations', orgId), {
        displayName: 'Hacked Name',
      }));
    });

    test('Viewer cannot update organization metadata', async () => {
      const viewerContext = testEnv.authenticatedContext(viewerUid);
      const db = viewerContext.firestore();
      
      await assertFails(updateDoc(doc(db, 'organizations', orgId), {
        displayName: 'Hacked Name',
      }));
    });
  });

  describe('Subcollection Access (evaluations)', () => {
    test('Owner can read evaluations', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      await assertSucceeds(getDoc(doc(db, 'organizations', orgId, 'evaluations', 'e1')));
    });

    test('Member can read evaluations', async () => {
      const memberContext = testEnv.authenticatedContext(memberUid);
      const db = memberContext.firestore();
      
      await assertSucceeds(getDoc(doc(db, 'organizations', orgId, 'evaluations', 'e1')));
    });

    test('Viewer can read evaluations', async () => {
      const viewerContext = testEnv.authenticatedContext(viewerUid);
      const db = viewerContext.firestore();
      
      await assertSucceeds(getDoc(doc(db, 'organizations', orgId, 'evaluations', 'e1')));
    });

    test('External user cannot read evaluations', async () => {
      const extContext = testEnv.authenticatedContext(extUserUid);
      const db = extContext.firestore();
      
      await assertFails(getDoc(doc(db, 'organizations', orgId, 'evaluations', 'e1')));
    });

    test('Owner can create evaluations', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      await assertSucceeds(setDoc(doc(db, 'organizations', orgId, 'evaluations', 'e2'), {
        id: 'e2',
        title: 'New Evaluation',
        orgId: orgId,
        createdBy: ownerUid,
        createdAt: new Date(),
      }));
    });

    test('Member can create evaluations', async () => {
      const memberContext = testEnv.authenticatedContext(memberUid);
      const db = memberContext.firestore();
      
      await assertSucceeds(setDoc(doc(db, 'organizations', orgId, 'evaluations', 'e3'), {
        id: 'e3',
        title: 'Member Evaluation',
        orgId: orgId,
        createdBy: memberUid,
        createdAt: new Date(),
      }));
    });

    test('Viewer cannot create evaluations', async () => {
      const viewerContext = testEnv.authenticatedContext(viewerUid);
      const db = viewerContext.firestore();
      
      await assertFails(setDoc(doc(db, 'organizations', orgId, 'evaluations', 'e4'), {
        id: 'e4',
        title: 'Viewer Evaluation',
        orgId: orgId,
        createdBy: viewerUid,
        createdAt: new Date(),
      }));
    });

    test('Owner can update evaluations', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      await assertSucceeds(updateDoc(doc(db, 'organizations', orgId, 'evaluations', 'e1'), {
        title: 'Updated Evaluation',
      }));
    });

    test('Member cannot update evaluations', async () => {
      const memberContext = testEnv.authenticatedContext(memberUid);
      const db = memberContext.firestore();
      
      await assertFails(updateDoc(doc(db, 'organizations', orgId, 'evaluations', 'e1'), {
        title: 'Hacked Evaluation',
      }));
    });

    test('Viewer cannot update evaluations', async () => {
      const viewerContext = testEnv.authenticatedContext(viewerUid);
      const db = viewerContext.firestore();
      
      await assertFails(updateDoc(doc(db, 'organizations', orgId, 'evaluations', 'e1'), {
        title: 'Hacked Evaluation',
      }));
    });
  });

  describe('Subcollection Access (reports)', () => {
    test('Owner can read reports', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      await assertSucceeds(getDoc(doc(db, 'organizations', orgId, 'reports', 'r1')));
    });

    test('Member can read reports', async () => {
      const memberContext = testEnv.authenticatedContext(memberUid);
      const db = memberContext.firestore();
      
      await assertSucceeds(getDoc(doc(db, 'organizations', orgId, 'reports', 'r1')));
    });

    test('Viewer can read reports', async () => {
      const viewerContext = testEnv.authenticatedContext(viewerUid);
      const db = viewerContext.firestore();
      
      await assertSucceeds(getDoc(doc(db, 'organizations', orgId, 'reports', 'r1')));
    });

    test('External user cannot read reports', async () => {
      const extContext = testEnv.authenticatedContext(extUserUid);
      const db = extContext.firestore();
      
      await assertFails(getDoc(doc(db, 'organizations', orgId, 'reports', 'r1')));
    });

    test('Member can create reports', async () => {
      const memberContext = testEnv.authenticatedContext(memberUid);
      const db = memberContext.firestore();
      
      await assertSucceeds(setDoc(doc(db, 'organizations', orgId, 'reports', 'r2'), {
        id: 'r2',
        title: 'Member Report',
        orgId: orgId,
        createdBy: memberUid,
        createdAt: new Date(),
      }));
    });

    test('Viewer cannot create reports', async () => {
      const viewerContext = testEnv.authenticatedContext(viewerUid);
      const db = viewerContext.firestore();
      
      await assertFails(setDoc(doc(db, 'organizations', orgId, 'reports', 'r3'), {
        id: 'r3',
        title: 'Viewer Report',
        orgId: orgId,
        createdBy: viewerUid,
        createdAt: new Date(),
      }));
    });
  });

  describe('Membership Management', () => {
    test('User can read their own membership', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      await assertSucceeds(getDoc(doc(db, 'organization_members', `${orgId}:${ownerUid}`)));
    });

    test('User cannot read other users memberships', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      await assertFails(getDoc(doc(db, 'organization_members', `${orgId}:${memberUid}`)));
    });

    test('Owner can create new memberships', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      await assertSucceeds(setDoc(doc(db, 'organization_members', `${orgId}:new_user_123`), {
        orgId: orgId,
        org_id: orgId, // Both fields for compatibility
        userId: 'new_user_123',
        user_id: 'new_user_123', // Both fields for compatibility
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
      }));
    });

    test('Member cannot create new memberships', async () => {
      const memberContext = testEnv.authenticatedContext(memberUid);
      const db = memberContext.firestore();
      
      await assertFails(setDoc(doc(db, 'organization_members', `${orgId}:new_user_456`), {
        orgId: orgId,
        org_id: orgId, // Both fields for compatibility
        userId: 'new_user_456',
        user_id: 'new_user_456', // Both fields for compatibility
        role: 'member',
        status: 'active',
        createdAt: new Date(),
      }));
    });

    test('Viewer cannot create new memberships', async () => {
      const viewerContext = testEnv.authenticatedContext(viewerUid);
      const db = viewerContext.firestore();
      
      await assertFails(setDoc(doc(db, 'organization_members', `${orgId}:new_user_789`), {
        orgId: orgId,
        org_id: orgId, // Both fields for compatibility
        userId: 'new_user_789',
        user_id: 'new_user_789', // Both fields for compatibility
        role: 'member',
        status: 'active',
        createdAt: new Date(),
      }));
    });
  });

  describe('Cross-Organization Access', () => {
    test('User cannot access other organization data', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      // Try to access a different organization
      await assertFails(getDoc(doc(db, 'organizations', 'other_org')));
    });

    test('User cannot access other organization subcollections', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      // Try to access a different organization's evaluations
      await assertFails(getDoc(doc(db, 'organizations', 'other_org', 'evaluations', 'e1')));
    });
  });
});

    });

    test('User cannot access other organization subcollections', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      // Try to access a different organization's evaluations
      await assertFails(getDoc(doc(db, 'organizations', 'other_org', 'evaluations', 'e1')));
    });
  });
});

    });

    test('User cannot access other organization subcollections', async () => {
      const ownerContext = testEnv.authenticatedContext(ownerUid);
      const db = ownerContext.firestore();
      
      // Try to access a different organization's evaluations
      await assertFails(getDoc(doc(db, 'organizations', 'other_org', 'evaluations', 'e1')));
    });
  });
});
