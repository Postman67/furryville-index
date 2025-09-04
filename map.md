# Interactive Mall Map System

## Overview
The interactive mall map provides a top-down view of The Mall with 5 floors, allowing users to navigate between floors and click on stalls to view details.

## Architecture

### File Structure
- `templates/mall_map.html` - Main map template
- `static/css/mall-map.css` - Map styling and layout
- `static/js/mall-map.js` - Interactive functionality and floor switching

### Floor/Stall Addressing System
- **Format**: `XYZ Street Name`
  - X = Floor number (1-5)
  - YZ = Stall position (01-99)
  - Example: "321 Wall Street" = Floor 3, Position 21, Wall Street

### Streets Layout
- **Cross Streets** (running horizontally): 9 blocks wide
  - Wall Street
  - Artist Alley
  - Woke Ave
  - Five
  - Poland Street
- **Main Street** (running vertically): Connects all cross streets

## Configuration Variables

### Map Layout (`mall-map.js`)
```javascript
const MAP_CONFIG = {
    // Grid dimensions
    GRID_WIDTH: 9,           // Number of blocks across each street
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
```

### Street Configuration
```javascript
const STREETS = [
    { name: 'Wall Street', id: 'wall-street' },
    { name: 'Artist Alley', id: 'artist-alley' },
    { name: 'Woke Ave', id: 'woke-ave' },
    { name: 'Five', id: 'five' },
    { name: 'Poland Street', id: 'poland-street' }
];
```

### Stall Size Variations
```javascript
const STALL_SIZES = {
    small: { width: 40, height: 30 },
    medium: { width: 60, height: 40 },
    large: { width: 80, height: 50 },
    xlarge: { width: 100, height: 60 }
};
```

## Core Functions

### `generateFloorMap(floorNumber)`
- Creates the visual grid for a specific floor
- Queries database for stall data
- Renders stalls with appropriate sizes and colors

### `switchFloor(floorNumber)`
- Handles floor navigation
- Updates floor selector UI
- Triggers map regeneration with transition effects

### `handleStallClick(stallNumber, streetName)`
- Processes stall selection
- Shows stall details popup or navigates to stall page
- Updates URL for direct linking

### `loadStallData(floorNumber)`
- Fetches stall data from the API endpoint
- Caches data for performance
- Returns formatted stall information

## API Integration
- Uses existing `/api/the-mall` endpoint
- Filters data by floor number
- Supports real-time updates

## Responsive Design
- Mobile-friendly touch controls
- Scalable map that fits different screen sizes
- Collapsible floor selector on mobile

## Future Enhancements
- Search functionality to highlight specific stalls
- Filter by stall type or availability
- 3D visualization toggle
- Save favorite stalls
- Walking directions between stalls

## Easy Customization Points

1. **Colors**: Modify `MAP_CONFIG.FLOOR_COLORS` and color constants
2. **Grid Size**: Adjust `GRID_WIDTH` and `FLOOR_COUNT`
3. **Stall Sizes**: Update `STALL_SIZES` object
4. **Animation Speed**: Change `TRANSITION_SPEED`
5. **Visual Effects**: Modify hover and selection styles in CSS
6. **Street Layout**: Update `STREETS` array to add/remove streets

## Database Requirements
The map requires the existing `the_mall` table with:
- `StallNumber` (format: XYZ where X=floor, YZ=position)
- `StreetName`
- `StallName`
- `IGN` (owner)
- `ItemsSold`

## Performance Considerations
- Virtual scrolling for large floors
- Lazy loading of stall details
- Efficient canvas rendering for complex layouts
- Debounced resize handlers
