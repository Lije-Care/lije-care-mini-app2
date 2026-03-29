import { FaHeartbeat, FaWeight, FaCalendarWeek } from "react-icons/fa";

const BmiCalculator = ({ week, setWeek, bmi, category, setBmi }: any) => {
  return (
    <div className="max-w-md mx-auto mt-8  p-6 rounded-2xl shadow-xl border border-gray-200 space-y-6 transition-all duration-300">
      <h1 className="text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
        <FaHeartbeat className="text-pink-500" /> BMI Tracker
      </h1>

      <div>
        <label className="block  font-semibold mb-1 flex items-center gap-2">
          <FaCalendarWeek className="text-blue-500" />
          Select Week:
        </label>
        <input
          type="number"
          min={0}
          max={5}
          value={week}
          onChange={(e) => setWeek(parseInt(e.target.value))}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter week number (0-5)"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1 flex items-center gap-2">
          <FaWeight className="text-indigo-500" />
          Enter BMI:
        </label>
        <input
          type="number"
          step="0.01"
          value={bmi}
          onChange={(e) => setBmi(parseFloat(e.target.value))}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Enter your BMI"
        />
      </div>

      {category.label && (
        <div
          className={`p-4 rounded-xl text-white text-center ${category.color} transition duration-500 shadow-md`}
        >
          <h2 className="text-xl font-semibold">{category.label}</h2>
          <p className="text-sm">BMI: {bmi.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};

export default BmiCalculator;
