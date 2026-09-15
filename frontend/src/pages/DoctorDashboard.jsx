import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

function DoctorDashboard() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [admissions, setAdmissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          appointmentsResponse,
          medicalRecordsResponse,
          prescriptionsResponse,
          labTestsResponse,
          labResultsResponse,
          admissionsResponse,
        ] = await Promise.all([
          api.get("appointments/"),
          api.get("medical-records/"),
          api.get("prescriptions/"),
          api.get("lab-tests/"),
          api.get("lab-results/"),
          api.get("admissions/"),
        ]);

        const getData = (response) =>
          Array.isArray(response.data)
            ? response.data
            : response.data.results || [];

        setAppointments(getData(appointmentsResponse));
        setMedicalRecords(getData(medicalRecordsResponse));
        setPrescriptions(getData(prescriptionsResponse));
        setLabTests(getData(labTestsResponse));
        setLabResults(getData(labResultsResponse));
        setAdmissions(getData(admissionsResponse));
      } catch (err) {
        console.error("Doctor dashboard error:", err);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner"></div>

          <h2>Loading your dashboard...</h2>

          <p>
            Please wait while we load your clinical information.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error-card">
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // APPOINTMENT COUNTS
  // ==========================================

  const scheduledAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "SCHEDULED"
  ).length;

  const confirmedAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "CONFIRMED"
  ).length;

  const completedAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "COMPLETED"
  ).length;

  const cancelledAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "CANCELLED"
  ).length;

  const noShowAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "NO_SHOW"
  ).length;

  // ==========================================
  // ACTIVE ADMISSIONS
  // ==========================================

  const activeAdmissions = admissions.filter(
    (admission) =>
      admission.status === "ADMITTED" ||
      admission.status === "UNDER_TREATMENT"
  ).length;

  // ==========================================
  // LAB COUNTS
  // ==========================================

  const requestedLabTests = labTests.filter(
    (test) =>
      test.status === "REQUESTED"
  ).length;

  const inProgressLabTests = labTests.filter(
    (test) =>
      test.status === "IN_PROGRESS"
  ).length;

  const completedLabTests = labTests.filter(
    (test) =>
      test.status === "COMPLETED"
  ).length;

  const cancelledLabTests = labTests.filter(
    (test) =>
      test.status === "CANCELLED"
  ).length;

  // ==========================================
  // APPOINTMENT PIE CHART
  // ==========================================

  const appointmentChartData = [
    {
      name: "Scheduled",
      value: scheduledAppointments,
    },
    {
      name: "Confirmed",
      value: confirmedAppointments,
    },
    {
      name: "Completed",
      value: completedAppointments,
    },
    {
      name: "Cancelled",
      value: cancelledAppointments,
    },
    {
      name: "No Show",
      value: noShowAppointments,
    },
  ].filter(
    (item) => item.value > 0
  );

  const appointmentChartColors = {
    Scheduled: "#7C3AED",
    Confirmed: "#2563EB",
    Completed: "#10B981",
    Cancelled: "#F59E0B",
    "No Show": "#EF4444",
  };

  // ==========================================
  // LAB SEMI-CIRCLE
  // ==========================================

  const labRemaining = Math.max(
    labTests.length - completedLabTests,
    0
  );

  const labCompletionData = [
    {
      name: "Completed",
      value: completedLabTests,
    },
    {
      name: "Remaining",
      value: labRemaining,
    },
  ];

  const labCompletionPercentage =
    labTests.length > 0
      ? Math.round(
          (completedLabTests /
            labTests.length) *
            100
        )
      : 0;

  // ==========================================
  // CLINICAL ACTIVITY BAR CHART
  // ==========================================

  const clinicalActivityData = [
    {
      name: "Appointments",
      value: appointments.length,
    },
    {
      name: "Records",
      value: medicalRecords.length,
    },
    {
      name: "Prescriptions",
      value: prescriptions.length,
    },
    {
      name: "Lab Tests",
      value: labTests.length,
    },
    {
      name: "Admissions",
      value: admissions.length,
    },
  ];

  // ==========================================
  // APPOINTMENT ACTIVITY LINE CHART
  // ==========================================

  const appointmentActivityData = [
    {
      name: "Scheduled",
      appointments: scheduledAppointments,
    },
    {
      name: "Confirmed",
      appointments: confirmedAppointments,
    },
    {
      name: "Completed",
      appointments: completedAppointments,
    },
    {
      name: "Cancelled",
      appointments: cancelledAppointments,
    },
    {
      name: "No Show",
      appointments: noShowAppointments,
    },
  ];

  // ==========================================
  // RECENT APPOINTMENTS
  // ==========================================

  const recentAppointments = [
    ...appointments,
  ]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  // ==========================================
  // FORMAT STATUS
  // ==========================================

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatAppointmentDate = (date) => {
    if (!date) return "-";

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="dashboard-page">

      {/* ========================================
          HEADER
      ======================================== */}

      <section className="dashboard-header">

        <div>
          <span className="dashboard-eyebrow">
            DOCTOR PORTAL
          </span>

          <h1>
            Doctor Dashboard
          </h1>

          <p>
            Welcome back. Here is an overview of
            your patients and clinical activities.
          </p>
        </div>

        <div className="dashboard-header-icon">
          🩺
        </div>

      </section>

      {/* ========================================
          STATISTICS
      ======================================== */}

      <section className="dashboard-stats">

        <div
          className="stat-card dashboard-clickable-card"
          onClick={() =>
            navigate("/doctor/appointments")
          }
        >
          <div className="dashboard-stat-icon stat-icon-blue">
            📅
          </div>

          <div>
            <h3>Appointments</h3>
            <strong>
              {appointments.length}
            </strong>
            <p>
              {scheduledAppointments +
                confirmedAppointments}{" "}
              active
            </p>
          </div>
        </div>

        <div
          className="stat-card dashboard-clickable-card"
          onClick={() =>
            navigate("/doctor/medical-records")
          }
        >
          <div className="dashboard-stat-icon stat-icon-green">
            📋
          </div>

          <div>
            <h3>Medical Records</h3>
            <strong>
              {medicalRecords.length}
            </strong>
            <p>
              Patient records
            </p>
          </div>
        </div>

        <div
          className="stat-card dashboard-clickable-card"
          onClick={() =>
            navigate("/doctor/prescriptions")
          }
        >
          <div className="dashboard-stat-icon stat-icon-purple">
            💊
          </div>

          <div>
            <h3>Prescriptions</h3>
            <strong>
              {prescriptions.length}
            </strong>
            <p>
              Issued prescriptions
            </p>
          </div>
        </div>

        <div
          className="stat-card dashboard-clickable-card"
          onClick={() =>
            navigate("/doctor/admissions")
          }
        >
          <div className="dashboard-stat-icon stat-icon-red">
            🏥
          </div>

          <div>
            <h3>Active Admissions</h3>
            <strong>
              {activeAdmissions}
            </strong>
            <p>
              Currently admitted
            </p>
          </div>
        </div>

        <div
          className="stat-card dashboard-clickable-card"
          onClick={() =>
            navigate("/doctor/laboratory")
          }
        >
          <div className="dashboard-stat-icon stat-icon-orange">
            🧪
          </div>

          <div>
            <h3>Lab Tests</h3>
            <strong>
              {labTests.length}
            </strong>
            <p>
              {completedLabTests} completed
            </p>
          </div>
        </div>

        <div
          className="stat-card dashboard-clickable-card"
          onClick={() =>
            navigate("/doctor/laboratory")
          }
        >
          <div className="dashboard-stat-icon stat-icon-teal">
            🔬
          </div>

          <div>
            <h3>Lab Results</h3>
            <strong>
              {labResults.length}
            </strong>
            <p>
              Available results
            </p>
          </div>
        </div>

      </section>

      {/* ========================================
          ANALYTICS ROW
      ======================================== */}

      <section className="dashboard-chart-grid">

        {/* APPOINTMENT PIE */}

        <div className="dashboard-chart-card">

          <div className="dashboard-chart-header">

            <div>
              <h2>
                Appointment Overview
              </h2>

              <p>
                Appointment status distribution
              </p>
            </div>

            <span className="dashboard-chart-icon">
              📊
            </span>

          </div>

          {appointmentChartData.length > 0 ? (

            <div className="dashboard-pie-chart">

              <ResponsiveContainer
                width="100%"
                height={220}
              >

                <PieChart>

                  <Pie
                    data={appointmentChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >

                    {appointmentChartData.map(
                      (entry, index) => (
                        <Cell
                          key={`appointment-${index}`}
                          fill={
                            appointmentChartColors[
                              entry.name
                            ]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                    height={36}
                  />

                </PieChart>

              </ResponsiveContainer>

            </div>

          ) : (

            <div className="dashboard-chart-empty">
              No appointment data available.
            </div>

          )}

        </div>

        {/* LAB SEMI CIRCLE */}

        <div className="dashboard-chart-card">

          <div className="dashboard-chart-header">

            <div>
              <h2>
                Laboratory Progress
              </h2>

              <p>
                Completed laboratory tests
              </p>
            </div>

            <span className="dashboard-chart-icon">
              🧪
            </span>

          </div>

          <div className="dashboard-semicircle-wrapper">

            <ResponsiveContainer
              width="100%"
              height={180}
            >

              <PieChart>

                <Pie
                  data={labCompletionData}
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  cx="50%"
                  cy="90%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                >

                  {labCompletionData.map(
                    (entry, index) => (
                      <Cell
                        key={`lab-${index}`}
                        fill={
                          index === 0
                            ? "#7C3AED"
                            : "#E5E7EB"
                        }
                      />
                    )
                  )}

                </Pie>

              </PieChart>

            </ResponsiveContainer>

            <div className="dashboard-semicircle-value">

              <strong>
                {labCompletionPercentage}%
              </strong>

              <span>
                Completed
              </span>

            </div>

          </div>

          <div className="dashboard-lab-summary">

            <div>
              <strong>
                {completedLabTests}
              </strong>
              <span>
                Completed
              </span>
            </div>

            <div>
              <strong>
                {inProgressLabTests}
              </strong>
              <span>
                In Progress
              </span>
            </div>

            <div>
              <strong>
                {requestedLabTests}
              </strong>
              <span>
                Requested
              </span>
            </div>

          </div>

        </div>

      </section>

      {/* ========================================
          BAR + LINE CHART
      ======================================== */}

      <section className="dashboard-chart-grid">

        {/* BAR CHART */}

        <div className="dashboard-chart-card">

          <div className="dashboard-chart-header">

            <div>
              <h2>
                Clinical Activity
              </h2>

              <p>
                Overview of your clinical workload
              </p>
            </div>

            <span className="dashboard-chart-icon">
              📊
            </span>

          </div>

          <ResponsiveContainer
            width="100%"
            height={220}
          >

            <BarChart
              data={clinicalActivityData}
              margin={{
                top: 10,
                right: 10,
                left: -10,
                bottom: 10,
              }}
            >

              <CartesianGrid
                stroke="#E2E8F0"
                strokeDasharray="4 4"
              />

              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 11,
                  fill: "#64748B",
                }}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 11,
                  fill: "#64748B",
                }}
              />

              <Tooltip />

              <Bar
                dataKey="value"
                fill="#6D28D9"
                radius={[7, 7, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        {/* LINE CHART */}

        <div className="dashboard-chart-card">

          <div className="dashboard-chart-header">

            <div>
              <h2>
                Appointment Activity
              </h2>

              <p>
                Appointment status activity
              </p>
            </div>

            <span className="dashboard-chart-icon">
              📈
            </span>

          </div>

          <ResponsiveContainer
            width="100%"
            height={220}
          >

            <LineChart
              data={appointmentActivityData}
              margin={{
                top: 10,
                right: 10,
                left: -10,
                bottom: 10,
              }}
            >

              <CartesianGrid
                stroke="#E2E8F0"
                strokeDasharray="4 4"
              />

              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 11,
                  fill: "#64748B",
                }}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 11,
                  fill: "#64748B",
                }}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="appointments"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{
                  r: 5,
                  fill: "#2563EB",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 7,
                  fill: "#7C3AED",
                }}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </section>

      {/* ========================================
          RECENT APPOINTMENTS
      ======================================== */}

      <section className="dashboard-section">

        <div className="section-header">

          <div>
            <h2>
              Recent Appointments
            </h2>

            <p>
              Your latest patient appointments
            </p>
          </div>

          <span>
            {appointments.length} appointment
            {appointments.length !== 1
              ? "s"
              : ""}
          </span>

        </div>

        <div className="dashboard-table-container">

          <table className="dashboard-table">

            <thead>

              <tr>
                <th>Patient</th>
                <th>Consultation Room</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {recentAppointments.length === 0 ? (

                <tr>
                  <td
                    colSpan="5"
                    className="empty-state"
                  >
                    No appointments found.
                  </td>
                </tr>

              ) : (

                recentAppointments.map(
                  (appointment) => (

                    <tr
                      key={appointment.id}
                    >

                      <td>

                        <strong>
                          {appointment.patient_id ||
                            "-"}
                        </strong>

                        <br />

                        <span>
                          {appointment.patient_name ||
                            "-"}
                        </span>

                      </td>

                      <td>
                        <span className="dashboard-room-badge">
                          {appointment.consultation_room_number ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        {formatAppointmentDate(
                          appointment.appointment_date
                        )}
                      </td>

                      <td>
                        {appointment.appointment_time ||
                          "-"}
                      </td>

                      <td>

                        <span
                          className={`status-badge status-${String(
                            appointment.status || ""
                          ).toLowerCase()}`}
                        >
                          {formatStatus(
                            appointment.status
                          )}
                        </span>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ========================================
          CLINICAL OVERVIEW
      ======================================== */}

      <section className="dashboard-section">

        <div className="section-header">

          <div>
            <h2>
              Clinical Overview
            </h2>

            <p>
              Summary of your clinical activities
            </p>
          </div>

        </div>

        <div className="overview-grid">

          <div className="overview-card">

            <div className="overview-icon">
              📋
            </div>

            <h3>
              Medical Records
            </h3>

            <strong>
              {medicalRecords.length}
            </strong>

            <p>
              Records available for your patients
            </p>

          </div>

          <div className="overview-card">

            <div className="overview-icon">
              💊
            </div>

            <h3>
              Prescriptions
            </h3>

            <strong>
              {prescriptions.length}
            </strong>

            <p>
              Prescriptions issued
            </p>

          </div>

          <div className="overview-card">

            <div className="overview-icon">
              🧪
            </div>

            <h3>
              Completed Lab Tests
            </h3>

            <strong>
              {completedLabTests}
            </strong>

            <p>
              Laboratory tests completed
            </p>

          </div>

          <div className="overview-card">

            <div className="overview-icon">
              🏥
            </div>

            <h3>
              Admissions
            </h3>

            <strong>
              {admissions.length}
            </strong>

            <p>
              Total admissions assigned to you
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}

export default DoctorDashboard;