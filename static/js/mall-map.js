/**
 * Interactive Mall Map System
 * 
 * This file handles the rendering and interaction of the top-down mall map.
 * The map displays stalls positioned according to Minecraft coordinates across 5 floors.
 */

/* ========================================
   EASY TO CHANGE CONFIGURATION VARIABLES
   ======================================== */

const MAP_CONFIG = {
    // Map dimensions and scaling
    BLOCK_SIZE: 8,                    // Pixels per Minecraft block
    STREET_WIDTH: 9,                  // Blocks wide for cross streets
    MAIN_STREET_WIDTH: 9,             // Blocks wide for main street
    
    // Default stall dimensions (in blocks) - fallback when DB doesn't specify
    DEFAULT_STALL_WIDTH: 3,
    DEFAULT_STALL_DEPTH: 3,
    
    // Stall layout configuration
    MAX_STALLS_PER_SIDE: 13,         // Maximum stalls on each side of a street
    MAIN_STREET_POSITION: 13,        // Position where Main Street crosses (stall 13-14 gap)
    
    // Animation and interaction settings
    HOVER_SCALE: 1.05,               // Scale factor on hover
    ANIMATION_DURATION: 200,         // MS for hover animations
    
    // Floor configuration
    FLOORS: [1, 2, 3, 4, 5],
    FLOOR_LABELS: {
        1: "First Floor",
        2: "Second Floor", 
        3: "Third Floor",
        4: "Fourth Floor",
        5: "Fifth Floor"
    },
    
    // Street layout configuration
    STREETS: [
        { name: "Wall Street", index: 0 },
        { name: "Artist Alley", index: 1 },
        { name: "Woke Ave", index: 2 },
        { name: "Five", index: -1 },
        { name: "Poland Street", index: 4 }
    ],
    
    // Map layout settings
    STREET_SPACING: 208,             // Pixels between street centers
                                     // Calculation: (3 stall depth + 20 gap + 3 stall depth) * 8px = 208px
    STALL_SPACING: 0,                // Pixels between stalls (no spacing - stalls are adjacent)
    MAP_MARGIN: 50,                  // Pixels margin around map
    MAIN_STREET_GAP: 100,            // Gap for Main Street in pixels
    
    // Visual settings
    SHOW_STALL_NUMBERS: true,        // Show stall numbers on map
    SHOW_STREET_LABELS: true,        // Show street name labels
    ENABLE_HOVER_EFFECTS: true,      // Enable hover animations
    
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

function calculateStallPosition(stall, allStalls) {
    const { floor, position } = parseStallNumber(stall.StallNumber);
    const streetIndex = getStreetIndex(stall.StreetName);
    
    // Skip if street index is -1 (like "Five" street which we're not positioning)
    if (streetIndex === -1) return null;
    
    // Determine which side of the street (even = right/top, odd = left/bottom) - FLIPPED
    const isRightSide = position % 2 === 0;
    
    // Get stall dimensions (use defaults if not specified)
    const width = (stall.stall_width || MAP_CONFIG.DEFAULT_STALL_WIDTH) * MAP_CONFIG.BLOCK_SIZE;
    const depth = (stall.stall_depth || MAP_CONFIG.DEFAULT_STALL_DEPTH) * MAP_CONFIG.BLOCK_SIZE;
    
    // Calculate which stall position this is on its side (1-13)
    const stallIndexOnSide = Math.ceil(position / 2);
    
    // Don't place stalls where Main Street crosses (around position 13)
    if (stallIndexOnSide > MAP_CONFIG.MAX_STALLS_PER_SIDE) {
        return null; // This stall position would be beyond our layout
    }
    
    // Determine if this stall is before or after Main Street
    const isBeforeMainStreet = stallIndexOnSide <= Math.floor(MAP_CONFIG.MAX_STALLS_PER_SIDE / 2);
    
    // Get all stalls on this street in this section and build position pairs
    const sameStreetSection = allStalls.filter(s => {
        const { floor: sFloor, position: sPosition } = parseStallNumber(s.StallNumber);
        const sStreetIndex = getStreetIndex(s.StreetName);
        const sStallIndexOnSide = Math.ceil(sPosition / 2);
        const sIsBeforeMainStreet = sStallIndexOnSide <= Math.floor(MAP_CONFIG.MAX_STALLS_PER_SIDE / 2);
        
        return sFloor === floor && 
               sStreetIndex === streetIndex && 
               sIsBeforeMainStreet === isBeforeMainStreet;
    });
    
    // Build position pairs for width calculation
    const positionPairs = {};
    sameStreetSection.forEach(s => {
        const sStallIndexOnSide = Math.ceil(parseStallNumber(s.StallNumber).position / 2);
        const sIsRightSide = parseStallNumber(s.StallNumber).position % 2 === 0;
        
        if (!positionPairs[sStallIndexOnSide]) {
            positionPairs[sStallIndexOnSide] = { left: null, right: null };
        }
        
        if (sIsRightSide) {
            positionPairs[sStallIndexOnSide].right = s;
        } else {
            positionPairs[sStallIndexOnSide].left = s;
        }
    });
    
    // Calculate cumulative width up to this stall's position
    let cumulativeWidth = 0;
    for (let i = 1; i < stallIndexOnSide; i++) {
        if (positionPairs[i]) {
            let leftWidth = 0;
            let rightWidth = 0;
            
            if (positionPairs[i].left) {
                leftWidth = (positionPairs[i].left.stall_width || MAP_CONFIG.DEFAULT_STALL_WIDTH) * MAP_CONFIG.BLOCK_SIZE;
            }
            if (positionPairs[i].right) {
                rightWidth = (positionPairs[i].right.stall_width || MAP_CONFIG.DEFAULT_STALL_WIDTH) * MAP_CONFIG.BLOCK_SIZE;
            }
            
            // Use the maximum width from either side for this position
            cumulativeWidth += Math.max(leftWidth, rightWidth, MAP_CONFIG.DEFAULT_STALL_WIDTH * MAP_CONFIG.BLOCK_SIZE);
        } else {
            // No stalls at this position, use default width
            cumulativeWidth += MAP_CONFIG.DEFAULT_STALL_WIDTH * MAP_CONFIG.BLOCK_SIZE;
        }
    }
    
    // Calculate X position (along the street)
    let x = MAP_CONFIG.MAP_MARGIN + cumulativeWidth;
    
    // If this stall is after Main Street, add the gap and first section width
    if (!isBeforeMainStreet) {
        // Calculate first section width using same pair logic
        let firstSectionWidth = 0;
        for (let i = 1; i <= Math.floor(MAP_CONFIG.MAX_STALLS_PER_SIDE / 2); i++) {
            if (positionPairs[i]) {
                let leftWidth = 0;
                let rightWidth = 0;
                
                if (positionPairs[i].left) {
                    leftWidth = (positionPairs[i].left.stall_width || MAP_CONFIG.DEFAULT_STALL_WIDTH) * MAP_CONFIG.BLOCK_SIZE;
                }
                if (positionPairs[i].right) {
                    rightWidth = (positionPairs[i].right.stall_width || MAP_CONFIG.DEFAULT_STALL_WIDTH) * MAP_CONFIG.BLOCK_SIZE;
                }
                
                firstSectionWidth += Math.max(leftWidth, rightWidth, MAP_CONFIG.DEFAULT_STALL_WIDTH * MAP_CONFIG.BLOCK_SIZE);
            } else {
                firstSectionWidth += MAP_CONFIG.DEFAULT_STALL_WIDTH * MAP_CONFIG.BLOCK_SIZE;
            }
        }
        
        x = MAP_CONFIG.MAP_MARGIN + firstSectionWidth + MAP_CONFIG.MAIN_STREET_GAP + cumulativeWidth;
    }
    
    // Calculate Y position (which street and which side) - FIXED: not affected by width
    let y = MAP_CONFIG.MAP_MARGIN + (streetIndex * MAP_CONFIG.STREET_SPACING);
    
    if (isRightSide) {
        // Right side (above/north of street) - stalls go in the gap before the street
        y -= depth; // Place stall above the street, ending at the street edge
    } else {
        // Left side (below/south of street) - stalls go in the gap after the street
        y += (MAP_CONFIG.STREET_WIDTH * MAP_CONFIG.BLOCK_SIZE); // Start after the street
    }
    
    return {
        x: x,
        y: y,
        width: width,
        height: depth,
        isRightSide: isRightSide
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

function calculateMapDimensions(stalls) {
    let maxX = 0;
    let maxY = 0;
    
    stalls.forEach(stall => {
        const pos = calculateStallPosition(stall, stalls);
        if (pos) { // Only calculate for valid positions
            maxX = Math.max(maxX, pos.x + pos.width);
            maxY = Math.max(maxY, pos.y + pos.height);
        }
    });
    
    // Ensure minimum dimensions that accommodate the full layout
    const minWidth = (MAP_CONFIG.MAX_STALLS_PER_SIDE * MAP_CONFIG.DEFAULT_STALL_WIDTH * MAP_CONFIG.BLOCK_SIZE) + 
                     MAP_CONFIG.MAIN_STREET_GAP + (MAP_CONFIG.MAP_MARGIN * 2);
    
    return {
        width: Math.max(1200, maxX + MAP_CONFIG.MAP_MARGIN, minWidth),
        height: Math.max(600, maxY + MAP_CONFIG.MAP_MARGIN)
    };
}

function renderStreets() {
    // Render horizontal streets
    MAP_CONFIG.STREETS.forEach((street, index) => {
        // Skip streets with index -1
        if (street.index === -1) return;
        
        const streetElement = document.createElement('div');
        streetElement.className = 'street';
        streetElement.style.position = 'absolute';
        streetElement.style.left = MAP_CONFIG.MAP_MARGIN + 'px';
        streetElement.style.top = (MAP_CONFIG.MAP_MARGIN + (street.index * MAP_CONFIG.STREET_SPACING)) + 'px';
        
        // Calculate street width to span the full layout
        const streetWidth = (MAP_CONFIG.MAX_STALLS_PER_SIDE * MAP_CONFIG.DEFAULT_STALL_WIDTH * MAP_CONFIG.BLOCK_SIZE) + 
                           MAP_CONFIG.MAIN_STREET_GAP;
        streetElement.style.width = streetWidth + 'px';
        streetElement.style.height = (MAP_CONFIG.STREET_WIDTH * MAP_CONFIG.BLOCK_SIZE) + 'px';
        streetElement.dataset.street = street.name;
        
        mapElements.mapContainer.appendChild(streetElement);
    });
}

function renderMainStreet(stalls) {
    // Calculate the actual width of the first section (before Main Street)
    // using consistent paired width logic
    let maxBeforeMainStreetWidth = 0;
    
    // Check all streets
    MAP_CONFIG.STREETS.forEach(street => {
        if (street.index === -1) return;
        
        const streetStalls = stalls.filter(s => s.StreetName === street.name);
        
        // Group stalls by position pairs for this street (only before Main Street)
        const positionPairs = {};
        streetStalls.forEach(stall => {
            const stallIndexOnSide = Math.ceil(parseStallNumber(stall.StallNumber).position / 2);
            const isRightSide = parseStallNumber(stall.StallNumber).position % 2 === 0;
            
            // Only consider stalls before Main Street
            if (stallIndexOnSide <= Math.floor(MAP_CONFIG.MAX_STALLS_PER_SIDE / 2)) {
                if (!positionPairs[stallIndexOnSide]) {
                    positionPairs[stallIndexOnSide] = { left: null, right: null };
                }
                
                if (isRightSide) {
                    positionPairs[stallIndexOnSide].right = stall;
                } else {
                    positionPairs[stallIndexOnSide].left = stall;
                }
            }
        });
        
        // Calculate total width for this street using max width per pair
        let streetWidth = 0;
        for (let i = 1; i <= Math.floor(MAP_CONFIG.MAX_STALLS_PER_SIDE / 2); i++) {
            if (positionPairs[i]) {
                let leftWidth = 0;
                let rightWidth = 0;
                
                if (positionPairs[i].left) {
                    leftWidth = (positionPairs[i].left.stall_width || MAP_CONFIG.DEFAULT_STALL_WIDTH) * MAP_CONFIG.BLOCK_SIZE;
                }
                if (positionPairs[i].right) {
                    rightWidth = (positionPairs[i].right.stall_width || MAP_CONFIG.DEFAULT_STALL_WIDTH) * MAP_CONFIG.BLOCK_SIZE;
                }
                
                streetWidth += Math.max(leftWidth, rightWidth, MAP_CONFIG.DEFAULT_STALL_WIDTH * MAP_CONFIG.BLOCK_SIZE);
            } else {
                // No stalls at this position, use default width
                streetWidth += MAP_CONFIG.DEFAULT_STALL_WIDTH * MAP_CONFIG.BLOCK_SIZE;
            }
        }
        
        maxBeforeMainStreetWidth = Math.max(maxBeforeMainStreetWidth, streetWidth);
    });
    
    // Calculate Main Street position based on actual stall widths
    const mainStreetX = MAP_CONFIG.MAP_MARGIN + maxBeforeMainStreetWidth;
    
    // Render Main Street (vertical)
    const mainStreet = document.createElement('div');
    mainStreet.className = 'street main-street';
    mainStreet.style.position = 'absolute';
    mainStreet.style.left = mainStreetX + 'px';
    mainStreet.style.top = MAP_CONFIG.MAP_MARGIN + 'px';
    mainStreet.style.width = MAP_CONFIG.MAIN_STREET_GAP + 'px';
    
    // Calculate height to span all streets
    const validStreets = MAP_CONFIG.STREETS.filter(s => s.index !== -1);
    const maxStreetIndex = Math.max(...validStreets.map(s => s.index));
    const mainStreetHeight = (maxStreetIndex + 1) * MAP_CONFIG.STREET_SPACING + 
                           (MAP_CONFIG.DEFAULT_STALL_DEPTH * MAP_CONFIG.BLOCK_SIZE * 2) + 
                           (MAP_CONFIG.STREET_WIDTH * MAP_CONFIG.BLOCK_SIZE);
    
    mainStreet.style.height = mainStreetHeight + 'px';
    
    mapElements.mapContainer.appendChild(mainStreet);
    
    return mainStreetX; // Return position for label positioning
}

function renderStreetLabels(mainStreetX) {
    MAP_CONFIG.STREETS.forEach((street, index) => {
        // Skip streets with index -1
        if (street.index === -1) return;
        
        const label = document.createElement('div');
        label.className = 'street-label';
        label.textContent = street.name;
        label.style.position = 'absolute';
        label.style.left = (MAP_CONFIG.MAP_MARGIN - 10) + 'px';
        label.style.top = (MAP_CONFIG.MAP_MARGIN + (street.index * MAP_CONFIG.STREET_SPACING) + 20) + 'px';
        label.style.transform = 'translateX(-100%)';
        
        mapElements.mapContainer.appendChild(label);
    });
    
    // Main Street label - use the passed in position
    const mainLabel = document.createElement('div');
    mainLabel.className = 'street-label';
    mainLabel.textContent = 'Main Street';
    mainLabel.style.position = 'absolute';
    mainLabel.style.left = (mainStreetX + (MAP_CONFIG.MAIN_STREET_GAP / 2)) + 'px';
    mainLabel.style.top = (MAP_CONFIG.MAP_MARGIN - 10) + 'px';
    mainLabel.style.transform = 'translateY(-100%) translateX(-50%) rotate(-90deg)';
    mainLabel.style.transformOrigin = 'center bottom';
    
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
