
import React from 'react';
import Footer from "@/components/Footer";

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Customer Terms & Conditions</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By using Book'D Event Hub ("Book'D", "the Platform", "we", "us"), you accept and agree to be bound by these Customer Terms & Conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="mb-4">
                Book'D is an online marketplace that connects customers with event vendors and service providers. We facilitate the discovery, booking, and payment processing for event-related services including but not limited to catering, photography, entertainment, decoration, and venue services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Account Registration and Use</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old to create an account and book services</li>
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Booking and Payment Terms</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">4.1 Booking Process</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>All bookings are subject to vendor availability and acceptance</li>
                  <li>Booking confirmations will be sent via email and available in your account dashboard</li>
                  <li>Services must be booked for legitimate event purposes only</li>
                  <li>You agree to provide accurate event details and requirements</li>
                </ul>

                <h3 className="font-semibold text-gray-900">4.2 Payment Processing</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>All payments are processed securely through Stripe Connect</li>
                  <li>Payment is due at the time of booking unless otherwise specified by the vendor</li>
                  <li>You authorize Book'D to charge your selected payment method for the full booking amount</li>
                  <li>A 10% platform fee is included in the total booking amount and retained by Book'D</li>
                  <li>All prices are displayed in USD and include applicable taxes</li>
                  <li>Payment confirmation serves as acceptance of the booking terms</li>
                </ul>

                <h3 className="font-semibold text-gray-900">4.3 Contracts and Documentation</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Vendors may require signed contracts for certain services</li>
                  <li>Digital contracts can be signed through our platform</li>
                  <li>You will receive invoices and receipts for all transactions</li>
                  <li>Keep all booking documentation for your records</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Cancellations and Refunds</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">5.1 Customer Cancellations</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Cancellation policies vary by vendor and are clearly displayed before booking</li>
                  <li>Cancellations must be made through your account dashboard or by contacting support</li>
                  <li>Refunds are processed according to the vendor's stated cancellation policy</li>
                  <li>Platform fees may be non-refundable depending on the timing of cancellation</li>
                  <li>Refunds typically take 5-10 business days to appear on your payment method</li>
                </ul>

                <h3 className="font-semibold text-gray-900">5.2 Vendor Cancellations</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>If a vendor cancels, you are entitled to a full refund including platform fees</li>
                  <li>We will attempt to help you find alternative vendors when possible</li>
                  <li>Vendor cancellations due to circumstances beyond their control may be subject to different terms</li>
                </ul>

                <h3 className="font-semibold text-gray-900">5.3 Force Majeure</h3>
                <p className="mb-4">
                  Neither party shall be liable for cancellations due to acts of God, natural disasters, government restrictions, or other circumstances beyond reasonable control. Refund policies in such cases will be handled on a case-by-case basis.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Customer Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate event information and requirements</li>
                <li>Be available for vendor communication and coordination</li>
                <li>Ensure event venue access and necessary permissions are in place</li>
                <li>Treat vendors and their staff with respect and professionalism</li>
                <li>Pay all amounts due according to the agreed schedule</li>
                <li>Report any issues or disputes promptly through proper channels</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Dispute Resolution</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">7.1 Platform Mediation</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Contact Book'D support immediately if disputes arise with vendors</li>
                  <li>We will attempt to mediate disputes between customers and vendors</li>
                  <li>Provide all relevant documentation and communication records</li>
                  <li>Participate in good faith resolution efforts</li>
                </ul>

                <h3 className="font-semibold text-gray-900">7.2 Escalation Process</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Unresolved disputes may be subject to binding arbitration</li>
                  <li>Arbitration will be conducted under the rules of the American Arbitration Association</li>
                  <li>The arbitration location will be determined based on the customer's location</li>
                  <li>Each party bears their own costs unless otherwise determined by the arbitrator</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Liability Limitations</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-4">
                <p className="font-semibold text-yellow-800 mb-2">IMPORTANT LIABILITY NOTICE</p>
                <div className="text-yellow-800 space-y-2">
                  <p><strong>Platform Role:</strong> Book'D acts as an intermediary marketplace connecting customers with independent vendors. We do not provide event services directly.</p>
                  <p><strong>Vendor Responsibility:</strong> All event services are provided by independent third-party vendors who are solely responsible for their work quality, safety, and performance.</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">8.1 Book'D's Liability Limits</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Our liability is limited to the platform fees paid to Book'D for the specific booking in question</li>
                  <li>We are not liable for vendor performance, service quality, or fulfillment issues</li>
                  <li>We do not guarantee vendor availability, pricing accuracy, or service outcomes</li>
                  <li>Maximum liability shall not exceed $1,000 per incident or the booking amount, whichever is less</li>
                </ul>

                <h3 className="font-semibold text-gray-900">8.2 Exclusions</h3>
                <p className="mb-4">
                  Book'D is not liable for indirect, incidental, special, consequential, or punitive damages including but not limited to lost profits, lost business opportunities, emotional distress, or event cancellation costs beyond our platform fees.
                </p>

                <h3 className="font-semibold text-gray-900">8.3 Vendor Insurance</h3>
                <p className="mb-4">
                  Vendors are required to maintain appropriate insurance coverage. However, customers should verify insurance details directly with vendors for their specific needs and may wish to obtain their own event insurance.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Privacy and Data Protection</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your personal information is protected according to our Privacy Policy</li>
                <li>We may share necessary booking information with vendors to fulfill services</li>
                <li>Communication through our platform may be monitored for quality and safety</li>
                <li>You consent to receiving booking confirmations, updates, and promotional communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Prohibited Activities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Using the platform for illegal activities or events</li>
                <li>Circumventing the platform's payment system</li>
                <li>Providing false or misleading information</li>
                <li>Harassing or discriminating against vendors</li>
                <li>Attempting to damage or disrupt the platform</li>
                <li>Violating any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Reviews and Feedback</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You may leave honest reviews after service completion</li>
                <li>Reviews must be factual and based on your actual experience</li>
                <li>Inappropriate or false reviews may be removed</li>
                <li>Reviews become property of Book'D for marketing and improvement purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Modifications and Termination</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">12.1 Terms Updates</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>We may update these terms at any time with 30 days notice for material changes</li>
                  <li>Continued use of the platform constitutes acceptance of updated terms</li>
                  <li>Significant changes will be communicated via email and platform notifications</li>
                </ul>

                <h3 className="font-semibold text-gray-900">12.2 Account Termination</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You may close your account at any time through your account settings</li>
                  <li>We may suspend or terminate accounts for violations of these terms</li>
                  <li>Outstanding bookings must be completed or properly cancelled before account closure</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="mb-4">
                These terms are governed by the laws of the State of Delaware, United States. Any legal disputes shall be resolved in the courts of Delaware or through binding arbitration as specified in the dispute resolution section.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="mb-4">
                If you have questions about these Customer Terms & Conditions, please contact us:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p><strong>Customer Support:</strong> support@bookdeventhub.com</p>
                <p><strong>Legal Inquiries:</strong> legal@bookdeventhub.com</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p><strong>Address:</strong> 123 Event Street, Suite 100, Event City, EC 12345</p>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                By using Book'D Event Hub, you acknowledge that you have read, understood, and agree to these Customer Terms & Conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
