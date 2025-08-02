export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto prose prose-gray">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <p className="text-gray-600 mb-8">Last updated: January 15, 2024</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
          <p className="text-gray-700 mb-4">
            We collect information you provide directly to us, such as when you create an account, post a ride,
            or contact us for support.
          </p>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Name and contact information (email, phone number)</li>
            <li>Username and password</li>
            <li>Profile information and preferences</li>
            <li>Payment information (if applicable)</li>
          </ul>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Information</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Information about your use of our services</li>
            <li>Log data and device information</li>
            <li>Location information (when you choose to share it)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send you technical notices and support messages</li>
            <li>Communicate with you about products, services, and events</li>
            <li>Monitor and analyze trends and usage</li>
            <li>Detect, investigate, and prevent fraudulent transactions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
          <p className="text-gray-700 mb-4">We may share your information in the following situations:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>With other users when you post rides</li>
            <li>With service providers who perform services on our behalf</li>
            <li>If required by law or to protect our rights</li>
            <li>In connection with a merger, sale, or acquisition</li>
          </ul>
          <p className="text-gray-700 mb-4">
            We do not sell, trade, or otherwise transfer your personal information to third parties for marketing
            purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
          <p className="text-gray-700 mb-4">
            We implement appropriate security measures to protect your personal information against unauthorized access,
            alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights and Choices</h2>
          <p className="text-gray-700 mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Access and update your personal information</li>
            <li>Delete your account and personal information</li>
            <li>Opt out of certain communications</li>
            <li>Request a copy of your data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking</h2>
          <p className="text-gray-700 mb-4">
            We use cookies and similar tracking technologies to collect and use personal information about you. You can
            control cookies through your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Children's Privacy</h2>
          <p className="text-gray-700 mb-4">
            Our services are not intended for children under 13. We do not knowingly collect personal information from
            children under 13.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Changes to This Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new
            policy on this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-gray-700">
            Email: privacy@campusshare.com
            <br />
            Address: 123 University Ave, Boulder, CO 80301
          </p>
        </section>
      </div>
    </div>
  )
}
