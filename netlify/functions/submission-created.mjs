import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const COMPANY_EMAIL = "luhecleaning@gmail.com";
const FROM_EMAIL = "LuHe Cleaning <quote@luhecleaning.com>";
const REPLY_TO = "luhecleaning@gmail.com";
const COMPANY_PHONE = "(508) 736-8397";
const COMPANY_SITE = "https://luhecleaning.com";

function safe(value, fallback = "Not provided") {
  return String(value || fallback)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function adminEmail(lead) {
  return `
  <div style="background:#f3f7fb;padding:28px;font-family:Arial,sans-serif;color:#0a1d33;">
    <div style="max-width:680px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(6,63,109,.12);">
      <div style="background:#063F6D;color:#fff;padding:26px;">
        <h1 style="margin:0;font-size:24px;">New Quote Request</h1>
        <p style="margin:6px 0 0;color:#dceaf6;">LuHe Cleaning website lead</p>
      </div>

      <div style="padding:28px;">
        <p><strong>Name:</strong> ${safe(lead.name)}</p>
        <p><strong>Phone:</strong> <a href="tel:${safe(lead.phone)}" style="color:#0B6FB8;">${safe(lead.phone)}</a></p>
        <p><strong>Email:</strong> <a href="mailto:${safe(lead.email)}" style="color:#0B6FB8;">${safe(lead.email)}</a></p>
        <p><strong>Service:</strong> ${safe(lead.service)}</p>

        <div style="margin-top:18px;padding:18px;background:#EAF6FF;border:1px solid #D7E6F2;border-radius:14px;">
          <p style="margin:0 0 8px;color:#506172;font-size:14px;">Message</p>
          <p style="margin:0;font-size:16px;line-height:1.6;">${safe(lead.message, "No message provided")}</p>
        </div>

        <div style="margin-top:24px;">
          <a href="tel:${safe(lead.phone)}" style="display:inline-block;background:#0B6FB8;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700;margin-right:8px;">Call Customer</a>
          <a href="mailto:${safe(lead.email)}" style="display:inline-block;background:#063F6D;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700;">Reply by Email</a>
        </div>
      </div>
    </div>

    <p style="text-align:center;color:#708294;font-size:12px;margin-top:18px;">
      Sent automatically from ${COMPANY_SITE}
    </p>
  </div>`;
}

function customerEmail(lead) {
  return `
  <div style="background:#f3f7fb;padding:28px;font-family:Arial,sans-serif;color:#0a1d33;">
    <div style="max-width:640px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(6,63,109,.12);">
      <div style="background:#063F6D;color:#fff;padding:28px;text-align:center;">
        <h1 style="margin:0;font-size:26px;">Thanks, ${safe(lead.name, "there")}.</h1>
        <p style="margin:8px 0 0;color:#dceaf6;">We received your quote request.</p>
      </div>

      <div style="padding:30px;">
        <p style="font-size:17px;line-height:1.6;margin:0 0 18px;">
          Thank you for contacting <strong>LuHe Cleaning</strong>. We received your request and will contact you shortly with a clear price.
        </p>

        <div style="background:#EAF6FF;border:1px solid #D7E6F2;padding:16px;border-radius:14px;margin-bottom:22px;">
          <strong style="color:#063F6D;">Requested service: ${safe(lead.service, "Cleaning service")}</strong>
        </div>

        <div style="text-align:center;margin:28px 0;">
          <a href="tel:+15087368397" style="display:inline-block;background:#0B6FB8;color:#fff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:700;">Call ${COMPANY_PHONE}</a>
        </div>

        <p style="font-size:14px;color:#506172;line-height:1.6;margin:0;">
          LuHe Cleaning<br>
          Carpet & Upholstery Cleaning<br>
          Shrewsbury, Worcester & Central MA
        </p>
      </div>
    </div>

    <p style="text-align:center;color:#708294;font-size:12px;margin-top:18px;">
      ${COMPANY_SITE}
    </p>
  </div>`;
}

export async function handler(event) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("RESEND_API_KEY is missing.");
      return { statusCode: 200, body: "Form saved. Missing API key." };
    }

    const body = JSON.parse(event.body || "{}");
    const data = body.payload?.data || {};

    const lead = {
      name: data.name || "",
      phone: data.phone || "",
      email: data.email || "",
      service: data.service || "",
      message: data.message || ""
    };

    await resend.emails.send({
      from: FROM_EMAIL,
      to: COMPANY_EMAIL,
      reply_to: lead.email || REPLY_TO,
      subject: `New Quote Request - ${lead.service || "LuHe Cleaning"}`,
      html: adminEmail(lead)
    });

    if (lead.email && lead.email.includes("@")) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: lead.email,
        reply_to: REPLY_TO,
        subject: "We received your request - LuHe Cleaning",
        html: customerEmail(lead)
      });
    }

    return { statusCode: 200, body: "Emails sent" };
  } catch (error) {
    console.error("Resend function error:", error);
    return { statusCode: 200, body: "Form saved. Email failed silently." };
  }
}