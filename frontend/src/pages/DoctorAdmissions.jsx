import { useEffect, useState } from "react";
import api from "../services/api";

function DoctorAdmissions() {
  const [admissions, setAdmissions] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [fromAdmissionDate, setFromAdmissionDate] = useState("");
  const [toAdmissionDate, setToAdmissionDate] = useState("");

  const [fromDischargeDate, setFromDischargeDate] = useState("");
  const [toDischargeDate, setToDischargeDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState(null);

  const [formData, setFormData] = useState({
    discharge_date: "",
    reason: "",
    status: "",
    notes: "",
  });

  // ==========================================
  // HELPERS
  // ==========================================

  const getData = (response) => {
    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data?.results || [];
  };

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "ADMITTED":
        return "admitted";

      case "UNDER_TREATMENT":
        return "treatment";

      case "DISCHARGED":
        return "discharged";

      case "CANCELLED":
        return "cancelled";

      default:
        return "";
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // FETCH ADMISSIONS
  // ==========================================

  const fetchAdmissions = async () => {
    try {
      setError("");

      const response = await api.get("admissions/");
      const data = getData(response);

      const sortedAdmissions = [...data].sort(
        (a, b) => b.id - a.id
      );

      setAdmissions(sortedAdmissions);
      setFilteredAdmissions(sortedAdmissions);
    } catch (err) {
      console.error("Admissions error:", err);
      setError("Unable to load admissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  // ==========================================
  // SEARCH / FILTER
  // ==========================================

  useEffect(() => {
    const searchValue = searchTerm.trim().toLowerCase();

    const results = admissions.filter((admission) => {
      const admissionId = String(
        admission.admission_id || ""
      ).toLowerCase();

      const patientId = String(
        admission.patient_id || ""
      ).toLowerCase();

      const patientName = String(
        admission.patient_name || ""
      ).toLowerCase();

      const doctorId = String(
        admission.doctor_id || ""
      ).toLowerCase();

      const doctorName = String(
        admission.doctor_name || ""
      ).toLowerCase();

      const departmentName = String(
        admission.department_name || ""
      ).toLowerCase();

      const roomNumber = String(
        admission.room_number || ""
      ).toLowerCase();

      const bedNumber = String(
        admission.bed_number || ""
      ).toLowerCase();

      const reason = String(
        admission.reason || ""
      ).toLowerCase();

      const notes = String(
        admission.notes || ""
      ).toLowerCase();

      const status = String(
        admission.status || ""
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        admissionId.includes(searchValue) ||
        patientId.includes(searchValue) ||
        patientName.includes(searchValue) ||
        doctorId.includes(searchValue) ||
        doctorName.includes(searchValue) ||
        departmentName.includes(searchValue) ||
        roomNumber.includes(searchValue) ||
        bedNumber.includes(searchValue) ||
        reason.includes(searchValue) ||
        notes.includes(searchValue) ||
        status.includes(searchValue);

      const matchesStatus =
        !statusFilter ||
        status === statusFilter.toLowerCase();

      const admissionDate =
        admission.admission_date || "";

      const dischargeDate =
        admission.discharge_date || "";

      const matchesFromAdmissionDate =
        !fromAdmissionDate ||
        admissionDate >= fromAdmissionDate;

      const matchesToAdmissionDate =
        !toAdmissionDate ||
        admissionDate <= toAdmissionDate;

      const matchesFromDischargeDate =
        !fromDischargeDate ||
        (dischargeDate &&
          dischargeDate >= fromDischargeDate);

      const matchesToDischargeDate =
        !toDischargeDate ||
        (dischargeDate &&
          dischargeDate <= toDischargeDate);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFromAdmissionDate &&
        matchesToAdmissionDate &&
        matchesFromDischargeDate &&
        matchesToDischargeDate
      );
    });

    results.sort((a, b) => b.id - a.id);

    setFilteredAdmissions(results);
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
        .map((admission) => admission.status)
        .filter(Boolean)
    ),
  ];

  // ==========================================
  // EDIT ADMISSION
  // ==========================================

  const handleEdit = (admission) => {
    setEditingAdmission(admission);

    setFormData({
      discharge_date: admission.discharge_date || "",
      reason: admission.reason || "",
      status: admission.status || "",
      notes: admission.notes || "",
    });

    setFormError("");
    setShowForm(true);
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  // ==========================================
  // UPDATE ADMISSION
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    try {
      const payload = {
        status: formData.status,
        reason: formData.reason,
        notes: formData.notes,
      };

      if (formData.status === "DISCHARGED") {
        payload.discharge_date =
          formData.discharge_date;
      }

      await api.patch(
        `admissions/${editingAdmission.id}/`,
        payload
      );

      setShowForm(false);
      setEditingAdmission(null);

      await fetchAdmissions();
    } catch (err) {
      console.error(
        "Update admission error:",
        err
      );

      if (err.response?.data) {
        const errorData = err.response.data;

        if (errorData.error) {
          setFormError(errorData.error);
        } else {
          setFormError(
            Object.values(errorData)
              .flat()
              .join(" ") ||
              "Unable to update admission."
          );
        }
      } else {
        setFormError(
          "Unable to update admission."
        );
      }
    }
  };

  // ==========================================
  // CANCEL FORM
  // ==========================================

  const handleCancel = () => {
    setShowForm(false);
    setEditingAdmission(null);
    setFormError("");
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="doctor-admissions-page">
        <div className="doctor-admissions-state">
          <div className="doctor-admissions-spinner"></div>
          <p>Loading admissions...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="doctor-admissions-page">
        <div className="doctor-admissions-state error">
          <h3>Unable to Load Admissions</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // SUMMARY
  // ==========================================

  const admittedCount = admissions.filter(
    (admission) =>
      admission.status === "ADMITTED"
  ).length;

  const treatmentCount = admissions.filter(
    (admission) =>
      admission.status === "UNDER_TREATMENT"
  ).length;

  const dischargedCount = admissions.filter(
    (admission) =>
      admission.status === "DISCHARGED"
  ).length;

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="doctor-admissions-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="doctor-admissions-header">

        <div>
          <p className="doctor-admissions-eyebrow">
            Inpatient Care
          </p>

          <h1>My Admissions</h1>

          <p>
            View and manage admissions assigned
            to you.
          </p>
        </div>

        <div className="doctor-admissions-header-count">
          <span>Showing</span>
          <strong>
            {filteredAdmissions.length}
          </strong>
          <span>
            of {admissions.length} admissions
          </span>
        </div>

      </div>

      {/* ======================================
          SUMMARY CARDS
      ====================================== */}

      <div className="doctor-admissions-summary">

        <div className="doctor-admissions-summary-card">
          <div className="admission-summary-icon purple">
            +
          </div>

          <div>
            <h3>Total Admissions</h3>
            <strong>{admissions.length}</strong>
          </div>
        </div>

        <div className="doctor-admissions-summary-card">
          <div className="admission-summary-icon blue">
            A
          </div>

          <div>
            <h3>Admitted</h3>
            <strong>{admittedCount}</strong>
          </div>
        </div>

        <div className="doctor-admissions-summary-card">
          <div className="admission-summary-icon orange">
            T
          </div>

          <div>
            <h3>Under Treatment</h3>
            <strong>{treatmentCount}</strong>
          </div>
        </div>

        <div className="doctor-admissions-summary-card">
          <div className="admission-summary-icon green">
            ✓
          </div>

          <div>
            <h3>Discharged</h3>
            <strong>{dischargedCount}</strong>
          </div>
        </div>

      </div>

      {/* ======================================
          FILTER CARD
      ====================================== */}

      <div className="doctor-admissions-filter-card">

        <div className="doctor-admissions-filter-header">

          <div>
            <h2>Search & Filter</h2>
            <p>
              Find admissions using patient,
              room, status or date.
            </p>
          </div>

          <button
            type="button"
            className="doctor-admissions-filter-toggle"
            onClick={() =>
              setShowFilters(!showFilters)
            }
          >
            {showFilters
              ? "Hide Filters"
              : "Show Filters"}
          </button>

        </div>

        {showFilters && (
          <div className="doctor-admissions-filters">

            <div className="doctor-admissions-filter-group search">
              <label>Search</label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="Admission ID, Patient, Doctor, Room, Bed..."
              />
            </div>

            <div className="doctor-admissions-filter-group">
              <label>Status</label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <option value="">
                  All Statuses
                </option>

                {statusOptions.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="doctor-admissions-filter-group">
              <label>From Admission</label>

              <input
                type="date"
                value={fromAdmissionDate}
                onChange={(e) =>
                  setFromAdmissionDate(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="doctor-admissions-filter-group">
              <label>To Admission</label>

              <input
                type="date"
                value={toAdmissionDate}
                min={
                  fromAdmissionDate || undefined
                }
                onChange={(e) =>
                  setToAdmissionDate(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="doctor-admissions-filter-group">
              <label>From Discharge</label>

              <input
                type="date"
                value={fromDischargeDate}
                onChange={(e) =>
                  setFromDischargeDate(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="doctor-admissions-filter-group">
              <label>To Discharge</label>

              <input
                type="date"
                value={toDischargeDate}
                min={
                  fromDischargeDate || undefined
                }
                onChange={(e) =>
                  setToDischargeDate(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="doctor-admissions-filter-actions">
              <button
                type="button"
                className="doctor-admissions-clear-btn"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>

          </div>
        )}

      </div>

      {/* ======================================
          EDIT FORM
      ====================================== */}

      {showForm && editingAdmission && (
        <div className="doctor-admissions-form-card">

          <div className="doctor-admissions-section-header">

            <div>
              <h2>Edit Admission</h2>
              <p>
                Update the admission details
                and treatment status.
              </p>
            </div>

            <button
              type="button"
              className="doctor-admissions-close-btn"
              onClick={handleCancel}
            >
              ×
            </button>

          </div>

          {formError && (
            <div className="doctor-admissions-form-error">
              {formError}
            </div>
          )}

          <div className="doctor-admissions-form-grid">

            <div className="doctor-admissions-form-group">
              <label>Patient</label>

              <input
                type="text"
                value={
                  editingAdmission.patient_id
                    ? `${editingAdmission.patient_id} - ${
                        editingAdmission.patient_name ||
                        ""
                      }`
                    : editingAdmission.patient_name ||
                      ""
                }
                disabled
              />
            </div>

            <div className="doctor-admissions-form-group">
              <label>Department</label>

              <input
                type="text"
                value={
                  editingAdmission.department_name ||
                  ""
                }
                disabled
              />
            </div>

            <div className="doctor-admissions-form-group">
              <label>Room</label>

              <input
                type="text"
                value={
                  editingAdmission.room_number ||
                  "-"
                }
                disabled
              />
            </div>

            <div className="doctor-admissions-form-group">
              <label>Bed</label>

              <input
                type="text"
                value={
                  editingAdmission.bed_number ||
                  "-"
                }
                disabled
              />
            </div>

            <div className="doctor-admissions-form-group">
              <label>Admission Date</label>

              <input
                type="date"
                value={
                  editingAdmission.admission_date ||
                  ""
                }
                disabled
              />
            </div>

            <div className="doctor-admissions-form-group">
              <label>Status</label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={
                  editingAdmission.status ===
                    "DISCHARGED" ||
                  editingAdmission.status ===
                    "CANCELLED"
                }
                required
              >
                <option value="ADMITTED">
                  Admitted
                </option>

                <option value="UNDER_TREATMENT">
                  Under Treatment
                </option>

                <option value="DISCHARGED">
                  Discharged
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            <div className="doctor-admissions-form-group">
              <label>Discharge Date</label>

              <input
                type="date"
                name="discharge_date"
                value={formData.discharge_date}
                onChange={handleChange}
                disabled={
                  formData.status !== "DISCHARGED"
                }
                required={
                  formData.status === "DISCHARGED"
                }
              />
            </div>

            <div className="doctor-admissions-form-group">
              <label>Reason</label>

              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="3"
                required
              />
            </div>

            <div className="doctor-admissions-form-group full">
              <label>Notes</label>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
              />
            </div>

          </div>

          <div className="doctor-admissions-form-actions">

            <button
              type="button"
              className="doctor-admissions-save-btn"
              onClick={handleSubmit}
            >
              Update Admission
            </button>

            <button
              type="button"
              className="doctor-admissions-cancel-btn"
              onClick={handleCancel}
            >
              Cancel
            </button>

          </div>

        </div>
      )}

      {/* ======================================
          TABLE
      ====================================== */}

      {admissions.length === 0 ? (

        <div className="doctor-admissions-empty">
          <div className="doctor-admissions-empty-icon">
            +
          </div>

          <h3>No Admissions Assigned</h3>

          <p>
            There are currently no admissions
            assigned to you.
          </p>
        </div>

      ) : filteredAdmissions.length === 0 ? (

        <div className="doctor-admissions-empty">
          <h3>No Admissions Found</h3>

          <p>
            No admissions match the selected
            search or filters.
          </p>

          <button
            type="button"
            className="doctor-admissions-clear-btn"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>

      ) : (

        <div className="doctor-admissions-table-section">

          <div className="doctor-admissions-table-header">

            <div>
              <h2>Admissions</h2>
              <p>
                Latest admissions are shown first.
              </p>
            </div>

            <span>
              {filteredAdmissions.length} Records
            </span>

          </div>

          <div className="doctor-admissions-table-wrapper">

            <table className="doctor-admissions-table">

              <thead>
                <tr>
                  <th>Admission ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Room</th>
                  <th>Bed</th>
                  <th>Admission Date</th>
                  <th>Discharge Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredAdmissions.map(
                  (admission) => (
                    <tr key={admission.id}>

                      <td>
                        <span className="doctor-admission-id">
                          {admission.admission_id || "-"}
                        </span>
                      </td>

                      <td>
                        <div className="doctor-admission-person">
                          <strong>
                            {admission.patient_id || "-"}
                          </strong>

                          <span>
                            {admission.patient_name || "-"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="doctor-admission-person">
                          <strong>
                            {admission.doctor_id || "-"}
                          </strong>

                          <span>
                            {admission.doctor_name || "-"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {admission.department_name || "-"}
                      </td>

                      <td>
                        <span className="doctor-admission-location">
                          {admission.room_number || "-"}
                        </span>
                      </td>

                      <td>
                        <span className="doctor-admission-location">
                          {admission.bed_number || "-"}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          admission.admission_date
                        )}
                      </td>

                      <td>
                        {formatDate(
                          admission.discharge_date
                        )}
                      </td>

                      <td>
                        <div className="doctor-admission-text">
                          {admission.reason || "-"}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`doctor-admission-status ${getStatusClass(
                            admission.status
                          )}`}
                        >
                          {formatStatus(
                            admission.status
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="doctor-admission-notes">
                          {admission.notes || "-"}
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="doctor-admission-edit-btn"
                          onClick={() =>
                            handleEdit(admission)
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

export default DoctorAdmissions;