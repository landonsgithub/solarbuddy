import { useEffect, useState } from 'react';
import { fetchLeads, fetchLeadStats } from '../services/api.js';
import styles from './LeadDashboard.module.css';

const FILTERS = [
  { value: 'all', label: 'All Leads' },
  { value: 'hot', label: 'Premium Leads' },
  { value: 'target', label: 'Target Area' }
];

const BUCKET_LABELS = {
  TARGET: 'Target Area',
  OTHER_LEAD: 'Other Lead'
};

const STATUS_LABELS = {
  WESTERN_CO_TARGET: 'Western Colorado',
  OTHER_CO: 'Colorado, Outside Target',
  OUT_OF_STATE: 'Outside Colorado',
  UNKNOWN: 'Needs Review'
};

export default function LeadDashboard() {
  const [filter, setFilter] = useState('all');
  const [leads, setLeads] = useState([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    hot: 0,
    target: 0,
    outOfArea: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleLeadCreated = () => {
      setRefreshToken((current) => current + 1);
    };

    window.addEventListener('solarbuddy:lead-created', handleLeadCreated);

    return () => {
      window.removeEventListener('solarbuddy:lead-created', handleLeadCreated);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [leadResponse, statResponse] = await Promise.all([
          fetchLeads(filter),
          fetchLeadStats()
        ]);

        if (cancelled) {
          return;
        }

        setLeads(leadResponse.data);
        setStats(statResponse.data);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [filter, refreshToken]);

  return (
    <section className={styles.dashboardCard}>
      <div className={styles.dashboardHeader}>
        <div>
          <p className={styles.kicker}>Lead Dashboard</p>
          <h2>Stored demo leads</h2>
        </div>

        <select value={filter} onChange={(event) => setFilter(event.target.value)} className={styles.filterSelect}>
          {FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.statsGrid}>
        <article className={styles.statTile}>
          <span>Total</span>
          <strong>{stats.total}</strong>
        </article>
        <article className={styles.statTile}>
          <span>Premium</span>
          <strong>{stats.hot}</strong>
        </article>
        <article className={styles.statTile}>
          <span>Target</span>
          <strong>{stats.target}</strong>
        </article>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Score</th>
              <th>Bucket</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading && leads.length === 0 && (
              <tr>
                <td colSpan="5" className={styles.emptyState}>
                  No leads yet. Complete the widget flow to populate this table.
                </td>
              </tr>
            )}

            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <strong>{lead.fullName}</strong>
                  <p>{lead.email}</p>
                </td>
                <td>{lead.zipCode}</td>
                <td>{lead.seriousness}/10</td>
                <td>{BUCKET_LABELS[lead.leadBucket] ?? lead.leadBucket}</td>
                <td>{STATUS_LABELS[lead.serviceAreaStatus] ?? lead.serviceAreaStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
