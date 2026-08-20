import { SignUp } from "@clerk/nextjs";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function SignUpPage() {
  return (
    <div className="hero relative min-h-screen bg-base-200 px-4">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="hero-content w-full max-w-md py-8">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/invoices"
        />
      </div>
    </div>
  );
}
