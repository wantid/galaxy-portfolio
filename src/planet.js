import * as THREE from 'three';

export class PlanetLabel {
    constructor(planetData, planetMesh, scene3D) {
        this.data = planetData;
        this.planetMesh = planetMesh;
        this.scene3D = scene3D;
        this.labelElement = null;
        this.createLabel();
    }

    createLabel() {
        const label = document.createElement('div');
        label.className = 'planet-label';
        
        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = this.data.name;
        
        const date = document.createElement('div');
        date.className = 'date';
        const startDate = new Date(this.data.startDate);
        const endDate = this.data.endDate ? new Date(this.data.endDate) : null;
        const dateFormat = { year: 'numeric', month: 'short' };
        const startStr = startDate.toLocaleDateString('en-US', dateFormat);
        const endStr = endDate
            ? endDate.toLocaleDateString('en-US', dateFormat)
            : 'present';
        date.textContent = `${startStr} – ${endStr}`;
        
        label.appendChild(name);
        label.appendChild(date);
        if (this.scene3D.labelsLayer) {
            this.scene3D.labelsLayer.appendChild(label);
        } else {
            document.body.appendChild(label);
        }
        
        this.labelElement = label;
        this.updatePosition();
    }

    updatePosition() {
        if (!this.labelElement || !this.planetMesh) return;
        
        const vector = new THREE.Vector3();
        this.planetMesh.getWorldPosition(vector);
        vector.project(this.scene3D.camera);
        
        const rawX = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const rawY = (vector.y * -0.5 + 0.5) * window.innerHeight;

        const isBehindCamera = vector.z > 1 || vector.z < -1;
        const outOfBounds =
            rawX < 0 ||
            rawX > window.innerWidth ||
            rawY < 0 ||
            rawY > window.innerHeight;

        if (isBehindCamera || outOfBounds) {
            this.labelElement.style.opacity = '0';
            return;
        }

        this.labelElement.style.opacity = '1';
        this.labelElement.style.left = `${rawX}px`;
        this.labelElement.style.top = `${rawY}px`;
    }

    update() {
        this.updatePosition();
    }

    destroy() {
        if (this.labelElement) {
            this.labelElement.remove();
        }
    }
}

