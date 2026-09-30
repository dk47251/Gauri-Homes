import "server-only";

/** Set ALLOW_REGISTRATION=false in .env to close sign-ups once your accounts exist. */
export const isRegistrationOpen = () => process.env.ALLOW_REGISTRATION !== "false";
