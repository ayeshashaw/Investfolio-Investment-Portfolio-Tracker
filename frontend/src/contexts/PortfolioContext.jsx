import { createContext, useContext, useState, useEffect } from 'react';
import { mockHistoricalData } from '../data/mockData';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const PortfolioContext = createContext(null);

export function usePortfolio() {
  return useContext(PortfolioContext);
}

export function PortfolioProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [portfolioChangePercent, setPortfolioChangePercent] = useState(0);
  const [portfolioChangeAmount, setPortfolioChangeAmount] = useState(0);
  
  // Get auth context to be aware of user changes
  const { currentUser, userId } = useAuth();

  // Reset portfolio data when user changes or logs out
  useEffect(() => {
    // Clear assets when user changes or logs out
    setAssets([]);
    setPortfolioValue(0);
    setPortfolioChangePercent(0);
    setPortfolioChangeAmount(0);
    
    // Only fetch assets if there's a logged-in user
    if (currentUser) {
      fetchAssets();
    }
  }, [userId]); // This will trigger when the user ID changes

  // Fetch assets from the backend
  const fetchAssets = async () => {
    setLoading(true);
    try {
      // Only proceed if we have a token
      const token = localStorage.getItem('token');
      if (!token) {
        setAssets([]);
        setLoading(false);
        return;
      }

      const response = await axios.get('https://investfolio.onrender.com/api/user/getassets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status) {
        const fetchedAssets = response.data.data;
        setAssets(fetchedAssets);
        calculatePortfolioStats(fetchedAssets);
      } else {
        console.error('Failed to fetch assets:', response.data.message);
        setAssets([]);
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate portfolio statistics
  const calculatePortfolioStats = (assetList) => {
    const totalValue = assetList.reduce((sum, asset) => sum + (asset.currentPrice * asset.quantity), 0);
    const totalInvested = assetList.reduce((sum, asset) => sum + (asset.purchasePrice * asset.quantity), 0);
    const changeAmount = totalValue - totalInvested;
    const changePercent = totalInvested > 0 ? (changeAmount / totalInvested) * 100 : 0;

    setPortfolioValue(totalValue);
    setPortfolioChangeAmount(changeAmount);
    setPortfolioChangePercent(changePercent);
  };

  // Add a new asset
  const addAsset = async (newAsset) => {
    // This is mainly kept for compatibility
    // After API call, fetchAssets() will update the state
    return newAsset;
  };

  // Update an existing asset
  const updateAsset = async (updatedAsset) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `https://investfolio.onrender.com/api/user/updateasset/${updatedAsset.id}`,
        {
          assetName: updatedAsset.name,
          symbol: updatedAsset.symbol,
          assetType: updatedAsset.type,
          Quantity: updatedAsset.quantity,
          purchaseDate: updatedAsset.purchaseDate,
          currentPrice: updatedAsset.currentPrice,
          purchasePrice: updatedAsset.purchasePrice,
          logoUrl: updatedAsset.logoUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status) {
        // Fetch all assets to ensure our state is in sync with backend
        await fetchAssets();
        return response.data;
      } else {
        console.error('Failed to update asset:', response.data.message);
        return response.data;
      }
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  };

  // Remove an asset
  const removeAsset = async (assetId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(
        `https://investfolio.onrender.com/api/user/deleteasset/${assetId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status) {
        // Fetch all assets to ensure our state is in sync with backend
        await fetchAssets();
        return response.data;
      } else {
        console.error('Failed to delete asset:', response.data.message);
        return response.data;
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  };

  // Get historical data for an asset
  const getAssetHistoricalData = (assetId, timeframe = '1M') => {
    // In a real app, this would fetch data from an API
    // For this demo, we'll use mock data
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return null;

    // Return mock historical data for the specified asset and timeframe
    return mockHistoricalData[asset.symbol] ?
      mockHistoricalData[asset.symbol][timeframe] :
      mockHistoricalData.default[timeframe];
  };

  // Get asset allocation by type
  const getAssetAllocation = () => {
    const allocation = {};

    assets.forEach(asset => {
      const value = asset.currentPrice * asset.quantity;
      allocation[asset.type] = (allocation[asset.type] || 0) + value;
    });

    return allocation;
  };

  const value = {
    assets,
    loading,
    portfolioValue,
    portfolioChangePercent,
    portfolioChangeAmount,
    addAsset,
    updateAsset,
    removeAsset,
    getAssetHistoricalData,
    getAssetAllocation,
    fetchAssets
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}