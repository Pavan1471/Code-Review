import { Bar } from "react-chartjs-2";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/metrics").then(r => setMetrics(r.data));
    axios.get("http://localhost:5000/api/commits").then(r => setLatest(r.data?.[0]));
  }, []);

  const chartData = useMemo(() => {
    if (!metrics) return null;
    return {
      labels: ["Critical", "High", "Medium", "Low"],
      datasets: [
        {
          data: [
            metrics.Critical,
            metrics.High,
            metrics.Medium,
            metrics.Low,
          ],
          backgroundColor: ["#dc2626", "#ea580c", "#ca8a04", "#16a34a"],
          borderRadius: 6,
        },
      ],
    };
  }, [metrics]);

  if (!chartData) return <Loader />;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Code Quality Overview</h1>
        <p style={styles.subtitle}>Automated analysis & AI review</p>
      </div>

      {/* Summary */}
      <div style={styles.grid4}>
        <StatCard title="Critical" value={metrics.Critical} color="#dc2626" />
        <StatCard title="High" value={metrics.High} color="#ea580c" />
        <StatCard title="Medium" value={metrics.Medium} color="#ca8a04" />
        <StatCard title="Low" value={metrics.Low} color="#16a34a" />
      </div>

      {/* Main */}
      <div style={styles.grid3}>
        {/* Chart */}
        <div style={{ ...styles.card, gridColumn: "span 2" }}>
          <div style={styles.cardHeader}>
            <span>Issue Severity Distribution</span>
          </div>
          <div style={{ height: 280 }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>

        {/* Meta */}
        <div style={styles.card}>
          <Meta label="Repository" value={latest?.repo || "—"} />
          <Meta label="Commit" value={latest?.commit?.slice(0, 7) || "—"} />
          <Meta
            label="Scanned At"
            value={
              latest ? new Date(latest.createdAt).toLocaleString() : "—"
            }
          />

          <div style={styles.divider} />

          <p style={styles.metaLabel}>Overall Code Health</p>
          <p style={styles.score}>
            {calculateScore(metrics)}
            <span style={styles.scoreMax}> / 100</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({ title, value, color }) {
  return (
    <div style={styles.card}>
      <p style={styles.metaLabel}>{title}</p>
      <div style={styles.statRow}>
        <p style={styles.statValue}>{value}</p>
        <span style={{ ...styles.badge, background: `${color}22`, color }}>
          {title}
        </span>
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div style={styles.metaRow}>
      <span style={styles.metaLabel}>{label}</span>
      <span style={styles.metaValue}>{value}</span>
    </div>
  );
}


