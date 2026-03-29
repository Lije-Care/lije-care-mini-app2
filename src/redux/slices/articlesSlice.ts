import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/api/axios'; // your axios instance

export interface Article {
  id: string;
  title: string;
  author: string;
  rating: number;
  tags: string[];
  image: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ArticleState {
  articles: Article[];
  article?: Article;
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: ArticleState = {
  articles: [],
  total: 0,
  loading: false,
  error: null,
};

// ✅ Async Thunks
export const fetchArticles = createAsyncThunk(
  'articles/fetchAll',
  async ({ page = 1, limit = 100 }: { page?: number; limit?: number }, thunkAPI) => {
    try {
      const res = await api.get(`/articles/find-all?page=${page}&limit=${limit}`);
      return res.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch articles');
    }
  }
);

export const fetchArticleById = createAsyncThunk(
  'articles/fetchById',
  async (id: string, thunkAPI) => {
    try {
      const res = await api.get(`/articles/${id}`);
      return res.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch article');
    }
  }
);

export const createArticle = createAsyncThunk(
  'articles/create',
  async (articleData: Partial<Article>, thunkAPI) => {
    try {
      const res = await api.post('/articles', articleData);
      return res.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create article');
    }
  }
);

export const updateArticle = createAsyncThunk(
  'articles/update',
  async ({ id, data }: { id: string; data: Partial<Article> }, thunkAPI) => {
    try {
      const res = await api.patch(`/articles/${id}`, data);
      return res.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update article');
    }
  }
);

export const deleteArticle = createAsyncThunk(
  'articles/delete',
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/articles/${id}`);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete article');
    }
  }
);

// Slice
const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    resetArticleState(state) {
      state.article = undefined;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchArticles.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArticles.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.articles = action.payload.data || action.payload;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchArticleById.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArticleById.fulfilled, (state, action: PayloadAction<Article>) => {
        state.loading = false;
        state.article = action.payload;
      })
      .addCase(fetchArticleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createArticle.fulfilled, (state, action: PayloadAction<Article>) => {
        state.articles.unshift(action.payload);
      })
      .addCase(updateArticle.fulfilled, (state, action: PayloadAction<Article>) => {
        const index = state.articles.findIndex(article => article.id === action.payload.id);
        if (index !== -1) state.articles[index] = action.payload;
      })
      .addCase(deleteArticle.fulfilled, (state, action: PayloadAction<string>) => {
        state.articles = state.articles.filter(article => article.id !== action.payload);
      });
  },
});

export const { resetArticleState } = articlesSlice.actions;
export default articlesSlice.reducer;
