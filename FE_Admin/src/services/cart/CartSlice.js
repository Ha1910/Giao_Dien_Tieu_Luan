import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../services/axiosClient";

// Lấy giỏ hàng
export const fetchCart = createAsyncThunk("cart/fetchCart", async () => {
  const res = await axiosClient.get("/cart");
  return res;
});

// Thêm sản phẩm vào giỏ
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (product) => {
    const res = await axiosClient.post("/cart", {
      productId: product.id,
      quantity: 1,
    });
    return res;
  }
);

// Cập nhật số lượng
export const updateCart = createAsyncThunk(
  "cart/updateCart",
  async ({ itemId, quantity }) => {
    const res = await axiosClient.put(`/cart/${itemId}`, { quantity });
    return res;
  }
);

// Xóa sản phẩm
export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (itemId) => {
    await axiosClient.delete(`/cart/${itemId}`);
    return itemId;
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateCart.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default cartSlice.reducer;
