/**
 * Animated Cube Background System
 * A physics-based cube animation for the navbar background
 * 
 * PARAMETERS - Easy to modify:
 */

const CUBE_CONFIG = {
    // Spawn settings
    SPAWN_RATE: 5,                    // Cubes per second (higher = more cubes)
    MAX_CUBES: 100,                      // Maximum cubes on screen
    
    // Movement physics
    BASE_SPEED: 100,                     // Base leftward movement speed (pixels/second)
    SPEED_VARIATION: 80,                // Random speed variation (+/- pixels/second)
    GRAVITY: 0.2,                        // Downward acceleration
    BOUNCE_DAMPENING: 0.7,              // Energy loss on collision (0-1)
    
    // Cube properties
    SIZE_DISTRIBUTION: {
        'small': 0.4,                   // 40% small cubes
        'medium': 0.35,                 // 35% medium cubes
        'large': 0.2,                   // 20% large cubes
        'xlarge': 0.05                  // 5% extra large cubes
    },
    
    // Rainbow color system
    RAINBOW_COLORS: [
        'rgba(255, 99, 132, 0.6)',      // Pink/Red - more saturated
        'rgba(255, 159, 64, 0.6)',      // Orange - more saturated
        'rgba(255, 205, 86, 0.6)',      // Yellow - more saturated
        'rgba(75, 192, 192, 0.6)',      // Cyan - more saturated
        'rgba(54, 162, 235, 0.6)',      // Blue - more saturated
        'rgba(153, 102, 255, 0.6)',     // Purple - more saturated
        'rgba(255, 20, 147, 0.6)',      // Deep Pink - more saturated
        'rgba(50, 205, 50, 0.6)',       // Lime Green - more saturated
        'rgba(255, 69, 0, 0.6)',        // Red Orange - more saturated
        'rgba(138, 43, 226, 0.6)'       // Blue Violet - more saturated
    ],
    
    RAINBOW_BORDER_COLORS: [
        'rgba(255, 99, 132, 0.8)',      // Pink/Red border - more saturated
        'rgba(255, 159, 64, 0.8)',      // Orange border - more saturated
        'rgba(255, 205, 86, 0.8)',      // Yellow border - more saturated
        'rgba(75, 192, 192, 0.8)',      // Cyan border - more saturated
        'rgba(54, 162, 235, 0.8)',      // Blue border - more saturated
        'rgba(153, 102, 255, 0.8)',     // Purple border - more saturated
        'rgba(255, 20, 147, 0.8)',      // Deep Pink border - more saturated
        'rgba(50, 205, 50, 0.8)',       // Lime Green border - more saturated
        'rgba(255, 69, 0, 0.8)',        // Red Orange border - more saturated
        'rgba(138, 43, 226, 0.8)'       // Blue Violet border - more saturated
    ],
    
    // Collision detection
    COLLISION_THRESHOLD: 5,             // Minimum distance for collision detection
    COLLISION_RESPONSE: 0.05,           // Collision bounce force multiplier (much lower!)
    INTERACTION_CHANCE: 0.3,            // Probability cubes will interact (30% interact, 70% pass by)
    
    // Visual effects
    ROTATION_CHANCE: 0.7,               // Probability a cube will rotate (0-1)
    COLLISION_FLASH_DURATION: 300,     // Collision flash effect duration (ms)
    
    // Layering (spaceship window effect)
    LAYER_COUNT: 3,                     // Number of depth layers
    LAYER_SPEED_MULTIPLIERS: [0.3, 1.0, 1.8], // Speed multipliers for each layer (back to front)
    LAYER_OPACITY_MULTIPLIERS: [0.15, 0.25, 0.35], // Opacity multipliers for depth effect
    
    // Container bounds
    CONTAINER_SELECTOR: '.navbar'       // CSS selector for the container
};

class FloatingCube {
    constructor(container) {
        this.container = container;
        this.element = this.createElement();
        this.setupPhysics();
        this.setupVisuals();
        container.querySelector('.cube-background').appendChild(this.element);
    }
    
