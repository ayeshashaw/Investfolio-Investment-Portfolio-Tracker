import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Add userId state to track user changes
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setUserId(user.id);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Clear any existing portfolio data before login
      localStorage.removeItem('portfolioAssets');
      
      const response = await fetch('http://localhost:3777/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      const { token } = data;
      const decoded = jwtDecode(token);

      const user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        token,
      };

      // Set the new user ID
      setUserId(user.id);
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      return user;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (name, email, password) => {
    try {
      // Clear any existing portfolio data before signup
      localStorage.removeItem('portfolioAssets');
      
      const response = await fetch('http://localhost:3777/api/user/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to signup');
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error('Token not received');
      }

      const decoded = jwtDecode(data.token);
      const user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        token: data.token,
      };
      
      // Set the new user ID
      setUserId(user.id);
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', data.token);

      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    // Clear any user-specific data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('portfolioAssets');
    setCurrentUser(null);
    setUserId(null);
  };

  const value = {
    currentUser,
    userId,
    login,
    signup,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export { useAuth, AuthProvider };