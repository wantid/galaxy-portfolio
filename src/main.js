import { Scene3D } from './scene.js';
import { Modal } from './modal.js';
import planetsData from './data/planets.json';
import globalTabsData from './data/tabs.json';
import welcomeData from './data/welcome.json';

function checkWebGL() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

class App {
    constructor() {
        this.scene3D = null;
        this.planets = [];
        this.modal = new Modal();
        this.globalTabsElement = document.getElementById('global-tabs');
        this.webglError = document.getElementById('webgl-error');
        this.appElement = document.getElementById('app');
        this.welcomePage = document.getElementById('welcome-page');
        this.universeScene = document.getElementById('universe-scene');
        this.exploreButton = document.getElementById('explore-button');
        this.authorLink = document.getElementById('author-link');
        this.languageSwitcher = document.getElementById('language-switcher');
        this.currentView = 'welcome';
        this.isTransitioning = false;
        this.currentLanguage = this.getInitialLanguage();
        this.init();
    }

    getInitialLanguage() {
        const availableLanguages = Object.keys(welcomeData);
        if (availableLanguages.length === 0) return '🇺🇸';
        
        const savedLanguage = localStorage.getItem('galaxy-portfolio-language');
        
        if (savedLanguage && availableLanguages.includes(savedLanguage)) {
            return savedLanguage;
        }
        
        return availableLanguages[0];
    }

    getCurrentLanguageData() {
        return welcomeData[this.currentLanguage] || welcomeData[Object.keys(welcomeData)[0]];
    }

    init() {
        if (this.authorLink) {
            this.authorLink.classList.add('hidden');
        }
        if (this.languageSwitcher) {
            this.languageSwitcher.classList.remove('hidden');
        }
        const bottomActions = document.getElementById('welcome-bottom-actions');
        if (bottomActions) {
            bottomActions.classList.remove('hidden');
        }
        this.setupWelcomePage();
        this.setupEventListeners();
    }

    setupWelcomePage() {
        if (!welcomeData) return;

        this.setupLanguageSwitcher();
        this.setupHero();
        this.setupAbout();
        this.setupWorkExperience();
        this.setupProjects();
        this.setupTechnicalSkills();
        this.setupEducation();
        this.setupContacts();

        const langData = this.getCurrentLanguageData();
        if (this.exploreButton && langData.moreButton) {
            this.exploreButton.textContent = langData.moreButton;
        }
    }

    setupLanguageSwitcher() {
        if (!this.languageSwitcher || !welcomeData) return;

        const languages = Object.keys(welcomeData);
        if (languages.length <= 1) {
            this.languageSwitcher.style.display = 'none';
            return;
        }

        let switcherHtml = '';
        languages.forEach(lang => {
            const isActive = lang === this.currentLanguage;
            switcherHtml += `
                <button class="language-button ${isActive ? 'active' : ''}" data-lang="${lang}">
                    ${lang}
                </button>
            `;
        });

        this.languageSwitcher.innerHTML = switcherHtml;

        this.languageSwitcher.querySelectorAll('.language-button').forEach(button => {
            button.addEventListener('click', () => {
                const lang = button.getAttribute('data-lang');
                if (lang !== this.currentLanguage) {
                    this.changeLanguage(lang);
                }
            });
        });
    }

    changeLanguage(lang) {
        if (!welcomeData[lang] || lang === this.currentLanguage) return;
        
        this.currentLanguage = lang;
        localStorage.setItem('galaxy-portfolio-language', lang);
        this.setupWelcomePage();
        
        if (this.welcomePage) {
            this.welcomePage.scrollTop = 0;
        }
    }

