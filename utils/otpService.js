const nodemailer = require('nodemailer');

<<<<<<< HEAD
const emailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // 🛡️ Reliability Settings
  pool: true,              // Use a pool to manage connections
  maxConnections: 5,       // Limit simultaneous connections
  family: 4,               // Force IPv4
  connectionTimeout: 20000, 
  greetingTimeout: 20000,
  socketTimeout: 20000,
  debug: true, 
  logger: true,
  tls: {
    rejectUnauthorized: false
  }
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
                <div style="background: #020617; border: 1px solid #334155; border-radius: 12px; padding: 30px; margin-bottom: 30px; position: relative; overflow: hidden;">
                    <span style="font-size: 48px; font-weight: 900; color: #ffffff; letter-spacing: 12px; text-shadow: 0 0 20px rgba(59, 130, 246, 0.4);">
                        ${otp}
                    </span>
                </div>
                <p style="color: #64748b; font-size: 11px; margin-bottom: 0;">
                    CHRIKI SECURE NETWORK // ENCRYPTION: AES-256
                </p>
            </div>
        </div>
    `
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log("✅ Mail delivered via Port 465:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Mail Transport Error:", error.message);
    throw error; // Let the controller handle the response
  }
};
=======
// ✅ Hardened Transporter for Cloud Deployment
const emailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // Using 465 for SSL (More stable on Render than 587)
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS.replace(/\s/g, ''), // Auto-removes spaces if any
  },
  // 🚀 THE DEPLOYMENT FIXES:
  family: 4, // Forces IPv4 (Prevents the IPv6 timeout you saw)
  connectionTimeout: 20000, // Wait 20s for handshake
  greetingTimeout: 20000,
  socketTimeout: 25000,
  dnsTimeout: 10000,
  debug: true, // Keep this true for now so we can see logs in Render
  logger: true,
  tls: {
    rejectUnauthorized: false, // Prevents certificate handshake errors
    servername: 'smtp.gmail.com'
  }
});

// Verification logic to log status on server start
emailTransporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
  } else {
    console.log('🚀 SMTP Server is ready for deployment');
  }
});

/**
 * GENERATE 6-DIGIT CODE
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * SEND EMAIL
 */
const sendEmailOTP = async (email, otp) => {
  const mailOptions = {
    from: `"Chriki Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'ACCESS PROTOCOL: Your 6-Digit Code',
    text: `Your security code is: ${otp}`,
    html: `
      <div style="font-family: sans-serif; background: #0f172a; color: white; padding: 40px; border-radius: 20px;">
        <h2 style="color: #3b82f6; text-transform: uppercase;">Security Protocol</h2>
        <p>Your 6-digit access code is:</p>
        <h1 style="letter-spacing: 10px; font-size: 40px; color: white;">${otp}</h1>
        <p style="color: #64748b; font-size: 12px;">This code expires in 5 minutes.</p>
      </div>
    `
  };

  return emailTransporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendEmailOTP };
>>>>>>> 7d2ee69 (Initial commit with Cloudinary and SMTP fixes)
