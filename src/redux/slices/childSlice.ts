import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/axios";
import { CreateChildDto } from "@/types/child";

// -----------------------------------
// Types
// -----------------------------------
export type Child = {
  avatar: any;
  assessment: any;
  id: string;
  parentId: string; // ✅ updated from parent_id
  name: string;
  date_of_birth: string;
  activity_level: "Active" | "Moderate" | "Sedentary";
  gender: string;
  weight: number;
  height: number;
  muac: number | null;
  dietary_restrictions: string | null;
  allergies: string | null;
  medications: string | null;
  createdAt: string;
  updatedAt: string;
};

interface ChildState {
  data: Child[];
  loading: boolean;
  error: string | null;
}

// -----------------------------------
// Initial State
// -----------------------------------
const initialState: ChildState = {
  data: [],
  loading: false,
  error: null,
};

// -----------------------------------
// Async Thunks
// -----------------------------------
export const addChild = createAsyncThunk<Child, CreateChildDto>(
  "children/addChild",
  async (newChild, { rejectWithValue }) => {
    try {
      const response = await api.post<Child>("children/create", newChild);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || "Failed to add child");
    }
  }
);

export const fetchChildrenByParentId = createAsyncThunk<Child[], string>(
  "children/fetchChildrenByParentId",
  async (parentId, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: Child[] }>(
        `children/find-all?parentId=${parentId}`
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch children"
      );
    }
  }
);

export const deleteChildById = createAsyncThunk<string, string>(
  "children/deleteChildById",
  async (childId, thunkAPI) => {
    try {
      await api.delete(`/children/${childId}`);
      return childId;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Delete failed"
      );
    }
  }
);

export const updateChild = createAsyncThunk<Child, Partial<Child>>(
  "children/updateChild",
  async (updateChildData, { rejectWithValue }) => {
    try {
      const response = await api.patch<{ data: Child; message: string } | Child>(
        `children/${updateChildData.id}`,
        updateChildData
      );
      if ("data" in response.data) {
        return response.data.data;
      }
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Update failed");
    }
  }
);

// -----------------------------------
// Slice
// -----------------------------------
const childrenSlice = createSlice({
  name: "children",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Create child
      .addCase(addChild.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addChild.fulfilled, (state, action: PayloadAction<Child>) => {
        state.loading = false;
        state.data.push(action.payload);
      })
      .addCase(addChild.rejected, (state, action) => {
        state.loading = false;
        state.error = String(
          action.payload || action.error.message || "Failed to add child"
        );
      })

      // Fetch children
      .addCase(fetchChildrenByParentId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchChildrenByParentId.fulfilled,
        (state, action: PayloadAction<Child[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchChildrenByParentId.rejected, (state, action) => {
        state.loading = false;
        state.error = String(
          action.payload || action.error.message || "Failed to fetch children"
        );
      })

      // Delete child
      .addCase(
        deleteChildById.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.data = state.data.filter(
            (child) => child.id !== action.payload
          );
        }
      )

      // Update child
      .addCase(updateChild.fulfilled, (state, action: PayloadAction<Child>) => {
        const index = state.data.findIndex(
          (child) => child.id === action.payload.id
        );
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      });
  },
});

export default childrenSlice.reducer;