    setupHero() {
        const heroEl = document.getElementById('welcome-hero');
        const langData = this.getCurrentLanguageData();
        if (!heroEl || !langData.hero) return;

        const imageHtml = langData.hero.image 
            ? `<img src="${langData.hero.image}" alt="${langData.hero.name || 'Profile'}" class="hero-image" onerror="this.style.display='none'">`
            : '';

        const locationHtml = langData.hero.location 
            ? `<div class="hero-location">📍 ${langData.hero.location}</div>`
            : '';

        const emailHtml = langData.hero.email 
            ? `<a href="mailto:${langData.hero.email}" class="hero-email">✉️ ${langData.hero.email}</a>`
            : '';

        heroEl.innerHTML = `
            ${imageHtml}
            <h1 class="hero-name">${langData.hero.name || ''}</h1>
            <h2 class="hero-title">${langData.hero.title || ''}</h2>
            <p class="hero-tagline">${langData.hero.tagline || ''}</p>
            ${locationHtml}
            ${emailHtml}
        `;
    }

    setupAbout() {
        const aboutEl = document.getElementById('welcome-about');
        const langData = this.getCurrentLanguageData();
        if (!aboutEl || !langData.about) return;

        aboutEl.innerHTML = `
            <h2 class="section-title">${langData.about.title || ''}</h2>
            <div class="about-content">
                <p class="about-text">${langData.about.content || ''}</p>
            </div>
        `;
    }


    setupWorkExperience() {
        const workEl = document.getElementById('welcome-work');
        const langData = this.getCurrentLanguageData();
        if (!workEl || !langData.workExperience) {
            if (workEl) workEl.style.display = 'none';
            return;
        }

        let workHtml = `<h2 class="section-title">${langData.workExperience.title || 'Work Experience'}</h2><div class="work-container">`;

        if (langData.workExperience.items && langData.workExperience.items.length > 0) {
            langData.workExperience.items.forEach((item) => {
                const startDate = item.startDate ? new Date(item.startDate) : null;
                const endDate = item.endDate ? new Date(item.endDate) : null;
                const startStr = startDate ? startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
                const endStr = endDate 
                    ? endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                    : item.endDate === null ? 'Present' : '';

                workHtml += `
                    <div class="work-item">
                        <div class="work-header">
                            <h3 class="work-title">${item.name || ''}</h3>
                            ${startStr || endStr ? `<span class="work-period">${startStr}${startStr && endStr ? ' - ' : ''}${endStr}</span>` : ''}
                        </div>
                        ${item.description ? `<div class="work-content"><p class="work-description">${item.description}</p></div>` : ''}
                    </div>
                `;
            });
        }

        workHtml += '</div>';
        workEl.innerHTML = workHtml;
    }

    setupProjects() {
        const projectsEl = document.getElementById('welcome-projects');
        const langData = this.getCurrentLanguageData();
        if (!projectsEl || !langData.projects) {
            if (projectsEl) projectsEl.style.display = 'none';
            return;
        }

        let projectsHtml = `<h2 class="section-title">${langData.projects.title || 'Featured Projects'}</h2><div class="projects-container">`;

        if (langData.projects.items) {
            langData.projects.items.forEach(project => {
                const techTags = project.technologies 
                    ? project.technologies.map(tech => `<span class="project-tech">${tech}</span>`).join('')
                    : '';

                projectsHtml += `
                    <div class="project-item">
                        <h3 class="project-title">${project.name}</h3>
                        <p class="project-description">${project.description || ''}</p>
                        <div class="project-technologies">${techTags}</div>
                        ${project.link ? `<a href="${project.link}" target="_blank" rel="noopener" class="project-link">View Project →</a>` : ''}
                    </div>
                `;
            });
        }

        projectsHtml += '</div>';
        projectsEl.innerHTML = projectsHtml;
    }

    setupTechnicalSkills() {
        const skillsEl = document.getElementById('welcome-skills');
        const langData = this.getCurrentLanguageData();
        if (!skillsEl || !langData.technicalSkills) {
            if (skillsEl) skillsEl.style.display = 'none';
            return;
        }

        let skillsHtml = `<h2 class="section-title">${langData.technicalSkills.title || 'Technical Skills'}</h2><div class="skills-container">`;

        if (langData.technicalSkills.categories) {
            langData.technicalSkills.categories.forEach(category => {
                skillsHtml += `
                    <div class="skill-category">
                        <h3 class="skill-category-title">${category.name}</h3>
                        <div class="skill-items">
                            ${category.items.map(item => `<span class="skill-item">${item}</span>`).join('')}
                        </div>
                    </div>
                `;
            });
        }

        skillsHtml += '</div>';
        skillsEl.innerHTML = skillsHtml;
    }

