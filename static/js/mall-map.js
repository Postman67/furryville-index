/**
 * ========================================
 * INTERACTIVE MALL MAP SYSTEM
 * ========================================
 * 
 * This system renders a top-down interactive map of the Furryville Mall.
 * Features:
 * - Grid-based positioning using Minecraft block coordinates
 * - Multi-floor support (1-5)
 * - Dynamic stall placement based on configuration
 * - Section-based stall assignment (North/South sides, West/East of Main Street)
 * - Responsive design with mobile support
 * 
 * Architecture:
 * - MAP_CONFIG: Central configuration for all map settings
 * - Stall positioning: Uses cumulative width calculation and section assignment
 * - Orientation logic: Odd stall numbers = South side, Even = North side
 */

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

/**
 * Get street configuration by name
 * @param {string} streetName - Name of the street
 * @returns {Object|null} Street configuration object
 */
function getStreetByName(streetName) {
    return MAP_CONFIG.STREETS.find(street => street.name === streetName) || null;
}

/**
 * Get street index by name (legacy compatibility function)
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
    // Normalize street name for config lookup (remove spaces)
    const normalizedStreetName = streetName.replace(/\s+/g, '');
    const sideStr = isNorth ? 'North' : 'South';
    const sectionStr = isWest ? 'West' : 'East';
    const configKey = `${normalizedStreetName}${sideStr}${sectionStr}_StallCount`;
    
    return MAP_CONFIG[configKey] || 0;
}

/* ========================================
   CORE CONFIGURATION
   ======================================== */

const MAP_CONFIG = {
    // === GRID & DIMENSIONS ===
    GRID_WIDTH: 117,                  // Total map width in Minecraft blocks
    GRID_HEIGHT: 102,                 // Total map height in Minecraft blocks
    BLOCK_SIZE: 8,                    // Pixels per Minecraft block (visual scaling)
    
    // === STREET LAYOUT ===
    STREET_LENGTH: 117,               // Length of horizontal streets (blocks)
    STREET_WIDTH: 3,                  // Visual width of streets (blocks)
    STREET_SEPARATION: 20,            // Distance between horizontal streets (blocks)
    
    // === MAIN STREET (VERTICAL) ===
    MAIN_STREET_X_BLOCK: 55,          // X position where Main Street starts (blocks)
    MAIN_STREET_WIDTH: 9,             // Width of Main Street (blocks)
    
    // === STREET DEFINITIONS ===
    // Y positions in blocks from top of map
    STREETS: [
        { name: "Wall Street", index: 0, yBlock: 10 },
        { name: "Artist Alley", index: 1, yBlock: 30 },
        { name: "Woke Ave", index: 2, yBlock: 50 },
        { name: "Poland Street", index: 3, yBlock: 70 },
        { name: "Five", index: -1, yBlock: -1 }    // Special case - not displayed
    ],
    
    // === STALL DEFAULTS ===
    MAX_STALLS_PER_SIDE: 13,          // Fallback maximum stalls per side
    DEFAULT_STALL_WIDTH: 4,           // Default stall width (blocks)
    DEFAULT_STALL_DEPTH: 4,           // Default stall depth (blocks)
    
    // === SECTION-SPECIFIC STALL COUNTS ===
    // Format: [StreetName][North/South][West/East]_StallCount
    // These control how many stalls can be placed in each section
    
    // Wall Street
    WallStreetNorthWest_StallCount: 6,
    WallStreetNorthEast_StallCount: 6,
    WallStreetSouthWest_StallCount: 6,
    WallStreetSouthEast_StallCount: 6,
    
    // Artist Alley
    ArtistAlleyNorthWest_StallCount: 8,
    ArtistAlleyNorthEast_StallCount: 6,
    ArtistAlleySouthWest_StallCount: 8,
    ArtistAlleySouthEast_StallCount: 6,
    
    // Woke Ave
    WokeAveNorthWest_StallCount: 7,
    WokeAveNorthEast_StallCount: 6,
    WokeAveSouthWest_StallCount: 6,
    WokeAveSouthEast_StallCount: 6,
    
    // Poland Street
    PolandStreetNorthWest_StallCount: 7,
    PolandStreetNorthEast_StallCount: 6,
    PolandStreetSouthWest_StallCount: 6,
    PolandStreetSouthEast_StallCount: 6,
    
    // === FLOOR CONFIGURATION ===
    FLOORS: [1, 2, 3, 4, 5],
    FLOOR_LABELS: {
        1: "First Floor",
        2: "Second Floor", 
        3: "Third Floor",
        4: "Fourth Floor",
        5: "Fifth Floor"
    },
    
    // === VISUAL SETTINGS ===
    SHOW_STALL_NUMBERS: true,         // Display stall numbers on map
    SHOW_STREET_LABELS: true,         // Display street name labels
    ENABLE_HOVER_EFFECTS: true,       // Enable stall hover animations
    SHOW_GRID: true,                  // Show grid lines (for debugging)
    
    // === ANIMATION SETTINGS ===
    HOVER_SCALE: 1.05,                // Scale factor on stall hover
    ANIMATION_DURATION: 200,          // Hover animation duration (ms)
    
    // === LAYOUT SETTINGS ===
    MAP_MARGIN: 120,                  // Margin around map for labels (pixels)
    
    // === COLOR OVERRIDES ===
    // These can override CSS variables if needed
    COLORS: {
        OCCUPIED: '#4a90e2',          // Occupied stall color
        VACANT: '#95a5a6',            // Vacant stall color
        STREET: '#34495e',            // Street color
        MAIN_STREET: '#2c3e50',       // Main Street color
        HOVER: '#f39c12'              // Hover highlight color
    }
};

