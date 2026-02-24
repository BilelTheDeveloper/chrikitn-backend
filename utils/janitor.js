const cron = require('node-cron');
const User = require('../models/User');
const Collective = require('../models/Collective');
const Connection = require('../models/Connection');
const Message = require('../models/Message');

/**
 * THE JANITOR PROTOCOL
 * 1. Periodically cleans up inactive connections and their messages (Every 60s).
 * 2. Runs the Syndicate Audit to handle subscription expirations (Every Midnight).
 */
const runJanitor = () => {
    
    // --- PART 1: CHAT CONNECTION PURGE (Every 60 seconds) ---
    setInterval(async () => {
        try {
            const expirationLimit = 5 * 24 * 60 * 60 * 1000;
            const threshold = new Date(Date.now() - expirationLimit);

            const expiredConnections = await Connection.find({
                lastActivity: { $lt: threshold },
                isElite: { $ne: true } 
            });

            if (expiredConnections.length > 0) {
                console.log(`🧹 Janitor found ${expiredConnections.length} expired connections...`);
                
                for (let conn of expiredConnections) {
                    await Message.deleteMany({ connectionId: conn._id });
                    await Connection.findByIdAndDelete(conn._id);
                    console.log(`🗑️ Successfully purged Connection: ${conn._id}`);
                }
            }
        } catch (err) {
            console.error("❌ Janitor Error:", err);
        }
    }, 60000); 

    // --- PART 2: SYNDICATE AUDIT PROTOCOL (Every Midnight) ---
    // This handles the accessUntil logic and Collective Stasis
    cron.schedule('0 0 * * *', async () => {
        console.log('📡 JANITOR: Initiating Syndicate Audit Protocol...');
        try {
            const now = new Date();

            // A. Individual Audit: Pause users who are expired
            const expiredUsers = await User.updateMany(
                {
                    role: { $ne: 'Admin' }, // Protect the Architect
                    accessUntil: { $lt: now },
                    isPaused: false
                },
                { $set: { isPaused: true } }
            );

            if (expiredUsers.modifiedCount > 0) {
                console.log(`⚠️ JANITOR: ${expiredUsers.modifiedCount} Operatives moved to Stasis.`);
            }

            // B. Collective Audit: The Chain-Reaction
            // Find Active collectives and check if any member inside is now paused
            const collectives = await Collective.find({ 
                status: 'Active' 
            }).populate('members.user');

            for (let collective of collectives) {
                const hasStasisMember = collective.members.some(m => 
                    m.user.isPaused === true || m.user.accessUntil < now
                );

                if (hasStasisMember) {
                    collective.status = 'Suspended';
                    await collective.save();
                    console.log(`🔒 JANITOR: Collective [${collective.name}] Suspended due to member expiration.`);
                }
            }
            console.log('✅ JANITOR: Syndicate Audit Complete.');
        } catch (err) {
            console.error("❌ JANITOR_AUDIT_ERROR:", err);
        }
    });
};

module.exports = runJanitor;