import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/axios";
import { Meta, User } from "@/types/specialist";

interface SpecialistState {
  specialists: User[];
  loading: boolean;
  error: string | null;
  pagination: Meta | null;
}

// ✅ Then define initialState
const initialState: SpecialistState = {
  specialists: [],
  loading: false,
  error: null,
  pagination: null,
};

export const fetchSpecialists = createAsyncThunk<
  { data: User[]; pagination: Meta },
  { page?: number; limit?: number },
  { rejectValue: string }
>("specialists/fetchAll", async ({ page = 1, limit = 1000 }, thunkAPI) => {
  try {
    const response = await api.get(
      `/specialists/find-all?page=${page}&limit=${limit}`
    );
    return {
      data: response.data.data,
      pagination: response.data.meta,
    };
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to fetch specialists"
    );
  }
});

// Slice
const specialistSlice = createSlice({
  name: "specialists",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpecialists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSpecialists.fulfilled,
        (state, action: PayloadAction<{ data: User[]; pagination: Meta }>) => {
          state.loading = false;
          state.specialists = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchSpecialists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default specialistSlice.reducer;