/* ========================================
   GLOBAL STATE MANAGEMENT
   ======================================== */

/**
 * Central data store for the map application
 */
let mapData = {
    stalls: [],                       // All stall data from API
    currentFloor: 1,                  // Currently displayed floor
    isLoading: true                   // Loading state flag
};

/**
 * References to DOM elements for performance
 */
let mapElements = {
    mapContainer: null,               // Main map container
    floorButtons: [],                 // Floor selection buttons
    currentFloorDisplay: null,        // Current floor number display
    stallCountDisplay: null,          // Stall count display
    modal: null                       // Stall details modal
};

/* ========================================
   APPLICATION INITIALIZATION
   ======================================== */

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Interactive Mall Map...');
    
    initializeMapElements();
    setupEventListeners();
    loadMapData();
});

/**
 * Cache references to DOM elements
 */
function initializeMapElements() {
    mapElements.mapContainer = document.getElementById('mall-map');
    mapElements.floorButtons = document.querySelectorAll('.floor-btn');
    mapElements.currentFloorDisplay = document.getElementById('current-floor-number');
    mapElements.stallCountDisplay = document.getElementById('stall-count');
    mapElements.modal = document.getElementById('stall-modal');
    
    if (!mapElements.mapContainer) {
        console.error('Map container not found!');
        return;
    }
    
    console.log('Map elements initialized successfully');
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
    // Floor selection buttons
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
   DATA LOADING & ERROR HANDLING
   ======================================== */

/**
 * Load stall data from the API
 */
async function loadMapData() {
    try {
        console.log('Loading mall data from API...');
        const response = await fetch('/api/the-mall');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        mapData.stalls = data.shops || [];
        mapData.isLoading = false;
        
        console.log(`Successfully loaded ${mapData.stalls.length} stalls`);
        
        // Initialize map display
        renderMap();
        updateUI();
        
    } catch (error) {
        console.error('Error loading map data:', error);
        showError('Failed to load map data. Please refresh the page.');
    }
}

/**
 * Display an error message to the user
 * @param {string} message - Error message to display
 */
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
   STALL POSITIONING SYSTEM
   ======================================== */

/**
 * Parse stall number into floor and position components
 * @param {number|string} stallNumber - 3-digit stall number (e.g., 101, 205)
 * @returns {Object} Object with floor and position properties
 */
function parseStallNumber(stallNumber) {
    const stallStr = stallNumber.toString().padStart(3, '0');
    const floor = parseInt(stallStr[0]);
    const position = parseInt(stallStr.slice(1));
    
    return { floor, position };
}

/**
 * Calculate exact position for a stall on the map
 * 
 * POSITIONING LOGIC:
 * - Odd stall positions = South side of street
 * - Even stall positions = North side of street  
 * - Stalls fill West sections first, then East sections
 * - Position is based on cumulative width of previous stalls
 * 
 * @param {Object} stall - Stall data from database
 * @param {Array} allStalls - All stalls for width calculation
 * @returns {Object|null} Position object or null if no space
 */
function calculateStallPosition(stall, allStalls) {
    const { floor, position } = parseStallNumber(stall.StallNumber);
    const street = getStreetByName(stall.StreetName);
    
    // Skip if street is not displayed
    if (!street || street.index === -1) {
        return null;
    }
    
    // Get stall dimensions (in blocks)
    const stallWidthBlocks = stall.stall_width || MAP_CONFIG.DEFAULT_STALL_WIDTH;
    const stallDepthBlocks = stall.stall_depth || MAP_CONFIG.DEFAULT_STALL_DEPTH;
    
    // Determine side using stall number (odd = south, even = north)
    const isNorthSide = position % 2 === 0;
    
    // Get section capacities for this street
    const sectionCounts = getSectionCounts(stall.StreetName);
    
    // Calculate section assignment and position
    const sectionInfo = calculateSectionAssignment(stall, allStalls, isNorthSide, sectionCounts);
    if (!sectionInfo) {
        return null; // No space available
    }
    
    // Calculate cumulative width from previous stalls in same section
    const cumulativeWidth = calculateCumulativeWidth(stall, allStalls, sectionInfo);
    
    // Calculate final pixel coordinates
    return calculateFinalPosition(
        stall, 
        street, 
        stallWidthBlocks, 
        stallDepthBlocks, 
        isNorthSide, 
        sectionInfo.isWestOfMainStreet, 
        cumulativeWidth
    );
}

/**
 * Get stall count configuration for all sections of a street
 * @param {string} streetName - Name of the street
 * @returns {Object} Object with counts for each section
 */
function getSectionCounts(streetName) {
    return {
        northWest: getStallCountForSection(streetName, true, true),
        northEast: getStallCountForSection(streetName, true, false),
        southWest: getStallCountForSection(streetName, false, true),
        southEast: getStallCountForSection(streetName, false, false)
    };
}

/**
 * Calculate which section a stall should be placed in
 * @param {Object} stall - Stall data
 * @param {Array} allStalls - All stalls for counting
 * @param {boolean} isNorthSide - True if stall is on north side
 * @param {Object} sectionCounts - Available space in each section
 * @returns {Object|null} Section assignment info or null if no space
 */
function calculateSectionAssignment(stall, allStalls, isNorthSide, sectionCounts) {
    const { floor, position } = parseStallNumber(stall.StallNumber);
    
    // Count stalls on same side with lower position numbers
    const stallsOnSameSide = allStalls.filter(s => {
        const { floor: sFloor, position: sPosition } = parseStallNumber(s.StallNumber);
        return sFloor === floor && 
               s.StreetName === stall.StreetName && 
               (sPosition % 2 === 0) === isNorthSide && // Same side
               sPosition < position; // Lower position numbers
    }).length;
    
    // Determine section assignment based on available space
    let isWestOfMainStreet, positionInSection, maxStalls;
    
    if (isNorthSide) {
        if (stallsOnSameSide < sectionCounts.northWest) {
            isWestOfMainStreet = true;
            positionInSection = stallsOnSameSide + 1;
            maxStalls = sectionCounts.northWest + sectionCounts.northEast;
        } else {
            isWestOfMainStreet = false;
            positionInSection = stallsOnSameSide - sectionCounts.northWest + 1;
            maxStalls = sectionCounts.northWest + sectionCounts.northEast;
        }
    } else {
        if (stallsOnSameSide < sectionCounts.southWest) {
            isWestOfMainStreet = true;
            positionInSection = stallsOnSameSide + 1;
            maxStalls = sectionCounts.southWest + sectionCounts.southEast;
        } else {
            isWestOfMainStreet = false;
            positionInSection = stallsOnSameSide - sectionCounts.southWest + 1;
            maxStalls = sectionCounts.southWest + sectionCounts.southEast;
        }
    }
    
    // Check if stall exceeds available space
    if (stallsOnSameSide >= maxStalls) {
        console.warn(`Stall ${stall.StallNumber} exceeds available space on ${stall.StreetName}`);
        return null;
    }
    
    return { isWestOfMainStreet, positionInSection };
}

/**
 * Calculate cumulative width from previous stalls in the same section
 * @param {Object} stall - Current stall
 * @param {Array} allStalls - All stalls
 * @param {Object} sectionInfo - Section assignment info
 * @returns {number} Cumulative width in blocks
 */
function calculateCumulativeWidth(stall, allStalls, sectionInfo) {
    const { floor, position } = parseStallNumber(stall.StallNumber);
    const isNorthSide = position % 2 === 0;
    const { isWestOfMainStreet } = sectionInfo;
    
    // Find all stalls in the same section that come before this one
    const sameSection = allStalls.filter(s => {
        const { floor: sFloor, position: sPosition } = parseStallNumber(s.StallNumber);
        const sIsNorthSide = sPosition % 2 === 0;
        
        // Calculate which section the comparison stall is in
        const sectionCounts = getSectionCounts(s.StreetName);
        const sSectionInfo = calculateSectionAssignment(s, allStalls, sIsNorthSide, sectionCounts);
        
        return sFloor === floor && 
               s.StreetName === stall.StreetName && 
               sIsNorthSide === isNorthSide && 
               sSectionInfo && sSectionInfo.isWestOfMainStreet === isWestOfMainStreet &&
               sPosition < position;
    });
    
    // Sum up the widths of all previous stalls in the section
    return sameSection.reduce((total, prevStall) => {
        return total + (prevStall.stall_width || MAP_CONFIG.DEFAULT_STALL_WIDTH);
    }, 0);
}

/**
 * Calculate final pixel coordinates for stall rendering
 * @param {Object} stall - Stall data
 * @param {Object} street - Street configuration
 * @param {number} stallWidthBlocks - Stall width in blocks
 * @param {number} stallDepthBlocks - Stall depth in blocks
 * @param {boolean} isNorthSide - True if on north side
 * @param {boolean} isWestOfMainStreet - True if west of Main Street
 * @param {number} cumulativeWidth - Cumulative width in blocks
 * @returns {Object} Final position object with pixel coordinates
 */
function calculateFinalPosition(stall, street, stallWidthBlocks, stallDepthBlocks, isNorthSide, isWestOfMainStreet, cumulativeWidth) {
    // Calculate X position in blocks
    let xBlock;
    if (isWestOfMainStreet) {
        xBlock = cumulativeWidth;
    } else {
        xBlock = MAP_CONFIG.MAIN_STREET_X_BLOCK + MAP_CONFIG.MAIN_STREET_WIDTH + cumulativeWidth;
    }
    
    // Calculate Y position based on street and side
    let yBlock, anchorSide;
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
        anchorSide: anchorSide,
        street: street.name
    };
}

