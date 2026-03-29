import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/axios";

// -----------------------------------
// Types
// -----------------------------------
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  // Add other fields if the API returns more
}

interface Meta {
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number;
  prev: number | null;
  next: number | null;
}

interface NotificationState {
  data: Notification[];
  meta: Meta | null;
  loading: boolean;
  error: string | null;
}

// -----------------------------------
// Initial State
// -----------------------------------
const initialState: NotificationState = {
  data: [],
  meta: null,
  loading: false,
  error: null,
};

// -----------------------------------
// Async Thunk
// -----------------------------------
export const fetchAllNotifications = createAsyncThunk<
  { data: Notification[]; meta: Meta },
  void
>("notifications/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<{ data: Notification[]; meta: Meta }>(
      "/notification/find-all"
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch notifications"
    );
  }
});

// -----------------------------------
// Slice
// -----------------------------------
const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllNotifications.fulfilled,
        (state, action: PayloadAction<{ data: Notification[]; meta: Meta }>) => {
          state.loading = false;
          state.data = action.payload.data;
          state.meta = action.payload.meta;
        }
      )
      .addCase(fetchAllNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = String(
          action.payload || action.error.message || "Failed to fetch notifications"
        );
      });
  },
});

export default notificationSlice.reducer;
