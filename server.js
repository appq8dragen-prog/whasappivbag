const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// ⚠️ ضع رقم هاتفك هنا مع مفتاح الدولة بدون أصفار أو علامة +
// مثال (إذا كان رقمك كويتي): '96512345678'
const MY_PHONE_NUMBER = '96560077975'; 

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

// تشغيل ميزة كود الربط النصي بدلاً من الباركود
let pairingCodeRequested = false;
client.on('qr', async (qr) => {
    if (!pairingCodeRequested && MY_PHONE_NUMBER !== 'ضع_رقم_هاتفك_هنا') {
        pairingCodeRequested = true;
        try {
            console.log(`[!] جاري طلب كود الربط النصي للرقم: ${MY_PHONE_NUMBER}...`);
            // انتظار قصير لضمان استقرار المتصفح خلف الكواليس
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const code = await client.requestPairingCode(MY_PHONE_NUMBER);
            
            console.log('\n==============================================');
            console.log(`🔥 كود الربط الخاص بك هو: ${code}`);
            console.log('==============================================\n');
            console.log('الخطوة التالية: افتح الواتساب في هاتفك -> الأجهزة المرتبطة -> ربط جهاز -> اختر (الربط باستخدام رقم الهاتف بدلاً من ذلك) وأدخل الكود أعلاه.');
        } catch (error) {
            console.log('[-] فشل طلب الكود النصي، سنعرض الباركود الاحتياطي:', error.message);
            qrcode.generate(qr, { small: true });
        }
    } else {
        qrcode.generate(qr, { small: true });
    }
});

// عند اتصال الحساب بنجاح
client.on('ready', () => {
    console.log('Client is ready - الواتساب جاهز ومتصل الآن بنجاح!');
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

// تشغيل السيرفر
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`السيرفر يعمل الآن على المنفذ: ${PORT}`);
});

client.initialize();
