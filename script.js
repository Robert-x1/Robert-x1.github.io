import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-check.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch, getDoc, increment, where } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { escapeHtml, formatMoney, recurrenceLabel, calcTotal, groupItemsByCategory, generateProposalPDF } from "./proposal-shared.js";

const firebaseConfig = {
    apiKey: "AIzaSyC9c5yk7Smmjk3PRJgJm24PmXJfr0XpBlc",
    authDomain: "robert-portfolio-98d71.firebaseapp.com",
    projectId: "robert-portfolio-98d71",
    storageBucket: "robert-portfolio-98d71.firebasestorage.app",
    messagingSenderId: "125447409289",
    appId: "1:125447409289:web:010585084cc2a0fe8ec058",
    measurementId: "G-FS62VLHDGH"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LcsLsArAAAAAIKuIslOZOQSSr7HSlZZD2qVHWhD'),
    isTokenAutoRefreshEnabled: true
});

function showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span style="font-size:1rem">${icons[type]}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function initLoadingScreen() {
    const screen = document.getElementById('loading-screen');
    const bar = document.getElementById('loading-bar');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) { progress = 100; clearInterval(interval); }
        bar.style.width = progress + '%';
    }, 120);
    window.addEventListener('load', () => {
        setTimeout(() => {
            bar.style.width = '100%';
            setTimeout(() => screen.classList.add('fade-out'), 300);
        }, 500);
    });
    setTimeout(() => screen.classList.add('fade-out'), 3000);
}

function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    const backToTop = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        bar.style.width = scrolled + '%';
        if (window.scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    let isOpen = false;
    btn.addEventListener('click', () => {
        isOpen = !isOpen;
        menu.classList.toggle('hidden', !isOpen);
        const icon = document.getElementById('menu-icon');
        icon.setAttribute('data-feather', isOpen ? 'x' : 'menu');
        feather.replace();
    });
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            isOpen = false;
            menu.classList.add('hidden');
            document.getElementById('menu-icon').setAttribute('data-feather', 'menu');
            feather.replace();
        });
    });
}

function initTypewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;
    const texts = [
        'Android & (KMP\\CMP) Apps',
        'Kotlin Solutions ',
        'Jetpack Compose UI ',
        'Clean Architecture ',
        'Scalable Apps ',
    ];
    let i = 0, j = 0, isDeleting = false;
    function type() {
        const current = texts[i];
        el.textContent = isDeleting ? current.substring(0, j--) : current.substring(0, j++);
        let delay = isDeleting ? 50 : 80;
        if (!isDeleting && j === current.length + 1) { delay = 1800; isDeleting = true; }
        else if (isDeleting && j < 0) { isDeleting = false; j = 0; i = (i + 1) % texts.length; delay = 300; }
        setTimeout(type, delay);
    }
    type();
}

function animateCounter(el, target, duration = 1500) {
    const start = 0;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function initStatsCounters() {
    const statsSection = document.getElementById('stats');
    if (!statsSection) return;

    let fired = false;
    function runCounters() {
        const els = document.querySelectorAll('.stat-number[data-target]');
        const anyNonZero = Array.from(els).some(el => parseInt(el.dataset.target) > 0);
        if (!anyNonZero || fired) return;
        fired = true;
        els.forEach(el => {
            const target = parseInt(el.dataset.target);
            if (target > 0) animateCounter(el, target);
        });
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) runCounters();
        });
    }, { threshold: 0.2 });
    observer.observe(statsSection);
    window._retryStatsCounters = () => { fired = false; runCounters(); };
}

