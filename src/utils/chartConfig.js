// Reusable Chart.js config builders
// Usage with react-chartjs-2: const { data, options } = buildLineConfig(labels, datasets, { title: '...' })

export function buildCommonOptions({ title, legend = true, responsive = true, maintainAspectRatio = false, yTitle, xTitle } = {}) {
  return {
    responsive,
    maintainAspectRatio,
    plugins: {
      legend: { display: legend },
      title: title ? { display: true, text: title } : { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    scales: {
      x: { title: xTitle ? { display: true, text: xTitle } : undefined, grid: { display: false } },
      y: { title: yTitle ? { display: true, text: yTitle } : undefined, beginAtZero: true },
    },
  };
}

export function buildLineData(labels, datasets) {
  return { labels, datasets };
}

export function buildBarData(labels, datasets) {
  return { labels, datasets };
}

export function buildDoughnutData(labels, values, { backgroundColors } = {}) {
  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: backgroundColors || [
          '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'
        ],
        borderWidth: 0,
      },
    ],
  };
}

// Helper to create a dataset with default stylings
export function makeDataset({ label, data, color = '#3b82f6', type = 'line', fill = false }) {
  const common = { label, data, borderColor: color, backgroundColor: color };
  if (type === 'line') {
    return { ...common, type: 'line', tension: 0.3, fill };
  }
  if (type === 'bar') {
    return { ...common, type: 'bar' };
  }
  return common;
}
