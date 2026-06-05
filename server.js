const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// إعداد عميل الواتساب وتخطي قيود السيرفرات
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
    }
});

// توليد الـ QR Code في الـ Logs عند تشغيل السيرفر
client.on('qr', (qr) => {
    console.log('=== قـم بـمـسـح الـرمـز الـتـالـي بـواسـطـة الـواتـسـاب ===');
    qrcode.generate(qr, { small: true });
});

// عند اتصال الحساب بنجاح
client.on('ready', () => {
    console.log('Client is ready - الواتساب جاهز ومتصل الآن!');
});

// استقبال أوامر الإرسال من الووردبريس
app.post('/send-whatsapp', async (req, res) => {
    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).json({ status: 'error', message: 'المعطيات ناقصة' });
    }

    try {
        const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
        await client.sendMessage(formattedNumber, message);
        res.json({ status: 'success', message: 'تم إرسال الرسالة بنجاح' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// تشغيل السيرفر على المنفذ المطلوب لـ Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`السيرفر يعمل الآن على المنفذ: ${PORT}`);
});

// بدء تشغيل عميل الواتساب
client.initialize();
