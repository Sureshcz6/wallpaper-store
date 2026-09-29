/**
 * WhatsApp integration abstraction.
 *
 * Two distinct things are supported:
 * 1) A plain "Chat on WhatsApp" wa.me link (works with zero configuration).
 * 2) Outbound automated messages via an official WhatsApp Business API
 *    provider (e.g. Meta's Cloud API). This requires real credentials and
 *    is only attempted when WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID
 *    are actually set - otherwise we report NOT_CONFIGURED rather than
 *    pretending the message was sent.
 */

export type WhatsAppStatus = "CONNECTED" | "NOT_CONFIGURED" | "ERROR";

export function getWhatsAppStatus(): WhatsAppStatus {
  const hasToken = Boolean(process.env.WHATSAPP_ACCESS_TOKEN);
  const hasPhoneId = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID);
  if (hasToken && hasPhoneId) return "CONNECTED";
  return "NOT_CONFIGURED";
}

export function buildWaMeLink(params: { phone?: string; message?: string }): string {
  const phone = (params.phone || process.env.WHATSAPP_SUPPORT_NUMBER || "").replace(/[^0-9]/g, "");
  const text = encodeURIComponent(params.message ?? "");
  return `https://wa.me/${phone}${text ? `?text=${text}` : ""}`;
}

export function renderTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => String(vars[key] ?? ""));
}

/**
 * Sends a templated message through the configured provider.
 * Returns { sent: false, reason: "NOT_CONFIGURED" } rather than throwing,
 * so callers (e.g. the payment-verification flow) can proceed without the
 * message being a hard dependency of order success.
 */
export async function sendWhatsAppMessage(params: {
  toPhone: string;
  message: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const status = getWhatsAppStatus();
  if (status !== "CONNECTED") {
    return { sent: false, reason: "NOT_CONFIGURED" };
  }

  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const to = params.toPhone.replace(/[^0-9]/g, "");

    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: params.message }
      })
    });

    if (!res.ok) {
      return { sent: false, reason: `PROVIDER_ERROR_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: "NETWORK_ERROR" };
  }
}
