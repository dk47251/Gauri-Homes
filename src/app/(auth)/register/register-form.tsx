"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { register } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/form";
import { FieldError } from "../_components/auth-card";
import { PasswordInput } from "../_components/password-input";

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);
  const errors = state?.fieldErrors;

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={30} />
        </div>
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{state.success}</p>
        <Link href="/login" className="inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError message={state?.error} />
      <Field label="Full Name" required>
        <Input name="name" autoComplete="name" required autoFocus defaultValue={state?.values?.name} aria-invalid={!!errors?.name} />
        <FieldError message={errors?.name} />
      </Field>
      <Field label="Email" required>
        <Input name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} aria-invalid={!!errors?.email} />
        <FieldError message={errors?.email} />
      </Field>
      <Field label="Password" required>
        <PasswordInput name="password" autoComplete="new-password" required minLength={8} aria-invalid={!!errors?.password} />
        {errors?.password ? (
          <FieldError message={errors.password} />
        ) : (
          <p className="mt-1.5 text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>
        )}
      </Field>
      <Field label="Confirm Password" required>
        <PasswordInput name="confirmPassword" autoComplete="new-password" required aria-invalid={!!errors?.confirmPassword} />
        <FieldError message={errors?.confirmPassword} />
      </Field>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