    createElement() {
        const cube = document.createElement('div');
        cube.className = 'floating-cube';
        return cube;
    }
    
    setupPhysics() {
        const containerRect = this.container.getBoundingClientRect();
        
        // Random size
        const sizes = Object.keys(CUBE_CONFIG.SIZE_DISTRIBUTION);
        const random = Math.random();
        let cumulative = 0;
        let selectedSize = sizes[0];
        
        for (const [size, probability] of Object.entries(CUBE_CONFIG.SIZE_DISTRIBUTION)) {
            cumulative += probability;
            if (random <= cumulative) {
                selectedSize = size;
                break;
            }
        }
        
        this.element.classList.add(`size-${selectedSize}`);
        this.size = this.getSizeValue(selectedSize);
        
        // Assign depth layer (0 = back, higher = front)
        this.layer = Math.floor(Math.random() * CUBE_CONFIG.LAYER_COUNT);
        this.speedMultiplier = CUBE_CONFIG.LAYER_SPEED_MULTIPLIERS[this.layer];
        this.opacityMultiplier = CUBE_CONFIG.LAYER_OPACITY_MULTIPLIERS[this.layer];
        
        // Determine if this cube can interact with others
        this.canInteract = Math.random() < CUBE_CONFIG.INTERACTION_CHANCE;
        
        // Starting position (right side, random Y)
        this.x = containerRect.width + this.size;
        this.y = Math.random() * (containerRect.height - this.size);
        
        // Physics properties
        this.vx = -(CUBE_CONFIG.BASE_SPEED + (Math.random() - 0.5) * CUBE_CONFIG.SPEED_VARIATION) * this.speedMultiplier;
        this.vy = (Math.random() - 0.5) * 20; // Small random vertical velocity
        this.mass = this.size / 10; // Mass based on size
        
        // Apply layer styling
        this.element.style.opacity = this.opacityMultiplier;
        this.element.style.zIndex = this.layer;
        
        this.updatePosition();
    }
    
    setupVisuals() {
        // Random rotation
        if (Math.random() < CUBE_CONFIG.ROTATION_CHANCE) {
            const rotationSpeeds = ['slow', 'medium', 'fast'];
            const rotationSpeed = rotationSpeeds[Math.floor(Math.random() * rotationSpeeds.length)];
            this.element.classList.add(`rotate-${rotationSpeed}`);
        }
        
        // Random rainbow color
        const colorIndex = Math.floor(Math.random() * CUBE_CONFIG.RAINBOW_COLORS.length);
        this.baseColor = CUBE_CONFIG.RAINBOW_COLORS[colorIndex];
        this.borderColor = CUBE_CONFIG.RAINBOW_BORDER_COLORS[colorIndex];
        
        // Apply the random color
        this.element.style.backgroundColor = this.baseColor;
        this.element.style.borderColor = this.borderColor;
        this.element.style.boxShadow = `
            inset 0 0 0 1px ${this.borderColor.replace('0.5', '0.3')},
            0 0 10px ${this.baseColor.replace('0.3', '0.1')}
        `;
    }
    
    getSizeValue(sizeClass) {
        const sizeMap = {
            'small': 12,
            'medium': 20,
            'large': 32,
            'xlarge': 48
        };
        return sizeMap[sizeClass] || 20;
    }
    
    update(deltaTime, otherCubes) {
        const containerRect = this.container.getBoundingClientRect();
        
        // Apply physics
        this.vy += CUBE_CONFIG.GRAVITY * deltaTime;
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Boundary collisions
        if (this.y <= 0) {
            this.y = 0;
            this.vy = Math.abs(this.vy) * CUBE_CONFIG.BOUNCE_DAMPENING;
        }
        
        if (this.y >= containerRect.height - this.size) {
            this.y = containerRect.height - this.size;
            this.vy = -Math.abs(this.vy) * CUBE_CONFIG.BOUNCE_DAMPENING;
        }
        
        // Check collisions with other cubes
        this.checkCollisions(otherCubes);
        
        this.updatePosition();
        
        // Remove if off-screen
        return this.x > -this.size;
    }
    
