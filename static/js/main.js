// Furryville Index - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('🐾 Furryville Index loaded successfully!');
    
    // Pagination state
    window.paginationState = {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0,
        allData: [],
        filteredData: null // null means no filter, use allData
    };
    
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
                entry.target.classList.add('card-visible');
            }
        });
    }, observerOptions);

    // Observe feature cards for animation
    document.querySelectorAll('.feature-card').forEach(card => {
        card.classList.add('card-hidden');
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
    🎨 Welcome to Furryville! 🎨
    ================================
    Developed and maintained by Postman67 https://links.peterd.xyz
    If you're seeing this, you might be a developer too! 
    Feel free to reach out for site suggestions! 🐾
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
        
        // Store all data for pagination
        window.paginationState.allData = data.shops || [];
        window.paginationState.filteredData = null; // Reset filter
        window.paginationState.totalItems = window.paginationState.allData.length;
        window.paginationState.totalPages = Math.ceil(window.paginationState.totalItems / window.paginationState.itemsPerPage);
        window.paginationState.currentPage = 1;
        
        // Update table with first page of data
        updateShopTable();
        
        // Setup pagination controls
        setupPagination();
        
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

// Update shop table with current page data
function updateShopTable() {
    const tableBody = document.querySelector('#shopTable tbody');
    if (!tableBody) return;
    
    const { currentPage, itemsPerPage } = window.paginationState;
    const dataToUse = window.paginationState.filteredData || window.paginationState.allData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = dataToUse.slice(startIndex, endIndex);
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (pageData.length === 0) {
        // Don't show any message - just leave table empty
        console.log('No shops in database - table left empty');
        return;
    }
    
    // Add database rows for current page
    pageData.forEach(shop => {
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
    
    console.log(`Updated table with ${pageData.length} shops from database (page ${currentPage})`);
    
    // Update pagination display after table update
    updatePaginationDisplay();
}

// Update table with filtered data (used by search)
function updateShopTableWithFilteredData() {
    updateShopTable(); // Same logic, but uses filteredData when available
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
    if (!window.paginationState || !window.paginationState.allData) return;
    
    if (searchTerm === '') {
        // Reset to show all data
        window.paginationState.filteredData = window.paginationState.allData;
    } else {
        // Filter the entire dataset
        window.paginationState.filteredData = window.paginationState.allData.filter(shop => {
            const searchableText = [
                shop.StallNumber,
                shop.StallName,
                shop.IGN,
                shop.StreetName,
                shop.ItemsSold
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchTerm);
        });
    }
    
    // Update pagination with filtered data
    window.paginationState.totalItems = window.paginationState.filteredData.length;
    window.paginationState.totalPages = Math.ceil(window.paginationState.totalItems / window.paginationState.itemsPerPage);
    window.paginationState.currentPage = 1; // Reset to first page
    
    // Update table display
    updateShopTableWithFilteredData();
    
    // Update pagination display
    updatePaginationDisplay();
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
        
        const isOnline = data.database_status === 'connected';
        
        statusContainer.className = `db-status ${isOnline ? 'db-online' : 'db-offline'}`;
        statusContainer.innerHTML = `
            <span class="status-icon">${isOnline ? '✅' : '❌'}</span>
            <span class="status-text">${isOnline ? 'Database is online' : 'Database offline'}</span>
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

// Pagination Functions
function setupPagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (!prevBtn || !nextBtn) return;
    
    // Add event listeners
    prevBtn.addEventListener('click', () => {
        if (window.paginationState.currentPage > 1) {
            window.paginationState.currentPage--;
            updateShopTable();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (window.paginationState.currentPage < window.paginationState.totalPages) {
            window.paginationState.currentPage++;
            updateShopTable();
        }
    });
    
    // Add click handlers for page numbers
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('page-number') && !e.target.classList.contains('current')) {
            const pageNum = parseInt(e.target.textContent);
            if (pageNum && pageNum <= window.paginationState.totalPages) {
                window.paginationState.currentPage = pageNum;
                updateShopTable();
            }
        }
    });
    
    updatePaginationDisplay();
}

function updatePaginationDisplay() {
    const { currentPage, totalPages } = window.paginationState;
    
    // Update button states
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        if (currentPage === 1) {
            prevBtn.classList.add('disabled');
        } else {
            prevBtn.classList.remove('disabled');
        }
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
        if (currentPage === totalPages || totalPages === 0) {
            nextBtn.classList.add('disabled');
        } else {
            nextBtn.classList.remove('disabled');
        }
    }
    
    // Update page numbers
    const currentPageEl = document.getElementById('currentPage');
    const firstPageEl = document.getElementById('firstPage');
    const lastPageEl = document.getElementById('lastPage');
    const prevPageNumEl = document.getElementById('prevPageNum');
    const nextPageNumEl = document.getElementById('nextPageNum');
    const leftDotsEl = document.getElementById('leftDots');
    const rightDotsEl = document.getElementById('rightDots');
    
    if (!currentPageEl) return;
    
    currentPageEl.textContent = currentPage;
    
    // Hide all elements initially
    [firstPageEl, lastPageEl, prevPageNumEl, nextPageNumEl, leftDotsEl, rightDotsEl].forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    if (totalPages <= 1) return;
    
    // Show first page if not current and not adjacent
    if (currentPage > 3 && firstPageEl) {
        firstPageEl.style.display = 'inline';
        firstPageEl.textContent = '1';
    }
    
    // Show left dots if there's a gap
    if (currentPage > 4 && leftDotsEl) {
        leftDotsEl.style.display = 'inline';
    }
    
    // Show previous page number
    if (currentPage > 1 && prevPageNumEl) {
        prevPageNumEl.style.display = 'inline';
        prevPageNumEl.textContent = currentPage - 1;
    }
    
    // Show next page number
    if (currentPage < totalPages && nextPageNumEl) {
        nextPageNumEl.style.display = 'inline';
        nextPageNumEl.textContent = currentPage + 1;
    }
    
    // Show right dots if there's a gap
    if (currentPage < totalPages - 3 && rightDotsEl) {
        rightDotsEl.style.display = 'inline';
    }
    
    // Show last page if not current and not adjacent
    if (currentPage < totalPages - 2 && lastPageEl) {
        lastPageEl.style.display = 'inline';
        lastPageEl.textContent = totalPages;
    }
    
    console.log(`Pagination updated: Page ${currentPage} of ${totalPages}`);
}
