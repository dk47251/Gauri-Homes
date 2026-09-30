export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { syncSystemAdmin } = await import("@/lib/auth/system-admin");
  try {
    await syncSystemAdmin();
  } catch (e) {
    // e.g. migrations not applied yet — login will retry the sync.
    console.error("[auth] Could not sync the administrator account from .env:", e);
  }
}
