import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa";
import { Page } from "@/components/Page";

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      <div className="p-4 max-w-3xl mx-auto space-y-4 bg-gray-800 min-h-screen">
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-60 object-cover rounded-xl"
          />
        ) : (
          <div className="flex h-60 w-full items-center justify-center rounded-xl bg-gray-700 text-sm text-gray-300">
            No image
          </div>
        )}

        <div className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight text-white">
            {article.title}
          </h1>
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
                className="px-2 py-1 text-xs  border-gray-300 text-white  "
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="pt-4 space-y-2 text-base leading-relaxed text-white">
          {article.content}
        </div>
      </div>
    </Page>
  );
};

export default ArticleDetail;
