import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProducts, getHomeData } from '../services/api';

const ProductsContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

export const ProductsProvider = ({ children }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all products for fuzzy search
  const loadAllProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load first 100 products for fuzzy search
      const response = await getProducts(1, 100);
      setAllProducts(response.data || []);
    } catch (err) {
      console.error('Error loading products for search:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load home data
  const loadHomeData = async () => {
    try {
      const data = await getHomeData();
      setHomeData(data.data);
      
      // Also add home products to all products for search
      if (data.data) {
        const homeProducts = [
          ...(data.data.latest_products || []),
          ...(data.data.best_selling_products || []),
          ...(data.data.most_viewed_products || []),
          ...(data.data.highest_discount_products || [])
        ];
        
        // Remove duplicates
        const uniqueProducts = homeProducts.filter((product, index, self) =>
          index === self.findIndex(p => p.id === product.id)
        );
        
        setAllProducts(prev => {
          const combined = [...prev, ...uniqueProducts];
          return combined.filter((product, index, self) =>
            index === self.findIndex(p => p.id === product.id)
          );
        });
      }
    } catch (err) {
      console.error('Error loading home data:', err);
      setError(err.message);
    }
  };

  // Load products on mount
  useEffect(() => {
    loadAllProducts();
    loadHomeData();
  }, []);

  // Refresh products
  const refreshProducts = () => {
    loadAllProducts();
  };

  // Add new product to the list (for real-time updates)
  const addProduct = (product) => {
    setAllProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.map(p => p.id === product.id ? product : p);
      }
      return [...prev, product];
    });
  };

  // Update product in the list
  const updateProduct = (productId, updatedProduct) => {
    setAllProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, ...updatedProduct } : p)
    );
  };

  // Remove product from the list
  const removeProduct = (productId) => {
    setAllProducts(prev => prev.filter(p => p.id !== productId));
  };

  const value = {
    allProducts,
    homeData,
    loading,
    error,
    refreshProducts,
    addProduct,
    updateProduct,
    removeProduct
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};

export default ProductsContext;
