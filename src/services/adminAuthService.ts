import apiClient, { ApiResponse } from './apiClient';
import tokenService from './tokenService';

export interface AdminLoginRequest {
    email: string;
    password: string;
}

export interface AdminLoginData {
    admin: {
        id: string;
        email: string;
        role: string;
        profile?: {
            firstName?: string;
            lastName?: string;
        };
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface AdminProfile {
    id: string;
    email: string;
    role: string;
    profile?: {
        firstName?: string;
        lastName?: string;
    };
}

class AdminAuthService {
    /**
     * Login admin user
     */
    async login(credentials: AdminLoginRequest): Promise<ApiResponse<AdminLoginData>> {
        try {
            const response = await apiClient.post<AdminLoginData>('/api/admin/auth/login', credentials);

            if (response.success && response.data) {
                console.log('🔍 Admin login response:', response);
                console.log('🔍 Response data:', response.data);
                console.log('🔍 Admin object:', response.data.admin);
                
                // Validate response structure
                if (!response.data.admin) {
                    throw new Error('Invalid response: missing admin data');
                }
                
                if (!response.data.accessToken) {
                    throw new Error('Invalid response: missing access token');
                }
                
                // Store tokens
                const tokenData = {
                    accessToken: response.data.accessToken,
                    refreshToken: response.data.refreshToken,
                    expiresAt: Date.now() + (response.data.expiresIn * 1000),
                    tokenType: 'Bearer'
                };

                tokenService.setTokens(tokenData);

                // Store admin profile with proper structure
                const adminProfile = {
                    id: response.data.admin.id,
                    email: response.data.admin.email,
                    role: response.data.admin.role,
                    profile: response.data.admin.profile
                };
                localStorage.setItem('adminProfile', JSON.stringify(adminProfile));
            } else {
                throw new Error('Invalid response from server');
            }

            return response;
        } catch (error: any) {
            console.error('Admin login failed:', error);
            
            // Handle API response errors
            if (error.response?.data) {
                throw new Error(error.response.data.message || 'Login failed');
            }
            
            // Handle network or other errors
            throw new Error(error.message || 'Login failed');
        }
    }

    /**
     * Logout admin user
     */
    async logout(): Promise<void> {
        try {
            // Call logout endpoint
            await apiClient.post('/api/admin/auth/logout');
        } catch (error) {
            console.error('Logout API call failed:', error);
            // Continue with local logout even if API call fails
        } finally {
            // Clear local storage
            tokenService.clearTokens();
            localStorage.removeItem('adminProfile');
        }
    }

    /**
     * Get current admin profile
     */
    getCurrentAdmin(): AdminProfile | null {
        try {
            const profileStr = localStorage.getItem('adminProfile');
            if (!profileStr) return null;

            return JSON.parse(profileStr);
        } catch (error) {
            console.error('Failed to get admin profile:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated as admin
     */
    isAuthenticated(): boolean {
        const hasTokens = tokenService.hasTokens();
        const hasProfile = !!this.getCurrentAdmin();
        return hasTokens && hasProfile;
    }

    /**
     * Check if admin has specific permission
     */
    hasPermission(resource: string, action: string): boolean {
        const admin = this.getCurrentAdmin();
        if (!admin) return false;

        // For now, assume super_admin has all permissions
        // TODO: Implement proper permission checking based on backend structure
        return admin.role === 'super_admin' || admin.role === 'admin';
    }

    /**
     * Refresh admin session
     */
    async refreshSession(): Promise<boolean> {
        try {
            const newToken = await tokenService.refreshAccessToken();
            return !!newToken;
        } catch (error) {
            console.error('Failed to refresh admin session:', error);
            this.logout();
            return false;
        }
    }

    /**
     * Get current admin user info from backend
     */
    async getCurrentUser(): Promise<any> {
        try {
            const response = await apiClient.get('/api/admin/auth/me');
            return response;
        } catch (error: any) {
            console.error('Failed to get current user:', error);
            throw error;
        }
    }

    /**
     * Initialize admin auth service
     */
    initialize(): void {
        // Check if we have valid tokens and profile
        if (this.isAuthenticated()) {
            // Ensure API client has the token
            const token = tokenService.getAccessToken();
            if (token) {
                apiClient.setAuthToken(token);
            }
        }
    }
}

// Create singleton instance
const adminAuthService = new AdminAuthService();

// Initialize on module load
adminAuthService.initialize();

export default adminAuthService;