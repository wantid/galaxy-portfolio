import { Scene3D } from './scene.js';
import { PlanetLabel } from './planet.js';
import { Modal } from './modal.js';
import planetsData from './data/planets.json';
import globalTabsData from './data/tabs.json';

class App {
    constructor() {
        this.scene3D = null;
        this.planets = [];
        this.planetLabels = [];
        this.modal = new Modal();
        this.globalTabsElement = document.getElementById('global-tabs');
        this.init();
    }

    init() {
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
            
            const label = new PlanetLabel(planetData, planet.mesh, this.scene3D);
            this.planetLabels.push(label);
        });
        
        this.scene3D.onPlanetClick = (planetData) => {
            this.modal.show(planetData);
        };
        
        this.updateLabels();

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
            if (tab.type === 'link' && tab.href) {
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

    updateLabels() {
        requestAnimationFrame(() => this.updateLabels());
        this.planetLabels.forEach(label => label.update());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});

