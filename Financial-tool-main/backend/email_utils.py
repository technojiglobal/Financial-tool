import os
import resend

# Resend API key — set via environment variable in production
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
resend.api_key = RESEND_API_KEY

# Sender address — Resend free tier uses onboarding@resend.dev
# To use your own domain, verify it at https://resend.com/domains
FROM_EMAIL = os.environ.get("FROM_EMAIL", "Technoji Global <onboarding@resend.dev>")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "finance.technojiglobal@gmail.com")


def send_email(to_email, subject, body_html):
    """Send an email via Resend HTTP API. Returns True on success."""
    if not RESEND_API_KEY:
        print(f"[EMAIL STUB] No API key — To: {to_email} | Subject: {subject}")
        return False

    print(f"[EMAIL] Sending via Resend to {to_email} | Subject: {subject}")

    try:
        params = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": body_html,
        }
        email = resend.Emails.send(params)
        email_id = email.get('id', '') if isinstance(email, dict) else getattr(email, 'id', 'unknown')
        print(f"[EMAIL SENT] To: {to_email} | ID: {email_id}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {type(e).__name__}: {e}")
        return False


def send_document_reminder(doc):
    """Send a reminder email about a document that is overdue."""
    next_type = doc.get('next_doc_type', '')
    subject = f"⚠️ Follow-up: Send {next_type} for {doc.get('client_name', 'Client')}" if next_type else f"⚠️ Follow-up Required: {doc.get('doc_type', 'Document')} for {doc.get('client_name', 'Client')}"
    body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #715FF1, #190051); padding: 24px 28px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0; font-size: 18px;">📄 Document Follow-up Reminder</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">Technoji Global Business Manager</p>
        </div>
        <div style="background: #fff; padding: 24px 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="margin: 0 0 16px; color: #374151;">A <strong>{doc.get('doc_type', 'document')}</strong> requires follow-up action:</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; width: 140px; color: #6b7280; font-size: 13px;">Client</td>
                    <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 14px;">{doc.get('client_name', 'N/A')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 13px;">Project</td>
                    <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 14px;">{doc.get('project_name', 'N/A')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 13px;">Document Type</td>
                    <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 14px;">{doc.get('doc_type', 'N/A')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 13px;">Sent Date</td>
                    <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 14px;">{doc.get('date', 'N/A')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 13px;">Days Since Sent</td>
                    <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 14px; color: #dc2626; font-weight: 600;">{doc.get('days_since_sent', 0)} days</td>
                </tr>
                {'<tr><td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 13px;">Next Step</td><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 14px; color: #059669; font-weight: 600;">Send ' + next_type + '</td></tr>' if next_type else ''}
            </table>
            <p style="margin: 0; color: #6b7280; font-size: 12px;">This is an automated reminder from Technoji Global Business Manager.</p>
        </div>
    </div>
    """
    return send_email(ADMIN_EMAIL, subject, body)


def send_general_reminder(reminder):
    """Send a general reminder email."""
    subject = f"🔔 Reminder: {reminder.get('description', 'Reminder')}"
    body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #715FF1, #190051); padding: 24px 28px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0; font-size: 18px;">🔔 Reminder</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">Technoji Global Business Manager</p>
        </div>
        <div style="background: #fff; padding: 24px 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h3 style="margin: 0 0 12px; color: #111827;">{reminder.get('description', '')}</h3>
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">📅 Date: <strong>{reminder.get('date', 'N/A')}</strong></p>
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">⏰ Time: <strong>{reminder.get('time', 'N/A')}</strong></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">This is an automated reminder from Technoji Global Business Manager.</p>
        </div>
    </div>
    """
    return send_email(ADMIN_EMAIL, subject, body)
