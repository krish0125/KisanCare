/**
 * frontend/js/auth.js
 * 
 * Shared authentication logic for Phase 6 protected routes.
 * Handles token retrieval, validation, and authenticated fetch wrappers.
 */

const API_BASE = 'http://localhost:5001';

/**
 * Returns the current JWT token from localStorage.
 * @returns {string|null}
 */
function getToken() {
    return localStorage.getItem('kisanToken');
}

/**
 * Checks if the user is currently logged in with a token.
 * @returns {boolean}
 */
function isLoggedIn() {
    return !!getToken();
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
 * If a 401 Unauthorized response is received, clears token and redirects to login.
 * 
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @returns {Promise<Response>}
 */
async function authFetch(url, options = {}) {
    const token = getToken();
    
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
        const response = await fetch(url, config);
        
        // If Unauthorized, clear session and redirect
        if (response.status === 401) {
            console.warn('Session expired or unauthorized. Redirecting to login.');
            localStorage.removeItem('kisanToken');
            // Allow page a brief moment to show toast if implemented on page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }
        
        return response;
    } catch (error) {
        console.error('authFetch error:', error);
        throw error;
    }
}
