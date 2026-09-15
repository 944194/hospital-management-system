import { useEffect, useState } from "react";
import api from "../services/api";

function DoctorAvailability() {
  const [availability, setAvailability] = useState([]);
  const [doctorId, setDoctorId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [formData, setFormData] = useState({
    day_of_week: "",
    start_time: "",
    end_time: "",
    is_available: true,
  });

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // FETCH DOCTOR + AVAILABILITY
  // ==========================================

  const fetchData = async () => {
    try {
      const [
        profileResponse,
        doctorsResponse,
        availabilityResponse,
      ] = await Promise.all([
        api.get("auth/profile/"),
        api.get("doctors/"),
        api.get("doctor-availability/"),
      ]);

      const profile =
        profileResponse.data;

      const doctors = Array.isArray(
        doctorsResponse.data
      )
        ? doctorsResponse.data
        : doctorsResponse.data.results || [];

      const currentDoctor =
        doctors.find(
          (doctor) =>
            doctor.username ===
            profile.username
        );

      if (!currentDoctor) {
        setError(
          "Doctor profile not found."
        );
        return;
      }

      setDoctorId(currentDoctor.id);

      const availabilityData =
        Array.isArray(
          availabilityResponse.data
        )
          ? availabilityResponse.data
          : availabilityResponse.data.results || [];

      setAvailability(
        availabilityData
      );
    } catch (err) {
      console.error(
        "Doctor availability error:",
        err
      );

      setError(
        "Unable to load availability."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData({
      day_of_week: "",
      start_time: "",
      end_time: "",
      is_available: true,
    });

    setEditingSlot(null);
    setFormError("");
  };

  // ==========================================
  // ADD
  // ==========================================

  const handleAdd = () => {
    resetForm();
    setSuccessMessage("");
    setShowForm(true);
  };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = (slot) => {
    setEditingSlot(slot);
    setShowForm(true);

    setFormError("");
    setSuccessMessage("");

    setFormData({
      day_of_week:
        String(slot.day_of_week),

      start_time:
        slot.start_time
          ? slot.start_time.slice(0, 5)
          : "",

      end_time:
        slot.end_time
          ? slot.end_time.slice(0, 5)
          : "",

      is_available:
        slot.is_available,
    });
  };

  // ==========================================
  // SAVE
  // ==========================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (
      formData.day_of_week === ""
    ) {
      setFormError(
        "Please select a day."
      );
      return;
    }

    if (
      !formData.start_time ||
      !formData.end_time
    ) {
      setFormError(
        "Please select start and end time."
      );
      return;
    }

    if (
      formData.start_time >=
      formData.end_time
    ) {
      setFormError(
        "Start time must be before end time."
      );
      return;
    }

    try {
      const data = {
        doctor: doctorId,

        day_of_week: Number(
          formData.day_of_week
        ),

        start_time:
          formData.start_time,

        end_time:
          formData.end_time,

        is_available:
          formData.is_available,
      };

      if (editingSlot) {
        const response =
          await api.put(
            `doctor-availability/${editingSlot.id}/`,
            data
          );

        setAvailability(
          availability.map(
            (slot) =>
              slot.id ===
              editingSlot.id
                ? response.data
                : slot
          )
        );

        setSuccessMessage(
          "Availability updated successfully."
        );
      } else {
        const response =
          await api.post(
            "doctor-availability/",
            data
          );

        setAvailability([
          ...availability,
          response.data,
        ]);

        setSuccessMessage(
          "Availability added successfully."
        );
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error(
        "Availability save error:",
        err
      );

      if (err.response?.data) {
        setFormError(
          Object.values(
            err.response.data
          )
            .flat()
            .join(" ")
        );
      } else {
        setFormError(
          "Unable to save availability."
        );
      }
    }
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (
    slotId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this availability slot?"
      );

    if (!confirmed) {
      return;
    }

    setFormError("");
    setSuccessMessage("");

    try {
      await api.delete(
        `doctor-availability/${slotId}/`
      );

      setAvailability(
        availability.filter(
          (slot) =>
            slot.id !== slotId
        )
      );

      setSuccessMessage(
        "Availability deleted successfully."
      );
    } catch (err) {
      console.error(
        "Availability delete error:",
        err
      );

      if (err.response?.data) {
        setFormError(
          Object.values(
            err.response.data
          )
            .flat()
            .join(" ")
        );
      } else {
        setFormError(
          "Unable to delete availability."
        );
      }
    }
  };

  // ==========================================
  // CANCEL
  // ==========================================

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="doctor-availability-loading">
        <div className="doctor-availability-spinner"></div>

        <h2>
          Loading availability...
        </h2>

        <p>
          Please wait while we load your schedule.
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="doctor-availability-error">
        <div className="doctor-availability-error-icon">
          !
        </div>

        <h2>
          Unable to load availability
        </h2>

        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="doctor-availability-page">

      {/* ========================================
          HEADER
      ======================================== */}

      <section className="doctor-availability-header">

        <div>

          <span className="doctor-availability-eyebrow">
            DOCTOR SCHEDULE
          </span>

          <h1>
            My Availability
          </h1>

          <p>
            Manage your available working hours
            for patient appointments.
          </p>

        </div>

        <div className="doctor-availability-header-icon">
          🗓️
        </div>

      </section>

      {/* ========================================
          SUMMARY
      ======================================== */}

      <section className="doctor-availability-summary">

        <div className="doctor-availability-summary-card">

          <div className="doctor-availability-summary-icon">
            🕐
          </div>

          <div>
            <span>
              Total Slots
            </span>

            <strong>
              {availability.length}
            </strong>
          </div>

        </div>

        <div className="doctor-availability-summary-card">

          <div className="doctor-availability-summary-icon">
            ✓
          </div>

          <div>
            <span>
              Available
            </span>

            <strong>
              {
                availability.filter(
                  (slot) =>
                    slot.is_available
                ).length
              }
            </strong>
          </div>

        </div>

        <div className="doctor-availability-summary-card">

          <div className="doctor-availability-summary-icon">
            ⏸
          </div>

          <div>
            <span>
              Not Available
            </span>

            <strong>
              {
                availability.filter(
                  (slot) =>
                    !slot.is_available
                ).length
              }
            </strong>
          </div>

        </div>

      </section>

      {/* ========================================
          MESSAGES
      ======================================== */}

      {successMessage && (
        <div className="doctor-availability-success">
          ✓ {successMessage}
        </div>
      )}

      {formError &&
        !showForm && (
          <div className="doctor-availability-form-error">
            {formError}
          </div>
        )}

      {/* ========================================
          ADD BUTTON
      ======================================== */}

      <div className="doctor-availability-actions">

        <button
          type="button"
          className="doctor-availability-add-button"
          onClick={() => {
            if (showForm) {
              handleCancel();
            } else {
              handleAdd();
            }
          }}
        >
          {showForm
            ? "✕ Cancel"
            : "+ Add Availability"}
        </button>

      </div>

      {/* ========================================
          FORM
      ======================================== */}

      {showForm && (
        <section className="doctor-availability-form-card">

          <div className="doctor-availability-form-header">

            <div>
              <h2>
                {editingSlot
                  ? "Edit Availability"
                  : "Add Availability"}
              </h2>

              <p>
                Set the day and working hours
                for appointments.
              </p>
            </div>

          </div>

          {formError && (
            <div className="doctor-availability-form-error">
              {formError}
            </div>
          )}

          <form
            className="doctor-availability-form"
            onSubmit={handleSubmit}
          >

            <div className="doctor-availability-field">

              <label>
                Day
              </label>

              <select
                name="day_of_week"
                value={
                  formData.day_of_week
                }
                onChange={
                  handleChange
                }
                required
              >
                <option value="">
                  Select Day
                </option>

                {days.map(
                  (
                    day,
                    index
                  ) => (
                    <option
                      key={day}
                      value={index}
                    >
                      {day}
                    </option>
                  )
                )}
              </select>

            </div>

            <div className="doctor-availability-field">

              <label>
                Start Time
              </label>

              <input
                type="time"
                name="start_time"
                value={
                  formData.start_time
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>

            <div className="doctor-availability-field">

              <label>
                End Time
              </label>

              <input
                type="time"
                name="end_time"
                value={
                  formData.end_time
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>

            <label className="doctor-availability-toggle">

              <input
                type="checkbox"
                name="is_available"
                checked={
                  formData.is_available
                }
                onChange={
                  handleChange
                }
              />

              <span>
                Available for appointments
              </span>

            </label>

            <div className="doctor-availability-form-actions">

              <button
                type="submit"
                className="doctor-availability-save-button"
              >
                {editingSlot
                  ? "Save Changes"
                  : "Add Availability"}
              </button>

              <button
                type="button"
                className="doctor-availability-cancel-button"
                onClick={
                  handleCancel
                }
              >
                Cancel
              </button>

            </div>

          </form>

        </section>
      )}

      {/* ========================================
          AVAILABILITY TABLE
      ======================================== */}

      <section className="doctor-availability-table-card">

        <div className="doctor-availability-table-header">

          <div>
            <h2>
              Weekly Schedule
            </h2>

            <p>
              Your configured appointment
              availability.
            </p>
          </div>

          <span>
            {availability.length} Slots
          </span>

        </div>

        {availability.length === 0 ? (

          <div className="doctor-availability-empty">

            <div className="doctor-availability-empty-icon">
              🗓️
            </div>

            <h3>
              No Availability Slots
            </h3>

            <p>
              Add your working hours to allow
              patients to book appointments.
            </p>

          </div>

        ) : (

          <div className="doctor-availability-table-wrapper">

            <table className="doctor-availability-table">

              <thead>

                <tr>
                  <th>Day</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {availability
                  .slice()
                  .sort(
                    (a, b) =>
                      Number(
                        a.day_of_week
                      ) -
                      Number(
                        b.day_of_week
                      )
                  )
                  .map(
                    (slot) => (

                      <tr
                        key={slot.id}
                      >

                        <td>
                          <strong>
                            {slot.day_name ||
                              days[
                                slot.day_of_week
                              ] ||
                              "-"}
                          </strong>
                        </td>

                        <td>
                          {slot.start_time ||
                            "-"}
                        </td>

                        <td>
                          {slot.end_time ||
                            "-"}
                        </td>

                        <td>

                          <span
                            className={
                              slot.is_available
                                ? "doctor-availability-status available"
                                : "doctor-availability-status unavailable"
                            }
                          >
                            <span>
                              {slot.is_available
                                ? "●"
                                : "●"}
                            </span>

                            {slot.is_available
                              ? "Available"
                              : "Not Available"}
                          </span>

                        </td>

                        <td>

                          <div className="doctor-availability-row-actions">

                            <button
                              type="button"
                              className="doctor-availability-edit-button"
                              onClick={() =>
                                handleEdit(
                                  slot
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="doctor-availability-delete-button"
                              onClick={() =>
                                handleDelete(
                                  slot.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}

export default DoctorAvailability;