import { SignIn } from "@clerk/nextjs";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function SignInPage() {
  return (
    <div className="hero relative min-h-screen bg-base-200">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="hero-content">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/invoices"
        />
      </div>
    </div>
  );
}
