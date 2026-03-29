import { useSelector } from "react-redux";
import ArticleCard from "./ArticleCard";
import { RootState } from "@/redux/store";
import { Page } from "@/components/Page";
import { useTranslation } from "react-i18next";

const ArticlesPage = () => {
  const { t } = useTranslation();
  const { articles } = useSelector((state: RootState) => state.articles);

  return (
    <Page back={true}>
      <div className=" min-h-screen p-6 space-y-6 max-w-5xl mx-auto bg-gray-800 ">
        <h1 className="text-2xl font-bold text-center text-white">
          📚 {t("All Articles")}
        </h1>
        {articles.length === 0 ? (
          <p className="text-center text-gray-500">
            {t("No articles available")}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
};

export default ArticlesPage;
