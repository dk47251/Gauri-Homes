import type { Metadata } from "next";
import Link from "next/link";
import { isRegistrationOpen } from "@/lib/auth/config";
import { safeNext } from "@/lib/auth/constants";
import { AuthCard } from "../_components/auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext((await searchParams).next);

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to manage your colony."
      footer={
        isRegistrationOpen() ? (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Create one
            </Link>
          </>
        ) : (
          "Need access? Ask an administrator to create your account."
        )
      }
    >
      <LoginForm next={next} />
    </AuthCard>
  );
}
