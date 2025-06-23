import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface AttentionChartProps {
  attentionData: { timestamp: string; attention: number }[];
}

const AttentionChart: React.FC<AttentionChartProps> = ({ attentionData }) => {
  const chartData = {
    labels: attentionData.map(data => data.timestamp.split('Time: ')[1] || 'n/a'),
    datasets: [
      {
        label: 'Attention Score',
        data: attentionData.map(data => data.attention),
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: 'Attention Score Over Time',
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default AttentionChart; 