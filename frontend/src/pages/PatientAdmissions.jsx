import { useEffect, useState } from "react";
import api from "../services/api";

function PatientAdmissions() {
  const [admissions, setAdmissions] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] =
    useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [fromAdmissionDate, setFromAdmissionDate] =
    useState("");

  const [toAdmissionDate, setToAdmissionDate] =
    useState("");

  const [fromDischargeDate, setFromDischargeDate] =
    useState("");

  const [toDischargeDate, setToDischargeDate] =
    useState("");

  const [showFilters, setShowFilters] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH ADMISSIONS
  // ==========================================

  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const response = await api.get(
          "admissions/"
        );

        const data = Array.isArray(
          response.data
        )
          ? response.data
          : response.data.results || [];

        // Latest admissions first
        const sortedAdmissions = [
          ...data,
        ].sort(
          (a, b) => b.id - a.id
        );

        setAdmissions(
          sortedAdmissions
        );

        setFilteredAdmissions(
          sortedAdmissions
        );
      } catch (err) {
        console.error(
          "Admissions error:",
          err
        );

        setError(
          "Unable to load admission information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAdmissions();
  }, []);

  // ==========================================
  // SEARCH / FILTER ADMISSIONS
  // ==========================================

  useEffect(() => {
    const searchValue =
      searchTerm
        .trim()
        .toLowerCase();

    const results =
      admissions.filter(
        (admission) => {

          // ------------------------------------
          // Admission ID
          // ------------------------------------

          const admissionId =
            String(
              admission.admission_id ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Patient ID
          // ------------------------------------

          const patientId =
            String(
              admission.patient_id ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Patient Name
          // ------------------------------------

          const patientName =
            String(
              admission.patient_name ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Doctor ID
          // ------------------------------------

          const doctorId =
            String(
              admission.doctor_id ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Doctor Name
          // ------------------------------------

          const doctorName =
            String(
              admission.doctor_name ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Department
          // ------------------------------------

          const departmentName =
            String(
              admission.department_name ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Room
          // ------------------------------------

          const roomNumber =
            String(
              admission.room_number ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Bed
          // ------------------------------------

          const bedNumber =
            String(
              admission.bed_number ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Reason
          // ------------------------------------

          const reason =
            String(
              admission.reason ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Notes
          // ------------------------------------

          const notes =
            String(
              admission.notes ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Status
          // ------------------------------------

          const status =
            String(
              admission.status ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // SEARCH MATCH
          // ------------------------------------

          const matchesSearch =
            !searchValue ||
            admissionId.includes(
              searchValue
            ) ||
            patientId.includes(
              searchValue
            ) ||
            patientName.includes(
              searchValue
            ) ||
            doctorId.includes(
              searchValue
            ) ||
            doctorName.includes(
              searchValue
            ) ||
            departmentName.includes(
              searchValue
            ) ||
            roomNumber.includes(
              searchValue
            ) ||
            bedNumber.includes(
              searchValue
            ) ||
            reason.includes(
              searchValue
            ) ||
            notes.includes(
              searchValue
            ) ||
            status.includes(
              searchValue
            );

          // ------------------------------------
          // STATUS FILTER
          // ------------------------------------

          const matchesStatus =
            !statusFilter ||
            status ===
              statusFilter.toLowerCase();

          // ------------------------------------
          // ADMISSION DATE
          // ------------------------------------

          const admissionDate =
            admission.admission_date ||
            "";

          const matchesFromAdmissionDate =
            !fromAdmissionDate ||
            admissionDate >=
              fromAdmissionDate;

          const matchesToAdmissionDate =
            !toAdmissionDate ||
            admissionDate <=
              toAdmissionDate;

          // ------------------------------------
          // DISCHARGE DATE
          // ------------------------------------

          const dischargeDate =
            admission.discharge_date ||
            "";

          const matchesFromDischargeDate =
            !fromDischargeDate ||
            (
              dischargeDate &&
              dischargeDate >=
                fromDischargeDate
            );

          const matchesToDischargeDate =
            !toDischargeDate ||
            (
              dischargeDate &&
              dischargeDate <=
                toDischargeDate
            );

          return (
            matchesSearch &&
            matchesStatus &&
            matchesFromAdmissionDate &&
            matchesToAdmissionDate &&
            matchesFromDischargeDate &&
            matchesToDischargeDate
          );
        }
      );

    // Latest admissions first
    results.sort(
      (a, b) => b.id - a.id
    );

    setFilteredAdmissions(
      results
    );
  }, [
    admissions,
    searchTerm,
    statusFilter,
    fromAdmissionDate,
    toAdmissionDate,
    fromDischargeDate,
    toDischargeDate,
  ]);

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");

    setFromAdmissionDate("");
    setToAdmissionDate("");

    setFromDischargeDate("");
    setToDischargeDate("");
  };

  // ==========================================
  // STATUS OPTIONS
  // ==========================================

  const statusOptions = [
    ...new Set(
      admissions
        .map(
          (admission) =>
            admission.status
        )
        .filter(Boolean)
    ),
  ];

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="patient-admissions-loading">

        <div className="patient-admissions-spinner"></div>

        <p>
          Loading admissions...
        </p>

      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="patient-admissions-error">

        <h2>
          Unable to Load Admissions
        </h2>

        <p>
          {error}
        </p>

      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="patient-admissions-page">

      {/* ======================================
          HEADER
          ====================================== */}

      <div className="patient-admissions-header">

        <div>

          <span className="patient-admissions-eyebrow">
            INPATIENT CARE
          </span>

          <h1>
            My Admissions
          </h1>

          <p>
            View your hospital admission
            history.
          </p>

        </div>

        <div className="patient-admissions-total-card">

          <span>
            Total Admissions
          </span>

          <strong>
            {admissions.length}
          </strong>

        </div>

      </div>

      {/* ======================================
          FILTER TOGGLE
          ====================================== */}

      <div className="patient-admissions-filter-toggle">

        <button
          type="button"
          className="patient-admissions-filter-button"
          onClick={() =>
            setShowFilters(
              !showFilters
            )
          }
        >
          {showFilters
            ? "✕ Hide Search & Filters"
            : "☰ Search & Filter"}
        </button>

        <span>
          {showFilters
            ? "Search and filter your admission records"
            : `${filteredAdmissions.length} admission${
                filteredAdmissions.length !==
                1
                  ? "s"
                  : ""
              } available`}
        </span>

      </div>

      {/* ======================================
          SEARCH / FILTER CARD
          ====================================== */}

      {showFilters && (
        <div className="patient-admissions-filter-card">

          <div className="patient-admissions-section-title">

            <h2>
              Search & Filter Admissions
            </h2>

            <p>
              Find admissions by patient,
              doctor, room, status or dates.
            </p>

          </div>

          <div className="patient-admissions-filter-grid">

            {/* Search */}

            <div className="patient-admissions-filter-field">

              <label>
                Search Admissions
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Admission ID, Patient, Doctor, Department, Room, Bed, Reason or Notes"
              />

            </div>

            {/* Status */}

            <div className="patient-admissions-filter-field">

              <label>
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Statuses
                </option>

                {statusOptions.map(
                  (status) => (

                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>

                  )
                )}

              </select>

            </div>

            {/* From Admission Date */}

            <div className="patient-admissions-filter-field">

              <label>
                From Admission Date
              </label>

              <input
                type="date"
                value={
                  fromAdmissionDate
                }
                onChange={(e) =>
                  setFromAdmissionDate(
                    e.target.value
                  )
                }
              />

            </div>

            {/* To Admission Date */}

            <div className="patient-admissions-filter-field">

              <label>
                To Admission Date
              </label>

              <input
                type="date"
                value={
                  toAdmissionDate
                }
                min={
                  fromAdmissionDate ||
                  undefined
                }
                onChange={(e) =>
                  setToAdmissionDate(
                    e.target.value
                  )
                }
              />

            </div>

            {/* From Discharge Date */}

            <div className="patient-admissions-filter-field">

              <label>
                From Discharge Date
              </label>

              <input
                type="date"
                value={
                  fromDischargeDate
                }
                onChange={(e) =>
                  setFromDischargeDate(
                    e.target.value
                  )
                }
              />

            </div>

            {/* To Discharge Date */}

            <div className="patient-admissions-filter-field">

              <label>
                To Discharge Date
              </label>

              <input
                type="date"
                value={
                  toDischargeDate
                }
                min={
                  fromDischargeDate ||
                  undefined
                }
                onChange={(e) =>
                  setToDischargeDate(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="patient-admissions-filter-actions">

            <button
              type="button"
              className="patient-admissions-clear-button"
              onClick={
                handleClearFilters
              }
            >
              Clear Filters
            </button>

            <span className="patient-admissions-result-count">

              Showing{" "}

              <strong>
                {
                  filteredAdmissions.length
                }
              </strong>

              {" "}of{" "}

              <strong>
                {admissions.length}
              </strong>

              {" "}admissions

            </span>

          </div>

        </div>
      )}

      {/* ======================================
          ADMISSIONS
          ====================================== */}

      {filteredAdmissions.length ===
      0 ? (

        <div className="patient-admissions-empty-state">

          <div className="patient-admissions-empty-icon">
            IP
          </div>

          <h3>
            No Admissions Found
          </h3>

          <p>
            {admissions.length ===
            0
              ? "You currently have no hospital admission records."
              : "No admissions match the selected search or filters."}
          </p>

        </div>

      ) : (

        <div className="patient-admissions-table-card">

          <div className="patient-admissions-table-header">

            <div>

              <h2>
                Admission History
              </h2>

              <p>
                Your hospital inpatient
                admission records.
              </p>

            </div>

            <span>
              {
                filteredAdmissions.length
              } Records
            </span>

          </div>

          <div className="patient-admissions-table-wrapper">

            <table className="patient-admissions-table">

              <thead>

                <tr>

                  <th>
                    Admission ID
                  </th>

                  <th>
                    Patient
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
                    Bed
                  </th>

                  <th>
                    Admission Date
                  </th>

                  <th>
                    Discharge Date
                  </th>

                  <th>
                    Reason
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Notes
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredAdmissions.map(
                  (admission) => (

                    <tr
                      key={
                        admission.id
                      }
                    >

                      {/* Admission ID */}

                      <td>

                        <span className="patient-admission-id">
                          {
                            admission.admission_id ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Patient */}

                      <td>

                        <strong>
                          {
                            admission.patient_id ||
                            "-"
                          }
                        </strong>

                        <br />

                        <span className="patient-admissions-secondary-text">
                          {
                            admission.patient_name ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Doctor */}

                      <td>

                        <strong>
                          {
                            admission.doctor_id ||
                            "-"
                          }
                        </strong>

                        <br />

                        <span className="patient-admissions-secondary-text">
                          {
                            admission.doctor_name ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Department */}

                      <td>
                        {
                          admission.department_name ||
                          "-"
                        }
                      </td>

                      {/* Room */}

                      <td>

                        <span className="patient-admissions-location-badge">
                          {
                            admission.room_number ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Bed */}

                      <td>

                        <span className="patient-admissions-location-badge">
                          {
                            admission.bed_number ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Admission Date */}

                      <td>
                        {
                          admission.admission_date ||
                          "-"
                        }
                      </td>

                      {/* Discharge Date */}

                      <td>
                        {
                          admission.discharge_date ||
                          "-"
                        }
                      </td>

                      {/* Reason */}

                      <td>
                        {
                          admission.reason ||
                          "-"
                        }
                      </td>

                      {/* Status */}

                      <td>

                        <span
                          className={`patient-admissions-status-badge patient-admissions-status-${admission.status?.toLowerCase()}`}
                        >
                          {
                            admission.status ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Notes */}

                      <td>
                        {
                          admission.notes ||
                          "-"
                        }
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
}

export default PatientAdmissions;