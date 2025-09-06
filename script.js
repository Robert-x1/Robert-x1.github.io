import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-check.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', () => {
    feather.replace();

    const themes = {
        dark: {
            body: 'bg-gray-900 text-gray-200',
            bgLayer1: 'bg-gray-900 bg-[radial-gradient(#e5e7eb0f_1px,transparent_1px)] [background-size:16px_16px]',
            bgLayer1Fade: 'opacity-100',
            bgLayer2: 'bg-[radial-gradient(circle_500px_at_50%_200px,rgba(14,165,233,0.15),transparent)]',
            bgLayer2Fade: 'opacity-100',
            navbar: 'bg-gray-900/80 backdrop-blur-sm',
            navLogo: 'text-white',
            navLink: 'text-gray-300 hover:text-cyan-400',
            heroTitle: 'text-white', heroName: 'text-cyan-400', heroSubtitle: 'text-gray-400',
            sectionTitle: 'text-white', sectionText: 'text-gray-400', underline: 'bg-cyan-400',
            aboutImage: 'ring-cyan-500/30 shadow-cyan-500/10',
            principleCard: 'bg-gray-800/50', principleIcon: 'text-cyan-400',
            skillsContainer: 'text-gray-300',
            projectCard: 'bg-gray-800',
            addBtn: 'bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300',
            emailContainer: 'bg-gray-800', emailText: 'text-gray-300',
            copyBtn: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
            mailtoBtn: 'bg-cyan-500 hover:bg-cyan-600 text-white',
            footer: 'bg-gray-800/50 border-gray-700 text-gray-400',
            modalContent: 'bg-gray-800 text-white',
            modalInput: 'bg-gray-700 text-white focus:ring-cyan-400',
            modalSubmit: 'bg-cyan-500 hover:bg-cyan-600',
            modalClose: 'text-gray-400 hover:text-white',
            detailLinkSource: 'bg-gray-700 hover:bg-gray-600 text-white',
            detailLinkLive: 'bg-cyan-500 hover:bg-cyan-600 text-white',
            activeThumb: 'border-cyan-400',
        },
        light: {
            body: 'bg-gray-50 text-gray-800',
            bgLayer1: 'bg-white', bgLayer1Fade: 'opacity-100',
            bgLayer2: 'bg-[radial-gradient(circle_500px_at_50%_200px,rgba(14,165,233,0.1),transparent)]', bgLayer2Fade: 'opacity-100',
            navbar: 'bg-white/80 backdrop-blur-sm border-b border-gray-200',
            navLogo: 'text-gray-900',
            navLink: 'text-gray-600 hover:text-sky-500',
            heroTitle: 'text-gray-900', heroName: 'text-sky-500', heroSubtitle: 'text-gray-600',
            sectionTitle: 'text-gray-900', sectionText: 'text-gray-600', underline: 'bg-sky-500',
            aboutImage: 'ring-sky-500/30 shadow-sky-500/20',
            principleCard: 'bg-white border border-gray-200/80 shadow-sm', principleIcon: 'text-sky-500',
            skillsContainer: 'text-gray-700',
            projectCard: 'bg-white border border-gray-200/80 shadow-sm',
            addBtn: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-600',
            emailContainer: 'bg-gray-100 border border-gray-200', emailText: 'text-gray-700',
            copyBtn: 'bg-gray-200 hover:bg-gray-300 text-gray-600',
            mailtoBtn: 'bg-sky-500 hover:bg-sky-600 text-white',
            footer: 'bg-white border-gray-200 text-gray-500',
            modalContent: 'bg-white text-gray-800',
            modalInput: 'bg-gray-100 text-gray-800 focus:ring-sky-500',
            modalSubmit: 'bg-sky-500 hover:bg-sky-600',
            modalClose: 'text-gray-500 hover:text-gray-900',
            detailLinkSource: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
            detailLinkLive: 'bg-sky-500 hover:bg-sky-600 text-white',
            activeThumb: 'border-sky-500',
        },
        glass: {
            body: 'bg-gray-900 text-gray-200',
            bgLayer1: 'bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900', bgLayer1Fade: 'opacity-100',
            bgLayer2: 'bg-gray-900 bg-[radial-gradient(#e5e7eb0f_1px,transparent_1px)] [background-size:16px_16px]', bgLayer2Fade: 'opacity-50',
            navbar: 'bg-white/5 backdrop-blur-lg border-b border-white/10',
            navLogo: 'text-white',
            navLink: 'text-gray-300 hover:text-fuchsia-400',
            heroTitle: 'text-white', heroName: 'text-fuchsia-400', heroSubtitle: 'text-gray-300',
            sectionTitle: 'text-white', sectionText: 'text-gray-300', underline: 'bg-fuchsia-500',
            aboutImage: 'ring-fuchsia-500/30 shadow-fuchsia-500/20',
            principleCard: 'bg-white/10 backdrop-blur-lg border border-white/10 shadow-lg', principleIcon: 'text-fuchsia-400',
            skillsContainer: 'text-gray-200',
            projectCard: 'bg-white/10 backdrop-blur-lg border border-white/10 shadow-lg',
            addBtn: 'bg-fuchsia-500/20 hover:bg-fuchsia-500/40 text-fuchsia-300',
            emailContainer: 'bg-white/10 backdrop-blur-lg border border-white/10', emailText: 'text-gray-200',
            copyBtn: 'bg-white/10 hover:bg-white/20 text-gray-200',
            mailtoBtn: 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white',
            footer: 'bg-white/5 border-white/10 text-gray-400',
            modalContent: 'bg-gray-800/50 backdrop-blur-xl border border-white/10 text-white',
            modalInput: 'bg-white/10 text-white focus:ring-fuchsia-400 placeholder:text-gray-400',
            modalSubmit: 'bg-fuchsia-500 hover:bg-fuchsia-600',
            modalClose: 'text-gray-300 hover:text-white',
            detailLinkSource: 'bg-white/10 hover:bg-white/20 text-white',
            detailLinkLive: 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white',
            activeThumb: 'border-fuchsia-400',
        }
    };
    
    function applyTheme(themeName) {
        const theme = themes[themeName];
        const setClasses = (elements, classes) => {
            if (!elements) return;
            const elementsNodeList = elements.length !== undefined ? elements : [elements];
            elementsNodeList.forEach(el => {
                if (!el || typeof el.getAttribute !== 'function') return;
                const currentClass = el.getAttribute('class') || '';
                const preservedClasses = currentClass.split(' ').filter(c => c && !c.startsWith('bg-') && !c.startsWith('text-') && !c.startsWith('border-') && !c.startsWith('ring-') && !c.startsWith('shadow-') && !c.startsWith('hover:') && !c.startsWith('backdrop-') && !c.startsWith('placeholder:') && !c.startsWith('focus:') && !c.startsWith('opacity-')).join(' ');
                el.setAttribute('class', `${preservedClasses} ${classes}`.trim());
            });
        };

        const allElements = {
            'body': document.body, '#bg-layer-1': document.getElementById('bg-layer-1'),
            '#bg-layer-2': document.getElementById('bg-layer-2'), '#navbar': document.getElementById('navbar'),
            '#nav-logo': document.getElementById('nav-logo'), '#hero-title': document.getElementById('hero-title'),
            '#hero-name': document.getElementById('hero-name'), '#hero-subtitle': document.getElementById('hero-subtitle'),
            '#about-title': document.getElementById('about-title'), '#about-text': document.getElementById('about-text'),
            '#about-underline': document.getElementById('about-underline'), '#about-image': document.getElementById('about-image'),
            '#principles-title': document.getElementById('principles-title'), '#principles-underline': document.getElementById('principles-underline'),
            '#skills-title': document.getElementById('skills-title'), '#skills-underline': document.getElementById('skills-underline'), '#skills-container': document.getElementById('skills-container'),
            '#projects-title': document.getElementById('projects-title'),
            '#contact-title': document.getElementById('contact-title'), '#contact-text': document.getElementById('contact-text'),
            '#contact-underline': document.getElementById('contact-underline'),
            '#email-container': document.getElementById('email-container'), '#email-text': document.getElementById('email-text'),
            '#copy-email-btn': document.getElementById('copy-email-btn'), '#mailto-btn': document.getElementById('mailto-btn'),
            '#footer': document.getElementById('footer'),
            '#login-modal .modal-content': document.querySelector('#login-modal .modal-content'),
            '#project-modal .modal-content': document.querySelector('#project-modal .modal-content'),
            '#principle-modal .modal-content': document.querySelector('#principle-modal .modal-content'),
            '#skill-modal .modal-content': document.querySelector('#skill-modal .modal-content'),
            '#about-modal .modal-content': document.querySelector('#about-modal .modal-content'),
            '#text-edit-modal .modal-content': document.querySelector('#text-edit-modal .modal-content'),
            '#project-detail-modal .modal-content': document.querySelector('#project-detail-modal .modal-content'),
            '#login-submit-btn': document.getElementById('login-submit-btn'),
            '#project-submit-btn': document.getElementById('project-submit-btn'),
            '#principle-submit-btn': document.getElementById('principle-submit-btn'),
            '#skill-submit-btn': document.getElementById('skill-submit-btn'),
            '#about-submit-btn': document.getElementById('about-submit-btn'),
            '#text-edit-submit-btn': document.getElementById('text-edit-submit-btn'),
            'nav-link': document.querySelectorAll('.nav-link'),
            'add-btn': [document.getElementById('add-project-btn'), document.getElementById('add-principle-btn'), document.getElementById('add-skill-btn')],
            'modal-input': document.querySelectorAll('.modal-input'),
            'modal-close': document.querySelectorAll('.modal-close'),
        };

        setClasses(allElements['body'], theme.body);
        setClasses(allElements['#bg-layer-1'], `${theme.bgLayer1} ${theme.bgLayer1Fade}`);
        setClasses(allElements['#bg-layer-2'], `${theme.bgLayer2} ${theme.bgLayer2Fade}`);
        setClasses(allElements['#navbar'], theme.navbar);
        setClasses(allElements['#nav-logo'], theme.navLogo);
        setClasses(allElements['nav-link'], theme.navLink);
        setClasses(allElements['#hero-title'], theme.heroTitle);
        setClasses(allElements['#hero-name'], theme.heroName);
        setClasses(allElements['#hero-subtitle'], theme.heroSubtitle);
        setClasses(allElements['#about-title'], theme.sectionTitle);
        setClasses(allElements['#about-text'], theme.sectionText);
        setClasses(allElements['#about-underline'], theme.underline);
        setClasses(allElements['#about-image'], theme.aboutImage);
        setClasses(allElements['#principles-title'], theme.sectionTitle);
        setClasses(allElements['#principles-underline'], theme.underline);
        setClasses(allElements['#skills-title'], theme.sectionTitle);
        setClasses(allElements['#skills-underline'], theme.underline);
        setClasses(allElements['#skills-container'], theme.skillsContainer);
        setClasses(allElements['#projects-title'], theme.sectionTitle);
        setClasses(allElements['#contact-title'], theme.sectionTitle);
        setClasses(allElements['#contact-text'], theme.sectionText);
        setClasses(allElements['#contact-underline'], theme.underline);
        setClasses(allElements['#email-container'], theme.emailContainer);
        setClasses(allElements['#email-text'], theme.emailText);
        setClasses(allElements['#copy-email-btn'], theme.copyBtn);
        setClasses(allElements['#mailto-btn'], theme.mailtoBtn);
        setClasses(allElements['#footer'], theme.footer);
        
        setClasses(allElements['add-btn'], theme.addBtn);
        setClasses(allElements['#login-modal .modal-content'], theme.modalContent);
        setClasses(allElements['#project-modal .modal-content'], theme.modalContent);
        setClasses(allElements['#principle-modal .modal-content'], theme.modalContent);
        setClasses(allElements['#skill-modal .modal-content'], theme.modalContent);
        setClasses(allElements['#about-modal .modal-content'], theme.modalContent);
        setClasses(allElements['#text-edit-modal .modal-content'], theme.modalContent);
        setClasses(allElements['#project-detail-modal .modal-content'], theme.modalContent);
        setClasses(allElements['modal-input'], theme.modalInput);
        setClasses(allElements['modal-close'], theme.modalClose);
        setClasses(allElements['#login-submit-btn'], theme.modalSubmit);
        setClasses(allElements['#project-submit-btn'], theme.modalSubmit);
        setClasses(allElements['#principle-submit-btn'], theme.modalSubmit);
        setClasses(allElements['#skill-submit-btn'], theme.modalSubmit);
        setClasses(allElements['#about-submit-btn'], theme.modalSubmit);
        setClasses(allElements['#text-edit-submit-btn'], theme.modalSubmit);
        
        localStorage.setItem('portfolioTheme', themeName);
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === themeName));
        renderAllContent();
    }

    document.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', () => applyTheme(btn.dataset.theme)));
    
    const copyBtn = document.getElementById('copy-email-btn');
    const copySuccessMsg = document.getElementById('copy-success-msg');
    const emailToCopy = document.getElementById('email-text').textContent;

    copyBtn.addEventListener('click', () => {
        const textArea = document.createElement("textarea");
        textArea.value = emailToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            copySuccessMsg.classList.remove('opacity-0');
            copyBtn.querySelector('#copy-btn-text').textContent = 'Copied!';
            setTimeout(() => {
                copySuccessMsg.classList.add('opacity-0');
                copyBtn.querySelector('#copy-btn-text').textContent = 'Copy';
            }, 2500);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            alert('Could not copy email address.');
        }
        document.body.removeChild(textArea);
    });


    let siteContent = {};
    let projects = [];
    let principles = [];
    let skills = [];
    let isLoggedIn = false;

    const siteContentCollectionRef = collection(db, "site_content");
    const projectsCollectionRef = collection(db, "projects");
    const principlesCollectionRef = collection(db, "principles");
    const skillsCollectionRef = collection(db, "skills");

    async function seedDatabaseIfEmpty() {
        const collectionsToSeed = [
            { ref: projectsCollectionRef, data: [
                { title: "CineScope: Movie Tracker", description: "A sleek and modern movie tracking application built with Jetpack Compose...", thumbnail: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1031&q=80", images: [{url: "https://images.unsplash.com/photo-1620145648299-f926ac0a9470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80", description: "Detailed movie screen with ratings."}], technologies: ["Kotlin", "Jetpack Compose", "MVVM", "Retrofit", "Material You"] },
                { title: "NutriTrack: Calorie Counter", description: "A comprehensive health and fitness app that helps users track their daily caloric intake...", thumbnail: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80", images: [], technologies: ["Kotlin", "XML", "Firebase", "Room", "Hilt"] }
            ] },
            { ref: principlesCollectionRef, data: [
                { title: "Performance First", description: "Crafting smooth, responsive, and battery-efficient applications...", icon: "zap" },
                { title: "Pixel-Perfect UI/UX", description: "Building intuitive and beautiful user interfaces with Jetpack Compose...", icon: "pen-tool" },
                { title: "Clean Architecture", description: "Implementing scalable and maintainable codebases using modern architectural patterns...", icon: "layers" }
            ]},
            { ref: skillsCollectionRef, data: [
                { name: "Kotlin", iconClass: "devicon-kotlin-plain colored" }, { name: "Jetpack Compose", iconClass: "devicon-android-plain colored" },
                { name: "Firebase", iconClass: "devicon-firebase-plain colored" }, { name: "Material Design", iconClass: "devicon-materialui-plain colored" },
                { name: "Git", iconClass: "devicon-git-plain colored" }, { name: "GitHub", iconClass: "devicon-github-original colored" }
            ]},
            { ref: siteContentCollectionRef, data: [
                { id: 'hero', title: "Hi, I'm <span id='hero-name'>Robert Romany</span>", subtitle: "An Android Developer crafting modern, high-performance, and user-centric mobile applications with Kotlin & Jetpack Compose." },
                { id: 'about', text: "A highly skilled Software Engineer with proven experience...", imageUrl: "https://placehold.co/400x400/0f172a/22d3ee?text=RR" }
            ]}
        ];

        for (const { ref, data } of collectionsToSeed) {
            const snapshot = await getDocs(query(ref));
            if (snapshot.empty) {
                const batch = writeBatch(db);
                data.forEach(item => {
                    const docRef = item.id ? doc(ref, item.id) : doc(ref);
                    const { id, ...itemData } = item;
                    batch.set(docRef, { ...itemData, createdAt: serverTimestamp() });
                });
                await batch.commit();
            }
        }
    }


    async function loadAllData() {
        try {
            await seedDatabaseIfEmpty();
        } catch(e){
             console.error("Error seeding database, maybe because it's not empty: ", e);
        }
        await Promise.all([
            loadSiteContent(),
            loadProjects(),
            loadPrinciples(),
            loadSkills()
        ]);
    }

    function renderAllContent() {
        renderSiteContent();
        renderPrinciples();
        renderSkills();
        renderProjects();
    }

    async function loadSiteContent() {
        try {
            const docs = await getDocs(siteContentCollectionRef);
            docs.forEach(doc => siteContent[doc.id] = doc.data());
            renderSiteContent();
        } catch (e) { console.error("Error loading site content: ", e); }
    }
     async function loadProjects() {
        const loader = document.getElementById('projects-loader');
        if(loader) loader.style.display = 'block';
        document.getElementById('projects-grid').innerHTML = ''; 
        try {
            const q = query(projectsCollectionRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderProjects();
        } catch (error) { console.error("Error loading projects: ", error); } finally { if(loader) loader.style.display = 'none'; }
    }
    async function loadPrinciples() {
        const loader = document.getElementById('principles-loader');
        if (loader) loader.style.display = 'block';
        document.getElementById('principles-grid').innerHTML = '';
        try {
            const q = query(principlesCollectionRef, orderBy("createdAt", "asc"));
            const querySnapshot = await getDocs(q);
            principles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderPrinciples();
        } catch (error) { console.error("Error loading principles: ", error); } finally { if (loader) loader.style.display = 'none'; }
    }
    async function loadSkills() {
        const loader = document.getElementById('skills-loader');
        if (loader) loader.style.display = 'block';
        document.getElementById('skills-container').innerHTML = '';
        try {
            const q = query(skillsCollectionRef, orderBy("createdAt", "asc"));
            const querySnapshot = await getDocs(q);
            skills = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderSkills();
        } catch (error) { console.error("Error loading skills: ", error); } finally { if (loader) loader.style.display = 'none'; }
    }
    
    function renderSiteContent() {
        if (siteContent.hero) {
            document.getElementById('hero-title').innerHTML = siteContent.hero.title || "Hi, I'm <span id='hero-name' class='transition-colors duration-500'>Robert Romany</span>";
            document.getElementById('hero-subtitle').textContent = siteContent.hero.subtitle || "Default subtitle text.";
        }
        if (siteContent.about) {
            document.getElementById('about-text').textContent = siteContent.about.text || "Default about text.";
            document.getElementById('about-image').src = siteContent.about.imageUrl || "https://placehold.co/400x400/0f172a/22d3ee?text=RR";
        }
    }

    window.renderProjects = function() {
        const currentTheme = themes[localStorage.getItem('portfolioTheme') || 'light'];
        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '';
        if (projects.length === 0 && !isLoggedIn) {
            grid.innerHTML = `<p class="col-span-3 text-center">No projects have been added yet.</p>`;
            return;
        }

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = `rounded-lg overflow-hidden project-card cursor-pointer ${currentTheme.projectCard}`;
            card.dataset.id = project.id;

            let techBadges = (project.technologies || []).map(tech => {
                const isLight = (localStorage.getItem('portfolioTheme') || 'light') === 'light';
                const bgColor = isLight ? 'bg-gray-200' : 'bg-gray-700';
                const textColor = isLight ? 'text-sky-800' : 'text-cyan-400';
                 return `<span class="${bgColor} ${textColor} text-xs font-semibold px-2.5 py-1 rounded-full">${tech}</span>`
            }).join('');

            card.innerHTML = `
                <img src="${project.thumbnail}" alt="${project.title}" class="w-full h-100 object-cover">
                <div class="p-6">
                    <h3 class="font-bold text-xl mb-2">${project.title}</h3>
                    <div class="flex flex-wrap gap-2 mb-4">${techBadges}</div>
                    ${isLoggedIn ? `
                    <div class="mt-4 pt-4 border-t ${ (localStorage.getItem('portfolioTheme') || 'light') === 'light' ? 'border-gray-200' : 'border-gray-700'} flex space-x-2">
                        <button class="admin-btn edit-btn" onclick="event.stopPropagation(); handleEditProject('${project.id}')">Edit</button>
                        <button class="admin-btn delete-btn" onclick="event.stopPropagation(); handleDeleteProject('${project.id}')">Delete</button>
                    </div>
                    ` : ''}
                </div>
            `;
            card.addEventListener('click', () => showProjectDetails(project.id));
            grid.appendChild(card);
        });
    };
    window.renderPrinciples = function() {
        const currentTheme = themes[localStorage.getItem('portfolioTheme') || 'light'];
        const grid = document.getElementById('principles-grid');
        grid.innerHTML = '';
        if (principles.length === 0 && !isLoggedIn) {
             grid.innerHTML = `<p class="col-span-3 text-center">No principles have been added yet.</p>`;
            return;
        }

        principles.forEach(p => {
            const card = document.createElement('div');
            card.className = `principle-card text-center p-8 rounded-lg relative ${currentTheme.principleCard}`;
            card.innerHTML = `
                <div class="admin-controls-container absolute top-2 right-2 flex space-x-1" style="display: ${isLoggedIn ? 'flex' : 'none'}">
                    <button class="p-1 rounded-full bg-gray-700/50 hover:bg-gray-600/50" onclick="handleEditPrinciple('${p.id}')"><i data-feather="edit-2" class="w-4 h-4 text-white"></i></button>
                    <button class="p-1 rounded-full bg-gray-700/50 hover:bg-gray-600/50" onclick="handleDeletePrinciple('${p.id}')"><i data-feather="trash-2" class="w-4 h-4 text-red-400"></i></button>
                </div>
                <div class="flex justify-center mb-4"><i data-feather="${p.icon}" class="w-12 h-12 principle-icon ${currentTheme.principleIcon}"></i></div>
                <h3 class="text-xl font-bold mb-2 principle-card-title">${p.title}</h3>
                <p class="principle-card-text">${p.description}</p>
            `;
            grid.appendChild(card);
        });
        feather.replace();
    };
    window.renderSkills = function() {
        const container = document.getElementById('skills-container');
        container.innerHTML = '';
         if (skills.length === 0 && !isLoggedIn) {
             container.innerHTML = `<p class="text-center">No skills have been added yet.</p>`;
            return;
        }

        skills.forEach(skill => {
            const item = document.createElement('div');
            item.className = 'skill-item text-center';
            item.innerHTML = `
                <i class="${skill.iconClass} colored text-6xl"></i>
                <p class="mt-2 text-sm font-medium">${skill.name}</p>
                <div class="admin-controls-container absolute top-[-10px] right-[-20px] flex space-x-1" style="display: ${isLoggedIn ? 'flex' : 'none'}">
                    <button class="p-1 rounded-full bg-gray-700/50 hover:bg-gray-600/50" onclick="handleEditSkill('${skill.id}')"><i data-feather="edit-2" class="w-3 h-3 text-white"></i></button>
                    <button class="p-1 rounded-full bg-gray-700/50 hover:bg-gray-600/50" onclick="handleDeleteSkill('${skill.id}')"><i data-feather="trash-2" class="w-3 h-3 text-red-400"></i></button>
                </div>
            `;
            container.appendChild(item);
        });
        feather.replace();
    };
    
    onAuthStateChanged(auth, (user) => {
        isLoggedIn = !!user;
        document.getElementById('login-btn').classList.toggle('hidden', isLoggedIn);
        document.getElementById('logout-btn').classList.toggle('hidden', !isLoggedIn);
        document.querySelectorAll('.edit-icon').forEach(icon => icon.style.display = isLoggedIn ? 'block' : 'none');
        document.querySelectorAll('.admin-controls-container').forEach(container => container.style.display = isLoggedIn ? 'block' : 'none');
        document.getElementById('add-project-btn').classList.toggle('hidden', !isLoggedIn);
        document.getElementById('add-principle-btn').classList.toggle('hidden', !isLoggedIn);
        document.getElementById('add-skill-btn').classList.toggle('hidden', !isLoggedIn);
        renderAllContent();
    });

    document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));
    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            closeModal('login-modal');
        } catch (error) {
            document.getElementById('login-error').textContent = "Login failed.";
        }
    });
    
    document.getElementById('add-project-btn').addEventListener('click', () => {
        document.getElementById('project-form').reset();
        document.getElementById('project-id').value = '';
        document.getElementById('additional-images-container').innerHTML = '';
        document.getElementById('project-modal-title').innerText = 'Add New Project';
        openModal('project-modal');
    });
    document.getElementById('add-principle-btn').addEventListener('click', () => {
        document.getElementById('principle-form').reset();
        document.getElementById('principle-id').value = '';
        document.getElementById('principle-modal-title').innerText = 'Add New Principle';
        openModal('principle-modal');
    });
    document.getElementById('add-skill-btn').addEventListener('click', () => {
        document.getElementById('skill-form').reset();
        document.getElementById('skill-id').value = '';
        document.getElementById('skill-modal-title').innerText = 'Add New Skill';
        openModal('skill-modal');
    });

    window.handleEditPrinciple = id => {
        const p = principles.find(item => item.id === id);
        document.getElementById('principle-id').value = p.id;
        document.getElementById('principle-title').value = p.title;
        document.getElementById('principle-description').value = p.description;
        document.getElementById('principle-icon').value = p.icon;
        document.getElementById('principle-modal-title').innerText = 'Edit Principle';
        openModal('principle-modal');
    };
    window.handleDeletePrinciple = async id => {
        if(confirm('Delete this principle?')) {
            await deleteDoc(doc(db, "principles", id));
            loadPrinciples();
        }
    };
     document.getElementById('principle-form').addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('principle-id').value;
        const data = {
            title: document.getElementById('principle-title').value,
            description: document.getElementById('principle-description').value,
            icon: document.getElementById('principle-icon').value,
        };
        if(id) {
            await updateDoc(doc(db, "principles", id), data);
        } else {
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, "principles"), data);
        }
        loadPrinciples();
        closeModal('principle-modal');
    });

    window.handleEditSkill = id => {
        const s = skills.find(item => item.id === id);
        document.getElementById('skill-id').value = s.id;
        document.getElementById('skill-name').value = s.name;
        document.getElementById('skill-icon-class').value = s.iconClass;
        document.getElementById('skill-modal-title').innerText = 'Edit Skill';
        openModal('skill-modal');
    };
    window.handleDeleteSkill = async id => {
        if(confirm('Delete this skill?')) {
            await deleteDoc(doc(db, "skills", id));
            loadSkills();
        }
    };
    document.getElementById('skill-form').addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('skill-id').value;
        const data = {
            name: document.getElementById('skill-name').value,
            iconClass: document.getElementById('skill-icon-class').value,
        };
         if(id) {
            await updateDoc(doc(db, "skills", id), data);
        } else {
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, "skills"), data);
        }
        loadSkills();
        closeModal('skill-modal');
    });
    
    document.getElementById('edit-about-btn').addEventListener('click', () => handleEditAbout());
    document.getElementById('edit-hero-title-btn').addEventListener('click', () => handleEditText('hero', 'title'));
    document.getElementById('edit-hero-subtitle-btn').addEventListener('click', () => handleEditText('hero', 'subtitle'));
    
    window.handleEditAbout = () => {
        document.getElementById('about-modal-text').value = siteContent.about?.text || '';
        document.getElementById('about-image-url').value = siteContent.about?.imageUrl || '';
        openModal('about-modal');
    };

    window.handleEditText = (docId, field) => {
        document.getElementById('text-edit-doc').value = docId;
        document.getElementById('text-edit-field').value = field;
        if (field === 'title') {
             document.getElementById('text-edit-content').value = (siteContent[docId]?.[field] || '').replace(/<span.*?>.*?<\/span>/g, 'Robert Romany');
        } else {
             document.getElementById('text-edit-content').value = siteContent[docId]?.[field] || '';
        }
        openModal('text-edit-modal');
    };

    document.getElementById('about-form').addEventListener('submit', async e => {
        e.preventDefault();
        
        const newText = document.getElementById('about-modal-text').value;
        const imageUrl = document.getElementById('about-image-url').value;
        
        try {
            const aboutData = { text: newText, imageUrl: imageUrl };
            await setDoc(doc(db, "site_content", "about"), aboutData);
            
            siteContent.about = aboutData;
            renderSiteContent();
            closeModal('about-modal');

        } catch (error) {
            console.error("Error updating about section:", error);
            alert("Failed to update.");
        }
    });

    document.getElementById('text-edit-form').addEventListener('submit', async e => {
        e.preventDefault();
        const docId = document.getElementById('text-edit-doc').value;
        const field = document.getElementById('text-edit-field').value;
        let newContent = document.getElementById('text-edit-content').value;

        if (field === 'title') {
            newContent = newContent.replace('Robert Romany', `<span id='hero-name' class='transition-colors duration-500'>Robert Romany</span>`);
        }

        try {
            await setDoc(doc(db, "site_content", docId), { [field]: newContent }, { merge: true });
            siteContent[docId] = { ...siteContent[docId], [field]: newContent };
            renderSiteContent();
            closeModal('text-edit-modal');
        } catch (error) {
            console.error("Error updating text:", error);
            alert("Failed to save text.");
        }
    });
        
    document.getElementById('project-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const id = document.getElementById('project-id').value;
            const images = [];
            const imageRows = document.querySelectorAll('#additional-images-container > div');
            imageRows.forEach(row => {
                const url = row.querySelector('.additional-image-url').value;
                const description = row.querySelector('.additional-image-desc').value;
                if(url) {
                    images.push({ url, description });
                }
            });

            const formData = {
                title: document.getElementById('project-title').value,
                description: document.getElementById('project-description').value,
                thumbnail: document.getElementById('project-thumbnail-url').value,
                images: images,
                technologies: document.getElementById('project-tech').value.split(',').map(tech => tech.trim()),
                sourceLink: document.getElementById('project-source-link').value,
                liveLink: document.getElementById('project-live-link').value,
            };

            if (id) {
                await updateDoc(doc(db, "projects", id), formData);
            } else {
                formData.createdAt = serverTimestamp();
                await addDoc(collection(db, "projects"), formData);
            }
            loadProjects();
            closeModal('project-modal');
        } catch (error) {
            console.error("Error saving project: ", error);
            alert("Failed to save project.");
        }
    });

    window.handleEditProject = (id) => {
        const project = projects.find(p => p.id === id); if (!project) return;
        document.getElementById('project-id').value = project.id;
        document.getElementById('project-title').value = project.title;
        document.getElementById('project-description').value = project.description;
        document.getElementById('project-thumbnail-url').value = project.thumbnail;
        document.getElementById('project-tech').value = (project.technologies || []).join(', ');
        document.getElementById('project-source-link').value = project.sourceLink || '';
        document.getElementById('project-live-link').value = project.liveLink || '';
        
        const imagesContainer = document.getElementById('additional-images-container');
        imagesContainer.innerHTML = '';
        (project.images || []).forEach(img => {
            const newImageRow = document.createElement('div');
            newImageRow.className = 'flex items-center gap-2';
            newImageRow.innerHTML = `
                <input type="url" placeholder="Image URL" class="modal-input p-2 rounded-lg flex-grow additional-image-url" value="${img.url || ''}">
                <input type="text" placeholder="Image Description" class="modal-input p-2 rounded-lg flex-grow-[2] additional-image-desc" value="${img.description || ''}">
                <button type="button" class="p-2 bg-red-500/50 hover:bg-red-500/80 rounded-lg remove-image-btn"><i data-feather="trash-2" class="w-4 h-4"></i></button>
            `;
            imagesContainer.appendChild(newImageRow);
        });
        feather.replace();

        document.getElementById('project-modal-title').innerText = 'Edit Project';
        openModal('project-modal');
    };

    window.handleDeleteProject = async (id) => {
        if (confirm('Are you sure you want to delete this project?')) {
            await deleteDoc(doc(db, "projects", id)); 
            loadProjects();
        }
    };

     window.showProjectDetails = (id) => {
        const project = projects.find(p => p.id === id); if (!project) return;
        const currentTheme = themes[localStorage.getItem('portfolioTheme') || 'light'];
        document.getElementById('detail-title').innerText = project.title;
        document.getElementById('detail-description').innerText = project.description;
        const mainImage = document.getElementById('detail-main-image');
        const imageDesc = document.getElementById('detail-image-description');
        const thumbnailsContainer = document.getElementById('detail-thumbnails');
        thumbnailsContainer.innerHTML = '';
        const allImages = [{url: project.thumbnail, description: "Project Thumbnail"}, ...(project.images || [])];
        
        function updateMainImage(imageObject) {
            mainImage.src = imageObject.url;
            imageDesc.textContent = imageObject.description || '';
        }
        
        updateMainImage(allImages[0]);

        allImages.forEach((imgObj) => {
            const thumb = document.createElement('img');
            thumb.src = imgObj.url;
            thumb.className = `gallery-thumbnail w-20 h-16 object-cover rounded`;
            if (imgObj.url === mainImage.src) thumb.classList.add('active', currentTheme.activeThumb);
            thumb.addEventListener('click', () => {
                updateMainImage(imgObj);
                document.querySelectorAll('.gallery-thumbnail').forEach(t => t.classList.remove('active', ...Object.values(themes).map(t => t.activeThumb)));
                thumb.classList.add('active', currentTheme.activeThumb);
            });
            thumbnailsContainer.appendChild(thumb);
        });

        const isLight = (localStorage.getItem('portfolioTheme') || 'light') === 'light';
        const techBgColor = isLight ? 'bg-gray-200' : 'bg-gray-700';
        const techTextColor = isLight ? 'text-sky-800' : 'text-cyan-400';
        document.getElementById('detail-tech').innerHTML = (project.technologies || [])
            .map(tech => `<span class="${techBgColor} ${techTextColor} text-sm font-semibold px-3 py-1 rounded-full">${tech}</span>`).join('');
        
        const linksContainer = document.getElementById('detail-links');
        linksContainer.innerHTML = '';
        if (project.sourceLink) {
            const a = document.createElement('a'); a.href = project.sourceLink; a.target = '_blank';
            a.innerText = 'Source Code'; a.className = `font-bold py-2 px-4 rounded-lg transition ${currentTheme.detailLinkSource}`;
            linksContainer.appendChild(a);
        }
        if (project.liveLink) {
            const a = document.createElement('a'); a.href = project.liveLink; a.target = '_blank';
            a.innerText = 'Live Link'; a.className = `font-bold py-2 px-4 rounded-lg transition ${currentTheme.detailLinkLive}`;
            linksContainer.appendChild(a);
        }
        openModal('project-detail-modal');
    };
    
    document.getElementById('add-image-btn').addEventListener('click', () => {
        const newImageRow = document.createElement('div');
        newImageRow.className = 'flex items-center gap-2';
        newImageRow.innerHTML = `
            <input type="url" placeholder="Image URL" class="modal-input p-2 rounded-lg flex-grow additional-image-url">
            <input type="text" placeholder="Image Description" class="modal-input p-2 rounded-lg flex-grow-[2] additional-image-desc">
            <button type="button" class="p-2 bg-red-500/50 hover:bg-red-500/80 rounded-lg remove-image-btn"><i data-feather="trash-2" class="w-4 h-4"></i></button>
        `;
        document.getElementById('additional-images-container').appendChild(newImageRow);
        feather.replace();
    });

    document.getElementById('additional-images-container').addEventListener('click', e => {
        if (e.target.closest('.remove-image-btn')) {
            e.target.closest('.flex').remove();
        }
    });

    function openModal(id) {
        const modal = document.getElementById(id);
        modal.classList.remove('hidden');
        setTimeout(() => modal.querySelector('.modal-content').classList.remove('scale-95'), 10);
    }
    function closeModal(id) {
        const modal = document.getElementById(id);
        modal.querySelector('.modal-content').classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-close')) {
                closeModal(modal.id);
            }
        });
    });

    document.getElementById('year').textContent = new Date().getFullYear();
    const savedTheme = localStorage.getItem('portfolioTheme') || 'light';
    applyTheme(savedTheme);
    loadAllData();
});


