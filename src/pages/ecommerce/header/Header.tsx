import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { CartPage } from "../cart/CartPage";

const Header = () => {
  const { t } = useTranslation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartCount = useSelector((state: RootState) =>
    state.cart.items.reduce((sum: any, item: any) => sum + item.quantity, 0)
  );

  return (
    <div className="flex justify-between bg-[#013222] p-4">
      <div>
        <h1 className="text-white text-3xl font-bold mb-3">{t("Products")}</h1>
      </div>
      <div className="relative flex items-center">
        <div className="absolute -top-2 left-4 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {cartCount}
        </div>
        <div className="mr-2">
          <button onClick={() => setIsCartOpen(true)}>
            <ShoppingBag className="text-white h-6 w-6" />
          </button>
        </div>
        {isCartOpen && (
          <>
            <div
              className="fixed inset-0 bg-gray-500/75 transition-opacity duration-500 ease-in-out z-40"
              onClick={() => setIsCartOpen(false)}
            ></div>
            <div className="fixed inset-y-0 right-0 max-w-md w-full transform transition-transform duration-500 ease-in-out z-50">
              <CartPage onClose={() => setIsCartOpen(false)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
