import type { Metadata } from "next";
import {
  LEGAL_CONTACT_EMAIL,
  LegalSection,
  LegalShell,
} from "../../components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Responsible Gambling — InsightXI",
  description:
    "Betting should stay fun. How to keep it under control, the warning signs of a problem, and where to get free, confidential help.",
};

export default function ResponsibleGamblingPage() {
  return (
    <LegalShell title="Responsible Gambling">
      <p style={{ marginBottom: 24 }}>
        InsightXI provides football betting tips and predictions for people aged{" "}
        <strong>18 or over</strong> (or the legal gambling age where you live).
        Betting should be entertainment, never a way to make money or solve
        financial problems. No tip is a sure thing — every bet carries real risk,
        and you should only ever stake money you can afford to lose.
      </p>

      <LegalSection heading="A few ground rules">
        <ul>
          <li>Set a budget before you bet, and never exceed it.</li>
          <li>Only bet money you can comfortably afford to lose.</li>
          <li>Don&rsquo;t chase losses — trying to win it back usually makes things worse.</li>
          <li>Never bet to escape stress, low mood, or money worries.</li>
          <li>Don&rsquo;t bet under the influence of alcohol or drugs.</li>
          <li>Take regular breaks and keep betting a small part of your life.</li>
          <li>Treat any winnings as a bonus, not income you rely on.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Warning signs of a problem">
        <p>It may be time to step back if you:</p>
        <ul>
          <li>spend more time or money on betting than you intended;</li>
          <li>chase losses or bet bigger to feel the same excitement;</li>
          <li>borrow money, sell things, or fall behind on bills to fund betting;</li>
          <li>lie to friends or family about how much you bet;</li>
          <li>feel anxious, irritable, or guilty about your betting;</li>
          <li>can&rsquo;t stop or cut down even when you want to.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Tools that can help">
        <p>
          Licensed bookmakers are required to offer tools to help you stay in
          control — use them. These typically include deposit and loss limits,
          time-outs, reality checks, and <strong>self-exclusion</strong> (blocking
          your own access for a set period). If betting has stopped being fun,
          set a limit or self-exclude today.
        </p>
      </LegalSection>

      <LegalSection heading="Get free, confidential help">
        <p>
          Support is available 24/7, and it&rsquo;s free and confidential. If you
          or someone you know may have a gambling problem, reach out:
        </p>
        <ul>
          <li>
            <strong>South Africa</strong> — National Responsible Gambling
            Programme helpline: <strong>0800 006 008</strong> (toll-free), or
            WhatsApp/SMS support via{" "}
            <a href="https://www.responsiblegambling.org.za" target="_blank" rel="noopener noreferrer">
              responsiblegambling.org.za
            </a>
            .
          </li>
          <li>
            <strong>United Kingdom</strong> — GamCare:{" "}
            <strong>0808 8020 133</strong>, or{" "}
            <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer">
              begambleaware.org
            </a>
            .
          </li>
          <li>
            <strong>International</strong> — Gambling Therapy offers free online
            support worldwide:{" "}
            <a href="https://www.gamblingtherapy.org" target="_blank" rel="noopener noreferrer">
              gamblingtherapy.org
            </a>
            . If you&rsquo;re elsewhere, search for your country&rsquo;s national
            gambling helpline.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How InsightXI fits in">
        <p>
          InsightXI is a tips and predictions service — we are{" "}
          <strong>not</strong> a bookmaker and we never accept, place, or settle
          bets. Any bet you make is with a third-party operator and is your own
          decision. Please only use licensed, regulated bookmakers, and keep the
          guidance above in mind every time you bet.
        </p>
        <p>
          Questions or concerns? Email{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
