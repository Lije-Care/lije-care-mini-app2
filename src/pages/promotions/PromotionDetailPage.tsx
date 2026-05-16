import { Page } from "@/components/Page";
import { Button, Card } from "@/components/ui";
import { getPromotionById } from "@/services/promotion";
import { Promotion } from "@/types/promotion";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const PromotionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const fallbackPromotion = (location.state as { promotion?: Promotion } | null)
    ?.promotion;
  const [promotion, setPromotion] = useState<Promotion | null>(fallbackPromotion ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPromotion = async () => {
    if (!id) {
      setError(t("Failed to load promotions."));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await getPromotionById(id);
      setPromotion(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || t("Failed to load promotions."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotion();
  }, [id, t]);

  return (
    <Page back={true}>
      <div className="min-h-screen bg-[#eef0f5] px-4 py-6">
        <div className="mx-auto max-w-md space-y-5">
          <Button
            variant="ghost"
            color="slate"
            size="sm"
            className="px-0 text-slate-500 hover:bg-transparent"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>

          {loading && (
            <Card className="text-center text-slate-500" padding="lg">
              {t("Loading promotions...")}
            </Card>
          )}

          {!loading && error && (
            <Card className="space-y-4" padding="lg">
              <p className="text-rose-400">{error}</p>
              <Button color="emerald" onClick={fetchPromotion}>
                Retry
              </Button>
            </Card>
          )}

          {!loading && !error && promotion && (
            <Card
              className="space-y-6 rounded-[2rem] border border-slate-100 bg-white px-6 py-7 shadow-sm"
              padding="none"
            >
              <div className="overflow-hidden rounded-[1.75rem] bg-slate-100">
                {promotion.imageUrl ? (
                  <img
                    src={promotion.imageUrl}
                    alt={promotion.title}
                    className="h-52 w-full object-cover"
                    onError={(event) => {
                      const target = event.currentTarget;
                      target.style.display = "none";
                      const nextSibling = target.nextElementSibling as HTMLDivElement | null;
                      if (nextSibling) {
                        nextSibling.style.display = "flex";
                      }
                    }}
                  />
                ) : null}

                <div
                  className={`items-center justify-center bg-gradient-to-br from-[#0b8f74] to-[#132238] px-6 text-center text-sm font-semibold text-white/85 ${
                    promotion.imageUrl ? "hidden" : "flex"
                  } h-52`}
                >
                  Promotion image unavailable
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-[2.1rem] font-bold leading-tight text-slate-800">
                  {promotion.title}
                </h1>

                <p className="whitespace-pre-line text-[15px] leading-8 text-slate-500">
                  {promotion.description || "No description available."}
                </p>
              </div>

              <Button
                color="slate"
                fullWidth
                size="lg"
                className="mt-2 rounded-[1.6rem] bg-[#031b10] uppercase tracking-[0.2em] text-white shadow-none"
                onClick={() => navigate(-1)}
              >
                Close
              </Button>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
};

export default PromotionDetailPage;
