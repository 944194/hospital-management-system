import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminMedicalRecords.css";

function AdminMedicalRecords() {
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingRecord, setEditingRecord] =
    useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [doctorFilter, setDoctorFilter] =
    useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [formData, setFormData] = useState({
    symptoms: "",
    diagnosis: "",
    treatment: "",
    notes: "",
  });

  const [formError, setFormError] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  /* ==========================================
     FETCH MEDICAL RECORDS
     ========================================== */

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

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

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "medical-records/"
      );

      const data = getData(response);

      const sortedRecords = [...data].sort(
        (a, b) => b.id - a.id
      );

      setRecords(sortedRecords);
    } catch (err) {
      console.error(
        "Medical records error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to load medical records."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================
     DOCTOR FILTER OPTIONS
     ========================================== */

  const doctorOptions = useMemo(() => {
    return [
      ...new Map(
        records
          .filter(
            (record) => record.doctor_id
          )
          .map((record) => [
            String(record.doctor_id),
            record.doctor_name
              ? `${record.doctor_id} - ${record.doctor_name}`
              : record.doctor_id,
          ])
      ),
    ];
  }, [records]);

  /* ==========================================
     FILTER RECORDS
     ========================================== */

  const filteredRecords = useMemo(() => {
    const searchValue =
      searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const searchableValues = [
        record.medical_record_id,
        record.patient_id,
        record.patient_name,
        record.doctor_id,
        record.doctor_name,
        record.appointment_id,
        record.symptoms,
        record.diagnosis,
        record.treatment,
        record.notes,
      ];

      const matchesSearch =
        !searchValue ||
        searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(searchValue)
        );

      const matchesDoctor =
        !doctorFilter ||
        String(record.doctor_id || "") ===
          String(doctorFilter);

      const appointmentDate =
        record.appointment_date || "";

      const matchesFromDate =
        !fromDate ||
        appointmentDate >= fromDate;

      const matchesToDate =
        !toDate ||
        appointmentDate <= toDate;

      return (
        matchesSearch &&
        matchesDoctor &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    records,
    searchTerm,
    doctorFilter,
    fromDate,
    toDate,
  ]);

  /* ==========================================
     SUMMARY
     ========================================== */

  const summary = useMemo(() => {
    const total = records.length;

    const withDiagnosis = records.filter(
      (record) =>
        String(
          record.diagnosis || ""
        ).trim() !== ""
    ).length;

    const withTreatment = records.filter(
      (record) =>
        String(
          record.treatment || ""
        ).trim() !== ""
    ).length;

    const doctors = new Set(
      records
        .map((record) => record.doctor_id)
        .filter(Boolean)
    ).size;

    return {
      total,
      withDiagnosis,
      withTreatment,
      doctors,
    };
  }, [records]);

  /* ==========================================
     CLEAR FILTERS
     ========================================== */

  const handleClearFilters = () => {
    setSearchTerm("");
    setDoctorFilter("");
    setFromDate("");
    setToDate("");
  };

  /* ==========================================
     EDIT
     ========================================== */

  const handleEdit = (record) => {
    setEditingRecord(record);

    setFormData({
      symptoms: record.symptoms || "",
      diagnosis: record.diagnosis || "",
      treatment: record.treatment || "",
      notes: record.notes || "",
    });

    setFormError("");
    setSuccessMessage("");

    setTimeout(() => {
      document
        .querySelector(
          ".admin-medical-records-edit-card"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  /* ==========================================
     FORM CHANGE
     ========================================== */

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]:
        event.target.value,
    }));

    setFormError("");
  };

  /* ==========================================
     UPDATE
     ========================================== */

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingRecord) {
      return;
    }

    setFormError("");
    setSuccessMessage("");

    try {
      const response = await api.put(
        `medical-records/${editingRecord.id}/`,
        {
          patient:
            editingRecord.patient,
          doctor:
            editingRecord.doctor,
          appointment:
            editingRecord.appointment,
          symptoms:
            formData.symptoms,
          diagnosis:
            formData.diagnosis,
          treatment:
            formData.treatment,
          notes:
            formData.notes,
        }
      );

      setRecords((previousRecords) =>
        previousRecords
          .map((record) =>
            record.id ===
            editingRecord.id
              ? response.data
              : record
          )
          .sort(
            (a, b) => b.id - a.id
          )
      );

      setEditingRecord(null);

      setFormData({
        symptoms: "",
        diagnosis: "",
        treatment: "",
        notes: "",
      });

      setSuccessMessage(
        "Medical record updated successfully."
      );
    } catch (err) {
      console.error(
        "Update medical record error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to update medical record."
        )
      );
    }
  };

  /* ==========================================
     CANCEL EDIT
     ========================================== */

  const handleCancelEdit = () => {
    setEditingRecord(null);

    setFormData({
      symptoms: "",
      diagnosis: "",
      treatment: "",
      notes: "",
    });

    setFormError("");
  };

  /* ==========================================
     FORMAT HELPERS
     ========================================== */

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) {
      return "-";
    }

    const [hour, minute] =
      time.slice(0, 5).split(":");

    const date = new Date();

    date.setHours(
      Number(hour),
      Number(minute)
    );

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) {
      return "-";
    }

    return new Date(
      dateTime
    ).toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitial = (name) => {
    return String(name || "P")
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  /* ==========================================
     LOADING
     ========================================== */

  if (loading) {
    return (
      <div className="admin-medical-records-page">
        <div className="admin-medical-records-state">
          <div className="admin-medical-records-spinner" />

          <p>
            Loading medical records...
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================
     PAGE
     ========================================== */

  return (
    <div className="admin-medical-records-page">

      {/* ======================================
          HEADER
          ====================================== */}

      <div className="admin-medical-records-header">

        <div>
          <p className="admin-medical-records-eyebrow">
            CLINICAL MANAGEMENT
          </p>

          <h1>
            Medical Records
          </h1>

          <p>
            Review and manage hospital
            medical records.
          </p>
        </div>

        <div className="admin-medical-records-header-count">
          <span>RECORDS</span>

          <strong>
            {records.length}
          </strong>

          <small>
            Total medical records
          </small>
        </div>

      </div>

      {/* ======================================
          ERROR
          ====================================== */}

      {error && (
        <div className="admin-medical-records-error">
          <span>!</span>
          {error}
        </div>
      )}

      {/* ======================================
          SUCCESS
          ====================================== */}

      {successMessage && (
        <div className="admin-medical-records-success">
          <span>✓</span>
          {successMessage}
        </div>
      )}

      {/* ======================================
          SUMMARY
          ====================================== */}

      <div className="admin-medical-records-summary-grid">

        <div className="admin-medical-records-summary-card">

          <div className="admin-medical-records-summary-icon">
            MR
          </div>

          <div>
            <span>Total Records</span>

            <strong>
              {summary.total}
            </strong>

            <small>
              All clinical records
            </small>
          </div>

        </div>

        <div className="admin-medical-records-summary-card">

          <div className="admin-medical-records-summary-icon">
            DX
          </div>

          <div>
            <span>Diagnosed</span>

            <strong>
              {summary.withDiagnosis}
            </strong>

            <small>
              Records with diagnosis
            </small>
          </div>

        </div>

        <div className="admin-medical-records-summary-card">

          <div className="admin-medical-records-summary-icon">
            RX
          </div>

          <div>
            <span>Treatment</span>

            <strong>
              {summary.withTreatment}
            </strong>

            <small>
              Records with treatment
            </small>
          </div>

        </div>

        <div className="admin-medical-records-summary-card">

          <div className="admin-medical-records-summary-icon">
            DR
          </div>

          <div>
            <span>Doctors</span>

            <strong>
              {summary.doctors}
            </strong>

            <small>
              Doctors with records
            </small>
          </div>

        </div>

      </div>

      {/* ======================================
          SEARCH / FILTER
          ====================================== */}

      <div className="admin-medical-records-filter-card">

        <div className="admin-medical-records-filter-header">

          <div>
            <p>
              RECORD DIRECTORY
            </p>

            <h2>
              Search & Filter
            </h2>
          </div>

          <span>
            {filteredRecords.length} Result
            {filteredRecords.length !== 1
              ? "s"
              : ""}
          </span>

        </div>

        <div className="admin-medical-records-filter-grid">

          {/* SEARCH */}

          <div className="admin-medical-records-filter-group search">

            <label>
              Search Records
            </label>

            <div className="admin-medical-records-search-box">

              <span>⌕</span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Record ID, patient, doctor, appointment, diagnosis, treatment..."
              />

            </div>

          </div>

          {/* DOCTOR */}

          <div className="admin-medical-records-filter-group">

            <label>
              Doctor
            </label>

            <select
              value={doctorFilter}
              onChange={(event) =>
                setDoctorFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Doctors
              </option>

              {doctorOptions.map(
                ([doctorId, doctorName]) => (
                  <option
                    key={doctorId}
                    value={doctorId}
                  >
                    {doctorName}
                  </option>
                )
              )}
            </select>

          </div>

          {/* FROM */}

          <div className="admin-medical-records-filter-group">

            <label>
              From Appointment Date
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

          {/* TO */}

          <div className="admin-medical-records-filter-group">

            <label>
              To Appointment Date
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

        <div className="admin-medical-records-filter-footer">

          <span>
            Showing{" "}
            <strong>
              {filteredRecords.length}
            </strong>{" "}
            of{" "}
            <strong>
              {records.length}
            </strong>{" "}
            records
          </span>

          <button
            type="button"
            onClick={
              handleClearFilters
            }
          >
            Clear Filters
          </button>

        </div>

      </div>

      {/* ======================================
          EDIT FORM
          ====================================== */}

      {editingRecord && (
        <div className="admin-medical-records-edit-card">

          <div className="admin-medical-records-edit-header">

            <div>
              <p>
                UPDATE RECORD
              </p>

              <h2>
                Edit Medical Record
              </h2>

              <small>
                Record ID:{" "}
                <strong>
                  {
                    editingRecord.medical_record_id
                  }
                </strong>
              </small>
            </div>

            <button
              type="button"
              className="admin-medical-records-close-btn"
              onClick={
                handleCancelEdit
              }
            >
              ×
            </button>

          </div>

          {formError && (
            <div className="admin-medical-records-form-error">
              <span>!</span>
              {formError}
            </div>
          )}

          <form
            className="admin-medical-records-edit-form"
            onSubmit={handleUpdate}
          >

            {/* PATIENT / DOCTOR */}

            <div className="admin-medical-records-info-grid">

              <div className="admin-medical-records-info-box">

                <span>Patient</span>

                <strong>
                  {
                    editingRecord.patient_id ||
                    "-"
                  }
                </strong>

                <small>
                  {
                    editingRecord.patient_name ||
                    "-"
                  }
                </small>

              </div>

              <div className="admin-medical-records-info-box">

                <span>Doctor</span>

                <strong>
                  {
                    editingRecord.doctor_id ||
                    "-"
                  }
                </strong>

                <small>
                  {
                    editingRecord.doctor_name ||
                    "-"
                  }
                </small>

              </div>

              <div className="admin-medical-records-info-box">

                <span>Appointment</span>

                <strong>
                  {
                    editingRecord.appointment_id ||
                    "-"
                  }
                </strong>

                <small>
                  {formatDate(
                    editingRecord.appointment_date
                  )}{" "}
                  •{" "}
                  {formatTime(
                    editingRecord.appointment_time
                  )}
                </small>

              </div>

            </div>

            {/* CLINICAL INFORMATION */}

            <div className="admin-medical-records-section-title">

              <span>01</span>

              <div>
                <h3>
                  Clinical Information
                </h3>

                <p>
                  Update the patient's
                  clinical record.
                </p>
              </div>

            </div>

            <div className="admin-medical-records-edit-grid">

              <div className="admin-medical-records-form-group">

                <label>
                  Symptoms
                </label>

                <textarea
                  name="symptoms"
                  value={
                    formData.symptoms
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter symptoms..."
                  rows="5"
                />

              </div>

              <div className="admin-medical-records-form-group">

                <label>
                  Diagnosis
                </label>

                <textarea
                  name="diagnosis"
                  value={
                    formData.diagnosis
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter diagnosis..."
                  rows="5"
                />

              </div>

              <div className="admin-medical-records-form-group">

                <label>
                  Treatment
                </label>

                <textarea
                  name="treatment"
                  value={
                    formData.treatment
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter treatment..."
                  rows="5"
                />

              </div>

              <div className="admin-medical-records-form-group">

                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={
                    formData.notes
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Additional clinical notes..."
                  rows="5"
                />

              </div>

            </div>

            <div className="admin-medical-records-edit-actions">

              <button
                type="button"
                className="admin-medical-records-cancel-btn"
                onClick={
                  handleCancelEdit
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-medical-records-save-btn"
              >
                Save Changes
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================
          RECORD TABLE
          ====================================== */}

      <div className="admin-medical-records-table-card">

        <div className="admin-medical-records-table-header">

          <div>
            <p>
              CLINICAL RECORDS
            </p>

            <h2>
              Medical Record Directory
            </h2>
          </div>

          <span>
            {records.length} Total
          </span>

        </div>

        {records.length === 0 ? (
          <div className="admin-medical-records-empty">

            <div className="admin-medical-records-empty-icon">
              MR
            </div>

            <h3>
              No medical records found
            </h3>

            <p>
              Medical records will appear
              here once created.
            </p>

          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="admin-medical-records-empty">

            <div className="admin-medical-records-empty-icon">
              ⌕
            </div>

            <h3>
              No matching records
            </h3>

            <p>
              Try changing your search
              or filters.
            </p>

            <button
              type="button"
              className="admin-medical-records-clear-btn"
              onClick={
                handleClearFilters
              }
            >
              Clear Filters
            </button>

          </div>
        ) : (
          <div className="admin-medical-records-table-wrapper">

            <table className="admin-medical-records-table">

              <thead>
                <tr>
                  <th>
                    Medical Record
                  </th>

                  <th>
                    Appointment
                  </th>

                  <th>
                    Patient
                  </th>

                  <th>
                    Doctor
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Time
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

                  <th>
                    Created
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredRecords.map(
                  (record) => (
                    <tr
                      key={record.id}
                    >

                      {/* RECORD */}

                      <td>
                        <div className="admin-medical-records-id">

                          <strong>
                            {
                              record.medical_record_id
                            }
                          </strong>

                          <small>
                            ID #{record.id}
                          </small>

                        </div>
                      </td>

                      {/* APPOINTMENT */}

                      <td>

                        <span className="admin-medical-records-appointment">
                          {
                            record.appointment_id ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* PATIENT */}

                      <td>

                        <div className="admin-medical-records-person">

                          <div className="admin-medical-records-avatar">
                            {getInitial(
                              record.patient_name
                            )}
                          </div>

                          <div>
                            <strong>
                              {
                                record.patient_name ||
                                "-"
                              }
                            </strong>

                            <span>
                              {
                                record.patient_id ||
                                "-"
                              }
                            </span>
                          </div>

                        </div>

                      </td>

                      {/* DOCTOR */}

                      <td>

                        <div className="admin-medical-records-doctor">

                          <strong>
                            Dr.{" "}
                            {
                              record.doctor_name ||
                              "-"
                            }
                          </strong>

                          <span>
                            {
                              record.doctor_id ||
                              "-"
                            }
                          </span>

                        </div>

                      </td>

                      {/* DATE */}

                      <td>
                        <span className="admin-medical-records-date">
                          {formatDate(
                            record.appointment_date
                          )}
                        </span>
                      </td>

                      {/* TIME */}

                      <td>
                        <span className="admin-medical-records-time">
                          {formatTime(
                            record.appointment_time
                          )}
                        </span>
                      </td>

                      {/* SYMPTOMS */}

                      <td>
                        <span className="admin-medical-records-text">
                          {
                            record.symptoms ||
                            "—"
                          }
                        </span>
                      </td>

                      {/* DIAGNOSIS */}

                      <td>
                        <span
                          className={
                            record.diagnosis
                              ? "admin-medical-records-text"
                              : "admin-medical-records-muted"
                          }
                        >
                          {
                            record.diagnosis ||
                            "—"
                          }
                        </span>
                      </td>

                      {/* TREATMENT */}

                      <td>
                        <span
                          className={
                            record.treatment
                              ? "admin-medical-records-text"
                              : "admin-medical-records-muted"
                          }
                        >
                          {
                            record.treatment ||
                            "—"
                          }
                        </span>
                      </td>

                      {/* NOTES */}

                      <td>
                        <span
                          className={
                            record.notes
                              ? "admin-medical-records-text"
                              : "admin-medical-records-muted"
                          }
                        >
                          {
                            record.notes ||
                            "—"
                          }
                        </span>
                      </td>

                      {/* CREATED */}

                      <td>
                        <span className="admin-medical-records-created">
                          {formatDateTime(
                            record.created_at
                          )}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td>

                        <button
                          type="button"
                          className="admin-medical-records-edit-btn"
                          onClick={() =>
                            handleEdit(
                              record
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

export default AdminMedicalRecords;