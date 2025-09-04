/**
 * Interactive Mall Map System
 * 
 * This file handles the rendering and interaction of the top-down mall map.
 * The map displays stalls positioned according to Minecraft coordinates acro/**
 * Get street configuration by name
 * @param {string} streetName - Name of the street
 * @returns {Object|null} Street configuration object
 */
function getStreetByName(streetName) {
    return MAP_CONFIG.STREETS.find(street => street.name === streetName) || null;
}

/**
 * Get street index by name (legacy function for compatibility)
 * @param {string} streetName - Name of the street
 * @returns {number} Street index or -1 if not found
 */
function getStreetIndex(streetName) {
    const street = getStreetByName(streetName);
    return street ? street.index : -1;
}

/**
 * Get stall count for a specific street section
 * @param {string} streetName - Name of the street
 * @param {boolean} isNorth - True for north side, false for south side
 * @param {boolean} isWest - True for west of Main Street, false for east
 * @returns {number} Number of stalls in that section
 */
function getStallCountForSection(streetName, isNorth, isWest) {
    // Normalize street name for config lookup
    const normalizedStreetName = streetName.replace(/\s+/g, '');
    const sideStr = isNorth ? 'North' : 'South';
    const sectionStr = isWest ? 'West' : 'East';
    const configKey = `${normalizedStreetName}${sideStr}${sectionStr}_StallCount`;
    
    return MAP_CONFIG[configKey] || 0;
}

/* ========================================
   EASY TO CHANGE CONFIGURATION VARIABLES
   ======================================== */

const MAP_CONFIG = {
    // Grid-based configuration (Minecraft blocks)
    GRID_WIDTH: 117,                  // Total grid width in blocks
    GRID_HEIGHT: 102,                 // Total grid height in blocks
    
    // Visual scaling
    BLOCK_SIZE: 8,                    // Pixels per Minecraft block
    
    // Street configuration
    STREET_LENGTH: 117,               // Length of horizontal streets in blocks
    STREET_WIDTH: 3,                  // Width of streets in blocks (visual only) - made wider
    STREET_SEPARATION: 20,            // Distance between horizontal streets in blocks
    
    // Streets layout (Y positions in blocks from top)
    STREETS: [
        { name: "Wall Street", index: 0, yBlock: 10 },      // Northernmost street
        { name: "Artist Alley", index: 1, yBlock: 30 },
        { name: "Woke Ave", index: 2, yBlock: 50 },
        { name: "Poland Street", index: 3, yBlock: 70 },
        { name: "Five", index: -1, yBlock: -1 }             // Not displayed
    ],
    
    // Main Street (vertical)
    MAIN_STREET_X_BLOCK: 55,          // X position where Main Street starts (block)
    MAIN_STREET_WIDTH: 9,             // Width of Main Street in blocks
    
    // Stall configuration
    MAX_STALLS_PER_SIDE: 13,          // Maximum 13 stalls per side of Main Street (fallback)
    DEFAULT_STALL_WIDTH: 4,           // Default stall width in blocks
    DEFAULT_STALL_DEPTH: 4,           // Default stall depth in blocks
    
    // Street-specific stall counts (North/South sides, West/East of Main Street)
    WallStreetNorthWest_StallCount: 6,
    WallStreetNorthEast_StallCount: 6,
    WallStreetSouthWest_StallCount: 6,
    WallStreetSouthEast_StallCount: 6,
    
    ArtistAlleyNorthWest_StallCount: 8,
    ArtistAlleyNorthEast_StallCount: 6,
    ArtistAlleySouthWest_StallCount: 8,
    ArtistAlleySouthEast_StallCount: 6,
    
    WokeAveNorthWest_StallCount: 7,
    WokeAveNorthEast_StallCount: 6,
    WokeAveSouthWest_StallCount: 6,
    WokeAveSouthEast_StallCount: 6,
    
    PolandStreetNorthWest_StallCount: 7,
    PolandStreetNorthEast_StallCount: 6,
    PolandStreetSouthWest_StallCount: 6,
    PolandStreetSouthEast_StallCount: 6,
    
    // Floor configuration
    FLOORS: [1, 2, 3, 4, 5],
    FLOOR_LABELS: {
        1: "First Floor",
        2: "Second Floor", 
        3: "Third Floor",
        4: "Fourth Floor",
        5: "Fifth Floor"
    },
    
    // Visual settings
    SHOW_STALL_NUMBERS: true,         // Show stall numbers on map
    SHOW_STREET_LABELS: true,         // Show street name labels
    ENABLE_HOVER_EFFECTS: true,       // Enable hover animations
    SHOW_GRID: true,                 // Show grid lines for debugging
    
    // Animation settings
    HOVER_SCALE: 1.05,               // Scale factor on hover
    ANIMATION_DURATION: 200,         // MS for hover animations
    
    // Map layout settings
    MAP_MARGIN: 120,                  // Pixels margin around map - increased for better label visibility
    
    // Colors (can override CSS if needed)
    COLORS: {
        OCCUPIED: '#4a90e2',
        VACANT: '#95a5a6',
        STREET: '#34495e',
        MAIN_STREET: '#2c3e50',
        HOVER: '#f39c12'
    }
};

/* ========================================
   GLOBAL STATE
   ======================================== */

let mapData = {
    stalls: [],
    currentFloor: 1,
    isLoading: true
};

let mapElements = {
    mapContainer: null,
    floorButtons: [],
    currentFloorDisplay: null,
    stallCountDisplay: null,
    modal: null
};

/* ========================================
   INITIALIZATION
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    initializeMapElements();
    setupEventListeners();
    loadMapData();
});

function initializeMapElements() {
    mapElements.mapContainer = document.getElementById('mall-map');
    mapElements.floorButtons = document.querySelectorAll('.floor-btn');
    mapElements.currentFloorDisplay = document.getElementById('current-floor-number');
    mapElements.stallCountDisplay = document.getElementById('stall-count');
    mapElements.modal = document.getElementById('stall-modal');
    
    console.log('Map elements initialized');
}

function setupEventListeners() {
    // Floor selector buttons
    mapElements.floorButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const floor = parseInt(e.currentTarget.dataset.floor);
            switchToFloor(floor);
        });
    });
    
    // Modal close handlers
    const modalClose = document.getElementById('modal-close');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // Click outside modal to close
    if (mapElements.modal) {
        mapElements.modal.addEventListener('click', (e) => {
            if (e.target === mapElements.modal) {
                closeModal();
            }
        });
    }
    
    console.log('Event listeners set up');
}

/* ========================================
   DATA LOADING
   ======================================== */

async function loadMapData() {
    try {
        console.log('Loading map data...');
        const response = await fetch('/api/the-mall');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        mapData.stalls = data.shops || [];
        mapData.isLoading = false;
        
        console.log(`Loaded ${mapData.stalls.length} stalls`);
        
        // Initialize map with floor 1
        renderMap();
        updateUI();
        
    } catch (error) {
        console.error('Error loading map data:', error);
        showError('Failed to load map data. Please refresh the page.');
    }
}

function showError(message) {
    if (mapElements.mapContainer) {
        mapElements.mapContainer.innerHTML = `
            <div class="error-indicator">
                <p>⚠️ ${message}</p>
            </div>
        `;
    }
}

/* ========================================
   COORDINATE CALCULATION
   ======================================== */

function parseStallNumber(stallNumber) {
    const stallStr = stallNumber.toString().padStart(3, '0');
    const floor = parseInt(stallStr[0]);
    const position = parseInt(stallStr.slice(1));
    
    return { floor, position };
}

function getStreetIndex(streetName) {
    const street = MAP_CONFIG.STREETS.find(s => s.name === streetName);
    return street ? street.index : 0;
}

/**
 * Calculate stall position using grid-based system with new orientation logic
 * @param {Object} stall - Stall data from database
 * @param {Array} allStalls - All stalls for width calculation
 * @returns {Object|null} Position object with x, y, width, height, anchor info
 */
function calculateStallPosition(stall, allStalls) {
    const { floor, position } = parseStallNumber(stall.StallNumber);
    const street = getStreetByName(stall.StreetName);
    
    // Skip if street is not displayed
    if (!street || street.index === -1) return null;
    
    // Get stall dimensions (in blocks)
    const stallWidthBlocks = stall.stall_width || MAP_CONFIG.DEFAULT_STALL_WIDTH;
    const stallDepthBlocks = stall.stall_depth || MAP_CONFIG.DEFAULT_STALL_DEPTH;
    
    // NEW LOGIC: Determine side using stall number (odd = south, even = north)
    const isNorthSide = position % 2 === 0;
    
    // Determine which section this stall should be in based on available space
    const northWestCount = getStallCountForSection(stall.StreetName, true, true);
    const northEastCount = getStallCountForSection(stall.StreetName, true, false);
    const southWestCount = getStallCountForSection(stall.StreetName, false, true);
    const southEastCount = getStallCountForSection(stall.StreetName, false, false);
    
    // Calculate which position this stall should be in its side
    let isWestOfMainStreet = true;
    let positionInSection = 1;
    
    if (isNorthSide) {
        // For north side stalls, fill west section first, then east
        const northStallsOnSameSide = allStalls.filter(s => {
            const { floor: sFloor, position: sPosition } = parseStallNumber(s.StallNumber);
            return sFloor === floor && 
                   s.StreetName === stall.StreetName && 
                   sPosition % 2 === 0 && // North side
                   sPosition < position; // Lower position numbers
        }).length;
        
        if (northStallsOnSameSide < northWestCount) {
            isWestOfMainStreet = true;
            positionInSection = northStallsOnSameSide + 1;
        } else {
            isWestOfMainStreet = false;
            positionInSection = northStallsOnSameSide - northWestCount + 1;
        }
        
        // Check if this stall exceeds the available space
        if (northStallsOnSameSide >= (northWestCount + northEastCount)) {
            return null; // No space for this stall
        }
    } else {
        // For south side stalls, fill west section first, then east
        const southStallsOnSameSide = allStalls.filter(s => {
            const { floor: sFloor, position: sPosition } = parseStallNumber(s.StallNumber);
            return sFloor === floor && 
                   s.StreetName === stall.StreetName && 
                   sPosition % 2 === 1 && // South side
                   sPosition < position; // Lower position numbers
        }).length;
        
        if (southStallsOnSameSide < southWestCount) {
            isWestOfMainStreet = true;
            positionInSection = southStallsOnSameSide + 1;
        } else {
            isWestOfMainStreet = false;
            positionInSection = southStallsOnSameSide - southWestCount + 1;
        }
        
        // Check if this stall exceeds the available space
        if (southStallsOnSameSide >= (southWestCount + southEastCount)) {
            return null; // No space for this stall
        }
    }
    
    // Calculate cumulative width from previous stalls in the same section
    const sameSection = allStalls.filter(s => {
        const { floor: sFloor, position: sPosition } = parseStallNumber(s.StallNumber);
        const sIsNorthSide = sPosition % 2 === 0;
        
        // Determine which section the comparison stall is in
        let sIsWestOfMainStreet = true;
        if (sIsNorthSide) {
            const sNorthStallsOnSameSide = allStalls.filter(ss => {
                const { floor: ssFloor, position: ssPosition } = parseStallNumber(ss.StallNumber);
                return ssFloor === sFloor && 
                       ss.StreetName === s.StreetName && 
                       ssPosition % 2 === 0 && 
                       ssPosition < sPosition;
            }).length;
            sIsWestOfMainStreet = sNorthStallsOnSameSide < northWestCount;
        } else {
            const sSouthStallsOnSameSide = allStalls.filter(ss => {
                const { floor: ssFloor, position: ssPosition } = parseStallNumber(ss.StallNumber);
                return ssFloor === sFloor && 
                       ss.StreetName === s.StreetName && 
                       ssPosition % 2 === 1 && 
                       ssPosition < sPosition;
            }).length;
            sIsWestOfMainStreet = sSouthStallsOnSameSide < southWestCount;
        }
        
        return sFloor === floor && 
               s.StreetName === stall.StreetName && 
               sIsNorthSide === isNorthSide && 
               sIsWestOfMainStreet === isWestOfMainStreet &&
               sPosition < position;
    });
    
    let cumulativeWidthBlocks = 0;
    sameSection.forEach(prevStall => {
        const prevWidth = prevStall.stall_width || MAP_CONFIG.DEFAULT_STALL_WIDTH;
        cumulativeWidthBlocks += prevWidth;
    });
    
    // Calculate X position in blocks
    let xBlock;
    if (isWestOfMainStreet) {
        xBlock = cumulativeWidthBlocks;
    } else {
        xBlock = MAP_CONFIG.MAIN_STREET_X_BLOCK + MAP_CONFIG.MAIN_STREET_WIDTH + cumulativeWidthBlocks;
    }
    
    // Calculate Y position based on street and side
    let yBlock;
    let anchorSide;
    
    if (isNorthSide) {
        // North side: stall extends north from the street
        yBlock = street.yBlock - stallDepthBlocks;
        anchorSide = 'bottom-left';
    } else {
        // South side: stall extends south from the street  
        yBlock = street.yBlock + MAP_CONFIG.STREET_WIDTH;
        anchorSide = 'top-left';
    }
    
    // Convert blocks to pixels for rendering
    const xPixels = MAP_CONFIG.MAP_MARGIN + (xBlock * MAP_CONFIG.BLOCK_SIZE);
    const yPixels = MAP_CONFIG.MAP_MARGIN + (yBlock * MAP_CONFIG.BLOCK_SIZE);
    const widthPixels = stallWidthBlocks * MAP_CONFIG.BLOCK_SIZE;
    const heightPixels = stallDepthBlocks * MAP_CONFIG.BLOCK_SIZE;
    
    return {
        x: xPixels,
        y: yPixels,
        width: widthPixels,
        height: heightPixels,
        xBlock: xBlock,
        yBlock: yBlock,
        widthBlocks: stallWidthBlocks,
        heightBlocks: stallDepthBlocks,
        isNorthSide: isNorthSide,
        isWestOfMainStreet: isWestOfMainStreet,
        positionInSection: positionInSection,
        anchorSide: anchorSide,
        street: street.name
    };
}

/* ========================================
   MAP RENDERING
   ======================================== */

function renderMap() {
    if (mapData.isLoading || !mapElements.mapContainer) {
        return;
    }
    
    console.log(`Rendering map for floor ${mapData.currentFloor}`);
    
    // Clear existing map
    mapElements.mapContainer.innerHTML = '';
    
    // Filter stalls for current floor
    const currentFloorStalls = mapData.stalls.filter(stall => {
        const { floor } = parseStallNumber(stall.StallNumber);
        return floor === mapData.currentFloor;
    });
    
    console.log(`Found ${currentFloorStalls.length} stalls on floor ${mapData.currentFloor}`);
    
    // Calculate map dimensions
    const mapDimensions = calculateMapDimensions(currentFloorStalls);
    
    // Set map container size
    mapElements.mapContainer.style.width = mapDimensions.width + 'px';
    mapElements.mapContainer.style.height = mapDimensions.height + 'px';
    
    // Render streets first (background layer)
    renderStreets();
    
    // Render Main Street with calculated position
    const mainStreetX = renderMainStreet(currentFloorStalls);
    
    // Render stalls
    currentFloorStalls.forEach(stall => {
        renderStall(stall, currentFloorStalls);
    });
    
    // Render street labels
    if (MAP_CONFIG.SHOW_STREET_LABELS) {
        renderStreetLabels(mainStreetX);
    }
}

/**
 * Calculate map dimensions using grid system
 * @param {Array} stalls - Array of stall data
 * @returns {Object} Map dimensions with width and height
 */
function calculateMapDimensions(stalls) {
    // Use fixed grid dimensions
    const widthPixels = MAP_CONFIG.GRID_WIDTH * MAP_CONFIG.BLOCK_SIZE + (MAP_CONFIG.MAP_MARGIN * 2);
    const heightPixels = MAP_CONFIG.GRID_HEIGHT * MAP_CONFIG.BLOCK_SIZE + (MAP_CONFIG.MAP_MARGIN * 2);
    
    return {
        width: widthPixels,
        height: heightPixels,
        gridWidthBlocks: MAP_CONFIG.GRID_WIDTH,
        gridHeightBlocks: MAP_CONFIG.GRID_HEIGHT
    };
}

/**
 * Render horizontal streets on the map
 */
function renderStreets() {
    MAP_CONFIG.STREETS.forEach(street => {
        // Skip streets that aren't displayed
        if (street.index === -1) return;
        
        const streetElement = document.createElement('div');
        streetElement.className = 'street horizontal-street';
        streetElement.style.position = 'absolute';
        streetElement.style.left = MAP_CONFIG.MAP_MARGIN + 'px';
        streetElement.style.top = (MAP_CONFIG.MAP_MARGIN + (street.yBlock * MAP_CONFIG.BLOCK_SIZE)) + 'px';
        streetElement.style.width = (MAP_CONFIG.STREET_LENGTH * MAP_CONFIG.BLOCK_SIZE) + 'px';
        streetElement.style.height = (MAP_CONFIG.STREET_WIDTH * MAP_CONFIG.BLOCK_SIZE) + 'px';
        streetElement.dataset.street = street.name;
        
        mapElements.mapContainer.appendChild(streetElement);
    });
}

