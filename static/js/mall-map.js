/**
 * Interactive Mall Map System
 * Handles floor navigation, stall rendering, and user interactions
 */

// Configuration - Easy to modify variables
const MAP_CONFIG = {
    // Grid dimensions
    GRID_WIDTH: 30,           // Number of blocks across each street
    FLOOR_COUNT: 5,          // Total number of floors
    
    // Visual settings
    STALL_WIDTH: 60,         // Default stall width in pixels
    STALL_HEIGHT: 40,        // Default stall height in pixels
    STREET_WIDTH: 80,        // Width of streets between stall rows
    
    // Colors
    OCCUPIED_COLOR: '#4a90e2',     // Color for occupied stalls
    VACANT_COLOR: '#cccccc',       // Color for vacant stalls
    SELECTED_COLOR: '#f39c12',     // Color for selected stall
    STREET_COLOR: '#2c3e50',       // Color for street areas
    
    // Animation
    TRANSITION_SPEED: 300,         // Floor transition speed in ms
    HOVER_SCALE: 1.05,            // Scale factor on hover
    
    // Floor colors (for visual distinction)
    FLOOR_COLORS: [
        '#e8f4fd',  // Floor 1 - Light blue
        '#fff2e8',  // Floor 2 - Light orange
        '#f0fff0',  // Floor 3 - Light green
        '#fff0f5',  // Floor 4 - Light pink
        '#f5f0ff'   // Floor 5 - Light purple
    ]
};

// Street configuration
const STREETS = [
    { name: 'Wall Street', id: 'wall-street' },
    { name: 'Artist Alley', id: 'artist-alley' },
    { name: 'Woke Ave', id: 'woke-ave' },
    { name: 'Five', id: 'five' },
    { name: 'Poland Street', id: 'poland-street' }
];

// Stall size variations
const STALL_SIZES = {
    small: { width: 40, height: 30, class: 'small' },
    medium: { width: 60, height: 40, class: 'medium' },
    large: { width: 80, height: 50, class: 'large' },
    xlarge: { width: 100, height: 60, class: 'xlarge' }
};

// Global state
let currentFloor = 1;
let stallData = {};
let selectedStall = null;

// DOM elements
let mapContainer;
let floorButtons;
let modal;
let currentFloorNumber;
let stallCount;

/**
 * Initialize the mall map system
 */
function initializeMallMap() {
    // Get DOM elements
    mapContainer = document.getElementById('mall-map');
    floorButtons = document.querySelectorAll('.floor-btn');
    modal = document.getElementById('stall-modal');
    currentFloorNumber = document.getElementById('current-floor-number');
    stallCount = document.getElementById('stall-count');

    // Set up event listeners
    setupEventListeners();
    
    // Load initial floor
    switchFloor(1);
    
    console.log('Mall map initialized');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Floor button clicks
    floorButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const floor = parseInt(e.currentTarget.dataset.floor);
            switchFloor(floor);
        });
    });

    // Modal close events
    const modalClose = document.getElementById('modal-close');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const visitStallBtn = document.getElementById('visit-stall-btn');

    modalClose?.addEventListener('click', closeModal);
    closeModalBtn?.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Visit stall button
    visitStallBtn?.addEventListener('click', () => {
        if (selectedStall) {
            const url = `/stall/the-mall/${encodeURIComponent(selectedStall.StreetName)}/${selectedStall.StallNumber}`;
            window.open(url, '_blank');
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
        
        // Floor navigation with number keys
        if (e.key >= '1' && e.key <= '5') {
            const floor = parseInt(e.key);
            switchFloor(floor);
        }
    });
}

/**
 * Switch to a different floor
 * @param {number} floorNumber - Floor to switch to (1-5)
 */
async function switchFloor(floorNumber) {
    if (floorNumber < 1 || floorNumber > MAP_CONFIG.FLOOR_COUNT) {
        console.error('Invalid floor number:', floorNumber);
        return;
    }

    currentFloor = floorNumber;
    
    // Update UI
    updateFloorButtons(floorNumber);
    updateFloorInfo(floorNumber);
    
    // Load and render floor
    try {
        await loadStallData(floorNumber);
        renderFloorMap(floorNumber);
    } catch (error) {
        console.error('Error switching floor:', error);
        showError('Failed to load floor data');
    }
}

/**
 * Update floor button states
 * @param {number} activeFloor - Currently active floor
 */
function updateFloorButtons(activeFloor) {
    floorButtons.forEach(button => {
        const floor = parseInt(button.dataset.floor);
        button.classList.toggle('active', floor === activeFloor);
    });
}

/**
 * Update floor information display
 * @param {number} floorNumber - Current floor number
 */
function updateFloorInfo(floorNumber) {
    if (currentFloorNumber) {
        currentFloorNumber.textContent = floorNumber;
    }
    
    // Update map background color
    mapContainer.className = `mall-map floor-${floorNumber}`;
}

/**
 * Load stall data for a specific floor
 * @param {number} floorNumber - Floor to load data for
 */
