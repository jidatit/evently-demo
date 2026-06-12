
import React from 'react';
import Footer from "@/components/Footer";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="space-y-8 text-gray-700">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()} | 
                <strong> Effective Date:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="mb-4">
                Evently ("Evently," "we," "us," or "our") respects your privacy and is committed to protecting your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our event vendor marketplace platform.
              </p>
              <p>
                This policy complies with the California Consumer Privacy Act (CCPA), California Privacy Rights Act (CPRA), 
                and is designed with GDPR principles in mind for users in the European Union.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mb-3">Personal Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                <li><strong>Profile Information:</strong> Business name, category, description, location, profile photos</li>
                <li><strong>Payment Information:</strong> Credit card details, bank account information (processed securely through Stripe)</li>
                <li><strong>Booking Information:</strong> Event details, dates, service preferences, special requirements</li>
                <li><strong>Communication Data:</strong> Messages between customers and vendors, reviews, ratings</li>
                <li><strong>Verification Documents:</strong> Business licenses, insurance certificates (for vendors)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-3">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Usage Data:</strong> Pages visited, time spent, features used, search queries</li>
                <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
                <li><strong>Location Data:</strong> General location based on IP address (with your consent for precise location)</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies, preference cookies, analytics cookies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">Service Provision</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Process bookings and facilitate connections between customers and vendors</li>
                    <li>Handle payments, refunds, and commission processing</li>
                    <li>Provide customer support and resolve disputes</li>
                    <li>Verify vendor credentials and maintain platform quality</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Communication</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Send booking confirmations, payment receipts, and service updates</li>
                    <li>Enable messaging between customers and vendors</li>
                    <li>Send marketing communications (with your consent)</li>
                    <li>Provide important platform updates and policy changes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Platform Improvement</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Analyze usage patterns to improve user experience</li>
                    <li>Develop new features and services</li>
                    <li>Prevent fraud and ensure platform security</li>
                    <li>Conduct research and analytics</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mb-3">Third-Party Service Providers</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Stripe:</strong> Payment processing, fraud detection, and financial services</li>
                <li><strong>Email Services:</strong> Transactional and marketing email delivery</li>
                <li><strong>Cloud Hosting:</strong> Secure data storage and platform hosting (Supabase/AWS)</li>
                <li><strong>Analytics Services:</strong> Usage analytics and performance monitoring</li>
                <li><strong>Customer Support:</strong> Help desk and communication tools</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-3">Business Purposes</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>With vendors when you make a booking (contact information for service delivery)</li>
                <li>With customers when vendors need to fulfill services</li>
                <li>In response to legal requests or to comply with applicable laws</li>
                <li>To protect our rights, property, or safety and that of our users</li>
                <li>In connection with a business transaction (merger, acquisition, etc.)</li>
              </ul>

              <p className="font-medium text-gray-800">We do not sell your personal information to third parties for marketing purposes.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookies and Tracking Technologies</h2>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">Essential Cookies</h4>
                  <p>Required for platform functionality, security, and user authentication.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Analytics Cookies</h4>
                  <p>Help us understand how users interact with our platform to improve services.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Preference Cookies</h4>
                  <p>Remember your settings and preferences for a better experience.</p>
                </div>
                <p className="text-sm bg-gray-100 p-3 rounded">
                  You can control cookies through your browser settings, but disabling certain cookies may affect platform functionality.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
              <p className="mb-4">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Secure data storage with encryption at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication requirements</li>
                <li>Payment processing through PCI DSS compliant providers (Stripe)</li>
              </ul>
              <p className="mt-4 text-sm bg-yellow-50 border-l-4 border-yellow-400 p-3">
                <strong>Important:</strong> No method of transmission over the internet is 100% secure. 
                While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mb-3">California Residents (CCPA/CPRA Rights)</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Right to Know:</strong> Request information about personal information we collect, use, and share</li>
                <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
                <li><strong>Right to Opt-Out:</strong> Opt-out of the sale or sharing of personal information</li>
                <li><strong>Right to Non-Discrimination:</strong> Not receive discriminatory treatment for exercising your rights</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-3">All Users</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Access and update your account information</li>
                <li>Control marketing communications preferences</li>
                <li>Request a copy of your data</li>
                <li>Close your account (subject to ongoing obligations)</li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="font-medium text-blue-800">To exercise your rights, contact us at:</p>
                <p className="text-blue-700">Email: privacy@bookdeventhub.com</p>
                <p className="text-blue-700">Response Time: We will respond within 30 days (45 days for complex requests)</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="mb-4">We retain your personal information for as long as necessary to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide our services and maintain your account</li>
                <li>Comply with legal obligations and resolve disputes</li>
                <li>Prevent fraud and maintain platform security</li>
                <li>Fulfill legitimate business purposes</li>
              </ul>
              <p className="mt-4">
                <strong>Typical retention periods:</strong> Account data (active account duration + 7 years), 
                Transaction data (7 years), Marketing data (until opt-out + legal requirements).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Users</h2>
              <p className="mb-4">
                Evently is based in the United States. If you access our platform from outside the U.S., 
                your information may be transferred to, stored, and processed in the United States.
              </p>
              <p>
                For European Union users, we process personal data based on legitimate interests, 
                contractual necessity, and consent where required under GDPR.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p>
                Our platform is not intended for children under 18 years of age. We do not knowingly collect 
                personal information from children under 18. If you are a parent or guardian and believe 
                your child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy periodically to reflect changes in our practices or applicable laws. 
                We will notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posting the updated policy on our platform</li>
                <li>Sending email notification for significant changes</li>
                <li>Updating the "Last Updated" date above</li>
              </ul>
              <p className="mt-4">
                Continued use of our platform after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-2">
                <p><strong>Evently</strong></p>
                <p>Privacy Officer</p>
                <p>Email: <a href="mailto:privacy@bookdeventhub.com" className="text-blue-600 hover:text-blue-800">privacy@bookdeventhub.com</a></p>
                <p>Support: <a href="mailto:support@bookdeventhub.com" className="text-blue-600 hover:text-blue-800">support@bookdeventhub.com</a></p>
                <p className="text-sm text-gray-600 mt-4">
                  For general inquiries about this Privacy Policy or our privacy practices, 
                  please contact us using the information above. We are committed to resolving 
                  any privacy concerns promptly and transparently.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
