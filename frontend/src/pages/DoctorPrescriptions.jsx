import { useEffect, useState } from "react";
import api from "../services/api";

function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);

  const [formData, setFormData] = useState({
    medical_record: "",
    medicine_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  // ==========================================
  // SEARCH / FILTER STATES
  // ==========================================

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [filteredPrescriptions, setFilteredPrescriptions] =
    useState([]);

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
        prescriptionsResponse,
        recordsResponse,
      ] = await Promise.all([
        api.get("prescriptions/"),
        api.get("medical-records/"),
      ]);

      const prescriptionData =
        getData(prescriptionsResponse);

      const recordData =
        getData(recordsResponse);

      const sortedPrescriptions =
        [...prescriptionData].sort(
          (a, b) => Number(b.id) - Number(a.id)
        );

      setPrescriptions(sortedPrescriptions);
      setFilteredPrescriptions(
        sortedPrescriptions
      );

      setMedicalRecords(recordData);
    } catch (err) {
      console.error(
        "Prescriptions error:",
        err
      );

      setError(
        "Unable to load prescriptions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // SEARCH / FILTER PRESCRIPTIONS
  // ==========================================

  useEffect(() => {
    const searchValue =
      searchTerm.trim().toLowerCase();

    const results = prescriptions.filter(
      (prescription) => {
        const prescriptionId =
          String(
            prescription.prescription_id || ""
          ).toLowerCase();

        const patientId =
          String(
            prescription.patient_id || ""
          ).toLowerCase();

        const patientName =
          String(
            prescription.patient_name || ""
          ).toLowerCase();

        const doctorId =
          String(
            prescription.doctor_id || ""
          ).toLowerCase();

        const doctorName =
          String(
            prescription.doctor_name || ""
          ).toLowerCase();

        const medicineName =
          String(
            prescription.medicine_name || ""
          ).toLowerCase();

        const dosage =
          String(
            prescription.dosage || ""
          ).toLowerCase();

        const frequency =
          String(
            prescription.frequency || ""
          ).toLowerCase();

        const duration =
          String(
            prescription.duration || ""
          ).toLowerCase();

        const instructions =
          String(
            prescription.instructions || ""
          ).toLowerCase();

        const matchesSearch =
          !searchValue ||
          prescriptionId.includes(searchValue) ||
          patientId.includes(searchValue) ||
          patientName.includes(searchValue) ||
          doctorId.includes(searchValue) ||
          doctorName.includes(searchValue) ||
          medicineName.includes(searchValue) ||
          dosage.includes(searchValue) ||
          frequency.includes(searchValue) ||
          duration.includes(searchValue) ||
          instructions.includes(searchValue);

        const createdDate =
          prescription.created_at
            ? new Date(
                prescription.created_at
              )
                .toISOString()
                .split("T")[0]
            : "";

        const matchesFromDate =
          !fromDate ||
          createdDate >= fromDate;

        const matchesToDate =
          !toDate ||
          createdDate <= toDate;

        return (
          matchesSearch &&
          matchesFromDate &&
          matchesToDate
        );
      }
    );

    results.sort(
      (a, b) => Number(b.id) - Number(a.id)
    );

    setFilteredPrescriptions(results);
  }, [
    prescriptions,
    searchTerm,
    fromDate,
    toDate,
  ]);

  // ==========================================
  // TODAY'S PRESCRIPTIONS
  // ==========================================

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const todayPrescriptions =
    prescriptions.filter((prescription) => {
      if (!prescription.created_at) {
        return false;
      }

      return (
        new Date(
          prescription.created_at
        )
          .toISOString()
          .split("T")[0] === today
      );
    }).length;

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const handleClearFilters = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData({
      medical_record: "",
      medicine_name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    });

    setEditingPrescription(null);
    setFormError("");
  };

  // ==========================================
  // ADD PRESCRIPTION
  // ==========================================

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  // ==========================================
  // EDIT PRESCRIPTION
  // ==========================================

  const handleEdit = (prescription) => {
    setEditingPrescription(prescription);

    setFormData({
      medical_record:
        prescription.medical_record || "",

      medicine_name:
        prescription.medicine_name || "",

      dosage:
        prescription.dosage || "",

      frequency:
        prescription.frequency || "",

      duration:
        prescription.duration || "",

      instructions:
        prescription.instructions || "",
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
      [event.target.name]:
        event.target.value,
    });
  };

  // ==========================================
  // SAVE PRESCRIPTION
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    try {
      if (!formData.medical_record) {
        setFormError(
          "Please select a medical record."
        );
        return;
      }

      const payload = {
        medical_record:
          formData.medical_record,

        medicine_name:
          formData.medicine_name,

        dosage:
          formData.dosage,

        frequency:
          formData.frequency,

        duration:
          formData.duration,

        instructions:
          formData.instructions,
      };

      if (editingPrescription) {
        await api.put(
          `prescriptions/${editingPrescription.id}/`,
          payload
        );
      } else {
        await api.post(
          "prescriptions/",
          payload
        );
      }

      setShowForm(false);
      resetForm();

      await fetchData();
    } catch (err) {
      console.error(
        "Save prescription error:",
        err
      );

      if (err.response?.data) {
        const errorData =
          err.response.data;

        if (errorData.error) {
          setFormError(
            errorData.error
          );
        } else {
          const messages =
            Object.values(errorData)
              .flat()
              .join(" ");

          setFormError(
            messages ||
              "Unable to save prescription."
          );
        }
      } else {
        setFormError(
          "Unable to save prescription."
        );
      }
    }
  };

  // ==========================================
  // CANCEL FORM
  // ==========================================

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

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
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="doctor-prescriptions-page">
        <div className="doctor-prescriptions-state">

          <div className="doctor-prescriptions-spinner" />

          <h2>
            Loading prescriptions...
          </h2>

          <p>
            Please wait while we load
            your prescriptions.
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
      <div className="doctor-prescriptions-page">
        <div className="doctor-prescriptions-state error">

          <h2>
            Unable to Load Prescriptions
          </h2>

          <p>{error}</p>

          <button
            onClick={fetchData}
            className="doctor-prescriptions-primary-btn"
          >
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
    <div className="doctor-prescriptions-page">

      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="doctor-prescriptions-header">

        <div>

          <span className="doctor-prescriptions-eyebrow">
            Medication Management
          </span>

          <h1>
            Prescriptions
          </h1>

          <p>
            Create and manage prescriptions
            for your patients.
          </p>

        </div>

        <button
          className="doctor-prescriptions-primary-btn"
          onClick={handleAdd}
        >
          <span>+</span>
          Add Prescription
        </button>

      </div>

      {/* ======================================
          SUMMARY CARDS
      ====================================== */}

      <div className="doctor-prescriptions-summary">

        <div className="doctor-prescriptions-summary-card">

          <div className="prescription-summary-icon purple">
            Rx
          </div>

          <div>
            <span>
              Total Prescriptions
            </span>

            <strong>
              {prescriptions.length}
            </strong>
          </div>

        </div>

        <div className="doctor-prescriptions-summary-card">

          <div className="prescription-summary-icon blue">
            ◉
          </div>

          <div>
            <span>
              Filtered Prescriptions
            </span>

            <strong>
              {filteredPrescriptions.length}
            </strong>
          </div>

        </div>

        <div className="doctor-prescriptions-summary-card">

          <div className="prescription-summary-icon green">
            ✓
          </div>

          <div>
            <span>
              Today's Prescriptions
            </span>

            <strong>
              {todayPrescriptions}
            </strong>
          </div>

        </div>

      </div>

      {/* ======================================
          ADD / EDIT FORM
      ====================================== */}

      {showForm && (
        <div className="doctor-prescriptions-form-card">

          <div className="doctor-prescriptions-section-header">

            <div>
              <h2>
                {editingPrescription
                  ? "Edit Prescription"
                  : "Create Prescription"}
              </h2>

              <p>
                Enter the medication details
                for the patient.
              </p>
            </div>

            <button
              type="button"
              className="doctor-prescriptions-close-btn"
              onClick={handleCancel}
            >
              ×
            </button>

          </div>

          {formError && (
            <div className="doctor-prescriptions-form-error">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="doctor-prescriptions-form-grid">

              {/* MEDICAL RECORD */}

              <div className="doctor-prescriptions-form-group full">

                <label>
                  Medical Record
                </label>

                <select
                  name="medical_record"
                  value={
                    formData.medical_record
                  }
                  onChange={handleChange}
                  disabled={
                    !!editingPrescription
                  }
                  required
                >

                  <option value="">
                    Select Medical Record
                  </option>

                  {medicalRecords.map(
                    (record) => (
                      <option
                        key={record.id}
                        value={record.id}
                      >
                        {record.patient_id ||
                          "-"}{" "}
                        -{" "}
                        {record.patient_name ||
                          "-"}{" "}
                        -{" "}
                        {record.doctor_id ||
                          "-"}{" "}
                        - Record #
                        {record.medical_record_id ||
                          record.id}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* MEDICINE */}

              <div className="doctor-prescriptions-form-group">

                <label>
                  Medicine Name
                </label>

                <input
                  type="text"
                  name="medicine_name"
                  value={
                    formData.medicine_name
                  }
                  onChange={handleChange}
                  placeholder="Example: Paracetamol"
                  required
                />

              </div>

              {/* DOSAGE */}

              <div className="doctor-prescriptions-form-group">

                <label>
                  Dosage
                </label>

                <input
                  type="text"
                  name="dosage"
                  value={
                    formData.dosage
                  }
                  onChange={handleChange}
                  placeholder="Example: 500 mg"
                  required
                />

              </div>

              {/* FREQUENCY */}

              <div className="doctor-prescriptions-form-group">

                <label>
                  Frequency
                </label>

                <input
                  type="text"
                  name="frequency"
                  value={
                    formData.frequency
                  }
                  onChange={handleChange}
                  placeholder="Example: Twice daily"
                  required
                />

              </div>

              {/* DURATION */}

              <div className="doctor-prescriptions-form-group">

                <label>
                  Duration
                </label>

                <input
                  type="text"
                  name="duration"
                  value={
                    formData.duration
                  }
                  onChange={handleChange}
                  placeholder="Example: 5 days"
                  required
                />

              </div>

              {/* INSTRUCTIONS */}

              <div className="doctor-prescriptions-form-group full">

                <label>
                  Instructions
                </label>

                <textarea
                  name="instructions"
                  value={
                    formData.instructions
                  }
                  onChange={handleChange}
                  rows="4"
                  placeholder="Example: Take after food"
                />

              </div>

            </div>

            <div className="doctor-prescriptions-form-actions">

              <button
                type="submit"
                className="doctor-prescriptions-save-btn"
              >
                {editingPrescription
                  ? "Update Prescription"
                  : "Create Prescription"}
              </button>

              <button
                type="button"
                className="doctor-prescriptions-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================
          FILTER CARD
      ====================================== */}

      <div className="doctor-prescriptions-filter-card">

        <div className="doctor-prescriptions-filter-header">

          <div>

            <h2>
              Prescriptions
            </h2>

            <p>
              Showing{" "}
              <strong>
                {filteredPrescriptions.length}
              </strong>{" "}
              of{" "}
              <strong>
                {prescriptions.length}
              </strong>{" "}
              prescriptions
            </p>

          </div>

          <button
            type="button"
            className="doctor-prescriptions-filter-toggle"
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
          <div className="doctor-prescriptions-filters">

            {/* SEARCH */}

            <div className="doctor-prescriptions-filter-group search">

              <label>
                Search Prescriptions
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Prescription ID, Patient, Doctor, Medicine, Dosage, Frequency..."
              />

            </div>

            {/* FROM DATE */}

            <div className="doctor-prescriptions-filter-group">

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

            {/* TO DATE */}

            <div className="doctor-prescriptions-filter-group">

              <label>
                To Date
              </label>

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

            {/* CLEAR */}

            <button
              type="button"
              className="doctor-prescriptions-clear-btn"
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
          EMPTY STATES
      ====================================== */}

      {prescriptions.length === 0 ? (

        <div className="doctor-prescriptions-empty">

          <div className="doctor-prescriptions-empty-icon">
            Rx
          </div>

          <h2>
            No Prescriptions Yet
          </h2>

          <p>
            There are currently no
            prescriptions available.
          </p>

          <button
            onClick={handleAdd}
            className="doctor-prescriptions-primary-btn"
          >
            Add Prescription
          </button>

        </div>

      ) : filteredPrescriptions.length === 0 ? (

        <div className="doctor-prescriptions-empty">

          <div className="doctor-prescriptions-empty-icon">
            🔍
          </div>

          <h2>
            No Matching Prescriptions
          </h2>

          <p>
            No prescriptions match your
            current search or date filters.
          </p>

          <button
            type="button"
            className="doctor-prescriptions-clear-btn"
            onClick={
              handleClearFilters
            }
          >
            Clear Filters
          </button>

        </div>

      ) : (

        /* ====================================
           TABLE
        ==================================== */

        <div className="doctor-prescriptions-table-card">

          <div className="doctor-prescriptions-table-wrapper">

            <table className="doctor-prescriptions-table">

              <thead>

                <tr>

                  <th>
                    Prescription ID
                  </th>

                  <th>
                    Patient
                  </th>

                  <th>
                    Doctor
                  </th>

                  <th>
                    Medication
                  </th>

                  <th>
                    Schedule
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

                      {/* PRESCRIPTION ID */}

                      <td>

                        <span className="doctor-prescription-id">
                          {prescription.prescription_id ||
                            "-"}
                        </span>

                      </td>

                      {/* PATIENT */}

                      <td>

                        <div className="doctor-prescription-person">

                          <strong>
                            {prescription.patient_name ||
                              "-"}
                          </strong>

                          <span>
                            {prescription.patient_id ||
                              "-"}
                          </span>

                        </div>

                      </td>

                      {/* DOCTOR */}

                      <td>

                        <div className="doctor-prescription-person">

                          <strong>
                            {prescription.doctor_name ||
                              "-"}
                          </strong>

                          <span>
                            {prescription.doctor_id ||
                              "-"}
                          </span>

                        </div>

                      </td>

                      {/* MEDICATION */}

                      <td>

                        <div className="doctor-prescription-medicine">

                          <strong>
                            {prescription.medicine_name ||
                              "-"}
                          </strong>

                          <span>
                            {prescription.dosage ||
                              "-"}
                          </span>

                        </div>

                      </td>

                      {/* SCHEDULE */}

                      <td>

                        <div className="doctor-prescription-schedule">

                          <span>
                            <b>
                              Frequency:
                            </b>{" "}
                            {prescription.frequency ||
                              "-"}
                          </span>

                          <span>
                            <b>
                              Duration:
                            </b>{" "}
                            {prescription.duration ||
                              "-"}
                          </span>

                        </div>

                      </td>

                      {/* INSTRUCTIONS */}

                      <td>

                        <div className="doctor-prescription-instructions">
                          {prescription.instructions ||
                            "-"}
                        </div>

                      </td>

                      {/* CREATED */}

                      <td>

                        <span className="doctor-prescription-created">
                          {formatDate(
                            prescription.created_at
                          )}
                        </span>

                      </td>

                      {/* ACTION */}

                      <td>

                        <button
                          type="button"
                          className="doctor-prescription-edit-btn"
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

        </div>

      )}

    </div>
  );
}

export default DoctorPrescriptions;