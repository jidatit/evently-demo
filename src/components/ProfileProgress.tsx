import React from 'react';

interface ProfileProgressProps {
  vendor: any;
  services: any[];
}

const ProfileProgress: React.FC<ProfileProgressProps> = ({ vendor, services }) => {
  const profileSteps = [
    { label: 'Business Name', complete: !!vendor?.business_name },
    { label: 'Category', complete: !!vendor?.category },
    { label: 'At least 1 Service', complete: services.length > 0 },
  ];
  
  const completedSteps = profileSteps.filter(s => s.complete).length;
  const progress = Math.round((completedSteps / profileSteps.length) * 100);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">Profile Completion</h3>
        <span className="text-sm text-gray-600">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-lime-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="space-y-2">
        {profileSteps.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${step.complete ? 'bg-lime-500' : 'bg-gray-300'}`}></div>
            <span className={`text-sm ${step.complete ? 'text-green-600' : 'text-gray-500'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileProgress;