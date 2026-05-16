import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { fetchProducts } from '@/redux/slices/productSlice';
import { addToCart, removeFromCart, updateQuantity } from '@/redux/slices/cartSlice';
import { SearchIcon, PlusIcon, StarIcon, ShopIcon, CloseIcon, TrashIcon } from '@/design-system/icons';

const DEFAULT_CATEGORIES = ['All', 'Food', 'Toys', 'Lunch Boxes', 'Utensils', 'Essentials'];

interface TransformedProduct {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  category: string;
  description: string;
  enlistedDate: string;
}

const ProductDetail = ({
  product,
  qty,
  onClose,
  onIncrement,
  onDecrement,
  onNavigateCart,
}: {
  product: TransformedProduct;
  qty: number;
  onClose: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onNavigateCart: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: '100%' }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: '100%' }}
    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    className="fixed inset-0 bg-white z-[150] overflow-y-auto max-w-md mx-auto shadow-2xl"
  >
    <div className="relative h-[55vh] bg-slate-50">
      <button
        onClick={onClose}
        className="absolute top-6 left-6 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
      >
        <CloseIcon size={18} />
      </button>
      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      <div className="absolute top-6 right-6 px-3 py-1.5 bg-[#F9C846]/90 backdrop-blur rounded-xl">
        <span className="text-[10px] font-black text-[#0B1A12] uppercase tracking-widest">{product.category}</span>
      </div>
    </div>

    <div className="px-6 py-8">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-black text-slate-800 flex-1 mr-4">{product.name}</h2>
        <div className="text-right">
          <span className="text-2xl font-black text-slate-900">{product.price}</span>
          <span className="text-sm text-slate-400 ml-1">ETB</span>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-8">
        <StarIcon className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-bold text-slate-400">{product.rating}</span>
      </div>

      {qty === 0 ? (
        <button
          onClick={onIncrement}
          className="w-full flex items-center justify-center gap-3 bg-[#0B1A12] text-white py-5 rounded-[2rem] font-black shadow-xl mb-8 active:scale-95 transition-transform"
        >
          <PlusIcon size={18} />
          Add to Cart
        </button>
      ) : (
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onDecrement}
            className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 font-black text-xl active:scale-90 transition-transform"
          >
            -
          </button>
          <span className="flex-1 text-center text-2xl font-black text-slate-900">{qty}</span>
          <button
            onClick={onIncrement}
            className="w-12 h-12 rounded-2xl bg-[#0B1A12] text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <PlusIcon size={18} />
          </button>
          <button
            onClick={onNavigateCart}
            className="flex-1 py-3 bg-[#76A13B] text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
          >
            Go to Cart
          </button>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Description</h3>
        <p className="text-slate-600 leading-relaxed text-sm">{product.description}</p>
      </div>
    </div>
  </motion.div>
);

