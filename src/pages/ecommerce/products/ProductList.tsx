import { useEffect, useState } from "react";
import { Page } from "@/components/Page";
import { useTranslation } from "react-i18next";
import Header from "../header/Header";
import api from "@/api/axios";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../redux/slices/cartSlice";

interface Product {
  id: string;
  img: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isFreeDeliveryAvailable?: boolean;
  pickupLocation?: string | null;
}

const ProductList = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/ecommerce?page=${page}&limit=${limit}`, {
        headers: { "Content-Type": "application/json" },
      });
      // console.log(res.data);

      setProducts(res.data?.data || []);

      // Assuming API returns total count of products
      const totalCount = res.data?.total || 0;
      setTotalPages(Math.max(1, Math.ceil(totalCount / limit)));
    } catch (err: any) {
      setError(err?.response?.data?.message || t("Failed to load products."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  // Filter products based on selected category
  // const filteredProducts =
  //   selectedCategory === "all"
  //     ? products
  //     : products.filter((product) => product.category === selectedCategory);
  const filteredProducts = products
    .filter((product) =>
      selectedCategory === "all" ? true : product.category === selectedCategory
    )
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const ProductCard = ({ product }: { product: Product }) => {
    const dispatch = useDispatch();

    const handleAddToCart = () => {
      dispatch(
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.img,
          quantity: 1,
        })
      );
    };

    return (
      <div className="py-2  pl-2 pr-8 w-full shadow-md mt-3">
        <a href={`/#/product-detail/${product.id}`}>
          <img
            src={product.img}
            alt={product.name}
            className="w-full h-34 object-fill rounded-lg"
          />
          <div className="flex item-center justify-between text-sm font-semibold mt-2 mx-2">
            <p>{product.name}</p>
            <p>ETB {product.price}</p>
          </div>
        </a>
        <button
          onClick={handleAddToCart}
          className="bg-blue-500 text-white text-xs py-1 px-2 rounded w-full mt-2"
        >
          Add to Cart
        </button>
      </div>
    );
  };

  return (
    <Page back={true}>
      <div className="min-h-screen bg-gray-800">
        <Header />

        {/* Category Filter */}
        <div className="mt-2 p-2  ">
          <form className="flex w-full">
            <label
              htmlFor="category"
              className="mt-2 w-[170px] block mb-2 text-sm font-medium text-gray-400 dark:text-gray-400"
            >
              {t("Select Category")}
            </label>
            <select
              id="category"
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full p-2 mr-5  mb-6 text-sm text-white border border-gray-300 rounded-lg bg-[#0B364F] "
            >
              <option value="all">{t("All")}</option>
              <option value="food">{t("Baby Food & Supplement")}</option>
              <option value="utensil">{t("Utensils")}</option>
              <option value="educational_material">
                {t("Educational Materials")}
              </option>
            </select>
          </form>
        </div>

        <form className="max-w-md mx-auto px-2 py-1 mb-1">
          <label
            htmlFor="default-search"
            className="mb-2 text-sm font-medium text-gray-white sr-only dark:text-white"
          >
            Search
          </label>
          <div className="relative px-2  mr-5">
            <div className="absolute inset-y-0 start-0 flex items-center ps-1 pointer-events-none ml-5 px-2">
              <svg
                className="w-4 h-4 text-white dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="search"
              id="default-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className=" w-full p-2   ps-8 ml-2 text-sm text-white border border-gray-500 rounded-lg bg-[#0B364F]"
              placeholder="Search product..."
            />

            <button
              type="submit"
              className=" mt-4 text-white absolute end-0.5 bottom-0.5 bg-[#0B8FAC] hover:bg-[#124766]  font-medium rounded-lg text-sm px-4   pt-1.5 pb-2 "
            >
              Search
            </button>
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-6 text-gray-300">
            {t("Loading products...")}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-6 text-red-500">{error}</div>
        )}

        {/* Product Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-2">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <p className="text-center col-span-2 text-gray-300">
                  {t("No products found in this category.")}
                </p>
              )}
            </div>
            {/* pagination control */}
            {/* Pagination Controls */}
            <div className="flex items-center justify-center py-6 px-4 text-gray-300">
              <button
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page === 1 || loading}
                className="flex items-center justify-center px-3 h-8 me-3 text-sm font-medium 
text-gray-200 border border-gray-400 rounded-lg 
hover:bg-gray-300 hover:text-gray-800 
disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800"
              >
                <svg
                  className="w-3.5 h-3.5 me-2 rtl:rotate-180"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 5H1m0 0 4 4M1 5l4-4"
                  />
                </svg>
                {t("Previous")}
              </button>

              <span className="px-2 flex items-center">
                {t("Page")} {page} {t("of")} {totalPages}
              </span>

              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page === totalPages || loading}
                className="flex items-center justify-center px-3 h-8 me-3 text-sm font-medium 
text-gray-200 border border-gray-400 rounded-lg 
hover:bg-gray-300 hover:text-gray-800 
disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800"
              >
                {t("Next")}
                <svg
                  className="w-3.5 h-3.5 ms-2 rtl:rotate-180"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"
                  />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </Page>
  );
};

export default ProductList;