    setupEducation() {
        const educationEl = document.getElementById('welcome-education');
        const langData = this.getCurrentLanguageData();
        if (!educationEl || !langData.education) {
            if (educationEl) educationEl.style.display = 'none';
            return;
        }

        let educationHtml = `<h2 class="section-title">${langData.education.title || 'Education'}</h2><div class="education-container">`;

        if (langData.education.items) {
            langData.education.items.forEach(edu => {
                educationHtml += `
                    <div class="education-item">
                        <div class="education-header">
                            <h3 class="education-degree">${edu.degree}</h3>
                            <span class="education-period">${edu.period}</span>
                        </div>
                        <p class="education-institution">${edu.institution}</p>
                        ${edu.description ? `<p class="education-description">${edu.description}</p>` : ''}
                    </div>
                `;
            });
        }

        educationHtml += '</div>';
        educationEl.innerHTML = educationHtml;
    }

    setupContacts() {
        const contactsEl = document.getElementById('welcome-contacts');
        const langData = this.getCurrentLanguageData();
        if (!contactsEl || !langData.contacts) {
            if (contactsEl) contactsEl.style.display = 'none';
            return;
        }

        let contactsHtml = `<h2 class="section-title">${langData.contacts.title || 'Get In Touch'}</h2><div class="contacts-container">`;

        if (langData.contacts.links) {
            langData.contacts.links.forEach(link => {
                contactsHtml += `
                    <a href="${link.url}" target="_blank" rel="noopener" class="contact-link">
                        <span class="contact-name">${link.name}</span>
                    </a>
                `;
            });
        }

        contactsHtml += '</div>';
        contactsEl.innerHTML = contactsHtml;
    }



    setupEventListeners() {
        if (this.exploreButton) {
            this.exploreButton.addEventListener('click', () => {
                this.transitionToUniverse();
            });
        }
    }

    transitionToUniverse() {
        if (this.currentView === 'universe' || this.isTransitioning) return;
        
        this.playTransition(this.welcomePage, () => {
            this.showUniverse();
        });
    }

    transitionToWelcome() {
        if (this.currentView === 'welcome' || this.isTransitioning) return;
        
        this.playTransition(this.universeScene, () => {
            if (this.scene3D) {
                this.scene3D.stopAnimation();
                this.scene3D.setLabelsVisible(false);
            }
            this.showWelcome();
        });
    }

    async playTransition(sourceElement, callback) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        const overlay = document.getElementById('transition-overlay');
        if (!overlay) {
            this.isTransitioning = false;
            callback();
            return;
        }

        const sourceCanvas = await this.capturePageAsync(sourceElement, this.scene3D);
        if (!sourceCanvas) {
            this.isTransitioning = false;
            callback();
            return;
        }

