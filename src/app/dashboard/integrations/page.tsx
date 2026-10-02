import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getWebhookSigningSecret } from "@/lib/integrations";
import { IntegrationsForm } from "./integrations-form";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const integration = await db.query.integrations.findFirst({
    where: (record, { eq }) => eq(record.userId, userId),
  });
  const webhookSigningSecret = await getWebhookSigningSecret(userId);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <header className="border-b border-[#e5dff0] pb-5">
        <p className="text-sm font-medium text-[#6426d9]">Connect your website</p>
        <h1 className="mt-1 text-2xl font-medium text-[#1f1f1f]">Integrations</h1>
      </header>
      <IntegrationsForm
        apiKeyPrefix={integration?.apiKeyPrefix ?? null}
        apiKeyLastUsedAt={integration?.apiKeyLastUsedAt?.toISOString() ?? null}
        initialWebhookUrl={integration?.webhookUrl ?? ""}
        webhookSigningSecret={webhookSigningSecret}
      />
    </div>
  );
}