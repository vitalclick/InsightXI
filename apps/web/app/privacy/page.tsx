import type { Metadata } from "next";
import {
  LEGAL_CONTACT_EMAIL,
  LegalSection,
  LegalShell,
} from "../../components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — InsightXI",
  description:
    "How InsightXI collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p style={{ marginBottom: 24 }}>
        This Privacy Policy explains how InsightXI (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;) collects, uses, discloses, and safeguards your
        information when you use our football betting tips platform (the
        &ldquo;Service&rdquo;). InsightXI provides football betting tips and
        predictions; it is not a bookmaker or gambling operator and does not
        accept or place bets. We are committed to handling your data
        transparently and in line with the EU/UK GDPR and South
        Africa&rsquo;s POPIA.
      </p>

      <LegalSection heading="1. Information we collect">
        <ul>
          <li>
            <strong>Account information:</strong> your email address, optional
            display name, authentication provider (email, Google, or Apple), and
            a securely hashed password (for email accounts only — we never store
            plaintext passwords).
          </li>
          <li>
            <strong>Subscription information:</strong> your subscription tier,
            status, the payment provider used, and a payment reference. We do{" "}
            <strong>not</strong> collect or store card numbers — see Payments
            below.
          </li>
          <li>
            <strong>Usage and device data:</strong> approximate location derived
            from your IP address (used only to localize currency), and basic
            request metadata used for security and rate limiting.
          </li>
          <li>
            <strong>Local storage:</strong> we store your session token and
            interface preferences (such as theme) in your browser&rsquo;s local
            storage to keep you signed in.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. How we use your information">
        <ul>
          <li>To create and secure your account and authenticate you.</li>
          <li>To provide, personalize, and improve the Service.</li>
          <li>
            To process subscriptions and send transactional emails (email
            verification, password resets, and payment receipts).
          </li>
          <li>
            To localize pricing to your currency and to protect the Service from
            abuse (rate limiting, fraud prevention).
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Legal bases for processing">
        <p>
          Where the GDPR applies, we process your data on the bases of contract
          performance (providing the Service you sign up for), our legitimate
          interests (security and improvement), consent (where requested), and
          compliance with legal obligations.
        </p>
      </LegalSection>

      <LegalSection heading="4. Payments">
        <p>
          Payments are processed by third-party providers — PayPal, Paystack,
          and Flutterwave. Your card or banking details are entered with and
          handled by these providers under their own privacy policies; we
          receive only a payment reference and confirmation of status. We never
          see or store your full payment instrument.
        </p>
      </LegalSection>

      <LegalSection heading="5. Football data sources">
        <p>
          Match, team, and player statistics are aggregated from third-party
          football data providers (such as API-Football). This data concerns
          public sporting events and is not personal information about you.
        </p>
      </LegalSection>

      <LegalSection heading="6. Sharing and disclosure">
        <p>
          We do not sell your personal information. We share data only with
          service providers that help us operate the Service (hosting, email
          delivery, and payment processing), and where required by law.
        </p>
      </LegalSection>

      <LegalSection heading="7. Data retention">
        <p>
          We retain account and subscription data for as long as your account is
          active and as needed to comply with our legal obligations. You may
          request deletion of your account at any time (see Your rights).
        </p>
      </LegalSection>

      <LegalSection heading="8. Security">
        <p>
          We protect your data with encryption in transit (HTTPS), hashed
          passwords, scoped access controls, rate limiting, and hardened
          security headers. No method of transmission or storage is perfectly
          secure, but we work continuously to protect your information.
        </p>
      </LegalSection>

      <LegalSection heading="9. International transfers">
        <p>
          Your information may be processed in countries other than your own. We
          rely on appropriate safeguards for such transfers where required.
        </p>
      </LegalSection>

      <LegalSection heading="10. Your rights">
        <p>
          Subject to applicable law, you may request access to, correction of,
          or deletion of your personal information, object to or restrict certain
          processing, and request data portability. To exercise these rights,
          contact us at <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection heading="11. Children">
        <p>
          The Service is intended for users aged 18 and over. We do not knowingly
          collect personal information from children.
        </p>
      </LegalSection>

      <LegalSection heading="12. Changes to this policy">
        <p>
          We may update this Policy from time to time. Material changes will be
          reflected by updating the effective date above.
        </p>
      </LegalSection>

      <LegalSection heading="13. Contact us">
        <p>
          Questions about this Policy or your data? Email{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
