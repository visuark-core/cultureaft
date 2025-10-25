import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import UserDataService from '../../services/userDataService'

// Mock UserDataService
vi.mock('../../services/userDataService')

// Test component to access auth context
const TestComponent = () => {
  const { user, loading, login, logout, isAdmin } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="isAdmin">{isAdmin.toString()}</div>
      <button 
        data-testid="login-user" 
        onClick={() => login('user@test.com', 'password', false)}
      >
        Login User
      </button>
      <button 
        data-testid="login-admin" 
        onClick={() => login('admin@cultureaft.com', 'password', false)}
      >
        Login Admin
      </button>
      <button 
        data-testid="login-remember" 
        onClick={() => login('user@test.com', 'password', true)}
      >
        Login with Remember Me
      </button>
      <button data-testid="logout" onClick={logout}>
        Logout
      </button>
    </div>
  )
}

const renderWithAuth = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  )
}

describe('AuthContext Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage mock
    const mockLocalStorage = window.localStorage as any
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.removeItem.mockClear()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Session Persistence', () => {
    it('should restore valid session from localStorage on mount', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'user@test.com',
        role: 'user' as const
      }
      
      const futureTime = Date.now() + 1000000 // Future expiry
      
      const mockLocalStorage = window.localStorage as any
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockUser)) // user
        .mockReturnValueOnce(futureTime.toString()) // sessionExpiry
        .mockReturnValueOnce('false') // rememberMe

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
      })
    })

    it('should clear expired session on mount', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'user@test.com',
        role: 'user' as const
      }
      
      const pastTime = Date.now() - 1000000 // Past expiry
      
      const mockLocalStorage = window.localStorage as any
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockUser)) // user
        .mockReturnValueOnce(pastTime.toString()) // sessionExpiry
        .mockReturnValueOnce('false') // rememberMe

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('user')).toHaveTextContent('null')
      })

      // Should clear expired session data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sessionExpiry')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('rememberMe')
    })

    it('should handle corrupted localStorage data gracefully', async () => {
      const mockLocalStorage = window.localStorage as any
      mockLocalStorage.getItem
        .mockReturnValueOnce('invalid-json') // corrupted user data
        .mockReturnValueOnce('123456789') // sessionExpiry
        .mockReturnValueOnce('false') // rememberMe

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('user')).toHaveTextContent('null')
      })

      // Should clear corrupted data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sessionExpiry')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('rememberMe')
    })

    it('should extend session for non-remember-me users', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'user@test.com',
        role: 'user' as const
      }
      
      const futureTime = Date.now() + 1000000 // Future expiry
      
      const mockLocalStorage = window.localStorage as any
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockUser)) // user
        .mockReturnValueOnce(futureTime.toString()) // sessionExpiry
        .mockReturnValueOnce('false') // rememberMe (not remember me)

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // Should extend session for non-remember-me users
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sessionExpiry',
        expect.any(String)
      )
    })
  })

  describe('Login Functionality', () => {
    it('should login regular user and store session data', async () => {
      const mockUpdateLastLogin = vi.fn().mockResolvedValue(undefined)
      const mockUserDataService = UserDataService as any
      mockUserDataService.mockImplementation(() => ({
        updateLastLogin: mockUpdateLastLogin
      }))

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByTestId('login-user').click()
      })

      await waitFor(() => {
        const userData = JSON.parse(screen.getByTestId('user').textContent!)
        expect(userData.email).toBe('user@test.com')
        expect(userData.role).toBe('user')
        expect(screen.getByTestId('isAdmin')).toHaveTextContent('false')
      })

      const mockLocalStorage = window.localStorage as any
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', expect.any(String))
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sessionExpiry', expect.any(String))
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('rememberMe', 'false')
    })

    it('should login admin user correctly', async () => {
      const mockUpdateLastLogin = vi.fn().mockResolvedValue(undefined)
      const mockUserDataService = UserDataService as any
      mockUserDataService.mockImplementation(() => ({
        updateLastLogin: mockUpdateLastLogin
      }))

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByTestId('login-admin').click()
      })

      await waitFor(() => {
        const userData = JSON.parse(screen.getByTestId('user').textContent!)
        expect(userData.email).toBe('admin@cultureaft.com')
        expect(userData.role).toBe('admin')
        expect(screen.getByTestId('isAdmin')).toHaveTextContent('true')
      })
    })

    it('should handle remember me functionality', async () => {
      const mockUpdateLastLogin = vi.fn().mockResolvedValue(undefined)
      const mockUserDataService = UserDataService as any
      mockUserDataService.mockImplementation(() => ({
        updateLastLogin: mockUpdateLastLogin
      }))

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByTestId('login-remember').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).not.toHaveTextContent('null')
      })

      const mockLocalStorage = window.localStorage as any
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('rememberMe', 'true')
      
      // Should set longer expiry for remember me (30 days vs 24 hours)
      const sessionExpiryCalls = mockLocalStorage.setItem.mock.calls.filter(
        call => call[0] === 'sessionExpiry'
      )
      expect(sessionExpiryCalls).toHaveLength(1)
    })

    it('should handle updateLastLogin service errors gracefully', async () => {
      const mockUpdateLastLogin = vi.fn().mockRejectedValue(new Error('Service error'))
      const mockUserDataService = UserDataService as any
      mockUserDataService.mockImplementation(() => ({
        updateLastLogin: mockUpdateLastLogin
      }))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByTestId('login-user').click()
      })

      await waitFor(() => {
        // Login should still succeed even if updateLastLogin fails
        expect(screen.getByTestId('user')).not.toHaveTextContent('null')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to update last login:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Logout Functionality', () => {
    it('should logout and clear all session data', async () => {
      const mockUpdateLastLogin = vi.fn().mockResolvedValue(undefined)
      const mockUserDataService = UserDataService as any
      mockUserDataService.mockImplementation(() => ({
        updateLastLogin: mockUpdateLastLogin
      }))

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // First login
      await act(async () => {
        screen.getByTestId('login-user').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).not.toHaveTextContent('null')
      })

      // Then logout
      await act(async () => {
        screen.getByTestId('logout').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null')
        expect(screen.getByTestId('isAdmin')).toHaveTextContent('false')
      })

      const mockLocalStorage = window.localStorage as any
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sessionExpiry')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('rememberMe')
    })
  })

  describe('Session Expiration Logic', () => {
    it('should set correct expiry time for regular session (24 hours)', async () => {
      const mockUpdateLastLogin = vi.fn().mockResolvedValue(undefined)
      const mockUserDataService = UserDataService as any
      mockUserDataService.mockImplementation(() => ({
        updateLastLogin: mockUpdateLastLogin
      }))

      const mockDate = vi.spyOn(Date, 'now').mockReturnValue(1000000)

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByTestId('login-user').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).not.toHaveTextContent('null')
      })

      const mockLocalStorage = window.localStorage as any
      const expectedExpiry = 1000000 + (24 * 60 * 60 * 1000) // 24 hours
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sessionExpiry', expectedExpiry.toString())

      mockDate.mockRestore()
    })

    it('should set correct expiry time for remember me session (30 days)', async () => {
      const mockUpdateLastLogin = vi.fn().mockResolvedValue(undefined)
      const mockUserDataService = UserDataService as any
      mockUserDataService.mockImplementation(() => ({
        updateLastLogin: mockUpdateLastLogin
      }))

      const mockDate = vi.spyOn(Date, 'now').mockReturnValue(1000000)

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByTestId('login-remember').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).not.toHaveTextContent('null')
      })

      const mockLocalStorage = window.localStorage as any
      const expectedExpiry = 1000000 + (30 * 24 * 60 * 60 * 1000) // 30 days
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sessionExpiry', expectedExpiry.toString())

      mockDate.mockRestore()
    })
  })
})