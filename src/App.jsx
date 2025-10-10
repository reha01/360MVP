// src/App.jsx
// Main application component with multi-tenant context

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrgProvider } from './context/OrgContext';
import Header from './components/Header';
import WorkspaceGuard from './components/WorkspaceGuard';
import WorkspaceSelector from './components/WorkspaceSelector';
import AuthProtectedRoute from './components/ProtectedRoute';
import DebugBannerWrapper from './components/debug/DebugBannerWrapper';

// Import your existing pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Evaluation from './pages/Evaluation';
import ReportView from './pages/ReportView';
import TestsAdmin from './pages/admin/TestsAdmin';
import { TEST_CATALOG } from './lib/featureFlags';
// Add other pages as needed

// Workspace-protected route wrapper (requires auth + workspace)
const WorkspaceProtectedRoute = ({ children, requireActiveOrg = true, allowedRoles }) => {
  return (
    <AuthProtectedRoute>
      <WorkspaceGuard requireActiveOrg={requireActiveOrg} allowedRoles={allowedRoles}>
        {children}
      </WorkspaceGuard>
    </AuthProtectedRoute>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <OrgProvider>
          <div className="app">
              <Header />
              
              <main className="app-main">
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Workspace selection - requires auth only */}
                  <Route 
                    path="/select-workspace" 
                    element={
                      <AuthProtectedRoute>
                        <WorkspaceSelector />
                      </AuthProtectedRoute>
                    } 
                  />
                  
                  {/* Protected routes - require auth + workspace */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <WorkspaceProtectedRoute>
                        <Dashboard />
                      </WorkspaceProtectedRoute>
                    } 
                  />
                  
                  {/* Evaluations - con soporte para routing dinámico */}
                  <Route 
                    path="/evaluations" 
                    element={
                      <WorkspaceProtectedRoute>
                        <Evaluation />
                      </WorkspaceProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/evaluations/:testId/:version" 
                    element={
                      <WorkspaceProtectedRoute>
                        <Evaluation />
                      </WorkspaceProtectedRoute>
                    } 
                  />
                  
                  {/* Legacy route compatibility */}
                  <Route 
                    path="/evaluations/:id" 
                    element={
                      <WorkspaceProtectedRoute>
                        <Evaluation />
                      </WorkspaceProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/reports" 
                    element={
                      <WorkspaceProtectedRoute>
                        <ReportView />
                      </WorkspaceProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/reports/:id" 
                    element={
                      <WorkspaceProtectedRoute>
                        <ReportView />
                      </WorkspaceProtectedRoute>
                    } 
                  />
                  
                  {/* Admin routes - require auth + workspace + role */}
                  {TEST_CATALOG && (
                    <>
                      <Route 
                        path="/admin/tests" 
                        element={
                          <WorkspaceProtectedRoute allowedRoles={['owner', 'admin']}>
                            <TestsAdmin />
                          </WorkspaceProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/admin/tests/new" 
                        element={
                          <WorkspaceProtectedRoute allowedRoles={['owner', 'admin']}>
                            <TestsAdmin mode="create" />
                          </WorkspaceProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/admin/tests/:testId/edit" 
                        element={
                          <WorkspaceProtectedRoute allowedRoles={['owner', 'admin']}>
                            <TestsAdmin mode="edit" />
                          </WorkspaceProtectedRoute>
                        } 
                      />
                    </>
                  )}
                  
                  <Route 
                    path="/admin" 
                    element={
                      <WorkspaceProtectedRoute allowedRoles={['owner', 'admin']}>
                        <div>Admin Panel (TODO: Implement)</div>
                      </WorkspaceProtectedRoute>
                    } 
                  />
                  
                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* 404 */}
                  <Route path="*" element={
                    <div className="not-found">
                      <h1>Page Not Found</h1>
                      <p>The page you're looking for doesn't exist.</p>
                      <a href="/dashboard">Go to Dashboard</a>
                    </div>
                  } />
                </Routes>
              </main>
              
              {/* Debug Banner - only visible in development or when DEBUG=1 */}
              <DebugBannerWrapper />
            </div>
        </OrgProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;