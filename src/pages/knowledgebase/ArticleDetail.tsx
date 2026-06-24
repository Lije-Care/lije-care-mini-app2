import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa";
import { Page } from "@/components/Page";
import { ChevronLeftIcon } from "@/design-system/icons";
import { useTranslation } from "react-i18next";

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { articles } = useSelector((state: RootState) => state.articles);
  const article = articles.find((item) => item.id === id || "");

  const renderStars = (rating: number) => {
    const stars = [];
    const rounded = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rounded ? (
          <FaStar key={i} className="text-yellow-400 w-4 h-4" />
        ) : (
          <FaRegStar key={i} className="text-yellow-400 w-4 h-4" />
        )
      );
    }
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  if (!article) {
    return <div className="p-4 text-red-500">Article not found.</div>;
  }

  return (
    <Page back={true}>
      <div className="min-h-screen bg-gray-800">
        <div className="mx-auto max-w-3xl px-4 pb-8 pt-6">
          <div className="relative mb-6 flex items-center justify-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={t("Back")}
              className="absolute left-0 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-700 shadow-sm transition-transform active:scale-[0.96]"
            >
              <ChevronLeftIcon size={24} />
            </button>
            <h1 className="max-w-[70%] truncate text-center text-lg font-black text-white sm:text-xl">
              {article.title}
            </h1>
          </div>

          <div className="space-y-4">
            {article.image ? (
              <img
                src={article.image}
                alt={article.title}
                className="h-60 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-60 w-full items-center justify-center rounded-xl bg-gray-700 text-sm text-gray-300">
                No image
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-2xl font-bold leading-tight text-white">
                {article.title}
              </h2>
              <p className="text-sm text-gray-300">By {article.author}</p>
              {article.rating != null ? (
                renderStars(article.rating)
              ) : (
                <p className="text-sm text-gray-400">No rating</p>
              )}
            </div>

            {article.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs text-white"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-2 pt-4 text-base leading-relaxed text-white">
              {article.content}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default ArticleDetail;
