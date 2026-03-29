import { useNavigate } from "react-router-dom";
import ArticleCard from "./ArticleCard";

const ArticleSliderWidget = ({ articles }: any) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-white">👩‍⚕️ Featured Articles</h2>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {articles?.slice(0, 5).map((article: any) => (
          <div key={article.id} className="snap-start flex-shrink-0 w-72">
            <ArticleCard article={article} />
          </div>
        ))}
      </div>

      <div className="text-right">
        <button
          onClick={() => navigate("/articles")}
          className="text-blue-600 font-semibold hover:underline"
        >
          See More Articles →
        </button>
      </div>
    </div>
  );
};

export default ArticleSliderWidget;
