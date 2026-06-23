import { useNavigate } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa";

const ArticleCard = ({ article, showButton = true }: any) => {
  const navigate = useNavigate();

  const renderStars = (rating: number) => {
    const stars = [];
    const roundedRating = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= roundedRating ? (
          <FaStar key={i} className="text-yellow-400 w-4 h-4" />
        ) : (
          <FaRegStar key={i} className="text-yellow-400 w-4 h-4" />
        )
      );
    }
    return <div className="flex gap-1 mt-1">{stars}</div>;
  };

  return (
    <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition duration-200 h-full flex flex-col w-full ">
      <div className="relative w-full h-40">
        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-sm text-slate-300">
            No image
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col justify-between flex-1">
        <div>
          <h3 className=" text-white text-base font-semibold line-clamp-2">
            {article.title}
          </h3>
          <p className="text-xs text-gray-200 mt-1">by {article.author}</p>
          {article.rating != null ? (
            renderStars(article.rating)
          ) : (
            <p className="mt-1 text-xs text-gray-400">No rating</p>
          )}
          <p className="text-sm text-gray-300 mt-2 line-clamp-3">
            {article.description}
          </p>
        </div>

        {showButton && (
          <button
            onClick={() => navigate(`/articles/${article.id}`)}
            className="mt-3 text-sm text-blue-600 hover:underline font-medium self-start"
          >
            Read More →
          </button>
        )}
      </div>
    </div>
  );
};

export default ArticleCard;
