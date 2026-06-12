
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Receipt, 
  Image, 
  User, 
  Wallet,
  BarChart3
} from 'lucide-react';

interface VendorDashboardTabsProps {
  children: React.ReactNode;
}

const VendorDashboardTabs: React.FC<VendorDashboardTabsProps> = ({ children }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'contracts', label: 'Contracts', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'media', label: 'Media Manager', icon: Image },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'earnings', label: 'Payouts', icon: Wallet },
  ];

  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <TabsList className="h-16 bg-transparent border-none p-0 flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="h-16 px-0 pb-4 bg-transparent text-gray-600 border-b-2 border-transparent data-[state=active]:border-lime-500 data-[state=active]:text-lime-600 data-[state=active]:bg-transparent hover:text-lime-500 transition-all duration-200 font-medium flex items-center gap-2"
                >
                  <IconComponent className="w-5 h-5" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </div>
      {children}
    </Tabs>
  );
};

export default VendorDashboardTabs;
