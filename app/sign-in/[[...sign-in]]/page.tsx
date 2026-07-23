import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