    checkCollisions(otherCubes) {
        // Only interact with cubes that can interact and are on the same layer
        for (const other of otherCubes) {
            if (other === this) continue;
            if (!this.canInteract || !other.canInteract) continue;
            if (Math.abs(this.layer - other.layer) > 0) continue; // Only same layer interactions
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (this.size + other.size) / 2 + CUBE_CONFIG.COLLISION_THRESHOLD;
            
            if (distance < minDistance && distance > 0) {
                this.handleCollision(other, dx, dy, distance);
            }
        }
    }
    
    handleCollision(other, dx, dy, distance) {
        // Collision response
        const overlap = ((this.size + other.size) / 2) - distance;
        const separationX = (dx / distance) * overlap * 0.5;
        const separationY = (dy / distance) * overlap * 0.5;
        
        // Separate cubes
        this.x += separationX;
        this.y += separationY;
        other.x -= separationX;
        other.y -= separationY;
        
        // Velocity exchange (simplified elastic collision)
        const relativeVelocityX = this.vx - other.vx;
        const relativeVelocityY = this.vy - other.vy;
        
        const speed = Math.sqrt(relativeVelocityX * relativeVelocityX + relativeVelocityY * relativeVelocityY);
        
        if (speed > 0) {
            const normalX = dx / distance;
            const normalY = dy / distance;
            
            const impulse = 2 * speed * CUBE_CONFIG.COLLISION_RESPONSE / (this.mass + other.mass);
            
            this.vx += impulse * other.mass * normalX;
            this.vy += impulse * other.mass * normalY;
            other.vx -= impulse * this.mass * normalX;
            other.vy -= impulse * this.mass * normalY;
            
            // Visual collision effect
            this.showCollisionEffect();
            other.showCollisionEffect();
        }
    }
    
    showCollisionEffect() {
        // Store original colors
        const originalBackground = this.element.style.backgroundColor;
        const originalBorder = this.element.style.borderColor;
        
        // Flash to white
        this.element.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        this.element.style.borderColor = 'rgba(255, 255, 255, 1)';
        this.element.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            // Return to original colors
            this.element.style.backgroundColor = originalBackground;
            this.element.style.borderColor = originalBorder;
            this.element.style.transform = 'scale(1)';
        }, CUBE_CONFIG.COLLISION_FLASH_DURATION);
    }
    
    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }
    
    destroy() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

class CubeAnimationSystem {
    constructor() {
        this.container = document.querySelector(CUBE_CONFIG.CONTAINER_SELECTOR);
        if (!this.container) return;
        
        this.cubes = [];
        this.lastTime = 0;
        this.spawnTimer = 0;
        
        this.setupContainer();
        this.start();
    }
    
    setupContainer() {
        // Make container relative if not already
        const computedStyle = window.getComputedStyle(this.container);
        if (computedStyle.position === 'static') {
            this.container.style.position = 'relative';
        }
        
        // Create cube background container
        const cubeBackground = document.createElement('div');
        cubeBackground.className = 'cube-background';
        this.container.appendChild(cubeBackground);
    }
    
    start() {
        this.animate(0);
    }
    
    animate(currentTime) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // Cap at 60fps
        this.lastTime = currentTime;
        
        // Spawn new cubes
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= 1 / CUBE_CONFIG.SPAWN_RATE && this.cubes.length < CUBE_CONFIG.MAX_CUBES) {
            this.cubes.push(new FloatingCube(this.container));
            this.spawnTimer = 0;
        }
        
        // Update existing cubes
        this.cubes = this.cubes.filter(cube => {
            const shouldKeep = cube.update(deltaTime, this.cubes);
            if (!shouldKeep) {
                cube.destroy();
            }
            return shouldKeep;
        });
        
        requestAnimationFrame(this.animate.bind(this));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CubeAnimationSystem();
});

// Export for easy parameter modification
window.CUBE_CONFIG = CUBE_CONFIG;
