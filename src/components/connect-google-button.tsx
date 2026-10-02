"use client";

import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

export function ConnectGoogleButton({
  redirectUrl,
  beforeRedirect,
}: {
  redirectUrl?: string;
  beforeRedirect?: () => void;
} = {}) {
  const { user } = useUser();
  const isGoogleConnected = user?.externalAccounts.some((account) => account.provider === "google") ?? false;

  const handleConnect = async () => {
    if (!user) return;
    
    try {
      beforeRedirect?.();
      const returnPath = redirectUrl ?? `${window.location.pathname}${window.location.search}`;
      // Find the Google account among user's external accounts
      const googleAccount = user.externalAccounts.find(
        (acc) => acc.provider === "google"
      );

      if (googleAccount) {
        // In Clerk v5, we use reauthorize to request new scopes for an existing account
        await googleAccount.reauthorize({
          redirectUrl: returnPath,
          additionalScopes: [
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events"
          ],
        });
      } else {
        // Link a new Google account
        await user.createExternalAccount({
          strategy: "oauth_google",
          redirectUrl: returnPath,
          additionalScopes: [
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events"
          ],
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to connect Google Calendar");
    }
  };

  return (
    <Button type="button" variant="outline" onClick={handleConnect} className="w-full sm:w-auto">
      <Calendar className="mr-2 h-4 w-4" />
      {isGoogleConnected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
    </Button>
  );
}
