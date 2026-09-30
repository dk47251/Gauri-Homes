import type { Metadata } from "next";
import Link from "next/link";
import { isRegistrationOpen } from "@/lib/auth/config";
import { AuthCard } from "../_components/auth-card";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  const open = isRegistrationOpen();

  return (
    <AuthCard
      title="Create your account"
      subtitle={open ? "Register to request access. An administrator will approve your account." : "Registration is currently closed."}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Log in
          </Link>
        </>
      }
    >
      {open ? (
        <RegisterForm />
      ) : (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Ask an administrator to create an account for you.</p>
      )}
    </AuthCard>
  );
}
