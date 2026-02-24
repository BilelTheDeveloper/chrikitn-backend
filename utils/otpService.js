exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.sendEmailOTP = async (email, otp) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { 
          name: "Chriki Team", 
          email: "bilel.thedeveloper@gmail.com" 
        },
        to: [{ email: email }],
        subject: `🔐 IDENTITY VERIFICATION: [${otp}]`,
        htmlContent: `
          <div style="background-color: #020617; padding: 40px; font-family: sans-serif; color: #f8fafc; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background: #0f172a; border-radius: 16px; padding: 40px; border: 1px solid #3b82f6;">
                <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Verification Code</h1>
                <p style="color: #94a3b8;">Enter the following code to authorize your session:</p>
                <div style="background: #020617; padding: 30px; border-radius: 12px; margin: 25px 0; border: 1px solid #1e293b;">
                    <span style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #3b82f6; text-shadow: 0 0 15px rgba(59, 130, 246, 0.3);">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 12px;">This code is valid for 10 minutes. Do not share it with anyone.</p>
                <div style="margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 20px;">
                    <p style="font-size: 10px; color: #475569; letter-spacing: 2px;">CHRIKI SECURE NETWORK</p>
                </div>
            </div>
          </div>`
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Brevo API Error:', result);
      throw new Error(result.message || 'Failed to send OTP');
    }

    console.log('🚀 SUCCESS: OTP sent via Brevo to', email);
    return result;
  } catch (err) {
    console.error('❌ CRITICAL EMAIL FAILURE:', err.message);
    throw err;
  }
};