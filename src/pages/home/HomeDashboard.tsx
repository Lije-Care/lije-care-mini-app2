import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '@/api/axios';
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
  DEVELOPMENTAL_SUBCATEGORY_ORDER,
  getAgeInMonthsFromDob,
  getDevelopmentTracePromptsForAge,
} from '@/data/developmentalMilestones';
import type { DetailedAssessment, DevAnswer } from '@/design-system/types';
import { useDevelopmentalAssessments } from '@/hooks/useDevelopmentalAssessments';
import { buildAnthropometricCards } from '@/utils/anthropometricCards';
import { motion } from 'framer-motion';
import type { DevelopmentalSubCategory } from '@/data/developmentalMilestones';

interface AssessmentPrompt {
  id: string;
  question: string;
  category: 'development' | 'growth';
  answer?: DevAnswer;
}

interface HomeAiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface HomeVaccineScheduleItem {
  id: string;
  status: 'PENDING' | 'GIVEN' | 'MISSED';
  isGiven: boolean;
  isMissed: boolean;
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

const DEVELOPMENT_SUMMARY_FALLBACK = {
  immunization: { taken: 2, total: 2, note: 'Fully immunized for current age' },
  milestoneCounts: {
    Social: { done: 2, total: 3 },
    Language: { done: 3, total: 4 },
    Cognitive: { done: 2, total: 3 },
    Physical: { done: 3, total: 4 },
  } as Record<DevelopmentalSubCategory, { done: number; total: number }>,
};

const SUMMARY_CARD_TITLES = [
  'Growth Assessments',
  'Milestones Progress',
  'Immunization Summary',
] as const;

const getSummaryStatusColor = (label: string) => {
  const normalized = label.toLowerCase();

  if (
    normalized.includes('underweight') ||
    normalized.includes('wasted') ||
    normalized.includes('thinness') ||
    normalized.includes('stunted') ||
    normalized.includes('malnutrition')
  ) {
    return 'bg-rose-50 text-rose-700 border border-rose-200';
  }

  if (normalized.includes('overweight') || normalized.includes('obese') || normalized.includes('risk')) {
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  }

  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
};

const simplifyGrowthStatus = (label: string) => {
  if (!label || label === 'No Data' || label === 'Unavailable') return 'Pending';
  if (label === 'Normal') return 'On Track';
  return label;
};

const HomeDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const dailyTip = t(
    'Talk to your child throughout the day, describing what you see and do together. This helps build their vocabulary and language skills.'
  );
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(true);
  const [promotionsError, setPromotionsError] = useState('');
  const [promoIndex, setPromoIndex] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<HomeAiMessage[]>([]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [recommendationModal, setRecommendationModal] = useState<DetailedAssessment | null>(null);
  const autoSlideRef = useRef<number | null>(null);
  const articlesScrollRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const developmentSummaryScrollRef = useRef<HTMLDivElement>(null);
  const [developmentSummaryIndex, setDevelopmentSummaryIndex] = useState(0);
  const [vaccineSchedule, setVaccineSchedule] = useState<HomeVaccineScheduleItem[]>([]);

  // Redux state
  const { products } = useSelector((state: RootState) => state.products);
  const { meals } = useSelector((state: RootState) => state.meals);
  const { data: children } = useSelector((state: RootState) => state.children);
  const { articles } = useSelector((state: RootState) => state.articles);

  const favoriteChildId = localStorage.getItem('favorite_child_id');
  const activeChild = children.find((child) => child.id === favoriteChildId) || children[0];
  const storedUser =
    typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const parentUser = storedUser ? JSON.parse(storedUser) : null;
  const parentId = parentUser?.id || '';
  const backendUrl = import.meta.env.VITE_API_URL as string;
  const activeChildName = activeChild?.name || t('your child');
  const homeChatStorageKey = activeChild?.id && parentId
    ? `ai_chat_${parentId}_${activeChild.id}`
    : null;

  const childAgeInMonths = useMemo(
    () => getAgeInMonthsFromDob(activeChild?.date_of_birth),
    [activeChild?.date_of_birth]
  );
  const { developmentalAssessments, markAsAddressed, toggleAnswer } = useDevelopmentalAssessments({
    ageInMonths: childAgeInMonths,
    childId: activeChild?.id,
    onNoAnswer: (assessment) => setRecommendationModal(assessment),
  });

  const assessmentPrompts = useMemo<AssessmentPrompt[]>(() => {
    const developmentPrompts = getDevelopmentTracePromptsForAge(childAgeInMonths, 2).map(
      (prompt) => ({
        id: prompt.id,
        question: prompt.question,
        category: 'development' as const,
        answer:
          developmentalAssessments.find((assessment) => assessment.id === prompt.id)?.answer ??
          'unanswered',
      })
    );

    return [...developmentPrompts, GROWTH_PROMPT];
  }, [childAgeInMonths, developmentalAssessments]);

  const anthropometricSummaryCards = useMemo(
    () => buildAnthropometricCards(activeChild),
    [activeChild]
  );

  const milestoneProgress = useMemo(
    () =>
      DEVELOPMENTAL_SUBCATEGORY_ORDER.map((subCategory) => {
        const matching = developmentalAssessments.filter(
          (item) => item.subCategory === subCategory
        );
        const answered = matching.filter((item) => item.answer && item.answer !== 'unanswered').length;
        const total = matching.length;
        const fallback = DEVELOPMENT_SUMMARY_FALLBACK.milestoneCounts[subCategory];

        return {
          key: subCategory,
          label:
            subCategory === 'Social'
              ? 'Social & Emotional'
              : subCategory === 'Language'
                ? 'Language & Communication'
                : subCategory === 'Cognitive'
                  ? 'Cognitive'
                  : 'Movement & Physical',
          done: total > 0 ? answered : fallback.done,
          total: total > 0 ? total : fallback.total,
        };
      }),
    [developmentalAssessments]
  );

  const immunizationSummary = useMemo(() => {
    if (vaccineSchedule.length === 0) {
      return DEVELOPMENT_SUMMARY_FALLBACK.immunization;
    }

    const total = vaccineSchedule.length;
    const taken = vaccineSchedule.filter((item) => item.isGiven).length;

    return {
      taken,
      total,
      note:
        taken === total
          ? 'Fully immunized for current age'
          : `${total - taken} vaccine${total - taken === 1 ? '' : 's'} pending for current age`,
    };
  }, [vaccineSchedule]);

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
    let isMounted = true;

    const fetchVaccineSchedule = async () => {
      if (!activeChild?.id) {
        if (isMounted) {
          setVaccineSchedule([]);
        }
        return;
      }

      try {
        const response = await api.get<{ data: HomeVaccineScheduleItem[] }>(
          `/immunity/children/${activeChild.id}/schedule`
        );
        if (isMounted) {
          setVaccineSchedule(Array.isArray(response.data?.data) ? response.data.data : []);
        }
      } catch (error) {
        if (isMounted) {
          setVaccineSchedule([]);
        }
      }
    };

    void fetchVaccineSchedule();

    return () => {
      isMounted = false;
    };
  }, [activeChild?.id]);

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
  const initialAssistantMessage = t(
    "Hi! I am Lije Care AI, your personalized parenting companion. I am fully aware of {{childName}}'s growth details, developmental assessments and vaccine records. Ask me anything about diet, purees, milestone support, or simple recipes!",
    { childName: activeChildName }
  );

  useEffect(() => {
    setChatMessages([{ role: 'assistant', content: initialAssistantMessage }]);
  }, [initialAssistantMessage, activeChild?.id]);

  useEffect(() => {
    if (!homeChatStorageKey) {
      setChatId(null);
      return;
    }

    const savedChatId = localStorage.getItem(homeChatStorageKey);
    setChatId(savedChatId || null);
  }, [homeChatStorageKey]);

  useEffect(() => {
    chatMessagesRef.current?.scrollTo({
      top: chatMessagesRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chatMessages, isSendingChat]);

  const handleSendHomeChat = async (prefilledText?: string) => {
    const outgoingText = (prefilledText ?? chatInput).trim();

    if (!outgoingText || !parentId || !activeChild?.id || !backendUrl) {
      return;
    }

    setChatMessages((prev) => [
      ...prev,
      { role: 'user', content: outgoingText },
    ]);
    setIsSendingChat(true);
    setChatInput('');

    try {
      const languageLabel = i18n.language === 'am' ? 'Amharic' : 'English';
      const res = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parentId,
          childId: activeChild.id,
          chatId,
          message: `[Reply language: ${languageLabel}] ${outgoingText}`,
        }),
      });

      if (!res.ok) {
        throw new Error(t('Failed to send message'));
      }

      const data: { reply: string; chatId?: string } = await res.json();

      if (data.chatId) {
        setChatId(data.chatId);
        if (homeChatStorageKey) {
          localStorage.setItem(homeChatStorageKey, data.chatId);
        }
      }

      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (error) {
      console.error(error);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('Sorry, something went wrong.') },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleDevelopmentSummaryScroll = () => {
    const container = developmentSummaryScrollRef.current;
    if (!container) return;

    const cardWidth = container.clientWidth * 0.86 + 16;
    const nextIndex = Math.round(container.scrollLeft / cardWidth);
    setDevelopmentSummaryIndex(Math.max(0, Math.min(SUMMARY_CARD_TITLES.length - 1, nextIndex)));
  };

  return (
    <div className="flex flex-col gap-8 pb-32 pt-4 px-4 overflow-x-hidden">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{t('Development Summary')}</h3>
          <div className="flex gap-1.5">
            {SUMMARY_CARD_TITLES.map((title, index) => (
              <div
                key={title}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === developmentSummaryIndex ? 'w-5 bg-emerald-500' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div
          ref={developmentSummaryScrollRef}
          onScroll={handleDevelopmentSummaryScroll}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 pr-12 scrollbar-hide"
        >
          <Card className="h-[300px] w-[86%] flex-shrink-0 snap-center border border-emerald-100/70 bg-[linear-gradient(180deg,#ffffff_0%,#f8fdf5_100%)] shadow-[0_20px_40px_-28px_rgba(118,161,59,0.45)]">
            <div className="flex h-full flex-col">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                  {t('Growth Status')}
                </span>
              </div>
              <h4 className="mb-4 text-sm font-extrabold text-slate-800">{t('Growth Assessments')}</h4>
              <div className="max-h-[190px] overflow-y-auto overflow-x-hidden pr-1 scrollbar-hide">
                <div className="space-y-3">
                  {anthropometricSummaryCards.map((card) => {
                    const status = simplifyGrowthStatus(t(card.displayStatus));
                    return (
                      <div
                        key={card.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm"
                      >
                        <span className="min-w-0 flex-1 text-xs font-medium text-slate-600">
                          {t(card.title)}
                        </span>
                        <span
                          className={`min-w-0 max-w-[52%] break-words whitespace-normal text-center rounded-full px-2.5 py-1 text-[10px] font-bold leading-4 ${getSummaryStatusColor(status)}`}
                        >
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Card className="h-[300px] w-[86%] flex-shrink-0 snap-center border border-sky-100/80 bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] shadow-[0_20px_40px_-28px_rgba(14,165,233,0.35)]">
            <div className="flex h-full flex-col">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700">
                  {t('Milestones')}
                </span>
              </div>
              <h4 className="mb-4 text-sm font-extrabold text-slate-800">{t('Milestones Progress')}</h4>
              <div className="space-y-4">
                {milestoneProgress.map((item) => {
                  const percentage = item.total > 0 ? Math.round((item.done / item.total) * 100) : 0;
                  return (
                    <div key={item.key}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-600">{t(item.label)}</span>
                        <span className="text-xs font-bold text-slate-700">
                          {item.done}/{item.total}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="h-[300px] w-[86%] flex-shrink-0 snap-center border border-amber-100/80 bg-[linear-gradient(180deg,#ffffff_0%,#fffaf0_100%)] shadow-[0_20px_40px_-28px_rgba(245,158,11,0.35)]">
            <div className="flex h-full flex-col">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                  {t('Immunization')}
                </span>
              </div>
              <h4 className="mb-4 text-sm font-extrabold text-slate-800">{t('Immunization Summary')}</h4>
              <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-sm">
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{t('Taken vaccines')}</p>
                    <p className="mt-1 text-2xl font-black text-slate-800">
                      {immunizationSummary.taken} / {immunizationSummary.total}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    {immunizationSummary.taken === immunizationSummary.total ? t('On Track') : t('Pending')}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
                    style={{
                      width: `${immunizationSummary.total > 0
                        ? Math.round((immunizationSummary.taken / immunizationSummary.total) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-600">{t(immunizationSummary.note)}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

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
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    {t('Status:')}{' '}
                    {prompt.answer === 'addressed'
                      ? t('Addressed with Doctor')
                      : prompt.answer === 'unanswered'
                        ? t('Not Assessed')
                        : t(prompt.answer || 'No')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAnswer(prompt.id, 'yes')}
                      className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                        prompt.answer === 'yes'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'border border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                    {t('Yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAnswer(prompt.id, 'no')}
                      className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                        prompt.answer === 'no'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'border border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                    {t('No')}
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {recommendationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-3xl shadow-inner">
              <span role="img" aria-label={t('Doctor')}>
                👨‍⚕️
              </span>
            </div>
            <h4 className="mb-3 text-xl font-black text-slate-800">{t('Notice Something?')}</h4>
            <p className="mb-8 text-sm leading-relaxed text-slate-600">
              {t(
                'If you are unsure or ticked "No" for "{{title}}", we recommend consulting with your pediatrician for a professional evaluation.',
                { title: recommendationModal.title }
              )}
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setRecommendationModal(null)}
                className="w-full rounded-2xl bg-slate-900 py-4 font-black text-white"
              >
                {t('I Understand')}
              </button>
              <button
                type="button"
                onClick={() => {
                  markAsAddressed(recommendationModal.id);
                  setRecommendationModal(null);
                }}
                className="w-full py-3 font-bold text-sky-500"
              >
                {t('Already talked to doctor')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Featured Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-lg">{t('Featured')}</h3>
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
      <section className="bg-white rounded-[2rem] p-5 border border-[#76A13B]/10 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#76A13B]/10 flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{t('Lije Companion AI')}</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {activeChild?.name
                    ? `${activeChild.name} ${t('Aware Active')}`
                    : t('Child-Aware AI Active')}
                </span>
              </div>
            </div>
          </div>
          {chatMessages.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setChatMessages([{ role: 'assistant', content: initialAssistantMessage }]);
                setChatId(null);
                if (homeChatStorageKey) {
                  localStorage.removeItem(homeChatStorageKey);
                }
              }}
              className="text-[10px] text-rose-500 font-bold uppercase tracking-widest"
            >
              {t('Clear Chat')}
            </button>
          )}
        </div>

        <div
          ref={chatMessagesRef}
          className="flex max-h-[300px] flex-col gap-3 overflow-y-auto pr-1"
        >
          {chatMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex flex-col ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <span className="mb-1 px-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
                {message.role === 'user' ? t('You') : t('Lije Care AI')}
              </span>
              <div
                className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 text-xs font-semibold leading-relaxed shadow-sm ${
                  message.role === 'user'
                    ? 'rounded-tr-none bg-[#0B1A12] text-white'
                    : 'rounded-tl-none border border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isSendingChat && (
            <div className="flex flex-col items-start">
              <span className="mb-1 px-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
                {t('Lije Care AI')}
              </span>
              <div className="flex items-center gap-2 rounded-[1.5rem] rounded-tl-none border border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#76A13B]">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                <span>{t('Analyzing stats...')}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
          {[
            {
              label: t('Recipe for {{childName}}', { childName: activeChild?.name || t('baby') }),
              text: `What puree or meal recipe do you suggest for ${activeChild?.name || 'my baby'} based on age?`,
            },
            {
              label: t('Check vaccines'),
              text: 'Do I have any outstanding or overdue vaccinations I should worry about?',
            },
            {
              label: t('Growth & milestone check'),
              text: "Can you review my child's growth and developmental trace milestones and suggest customized supportive activities?",
            },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              disabled={isSendingChat}
              onClick={() => void handleSendHomeChat(chip.text)}
              className="flex-shrink-0 rounded-2xl border border-[#76A13B]/10 bg-[#76A13B]/5 px-4 py-2 text-[10px] font-bold text-[#76A13B] disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendHomeChat();
          }}
          className="flex gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-1.5 focus-within:border-[#76A13B]/35"
        >
          <input
            type="text"
            value={chatInput}
            disabled={isSendingChat || !activeChild?.id || !parentId}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={t("Ask about {{childName}}'s health, nutrition...", {
              childName: activeChild?.name || t('baby'),
            })}
            className="flex-1 bg-transparent px-4 py-3 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSendingChat || !chatInput.trim() || !activeChild?.id || !parentId}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1A12] text-white disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="rotate-90"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </section>

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
