/* ============================================
   chatbot.js — SubanBaruPintar
   Frontend-only: kirim ke /chat (server.js)
   Tidak ada API Key di sini — aman!
   ============================================ */

(function () {
    'use strict';

    // ---- Elemen DOM ----
    const chatHistory = document.getElementById('chat-history');
    const userInput   = document.getElementById('user-input');
    const chatForm    = document.getElementById('chat-form');
    const submitBtn   = chatForm ? chatForm.querySelector('button[type="submit"]') : null;
    const loader      = document.getElementById('loader');

    // ---- Format teks Markdown sederhana ----
    // Mendukung: **bold**, *italic*, angka. daftar, newline
    function formatMessage(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Daftar bernomor: "1. teks" → list item
            .replace(/^(\d+)\.\s(.+)$/gm, '<span class="chat-list-item"><strong>$1.</strong> $2</span>')
            // Baris baru
            .replace(/\n/g, '<br>');
    }

    // ---- Tampilkan pesan di UI ----
    function appendMessage(text, role) {
        if (!chatHistory) return;
        const div = document.createElement('div');
        div.className = 'message ' + (role === 'user' ? 'user-message' : 'bot-message');
        div.innerHTML = formatMessage(text);
        chatHistory.appendChild(div);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // ---- Tampilkan indikator "sedang mengetik" ----
    function showTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'message bot-message typing-indicator';
        div.id = 'typing-indicator';
        div.innerHTML = '<span></span><span></span><span></span>';
        chatHistory.appendChild(div);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    // ---- Set state loading ----
    function setLoading(isLoading) {
        if (loader)    loader.style.display = isLoading ? 'flex' : 'none';
        if (submitBtn) submitBtn.disabled   = isLoading;
        if (userInput) userInput.disabled   = isLoading;
    }

    // ---- Kirim pesan ke server.js (/chat) ----
    async function sendMessage() {
        const userText = userInput ? userInput.value.trim() : '';
        if (!userText) return;

        appendMessage(userText, 'user');
        if (userInput) userInput.value = '';

        setLoading(true);
        showTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method  : 'POST',
                headers : { 'Content-Type': 'application/json' },
                body    : JSON.stringify({ userInput: userText })
            });

            removeTypingIndicator();

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Server error (${response.status})`);
            }

            const botText = data.response || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.';
            appendMessage(botText, 'bot');

        } catch (error) {
            removeTypingIndicator();
            console.error('Chat error:', error);

            let errorMsg = '❌ Terjadi kesalahan koneksi. Pastikan server sudah berjalan.';
            if (error.message.includes('Failed to fetch')) {
                errorMsg = '❌ Tidak dapat terhubung ke server. Jalankan <code>node server.js</code> terlebih dahulu.';
            } else if (error.message.includes('500')) {
                errorMsg = '❌ Terjadi kesalahan di server. Periksa konfigurasi API Key di file <code>.env</code>.';
            }

            appendMessage(errorMsg, 'bot');
        } finally {
            setLoading(false);
            if (userInput) {
                userInput.focus();
            }
        }
    }

    // ---- Event listener form submit ----
    if (chatForm) {
        chatForm.addEventListener('submit', function (e) {
            e.preventDefault();
            sendMessage();
        });
    }

    // ---- Enter untuk kirim, Shift+Enter untuk baris baru ----
    if (userInput) {
        userInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // ---- Pesan sambutan saat halaman dimuat ----
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(function () {
            if (chatHistory && chatHistory.innerHTML.trim() === '') {
                appendMessage(
                    'Halo! Selamat datang di **SubanBaruPintarChat** 👋\n\nSaya siap membantu Anda mendapatkan informasi seputar Desa Suban Baru.\n\nSilakan tanyakan mengenai:\n1. Surat menyurat desa\n2. Jadwal kegiatan dan musyawarah\n3. Bantuan sosial dan administrasi kependudukan\n4. Pengajuan aspirasi dan pengaduan\n5. Kepemudaan, UMKM, dan pertanian lokal',
                    'bot'
                );
            }
        }, 300);
    });

})();