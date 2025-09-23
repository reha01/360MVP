// src/App.jsx
// Main application component with multi-tenant context

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrgProvider, setGlobalOrgContext } from './context/OrgContext';
import { useOrg } from './context/OrgContext';
import Header from './components/Header';
import WorkspaceGuard from './components/WorkspaceGuard';
import WorkspaceSelector from './components/WorkspaceSelector';
import DebugBannerWrapper from './components/debug/DebugBannerWrapper';

// Import your existing pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Evaluation from './pages/Evaluation';
import ReportView from './pages/ReportView';
// Add other pages as needed

// Global org context setter for legacy compatibility
const OrgContextBridge = ({ children }) => {
  const orgContext = useOrg();
  
  useEffect(() => {
    setGlobalOrgContext(orgContext);
  }, [orgContext]);

  return children;
};

// Protected route wrapper
const ProtectedRoute = ({ children, requireActiveOrg = true, allowedRoles }) => {
  return (
    <WorkspaceGuard requireActiveOrg={requireActiveOrg} allowedRoles={allowedRoles}>
      {children}
    </WorkspaceGuard>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <OrgProvider>
          <OrgContextBridge>
            <div className="app">
              <Header />
              
              <main className="app-main">
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Workspace selection */}
                  <Route path="/select-workspace" element={<WorkspaceSelector />} />
                  
                  {/* Protected routes - require active workspace */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/evaluations" 
                    element={
                      <ProtectedRoute>
                        <Evaluation />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/evaluations/:id" 
                    element={
                      <ProtectedRoute>
                        <Evaluation />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/reports" 
                    element={
                      <ProtectedRoute>
                        <ReportView />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/reports/:id" 
                    element={
                      <ProtectedRoute>
                        <ReportView />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Admin routes - require owner/project_leader role */}
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'project_leader']}>
                        <div>Admin Panel (TODO: Implement)</div>
                      </ProtectedRoute>
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
          </OrgContextBridge>
        </OrgProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;