import { useEffect, useState } from "react";
import api from "../services/api";

function DoctorMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [formData, setFormData] = useState({
    appointment: "",
    symptoms: "",
    diagnosis: "",
    treatment: "",
    notes: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [filteredRecords, setFilteredRecords] = useState([]);

  // ==========================================
  // GET ARRAY DATA
  // ==========================================

  const getData = (response) => {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.results)) {
      return response.data.results;
    }

    return [];
  };

  // ==========================================
  // FETCH DATA
  // ==========================================

  const fetchData = async () => {
    try {
      setError("");

      const [
        recordsResponse,
        appointmentsResponse,
      ] = await Promise.all([
        api.get("medical-records/"),
        api.get("appointments/"),
      ]);

      const medicalRecords = getData(recordsResponse);
      const appointmentData = getData(appointmentsResponse);

      const sortedRecords = [...medicalRecords].sort(
        (a, b) => Number(b.id) - Number(a.id)
      );

      setRecords(sortedRecords);
      setFilteredRecords(sortedRecords);
      setAppointments(appointmentData);
    } catch (err) {
      console.error("Medical records error:", err);

      setError(
        "Unable to load medical records. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // SEARCH / FILTER
  // ==========================================

  useEffect(() => {
    const searchValue = searchTerm.trim().toLowerCase();

    const results = records.filter((record) => {
      const medicalRecordId = String(
        record.medical_record_id || ""
      ).toLowerCase();

      const patientId = String(
        record.patient_id || ""
      ).toLowerCase();

      const patientName = String(
        record.patient_name || ""
      ).toLowerCase();

      const doctorId = String(
        record.doctor_id || ""
      ).toLowerCase();

      const doctorName = String(
        record.doctor_name || ""
      ).toLowerCase();

      const symptoms = String(
        record.symptoms || ""
      ).toLowerCase();

      const diagnosis = String(
        record.diagnosis || ""
      ).toLowerCase();

      const treatment = String(
        record.treatment || ""
      ).toLowerCase();

      const notes = String(
        record.notes || ""
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        medicalRecordId.includes(searchValue) ||
        patientId.includes(searchValue) ||
        patientName.includes(searchValue) ||
        doctorId.includes(searchValue) ||
        doctorName.includes(searchValue) ||
        symptoms.includes(searchValue) ||
        diagnosis.includes(searchValue) ||
        treatment.includes(searchValue) ||
        notes.includes(searchValue);

      const recordDate =
        record.appointment_date || "";

      const matchesFromDate =
        !fromDate || recordDate >= fromDate;

      const matchesToDate =
        !toDate || recordDate <= toDate;

      return (
        matchesSearch &&
        matchesFromDate &&
        matchesToDate
      );
    });

    results.sort(
      (a, b) => Number(b.id) - Number(a.id)
    );

    setFilteredRecords(results);
  }, [
    records,
    searchTerm,
    fromDate,
    toDate,
  ]);

  // ==========================================
  // TODAY'S RECORDS
  // ==========================================

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const todayRecords = records.filter(
    (record) =>
      record.appointment_date === today
  ).length;

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const handleClearFilters = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  };

  // ==========================================
  // ADD RECORD
  // ==========================================

  const handleAdd = () => {
    setEditingRecord(null);

    setFormData({
      appointment: "",
      symptoms: "",
      diagnosis: "",
      treatment: "",
      notes: "",
    });

    setFormError("");
    setShowForm(true);
  };

  // ==========================================
  // EDIT RECORD
  // ==========================================

  const handleEdit = (record) => {
    setEditingRecord(record);

    setFormData({
      appointment: record.appointment || "",
      symptoms: record.symptoms || "",
      diagnosis: record.diagnosis || "",
      treatment: record.treatment || "",
      notes: record.notes || "",
    });

    setFormError("");
    setShowForm(true);
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // SAVE MEDICAL RECORD
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    try {
      if (
        !editingRecord &&
        !formData.appointment
      ) {
        setFormError(
          "Please select an appointment."
        );
        return;
      }

      const payload = {
        appointment: formData.appointment,
        symptoms: formData.symptoms,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        notes: formData.notes,
      };

      if (editingRecord) {
        await api.put(
          `medical-records/${editingRecord.id}/`,
          payload
        );
      } else {
        await api.post(
          "medical-records/",
          payload
        );
      }

      setShowForm(false);
      setEditingRecord(null);

      await fetchData();
    } catch (err) {
      console.error(
        "Medical record save error:",
        err
      );

      if (err.response?.data) {
        const errorData = err.response.data;

        if (errorData.error) {
          setFormError(errorData.error);
        } else {
          const messages = Object.values(errorData)
            .flat()
            .join(" ");

          setFormError(
            messages ||
              "Unable to save medical record."
          );
        }
      } else {
        setFormError(
          "Unable to save medical record."
        );
      }
    }
  };

  // ==========================================
  // CANCEL FORM
  // ==========================================

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormError("");
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (time) => {
    if (!time) return "-";

    const [hours, minutes] =
      time.split(":");

    if (hours === undefined) {
      return time;
    }

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes || 0)
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="doctor-medical-records-page">
        <div className="doctor-medical-records-state">
          <div className="doctor-medical-records-spinner" />
          <h2>Loading medical records...</h2>
          <p>
            Please wait while we load your
            patient records.
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
      <div className="doctor-medical-records-page">
        <div className="doctor-medical-records-state error">
          <h2>Unable to Load Records</h2>
          <p>{error}</p>

          <button onClick={fetchData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="doctor-medical-records-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="doctor-medical-records-header">

        <div>
          <span className="doctor-medical-records-eyebrow">
            Clinical Management
          </span>

          <h1>Medical Records</h1>

          <p>
            View and manage medical records
            of your patients.
          </p>
        </div>

        <button
          className="doctor-medical-records-primary-btn"
          onClick={handleAdd}
        >
          <span>+</span>
          Add Medical Record
        </button>

      </div>

      {/* ======================================
          SUMMARY CARDS
      ====================================== */}

      <div className="doctor-medical-records-summary">

        <div className="doctor-medical-records-summary-card">
          <div className="summary-icon purple">
            ✚
          </div>

          <div>
            <span>Total Records</span>
            <strong>{records.length}</strong>
          </div>
        </div>

        <div className="doctor-medical-records-summary-card">
          <div className="summary-icon blue">
            ◉
          </div>

          <div>
            <span>Filtered Records</span>
            <strong>
              {filteredRecords.length}
            </strong>
          </div>
        </div>

        <div className="doctor-medical-records-summary-card">
          <div className="summary-icon green">
            ✓
          </div>

          <div>
            <span>Today's Records</span>
            <strong>{todayRecords}</strong>
          </div>
        </div>

      </div>

      {/* ======================================
          FORM
      ====================================== */}

      {showForm && (
        <div className="doctor-medical-records-form-card">

          <div className="doctor-medical-records-section-header">

            <div>
              <h2>
                {editingRecord
                  ? "Edit Medical Record"
                  : "Add Medical Record"}
              </h2>

              <p>
                Enter the patient's clinical
                information below.
              </p>
            </div>

            <button
              type="button"
              className="doctor-medical-records-close-btn"
              onClick={handleCancel}
            >
              ×
            </button>

          </div>

          {formError && (
            <div className="doctor-medical-records-form-error">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="doctor-medical-records-form-grid">

              {/* APPOINTMENT */}

              <div className="doctor-medical-records-form-group full">
                <label>
                  Appointment
                </label>

                <select
                  name="appointment"
                  value={
                    formData.appointment
                  }
                  onChange={handleChange}
                  disabled={
                    !!editingRecord
                  }
                  required={!editingRecord}
                >
                  <option value="">
                    Select Appointment
                  </option>

                  {appointments
                    .filter(
                      (appointment) =>
                        appointment.status !==
                        "CANCELLED"
                    )
                    .map((appointment) => (
                      <option
                        key={appointment.id}
                        value={appointment.id}
                      >
                        {appointment.patient_id ||
                          "-"}{" "}
                        -{" "}
                        {appointment.patient_name ||
                          "-"}{" "}
                        -{" "}
                        {formatDate(
                          appointment.appointment_date
                        )}{" "}
                        -{" "}
                        {formatTime(
                          appointment.appointment_time
                        )}
                      </option>
                    ))}
                </select>
              </div>

              {/* SYMPTOMS */}

              <div className="doctor-medical-records-form-group">
                <label>Symptoms</label>

                <textarea
                  name="symptoms"
                  value={
                    formData.symptoms
                  }
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter patient symptoms"
                />
              </div>

              {/* DIAGNOSIS */}

              <div className="doctor-medical-records-form-group">
                <label>Diagnosis</label>

                <textarea
                  name="diagnosis"
                  value={
                    formData.diagnosis
                  }
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter diagnosis"
                />
              </div>

              {/* TREATMENT */}

              <div className="doctor-medical-records-form-group">
                <label>Treatment</label>

                <textarea
                  name="treatment"
                  value={
                    formData.treatment
                  }
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter treatment"
                />
              </div>

              {/* NOTES */}

              <div className="doctor-medical-records-form-group">
                <label>Notes</label>

                <textarea
                  name="notes"
                  value={
                    formData.notes
                  }
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter additional notes"
                />
              </div>

            </div>

            <div className="doctor-medical-records-form-actions">

              <button
                type="submit"
                className="doctor-medical-records-save-btn"
              >
                {editingRecord
                  ? "Update Medical Record"
                  : "Save Medical Record"}
              </button>

              <button
                type="button"
                className="doctor-medical-records-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>

            </div>

          </form>
        </div>
      )}

      {/* ======================================
          FILTER HEADER
      ====================================== */}

      <div className="doctor-medical-records-filter-card">

        <div className="doctor-medical-records-filter-header">

          <div>
            <h2>Medical Records</h2>

            <p>
              Showing{" "}
              <strong>
                {filteredRecords.length}
              </strong>{" "}
              of{" "}
              <strong>
                {records.length}
              </strong>{" "}
              records
            </p>
          </div>

          <button
            type="button"
            className="doctor-medical-records-filter-toggle"
            onClick={() =>
              setShowFilters(!showFilters)
            }
          >
            {showFilters
              ? "Hide Filters"
              : "Search & Filter"}
          </button>

        </div>

        {showFilters && (
          <div className="doctor-medical-records-filters">

            {/* SEARCH */}

            <div className="doctor-medical-records-filter-group search">
              <label>Search Medical Records</label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Record ID, Patient ID, Patient Name, Doctor ID, Diagnosis..."
              />
            </div>

            {/* FROM DATE */}

            <div className="doctor-medical-records-filter-group">
              <label>From Date</label>

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

            {/* TO DATE */}

            <div className="doctor-medical-records-filter-group">
              <label>To Date</label>

              <input
                type="date"
                value={toDate}
                min={
                  fromDate || undefined
                }
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
                }
              />
            </div>

            <button
              type="button"
              className="doctor-medical-records-clear-btn"
              onClick={
                handleClearFilters
              }
            >
              Clear Filters
            </button>

          </div>
        )}

      </div>

      {/* ======================================
          EMPTY STATE
      ====================================== */}

      {records.length === 0 ? (
        <div className="doctor-medical-records-empty">

          <div className="doctor-medical-records-empty-icon">
            ✚
          </div>

          <h2>No Medical Records Yet</h2>

          <p>
            There are currently no medical
            records available.
          </p>

          <button
            onClick={handleAdd}
            className="doctor-medical-records-primary-btn"
          >
            Add Medical Record
          </button>

        </div>

      ) : filteredRecords.length === 0 ? (

        <div className="doctor-medical-records-empty">

          <div className="doctor-medical-records-empty-icon">
            🔍
          </div>

          <h2>No Matching Records</h2>

          <p>
            No medical records match your
            current search or date filters.
          </p>

          <button
            type="button"
            className="doctor-medical-records-clear-btn"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>

        </div>

      ) : (

        /* ====================================
           TABLE
        ==================================== */

        <div className="doctor-medical-records-table-card">

          <div className="doctor-medical-records-table-wrapper">

            <table className="doctor-medical-records-table">

              <thead>
                <tr>

                  <th>Record ID</th>

                  <th>Patient</th>

                  <th>Doctor</th>

                  <th>Appointment</th>

                  <th>Clinical Details</th>

                  <th>Notes</th>

                  <th>Action</th>

                </tr>
              </thead>

              <tbody>

                {filteredRecords.map(
                  (record) => (

                    <tr key={record.id}>

                      {/* RECORD ID */}

                      <td>
                        <span className="doctor-medical-record-id">
                          {record.medical_record_id ||
                            "-"}
                        </span>
                      </td>

                      {/* PATIENT */}

                      <td>
                        <div className="doctor-medical-record-person">

                          <strong>
                            {record.patient_name ||
                              "-"}
                          </strong>

                          <span>
                            {record.patient_id ||
                              "-"}
                          </span>

                        </div>
                      </td>

                      {/* DOCTOR */}

                      <td>
                        <div className="doctor-medical-record-person">

                          <strong>
                            {record.doctor_name ||
                              "-"}
                          </strong>

                          <span>
                            {record.doctor_id ||
                              "-"}
                          </span>

                        </div>
                      </td>

                      {/* APPOINTMENT */}

                      <td>
                        <div className="doctor-medical-record-appointment">

                          <strong>
                            {formatDate(
                              record.appointment_date
                            )}
                          </strong>

                          <span>
                            {formatTime(
                              record.appointment_time
                            )}
                          </span>

                        </div>
                      </td>

                      {/* CLINICAL DETAILS */}

                      <td>
                        <div className="doctor-medical-record-clinical">

                          <div>
                            <span>
                              Diagnosis
                            </span>

                            <p>
                              {record.diagnosis ||
                                "-"}
                            </p>
                          </div>

                          <div>
                            <span>
                              Symptoms
                            </span>

                            <p>
                              {record.symptoms ||
                                "-"}
                            </p>
                          </div>

                          <div>
                            <span>
                              Treatment
                            </span>

                            <p>
                              {record.treatment ||
                                "-"}
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* NOTES */}

                      <td>
                        <div className="doctor-medical-record-notes">
                          {record.notes || "-"}
                        </div>
                      </td>

                      {/* ACTION */}

                      <td>
                        <button
                          type="button"
                          className="doctor-medical-record-edit-btn"
                          onClick={() =>
                            handleEdit(record)
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

        </div>
      )}

    </div>
  );
}

export default DoctorMedicalRecords;