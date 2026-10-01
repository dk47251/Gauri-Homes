"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/form";
import { FieldError } from "../_components/auth-card";
import { PasswordInput } from "../_components/password-input";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormError message={state?.error} />
      <Field label="Email">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          defaultValue={state?.values?.email}
          aria-invalid={!!state?.fieldErrors?.email}
        />
        <FieldError message={state?.fieldErrors?.email} />
      </Field>
      <Field label="Password">
        <PasswordInput name="password" autoComplete="current-password" required aria-invalid={!!state?.fieldErrors?.password} />
        <FieldError message={state?.fieldErrors?.password} />
      </Field>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
