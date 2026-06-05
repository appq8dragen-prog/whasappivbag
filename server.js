const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// إعداد عميل الواتساب مع حفظ الجلسة وتخطي قيود سيرفرات اللينكس
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// توليد الـ QR Code في الـ Terminal عند التشغيل لأول مرة
client.on('qr', (qr) => {
    console.log('▼ امسح الـ QR Code التالي برقم الواتساب الخاص بك ▼');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ تم تشغيل السيرفر والواتساب متصل وجاهز لإرسال الرسائل!');
});

// الرابط المخصص لاستقبال الطلبات من الووردبريس
app.post('/send-whatsapp', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'الرقم ونص الرسالة مطلوبان.' });
    }

    try {
        // تنظيف رقم الهاتف وصياغته بالشكل الصحيح للواتساب
        let cleanPhone = phone.replace(/\D/g, ''); 
        
        if (!cleanPhone.endsWith('@c.us')) {
            cleanPhone = `${cleanPhone}@c.us`;
        }

        await client.sendMessage(cleanPhone, message);
        res.json({ success: true, message: 'تم إرسال رسالة الواتساب بنجاح.' });
    } catch (error) {
        console.error('خطأ أثناء إرسال الرسالة:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// المنفذ الافتراضي للتشغيل
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`السيرفر يعمل الآن على المنفذ: ${PORT}`);
});

client.initialize();