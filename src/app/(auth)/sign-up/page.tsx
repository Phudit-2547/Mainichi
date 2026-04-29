import { signUpAction } from "@/lib/auth/actions";
import { AuthForm } from "../_components/auth-form";

export default function SignUpPage() {
  return <AuthForm mode="sign-up" action={signUpAction} />;
}
