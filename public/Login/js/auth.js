/**
 * BPS Authentication Protocol - JWT Management
 */

const Auth = {
    // Key used for localStorage
    TOKEN_KEY: 'bps_auth_token',

    /**
     * Saves the JWT to local storage
     * @param {string} token 
     */
    saveToken(token) {
        if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
            console.log('Token saved successfully.');
        }
    },

    /**
     * Retrieves the JWT from local storage
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    /**
     * Removes the JWT from local storage (Logout)
     */
    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        console.log('Token removed.');
    },

    /**
     * Checks if the user is currently authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        const token = this.getToken();
        // In a real app, you would also verify token expiration here
        return !!token;
    },

    /**
     * Parses the JWT payload (decoding without verification)
     * @returns {object|null}
     */
    getUserProfile() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error parsing token payload', e);
            return null;
        }
    },

    /**
     * Toggles visibility of a password field and its icon
     * @param {string} inputId 
     * @param {string} iconId 
     */
    togglePasswordVisibility(inputId, iconId) {
        const passwordInput = document.getElementById(inputId);
        const toggleIcon = document.getElementById(iconId);
        
        if (passwordInput && toggleIcon) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.textContent = 'visibility_off';
            } else {
                passwordInput.type = 'password';
                toggleIcon.textContent = 'visibility';
            }
        }
    },

    /**
     * Sends login credentials to the API
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<object>}
     */
    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                this.saveToken(result.token);
                // In a real app, you might also want to save the user profile
                // localStorage.setItem('bps_user', JSON.stringify(result.user));
            }

            return result;
        } catch (error) {
            console.error('Login Error:', error);
            return { success: false, data: 'Connection to server failed.' };
        }
    },

    /**
     * Helper to perform fetch with Authorization header
     * @param {string} url 
     * @param {object} options 
     * @returns {Promise<object>}
     */
    async authorizedFetch(url, options = {}) {
        const token = this.getToken();
        if (!token) {
            window.location.href = '../../Login/pages/login_screen.html';
            return { success: false, data: 'No authentication token found.' };
        }

        const defaultHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        options.headers = { ...defaultHeaders, ...options.headers };

        try {
            const response = await fetch(url, options);
            
            // Handle unauthorized or expired token
            if (response.status === 401 || response.status === 403) {
                // Check if it's specifically a 401/403 related to token
                const data = await response.json();
                if (data.data && (data.data.includes('token') || data.data.includes('Access denied'))) {
                    this.removeToken();
                    window.location.href = '../../Login/pages/login_screen.html';
                    return data;
                }
                return data;
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, data: 'Connection to server failed.' };
        }
    },

    /**
     * Fetch all users
     */
    async getUsers() {
        return this.authorizedFetch('/api/auth');
    },

    /**
     * Create a new user
     */
    async createUser(userData) {
        return this.authorizedFetch('/api/auth', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    /**
     * Update an existing user
     */
    async updateUser(id, userData) {
        return this.authorizedFetch(`/api/auth/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    /**
     * Permanent Delete a user
     */
    async deleteUser(id) {
        return this.authorizedFetch(`/api/auth/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Toggle a user's is_active status (Deactivate/Activate)
     */
    async toggleUserStatus(id) {
        return this.authorizedFetch(`/api/auth/status/${id}`, {
            method: 'PUT'
        });
    }
};

// Export for use in other scripts if using modules, 
// otherwise it's globally available in the browser.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}
