import { Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, TimeScale, Tooltip } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Filler, annotationPlugin);

// Design tokens (dark). Chart.js draws on canvas, so it can't read CSS vars.
const C = {
  line: '#8be3f7',
  fill: 'rgba(68, 194, 244, 0.18)',
  grid: '#1a3242',
  tick: '#8aa3b2',
  text: '#f2f8fb',
  surface: '#0b151d',
  raised: '#10202b',
  yellow: '#fbbf24',
  red: '#fca5a5',
};
const FONT = { family: 'Inter, system-ui, sans-serif', size: 12 };

const thresholdLine = (value, color, label) => ({
  type: 'line',
  yMin: value,
  yMax: value,
  borderColor: color,
  borderWidth: 1.5,
  borderDash: [6, 4],
  label: {
    display: true,
    content: `${label} ${value} cm`,
    position: 'start',
    backgroundColor: 'transparent',
    color,
    font: { ...FONT, weight: 600 },
    yAdjust: -10,
  },
});

export default function LevelChart({ readings, config }) {
  const data = {
    datasets: [
      {
        label: 'Water level (cm)',
        data: readings.map((r) => ({ x: r.ts, y: r.levelCm })),
        borderColor: C.line,
        backgroundColor: C.fill,
        borderWidth: 2.5,
        fill: true,
        pointRadius: 0,
        tension: 0.25,
      },
    ],
  };

  const annotations = {};
  if (Number.isFinite(config.dangerCm)) annotations.danger = thresholdLine(config.dangerCm, C.text, 'Overflow');
  if (Number.isFinite(config.redCm)) annotations.red = thresholdLine(config.redCm, C.red, 'Red');
  if (Number.isFinite(config.yellowCm)) annotations.yellow = thresholdLine(config.yellowCm, C.yellow, 'Yellow');

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        type: 'time',
        time: { tooltipFormat: 'PPp' },
        grid: { display: false },
        border: { color: C.grid },
        ticks: { color: C.tick, font: FONT, maxRotation: 0, autoSkipPadding: 24 },
      },
      y: {
        beginAtZero: true,
        suggestedMax: (config.dangerCm ?? 80) * 1.1,
        grid: { color: C.grid },
        border: { display: false },
        ticks: { color: C.tick, font: FONT, maxTicksLimit: 5 },
      },
    },
    plugins: {
      annotation: { annotations },
      tooltip: {
        backgroundColor: C.raised,
        titleColor: C.text,
        bodyColor: C.text,
        borderColor: C.grid,
        borderWidth: 1,
        padding: 10,
        titleFont: FONT,
        bodyFont: { ...FONT, weight: 600 },
        callbacks: { label: (ctx) => `${ctx.parsed.y.toFixed(1)} cm` },
      },
    },
  };

  if (!readings.length) return <p className="empty">No readings in this time range.</p>;

  return (
    <div className="chart-box" role="img" aria-label={`Water level chart, ${readings.length} readings`}>
      <Line data={data} options={options} />
    </div>
  );
}
