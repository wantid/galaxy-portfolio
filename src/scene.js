import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Scene3D {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.planets = [];
        this.sun = null;
        this.labelsLayer = null;
        this.starfield = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onPlanetClick = null;
        
        this.init();
        this.createLabelLayer();
        this.createStarfield();
        this.setupLights();
        this.createSun();
        this.setupControls();
        this.animate();
        this.setupEventListeners();
    }

    init() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 20, 50);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('canvas'),
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1);
        
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.renderer.toneMapping = THREE.NoToneMapping;
        this.renderer.physicallyCorrectLights = false;

        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }

    setupLights() {
        const sunLight = new THREE.PointLight(0xfff7dc, 100, 0);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 1000;
        sunLight.shadow.bias = -0.0005;
        sunLight.shadow.radius = 0;
        this.scene.add(sunLight);
        this.sunLight = sunLight;
        
        const ambient = new THREE.AmbientLight(0x030305, 0.01);
        this.scene.add(ambient);
    }

    createSun() {
        const geometry = new THREE.SphereGeometry(3, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffaa
        });
        this.sun = new THREE.Mesh(geometry, material);
        this.sun.castShadow = false;
        this.sun.receiveShadow = false;
        
        const glowGeometry = new THREE.SphereGeometry(3.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(glow);
        
        this.scene.add(this.sun);
    }

    createLabelLayer() {
        if (this.labelsLayer) return;
        const layer = document.createElement('div');
        layer.id = 'labels-layer';
        this.container.appendChild(layer);
        this.labelsLayer = layer;
    }

    createStarfield() {
        const starCount = 500;
        const radiusMin = 150;
        const radiusMax = 400;
        const positions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
            const x = Math.sin(phi) * Math.cos(theta) * radius;
            const y = Math.cos(phi) * radius;
            const z = Math.sin(phi) * Math.sin(theta) * radius;
            const idx = i * 3;
            positions[idx] = x;
            positions[idx + 1] = y;
            positions[idx + 2] = z;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.2,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9,
            depthWrite: false
        });

        this.starfield = new THREE.Points(geometry, material);
        this.starfield.frustumCulled = false;
        this.scene.add(this.starfield);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 200;
        this.controls.enablePan = true;
    }

    addPlanet(planetData, index, totalPlanets) {
        const planet = new Planet3D(planetData, index, totalPlanets);
        this.scene.add(planet.orbitGroup);
        this.planets.push(planet);
        return planet;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        if (this.sun) {
            this.sun.rotation.y += 0.005;
        }

        if (this.starfield) {
            this.starfield.rotation.y += 0.0002;
        }

        this.planets.forEach(planet => {
            planet.update();
        });

        this.renderer.render(this.scene, this.camera);
    }

    setupEventListeners() {
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        const isModalOpen = () => {
            const modal = document.getElementById('modal');
            return modal && !modal.classList.contains('hidden');
        };

        const handleClick = (clientX, clientY) => {
            if (isModalOpen()) return;
            
            this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const allMeshes = [];
            this.planets.forEach(planet => {
                allMeshes.push(planet.mesh);
                planet.mesh.children.forEach(child => {
                    if (child instanceof THREE.Mesh) {
                        allMeshes.push(child);
                    }
                });
            });
            
            const intersects = this.raycaster.intersectObjects(allMeshes, true);

            if (intersects.length > 0 && this.onPlanetClick) {
                let clickedMesh = intersects[0].object;
                while (clickedMesh && clickedMesh.parent) {
                    const planet = this.planets.find(p => p.mesh === clickedMesh);
                    if (planet) {
                        this.onPlanetClick(planet.data);
                        return;
                    }
                    clickedMesh = clickedMesh.parent;
                }
            }
        };

        window.addEventListener('click', (event) => {
            handleClick(event.clientX, event.clientY);
        });

        window.addEventListener('touchend', (event) => {
            if (event.changedTouches.length > 0) {
                const touch = event.changedTouches[0];
                handleClick(touch.clientX, touch.clientY);
            }
        });
    }
}

class Planet3D {
    constructor(data, index, totalPlanets) {
        this.data = data;
        this.index = index;
        
        const startDate = new Date(data.startDate);
        const endDate = data.endDate ? new Date(data.endDate) : new Date();
        const duration = endDate - startDate;
        const maxDuration = 365 * 24 * 60 * 60 * 1000;
        
        this.orbitRadius = data.orbitRadius !== undefined 
            ? data.orbitRadius 
            : 12 + index * 6;
        
        const normalizedDuration = Math.min(duration / maxDuration, 1);
        this.rotationSpeed = data.rotationSpeed !== undefined
            ? data.rotationSpeed
            : 0.001 / (normalizedDuration + 0.1);
        
        this.angle = (index / totalPlanets) * Math.PI * 2;
        
        this.orbitGroup = new THREE.Group();
        
        const size = data.size !== undefined
            ? data.size
            : 1.5 + normalizedDuration * 1;
        const geometry = new THREE.SphereGeometry(size, 48, 48);
        
        const planetColor = this.getPlanetColor(data);
        const material = new THREE.MeshPhongMaterial({
            color: planetColor,
            emissive: 0x000000,
            shininess: 8,
            specular: 0x222222,
            flatShading: false
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.userData = { planetData: data };
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        const glowGeometry = new THREE.SphereGeometry(size * 1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.getPlanetColor(data),
            transparent: true,
            opacity: 0.1
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glow.castShadow = false;
        this.glow.receiveShadow = false;
        this.mesh.add(this.glow);
        
        this.updatePosition();
        this.orbitGroup.add(this.mesh);
        
        this.createOrbit();
    }

    getPlanetColor(data) {
        if (data.color) {
            return new THREE.Color(data.color);
        }
        
        let hash = 0;
        for (let i = 0; i < data.name.length; i++) {
            hash = data.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = (hash % 360 + 360) % 360;
        return new THREE.Color().setHSL(hue / 360, 0.7, 0.5);
    }

    createOrbit() {
        const points = [];
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(
                new THREE.Vector3(
                    Math.cos(angle) * this.orbitRadius,
                    0,
                    Math.sin(angle) * this.orbitRadius
                )
            );
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.2
        });
        const orbit = new THREE.Line(geometry, material);
        this.orbitGroup.add(orbit);
    }

    updatePosition() {
        this.mesh.position.x = Math.cos(this.angle) * this.orbitRadius;
        this.mesh.position.z = Math.sin(this.angle) * this.orbitRadius;
        this.mesh.position.y = 0;
    }

    update() {
        this.angle += this.rotationSpeed;
        this.updatePosition();
        this.mesh.rotation.y += 0.02;
    }
}

