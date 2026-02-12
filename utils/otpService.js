const nodemailer = require('nodemailer');

const emailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Must be false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Force IPv4 and increase timeouts to fight the Gateway Timeout
  family: 4,
  connectionTimeout: 30000, // Give it 30 seconds
  greetingTimeout: 30000,
  socketTimeout: 30000,
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
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
    html: `<h1>Code: ${otp}</h1>`
  };
  return emailTransporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendEmailOTP };