import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface EngagementRadarChartProps {
  attentionData: { attention: number }[];
}

const EngagementRadarChart: React.FC<EngagementRadarChartProps> = ({ attentionData }) => {
  // Calculate metrics
  const calculateMetrics = () => {
    const total = attentionData.length;
    if (total === 0) return [0, 0, 0, 0, 0];

    const highFocus = (attentionData.filter(d => d.attention > 80).length / total) * 100;
    const moderateFocus = (attentionData.filter(d => d.attention > 60 && d.attention <= 80).length / total) * 100;
    const normalFocus = (attentionData.filter(d => d.attention > 40 && d.attention <= 60).length / total) * 100;
    const lowFocus = (attentionData.filter(d => d.attention > 20 && d.attention <= 40).length / total) * 100;
    const veryLowFocus = (attentionData.filter(d => d.attention <= 20).length / total) * 100;

    return [highFocus, moderateFocus, normalFocus, lowFocus, veryLowFocus];
  };

  const metrics = calculateMetrics();

  const data = {
    labels: ['High Focus', 'Moderate Focus', 'Normal Focus', 'Low Focus', 'Very Low Focus'],
    datasets: [
      {
        label: 'Engagement Distribution',
        data: metrics,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: function(value: any) {
            return value + '%';
          }
        },
        pointLabels: {
          font: {
            size: 12
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#334155',
          font: { size: 14 }
        }
      },
      title: {
        display: true,
        text: 'Engagement Distribution',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.raw.toFixed(1)}%`;
          }
        }
      }
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Radar data={data} options={options} />
    </div>
  );
};

export default EngagementRadarChart; 