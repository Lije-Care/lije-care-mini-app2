import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // to get product id from URL
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import Header from "../header/Header";
import { Page } from "@/components/Page";
import { addToCart } from "@/redux/slices/cartSlice"; // your redux action
import api from "@/api/axios";

const ProductDetailPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<any>(null); // single product
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        // Assuming your API returns the product directly at /ecommerce/:id
        const res = await api.get(`/ecommerce/${id}`, {
          headers: { "Content-Type": "application/json" },
        });
        console.log("data");
        console.log(res.data);
        setProduct(res.data); // Adjust if API shape differs
      } catch (err: any) {
        setError(err?.response?.data?.message || t("Failed to load product."));
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id, t]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.img, // adjust key if needed
      })
    );
  };

  const ProductCard = ({ product }: { product: any }) => {
    return (
      <div className="p-2 min-h-screen  shadow-md w-full h-full bg-gray-800">
        <img
          src={product.img}
          alt={product.name}
          className="w-full h-full rounded-lg object-fill pr-4"
        />
        <div className="flex items-center justify-between mx-6">
          <p className="text-xl font-semibold mt-2">{product.name}</p>
          <p className="text-base font-base">Price: ETB {product.price}</p>
        </div>
        <p className="text-sm font-base my-4 ml-4">{product.description}</p>
        <button
          onClick={handleAddToCart}
          className="bg-blue-500 text-white text-sm py-3 px-2 rounded w-full mt-2"
        >
          {t("Add to Cart")}
        </button>
      </div>
    );
  };

  if (loading)
    return (
      <Page back={true}>
        <div className="">
          <Header />
          <div className="flex justify-center items-center w-full">
            <p className="p-4">{t("Loading...")}</p>
          </div>
        </div>
      </Page>
    );
  if (error)
    return (
      <Page back={true}>
        <div className="">
          <Header />
          <div className="flex justify-center items-center w-full">
            <p className="p-4 text-red-500">{error}</p>
          </div>
        </div>
      </Page>
    );
  if (!product)
    return (
      <Page back={true}>
        <div className="">
          <Header />
          <div className="flex justify-center items-center w-full">
            <p className="p-4">{t("Product not found.")}</p>
          </div>
        </div>
      </Page>
    );

  return (
    <Page back={true}>
      <div className="">
        <Header />
        <div className="flex justify-center items-center w-full">
          <ProductCard product={product} />
        </div>
      </div>
    </Page>
  );
};

export default ProductDetailPage;
