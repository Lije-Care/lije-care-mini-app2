    'use client';

    import { useState, useEffect, ChangeEvent } from 'react';
    import { motion } from 'framer-motion';
    import { Input, Select, Text, Divider } from '@telegram-apps/telegram-ui';

    type FormState = {
    age: string;
    sex: string;
    weight: string;
    height: string;
    activity: string;
    condition: string;
    };

    type Result = {
    bmi: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    iron: number;
    calcium: number;
    vitaminA: number;
    water?: number; // Added water to the result
    status: string;
    error?: string;
    };

    export default function ChildNutritionForm() {
    const [form, setForm] = useState<FormState>({
        age: '',
        sex: '',
        weight: '',
        height: '',
        activity: '',
        condition: '',
    });

    const [result, setResult] = useState<Result | null>(null);

    const handleChange = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [field]: e.target.value });
    };

    useEffect(() => {
        const { age, sex, weight, height, activity, condition } = form;

        if (age && sex && weight && height && activity && condition) {
        const ageNum = parseInt(age);
        const weightNum = parseFloat(weight);
        const heightNum = parseFloat(height);
        const bmi = weightNum / ((heightNum / 100) ** 2);
        const roundedBMI = parseFloat(bmi.toFixed(2));

        // 🔢 Age-based base multiplier
        let caloriePerKg = 90;
        if (ageNum <= 6) caloriePerKg = 108;
        else if (ageNum <= 12) caloriePerKg = 98;
        else if (ageNum <= 36) caloriePerKg = 102;

        let calories = weightNum * caloriePerKg;

        // 🏃 Activity factor
        const activityFactor = activity === 'Active' ? 1.26 : activity === 'Moderate' ? 1.13 : 1;
        calories *= activityFactor;

        // 🏥 Health condition factor
        const healthFactor = condition === 'Catch-up Growth' ? 1.2
            : condition === 'Underweight' ? 1.15
            : condition === 'Overweight' ? 0.9
            : 1;
        calories *= healthFactor;

        // 💪 Macronutrients
        const protein = parseFloat((calories * 0.12 / 4).toFixed(2));
        const fat = parseFloat((calories * 0.35 / 9).toFixed(2));
        const carbs = parseFloat((calories * 0.5 / 4).toFixed(2));
        let baseWater = 1600;
            if (ageNum <= 6) baseWater = 700;
            else if (ageNum <= 12) baseWater = 900;
            else if (ageNum <= 36) baseWater = 1300;

            const waterMultiplier = condition === "Catch-up Growth" ? 1.2
                                : condition === "Underweight" ? 1.15
                                : 1;

            const water = parseFloat((baseWater * waterMultiplier).toFixed(2));

        // 💊 Micronutrients — age and condition-based
        let calcium = 1000;
        if (ageNum <= 6) calcium = 200;
        else if (ageNum <= 12) calcium = 260;
        else if (ageNum <= 36) calcium = 700;

        let iron = 10;
        if (ageNum <= 6) iron = 0.27;
        else if (ageNum <= 12) iron = 11;
        else if (ageNum <= 36) iron = 7;

        let vitaminA = 400;
        if (ageNum <= 6) vitaminA = 400;
        else if (ageNum <= 12) vitaminA = 500;
        else if (ageNum <= 36) vitaminA = 300;

        // 🩺 Nutrition status
        let status = 'Normal';
        if (bmi < 14) status = 'Underweight';
        else if (bmi > 17) status = 'Overweight';

        setResult({
            bmi: roundedBMI.toString(),
            calories: parseInt(calories.toFixed(0)),
            protein,
            fat,
            carbs,
            iron: parseFloat(iron.toFixed(1)),
            calcium,
            vitaminA,
            status,
            water
        });
        } else {
        setResult(null);
        }
    }, [form]);

    return (
        <div className=" max-w-xl mx-auto space-y-5 text-white">
        <Text className="text-xl font-bold text-emerald-400 text-center">🧒 Personalized Nutrition Tool</Text>

        <Input type="number" placeholder="Age (months)" value={form.age} onChange={handleChange('age')} />
        <Select value={form.sex} onChange={handleChange('sex')}>
            <option value="">Select Sex</option>
            <option value="Male">👦 Male</option>
            <option value="Female">👧 Female</option>
        </Select>
        <Input type="number" placeholder="Weight (kg)" value={form.weight} onChange={handleChange('weight')} />
        <Input type="number" placeholder="Height (cm)" value={form.height} onChange={handleChange('height')} />
        <Select value={form.activity} onChange={handleChange('activity')}>
            <option value="">Select Activity</option>
            <option value="Sedentary">🛋️ Sedentary</option>
            <option value="Moderate">🚶 Moderate</option>
            <option value="Active">🏃 Active</option>
        </Select>
        <Select value={form.condition} onChange={handleChange('condition')}>
            <option value="">Health Condition</option>
            <option value="Normal">✅ Normal</option>
            <option value="Underweight">📉 Underweight</option>
            <option value="Overweight">📈 Overweight</option>
            <option value="Catch-up Growth">🛠️ Catch-up Growth</option>
        </Select>

       
        {result ? (
            <motion.div
                className=" text-[15px]"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="bg-[#1E1E2F] border border-gray-700 rounded-xl p-6">
                    <Text className="text-emerald-400 text-lg font-semibold text-center">Nutrition Summary</Text>
                    <div className="flex justify-between"><Text>BMI:</Text><Text>{result.bmi}</Text></div>
                    <div className="flex justify-between"><Text>Status:</Text><Text>{result.status}</Text></div>
                    <Divider />
                    <div className="flex justify-between"><Text>🔥 Calories:</Text><Text>{result.calories} kcal</Text></div>
                    <div className="flex justify-between"><Text>💪 Protein:</Text><Text>{result.protein} g</Text></div>
                    <div className="flex justify-between"><Text>🧈 Fat:</Text><Text>{result.fat} g</Text></div>
                    <div className="flex justify-between"><Text>🍞 Carbs:</Text><Text>{result.carbs} g</Text></div>
                    <Divider />
                    <div className="flex justify-between"><Text>🩸 Iron:</Text><Text>{result.iron} mg</Text></div>
                    <div className="flex justify-between"><Text>🦴 Calcium:</Text><Text>{result.calcium} mg</Text></div>
                    <div className="flex justify-between"><Text>👁️ Vitamin A:</Text><Text>{result.vitaminA} mcg</Text></div>
                    <div className="flex justify-between"><Text>👁️ Water</Text><Text>{result.water} mcg</Text></div>
                </div>
            </motion.div>
        ) : (
            // You can uncomment and use your placeholder here if desired
            // <Placeholder header="Waiting for input...">
            //     <Caption>Fill all fields above to calculate your child's needs.</Caption>
            // </Placeholder>
            null
        )}
        </div>
    );
    }
