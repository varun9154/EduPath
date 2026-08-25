// src/lib/sms.ts
import twilio from 'twilio';

/**
 * Send an SMS via Twilio. In development mode (TWILIO_SID not set) the call is logged and succeeds.
 * @param to Phone number in E.164 format (e.g., +911234567890)
 * @param body Message text
 * @returns Promise resolving to an object { success: boolean, message?: string }
 */
export async function sendSms(to: string, body: string): Promise<{ success: boolean; message?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';
  const from = process.env.TWILIO_FROM_NUMBER || '';

  // If any Twilio env vars are missing, run in DEV_MODE
  if (!accountSid || !authToken || !from) {
    console.log('[DEV_MODE] SMS to', to, ':', body);
    return { success: true, message: 'DEV_MODE SMS logged' };
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({ body, from, to });
    return { success: true };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error';
    console.error('SMS sending error:', errMsg);
    return { success: false, message: errMsg };
  }
}
