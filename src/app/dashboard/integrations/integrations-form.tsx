"use client";

import { useState } from "react";
import { Copy, RotateCw, Save } from "lucide-react";
import { toast } from "sonner";
import { rotateIntegrationApiKey, saveIntegrationWebhookUrl } from "@/actions/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function IntegrationsForm({
  apiKeyPrefix,
  apiKeyLastUsedAt,
  initialWebhookUrl,
  webhookSigningSecret,
}: {
  apiKeyPrefix: string | null;
  apiKeyLastUsedAt: string | null;
  initialWebhookUrl: string;
  webhookSigningSecret: string | null;
}) {
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [isRotatingKey, setIsRotatingKey] = useState(false);
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);

  async function handleRotateKey() {
    setIsRotatingKey(true);
    try {
      const result = await rotateIntegrationApiKey();
      setNewApiKey(result.apiKey);
      toast.success("API key rotated");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not rotate API key");
    } finally {
      setIsRotatingKey(false);
    }
  }

  async function handleSaveWebhook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingWebhook(true);
    try {
      await saveIntegrationWebhookUrl(webhookUrl);
      toast.success(webhookUrl.trim() ? "Webhook saved" : "Webhook removed");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not save webhook");
    } finally {
      setIsSavingWebhook(false);
    }
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#1f1f1f]">Booking-link API</h2>
            <p className="mt-1 text-sm text-[#5f6368]">
              Generate a prefilled booking link from your website backend.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleRotateKey} disabled={isRotatingKey}>
            <RotateCw className="mr-2 size-4" /> {apiKeyPrefix ? "Rotate API key" : "Generate API key"}
          </Button>
        </div>
        {apiKeyPrefix && !newApiKey && (
          <div className="rounded-lg bg-[#f8f5ff] px-4 py-3 text-sm">
            <p className="font-medium text-[#1f1f1f]">Active key: <code>{apiKeyPrefix}</code></p>
            <p className="mt-1 text-xs text-[#5f6368]">
              {apiKeyLastUsedAt ? `Last used ${new Date(apiKeyLastUsedAt).toLocaleString()}` : "Not used yet"}
            </p>
          </div>
        )}
        {newApiKey && (
          <div className="rounded-lg border border-[#d9cfea] bg-[#f8f5ff] p-4">
            <p className="text-sm font-semibold text-[#1f1f1f]">Copy this API key now</p>
            <p className="mt-1 text-xs text-[#5f6368]">It is only shown once. Rotating it immediately invalidates the previous key.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <code className="min-w-0 flex-1 break-all rounded-md bg-white px-3 py-2 text-xs">{newApiKey}</code>
              <Button type="button" variant="outline" onClick={() => copyValue(newApiKey, "API key")}>
                <Copy className="mr-2 size-4" /> Copy key
              </Button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#1f1f1f]">Request</p>
          <pre className="overflow-x-auto rounded-lg bg-[#211c2a] p-4 text-xs leading-relaxed text-white">{[
            "POST https://cal.heyclift.xyz/api/v1/booking-links",
            "Authorization: Bearer YOUR_API_KEY",
            "Content-Type: application/json",
            "",
            '{"eventSlug":"20-min","name":"Avery Example","email":"avery@example.com"}',
          ].join("\n")}</pre>
          <p className="text-xs text-[#5f6368]">Call this from your website server, never from browser JavaScript. The response contains a booking URL with name and email prefilled.</p>
        </div>
      </section>

      <section className="space-y-4 border-t border-[#e5dff0] pt-6">
        <div>
          <h2 className="text-base font-semibold text-[#1f1f1f]">Booking webhook</h2>
          <p className="mt-1 text-sm text-[#5f6368]">Heycal sends a signed `booking.created` event after a booking is saved.</p>
        </div>
        <form className="space-y-3" onSubmit={handleSaveWebhook}>
          <div className="space-y-2">
            <Label htmlFor="webhook-url">HTTPS endpoint</Label>
            <Input
              id="webhook-url"
              type="url"
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
              placeholder="https://yourcompany.com/api/heycal-webhook"
            />
          </div>
          <Button type="submit" variant="outline" disabled={isSavingWebhook}>
            <Save className="mr-2 size-4" /> Save webhook
          </Button>
        </form>
        {webhookSigningSecret ? (
          <div className="space-y-2">
            <Label>Webhook signing secret</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="min-w-0 flex-1 break-all rounded-md bg-[#f8f5ff] px-3 py-2 text-xs">{webhookSigningSecret}</code>
              <Button type="button" variant="outline" onClick={() => copyValue(webhookSigningSecret, "Webhook secret")}>
                <Copy className="mr-2 size-4" /> Copy secret
              </Button>
            </div>
            <p className="text-xs text-[#5f6368]">Keep this secret on your server. Verify `X-Heycal-Timestamp` and the `v1` HMAC in `X-Heycal-Signature` against the exact request body.</p>
          </div>
        ) : (
          <p className="text-sm text-amber-700">Webhook signing is disabled until `WEBHOOK_SIGNING_SECRET` is configured as a Cloudflare Worker secret.</p>
        )}
      </section>
    </div>
  );
}