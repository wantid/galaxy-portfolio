import { marked } from 'marked';

export class Modal {
    constructor() {
        this.modalElement = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalDates = document.getElementById('modal-dates');
        this.tabButtons = document.getElementById('tab-buttons');
        this.tabContent = document.getElementById('tab-content');
        this.currentPlanet = null;
        this.currentTabIndex = 0;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const closeButton = document.querySelector('.modal-close');
        closeButton.addEventListener('click', () => this.hide());
        
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.hide();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modalElement.classList.contains('hidden')) {
                this.hide();
            }
        });
    }

    async show(planetData) {
        this.currentPlanet = planetData;
        this.currentTabIndex = 0;
        
        this.modalTitle.textContent = planetData.name;
        
        if (planetData.startDate) {
            const startDate = new Date(planetData.startDate);
            const endDate = planetData.endDate ? new Date(planetData.endDate) : null;
            const dateFormat = { year: 'numeric', month: 'long', day: 'numeric' };
            const startStr = startDate.toLocaleDateString('en-US', dateFormat);
            const endStr = endDate
                ? endDate.toLocaleDateString('en-US', dateFormat)
                : 'present';
            this.modalDates.textContent = `${startStr} – ${endStr}`;
            this.modalDates.style.display = '';
        } else if (planetData.dateLabel) {
            this.modalDates.textContent = planetData.dateLabel;
            this.modalDates.style.display = '';
        } else {
            this.modalDates.textContent = '';
            this.modalDates.style.display = 'none';
        }
        
        this.createTabs(planetData.tabs);
        
        this.modalElement.classList.remove('hidden');
        
        if (planetData.tabs && planetData.tabs.length > 0) {
            await this.loadTab(0);
        }
    }

    createTabs(tabs) {
        this.tabButtons.innerHTML = '';
        
        if (!tabs || tabs.length === 0) {
            return;
        }
        
        tabs.forEach((tab, index) => {
            const button = document.createElement('button');
            button.className = 'tab-button';
            button.textContent = tab.title;
            if (index === 0) {
                button.classList.add('active');
            }
            button.addEventListener('click', () => this.switchTab(index));
            this.tabButtons.appendChild(button);
        });
    }

    async switchTab(index) {
        this.currentTabIndex = index;
        
        const buttons = this.tabButtons.querySelectorAll('.tab-button');
        buttons.forEach((btn, i) => {
            if (i === index) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        await this.loadTab(index);
    }

    async loadTab(index) {
        if (!this.currentPlanet || !this.currentPlanet.tabs || !this.currentPlanet.tabs[index]) {
            return;
        }
        
        const tab = this.currentPlanet.tabs[index];
        
        const currentHeight = this.tabContent.offsetHeight;
        this.tabContent.style.minHeight = currentHeight + 'px';
        
        this.tabContent.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
        
        const startTime = Date.now();
        
        try {
            const response = await fetch(tab.content);
            if (!response.ok) {
                throw new Error(`Failed to load content: ${response.statusText}`);
            }
            
            let content = await response.text();
            
            content = marked.parse(content);
            content = this.processMedia(content);
            
            const elapsed = Date.now() - startTime;
            if (elapsed < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
            }
            
            this.tabContent.innerHTML = content;
            this.tabContent.style.minHeight = '';
        } catch (error) {
            console.error('Error loading tab content:', error);
            
            const elapsed = Date.now() - startTime;
            if (elapsed < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
            }
            
            this.tabContent.innerHTML = `<p style="color: #ff6b6b;">Failed to load content: ${error.message}</p>`;
            this.tabContent.style.minHeight = '';
        }
    }

    processMedia(content) {
        content = content.replace(
            /!\[([^\]]*)\]\(([^)]+\.webp)\)/g,
            '<img src="$2" alt="$1" />'
        );
        
        content = content.replace(
            /\[video\]\(([^)]+\.webp)\)/g,
            '<video controls><source src="$1" type="video/webp"></video>'
        );
        
        content = content.replace(
            /!\[([^\]]*)\]\(([^)]+)\)/g,
            '<img src="$2" alt="$1" />'
        );
        
        return content;
    }

    hide() {
        this.modalElement.classList.add('hidden');
        this.currentPlanet = null;
        this.tabContent.innerHTML = '';
    }
}

