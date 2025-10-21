# Custom Email Templates Guide

## Overview
You have **two options** for using your own email templates with the EmailJS service:

## Option 1: Local Handlebars Templates (Recommended) ✅

**Keep using your existing `.hbs` templates** - no changes needed!

### How it works:
- Your existing templates in `/src/mail/templates/` work as-is
- Templates are rendered with Handlebars on the server
- The final HTML is sent to EmailJS
- Full support for Handlebars helpers and context variables

### Configuration:
```bash
USE_EMAILJS_TEMPLATES=false  # Default - uses local templates
```

### Your existing templates work perfectly:

**`/src/mail/templates/email-verification.hbs`**:
```handlebars
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email</title>
</head>
<body>
    <h2>Welcome to SmartWaste!</h2>
    <p>Hello {{name}},</p>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="{{verificationUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none;">
        Verify Email
    </a>
    <p>This link expires in 24 hours.</p>
</body>
</html>
```

**Usage** (no changes needed):
```typescript
await this.mailService.sendEmail({
  to: 'user@example.com',
  subject: 'Verify Your Email',
  template: 'email-verification',
  context: { 
    name: 'John Doe',
    verificationUrl: 'https://app.com/verify?token=abc123'
  }
});
```

### Benefits:
- ✅ **No migration needed** - existing templates work
- ✅ **Full Handlebars support** - loops, conditionals, helpers
- ✅ **Version control** - templates are in your codebase
- ✅ **Complex layouts** - unlimited HTML/CSS customization
- ✅ **Template inheritance** - use partials and layouts

---

## Option 2: EmailJS Native Templates

Use EmailJS's web interface to create templates.

### Configuration:
```bash
USE_EMAILJS_TEMPLATES=true

# Optional: Multiple templates for different email types
EMAILJS_TEMPLATE_EMAIL_VERIFICATION=template_verification_123
EMAILJS_TEMPLATE_PASSWORD_RESET=template_password_456
EMAILJS_TEMPLATE_CONTAMINATION_ALERT=template_contamination_789
```

### EmailJS Template Example:
Create in EmailJS dashboard with this content:
```html
Subject: {{subject}}

<h2>Welcome to SmartWaste!</h2>
<p>Hello {{to_name}},</p>
<p>Please verify your email address by clicking the link below:</p>
<a href="{{verificationUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none;">
    Verify Email
</a>
<p>This link expires in 24 hours.</p>

<p>Best regards,<br>{{from_name}}</p>
```

### Available Variables:
EmailJS templates automatically receive:
- `{{to_email}}` - Recipient email
- `{{to_name}}` - Recipient name
- `{{from_name}}` - Sender name  
- `{{from_email}}` - Sender email
- `{{subject}}` - Email subject
- `{{reply_to}}` - Reply-to address
- Plus all your custom context variables

### Benefits:
- ✅ **Web interface** - edit templates online
- ✅ **Live preview** - see changes immediately
- ✅ **Team collaboration** - non-developers can edit
- ✅ **A/B testing** - EmailJS analytics

---

## Migration Examples

### Current Template Structure:
```
src/mail/templates/
├── email-verification.hbs
├── password-reset.hbs
├── contamination-alert.hbs
└── test-email.hbs
```

### Option 1 (Recommended): Keep Everything
No changes needed! Your templates work as-is.

### Option 2: Migrate to EmailJS
1. **Create templates in EmailJS dashboard**
2. **Set environment variables**:
   ```bash
   USE_EMAILJS_TEMPLATES=true
   EMAILJS_TEMPLATE_EMAIL_VERIFICATION=template_abc123
   EMAILJS_TEMPLATE_PASSWORD_RESET=template_def456
   ```
3. **Your service calls remain the same**:
   ```typescript
   // This works with both options!
   await this.mailService.sendEmail({
     to: 'user@example.com',
     subject: 'Verify Your Email',
     template: 'email-verification',  // Maps to EMAILJS_TEMPLATE_EMAIL_VERIFICATION
     context: { verificationUrl: 'https://...' }
   });
   ```

---

## Advanced Template Features

### Handlebars Helpers (Option 1 only):
```handlebars
<!-- Check if string contains text -->
{{#if (contains wasteType "plastic")}}
  <p>Special plastic handling instructions...</p>
{{/if}}

<!-- Replace text with regex -->
{{replace phoneNumber "\\D" ""}}

<!-- Concatenate strings -->
{{concat "Hello " name "!"}}
```

### Multiple EmailJS Templates (Option 2):
```bash
# Different templates for different email types
EMAILJS_TEMPLATE_EMAIL_VERIFICATION=template_verification_123
EMAILJS_TEMPLATE_PASSWORD_RESET=template_password_456
EMAILJS_TEMPLATE_CONTAMINATION_ALERT=template_contamination_789

# Service automatically picks the right template based on the 'template' parameter
```

---

## Recommendation

**Use Option 1 (Local Handlebars Templates)** because:

1. **No migration needed** - your existing templates work perfectly
2. **More powerful** - full Handlebars features
3. **Version controlled** - templates are in your codebase
4. **Offline development** - no internet needed for template editing
5. **Complex layouts** - unlimited customization

EmailJS will handle the reliable delivery while you keep full control over your template design! 🎨

---

## Testing Your Templates

### Test with existing endpoint:
```bash
POST https://your-api-domain.com/mail/test-send
{
  "email": "test@example.com"
}
```

### Check logs for template usage:
```
📧 Using local Handlebars template: email-verification
# or
📧 Using EmailJS native template: email-verification
```

Your templates will work seamlessly with the new EmailJS service! 🚀
