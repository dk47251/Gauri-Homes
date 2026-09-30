export const APP_NAME = "Gauri Home Management";

export const PROPERTY_STATUSES = [
  "Built House – Occupied",
  "Built House – Vacant",
  "Vacant Plot",
  "Shop – Occupied",
  "Shop – Vacant",
  "Shop – Vacant Plot",
  "Flat – Occupied",
  "Flat – Vacant",
] as const;

export const DESIGNATIONS = [
  "President",
  "Vice-President",
  "General Secretary",
  "Joint Secretary",
  "Treasurer",
  "Executive Committee Members",
] as const;

export const EXPENSE_CATEGORIES = [
  "Electricity",
  "Water",
  "Cleaning",
  "Repair",
  "Security",
  "Maintenance",
  "Salary",
  "Other",
] as const;

export const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Other"] as const;

export const ID_TYPES = ["Aadhaar", "PAN", "Driving Licence", "Voter ID", "Passport", "Other"] as const;

export const RWA_ID_TYPES = ["Aadhaar", "PAN", "Driving Licence", "Voter ID", "Other"] as const;

export const MAINTENANCE_OPTIONS = [
  { value: 0, label: "₹0 — No Maintenance" },
  { value: 500, label: "₹500" },
  { value: 1000, label: "₹1,000" },
] as const;

export const RECORD_STATUSES = ["Active", "Inactive"] as const;

export const PAYMENT_KINDS = ["Regular", "Advance"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const DOCUMENT_KINDS = ["ID_PROOF", "PHOTO", "BILL"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

/** Max size of a single uploaded file. Keep in sync with serverActions.bodySizeLimit. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
