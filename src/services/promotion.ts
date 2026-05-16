import api from "@/api/axios";
import { Promotion } from "@/types/promotion";

interface PromotionListResponse {
  data?: Promotion[];
}

const resolveMediaUrl = (value?: string | null): string => {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  const baseUrl = api.defaults.baseURL;

  if (!baseUrl) {
    return raw;
  }

  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return raw;
  }
};

const normalizePromotion = (promotion: Partial<Promotion>): Promotion => ({
  id: String(promotion.id ?? ""),
  title: String(promotion.title ?? ""),
  description: String(promotion.description ?? ""),
  imageUrl: resolveMediaUrl(promotion.imageUrl),
});

export const getPromotions = async (limit = 10): Promise<Promotion[]> => {
  const response = await api.get<PromotionListResponse>(
    `/promotion/find-all?page=1&limit=${limit}`,
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!Array.isArray(response.data?.data)) {
    return [];
  }

  return response.data.data.map(normalizePromotion).filter((promotion) => promotion.id);
};

export const getPromotionById = async (id: string): Promise<Promotion> => {
  const response = await api.get<Promotion>(`/promotion/find-one/${id}`, {
    headers: { "Content-Type": "application/json" },
  });

  return normalizePromotion(response.data);
};
