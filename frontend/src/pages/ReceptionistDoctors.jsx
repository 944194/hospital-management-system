import { useEffect, useState } from "react";
import api from "../services/api";

function ReceptionistDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [departments, setDepartments] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const emptyForm = {
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    aadhaar_number: "",
    department: "",
    specialization: "",
    qualification: "",
    license_number: "",
    experience_years: "",
    consultation_fee: "",
  };

  const createEmptyAvailability = () => ({
    0: {
      enabled: false,
      start_time: "",
      end_time: "",
    },
    1: {
      enabled: false,
      start_time: "",
      end_time: "",
    },
    2: {
      enabled: false,
      start_time: "",
      end_time: "",
    },
    3: {
      enabled: false,
      start_time: "",
      end_time: "",
    },
    4: {
      enabled: false,
      start_time: "",
      end_time: "",
    },
    5: {
      enabled: false,
      start_time: "",
      end_time: "",
    },
    6: {
      enabled: false,
      start_time: "",
      end_time: "",
    },
  });

  const [formData, setFormData] = useState(emptyForm);

  const [availability, setAvailability] =
    useState(createEmptyAvailability());

  useEffect(() => {
    fetchData();
  }, []);

  // --------------------------------
  // HELPERS
  // --------------------------------

  const getData = (response) => {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.results)) {
      return response.data.results;
    }

    return [];
  };

  const getErrorMessage = (err, fallback) => {
    if (err.response?.data) {
      const data = err.response.data;

      if (typeof data === "string") {
        return data;
      }

      return Object.values(data)
        .flat()
        .join(" ");
    }

    return err.message || fallback;
  };

  const filterDoctors = (doctorList, searchValue) => {
    const value = searchValue.trim().toLowerCase();

    if (!value) {
      return doctorList;
    }

    return doctorList.filter((doctor) => {
      const doctorId =
        doctor.doctor_id?.toLowerCase() || "";

      return doctorId.includes(value);
    });
  };

  // --------------------------------
  // FETCH DATA
  // --------------------------------

  const fetchData = async () => {
    try {
      const [
        doctorsResponse,
        departmentsResponse,
        availabilityResponse,
      ] = await Promise.all([
        api.get("doctors/"),
        api.get("departments/"),
        api.get("doctor-availability/"),
      ]);

      const doctorData = getData(doctorsResponse);
      const departmentData =
        getData(departmentsResponse);
      const availabilityData =
        getData(availabilityResponse);

      const sortedDoctors = [...doctorData].sort(
        (a, b) => Number(b.id) - Number(a.id)
      );

      setDoctors(sortedDoctors);
      setFilteredDoctors(
        filterDoctors(sortedDoctors, searchTerm)
      );

      setDepartments(departmentData);
      setAvailabilities(availabilityData);
    } catch (err) {
      console.error("Doctors error:", err);
      setError("Unable to load doctors.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // SEARCH
  // --------------------------------

  const handleSearch = (event) => {
    const value = event.target.value;

    setSearchTerm(value);
    setFilteredDoctors(
      filterDoctors(doctors, value)
    );
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilteredDoctors(doctors);
  };

  // --------------------------------
  // FORM CHANGE
  // --------------------------------

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  // --------------------------------
  // AVAILABILITY CHANGE
  // --------------------------------

  const handleAvailabilityChange = (
    day,
    field,
    value
  ) => {
    setAvailability((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        [field]: value,
      },
    }));
  };

  // --------------------------------
  // GET DOCTOR AVAILABILITY
  // --------------------------------

  const getDoctorAvailability = (doctorId) => {
    return availabilities.filter(
      (item) =>
        String(item.doctor) === String(doctorId)
    );
  };

  // --------------------------------
  // FORMAT TIME
  // --------------------------------

  const formatTime = (time) => {
    if (!time) {
      return "";
    }

    const [hours, minutes] =
      time.slice(0, 5).split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --------------------------------
  // RESET AVAILABILITY
  // --------------------------------

  const resetAvailability = () => {
    setAvailability(
      createEmptyAvailability()
    );
  };

  // --------------------------------
  // CREATE AVAILABILITY
  // --------------------------------

  const createAvailability = async (doctorId) => {
    const enabledDays = Object.keys(
      availability
    ).filter(
      (day) => availability[day].enabled
    );

    for (const day of enabledDays) {
      const slot = availability[day];

      if (
        !slot.start_time ||
        !slot.end_time
      ) {
        throw new Error(
          `${days[day]} requires both start and end time.`
        );
      }

      if (
        slot.start_time >=
        slot.end_time
      ) {
        throw new Error(
          `${days[day]} start time must be before end time.`
        );
      }

      await api.post(
        "doctor-availability/",
        {
          doctor: doctorId,
          day_of_week: Number(day),
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: true,
        }
      );
    }
  };

  // --------------------------------
  // CREATE DOCTOR
  // --------------------------------

  const handleCreate = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    try {
      const response = await api.post(
        "doctors/",
        {
          ...formData,
          experience_years: Number(
            formData.experience_years
          ),
          consultation_fee: Number(
            formData.consultation_fee
          ),
        }
      );

      const createdDoctor = response.data;

      await createAvailability(
        createdDoctor.id
      );

      const availabilityResponse =
        await api.get(
          "doctor-availability/"
        );

      const updatedAvailabilities =
        getData(availabilityResponse);

      setAvailabilities(
        updatedAvailabilities
      );

      const updatedDoctors = [
        createdDoctor,
        ...doctors,
      ].sort(
        (a, b) => Number(b.id) - Number(a.id)
      );

      setDoctors(updatedDoctors);

      setFilteredDoctors(
        filterDoctors(
          updatedDoctors,
          searchTerm
        )
      );

      setFormData(emptyForm);
      resetAvailability();
      setShowForm(false);

      setSuccessMessage(
        "Doctor and availability created successfully."
      );
    } catch (err) {
      console.error(
        "Create doctor error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to create doctor."
        )
      );
    }
  };

  // --------------------------------
  // START EDITING
  // --------------------------------

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);

    setShowForm(true);
    setFormError("");
    setSuccessMessage("");

    setFormData({
      username: doctor.username || "",
      password: "",
      first_name: doctor.first_name || "",
      last_name: doctor.last_name || "",
      email: doctor.email || "",
      mobile_number:
        doctor.mobile_number || "",
      aadhaar_number:
        doctor.aadhaar_number || "",
      department: doctor.department || "",
      specialization:
        doctor.specialization || "",
      qualification:
        doctor.qualification || "",
      license_number:
        doctor.license_number || "",
      experience_years:
        doctor.experience_years ?? "",
      consultation_fee:
        doctor.consultation_fee ?? "",
    });

    const doctorAvailability =
      getDoctorAvailability(doctor.id);

    const updatedAvailability =
      createEmptyAvailability();

    doctorAvailability.forEach((item) => {
      updatedAvailability[
        item.day_of_week
      ] = {
        enabled: item.is_available,
        start_time: item.start_time
          ? item.start_time.slice(0, 5)
          : "",
        end_time: item.end_time
          ? item.end_time.slice(0, 5)
          : "",
      };
    });

    setAvailability(
      updatedAvailability
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // --------------------------------
  // UPDATE DOCTOR
  // --------------------------------

  const handleUpdate = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    try {
      const updateData = {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        mobile_number:
          formData.mobile_number,
        aadhaar_number:
          formData.aadhaar_number,
        department: formData.department,
        specialization:
          formData.specialization,
        qualification:
          formData.qualification,
        license_number:
          formData.license_number,
        experience_years: Number(
          formData.experience_years
        ),
        consultation_fee: Number(
          formData.consultation_fee
        ),
      };

      if (
        formData.password.trim() !== ""
      ) {
        updateData.password =
          formData.password;
      }

      const response = await api.put(
        `doctors/${editingDoctor.id}/`,
        updateData
      );

      const existingAvailability =
        getDoctorAvailability(
          editingDoctor.id
        );

      for (const day of Object.keys(
        availability
      )) {
        const dayNumber = Number(day);
        const slot = availability[day];

        const existingSlot =
          existingAvailability.find(
            (item) =>
              Number(item.day_of_week) ===
              dayNumber
          );

        if (slot.enabled) {
          if (
            !slot.start_time ||
            !slot.end_time
          ) {
            throw new Error(
              `${days[dayNumber]} requires both start and end time.`
            );
          }

          if (
            slot.start_time >=
            slot.end_time
          ) {
            throw new Error(
              `${days[dayNumber]} start time must be before end time.`
            );
          }

          if (existingSlot) {
            await api.put(
              `doctor-availability/${existingSlot.id}/`,
              {
                doctor:
                  editingDoctor.id,
                day_of_week:
                  dayNumber,
                start_time:
                  slot.start_time,
                end_time:
                  slot.end_time,
                is_available: true,
              }
            );
          } else {
            await api.post(
              "doctor-availability/",
              {
                doctor:
                  editingDoctor.id,
                day_of_week:
                  dayNumber,
                start_time:
                  slot.start_time,
                end_time:
                  slot.end_time,
                is_available: true,
              }
            );
          }
        } else if (existingSlot) {
          await api.delete(
            `doctor-availability/${existingSlot.id}/`
          );
        }
      }

      const updatedDoctors =
        doctors
          .map((doctor) =>
            doctor.id ===
            editingDoctor.id
              ? response.data
              : doctor
          )
          .sort(
            (a, b) =>
              Number(b.id) - Number(a.id)
          );

      setDoctors(updatedDoctors);

      setFilteredDoctors(
        filterDoctors(
          updatedDoctors,
          searchTerm
        )
      );

      const availabilityResponse =
        await api.get(
          "doctor-availability/"
        );

      setAvailabilities(
        getData(availabilityResponse)
      );

      setEditingDoctor(null);
      setFormData(emptyForm);
      resetAvailability();
      setShowForm(false);

      setSuccessMessage(
        "Doctor and availability updated successfully."
      );
    } catch (err) {
      console.error(
        "Update doctor error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to update doctor."
        )
      );
    }
  };

  // --------------------------------
  // CANCEL FORM
  // --------------------------------

  const handleCancel = () => {
    setShowForm(false);
    setEditingDoctor(null);
    setFormData(emptyForm);
    resetAvailability();
    setFormError("");
  };

  // --------------------------------
  // OPEN CREATE FORM
  // --------------------------------

  const handleAddDoctor = () => {
    setEditingDoctor(null);
    setFormData(emptyForm);
    resetAvailability();
    setFormError("");
    setSuccessMessage("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // --------------------------------
  // LOADING
  // --------------------------------

  if (loading) {
    return (
      <div className="receptionist-doctors-page">
        <div className="receptionist-doctors-state">
          <div className="receptionist-doctors-spinner" />
          <p>Loading doctors...</p>
        </div>
      </div>
    );
  }

  // --------------------------------
  // ERROR
  // --------------------------------

  if (error) {
    return (
      <div className="receptionist-doctors-page">
        <div className="receptionist-doctors-state receptionist-doctors-error-state">
          <div className="receptionist-doctors-state-icon">
            !
          </div>

          <h2>Unable to load doctors</h2>

          <p>{error}</p>

          <button
            type="button"
            className="receptionist-doctors-retry-btn"
            onClick={() => {
              setLoading(true);
              setError("");
              fetchData();
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="receptionist-doctors-page">

      {/* HEADER */}

      <div className="receptionist-doctors-header">

        <div>
          <p className="receptionist-doctors-eyebrow">
            RECEPTIONIST PORTAL
          </p>

          <h1>Doctors</h1>

          <p className="receptionist-doctors-subtitle">
            View and manage hospital doctors,
            professional details, and
            availability.
          </p>
        </div>

        <div className="receptionist-doctors-header-actions">

          <div className="receptionist-doctors-count">
            <span>
              Total Doctors
            </span>

            <strong>
              {doctors.length}
            </strong>
          </div>

          <button
            type="button"
            className="receptionist-doctors-primary-btn"
            onClick={
              showForm
                ? handleCancel
                : handleAddDoctor
            }
          >
            <span>
              {showForm ? "×" : "+"}
            </span>

            {showForm
              ? "Close Form"
              : "Add Doctor"}
          </button>

        </div>

      </div>

      {/* SUCCESS */}

      {successMessage && (
        <div className="receptionist-doctors-success">
          <span>✓</span>
          {successMessage}
        </div>
      )}

      {/* SEARCH */}

      <div className="receptionist-doctors-search-card">

        <div className="receptionist-doctors-search-header">

          <div>
            <h2>Find a Doctor</h2>

            <p>
              Search using the Doctor ID.
            </p>
          </div>

          {searchTerm && (
            <button
              type="button"
              className="receptionist-doctors-clear-btn"
              onClick={clearSearch}
            >
              Clear
            </button>
          )}

        </div>

        <div className="receptionist-doctors-search-box">

          <span>⌕</span>

          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by Doctor ID..."
          />

        </div>

      </div>

      {/* FORM */}

      {showForm && (
        <div className="receptionist-doctors-form-card">

          <div className="receptionist-doctors-section-header">

            <div>
              <p className="receptionist-doctors-section-eyebrow">
                {editingDoctor
                  ? "UPDATE PROFILE"
                  : "NEW DOCTOR"}
              </p>

              <h2>
                {editingDoctor
                  ? "Edit Doctor"
                  : "Create Doctor"}
              </h2>
            </div>

            <button
              type="button"
              className="receptionist-doctors-close-btn"
              onClick={handleCancel}
            >
              ×
            </button>

          </div>

          {formError && (
            <div className="receptionist-doctors-form-error">
              <span>!</span>
              {formError}
            </div>
          )}

          <form
            onSubmit={
              editingDoctor
                ? handleUpdate
                : handleCreate
            }
          >

            {/* ACCOUNT */}

            <div className="receptionist-doctors-form-section">

              <div className="receptionist-doctors-form-section-title">
                <span>01</span>

                <div>
                  <h3>Account Information</h3>
                  <p>
                    Login and personal details
                  </p>
                </div>
              </div>

              <div className="receptionist-doctors-form-grid">

                <div className="receptionist-doctors-form-group">
                  <label>Username</label>

                  <input
                    type="text"
                    name="username"
                    value={
                      formData.username
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>

                <div className="receptionist-doctors-form-group">
                  <label>
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={
                      formData.password
                    }
                    onChange={
                      handleChange
                    }
                    minLength="8"
                    required={
                      !editingDoctor
                    }
                    placeholder={
                      editingDoctor
                        ? "Leave blank to keep current"
                        : "Minimum 8 characters"
                    }
                  />

                  {editingDoctor && (
                    <small>
                      Leave blank to keep
                      the current password.
                    </small>
                  )}
                </div>

                <div className="receptionist-doctors-form-group">
                  <label>
                    First Name
                  </label>

                  <input
                    type="text"
                    name="first_name"
                    value={
                      formData.first_name
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>

                <div className="receptionist-doctors-form-group">
                  <label>
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="last_name"
                    value={
                      formData.last_name
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>

                <div className="receptionist-doctors-form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div className="receptionist-doctors-form-group">
                  <label>
                    Mobile Number
                  </label>

                  <input
                    type="text"
                    name="mobile_number"
                    value={
                      formData.mobile_number
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div className="receptionist-doctors-form-group">
                  <label>
                    Aadhaar Number
                  </label>

                  <input
                    type="text"
                    name="aadhaar_number"
                    value={
                      formData.aadhaar_number
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

              </div>

            </div>

            {/* PROFESSIONAL */}

            <div className="receptionist-doctors-form-section">

              <div className="receptionist-doctors-form-section-title">
                <span>02</span>

                <div>
                  <h3>
                    Professional Information
                  </h3>

                  <p>
                    Doctor's professional
                    details
                  </p>
                </div>
              </div>

              <div className="receptionist-doctors-form-grid">

                <div className="receptionist-doctors-form-group">
                  <label>
                    Department
                  </label>

                  <select
                    name="department"
                    value={
                      formData.department
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >
                    <option value="">
                      Select Department
                    </option>

                    {departments.map(
                      (department) => (
                        <option
                          key={
                            department.id
                          }
                          value={
                            department.id
                          }
                        >
                          {
                            department.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="receptionist-doctors-form-group">
                  <label>
                    Specialization
                  </label>

                  <input
                    type="text"
                    name="specialization"
                    value={
                      formData.specialization
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>

                <div className="receptionist-doctors-form-group">
                  <label>
                    Qualification
                  </label>

                  <input
                    type="text"
                    name="qualification"
                    value={
                      formData.qualification
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>

                <div className="receptionist-doctors-form-group">
                  <label>
                    License Number
                  </label>

                  <input
                    type="text"
                    name="license_number"
                    value={
                      formData.license_number
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>

                <div className="receptionist-doctors-form-group">
                  <label>
                    Experience (Years)
                  </label>

                  <input
                    type="number"
                    name="experience_years"
                    value={
                      formData.experience_years
                    }
                    onChange={
                      handleChange
                    }
                    min="0"
                    required
                  />
                </div>

                <div className="receptionist-doctors-form-group">
                  <label>
                    Consultation Fee
                  </label>

                  <div className="receptionist-doctors-fee-input">
                    <span>₹</span>

                    <input
                      type="number"
                      name="consultation_fee"
                      value={
                        formData.consultation_fee
                      }
                      onChange={
                        handleChange
                      }
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* AVAILABILITY */}

            <div className="receptionist-doctors-form-section">

              <div className="receptionist-doctors-form-section-title">
                <span>03</span>

                <div>
                  <h3>
                    Doctor Availability
                  </h3>

                  <p>
                    Select available days
                    and working hours.
                  </p>
                </div>
              </div>

              <div className="receptionist-doctors-availability-grid">

                {days.map(
                  (
                    dayName,
                    index
                  ) => {
                    const slot =
                      availability[index];

                    return (
                      <div
                        key={dayName}
                        className={`receptionist-doctors-day-card ${
                          slot.enabled
                            ? "active"
                            : ""
                        }`}
                      >

                        <label className="receptionist-doctors-day-toggle">

                          <input
                            type="checkbox"
                            checked={
                              slot.enabled
                            }
                            onChange={(
                              event
                            ) =>
                              handleAvailabilityChange(
                                index,
                                "enabled",
                                event.target
                                  .checked
                              )
                            }
                          />

                          <span className="receptionist-doctors-checkbox" />

                          <strong>
                            {dayName}
                          </strong>

                        </label>

                        {slot.enabled && (
                          <div className="receptionist-doctors-time-row">

                            <div>
                              <label>
                                Start
                              </label>

                              <input
                                type="time"
                                value={
                                  slot.start_time
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleAvailabilityChange(
                                    index,
                                    "start_time",
                                    event.target
                                      .value
                                  )
                                }
                                required
                              />
                            </div>

                            <span className="receptionist-doctors-time-separator">
                              →
                            </span>

                            <div>
                              <label>
                                End
                              </label>

                              <input
                                type="time"
                                value={
                                  slot.end_time
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleAvailabilityChange(
                                    index,
                                    "end_time",
                                    event.target
                                      .value
                                  )
                                }
                                required
                              />
                            </div>

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>

            </div>

            {/* FORM ACTIONS */}

            <div className="receptionist-doctors-form-actions">

              <button
                type="button"
                className="receptionist-doctors-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="receptionist-doctors-save-btn"
              >
                {editingDoctor
                  ? "Save Changes"
                  : "Create Doctor"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* TABLE */}

      <div className="receptionist-doctors-table-section">

        <div className="receptionist-doctors-table-header">

          <div>
            <h2>Doctor Directory</h2>

            <p>
              {filteredDoctors.length}{" "}
              doctor
              {filteredDoctors.length !==
              1
                ? "s"
                : ""}{" "}
              displayed
            </p>
          </div>

        </div>

        {filteredDoctors.length === 0 ? (

          <div className="receptionist-doctors-empty">

            <div className="receptionist-doctors-empty-icon">
              ✚
            </div>

            <h3>
              {searchTerm
                ? "No doctor found"
                : "No doctors found"}
            </h3>

            <p>
              {searchTerm
                ? "Try searching with another Doctor ID."
                : "Add a doctor to get started."}
            </p>

            {searchTerm && (
              <button
                type="button"
                className="receptionist-doctors-clear-btn"
                onClick={clearSearch}
              >
                Clear Search
              </button>
            )}

          </div>

        ) : (

          <div className="receptionist-doctors-table-wrapper">

            <table className="receptionist-doctors-table">

              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Contact</th>
                  <th>Department</th>
                  <th>Professional</th>
                  <th>Experience</th>
                  <th>Fee</th>
                  <th>Availability</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredDoctors.map(
                  (doctor) => {
                    const doctorAvailability =
                      getDoctorAvailability(
                        doctor.id
                      );

                    const activeSlots =
                      doctorAvailability.filter(
                        (item) =>
                          item.is_available
                      );

                    return (
                      <tr
                        key={
                          doctor.id
                        }
                      >

                        {/* DOCTOR */}

                        <td>
                          <div className="receptionist-doctor-person">

                            <div className="receptionist-doctor-avatar">
                              {(
                                doctor.first_name ||
                                "D"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                Dr.{" "}
                                {
                                  doctor.first_name
                                }{" "}
                                {
                                  doctor.last_name
                                }
                              </strong>

                              <span className="receptionist-doctor-id">
                                {
                                  doctor.doctor_id
                                }
                              </span>

                              <span className="receptionist-doctor-username">
                                @
                                {
                                  doctor.username
                                }
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* CONTACT */}

                        <td>
                          <div className="receptionist-doctor-contact">

                            <span>
                              {doctor.email ||
                                "No email"}
                            </span>

                            <span>
                              {doctor.mobile_number ||
                                "No mobile"}
                            </span>

                          </div>
                        </td>

                        {/* DEPARTMENT */}

                        <td>
                          <span className="receptionist-doctor-department">
                            {
                              doctor.department_name
                            }
                          </span>
                        </td>

                        {/* PROFESSIONAL */}

                        <td>
                          <div className="receptionist-doctor-professional">

                            <strong>
                              {
                                doctor.specialization
                              }
                            </strong>

                            <span>
                              {
                                doctor.qualification
                              }
                            </span>

                            <small>
                              License:{" "}
                              {
                                doctor.license_number
                              }
                            </small>

                          </div>
                        </td>

                        {/* EXPERIENCE */}

                        <td>
                          <span className="receptionist-doctor-experience">
                            {
                              doctor.experience_years
                            }{" "}
                            yrs
                          </span>
                        </td>

                        {/* FEE */}

                        <td>
                          <strong className="receptionist-doctor-fee">
                            ₹
                            {
                              doctor.consultation_fee
                            }
                          </strong>
                        </td>

                        {/* AVAILABILITY */}

                        <td>

                          {activeSlots.length ===
                          0 ? (

                            <span className="receptionist-doctor-not-set">
                              Not Set
                            </span>

                          ) : (

                            <div className="receptionist-doctor-availability">

                              {days.map(
                                (
                                  dayName,
                                  index
                                ) => {

                                  const slots =
                                    doctorAvailability.filter(
                                      (
                                        item
                                      ) =>
                                        Number(
                                          item.day_of_week
                                        ) ===
                                          index &&
                                        item.is_available
                                    );

                                  if (
                                    slots.length ===
                                    0
                                  ) {
                                    return null;
                                  }

                                  return (
                                    <div
                                      key={
                                        dayName
                                      }
                                      className="receptionist-doctor-slot"
                                    >

                                      <strong>
                                        {dayName.slice(
                                          0,
                                          3
                                        )}
                                      </strong>

                                      <span>
                                        {slots
                                          .map(
                                            (
                                              slot
                                            ) =>
                                              `${formatTime(
                                                slot.start_time
                                              )} - ${formatTime(
                                                slot.end_time
                                              )}`
                                          )
                                          .join(
                                            ", "
                                          )}
                                      </span>

                                    </div>
                                  );
                                }
                              )}

                            </div>
                          )}

                        </td>

                        {/* ACTION */}

                        <td>
                          <button
                            type="button"
                            className="receptionist-doctors-edit-btn"
                            onClick={() =>
                              handleEdit(
                                doctor
                              )
                            }
                          >
                            <span>✎</span>
                            Edit
                          </button>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default ReceptionistDoctors;