import BrandManagerDashboard from './BrandManagerDashboard';
import SalesAgentDashboard from './SalesAgentDashboard';

const Dashboard = ({ userId, userRole }: { userId: string; userRole: string }) => {
  if (userRole === 'brandManager') {
    return <BrandManagerDashboard userId={userId} />;
  }
  return <SalesAgentDashboard userId={userId} />;
};

export default Dashboard;