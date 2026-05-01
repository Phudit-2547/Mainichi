import { requestPasswordResetAction } from "@/lib/auth/reset-actions";
import { ForgotPasswordForm } from "../_components/forgot-password-form";

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm action={requestPasswordResetAction} />;
}
