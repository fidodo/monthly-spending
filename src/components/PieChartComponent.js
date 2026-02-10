// components/PieChartComponent.js
import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChartComponent = ({ data, labels }) => {
  // Prepare chart data
  const chartData = {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: [
          "#FF6384", // Red
          "#36A2EB", // Blue
          "#FFCE56", // Yellow
          "#4BC0C0", // Teal
          "#9966FF", // Purple
          "#FF9F40", // Orange
          "#8AC926", // Green
          "#1982C4", // Dark Blue
          "#6A4C93", // Violet
          "#FF595E", // Coral
        ],
        borderColor: "white",
        borderWidth: 2,
        hoverOffset: 15,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "left",
        labels: {
          color: "#333",
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: £${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div
      style={{
        height: "300px",
        width: "100%",
        maxWidth: "500px",
        margin: "0, auto",
      }}
    >
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default PieChartComponent;
