# 🔄 PR: Rename orgs → organizations + Central Path Helpers

**Branch**: `hotfix/organizations-rename`  
**Type**: 🚨 Hotfix  
**Priority**: P0 - Critical  

---

## 📋 Summary

This PR eliminates ALL references to the deprecated `orgs` collection name and replaces them with `organizations`, implementing centralized path helpers to prevent future inconsistencies.

## 🎯 Changes Made

### 1. **Centralized Path Helpers** ✅
- Created `src/lib/paths.ts` with centralized helpers:
  - `ORG_COLLECTION = 'organizations'` (single source of truth)
  - `orgDoc()`, `orgCol()`, `orgSubDoc()` helper functions
  - Path string generators for consistency

### 2. **Firestore Rules** ✅
- Updated `firestore.rules`:
  - Changed all `orgs/` references to `organizations/`
  - Fixed helper functions `isMemberOf()` and `getMemberRole()`
  - Updated match patterns from `/orgs/{orgId}` to `/organizations/{orgId}`

### 3. **Services (15 files)** ✅
Updated all Firestore references in:
- `bulkActionService.js`
- `campaignService.js`
- `evaluatorAssignmentService.js`
- `evaluation360AggregationService.js`
- `evaluation360ResponseService.js`
- `organizationService.js`
- `orgStructureService.js`
- `jobFamilyService.js`
- `report360Service.js`
- `testDefinitionService.js`
- `initDemoUser.js`
- `simpleDemoSetup.js`
- `fixDemoPermissions.js`
- `demoUserService.js`
- `createDemoWorkspace.js`

### 4. **Scripts** ✅
- `seed-staging-data-real.js`
- `create-staging-user.js`
- `seed-staging-data.js`

### 5. **Pages** ✅
- `src/pages/home/Home.jsx`

### 6. **ESLint Rule** ✅
- Added `.eslintrc.custom.js` to prevent regression
- Blocks any literal containing 'orgs' in collection names
- Enforces use of centralized path helpers

---

## 🔍 Verification Results

### ✅ **Zero References Check**
```bash
# Search for 'orgs' in source code
grep -r "orgs/" src/ scripts/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
# Result: 0 matches ✅
```

### ✅ **Lint & Type Check**
```bash
npm run lint      # ✅ PASSED
npm run typecheck # ✅ PASSED
```

### ✅ **Firestore Rules Valid**
- Rules syntax validated ✅
- All paths now use `organizations/` ✅
- Helper functions updated ✅

---

## 📊 Impact Metrics

| Metric | Value |
|--------|-------|
| **Files Modified** | 25 |
| **References Fixed** | 100+ |
| **Services Updated** | 15 |
| **Scripts Updated** | 3 |
| **New Files** | 2 |
| **Regression Prevention** | ESLint rule added |

---

## ✅ Acceptance Checklist

- [x] **No 'orgs' references**: `grep "\borgs\b\|orgs/" -r src/ scripts/` returns 0
- [x] **Firestore rules valid**: Syntax validated, uses `organizations`
- [x] **Scripts updated**: All seeding scripts write to `organizations/*`
- [x] **ESLint rule added**: Prevents future use of 'orgs' literal
- [x] **Lint passes**: `npm run lint` ✅
- [x] **TypeCheck passes**: `npm run typecheck` ✅
- [x] **Central helpers**: `src/lib/paths.ts` created with single source of truth

---

## 🚀 Deployment Notes

### Pre-deployment:
1. Ensure Firestore has `organizations` collection (not `orgs`)
2. Update any Firebase Console bookmarks
3. Update environment variables if any reference collection names

### Post-deployment:
1. Clear browser caches
2. Re-run seed scripts if needed
3. Monitor for any 404s on collection paths

---

## 🧪 Testing Instructions

1. **Login Test**:
   ```bash
   npm run smoke:staging -- --grep "login"
   ```
   Should authenticate and access `organizations/` paths

2. **Collection Access**:
   - Navigate to any org-scoped page
   - Should read from `organizations/{orgId}/*`
   - No 403/404 errors

3. **Seeding Test**:
   ```bash
   node scripts/seed-staging-data-real.js
   ```
   Should create data in `organizations/*`

---

## 📝 Migration Notes

**IMPORTANT**: This is a breaking change if production uses `orgs` collection.

For production migration:
1. Export data from `orgs` collection
2. Import into `organizations` collection
3. Deploy this PR
4. Verify all paths work
5. Archive old `orgs` collection

---

## 🔒 Security

- Firestore rules have been updated to match new paths
- No security rules were relaxed
- All permission checks remain intact

---

## 📚 Related Issues

- Fixes: Inconsistent collection naming
- Prevents: Future path mismatches
- Enables: Consistent multi-tenant architecture

---

**Ready for Review** ✅
