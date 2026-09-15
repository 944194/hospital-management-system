import { useEffect, useState } from "react";
import api from "../services/api";

function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH PRESCRIPTIONS
  // ==========================================

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await api.get(
          "prescriptions/"
        );

        const sortedPrescriptions = [
          ...response.data,
        ].sort(
          (a, b) => b.id - a.id
        );

        setPrescriptions(
          sortedPrescriptions
        );

        setFilteredPrescriptions(
          sortedPrescriptions
        );
      } catch (err) {
        console.error(
          "Prescriptions error:",
          err
        );

        setError(
          "Unable to load prescriptions."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  // ==========================================
  // SEARCH / DATE FILTERING
  // ==========================================

  useEffect(() => {
    const search =
      searchTerm
        .trim()
        .toLowerCase();

    const filtered =
      prescriptions.filter(
        (prescription) => {

          // ------------------------------------
          // Prescription ID
          // ------------------------------------

          const prescriptionId =
            String(
              prescription.prescription_id ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Appointment ID
          // ------------------------------------

          const appointmentId =
            String(
              prescription.appointment_id ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Medical Record ID
          // ------------------------------------

          const medicalRecordId =
            String(
              prescription.medical_record_id ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Doctor ID
          // ------------------------------------

          const doctorId =
            String(
              prescription.doctor_id ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Doctor Name
          // ------------------------------------

          const doctorName =
            String(
              prescription.doctor_name ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Medicine
          // ------------------------------------

          const medicineName =
            String(
              prescription.medicine_name ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Dosage
          // ------------------------------------

          const dosage =
            String(
              prescription.dosage ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Frequency
          // ------------------------------------

          const frequency =
            String(
              prescription.frequency ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Duration
          // ------------------------------------

          const duration =
            String(
              prescription.duration ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Instructions
          // ------------------------------------

          const instructions =
            String(
              prescription.instructions ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Search matching
          // ------------------------------------

          const matchesSearch =
            !search ||
            prescriptionId.includes(
              search
            ) ||
            appointmentId.includes(
              search
            ) ||
            medicalRecordId.includes(
              search
            ) ||
            doctorId.includes(
              search
            ) ||
            doctorName.includes(
              search
            ) ||
            medicineName.includes(
              search
            ) ||
            dosage.includes(
              search
            ) ||
            frequency.includes(
              search
            ) ||
            duration.includes(
              search
            ) ||
            instructions.includes(
              search
            );

          // ------------------------------------
          // Prescription date
          // ------------------------------------

          const prescriptionDate =
            prescription.created_at
              ? new Date(
                  prescription.created_at
                )
                  .toISOString()
                  .split("T")[0]
              : "";

          // ------------------------------------
          // From date
          // ------------------------------------

          const matchesFromDate =
            !fromDate ||
            prescriptionDate >=
              fromDate;

          // ------------------------------------
          // To date
          // ------------------------------------

          const matchesToDate =
            !toDate ||
            prescriptionDate <=
              toDate;

          return (
            matchesSearch &&
            matchesFromDate &&
            matchesToDate
          );
        }
      );

    setFilteredPrescriptions(
      filtered
    );
  }, [
    searchTerm,
    fromDate,
    toDate,
    prescriptions,
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
      <div className="patient-prescriptions-loading">
        <div className="patient-prescriptions-spinner"></div>

        <p>
          Loading prescriptions...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="patient-prescriptions-error">
        <h2>
          Unable to Load Prescriptions
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
    <div className="patient-prescriptions-page">

      {/* ======================================
          HEADER
          ====================================== */}

      <div className="patient-prescriptions-header">

        <div>

          <span className="patient-prescriptions-eyebrow">
            MEDICATIONS
          </span>

          <h1>
            My Prescriptions
          </h1>

          <p>
            View medicines prescribed by
            your doctors.
          </p>

        </div>

        <div className="patient-prescriptions-total-card">

          <span>
            Total Prescriptions
          </span>

          <strong>
            {prescriptions.length}
          </strong>

        </div>

      </div>

      {/* ======================================
          SEARCH / FILTER TOGGLE
          ====================================== */}

      <div className="patient-prescriptions-filter-toggle">

        <button
          type="button"
          className="patient-prescriptions-filter-button"
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
            ? "Filter your prescriptions"
            : `${filteredPrescriptions.length} prescription${
                filteredPrescriptions.length !==
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
        <div className="patient-prescriptions-filter-card">

          <div className="patient-prescriptions-section-title">

            <h2>
              Search & Filter Prescriptions
            </h2>

            <p>
              Find prescriptions by medicine,
              doctor, prescription ID or date.
            </p>

          </div>

          <div className="patient-prescriptions-filter-grid">

            {/* Search */}

            <div className="patient-prescriptions-filter-field">

              <label>
                Search Prescriptions
              </label>

              <input
                type="text"
                placeholder="Prescription ID, Appointment ID, Medical Record ID, Doctor, Medicine, Dosage, Frequency or Duration"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
              />

            </div>

            {/* From Date */}

            <div className="patient-prescriptions-filter-field">

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

            <div className="patient-prescriptions-filter-field">

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

          <div className="patient-prescriptions-filter-actions">

            <button
              type="button"
              className="patient-prescriptions-clear-button"
              onClick={
                handleClearFilters
              }
            >
              Clear Filters
            </button>

            <span className="patient-prescriptions-result-count">

              Showing{" "}

              <strong>
                {
                  filteredPrescriptions.length
                }
              </strong>

              {" "}of{" "}

              <strong>
                {prescriptions.length}
              </strong>

              {" "}prescriptions

            </span>

          </div>

        </div>
      )}

      {/* ======================================
          PRESCRIPTIONS TABLE
          ====================================== */}

      {filteredPrescriptions.length ===
      0 ? (

        <div className="patient-prescriptions-empty-state">

          <div className="patient-prescriptions-empty-icon">
            Rx
          </div>

          <h3>
            {prescriptions.length ===
            0
              ? "No Prescriptions"
              : "No Matching Prescriptions"}
          </h3>

          <p>
            {prescriptions.length ===
            0
              ? "No prescriptions are currently available."
              : "No prescriptions match your search or date filters."}
          </p>

        </div>

      ) : (

        <div className="patient-prescriptions-table-card">

          <div className="patient-prescriptions-table-header">

            <div>

              <h2>
                Prescription History
              </h2>

              <p>
                Medicines prescribed by your
                doctors.
              </p>

            </div>

            <span>
              {
                filteredPrescriptions.length
              }{" "}
              Records
            </span>

          </div>

          <div className="patient-prescriptions-table-wrapper">

            <table className="patient-prescriptions-table">

              <thead>

                <tr>

                  <th>
                    Prescription ID
                  </th>

                  <th>
                    Appointment ID
                  </th>

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
                    Medicine
                  </th>

                  <th>
                    Dosage
                  </th>

                  <th>
                    Frequency
                  </th>

                  <th>
                    Duration
                  </th>

                  <th>
                    Instructions
                  </th>

                  <th>
                    Created At
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredPrescriptions.map(
                  (prescription) => (

                    <tr
                      key={
                        prescription.id
                      }
                    >

                      {/* Prescription ID */}

                      <td>

                        <span className="patient-prescription-id">
                          {
                            prescription.prescription_id ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Appointment ID */}

                      <td>

                        <strong>
                          {
                            prescription.appointment_id ||
                            "-"
                          }
                        </strong>

                      </td>

                      {/* Medical Record ID */}

                      <td>

                        <strong>
                          {
                            prescription.medical_record_id ||
                            "-"
                          }
                        </strong>

                      </td>

                      {/* Patient */}

                      <td>

                        <strong>
                          {
                            prescription.patient_id ||
                            "-"
                          }
                        </strong>

                        <br />

                        <span className="patient-prescription-secondary-text">
                          {
                            prescription.patient_name ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Doctor */}

                      <td>

                        <strong>
                          {
                            prescription.doctor_id ||
                            "-"
                          }
                        </strong>

                        <br />

                        <span className="patient-prescription-secondary-text">
                          {
                            prescription.doctor_name ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Medicine */}

                      <td>

                        <span className="patient-prescription-medicine">
                          {
                            prescription.medicine_name ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Dosage */}

                      <td>
                        {
                          prescription.dosage ||
                          "-"
                        }
                      </td>

                      {/* Frequency */}

                      <td>
                        {
                          prescription.frequency ||
                          "-"
                        }
                      </td>

                      {/* Duration */}

                      <td>
                        {
                          prescription.duration ||
                          "-"
                        }
                      </td>

                      {/* Instructions */}

                      <td>
                        {
                          prescription.instructions ||
                          "-"
                        }
                      </td>

                      {/* Created At */}

                      <td>

                        {
                          prescription.created_at
                            ? new Date(
                                prescription.created_at
                              ).toLocaleString()
                            : "-"
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

export default PatientPrescriptions;