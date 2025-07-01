import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { trpc, trpcClient } from './lib/trpc.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Assets from './pages/Assets.jsx';
import CreateAsset from './pages/CreateAsset.jsx';
import EditAsset from './pages/EditAsset.jsx';
import Cases from './pages/Cases.jsx';
import CreateCase from './pages/CreateCase.jsx';
import GenerateDocumentAI from './pages/GenerateDocumentAI.jsx';
import ViewDocument from './pages/ViewDocument.jsx';
import EditDocument from './pages/EditDocument.jsx';
import ViewCase from './pages/ViewCase.jsx';
import EditCase from './pages/EditCase.jsx';
import Monitoring from './pages/Monitoring.jsx';
import CreateMonitoringJob from './pages/CreateMonitoringJob.jsx';
import ViewMonitoringJob from './pages/ViewMonitoringJob.jsx';
import Profile from './pages/Profile.jsx';
import AdminPanel from './pages/AdminPanel.jsx';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                
                {/* IP Assets routes */}
                <Route 
                  path="/assets" 
                  element={
                    <ProtectedRoute>
                      <Assets />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/assets/new" 
                  element={
                    <ProtectedRoute>
                      <CreateAsset />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/assets/:id/edit" 
                  element={
                    <ProtectedRoute>
                      <EditAsset />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Cases routes */}
                <Route 
                  path="/cases" 
                  element={
                    <ProtectedRoute>
                      <Cases />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/cases/new" 
                  element={
                    <ProtectedRoute>
                      <CreateCase />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/cases/:id" 
                  element={
                    <ProtectedRoute>
                      <ViewCase />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/cases/:id/edit" 
                  element={
                    <ProtectedRoute>
                      <EditCase />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Document generation and individual document routes */}
                <Route 
                  path="/documents/generate/:caseId" 
                  element={
                    <ProtectedRoute>
                      <GenerateDocumentAI />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/cases/:caseId/generate-document" 
                  element={
                    <ProtectedRoute>
                      <GenerateDocumentAI />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/documents/:id" 
                  element={
                    <ProtectedRoute>
                      <ViewDocument />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/documents/:id/edit" 
                  element={
                    <ProtectedRoute>
                      <EditDocument />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Monitoring routes */}
                <Route 
                  path="/monitoring" 
                  element={
                    <ProtectedRoute>
                      <Monitoring />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/monitoring/create" 
                  element={
                    <ProtectedRoute>
                      <CreateMonitoringJob />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/monitoring/:id" 
                  element={
                    <ProtectedRoute>
                      <ViewMonitoringJob />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin Panel - Protected by RoleGuard inside component */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <AdminPanel />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;