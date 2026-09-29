import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { getWhatsAppStatus } from "@/lib/whatsapp";
import { isStorageConfigured } from "@/lib/storage";

export default async function AdminSettingsPage() {
  const [settings, whatsapp] = await Promise.all([
    prisma.siteSetting.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
    prisma.whatsAppSetting.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } })
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink">Settings</h1>
      <SettingsForm
        initialSettings={settings}
        initialWhatsApp={whatsapp}
        razorpayStatus={isRazorpayConfigured() ? "CONNECTED" : "NOT_CONFIGURED"}
        whatsappStatus={getWhatsAppStatus()}
        storageStatus={isStorageConfigured() ? "CONNECTED" : "NOT_CONFIGURED"}
      />
    </div>
  );
}
