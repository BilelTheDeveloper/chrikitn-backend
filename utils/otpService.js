const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.sendEmailOTP = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use this for testing (Free tier default)
      to: email,
      subject: `🔐 IDENTITY VERIFICATION: [${otp}]`,
      html: `
        <div style="background-color: #020617; padding: 40px 20px; font-family: sans-serif; color: #f8fafc; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background: #0f172a; border-radius: 16px; padding: 40px; border: 1px solid #1e293b; border-bottom: 4px solid #3b82f6;">
                <h1 style="color: #ffffff; font-size: 20px;">Your Security Code</h1>
                <div style="background: #020617; padding: 30px; border-radius: 12px; margin: 20px 0;">
                    <span style="font-size: 48px; font-weight: 900; letter-spacing: 10px; color: #3b82f6;">${otp}</span>
                </div>
                <p style="color: #64748b;">Valid for 10 minutes.</p>
                <p style="font-size: 10px; color: #475569;">CHRIKI SECURE NETWORK</p>
            </div>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      throw new Error(error.message);
    }

    console.log('🚀 Resend Success: Email Sent!', data.id);
    return data;
  } catch (err) {
    console.error('❌ Failed to send via Resend:', err.message);
    throw err;
  }
};