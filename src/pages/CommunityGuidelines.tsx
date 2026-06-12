import React from 'react';
import Footer from "@/components/Footer";

const CommunityGuidelines: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Community Guidelines</h1>
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Respect and Inclusion</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Treat all users with respect and courtesy</li>
                <li>No discrimination based on race, gender, religion, or other protected characteristics</li>
                <li>Foster a welcoming and inclusive environment</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Honest Communication</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and truthful information in your profile and communications</li>
                <li>No false advertising or misrepresentation of services</li>
                <li>Respond to messages and booking requests in a timely manner</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Professionalism</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain a professional tone in all interactions</li>
                <li>Deliver services as described and agreed upon</li>
                <li>Respect client and vendor privacy</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Safety and Security</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Follow all applicable laws and regulations</li>
                <li>Report suspicious or inappropriate behavior to platform support</li>
                <li>Do not share sensitive personal information unnecessarily</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Prohibited Conduct</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>No harassment, bullying, or hate speech</li>
                <li>No spam, scams, or fraudulent activity</li>
                <li>No attempts to circumvent platform payment systems</li>
                <li>No posting of illegal or offensive content</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Reporting and Enforcement</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Report violations to support@bookdeventhub.com</li>
                <li>Violations may result in warnings, suspension, or account termination</li>
                <li>We reserve the right to remove content or users that violate these guidelines</li>
              </ul>
            </section>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CommunityGuidelines; 