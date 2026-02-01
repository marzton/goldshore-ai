type AutoResponderInput = {
  name?: string;
  formType?: string;
};

const DEFAULT_SIGN_OFF = '— The GoldShore team';

export function buildLeadAutoResponder({ name, formType }: AutoResponderInput) {
  const friendlyName = name?.trim() || 'there';
  const title =
    formType === 'lead-qualification'
      ? 'Thanks for sharing your project intake'
      : 'Thanks for getting in touch with GoldShore';

  const intro =
    formType === 'lead-qualification'
      ? 'We are reviewing the details you shared and will follow up with next steps.'
      : 'We have your message and will respond with a tailored plan shortly.';

  const subject = `${title} | GoldShore`;
  const text = `Hi ${friendlyName},

${intro}

If you have additional details, reply to this email or contact us at hello@goldshore.ai.

${DEFAULT_SIGN_OFF}
`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111;">
      <p>Hi ${friendlyName},</p>
      <p>${intro}</p>
      <p>
        If you have additional details, reply to this email or contact us at
        <a href="mailto:hello@goldshore.ai">hello@goldshore.ai</a>.
      </p>
      <p>${DEFAULT_SIGN_OFF}</p>
    </div>
  `.trim();

  return { subject, html, text };
}
