import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:border-indigo-700 hover:bg-indigo-700",
  secondary: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  danger: "border-slate-200 bg-white text-red-600 hover:border-red-200 hover:bg-red-50",
} as const;

const sizes = {
  md: "",
  icon: "px-2.5",
} as const;

export type ButtonVariant = keyof typeof variants;

type StyleProps = { variant?: ButtonVariant; size?: keyof typeof sizes };

export const buttonClass = ({ variant = "secondary", size = "md" }: StyleProps = {}, className?: string) =>
  cn(base, variants[variant], sizes[size], className);

export function Button({ variant, size, className, type = "button", ...props }: ComponentProps<"button"> & StyleProps) {
  return <button type={type} className={buttonClass({ variant, size }, className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonClass({ variant, size }, className)} {...props} />;
}
