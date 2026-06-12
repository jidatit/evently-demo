
import React from 'react';
import Footer from "@/components/Footer";

const VendorTerms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Vendor Terms of Service</h1>
          
          <div className="bg-green-100 border-l-4 border-green-400 p-4 rounded-lg mb-8 text-green-800 font-semibold text-lg">
            🎉 Welcome to Book'D! Join our marketplace of professional event vendors and start growing your business today.
          </div>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance and Vendor Relationship</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">1.1 Agreement to Terms</h3>
                <p className="mb-4">
                  By registering as a vendor on Book'D Event Hub ("Book'D", "the Platform"), you accept and agree to be bound by these Vendor Terms of Service. If you do not agree to these terms, please do not register or use our vendor services.
                </p>

                <h3 className="font-semibold text-gray-900">1.2 Independent Contractor Relationship</h3>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mb-4">
                  <p className="font-semibold text-blue-800 mb-2">IMPORTANT: Independent Contractor Status</p>
                  <ul className="text-blue-800 space-y-1 list-disc pl-4">
                    <li>You are an independent contractor, not an employee, agent, or partner of Book'D</li>
                    <li>You maintain complete control over how, when, and where you provide services</li>
                    <li>You are solely responsible for your business operations, taxes, and legal compliance</li>
                    <li>Book'D does not direct or control your service delivery methods</li>
                    <li>You may work with other platforms and clients simultaneously</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Vendor Eligibility and Registration</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old and legally authorized to enter contracts</li>
                <li>You must provide accurate business information and maintain current contact details</li>
                <li>You must possess all necessary licenses, permits, and insurance for your services</li>
                <li>You must comply with all applicable local, state, and federal laws and regulations</li>
                <li>You must complete Stripe Connect onboarding for payment processing</li>
                <li>You must maintain professional qualifications and certifications as required by your industry</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Commission Structure and Payment Processing</h2>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Payment Breakdown Per Booking:</h3>
                <ul className="space-y-1">
                  <li><strong>Platform Commission:</strong> 10% of total booking amount</li>
                  <li><strong>Vendor Payout:</strong> 90% of total booking amount</li>
                  <li><strong>Stripe Processing Fee:</strong> 2.9% + $0.30 per transaction (deducted from total)</li>
                </ul>
                <div className="mt-3 p-3 bg-white rounded border">
                  <p className="font-medium text-gray-900">Example Calculation:</p>
                  <p>$1,000 booking → You receive approximately $871 after all fees</p>
                  <p className="text-sm text-gray-600">($1,000 - $100 platform fee - $29.30 Stripe fee = $870.70)</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">3.1 Payment Processing</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>All payments are processed through Stripe Connect for security and compliance</li>
                  <li>Customer payments are collected at booking and held in escrow</li>
                  <li>Vendor payouts are released according to your payout schedule (typically 2-3 business days after service completion)</li>
                  <li>You must maintain valid and current banking information in your Stripe account</li>
                  <li>Platform commission is automatically deducted before vendor payout</li>
                </ul>

                <h3 className="font-semibold text-gray-900">3.2 Payout Schedule</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payouts are processed after service completion confirmation</li>
                  <li>Standard payout timing is 2-3 business days via Stripe Connect</li>
                  <li>Dispute holds may delay payouts until resolution</li>
                  <li>You are responsible for accurate tax reporting on all income received</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Vendor Obligations and Service Standards</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">4.1 Service Delivery Requirements</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Provide services exactly as described in your vendor profile and booking agreements</li>
                  <li>Maintain professional conduct and appearance at all times</li>
                  <li>Arrive punctually for all scheduled appointments and services</li>
                  <li>Use high-quality, well-maintained equipment and materials</li>
                  <li>Follow all safety protocols and industry best practices</li>
                  <li>Obtain all necessary permits and permissions for service delivery</li>
                  <li>Communicate proactively with customers about service details and requirements</li>
                </ul>

                <h3 className="font-semibold text-gray-900">4.2 Customer Communication Standards</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Respond to booking requests within 24 hours</li>
                  <li>Maintain professional and courteous communication at all times</li>
                  <li>Provide clear and detailed service information and pricing</li>
                  <li>Notify customers immediately of any schedule changes or issues</li>
                  <li>Be available for pre-event consultation and planning as needed</li>
                </ul>

                <h3 className="font-semibold text-gray-900">4.3 Profile and Listing Maintenance</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Keep your vendor profile current with accurate service descriptions and pricing</li>
                  <li>Upload high-quality photos showcasing your work and capabilities</li>
                  <li>Maintain an up-to-date availability calendar</li>
                  <li>Provide accurate service areas and travel limitations</li>
                  <li>Update your profile promptly when services, pricing, or policies change</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Contract and Invoice Requirements</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">5.1 Service Contracts</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>You may create and require signed contracts for your services using our platform tools</li>
                  <li>Contracts must clearly outline service scope, timeline, deliverables, and terms</li>
                  <li>Digital contracts can be signed through the Book'D platform for convenience</li>
                  <li>Contract terms must comply with applicable laws and cannot contradict these vendor terms</li>
                  <li>You are responsible for enforcing your contract terms with customers</li>
                </ul>

                <h3 className="font-semibold text-gray-900">5.2 Invoicing and Documentation</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Use Book'D's invoicing system to create professional, detailed invoices</li>
                  <li>Invoices must accurately reflect services provided and agreed pricing</li>
                  <li>Provide itemized billing for complex services when requested</li>
                  <li>Maintain detailed records of all services provided and payments received</li>
                  <li>Issue invoices promptly upon service completion or as contractually agreed</li>
                </ul>

                <h3 className="font-semibold text-gray-900">5.3 Record Keeping</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintain accurate business records for tax and legal compliance</li>
                  <li>Keep copies of all contracts, invoices, and customer communications</li>
                  <li>Document any changes to service agreements in writing</li>
                  <li>Retain records for at least 7 years for tax and legal purposes</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Cancellation and Refund Policies</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">6.1 Vendor Cancellation Policy</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>You must establish and clearly communicate your cancellation policy to customers</li>
                  <li>Cancellation policies must be reasonable and clearly displayed before booking</li>
                  <li>Emergency cancellations must be communicated to customers and Book'D immediately</li>
                  <li>Frequent cancellations may result in account suspension or termination</li>
                  <li>You may not cancel bookings to pursue higher-paying opportunities</li>
                </ul>

                <h3 className="font-semibold text-gray-900">6.2 Customer Cancellation Handling</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Honor your stated cancellation policy consistently and fairly</li>
                  <li>Process cancellations and refunds promptly according to your policy</li>
                  <li>Communicate cancellation procedures clearly to customers</li>
                  <li>Work with Book'D support to resolve disputed cancellations</li>
                </ul>

                <h3 className="font-semibold text-gray-900">6.3 Force Majeure Events</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Neither party is liable for cancellations due to acts of God, natural disasters, or government restrictions</li>
                  <li>Communicate force majeure situations immediately to all affected parties</li>
                  <li>Work collaboratively to reschedule services when possible</li>
                  <li>Refund policies during force majeure events will be handled case by case</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Insurance and Liability Requirements</h2>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-4">
                <p className="font-semibold text-red-800 mb-2">REQUIRED: Professional Insurance Coverage</p>
                <ul className="text-red-800 space-y-1 list-disc pl-4">
                  <li>General liability insurance: Minimum $1,000,000 per occurrence</li>
                  <li>Professional liability insurance where applicable to your services</li>
                  <li>Provide proof of insurance upon request from Book'D or customers</li>
                  <li>Maintain continuous coverage throughout your vendor relationship</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">7.1 Vendor Liability and Responsibility</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>You are solely responsible for the quality and safety of services you provide</li>
                  <li>You assume full liability for damages caused during service delivery</li>
                  <li>You must indemnify and hold Book'D harmless from claims related to your services</li>
                  <li>Your insurance is primary coverage for all service-related incidents</li>
                  <li>You are responsible for compliance with all health, safety, and building codes</li>
                </ul>

                <h3 className="font-semibold text-gray-900">7.2 Platform Liability Limitations</h3>
                <p className="mb-4">
                  Book'D acts solely as a marketplace platform connecting vendors with customers. We do not provide event services directly and are not liable for service quality, safety issues, or vendor performance. Our maximum liability is limited to platform fees collected for the specific booking in question.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Dispute Resolution Process</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">8.1 Customer Dispute Handling</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Address customer concerns promptly and professionally</li>
                  <li>Attempt to resolve disputes directly with customers first</li>
                  <li>Contact Book'D support when mediation assistance is needed</li>
                  <li>Provide all relevant documentation and communication records</li>
                  <li>Participate in good faith resolution efforts</li>
                </ul>

                <h3 className="font-semibold text-gray-900">8.2 Platform Mediation Process</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Book'D will mediate disputes between vendors and customers when requested</li>
                  <li>Mediation decisions regarding service quality and refunds will be binding</li>
                  <li>Repeated disputes may result in account review and potential suspension</li>
                  <li>Maintain professionalism throughout the dispute resolution process</li>
                </ul>

                <h3 className="font-semibold text-gray-900">8.3 Legal Arbitration</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Unresolved disputes may proceed to binding arbitration under AAA rules</li>
                  <li>Arbitration location will be in your state of business registration</li>
                  <li>Each party bears their own legal costs unless otherwise determined</li>
                  <li>Arbitration is the exclusive remedy for disputes exceeding platform mediation</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Performance Standards and Reviews</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">9.1 Performance Metrics</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Maintain a minimum 4.0-star average rating to remain in good standing</li>
                  <li>Respond to booking inquiries within 24 hours</li>
                  <li>Complete at least 80% of accepted bookings without cancellation</li>
                  <li>Maintain professional communication and service delivery standards</li>
                </ul>

                <h3 className="font-semibold text-gray-900">9.2 Customer Reviews and Feedback</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Customers may leave reviews and ratings after service completion</li>
                  <li>Respond professionally to all reviews, including negative feedback</li>
                  <li>Use feedback constructively to improve your services</li>
                  <li>Do not offer incentives or request removal of legitimate negative reviews</li>
                  <li>Report fraudulent or inappropriate reviews to Book'D support</li>
                </ul>

                <h3 className="font-semibold text-gray-900">9.3 Account Status and Improvement</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Vendors falling below performance standards will receive improvement notices</li>
                  <li>Persistent performance issues may result in account suspension or termination</li>
                  <li>Book'D may provide resources and support to help improve vendor performance</li>
                  <li>Account status reviews are conducted regularly based on performance metrics</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Prohibited Activities and Conduct</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing services outside your licensed or qualified scope</li>
                <li>Using unlicensed, uninsured, or unqualified personnel for service delivery</li>
                <li>Submitting false, misleading, or outdated information in your profile</li>
                <li>Attempting to circumvent Book'D's payment processing system</li>
                <li>Discriminating against customers based on protected characteristics</li>
                <li>Engaging in price manipulation, bid rigging, or anti-competitive behavior</li>
                <li>Soliciting customers to book services outside the Book'D platform</li>
                <li>Violating any local, state, or federal laws in service delivery</li>
                <li>Misrepresenting credentials, experience, or service capabilities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Account Termination and Data</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">11.1 Voluntary Termination</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>You may terminate your vendor account with 30 days written notice</li>
                  <li>Complete all pending bookings before account closure</li>
                  <li>Outstanding payments will be processed according to normal payout schedule</li>
                  <li>Account termination does not affect existing legal obligations or contracts</li>
                </ul>

                <h3 className="font-semibold text-gray-900">11.2 Involuntary Termination</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Book'D may suspend or terminate accounts for violations of these terms</li>
                  <li>Serious violations may result in immediate account termination</li>
                  <li>Repeated performance issues may lead to account termination</li>
                  <li>Terminated vendors may not create new accounts without prior approval</li>
                </ul>

                <h3 className="font-semibold text-gray-900">11.3 Data and Records</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Download your business records and customer data before account closure</li>
                  <li>Book'D retains transaction records as required by law and payment processing requirements</li>
                  <li>Customer contact information remains subject to privacy policies after termination</li>
                  <li>Reviews and ratings remain visible on the platform after account closure</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Intellectual Property and Marketing</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">12.1 Your Content and Work</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>You retain ownership of your original work, photos, and intellectual property</li>
                  <li>You grant Book'D license to display your content for platform marketing and operations</li>
                  <li>You represent that you have rights to all content you upload to the platform</li>
                  <li>You may not use copyrighted materials without proper authorization</li>
                </ul>

                <h3 className="font-semibold text-gray-900">12.2 Platform Marketing</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Book'D may use your business name and work samples in platform marketing</li>
                  <li>High-quality vendors may be featured in promotional materials</li>
                  <li>You may opt out of marketing use by contacting support</li>
                  <li>Customer testimonials and reviews may be used in platform promotion</li>
                </ul>

                <h3 className="font-semibold text-gray-900">12.3 Book'D Brand Usage</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You may indicate that you're a "Book'D Vendor" in your marketing materials</li>
                  <li>Do not imply employment or exclusive partnership with Book'D</li>
                  <li>Use Book'D branding only as permitted by our brand guidelines</li>
                  <li>Remove all Book'D branding upon account termination</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Tax Responsibilities and Reporting</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-4">
                <p className="font-semibold text-yellow-800 mb-2">IMPORTANT: Independent Contractor Tax Obligations</p>
                <ul className="text-yellow-800 space-y-1 list-disc pl-4">
                  <li>You are solely responsible for all tax obligations on income earned through Book'D</li>
                  <li>Book'D will provide 1099 forms for vendors earning over $600 annually</li>
                  <li>Maintain accurate records of all business income and expenses</li>
                  <li>Consult with tax professionals regarding your specific obligations</li>
                </ul>
              </div>

              <ul className="list-disc pl-6 space-y-2">
                <li>Pay all applicable federal, state, and local taxes on your earnings</li>
                <li>Make quarterly estimated tax payments as required</li>
                <li>Maintain business licenses and permits as required by your jurisdiction</li>
                <li>Keep detailed records of business expenses for tax deduction purposes</li>
                <li>Report all income accurately and timely to tax authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Platform Updates and Communication</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Book'D may update platform features, policies, and terms with reasonable notice</li>
                <li>Important updates will be communicated via email and platform notifications</li>
                <li>Continued use of the platform constitutes acceptance of updated terms</li>
                <li>You may terminate your account if you disagree with material changes</li>
                <li>Stay informed about platform updates through vendor communications and support channels</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Vendor Support and Resources</h2>
              <p className="mb-4">
                For vendor-specific questions, technical support, or business guidance, contact us:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p><strong>Vendor Support:</strong> vendors@bookdeventhub.com</p>
                <p><strong>Technical Support:</strong> support@bookdeventhub.com</p>
                <p><strong>Legal Inquiries:</strong> legal@bookdeventhub.com</p>
                <p><strong>Phone Support:</strong> +1 (555) 123-4567</p>
                <p><strong>Business Address:</strong> 123 Event Street, Suite 100, Event City, EC 12345</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">16. Governing Law and Jurisdiction</h2>
              <p className="mb-4">
                These Vendor Terms of Service are governed by the laws of the State of Delaware, United States. Any legal disputes shall be resolved through binding arbitration in your state of business registration, under the rules of the American Arbitration Association, or in the courts of Delaware for matters exceeding arbitration scope.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                By registering as a vendor on Book'D Event Hub, you acknowledge that you have read, understood, and agree to these Vendor Terms of Service and confirm your status as an independent contractor.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VendorTerms;
