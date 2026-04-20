import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Suspense
        fallback={
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#FAFAF8",
            }}
          >
            <LoadingSpinner />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
