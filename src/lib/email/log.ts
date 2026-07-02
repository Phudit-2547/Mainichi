import "server-only";
import type { EmailMessage, EmailProvider } from "./types";

// Dev/test fallback. Prints the email payload to stdout so a developer can
// click the reset link from their terminal without configuring a real
// provider. Never select this in production.
export function createLogProvider(opts: { from: string }): EmailProvider {
  return {
    name: "log",
    async send(message: EmailMessage) {
      console.log(
        [
          "──── email (log provider) ────",
          `from:    ${opts.from}`,
          `to:      ${message.to}`,
          `subject: ${message.subject}`,
          "",
          message.text,
          "──────────────────────────────",
        ].join("\n"),
      );
    },
  };
}
