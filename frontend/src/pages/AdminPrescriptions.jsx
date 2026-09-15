import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminPrescriptions.css";

function AdminPrescriptions() {
  const [prescriptions, setPrescriptions] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [
    editingPrescription,
    setEditingPrescription,
  ] = useState(null);

  const [formError, setFormError] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  // ==========================================
  // SEARCH / FILTERS
  // ==========================================

  const [searchTerm, setSearchTerm] =
    useState("");
  const [fromDate, setFromDate] =
    useState("");
  const [toDate, setToDate] =
    useState("");

  // ==========================================
  // FORM DATA
  // ==========================================

  const [formData, setFormData] = useState({
    medicine_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  // ==========================================
  // HELPERS
  // ==========================================

  const getData = (response) => {
    return Array.isArray(response.data)
      ? response.data
      : response.data?.results || [];
  };

  const getErrorMessage = (err, fallback) => {
    if (!err.response?.data) {
      return err.message || fallback;
    }

    const data = err.response.data;

    if (typeof data === "string") {
      return data;
    }

    if (data.error) {
      return data.error;
    }

    if (data.detail) {
      return data.detail;
    }

    if (typeof data === "object") {
      return Object.entries(data)
        .map(([field, messages]) => {
          const value = Array.isArray(messages)
            ? messages.join(", ")
            : messages;

          return `${field}: ${value}`;
        })
        .join(" | ");
    }

    return fallback;
  };

  const getInitial = (name) => {
    return String(name || "P")
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  const formatDate = (dateTime) => {
    if (!dateTime) {
      return "-";
    }

    return new Date(dateTime).toLocaleDateString(
      [],
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) {
      return "-";
    }

    return new Date(dateTime).toLocaleString(
      [],
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==========================================
  // FETCH PRESCRIPTIONS
  // ==========================================

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "prescriptions/"
      );

      const data = getData(response);

      const sortedPrescriptions = [...data].sort(
        (a, b) => {
          if (
            a.created_at &&
            b.created_at
          ) {
            return (
              new Date(b.created_at) -
              new Date(a.created_at)
            );
          }

          return b.id - a.id;
        }
      );

      setPrescriptions(
        sortedPrescriptions
      );
    } catch (err) {
      console.error(
        "Prescriptions error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to load prescriptions."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FILTER PRESCRIPTIONS
  // ==========================================

  const filteredPrescriptions = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return prescriptions.filter(
      (prescription) => {
        const searchableValues = [
          prescription.prescription_id,
          prescription.patient_id,
          prescription.doctor_id,
          prescription.patient_name,
          prescription.doctor_name,
          prescription.medicine_name,
          prescription.dosage,
          prescription.frequency,
          prescription.duration,
          prescription.instructions,
        ];

        const matchesSearch =
          !search ||
          searchableValues.some(
            (value) =>
              String(value || "")
                .toLowerCase()
                .includes(search)
          );

        const prescriptionDate =
          prescription.created_at
            ? new Date(
                prescription.created_at
              )
                .toISOString()
                .split("T")[0]
            : "";

        const matchesFromDate =
          !fromDate ||
          (prescriptionDate &&
            prescriptionDate >=
              fromDate);

        const matchesToDate =
          !toDate ||
          (prescriptionDate &&
            prescriptionDate <=
              toDate);

        return (
          matchesSearch &&
          matchesFromDate &&
          matchesToDate
        );
      }
    );
  }, [
    prescriptions,
    searchTerm,
    fromDate,
    toDate,
  ]);

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    const total =
      prescriptions.length;

    const patients = new Set(
      prescriptions
        .map(
          (prescription) =>
            prescription.patient_id
        )
        .filter(Boolean)
    ).size;

    const doctors = new Set(
      prescriptions
        .map(
          (prescription) =>
            prescription.doctor_id
        )
        .filter(Boolean)
    ).size;

    const medicines = new Set(
      prescriptions
        .map(
          (prescription) =>
            String(
              prescription.medicine_name ||
                ""
            )
              .trim()
              .toLowerCase()
        )
        .filter(Boolean)
    ).size;

    return {
      total,
      patients,
      doctors,
      medicines,
    };
  }, [prescriptions]);

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  };

  // ==========================================
  // EDIT PRESCRIPTION
  // ==========================================

  const handleEdit = (prescription) => {
    setEditingPrescription(
      prescription
    );

    setFormError("");
    setSuccessMessage("");

    setFormData({
      medicine_name:
        prescription.medicine_name ||
        "",
      dosage:
        prescription.dosage || "",
      frequency:
        prescription.frequency || "",
      duration:
        prescription.duration || "",
      instructions:
        prescription.instructions ||
        "",
    });

    setTimeout(() => {
      document
        .querySelector(
          ".admin-prescriptions-edit-card"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]:
        event.target.value,
    }));

    setFormError("");
  };

  // ==========================================
  // UPDATE PRESCRIPTION
  // ==========================================

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingPrescription) {
      return;
    }

    setFormError("");
    setSuccessMessage("");

    try {
      const response = await api.put(
        `prescriptions/${editingPrescription.id}/`,
        {
          medical_record:
            editingPrescription.medical_record,
          ...formData,
        }
      );

      setPrescriptions(
        (previousPrescriptions) =>
          previousPrescriptions
            .map((prescription) =>
              prescription.id ===
              editingPrescription.id
                ? response.data
                : prescription
            )
            .sort((a, b) => {
              if (
                a.created_at &&
                b.created_at
              ) {
                return (
                  new Date(
                    b.created_at
                  ) -
                  new Date(
                    a.created_at
                  )
                );
              }

              return b.id - a.id;
            })
      );

      setEditingPrescription(null);

      setFormData({
        medicine_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      });

      setSuccessMessage(
        "Prescription updated successfully."
      );
    } catch (err) {
      console.error(
        "Update prescription error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to update prescription."
        )
      );
    }
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancelEdit = () => {
    setEditingPrescription(null);

    setFormError("");

    setFormData({
      medicine_name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    });
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="admin-prescriptions-page">
        <div className="admin-prescriptions-state">
          <div className="admin-prescriptions-spinner" />

          <p>
            Loading prescriptions...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="admin-prescriptions-page">

      {/* ======================================
          HEADER
          ====================================== */}

      <div className="admin-prescriptions-header">

        <div>

          <p className="admin-prescriptions-eyebrow">
            PHARMACY MANAGEMENT
          </p>

          <h1>
            Prescriptions
          </h1>

          <p>
            Review and manage patient
            prescriptions.
          </p>

        </div>

        <div className="admin-prescriptions-header-count">

          <span>
            PRESCRIPTIONS
          </span>

          <strong>
            {prescriptions.length}
          </strong>

          <small>
            Total prescriptions
          </small>

        </div>

      </div>

      {/* ======================================
          ERROR
          ====================================== */}

      {error && (
        <div className="admin-prescriptions-error">
          <span>!</span>
          {error}
        </div>
      )}

      {/* ======================================
          SUCCESS
          ====================================== */}

      {successMessage && (
        <div className="admin-prescriptions-success">
          <span>✓</span>
          {successMessage}
        </div>
      )}

      {/* ======================================
          SUMMARY
          ====================================== */}

      <div className="admin-prescriptions-summary-grid">

        <div className="admin-prescriptions-summary-card">

          <div className="admin-prescriptions-summary-icon">
            RX
          </div>

          <div>
            <span>
              Total Prescriptions
            </span>

            <strong>
              {summary.total}
            </strong>

            <small>
              All prescriptions
            </small>
          </div>

        </div>

        <div className="admin-prescriptions-summary-card">

          <div className="admin-prescriptions-summary-icon">
            PT
          </div>

          <div>
            <span>
              Patients
            </span>

            <strong>
              {summary.patients}
            </strong>

            <small>
              Patients with prescriptions
            </small>
          </div>

        </div>

        <div className="admin-prescriptions-summary-card">

          <div className="admin-prescriptions-summary-icon">
            DR
          </div>

          <div>
            <span>
              Doctors
            </span>

            <strong>
              {summary.doctors}
            </strong>

            <small>
              Prescribing doctors
            </small>
          </div>

        </div>

        <div className="admin-prescriptions-summary-card">

          <div className="admin-prescriptions-summary-icon">
            MD
          </div>

          <div>
            <span>
              Medicines
            </span>

            <strong>
              {summary.medicines}
            </strong>

            <small>
              Unique medicines
            </small>
          </div>

        </div>

      </div>

      {/* ======================================
          SEARCH / FILTER
          ====================================== */}

      <div className="admin-prescriptions-filter-card">

        <div className="admin-prescriptions-filter-header">

          <div>
            <p>
              PRESCRIPTION DIRECTORY
            </p>

            <h2>
              Search & Filter
            </h2>
          </div>

          <span>
            {filteredPrescriptions.length} Result
            {filteredPrescriptions.length !==
            1
              ? "s"
              : ""}
          </span>

        </div>

        <div className="admin-prescriptions-filter-grid">

          {/* SEARCH */}

          <div className="admin-prescriptions-filter-group search">

            <label>
              Search Prescriptions
            </label>

            <div className="admin-prescriptions-search-box">

              <span>⌕</span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Prescription ID, patient, doctor, medicine..."
              />

            </div>

          </div>

          {/* FROM DATE */}

          <div className="admin-prescriptions-filter-group">

            <label>
              From Date
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
            />

          </div>

          {/* TO DATE */}

          <div className="admin-prescriptions-filter-group">

            <label>
              To Date
            </label>

            <input
              type="date"
              value={toDate}
              min={
                fromDate || undefined
              }
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
            />

          </div>

        </div>

        <div className="admin-prescriptions-filter-footer">

          <span>
            Showing{" "}
            <strong>
              {filteredPrescriptions.length}
            </strong>{" "}
            of{" "}
            <strong>
              {prescriptions.length}
            </strong>{" "}
            prescriptions
          </span>

          <button
            type="button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        </div>

      </div>

      {/* ======================================
          EDIT PRESCRIPTION
          ====================================== */}

      {editingPrescription && (
        <div className="admin-prescriptions-edit-card">

          <div className="admin-prescriptions-edit-header">

            <div>

              <p>
                UPDATE PRESCRIPTION
              </p>

              <h2>
                Edit Prescription
              </h2>

              <small>
                Prescription ID:{" "}
                <strong>
                  {
                    editingPrescription.prescription_id
                  }
                </strong>
              </small>

            </div>

            <button
              type="button"
              className="admin-prescriptions-close-btn"
              onClick={
                handleCancelEdit
              }
            >
              ×
            </button>

          </div>

          {formError && (
            <div className="admin-prescriptions-form-error">
              <span>!</span>
              {formError}
            </div>
          )}

          <form
            onSubmit={handleUpdate}
            className="admin-prescriptions-edit-form"
          >

            {/* PATIENT / DOCTOR */}

            <div className="admin-prescriptions-info-grid">

              <div className="admin-prescriptions-info-box">

                <span>
                  Patient
                </span>

                <strong>
                  {
                    editingPrescription.patient_id ||
                    "-"
                  }
                </strong>

                <small>
                  {
                    editingPrescription.patient_name ||
                    "-"
                  }
                </small>

              </div>

              <div className="admin-prescriptions-info-box">

                <span>
                  Doctor
                </span>

                <strong>
                  {
                    editingPrescription.doctor_id ||
                    "-"
                  }
                </strong>

                <small>
                  {
                    editingPrescription.doctor_name ||
                    "-"
                  }
                </small>

              </div>

              <div className="admin-prescriptions-info-box">

                <span>
                  Created
                </span>

                <strong>
                  {formatDate(
                    editingPrescription.created_at
                  )}
                </strong>

                <small>
                  {formatDateTime(
                    editingPrescription.created_at
                  )}
                </small>

              </div>

            </div>

            {/* MEDICINE SECTION */}

            <div className="admin-prescriptions-section-title">

              <span>
                01
              </span>

              <div>

                <h3>
                  Medication Details
                </h3>

                <p>
                  Update the prescribed
                  medication information.
                </p>

              </div>

            </div>

            <div className="admin-prescriptions-edit-grid">

              <div className="admin-prescriptions-form-group">

                <label>
                  Medicine Name
                </label>

                <input
                  type="text"
                  name="medicine_name"
                  value={
                    formData.medicine_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter medicine name"
                  required
                />

              </div>

              <div className="admin-prescriptions-form-group">

                <label>
                  Dosage
                </label>

                <input
                  type="text"
                  name="dosage"
                  value={
                    formData.dosage
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. 500 mg"
                  required
                />

              </div>

              <div className="admin-prescriptions-form-group">

                <label>
                  Frequency
                </label>

                <input
                  type="text"
                  name="frequency"
                  value={
                    formData.frequency
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Twice daily"
                  required
                />

              </div>

              <div className="admin-prescriptions-form-group">

                <label>
                  Duration
                </label>

                <input
                  type="text"
                  name="duration"
                  value={
                    formData.duration
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. 5 days"
                  required
                />

              </div>

            </div>

            <div className="admin-prescriptions-section-title second">

              <span>
                02
              </span>

              <div>

                <h3>
                  Instructions
                </h3>

                <p>
                  Add or update medication
                  instructions.
                </p>

              </div>

            </div>

            <div className="admin-prescriptions-form-group">

              <label>
                Instructions
              </label>

              <textarea
                name="instructions"
                value={
                  formData.instructions
                }
                onChange={
                  handleChange
                }
                placeholder="Enter instructions for the patient..."
                rows="5"
              />

            </div>

            <div className="admin-prescriptions-edit-actions">

              <button
                type="button"
                className="admin-prescriptions-cancel-btn"
                onClick={
                  handleCancelEdit
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-prescriptions-save-btn"
              >
                Update Prescription
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================
          PRESCRIPTION TABLE
          ====================================== */}

      <div className="admin-prescriptions-table-card">

        <div className="admin-prescriptions-table-header">

          <div>
            <p>
              PRESCRIPTION RECORDS
            </p>

            <h2>
              Prescription Directory
            </h2>
          </div>

          <span>
            {prescriptions.length} Total
          </span>

        </div>

        {prescriptions.length === 0 ? (
          <div className="admin-prescriptions-empty">

            <div className="admin-prescriptions-empty-icon">
              RX
            </div>

            <h3>
              No prescriptions found
            </h3>

            <p>
              Prescriptions will appear
              here once created.
            </p>

          </div>
        ) : filteredPrescriptions.length ===
          0 ? (
          <div className="admin-prescriptions-empty">

            <div className="admin-prescriptions-empty-icon">
              ⌕
            </div>

            <h3>
              No matching prescriptions
            </h3>

            <p>
              Try changing your search
              or date filters.
            </p>

            <button
              type="button"
              className="admin-prescriptions-clear-btn"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>

          </div>
        ) : (
          <div className="admin-prescriptions-table-wrapper">

            <table className="admin-prescriptions-table">

              <thead>

                <tr>

                  <th>
                    Prescription
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
                    Created
                  </th>

                  <th>
                    Action
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

                      {/* PRESCRIPTION */}

                      <td>

                        <div className="admin-prescriptions-id">

                          <strong>
                            {
                              prescription.prescription_id
                            }
                          </strong>

                          <small>
                            ID #
                            {
                              prescription.id
                            }
                          </small>

                        </div>

                      </td>

                      {/* PATIENT */}

                      <td>

                        <div className="admin-prescriptions-person">

                          <div className="admin-prescriptions-avatar">
                            {getInitial(
                              prescription.patient_name
                            )}
                          </div>

                          <div>

                            <strong>
                              {
                                prescription.patient_name ||
                                "-"
                              }
                            </strong>

                            <span>
                              {
                                prescription.patient_id ||
                                "-"
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* DOCTOR */}

                      <td>

                        <div className="admin-prescriptions-doctor">

                          <strong>
                            Dr.{" "}
                            {
                              prescription.doctor_name ||
                              "-"
                            }
                          </strong>

                          <span>
                            {
                              prescription.doctor_id ||
                              "-"
                            }
                          </span>

                        </div>

                      </td>

                      {/* MEDICINE */}

                      <td>

                        <span className="admin-prescriptions-medicine">
                          {
                            prescription.medicine_name ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* DOSAGE */}

                      <td>
                        <span className="admin-prescriptions-value">
                          {
                            prescription.dosage ||
                            "-"
                          }
                        </span>
                      </td>

                      {/* FREQUENCY */}

                      <td>
                        <span className="admin-prescriptions-value">
                          {
                            prescription.frequency ||
                            "-"
                          }
                        </span>
                      </td>

                      {/* DURATION */}

                      <td>
                        <span className="admin-prescriptions-duration">
                          {
                            prescription.duration ||
                            "-"
                          }
                        </span>
                      </td>

                      {/* INSTRUCTIONS */}

                      <td>

                        <span
                          className={
                            prescription.instructions
                              ? "admin-prescriptions-instructions"
                              : "admin-prescriptions-muted"
                          }
                        >
                          {
                            prescription.instructions ||
                            "—"
                          }
                        </span>

                      </td>

                      {/* CREATED */}

                      <td>

                        <span className="admin-prescriptions-created">
                          {formatDateTime(
                            prescription.created_at
                          )}
                        </span>

                      </td>

                      {/* ACTION */}

                      <td>

                        <button
                          type="button"
                          className="admin-prescriptions-edit-btn"
                          onClick={() =>
                            handleEdit(
                              prescription
                            )
                          }
                        >
                          Edit
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default AdminPrescriptions;