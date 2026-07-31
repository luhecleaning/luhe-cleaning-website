import { Resend } from "resend";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

const COMPANY_EMAIL =
  process.env.CONTACT_TO_EMAIL || "luhecleaning@gmail.com";

const FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL ||
  "LuHe Cleaning <quote@luhecleaning.com>";

const REPLY_TO = "luhecleaning@gmail.com";
const COMPANY_PHONE = "(508) 736-8397";
const COMPANY_SITE = "https://luhecleaning.com";

const LEADS_WEBHOOK_URL = process.env.LEADS_WEBHOOK_URL;
const LEADS_WEBHOOK_SECRET = process.env.LEADS_WEBHOOK_SECRET;

// In-memory rate limiting map for serverless instances
const ipCache = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const limit = 5;
  const timeframe = 60000;

  if (!ip) return false;

  if (!ipCache.has(ip)) {
    ipCache.set(ip, [now]);
    return false;
  }

  let timestamps = ipCache.get(ip);
  timestamps = timestamps.filter((timestamp) => now - timestamp < timeframe);

  if (timestamps.length >= limit) {
    return true;
  }

  timestamps.push(now);
  ipCache.set(ip, timestamps);

  return false;
}

// HTML escaping helper
function safe(value, fallback = "Not provided") {
  return String(value || fallback)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
}

