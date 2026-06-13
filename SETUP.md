# LuHe Cleaning Site — Setup Guide

This site is **production-ready as-is**. The form works on Netlify Forms out of the box.

To enable the optional **automatic confirmation email** to customers (auto-reply), you need a one-time setup. About 5 minutes of work.

---

## Required: Netlify Form notifications (so YOU get notified of new leads)

This is the most important one. Without this, you have to log into Netlify to see new leads.

1. Deploy the site to Netlify.
2. Go to **Site overview → Forms** in the Netlify dashboard.
3. Click on the **"quote"** form.
4. Click **Settings & usage → Form notifications → Add notification → Email notification**.
5. Email to notify: `luhecleaning@gmail.com`
6. Save.

Done. Every form submission will now also be sent as an email to your Gmail.

---

## Optional: Auto-reply email to the customer

This sends an automatic "Thanks, we'll be in touch" email to the customer who filled the form, in their language (EN, PT or ES, based on which language they used on the site).

**Cost:** free (Resend.com free tier = 3,000 emails/month, way more than you need).

### Step 1 — Create a Resend account

1. Go to https://resend.com
2. Sign up (use your Gmail).
3. Verify your email.

### Step 2 — Verify the domain `luhecleaning.com`

1. In Resend, go to **Domains → Add Domain**.
2. Enter: `luhecleaning.com`
3. Resend gives you 3 DNS records (TXT and MX). Copy them.
4. Go to your domain registrar (where you bought the domain — GoDaddy, Namecheap, Google Domains, etc.) and paste those DNS records into the DNS settings.
5. Back in Resend, click **Verify**. (DNS can take 5 minutes to a few hours to propagate.)

### Step 3 — Generate an API key

1. In Resend, go to **API Keys → Create API Key**.
2. Name: `LuHe Cleaning auto-reply`
3. Permission: **Sending access**
4. Domain: `luhecleaning.com`
5. Copy the key (starts with `re_…`). **Save it now — you can't see it again.**

### Step 4 — Add the key to Netlify

1. In Netlify, open your site → **Site settings → Environment variables**.
2. Click **Add a variable → Add a single variable**.
3. Key: `RESEND_API_KEY`
4. Value: paste the key from Resend.
5. (Optional) Add another: Key `RESEND_FROM`, Value `LuHe Cleaning <hello@luhecleaning.com>` — change the email part to whatever sender address you want, as long as it's at your verified domain.
6. **Trigger a redeploy** (Netlify → Deploys → Trigger deploy → Deploy site) so the function picks up the new env vars.

### Step 5 — Test it

1. Go to your live site.
2. Submit the form using a real email address you can check.
3. You should receive the confirmation email in 30 seconds or less.

If you don't get the email:
- Check spam.
- In Netlify → **Functions → submission-created** → Logs. Any error message will be there.
- Most common: domain not yet verified. Wait, then redeploy.

---

## How it all fits together

```
Customer fills form on site (in EN/PT/ES)
        │
        ▼
Netlify saves the submission     ──►  Email to luhecleaning@gmail.com (Step 1 setup)
        │
        ▼
Netlify auto-fires the function: submission-created.mjs
        │
        ▼
Function reads the customer's language from the hidden "lang" form field
        │
        ▼
Function calls Resend API to send a confirmation email
        │
        ▼
Customer gets a polished thank-you email in their language
```

---

## Troubleshooting

**The form submits but I don't see anything in Netlify Forms.**
Make sure your site was deployed AFTER the form was added. Netlify scans HTML at build time. Trigger a redeploy.

**Auto-reply isn't sending.**
The function silently no-ops if `RESEND_API_KEY` isn't set, OR if the customer didn't fill in their email (it's optional in the form). Check Netlify function logs.

**I'm getting Resend errors about the sender.**
Your domain isn't fully verified yet, OR the `RESEND_FROM` address isn't at your verified domain. Use exactly the verified domain in the FROM field.

**Switching email providers (Mailgun, SendGrid, Postmark, etc.).**
Edit `netlify/functions/submission-created.mjs`, swap the fetch URL and headers for your provider's API. The form data shape stays the same.

---

## What still needs human follow-up

The auto-reply is generic ("we'll get back to you shortly"). For **real human follow-up**, check the Netlify Forms inbox or your Gmail at least once a day during business hours. A customer who gets a same-day human reply is 4x more likely to convert than one who waits 24h.

---

## Files reference

- `index.html` — main page (with i18n switcher, form, etc.)
- `thank-you.html` — confirmation page after form submit
- `assets/translations.json` — EN/PT/ES translations (loaded on demand only when user picks PT or ES)
- `netlify/functions/submission-created.mjs` — auto-reply function
- `netlify.toml` — Netlify config (cache headers, function directory)
- `sitemap.xml`, `robots.txt` — SEO basics
