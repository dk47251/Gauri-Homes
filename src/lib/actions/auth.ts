"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isRegistrationOpen } from "@/lib/auth/config";
import { ROLES, USER_STATUS, safeNext } from "@/lib/auth/constants";
import { getDummyHash, hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearFailures, isRateLimited, recordFailure } from "@/lib/auth/rate-limit";
import { createSession, deleteSession } from "@/lib/auth/session";
import { syncSystemAdmin } from "@/lib/auth/system-admin";

export type AuthFormState = {
  error?: string;
  /** Shown after a successful registration (account waits for approval). */
  success?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "confirmPassword", string>>;
  values?: { name?: string; email?: string };
} | undefined;

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
    email,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128)
      .regex(/[a-zA-Z]/, "Password must contain a letter.")
      .regex(/\d/, "Password must contain a number."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

const fieldErrors = (error: z.ZodError) => {
  const out: NonNullable<AuthFormState>["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof typeof out;
    out[key] ??= issue.message;
  }
  return out;
};

export async function register(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isRegistrationOpen()) return { error: "Registration is disabled. Ask an administrator for an account." };

  const raw = Object.fromEntries(formData);
  const values = { name: String(raw.name ?? ""), email: String(raw.email ?? "") };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const { name, email, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { fieldErrors: { email: "An account with this email already exists." }, values };
  }

  // New accounts cannot log in until an administrator approves them.
  await prisma.user.create({
    data: { name, email, role: ROLES.USER, status: USER_STATUS.PENDING, passwordHash: await hashPassword(password) },
  });
  return {
    success: "Registration successful! Your account is waiting for administrator approval. You can log in once it is approved.",
  };
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = Object.fromEntries(formData);
  const values = { email: String(raw.email ?? "") };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const { email, password } = parsed.data;
  if (isRateLimited(email)) return { error: "Too many failed attempts. Please try again in 15 minutes.", values };

  // Pick up any change to ADMIN_EMAIL / ADMIN_PASSWORD in .env.
  await syncSystemAdmin().catch((e) => console.error("[auth] admin sync failed:", e));

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true, status: true } });
  // Always run a hash comparison so response time doesn't reveal whether the email exists.
  const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid) {
    recordFailure(email);
    return { error: "Invalid email or password.", values };
  }

  clearFailures(email);
  // Only reveal the approval state after the password has been verified.
  if (user.status === USER_STATUS.PENDING) {
    return { error: "Your account is waiting for administrator approval. Please try again later.", values };
  }
  if (user.status !== USER_STATUS.APPROVED) {
    return { error: "Your account has been rejected or disabled. Please contact the administrator.", values };
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  redirect(safeNext(raw.next));
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