async function saveLeadToSpreadsheet(lead) {
  if (!LEADS_WEBHOOK_URL || !LEADS_WEBHOOK_SECRET) {
    throw new Error("Lead spreadsheet webhook is not configured.");
  }

  const webhookResponse = await fetch(LEADS_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      secret: LEADS_WEBHOOK_SECRET,
      ...lead
    })
  });

  const responseText = await webhookResponse.text();
  let responseData;

  try {
    responseData = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Lead spreadsheet returned invalid JSON (${webhookResponse.status}).`
    );
  }

  if (!webhookResponse.ok || !responseData.success) {
    throw new Error(
      responseData.error ||
        `Lead spreadsheet request failed (${webhookResponse.status}).`
    );
  }
}

function adminEmail(lead) {
  return `
  <div style="background:#f3f7fb;padding:28px;font-family:Arial,sans-serif;color:#0a1d33;">
    <div style="max-width:680px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(6,63,109,.12);">
      <div style="background:#063F6D;color:#fff;padding:26px;">
        <h1 style="margin:0;font-size:24px;">
          New Quote Request (${safe(lead.formName)})
        </h1>
        <p style="margin:6px 0 0;color:#dceaf6;">
          LuHe Cleaning website lead
        </p>
      </div>

      <div style="padding:28px;">
        <p>
          <strong>Name:</strong>
          ${safe(lead.name)}
        </p>

        <p>
          <strong>Phone:</strong>
          <a
            href="tel:${safe(lead.phone)}"
            style="color:#0B6FB8;"
          >
            ${safe(lead.phone)}
          </a>
        </p>

        <p>
          <strong>Email:</strong>
          <a
            href="mailto:${safe(lead.email)}"
            style="color:#0B6FB8;"
          >
            ${safe(lead.email)}
          </a>
        </p>

        <p>
          <strong>Service:</strong>
          ${safe(lead.service)}
        </p>

        <div style="margin-top:18px;padding:18px;background:#EAF6FF;border:1px solid #D7E6F2;border-radius:14px;">
          <p style="margin:0 0 8px;color:#506172;font-size:14px;">
            Message
          </p>

          <p style="margin:0;font-size:16px;line-height:1.6;">
            ${safe(lead.message, "No message provided")}
          </p>
        </div>

        <div style="margin-top:24px;">
          <a
            href="tel:${safe(lead.phone)}"
            style="display:inline-block;background:#0B6FB8;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700;margin-right:8px;"
          >
            Call Customer
          </a>

          <a
            href="mailto:${safe(lead.email)}"
            style="display:inline-block;background:#063F6D;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700;"
          >
            Reply by Email
          </a>
        </div>
      </div>
    </div>

    <p style="text-align:center;color:#708294;font-size:12px;margin-top:18px;">
      Sent automatically from ${COMPANY_SITE}
    </p>
  </div>`;
}

function customerEmail(lead) {
  const isPt = lead.lang === "pt";
  const isEs = lead.lang === "es";

  let title = `Thanks, ${safe(lead.name, "there")}.`;
  let subtitle = "We received your quote request.";

  let intro =
    "Thank you for contacting <strong>LuHe Cleaning</strong>. " +
    "We received your request and will contact you shortly with a clear price.";

  let serviceLabel = "Requested service:";
  let callText = `Call ${COMPANY_PHONE}`;

  if (isPt) {
    title = `Obrigado, ${safe(lead.name, "olá")}.`;
    subtitle = "Recebemos sua solicitação de orçamento.";

    intro =
      "Obrigado por entrar em contato com a <strong>LuHe Cleaning</strong>. " +
      "Recebemos seu pedido e responderemos em breve com um orçamento claro.";

    serviceLabel = "Serviço solicitado:";
    callText = `Ligar ${COMPANY_PHONE}`;
  } else if (isEs) {
    title = `Gracias, ${safe(lead.name, "hola")}.`;
    subtitle = "Hemos recibido tu solicitud.";

    intro =
      "Gracias por contactar a <strong>LuHe Cleaning</strong>. " +
      "Hemos recibido tu solicitud y nos comunicaremos contigo pronto " +
      "con una cotización clara.";

    serviceLabel = "Servicio solicitado:";
    callText = `Llamar ${COMPANY_PHONE}`;
  }

  return `
  <div style="background:#f3f7fb;padding:28px;font-family:Arial,sans-serif;color:#0a1d33;">
    <div style="max-width:640px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(6,63,109,.12);">
      <div style="background:#063F6D;color:#fff;padding:28px;text-align:center;">
        <h1 style="margin:0;font-size:26px;">
          ${title}
        </h1>

        <p style="margin:8px 0 0;color:#dceaf6;">
          ${subtitle}
        </p>
      </div>

      <div style="padding:30px;">
        <p style="font-size:17px;line-height:1.6;margin:0 0 18px;">
          ${intro}
        </p>

        <div style="background:#EAF6FF;border:1px solid #D7E6F2;padding:16px;border-radius:14px;margin-bottom:22px;">
          <strong style="color:#063F6D;">
            ${serviceLabel}
            ${safe(lead.service, "Cleaning service")}
          </strong>
        </div>

        <div style="text-align:center;margin:28px 0;">
          <a
            href="tel:+15087368397"
            style="display:inline-block;background:#0B6FB8;color:#fff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:700;"
          >
            ${callText}
          </a>
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);

    return res.status(405).json({
      error: `Method ${req.method} Not Allowed`
    });
  }

  const clientIp =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress;

  if (isRateLimited(clientIp)) {
    console.warn(`Rate limit exceeded for IP: ${clientIp}`);

    return res.status(429).json({
      error: "Too many requests. Please try again later."
    });
  }

  try {
    const {
      name,
      phone,
      email,
      service,
      message,
      photo,
      lang,
      formName,
      website_url
    } = req.body || {};

    // Honeypot spam check
    if (website_url && website_url.trim()) {
      console.warn("Spam submission blocked via honeypot field.");

      return res.status(200).json({
        success: true,
        message: "Request processed successfully."
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Name is required."
      });
    }

    if (
      !phone ||
      !phone.trim() ||
      phone.replace(/\D/g, "").length < 10
    ) {
      return res.status(400).json({
        error: "Valid phone number is required."
      });
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          error: "Valid email address is required."
        });
      }
    }

    if (!service || !service.trim()) {
      return res.status(400).json({
        error: "Service is required."
      });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error(
        "RESEND_API_KEY is missing from environment variables."
      );

      return res.status(500).json({
        error: "Server misconfiguration. Resend API key is missing."
      });
    }

    if (!LEADS_WEBHOOK_URL || !LEADS_WEBHOOK_SECRET) {
      console.error(
        "LEADS_WEBHOOK_URL or LEADS_WEBHOOK_SECRET is missing."
      );

      return res.status(500).json({
        error: "Server misconfiguration. Lead spreadsheet is not configured."
      });
    }

    const lead = {
      name: name.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      service: service.trim(),
      message: (message || "").trim(),
      lang: lang || "en",
      formName: (formName || "website").trim().slice(0, 50)
    };

    // Save lead in Google Sheets before sending notifications
    try {
      await saveLeadToSpreadsheet(lead);
    } catch (spreadsheetError) {
      console.error("Lead Spreadsheet Error:", spreadsheetError);

      return res.status(502).json({
        error: "Failed to save the lead. Please try again."
      });
    }

    // Prepare photo attachment
    const attachments = [];

    if (photo && photo.content && photo.filename) {
      try {
        const base64Content = photo.content
          .split(";base64,")
          .pop();

        attachments.push({
          filename: photo.filename,
          content: Buffer.from(base64Content, "base64")
        });
      } catch (photoError) {
        console.error(
          "Error decoding photo attachment:",
          photoError
        );
      }
    }

    // Send notification to administrators
    const adminMailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: COMPANY_EMAIL
        .split(",")
        .map((recipientEmail) => recipientEmail.trim())
        .filter(Boolean),
      replyTo: lead.email || REPLY_TO,
      subject: `New Lead [${lead.formName}] - ${lead.service}`,
      html: adminEmail(lead),
      attachments
    });

    if (adminMailResponse.error) {
      console.error(
        "Resend Admin Email Error:",
        adminMailResponse.error
      );

      return res.status(500).json({
        error: "Failed to send lead email. Please try again."
      });
    }

    // Send optional customer auto-reply
    if (lead.email && lead.email.includes("@")) {
      let customerSubject =
        "We received your request - LuHe Cleaning";

      if (lead.lang === "pt") {
        customerSubject =
          "Recebemos sua solicitação - LuHe Cleaning";
      } else if (lead.lang === "es") {
        customerSubject =
          "Hemos recibido tu solicitud - LuHe Cleaning";
      }

      const customerMailResponse = await resend.emails.send({
        from: FROM_EMAIL,
        to: lead.email,
        replyTo: REPLY_TO,
        subject: customerSubject,
        html: customerEmail(lead)
      });

      if (customerMailResponse.error) {
        console.error(
          "Resend Customer Auto-reply Error:",
          customerMailResponse.error
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Request sent successfully."
    });
  } catch (error) {
    console.error("Serverless API handler error:", error);

    return res.status(500).json({
      error: "An internal server error occurred."
    });
  }
}