const ShopView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<'newest' | 'lowest_price' | 'highest_price'>('newest');
  const [selectedProduct, setSelectedProduct] = useState<TransformedProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cart = useSelector((state: RootState) => state.cart);
  const productsState = useSelector((state: RootState) => state.products);
  const products = Array.isArray(productsState?.products) ? productsState.products : [];
  const loading = productsState?.loading || false;
  const cartItemCount = cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const transformedProducts: TransformedProduct[] = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    rating: 4.5,
    image: p.img || `https://picsum.photos/seed/${p.id}/400/400`,
    category: p.category,
    description: p.description,
    enlistedDate: p.createdAt,
  }));

  const getQty = (productId: string): number => {
    const item = cart?.items?.find((i: any) => i.id === productId);
    return item?.quantity || 0;
  };

  const handleIncrement = (product: TransformedProduct) => {
    dispatch(addToCart({
      id: product.id as any,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    }));
  };

  const handleDecrement = (product: TransformedProduct) => {
    const qty = getQty(product.id);
    if (qty <= 1) {
      dispatch(removeFromCart(product.id));
    } else {
      dispatch(updateQuantity({ id: product.id, quantity: qty - 1 }));
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const displayCategories = categories.length > 1 ? categories : DEFAULT_CATEGORIES;

  const filtered = transformedProducts.filter(p =>
    (activeCategory === 'All' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sortMode === 'lowest_price') return a.price - b.price;
    if (sortMode === 'highest_price') return b.price - a.price;
    return new Date(b.enlistedDate).getTime() - new Date(a.enlistedDate).getTime();
  });

  if (loading && products.length === 0) {
    return (
      <div className="pb-32 pt-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#76A13B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-4">
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            qty={getQty(selectedProduct.id)}
            onClose={() => setSelectedProduct(null)}
            onIncrement={() => handleIncrement(selectedProduct)}
            onDecrement={() => handleDecrement(selectedProduct)}
            onNavigateCart={() => {
              setSelectedProduct(null);
              setIsCartOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Cart Bottom Sheet */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[200] max-w-md mx-auto pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 w-full bg-white rounded-t-[3rem] pointer-events-auto max-h-[90vh] flex flex-col"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-6 flex-shrink-0" />

              <div className="px-6 flex justify-between items-end mb-6 flex-shrink-0">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Your Cart</h3>
                  <p className="text-sm text-slate-400 font-medium">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</p>
                </div>
                <span className="text-2xl font-black text-slate-900">
                  {cart?.items?.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0).toFixed(0)} <span className="text-xs font-medium text-slate-400">ETB</span>
                </span>
              </div>

              <div className="px-6 overflow-y-auto flex-1 space-y-3 pb-4">
                {cart?.items?.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="text-5xl mb-4 opacity-20">🛒</div>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Cart is empty</p>
                  </div>
                ) : (
                  cart?.items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 items-center">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-sm flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-[#76A13B] font-black text-[10px] uppercase tracking-widest mt-0.5">
                          {item.price} ETB × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) dispatch(removeFromCart(item.id));
                            else dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }));
                          }}
                          className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-black active:scale-90 transition-transform"
                        >
                          -
                        </button>
                        <span className="text-sm font-black text-slate-800 w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(addToCart({ id: item.id, name: item.name, price: item.price, image: item.image, quantity: 1 }))}
                          className="w-8 h-8 rounded-xl bg-[#0B1A12] text-white flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <PlusIcon size={14} />
                        </button>
                        <button
                          onClick={() => dispatch(removeFromCart(item.id))}
                          className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center active:scale-90 transition-transform ml-1"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-6 pb-8 pt-4 flex-shrink-0 space-y-3 border-t border-slate-100">
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-4 text-slate-400 font-black uppercase text-xs tracking-widest"
                >
                  Continue Shopping
                </button>
                <button
                  disabled={cartItemCount === 0}
                  onClick={() => { setIsCartOpen(false); navigate('/checkout/page'); }}
                  className="w-full py-5 bg-[#0B1A12] text-white font-black rounded-3xl shadow-xl active:scale-95 transition-transform uppercase text-xs tracking-widest disabled:opacity-40"
                >
                  Proceed to Checkout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lije Shop</h2>
          <p className="text-slate-500 text-sm">Essential tools for growth.</p>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-50 flex items-center justify-center relative active:scale-90 transition-transform"
        >
          {cartItemCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#F9C846] rounded-full flex items-center justify-center text-[9px] text-[#0B1A12] font-black border-2 border-white">
              {cartItemCount > 9 ? '9+' : cartItemCount}
            </div>
          )}
          <ShopIcon className="text-slate-400 w-5 h-5" />
        </button>
      </div>

      {/* Search + Sort */}
      <div className="px-6 space-y-4 mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-[#76A13B] shadow-sm font-medium text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
          {([
            { id: 'newest', label: 'Newest' },
            { id: 'lowest_price', label: 'Lowest Price' },
            { id: 'highest_price', label: 'Highest Price' },
          ] as const).map(mode => (
            <button
              key={mode.id}
              onClick={() => setSortMode(mode.id)}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${
                sortMode === mode.id ? 'bg-white shadow-sm text-[#76A13B]' : 'text-slate-400'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar px-6 mb-8">
        {displayCategories.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all ${
              activeCategory === c
                ? 'bg-[#F9C846] text-[#0B1A12] shadow-lg shadow-amber-100'
                : 'bg-white border border-slate-100 text-slate-500'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-4 px-6">
        {filtered.map(product => {
          const qty = getQty(product.id);
          return (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-[2.5rem] p-3 border border-slate-50 shadow-sm flex flex-col group active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="relative aspect-square rounded-[1.8rem] overflow-hidden mb-4 bg-slate-50">
                <img
                  src={product.image}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  alt={product.name}
                />
                <div className="absolute top-2 left-2 px-2.5 py-1 bg-white/80 backdrop-blur rounded-lg text-[8px] font-black text-[#76A13B] uppercase tracking-widest">
                  {product.category}
                </div>
                {/* Thumbnail Quantity Counter */}
                <div
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2 py-1.5 bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-white/50"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={e => { e.stopPropagation(); handleDecrement(product); }}
                    className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs active:scale-90 transition-transform"
                  >
                    -
                  </button>
                  <span className="text-[10px] font-black min-w-[20px] text-center text-slate-800">
                    {qty}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleIncrement(product); }}
                    className="w-6 h-6 rounded-lg bg-[#0B1A12] text-white flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <PlusIcon size={12} />
                  </button>
                </div>
              </div>
              <div className="flex-1 px-1 mb-2 text-center">
                <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{product.name}</h4>
                <div className="flex items-center justify-center gap-1">
                  <StarIcon className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-bold text-slate-400">{product.rating}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-50 px-1 pb-1">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</span>
                  <span className="text-base font-black text-slate-900">
                    {product.price} <span className="text-[10px]">ETB</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">No products found</p>
          <p className="text-slate-300 text-sm mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
};

export default ShopView;
