/* ============================================
   navigation.js — SubanBaruPintar
   Mengelola navigasi SPA, hamburger menu,
   smooth scroll, dan scroll-to-top.
   ============================================ */

(function () {
    'use strict';

    // ---- Elemen DOM ----
    const pageContents   = document.querySelectorAll('.page-content');
    const navLinks       = document.getElementById('nav-links');
    const navButtons     = navLinks.querySelectorAll('button');
    const hamburgerBtn   = document.getElementById('hamburger-btn');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    // ---- Scroll to Top ----
    window.addEventListener('scroll', function () {
        scrollToTopBtn.style.display = window.pageYOffset > 300 ? 'flex' : 'none';
    });

    scrollToTopBtn.addEventListener('click', scrollToTop);

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ---- Highlight Section ----
    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        section.classList.add('highlight');
        setTimeout(() => section.classList.remove('highlight'), 1600);
    }

    // ---- Ganti Halaman ----
    function changePage(pageId) {
        // Sembunyikan semua halaman
        pageContents.forEach(page => page.classList.remove('active'));

        // Tampilkan halaman target
        const targetPage = document.getElementById(pageId + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
            // Scroll ke atas saat pindah halaman (kecuali home dari home)
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Update state aktif tombol nav
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageId);
        });

        // Tutup hamburger menu
        closeHamburger();

        // Scroll chat ke bawah saat ke halaman chat
        if (pageId === 'chat') {
            setTimeout(() => {
                const chatHistory = document.getElementById('chat-history');
                if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
            }, 120);
        }
    }

    // Fungsi navigasi dengan opsi scroll ke section di Home
    function navigateTo(pageId, targetSection) {
        const isAtHome = document.getElementById('home-page').classList.contains('active');

        if (pageId === 'home' && targetSection) {
            if (!isAtHome) {
                changePage('home');
                setTimeout(() => scrollToSection(targetSection), 150);
            } else {
                scrollToSection(targetSection);
            }
        } else {
            changePage(pageId);
        }
    }

    // Ekspor ke global agar bisa dipanggil dari onclick HTML
    window.changePage = changePage;
    window.navigateTo = navigateTo;

    // ---- Hamburger Menu ----
    hamburgerBtn.addEventListener('click', function () {
        const isOpen = navLinks.classList.toggle('open');
        hamburgerBtn.querySelector('i').className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    });

    function closeHamburger() {
        navLinks.classList.remove('open');
        const icon = hamburgerBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
    }

    // Tutup hamburger saat klik di luar nav
    document.addEventListener('click', function (e) {
        if (!navLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            closeHamburger();
        }
    });

    // ---- Event Listener Tombol Nav ----
    navButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            const pageId = button.dataset.page;
            const isAtHome = document.getElementById('home-page').classList.contains('active');

            if (pageId === 'home') {
                if (isAtHome) {
                    scrollToTop();
                    closeHamburger();
                } else {
                    changePage('home');
                }
                return;
            }

            // Tombol Profil, Kegiatan, Chat:
            // Jika sedang di Home → scroll ke preview section
            // Jika di halaman lain → pindah ke halaman penuh
            const sectionMap = {
                profile : 'profile-section',
                events  : 'events-section',
                chat    : 'chatbot-section'
            };

            if (isAtHome && sectionMap[pageId]) {
                scrollToSection(sectionMap[pageId]);
                closeHamburger();
            } else {
                changePage(pageId);
            }
        });
    });

    // ---- Inisialisasi ----
    document.addEventListener('DOMContentLoaded', function () {
        changePage('home');
    });

})();