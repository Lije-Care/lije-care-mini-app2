import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { PlusIcon, StarIcon } from '@/design-system/icons';
import { Card, Button } from '@/components/ui';
import { fetchArticles } from '@/redux/slices/articlesSlice';
import { fetchChildrenByParentId } from '@/redux/slices/childSlice';
import { fetchParent } from '@/redux/slices/itemSlice';
import { fetchProducts } from '@/redux/slices/productSlice';
import { fetchMeals } from '@/redux/slices/mealSlice';
import {
  getAgeInMonthsFromDob,
  getDevelopmentTracePromptsForAge,
} from '@/data/developmentalMilestones';

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
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [dailyTip] = useState('Talk to your child throughout the day, describing what you see and do together. This helps build their vocabulary and language skills.');

  // Redux state
  const { products } = useSelector((state: RootState) => state.products);
  const { meals } = useSelector((state: RootState) => state.meals);
  const { data: children } = useSelector((state: RootState) => state.children);

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

  return (
    <div className="flex flex-col gap-8 pb-32 pt-4 px-4 overflow-x-hidden">
      {/* 1. Assessment Prompts Section - Development Trace */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-lg">Development Trace</h3>
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
                  {prompt.category}
                </span>
              </div>
              <p className="font-semibold text-slate-700 text-base mb-6 min-h-[48px]">
                {prompt.question}
              </p>

              {prompt.category === 'growth' ? (
                <Button
                  color="emerald"
                  fullWidth
                  leftIcon={<PlusIcon />}
                  onClick={() => navigate('/assessment')}
                >
                  Add Measurement
                </Button>
              ) : (
                <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-slate-50 hover:bg-emerald-50 text-slate-600 font-bold rounded-xl text-sm border border-slate-100 transition-colors">
                    Yes
                  </button>
                  <button className="flex-1 py-3 bg-slate-50 hover:bg-rose-50 text-slate-600 font-bold rounded-xl text-sm border border-slate-100 transition-colors">
                    No
                  </button>
                  <button className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-sm border border-slate-100 transition-colors">
                    Not Sure
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Today's Meal Section - Healthy Bites */}
      <section>
        <h3 className="font-bold text-slate-800 text-lg mb-4">Healthy Bites</h3>
        <div
          className="relative bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 group cursor-pointer"
          onClick={() => navigate('/meals')}
        >
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-amber-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              Next: {MEAL_OF_THE_DAY.type}
            </div>
          </div>
          <div className="h-48 overflow-hidden">
            <img
              src={MEAL_OF_THE_DAY.image}
              alt="Meal"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="p-5">
            <h4 className="text-xl font-bold text-slate-800 mb-2">
              {MEAL_OF_THE_DAY.name}
            </h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {MEAL_OF_THE_DAY.nutrients.map((n) => (
                <span
                  key={n}
                  className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100"
                >
                  {n}
                </span>
              ))}
            </div>
            <Button color="slate" fullWidth>
              View Full Plan
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Featured Product Section - Shop Essentials */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-lg">Shop Essentials</h3>
          <button
            onClick={() => navigate('/ecommerce')}
            className="text-rose-500 text-sm font-bold"
          >
            See All
          </button>
        </div>
        <Card className="flex gap-5" padding="md">
          <div className="w-24 h-24 bg-rose-50 rounded-2xl overflow-hidden flex-shrink-0">
            <img
              src={FEATURED_PRODUCT.image}
              alt="Product"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <h4 className="font-bold text-slate-800">{FEATURED_PRODUCT.name}</h4>
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

      {/* 4. Daily Tip Section - Parenting Tip */}
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
                Parenting Tip
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
