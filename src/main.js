import { Scene3D } from './scene.js';
import { Modal } from './modal.js';
import planetsData from './data/planets.json';
import globalTabsData from './data/tabs.json';
import welcomeData from './data/welcome.json';
import { jsPDF } from 'jspdf';

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
        this.exportPdfButton = document.getElementById('export-pdf-button');
        this.exportSectionsModal = document.getElementById('export-sections-modal');
        this.exportSectionsTitle = document.getElementById('export-sections-title');
        this.exportSectionsList = document.getElementById('export-sections-list');
        this.exportSectionsCancel = document.getElementById('export-sections-cancel');
        this.exportSectionsConfirm = document.getElementById('export-sections-confirm');
        this.authorLink = document.getElementById('author-link');
        this.languageSwitcher = document.getElementById('language-switcher');
        this.currentView = 'welcome';
        this.isTransitioning = false;
        this.currentLanguage = this.getInitialLanguage();
        this.pdfFontData = null;
        this.exportSectionKeys = ['about', 'workExperience', 'projects', 'technicalSkills', 'education', 'contacts'];
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
        const pauseButton = document.getElementById('pause-time-button');
        if (pauseButton) {
            pauseButton.classList.add('hidden');
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
        if (this.exportPdfButton) {
            this.exportPdfButton.textContent = langData.exportButton || 'Download CV';
        }
        this.renderExportSectionsModal();
    }

    getExportUiLabels() {
        const langData = this.getCurrentLanguageData();
        const defaultLabels = {
            title: 'Select Sections for PDF',
            cancel: 'Cancel',
            confirm: 'Export PDF'
        };
        return {
            title: langData?.exportModal?.title || defaultLabels.title,
            cancel: langData?.exportModal?.cancel || defaultLabels.cancel,
            confirm: langData?.exportModal?.confirm || defaultLabels.confirm
        };
    }

    getExportSectionsConfig() {
        const langData = this.getCurrentLanguageData();
        return [
            { key: 'about', label: langData?.about?.title || 'About' },
            { key: 'workExperience', label: langData?.workExperience?.title || 'Work Experience' },
            { key: 'projects', label: langData?.projects?.title || 'Projects' },
            { key: 'technicalSkills', label: langData?.technicalSkills?.title || 'Technical Skills' },
            { key: 'education', label: langData?.education?.title || 'Education' },
            { key: 'contacts', label: langData?.contacts?.title || 'Contacts' }
        ];
    }

    renderExportSectionsModal() {
        if (!this.exportSectionsModal || !this.exportSectionsList) return;

        const ui = this.getExportUiLabels();
        const sections = this.getExportSectionsConfig();

        if (this.exportSectionsTitle) {
            this.exportSectionsTitle.textContent = ui.title;
        }
        if (this.exportSectionsCancel) {
            this.exportSectionsCancel.textContent = ui.cancel;
        }
        if (this.exportSectionsConfirm) {
            this.exportSectionsConfirm.textContent = ui.confirm;
        }

        this.exportSectionsList.innerHTML = sections.map((section) => `
            <label class="export-section-option">
                <input type="checkbox" data-export-section="${section.key}" checked>
                <span>${section.label}</span>
            </label>
        `).join('');
    }

    openExportSectionsModal() {
        if (!this.exportSectionsModal) {
            this.exportToPDF(new Set(this.exportSectionKeys));
            return;
        }
        this.renderExportSectionsModal();
        this.exportSectionsModal.classList.remove('hidden');
    }

    closeExportSectionsModal() {
        if (!this.exportSectionsModal) return;
        this.exportSectionsModal.classList.add('hidden');
    }

    getSelectedExportSections() {
        if (!this.exportSectionsList) {
            return new Set(this.exportSectionKeys);
        }

        const selected = new Set(
            Array.from(this.exportSectionsList.querySelectorAll('input[data-export-section]:checked'))
                .map((input) => input.getAttribute('data-export-section'))
                .filter(Boolean)
        );
        return selected.size > 0 ? selected : new Set(this.exportSectionKeys);
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

    async loadPdfFontData() {
        if (this.pdfFontData) return this.pdfFontData;

        const toBase64 = (arrayBuffer) => {
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            const chunkSize = 0x8000;
            for (let i = 0; i < bytes.length; i += chunkSize) {
                const chunk = bytes.subarray(i, i + chunkSize);
                binary += String.fromCharCode.apply(null, chunk);
            }
            return btoa(binary);
        };

        const loadFont = async (url) => {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load font: ${url}`);
            }
            return toBase64(await response.arrayBuffer());
        };

        try {
            const [regular, bold, italic, boldItalic] = await Promise.all([
                loadFont('content/fonts/static/NotoSans-Regular.ttf'),
                loadFont('content/fonts/static/NotoSans-Bold.ttf'),
                loadFont('content/fonts/static/NotoSans-Italic.ttf'),
                loadFont('content/fonts/static/NotoSans-BoldItalic.ttf')
            ]);

            this.pdfFontData = { regular, bold, italic, boldItalic };
        } catch (error) {
            console.warn('Unicode PDF font loading failed, fallback to default font.', error);
            this.pdfFontData = null;
        }

        return this.pdfFontData;
    }

    async exportToPDF(selectedSections = new Set(this.exportSectionKeys)) {
        const langData = this.getCurrentLanguageData();
        if (!langData) return;

        const fontData = await this.loadPdfFontData();

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        let pdfFontFamily = 'helvetica';
        if (fontData) {
            doc.addFileToVFS('NotoSans-Regular.ttf', fontData.regular);
            doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
            doc.addFileToVFS('NotoSans-Bold.ttf', fontData.bold);
            doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
            doc.addFileToVFS('NotoSans-Italic.ttf', fontData.italic);
            doc.addFont('NotoSans-Italic.ttf', 'NotoSans', 'italic');
            doc.addFileToVFS('NotoSans-BoldItalic.ttf', fontData.boldItalic);
            doc.addFont('NotoSans-BoldItalic.ttf', 'NotoSans', 'bolditalic');
            pdfFontFamily = 'NotoSans';
            doc.setFont(pdfFontFamily, 'normal');
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        let yPos = margin;
        const pdfLocale = this.currentLanguage === '🇷🇺' ? 'ru-RU' : this.currentLanguage === '🇷🇸' ? 'sr-Latn-RS' : 'en-US';
        const presentLabel = this.currentLanguage === '🇷🇺' ? 'По настоящее время' : this.currentLanguage === '🇷🇸' ? 'Trenutno' : 'Present';
        const useStyledRichText = !!fontData || this.currentLanguage === '🇺🇸';

        const preparePdfText = (text) => {
            if (text === null || text === undefined) return '';
            return String(text).replace(/\u0000/g, '');
        };

        const addSection = (title, content, fontSize = 16) => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }
            doc.setFontSize(fontSize);
            setPdfFont('bold');
            doc.setTextColor(0, 102, 204);
            doc.text(title, margin, yPos);
            yPos += 8;
            
            doc.setFontSize(11);
            setPdfFont('normal');
            doc.setTextColor(0, 0, 0);
            return yPos;
        };

        const addText = (text, maxWidth = contentWidth) => {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = margin;
            }
            const lines = doc.splitTextToSize(preparePdfText(text), maxWidth);
            doc.text(lines, margin, yPos);
            yPos += lines.length * 6;
        };

        const getFontStyle = (segmentStyle) => {
            if (segmentStyle.bold && segmentStyle.italic) return 'bolditalic';
            if (segmentStyle.bold) return 'bold';
            if (segmentStyle.italic) return 'italic';
            return 'normal';
        };

        const setPdfFont = (style = 'normal') => {
            doc.setFont(pdfFontFamily, style);
        };

        const parseBasicHtml = (htmlText) => {
            if (!htmlText) return [];

            const normalized = preparePdfText(htmlText)
                .replace(/<\s*br\s*\/?\s*>/gi, '\n')
                .replace(/<\s*\/\s*p\s*>/gi, '\n')
                .replace(/<\s*p[^>]*>/gi, '');
            const tokens = normalized.split(/(<\/?(?:b|strong|i|em)>)/gi).filter(Boolean);

            const lines = [[]];
            const style = { bold: false, italic: false };

            const pushText = (text) => {
                if (!text) return;
                const parts = text.split('\n');
                parts.forEach((part, index) => {
                    if (part) {
                        lines[lines.length - 1].push({
                            text: part,
                            bold: style.bold,
                            italic: style.italic
                        });
                    }
                    if (index < parts.length - 1) {
                        lines.push([]);
                    }
                });
            };

            tokens.forEach((token) => {
                const lower = token.toLowerCase();
                if (lower === '<b>' || lower === '<strong>') {
                    style.bold = true;
                    return;
                }
                if (lower === '</b>' || lower === '</strong>') {
                    style.bold = false;
                    return;
                }
                if (lower === '<i>' || lower === '<em>') {
                    style.italic = true;
                    return;
                }
                if (lower === '</i>' || lower === '</em>') {
                    style.italic = false;
                    return;
                }

                const plainText = token.replace(/<[^>]+>/g, '');
                pushText(plainText);
            });

            return lines;
        };

        const stripHtmlToPlainText = (htmlText) => {
            if (!htmlText) return '';
            return preparePdfText(
                String(htmlText)
                    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
                    .replace(/<\s*\/\s*p\s*>/gi, '\n')
                    .replace(/<\s*p[^>]*>/gi, '')
                    .replace(/<[^>]+>/g, '')
            );
        };

        const addRichText = (htmlText, maxWidth = contentWidth, lineHeight = 6) => {
            if (!useStyledRichText) {
                addText(stripHtmlToPlainText(htmlText), maxWidth);
                return;
            }
            const parsedLines = parseBasicHtml(htmlText);
            if (!parsedLines.length) return;

            const wrappedLines = [];

            const getTokenWidth = (token) => {
                setPdfFont(getFontStyle(token));
                return doc.getTextWidth(token.text);
            };

            parsedLines.forEach((line) => {
                if (!line.length) {
                    wrappedLines.push([]);
                    return;
                }

                let currentLine = [];
                let currentWidth = 0;

                line.forEach((segment) => {
                    const chunks = segment.text.split(/(\s+)/).filter((chunk) => chunk.length > 0);
                    chunks.forEach((chunk) => {
                        const token = { text: chunk, bold: segment.bold, italic: segment.italic };
                        const tokenWidth = getTokenWidth(token);
                        const isWhitespace = /^\s+$/.test(chunk);

                        if (!isWhitespace && currentLine.length > 0 && currentWidth + tokenWidth > maxWidth) {
                            wrappedLines.push(currentLine);
                            currentLine = [];
                            currentWidth = 0;
                        }

                        if (isWhitespace && currentLine.length === 0) return;

                        currentLine.push(token);
                        currentWidth += tokenWidth;
                    });
                });

                wrappedLines.push(currentLine);
            });

            wrappedLines.forEach((line) => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;
                }

                if (!line.length) {
                    yPos += lineHeight;
                    return;
                }

                let xPos = margin;
                line.forEach((segment) => {
                    setPdfFont(getFontStyle(segment));
                    doc.text(segment.text, xPos, yPos);
                    xPos += doc.getTextWidth(segment.text);
                });
                yPos += lineHeight;
            });
        };

        doc.setFontSize(24);
        setPdfFont('bold');
        doc.setTextColor(0, 0, 0);
        doc.text(preparePdfText(langData.hero.name || ''), margin, yPos);
        yPos += 10;

        doc.setFontSize(14);
        setPdfFont('normal');
        doc.setTextColor(0, 102, 204);
        doc.text(preparePdfText(langData.hero.title || ''), margin, yPos);
        yPos += 8;

        if (langData.hero.location || langData.hero.email) {
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            const contactInfo = [
                langData.hero.location || '',
                langData.hero.email || ''
            ].filter(Boolean).join(' • ');
            doc.text(preparePdfText(contactInfo), margin, yPos);
            yPos += 10;
        }

        if (selectedSections.has('about') && langData.about && langData.about.content) {
            yPos = addSection(langData.about.title || 'About', '');
            addText(langData.about.content);
            yPos += 5;
        }

        if (selectedSections.has('workExperience') && langData.workExperience && langData.workExperience.items) {
            yPos = addSection(langData.workExperience.title || 'Work Experience', '');
            langData.workExperience.items.forEach(item => {
                doc.setFontSize(12);
                setPdfFont('bold');
                doc.setTextColor(0, 0, 0);
                doc.text(preparePdfText(item.name || ''), margin, yPos);
                yPos += 6;

                if (item.startDate || item.endDate) {
                    const startDate = item.startDate ? new Date(item.startDate).toLocaleDateString(pdfLocale, { year: 'numeric', month: 'short' }) : '';
                    const endDate = item.endDate ? new Date(item.endDate).toLocaleDateString(pdfLocale, { year: 'numeric', month: 'short' }) : presentLabel;
                    const period = `${startDate} - ${endDate}`;
                    doc.setFontSize(10);
                    setPdfFont('italic');
                    doc.setTextColor(100, 100, 100);
                    doc.text(preparePdfText(period), margin, yPos);
                    yPos += 6;
                }

                if (item.description) {
                    doc.setFontSize(10);
                    setPdfFont('normal');
                    doc.setTextColor(0, 0, 0);
                    addRichText(item.description);
                }
                yPos += 5;
            });
        }

        if (selectedSections.has('projects') && langData.projects && langData.projects.items) {
            yPos = addSection(langData.projects.title || 'Projects', '');
            langData.projects.items.forEach(project => {
                doc.setFontSize(12);
                setPdfFont('bold');
                doc.setTextColor(0, 0, 0);
                doc.text(preparePdfText(project.name || ''), margin, yPos);
                yPos += 6;

                if (project.description) {
                    doc.setFontSize(10);
                    setPdfFont('normal');
                    doc.setTextColor(0, 0, 0);
                    addRichText(project.description);
                }

                if (project.technologies && project.technologies.length > 0) {
                    doc.setFontSize(9);
                    doc.setTextColor(0, 102, 204);
                    const techText = project.technologies.join(' • ');
                    addText(techText);
                    doc.setTextColor(0, 0, 0);
                }
                yPos += 5;
            });
        }

        if (selectedSections.has('technicalSkills') && langData.technicalSkills && langData.technicalSkills.categories) {
            yPos = addSection(langData.technicalSkills.title || 'Technical Skills', '');
            langData.technicalSkills.categories.forEach(category => {
                doc.setFontSize(11);
                setPdfFont('bold');
                doc.setTextColor(0, 0, 0);
                doc.text(preparePdfText(category.name + ':'), margin, yPos);
                yPos += 6;

                if (category.items && category.items.length > 0) {
                    doc.setFontSize(10);
                    setPdfFont('normal');
                    const skillsText = category.items.join(', ');
                    addText(skillsText);
                }
                yPos += 3;
            });
        }

        if (selectedSections.has('education') && langData.education && langData.education.items) {
            yPos = addSection(langData.education.title || 'Education', '');
            langData.education.items.forEach(edu => {
                doc.setFontSize(12);
                setPdfFont('bold');
                doc.setTextColor(0, 0, 0);
                doc.text(preparePdfText(edu.degree || ''), margin, yPos);
                yPos += 6;

                doc.setFontSize(10);
                setPdfFont('normal');
                doc.text(preparePdfText(edu.institution || ''), margin, yPos);
                yPos += 5;

                if (edu.period) {
                    doc.setFontSize(9);
                    doc.setTextColor(100, 100, 100);
                    doc.text(preparePdfText(edu.period), margin, yPos);
                    yPos += 5;
                }

                if (edu.description) {
                    doc.setFontSize(9);
                    doc.setTextColor(0, 0, 0);
                    addText(edu.description);
                }
                yPos += 5;
            });
        }

        if (selectedSections.has('contacts') && langData.contacts && langData.contacts.links) {
            yPos = addSection(langData.contacts.title || 'Contact', '');
            langData.contacts.links.forEach(link => {
                doc.setFontSize(10);
                setPdfFont('normal');
                doc.setTextColor(0, 0, 0);
                doc.text(preparePdfText(`${link.name}: ${link.url}`), margin, yPos);
                yPos += 6;
            });
        }

        const fileName = `CV_${langData.hero.name?.replace(/\s+/g, '_') || 'Resume'}_${this.currentLanguage}.pdf`;
        doc.save(fileName);
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
        if (this.exportPdfButton) {
            this.exportPdfButton.addEventListener('click', () => {
                this.openExportSectionsModal();
            });
        }

        if (this.exportSectionsCancel) {
            this.exportSectionsCancel.addEventListener('click', () => {
                this.closeExportSectionsModal();
            });
        }

        if (this.exportSectionsConfirm) {
            this.exportSectionsConfirm.addEventListener('click', async () => {
                const selectedSections = this.getSelectedExportSections();
                this.closeExportSectionsModal();
                await this.exportToPDF(selectedSections);
            });
        }

        if (this.exportSectionsModal) {
            this.exportSectionsModal.addEventListener('click', (event) => {
                const target = event.target;
                if (target instanceof HTMLElement && target.getAttribute('data-close-export-modal') === 'true') {
                    this.closeExportSectionsModal();
                }
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.exportSectionsModal && !this.exportSectionsModal.classList.contains('hidden')) {
                this.closeExportSectionsModal();
            }
        });
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

        const pauseButton = document.getElementById('pause-time-button');
        if (pauseButton) {
            pauseButton.classList.remove('hidden');
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

        const pauseButton = document.getElementById('pause-time-button');
        if (pauseButton) {
            pauseButton.classList.add('hidden');
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

