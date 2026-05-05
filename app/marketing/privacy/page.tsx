import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — misu",
  description: "How Misu collects, uses, and protects your information.",
};

const EFFECTIVE_DATE = "May 5, 2026";
const CONTACT_EMAIL = "privacy@misu.care";
const APP_URL = "https://app.misu.care";

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#1F2024", maxWidth: 680, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
        <a href="https://misu.care" style={{ fontWeight: 800, fontSize: 20, textDecoration: "none", color: "#1F2024" }}>misu</a>
        <a href={APP_URL} style={{ fontSize: 14, fontWeight: 700, color: "#1F2024", textDecoration: "none", border: "2px solid #1F2024", padding: "6px 14px", borderRadius: 8 }}>open the app →</a>
      </nav>

      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: "#666", marginBottom: 40 }}>Effective date: {EFFECTIVE_DATE}</p>

      <Section title="Overview">
        <p>Misu (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates the Misu application at <a href={APP_URL}>{APP_URL}</a>. This Privacy Policy explains how we collect, use, and protect your personal information when you use our service.</p>
      </Section>

      <Section title="Information We Collect">
        <p><strong>Account information:</strong> When you create a Misu account we collect your name, email address, and optionally your phone number.</p>
        <p><strong>Contact data:</strong> You may add friends and contacts to Misu by entering their name, phone number, and email address. This data is stored solely to enable you to send hangout invitations and reminders to those individuals on your behalf.</p>
        <p><strong>Usage data:</strong> We collect standard server logs including IP addresses, browser type, and pages visited to operate and improve the service.</p>
        <p><strong>Communications:</strong> We store records of hangout invitations, RSVPs, and reminder messages sent through the platform.</p>
      </Section>

      <Section title="How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul>
          <li>Operate and provide the Misu service</li>
          <li>Send hangout invitations, RSVP confirmations, and reminders via SMS and email on your behalf</li>
          <li>Maintain your check-in cadence schedules</li>
          <li>Improve and debug the platform</li>
          <li>Respond to your support requests</li>
        </ul>
        <p>We do <strong>not</strong> sell your personal information or your contacts&rsquo; information to third parties. We do <strong>not</strong> use your data or your contacts&rsquo; data for marketing purposes unrelated to the Misu service.</p>
      </Section>

      <Section title="SMS Messaging">
        <p>Misu uses SMS to send hangout invitations and reminders to contact phone numbers you provide. By adding a contact&rsquo;s phone number to Misu, you confirm that you have their permission to contact them on your behalf.</p>
        <p>Message and data rates may apply. Message frequency varies based on your configured check-in cadence.</p>
        <p><strong>To opt out:</strong> Any recipient of a Misu SMS can reply <strong>STOP</strong> at any time to stop receiving messages. Reply <strong>HELP</strong> for assistance. Opt-outs are processed immediately.</p>
        <p>We do not share phone numbers with third parties for their marketing purposes.</p>
      </Section>

      <Section title="Data Sharing">
        <p>We share your data only with trusted service providers necessary to operate Misu:</p>
        <ul>
          <li><strong>Twilio</strong> — SMS delivery</li>
          <li><strong>Resend</strong> — Email delivery</li>
          <li><strong>Supabase</strong> — Database and authentication</li>
        </ul>
        <p>Each provider is bound by their own privacy policy and data processing agreements. We do not share your data with any other third parties without your consent.</p>
      </Section>

      <Section title="Data Retention">
        <p>We retain your account data for as long as your account is active. You may delete your account and all associated data at any time from the Settings page in the Misu app. Contact data you have added is deleted immediately upon account deletion.</p>
      </Section>

      <Section title="Your Rights">
        <p>You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </Section>

      <Section title="Security">
        <p>We use industry-standard security measures including encrypted data transmission (TLS) and access controls. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
      </Section>

      <Section title="Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated effective date.</p>
      </Section>

      <Section title="Contact Us">
        <p>If you have questions about this Privacy Policy, please contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </Section>

      <footer style={{ marginTop: 64, paddingTop: 24, borderTop: "1px solid #DEDEDE", color: "#999", fontSize: 13 }}>
        <p>© {new Date().getFullYear()} Misu · <a href="https://misu.care" style={{ color: "#999" }}>misu.care</a> · <a href="https://misu.care/terms" style={{ color: "#999" }}>Terms</a></p>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
      <div style={{ lineHeight: 1.7, fontSize: 15, color: "#333" }}>{children}</div>
    </section>
  );
}