/* ========================================
   MAP RENDERING SYSTEM
   ======================================== */

/**
 * Main rendering function - orchestrates the entire map display
 */
function renderMap() {
    if (mapData.isLoading || !mapElements.mapContainer) {
        console.warn('Cannot render map: loading or container not available');
        return;
    }
    
    console.log(`Rendering map for floor ${mapData.currentFloor}`);
    
    // Clear existing content
    mapElements.mapContainer.innerHTML = '';
    
    // Get stalls for current floor
    const currentFloorStalls = getCurrentFloorStalls();
    console.log(`Found ${currentFloorStalls.length} stalls on floor ${mapData.currentFloor}`);
    
    // Set up map container
    setupMapContainer();
    
    // Render in layers (back to front)
    renderStreets();
    renderMainStreet();
    renderStalls(currentFloorStalls);
    
    if (MAP_CONFIG.SHOW_STREET_LABELS) {
        renderStreetLabels();
    }
}

/**
 * Get all stalls for the currently selected floor
 * @returns {Array} Array of stall objects
 */
function getCurrentFloorStalls() {
    return mapData.stalls.filter(stall => {
        const { floor } = parseStallNumber(stall.StallNumber);
        return floor === mapData.currentFloor;
    });
}

/**
 * Set up the map container dimensions
 */
