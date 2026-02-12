const nodemailer = require('nodemailer');

// ✅ Hardened Transporter for Cloud Deployment
const emailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, 
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS.replace(/\s/g, ''), 
  },
  family: 4, 
  connectionTimeout: 20000, 
  greetingTimeout: 20000,
  socketTimeout: 25000,
  dnsTimeout: 10000,
  debug: true, 
  logger: true,
  tls: {
    rejectUnauthorized: false, 
    servername: 'smtp.gmail.com'
  }
});

emailTransporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
  } else {
    console.log('🚀 SMTP Server is ready for deployment');
  }
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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