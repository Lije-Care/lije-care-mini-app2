import React from 'react';

const weightForHeightData: Record<number, number[]> = {
  74.5: [7.0, 7.6, 8.3, 9.1, 9.9, 10.9, 12.0],
  75.0: [7.1, 7.7, 8.4, 9.1, 10.0, 11.0, 12.2],
  75.5: [7.1, 7.8, 8.5, 9.2, 10.1, 11.1, 12.3],
  // Add more rows for production
};

const zLabels = ['-3 SD', '-2 SD', '-1 SD', 'Normal', '+1 SD', '+2 SD', '+3 SD'];

type Props = {
  height: number;
  weight: number;
};

const getClosestHeight = (height: number) => {
  const keys = Object.keys(weightForHeightData).map(Number);
  return keys.reduce((a, b) =>
    Math.abs(b - height) < Math.abs(a - height) ? b : a
  );
};

const getZIndex = (weights: number[], weight: number) => {
  for (let i = 0; i < weights.length - 1; i++) {
    if (weight >= weights[i] && weight < weights[i + 1]) {
      return i;
    }
  }
  return weight < weights[0] ? 0 : weights.length - 1;
};

const getStatus = (index: number) => {
  if (index <= 1) return { status: 'Underweight', color: 'bg-red-100 text-red-600' };
  if (index <= 3) return { status: 'Normal', color: 'bg-green-100 text-green-600' };
  return { status: 'Overweight', color: 'bg-yellow-100 text-yellow-600' };
};

const ChildLabel: React.FC<Props> = ({ height, weight }) => {
  const closest = getClosestHeight(height);
  const weights = weightForHeightData[closest];

  if (!weights) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg shadow-sm">
        No data available for height: {height} cm
      </div>
    );
  }

  const index = getZIndex(weights, weight);
  const label = zLabels[index];
  const { status, color } = getStatus(index);

  return (
    <div className="max-w-sm mx-auto mt-4 p-4 rounded-xl  shadow-md border border-gray-200">
      <div className="font-semibold text-lg mb-2">Child Growth Check</div>
      <div className="text-sm  mb-1">
        Height: <span className="font-medium">{height} cm</span>
      </div>
      <div className="text-sm  mb-3">
        Weight: <span className="font-medium">{weight} kg</span>
      </div>

      <div className={`px-3 py-1 inline-block rounded-full text-sm font-semibold ${color}`}>
        Z-score: {label} – {status}
      </div>
    </div>
  );
};

export default ChildLabel;
