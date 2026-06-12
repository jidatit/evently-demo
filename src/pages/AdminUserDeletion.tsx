
import React from 'react';
import AdminUserDeletion from '@/components/AdminUserDeletion';
import { AlertTriangle } from 'lucide-react';

const AdminUserDeletionPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 min-h-screen">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-red-800">Emergency User Deletion</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          This page helps resolve database constraint issues preventing user deletion in Supabase.
        </p>
      </div>
      
      <AdminUserDeletion />
      
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• This bypasses normal deletion flow to handle constraint errors</li>
            <li>• All user data and associations will be permanently deleted</li>
            <li>• Use only when normal Supabase deletion fails</li>
            <li>• If this fails, you may need to contact Supabase support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDeletionPage;
