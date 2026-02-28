// Untuk Vercel serverless
const TelegramBot = require('node-telegram-bot-api');

// ====================================================
// 🤖 HANDLER UTAMA
// ====================================================
module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
        
        // Handle preflight request
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // GET request - for testing
        if (req.method === 'GET') {
            return res.status(200).json({
                status: 'active',
                message: 'Bot Cek ID Emoji is running!',
                commands: ['/start', '/cekidemoji'],
                how_to_use: 'Reply to a message with premium emoji and type /cekidemoji'
            });
        }

        // POST request - webhook from Telegram
        if (req.method === 'POST') {
            const { body } = req;
            
            // Initialize bot with token from env
            const token = process.env.BOT_TOKEN;
            const bot = new TelegramBot(token);
            
            // Handle message
            if (body.message) {
                const msg = body.message;
                const chatId = msg.chat.id;
                
                // Handle /start
                if (msg.text === '/start') {
                    await bot.sendMessage(chatId,
                        `👋 <b>Bot Cek ID Emoji Premium</b>\n\n` +
                        `Cara menggunakan:\n` +
                        `1️⃣ Reply ke pesan yang mengandung emoji premium\n` +
                        `2️⃣ Ketik <code>/cekidemoji</code>\n\n` +
                        `💡 Bot akan menampilkan ID emoji dan format HTML-nya.`,
                        { parse_mode: "HTML" }
                    );
                }
                
                // Handle /cekidemoji
                if (msg.text === '/cekidemoji') {
                    const reply = msg.reply_to_message;
                    
                    if (!reply) {
                        return await bot.sendMessage(chatId,
                            `🔍 <b>Cara Pakai /cekidemoji:</b>\n\n` +
                            `Reply ke pesan yang mengandung emoji premium, lalu ketik:\n` +
                            `<code>/cekidemoji</code>`,
                            { parse_mode: "HTML" }
                        );
                    }

                    // Ambil entities dari pesan yang di-reply
                    const entities = reply.entities || reply.caption_entities || [];
                    const text = reply.text || reply.caption || "";

                    // Filter custom_emoji
                    const customEmojis = entities.filter(e => e.type === "custom_emoji");

                    if (customEmojis.length === 0) {
                        return await bot.sendMessage(chatId,
                            `❌ <b>Tidak ditemukan emoji premium!</b>\n\n` +
                            `Pastikan kamu reply ke pesan yang mengandung emoji premium animasi.`,
                            { parse_mode: "HTML" }
                        );
                    }

                    // Hilangkan duplikat
                    const seen = new Set();
                    const uniqueEmojis = customEmojis.filter(e => {
                        if (seen.has(e.custom_emoji_id)) return false;
                        seen.add(e.custom_emoji_id);
                        return true;
                    });

                    // Fungsi ambil karakter emoji
                    const getEmojiChar = (entity, text) => {
                        return text.slice(entity.offset, entity.offset + entity.length) || "⭐";
                    };

                    // Buat hasil
                    let hasil = `🔍 <b>HASIL CEK EMOJI PREMIUM</b>\n`;
                    hasil += `━━━━━━━━━━━━━━━━━━━━\n`;
                    hasil += `📊 <b>Ditemukan:</b> ${uniqueEmojis.length} emoji\n`;
                    hasil += `━━━━━━━━━━━━━━━━━━━━\n\n`;

                    uniqueEmojis.forEach((e, i) => {
                        const emojiChar = getEmojiChar(e, text);
                        hasil += `<b>${i + 1}.</b> <tg-emoji emoji-id="${e.custom_emoji_id}">${emojiChar}</tg-emoji>\n`;
                        hasil += `🆔 <b>ID:</b> <code>${e.custom_emoji_id}</code>\n`;
                        hasil += `📋 <b>HTML:</b>\n`;
                        hasil += `<code>&lt;tg-emoji emoji-id="${e.custom_emoji_id}"&gt;${emojiChar}&lt;/tg-emoji&gt;</code>\n\n`;
                    });

                    hasil += `━━━━━━━━━━━━━━━━━━━━\n`;
                    hasil += `💡 Copy HTML di atas untuk dipakai di caption bot kamu!`;

                    await bot.sendMessage(chatId, hasil, { parse_mode: "HTML" });
                }
            }
            
            return res.status(200).json({ ok: true });
        }
        
        // Method not allowed
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
