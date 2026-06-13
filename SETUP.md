# LuHe Carpet Cleaning — Vercel & Resend Production Setup Guide

This guide describes how to configure the site in production using **Vercel** serverless functions and **Resend** for lead emails and customer auto-replies.

---

## 1. Required: Resend Account & Domain Verification

To send emails through the serverless function, you must set up a free account on Resend.

1. Go to [Resend.com](https://resend.com) and sign up.
2. In your Resend dashboard, navigate to **Domains** and click **Add Domain**.
3. Enter your domain: `luhecleaning.com`
4. Resend will generate three DNS records (TXT and MX). Log into your domain registrar (e.g. GoDaddy, Namecheap, Google Domains) and add these records to your domain's DNS settings.
5. Wait a few minutes and click **Verify** in Resend. Once verified, you can send emails from any address ending in `@luhecleaning.com`.

---

## 2. Required: Resend API Key

1. In your Resend dashboard, go to **API Keys** and click **Create API Key**.
2. Name it `LuHe Website Production`.
3. Set permissions to **Sending access** and select your verified domain.
4. Copy the API key (starts with `re_...`). **Save it securely**, as you will not be able to view it again.

---

## 3. Required: Vercel Environment Variables

To run the site on Vercel without exposing your API keys, add the following settings in your Vercel Project dashboard:

1. Go to **Settings → Environment Variables** inside your Vercel project.
2. Add the following keys:
   * **`RESEND_API_KEY`**: Paste the Resend API key you generated.
   * **`CONTACT_TO_EMAIL`**: The email address (or comma-separated addresses) where you want to receive new leads (e.g., `luhecleaning@gmail.com` or `luhecleaning@gmail.com,bragga.leonardo@gmail.com`).
   * **`CONTACT_FROM_EMAIL`**: The authorized sender address at your verified domain (e.g., `LuHe Cleaning <quote@luhecleaning.com>`).
3. Deploy or redeploy the project to apply these variables to the serverless function.

---

## 4. How the Lead System Works (AJAX + Serverless)

```
  Customer fills out form on website (in EN/PT/ES)
                       │
                       ▼
  Client-side Canvas compresses photos to <300KB (bypassing Vercel 4.5MB limit)
                       │
                       ▼
  Form submits via fetch() POST to `/api/send-quote`
                       │
                       ▼
  Serverless API:
    - Validates fields & email regex
    - Checks IP rate limits (max 5/min)
    - Verifies honeypot field (filters bots silently)
    - Escapes characters to prevent XSS/HTML Injection
                       │
                       ▼
  Resend API sends lead to admin AND localized auto-reply to customer
```

---

## 5. Centralized Integrations Setup

To add GTM, Google Analytics 4, or Meta Pixel, open any of the HTML pages and update the values inside the `window.SITE_CONFIG` block:

```javascript
window.SITE_CONFIG = {
  GTM_ID: 'GTM-XXXXXXX', // Replace with real GTM ID
  GA4_ID: 'G-XXXXXXXXXX', // Replace with real GA4 Measurement ID
  GOOGLE_ADS_ID: 'AW-XXXXXXXXXX', // Replace with real Google Ads ID
  GOOGLE_ADS_FORM_CONVERSION_LABEL: 'AW-FORM-CONVERSION-LABEL',
  GOOGLE_ADS_PHONE_CONVERSION_LABEL: 'AW-PHONE-CONVERSION-LABEL',
  META_PIXEL_ID: 'PIXEL_ID_HERE' // Replace with real Meta Pixel ID
};
```
