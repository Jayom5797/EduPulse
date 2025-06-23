import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AttentionBarChartProps {
  attentionData: { attention: number; timestamp: string }[];
}

const AttentionBarChart: React.FC<AttentionBarChartProps> = ({ attentionData }) => {
  const chartData = {
    labels: attentionData.map(data => data.timestamp.split('Time: ')[1] || 'n/a'),
    datasets: [
      {
        label: 'Attention Level',
        data: attentionData.map(data => data.attention),
        backgroundColor: function(context: any) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return;
          
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(255, 99, 132, 0.5)');
          gradient.addColorStop(0.5, 'rgba(255, 205, 86, 0.5)');
          gradient.addColorStop(1, 'rgba(75, 192, 192, 0.5)');
          return gradient;
        },
        borderColor: function(context: any) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return;
          
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgb(255, 99, 132)');
          gradient.addColorStop(0.5, 'rgb(255, 205, 86)');
          gradient.addColorStop(1, 'rgb(75, 192, 192)');
          return gradient;
        },
        borderWidth: 2,
        borderRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      },
      x: {
        grid: {
          display: false
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
        text: 'Attention Levels',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            return `Attention: ${context.parsed.y}%`;
          }
        }
      }
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default AttentionBarChart; 