async function loadStallData(floorNumber) {
    try {
        // Show loading state
        if (stallCount) {
            stallCount.textContent = 'Loading stalls...';
        }

        const response = await fetch('/api/the-mall');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch stall data');
        }

        // Filter stalls for the current floor
        const floorStalls = data.shops.filter(stall => {
            const stallNumber = stall.StallNumber.toString();
            const stallFloor = parseInt(stallNumber.charAt(0));
            return stallFloor === floorNumber;
        });

        // Cache the data
        stallData[floorNumber] = floorStalls;
        
        // Update stall count
        if (stallCount) {
            stallCount.textContent = `${floorStalls.length} stalls on this floor`;
        }

        console.log(`Loaded ${floorStalls.length} stalls for floor ${floorNumber}`);
        
    } catch (error) {
        console.error('Error loading stall data:', error);
        stallData[floorNumber] = [];
        
        if (stallCount) {
            stallCount.textContent = 'Error loading stalls';
        }
        
        throw error;
    }
}

/**
 * Render the map for a specific floor
 * @param {number} floorNumber - Floor to render
 */
function renderFloorMap(floorNumber) {
    const floorStalls = stallData[floorNumber] || [];
    
    // Clear existing map
    mapContainer.innerHTML = '';
    
    // Create map grid
    const mapGrid = document.createElement('div');
    mapGrid.className = 'map-grid';
    
    // Create grid layout: 6 rows (5 streets + main street), 10 columns (9 blocks + main street)
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 10; col++) {
            const gridItem = document.createElement('div');
            
            if (col === 9) {
                // Main Street (vertical)
                gridItem.className = 'main-street';
            } else if (row === 5) {
                // Bottom spacing
                gridItem.className = 'street';
            } else {
                // Stall position
                const streetIndex = row;
                const stallPosition = col + 1;
                const stallNumber = `${floorNumber}${stallPosition.toString().padStart(2, '0')}`;
                
                // Find stall data
                const stall = floorStalls.find(s => 
                    s.StallNumber === stallNumber && 
                    s.StreetName === STREETS[streetIndex].name
                );
                
                if (stall) {
                    gridItem.className = 'stall occupied';
                    gridItem.textContent = stallNumber;
                    gridItem.dataset.stallNumber = stallNumber;
                    gridItem.dataset.streetName = stall.StreetName;
                    
                    // Add click handler
                    gridItem.addEventListener('click', () => showStallDetails(stall));
                    
                    // Add size class based on stall data (you can enhance this logic)
                    const sizeClass = getStallSizeClass(stall);
                    gridItem.classList.add(sizeClass);
                    
                } else {
                    gridItem.className = 'stall vacant';
                    gridItem.textContent = stallNumber;
                    gridItem.title = 'Vacant stall';
                }
            }
            
            mapGrid.appendChild(gridItem);
        }
    }
    
    mapContainer.appendChild(mapGrid);
    
    // Add entrance/exit indicators (you can enhance this)
    addMapFeatures(mapContainer);
}

/**
 * Determine stall size class based on stall data
 * @param {Object} stall - Stall data
 * @returns {string} Size class name
 */
function getStallSizeClass(stall) {
    // Simple logic - you can enhance this based on your needs
    if (!stall.ItemsSold || stall.ItemsSold.length < 10) {
        return STALL_SIZES.small.class;
    } else if (stall.ItemsSold.length < 30) {
        return STALL_SIZES.medium.class;
    } else if (stall.ItemsSold.length < 60) {
        return STALL_SIZES.large.class;
    } else {
        return STALL_SIZES.xlarge.class;
    }
}

/**
 * Add additional map features like entrances, elevators, etc.
 * @param {HTMLElement} container - Map container
 */
function addMapFeatures(container) {
    // You can add special features here like:
    // - Elevators
    // - Entrances/Exits
    // - Information desks
    // - Restrooms
    // etc.
}

/**
 * Show details for a selected stall
 * @param {Object} stall - Stall data
 */
function showStallDetails(stall) {
    selectedStall = stall;
    
    // Update modal content
    document.getElementById('modal-stall-name').textContent = stall.StallName || 'Unnamed Stall';
    document.getElementById('modal-stall-number').textContent = `Stall ${stall.StallNumber}`;
    document.getElementById('modal-street-name').textContent = stall.StreetName;
    document.getElementById('modal-owner').textContent = stall.IGN || 'Unknown';
    document.getElementById('modal-items').textContent = stall.ItemsSold || 'No items listed';
    
    // Highlight selected stall
    document.querySelectorAll('.stall.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    const stallElement = document.querySelector(`[data-stall-number="${stall.StallNumber}"][data-street-name="${stall.StreetName}"]`);
    if (stallElement) {
        stallElement.classList.add('selected');
    }
    
    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Close the stall details modal
 */
function closeModal() {
    modal.classList.add('hidden');
    selectedStall = null;
    
    // Remove selection highlighting
    document.querySelectorAll('.stall.selected').forEach(el => {
        el.classList.remove('selected');
    });
}

/**
 * Show error message to user
 * @param {string} message - Error message
 */
function showError(message) {
    // Simple error display - you can enhance this
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 1rem;
        border-radius: 6px;
        z-index: 1001;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        document.body.removeChild(errorDiv);
    }, 5000);
}

/**
 * Search for stalls (future enhancement)
 * @param {string} query - Search query
 */
function searchStalls(query) {
    // Implementation for search functionality
    // This can be added later as an enhancement
}

/**
 * Filter stalls by criteria (future enhancement)
 * @param {Object} filters - Filter criteria
 */
function filterStalls(filters) {
    // Implementation for filtering functionality
    // This can be added later as an enhancement
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeMallMap);

// Export functions for external use
window.MallMap = {
    switchFloor,
    showStallDetails,
    closeModal,
    searchStalls,
    filterStalls
};