/**
 * Render Main Street (vertical) on the map
 * @param {Array} stalls - Array of stall data (not used in grid system but kept for compatibility)
 * @returns {number} X position of Main Street in pixels
 */
function renderMainStreet(stalls) {
    // Calculate Main Street position in pixels
    const mainStreetXPixels = MAP_CONFIG.MAP_MARGIN + (MAP_CONFIG.MAIN_STREET_X_BLOCK * MAP_CONFIG.BLOCK_SIZE);
    
    // Render Main Street (vertical)
    const mainStreet = document.createElement('div');
    mainStreet.className = 'street main-street';
    mainStreet.style.position = 'absolute';
    mainStreet.style.left = mainStreetXPixels + 'px';
    mainStreet.style.top = MAP_CONFIG.MAP_MARGIN + 'px';
    mainStreet.style.width = (MAP_CONFIG.MAIN_STREET_WIDTH * MAP_CONFIG.BLOCK_SIZE) + 'px';
    mainStreet.style.height = (MAP_CONFIG.GRID_HEIGHT * MAP_CONFIG.BLOCK_SIZE) + 'px';
    
    mapElements.mapContainer.appendChild(mainStreet);
    
    return mainStreetXPixels;
}

/**
 * Render street labels on the map
 * @param {number} mainStreetXPixels - X position of Main Street in pixels
 */
function renderStreetLabels(mainStreetXPixels) {
    // Render horizontal street labels
    MAP_CONFIG.STREETS.forEach(street => {
        // Skip streets that aren't displayed
        if (street.index === -1) return;
        
        const label = document.createElement('div');
        label.className = 'street-label';
        label.textContent = street.name;
        label.style.position = 'absolute';
        label.style.left = (MAP_CONFIG.MAP_MARGIN - 15) + 'px'; // Moved further left
        label.style.top = (MAP_CONFIG.MAP_MARGIN + (street.yBlock * MAP_CONFIG.BLOCK_SIZE) + 8) + 'px'; // Better vertical centering
        label.style.transform = 'translateX(-100%)';
        label.style.zIndex = '100'; // Ensure labels are on top
        label.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'; // Semi-transparent background
        label.style.padding = '2px 6px'; // Some padding for readability
        label.style.borderRadius = '3px'; // Rounded corners
        label.style.fontSize = '12px'; // Consistent font size
        label.style.fontWeight = 'bold'; // Make labels more visible
        
        mapElements.mapContainer.appendChild(label);
    });
    
    // Main Street label
    const mainLabel = document.createElement('div');
    mainLabel.className = 'street-label';
    mainLabel.textContent = 'Main Street';
    mainLabel.style.position = 'absolute';
    mainLabel.style.left = (mainStreetXPixels + (MAP_CONFIG.MAIN_STREET_WIDTH * MAP_CONFIG.BLOCK_SIZE / 2)) + 'px';
    mainLabel.style.top = (MAP_CONFIG.MAP_MARGIN - 15) + 'px'; // Moved further up
    mainLabel.style.transform = 'translateY(-100%) translateX(-50%) rotate(-90deg)';
    mainLabel.style.transformOrigin = 'center bottom';
    mainLabel.style.zIndex = '100'; // Ensure labels are on top
    mainLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'; // Semi-transparent background
    mainLabel.style.padding = '2px 6px'; // Some padding for readability
    mainLabel.style.borderRadius = '3px'; // Rounded corners
    mainLabel.style.fontSize = '12px'; // Consistent font size
    mainLabel.style.fontWeight = 'bold'; // Make labels more visible
    
    mapElements.mapContainer.appendChild(mainLabel);
}

