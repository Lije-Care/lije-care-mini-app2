import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../../redux/store";
import {
  updateQuantity,
  removeFromCart,
} from "../../../redux/slices/cartSlice";

interface CartItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
  image: string;
  color?: string;
}

export const CartPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const cartItems = useSelector(
    (state: RootState) => state.cart.items
  ) as CartItem[];
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const subtotal = cartItems.reduce(
    (sum: number, item: CartItem) => sum + item.price * item.quantity,
    0
  );

  // Handle Shop Now button click
  const handleShopNow = () => {
    navigate("/ecommerce");
    onClose(); // Close the cart after navigation
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-800 shadow-xl">
      {/* Header */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-medium text-white">Shopping Cart</h2>
          <button
            type="button"
            onClick={onClose}
            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close cart</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
              className="size-6"
            >
              <path
                d="M6 18 18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="mt-8">
          <div className="flow-root">
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center">Your cart is empty.</p>
            ) : (
              <ul role="list" className="-my-6 divide-y divide-gray-300">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex py-6">
                    <div className="size-24 shrink-0 overflow-hidden rounded-md border border-gray-300">
                      <img
                        src={item.image}
                        className="size-full object-cover"
                        alt={item.name}
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>
                            <a href="#" className=" text-gray-100">
                              {item.name}
                            </a>
                          </h3>
                          <p className="ml-4 text-gray-100">
                            ETB {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        {item.color && (
                          <p className="mt-1 text-sm text-gray-500">
                            {item.color}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <p className="text-gray-300">Qty</p>
                          <button
                            onClick={() =>
                              dispatch(
                                updateQuantity({
                                  id: item.id,
                                  quantity: item.quantity - 1,
                                })
                              )
                            }
                            className="rounded-md border border-black bg-gray-500 px-2 py-1 text-gray-900 hover:bg-gray-100"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            readOnly
                            className="w-12 rounded-md border border-black bg-gray-500 text-center text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() =>
                              dispatch(
                                updateQuantity({
                                  id: item.id,
                                  quantity: item.quantity + 1,
                                })
                              )
                            }
                            className="rounded-md border border-black bg-gray-500 px-2 py-1 text-gray-900 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex">
                          <button
                            type="button"
                            onClick={() => dispatch(removeFromCart(item.id))}
                            className="font-medium text-0B8FAC] hover:text-[#0B8FAC]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 px-4 py-6 sm:px-6">
        <div className="flex justify-between text-base font-medium text-gray-300">
          <p>Subtotal</p>
          <p>ETB {subtotal.toFixed(2)}</p>
        </div>
        <p className="mt-0.5 text-sm text-gray-400">
          Shipping and taxes calculated at checkout.
        </p>
        <div className="mt-6">
          {cartItems.length === 0 ? (
            <button
              onClick={handleShopNow}
              className="flex w-full items-center justify-center rounded-md border border-transparent  bg-[#0B8FAC] px-6 py-3 text-base font-medium text-white shadow-xs hover:bg-indigo-700"
            >
              Shop Now
            </button>
          ) : (
            <a
              href="#/checkout/page"
              className={`flex w-full items-center justify-center rounded-md border border-transparent  bg-[#0B8FAC] px-6 py-3 text-base font-medium text-white shadow-xs hover:bg-indigo-700 ${
                cartItems.length === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Checkout
            </a>
          )}
        </div>
        <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
          <p>
            or
            <button
              onClick={handleShopNow}
              className="font-medium text-[#0B8FAC] hover:text-indigo-500"
            >
              Continue Shopping
              <span aria-hidden="true"> &rarr;</span>
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
