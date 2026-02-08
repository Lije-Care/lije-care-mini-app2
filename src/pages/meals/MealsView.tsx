import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchMeals, fetchIngredients } from '@/redux/slices/mealSlice';
import { PlusIcon, SearchIcon, FilterIcon } from '@/design-system/icons';
import { Button } from '@/components/ui';
import type { Meal, Ingredient } from '@/design-system/types';

const MealsView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { meals: backendMeals, ingredients: backendIngredients } = useSelector((state: RootState) => state.meals);

  const [subTab, setSubTab] = useState<'mealLib' | 'foodLib' | 'planning'>('planning');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [creationStep, setCreationStep] = useState(1);
  const [planName, setPlanName] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealsForSlot, setSelectedMealsForSlot] = useState<Meal[]>([]);

  useEffect(() => {
    dispatch(fetchMeals());
    dispatch(fetchIngredients());
  }, [dispatch]);

  // Helper to map meal time to valid type
  const getMealType = (mealTime: string | undefined): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' => {
    const time = (mealTime || '').toLowerCase();
    if (time.includes('breakfast')) return 'Breakfast';
    if (time.includes('lunch')) return 'Lunch';
    if (time.includes('dinner')) return 'Dinner';
    return 'Snack';
  };

  // Transform backend meals to match UI format
  const transformedMeals: Meal[] = backendMeals.map(m => ({
    id: m.id,
    name: m.name,
    type: getMealType(m.mealTimes?.[0]),
    nutrients: [], // Backend doesn't have this in simple format
    image: m.imageUrl || `https://picsum.photos/seed/${m.id}/400/300`,
    description: m.description || '',
    prepTime: m.prepTime || 'N/A',
    ageGroup: m.ageGroup,
    ingredients: [],
    method: m.direction ? m.direction.split('.').filter(Boolean) : [],
    calories: Math.round(m.totalVolume * 1.3) || 200, // Estimate calories from volume
    volume: `${m.totalVolume}ml`,
    allergens: m.allergen ? [m.allergenDescription] : undefined,
  }));

  // Transform backend ingredients to match UI format
  const transformedIngredients: Ingredient[] = backendIngredients.map(i => ({
    id: i.id,
    name: i.name,
    portion: `${i.portionSize}g`,
    calories: Math.round(i.density * i.portionSize) || 100,
    nutrients: [{ name: i.foodGroup, amount: 'Med' }],
    image: i.imageUrl || `https://picsum.photos/seed/${i.id}/200`,
  }));

  // Use transformed data or fallback to empty arrays
  const MEALS = transformedMeals.length > 0 ? transformedMeals : [];
  const INGREDIENTS = transformedIngredients.length > 0 ? transformedIngredients : [];

  const calorieTarget = 1500;
  const currentCals = selectedMealsForSlot.reduce((sum, m) => sum + m.calories, 0);

  const renderPlanning = () => (
    <div className="px-6 space-y-6">
      {!isCreatingPlan ? (
        <div className="space-y-6">
          <div className="bg-sky-500 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-sky-100">
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2 leading-tight">Smart Child<br/>Meal Planning</h3>
              <p className="text-sky-100 text-xs font-medium mb-8 leading-relaxed">Design balanced nutrition tailored to your little one's growth.</p>
              <button
                onClick={() => setIsCreatingPlan(true)}
                className="bg-white text-sky-500 px-8 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-transform"
              >
                Create New Plan
              </button>
            </div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-sky-400 rounded-full -mb-20 -mr-20"></div>
          </div>

          <div className="flex justify-between items-center px-2">
            <h4 className="font-bold text-slate-800">Your Saved Plans</h4>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Default View</span>
          </div>

          <div className="bg-white rounded-[2rem] p-10 border border-slate-100 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mb-4">🍽️</div>
            <p className="text-slate-400 text-sm font-bold">You haven't created any plans yet.</p>
            <button onClick={() => setIsCreatingPlan(true)} className="mt-4 text-sky-500 text-xs font-black uppercase">Start First Plan</button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          {/* Step Navigation Header */}
          <div className="flex items-center gap-4">
            <button onClick={() => setIsCreatingPlan(false)} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <PlusIcon className="rotate-45 text-slate-500" />
            </button>
            <div className="flex-1">
              <h3 className="font-black text-slate-800">Step {creationStep}: {creationStep === 1 ? 'Name' : creationStep === 2 ? 'Day' : creationStep === 3 ? 'Time' : 'Meals'}</h3>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-1 rounded-full flex-1 transition-all ${s <= creationStep ? 'bg-sky-500' : 'bg-slate-100'}`} />
                ))}
              </div>
            </div>
          </div>

          {creationStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-bottom">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 ml-2">Plan Name</label>
                <input
                  type="text"
                  placeholder="e.g., Growth Week 1"
                  className="w-full bg-white border border-slate-100 p-5 rounded-2xl font-bold text-slate-800 outline-none focus:border-sky-400 shadow-sm"
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                />
              </div>
              <Button
                disabled={!planName}
                onClick={() => setCreationStep(2)}
                color="sky"
                fullWidth
                size="lg"
              >
                Next Step
              </Button>
            </div>
          )}

          {creationStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-bottom">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Select Day</label>
              <div className="grid grid-cols-4 gap-3">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`py-4 rounded-2xl font-bold text-sm border transition-all ${selectedDay === day ? 'bg-sky-500 border-sky-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setCreationStep(1)} className="flex-1 py-4 text-slate-400 font-bold">Back</button>
                <Button disabled={!selectedDay} onClick={() => setCreationStep(3)} color="sky" className="flex-[2]" size="lg">Next Step</Button>
              </div>
            </div>
          )}

          {creationStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-bottom">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Meal Time Slot</label>
              <div className="space-y-3">
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(slot => (
                  <button
                    key={slot}
                    onClick={() => setActiveSlot(slot)}
                    className={`w-full p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between ${activeSlot === slot ? 'border-sky-500 bg-sky-50/50' : 'border-slate-100 bg-white'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">
                        {slot === 'Breakfast' ? '🥣' : slot === 'Lunch' ? '🍛' : slot === 'Dinner' ? '🍲' : '🍎'}
                      </div>
                      <span className="font-bold text-slate-800">{slot}</span>
                    </div>
                    {activeSlot === slot && <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setCreationStep(2)} className="flex-1 py-4 text-slate-400 font-bold">Back</button>
                <Button disabled={!activeSlot} onClick={() => setCreationStep(4)} color="sky" className="flex-[2]" size="lg">Next Step</Button>
              </div>
            </div>
          )}

          {creationStep === 4 && (
            <div className="space-y-8 animate-in slide-in-from-bottom">
              {/* Nutrition Gauge */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Nutrient Gauge</h4>
                    <p className="text-2xl font-black">{currentCals} <span className="text-xs font-medium text-slate-500">/ {calorieTarget} kcal</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-sky-400">{Math.round((currentCals/calorieTarget)*100)}% Reached</p>
                  </div>
                </div>
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((currentCals / calorieTarget) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h5 className="font-black text-slate-700 uppercase text-[10px] tracking-widest">Select Meals for {activeSlot}</h5>
                  <span className="text-[10px] font-bold text-slate-400">{selectedMealsForSlot.length} Added</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {MEALS.map(meal => (
                    <button
                      key={meal.id}
                      onClick={() => {
                        if(selectedMealsForSlot.find(m => m.id === meal.id)) {
                          setSelectedMealsForSlot(selectedMealsForSlot.filter(m => m.id !== meal.id));
                        } else {
                          setSelectedMealsForSlot([...selectedMealsForSlot, meal]);
                        }
                      }}
                      className={`p-4 rounded-[2rem] border-2 text-left flex gap-4 transition-all ${selectedMealsForSlot.find(m => m.id === meal.id) ? 'border-sky-500 bg-sky-50' : 'border-slate-50 bg-white'}`}
                    >
                      <img src={meal.image} className="w-16 h-16 rounded-2xl object-cover" alt={meal.name} />
                      <div className="flex-1 flex flex-col justify-center">
                        <h6 className="font-bold text-slate-800">{meal.name}</h6>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{meal.calories} kcal • {meal.volume}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center self-center transition-all ${selectedMealsForSlot.find(m => m.id === meal.id) ? 'bg-sky-500 border-sky-500 text-white' : 'border-slate-100 text-transparent'}`}>
                        ✓
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setCreationStep(3)} className="flex-1 py-4 text-slate-400 font-bold">Back</button>
                <button
                  onClick={() => {
                    setIsCreatingPlan(false);
                    setCreationStep(1);
                    setPlanName('');
                    setSelectedDay('');
                    setActiveSlot(null);
                    setSelectedMealsForSlot([]);
                  }}
                  className="flex-[2] py-4 bg-emerald-500 text-white font-black rounded-3xl shadow-xl shadow-emerald-100"
                >
                  Finish Plan
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderLibraries = () => (
    <div className="px-6 space-y-8 pb-32">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setSubTab('mealLib')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'mealLib' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-400'}`}
        >
          Meal Library
        </button>
        <button
          onClick={() => setSubTab('foodLib')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'foodLib' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-400'}`}
        >
          Food Library
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            placeholder="Search by name, allergy..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-sky-300 text-sm font-medium"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
          <FilterIcon />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-2 px-2">
        {['6m+', '12m+', 'Veg', 'Nut Free', 'Dairy Free', 'Quick'].map(f => (
          <button key={f} className="flex-shrink-0 px-5 py-2.5 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase text-slate-400 hover:border-sky-400 hover:text-sky-500 transition-all">
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5">
        {subTab === 'mealLib' ? (
          MEALS.filter(meal =>
            meal.name.toLowerCase().includes(searchQuery.toLowerCase())
          ).map(meal => (
            <div key={meal.id} className="bg-white rounded-[2.5rem] p-5 flex gap-5 border border-slate-50 shadow-sm transition-transform active:scale-95">
              <img src={meal.image} className="w-24 h-24 rounded-3xl object-cover flex-shrink-0" alt={meal.name} />
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-1">
                  <h5 className="font-bold text-slate-800 text-base">{meal.name}</h5>
                  <span className="text-[9px] font-black bg-sky-50 text-sky-500 px-2 py-0.5 rounded uppercase">{meal.ageGroup}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{meal.description}</p>
                <div className="flex flex-wrap gap-1">
                  {meal.nutrients.map(n => (
                    <span key={n} className="text-[8px] font-black uppercase bg-slate-50 text-slate-400 px-2 py-1 rounded-md border border-slate-100">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          INGREDIENTS.filter(food =>
            food.name.toLowerCase().includes(searchQuery.toLowerCase())
          ).map(food => (
            <div key={food.id} className="bg-white rounded-[2.5rem] p-4 flex gap-5 border border-slate-50 shadow-sm">
              <img src={food.image} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" alt={food.name} />
              <div className="flex-1 flex flex-col justify-center">
                <h5 className="font-bold text-slate-800">{food.name}</h5>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Per {food.portion} • {food.calories} kcal</p>
                <div className="flex gap-1">
                  {food.nutrients.map(n => (
                    <span key={n.name} className="text-[9px] font-black bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded uppercase tracking-wider">{n.name}: {n.amount}</span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="pb-32 pt-4">
      <div className="px-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Nutri-Meal</h2>
        <p className="text-slate-500 text-sm">Balanced food for bright futures.</p>
      </div>

      <div className="px-6 mb-8">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex">
          <button
            onClick={() => setSubTab('planning')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'planning' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-500'}`}
          >
            Planning
          </button>
          <button
            onClick={() => setSubTab('mealLib')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${subTab !== 'planning' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-500'}`}
          >
            Libraries
          </button>
        </div>
      </div>

      {subTab === 'planning' ? renderPlanning() : renderLibraries()}
    </div>
  );
};

export default MealsView;