function renderStall(stall, allStalls) {
    const position = calculateStallPosition(stall, allStalls);
    
    // Skip if position calculation failed (e.g., stall beyond layout limits)
    if (!position) {
        console.log(`Skipping stall ${stall.StallNumber} - position beyond layout limits`);
        return;
    }
    
    const isOccupied = stall.IGN && stall.IGN.trim() !== '';
    
    const stallElement = document.createElement('div');
    stallElement.className = `stall ${isOccupied ? 'occupied' : 'vacant'}`;
    stallElement.style.position = 'absolute';
    stallElement.style.left = position.x + 'px';
    stallElement.style.top = position.y + 'px';
    stallElement.style.width = position.width + 'px';
    stallElement.style.height = position.height + 'px';
    stallElement.dataset.stallNumber = stall.StallNumber;
    stallElement.dataset.stallData = JSON.stringify(stall);
    
    // Add stall content - only show number
    let content = '';
    if (MAP_CONFIG.SHOW_STALL_NUMBERS) {
        content += `<div class="stall-number">${stall.StallNumber}</div>`;
    }
    stallElement.innerHTML = content;
    
    // Add click handler
    stallElement.addEventListener('click', () => {
        showStallModal(stall);
    });
    
    // Add hover effects if enabled
    if (MAP_CONFIG.ENABLE_HOVER_EFFECTS) {
        stallElement.addEventListener('mouseenter', () => {
            stallElement.style.zIndex = '20';
        });
        
        stallElement.addEventListener('mouseleave', () => {
            stallElement.style.zIndex = '5';
        });
    }
    
    mapElements.mapContainer.appendChild(stallElement);
}

/* ========================================
   FLOOR SWITCHING
   ======================================== */

function switchToFloor(floor) {
    if (floor === mapData.currentFloor) return;
    
    console.log(`Switching to floor ${floor}`);
    mapData.currentFloor = floor;
    
    // Update UI
    updateFloorButtons();
    renderMap();
    updateStallCount();
    updateCurrentFloorDisplay();
}

function updateFloorButtons() {
    mapElements.floorButtons.forEach(button => {
        const buttonFloor = parseInt(button.dataset.floor);
        if (buttonFloor === mapData.currentFloor) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function updateUI() {
    updateFloorButtons();
    updateStallCount();
    updateCurrentFloorDisplay();
}

function updateStallCount() {
    if (!mapElements.stallCountDisplay) return;
    
    const currentFloorStalls = mapData.stalls.filter(stall => {
        const { floor } = parseStallNumber(stall.StallNumber);
        return floor === mapData.currentFloor;
    });
    
    const occupiedCount = currentFloorStalls.filter(stall => 
        stall.IGN && stall.IGN.trim() !== ''
    ).length;
    
    mapElements.stallCountDisplay.textContent = 
        `${currentFloorStalls.length} stalls (${occupiedCount} occupied, ${currentFloorStalls.length - occupiedCount} vacant)`;
}

function updateCurrentFloorDisplay() {
    if (mapElements.currentFloorDisplay) {
        mapElements.currentFloorDisplay.textContent = mapData.currentFloor;
    }
}

/* ========================================
   MODAL FUNCTIONALITY
   ======================================== */

function showStallModal(stall) {
    if (!mapElements.modal) return;
    
    // Populate modal with stall data
    const modalStallName = document.getElementById('modal-stall-name');
    const modalStallNumber = document.getElementById('modal-stall-number');
    const modalStreetName = document.getElementById('modal-street-name');
    const modalOwner = document.getElementById('modal-owner');
    const modalItems = document.getElementById('modal-items');
    const visitStallBtn = document.getElementById('visit-stall-btn');
    
    if (modalStallName) modalStallName.textContent = stall.StallName || 'Unnamed Stall';
    if (modalStallNumber) modalStallNumber.textContent = stall.StallNumber;
    if (modalStreetName) modalStreetName.textContent = stall.StreetName;
    if (modalOwner) modalOwner.textContent = stall.IGN || 'Vacant';
    if (modalItems) modalItems.textContent = stall.ItemsSold || 'No items listed';
    
    // Set up visit stall button
    if (visitStallBtn) {
        visitStallBtn.onclick = () => {
            window.location.href = `/stall/${stall.StallNumber}`;
        };
    }
    
    // Show modal
    mapElements.modal.classList.remove('hidden');
    
    console.log('Showing modal for stall:', stall.StallNumber);
}

function closeModal() {
    if (mapElements.modal) {
        mapElements.modal.classList.add('hidden');
    }
}

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Floor switching with number keys
    if (e.key >= '1' && e.key <= '5') {
        const floor = parseInt(e.key);
        if (MAP_CONFIG.FLOORS.includes(floor)) {
            switchToFloor(floor);
        }
    }
});

// Export for debugging
window.MAP_DEBUG = {
    config: MAP_CONFIG,
    data: mapData,
    elements: mapElements,
    calculateStallPosition,
    parseStallNumber,
    renderMap
};