async function initVisitorCounter() {
    const display = document.getElementById('visitor-count-display');
    try {
        const counterRef = doc(db, 'siteStats', 'visitors');
        const snap = await getDoc(counterRef);
        let count = snap.exists() ? (snap.data().count || 0) : 0;

        if (!sessionStorage.getItem('hasVisited')) {
            sessionStorage.setItem('hasVisited', 'true');
            await setDoc(counterRef, { count: increment(1) }, { merge: true });
            count++;
        }

        if (display) {
            let shown = 0;
            const duration = 1200;
            const startTime = performance.now();
            function update(t) {
                const p = Math.min((t - startTime) / duration, 1);
                shown = Math.round(count * (1 - Math.pow(1 - p, 3)));
                display.textContent = shown.toLocaleString() + ' visitors';
                if (p < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
        }
    } catch (e) {
        if (display) display.textContent = '—';
    }
}

async function loadTestimonials() {
    const grid = document.getElementById('testimonials-grid');
    const loader = document.getElementById('testimonials-loader');

    try {
        let snap;
        try {
            const q = query(collection(db, 'testimonials'), where('status', '==', 'approved'), orderBy('timestamp', 'desc'));
            snap = await getDocs(q);
        } catch {
            const q = query(collection(db, 'testimonials'), where('status', '==', 'approved'));
            snap = await getDocs(q);
        }

        if (loader) loader.remove();
        grid.innerHTML = '';

        if (snap.empty) {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.innerHTML = '<p class="text-center text-gray-500 font-mono text-sm py-12 w-full">No reviews yet. Be the first! 🌟</p>';
            grid.appendChild(slide);
            refreshTestimonialsSwiper();
            return;
        }

        snap.forEach(docSnap => {
            const t = docSnap.data();
            const stars = '★'.repeat(t.rating || 5) + '☆'.repeat(5 - (t.rating || 5));
            const initials = (t.name || 'A').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

            const slide = document.createElement('div');
            slide.className = 'swiper-slide';

            const card = document.createElement('div');
            card.className = 'testimonial-card';
            card.innerHTML = `
                <div class="testimonial-stars">${stars}</div>
                <p class="testimonial-message">${escapeHtml(t.message)}</p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">${initials}</div>
                    <div>
                        <p class="testimonial-name">${escapeHtml(t.name)}</p>
                        <p class="testimonial-role">${escapeHtml(t.role || '')}</p>
                    </div>
                    ${isAdmin ? `<div class="ml-auto flex gap-2">
                        <button class="delete-btn admin-btn" onclick="handleDeleteTestimonial('${docSnap.id}')">Delete</button>
                    </div>` : ''}
                </div>`;

            slide.appendChild(card);
            grid.appendChild(slide);
        });

        refreshTestimonialsSwiper();
        feather.replace();

    } catch (e) {
        if (loader) loader.remove();
        grid.innerHTML = '<div class="swiper-slide"><p class="text-center text-gray-400 py-8">Unable to load reviews.</p></div>';
        refreshTestimonialsSwiper();
    }
}

async function submitTestimonial(name, role, message, rating) {
    await addDoc(collection(db, 'testimonials'), {
        name, role, message, rating,
        status: 'pending',
        timestamp: serverTimestamp()
    });
}

async function loadPendingTestimonials() {
    const list = document.getElementById('pending-testimonials-list');
    list.innerHTML = '<div class="loader mx-auto"></div>';
    try {
        let snap;
        try {
            const q = query(collection(db, 'testimonials'), where('status', '==', 'pending'), orderBy('timestamp', 'desc'));
            snap = await getDocs(q);
        } catch {
            const q = query(collection(db, 'testimonials'), where('status', '==', 'pending'));
            snap = await getDocs(q);
        }
        list.innerHTML = '';
        if (snap.empty) {
            list.innerHTML = '<p class="text-center text-gray-400 py-8 font-mono text-sm">No pending reviews 🎉</p>';
            return;
        }
        snap.forEach(docSnap => {
            const t = docSnap.data();
            const stars = '★'.repeat(t.rating || 5);
            const card = document.createElement('div');
            card.className = 'pending-t-card';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-bold text-sm">${escapeHtml(t.name)} <span class="font-normal text-gray-400">— ${escapeHtml(t.role || '')}</span></p>
                        <p class="text-yellow-400 text-xs">${stars}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="edit-btn admin-btn" onclick="handleApproveTestimonial('${docSnap.id}', this)">Approve</button>
                        <button class="delete-btn admin-btn" onclick="handleDeleteTestimonial('${docSnap.id}', true)">Reject</button>
                    </div>
                </div>
                <p class="text-sm text-gray-300">${escapeHtml(t.message)}</p>`;
            list.appendChild(card);
        });
    } catch (e) {
        list.innerHTML = '<p class="text-center text-red-400">Error loading reviews.</p>';
    }
}

window.handleApproveTestimonial = async (id, btn) => {
    btn.textContent = '...';
    await updateDoc(doc(db, 'testimonials', id), { status: 'approved' });
    btn.closest('.pending-t-card').remove();
    showToast('Review approved!', 'success');
    loadTestimonials();
};

window.handleDeleteTestimonial = async (id, isPending = false) => {
    if (!confirm('Delete this review?')) return;
    await deleteDoc(doc(db, 'testimonials', id));
    showToast('Review deleted.', 'info');
    if (isPending) loadPendingTestimonials();
    else loadTestimonials();
};

function initStarRating() {
    const stars = document.querySelectorAll('#star-rating .star');
    const ratingInput = document.getElementById('t-rating');
    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const val = parseInt(star.dataset.val);
            stars.forEach((s, i) => s.classList.toggle('filled', i < val));
        });
        star.addEventListener('mouseout', () => {
            const current = parseInt(ratingInput.value) || 0;
            stars.forEach((s, i) => s.classList.toggle('filled', i < current));
        });
        star.addEventListener('click', () => {
            const val = parseInt(star.dataset.val);
            ratingInput.value = val;
            stars.forEach((s, i) => s.classList.toggle('filled', i < val));
        });
    });
}

let isAdmin = false;
let projects = [];
let scrollObserver;
let projectsSwiper = null;
let testimonialsSwiper = null;

const themes = {
    dark: {
        cursorColor: '#00f15e',
        body: 'bg-black text-gray-200 theme-dark',
        bgLayer1: 'bg-black bg-[radial-gradient(#e5e7eb0f_1px,transparent_1px)] [background-size:16px_16px]',
        bgLayer1Fade: 'opacity-100',
        bgLayer2: 'bg-[radial-gradient(circle_500px_at_50%_200px,rgba(0,241,94,0.12),transparent)]',
        bgLayer2Fade: 'opacity-100',
        navbar: 'bg-black/80 backdrop-blur-sm border-b border-gray-900',
        navLogo: 'text-white',
        navLink: 'text-gray-300 hover:text-[#00f15e]',
        heroTitle: 'text-white',
        heroName: 'text-white',
        heroSubtitle: 'text-gray-400',
        sectionTitle: 'text-white', sectionText: 'text-gray-400',
        underline: 'bg-[#00f15e]',
        aboutImage: 'ring-[#00f15e]/20',
        principleCard: 'bg-gray-900/80 border border-gray-800 hover:border-[#00f15e]/30',
        principleIcon: 'text-[#00f15e]',
        skillsContainer: 'text-gray-300',
        projectCard: 'bg-gray-900/80 border border-gray-800 hover:border-[#00f15e]/30',
        addBtn: 'bg-[#00f15e]/10 hover:bg-[#00f15e]/20 text-[#00f15e] border border-[#00f15e]/20',
        emailContainer: 'bg-gray-900/80 border border-gray-800',
        emailText: 'text-gray-300',
        copyBtn: 'bg-gray-800 hover:bg-gray-700 text-gray-300',
        mailtoBtn: 'bg-[#00f15e] hover:bg-[#00c74d] text-gray-900',
        footer: 'bg-black border-gray-900 text-gray-500',
        modalContent: 'bg-[#0a0a0a] border border-gray-800 text-white',
        modalInput: 'bg-gray-900 border border-gray-700 text-white focus:ring-[#00f15e] placeholder:text-gray-600',
        modalSubmit: 'bg-[#00f15e] hover:bg-[#00c74d] text-black',
        modalClose: 'text-gray-400 hover:text-white',
        detailLinkSource: 'bg-gray-800 hover:bg-gray-700 text-white',
        detailLinkLive: 'bg-[#00f15e] hover:bg-[#00c74d] text-gray-900',
        activeThumb: 'border-[#00f15e]',
        mobileMenu: 'bg-black/95 backdrop-blur-sm border-b border-gray-900',
        navLogoAccent: '#00f15e',
    },
    light: {
        cursorColor: '#2563eb',
        body: 'bg-slate-50 text-slate-800 theme-light',
        bgLayer1: 'bg-slate-50',
        bgLayer1Fade: 'opacity-100',
        bgLayer2: 'bg-[radial-gradient(circle_800px_at_50%_200px,rgba(37,99,235,0.07),transparent)]',
        bgLayer2Fade: 'opacity-100',
        navbar: 'bg-white/90 backdrop-blur-md border-b border-slate-100',
        navLogo: 'text-slate-900',
        navLink: 'text-slate-600 hover:text-blue-600',
        heroTitle: 'text-slate-900',
        heroName: 'text-slate-900',
        heroSubtitle: 'text-slate-500',
        sectionTitle: 'text-slate-900', sectionText: 'text-slate-600',
        underline: 'bg-blue-600',
        aboutImage: 'ring-blue-600/20',
        principleCard: 'bg-white border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md',
        principleIcon: 'text-blue-600',
        skillsContainer: 'text-slate-700',
        projectCard: 'bg-white border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md',
        addBtn: 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100',
        emailContainer: 'bg-white border border-slate-200 shadow-sm',
        emailText: 'text-slate-700',
        copyBtn: 'bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600',
        mailtoBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
        footer: 'bg-white border-slate-100 text-slate-400',
        modalContent: 'bg-white text-slate-800 shadow-2xl',
        modalInput: 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-blue-500 placeholder:text-slate-400',
        modalSubmit: 'bg-blue-600 hover:bg-blue-700 text-white',
        modalClose: 'text-slate-400 hover:text-slate-800',
        detailLinkSource: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
        detailLinkLive: 'bg-blue-600 hover:bg-blue-700 text-white',
        activeThumb: 'border-blue-600',
        mobileMenu: 'bg-white/95 backdrop-blur-sm border-b border-slate-100',
        navLogoAccent: '#2563eb',
    }
};

function applyTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;
    document.documentElement.style.setProperty('--cursor-color', theme.cursorColor);

    document.body.className = '';
    document.body.classList.add(...theme.body.split(' ').filter(Boolean));

    const setClasses = (elements, classes) => {
        if (!elements) return;
        const list = elements.length !== undefined ? Array.from(elements) : [elements];
        list.forEach(el => {
            if (!el || typeof el.setAttribute !== 'function') return;
            const preserved = (el.getAttribute('class') || '').split(' ').filter(c =>
                c && !c.startsWith('bg-') && !c.startsWith('text-') && !c.startsWith('border-') &&
                !c.startsWith('ring-') && !c.startsWith('shadow-') && !c.startsWith('hover:') &&
                !c.startsWith('backdrop-') && !c.startsWith('placeholder:') && !c.startsWith('focus:') &&
                !c.startsWith('opacity-') && !c.startsWith('theme-')
            ).join(' ');
            el.setAttribute('class', `${preserved} ${classes}`.trim());
        });
    };

    setClasses(document.getElementById('bg-layer-1'), `${theme.bgLayer1} ${theme.bgLayer1Fade}`);
    setClasses(document.getElementById('bg-layer-2'), `${theme.bgLayer2} ${theme.bgLayer2Fade}`);
    setClasses(document.getElementById('navbar'), theme.navbar);
    setClasses(document.getElementById('nav-logo'), `${theme.navLogo} text-xl font-black tracking-wider`);
    setClasses(document.querySelectorAll('.nav-link'), theme.navLink);
    setClasses(document.querySelectorAll('.mobile-nav-link'), theme.navLink);
    setClasses(document.getElementById('hero-title'), theme.heroTitle);
    setClasses(document.getElementById('hero-name'), theme.heroName);
    setClasses(document.getElementById('hero-subtitle'), theme.heroSubtitle);
    setClasses(document.getElementById('about-title'), theme.sectionTitle);
    setClasses(document.getElementById('about-text'), theme.sectionText);
    setClasses(document.getElementById('about-underline'), theme.underline);
    setClasses(document.getElementById('about-image'), theme.aboutImage);
    setClasses(document.getElementById('principles-title'), theme.sectionTitle);
    setClasses(document.getElementById('principles-underline'), theme.underline);
    setClasses(document.getElementById('skills-title'), theme.sectionTitle);
    setClasses(document.getElementById('skills-underline'), theme.underline);
    setClasses(document.getElementById('skills-container'), theme.skillsContainer);
    setClasses(document.getElementById('projects-title'), theme.sectionTitle);
    setClasses(document.getElementById('projects-underline-line'), theme.underline);
    setClasses(document.getElementById('timeline-title'), theme.sectionTitle);
    setClasses(document.getElementById('timeline-underline'), theme.underline);
    setClasses(document.getElementById('contact-title'), theme.sectionTitle);
    setClasses(document.getElementById('contact-text'), theme.sectionText);
    setClasses(document.getElementById('contact-underline'), theme.underline);
    setClasses(document.getElementById('email-container'), theme.emailContainer);
    setClasses(document.getElementById('email-text'), theme.emailText);
    setClasses(document.getElementById('copy-email-btn'), theme.copyBtn);
    setClasses(document.getElementById('mailto-btn'), theme.mailtoBtn);
    setClasses(document.getElementById('footer'), `${theme.footer} border-t`);
    setClasses(document.getElementById('mobile-menu'), theme.mobileMenu);
    setClasses([
        document.getElementById('add-project-btn'),
        document.getElementById('add-principle-btn'),
        document.getElementById('add-skill-btn')
    ].filter(Boolean), theme.addBtn);

    document.querySelectorAll('.modal-content').forEach(el => setClasses(el, theme.modalContent));
    document.querySelectorAll('.modal-input').forEach(el => setClasses(el, theme.modalInput));
    document.querySelectorAll('.modal-close').forEach(el => setClasses(el, theme.modalClose));
    [
        'login-submit-btn', 'project-submit-btn', 'principle-submit-btn',
        'skill-submit-btn', 'about-submit-btn', 'text-edit-submit-btn',
        'testimonial-submit-btn', 'timeline-submit-btn', 'stats-submit-btn',
        'gs-submit-btn'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) setClasses(el, theme.modalSubmit);
    });

    const accent = document.getElementById('nav-logo-accent');
    if (accent) accent.style.color = theme.navLogoAccent;

    localStorage.setItem('portfolioTheme', themeName);
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === themeName));
    renderAllContent();
}

async function loadAllData() {
    await Promise.all([
        loadSiteSettings(),
        loadPrinciples(),
        loadSkills(),
        loadProjects(),
        loadTimeline(),
        loadTestimonials(),
        initVisitorCounter(),
    ]);
}

async function loadTimeline() {
    const cont = document.getElementById('timeline-container');
    Array.from(cont.children).forEach(el => {
        if (!el.classList.contains('timeline-line')) el.remove();
    });
    const loader = document.createElement('div');
    loader.id = 'timeline-loader';
    loader.className = 'loader mx-auto mt-8';
    cont.appendChild(loader);
    try {
        let snap;
        try { snap = await getDocs(query(collection(db, 'timeline'), orderBy('createdAt', 'asc'))); }
        catch { snap = await getDocs(collection(db, 'timeline')); }
        document.getElementById('timeline-loader')?.remove();
        if (snap.empty) { renderStaticTimeline(cont); return; }

        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        items.sort((a, b) => {
            const extractYear = str => {
                const match = String(str || '').match(/\d{4}/);
                return match ? parseInt(match[0]) : 0;
            };
            return extractYear(b.year || b.date) - extractYear(a.year || a.date);
        });

        let idx = 0;
        items.forEach(item => {
            cont.appendChild(createTimelineCard(item, idx % 2 === 0 ? 'timeline-left' : 'timeline-right'));
            idx++;
        });
        feather.replace();
        refreshGsapScrollTriggers();
    } catch (e) { document.getElementById('timeline-loader')?.remove(); renderStaticTimeline(cont); }
}

function renderStaticTimeline(cont) {
    const defaults = [
        { id: 's1', year: '2023 – Present', role: 'Android Developer', company: 'Freelance', icon: 'briefcase', desc: 'Building production-ready Android apps using Kotlin, Jetpack Compose and Clean Architecture.', tags: ['Kotlin', 'Jetpack Compose', 'MVVM'] },
        { id: 's2', year: '2022 – 2023', role: 'IEEE Vice Head', company: 'IEEE Student Branch', icon: 'users', desc: 'Technical leadership: workshops, events, and mentoring junior developers.', tags: ['Leadership', 'Mentoring', 'Android'] },
        { id: 's3', year: '2020 – 2024', role: 'B.Sc. Computer Science', company: 'University', icon: 'book', desc: 'Software engineering, algorithms, data structures, and mobile development.', tags: ['CS', 'Software Engineering', 'Algorithms'] },
    ];
    defaults.forEach((item, i) => cont.appendChild(createTimelineCard(item, i % 2 === 0 ? 'timeline-left' : 'timeline-right')));
    feather.replace();
    refreshGsapScrollTriggers();
}

function createTimelineCard(item, side) {
    const w = document.createElement('div');
    w.className = `timeline-item ${side} gsap-reveal`;
    w.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-card">
            <div class="timeline-date">${item.year || item.date || ''}</div>
            <h3 class="timeline-role">${item.role || item.title || ''}</h3>
            <p class="timeline-company"><i data-feather="${item.icon || 'briefcase'}" class="w-3 h-3 inline mr-1"></i>${item.company || ''}</p>
            <p class="timeline-desc">${item.desc || item.description || ''}</p>
            <div class="timeline-tags">${(item.tags || []).map(t => `<span>${t}</span>`).join('')}</div>
            ${isAdmin ? `<div class="flex gap-2 mt-3">
                <button class="edit-btn admin-btn" onclick="handleEditTimeline('${item.id}')">Edit</button>
                <button class="delete-btn admin-btn" onclick="handleDeleteTimeline('${item.id}')">Delete</button>
            </div>` : ''}
        </div>`;
    return w;
}

window.handleEditTimeline = async id => {
    let data = {};
    try {
        const snap = await getDoc(doc(db, 'timeline', id));
        if (snap.exists()) data = snap.data();
    } catch {}
    const statics = {
        s1: { year: '2023 – Present', role: 'Android Developer', company: 'Freelance', icon: 'briefcase', desc: 'Building production-ready Android apps using Kotlin, Jetpack Compose and Clean Architecture.', tags: ['Kotlin','Jetpack Compose','MVVM'] },
        s2: { year: '2022 – 2023', role: 'IEEE Vice Head', company: 'IEEE Student Branch', icon: 'users', desc: 'Technical leadership: workshops, events, and mentoring junior developers.', tags: ['Leadership','Mentoring','Android'] },
        s3: { year: '2020 – 2024', role: 'B.Sc. Computer Science', company: 'University', icon: 'book', desc: 'Software engineering, algorithms, data structures, and mobile development.', tags: ['CS','Software Engineering','Algorithms'] }
    };
    if (!data.role) data = statics[id] || {};
    document.getElementById('timeline-id').value = id;
    document.getElementById('timeline-year').value    = data.year || data.date || '';
    document.getElementById('timeline-role').value    = data.role || data.title || '';
    document.getElementById('timeline-company').value = data.company || '';
    document.getElementById('timeline-icon').value    = data.icon || 'briefcase';
    document.getElementById('timeline-desc').value    = data.desc || data.description || '';
    document.getElementById('timeline-tags').value    = (data.tags || []).join(', ');
    document.getElementById('timeline-modal-title').innerText = 'Edit Timeline Item';
    openModal('timeline-modal');
};

window.handleDeleteTimeline = async id => {
    if (!confirm('Delete this item?')) return;
    if (!['s1','s2','s3'].includes(id)) {
        try { await deleteDoc(doc(db, 'timeline', id)); } catch(e) { console.error(e); }
    }
    loadTimeline();
    showToast('Deleted.', 'info');
};

let _cachedGlobalSettings = {};

async function loadSiteSettings() {
    try {
        const heroSnap = await getDoc(doc(db, 'site_content', 'hero'));
        if (heroSnap.exists()) {
            const d = heroSnap.data();
            if (d.title)    document.getElementById('hero-name').textContent     = d.title;
            if (d.subtitle) document.getElementById('hero-subtitle').textContent = d.subtitle;
        }

        const aboutSnap = await getDoc(doc(db, 'site_content', 'about'));
        if (aboutSnap.exists()) {
            const d = aboutSnap.data();
            if (d.text)     document.getElementById('about-text').textContent = d.text;
            if (d.imageUrl) document.getElementById('about-image').src        = d.imageUrl;
        }

        const statsSnap     = await getDoc(doc(db, 'site_content', 'stats'));
        const statYearsEl   = document.getElementById('stat-years');
        const statAppsEl    = document.getElementById('stat-apps');
        const statClientsEl = document.getElementById('stat-clients');
        const statLinesEl   = document.querySelector('#stat-lines');
        const statLblYears  = document.querySelector('#stat-label-years');
        const statLblApps   = document.querySelector('#stat-label-apps');
        const statLblClients= document.querySelector('#stat-label-clients');
        if (statsSnap.exists()) {
            const d = statsSnap.data();
            if (d.years   != null && statYearsEl)   { statYearsEl.dataset.target   = d.years;   statYearsEl.textContent   = '—'; }
            if (d.apps    != null && statAppsEl)    { statAppsEl.dataset.target    = d.apps;    statAppsEl.textContent    = '—'; }
            if (d.clients != null && statClientsEl) { statClientsEl.dataset.target = d.clients; statClientsEl.textContent = '—'; }
            if (d.lines      && statLinesEl)     statLinesEl.textContent    = d.lines;
            if (d.lblYears   && statLblYears)    statLblYears.textContent   = d.lblYears;
            if (d.lblApps    && statLblApps)     statLblApps.textContent    = d.lblApps;
            if (d.lblClients && statLblClients)  statLblClients.textContent = d.lblClients;
        } else {
            if (statYearsEl)   { statYearsEl.dataset.target  = '0'; statYearsEl.textContent   = '—'; }
            if (statAppsEl)    { statAppsEl.dataset.target   = '0'; statAppsEl.textContent    = '—'; }
            if (statClientsEl) { statClientsEl.dataset.target= '0'; statClientsEl.textContent = '—'; }
            if (statLinesEl)   statLinesEl.textContent = '—';
        }

        try {
            const gsSnap = await getDoc(doc(db, 'site_content', 'global_settings'));
            _cachedGlobalSettings = gsSnap.exists() ? gsSnap.data() : {};
            if (gsSnap.exists()) applyGlobalSettings(_cachedGlobalSettings);
        } catch (gsErr) {
            console.warn('loadSiteSettings — global_settings fetch failed:', gsErr);
            _cachedGlobalSettings = {};
        }

        if (typeof window._retryStatsCounters === 'function') window._retryStatsCounters();

    } catch (e) { console.warn('loadSiteSettings:', e); }
}

function applyGlobalSettings(d) {
    if (!d) return;

    if (d.cvLink) {
        ['#cv-download-btn', '#about-cv-btn'].forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.href = d.cvLink;
        });
    }

    if (d.linkedin) {
        ['#social-linkedin', '#footer-linkedin'].forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.href = d.linkedin;
        });
    }
    if (d.github) {
        ['#social-github', '#footer-github'].forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.href = d.github;
        });
    }
    if (d.facebook) {
        ['#social-facebook', '#footer-facebook'].forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.href = d.facebook;
        });
    }

    if (d.contactEmail) {
        const emailTextEl  = document.getElementById('email-text');
        const mailtoBtn    = document.getElementById('mailto-btn');
        if (emailTextEl) emailTextEl.textContent = d.contactEmail;
        if (mailtoBtn)   mailtoBtn.href = `mailto:${d.contactEmail}`;
    }

    if (d.phone) {
        const phoneEl = document.getElementById('contact-phone');
        if (phoneEl) { phoneEl.textContent = d.phone; phoneEl.closest('.contact-phone-row')?.classList.remove('hidden'); }
    }

    if (d.heroSubtitle) {
        const hsEl = document.getElementById('hero-subtitle');
        if (hsEl) hsEl.textContent = d.heroSubtitle;
    }

    if (d.aboutImageUrl) {
        const aiEl = document.getElementById('about-image');
        if (aiEl) aiEl.src = d.aboutImageUrl;
    }

    if (d.footerText) {
        const ft = document.getElementById('footer-text');
        if (ft) {
            ft.innerHTML = `&copy; <span id="year">${new Date().getFullYear()}</span> ${escapeHtml(d.footerText)}`;
        }
    }
}

