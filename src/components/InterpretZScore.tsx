
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
} from "react-icons/fa";
import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

// Map Z-Score ranges to gauge properties
const getGaugeProperties = (zScore: number) => {
  if (zScore < -3)
    return {
      label: "Severe Stunting",
      color: "#f87171", // red-400
      icon: <FaExclamationTriangle size={24} className="text-red-500" />,
    };
  if (zScore < -2)
    return {
      label: "Moderate Stunting",
      color: "#fb923c", // orange-400
      icon: <FaExclamationTriangle size={24} className="text-orange-400" />,
    };
  if (zScore < -1)
    return {
      label: "Mild Stunting",
      color: "#facc15", // yellow-400
      icon: <FaInfoCircle size={24} className="text-yellow-400" />,
    };
  if (zScore < 1)
    return {
      label: "Normal Height",
      color: "#4ade80", // green-400
      icon: <FaCheckCircle size={24} className="text-green-400" />,
    };
  if (zScore < 2)
    return {
      label: "Above Average Height",
      color: "#60a5fa", // blue-400
      icon: <FaInfoCircle size={24} className="text-blue-400" />,
    };
  return {
    label: "Exceptionally Tall",
    color: "#c084fc", // purple-400
    icon: <FaInfoCircle size={24} className="text-purple-400" />,
  };
};

const InterpretZScore = ({ zScore }: any) => {
  if (typeof zScore !== "number" || isNaN(zScore)) {
    return (
      <div className="p-4 mt-4 bg-gray-900 text-white rounded-lg text-center">
        <FaExclamationTriangle className="text-yellow-400 text-2xl mb-2" />
        <h2 className="text-lg font-bold">Invalid Z-Score</h2>
        <p className="text-sm">Please enter a valid numerical value.</p>
      </div>
    );
  }

  const { label, color, icon } = getGaugeProperties(zScore);
  const percentage = Math.max(
    0,
    Math.min(100, ((zScore + 4) / 8) * 100)
  ); // normalize zScore from -4 to +4 into 0–100%

  return (
    <div className="p-6 mt-4 bg-gray-800 rounded-xl shadow-md flex flex-col items-center space-y-3">
      <div className="w-32 h-32">
        <CircularProgressbar
          value={percentage}
          text={`${zScore.toFixed(2)}`}
          styles={buildStyles({
            pathColor: color,
            textColor: color,
            trailColor: "#374151",
            textSize: "16px",
          })}
        />
      </div>
      <div className="flex items-center space-x-2">
        {icon}
        <h2 className="text-white font-semibold text-lg">{label}</h2>
      </div>
    </div>
  );
};

export default InterpretZScore;
