import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/api/axios";
import type { DevAnswer } from "@/design-system/types";

export interface DevelopmentalAssessmentItem {
  id: string;
  childId: string;
  questionId: string;
  subCategory: string;
  answer: DevAnswer;
  createdAt: string;
  updatedAt: string;
}

interface DevelopmentalAssessmentState {
  items: DevelopmentalAssessmentItem[];
  byQuestionId: Record<string, DevAnswer>;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

interface DevelopmentalAssessmentApiResponse {
  data: DevelopmentalAssessmentItem[];
  message: string;
}

interface SaveDevelopmentalAssessmentPayload {
  childId: string;
  items: Array<{
    questionId: string;
    subCategory: string;
    answer: DevAnswer;
  }>;
}

const initialState: DevelopmentalAssessmentState = {
  items: [],
  byQuestionId: {},
  loading: false,
  saving: false,
  error: null,
};

const mapByQuestionId = (items: DevelopmentalAssessmentItem[]) =>
  items.reduce<Record<string, DevAnswer>>((acc, item) => {
    acc[item.questionId] = item.answer;
    return acc;
  }, {});

export const fetchDevelopmentalAssessments = createAsyncThunk<
  DevelopmentalAssessmentItem[],
  string
>(
  "developmentalAssessments/fetchByChildId",
  async (childId, { rejectWithValue }) => {
    try {
      const response = await api.get<DevelopmentalAssessmentApiResponse>(
        `developmental-assessments/${childId}`
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to load developmental assessments"
      );
    }
  }
);

export const saveDevelopmentalAssessmentsBulk = createAsyncThunk<
  DevelopmentalAssessmentItem[],
  SaveDevelopmentalAssessmentPayload
>(
  "developmentalAssessments/saveBulk",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.put<DevelopmentalAssessmentApiResponse>(
        `developmental-assessments/${payload.childId}/bulk`,
        { items: payload.items }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to save developmental assessments"
      );
    }
  }
);

const developmentalAssessmentSlice = createSlice({
  name: "developmentalAssessments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevelopmentalAssessments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDevelopmentalAssessments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.byQuestionId = mapByQuestionId(action.payload);
      })
      .addCase(fetchDevelopmentalAssessments.rejected, (state, action) => {
        state.loading = false;
        state.error = String(
          action.payload ||
            action.error.message ||
            "Failed to load developmental assessments"
        );
      })
      .addCase(saveDevelopmentalAssessmentsBulk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveDevelopmentalAssessmentsBulk.fulfilled, (state, action) => {
        state.saving = false;
        state.items = action.payload;
        state.byQuestionId = mapByQuestionId(action.payload);
      })
      .addCase(saveDevelopmentalAssessmentsBulk.rejected, (state, action) => {
        state.saving = false;
        state.error = String(
          action.payload ||
            action.error.message ||
            "Failed to save developmental assessments"
        );
      });
  },
});

export default developmentalAssessmentSlice.reducer;
