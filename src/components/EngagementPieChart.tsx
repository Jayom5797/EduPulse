import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface EngagementPieChartProps {
  attentionData: { attention: number }[];
}

const EngagementPieChart: React.FC<EngagementPieChartProps> = ({ attentionData }) => {
  const highFocus = attentionData.filter(d => d.attention > 70).length;
  const moderateFocus = attentionData.filter(d => d.attention > 40 && d.attention <= 70).length;
  const lowFocus = attentionData.filter(d => d.attention <= 40).length;

  const data = {
    labels: ['High Focus', 'Moderate Focus', 'Low Focus'],
    datasets: [
      {
        label: '# of Data Points',
        data: [highFocus, moderateFocus, lowFocus],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(255, 99, 132, 0.7)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Engagement Level Breakdown',
      },
    },
  };

  return <Pie data={data} options={options} />;
};

export default EngagementPieChart; 