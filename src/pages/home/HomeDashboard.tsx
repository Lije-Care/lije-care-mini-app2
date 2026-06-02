import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { ChevronLeftIcon, PlusIcon, StarIcon } from '@/design-system/icons';
import { Card, Button } from '@/components/ui';
import { fetchArticles } from '@/redux/slices/articlesSlice';
import { fetchChildrenByParentId } from '@/redux/slices/childSlice';
import { fetchParent } from '@/redux/slices/itemSlice';
import { fetchProducts } from '@/redux/slices/productSlice';
import { fetchMeals } from '@/redux/slices/mealSlice';
import { getPromotions } from '@/services/promotion';
import { Promotion } from '@/types/promotion';
import {
  getAgeInMonthsFromDob,
  getDevelopmentTracePromptsForAge,
} from '@/data/developmentalMilestones';
import { motion } from 'framer-motion';

interface AssessmentPrompt {
  id: string;
  question: string;
  category: 'development' | 'growth';
}

const GROWTH_PROMPT: AssessmentPrompt = {
  id: 'growth-prompt',
  question: 'Update weight & height measurement today?',
  category: 'growth',
};

// Fallback data in case backend data is not available
const FALLBACK_MEAL = {
  id: 'm-today',
  name: 'Shiro Wot',
  type: 'Lunch',
  nutrients: ['Protein', 'Fiber', 'Iron'],
  image: 'https://picsum.photos/seed/shiro/400/300',
  description: 'Traditional chickpea stew.',
  prepTime: '25 min',
  ageGroup: '12m+',
  calories: 320,
  volume: '250ml'
};

const FALLBACK_PRODUCT = {
  id: 'p1',
  name: 'Organic Teff Cereal',
  price: 450,
  rating: 4.8,
  image: 'https://picsum.photos/seed/teff/400/400',
  category: 'Food',
  description: 'Healthy grain cereal for babies.',
};

const HomeDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const dailyTip = t(
    'Talk to your child throughout the day, describing what you see and do together. This helps build their vocabulary and language skills.'
  );
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(true);
  const [promotionsError, setPromotionsError] = useState('');
  const [promoIndex, setPromoIndex] = useState(0);
  const autoSlideRef = useRef<number | null>(null);
  const articlesScrollRef = useRef<HTMLDivElement>(null);

  // Redux state
  const { products } = useSelector((state: RootState) => state.products);
  const { meals } = useSelector((state: RootState) => state.meals);
  const { data: children } = useSelector((state: RootState) => state.children);
  const { articles } = useSelector((state: RootState) => state.articles);

  const favoriteChildId = localStorage.getItem('favorite_child_id');
  const activeChild = children.find((child) => child.id === favoriteChildId) || children[0];

  const childAgeInMonths = useMemo(
    () => getAgeInMonthsFromDob(activeChild?.date_of_birth),
    [activeChild?.date_of_birth]
  );

  const assessmentPrompts = useMemo<AssessmentPrompt[]>(() => {
    const developmentPrompts = getDevelopmentTracePromptsForAge(childAgeInMonths, 2).map(
      (prompt) => ({
        id: prompt.id,
        question: prompt.question,
        category: 'development' as const,
      })
    );

    return [...developmentPrompts, GROWTH_PROMPT];
  }, [childAgeInMonths]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const val = JSON.parse(storedUser);
      dispatch(fetchArticles({ page: 1, limit: 6 }));
      dispatch(fetchParent(val?.id));
      dispatch(fetchChildrenByParentId(val?.id));
    }
    // Fetch products and meals for dashboard
    dispatch(fetchProducts());
    dispatch(fetchMeals());
  }, [dispatch]);

  const fetchPromotionItems = async () => {
    try {
      setPromotionsLoading(true);
      setPromotionsError('');
      const result = await getPromotions(10);
      setPromotions(result);
      setPromoIndex(0);
    } catch (error: any) {
      setPromotionsError(
        error?.response?.data?.message || t('Failed to load promotions.')
      );
    } finally {
      setPromotionsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotionItems();
  }, []);

  useEffect(() => {
    if (autoSlideRef.current) {
      window.clearInterval(autoSlideRef.current);
    }

    if (promotions.length > 1) {
      autoSlideRef.current = window.setInterval(() => {
        setPromoIndex((prev) => (prev + 1) % promotions.length);
      }, 3000);
    }

    return () => {
      if (autoSlideRef.current) {
        window.clearInterval(autoSlideRef.current);
      }
    };
  }, [promotions.length]);

  useEffect(() => {
    if (promoIndex > 0 && promoIndex >= promotions.length) {
      setPromoIndex(0);
    }
  }, [promoIndex, promotions.length]);

  const showPreviousPromotion = () => {
    if (promotions.length <= 1) return;
    setPromoIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  };

  const showNextPromotion = () => {
    if (promotions.length <= 1) return;
    setPromoIndex((prev) => (prev + 1) % promotions.length);
  };

  // Get featured product from backend or use fallback
  const FEATURED_PRODUCT = products.length > 0 ? {
    id: products[0].id,
    name: products[0].name,
    price: products[0].price,
    rating: 4.8,
    image: products[0].img || `https://picsum.photos/seed/${products[0].id}/400/400`,
    category: products[0].category,
    description: products[0].description,
  } : FALLBACK_PRODUCT;

  // Get meal of the day from backend or use fallback
  const MEAL_OF_THE_DAY = meals.length > 0 ? {
    id: meals[0].id,
    name: meals[0].name,
    type: meals[0].mealTimes?.[0] || 'Meal',
    nutrients: ['Protein', 'Fiber', 'Iron'], // Default nutrients
    image: meals[0].imageUrl || `https://picsum.photos/seed/${meals[0].id}/400/300`,
    description: meals[0].description || '',
    prepTime: meals[0].prepTime || 'N/A',
    ageGroup: meals[0].ageGroup,
    calories: Math.round(meals[0].totalVolume * 1.3) || 200,
    volume: `${meals[0].totalVolume}ml`,
  } : FALLBACK_MEAL;

  const nutrientLabels = MEAL_OF_THE_DAY.nutrients.map((nutrient) => t(nutrient));
  const mealTypeLabel =
    meals.length > 0 ? MEAL_OF_THE_DAY.type : t(MEAL_OF_THE_DAY.type);
  const featuredProductName =
    products.length > 0 ? FEATURED_PRODUCT.name : t(FEATURED_PRODUCT.name);

  return (
    <div className="flex flex-col gap-8 pb-32 pt-4 px-4 overflow-x-hidden">
      {/* 1. Assessment Prompts Section - Development Trace */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-lg">{t('Development Trace')}</h3>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
          {assessmentPrompts.map((prompt) => (
            <Card
              key={prompt.id}
              className="flex-shrink-0 w-[85%] snap-center"
              padding="lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    prompt.category === 'development'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {t(prompt.category)}
                </span>
              </div>
              <p className="font-semibold text-slate-700 text-base mb-6 min-h-[48px]">
                {prompt.id === GROWTH_PROMPT.id ? t(prompt.question) : prompt.question}
              </p>

              {prompt.category === 'growth' ? (
                <Button
                  color="emerald"
                  fullWidth
                  leftIcon={<PlusIcon />}
                  onClick={() => navigate('/assessment')}
                >
                  {t('Add Measurement')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-slate-50 hover:bg-emerald-50 text-slate-600 font-bold rounded-xl text-sm border border-slate-100 transition-colors">
                    {t('Yes')}
                  </button>
                  <button className="flex-1 py-3 bg-slate-50 hover:bg-rose-50 text-slate-600 font-bold rounded-xl text-sm border border-slate-100 transition-colors">
                    {t('No')}
                  </button>
                  <button className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-sm border border-slate-100 transition-colors">
                    {t('Not Sure')}
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Promotion Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-lg">{t('Promotions')}</h3>
          <div className="flex gap-1.5">
            {promotions.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === promoIndex ? 'w-6 bg-emerald-500' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {promotionsLoading && (
          <Card className="text-sm font-medium text-slate-500" padding="lg">
            {t('Loading promotions...')}
          </Card>
        )}

        {!promotionsLoading && promotionsError && (
          <Card className="space-y-4" padding="lg">
            <p className="text-sm font-medium text-rose-500">{promotionsError}</p>
            <Button color="emerald" size="sm" onClick={fetchPromotionItems}>
              {t('Retry')}
            </Button>
          </Card>
        )}

        {!promotionsLoading && !promotionsError && promotions.length === 0 && (
          <Card className="text-sm font-medium text-slate-500" padding="lg">
            {t('No promotions found.')}
          </Card>
        )}

        {!promotionsLoading && !promotionsError && promotions.length > 0 && (
          <div className="relative overflow-hidden group">
            <motion.div
              className="flex touch-pan-y"
              animate={{ x: `-${promoIndex * 100}%` }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.08}
              onDragEnd={(_, info) => {
                if (info.offset.x <= -50) {
                  showNextPromotion();
                  return;
                }

                if (info.offset.x >= 50) {
                  showPreviousPromotion();
                }
              }}
            >
              {promotions.map((promotion) => (
                <button
                  key={promotion.id}
                  type="button"
                  className="w-full flex-shrink-0 px-0.5 text-left"
                  onClick={() =>
                    navigate(`/promotions/${promotion.id}`, {
                      state: { promotion },
                    })
                  }
                >
                  <div className="relative h-44 overflow-hidden rounded-[2rem] bg-emerald-600 shadow-lg shadow-emerald-100/60">
                    {promotion.imageUrl ? (
                      <img
                        src={promotion.imageUrl}
                        alt={promotion.title}
                        className="h-full w-full object-cover opacity-85"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-emerald-500 to-slate-900" />
                    )}
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-transparent p-6">
                      <h4 className="text-xl font-black leading-tight text-white">
                        {promotion.title}
                      </h4>
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>

            {promotions.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousPromotion}
                  className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={t('Previous promotion')}
                >
                  <ChevronLeftIcon size={16} />
                </button>
                <button
                  type="button"
                  onClick={showNextPromotion}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={t('Next promotion')}
                >
                  <ChevronLeftIcon size={16} className="rotate-180" />
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* 3. Today's Meal Section - Healthy Bites */}
      <section>
        <h3 className="font-bold text-slate-800 text-lg mb-4">{t('Healthy Bites')}</h3>
        <div
          className="relative bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 group cursor-pointer"
          onClick={() => navigate('/meals')}
        >
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-amber-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              {t('Next:')} {mealTypeLabel}
            </div>
          </div>
          <div className="h-48 overflow-hidden">
            <img
              src={MEAL_OF_THE_DAY.image}
              alt={t('Meal')}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="p-5">
            <h4 className="text-xl font-bold text-slate-800 mb-2">
              {MEAL_OF_THE_DAY.name}
            </h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {nutrientLabels.map((n) => (
                <span
                  key={n}
                  className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100"
                >
                  {n}
                </span>
              ))}
            </div>
            <Button color="slate" fullWidth>
              {t('View Full Plan')}
            </Button>
          </div>
        </div>
      </section>

      {/* 4. Featured Product Section - Shop Essentials */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-lg">{t('Shop Essentials')}</h3>
          <button
            onClick={() => navigate('/ecommerce')}
            className="text-rose-500 text-sm font-bold"
          >
            {t('See All')}
          </button>
        </div>
        <Card className="flex gap-5" padding="md">
          <div className="w-24 h-24 bg-rose-50 rounded-2xl overflow-hidden flex-shrink-0">
            <img
              src={FEATURED_PRODUCT.image}
              alt={t('Product')}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <h4 className="font-bold text-slate-800">{featuredProductName}</h4>
              <div className="flex items-center gap-1 mt-1 text-amber-400">
                <StarIcon />
                <span className="text-xs font-bold text-slate-400">
                  {FEATURED_PRODUCT.rating}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-black text-slate-900">
                {FEATURED_PRODUCT.price}{' '}
                <span className="text-xs font-bold text-slate-400">ETB</span>
              </span>
              <button
                onClick={() => navigate('/ecommerce')}
                className="p-2 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200 active:scale-90 transition-transform"
              >
                <PlusIcon />
              </button>
            </div>
          </div>
        </Card>
      </section>

      {/* 5. Featured Articles Section */}
      {articles.length > 0 && (
        <section>
          <h3 className="font-bold text-slate-800 text-lg mb-4">{t('Featured Articles')}</h3>
          <div className="relative group">
            <div ref={articlesScrollRef} className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
              {articles.slice(0, 5).map((article) => (
                <div
                  key={article.id}
                  className="flex-shrink-0 w-64 snap-center bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden cursor-pointer active:scale-95 transition-transform"
                  onClick={() => navigate(`/articles/${article.id}`)}
                >
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-36 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h4 className="font-bold text-slate-800 text-sm leading-snug mb-1 line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">{article.author}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => articlesScrollRef.current?.scrollBy({ left: -272, behavior: 'smooth' })}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={t('Scroll articles left')}
            >
              <ChevronLeftIcon size={16} />
            </button>
            <button
              onClick={() => articlesScrollRef.current?.scrollBy({ left: 272, behavior: 'smooth' })}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={t('Scroll articles right')}
            >
              <ChevronLeftIcon size={16} className="rotate-180" />
            </button>
          </div>
        </section>
      )}

      {/* 6. Daily Tip Section - Parenting Tip */}
      <section>
        <div className="bg-amber-300 rounded-[2rem] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/50 rounded-full -mr-8 -mt-8 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-amber-400/30 rounded-full -ml-8 -mb-8 blur-xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <span className="text-xl">💡</span>
              </div>
              <h3 className="font-black text-slate-900 tracking-tight">
                {t('Parenting Tip')}
              </h3>
            </div>
            <p className="text-slate-900/80 font-medium leading-relaxed italic">
              "{dailyTip}"
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeDashboard;
