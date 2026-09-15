import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminDoctors.css";

function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingDoctor, setEditingDoctor] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [roomAssignmentFilter, setRoomAssignmentFilter] =
    useState("");
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");

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
    consultation_room: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const createEmptyAvailability = () => ({
    0: { enabled: false, start_time: "", end_time: "" },
    1: { enabled: false, start_time: "", end_time: "" },
    2: { enabled: false, start_time: "", end_time: "" },
    3: { enabled: false, start_time: "", end_time: "" },
    4: { enabled: false, start_time: "", end_time: "" },
    5: { enabled: false, start_time: "", end_time: "" },
    6: { enabled: false, start_time: "", end_time: "" },
  });

  const [availability, setAvailability] = useState(
    createEmptyAvailability()
  );

  useEffect(() => {
    fetchData();
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

    if (data.detail) {
      return data.detail;
    }

    if (data.error) {
      return data.error;
    }

    if (typeof data === "object") {
      return Object.entries(data)
        .map(([field, messages]) => {
          const text = Array.isArray(messages)
            ? messages.join(", ")
            : messages;

          return `${field}: ${text}`;
        })
        .join(" | ");
    }

    return fallback;
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        doctorsResponse,
        departmentsResponse,
        availabilityResponse,
        roomsResponse,
      ] = await Promise.all([
        api.get("doctors/"),
        api.get("departments/"),
        api.get("doctor-availability/"),
        api.get("rooms/"),
      ]);

      setDoctors(getData(doctorsResponse));
      setDepartments(getData(departmentsResponse));
      setAvailabilities(getData(availabilityResponse));
      setRooms(getData(roomsResponse));

      setError("");
    } catch (err) {
      console.error("Doctors error:", err);
      setError(
        getErrorMessage(
          err,
          "Unable to load doctors."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

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

  const getDoctorAvailability = (doctorId) => {
    return availabilities.filter(
      (item) =>
        String(item.doctor) ===
        String(doctorId)
    );
  };

  const formatTime = (time) => {
    if (!time) {
      return "";
    }

    const [hours, minutes] = time
      .slice(0, 5)
      .split(":");

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

  const filteredDoctors = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return [...doctors]
      .filter((doctor) => {
        if (search) {
          const values = [
            doctor.doctor_id,
            doctor.first_name,
            doctor.last_name,
            `${doctor.first_name || ""} ${
              doctor.last_name || ""
            }`,
            doctor.username,
            doctor.email,
            doctor.mobile_number,
            doctor.license_number,
            doctor.specialization,
            doctor.qualification,
          ];

          const matchesSearch = values.some(
            (value) =>
              String(value || "")
                .toLowerCase()
                .includes(search)
          );

          if (!matchesSearch) {
            return false;
          }
        }

        if (
          departmentFilter &&
          String(doctor.department || "") !==
            String(departmentFilter)
        ) {
          return false;
        }

        if (
          roomFilter &&
          String(
            doctor.consultation_room || ""
          ) !== String(roomFilter)
        ) {
          return false;
        }

        if (
          roomAssignmentFilter ===
          "ASSIGNED" &&
          !doctor.consultation_room
        ) {
          return false;
        }

        if (
          roomAssignmentFilter ===
          "NOT_ASSIGNED" &&
          doctor.consultation_room
        ) {
          return false;
        }

        const experience = Number(
          doctor.experience_years || 0
        );

        if (
          minExperience !== "" &&
          experience < Number(minExperience)
        ) {
          return false;
        }

        if (
          maxExperience !== "" &&
          experience > Number(maxExperience)
        ) {
          return false;
        }

        const fee = Number(
          doctor.consultation_fee || 0
        );

        if (
          minFee !== "" &&
          fee < Number(minFee)
        ) {
          return false;
        }

        if (
          maxFee !== "" &&
          fee > Number(maxFee)
        ) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          Number(b.id) - Number(a.id)
      );
  }, [
    doctors,
    searchTerm,
    departmentFilter,
    roomFilter,
    roomAssignmentFilter,
    minExperience,
    maxExperience,
    minFee,
    maxFee,
  ]);

  const doctorStats = useMemo(() => {
    const assignedRooms = doctors.filter(
      (doctor) => doctor.consultation_room
    ).length;

    const totalExperience = doctors.reduce(
      (total, doctor) =>
        total +
        Number(doctor.experience_years || 0),
      0
    );

    const averageExperience =
      doctors.length > 0
        ? (
            totalExperience / doctors.length
          ).toFixed(1)
        : "0";

    return {
      total: doctors.length,
      assignedRooms,
      unassignedRooms:
        doctors.length - assignedRooms,
      averageExperience,
    };
  }, [doctors]);

  const clearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setRoomFilter("");
    setRoomAssignmentFilter("");
    setMinExperience("");
    setMaxExperience("");
    setMinFee("");
    setMaxFee("");
  };

  const getAvailableConsultationRooms =
    () => {
      if (!formData.department) {
        return [];
      }

      return rooms
        .filter((room) => {
          const isConsultationRoom =
            room.room_type === "CONSULTATION";

          const isActive =
            room.status === "ACTIVE";

          const sameDepartment =
            String(room.department) ===
            String(formData.department);

          const assignedDoctor =
            room.assigned_doctor;

          const isAvailable =
            !assignedDoctor ||
            String(assignedDoctor) ===
              String(editingDoctor?.id);

          return (
            isConsultationRoom &&
            isActive &&
            sameDepartment &&
            isAvailable
          );
        })
        .sort((a, b) =>
          String(a.room_number).localeCompare(
            String(b.room_number)
          )
        );
    };

  const createAvailability = async (
    doctorId
  ) => {
    const enabledDays = Object.keys(
      availability
    ).filter(
      (day) =>
        availability[day].enabled
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    try {
      const response = await api.post(
        "doctors/",
        {
          ...formData,
          consultation_room: undefined,
          experience_years: Number(
            formData.experience_years
          ),
          consultation_fee: Number(
            formData.consultation_fee
          ),
        }
      );

      const createdDoctor =
        response.data;

      await createAvailability(
        createdDoctor.id
      );

      setDoctors((currentDoctors) => [
        ...currentDoctors,
        createdDoctor,
      ]);

      const availabilityResponse =
        await api.get(
          "doctor-availability/"
        );

      setAvailabilities(
        getData(availabilityResponse)
      );

      setFormData(emptyForm);
      setAvailability(
        createEmptyAvailability()
      );
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
      consultation_room:
        doctor.consultation_room ?? "",
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

    setTimeout(() => {
      document
        .querySelector(
          ".admin-doctors-form-card"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    try {
      const updateData = {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        mobile_number:
          formData.mobile_number || null,
        aadhaar_number:
          formData.aadhaar_number.trim() ||
          null,
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
        consultation_room:
          formData.consultation_room ||
          null,
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

      setDoctors((currentDoctors) =>
        currentDoctors.map((doctor) =>
          doctor.id === editingDoctor.id
            ? response.data
            : doctor
        )
      );

      const [
        availabilityResponse,
        roomsResponse,
      ] = await Promise.all([
        api.get("doctor-availability/"),
        api.get("rooms/"),
      ]);

      setAvailabilities(
        getData(availabilityResponse)
      );

      setRooms(getData(roomsResponse));

      setEditingDoctor(null);
      setFormData(emptyForm);
      setAvailability(
        createEmptyAvailability()
      );
      setShowForm(false);

      setSuccessMessage(
        "Doctor, consultation room and availability updated successfully."
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

  const handleDelete = async (
    doctorId
  ) => {
    const doctor = doctors.find(
      (item) => item.id === doctorId
    );

    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        doctor
          ? `${doctor.first_name} ${doctor.last_name}`
          : "this doctor"
      }?`
    );

    if (!confirmed) {
      return;
    }

    setFormError("");
    setSuccessMessage("");

    try {
      await api.delete(
        `doctors/${doctorId}/`
      );

      setDoctors((currentDoctors) =>
        currentDoctors.filter(
          (doctor) =>
            doctor.id !== doctorId
        )
      );

      setAvailabilities(
        (current) =>
          current.filter(
            (item) =>
              String(item.doctor) !==
              String(doctorId)
          )
      );

      const roomsResponse =
        await api.get("rooms/");

      setRooms(getData(roomsResponse));

      setSuccessMessage(
        "Doctor deleted successfully."
      );
    } catch (err) {
      console.error(
        "Delete doctor error:",
        err
      );

      setError("");

      setFormError(
        getErrorMessage(
          err,
          "Unable to delete doctor."
        )
      );
    }
  };

  const handleCancel = () => {
    setEditingDoctor(null);
    setFormData(emptyForm);
    setAvailability(
      createEmptyAvailability()
    );
    setShowForm(false);
    setFormError("");
  };

  const handleAddDoctor = () => {
    setEditingDoctor(null);
    setFormData(emptyForm);
    setAvailability(
      createEmptyAvailability()
    );
    setFormError("");
    setSuccessMessage("");
    setShowForm(true);

    setTimeout(() => {
      document
        .querySelector(
          ".admin-doctors-form-card"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  if (loading) {
    return (
      <div className="admin-doctors-page">
        <div className="admin-doctors-state">
          <div className="admin-doctors-spinner" />
          <p>Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-doctors-page">
        <div className="admin-doctors-state">
          <div className="admin-doctors-state-icon">
            !
          </div>

          <h2>
            Unable to load doctors
          </h2>

          <p>{error}</p>

          <button
            className="admin-doctors-retry-btn"
            onClick={fetchData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-doctors-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="admin-doctors-header">
        <div>
          <p className="admin-doctors-eyebrow">
            CLINICAL ADMINISTRATION
          </p>

          <h1>Doctors</h1>

          <p>
            Manage doctor profiles,
            consultation rooms and
            availability.
          </p>
        </div>

        <div className="admin-doctors-header-actions">
          <div className="admin-doctors-count">
            <span>Total Doctors</span>
            <strong>
              {doctors.length}
            </strong>
          </div>

          <button
            className="admin-doctors-primary-btn"
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

      {/* =========================
          MESSAGES
      ========================= */}

      {successMessage && (
        <div className="admin-doctors-success">
          <span>✓</span>
          {successMessage}
        </div>
      )}

      {formError && !showForm && (
        <div className="admin-doctors-error">
          <span>!</span>
          {formError}
        </div>
      )}

      {/* =========================
          SUMMARY
      ========================= */}

      <div className="admin-doctors-summary-grid">

        <div className="admin-doctors-summary-card">
          <div className="admin-doctors-summary-icon">
            DR
          </div>

          <div>
            <span>Total Doctors</span>
            <strong>
              {doctorStats.total}
            </strong>
            <small>Registered doctors</small>
          </div>
        </div>

        <div className="admin-doctors-summary-card">
          <div className="admin-doctors-summary-icon">
            RM
          </div>

          <div>
            <span>Room Assigned</span>
            <strong>
              {doctorStats.assignedRooms}
            </strong>
            <small>
              Consultation rooms
            </small>
          </div>
        </div>

        <div className="admin-doctors-summary-card">
          <div className="admin-doctors-summary-icon">
            --
          </div>

          <div>
            <span>Unassigned</span>
            <strong>
              {doctorStats.unassignedRooms}
            </strong>
            <small>
              Need room assignment
            </small>
          </div>
        </div>

        <div className="admin-doctors-summary-card">
          <div className="admin-doctors-summary-icon">
            EX
          </div>

          <div>
            <span>Avg. Experience</span>
            <strong>
              {doctorStats.averageExperience}
            </strong>
            <small>Years experience</small>
          </div>
        </div>

      </div>

      {/* =========================
          SEARCH & FILTERS
      ========================= */}

      <div className="admin-doctors-search-card">

        <div className="admin-doctors-search-header">
          <div>
            <p>DOCTOR DIRECTORY</p>
            <h2>Search & Filter Doctors</h2>
          </div>

          <span>
            {filteredDoctors.length} result
            {filteredDoctors.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        <div className="admin-doctors-search-box">
          <span>⌕</span>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search doctor ID, name, username, email, mobile, license..."
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() =>
                setSearchTerm("")
              }
            >
              ×
            </button>
          )}
        </div>

        <div className="admin-doctors-filter-grid">

          <div className="admin-doctors-filter-group">
            <label>Department</label>

            <select
              value={departmentFilter}
              onChange={(event) =>
                setDepartmentFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Departments
              </option>

              {departments.map(
                (department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="admin-doctors-filter-group">
            <label>
              Consultation Room
            </label>

            <select
              value={roomFilter}
              onChange={(event) =>
                setRoomFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Rooms
              </option>

              {rooms
                .filter(
                  (room) =>
                    room.room_type ===
                    "CONSULTATION"
                )
                .sort((a, b) =>
                  String(
                    a.room_number
                  ).localeCompare(
                    String(b.room_number)
                  )
                )
                .map((room) => (
                  <option
                    key={room.id}
                    value={room.id}
                  >
                    {room.room_number}
                  </option>
                ))}
            </select>
          </div>

          <div className="admin-doctors-filter-group">
            <label>Room Assignment</label>

            <select
              value={roomAssignmentFilter}
              onChange={(event) =>
                setRoomAssignmentFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Doctors
              </option>

              <option value="ASSIGNED">
                Room Assigned
              </option>

              <option value="NOT_ASSIGNED">
                Room Not Assigned
              </option>
            </select>
          </div>

          <div className="admin-doctors-filter-group small">
            <label>Min Experience</label>

            <input
              type="number"
              min="0"
              value={minExperience}
              onChange={(event) =>
                setMinExperience(
                  event.target.value
                )
              }
              placeholder="Years"
            />
          </div>

          <div className="admin-doctors-filter-group small">
            <label>Max Experience</label>

            <input
              type="number"
              min="0"
              value={maxExperience}
              onChange={(event) =>
                setMaxExperience(
                  event.target.value
                )
              }
              placeholder="Years"
            />
          </div>

          <div className="admin-doctors-filter-group">
            <label>Min Fee</label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={minFee}
              onChange={(event) =>
                setMinFee(
                  event.target.value
                )
              }
              placeholder="₹ Minimum"
            />
          </div>

          <div className="admin-doctors-filter-group">
            <label>Max Fee</label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={maxFee}
              onChange={(event) =>
                setMaxFee(
                  event.target.value
                )
              }
              placeholder="₹ Maximum"
            />
          </div>

          <button
            type="button"
            className="admin-doctors-clear-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        </div>

        <div className="admin-doctors-result-info">
          Showing{" "}
          <strong>
            {filteredDoctors.length}
          </strong>{" "}
          of{" "}
          <strong>
            {doctors.length}
          </strong>{" "}
          doctors
        </div>

      </div>

      {/* =========================
          CREATE / EDIT FORM
      ========================= */}

      {showForm && (
        <div className="admin-doctors-form-card">

          <div className="admin-doctors-form-header">
            <div>
              <p>
                {editingDoctor
                  ? "UPDATE DOCTOR"
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
              className="admin-doctors-close-btn"
              onClick={handleCancel}
            >
              ×
            </button>
          </div>

          <form
            onSubmit={
              editingDoctor
                ? handleUpdate
                : handleSubmit
            }
          >

            {formError && (
              <div className="admin-doctors-form-error">
                <span>!</span>
                {formError}
              </div>
            )}

            {/* ACCOUNT */}

            <div className="admin-doctors-form-section">

              <div className="admin-doctors-section-title">
                <span>01</span>

                <div>
                  <h3>
                    Account Information
                  </h3>

                  <p>
                    Login and personal account
                    details.
                  </p>
                </div>
              </div>

              <div className="admin-doctors-form-grid">

                <div className="admin-doctors-form-group">
                  <label>Username</label>

                  <input
                    type="text"
                    name="username"
                    value={
                      formData.username
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-doctors-form-group">
                  <label>
                    Password
                    {editingDoctor &&
                      " (leave blank to keep current)"}
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={
                      formData.password
                    }
                    onChange={handleChange}
                    minLength="8"
                    required={!editingDoctor}
                    placeholder={
                      editingDoctor
                        ? "Optional"
                        : "Minimum 8 characters"
                    }
                  />
                </div>

                <div className="admin-doctors-form-group">
                  <label>First Name</label>

                  <input
                    type="text"
                    name="first_name"
                    value={
                      formData.first_name
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-doctors-form-group">
                  <label>Last Name</label>

                  <input
                    type="text"
                    name="last_name"
                    value={
                      formData.last_name
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-doctors-form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={
                      formData.email
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="admin-doctors-form-group">
                  <label>Mobile Number</label>

                  <input
                    type="text"
                    name="mobile_number"
                    value={
                      formData.mobile_number
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-doctors-form-group">
                  <label>Aadhaar Number</label>

                  <input
                    type="text"
                    name="aadhaar_number"
                    value={
                      formData.aadhaar_number
                    }
                    onChange={handleChange}
                    maxLength="12"
                  />
                </div>

              </div>
            </div>

            {/* PROFESSIONAL */}

            <div className="admin-doctors-form-section">

              <div className="admin-doctors-section-title">
                <span>02</span>

                <div>
                  <h3>
                    Professional Information
                  </h3>

                  <p>
                    Department, qualification
                    and consultation details.
                  </p>
                </div>
              </div>

              <div className="admin-doctors-form-grid">

                <div className="admin-doctors-form-group">
                  <label>Department</label>

                  <select
                    name="department"
                    value={
                      formData.department
                    }
                    onChange={(event) => {
                      setFormData(
                        (previous) => ({
                          ...previous,
                          department:
                            event.target
                              .value,
                          consultation_room:
                            "",
                        })
                      );
                    }}
                    required
                  >
                    <option value="">
                      Select Department
                    </option>

                    {departments.map(
                      (department) => (
                        <option
                          key={department.id}
                          value={
                            department.id
                          }
                        >
                          {department.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="admin-doctors-form-group">
                  <label>Specialization</label>

                  <input
                    type="text"
                    name="specialization"
                    value={
                      formData.specialization
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-doctors-form-group">
                  <label>Qualification</label>

                  <input
                    type="text"
                    name="qualification"
                    value={
                      formData.qualification
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-doctors-form-group">
                  <label>License Number</label>

                  <input
                    type="text"
                    name="license_number"
                    value={
                      formData.license_number
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-doctors-form-group">
                  <label>
                    Experience (Years)
                  </label>

                  <input
                    type="number"
                    name="experience_years"
                    value={
                      formData.experience_years
                    }
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>

                <div className="admin-doctors-form-group">
                  <label>
                    Consultation Fee
                  </label>

                  <input
                    type="number"
                    name="consultation_fee"
                    value={
                      formData.consultation_fee
                    }
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {editingDoctor && (
                  <div className="admin-doctors-form-group full">
                    <label>
                      Consultation Room
                    </label>

                    <select
                      name="consultation_room"
                      value={
                        formData.consultation_room
                      }
                      onChange={handleChange}
                    >
                      <option value="">
                        No Consultation Room
                      </option>

                      {getAvailableConsultationRooms().map(
                        (room) => (
                          <option
                            key={room.id}
                            value={room.id}
                          >
                            {room.room_number}
                          </option>
                        )
                      )}
                    </select>

                    {!formData.department && (
                      <small>
                        Select a department to
                        see consultation rooms.
                      </small>
                    )}

                    {formData.department &&
                      getAvailableConsultationRooms()
                        .length === 0 && (
                        <small>
                          No active consultation
                          rooms are available for
                          this department.
                        </small>
                      )}

                    {formData.consultation_room && (
                      <small>
                        Current room:{" "}
                        <strong>
                          {
                            editingDoctor.consultation_room_number
                          }
                        </strong>
                      </small>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* AVAILABILITY */}

            <div className="admin-doctors-form-section">

              <div className="admin-doctors-section-title">
                <span>03</span>

                <div>
                  <h3>
                    Doctor Availability
                  </h3>

                  <p>
                    Set the days and timings when
                    this doctor accepts appointments.
                  </p>
                </div>
              </div>

              <div className="admin-doctors-availability-grid">

                {days.map(
                  (dayName, index) => {
                    const slot =
                      availability[index];

                    return (
                      <div
                        className={`admin-doctors-day-card ${
                          slot.enabled
                            ? "active"
                            : ""
                        }`}
                        key={dayName}
                      >

                        <div className="admin-doctors-day-header">

                          <label>
                            <input
                              type="checkbox"
                              checked={
                                slot.enabled
                              }
                              onChange={(event) =>
                                handleAvailabilityChange(
                                  index,
                                  "enabled",
                                  event.target
                                    .checked
                                )
                              }
                            />

                            <span>
                              {dayName}
                            </span>
                          </label>

                          <small>
                            {slot.enabled
                              ? "Available"
                              : "Off"}
                          </small>

                        </div>

                        {slot.enabled && (
                          <div className="admin-doctors-time-grid">

                            <div>
                              <label>
                                Start Time
                              </label>

                              <input
                                type="time"
                                value={
                                  slot.start_time
                                }
                                onChange={(event) =>
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

                            <div>
                              <label>
                                End Time
                              </label>

                              <input
                                type="time"
                                value={
                                  slot.end_time
                                }
                                onChange={(event) =>
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

            {/* ACTIONS */}

            <div className="admin-doctors-form-actions">

              <button
                type="button"
                className="admin-doctors-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-doctors-save-btn"
              >
                {editingDoctor
                  ? "Save Changes"
                  : "Create Doctor"}
              </button>

            </div>

          </form>
        </div>
      )}

      {/* =========================
          DOCTORS TABLE
      ========================= */}

      <div className="admin-doctors-table-card">

        <div className="admin-doctors-table-header">
          <div>
            <p>MEDICAL STAFF</p>
            <h2>Doctor Directory</h2>
          </div>

          <span>
            {filteredDoctors.length} Doctors
          </span>
        </div>

        {doctors.length === 0 ? (
          <div className="admin-doctors-empty">
            <div className="admin-doctors-empty-icon">
              DR
            </div>

            <h3>No doctors found</h3>

            <p>
              Add your first doctor to the
              hospital system.
            </p>

            <button
              className="admin-doctors-primary-btn"
              onClick={handleAddDoctor}
            >
              + Add Doctor
            </button>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="admin-doctors-empty">
            <div className="admin-doctors-empty-icon">
              ⌕
            </div>

            <h3>
              No matching doctors
            </h3>

            <p>
              Try changing your search or
              filter criteria.
            </p>

            <button
              className="admin-doctors-clear-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="admin-doctors-table-wrapper">

            <table className="admin-doctors-table">

              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Contact</th>
                  <th>Department</th>
                  <th>Professional</th>
                  <th>Experience</th>
                  <th>Fee</th>
                  <th>Consultation Room</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDoctors.map(
                  (doctor) => {
                    const doctorAvailability =
                      getDoctorAvailability(
                        doctor.id
                      );

                    const initials =
                      `${doctor.first_name || ""}${doctor.last_name || ""}`
                        .trim()
                        .slice(0, 2)
                        .toUpperCase() || "DR";

                    return (
                      <tr key={doctor.id}>

                        <td>
                          <div className="admin-doctors-person">

                            <div className="admin-doctors-avatar">
                              {initials}
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

                              <span>
                                {
                                  doctor.doctor_id ||
                                  "-"
                                }
                              </span>

                              <small>
                                @
                                {
                                  doctor.username
                                }
                              </small>
                            </div>

                          </div>
                        </td>

                        <td>
                          <div className="admin-doctors-contact">
                            <span>
                              {doctor.email ||
                                "-"}
                            </span>

                            <small>
                              {doctor.mobile_number ||
                                "-"}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span className="admin-doctors-department">
                            {doctor.department_name ||
                              "-"}
                          </span>
                        </td>

                        <td>
                          <div className="admin-doctors-professional">
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

                        <td>
                          <div className="admin-doctors-experience">
                            <strong>
                              {
                                doctor.experience_years
                              }
                            </strong>

                            <span>
                              years
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="admin-doctors-fee">
                            ₹
                            {
                              doctor.consultation_fee
                            }
                          </span>
                        </td>

                        <td>
                          {doctor.consultation_room_number ? (
                            <span className="admin-doctors-room assigned">
                              <i />
                              {
                                doctor.consultation_room_number
                              }
                            </span>
                          ) : (
                            <span className="admin-doctors-room">
                              Not Assigned
                            </span>
                          )}
                        </td>

                        <td>
                          {doctorAvailability.length ===
                          0 ? (
                            <span className="admin-doctors-availability-none">
                              Not Set
                            </span>
                          ) : (
                            <div className="admin-doctors-availability-list">
                              {days.map(
                                (
                                  dayName,
                                  index
                                ) => {
                                  const slots =
                                    doctorAvailability.filter(
                                      (item) =>
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

                        <td>
                          <div className="admin-doctors-actions">

                            <button
                              type="button"
                              className="admin-doctors-edit-btn"
                              onClick={() =>
                                handleEdit(
                                  doctor
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="admin-doctors-delete-btn"
                              onClick={() =>
                                handleDelete(
                                  doctor.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>
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

export default AdminDoctors;