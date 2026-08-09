/**
 * KisanCare Structured Navbar Controller
 * Handles active route detection, dropdowns, user avatar display, and mobile drawer.
 */
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
});

function initNavbar() {
    const currentPage = window.location.pathname.split("/").pop().toLowerCase() || 'home.html';
    
    // 1. Highlight active links and dropdown parents
    highlightActiveRoute(currentPage);

    // 2. Populate User Profile Avatar and Name
    updateUserNavState();

    // 3. Setup Mobile Drawer Toggle
    setupMobileDrawer();

    // 4. Setup Touch / Click Dropdowns for accessibility
    setupDropdownBehavior();

    // 5. Fetch Notification Count
    fetchNavNotificationCount();
}

function highlightActiveRoute(currentPage) {
    // Map of pages to parent dropdowns
    const cropServicesPages = ['crop.html', 'disease.html', 'crop-care.html', 'crop-calendar.html', 'fertilizer.html', 'fertilizer-calc.html'];
    const marketFinancePages = ['market.html', 'expenses.html', 'schemes.html'];

    if (cropServicesPages.includes(currentPage)) {
        const cropDropdown = document.getElementById('navCropServices');
        if (cropDropdown) cropDropdown.classList.add('active');
    } else if (marketFinancePages.includes(currentPage)) {
        const marketDropdown = document.getElementById('navMarketFinance');
        if (marketDropdown) marketDropdown.classList.add('active');
    }

    // Highlight individual links
    document.querySelectorAll('.nav-link, .dropdown-item, .drawer-link').forEach(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        if (href === currentPage || (currentPage === '' && href === 'home.html')) {
            link.classList.add('active');
        }
    });
}

function updateUserNavState() {
    try {
        const userStr = localStorage.getItem('kisanUser');
        const user = userStr ? JSON.parse(userStr) : null;
        
        const avatarEl = document.getElementById('navUserAvatar');
        const nameEl = document.getElementById('navUserName');
        const authActionLink = document.getElementById('navAuthAction');

        if (user && user.name) {
            const initial = user.name.trim().charAt(0).toUpperCase() || 'U';
            if (avatarEl) avatarEl.textContent = initial;
            if (nameEl) nameEl.textContent = user.name.split(' ')[0]; // First name
            if (authActionLink) {
                authActionLink.innerHTML = `<span class="material-icons" style="font-size:18px; color:#ef4444;">logout</span> <span data-i18n="nav_logout">Logout</span>`;
                authActionLink.onclick = handleNavLogout;
                authActionLink.href = 'javascript:void(0)';
            }
        } else {
            if (avatarEl) avatarEl.innerHTML = `<span class="material-icons" style="font-size:18px;">person</span>`;
            if (nameEl) nameEl.textContent = 'Account';
            if (authActionLink) {
                authActionLink.innerHTML = `<span class="material-icons" style="font-size:18px; color:#16a34a;">login</span> <span data-i18n="nav_login">Sign In</span>`;
                authActionLink.href = 'index.html';
                authActionLink.onclick = null;
            }
        }
    } catch (e) {
        console.warn('Navbar user state init error:', e);
    }
}

function handleNavLogout(e) {
    if (e) e.preventDefault();
    if (confirm('Are you sure you want to log out of KisanCare?')) {
        localStorage.removeItem('kisanUser');
        localStorage.removeItem('kisanToken');
        window.location.href = 'index.html';
    }
}

function setupMobileDrawer() {
    const toggleBtn = document.getElementById('mobileNavToggle');
    const closeBtn = document.getElementById('mobileDrawerClose');
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileNavOverlay');

    if (!toggleBtn || !drawer || !overlay) return;

    const openDrawer = () => {
        drawer.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    toggleBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
}

function setupDropdownBehavior() {
    // Allows toggling dropdown on touch screens
    document.querySelectorAll('.nav-item').forEach(item => {
        const link = item.querySelector('.nav-link');
        const dropdown = item.querySelector('.nav-dropdown');
        if (link && dropdown) {
            link.addEventListener('click', (e) => {
                if (window.innerWidth <= 1160) {
                    e.preventDefault();
                    item.classList.toggle('open');
                }
            });
        }
    });

    // Close open dropdowns when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-item')) {
            document.querySelectorAll('.nav-item.open').forEach(el => el.classList.remove('open'));
        }
    });
}

function fetchNavNotificationCount() {
    const badge = document.getElementById('navNotifBadge');
    if (!badge) return;

    try {
        const token = localStorage.getItem('kisanToken');
        if (!token) {
            badge.style.display = 'none';
            return;
        }

        // Fetch unread count from notifications endpoint
        fetch('http://localhost:5000/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data && data.notifications) {
                const unread = data.notifications.filter(n => !n.is_read).length;
                if (unread > 0) {
                    badge.textContent = unread > 99 ? '99+' : unread;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        })
        .catch(() => {
            badge.style.display = 'none';
        });
    } catch (e) {
        badge.style.display = 'none';
    }
}
