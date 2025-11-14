import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api"; // backend chạy ở cổng 3000 + prefix /api

export const apiRequest = async (endpoint, method = "GET", body = null, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

// API functions for products
export const getProducts = async (page = 1, limit = 12, filters = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });

  const response = await fetch(`${API_BASE_URL}/products?${params}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch products");
  }
  
  return data;
};

export const searchProducts = async (query, page = 1, limit = 12) => {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: limit.toString()
  });

  const response = await fetch(`${API_BASE_URL}/products/search?${params}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || "Failed to search products");
  }
  
  return data;
};

export const getHomeData = async () => {
  const response = await fetch(`${API_BASE_URL}/products/home`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch home data");
  }
  
  return data;
};
