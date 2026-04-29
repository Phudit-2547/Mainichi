import { signInAction } from "@/lib/auth/actions";
import { AuthForm } from "../_components/auth-form";

export default function SignInPage() {
  return <AuthForm mode="sign-in" action={signInAction} />;
}