async function loadPrinciples() {
    const grid = document.getElementById('principles-grid');
    const loader = document.getElementById('principles-loader');
    try {
        let snap;
        try { snap = await getDocs(query(collection(db, 'principles'), orderBy('createdAt', 'asc'))); }
        catch { snap = await getDocs(collection(db, 'principles')); }
        if (loader) loader.remove();
        grid.innerHTML = '';
        const themeName = localStorage.getItem('portfolioTheme') || 'dark';
        const theme = themes[themeName];
        snap.forEach(docSnap => {
            const p = { id: docSnap.id, ...docSnap.data() };
            grid.appendChild(createPrincipleCard(p, theme));
        });
        feather.replace();
        refreshGsapScrollTriggers();
    } catch (e) {
        if (loader) loader.remove();
        grid.innerHTML = '<p class="col-span-3 text-center text-gray-400 py-8">Unable to load principles.</p>';
    }
}

function createPrincipleCard(p, theme) {
    const card = document.createElement('div');
    card.className = `principle-card p-6 gsap-reveal ${theme.principleCard}`;
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <i data-feather="${p.icon || 'star'}" class="w-8 h-8 ${theme.principleIcon}"></i>
            ${isAdmin ? `<div class="flex gap-2">
                <button class="edit-btn admin-btn" onclick="handleEditPrinciple('${p.id}')">Edit</button>
                <button class="delete-btn admin-btn" onclick="handleDeletePrinciple('${p.id}')">Del</button>
            </div>` : ''}
        </div>
        <h3 class="font-bold text-lg mb-2">${p.title}</h3>
        <p class="text-sm leading-relaxed opacity-70">${p.description}</p>`;
    return card;
}

async function loadSkills() {
    const container = document.getElementById('skills-container');
    const loader = document.getElementById('skills-loader');
    try {
        let snap;
        try { snap = await getDocs(query(collection(db, 'skills'), orderBy('createdAt', 'asc'))); }
        catch { snap = await getDocs(collection(db, 'skills')); }
        if (loader) loader.remove();
        container.innerHTML = '';
        snap.forEach(docSnap => {
            const s = { id: docSnap.id, ...docSnap.data() };
            container.appendChild(createSkillItem(s));
        });
        feather.replace();
        refreshGsapScrollTriggers();
    } catch (e) {
        if (loader) loader.remove();
    }
}

function createSkillItem(s) {
    const item = document.createElement('div');
    item.className = 'skill-item flex flex-col items-center gap-2 text-center gsap-reveal';
    item.innerHTML = `
        <i class="${s.iconClass} text-5xl colored"></i>
        <span class="text-xs font-medium opacity-70">${s.name}</span>
        ${isAdmin ? `<div class="flex gap-1">
            <button class="edit-btn admin-btn" onclick="handleEditSkill('${s.id}')">E</button>
            <button class="delete-btn admin-btn" onclick="handleDeleteSkill('${s.id}')">D</button>
        </div>` : ''}`;
    return item;
}

async function loadProjects() {
    const grid = document.getElementById('projects-grid');
    const loader = document.getElementById('projects-loader');
    try {
        let snap;
        try { snap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc'))); }
        catch { snap = await getDocs(collection(db, 'projects')); }
        if (loader) loader.remove();

        grid.innerHTML = '';

        const themeName = localStorage.getItem('portfolioTheme') || 'dark';
        const theme = themes[themeName];
        projects = [];
        snap.forEach(docSnap => {
            const p = { id: docSnap.id, ...docSnap.data() };
            projects.push(p);

            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.appendChild(createProjectCard(p, theme));
            grid.appendChild(slide);
        });

        refreshProjectsSwiper();
        feather.replace();
    } catch (e) {
        if (loader) loader.remove();
        grid.innerHTML = '<div class="swiper-slide"><p class="text-center text-gray-400 py-8">Unable to load projects.</p></div>';
        refreshProjectsSwiper();
    }
}

const PLATFORM_BADGE_MAP = {
    android: 'badge-android',
    ios:     'badge-ios',
    desktop: 'badge-desktop',
    web:     'badge-web',
    kmp:     'badge-kmp',
    cmp:     'badge-cmp',
};

const PLATFORM_LABELS = {
    android: 'Android',
    ios:     'iOS',
    desktop: 'Desktop',
    web:     'Web',
    kmp:     'KMP',
    cmp:     'CMP',
};

function buildPlatformBadgesHtml(platforms = []) {
    return platforms
        .map(p => {
            const cls = PLATFORM_BADGE_MAP[p] || '';
            const label = PLATFORM_LABELS[p] || p;
            return `<span class="platform-badge ${cls}">${label}</span>`;
        })
        .join('');
}

function isMultiPlatform(p) {
    return (
        Array.isArray(p.platforms) &&
        p.platforms.length > 1 &&
        Array.isArray(p.images) &&
        p.images.length > 0
    );
}

const FRAME_CLASS_MAP = {
    android: 'frame-android',
    ios:     'frame-ios',
    desktop: 'frame-laptop',
    kmp:     'frame-android', 
    cmp:     'frame-android', 
    web:     'frame-laptop',
};

function createProjectCard(p, theme) {
    const card = document.createElement('div');
    card.className = `project-card ${theme.projectCard} cursor-pointer`;
    card.onclick = () => showProjectDetails(p.id);

    const badgesHtml = buildPlatformBadgesHtml(p.platforms || []);
    const badgesRow = badgesHtml
        ? `<div class="flex flex-wrap gap-1.5 mb-3">${badgesHtml}</div>`
        : '';

    card.innerHTML = `
        <img src="${p.thumbnail || 'https://placehold.co/600x400'}" alt="${p.title}" class="w-full h-72 object-cover">
        <div class="p-5">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-lg">${p.title}</h3>
                ${isAdmin ? `<div class="flex gap-2" onclick="event.stopPropagation()">
                    <button class="edit-btn admin-btn" onclick="handleEditProject('${p.id}')">Edit</button>
                    <button class="delete-btn admin-btn" onclick="handleDeleteProject('${p.id}')">Del</button>
                </div>` : ''}
            </div>
            ${badgesRow}
            <p class="text-sm opacity-60 leading-relaxed mb-4 line-clamp-2">${p.description}</p>
            <div class="flex flex-wrap gap-1.5">
                ${(p.technologies || []).slice(0, 4).map(t => `<span class="tech-badge text-xs px-2 py-0.5 rounded-md font-mono">${t}</span>`).join('')}
                ${(p.technologies || []).length > 4 ? `<span class="tech-badge text-xs px-2 py-0.5 rounded-md font-mono">+${p.technologies.length - 4}</span>` : ''}
            </div>
        </div>`;

    card.querySelectorAll('.tech-badge').forEach(b => {
        const tn = localStorage.getItem('portfolioTheme') || 'dark';
        if (tn === 'dark') {
            b.style.cssText = 'background:rgba(0,241,94,0.08);color:#00f15e;border:1px solid rgba(0,241,94,0.15)';
        } else {
            b.style.cssText = 'background:rgba(37,99,235,0.08);color:#2563eb;border:1px solid rgba(37,99,235,0.15)';
        }
    });
    return card;
}

function renderAllContent() {
    const principlesLoaded = !document.getElementById('principles-loader') && document.getElementById('principles-grid')?.children.length > 0;
    const skillsLoaded     = !document.getElementById('skills-loader')    && document.getElementById('skills-container')?.children.length > 0;
    const projectsLoaded   = !document.getElementById('projects-loader')  && document.getElementById('projects-grid')?.children.length > 0;
    const timelineLoaded   = !document.getElementById('timeline-loader')  && document.getElementById('timeline-container')?.querySelectorAll('.timeline-item').length > 0;

    if (principlesLoaded) loadPrinciples();
    if (skillsLoaded)     loadSkills();
    if (projectsLoaded)   loadProjects();
    if (timelineLoaded)   loadTimeline();
}

window.handleEditPrinciple = async (id) => {
    const p = (await getDoc(doc(db, 'principles', id))).data();
    document.getElementById('principle-id').value = id;
    document.getElementById('principle-title').value = p.title;
    document.getElementById('principle-description').value = p.description;
    document.getElementById('principle-icon').value = p.icon;
    document.getElementById('principle-modal-title').innerText = 'Edit Principle';
    openModal('principle-modal');
};

window.handleDeletePrinciple = async (id) => {
    if (confirm('Delete this principle?')) {
        await deleteDoc(doc(db, 'principles', id));
        loadPrinciples();
        showToast('Principle deleted.', 'info');
    }
};

window.handleEditSkill = async (id) => {
    const s = (await getDoc(doc(db, 'skills', id))).data();
    document.getElementById('skill-id').value = id;
    document.getElementById('skill-name').value = s.name;
    document.getElementById('skill-icon-class').value = s.iconClass;
    document.getElementById('skill-modal-title').innerText = 'Edit Skill';
    openModal('skill-modal');
};

window.handleDeleteSkill = async (id) => {
    if (confirm('Delete this skill?')) {
        await deleteDoc(doc(db, 'skills', id));
        loadSkills();
        showToast('Skill deleted.', 'info');
    }
};

window.handleEditProject = async (id) => {
    const p = projects.find(pr => pr.id === id);
    if (!p) return;
    document.getElementById('project-id').value = id;
    document.getElementById('project-title').value = p.title;
    document.getElementById('project-description').value = p.description;
    document.getElementById('project-thumbnail-url').value = p.thumbnail || '';
    document.getElementById('project-tech').value = (p.technologies || []).join(', ');
    document.getElementById('project-source-link').value = p.sourceLink || '';
    document.getElementById('project-live-link').value = p.liveLink || '';

    const storedPlatforms = (p.platforms || []).map(v => String(v).toLowerCase());
    document.querySelectorAll('#project-platform-selector .platform-checkbox').forEach(cb => {
        const isChecked = storedPlatforms.includes(cb.value.toLowerCase());
        cb.checked = isChecked;
        const badge = cb.nextElementSibling;
        if (badge) badge.style.outline = isChecked ? '2px solid currentColor' : '';
    });

    const imagesContainer = document.getElementById('additional-images-container');
    imagesContainer.innerHTML = '';
    (p.images || []).forEach(img => addImageRow(img.url, img.description));
    feather.replace();
    document.getElementById('project-modal-title').innerText = 'Edit Project';
    openModal('project-modal');
};

window.handleDeleteProject = async (id) => {
    if (confirm('Delete this project?')) {
        await deleteDoc(doc(db, 'projects', id));
        loadProjects();
        showToast('Project deleted.', 'info');
    }
};

let _detailSlideshowTimer = null;

window.showProjectDetails = (id) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    const themeName = localStorage.getItem('portfolioTheme') || 'dark';
    const theme = themes[themeName];
    const isLight = themeName === 'light';

    if (_detailSlideshowTimer) { clearInterval(_detailSlideshowTimer); _detailSlideshowTimer = null; }

    document.getElementById('detail-title').innerText = project.title;
    const badgesContainer = document.getElementById('detail-platform-badges');
    if (badgesContainer) badgesContainer.innerHTML = buildPlatformBadgesHtml(project.platforms || []);

    const allImages = [
        { url: project.thumbnail, description: 'Project Thumbnail' },
        ...(project.images || [])
    ].filter(img => img && img.url);

    const mockupArea = document.getElementById('detail-mockup-area');
    mockupArea.innerHTML = '';

    if (allImages.length > 0) {
        const gallery = document.createElement('div');
        gallery.className = 'detail-gallery';

        const mainImgWrap = document.createElement('div');
        mainImgWrap.className = 'detail-gallery-main';

        const mainImg = document.createElement('img');
        mainImg.src = allImages[0].url;
        mainImg.alt = allImages[0].description || project.title;
        mainImg.className = 'detail-gallery-img';
        mainImgWrap.appendChild(mainImg);

        if (allImages.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'detail-gallery-arrow detail-gallery-prev';
            prevBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>';
            const nextBtn = document.createElement('button');
            nextBtn.className = 'detail-gallery-arrow detail-gallery-next';
            nextBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>';
            mainImgWrap.appendChild(prevBtn);
            mainImgWrap.appendChild(nextBtn);

            const dotsWrap = document.createElement('div');
            dotsWrap.className = 'detail-gallery-dots';
            allImages.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'detail-gallery-dot' + (i === 0 ? ' active' : '');
                dot.dataset.idx = i;
                dotsWrap.appendChild(dot);
            });
            mainImgWrap.appendChild(dotsWrap);

            let currentIdx = 0;
            function goTo(idx, animate = true) {
                currentIdx = (idx + allImages.length) % allImages.length;
                if (animate) mainImg.classList.add('detail-gallery-fade');
                setTimeout(() => {
                    mainImg.src = allImages[currentIdx].url;
                    mainImg.alt = allImages[currentIdx].description || '';
                    mainImg.classList.remove('detail-gallery-fade');
                }, animate ? 180 : 0);
                dotsWrap.querySelectorAll('.detail-gallery-dot').forEach((d, i) =>
                    d.classList.toggle('active', i === currentIdx)
                );
                document.querySelectorAll('.gallery-thumbnail').forEach((t, i) => {
                    t.classList.toggle('active', i === currentIdx);
                    t.classList.toggle(theme.activeThumb, i === currentIdx);
                });
            }

            prevBtn.addEventListener('click', () => { goTo(currentIdx - 1); resetSlideshow(); });
            nextBtn.addEventListener('click', () => { goTo(currentIdx + 1); resetSlideshow(); });
            dotsWrap.addEventListener('click', e => {
                const dot = e.target.closest('.detail-gallery-dot');
                if (dot) { goTo(parseInt(dot.dataset.idx)); resetSlideshow(); }
            });

            function startSlideshow() {
                _detailSlideshowTimer = setInterval(() => goTo(currentIdx + 1), 3500);
            }
            function resetSlideshow() {
                clearInterval(_detailSlideshowTimer);
                startSlideshow();
            }
            startSlideshow();

            gallery._goTo = goTo;
            gallery._resetSlideshow = resetSlideshow;
        }

        gallery.appendChild(mainImgWrap);

        if (allImages.length > 1) {
            const thumbStrip = document.createElement('div');
            thumbStrip.className = 'detail-thumb-strip';
            allImages.forEach((imgObj, idx) => {
                const thumb = document.createElement('img');
                thumb.src = imgObj.url;
                thumb.alt = imgObj.description || '';
                thumb.className = 'gallery-thumbnail' + (idx === 0 ? ' active ' + theme.activeThumb : '');
                thumb.addEventListener('click', () => {
                    if (gallery._goTo) gallery._goTo(idx);
                    if (gallery._resetSlideshow) gallery._resetSlideshow();
                });
                thumbStrip.appendChild(thumb);
            });
            gallery.appendChild(thumbStrip);
        }

        mockupArea.appendChild(gallery);
    }

    const platforms = project.platforms || [];
    if (platforms.length > 0) {
        const frameWrap = document.createElement('div');
        frameWrap.className = 'detail-frame-strip';

        if (isMultiPlatform(project)) {
            const primaryPlatform   = platforms[0] || 'android';
            const secondaryPlatform = platforms[1] || 'desktop';
            const pFrame = FRAME_CLASS_MAP[primaryPlatform]   || 'frame-android';
            const sFrame = FRAME_CLASS_MAP[secondaryPlatform] || 'frame-laptop';
            const pLabel = PLATFORM_LABELS[primaryPlatform]   || primaryPlatform;
            const sLabel = PLATFORM_LABELS[secondaryPlatform] || secondaryPlatform;
            const pSrc   = project.thumbnail || 'https://placehold.co/300x600';
            const sSrc   = (project.images || [])[0]?.url || 'https://placehold.co/600x400';

            const pair = document.createElement('div');
            pair.className = 'device-mockup-pair';
            pair.innerHTML = `
                <div class="device-frame ${pFrame}">
                    <div class="frame-screen"><img src="${pSrc}" alt="${pLabel}" class="mockup-screen-img"></div>
                    <span class="frame-label">${pLabel}</span>
                </div>
                <div class="device-frame ${sFrame}">
                    <div class="frame-screen"><img src="${sSrc}" alt="${sLabel}" class="mockup-screen-img"></div>
                    <span class="frame-label">${sLabel}</span>
                </div>`;
            frameWrap.appendChild(pair);
        } else {
            const singlePlatform = platforms[0];
            const frameClass = FRAME_CLASS_MAP[singlePlatform];
            if (frameClass) {
                const single = document.createElement('div');
                single.className = 'device-mockup-single';
                single.innerHTML = `
                    <div class="device-frame ${frameClass}">
                        <div class="frame-screen"><img src="${project.thumbnail || ''}" alt="App screen" class="mockup-screen-img"></div>
                        <span class="frame-label">${PLATFORM_LABELS[singlePlatform] || ''}</span>
                    </div>`;
                frameWrap.appendChild(single);
            }
        }
        if (frameWrap.children.length) mockupArea.appendChild(frameWrap);
    }

    document.getElementById('detail-description').innerText = project.description;

    document.getElementById('detail-tech').innerHTML = (project.technologies || [])
        .map(t => `<span class="${isLight ? 'bg-blue-50 text-blue-600' : 'bg-gray-800 text-green-400'} text-sm font-semibold px-3 py-1 rounded-full font-mono">${t}</span>`)
        .join('');

    const linksContainer = document.getElementById('detail-links');
    linksContainer.innerHTML = '';
    if (project.sourceLink) {
        const a = document.createElement('a');
        a.href = project.sourceLink; a.target = '_blank';
        a.innerText = 'Source Code';
        a.className = `font-bold py-2 px-4 rounded-xl transition ${theme.detailLinkSource}`;
        linksContainer.appendChild(a);
    }
    if (project.liveLink) {
        const a = document.createElement('a');
        a.href = project.liveLink; a.target = '_blank';
        a.innerText = 'Live / Play Store';
        a.className = `font-bold py-2 px-4 rounded-xl transition ${theme.detailLinkLive}`;
        linksContainer.appendChild(a);
    }

    generateProjectQRCode(project, isLight);

    openModal('project-detail-modal');
};

function generateProjectQRCode(project, isLight) {
    const linksContainer = document.getElementById('detail-links');
    if (!linksContainer) return;

    const oldQr = document.getElementById('project-qr-block');
    if (oldQr) oldQr.remove();

    if (!project.liveLink) return; 

    const qrBlock = document.createElement('div');
    qrBlock.id = 'project-qr-block';
    qrBlock.className = 'mt-4 flex flex-col items-start gap-2';
    qrBlock.innerHTML = `
        <p class="text-xs font-mono opacity-50 tracking-widest uppercase">Scan to open</p>
        <div id="qrcode-canvas"
             class="rounded-xl overflow-hidden border ${isLight ? 'border-slate-200' : 'border-gray-700'}"
             style="width:100px;height:100px;display:flex;align-items:center;justify-content:center;">
        </div>`;
    linksContainer.appendChild(qrBlock);

    setTimeout(() => {
        const canvas = document.getElementById('qrcode-canvas');
        if (!canvas) return;
        canvas.innerHTML = ''; 

        try {
            new QRCode(canvas, {
                text: project.liveLink,
                width:  96,
                height: 96,
                colorDark:  isLight ? '#1e293b' : '#ffffff',
                colorLight: isLight ? '#f8fafc' : '#0a0a0a',
                correctLevel: QRCode.CorrectLevel.M,
            });
        } catch (err) {
            console.warn('QRCode generation failed:', err);
            canvas.innerHTML = '<p class="text-xs opacity-40 p-2">QR unavailable</p>';
        }
    }, 50);
}

function openModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal-content').classList.remove('scale-95'), 10);
    applyTheme(localStorage.getItem('portfolioTheme') || 'dark');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    modal.querySelector('.modal-content').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
    if (id === 'project-detail-modal' && _detailSlideshowTimer) {
        clearInterval(_detailSlideshowTimer);
        _detailSlideshowTimer = null;
    }
}

function addImageRow(url = '', description = '') {
    const themeName = localStorage.getItem('portfolioTheme') || 'dark';
    const inputClasses = themes[themeName].modalInput;
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2';
    row.innerHTML = `
        <input type="url" placeholder="Image URL" class="modal-input ${inputClasses} p-2 rounded-xl flex-grow additional-image-url" value="${url}">
        <input type="text" placeholder="Image Description" class="modal-input ${inputClasses} p-2 rounded-xl flex-grow-[2] additional-image-desc" value="${description}">
        <button type="button" class="p-2 bg-red-500/30 hover:bg-red-500/60 rounded-xl remove-image-btn"><i data-feather="trash-2" class="w-4 h-4"></i></button>`;
    document.getElementById('additional-images-container').appendChild(row);
    feather.replace();
}

function initProjectsSwiper() {
    if (projectsSwiper) {
        projectsSwiper.destroy(true, true);
        projectsSwiper = null;
    }
    projectsSwiper = new Swiper('.projects-swiper', {
        slidesPerView: 1,
        spaceBetween: 24,
        grabCursor: true,
        loop: false,
        touchRatio: 1,
        simulateTouch: true,
        touchStartPreventDefault: false,
        breakpoints: {
            640: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 24,
            },
        },
        navigation: {
            nextEl: '.projects-swiper-next',
            prevEl: '.projects-swiper-prev',
        },
        pagination: {
            el: '.projects-swiper-pagination',
            clickable: true,
        },
        a11y: {
            prevSlideMessage: 'Previous project',
            nextSlideMessage: 'Next project',
        },
    });
}

function refreshProjectsSwiper() {
    setTimeout(initProjectsSwiper, 50);
}

function initTestimonialsSwiper() {
    if (testimonialsSwiper) {
        testimonialsSwiper.destroy(true, true);
        testimonialsSwiper = null;
    }
    testimonialsSwiper = new Swiper('.testimonials-swiper', {
        slidesPerView: 1,
        spaceBetween: 24,
        grabCursor: true,
        loop: false,
        centeredSlides: false,
        touchRatio: 1,
        simulateTouch: true,
        touchStartPreventDefault: false,
        autoplay: {
            delay: 5000,
            disableOnInteraction: true,
            pauseOnMouseEnter: true,
        },
        breakpoints: {
            640: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 24,
            },
        },
        pagination: {
            el: '.testimonials-swiper-pagination',
            clickable: true,
        },
        a11y: {
            prevSlideMessage: 'Previous review',
            nextSlideMessage: 'Next review',
        },
    });
}

function refreshTestimonialsSwiper() {
    setTimeout(initTestimonialsSwiper, 50);
}

function initGsapAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('GSAP / ScrollTrigger not loaded. Falling back to CSS observer.');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
        .from('.hero-greeting',  { opacity: 0, y: 20, duration: 0.6 }, 0.2)
        .from('#hero-title',     { opacity: 0, y: 40, duration: 0.8 }, 0.4)
        .from('#hero-subtitle',  { opacity: 0, y: 30, duration: 0.7 }, 0.7)
        .from('#hero-socials',   { opacity: 0, y: 20, duration: 0.6 }, 1.0)
        .from('.scroll-down-btn',{ opacity: 0, y: 15, duration: 0.5 }, 1.2);

    const sectionHeadings = gsap.utils.toArray([
        '#about', '#timeline', '#principles', '#skills',
        '#projects', '#testimonials', '#contact'
    ]);
    sectionHeadings.forEach(section => {
        const label     = section.querySelector('.section-label');
        const heading   = section.querySelector('.section-heading');
        const underline = section.querySelector('.section-title-underline');
        const targets   = [label, heading, underline].filter(Boolean);
        if (!targets.length) return;

        gsap.from(targets, {
            opacity: 0,
            y: 35,
            duration: 0.75,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                once: true,
            },
        });
    });

    gsap.from('.stat-card', {
        opacity: 0,
        y: 40,
        scale: 0.95,
        duration: 0.65,
        stagger: 0.1,
        ease: 'back.out(1.4)',
        scrollTrigger: {
            trigger: '#stats',
            start: 'top 80%',
            once: true,
        },
    });

    gsap.from('.about-image-wrapper', {
        opacity: 0,
        x: -60,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '#about', start: 'top 75%', once: true },
    });
    gsap.from('#about .md\\:w-2\\/3', {
        opacity: 0,
        x: 60,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '#about', start: 'top 75%', once: true },
    });

    gsap.from('#skills-container .skill-item', {
        opacity: 0,
        y: 30,
        scale: 0.8,
        duration: 0.5,
        stagger: { each: 0.06, from: 'start' },
        ease: 'back.out(1.7)',
        scrollTrigger: { trigger: '#skills', start: 'top 75%', once: true },
    });

    gsap.from('#contact .section-heading, #contact p, #email-container, #mailto-btn', {
        opacity: 0,
        y: 30,
        duration: 0.65,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '#contact', start: 'top 80%', once: true },
    });

    ScrollTrigger.batch('.gsap-reveal', {
        onEnter: batch => gsap.fromTo(batch,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out', overwrite: true }
        ),
        once: true,
        start: 'top 85%',
    });
}

function refreshGsapScrollTriggers() {
    if (typeof ScrollTrigger === 'undefined') return;
    ScrollTrigger.refresh();
    ScrollTrigger.batch('.gsap-reveal:not([data-gsap-done])', {
        onEnter: batch => {
            batch.forEach(el => el.setAttribute('data-gsap-done', '1'));
            gsap.fromTo(batch,
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out', overwrite: true }
            );
        },
        once: true,
        start: 'top 88%',
    });
}

document.addEventListener('DOMContentLoaded', () => {
    feather.replace();
    initLoadingScreen();
    initScrollProgress();
    initMobileMenu();
    initTypewriter();
    initStatsCounters();
    initStarRating();

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });

    const savedTheme = localStorage.getItem('portfolioTheme') || 'dark';
    applyTheme(savedTheme);
    loadAllData();

    setTimeout(initGsapAnimations, 100);

    document.querySelectorAll('#project-platform-selector .platform-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const badge = cb.nextElementSibling;
            if (badge) badge.style.outline = cb.checked ? '2px solid currentColor' : '';
        });
    });

    onAuthStateChanged(auth, user => {
        isAdmin = !!user;
        document.getElementById('login-btn').classList.toggle('hidden', isAdmin);
        document.getElementById('logout-btn').classList.toggle('hidden', !isAdmin);

        ['add-project-btn','add-principle-btn','add-skill-btn','add-timeline-btn','edit-stats-btn','proposals-btn'].forEach(id => {
            const b = document.getElementById(id);
            if (b) b.classList.toggle('hidden', !isAdmin);
        });

        const editAboutBtn = document.getElementById('edit-about-btn');
        if (editAboutBtn) editAboutBtn.style.display = isAdmin ? 'flex' : 'none';

        if (isAdmin) {
            if (!document.getElementById('global-settings-nav-btn')) {
                const gsNavBtn = document.createElement('button');
                gsNavBtn.id = 'global-settings-nav-btn';
                gsNavBtn.className = 'text-xs font-mono text-purple-400 hover:text-purple-300 transition hidden md:inline-flex items-center gap-1';
                gsNavBtn.innerHTML = '<i data-feather="settings" class="w-3 h-3"></i><span>Settings</span>';
                gsNavBtn.addEventListener('click', () => openGlobalSettingsModal());
                document.getElementById('logout-btn').before(gsNavBtn);
                feather.replace();
            }

            if (!document.getElementById('testimonials-admin-btn')) {
                const btn = document.createElement('button');
                btn.id = 'testimonials-admin-btn';
                btn.className = 'text-xs font-mono text-yellow-400 hover:text-yellow-300 transition hidden md:block';
                btn.textContent = '⚡ Reviews';
                btn.addEventListener('click', () => {
                    openModal('testimonial-admin-modal');
                    loadPendingTestimonials();
                });
                document.getElementById('logout-btn').before(btn);
            }

            if (!document.getElementById('proposals-admin-btn')) {
                const propBtn = document.createElement('button');
                propBtn.id = 'proposals-admin-btn';
                propBtn.className = 'text-xs font-mono text-green-400 hover:text-green-300 transition hidden md:inline-flex items-center gap-1';
                propBtn.innerHTML = '<i data-feather="dollar-sign" class="w-3 h-3"></i><span>Proposals</span>';
                propBtn.addEventListener('click', () => {
                    if (typeof window.openAdminProposals === 'function') {
                        window.openAdminProposals();
                    }
                });
                document.getElementById('logout-btn').before(propBtn);
                feather.replace();
            }

        } else {
            ['global-settings-nav-btn', 'testimonials-admin-btn', 'proposals-admin-btn'].forEach(id => {
                document.getElementById(id)?.remove();
            });
        }

        renderAllContent();
    });

    document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));
    document.getElementById('login-form').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('login-submit-btn');
        btn.textContent = 'Logging in...';
        try {
            await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
            closeModal('login-modal');
            showToast('Welcome back, Admin!', 'success');
        } catch (err) {
            document.getElementById('login-error').textContent = 'Invalid credentials.';
        } finally {
            btn.textContent = 'Login';
        }
    });
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await signOut(auth);
        showToast('Logged out.', 'info');
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal || e.target.classList.contains('modal-close')) closeModal(modal.id);
        });
    });

    document.getElementById('project-form').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('project-submit-btn');
        document.getElementById('project-submit-text').textContent = 'Saving...';
        btn.disabled = true;
        const id = document.getElementById('project-id').value;

        const images = Array.from(document.querySelectorAll('.additional-image-url')).map((el, i) => ({
            url: el.value.trim(),
            description: document.querySelectorAll('.additional-image-desc')[i]?.value.trim() || ''
        })).filter(img => img.url);

        const platforms = Array.from(
            document.querySelectorAll('#project-platform-selector .platform-checkbox:checked')
        ).map(cb => cb.value);

        const baseData = {
            title:        document.getElementById('project-title').value.trim(),
            description:  document.getElementById('project-description').value.trim(),
            thumbnail:    document.getElementById('project-thumbnail-url').value.trim(),
            technologies: document.getElementById('project-tech').value
                              .split(',').map(t => t.trim()).filter(Boolean),
            sourceLink:   document.getElementById('project-source-link').value.trim(),
            liveLink:     document.getElementById('project-live-link').value.trim(),
            platforms,   
            images,
            updatedAt: serverTimestamp(),
        };

        if (!id) baseData.createdAt = serverTimestamp();

        try {
            if (id) await setDoc(doc(db, 'projects', id), baseData, { merge: true });
            else    await addDoc(collection(db, 'projects'), baseData);
            closeModal('project-modal');
            loadProjects();
            showToast('Project saved! 🚀', 'success');
        } catch (err) {
            console.error('Project save error:', err);
            showToast('Error saving project.', 'error');
        } finally {
            document.getElementById('project-submit-text').textContent = 'Save Project';
            btn.disabled = false;
        }
    });

    document.getElementById('principle-form').addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('principle-id').value;
        const data = {
            title: document.getElementById('principle-title').value,
            description: document.getElementById('principle-description').value,
            icon: document.getElementById('principle-icon').value,
        };
        if (!id) data.createdAt = serverTimestamp();
        try {
            if (id) await updateDoc(doc(db, 'principles', id), data);
            else await addDoc(collection(db, 'principles'), data);
            closeModal('principle-modal');
            loadPrinciples();
            showToast('Principle saved!', 'success');
        } catch { showToast('Error saving.', 'error'); }
    });

    document.getElementById('skill-form').addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('skill-id').value;
        const data = {
            name: document.getElementById('skill-name').value,
            iconClass: document.getElementById('skill-icon-class').value,
        };
        try {
            if (id) await updateDoc(doc(db, 'skills', id), data);
            else await addDoc(collection(db, 'skills'), { ...data, createdAt: serverTimestamp() });
            closeModal('skill-modal');
            loadSkills();
            showToast('Skill saved!', 'success');
        } catch { showToast('Error saving.', 'error'); }
    });

    document.getElementById('about-form').addEventListener('submit', async e => {
        e.preventDefault();
        const text = document.getElementById('about-modal-text').value;
        const imageUrl = document.getElementById('about-image-url').value;
        try {
            await setDoc(doc(db, 'site_content', 'about'), { text, imageUrl }, { merge: true });
            document.getElementById('about-text').textContent = text;
            document.getElementById('about-image').src = imageUrl;
            closeModal('about-modal');
            showToast('About section updated!', 'success');
        } catch { showToast('Error saving.', 'error'); }
    });
    document.getElementById('edit-about-btn').addEventListener('click', () => {
        document.getElementById('about-modal-text').value = document.getElementById('about-text').textContent;
        document.getElementById('about-image-url').value = document.getElementById('about-image').src;
        openModal('about-modal');
    });

    document.getElementById('leave-feedback-btn').addEventListener('click', () => openModal('testimonial-modal'));
    document.getElementById('testimonial-form').addEventListener('submit', async e => {
        e.preventDefault();
        const rating = parseInt(document.getElementById('t-rating').value);
        if (!rating) { showToast('Please select a rating!', 'error'); return; }
        const btn = document.getElementById('testimonial-submit-btn');
        btn.disabled = true;
        try {
            await addDoc(collection(db, 'testimonials'), {
                name:    document.getElementById('t-name').value,
                role:    document.getElementById('t-role').value,
                message: document.getElementById('t-message').value,
                rating,
                status: 'pending',
                timestamp: serverTimestamp()
            });
            closeModal('testimonial-modal');
            document.getElementById('testimonial-form').reset();
            document.querySelectorAll('#star-rating .star').forEach(s => s.classList.remove('filled'));
            document.getElementById('t-rating').value = '0';
            showToast('Review submitted! It will appear after approval. 🌟', 'success', 5000);
        } catch (err) {
            showToast('Error submitting review.', 'error');
            console.error('Testimonial error:', err);
        }
        finally { btn.disabled = false; }
    });

    document.getElementById('add-image-btn').addEventListener('click', () => addImageRow());
    document.getElementById('additional-images-container').addEventListener('click', e => {
        if (e.target.closest('.remove-image-btn')) e.target.closest('.flex').remove();
    });

    document.getElementById('copy-email-btn').addEventListener('click', () => {
        const email = document.getElementById('email-text').textContent.trim();
        navigator.clipboard.writeText(email).then(() => {
            const msg = document.getElementById('copy-success-msg');
            msg.classList.remove('opacity-0');
            showToast('Email copied!', 'success', 2000);
            setTimeout(() => msg.classList.add('opacity-0'), 2000);
        });
    });

    document.getElementById('year').textContent = new Date().getFullYear();

    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
    }, { threshold: 0.08 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => scrollObserver.observe(el));

    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const aboutSection = document.getElementById('about');
    let cursorBoundary = aboutSection.offsetTop;
    window.addEventListener('resize', () => { cursorBoundary = aboutSection.offsetTop; });
    const mouse = { x: -100, y: -100 };
    const dot = { x: -100, y: -100, vx: 0, vy: 0 };
    const outline = { x: -100, y: -100, vx: 0, vy: 0 };
    window.addEventListener('mousemove', e => {
        if (e.clientY < cursorBoundary) {
            cursorDot.style.opacity = '1';
            cursorOutline.style.opacity = '1';
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        } else {
            cursorDot.style.opacity = '0';
            cursorOutline.style.opacity = '0';
        }
    });
    document.body.addEventListener('mouseleave', () => {
        cursorDot.style.opacity = '0';
        cursorOutline.style.opacity = '0';
    });
    function animateCursor() {
        const ds = 0.2, os = 0.1, d = 0.75;
        dot.vx += (mouse.x - dot.x) * ds; dot.vy += (mouse.y - dot.y) * ds;
        dot.vx *= d; dot.vy *= d; dot.x += dot.vx; dot.y += dot.vy;
        cursorDot.style.transform = `translate(${dot.x}px, ${dot.y}px) translate(-50%, -50%)`;
        outline.vx += (mouse.x - outline.x) * os; outline.vy += (mouse.y - outline.y) * os;
        outline.vx *= d; outline.vy *= d; outline.x += outline.vx; outline.y += outline.vy;
        cursorOutline.style.transform = `translate(${outline.x}px, ${outline.y}px) translate(-50%, -50%)`;
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    setTimeout(() => {
        document.querySelectorAll('a, button, .project-card, .principle-card, .skill-item').forEach(el => {
            el.addEventListener('mouseover', () => { cursorDot.classList.add('hovered'); cursorOutline.classList.add('hovered'); });
            el.addEventListener('mouseout', () => { cursorDot.classList.remove('hovered'); cursorOutline.classList.remove('hovered'); });
        });
    }, 1500);

    const bgLayer2 = document.getElementById('bg-layer-2');
    window.addEventListener('mousemove', (e) => {
        const x = Math.round((e.clientX / window.innerWidth) * 100);
        const y = Math.round((e.clientY / window.innerHeight) * 100);
        const tn = localStorage.getItem('portfolioTheme') || 'dark';
        const theme = themes[tn];
        if (theme.bgLayer2.includes('radial-gradient')) {
            try {
                const bgRule = theme.bgLayer2.match(/\[(.*?)\]/)[1].replace(/_/g, ' ');
                bgLayer2.style.background = bgRule.replace(/at .*?,/, `at ${x}% ${y}%,`);
            } catch (e) {}
        }
    });

    const heroSection = document.getElementById('hero');
    heroSection.addEventListener('mousemove', (e) => {
        const { clientX, clientY, currentTarget } = e;
        const { clientWidth, clientHeight } = currentTarget;
        const xRot = 15 * ((clientY - clientHeight / 2) / clientHeight);
        const yRot = -15 * ((clientX - clientWidth / 2) / clientWidth);
        const content = heroSection.querySelector('div');
        content.style.transform = `perspective(1000px) rotateX(${xRot}deg) rotateY(${yRot}deg)`;
        content.style.transition = 'transform 0.1s ease';
    });
    heroSection.addEventListener('mouseleave', () => {
        heroSection.querySelector('div').style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        heroSection.querySelector('div').style.transition = 'transform 0.5s ease';
    });

    (function initCodeBackground() {
        const container = document.getElementById('code-background');
        window.addEventListener('scroll', () => {
            container.style.transform = `translateY(${window.scrollY * -0.15}px)`;
        }, { passive: true });
        const snippets = [
            'Text(text = "Hello, Robert!")',
            'val flow = MutableStateFlow(0)',
            'suspend fun fetchData(): Result<T>',
            'LazyColumn { items(list) { ... } }',
            '@Composable fun Screen() {}',
            'Modifier.padding(16.dp)',
            'viewModel.state.collect { ... }',
            'data class User(val name: String)',
            '@HiltViewModel class VM : ViewModel()',
            'LaunchedEffect(key) { ... }',
            'Room.databaseBuilder(...).build()',
            'Retrofit.Builder().baseUrl(...)',
        ];
        const create = () => {
            if (document.hidden || container.childElementCount > 25) return;
            const el = document.createElement('pre');
            el.className = 'code-line';
            el.textContent = snippets[Math.floor(Math.random() * snippets.length)];
            el.style.top = `${Math.random() * 100}%`;
            el.style.left = `${Math.random() * 90}%`;
            const disappear = () => {
                el.style.opacity = '0';
                el.style.transform = 'scale(0.5)';
                el.addEventListener('transitionend', () => el.remove(), { once: true });
            };
            el.addEventListener('mouseover', disappear, { once: true });
            container.appendChild(el);
            setTimeout(disappear, 8000 + Math.random() * 5000);
        };
        setInterval(create, 1200);
    })();

    document.querySelectorAll('.edit-icon').forEach(btn => {
        const parent = btn.closest('.editable-container');
        if (parent) {
            parent.addEventListener('mouseenter', () => { if (isAdmin) btn.style.display = 'flex'; });
            parent.addEventListener('mouseleave', () => {
                if (btn.id !== 'edit-about-btn') btn.style.display = 'none';
            });
        }
    });

    document.getElementById('edit-hero-title-btn').addEventListener('click', () => {
        document.getElementById('text-edit-modal-title').textContent = 'Edit Name';
        document.getElementById('text-edit-doc').value = 'hero';
        document.getElementById('text-edit-field').value = 'title';
        document.getElementById('text-edit-content').value = document.getElementById('hero-name').textContent;
        openModal('text-edit-modal');
    });
    document.getElementById('edit-hero-subtitle-btn').addEventListener('click', () => {
        document.getElementById('text-edit-modal-title').textContent = 'Edit Subtitle';
        document.getElementById('text-edit-doc').value = 'hero';
        document.getElementById('text-edit-field').value = 'subtitle';
        document.getElementById('text-edit-content').value = document.getElementById('hero-subtitle').textContent;
        openModal('text-edit-modal');
    });
    document.getElementById('text-edit-form').addEventListener('submit', async e => {
        e.preventDefault();
        const docName = document.getElementById('text-edit-doc').value;
        const field = document.getElementById('text-edit-field').value;
        const content = document.getElementById('text-edit-content').value;
        try {
            await setDoc(doc(db, 'site_content', docName), { [field]: content }, { merge: true });
            if (docName === 'hero' && field === 'title') document.getElementById('hero-name').textContent = content;
            if (docName === 'hero' && field === 'subtitle') document.getElementById('hero-subtitle').textContent = content;
            closeModal('text-edit-modal');
            showToast('Text updated!', 'success');
        } catch { showToast('Error saving.', 'error'); }
    });

    document.getElementById('add-project-btn').addEventListener('click', () => {
        document.getElementById('project-id').value = '';
        document.getElementById('project-form').reset();
        document.getElementById('additional-images-container').innerHTML = '';
        document.querySelectorAll('#project-platform-selector .platform-checkbox').forEach(cb => {
            cb.checked = false;
            const badge = cb.nextElementSibling;
            if (badge) badge.style.outline = '';
        });
        document.getElementById('project-modal-title').innerText = 'Add New Project';
        openModal('project-modal');
    });
    document.getElementById('add-principle-btn').addEventListener('click', () => {
        document.getElementById('principle-id').value = '';
        document.getElementById('principle-form').reset();
        document.getElementById('principle-modal-title').innerText = 'Add New Principle';
        openModal('principle-modal');
    });
    document.getElementById('add-skill-btn').addEventListener('click', () => {
        document.getElementById('skill-id').value = '';
        document.getElementById('skill-form').reset();
        document.getElementById('skill-modal-title').innerText = 'Add New Skill';
        openModal('skill-modal');
    });
});

document.addEventListener('DOMContentLoaded', () => {

    const addTlBtn = document.getElementById('add-timeline-btn');
    if (addTlBtn) addTlBtn.addEventListener('click', () => {
        document.getElementById('timeline-id').value = '';
        document.getElementById('timeline-form').reset();
        document.getElementById('timeline-modal-title').innerText = 'Add Timeline Item';
        openModal('timeline-modal');
    });
    const tlForm = document.getElementById('timeline-form');
    if (tlForm) tlForm.addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('timeline-id').value;
        const data = {
            year:    document.getElementById('timeline-year').value,
            role:    document.getElementById('timeline-role').value,
            company: document.getElementById('timeline-company').value,
            icon:    document.getElementById('timeline-icon').value || 'briefcase',
            desc:    document.getElementById('timeline-desc').value,
            tags:    document.getElementById('timeline-tags').value.split(',').map(t => t.trim()).filter(Boolean)
        };
        try {
            const isStatic = ['s1','s2','s3'].includes(id);
            if (id && !isStatic) {
                await setDoc(doc(db, 'timeline', id), data, { merge: true });
            } else {
                await addDoc(collection(db, 'timeline'), { ...data, createdAt: serverTimestamp() });
            }
            closeModal('timeline-modal');
            loadTimeline();
            showToast('Timeline saved! ✅', 'success');
        } catch(err) {
            if (err.code === 'permission-denied') {
                showToast('❌ Permission denied — update Firestore Rules', 'error', 6000);
            } else {
                showToast('Error: ' + err.message, 'error', 6000);
            }
            console.error('Timeline save error:', err);
        }
    });

    const esBtn = document.getElementById('edit-stats-btn');
    if (esBtn) esBtn.addEventListener('click', () => {
        document.getElementById('stat-edit-years').value         = document.getElementById('stat-years')?.dataset.target || '2';
        document.getElementById('stat-edit-apps').value          = document.getElementById('stat-apps')?.dataset.target || '15';
        document.getElementById('stat-edit-clients').value       = document.getElementById('stat-clients')?.dataset.target || '10';
        document.getElementById('stat-edit-lines').value         = document.querySelector('#stat-lines')?.textContent || '∞';
        document.getElementById('stat-edit-label-years').value   = document.querySelector('#stat-label-years')?.textContent || 'Experience';
        document.getElementById('stat-edit-label-apps').value    = document.querySelector('#stat-label-apps')?.textContent || 'Built & Deployed';
        document.getElementById('stat-edit-label-clients').value = document.querySelector('#stat-label-clients')?.textContent || 'Satisfied';
        openModal('stats-modal');
    });
    const sfForm = document.getElementById('stats-form');
    if (sfForm) sfForm.addEventListener('submit', async e => {
        e.preventDefault();
        const years=document.getElementById('stat-edit-years').value, apps=document.getElementById('stat-edit-apps').value,
              clients=document.getElementById('stat-edit-clients').value, lines=document.getElementById('stat-edit-lines').value,
              lblYears=document.getElementById('stat-edit-label-years').value, lblApps=document.getElementById('stat-edit-label-apps').value,
              lblClients=document.getElementById('stat-edit-label-clients').value;
        try {
            await setDoc(doc(db,'site_content','stats'), {years:+years,apps:+apps,clients:+clients,lines,lblYears,lblApps,lblClients}, {merge:true});
            const sy=document.getElementById('stat-years');   if(sy){sy.dataset.target=years;  sy.textContent='0';}
            const sa=document.getElementById('stat-apps');    if(sa){sa.dataset.target=apps;   sa.textContent='0';}
            const sc=document.getElementById('stat-clients'); if(sc){sc.dataset.target=clients;sc.textContent='0';}
            const sl=document.querySelector('#stat-lines');         if(sl)sl.textContent=lines;
            const yl=document.querySelector('#stat-label-years');   if(yl)yl.textContent=lblYears;
            const al=document.querySelector('#stat-label-apps');    if(al)al.textContent=lblApps;
            const cl=document.querySelector('#stat-label-clients'); if(cl)cl.textContent=lblClients;
            closeModal('stats-modal');
            document.querySelectorAll('.stat-number[data-target]').forEach(el2 => {
                const tg=parseInt(el2.dataset.target), t0=performance.now();
                (function tick(now){const p=Math.min((now-t0)/1400,1);el2.textContent=Math.round(tg*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick);})(performance.now());
            });
            showToast('Stats updated! ✅','success');
        } catch(err){ showToast('Error.','error'); console.error(err); }
    });
});

function openGlobalSettingsModal() {
    const d = _cachedGlobalSettings || {};
    const fill = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

    fill('gs-cv-link',        d.cvLink        || '');
    fill('gs-linkedin',       d.linkedin       || '');
    fill('gs-github',         d.github         || '');
    fill('gs-facebook',       d.facebook       || '');
    fill('gs-contact-email',  d.contactEmail   || '');
    fill('gs-phone',          d.phone          || '');
    fill('gs-hero-subtitle',  d.heroSubtitle   || '');
    fill('gs-about-img',      d.aboutImageUrl  || '');
    fill('gs-footer-text',    d.footerText     || '');

    feather.replace();
    openModal('global-settings-modal');
}

document.addEventListener('DOMContentLoaded', () => {
    const gsForm = document.getElementById('global-settings-form');
    if (gsForm) {
        gsForm.addEventListener('submit', async e => {
        e.preventDefault();
        const btn     = document.getElementById('gs-submit-btn');
        const btnText = document.getElementById('gs-submit-text');
        btnText.textContent = 'Saving...';
        btn.disabled = true;

        const data = {
            cvLink:        (document.getElementById('gs-cv-link')?.value        || '').trim(),
            linkedin:      (document.getElementById('gs-linkedin')?.value       || '').trim(),
            github:        (document.getElementById('gs-github')?.value         || '').trim(),
            facebook:      (document.getElementById('gs-facebook')?.value       || '').trim(),
            contactEmail:  (document.getElementById('gs-contact-email')?.value  || '').trim(),
            phone:         (document.getElementById('gs-phone')?.value          || '').trim(),
            heroSubtitle:  (document.getElementById('gs-hero-subtitle')?.value  || '').trim(),
            aboutImageUrl: (document.getElementById('gs-about-img')?.value      || '').trim(),
            footerText:    (document.getElementById('gs-footer-text')?.value    || '').trim(),
            updatedAt: serverTimestamp(),
        };

        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== '')
        );

        try {
            await setDoc(doc(db, 'site_content', 'global_settings'), cleanData, { merge: true });

            _cachedGlobalSettings = { ..._cachedGlobalSettings, ...cleanData };

            applyGlobalSettings(_cachedGlobalSettings);

            closeModal('global-settings-modal');
            showToast('Settings saved! ✅', 'success');
        } catch (err) {
            showToast('Error saving settings.', 'error');
            console.error('Global settings save error:', err);
        } finally {
            btnText.textContent = 'Save Settings';
            btn.disabled = false;
        }
    });

    let _proposalCategories = []; 
    let _proposalItems = [];      
    let _proposalsCache = [];     

    const uid = () => Math.random().toString(36).slice(2, 10);

    function proposalPublicUrl(id) {
        return `${location.origin}${location.pathname.replace(/index\.html$/, '')}proposal.html?id=${id}`;
    }

    function themeInputClasses() {
        const themeName = localStorage.getItem('portfolioTheme') || 'dark';
        return themes[themeName].modalInput;
    }

  window.openAdminProposals = () => {
    openModal('proposals-list-modal');
    loadProposalsList();
};

    async function loadProposalsList() {
        const container = document.getElementById('proposals-list-container');
        container.innerHTML = `<p class="text-sm opacity-50 font-mono">Loading...</p>`;
        let snap;
        try { snap = await getDocs(query(collection(db, 'proposals'), orderBy('createdAt', 'desc'))); }
        catch { snap = await getDocs(collection(db, 'proposals')); }

        _proposalsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (_proposalsCache.length === 0) {
            container.innerHTML = `<p class="text-sm opacity-50 font-mono text-center py-8">No proposals yet. Click "New Proposal" to create one.</p>`;
            return;
        }

        container.innerHTML = _proposalsCache.map(p => {
            const total = calcTotal(p, p.selections || {});
            const locked = p.status === 'locked';
            return `
            <div class="rounded-xl border border-white border-opacity-10 p-4 flex flex-wrap items-center gap-3" data-proposal-row="${p.id}">
                <div class="flex-grow min-w-[160px]">
                    <p class="font-bold text-sm">${escapeHtml(p.clientName || '—')}</p>
                    <p class="text-xs opacity-50">${escapeHtml(p.projectTitle || '')}</p>
                </div>
                <span class="text-xs font-mono px-2.5 py-1 rounded-lg ${locked ? 'bg-red-500/10 text-red-400' : 'bg-[#00f15e]/10 text-[#00f15e]'}">${locked ? 'LOCKED' : 'OPEN'}</span>
                <span class="text-sm font-bold font-mono">${formatMoney(total, p.currency)}</span>
                <div class="flex items-center gap-1.5">
                    <button type="button" class="admin-btn edit-btn" data-action="copy-link" data-id="${p.id}" title="Copy client link"><i data-feather="link" class="w-3.5 h-3.5"></i></button>
                    ${!locked ? `<button type="button" class="admin-btn edit-btn" data-action="edit" data-id="${p.id}" title="Edit"><i data-feather="edit-2" class="w-3.5 h-3.5"></i></button>` : ''}
                    ${!locked ? `<button type="button" class="admin-btn" style="background:#f59e0b" data-action="lock" data-id="${p.id}" title="Lock now">🔒 Lock</button>` : ''}
                    <button type="button" class="admin-btn edit-btn" data-action="pdf" data-id="${p.id}" title="Download PDF"><i data-feather="download" class="w-3.5 h-3.5"></i></button>
                    <button type="button" class="admin-btn delete-btn" data-action="delete" data-id="${p.id}" title="Delete"><i data-feather="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
            </div>`;
        }).join('');
        feather.replace();
    }

    document.getElementById('proposals-list-container')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const { action, id } = btn.dataset;
        const proposal = _proposalsCache.find(p => p.id === id);

        if (action === 'copy-link') {
            await navigator.clipboard.writeText(proposalPublicUrl(id));
            showToast('Client link copied! 🔗', 'success');
        } else if (action === 'edit') {
            openProposalEditor(id);
        } else if (action === 'lock') {
            if (!confirm('متأكد إنك عايز تقفل العرض ده؟ العميل مش هيقدر يفتحه أو يعدله تاني، وهيتحمّله PDF لو كان فاتح الصفحة.')) return;
            await updateDoc(doc(db, 'proposals', id), { status: 'locked', lockedAt: serverTimestamp() });
            showToast('Proposal locked. 🔒', 'success');
            loadProposalsList();
        } else if (action === 'pdf') {
            try {
                showToast('Generating PDF...', 'info');
                const fresh = (await getDoc(doc(db, 'proposals', id))).data();
                await generateProposalPDF({ ...fresh }, fresh.selections || {});
            } catch (err) {
                console.error(err);
                showToast('Could not generate PDF.', 'error');
            }
        } else if (action === 'delete') {
            if (!confirm(`Delete the proposal for "${proposal?.clientName || ''}"? This cannot be undone.`)) return;
            await deleteDoc(doc(db, 'proposals', id));
            showToast('Proposal deleted.', 'info');
            loadProposalsList();
        }
    });

    document.getElementById('new-proposal-btn')?.addEventListener('click', () => openProposalEditor());

    function openProposalEditor(id = null) {
        document.getElementById('proposal-form').reset();
        document.getElementById('proposal-id').value = id || '';
        document.getElementById('proposal-link-box').classList.add('hidden');
        document.getElementById('proposal-editor-title').textContent = id ? 'Edit Proposal' : 'New Proposal';

        if (id) {
            const p = _proposalsCache.find(x => x.id === id);
            _proposalCategories = (p?.categories || []).map(c => ({ ...c }));
            _proposalItems = (p?.items || []).map(i => ({ ...i }));
            document.getElementById('proposal-client-name').value = p?.clientName || '';
            document.getElementById('proposal-project-title').value = p?.projectTitle || '';
            document.getElementById('proposal-currency').value = p?.currency || 'EGP';
            document.getElementById('proposal-notes').value = p?.notes || '';
            document.getElementById('proposal-link-box').classList.remove('hidden');
            document.getElementById('proposal-link-input').value = proposalPublicUrl(id);
        } else {
            _proposalCategories = [
                { id: uid(), name: 'الأساسيات' },
                { id: uid(), name: 'إضافات متوسطة' },
                { id: uid(), name: 'إضافات متقدمة' },
            ];
            _proposalItems = [];
        }
        renderProposalCategories();
        renderProposalItems();
        openModal('proposal-editor-modal');
    }

    function renderProposalCategories() {
        const wrap = document.getElementById('proposal-categories-list');
        const inputClasses = themeInputClasses();
        wrap.innerHTML = _proposalCategories.map(cat => `
            <div class="flex items-center gap-2" data-cat-id="${cat.id}">
                <input type="text" class="modal-input ${inputClasses} p-2.5 rounded-xl flex-grow proposal-cat-name" value="${escapeHtml(cat.name)}" placeholder="Category name">
                <button type="button" class="admin-btn delete-btn remove-cat-btn" title="Remove category"><i data-feather="x" class="w-3.5 h-3.5"></i></button>
            </div>
        `).join('') || `<p class="text-xs opacity-40 font-mono">No categories yet.</p>`;
        feather.replace();

        wrap.querySelectorAll('.proposal-cat-name').forEach(input => {
            input.addEventListener('input', () => {
                const catId = input.closest('[data-cat-id]').dataset.catId;
                const cat = _proposalCategories.find(c => c.id === catId);
                if (cat) cat.name = input.value;
                refreshCategorySelectOptions();
            });
        });
        wrap.querySelectorAll('.remove-cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const catId = btn.closest('[data-cat-id]').dataset.catId;
                const hasItems = _proposalItems.some(i => i.categoryId === catId);
                if (hasItems && !confirm('الفئة دي فيها عناصر — هتتشال هي والعناصر اللي جواها. متأكد؟')) return;
                _proposalCategories = _proposalCategories.filter(c => c.id !== catId);
                _proposalItems = _proposalItems.filter(i => i.categoryId !== catId);
                renderProposalCategories();
                renderProposalItems();
            });
        });
    }

    function refreshCategorySelectOptions() {
        document.querySelectorAll('.proposal-item-category').forEach(select => {
            const current = select.value;
            select.innerHTML = _proposalCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
            if (_proposalCategories.some(c => c.id === current)) select.value = current;
        });
    }

    document.getElementById('add-category-btn')?.addEventListener('click', () => {
        _proposalCategories.push({ id: uid(), name: '' });
        renderProposalCategories();
    });

    function renderProposalItems() {
        const wrap = document.getElementById('proposal-items-list');
        const inputClasses = themeInputClasses();

        if (_proposalCategories.length === 0) {
            wrap.innerHTML = `<p class="text-xs opacity-40 font-mono">Add a category first.</p>`;
            return;
        }

        wrap.innerHTML = _proposalItems.map(item => `
            <div class="rounded-xl border border-white border-opacity-10 p-3 space-y-2" data-item-id="${item.id}">
                <div class="flex gap-2">
                    <select class="modal-input ${inputClasses} p-2 rounded-lg text-xs proposal-item-category" style="max-width:150px">
                        ${_proposalCategories.map(c => `<option value="${c.id}" ${c.id === item.categoryId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
                    </select>
                    <input type="text" class="modal-input ${inputClasses} p-2 rounded-lg flex-grow proposal-item-name" placeholder="اسم الميزة (مثال: بحث وفلترة)" value="${escapeHtml(item.name || '')}">
                    <button type="button" class="admin-btn delete-btn remove-item-btn" title="Remove item"><i data-feather="x" class="w-3.5 h-3.5"></i></button>
                </div>
                <div>
                    <input type="text" class="modal-input ${inputClasses} p-2 rounded-lg w-full text-sm proposal-item-desc" placeholder="شرح مبسط للعميل (مثال: فلترة المنتجات حسب المقاس واللون...)" value="${escapeHtml(item.description || '')}">
                </div>
                <div class="flex gap-2 flex-wrap">
                    <input type="number" min="0" class="modal-input ${inputClasses} p-2 rounded-lg proposal-item-price" style="width:110px" placeholder="Price" value="${item.price ?? ''}">
                    <select class="modal-input ${inputClasses} p-2 rounded-lg text-xs proposal-item-tier" style="width:130px">
                        <option value="base" ${item.tier === 'base' ? 'selected' : ''}>أساسي (إجباري)</option>
                        <option value="optional" ${item.tier !== 'base' ? 'selected' : ''}>إضافة اختيارية</option>
                    </select>
                    <select class="modal-input ${inputClasses} p-2 rounded-lg text-xs proposal-item-recurrence" style="width:130px">
                        <option value="once" ${item.recurrence === 'once' || !item.recurrence ? 'selected' : ''}>تدفع مرة واحدة</option>
                        <option value="monthly" ${item.recurrence === 'monthly' ? 'selected' : ''}>شهرياً</option>
                        <option value="yearly" ${item.recurrence === 'yearly' ? 'selected' : ''}>سنوياً</option>
                        <option value="custom" ${item.recurrence === 'custom' ? 'selected' : ''}>مخصص...</option>
                    </select>
                    <input type="text" class="modal-input ${inputClasses} p-2 rounded-lg flex-grow proposal-item-recurrence-note ${item.recurrence === 'custom' ? '' : 'hidden'}" placeholder="مثال: حسب الاستهلاك" value="${escapeHtml(item.recurrenceNote || '')}">
                </div>
            </div>
        `).join('') || `<p class="text-xs opacity-40 font-mono">No items yet — click "+ Add Item".</p>`;
        feather.replace();
        wireItemRowEvents();
    }

    function wireItemRowEvents() {
        document.querySelectorAll('#proposal-items-list [data-item-id]').forEach(row => {
            const itemId = row.dataset.itemId;
            const item = _proposalItems.find(i => i.id === itemId);
            if (!item) return;

            row.querySelector('.proposal-item-category')?.addEventListener('change', e => item.categoryId = e.target.value);
            row.querySelector('.proposal-item-name')?.addEventListener('input', e => item.name = e.target.value);
            row.querySelector('.proposal-item-desc')?.addEventListener('input', e => item.description = e.target.value);
            row.querySelector('.proposal-item-price')?.addEventListener('input', e => item.price = parseFloat(e.target.value) || 0);
            row.querySelector('.proposal-item-tier')?.addEventListener('change', e => item.tier = e.target.value);
            row.querySelector('.proposal-item-recurrence')?.addEventListener('change', e => {
                item.recurrence = e.target.value;
                row.querySelector('.proposal-item-recurrence-note')?.classList.toggle('hidden', e.target.value !== 'custom');
            });
            row.querySelector('.proposal-item-recurrence-note')?.addEventListener('input', e => item.recurrenceNote = e.target.value);
            row.querySelector('.remove-item-btn')?.addEventListener('click', () => {
                _proposalItems = _proposalItems.filter(i => i.id !== itemId);
                renderProposalItems();
            });
        });
    }

    document.getElementById('add-item-btn')?.addEventListener('click', () => {
        if (_proposalCategories.length === 0) { showToast('Add a category first.', 'error'); return; }
        _proposalItems.push({ id: uid(), categoryId: _proposalCategories[0].id, name: '', description: '', price: 0, tier: 'base', recurrence: 'once', recurrenceNote: '' });
        renderProposalItems();
    });

    document.getElementById('copy-proposal-link-btn')?.addEventListener('click', async () => {
        const link = document.getElementById('proposal-link-input').value;
        if (!link) return;
        await navigator.clipboard.writeText(link);
        showToast('Client link copied! 🔗', 'success');
    });

    document.getElementById('proposal-form')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('proposal-submit-btn');
        const btnText = document.getElementById('proposal-submit-text');
        const id = document.getElementById('proposal-id').value;
        btn.disabled = true;
        btnText.textContent = 'Saving...';

        const data = {
            clientName: document.getElementById('proposal-client-name').value.trim(),
            projectTitle: document.getElementById('proposal-project-title').value.trim(),
            currency: document.getElementById('proposal-currency').value,
            notes: document.getElementById('proposal-notes').value.trim(),
            categories: _proposalCategories.filter(c => c.name.trim()),
            items: _proposalItems.filter(i => i.name.trim()),
        };

        try {
            let docId = id;
            if (id) {
                await updateDoc(doc(db, 'proposals', id), data);
            } else {
                const ref = await addDoc(collection(db, 'proposals'), {
                    ...data,
                    selections: {},
                    status: 'open',
                    createdAt: serverTimestamp(),
                    lockedAt: null,
                });
                docId = ref.id;
            }
            document.getElementById('proposal-id').value = docId;
            document.getElementById('proposal-link-box').classList.remove('hidden');
            document.getElementById('proposal-link-input').value = proposalPublicUrl(docId);
            showToast('Proposal saved! ✅', 'success');
            loadProposalsList();
        } catch (err) {
            console.error('Proposal save error:', err);
            showToast('Error saving proposal.', 'error');
        } finally {
            btn.disabled = false;
            btnText.textContent = 'Save & Get Link';
        }
    });
}});