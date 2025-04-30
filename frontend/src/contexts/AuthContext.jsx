import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // Check if token is still valid
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      // Check if token is expired
      return decoded.exp * 1000 > Date.now();
    } catch (error) {
      console.error('Invalid token:', error);
      return false;
    }
  };

  // Initialize user from local storage
  useEffect(() => {
    const checkStoredAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          // Check if token is still valid
          if (isTokenValid(storedToken)) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
            setUserId(user.id);
            setAuthToken(storedToken);
          } else {
            // Token expired, clear storage
            console.log('Token expired, logging out');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setCurrentUser(null);
            setUserId(null);
            setAuthToken(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear potentially corrupted auth data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkStoredAuth();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    
    try {
      // Clear any existing data before login
      localStorage.removeItem('portfolioAssets');
      
      const response = await fetch('https://investfolio.onrender.com/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.message || 'Login failed');
        throw new Error(data.message || 'Failed to login');
      }

      if (!data.token) {
        setAuthError('No token received');
        throw new Error('No token received from server');
      }

      const { token } = data;
      const decoded = jwtDecode(token);

      const user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };

      // Set auth state
      setAuthToken(token);
      setUserId(user.id);
      setCurrentUser(user);
      
      // Store auth data
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      return user;
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Login failed');
      throw error;
    }
  };

  const signup = async (name, email, password) => {
    setAuthError(null);
    
    try {
      // Clear any existing data before signup
      localStorage.removeItem('portfolioAssets');
      
      const response = await fetch('https://investfolio.onrender.com/api/user/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.message || 'Signup failed');
        throw new Error(data.message || 'Failed to signup');
      }

      if (!data.token) {
        setAuthError('No token received');
        throw new Error('Token not received');
      }

      const token = data.token;
      const decoded = jwtDecode(token);
      
      const user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };
      
      // Set auth state
      setAuthToken(token);
      setUserId(user.id);
      setCurrentUser(user);
      
      // Store auth data
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      return user;
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError(error.message || 'Signup failed');
      throw error;
    }
  };

  const logout = () => {
    // Clear any user-specific data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('portfolioAssets');
    
    // Reset auth state
    setCurrentUser(null);
    setUserId(null);
    setAuthToken(null);
    setAuthError(null);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!currentUser && !!authToken && isTokenValid(authToken);
  };

  // Refresh token if needed
  const refreshToken = async () => {
    try {
      if (!authToken) return false;
      
      const response = await fetch('http://localhost:3777/api/user/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        const newToken = data.token;
        const decoded = jwtDecode(newToken);
        
        const user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
        };
        
        // Update auth state
        setAuthToken(newToken);
        setCurrentUser(user);
        
        // Update storage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const value = {
    currentUser,
    userId,
    authToken,
    authError,
    login,
    signup,
    logout,
    loading,
    isAuthenticated,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export { useAuth, AuthProvider };