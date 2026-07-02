import "server-only";
import { createTransport } from "nodemailer";
import type { EmailMessage, EmailProvider } from "./types";

export function createSmtpProvider(opts: {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  secure: boolean;
  from: string;
}): EmailProvider {
  const transport = createTransport({
    host: opts.host,
    port: opts.port,
    secure: opts.secure,
    auth: opts.user && opts.pass ? { user: opts.user, pass: opts.pass } : undefined,
  });

  return {
    name: "smtp",
    async send(message: EmailMessage) {
      await transport.sendMail({
        from: opts.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    },
  };
}
