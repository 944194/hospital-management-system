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

function PatientDashboard() {
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

        setAppointments(appointmentsResponse.data);
        setMedicalRecords(medicalRecordsResponse.data);
        setPrescriptions(prescriptionsResponse.data);
        setLabTests(labTestsResponse.data);
        setLabResults(labResultsResponse.data);
        setAdmissions(admissionsResponse.data);
      } catch (err) {
        console.error("Patient dashboard error:", err);
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
      <div className="patient-dashboard-page">
        <div className="patient-dashboard-loading">
          <div className="patient-loading-spinner"></div>

          <h2>Loading your dashboard...</h2>

          <p>
            Please wait while we load your healthcare information.
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
      <div className="patient-dashboard-page">
        <div className="patient-dashboard-error">
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // SORT APPOINTMENTS
  // ==========================================

  const sortedAppointments = [...appointments].sort(
    (a, b) => b.id - a.id
  );

  // ==========================================
  // APPOINTMENT COUNTS
  // ==========================================

  const scheduledAppointments = appointments.filter(
    (appointment) => appointment.status === "SCHEDULED"
  ).length;

  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status === "CONFIRMED"
  ).length;

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "COMPLETED"
  ).length;

  const cancelledAppointments = appointments.filter(
    (appointment) => appointment.status === "CANCELLED"
  ).length;

  const noShowAppointments = appointments.filter(
    (appointment) => appointment.status === "NO_SHOW"
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
    (test) => test.status === "REQUESTED"
  ).length;

  const inProgressLabTests = labTests.filter(
    (test) => test.status === "IN_PROGRESS"
  ).length;

  const completedLabTests = labTests.filter(
    (test) => test.status === "COMPLETED"
  ).length;

  const cancelledLabTests = labTests.filter(
    (test) => test.status === "CANCELLED"
  ).length;

  // ==========================================
  // UPCOMING APPOINTMENTS
  // ==========================================

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = sortedAppointments
    .filter((appointment) => {
      if (
        appointment.status === "CANCELLED" ||
        appointment.status === "COMPLETED" ||
        appointment.status === "NO_SHOW"
      ) {
        return false;
      }

      if (!appointment.appointment_date) {
        return false;
      }

      const appointmentDate = new Date(
        `${appointment.appointment_date}T00:00:00`
      );

      return appointmentDate >= today;
    })
    .sort((a, b) => {
      const dateA = new Date(
        `${a.appointment_date}T${a.appointment_time || "00:00"}`
      );

      const dateB = new Date(
        `${b.appointment_date}T${b.appointment_time || "00:00"}`
      );

      return dateA - dateB;
    });

  const nextAppointment =
    upcomingAppointments[0] || null;

  // ==========================================
  // RECENT APPOINTMENTS
  // ==========================================

  const recentAppointments =
    sortedAppointments.slice(0, 5);

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
  ].filter((item) => item.value > 0);

  // ==========================================
  // APPOINTMENT PIE COLORS
  // ==========================================

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

  const labRemaining =
    Math.max(
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

  // ==========================================
  // HEALTHCARE BAR CHART
  // ==========================================

  const healthcareData = [
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
  // APPOINTMENT ACTIVITY
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
    <div className="patient-dashboard-page">

      {/* ========================================
          HERO SECTION
      ======================================== */}

      <section className="patient-dashboard-hero">

        <div className="patient-dashboard-hero-content">

          <div>

            <div className="patient-dashboard-small-title">
              PATIENT PORTAL
            </div>

            <h1>
              Welcome back! 👋
            </h1>

            <p>
              Take control of your healthcare journey.
              Here's your health overview.
            </p>

          </div>

          <div className="patient-hero-medical-icon">
            🏥
          </div>

        </div>

        <div className="patient-hero-decoration hero-decoration-one"></div>

        <div className="patient-hero-decoration hero-decoration-two"></div>

      </section>

      {/* ========================================
          STATISTICS
      ======================================== */}

      <section className="patient-dashboard-stat-grid">

        <div
  className="patient-dashboard-stat-card patient-dashboard-clickable-card"
  onClick={() => navigate("/patient/appointments")}
>

          <div className="patient-stat-circle patient-stat-blue">
            📅
          </div>

          <div>
            <span>Appointments</span>

            <h2>
              {appointments.length}
            </h2>

            <small>
              {upcomingAppointments.length} upcoming
            </small>
          </div>

        </div>

        <div
  className="patient-dashboard-stat-card patient-dashboard-clickable-card"
  onClick={() => navigate("/patient/medical-records")}
>

          <div className="patient-stat-circle patient-stat-green">
            📋
          </div>

          <div>
            <span>Medical Records</span>

            <h2>
              {medicalRecords.length}
            </h2>

            <small>
              Records available
            </small>
          </div>

        </div>

        <div
  className="patient-dashboard-stat-card patient-dashboard-clickable-card"
  onClick={() => navigate("/patient/prescriptions")}
>

          <div className="patient-stat-circle patient-stat-purple">
            💊
          </div>

          <div>
            <span>Prescriptions</span>

            <h2>
              {prescriptions.length}
            </h2>

            <small>
              Prescriptions received
            </small>
          </div>

        </div>

        <div
  className="patient-dashboard-stat-card patient-dashboard-clickable-card"
  onClick={() => navigate("/patient/laboratory")}
>

          <div className="patient-stat-circle patient-stat-orange">
            🧪
          </div>

          <div>
            <span>Lab Tests</span>

            <h2>
              {labTests.length}
            </h2>

            <small>
              {completedLabTests} completed
            </small>
          </div>

        </div>

      </section>

      {/* ========================================
          MAIN ANALYTICS ROW
      ======================================== */}

      <section className="patient-dashboard-chart-grid">

        {/* APPOINTMENT PIE */}

        <div className="patient-dashboard-chart-card">

          <div className="patient-chart-header">

            <div>

              <h2>
                Appointment Overview
              </h2>

              <p>
                Your appointment status
              </p>

            </div>

            <span className="patient-chart-icon">
              📊
            </span>

          </div>

          {appointmentChartData.length > 0 ? (

            <div className="patient-pie-chart">

              <ResponsiveContainer
                width="100%"
                height={280}
              >

                <PieChart>

                  <Pie
                    data={appointmentChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >

                    {appointmentChartData.map(
                      (entry, index) => (
                        <Cell
                          key={`appointment-cell-${index}`}
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

            <div className="patient-chart-empty">
              No appointment data available.
            </div>

          )}

        </div>

        {/* LAB SEMI CIRCLE */}

        <div className="patient-dashboard-chart-card">

          <div className="patient-chart-header">

            <div>

              <h2>
                Laboratory Progress
              </h2>

              <p>
                Completed laboratory tests
              </p>

            </div>

            <span className="patient-chart-icon">
              🧪
            </span>

          </div>

          <div className="patient-semicircle-wrapper">

            <ResponsiveContainer
              width="100%"
              height={230}
            >

              <PieChart>

                <Pie
                  data={labCompletionData}
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  cx="50%"
                  cy="90%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={2}
                >

                  {labCompletionData.map(
                    (entry, index) => (
                      <Cell
                        key={`lab-cell-${index}`}
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

            <div className="patient-semicircle-value">

              <strong>
                {labTests.length > 0
                  ? Math.round(
                      (completedLabTests /
                        labTests.length) *
                        100
                    )
                  : 0}
                %
              </strong>

              <span>
                Completed
              </span>

            </div>

          </div>

          <div className="patient-lab-summary">

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
          BAR + LINE GRAPH
      ======================================== */}

      <section className="patient-dashboard-chart-grid">

        {/* BAR CHART */}

        <div className="patient-dashboard-chart-card">

          <div className="patient-chart-header">

            <div>

              <h2>
                Healthcare Activity
              </h2>

              <p>
                Overview of your healthcare records
              </p>

            </div>

            <span className="patient-chart-icon">
              📊
            </span>

          </div>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <BarChart
              data={healthcareData}
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

        {/* LINE GRAPH */}

        <div className="patient-dashboard-chart-card">

          <div className="patient-chart-header">

            <div>

              <h2>
                Appointment Activity
              </h2>

              <p>
                Appointment status distribution
              </p>

            </div>

            <span className="patient-chart-icon">
              📈
            </span>

          </div>

          <ResponsiveContainer
            width="100%"
            height={300}
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
          NEXT APPOINTMENT + ADMISSION
      ======================================== */}

      <section className="patient-dashboard-info-grid">

        {/* NEXT APPOINTMENT */}

        <div className="patient-dashboard-info-card">

          <div className="patient-info-card-header">

            <div>

              <h2>
                Next Appointment
              </h2>

              <p>
                Your upcoming consultation
              </p>

            </div>

            <span>
              📅
            </span>

          </div>

          {nextAppointment ? (

            <div className="next-patient-appointment">

              <div className="next-appointment-calendar">

                <span>
                  {new Date(
                    `${nextAppointment.appointment_date}T00:00:00`
                  ).toLocaleDateString("en-US", {
                    month: "short",
                  })}
                </span>

                <strong>
                  {new Date(
                    `${nextAppointment.appointment_date}T00:00:00`
                  ).getDate()}
                </strong>

                <small>
                  {new Date(
                    `${nextAppointment.appointment_date}T00:00:00`
                  ).toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                </small>

              </div>

              <div className="next-appointment-information">

                <h3>
                  {nextAppointment.doctor_name || "-"}
                </h3>

                <p>
                  {nextAppointment.doctor_id || "-"}
                </p>

                <div>
                  🏥{" "}
                  {nextAppointment.department_name || "-"}
                </div>

                <div>
                  🚪 Room{" "}
                  {nextAppointment.consultation_room_number || "-"}
                </div>

                <div>
                  🕐{" "}
                  {nextAppointment.appointment_time || "-"}
                </div>

              </div>

              <span
                className={`status-badge status-${nextAppointment.status?.toLowerCase()}`}
              >
                {formatStatus(
                  nextAppointment.status
                )}
              </span>

            </div>

          ) : (

            <div className="patient-empty-state">

              <span>
                📅
              </span>

              <h3>
                No upcoming appointments
              </h3>

              <p>
                You currently have no upcoming appointments.
              </p>

            </div>

          )}

        </div>

        {/* ADMISSION */}

        <div className="patient-dashboard-info-card">

          <div className="patient-info-card-header">

            <div>

              <h2>
                Admission Status
              </h2>

              <p>
                Your hospital admission information
              </p>

            </div>

            <span>
              🏥
            </span>

          </div>

          {activeAdmissions > 0 ? (

            <div className="patient-active-admission">

              <div className="admission-status-icon">
                🏥
              </div>

              <div>

                <h3>
                  Currently Admitted
                </h3>

                <p>
                  You currently have{" "}
                  <strong>
                    {activeAdmissions}
                  </strong>{" "}
                  active admission
                  {activeAdmissions > 1 ? "s" : ""}.
                </p>

              </div>

            </div>

          ) : (

            <div className="patient-empty-state">

              <span>
                ✓
              </span>

              <h3>
                No active admission
              </h3>

              <p>
                You are not currently admitted.
              </p>

            </div>

          )}

        </div>

      </section>

      {/* ========================================
          RECENT APPOINTMENTS
      ======================================== */}

      <section className="patient-dashboard-table-card">

        <div className="patient-info-card-header">

          <div>

            <h2>
              Recent Appointments
            </h2>

            <p>
              Your latest appointment activity
            </p>

          </div>

          <span className="patient-table-count">
            {appointments.length} total
          </span>

        </div>

        <div className="patient-dashboard-table-wrapper">

          <table className="patient-dashboard-table">

            <thead>

              <tr>

                <th>
                  Appointment
                </th>

                <th>
                  Doctor
                </th>

                <th>
                  Department
                </th>

                <th>
                  Room
                </th>

                <th>
                  Date
                </th>

                <th>
                  Time
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {recentAppointments.length > 0 ? (

                recentAppointments.map(
                  (appointment) => (

                    <tr
                      key={appointment.id}
                    >

                      <td>
                        <strong>
                          {appointment.appointment_id || "-"}
                        </strong>
                      </td>

                      <td>

                        <strong>
                          {appointment.doctor_id || "-"}
                        </strong>

                        <br />

                        <span>
                          {appointment.doctor_name || "-"}
                        </span>

                      </td>

                      <td>
                        {appointment.department_name || "-"}
                      </td>

                      <td>

                        <span className="patient-room-badge">
                          {appointment.consultation_room_number || "-"}
                        </span>

                      </td>

                      <td>
                        {formatAppointmentDate(
                          appointment.appointment_date
                        )}
                      </td>

                      <td>
                        {appointment.appointment_time || "-"}
                      </td>

                      <td>

                        <span
                          className={`status-badge status-${appointment.status?.toLowerCase()}`}
                        >
                          {formatStatus(
                            appointment.status
                          )}
                        </span>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="7"
                    className="patient-table-empty"
                  >
                    No appointments found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default PatientDashboard;