import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminRoomsBeds.css";

function getData(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function getErrorMessage(err, fallback) {
  if (err.response?.data) {
    const data = err.response.data;

    if (typeof data === "string") {
      return data;
    }

    return Object.values(data)
      .flat()
      .map((item) =>
        typeof item === "string"
          ? item
          : JSON.stringify(item)
      )
      .join(" ");
  }

  return fallback;
}

function getInitials(value = "") {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "R";
  }

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function AdminRoomsBeds() {
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  // Room form
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const [roomFormData, setRoomFormData] = useState({
    room_number: "",
    room_type: "",
    department: "",
    status: "ACTIVE",
  });

  // Bed form
  const [showBedForm, setShowBedForm] = useState(false);
  const [editingBed, setEditingBed] = useState(null);

  const [bedFormData, setBedFormData] = useState({
    room: "",
    bed_number: "",
    status: "AVAILABLE",
  });

  // Filters
  const [roomSearch, setRoomSearch] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [roomStatusFilter, setRoomStatusFilter] = useState("");

  const [bedSearch, setBedSearch] = useState("");
  const [bedStatusFilter, setBedStatusFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // FETCH DATA
  // ==========================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        roomsResponse,
        bedsResponse,
        departmentsResponse,
      ] = await Promise.all([
        api.get("rooms/"),
        api.get("beds/"),
        api.get("departments/"),
      ]);

      setRooms(getData(roomsResponse.data));
      setBeds(getData(bedsResponse.data));
      setDepartments(getData(departmentsResponse.data));
    } catch (err) {
      console.error("Rooms and beds error:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to load rooms and beds."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SORTED DATA
  // ==========================================

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) =>
      String(a.room_number || "").localeCompare(
        String(b.room_number || ""),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      )
    );
  }, [rooms]);

  const sortedBeds = useMemo(() => {
    return [...beds].sort((a, b) =>
      String(a.bed_number || "").localeCompare(
        String(b.bed_number || ""),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      )
    );
  }, [beds]);

  // ==========================================
  // FILTERED ROOMS
  // ==========================================

  const filteredRooms = useMemo(() => {
    const search = roomSearch.trim().toLowerCase();

    return sortedRooms.filter((room) => {
      const matchesSearch =
        !search ||
        String(room.room_number || "")
          .toLowerCase()
          .includes(search) ||
        String(room.room_type || "")
          .toLowerCase()
          .includes(search) ||
        String(room.department_name || "")
          .toLowerCase()
          .includes(search);

      const matchesType =
        !roomTypeFilter ||
        room.room_type === roomTypeFilter;

      const matchesStatus =
        !roomStatusFilter ||
        room.status === roomStatusFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    sortedRooms,
    roomSearch,
    roomTypeFilter,
    roomStatusFilter,
  ]);

  // ==========================================
  // FILTERED BEDS
  // ==========================================

  const filteredBeds = useMemo(() => {
    const search = bedSearch.trim().toLowerCase();

    return sortedBeds.filter((bed) => {
      const matchesSearch =
        !search ||
        String(bed.bed_number || "")
          .toLowerCase()
          .includes(search) ||
        String(bed.room_number || "")
          .toLowerCase()
          .includes(search) ||
        String(bed.department_name || "")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        !bedStatusFilter ||
        bed.status === bedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    sortedBeds,
    bedSearch,
    bedStatusFilter,
  ]);

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    const activeRooms = rooms.filter(
      (room) => room.status === "ACTIVE"
    ).length;

    const consultationRooms = rooms.filter(
      (room) => room.room_type === "CONSULTATION"
    ).length;

    const availableBeds = beds.filter(
      (bed) => bed.status === "AVAILABLE"
    ).length;

    const occupiedBeds = beds.filter(
      (bed) => bed.status === "OCCUPIED"
    ).length;

    return {
      totalRooms: rooms.length,
      activeRooms,
      consultationRooms,
      totalBeds: beds.length,
      availableBeds,
      occupiedBeds,
    };
  }, [rooms, beds]);

  // ==========================================
  // ROOM FUNCTIONS
  // ==========================================

  const handleRoomChange = (event) => {
    const { name, value } = event.target;

    setRoomFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ADD ROOM

  const handleAddRoom = () => {
    setEditingRoom(null);

    setRoomFormData({
      room_number: "",
      room_type: "",
      department: "",
      status: "ACTIVE",
    });

    setFormError("");
    setMessage("");
    setShowRoomForm(true);

    setShowBedForm(false);
    setEditingBed(null);

    setTimeout(() => {
      document
        .getElementById("admin-room-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // EDIT ROOM

  const handleEditRoom = (room) => {
    setEditingRoom(room);

    setRoomFormData({
      room_number: room.room_number || "",
      room_type: room.room_type || "",
      department: room.department || "",
      status: room.status || "ACTIVE",
    });

    setFormError("");
    setMessage("");
    setShowRoomForm(true);

    setShowBedForm(false);
    setEditingBed(null);

    setTimeout(() => {
      document
        .getElementById("admin-room-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // SAVE / UPDATE ROOM

  const handleRoomSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setMessage("");

    if (!roomFormData.room_number.trim()) {
      setFormError("Room number is required.");
      return;
    }

    if (!roomFormData.room_type) {
      setFormError("Please select a room type.");
      return;
    }

    if (!editingRoom && !roomFormData.department) {
      setFormError("Please select a department.");
      return;
    }

    try {
      if (editingRoom) {
        const response = await api.patch(
          `rooms/${editingRoom.id}/`,
          {
            room_number:
              roomFormData.room_number.trim(),
            room_type: roomFormData.room_type,
            status: roomFormData.status,
          }
        );

        setRooms((previous) =>
          previous.map((room) =>
            room.id === editingRoom.id
              ? response.data
              : room
          )
        );

        setMessage(
          "Room updated successfully."
        );
      } else {
        const response = await api.post(
          "rooms/",
          {
            room_number:
              roomFormData.room_number.trim(),
            room_type: roomFormData.room_type,
            department: Number(
              roomFormData.department
            ),
            status: roomFormData.status,
          }
        );

        setRooms((previous) => [
          ...previous,
          response.data,
        ]);

        setMessage(
          "Room created successfully."
        );
      }

      setShowRoomForm(false);
      setEditingRoom(null);

      setRoomFormData({
        room_number: "",
        room_type: "",
        department: "",
        status: "ACTIVE",
      });
    } catch (err) {
      console.error(
        "Room save error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to save room."
        )
      );
    }
  };

  // DELETE ROOM

  const handleDeleteRoom = async (roomId) => {
    const room = rooms.find(
      (item) => item.id === roomId
    );

    const confirmed = window.confirm(
      `Are you sure you want to delete room ${
        room?.room_number || ""
      }?`
    );

    if (!confirmed) {
      return;
    }

    setFormError("");
    setMessage("");

    try {
      await api.delete(`rooms/${roomId}/`);

      setRooms((previous) =>
        previous.filter(
          (room) => room.id !== roomId
        )
      );

      setBeds((previous) =>
        previous.filter(
          (bed) =>
            String(bed.room) !==
            String(roomId)
        )
      );

      setMessage(
        "Room deleted successfully."
      );
    } catch (err) {
      console.error(
        "Room delete error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to delete room."
        )
      );
    }
  };

  // ==========================================
  // BED FUNCTIONS
  // ==========================================

  const handleBedChange = (event) => {
    const { name, value } = event.target;

    setBedFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ADD BED

  const handleAddBed = () => {
    setEditingBed(null);

    setBedFormData({
      room: "",
      bed_number: "",
      status: "AVAILABLE",
    });

    setFormError("");
    setMessage("");
    setShowBedForm(true);

    setShowRoomForm(false);
    setEditingRoom(null);

    setTimeout(() => {
      document
        .getElementById("admin-bed-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // EDIT BED

  const handleEditBed = (bed) => {
    setEditingBed(bed);

    setBedFormData({
      room: bed.room || "",
      bed_number: bed.bed_number || "",
      status: bed.status || "AVAILABLE",
    });

    setFormError("");
    setMessage("");
    setShowBedForm(true);

    setShowRoomForm(false);
    setEditingRoom(null);

    setTimeout(() => {
      document
        .getElementById("admin-bed-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // SAVE / UPDATE BED

  const handleBedSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setMessage("");

    if (!bedFormData.bed_number.trim()) {
      setFormError("Bed number is required.");
      return;
    }

    if (!editingBed && !bedFormData.room) {
      setFormError("Please select a room.");
      return;
    }

    try {
      if (editingBed) {
        const response = await api.patch(
          `beds/${editingBed.id}/`,
          {
            bed_number:
              bedFormData.bed_number.trim(),
            status: bedFormData.status,
          }
        );

        setBeds((previous) =>
          previous.map((bed) =>
            bed.id === editingBed.id
              ? response.data
              : bed
          )
        );

        setMessage(
          "Bed updated successfully."
        );
      } else {
        const response = await api.post(
          "beds/",
          {
            room: Number(
              bedFormData.room
            ),
            bed_number:
              bedFormData.bed_number.trim(),
            status: bedFormData.status,
          }
        );

        setBeds((previous) => [
          ...previous,
          response.data,
        ]);

        setMessage(
          "Bed created successfully."
        );
      }

      setShowBedForm(false);
      setEditingBed(null);

      setBedFormData({
        room: "",
        bed_number: "",
        status: "AVAILABLE",
      });
    } catch (err) {
      console.error(
        "Bed save error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to save bed."
        )
      );
    }
  };

  // DELETE BED

  const handleDeleteBed = async (bedId) => {
    const bed = beds.find(
      (item) => item.id === bedId
    );

    const confirmed = window.confirm(
      `Are you sure you want to delete bed ${
        bed?.bed_number || ""
      }?`
    );

    if (!confirmed) {
      return;
    }

    setFormError("");
    setMessage("");

    try {
      await api.delete(`beds/${bedId}/`);

      setBeds((previous) =>
        previous.filter(
          (bed) => bed.id !== bedId
        )
      );

      setMessage(
        "Bed deleted successfully."
      );
    } catch (err) {
      console.error(
        "Bed delete error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to delete bed."
        )
      );
    }
  };

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearRoomFilters = () => {
    setRoomSearch("");
    setRoomTypeFilter("");
    setRoomStatusFilter("");
  };

  const clearBedFilters = () => {
    setBedSearch("");
    setBedStatusFilter("");
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="admin-rooms-beds-page">
        <div className="admin-rooms-beds-state">
          <div className="admin-rooms-beds-spinner" />
          <p>
            Loading rooms and beds...
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
      <div className="admin-rooms-beds-page">
        <div className="admin-rooms-beds-state">
          <div className="admin-rooms-beds-state-icon">
            !
          </div>

          <h2>
            Unable to load rooms and beds
          </h2>

          <p>{error}</p>

          <button
            className="admin-rooms-beds-primary-btn"
            onClick={fetchData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="admin-rooms-beds-page">

      {/* ========================================
          HEADER
          ======================================== */}

      <div className="admin-rooms-beds-header">
        <div>
          <p className="admin-rooms-beds-eyebrow">
            ADMINISTRATION
          </p>

          <h1>
            Rooms & Beds
          </h1>

          <p>
            Manage hospital rooms, consultation
            rooms and beds.
          </p>
        </div>

        <div className="admin-rooms-beds-header-actions">
          <button
            className="admin-rooms-beds-primary-btn"
            onClick={handleAddRoom}
          >
            + Add Room
          </button>

          <button
            className="admin-rooms-beds-secondary-btn"
            onClick={handleAddBed}
          >
            + Add Bed
          </button>
        </div>
      </div>

      {/* ========================================
          MESSAGES
          ======================================== */}

      {message && (
        <div className="admin-rooms-beds-success">
          <span>✓</span>
          {message}
        </div>
      )}

      {formError &&
        !showRoomForm &&
        !showBedForm && (
          <div className="admin-rooms-beds-error">
            <span>!</span>
            {formError}
          </div>
        )}

      {/* ========================================
          SUMMARY CARDS
          ======================================== */}

      <div className="admin-rooms-beds-summary-grid">

        <div className="admin-rooms-beds-summary-card">
          <div className="admin-rooms-beds-summary-icon">
            RM
          </div>

          <div>
            <span>Total Rooms</span>
            <strong>
              {summary.totalRooms}
            </strong>
            <small>
              {summary.activeRooms} active
            </small>
          </div>
        </div>

        <div className="admin-rooms-beds-summary-card">
          <div className="admin-rooms-beds-summary-icon">
            CR
          </div>

          <div>
            <span>Consultation Rooms</span>
            <strong>
              {summary.consultationRooms}
            </strong>
            <small>
              Doctor consultation areas
            </small>
          </div>
        </div>

        <div className="admin-rooms-beds-summary-card">
          <div className="admin-rooms-beds-summary-icon">
            BD
          </div>

          <div>
            <span>Total Beds</span>
            <strong>
              {summary.totalBeds}
            </strong>
            <small>
              {summary.occupiedBeds} occupied
            </small>
          </div>
        </div>

        <div className="admin-rooms-beds-summary-card">
          <div className="admin-rooms-beds-summary-icon">
            AV
          </div>

          <div>
            <span>Available Beds</span>
            <strong>
              {summary.availableBeds}
            </strong>
            <small>
              Ready for admission
            </small>
          </div>
        </div>

      </div>

      {/* ========================================
          ROOM FORM
          ======================================== */}

      {showRoomForm && (
        <div
          id="admin-room-form"
          className="admin-rooms-beds-form-card"
        >
          <div className="admin-rooms-beds-form-header">
            <div>
              <p>ROOM MANAGEMENT</p>

              <h2>
                {editingRoom
                  ? "Edit Room"
                  : "Create New Room"}
              </h2>

              <span>
                {editingRoom
                  ? "Update room details and status."
                  : "Add a new room to the hospital."}
              </span>
            </div>

            <button
              type="button"
              className="admin-rooms-beds-close-btn"
              onClick={() => {
                setShowRoomForm(false);
                setEditingRoom(null);
                setFormError("");
              }}
            >
              ×
            </button>
          </div>

          {formError && (
            <div className="admin-rooms-beds-form-error">
              <span>!</span>
              {formError}
            </div>
          )}

          <form onSubmit={handleRoomSubmit}>

            <div className="admin-rooms-beds-form-grid">

              <div className="admin-rooms-beds-form-group">
                <label>
                  Room Number
                </label>

                <input
                  type="text"
                  name="room_number"
                  value={
                    roomFormData.room_number
                  }
                  onChange={
                    handleRoomChange
                  }
                  placeholder="e.g. C101"
                  required
                />
              </div>

              <div className="admin-rooms-beds-form-group">
                <label>
                  Room Type
                </label>

                <select
                  name="room_type"
                  value={
                    roomFormData.room_type
                  }
                  onChange={
                    handleRoomChange
                  }
                  required
                >
                  <option value="">
                    Select Room Type
                  </option>

                  <option value="GENERAL">
                    General
                  </option>

                  <option value="SEMI_PRIVATE">
                    Semi Private
                  </option>

                  <option value="PRIVATE">
                    Private
                  </option>

                  <option value="ICU">
                    ICU
                  </option>

                  <option value="CONSULTATION">
                    Consultation
                  </option>
                </select>
              </div>

              <div className="admin-rooms-beds-form-group">
                <label>
                  Department
                </label>

                <select
                  name="department"
                  value={
                    roomFormData.department
                  }
                  onChange={
                    handleRoomChange
                  }
                  disabled={!!editingRoom}
                  required
                >
                  <option value="">
                    Select Department
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

                {editingRoom && (
                  <small className="admin-rooms-beds-help">
                    Department cannot be changed
                    after creation.
                  </small>
                )}
              </div>

              <div className="admin-rooms-beds-form-group">
                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    roomFormData.status
                  }
                  onChange={
                    handleRoomChange
                  }
                  required
                >
                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>
              </div>

            </div>

            <div className="admin-rooms-beds-form-actions">
              <button
                type="button"
                className="admin-rooms-beds-cancel-btn"
                onClick={() => {
                  setShowRoomForm(false);
                  setEditingRoom(null);
                  setFormError("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-rooms-beds-save-btn"
              >
                {editingRoom
                  ? "Update Room"
                  : "Create Room"}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ========================================
          ROOMS SECTION
          ======================================== */}

      <div className="admin-rooms-beds-section-header">
        <div>
          <p>ROOM DIRECTORY</p>

          <h2>
            Hospital Rooms
          </h2>
        </div>

        <span>
          {filteredRooms.length} shown
        </span>
      </div>

      <div className="admin-rooms-beds-filter-card">

        <div className="admin-rooms-beds-filter-grid">

          <div className="admin-rooms-beds-filter-group search">
            <label>
              Search Rooms
            </label>

            <div className="admin-rooms-beds-search-box">
              <span>⌕</span>

              <input
                type="text"
                value={roomSearch}
                onChange={(event) =>
                  setRoomSearch(
                    event.target.value
                  )
                }
                placeholder="Room number, type or department..."
              />
            </div>
          </div>

          <div className="admin-rooms-beds-filter-group">
            <label>
              Room Type
            </label>

            <select
              value={roomTypeFilter}
              onChange={(event) =>
                setRoomTypeFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Types
              </option>

              <option value="GENERAL">
                General
              </option>

              <option value="SEMI_PRIVATE">
                Semi Private
              </option>

              <option value="PRIVATE">
                Private
              </option>

              <option value="ICU">
                ICU
              </option>

              <option value="CONSULTATION">
                Consultation
              </option>
            </select>
          </div>

          <div className="admin-rooms-beds-filter-group">
            <label>
              Status
            </label>

            <select
              value={roomStatusFilter}
              onChange={(event) =>
                setRoomStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>
          </div>

          <button
            type="button"
            className="admin-rooms-beds-clear-btn"
            onClick={clearRoomFilters}
          >
            Clear
          </button>

        </div>
      </div>

      {/* ROOM TABLE */}

      <div className="admin-rooms-beds-table-card">

        <div className="admin-rooms-beds-table-header">
          <div>
            <p>ROOMS</p>

            <h3>
              Room List
            </h3>
          </div>

          <span className="admin-rooms-beds-table-count">
            {filteredRooms.length}
          </span>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="admin-rooms-beds-empty">
            <div className="admin-rooms-beds-empty-icon">
              RM
            </div>

            <h3>
              No rooms found
            </h3>

            <p>
              Try changing your filters or
              create a new room.
            </p>
          </div>
        ) : (
          <div className="admin-rooms-beds-table-wrapper">

            <table className="admin-rooms-beds-table">

              <thead>
                <tr>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Beds</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRooms.map(
                  (room) => (
                    <tr key={room.id}>

                      <td>
                        <div className="admin-rooms-beds-room-cell">

                          <div className="admin-rooms-beds-room-avatar">
                            {getInitials(
                              room.room_number
                            )}
                          </div>

                          <div>
                            <strong>
                              {room.room_number}
                            </strong>

                            <span>
                              Room ID #{room.id}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-rooms-beds-type-badge ${String(
                            room.room_type || ""
                          ).toLowerCase()}`}
                        >
                          {String(
                            room.room_type || ""
                          ).replace(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="admin-rooms-beds-department">
                          {room.department_name ||
                            "—"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-rooms-beds-status ${
                            room.status ===
                            "ACTIVE"
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {room.status}
                        </span>
                      </td>

                      <td>
                        <strong className="admin-rooms-beds-count">
                          {room.bed_count ?? 0}
                        </strong>
                      </td>

                      <td>
                        <div className="admin-rooms-beds-actions">

                          <button
                            type="button"
                            className="admin-rooms-beds-edit-btn"
                            onClick={() =>
                              handleEditRoom(
                                room
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="admin-rooms-beds-delete-btn"
                            onClick={() =>
                              handleDeleteRoom(
                                room.id
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
      </div>

      {/* ========================================
          BED FORM
          ======================================== */}

      {showBedForm && (
        <div
          id="admin-bed-form"
          className="admin-rooms-beds-form-card"
        >
          <div className="admin-rooms-beds-form-header">
            <div>
              <p>BED MANAGEMENT</p>

              <h2>
                {editingBed
                  ? "Edit Bed"
                  : "Create New Bed"}
              </h2>

              <span>
                {editingBed
                  ? "Update bed details and status."
                  : "Add a bed to an inpatient room."}
              </span>
            </div>

            <button
              type="button"
              className="admin-rooms-beds-close-btn"
              onClick={() => {
                setShowBedForm(false);
                setEditingBed(null);
                setFormError("");
              }}
            >
              ×
            </button>
          </div>

          {formError && (
            <div className="admin-rooms-beds-form-error">
              <span>!</span>
              {formError}
            </div>
          )}

          <form onSubmit={handleBedSubmit}>

            <div className="admin-rooms-beds-form-grid">

              <div className="admin-rooms-beds-form-group">
                <label>
                  Room
                </label>

                <select
                  name="room"
                  value={bedFormData.room}
                  onChange={handleBedChange}
                  disabled={!!editingBed}
                  required
                >
                  <option value="">
                    Select Room
                  </option>

                  {rooms
                    .filter(
                      (room) =>
                        room.room_type !==
                        "CONSULTATION" &&
                        room.status ===
                        "ACTIVE"
                    )
                    .map((room) => (
                      <option
                        key={room.id}
                        value={room.id}
                      >
                        {room.room_number}
                        {room.department_name
                          ? ` — ${room.department_name}`
                          : ""}
                      </option>
                    ))}
                </select>

                {editingBed && (
                  <small className="admin-rooms-beds-help">
                    Room cannot be changed
                    after bed creation.
                  </small>
                )}
              </div>

              <div className="admin-rooms-beds-form-group">
                <label>
                  Bed Number
                </label>

                <input
                  type="text"
                  name="bed_number"
                  value={
                    bedFormData.bed_number
                  }
                  onChange={
                    handleBedChange
                  }
                  placeholder="e.g. B01"
                  required
                />
              </div>

              <div className="admin-rooms-beds-form-group">
                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    bedFormData.status
                  }
                  onChange={
                    handleBedChange
                  }
                  required
                >
                  <option value="AVAILABLE">
                    Available
                  </option>

                  <option value="OCCUPIED">
                    Occupied
                  </option>

                  <option value="MAINTENANCE">
                    Maintenance
                  </option>
                </select>
              </div>

            </div>

            <div className="admin-rooms-beds-form-actions">

              <button
                type="button"
                className="admin-rooms-beds-cancel-btn"
                onClick={() => {
                  setShowBedForm(false);
                  setEditingBed(null);
                  setFormError("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-rooms-beds-save-btn"
              >
                {editingBed
                  ? "Update Bed"
                  : "Create Bed"}
              </button>

            </div>

          </form>
        </div>
      )}

      {/* ========================================
          BEDS SECTION
          ======================================== */}

      <div className="admin-rooms-beds-section-header beds">
        <div>
          <p>BED DIRECTORY</p>

          <h2>
            Hospital Beds
          </h2>
        </div>

        <span>
          {filteredBeds.length} shown
        </span>
      </div>

      <div className="admin-rooms-beds-filter-card">

        <div className="admin-rooms-beds-filter-grid beds">

          <div className="admin-rooms-beds-filter-group search">
            <label>
              Search Beds
            </label>

            <div className="admin-rooms-beds-search-box">
              <span>⌕</span>

              <input
                type="text"
                value={bedSearch}
                onChange={(event) =>
                  setBedSearch(
                    event.target.value
                  )
                }
                placeholder="Bed number, room or department..."
              />
            </div>
          </div>

          <div className="admin-rooms-beds-filter-group">
            <label>
              Bed Status
            </label>

            <select
              value={bedStatusFilter}
              onChange={(event) =>
                setBedStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Status
              </option>

              <option value="AVAILABLE">
                Available
              </option>

              <option value="OCCUPIED">
                Occupied
              </option>

              <option value="MAINTENANCE">
                Maintenance
              </option>
            </select>
          </div>

          <button
            type="button"
            className="admin-rooms-beds-clear-btn"
            onClick={clearBedFilters}
          >
            Clear
          </button>

        </div>
      </div>

      {/* BED TABLE */}

      <div className="admin-rooms-beds-table-card">

        <div className="admin-rooms-beds-table-header">
          <div>
            <p>BEDS</p>

            <h3>
              Bed List
            </h3>
          </div>

          <span className="admin-rooms-beds-table-count">
            {filteredBeds.length}
          </span>
        </div>

        {filteredBeds.length === 0 ? (
          <div className="admin-rooms-beds-empty">
            <div className="admin-rooms-beds-empty-icon">
              BD
            </div>

            <h3>
              No beds found
            </h3>

            <p>
              Try changing your filters or
              create a new bed.
            </p>
          </div>
        ) : (
          <div className="admin-rooms-beds-table-wrapper">

            <table className="admin-rooms-beds-table beds-table">

              <thead>
                <tr>
                  <th>Bed</th>
                  <th>Room</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBeds.map(
                  (bed) => (
                    <tr key={bed.id}>

                      <td>
                        <div className="admin-rooms-beds-room-cell">

                          <div className="admin-rooms-beds-room-avatar bed">
                            BD
                          </div>

                          <div>
                            <strong>
                              {bed.bed_number}
                            </strong>

                            <span>
                              Bed ID #{bed.id}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <strong className="admin-rooms-beds-room-number">
                          {bed.room_number ||
                            "—"}
                        </strong>
                      </td>

                      <td>
                        <span className="admin-rooms-beds-department">
                          {bed.department_name ||
                            "—"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-rooms-beds-status ${String(
                            bed.status || ""
                          ).toLowerCase()}`}
                        >
                          {bed.status}
                        </span>
                      </td>

                      <td>
                        <div className="admin-rooms-beds-actions">

                          <button
                            type="button"
                            className="admin-rooms-beds-edit-btn"
                            onClick={() =>
                              handleEditBed(
                                bed
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="admin-rooms-beds-delete-btn"
                            onClick={() =>
                              handleDeleteBed(
                                bed.id
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
      </div>

    </div>
  );
}

export default AdminRoomsBeds;