import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stockQty: number;
}

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
  searchQuery: "",
};

// Helper function to filter products
const filterProducts = (
  products: Product[],
  searchQuery: string
): Product[] => {
  if (!searchQuery.trim()) return products;

  const query = searchQuery.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query)
  );
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
      state.loading = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Update stock after checkout
    updateProductStock: (
      state,
      action: PayloadAction<{ id: string; newStock: number }>
    ) => {
      const product = state.products.find((p) => p.id === action.payload.id);
      if (product) {
        product.stockQty = action.payload.newStock;
      }
    },
  },
});

export const {
  setLoading,
  setProducts,
  setError,
  setSearchQuery,
  clearError,
  updateProductStock,
} = productsSlice.actions;

// Selectors
export const selectProducts = (state: { products: ProductsState }) =>
  state.products.products;

export const selectFilteredProducts = (state: { products: ProductsState }) =>
  filterProducts(state.products.products, state.products.searchQuery);

export const selectProductsLoading = (state: { products: ProductsState }) =>
  state.products.loading;

export const selectProductsError = (state: { products: ProductsState }) =>
  state.products.error;

export const selectSearchQuery = (state: { products: ProductsState }) =>
  state.products.searchQuery;

export default productsSlice.reducer;
