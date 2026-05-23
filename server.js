/* ============================================
   server.js — SubanBaruPintar
   Backend Express + Google Gemini API
   ============================================ */

const express             = require('express');
const dotenv              = require('dotenv');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Muat variabel dari .env
dotenv.config();

// ---- Validasi API Key saat startup ----
if (!process.env.API_KEY) {
    console.error('❌ API_KEY tidak ditemukan di file .env. Server dihentikan.');
    process.exit(1);
}

// ---- Konfigurasi ----
const PORT      = process.env.PORT || 3000;
const MODEL     = 'gemini-2.5-flash';
const genAI     = new GoogleGenerativeAI(process.env.API_KEY);
const model     = genAI.getGenerativeModel({ model: MODEL });

// ---- System Prompt ----
// Konteks dan aturan yang selalu dikirim ke Gemini sebagai "pembuka" percakapan
const SYSTEM_PROMPT = `SubanBaruPintar – Asisten Virtual Desa Suban Baru
Kamu adalah SubanBaruBot, asisten virtual resmi milik Pemerintah Desa Suban Baru, Kecamatan Kelekar, Kabupaten Muara Enim, Provinsi Sumatera Selatan.

Informasi Desa:
- Kepala Desa: PERI
- Jumlah Penduduk: 4.476 jiwa
- Visi: "Terwujudnya Desa Suban Baru yang Bersih, Transparan, dan Mandiri menuju Masyarakat yang Sehat, Makmur dan Sejahtera."

Tugasmu adalah membantu warga desa dalam mengakses layanan publik dan informasi desa secara cepat dan ramah.

Layanan yang bisa kamu bantu:
1. Informasi surat menyurat desa
2. Jadwal kegiatan dan musyawarah desa
3. Informasi bantuan sosial dan layanan administrasi kependudukan
4. Pengajuan aspirasi dan pengaduan warga
5. Informasi kepemudaan, UMKM, dan pertanian lokal

Aturan menjawab:
- Gunakan bahasa Indonesia yang sopan, ramah, dan mudah dimengerti oleh masyarakat umum.
- Susun jawaban dengan format daftar bernomor yang rapi dan jelas bila memungkinkan.
- Bila tidak tahu jawabannya, arahkan pengguna untuk menghubungi kantor desa secara langsung.
- Jangan membahas topik di luar konteks desa atau layanan publik.`;

const BOT_GREETING = `Halo! Selamat datang di SubanBaruBot, asisten virtual Desa Suban Baru. Ada yang bisa saya bantu? Silakan tanyakan seputar informasi surat menyurat desa, jadwal kegiatan desa, informasi bantuan sosial, administrasi kependudukan, pengajuan aspirasi, informasi kepemudaan, UMKM, dan pertanian lokal.`;

// ---- Safety Settings ----
const SAFETY_SETTINGS = [
    {
        category  : HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold : HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category  : HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold : HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category  : HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold : HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

// ---- Generation Config ----
const GENERATION_CONFIG = {
    temperature     : 0.8,
    topP            : 0.95,
    topK            : 40,
    maxOutputTokens : 2048,
};

// ---- Fungsi utama pemanggilan Gemini ----
async function runChat(userInput) {
    const result = await model.generateContent({
        contents: [
            // Turn 1: system prompt sebagai "user" pertama
            {
                role  : 'user',
                parts : [{ text: SYSTEM_PROMPT }],
            },
            // Turn 2: respons model sebagai penegasan konteks + salam
            {
                role  : 'model',
                parts : [{ text: BOT_GREETING }],
            },
            // Turn 3: pertanyaan nyata dari pengguna
            {
                role  : 'user',
                parts : [{ text: userInput }],
            },
        ],
        generationConfig : GENERATION_CONFIG,
        safetySettings   : SAFETY_SETTINGS,
    });

    return result.response?.text() || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.';
}

// ---- Express App ----
const app = express();

// Sajikan semua file statis dari folder 'public'
app.use(express.static('public'));
app.use(express.json());

// ---- Endpoint POST /chat ----
app.post('/chat', async (req, res) => {
    const { userInput } = req.body;

    if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
        return res.status(400).json({ error: 'Input tidak boleh kosong.' });
    }

    try {
        const response = await runChat(userInput.trim());
        return res.json({ response });
    } catch (err) {
        console.error('❌ Error dari Gemini API:', err.message || err);

        // Berikan pesan error yang informatif ke klien
        const statusCode = err.status || 500;
        return res.status(statusCode).json({
            error    : 'Gagal mendapatkan respons dari AI.',
            response : 'Maaf, terjadi kesalahan pada sistem. Silakan coba lagi beberapa saat.',
        });
    }
});

// ---- Jalankan server ----
app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
    console.log(`   Model AI : ${MODEL}`);
    console.log(`   Static   : folder /public`);
});