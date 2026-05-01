import "server-only";
import type { EmailMessage, EmailProvider } from "./types";

export function createResendProvider(opts: {
  apiKey: string;
  from: string;
}): EmailProvider {
  return {
    name: "resend",
    async send(message: EmailMessage) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${opts.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: opts.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Resend send failed: ${res.status} ${body}`);
      }
    },
  };
}
