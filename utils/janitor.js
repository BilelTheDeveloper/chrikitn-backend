const Connection = require('../models/Connection');
const Message = require('../models/Message');

/**
 * THE JANITOR PROTOCOL
 * Periodically cleans up inactive connections and their messages.
 */
const runJanitor = () => {
    // Run every 60 seconds
    setInterval(async () => {
        try {
            // TEST VALUE: 1 minute (60,000 ms)
            // PRODUCTION VALUE later: (5 * 24 * 60 * 60 * 1000)
            const expirationLimit = 5 * 24 * 60 * 60 * 1000;
            const threshold = new Date(Date.now() - expirationLimit);

            // 1. Find connections idle longer than threshold
            // Only targets connections where isElite is false
            const expiredConnections = await Connection.find({
                lastActivity: { $lt: threshold },
                isElite: { $ne: true } 
            });

            if (expiredConnections.length > 0) {
                console.log(`🧹 Janitor found ${expiredConnections.length} expired connections...`);
                
                for (let conn of expiredConnections) {
                    // 2. Wipe the messages linked to this connection
                    await Message.deleteMany({ connectionId: conn._id });
                    
                    // 3. Delete the connection itself
                    await Connection.findByIdAndDelete(conn._id);
                    
                    console.log(`🗑️ Successfully purged Connection: ${conn._id}`);
                }
            }
        } catch (err) {
            console.error("❌ Janitor Error:", err);
        }
    }, 60000); 
};

module.exports = runJanitor;