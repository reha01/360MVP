// src/router.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ROUTES } from './constants/routes.js';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import AuthGuard from './components/AuthGuard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FeatureAwareEvaluation from './pages/FeatureAwareEvaluation.jsx';
import ReportView from './pages/ReportView.jsx';
import Credits from './pages/Credits.jsx';
import FeatureAwareOrgProcesses from './pages/FeatureAwareOrgProcesses.jsx';

function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<AuthGuard />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      
      <Route 
        path={ROUTES.DASHBOARD}
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route 
        path={ROUTES.EVALUATION}
        element={<ProtectedRoute><FeatureAwareEvaluation /></ProtectedRoute>}
      />
      <Route 
        path={ROUTES.EVALUATION_PARAM}
        element={<ProtectedRoute><FeatureAwareEvaluation /></ProtectedRoute>}
      />
      <Route 
        path={ROUTES.REPORT_VIEW}
        element={<ProtectedRoute><ReportView /></ProtectedRoute>}
      />
      <Route 
        path={ROUTES.CREDITS}
        element={<ProtectedRoute><Credits /></ProtectedRoute>}
      />
      
      {/* Organizational routes (feature-gated) */}
      <Route 
        path={ROUTES.ORG_PROCESSES}
        element={<ProtectedRoute><FeatureAwareOrgProcesses /></ProtectedRoute>}
      />
      <Route 
        path={ROUTES.ORG_PROCESS_DETAIL}
        element={<ProtectedRoute><FeatureAwareOrgProcesses /></ProtectedRoute>}
      />
      
      {/* Reports routes (feature-gated) */}
      <Route 
        path={ROUTES.INDIVIDUAL_REPORT}
        element={<ProtectedRoute><FeatureAwareOrgProcesses /></ProtectedRoute>}
      />
    </Routes>
  );
}

export default AppRouter;