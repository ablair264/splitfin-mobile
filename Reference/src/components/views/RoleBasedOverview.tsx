import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// Lazy load views based on user role
const OverviewView = lazy(() => import('./OverviewView'));
const SalesAgentOverviewView = lazy(() => import('./SalesAgentOverviewView'));

interface RoleBasedOverviewProps {
  userRole?: string;
}

// This component decides which overview to render based on user role
const RoleBasedOverview: React.FC<RoleBasedOverviewProps> = ({ userRole }) => {
  if (userRole === 'salesAgent') {
    return <SalesAgentOverviewView />;
  }
  
  // Default to standard overview for brand managers and other roles
  return <OverviewView />;
};

export default RoleBasedOverview;
