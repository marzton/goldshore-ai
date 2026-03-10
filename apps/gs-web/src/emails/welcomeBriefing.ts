import { escapeHtml } from '../utils/security';

type WelcomeBriefingInput = {
  email: string;
  investorType?: string;
  firstName?: string;
};

const INVESTOR_TYPE_LABELS: Record<string, string> = {
  institutional: 'Institutional',
  'family-office': 'Family Office',
  uhnw: 'UHNW',
  'quantitative-lead': 'Quantitative Lead',
};

const DEFAULT_SIGN_OFF = '— Gold Shore\nStrategic Advisory & Market Intelligence';

const normalizeInvestorType = (value?: string) => {
  const key = value?.trim().toLowerCase() ?? '';
  return INVESTOR_TYPE_LABELS[key] ?? 'Institutional';
};

export function buildWelcomeBriefingEmail({
  email,
  investorType,
  firstName,
}: WelcomeBriefingInput) {
  const safeFirstName = firstName?.trim() ? escapeHtml(firstName.trim()) : 'there';
  const safeEmail = escapeHtml(email.trim());
  const investorTypeLabel = escapeHtml(normalizeInvestorType(investorType));

  const subject = 'Welcome to Gold Shore Strategic Intelligence';

  const text = `Hi ${safeFirstName},

Welcome to Gold Shore Strategic Intelligence Sync.

You are now subscribed to our institutional briefing stream, designed for decision-makers navigating complex capital regimes.

What you’ll receive:
• Market Regime Updates — structural shifts and transition signals
• Liquidity & Risk Briefs — stress pathways, positioning risk, and cross-asset pressure points
• Portfolio Steering Notes — practical implications for timing, exposure, and overlays

Your current profile:
• Investor Type: ${investorTypeLabel}
• Email: ${safeEmail}

To help us tailor future briefings, reply with your current focus (e.g., liquidity planning, derivatives overlays, macro regime positioning).

Request a Briefing: https://goldshore.ai/contact
View Advisory Services: https://goldshore.ai/services

${DEFAULT_SIGN_OFF}

You are receiving this email because you opted into Strategic Intelligence Sync at goldshore.ai.
Manage preferences or unsubscribe: https://goldshore.ai/contact`;

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #111827;">
      <p>Hi ${safeFirstName},</p>
      <p>Welcome to <strong>Gold Shore Strategic Intelligence Sync</strong>.</p>
      <p>
        You are now subscribed to our institutional briefing stream, designed for decision-makers navigating complex capital regimes.
      </p>

      <p><strong>What you'll receive</strong></p>
      <ul>
        <li><strong>Market Regime Updates</strong> — structural shifts and transition signals</li>
        <li><strong>Liquidity &amp; Risk Briefs</strong> — stress pathways, positioning risk, and cross-asset pressure points</li>
        <li><strong>Portfolio Steering Notes</strong> — practical implications for timing, exposure, and overlays</li>
      </ul>

      <p><strong>Your current profile</strong></p>
      <ul>
        <li><strong>Investor Type:</strong> ${investorTypeLabel}</li>
        <li><strong>Email:</strong> ${safeEmail}</li>
      </ul>

      <p>
        To help us tailor future briefings, reply with your current focus (e.g., liquidity planning,
        derivatives overlays, macro regime positioning).
      </p>

      <p>
        <a href="https://goldshore.ai/contact">Request a Briefing</a> ·
        <a href="https://goldshore.ai/services">View Advisory Services</a>
      </p>

      <p style="margin-top: 1.25rem; white-space: pre-line;">${DEFAULT_SIGN_OFF}</p>
      <p style="color: #4b5563; font-size: 0.875rem; margin-top: 1rem;">
        You are receiving this email because you opted into Strategic Intelligence Sync at goldshore.ai.
        Manage preferences or unsubscribe via <a href="https://goldshore.ai/contact">contact</a>.
      </p>
    </div>
  `.trim();

  return { subject, text, html };
}
