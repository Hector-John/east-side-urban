import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  addresses: [],
  error: null,
};

// Add New Address
export const addNewAddress = createAsyncThunk(
  "./addresses/addNewAddress",
  async (formData) => {
    const response = await axios.post(
      `${import.meta.env.VITE_URL_API}/api/address/add`,
      formData
    );
    return response.data;
  }
);

// Fetch Addresses
export const fetchAddresses = createAsyncThunk(
  "./addresses/fetchAddresses",
  async (userId) => {
    const response = await axios.get(
      `${import.meta.env.VITE_URL_API}/api/address/get/${userId}`
    );
    return response.data;
  }
);

// Edit Address
export const editAddress = createAsyncThunk(
  "./addresses/editAddress",
  async ({ formData, userId, addressId }) => {
    const response = await axios.put(
      `${import.meta.env.VITE_URL_API}/api/address/update/${userId}/${addressId}`,
      formData
    );
    return response.data;
  }
);

// Delete Address
export const deleteAddress = createAsyncThunk(
  "./addresses/deleteAddress",
  async ({ userId, addressId }) => {
    const response = await axios.delete(
      `${import.meta.env.VITE_URL_API}/api/address/delete/${userId}/${addressId}`
    );
    return response.data;
  }
);

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addNewAddress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addNewAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses.push(action.payload);
      })
      .addCase(addNewAddress.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchAddresses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses = action.payload.data || [];
      })
      .addCase(fetchAddresses.rejected, (state) => {
        state.isLoading = false;
        state.addresses = [];
      });
  },
});

export default addressSlice.reducer;
