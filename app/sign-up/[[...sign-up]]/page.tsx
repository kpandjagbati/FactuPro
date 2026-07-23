import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
