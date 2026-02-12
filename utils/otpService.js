const nodemailer = require('nodemailer');

const emailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // Direct SSL
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // 🛠️ NETWORK STABILIZERS
  family: 4, 
  connectionTimeout: 60000000, // 1 minute
  greetingTimeout: 60000000,
  socketTimeout: 60000000,
  dnsTimeout: 10000000,
  tls: {
    // This is critical for Frankfurt/Cloudflare/Render routing
    rejectUnauthorized: false,
    servername: 'smtp.gmail.com'
  }
});

// Adding a quick check so we can see success in Render logs
emailTransporter.verify((error) => {
  if (error) console.error('❌ SMTP Error:', error.message);
  else console.log('🚀 SMTP Server Ready');
});

exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.sendEmailOTP = async (email, otp) => {
  const mailOptions = {
    from: `"TERMINAL ACCESS" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔐 IDENTITY VERIFICATION: [${otp}]`,
    html: `
        <div style="background-color: #020617; padding: 40px 20px; font-family: 'Courier New', Courier, monospace; color: #f8fafc; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-bottom: 4px solid #3b82f6; border-radius: 16px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                <div style="margin-bottom: 20px;">
                    <div style="display: inline-block; padding: 8px 15px; border: 1px solid #3b82f6; border-radius: 4px;">
                        <span style="color: #3b82f6; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3em;">
                            Auth-Protocol // Phase 1
                        </span>
                    </div>
                </div>
                <h1 style="color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; margin-bottom: 25px;">
                    Verify <span style="color: #3b82f6;">Identity</span>
                </h1>
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-bottom: 30px;">
                    A request for terminal access has been initiated. Use the secure decryption key below to bypass the firewall.
                </p>
                <div style="background: #020617; border: 1px solid #334155; border-radius: 12px; padding: 30px; margin-bottom: 30px; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #3b82f6, transparent);"></div>
                    <span style="font-size: 48px; font-weight: 900; color: #ffffff; letter-spacing: 12px; text-shadow: 0 0 20px rgba(59, 130, 246, 0.4);">
                        ${otp}
                    </span>
                    <p style="color: #334155; font-size: 9px; margin-top: 15px; text-transform: uppercase; letter-spacing: 2px;">
                        Single-Use Only // Valid for 10 minutes
                    </p>
                </div>
                <p style="color: #64748b; font-size: 11px; margin-bottom: 0;">
                    If you did not initiate this request, immediately <span style="color: #ef4444;">terminate</span> this session and contact Command Center.
                </p>
                <div style="margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 20px;">
                    <p style="font-size: 9px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em;">
                        CHRIKI SECURE NETWORK // ENCRYPTION: AES-256
                    </p>
                </div>
            </div>
        </div>
    `
  };
  return emailTransporter.sendMail(mailOptions);
};