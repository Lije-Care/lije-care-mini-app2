import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import api from "@/api/axios";
import { ParentInfo } from "@/types";
import { normalizePhoneNumber } from "@/utils/phone";

interface Parent {
  id: number | string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  telegram_username?: string;
  email?: string;
  avatarUrl?: string;
  name?: string;
  children?: Child[];
  [key: string]: any;
}

interface ParentState {
  parent: Parent | null;
  userDetails: any | null;
  loading: boolean;
  error: string | null;
}
export type Child = {
  id: string;
  parent_id: string;
  name: string;
  date_of_birth: string;
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

const initialState: ParentState = {
  parent: null,
  userDetails: null,
  loading: false,
  error: null,
};

// Base API URL

// Async Thunks for API Calls
export const fetchParent = createAsyncThunk(
  "parent/fetchParent",
  async (telegramId: string) => {
    try {
      // First API call: find parent by telegramId
      const response = await api.get<Parent>(`users/find-one/${telegramId}`);
      const parent = response.data;

      // Second API call: find user by parentId
      const findOneByIdResponse = await api.get<any>(
        `users/find-one/${parent.id}`
      );
      const userDetails = findOneByIdResponse.data;
      // console.log({ userDetails });

      // Return both results
      return {
        parent,
        userDetails,
      };
    } catch (error: any) {
      console.error("Error fetching parent:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch parent"
      );
    }
  }
);

export const addParent = createAsyncThunk(
  "parent/addParent",
  async (newParent: Omit<Parent, "id">) => {
    const response = await api.post<Parent>("", newParent);
    return response.data;
  }
);

export const updateParent = createAsyncThunk<
  Parent,
  {
    updatedParent: ParentInfo;
    userID: string;
  },
  { rejectValue: string }
>(
  "parent/updateParent",
  async ({
    updatedParent,
    userID,
  }, { rejectWithValue }) => {
    try {
      const payload: Partial<ParentInfo> = {
        ...updatedParent,
        firstName: updatedParent.firstName?.trim() || "",
        lastName: updatedParent.lastName?.trim() || "",
        address: updatedParent.address?.trim() || "",
        city: updatedParent.city?.trim() || "",
        telegram_username: updatedParent.telegram_username?.trim() || "",
        avatarUrl: updatedParent.avatarUrl?.trim() || "",
      };

      const normalizedPhone = normalizePhoneNumber(updatedParent.phone);
      if (normalizedPhone) {
        payload.phone = normalizedPhone;
      } else {
        delete payload.phone;
      }

      const response = await api.patch<{ data: Parent } | Parent>(
        `users/update/${userID}`,
        payload
      );
      return "data" in response.data ? response.data.data : response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update parent"
      );
    }
  }
);

export const deleteParent = createAsyncThunk(
  "parent/deleteParent",
  async (id: number) => {
    await axios.delete(`/${id}`);
    return id;
  }
);

// Redux Slice
const parentSlice = createSlice({
  name: "parent",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchParent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchParent.fulfilled,
        (
          state,
          action: PayloadAction<{ parent: Parent; userDetails: any }>
        ) => {
          state.loading = false;
          state.parent = action.payload.parent;
          state.userDetails = action.payload.userDetails;
        }
      )
      .addCase(fetchParent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch parent";
      })
      .addCase(updateParent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateParent.fulfilled, (state, action: PayloadAction<Parent>) => {
        state.loading = false;
        state.parent = action.payload;
        state.userDetails = state.userDetails
          ? { ...state.userDetails, ...action.payload }
          : action.payload;
      })
      .addCase(updateParent.rejected, (state, action) => {
        state.loading = false;
        state.error = String(
          action.payload || action.error.message || "Failed to update parent"
        );
      });
  },
});

export default parentSlice.reducer;
