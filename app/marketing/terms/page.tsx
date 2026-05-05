import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — misu",
  description: "Terms and conditions for using the Misu application.",
};

const EFFECTIVE_DATE = "May 5, 2026";
const CONTACT_EMAIL = "support@misu.care";
const APP_URL = "https://app.misu.care";

export default function TermsPage() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#1F2024", maxWidth: 680, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
        <a href="https://misu.care" style={{ fontWeight: 800, fontSize: 20, textDecoration: "none", color: "#1F2024" }}>misu</a>
        <a href={APP_URL} style={{ fontSize: 14, fontWeight: 700, color: "#1F2024", textDecoration: "none", border: "2px solid #1F2024", padding: "6px 14px", borderRadius: 8 }}>open the app →</a>
      </nav>

      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ color: "#666", marginBottom: 40 }}>Effective date: {EFFECTIVE_DATE}</p>

      <Section title="1. Acceptance of Terms">
        <p>By accessing or using the Misu application (&ldquo;Service&rdquo;) at <a href={APP_URL}>{APP_URL}</a>, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
      </Section>

      <Section title="2. Description of Service">
        <p><strong>Program name:</strong> Misu</p>
        <p><strong>Description:</strong> Misu is a personal relationship-maintenance app that helps users schedule and coordinate hangouts with friends. The Service sends hangout invitations, RSVP confirmations, and reminder notifications via SMS and email on behalf of registered users.</p>
      </Section>

      <Section title="3. SMS Messaging Terms">
        <p>By using Misu to send messages to your contacts, you agree to the following:</p>
        <ul>
          <li><strong>Message frequency:</strong> Message frequency varies based on your configured check-in cadence and the number of contacts you add. Recipients may receive an invitation message, up to two reminder messages (3 days before and day-of), and a confirmation message per scheduled hangout.</li>
          <li><strong>Message &amp; data rates:</strong> Message and data rates may apply to SMS messages sent and received. Check with your carrier for details.</li>
          <li><strong>Consent:</strong> You may only add phone numbers of individuals who have given you permission to contact them. By adding a contact&rsquo;s phone number, you confirm you have their consent.</li>
          <li><strong>Opt-out (<strong>STOP</strong>):</strong> Any recipient can reply <strong>STOP</strong> to any Misu message to immediately opt out of all future messages. No further messages will be sent after a STOP reply is received.</li>
          <li><strong>Help (<strong>HELP</strong>):</strong> Recipients can reply <strong>HELP</strong> to receive support information. For additional help, contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</li>
        </ul>
      </Section>

      <Section title="4. User Responsibilities">
        <p>You are responsible for:</p>
        <ul>
          <li>Ensuring you have permission from any contact whose phone number or email you add to Misu</li>
          <li>Using the Service only for personal, non-commercial relationship maintenance</li>
          <li>Not using the Service for spam, harassment, or unsolicited communications</li>
          <li>Maintaining the security of your account credentials</li>
        </ul>
      </Section>

      <Section title="5. Prohibited Uses">
        <p>You may not use Misu to:</p>
        <ul>
          <li>Send unsolicited commercial messages or marketing communications</li>
          <li>Harass, threaten, or harm any individual</li>
          <li>Violate any applicable law or carrier guidelines</li>
          <li>Attempt to reverse-engineer, scrape, or disrupt the Service</li>
        </ul>
      </Section>

      <Section title="6. Account Termination">
        <p>We reserve the right to suspend or terminate accounts that violate these Terms, including sending unsolicited messages or misusing the SMS infrastructure. You may delete your account at any time from the Settings page.</p>
      </Section>

      <Section title="7. Disclaimer of Warranties">
        <p>The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that messages will be delivered successfully to all carriers.</p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>To the maximum extent permitted by law, Misu shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including any undelivered messages or data loss.</p>
      </Section>

      <Section title="9. Changes to Terms">
        <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms. Material changes will be communicated via email or in-app notice.</p>
      </Section>

      <Section title="10. Contact">
        <p>For questions about these Terms or to report misuse, contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </Section>

      <footer style={{ marginTop: 64, paddingTop: 24, borderTop: "1px solid #DEDEDE", color: "#999", fontSize: 13 }}>
        <p>© {new Date().getFullYear()} Misu · <a href="https://misu.care" style={{ color: "#999" }}>misu.care</a> · <a href="https://misu.care/privacy" style={{ color: "#999" }}>Privacy</a></p>
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
