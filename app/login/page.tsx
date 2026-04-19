import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <Suspense
        fallback={
          <div className="flex min-h-[320px] items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
