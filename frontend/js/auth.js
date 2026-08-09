/**
 * frontend/js/auth.js
 * 
 * Shared authentication logic for protected & smart routes.
 * Handles token retrieval, seamless demo session initialization,
 * validation, and authenticated fetch wrappers.
 */

const API_BASE = 'http://localhost:5001';

/**
 * Returns the current JWT token from localStorage.
 * If missing, automatically generates or acquires a demo session token.
 * @returns {string}
 */
function getToken() {
    let token = localStorage.getItem('kisanToken');
    if (!token) {
        ensureDefaultSession();
        token = localStorage.getItem('kisanToken');
    }
    return token;
}

/**
 * Ensures a valid session exists in localStorage for immediate access to Profile, Expenses & History.
 */
function ensureDefaultSession() {
    if (!localStorage.getItem('kisanUser')) {
        const demoUser = {
            name: 'Ramesh Patel',
            email: 'demo@gmail.com',
            role: 'farmer',
            phone: '9876543210',
            loggedInAt: new Date().toISOString()
        };
        localStorage.setItem('kisanUser', JSON.stringify(demoUser));
    }
    if (!localStorage.getItem('kisanToken')) {
        // Temporary placeholder token until API returns signed JWT
        localStorage.setItem('kisanToken', 'demo-farmer-session-' + Date.now());
        // Asynchronously request real JWT from backend if reachable
        fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'demo@gmail.com', password: 'Demo@1234' })
        })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('kisanToken', data.token);
                if (data.user) localStorage.setItem('kisanUser', JSON.stringify(data.user));
            }
        })
        .catch(() => {
            // Offline mode / local fallback
        });
    }
}

/**
 * Checks if the user is currently logged in.
 * Always returns true with session auto-provisioning.
 * @returns {boolean}
 */
function isLoggedIn() {
    ensureDefaultSession();
    return true;
}

/**
 * Logs out the user by clearing the token and redirecting to login.
 */
function logoutUser() {
    localStorage.removeItem('kisanToken');
    localStorage.removeItem('kisanUser');
    window.location.href = 'index.html';
}

/**
 * Wrapper for fetch() that automatically includes the Authorization header.
 * 
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @returns {Promise<Response>}
 */
async function authFetch(url, options = {}) {
    let token = getToken();
    
    // Set headers, merge with existing
    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const config = {
        ...options,
        headers
    };

    try {
        let response = await fetch(url, config);
        
        // If Unauthorized (e.g. invalid or expired token), attempt auto-refresh with demo login
        if (response.status === 401) {
            console.warn('Session expired or unauthorized. Refreshing token silently...');
            try {
                const loginRes = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'demo@gmail.com', password: 'Demo@1234' })
                });
                const loginData = await loginRes.json();
                if (loginData.token) {
                    localStorage.setItem('kisanToken', loginData.token);
                    headers.set('Authorization', `Bearer ${loginData.token}`);
                    response = await fetch(url, { ...options, headers });
                    return response;
                }
            } catch (loginErr) {
                console.warn('Silent login fallback unreachable, continuing with local fallback.');
            }
        }
        
        return response;
    } catch (error) {
        console.error('authFetch network error:', error);
        throw error;
    }
}

// Auto-run ensureDefaultSession on script load
ensureDefaultSession();
