# Production Email Configuration Guide

## Overview
This guide addresses common email delivery issues in production environments and provides solutions for reliable email sending.

## Common Production Email Issues

### 1. **SMTP Authentication Failures**
- **Cause**: Incorrect credentials or 2FA enabled on email account
- **Solution**: Use app-specific passwords for Gmail/Outlook

### 2. **Firewall/Network Restrictions**
- **Cause**: Production servers may block SMTP ports
- **Solution**: Ensure ports 587 (TLS) or 465 (SSL) are open

### 3. **TLS/SSL Certificate Issues**
- **Cause**: Self-signed certificates or certificate validation failures
- **Solution**: Use proper TLS configuration (see below)

### 4. **Rate Limiting**
- **Cause**: Email providers limit sending rates
- **Solution**: Implemented connection pooling and rate limiting

## Required Environment Variables

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com              # or your SMTP provider
SMTP_PORT=587                         # 587 for TLS, 465 for SSL
SMTP_SECURE=false                     # false for TLS (port 587), true for SSL (port 465)
SMTP_USER=your-email@gmail.com        # Your email address
SMTP_PASSWORD=your-app-password       # App-specific password (not regular password)
MAIL_FROM=noreply@yourdomain.com      # From address for emails

# Application URLs
BACKEND_URL=https://your-api-domain.com
FRONTEND_URL=https://your-app-domain.com
DASHBOARD_URL=https://your-app-domain.com

# Environment
NODE_ENV=production
```

## Email Provider Configurations

### Gmail Configuration
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

**Setup Steps for Gmail:**
1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account Settings > Security > App passwords
3. Generate a new app password for "Mail"
4. Use this 16-character password as `SMTP_PASSWORD`

### Outlook/Hotmail Configuration
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-regular-password
```

### Custom SMTP Provider (Recommended for Production)
Consider using dedicated email services like:
- **SendGrid**: Reliable, good free tier
- **Mailgun**: Developer-friendly
- **Amazon SES**: Cost-effective for high volume
- **Postmark**: Excellent deliverability

Example SendGrid configuration:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

## Troubleshooting Steps

### 1. Check SMTP Configuration
The enhanced mail service now validates SMTP configuration on startup:
```bash
# Check application logs for:
✅ SMTP configuration validated successfully
# or
❌ SMTP configuration validation failed
```

### 2. Test SMTP Connection
```bash
# Use telnet to test SMTP connectivity
telnet smtp.gmail.com 587

# Should connect successfully
# Type: EHLO test
# Should show available commands
```

### 3. Check Firewall Rules
```bash
# Test if SMTP ports are accessible
nc -zv smtp.gmail.com 587
nc -zv smtp.gmail.com 465
```

### 4. Monitor Email Logs
The enhanced service provides detailed logging:
```bash
# Look for these log patterns:
📧 Sending email (attempt 1/3)
✅ Email sent successfully
❌ Email send failed (attempt 1/3)
💥 All email send attempts failed
```

## Security Best Practices

### 1. Use App-Specific Passwords
- Never use your main email password
- Generate app-specific passwords for production

### 2. Environment Variable Security
- Store sensitive credentials in secure environment variable systems
- Use services like AWS Secrets Manager, Azure Key Vault, or similar

### 3. Network Security
- Use TLS encryption (port 587)
- Ensure proper certificate validation in production

### 4. Rate Limiting
- The service implements automatic rate limiting (14 emails/second)
- Connection pooling prevents connection exhaustion

## Enhanced Features

### 1. **Automatic Retry Mechanism**
- Retries failed emails up to 3 times
- Exponential backoff between retries
- Automatic SMTP reconnection on failures

### 2. **Connection Pooling**
- Reuses SMTP connections for better performance
- Handles up to 5 concurrent connections
- Processes up to 100 messages per connection

### 3. **Comprehensive Logging**
- Detailed error reporting with error codes
- Success confirmation with message IDs
- Performance metrics and timing

### 4. **Production-Safe Error Handling**
- Service starts even if SMTP is misconfigured
- Graceful degradation in production
- Detailed error context for debugging

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Test SMTP connectivity from production server
- [ ] Verify firewall allows SMTP ports (587/465)
- [ ] Use app-specific passwords for Gmail/Outlook
- [ ] Monitor application logs for email status
- [ ] Test email sending with a real email address
- [ ] Verify email templates are properly deployed
- [ ] Check email deliverability (not in spam folder)

## Common Error Messages and Solutions

### "SMTP configuration validation failed"
- **Cause**: Invalid SMTP credentials or unreachable server
- **Solution**: Verify SMTP_HOST, SMTP_USER, SMTP_PASSWORD

### "Connection timeout"
- **Cause**: Firewall blocking SMTP ports or slow network
- **Solution**: Check network connectivity and firewall rules

### "Authentication failed"
- **Cause**: Wrong credentials or 2FA issues
- **Solution**: Use app-specific passwords, verify credentials

### "TLS/SSL errors"
- **Cause**: Certificate validation issues
- **Solution**: Ensure proper TLS configuration and valid certificates

## Monitoring and Alerts

Set up monitoring for:
- Email send success/failure rates
- SMTP connection health
- Email queue length (if using queues)
- Response times for email operations

## Support

If emails still fail after following this guide:
1. Check application logs for detailed error messages
2. Test SMTP configuration with external tools
3. Verify email provider settings and quotas
4. Consider switching to a dedicated email service provider