        overlay.classList.remove('hidden');
        overlay.style.pointerEvents = 'auto';
        overlay.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: true });
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        overlay.appendChild(canvas);

        ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                callback();
            });
        });

        const stripWidth = 3;
        const numStrips = Math.ceil(canvas.width / stripWidth);
        const strips = [];

        for (let x = 0; x < numStrips; x++) {
            const stripX = x * stripWidth;
            const width = Math.min(stripWidth, canvas.width - stripX);
            const imageData = ctx.getImageData(stripX, 0, width, canvas.height);
            
            strips.push({
                x: stripX,
                width: width,
                imageData: imageData,
                delay: Math.random() * 0.5
            });
        }

        const duration = 0.8;
        const fallSpeed = canvas.height * 1.5;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = (currentTime - startTime) / 1000;

            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            
            let allFinished = true;
            
            strips.forEach(strip => {
                const adjustedTime = Math.max(0, elapsed - strip.delay);
                const progress = Math.min(1, adjustedTime / duration);
                
                if (progress < 1) {
                    allFinished = false;
                    const fallDistance = progress * fallSpeed;
                    
                    if (fallDistance < canvas.height + fallSpeed) {
                        ctx.putImageData(strip.imageData, strip.x, fallDistance);
                    }
                }
            });

            if (!allFinished) {
                requestAnimationFrame(animate);
            } else {
                setTimeout(() => {
                    overlay.innerHTML = '';
                    overlay.classList.add('hidden');
                    overlay.style.pointerEvents = 'none';
                    this.isTransitioning = false;
                }, 100);
            }
        };

        requestAnimationFrame(animate);
    }

    async capturePageAsync(element, scene3D = null) {
        if (!element) return null;

        return new Promise((resolve) => {
            if (element.id === 'universe-scene') {
                const canvas = document.createElement('canvas');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                const ctx = canvas.getContext('2d');
                
                const canvas3D = document.getElementById('canvas');
                if (canvas3D && scene3D && scene3D.renderer) {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    const capture3D = () => {
                        try {
                            if (canvas3D.width > 0 && canvas3D.height > 0) {
                                if (scene3D && scene3D.renderer && scene3D.scene && scene3D.camera) {
                                    scene3D.renderer.render(scene3D.scene, scene3D.camera);
                                }
                                ctx.drawImage(canvas3D, 0, 0, canvas.width, canvas.height);
                                resolve(canvas);
                            } else {
                                setTimeout(capture3D, 16);
                            }
                        } catch (e) {
                            console.warn('Could not capture 3D canvas:', e);
                            ctx.fillStyle = '#000';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            resolve(canvas);
                        }
                    };
                    
                    requestAnimationFrame(() => {
                        requestAnimationFrame(capture3D);
                    });
                } else {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    setTimeout(() => resolve(canvas), 50);
                }
                return;
            }

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            const elementsToCapture = [];
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        if (node.id === 'transition-overlay' || node.id === 'explore-button') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const nodeStyle = window.getComputedStyle(node);
                            if (nodeStyle.display === 'none' || nodeStyle.visibility === 'hidden') {
                                return NodeFilter.FILTER_REJECT;
                            }
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            let node;
            while (node = walker.nextNode()) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const rect = node.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        if (node.tagName === 'IMG') {
                            try {
                                const img = node;
                                if (img.complete && img.naturalWidth > 0) {
                                    const elStyle = window.getComputedStyle(node);
                                    elementsToCapture.push({ 
                                        type: 'image', 
                                        node: img, 
                                        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
                                        style: elStyle
                                    });
                                }
                            } catch (e) {
                                console.warn('Could not capture image:', e);
                            }
                        } else if (node.tagName === 'CANVAS') {
                            try {
                                elementsToCapture.push({ 
                                    type: 'canvas', 
                                    node: node, 
                                    rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
                                });
                            } catch (e) {
                                console.warn('Could not capture canvas:', e);
                            }
                        }
                    }
                } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    const parent = node.parentElement;
                    if (parent && parent.children.length === 0) {
                        const rect = parent.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            const elStyle = window.getComputedStyle(parent);
                            elementsToCapture.push({ 
                                type: 'text', 
                                node: parent, 
                                text: node.textContent.trim(), 
                                rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
                                style: elStyle
                            });
                        }
                    }
                }
            }

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    const ctx = canvas.getContext('2d');
                    
                    const style = window.getComputedStyle(element);
                    ctx.fillStyle = style.backgroundColor || '#fafafa';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    elementsToCapture.forEach(item => {
                        if (item.type === 'image') {
                            try {
                                ctx.drawImage(item.node, item.rect.left, item.rect.top, item.rect.width, item.rect.height);
                            } catch (e) {
                                console.warn('Could not draw image:', e);
                            }
                        } else if (item.type === 'canvas') {
                            try {
                                ctx.drawImage(item.node, item.rect.left, item.rect.top, item.rect.width, item.rect.height);
                            } catch (e) {
                                console.warn('Could not draw canvas:', e);
                            }
                        } else if (item.type === 'text') {
                            const elStyle = item.style;
                            const fontSize = parseFloat(elStyle.fontSize) || 16;
                            const fontFamily = elStyle.fontFamily || 'Arial';
                            const fontWeight = elStyle.fontWeight || 'normal';
                            const fontStyle = elStyle.fontStyle || 'normal';
                            const textAlign = elStyle.textAlign || 'left';
                            
                            ctx.save();
                            ctx.fillStyle = elStyle.color || '#1a1a1a';
                            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
                            ctx.textAlign = textAlign;
                            ctx.textBaseline = 'top';
                            
                            let x = item.rect.left;
                            if (textAlign === 'center') {
                                x = item.rect.left + item.rect.width / 2;
                            } else if (textAlign === 'right') {
                                x = item.rect.left + item.rect.width;
                            }
                            
                            ctx.fillText(item.text, x, item.rect.top);
                            ctx.restore();
                        }
                    });

                    resolve(canvas);
                });
            });
        });
    }

    showUniverse() {
        if (!checkWebGL()) {
            this.showWebGLError();
            return;
        }

        if (this.welcomePage) {
            this.welcomePage.classList.add('hidden');
        }

        if (this.universeScene) {
            this.universeScene.classList.remove('hidden');
        }

        if (this.authorLink) {
            this.authorLink.classList.remove('hidden');
        }

        if (this.languageSwitcher) {
            this.languageSwitcher.classList.add('hidden');
        }

        const bottomActions = document.getElementById('welcome-bottom-actions');
        if (bottomActions) {
            bottomActions.classList.add('hidden');
        }

        if (!this.scene3D) {
            this.initUniverse();
        } else {
            this.scene3D.startAnimation();
            this.scene3D.setLabelsVisible(true);
        }

        this.currentView = 'universe';
    }

    showWelcome() {
        if (this.universeScene) {
            this.universeScene.classList.add('hidden');
        }

        if (this.scene3D) {
            this.scene3D.stopAnimation();
            this.scene3D.setLabelsVisible(false);
        }

        if (this.welcomePage) {
            this.welcomePage.classList.remove('hidden');
        }

        if (this.authorLink) {
            this.authorLink.classList.add('hidden');
        }

        if (this.languageSwitcher) {
            this.languageSwitcher.classList.remove('hidden');
        }

        const bottomActions = document.getElementById('welcome-bottom-actions');
        if (bottomActions) {
            bottomActions.classList.remove('hidden');
        }

        this.currentView = 'welcome';
    }

    initUniverse() {
        let data = planetsData;
        
        if (!data || data.length === 0) {
            console.warn('No planets data loaded!');
            return;
        }
        
        data.sort((a, b) => {
            return new Date(b.startDate) - new Date(a.startDate);
        });
        
        this.scene3D = new Scene3D(document.getElementById('app'));
        
        data.forEach((planetData, index) => {
            const planet = this.scene3D.addPlanet(planetData, index, data.length);
            this.planets.push(planet);
        });
        
        this.scene3D.onPlanetClick = (planetData) => {
            this.modal.show(planetData);
        };

        this.setupGlobalTabs(globalTabsData);
    }

    setupGlobalTabs(tabsData) {
        if (!this.globalTabsElement || !Array.isArray(tabsData)) {
            return;
        }
        this.globalTabsElement.innerHTML = '';
        tabsData.forEach((tab) => {
            if (!tab || !tab.label) {
                return;
            }
            const button = document.createElement('button');
            button.className = 'global-tab-button';
            button.textContent = tab.label;
            
            if (tab.type === 'home') {
                button.addEventListener('click', () => {
                    this.transitionToWelcome();
                });
            } else if (tab.type === 'link' && tab.href) {
                button.addEventListener('click', () => {
                    window.open(tab.href, '_blank', 'noopener');
                });
            } else if (tab.type === 'modal' && tab.tabs) {
                button.addEventListener('click', () => {
                    const modalData = {
                        name: tab.name || tab.label,
                        startDate: tab.startDate,
                        endDate: tab.endDate,
                        dateLabel: tab.dateLabel,
                        tabs: tab.tabs
                    };
                    this.modal.show(modalData);
                });
            }
            this.globalTabsElement.appendChild(button);
        });
    }

    showWebGLError() {
        if (this.webglError) {
            this.webglError.classList.remove('hidden');
        }
        if (this.appElement) {
            this.appElement.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});

