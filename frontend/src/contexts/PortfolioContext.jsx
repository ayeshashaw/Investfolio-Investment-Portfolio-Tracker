import { createContext, useContext, useState, useEffect } from 'react';
import { mockHistoricalData } from '../data/mockData';
import axios from 'axios';

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

  // Fetch assets from the backend
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get('http://localhost:3777/api/user/getassets', {
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
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchAssets();
  }, []);

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

  // Add a new asset - This is handled in the form component with API call
  const addAsset = async (newAsset) => {
    // This is mainly kept for compatibility
    // The actual API call is in AssetForm
    // After API call, fetchAssets() will update the state
    return newAsset;
  };

  // Update an existing asset
  const updateAsset = async (updatedAsset) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `http://localhost:3777/api/user/updateasset/${updatedAsset.id}`,
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
        `http://localhost:3777/api/user/deleteasset/${assetId}`,
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
    fetchAssets  // Export this function so components can use it
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}