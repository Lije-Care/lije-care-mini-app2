import { Headline, Text, Spinner } from "@telegram-apps/telegram-ui";
import { useEffect, useState } from "react";
import { Page } from "@/components/Page";
import { useTranslation } from "react-i18next";
import { Promotion } from "@/types/promotion";
import { getPromotions } from "@/services/promotion";

export const PromotionsList = () => {
  const { t } = useTranslation();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getPromotions(50);
      setPromotions(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || t("Failed to load promotions."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  return (
    <Page back={true}>
      <div style={{ padding: "20px" }} className=" bg-gray-800">
        <Headline className=" text-white" style={{ marginBottom: "20px" }}>
          📢 {t("Promotions")}
        </Headline>

        {loading && (
          <div className="text-center">
            <Spinner size="s" />
            <Text className="text-white">{t("Loading promotions...")}</Text>
          </div>
        )}

        {error && (
          <Text
            className=" text-white"
            style={{ color: "red", marginBottom: "10px" }}
          >
            {error}
          </Text>
        )}

        {!loading && !error && promotions.length === 0 && (
          <Text className=" text-white">{t("No promotions found.")}</Text>
        )}

        {!loading && !error && promotions.length > 0 && (
          <div className="flex overflow-x-auto space-x-4 pb-2 snap-x snap-mandatory bg-gray-800">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="snap-start flex-shrink-0 w-72 sm:w-80 bg-gray-800"
              >
                <div
                  className=" bg-gray-600 rounded-lg"
                  style={{
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    height: "100%",
                  }}
                >
                  {promo.imageUrl && (
                    <img
                      src={promo.imageUrl}
                      alt={promo.title}
                      style={{
                        width: "100%",
                        maxHeight: "160px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  )}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      className=" text-white"
                      style={{ marginBottom: "4px" }}
                    >
                      {promo.title}
                    </span>
                    <p
                      className=" text-white"
                      style={{
                        whiteSpace: "pre-line",
                        wordBreak: "break-word",
                        fontSize: "14px",
                      }}
                    >
                      {promo.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
};

export default PromotionsList;
