export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailProvider = {
  name: string;
  send(message: EmailMessage): Promise<void>;
};
