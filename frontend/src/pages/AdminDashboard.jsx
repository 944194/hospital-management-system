import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import api from "../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("admin/dashboard/");
        setDashboard(response.data);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const appointmentData = useMemo(() => {
    if (!dashboard?.appointments) return [];

    return [
      {
        name: "Scheduled",
        value: dashboard.appointments.scheduled || 0,
      },
      {
        name: "Confirmed",
        value: dashboard.appointments.confirmed || 0,
      },
      {
        name: "Completed",
        value: dashboard.appointments.completed || 0,
      },
      {
        name: "Cancelled",
        value: dashboard.appointments.cancelled || 0,
      },
      {
        name: "No Show",
        value: dashboard.appointments.no_show || 0,
      },
    ];
  }, [dashboard]);

  const laboratoryData = useMemo(() => {
    if (!dashboard?.lab_tests) return [];

    return [
      {
        name: "Requested",
        value: dashboard.lab_tests.requested || 0,
      },
      {
        name: "In Progress",
        value: dashboard.lab_tests.in_progress || 0,
      },
      {
        name: "Completed",
        value: dashboard.lab_tests.completed || 0,
      },
      {
        name: "Cancelled",
        value: dashboard.lab_tests.cancelled || 0,
      },
    ];
  }, [dashboard]);

  const hospitalOverviewData = useMemo(() => {
    if (!dashboard) return [];

    return [
      {
        name: "Patients",
        value: dashboard.patients?.total || 0,
      },
      {
        name: "Doctors",
        value: dashboard.doctors?.total || 0,
      },
      {
        name: "Appointments",
        value: dashboard.appointments?.total || 0,
      },
      {
        name: "Medical Records",
        value: dashboard.medical_records?.total || 0,
      },
      {
        name: "Prescriptions",
        value: dashboard.prescriptions?.total || 0,
      },
      {
        name: "Lab Tests",
        value: dashboard.lab_tests?.total || 0,
      },
      {
        name: "Lab Results",
        value: dashboard.lab_results?.total || 0,
      },
    ];
  }, [dashboard]);

  const billingData = useMemo(() => {
    if (!dashboard?.billing) return [];

    return [
      {
        name: "Billed",
        amount: Number(
          dashboard.billing.total_billed_amount || 0
        ),
      },
      {
        name: "Collected",
        amount: Number(
          dashboard.billing.total_collected_amount || 0
        ),
      },
      {
        name: "Outstanding",
        amount: Number(
          dashboard.billing.outstanding_amount || 0
        ),
      },
    ];
  }, [dashboard]);

  const billingStatusData = useMemo(() => {
    if (!dashboard?.billing) return [];

    return [
      {
        name: "Paid",
        value: dashboard.billing.paid_bills || 0,
      },
      {
        name: "Partially Paid",
        value: dashboard.billing.partially_paid_bills || 0,
      },
      {
        name: "Pending",
        value: dashboard.billing.pending_bills || 0,
      },
      {
        name: "Cancelled",
        value: dashboard.billing.cancelled_bills || 0,
      },
    ];
  }, [dashboard]);

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-state">
          <div className="admin-dashboard-spinner" />
          <p>Loading hospital dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-error">
          <div className="admin-dashboard-error-icon">!</div>
          <h2>{error}</h2>
          <p>Please refresh the page and try again.</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-empty">
          <h2>No dashboard data available</h2>
        </div>
      </div>
    );
  }

  const totalPatients = dashboard.patients?.total || 0;
  const totalDoctors = dashboard.doctors?.total || 0;
  const totalAppointments =
    dashboard.appointments?.total || 0;
  const completedAppointments =
    dashboard.appointments?.completed || 0;
  const totalRecords =
    dashboard.medical_records?.total || 0;
  const totalPrescriptions =
    dashboard.prescriptions?.total || 0;
  const totalLabTests =
    dashboard.lab_tests?.total || 0;
  const totalLabResults =
    dashboard.lab_results?.total || 0;

  const totalBilled =
    Number(dashboard.billing?.total_billed_amount || 0);

  const totalCollected =
    Number(dashboard.billing?.total_collected_amount || 0);

  const outstanding =
    Number(dashboard.billing?.outstanding_amount || 0);

  const collectionRate =
    totalBilled > 0
      ? Math.round((totalCollected / totalBilled) * 100)
      : 0;

  return (
    <div className="admin-dashboard-page">

      {/* Header */}

      <div className="admin-dashboard-header">
        <div>
          <p className="admin-dashboard-eyebrow">
            HOSPITAL ADMINISTRATION
          </p>

          <h1>Admin Dashboard</h1>

          <p>
            Monitor hospital operations, patient activity,
            clinical services and financial performance.
          </p>
        </div>

        <div className="admin-dashboard-live">
          <span className="admin-dashboard-live-dot" />
          System Overview
        </div>
      </div>

      {/* Primary Stats */}

      <div className="admin-dashboard-stat-grid">

        <div className="admin-stat-card patients">
          <div className="admin-stat-icon">P</div>

          <div>
            <span>Total Patients</span>
            <strong>{totalPatients}</strong>
            <small>Registered patients</small>
          </div>
        </div>

        <div className="admin-stat-card doctors">
          <div className="admin-stat-icon">D</div>

          <div>
            <span>Total Doctors</span>
            <strong>{totalDoctors}</strong>
            <small>Medical professionals</small>
          </div>
        </div>

        <div className="admin-stat-card appointments">
          <div className="admin-stat-icon">A</div>

          <div>
            <span>Appointments</span>
            <strong>{totalAppointments}</strong>
            <small>All appointments</small>
          </div>
        </div>

        <div className="admin-stat-card completed">
          <div className="admin-stat-icon">✓</div>

          <div>
            <span>Completed</span>
            <strong>{completedAppointments}</strong>
            <small>Completed visits</small>
          </div>
        </div>

        <div className="admin-stat-card billing">
          <div className="admin-stat-icon">₹</div>

          <div>
            <span>Outstanding</span>
            <strong>
              ₹{outstanding.toLocaleString("en-IN")}
            </strong>
            <small>Pending collection</small>
          </div>
        </div>
      </div>

      {/* Main Analytics */}

      <div className="admin-dashboard-chart-grid">

        {/* Hospital Overview */}

        <div className="admin-chart-card admin-chart-wide">

          <div className="admin-chart-header">
            <div>
              <p>HOSPITAL ACTIVITY</p>
              <h2>Hospital Overview</h2>
            </div>

            <span className="admin-chart-badge">
              Overall
            </span>
          </div>

          <div className="admin-chart-large">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hospitalOverviewData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -15,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip
                  cursor={{ fill: "rgba(124,58,237,0.05)" }}
                />

                <Bar
                  dataKey="value"
                  radius={[7, 7, 0, 0]}
                  fill="#7c3aed"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointment Distribution */}

        <div className="admin-chart-card">

          <div className="admin-chart-header">
            <div>
              <p>APPOINTMENTS</p>
              <h2>Appointment Status</h2>
            </div>
          </div>

          <div className="admin-chart-donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appointmentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {appointmentData.map((entry, index) => (
                    <Cell
                      key={`appointment-${index}`}
                      fill={
                        [
                          "#7c3aed",
                          "#6366f1",
                          "#10b981",
                          "#ef4444",
                          "#f59e0b",
                        ][index]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="admin-donut-center">
              <strong>{totalAppointments}</strong>
              <span>Total</span>
            </div>
          </div>

          <div className="admin-chart-legend">

            {appointmentData.map((item, index) => (
              <div
                className="admin-legend-item"
                key={item.name}
              >
                <span
                  className="admin-legend-dot"
                  style={{
                    background:
                      [
                        "#7c3aed",
                        "#6366f1",
                        "#10b981",
                        "#ef4444",
                        "#f59e0b",
                      ][index],
                  }}
                />

                <span>{item.name}</span>

                <strong>{item.value}</strong>
              </div>
            ))}

          </div>
        </div>

        {/* Billing Performance */}

        <div className="admin-chart-card">

          <div className="admin-chart-header">
            <div>
              <p>FINANCIAL PERFORMANCE</p>
              <h2>Billing Overview</h2>
            </div>

            <span className="admin-chart-badge">
              {collectionRate}% collected
            </span>
          </div>

          <div className="admin-chart-medium">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={billingData}
                layout="vertical"
                margin={{
                  top: 10,
                  right: 20,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={75}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(value).toLocaleString("en-IN")}`
                  }
                />

                <Bar
                  dataKey="amount"
                  fill="#6366f1"
                  radius={[0, 7, 7, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-financial-summary">

            <div>
              <span>Total Billed</span>
              <strong>
                ₹{totalBilled.toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Collected</span>
              <strong>
                ₹{totalCollected.toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Outstanding</span>
              <strong>
                ₹{outstanding.toLocaleString("en-IN")}
              </strong>
            </div>

          </div>
        </div>

        {/* Laboratory */}

        <div className="admin-chart-card">

          <div className="admin-chart-header">
            <div>
              <p>LABORATORY</p>
              <h2>Lab Test Pipeline</h2>
            </div>
          </div>

          <div className="admin-chart-medium">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={laboratoryData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -15,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient
                    id="labGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#7c3aed"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="95%"
                      stopColor="#7c3aed"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10 }}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  fill="url(#labGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Billing Status */}

        <div className="admin-chart-card">

          <div className="admin-chart-header">
            <div>
              <p>BILLING STATUS</p>
              <h2>Bill Distribution</h2>
            </div>
          </div>

          <div className="admin-chart-donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={billingStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {billingStatusData.map((entry, index) => (
                    <Cell
                      key={`billing-${index}`}
                      fill={
                        [
                          "#10b981",
                          "#f59e0b",
                          "#ef4444",
                          "#6b7280",
                        ][index]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="admin-donut-center">
              <strong>
                {dashboard.billing?.total_bills || 0}
              </strong>
              <span>Bills</span>
            </div>
          </div>

          <div className="admin-chart-legend">

            {billingStatusData.map((item, index) => (
              <div
                className="admin-legend-item"
                key={item.name}
              >
                <span
                  className="admin-legend-dot"
                  style={{
                    background:
                      [
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                        "#6b7280",
                      ][index],
                  }}
                />

                <span>{item.name}</span>

                <strong>{item.value}</strong>
              </div>
            ))}

          </div>
        </div>

        {/* Clinical Activity */}

        <div className="admin-chart-card">

          <div className="admin-chart-header">
            <div>
              <p>CLINICAL SERVICES</p>
              <h2>Healthcare Activity</h2>
            </div>
          </div>

          <div className="admin-clinical-list">

            <div className="admin-clinical-row">
              <div className="admin-clinical-icon">M</div>

              <div>
                <span>Medical Records</span>
                <strong>{totalRecords}</strong>
              </div>

              <div className="admin-clinical-progress">
                <span
                  style={{
                    width: `${Math.min(
                      totalRecords * 5,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="admin-clinical-row">
              <div className="admin-clinical-icon">Rx</div>

              <div>
                <span>Prescriptions</span>
                <strong>{totalPrescriptions}</strong>
              </div>

              <div className="admin-clinical-progress">
                <span
                  style={{
                    width: `${Math.min(
                      totalPrescriptions * 5,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="admin-clinical-row">
              <div className="admin-clinical-icon">L</div>

              <div>
                <span>Laboratory Tests</span>
                <strong>{totalLabTests}</strong>
              </div>

              <div className="admin-clinical-progress">
                <span
                  style={{
                    width: `${Math.min(
                      totalLabTests * 5,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="admin-clinical-row">
              <div className="admin-clinical-icon">R</div>

              <div>
                <span>Lab Results</span>
                <strong>{totalLabResults}</strong>
              </div>

              <div className="admin-clinical-progress">
                <span
                  style={{
                    width: `${Math.min(
                      totalLabResults * 5,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Financial Summary */}

        <div className="admin-finance-card">

          <div className="admin-finance-content">

            <div>
              <p>FINANCIAL SNAPSHOT</p>
              <h2>Hospital Revenue</h2>
              <span>
                Current billing and collection performance
              </span>
            </div>

            <div className="admin-finance-amount">
              ₹{totalCollected.toLocaleString("en-IN")}
              <small>Collected</small>
            </div>

          </div>

          <div className="admin-finance-progress">

            <div className="admin-finance-progress-header">
              <span>Collection Progress</span>
              <strong>{collectionRate}%</strong>
            </div>

            <div className="admin-finance-progress-bar">
              <span
                style={{
                  width: `${Math.min(
                    collectionRate,
                    100
                  )}%`,
                }}
              />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;