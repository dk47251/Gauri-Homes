import { z } from "zod";
import {
  DESIGNATIONS,
  EXPENSE_CATEGORIES,
  ID_TYPES,
  PAYMENT_KINDS,
  PAYMENT_MODES,
  PROPERTY_STATUSES,
  RECORD_STATUSES,
} from "./constants";

const text = z.string().trim().default("");
const required = (label: string) => z.string().trim().min(1, `${label} is required.`);
const date = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Invalid date.").default("");
const requiredDate = (label: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} is required.`);
const month = z.string().regex(/^\d{4}-\d{2}$/, "Invalid month.");
const id = z.coerce.number().int().positive().optional();

export const houseSchema = z.object({
  id,
  number: required("House / Plot Number"),
  owner: required("Owner Name"),
  mobile: text,
  whatsapp: text,
  email: text,
  propertyStatus: z.enum(PROPERTY_STATUSES),
  maintenanceApplicable: z.boolean(),
  monthlyMaintenance: z.coerce.number().int().min(0),
  dueDate: date,
  startDate: date,
  status: z.enum(RECORD_STATUSES),
  notes: text,
});
export type HouseInput = z.input<typeof houseSchema>;

export const memberSchema = z.object({
  houseId: z.coerce.number().int().positive(),
  name: required("Member Name"),
  mobile: text,
  whatsapp: text,
  email: z.union([z.literal(""), z.email("Invalid email.")]).default(""),
  startDate: date,
  notes: text,
});
export type MemberInput = z.input<typeof memberSchema>;

export const paymentSchema = z
  .object({
    id,
    houseId: z.coerce.number().int().positive("Select a house."),
    date: requiredDate("Payment Date"),
    month,
    amount: z.coerce.number().int().min(1, "Amount must be at least 1."),
    mode: z.enum(PAYMENT_MODES),
    txn: text,
    remarks: text,
    kind: z.enum(PAYMENT_KINDS),
    advanceMonths: z.coerce.number().int().default(1),
  })
  .refine((p) => p.kind !== "Advance" || p.advanceMonths >= 1, {
    message: "Advance payment ke liye months ki sankhya 1 ya usse zyada honi chahiye.",
    path: ["advanceMonths"],
  })
  .transform((p) => ({ ...p, advanceMonths: p.kind === "Advance" ? p.advanceMonths : 1 }));
export type PaymentInput = z.input<typeof paymentSchema>;

export const expenseSchema = z.object({
  id,
  date: requiredDate("Expense Date"),
  category: z.enum(EXPENSE_CATEGORIES),
  description: required("Description"),
  amount: z.coerce.number().int().min(0),
  mode: z.enum(PAYMENT_MODES),
  vendor: text,
  remarks: text,
  recurring: z.boolean(),
  recurringStart: date,
  recurringEnd: date,
});
export type ExpenseInput = z.input<typeof expenseSchema>;

export const rwaSchema = z.object({
  id,
  name: required("Member Name"),
  houseFlat: text,
  designation: z.enum(DESIGNATIONS),
  phone: text,
  dob: date,
  idProofType: z.string().trim().default("Aadhaar"),
  idProofNumber: text,
  status: z.enum(RECORD_STATUSES),
  notes: text,
});
export type RwaInput = z.input<typeof rwaSchema>;

export const renterSchema = z.object({
  id,
  houseFlat: required("House / Flat No."),
  name: required("Name"),
  age: z.coerce.number().int().min(0).max(120),
  nationality: required("Nationality"),
  phone: text,
  familyCount: z.coerce.number().int().min(1),
  familyMembers: z.array(z.string().trim()).default([]),
  moveInDate: date,
  validIdType: z.enum(ID_TYPES),
  validIdNumber: required("Valid ID Proof Number"),
  notes: text,
});
export type RenterInput = z.input<typeof renterSchema>;

export const settingsSchema = z.object({
  autoBackup: z.boolean(),
  backupTime: z.string().regex(/^\d{2}:\d{2}$/),
  backupEmail: z.union([z.literal(""), z.email("Invalid email.")]).default(""),
  emailApiUrl: text,
  emailBackup: z.boolean(),
  localBackup: z.boolean().default(true),
  retentionDays: z.coerce.number().int().min(1),
});
export type SettingsInput = z.input<typeof settingsSchema>;

/** Parses the JSON `payload` field of a FormData against a schema. */
export function parsePayload<S extends z.ZodType>(schema: S, formData: FormData): z.output<S> {
  const raw = formData.get("payload");
  const json = typeof raw === "string" ? JSON.parse(raw) : {};
  const result = schema.safeParse(json);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? "Invalid data.");
  return result.data;
}
