# EmailJS Setup Guide

## Overview
This guide helps you set up EmailJS for sending emails from the SmartWaste backend service.

## Why EmailJS?
- **No SMTP configuration needed** - bypasses firewall issues
- **Reliable delivery** - works from any hosting platform
- **Easy setup** - no complex server configurations
- **Free tier available** - 200 emails/month

## Setup Steps

### 1. Create EmailJS Account
1. Go to [emailjs.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Create Email Service
1. Go to **Email Services** in your EmailJS dashboard
2. Click **Add New Service**
3. Choose **Gmail** (recommended) or your preferred provider
4. Follow the setup instructions
5. **Copy the Service ID** (e.g., `service_abc123`)

### 3. Create Email Template
1. Go to **Email Templates** in your dashboard
2. Click **Create New Template**
3. Use this template structure:

```html
Subject: {{subject}}

From: {{from_name}} <{{from_email}}>
To: {{to_name}} <{{to_email}}>
Reply-To: {{reply_to}}

{{{message}}}

---
This email was sent from SmartWaste Management System.
```

4. **Copy the Template ID** (e.g., `template_xyz789`)

### 4. Get API Keys
1. Go to **Account** → **General**
2. Copy your **Public Key** (User ID)
3. Go to **Account** → **Security**
4. Create and copy your **Private Key** (Access Token)

### 5. Configure Environment Variables

Add these to your production environment (Render, Vercel, etc.):

```bash
EMAILJS_SERVICE_ID=service_abc123
EMAILJS_TEMPLATE_ID=template_xyz789
EMAILJS_PUBLIC_KEY=your_public_key_here
EMAILJS_PRIVATE_KEY=your_private_key_here
MAIL_FROM=noreply@yourdomain.com
MAIL_FROM_NAME=SmartWaste Team
```

### 6. Test Configuration

After deployment, test the configuration:

```bash
# Test endpoint
GET https://your-api-domain.com/mail/test-config

# Send test email (requires authentication)
POST https://your-api-domain.com/mail/test-send
{
  "email": "test@example.com"
}
```

## Template Variables

The service automatically provides these variables to EmailJS templates:

- `{{to_email}}` - Recipient email
- `{{to_name}}` - Recipient name (extracted from email if not provided)
- `{{from_name}}` - Sender name
- `{{from_email}}` - Sender email
- `{{subject}}` - Email subject
- `{{message}}` - HTML email content
- `{{reply_to}}` - Reply-to address
- Plus any custom variables from your context

## Advanced Template Example

For verification emails, you can create a specific template:

```html
Subject: Verify Your Email - SmartWaste

Hello {{to_name}},

Welcome to SmartWaste! Please verify your email address by clicking the link below:

{{verificationUrl}}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
The SmartWaste Team
```

## Troubleshooting

### Common Issues:

1. **"Service not found"** - Check your Service ID
2. **"Template not found"** - Check your Template ID
3. **"Unauthorized"** - Check your Public/Private keys
4. **"Rate limit exceeded"** - You've hit the free tier limit

### Rate Limits:
- **Free**: 200 emails/month
- **Paid**: Up to 100,000 emails/month

### Security Notes:
- Private keys should never be exposed in client-side code
- Use environment variables for all sensitive data
- EmailJS automatically handles SPF/DKIM for better deliverability

## Migration from SMTP

The new EmailJS service is a drop-in replacement for SMTP. All existing email functionality will work without code changes:

- ✅ User registration emails
- ✅ Password reset emails
- ✅ Email verification
- ✅ Contamination alerts
- ✅ Custom email templates

## Support

If you encounter issues:
1. Check EmailJS dashboard for error logs
2. Verify environment variables are set correctly
3. Test with the `/mail/test-config` endpoint
4. Check application logs for detailed error messages
