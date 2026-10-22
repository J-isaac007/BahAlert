import { Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, TimeScale, Tooltip } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import { STATUS_COLORS } from '../../lib/mapStyles.js';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Filler, annotationPlugin);

const thresholdLine = (value, color, label) => ({
  type: 'line',
  yMin: value,
  yMax: value,
  borderColor: color,
  borderWidth: 1.5,
  borderDash: [6, 4],
  label: { display: true, content: label, position: 'start', backgroundColor: color, font: { size: 10 } },
});

export default function LevelChart({ readings, config }) {
  const data = {
    datasets: [
      {
        label: 'Water level (cm)',
        data: readings.map((r) => ({ x: r.ts, y: r.levelCm })),
        borderColor: '#0f4c81',
        backgroundColor: 'rgba(15, 76, 129, 0.12)',
        fill: true,
        pointRadius: 0,
        tension: 0.25,
      },
    ],
  };

  const annotations = {};
  if (Number.isFinite(config.yellowCm)) annotations.yellow = thresholdLine(config.yellowCm, STATUS_COLORS.yellow, 'Yellow');
  if (Number.isFinite(config.redCm)) annotations.red = thresholdLine(config.redCm, STATUS_COLORS.red, 'Red');
  if (Number.isFinite(config.dangerCm)) annotations.danger = thresholdLine(config.dangerCm, '#7f1d1d', 'Danger');

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { type: 'time', time: { tooltipFormat: 'PPp' } },
      y: { beginAtZero: true, suggestedMax: (config.dangerCm ?? 80) * 1.1, title: { display: true, text: 'cm' } },
    },
    plugins: { annotation: { annotations } },
  };

  return (
    <div className="chart-box">
      <Line data={data} options={options} />
    </div>
  );
}
