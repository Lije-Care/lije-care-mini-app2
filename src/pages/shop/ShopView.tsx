import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { fetchProducts } from '@/redux/slices/productSlice';
import { SearchIcon, PlusIcon, StarIcon, ShopIcon } from '@/design-system/icons';

const DEFAULT_CATEGORIES = ['All', 'Food', 'Toys', 'Lunch Boxes', 'Utensils', 'Essentials'];

const ShopView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<'price' | 'date' | 'popular'>('popular');

  // Get cart and products from Redux store
  const cart = useSelector((state: RootState) => state.cart);
  const { products, loading } = useSelector((state: RootState) => state.products);
  const cartItemCount = cart?.items?.length || 0;

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Transform backend products to match UI format
  const transformedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    rating: 4.5, // Backend doesn't have rating, using default
    image: p.img || `https://picsum.photos/seed/${p.id}/400/400`,
    category: p.category,
    description: p.description,
    enlistedDate: p.createdAt,
  }));

  const filtered = transformedProducts.filter(p =>
    (activeCategory === 'All' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sortMode === 'price') return a.price - b.price;
    if (sortMode === 'date') return new Date(b.enlistedDate).getTime() - new Date(a.enlistedDate).getTime();
    return b.rating - a.rating;
  });

  // Get unique categories from products
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const displayCategories = categories.length > 1 ? categories : DEFAULT_CATEGORIES;

  const handleAddToCart = (productId: string) => {
    // Navigate to product detail page for now
    // Cart functionality is preserved in cartSlice
    navigate(`/product-detail/${productId}`);
  };

  if (loading && products.length === 0) {
    return (
      <div className="pb-32 pt-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-4">
      <div className="px-6 mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lije Shop</h2>
          <p className="text-slate-500 text-sm">Essential tools for growth.</p>
        </div>
        <button
          onClick={() => navigate('/checkout/page')}
          className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-50 flex items-center justify-center relative"
        >
          {cartItemCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[9px] text-white font-black border-2 border-white">
              {cartItemCount > 9 ? '9+' : cartItemCount}
            </div>
          )}
          <ShopIcon className="text-slate-400 w-5 h-5" />
        </button>
      </div>

      <div className="px-6 space-y-4 mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-rose-300 shadow-sm font-medium text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
          {(['popular', 'price', 'date'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${sortMode === mode ? 'bg-white shadow-sm text-rose-500' : 'text-slate-400'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar px-6 mb-8">
        {displayCategories.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeCategory === c ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-white border border-slate-100 text-slate-500'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 px-6">
        {filtered.map(product => (
          <div
            key={product.id}
            className="bg-white rounded-[2.5rem] p-3 border border-slate-50 shadow-sm flex flex-col group active:scale-95 transition-transform"
            onClick={() => navigate(`/product-detail/${product.id}`)}
          >
            <div className="relative aspect-square rounded-[1.8rem] overflow-hidden mb-4 bg-slate-50">
              <img src={product.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={product.name} />
              <div className="absolute top-2 left-2 px-2.5 py-1 bg-white/80 backdrop-blur rounded-lg text-[8px] font-black text-rose-500 uppercase tracking-widest">
                {product.category}
              </div>
            </div>
            <div className="flex-1 px-1">
              <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{product.name}</h4>
              <div className="flex items-center gap-1 mb-3">
                <StarIcon className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold text-slate-400">{product.rating}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-50 px-1 pb-1 mt-auto">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</span>
                <span className="text-base font-black text-slate-900">{product.price} <span className="text-[10px]">ETB</span></span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product.id);
                }}
                className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
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
