import { currentUser } from "@clerk/nextjs/server";

function getAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function isAdminUser(): Promise<boolean> {
  const adminEmails = getAdminEmails();
  if (adminEmails.size === 0) return false;

  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress;
  return Boolean(
    primaryEmail
    && primaryEmail.verification?.status === "verified"
    && adminEmails.has(primaryEmail.emailAddress.trim().toLowerCase()),
  );
}