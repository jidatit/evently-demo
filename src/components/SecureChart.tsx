
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface SecureChartProps {
  data: ChartData[];
  title?: string;
  color?: string;
}

const SecureChart: React.FC<SecureChartProps> = ({ 
  data, 
  title = "Chart", 
  color = "#8884d8" 
}) => {
  // Validate and sanitize input data
  const sanitizedData = data?.filter(item => 
    item && 
    typeof item.name === 'string' && 
    typeof item.value === 'number' && 
    !isNaN(item.value)
  ).map(item => ({
    name: String(item.name).substring(0, 50), // Limit length
    value: Math.max(0, Number(item.value)) // Ensure non-negative numbers
  })) || [];

  const sanitizedTitle = String(title).substring(0, 100);
  const sanitizedColor = /^#[0-9A-F]{6}$/i.test(color) ? color : "#8884d8";

  return (
    <div className="w-full h-64">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{sanitizedTitle}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sanitizedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill={sanitizedColor} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SecureChart;
