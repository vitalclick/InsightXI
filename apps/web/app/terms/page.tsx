import type { Metadata } from "next";
import {
  LEGAL_CONTACT_EMAIL,
  LegalSection,
  LegalShell,
} from "../../components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Terms of Service — InsightXI",
  description: "The terms governing your use of the InsightXI platform.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service">
      <p style={{ marginBottom: 24 }}>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
        use of InsightXI (the &ldquo;Service&rdquo;). By creating an account or
        using the Service, you agree to these Terms. If you do not agree, do not
        use the Service.
      </p>

      <LegalSection heading="1. What InsightXI is — and is not">
        <p>
          InsightXI is an analytical football intelligence platform. It presents{" "}
          <strong>statistical probabilities, models, and explainable insights</strong>{" "}
          for informational and educational purposes. It is{" "}
          <strong>not</strong> a gambling, betting, or financial service, and it
          does not offer guaranteed outcomes, &ldquo;sure wins&rdquo;, or betting
          advice. Any decisions you make are your own responsibility.
        </p>
      </LegalSection>

      <LegalSection heading="2. Eligibility">
        <p>
          You must be at least 18 years old and able to form a binding contract
          to use the Service.
        </p>
      </LegalSection>

      <LegalSection heading="3. Accounts">
        <p>
          You are responsible for safeguarding your account credentials and for
          all activity under your account. Provide accurate information and keep
          it up to date. Notify us promptly of any unauthorized use.
        </p>
      </LegalSection>

      <LegalSection heading="4. Subscriptions and billing">
        <ul>
          <li>
            Premium access is offered at US$2.49, which grants 30 days of full
            access per successful payment.
          </li>
          <li>
            Prices may be displayed in your local currency for convenience;
            payment is settled by the chosen provider (PayPal, Paystack, or
            Flutterwave) in a supported currency.
          </li>
          <li>
            Access is granted for the period stated at checkout and does not
            renew automatically unless expressly indicated at the time of
            purchase.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Refunds">
        <p>
          Because Premium unlocks digital analytical content immediately, fees
          are generally non-refundable except where required by applicable law.
          If you believe you were charged in error, contact{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> and
          we will review your request in good faith.
        </p>
      </LegalSection>

      <LegalSection heading="6. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>scrape, resell, or redistribute the Service&rsquo;s data or outputs without permission;</li>
          <li>attempt to disrupt, overload, or gain unauthorized access to the Service;</li>
          <li>use the Service for unlawful purposes or to misrepresent our outputs as guaranteed outcomes.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="7. Intellectual property">
        <p>
          The Service, including its models, analytics, design, and content
          (excluding third-party football data), is owned by us or our licensors
          and protected by intellectual property laws. We grant you a limited,
          non-exclusive, non-transferable licence to use the Service for its
          intended purpose.
        </p>
      </LegalSection>

      <LegalSection heading="8. Disclaimers">
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; without warranties of any kind. Predictions are
          probabilistic estimates and may be inaccurate. We do not warrant that
          the Service will be uninterrupted, error-free, or fit for any
          particular purpose.
        </p>
      </LegalSection>

      <LegalSection heading="9. Limitation of liability">
        <p>
          To the maximum extent permitted by law, InsightXI and its operators
          will not be liable for any indirect, incidental, special, or
          consequential damages, or for any losses arising from decisions you
          make based on the Service. Our total liability for any claim is limited
          to the amount you paid us in the 12 months preceding the claim.
        </p>
      </LegalSection>

      <LegalSection heading="10. Termination">
        <p>
          You may stop using the Service at any time. We may suspend or terminate
          access if you breach these Terms or to protect the Service and its
          users.
        </p>
      </LegalSection>

      <LegalSection heading="11. Governing law">
        <p>
          These Terms are governed by the laws of the Republic of South Africa,
          without regard to conflict-of-laws principles. Mandatory consumer
          protections in your country of residence still apply.
        </p>
      </LegalSection>

      <LegalSection heading="12. Changes to these Terms">
        <p>
          We may update these Terms from time to time. Continued use after
          changes take effect constitutes acceptance of the updated Terms.
        </p>
      </LegalSection>

      <LegalSection heading="13. Contact">
        <p>
          Questions about these Terms? Email{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
