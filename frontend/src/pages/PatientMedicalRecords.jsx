import { useEffect, useState } from "react";
import api from "../services/api";

function PatientMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // SEARCH / FILTER STATES
  // ==========================================

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ==========================================
  // SHOW / HIDE FILTERS
  // ==========================================

  const [showFilters, setShowFilters] = useState(false);

  // ==========================================
  // FETCH MEDICAL RECORDS
  // ==========================================

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await api.get(
          "medical-records/"
        );

        const sortedRecords = [
          ...response.data,
        ].sort(
          (a, b) => b.id - a.id
        );

        setRecords(sortedRecords);
        setFilteredRecords(
          sortedRecords
        );
      } catch (err) {
        console.error(
          "Medical records error:",
          err
        );

        setError(
          "Unable to load medical records."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  // ==========================================
  // SEARCH / FILTER MEDICAL RECORDS
  // ==========================================

  useEffect(() => {
    const searchValue =
      searchTerm.trim().toLowerCase();

    const results = records.filter(
      (record) => {
        // --------------------------------------
        // Medical Record ID
        // --------------------------------------

        const medicalRecordId =
          record.medical_record_id
            ?.toLowerCase() || "";

        // --------------------------------------
        // Doctor ID
        // --------------------------------------

        const doctorId =
          record.doctor_id
            ?.toLowerCase() || "";

        // --------------------------------------
        // Doctor Name
        // --------------------------------------

        const doctorName =
          record.doctor_name
            ?.toLowerCase() || "";

        // --------------------------------------
        // Symptoms
        // --------------------------------------

        const symptoms =
          record.symptoms
            ?.toLowerCase() || "";

        // --------------------------------------
        // Diagnosis
        // --------------------------------------

        const diagnosis =
          record.diagnosis
            ?.toLowerCase() || "";

        // --------------------------------------
        // Treatment
        // --------------------------------------

        const treatment =
          record.treatment
            ?.toLowerCase() || "";

        // --------------------------------------
        // Search matching
        // --------------------------------------

        const matchesSearch =
          !searchValue ||
          medicalRecordId.includes(
            searchValue
          ) ||
          doctorId.includes(
            searchValue
          ) ||
          doctorName.includes(
            searchValue
          ) ||
          symptoms.includes(
            searchValue
          ) ||
          diagnosis.includes(
            searchValue
          ) ||
          treatment.includes(
            searchValue
          );

        // --------------------------------------
        // From Date
        // --------------------------------------

        const matchesFromDate =
          !fromDate ||
          record.appointment_date >=
            fromDate;

        // --------------------------------------
        // To Date
        // --------------------------------------

        const matchesToDate =
          !toDate ||
          record.appointment_date <=
            toDate;

        return (
          matchesSearch &&
          matchesFromDate &&
          matchesToDate
        );
      }
    );

    setFilteredRecords(results);
  }, [
    records,
    searchTerm,
    fromDate,
    toDate,
  ]);

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const handleClearFilters = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="patient-medical-records-loading">
        <div className="patient-medical-records-spinner"></div>
        <p>
          Loading medical records...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="patient-medical-records-error">
        <h2>
          Unable to Load Records
        </h2>
        <p>{error}</p>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="patient-medical-records-page">

      {/* ======================================
          HEADER
          ====================================== */}

      <div className="patient-medical-records-header">

        <div>

          <span className="patient-medical-records-eyebrow">
            MEDICAL HISTORY
          </span>

          <h1>
            My Medical Records
          </h1>

          <p>
            View your medical history and
            clinical records.
          </p>

        </div>

        <div className="patient-medical-records-total-card">

          <span>
            Total Records
          </span>

          <strong>
            {records.length}
          </strong>

        </div>

      </div>

      {/* ======================================
          SEARCH / FILTER TOGGLE
          ====================================== */}

      <div className="patient-medical-records-filter-toggle">

        <button
          type="button"
          className="patient-medical-records-filter-button"
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
            ? "Filter your medical records"
            : `${filteredRecords.length} record${
                filteredRecords.length !==
                1
                  ? "s"
                  : ""
              } available`}
        </span>

      </div>

      {/* ======================================
          SEARCH / FILTER SECTION
          ====================================== */}

      {showFilters && (
        <div className="patient-medical-records-filter-card">

          <div className="patient-medical-records-section-title">

            <div>
              <h2>
                Search & Filter Medical Records
              </h2>

              <p>
                Find records by doctor,
                diagnosis, treatment or date.
              </p>
            </div>

          </div>

          <div className="patient-medical-records-filter-grid">

            {/* Search */}

            <div className="patient-medical-records-filter-field">

              <label>
                Search Medical Records
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Record ID, Doctor, Symptoms, Diagnosis or Treatment"
              />

            </div>

            {/* From Date */}

            <div className="patient-medical-records-filter-field">

              <label>
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(
                    e.target.value
                  )
                }
              />

            </div>

            {/* To Date */}

            <div className="patient-medical-records-filter-field">

              <label>
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                min={
                  fromDate ||
                  undefined
                }
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="patient-medical-records-filter-actions">

            <button
              type="button"
              className="patient-medical-records-clear-button"
              onClick={
                handleClearFilters
              }
            >
              Clear Filters
            </button>

            <span className="patient-medical-records-result-count">
              Showing{" "}
              <strong>
                {
                  filteredRecords.length
                }
              </strong>{" "}
              of{" "}
              <strong>
                {records.length}
              </strong>{" "}
              medical records
            </span>

          </div>

        </div>
      )}

      {/* ======================================
          MEDICAL RECORDS TABLE
          ====================================== */}

      {filteredRecords.length ===
      0 ? (
        <div className="patient-medical-records-empty-state">

          <div className="patient-medical-records-empty-icon">
            +
          </div>

          <h3>
            No Medical Records Found
          </h3>

          <p>
            {searchTerm ||
            fromDate ||
            toDate
              ? "No medical records match the selected search or date range."
              : "No medical records are currently available."}
          </p>

        </div>
      ) : (
        <div className="patient-medical-records-table-card">

          <div className="patient-medical-records-table-header">

            <div>

              <h2>
                Medical History
              </h2>

              <p>
                Your clinical records and
                treatment history.
              </p>

            </div>

            <span>
              {filteredRecords.length}{" "}
              Records
            </span>

          </div>

          <div className="patient-medical-records-table-wrapper">

            <table className="patient-medical-records-table">

              <thead>

                <tr>

                  <th>
                    Medical Record ID
                  </th>

                  <th>
                    Patient
                  </th>

                  <th>
                    Doctor
                  </th>

                  <th>
                    Appointment Date
                  </th>

                  <th>
                    Appointment Time
                  </th>

                  <th>
                    Symptoms
                  </th>

                  <th>
                    Diagnosis
                  </th>

                  <th>
                    Treatment
                  </th>

                  <th>
                    Notes
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredRecords.map(
                  (record) => (
                    <tr
                      key={record.id}
                    >

                      {/* Medical Record ID */}

                      <td>

                        <span className="patient-medical-record-id">
                          {record.medical_record_id ||
                            "-"}
                        </span>

                      </td>

                      {/* Patient */}

                      <td>

                        <strong>
                          {record.patient_id ||
                            "-"}
                        </strong>

                        <br />

                        <span className="patient-medical-record-secondary-text">
                          {record.patient_name ||
                            "-"}
                        </span>

                      </td>

                      {/* Doctor */}

                      <td>

                        <strong>
                          {record.doctor_id ||
                            "-"}
                        </strong>

                        <br />

                        <span className="patient-medical-record-secondary-text">
                          {record.doctor_name ||
                            "-"}
                        </span>

                      </td>

                      {/* Appointment Date */}

                      <td>
                        {
                          record.appointment_date ||
                          "-"
                        }
                      </td>

                      {/* Appointment Time */}

                      <td>
                        {
                          record.appointment_time ||
                          "-"
                        }
                      </td>

                      {/* Symptoms */}

                      <td>
                        {record.symptoms ||
                          "-"}
                      </td>

                      {/* Diagnosis */}

                      <td>
                        <span className="patient-medical-record-diagnosis">
                          {record.diagnosis ||
                            "-"}
                        </span>
                      </td>

                      {/* Treatment */}

                      <td>
                        {record.treatment ||
                          "-"}
                      </td>

                      {/* Notes */}

                      <td>
                        {record.notes ||
                          "-"}
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

export default PatientMedicalRecords;