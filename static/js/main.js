// Furryville Index - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('🐾 Furryville Index loaded successfully!');
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading animation for feature cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards for animation
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Add click handlers for navigation
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            // Remove active class from all links
            document.querySelectorAll('.nav-menu a').forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
        });
    });

    // Initialize search functionality
    initializeSearch();

    // Load database data if we're on a shop page
    loadShopData();

    // Check database status on home page
    checkDatabaseStatus();

    // Fun easter egg - console message
    console.log(`
    🎨 Welcome to Furryville Index! 🎨
    ================================
    Your guide to shopping in Furryville
    If you're seeing this, you might be a developer too! 
    Feel free to contribute to our project! 🐾
    `);
});

// Load shop data from database
async function loadShopData() {
    const currentPath = window.location.pathname;
    let endpoint = null;
    
    // Determine which data to load based on current page
    if (currentPath.includes('warp-hall')) {
        endpoint = '/api/warp-hall';
    } else if (currentPath.includes('the-mall')) {
        endpoint = '/api/the-mall';
    }
    
    if (!endpoint) return;
    
    try {
        console.log(`Loading shop data from ${endpoint}...`);
        showLoadingIndicator();
        
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Shop data loaded:', data);
        
        // Update table with database data
        updateShopTable(data.shops || []);
        
        hideLoadingIndicator();
        showNotification(`Loaded ${data.shops?.length || 0} shops from database`, 'success');
        
    } catch (error) {
        console.error('Error loading shop data:', error);
        hideLoadingIndicator();
        showNotification('Failed to load shop data from database', 'error');
        
        // Keep placeholder data if database fails
        console.log('Using placeholder data due to database error');
    }
}

// Update shop table with database data
function updateShopTable(shops) {
    const tableBody = document.querySelector('#shopTable tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (shops.length === 0) {
        // Don't show any message - just leave table empty
        console.log('No shops in database - table left empty');
        return;
    }
    
    // Add database rows
    shops.forEach(shop => {
        const row = document.createElement('tr');
        
        // Handle different table structures
        if (window.location.pathname.includes('warp-hall')) {
            // Warp Hall: StallNumber, StallName, IGN
            row.innerHTML = `
                <td data-label="Stall Number">${shop.StallNumber || 'N/A'}</td>
                <td data-label="Stall Name">${shop.StallName || 'Unnamed Shop'}</td>
                <td data-label="Owner IGN">${shop.IGN || 'Unknown'}</td>
            `;
        } else if (window.location.pathname.includes('the-mall')) {
            // The Mall: StallNumber, StreetName, StallName, IGN, ItemsSold
            row.innerHTML = `
                <td data-label="Stall Number">${shop.StallNumber || 'N/A'}</td>
                <td data-label="Street Name">${shop.StreetName || 'Unknown Street'}</td>
                <td data-label="Stall Name">${shop.StallName || 'Unnamed Shop'}</td>
                <td data-label="Owner IGN">${shop.IGN || 'Unknown'}</td>
                <td data-label="Items Sold">${shop.ItemsSold || 'No data'}</td>
            `;
        }
        
        tableBody.appendChild(row);
    });
    
    console.log(`Updated table with ${shops.length} shops from database`);
}

// Show loading indicator
function showLoadingIndicator() {
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;
    
    // Add loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        border-radius: 15px;
    `;
    
    loadingOverlay.innerHTML = `
        <div style="text-align: center; color: #764ba2;">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #764ba2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p>Loading shop data...</p>
        </div>
    `;
    
    // Add spin animation if not already exists
    if (!document.getElementById('spinAnimation')) {
        const style = document.createElement('style');
        style.id = 'spinAnimation';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    tableContainer.style.position = 'relative';
    tableContainer.appendChild(loadingOverlay);
}

// Hide loading indicator
function hideLoadingIndicator() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Refresh shop data
async function refreshShopData() {
    console.log('Refreshing shop data...');
    await loadShopData();
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('shopSearch');
    const clearButton = document.getElementById('clearSearch');
    const shopTable = document.getElementById('shopTable');
    
    if (!searchInput || !shopTable) return;

    // Search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        filterTable(searchTerm);
    });

    // Clear search
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            searchInput.value = '';
            filterTable('');
            searchInput.focus();
        });
    }

    // Enter key to focus search, / key as shortcut
    document.addEventListener('keydown', function(e) {
        if (e.key === '/' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === 'Escape') {
            searchInput.blur();
        }
        // F5 or Ctrl+R to refresh data
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            refreshShopData();
        }
    });
}

// Filter table based on search term
function filterTable(searchTerm) {
    const table = document.getElementById('shopTable');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let rowText = '';
        
        // Combine all cell text for searching
        cells.forEach(cell => {
            rowText += cell.textContent.toLowerCase() + ' ';
        });

        if (searchTerm === '' || rowText.includes(searchTerm)) {
            row.classList.remove('hidden');
            row.style.display = '';
            visibleCount++;
        } else {
            row.classList.add('hidden');
            row.style.display = 'none';
        }
    });

    // Show no results message if needed
    updateNoResultsMessage(visibleCount, searchTerm);
}

// Update no results message
function updateNoResultsMessage(visibleCount, searchTerm) {
    const table = document.getElementById('shopTable');
    if (!table) return;

    // Remove existing no results row
    const existingNoResults = table.querySelector('.no-results-row');
    if (existingNoResults) {
        existingNoResults.remove();
    }

    // Add no results row if needed
    if (visibleCount === 0 && searchTerm !== '') {
        const tbody = table.querySelector('tbody');
        const noResultsRow = document.createElement('tr');
        noResultsRow.className = 'no-results-row';
        
        // Determine correct column span based on page
        const colSpan = window.location.pathname.includes('warp-hall') ? '3' : '5';
        
        noResultsRow.innerHTML = `
            <td colspan="${colSpan}" style="text-align: center; padding: 2rem; color: #666; font-style: italic;">
                No shops found matching "${searchTerm}". Try a different search term.
            </td>
        `;
        tbody.appendChild(noResultsRow);
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: 'bold',
        zIndex: '9999',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease'
    });
    
    // Set background color based on type
    const colors = {
        'info': '#667eea',
        'success': '#48bb78',
        'warning': '#ed8936',
        'error': '#f56565'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Check database status and display status message
async function checkDatabaseStatus() {
    // Only run on home page
    if (!window.location.pathname.includes('/') || window.location.pathname !== '/') {
        return;
    }
    
    const statusContainer = document.getElementById('db-status');
    if (!statusContainer) return;
    
    try {
        console.log('Checking database status...');
        const response = await fetch('/api/status');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Status response:', data);
        
        const isHealthy = data.database_status === 'connected';
        
        statusContainer.className = `db-status ${isHealthy ? 'db-online' : 'db-offline'}`;
        statusContainer.innerHTML = `
            <span class="status-icon">${isHealthy ? '✅' : '❌'}</span>
            <span class="status-text">${isHealthy ? 'Database is healthy' : 'Database offline'}</span>
        `;
        
    } catch (error) {
        console.error('Error checking database status:', error);
        statusContainer.className = 'db-status db-offline';
        statusContainer.innerHTML = `
            <span class="status-icon">❌</span>
            <span class="status-text">Database offline</span>
        `;
    }
}
