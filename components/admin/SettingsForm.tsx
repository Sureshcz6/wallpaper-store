"use client";

import { useState } from "react";

type Props = {
  initialSettings: { websiteName: string; supportWhatsapp: string | null; supportEmail: string | null; primaryColorHex: string };
  initialWhatsApp: { provider: string | null; phoneNumberId: string | null; messageTemplate: string; automationEnabled: boolean };
  razorpayStatus: "CONNECTED" | "NOT_CONFIGURED";
  whatsappStatus: "CONNECTED" | "NOT_CONFIGURED" | "ERROR";
  storageStatus: "CONNECTED" | "NOT_CONFIGURED";
};

export function SettingsForm({ initialSettings, initialWhatsApp, razorpayStatus, whatsappStatus, storageStatus }: Props) {
  const [site, setSite] = useState(initialSettings);
  const [wa, setWa] = useState(initialWhatsApp);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function saveSite() {
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(site) });
    setSavedMsg("Site settings saved.");
    setTimeout(() => setSavedMsg(null), 2000);
  }

  async function saveWhatsApp() {
    await fetch("/api/settings/whatsapp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(wa) });
    setSavedMsg("WhatsApp settings saved.");
    setTimeout(() => setSavedMsg(null), 2000);
  }

  const inputClass = "w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-ink focus-ring";
  const labelClass = "mb-1 block text-sm text-muted";
  const badge = (status: string) => (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        status === "CONNECTED" ? "bg-accent-2/10 text-accent-2" : "bg-white/5 text-muted"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );

  return (
    <div className="max-w-xl space-y-10">
      <section className="rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-ink">Integration status</h2>
        <div className="mt-3 space-y-2 text-sm text-muted">
          <div className="flex justify-between"><span>Razorpay</span>{badge(razorpayStatus)}</div>
          <div className="flex justify-between"><span>WhatsApp</span>{badge(whatsappStatus)}</div>
          <div className="flex justify-between"><span>Object storage</span>{badge(storageStatus)}</div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg text-ink">Site settings</h2>
        <div>
          <label className={labelClass}>Website name</label>
          <input className={inputClass} value={site.websiteName} onChange={(e) => setSite({ ...site, websiteName: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Support WhatsApp number</label>
          <input className={inputClass} value={site.supportWhatsapp ?? ""} onChange={(e) => setSite({ ...site, supportWhatsapp: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Support email</label>
          <input className={inputClass} value={site.supportEmail ?? ""} onChange={(e) => setSite({ ...site, supportEmail: e.target.value })} />
        </div>
        <button onClick={saveSite} className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white">Save</button>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg text-ink">WhatsApp automation</h2>
        <div>
          <label className={labelClass}>Provider</label>
          <input className={inputClass} value={wa.provider ?? ""} onChange={(e) => setWa({ ...wa, provider: e.target.value })} placeholder="meta_cloud_api" />
        </div>
        <div>
          <label className={labelClass}>Phone Number ID</label>
          <input className={inputClass} value={wa.phoneNumberId ?? ""} onChange={(e) => setWa({ ...wa, phoneNumberId: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Default message template</label>
          <textarea className={inputClass} rows={3} value={wa.messageTemplate} onChange={(e) => setWa({ ...wa, messageTemplate: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={wa.automationEnabled} onChange={(e) => setWa({ ...wa, automationEnabled: e.target.checked })} />
          Enable automation
        </label>
        <p className="text-xs text-muted">
          The access token itself is set via the WHATSAPP_ACCESS_TOKEN environment variable and is never shown here.
        </p>
        <button onClick={saveWhatsApp} className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white">Save</button>
      </section>

      {savedMsg && <p className="text-sm text-accent-2">{savedMsg}</p>}
    </div>
  );
}