function setupMapContainer() {
    const dimensions = calculateMapDimensions();
    mapElements.mapContainer.style.width = dimensions.width + 'px';
    mapElements.mapContainer.style.height = dimensions.height + 'px';
}

/**
 * Calculate map dimensions using grid system
 * @returns {Object} Map dimensions with width and height
 */
function calculateMapDimensions() {
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
 * Render all horizontal streets as background elements
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
 * Render Main Street (vertical divider) as a background element
 */
function renderMainStreet() {
    const mainStreetXPixels = MAP_CONFIG.MAP_MARGIN + (MAP_CONFIG.MAIN_STREET_X_BLOCK * MAP_CONFIG.BLOCK_SIZE);
    
    const mainStreet = document.createElement('div');
    mainStreet.className = 'street main-street';
    mainStreet.style.position = 'absolute';
    mainStreet.style.left = mainStreetXPixels + 'px';
    mainStreet.style.top = MAP_CONFIG.MAP_MARGIN + 'px';
    mainStreet.style.width = (MAP_CONFIG.MAIN_STREET_WIDTH * MAP_CONFIG.BLOCK_SIZE) + 'px';
    mainStreet.style.height = (MAP_CONFIG.GRID_HEIGHT * MAP_CONFIG.BLOCK_SIZE) + 'px';
    
    mapElements.mapContainer.appendChild(mainStreet);
}

/**
 * Render all stalls for the current floor
 * @param {Array} currentFloorStalls - Stalls to render
 */
function renderStalls(currentFloorStalls) {
    currentFloorStalls.forEach(stall => {
        renderStall(stall, currentFloorStalls);
    });
}

/**
 * Render street name labels
 */
function renderStreetLabels() {
    MAP_CONFIG.STREETS.forEach(street => {
        // Skip streets that aren't displayed
        if (street.index === -1) return;
        
        const label = document.createElement('div');
        label.className = 'street-label';
        label.textContent = street.name;
        label.style.position = 'absolute';
        label.style.left = (MAP_CONFIG.MAP_MARGIN - 15) + 'px';
        label.style.top = (MAP_CONFIG.MAP_MARGIN + (street.yBlock * MAP_CONFIG.BLOCK_SIZE) + 8) + 'px';
        label.style.transform = 'translateX(-100%)';
        label.style.zIndex = '100';
        
        mapElements.mapContainer.appendChild(label);
    });
    
    // Main Street label (vertical)
    const mainStreetXPixels = MAP_CONFIG.MAP_MARGIN + (MAP_CONFIG.MAIN_STREET_X_BLOCK * MAP_CONFIG.BLOCK_SIZE);
    const mainLabel = document.createElement('div');
    mainLabel.className = 'street-label main-street-label';
    mainLabel.textContent = 'Main Street';
    mainLabel.style.position = 'absolute';
    mainLabel.style.left = (mainStreetXPixels + (MAP_CONFIG.MAIN_STREET_WIDTH * MAP_CONFIG.BLOCK_SIZE / 2)) + 'px';
    mainLabel.style.top = (MAP_CONFIG.MAP_MARGIN - 15) + 'px';
    mainLabel.style.transform = 'translateY(-100%) translateX(-50%) rotate(-90deg)';
    mainLabel.style.transformOrigin = 'center bottom';
    mainLabel.style.zIndex = '100';
    
    mapElements.mapContainer.appendChild(mainLabel);
}

/**
 * Render an individual stall on the map
 * @param {Object} stall - Stall data from database
 * @param {Array} allStalls - All stalls for position calculation
 */
function renderStall(stall, allStalls) {
    const position = calculateStallPosition(stall, allStalls);
    
    // Skip if position calculation failed
    if (!position) {
        console.log(`Skipping stall ${stall.StallNumber} - position beyond layout limits`);
        return;
    }
    
    const isOccupied = stall.IGN && stall.IGN.trim() !== '';
    
    // Create stall element
    const stallElement = document.createElement('div');
    stallElement.className = `stall ${isOccupied ? 'occupied' : 'vacant'}`;
    stallElement.style.position = 'absolute';
    stallElement.style.left = position.x + 'px';
    stallElement.style.top = position.y + 'px';
    stallElement.style.width = position.width + 'px';
    stallElement.style.height = position.height + 'px';
    stallElement.dataset.stallNumber = stall.StallNumber;
    stallElement.dataset.stallData = JSON.stringify(stall);
    
    // Add stall content
    if (MAP_CONFIG.SHOW_STALL_NUMBERS) {
        stallElement.innerHTML = `<div class="stall-number">${stall.StallNumber}</div>`;
    }
    
    // Add event handlers
    stallElement.addEventListener('click', () => showStallModal(stall));
    
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
   FLOOR NAVIGATION SYSTEM
   ======================================== */

/**
 * Switch to a different floor
 * @param {number} floor - Floor number to switch to
 */
function switchToFloor(floor) {
    if (floor === mapData.currentFloor) {
        console.log(`Already on floor ${floor}`);
        return;
    }
    
    console.log(`Switching to floor ${floor}`);
    mapData.currentFloor = floor;
    
    // Update all UI components
    updateFloorButtons();
    renderMap();
    updateUI();
}

/**
 * Update floor button visual states
 */
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

/**
 * Update all UI components with current state
 */
function updateUI() {
    updateFloorButtons();
    updateStallCount();
    updateCurrentFloorDisplay();
}

/**
 * Update the stall count display
 */
function updateStallCount() {
    if (!mapElements.stallCountDisplay) return;
    
    const currentFloorStalls = getCurrentFloorStalls();
    const occupiedCount = currentFloorStalls.filter(stall => 
        stall.IGN && stall.IGN.trim() !== ''
    ).length;
    
    mapElements.stallCountDisplay.textContent = 
        `${currentFloorStalls.length} stalls (${occupiedCount} occupied, ${currentFloorStalls.length - occupiedCount} vacant)`;
}

/**
 * Update the current floor number display
 */
function updateCurrentFloorDisplay() {
    if (mapElements.currentFloorDisplay) {
        mapElements.currentFloorDisplay.textContent = mapData.currentFloor;
    }
}

/* ========================================
   STALL MODAL SYSTEM
   ======================================== */

/**
 * Show detailed information modal for a stall
 * @param {Object} stall - Stall data to display
 */
function showStallModal(stall) {
    if (!mapElements.modal) {
        console.warn('Modal element not found');
        return;
    }
    
    // Populate modal with stall data
    const elements = {
        stallName: document.getElementById('modal-stall-name'),
        stallNumber: document.getElementById('modal-stall-number'),
        streetName: document.getElementById('modal-street-name'),
        owner: document.getElementById('modal-owner'),
        items: document.getElementById('modal-items'),
        visitBtn: document.getElementById('visit-stall-btn')
    };
    
    // Update modal content
    if (elements.stallName) elements.stallName.textContent = stall.StallName || 'Unnamed Stall';
    if (elements.stallNumber) elements.stallNumber.textContent = stall.StallNumber;
    if (elements.streetName) elements.streetName.textContent = stall.StreetName;
    if (elements.owner) elements.owner.textContent = stall.IGN || 'Vacant';
    if (elements.items) elements.items.textContent = stall.ItemsSold || 'No items listed';
    
    // Set up visit stall button
    if (elements.visitBtn) {
        elements.visitBtn.onclick = () => {
            window.location.href = `/stall/${stall.StallNumber}`;
        };
    }
    
    // Show modal
    mapElements.modal.classList.remove('hidden');
    console.log('Showing modal for stall:', stall.StallNumber);
}

/**
 * Close the stall details modal
 */
function closeModal() {
    if (mapElements.modal) {
        mapElements.modal.classList.add('hidden');
    }
}

/* ========================================
   UTILITY FUNCTIONS & EVENT HANDLERS
   ======================================== */

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
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

/**
 * Set up global keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
    // Close modal with Escape key
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Floor switching with number keys (1-5)
    if (e.key >= '1' && e.key <= '5') {
        const floor = parseInt(e.key);
        if (MAP_CONFIG.FLOORS.includes(floor)) {
            switchToFloor(floor);
        }
    }
});

// Console helper for debugging
window.mallMapDebug = {
    mapData,
    mapElements,
    MAP_CONFIG,
    switchToFloor,
    renderMap,
    calculateStallPosition,
    parseStallNumber
};

// Export for debugging
window.MAP_DEBUG = {
    config: MAP_CONFIG,
    data: mapData,
    elements: mapElements,
    calculateStallPosition,
    parseStallNumber,
    renderMap
};
