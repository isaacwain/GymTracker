"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DataPoint = {
  date: string;
  maxWeight: number;
  totalVolume: number;
};

export default function ProgressChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-3">Max Weight (kg)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit="kg" />
            <Tooltip formatter={(v) => [`${v}kg`, "Max weight"]} />
            <Line
              type="monotone"
              dataKey="maxWeight"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-3">Total Volume (kg)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit="kg" />
            <Tooltip formatter={(v) => [`${v}kg`, "Total volume"]} />
            <Bar dataKey="totalVolume" fill="#93c5fd" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
