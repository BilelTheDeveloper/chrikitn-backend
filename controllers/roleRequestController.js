const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');
const nodemailer = require('nodemailer');

/**
 * @desc    Submit a VIP Upgrade Request
 */
exports.submitRoleRequest = async (req, res) => {
    try {
        const { requestedRole, portfolioLink } = req.body;

        const existingRequest = await RoleRequest.findOne({ user: req.user.id, status: 'Pending' });
        if (existingRequest) {
            return res.status(400).json({ success: false, msg: "Application already pending." });
        }

        const newRequest = new RoleRequest({
            user: req.user.id,
            requestedRole,
            portfolioLink
        });

        await newRequest.save();
        res.status(201).json({ success: true, msg: "Dossier transmitted.", data: newRequest });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Server Error" });
    }
};

/**
 * @desc    Get all Pending Requests
 */
exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await RoleRequest.find({ status: 'Pending' })
            // ✅ CLOUDINARY UPDATE: Pulling identityImage which is now the cloud URL
            .populate('user', 'name email identityImage role')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: requests.length, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Failed to fetch dossiers." });
    }
};

/**
 * @desc    Verify (Approve/Reject) Request + Email Notification
 */
exports.verifyRoleRequest = async (req, res) => {
    try {
        const { status } = req.body;
        
        // 1. Critical Update: Use .populate('user') to get the user's email for the notification
        const request = await RoleRequest.findById(req.params.id).populate('user');

        if (!request) return res.status(404).json({ success: false, msg: "Request not found." });

        // Setup Nodemailer Transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            // ✅ ADD THIS SECTION BELOW:
            tls: {
                rejectUnauthorized: false
            }
        });

        // --- BRANCH A: APPROVAL ---
        if (status === 'Approved') {
            // Update User Role in Database
            await User.findByIdAndUpdate(request.user._id, { role: request.requestedRole });

            // Prepare Approval Email
            const mailOptions = {
                from: `"COMMAND CENTER" <${process.env.EMAIL_USER}>`,
                to: request.user.email,
                subject: '📂 ACCESS GRANTED: VIP STATUS ACTIVATED',
                html: `
                    <div style="background-color: #0a0a0c; padding: 40px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e0e0e0; text-align: center;">
                        <div style="max-width: 600px; margin: 0 auto; background: #111114; border: 1px solid #1f2937; border-top: 4px solid #3b82f6; border-radius: 12px; padding: 40px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                            
                            <div style="margin-bottom: 25px;">
                                <span style="font-size: 50px;">🛡️</span>
                            </div>

                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase; margin-bottom: 10px; font-style: italic;">
                                Welcome to the <span style="color: #3b82f6;">Elite</span>, ${request.user.name}
                            </h1>
                            
                            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 0.1em;">
                                Your dossier has been verified. Clearance Level: <b style="color: #60a5fa;">${request.requestedRole}</b>
                            </p>

                            <div style="background: rgba(59, 130, 246, 0.05); border: 1px dashed #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: left;">
                                <h3 style="color: #60a5fa; font-size: 14px; margin-top: 0; text-transform: uppercase;">⚡ VIP INTEL POWER UNLOCKED</h3>
                                <p style="font-size: 13px; color: #d1d5db; line-height: 1.5; margin-bottom: 0;">
                                    You now have access to the <b>VIP Intel Portal</b>. This exclusive terminal provides real-time market surveillance, high-stakes leads, and operative data hidden from standard users. Information is your strongest weapon—use it wisely.
                                </p>
                            </div>

                            <div style="padding: 15px; background: #ef44441a; border-radius: 8px; margin-bottom: 30px;">
                                <p style="color: #f87171; font-size: 12px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">
                                    ⚠️ CRITICAL: You must SIGN OUT and SIGN IN again to initialize your new clearance.
                                </p>
                            </div>

                            <a href="http://localhost:5173/login" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 14px 30px; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; transition: background 0.3s ease;">
                                Access Terminal
                            </a>

                            <div style="margin-top: 40px; border-top: 1px solid #1f2937; padding-top: 20px;">
                                <p style="font-size: 11px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.2em;">
                                    Automated Transmission // Secure Node
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };
            await transporter.sendMail(mailOptions);
        } 
        
        // --- BRANCH B: REJECTION ---
        else if (status === 'Rejected') {
            // Prepare Rejection Email
            const mailOptions = {
                from: `"SECURITY COMMAND" <${process.env.EMAIL_USER}>`,
                to: request.user.email,
                subject: '⚠️ SECURITY ALERT: ACCESS DENIED',
                html: `
                    <div style="background-color: #0a0a0c; padding: 40px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e0e0e0; text-align: center;">
                        <div style="max-width: 600px; margin: 0 auto; background: #111114; border: 1px solid #374151; border-top: 4px solid #ef4444; border-radius: 12px; padding: 40px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6);">
                            
                            <div style="margin-bottom: 25px;">
                                <span style="font-size: 50px;">🚫</span>
                            </div>

                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase; margin-bottom: 10px; font-style: italic;">
                                Clearance <span style="color: #ef4444;">Rejected</span>
                            </h1>
                            
                            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 0.1em;">
                                Dossier Review Complete // Status: <b style="color: #ef4444;">Inadequate Data</b>
                            </p>

                            <div style="background: rgba(239, 68, 68, 0.05); border: 1px dashed #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: left;">
                                <h3 style="color: #ef4444; font-size: 14px; margin-top: 0; text-transform: uppercase;">🚩 REASON FOR DENIAL</h3>
                                <p style="font-size: 13px; color: #d1d5db; line-height: 1.5; margin-bottom: 0;">
                                    The verification link provided in your application was flagged as <b>invalid, restricted, or insufficient</b>. To maintain the integrity of our elite network, we require a high-standard portfolio/dossier for this clearance level.
                                </p>
                            </div>

                            <p style="color: #9ca3af; font-size: 13px; margin-bottom: 30px;">
                                Your application has been purged from the active queue. You are permitted to re-submit your dossier once you have updated your credentials.
                            </p>

                            <a href="http://localhost:5173/dashboard" style="display: inline-block; border: 1px solid #4b5563; color: #ffffff; padding: 12px 25px; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
                                Return to Dashboard
                            </a>

                            <div style="margin-top: 40px; border-top: 1px solid #1f2937; padding-top: 20px;">
                                <p style="font-size: 11px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.2em;">
                                    System Protocol 403-DENIED // End of Transmission
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };
            await transporter.sendMail(mailOptions);
        }

        // 2. Clean up the request collection (Remove from the Admin table)
        await RoleRequest.findByIdAndDelete(req.params.id);

        res.json({ 
            success: true, 
            msg: `User ${status === 'Approved' ? 'Promoted' : 'Rejected'}. Email notification has been sent.` 
        });

    } catch (err) {
        console.error("VERIFY_ERROR:", err.message);
        res.status(500).json({ success: false, msg: "Verification protocol failed." });
    }
};