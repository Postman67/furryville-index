# Interactive Mall Map System

## Overview
The interactive mall map displays a top-down view of The Mall's 5 floors, showing each stall positioned according to Minecraft coordinates. Users can switch between floors and click on stalls to view details.

## File Structure
- `templates/mall_map.html` - Main map page template
- `static/css/mall-map.css` - Map styling and layout
- `static/js/mall-map.js` - Map logic and interactivity
- `fv_flask_site.py` - Backend API endpoints

## Stall Addressing System
Stalls are addressed using a 3-digit system: `XYZ`
- `X` = Floor number (1-5)
- `YZ` = Stall position on that floor (01-99)

Examples:
- `321` = Floor 3, Position 21 (Wall Street)
- `105` = Floor 1, Position 05 (Wall Street)

## Layout Logic

### Street System
- **Cross Streets**: 9 blocks wide, run horizontally across the map
  - Wall Street
  - Artist Alley  
  - Woke Ave
  - Five
  - Poland Street
- **Main Street**: Runs vertically through the center, connecting all cross streets

### Stall Positioning
- Stalls alternate between top (right) and bottom (left) sides of each street
- Even stall numbers (02, 04, 06...) = Left side (bottom of street)
- Odd stall numbers (01, 03, 05...) = Right side (top of street)
- Stalls have variable width and depth (measured in Minecraft blocks)
- Default size: 6 blocks wide × 9 blocks deep (if not specified in database)

## Configuration Variables

### CSS Variables (in mall-map.css)
```css
:root {
  /* Map scaling and dimensions */
  --block-size: 8px;              /* Size of 1 Minecraft block in pixels */
  --street-width: 72px;           /* 9 blocks × 8px */
  --main-street-width: 72px;      /* 9 blocks × 8px */
  
  /* Colors */
  --occupied-stall-color: #4a90e2;     /* Blue for occupied stalls */
  --vacant-stall-color: #95a5a6;       /* Gray for vacant stalls */
  --street-color: #34495e;             /* Dark gray for streets */
  --stall-border-color: #2c3e50;       /* Border around stalls */
  --hover-color: #f39c12;              /* Orange for hover effects */
  
  /* Interactive elements */
  --floor-btn-active: #e74c3c;         /* Red for active floor button */
  --floor-btn-inactive: #7f8c8d;       /* Gray for inactive floor buttons */
}
```

### JavaScript Configuration (in mall-map.js)
```javascript
const MAP_CONFIG = {
  // Map dimensions and scaling
  BLOCK_SIZE: 8,                    // Pixels per Minecraft block
  STREET_WIDTH: 9,                  // Blocks wide for cross streets
  MAIN_STREET_WIDTH: 9,             // Blocks wide for main street
  
  // Default stall dimensions (in blocks)
  DEFAULT_STALL_WIDTH: 6,
  DEFAULT_STALL_DEPTH: 9,
  
  // Animation and interaction
  HOVER_SCALE: 1.05,               // Scale factor on hover
  ANIMATION_DURATION: 200,         // MS for hover animations
  
  // Floor configuration
  FLOORS: [1, 2, 3, 4, 5],
  FLOOR_LABELS: {
    1: "Ground Floor",
    2: "Second Floor", 
    3: "Third Floor",
    4: "Fourth Floor",
    5: "Fifth Floor"
  },
  
  // Street layout
  STREETS: [
    { name: "Wall Street", y_position: 0 },
    { name: "Artist Alley", y_position: 1 },
    { name: "Woke Ave", y_position: 2 },
    { name: "Five", y_position: 3 },
    { name: "Poland Street", y_position: 4 }
  ]
};
```

## How It Works

### 1. Map Generation
1. JavaScript fetches stall data from `/api/the-mall`
2. Data is filtered by selected floor
3. Each stall is positioned based on:
   - Street name → Y coordinate
   - Stall position → X coordinate
   - Even/odd position → Side of street (top/bottom)

### 2. Coordinate Calculation
```javascript
function calculateStallPosition(stallNumber, streetName) {
  const floor = Math.floor(stallNumber / 100);
  const position = stallNumber % 100;
  const isRightSide = position % 2 === 1;
  
  const streetIndex = getStreetIndex(streetName);
  const y = streetIndex * (STREET_WIDTH + DEFAULT_STALL_DEPTH * 2);
  
  let x = (Math.floor(position / 2) - 1) * DEFAULT_STALL_WIDTH;
  
  if (!isRightSide) {
    y += STREET_WIDTH + DEFAULT_STALL_DEPTH;
  }
  
  return { x, y };
}
```

### 3. Stall Rendering
- Each stall is rendered as a colored rectangle
- Size determined by `stall_width` and `stall_depth` from database
- Color indicates occupancy status (occupied = blue, vacant = gray)
- Hover effects and click handlers for interactivity

### 4. Floor Switching
- Floor selector buttons filter displayed stalls
- Active floor highlighted with different styling
- Stall count updated for each floor

## Database Integration
The system expects the following database fields:
- `StallNumber` - 3-digit address (required)
- `StreetName` - Street name (required)
- `IGN` - Owner username (required)
- `StallName` - Shop name (required)
- `ItemsSold` - Description of items (optional)
- `stall_width` - Width in blocks (optional, defaults to 6)
- `stall_depth` - Depth in blocks (optional, defaults to 9)

## Customization Guide

### Changing Colors
Edit the CSS variables in `mall-map.css` under `:root`

### Adjusting Map Scale
- Modify `--block-size` in CSS
- Update `BLOCK_SIZE` in JavaScript config

### Adding New Streets
1. Add to `STREETS` array in JavaScript config
2. Update positioning calculations if needed

### Modifying Stall Sizes
- Change `DEFAULT_STALL_WIDTH` and `DEFAULT_STALL_DEPTH`
- Add database fields `stall_width` and `stall_depth` for per-stall customization

### Floor Management
- Modify `FLOORS` array to add/remove floors
- Update `FLOOR_LABELS` object for custom floor names

## Performance Considerations
- Map is re-rendered on floor changes
- Stall data is cached after initial API call
- CSS transforms used for smooth hover animations
- Event delegation for efficient click handling

## Browser Compatibility
- Modern browsers with CSS Grid and Flexbox support
- JavaScript ES6+ features used
- Responsive design for mobile devices
