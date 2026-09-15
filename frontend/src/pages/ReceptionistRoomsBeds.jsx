import { useEffect, useState } from "react";
import api from "../services/api";
import "./ReceptionistRoomsBeds.css";

function ReceptionistRoomsBeds() {
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingRoom, setEditingRoom] = useState(null);
  const [editingBed, setEditingBed] = useState(null);

  const [roomFormData, setRoomFormData] = useState({
    room_type: "",
    status: "",
  });

  const [bedFormData, setBedFormData] = useState({
    status: "",
  });

  // ============================================================
  // HELPERS
  // ============================================================

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

      return Object.entries(data)
        .map(([field, message]) => {
          const text = Array.isArray(message)
            ? message.join(" ")
            : String(message);

          return `${field}: ${text}`;
        })
        .join(" ");
    }

    return err.message || fallback;
  };

  const getRoomStatusClass = (status) => {
    if (status === "ACTIVE") {
      return "active";
    }

    if (status === "INACTIVE") {
      return "inactive";
    }

    return "default";
  };

  const getBedStatusClass = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "available";

      case "OCCUPIED":
        return "occupied";

      case "MAINTENANCE":
        return "maintenance";

      default:
        return "default";
    }
  };

  // ============================================================
  // FETCH ROOMS & BEDS
  // ============================================================

  const fetchRoomsAndBeds = async () => {
    try {
      setError("");

      const [
        roomsResponse,
        bedsResponse,
      ] = await Promise.all([
        api.get("rooms/"),
        api.get("beds/"),
      ]);

      setRooms(
        getData(roomsResponse)
      );

      setBeds(
        getData(bedsResponse)
      );
    } catch (err) {
      console.error(
        "Rooms and beds error:",
        err
      );

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

  useEffect(() => {
    fetchRoomsAndBeds();
  }, []);

  // ============================================================
  // ROOM EDIT
  // ============================================================

  const handleEditRoom = (room) => {
    setEditingBed(null);
    setEditingRoom(room);

    setRoomFormData({
      room_type: room.room_type || "",
      status: room.status || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleRoomChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setRoomFormData({
      ...roomFormData,
      [name]: value,
    });
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();

    if (!editingRoom) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await api.patch(
        `rooms/${editingRoom.id}/`,
        roomFormData
      );

      setRooms((currentRooms) =>
        currentRooms.map((room) =>
          room.id === editingRoom.id
            ? response.data
            : room
        )
      );

      setEditingRoom(null);

      setSuccess(
        `Room ${editingRoom.room_number} updated successfully.`
      );
    } catch (err) {
      console.error(
        "Update room error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to update room."
        )
      );
    }
  };

  // ============================================================
  // BED EDIT
  // ============================================================

  const handleEditBed = (bed) => {
    setEditingRoom(null);
    setEditingBed(bed);

    setBedFormData({
      status: bed.status || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleBedChange = (e) => {
    setBedFormData({
      ...bedFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateBed = async (e) => {
    e.preventDefault();

    if (!editingBed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await api.patch(
        `beds/${editingBed.id}/`,
        bedFormData
      );

      setBeds((currentBeds) =>
        currentBeds.map((bed) =>
          bed.id === editingBed.id
            ? response.data
            : bed
        )
      );

      setEditingBed(null);

      setSuccess(
        `Bed ${editingBed.bed_number} updated successfully.`
      );
    } catch (err) {
      console.error(
        "Update bed error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to update bed."
        )
      );
    }
  };

  // ============================================================
  // CLOSE EDIT FORMS
  // ============================================================

  const closeRoomEdit = () => {
    setEditingRoom(null);
    setError("");
  };

  const closeBedEdit = () => {
    setEditingBed(null);
    setError("");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="receptionist-rooms-beds-page">

        <div className="receptionist-rooms-beds-state">

          <div className="receptionist-rooms-beds-spinner" />

          <p>
            Loading rooms and beds...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="receptionist-rooms-beds-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="receptionist-rooms-beds-header">

        <div>

          <p className="receptionist-rooms-beds-eyebrow">
            RECEPTIONIST PORTAL
          </p>

          <h1>
            Rooms & Beds
          </h1>

          <p className="receptionist-rooms-beds-subtitle">
            View hospital rooms, bed
            availability, and update
            their current status.
          </p>

        </div>

        <div className="receptionist-rooms-beds-summary">

          <div>
            <span>
              Total Rooms
            </span>

            <strong>
              {rooms.length}
            </strong>
          </div>

          <div>
            <span>
              Total Beds
            </span>

            <strong>
              {beds.length}
            </strong>
          </div>

          <div>
            <span>
              Available Beds
            </span>

            <strong>
              {
                beds.filter(
                  (bed) =>
                    bed.status ===
                    "AVAILABLE"
                ).length
              }
            </strong>
          </div>

        </div>

      </div>

      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {success && (
        <div className="receptionist-rooms-beds-success">

          <span>✓</span>

          {success}

        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="receptionist-rooms-beds-error">

          <span>!</span>

          {error}

        </div>
      )}

      {/* ======================================================
          ROOM EDIT FORM
      ====================================================== */}

      {editingRoom && (
        <div className="receptionist-rooms-beds-form-card">

          <div className="receptionist-rooms-beds-form-header">

            <div>

              <p className="receptionist-rooms-beds-section-eyebrow">
                UPDATE ROOM
              </p>

              <h2>
                Edit Room
              </h2>

            </div>

            <button
              type="button"
              className="receptionist-rooms-beds-close-btn"
              onClick={
                closeRoomEdit
              }
            >
              ×
            </button>

          </div>

          <div className="receptionist-rooms-beds-info-grid">

            <div>
              <span>
                Room Number
              </span>

              <strong>
                {editingRoom.room_number ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>
                Department
              </span>

              <strong>
                {
                  editingRoom.department_name ||
                  "-"
                }
              </strong>
            </div>

            <div>
              <span>
                Current Beds
              </span>

              <strong>
                {editingRoom.bed_count ??
                  0}
              </strong>
            </div>

          </div>

          <form
            onSubmit={
              handleUpdateRoom
            }
          >

            <div className="receptionist-rooms-beds-form-grid">

              <div className="receptionist-rooms-beds-form-group">

                <label>
                  Room Number
                </label>

                <input
                  type="text"
                  value={
                    editingRoom.room_number ||
                    ""
                  }
                  disabled
                />

              </div>

              <div className="receptionist-rooms-beds-form-group">

                <label>
                  Department
                </label>

                <input
                  type="text"
                  value={
                    editingRoom.department_name ||
                    ""
                  }
                  disabled
                />

              </div>

              <div className="receptionist-rooms-beds-form-group">

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

                  <option value="PRIVATE">
                    Private
                  </option>

                  <option value="SEMI_PRIVATE">
                    Semi Private
                  </option>

                  <option value="ICU">
                    ICU
                  </option>

                  <option value="CONSULTATION">
                    Consultation
                  </option>

                </select>

              </div>

              <div className="receptionist-rooms-beds-form-group">

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

            <div className="receptionist-rooms-beds-form-actions">

              <button
                type="button"
                className="receptionist-rooms-beds-cancel-btn"
                onClick={
                  closeRoomEdit
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="receptionist-rooms-beds-save-btn"
              >
                Save Changes
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================================
          BED EDIT FORM
      ====================================================== */}

      {editingBed && (
        <div className="receptionist-rooms-beds-form-card">

          <div className="receptionist-rooms-beds-form-header">

            <div>

              <p className="receptionist-rooms-beds-section-eyebrow">
                UPDATE BED
              </p>

              <h2>
                Edit Bed
              </h2>

            </div>

            <button
              type="button"
              className="receptionist-rooms-beds-close-btn"
              onClick={
                closeBedEdit
              }
            >
              ×
            </button>

          </div>

          <div className="receptionist-rooms-beds-info-grid">

            <div>
              <span>
                Room
              </span>

              <strong>
                {
                  editingBed.room_number ||
                  "-"
                }
              </strong>
            </div>

            <div>
              <span>
                Bed
              </span>

              <strong>
                {
                  editingBed.bed_number ||
                  "-"
                }
              </strong>
            </div>

            <div>
              <span>
                Department
              </span>

              <strong>
                {
                  editingBed.department_name ||
                  "-"
                }
              </strong>
            </div>

          </div>

          <form
            onSubmit={
              handleUpdateBed
            }
          >

            <div className="receptionist-rooms-beds-form-grid">

              <div className="receptionist-rooms-beds-form-group">

                <label>
                  Room Number
                </label>

                <input
                  type="text"
                  value={
                    editingBed.room_number ||
                    ""
                  }
                  disabled
                />

              </div>

              <div className="receptionist-rooms-beds-form-group">

                <label>
                  Bed Number
                </label>

                <input
                  type="text"
                  value={
                    editingBed.bed_number ||
                    ""
                  }
                  disabled
                />

              </div>

              <div className="receptionist-rooms-beds-form-group">

                <label>
                  Department
                </label>

                <input
                  type="text"
                  value={
                    editingBed.department_name ||
                    ""
                  }
                  disabled
                />

              </div>

              <div className="receptionist-rooms-beds-form-group">

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

            <div className="receptionist-rooms-beds-form-actions">

              <button
                type="button"
                className="receptionist-rooms-beds-cancel-btn"
                onClick={
                  closeBedEdit
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="receptionist-rooms-beds-save-btn"
              >
                Save Changes
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================================
          ROOMS
      ====================================================== */}

      <div className="receptionist-rooms-beds-section">

        <div className="receptionist-rooms-beds-section-header">

          <div>

            <h2>
              Rooms
            </h2>

            <p>
              Hospital room availability
              and configuration.
            </p>

          </div>

          <span className="receptionist-rooms-beds-section-count">
            {rooms.length}{" "}
            {rooms.length === 1
              ? "room"
              : "rooms"}
          </span>

        </div>

        {rooms.length === 0 ? (

          <div className="receptionist-rooms-beds-empty">

            <div className="receptionist-rooms-beds-empty-icon">
              ▢
            </div>

            <h3>
              No rooms found
            </h3>

            <p>
              There are currently no
              rooms available.
            </p>

          </div>

        ) : (

          <div className="receptionist-rooms-beds-table-wrapper">

            <table className="receptionist-rooms-beds-table">

              <thead>

                <tr>

                  <th>
                    Room
                  </th>

                  <th>
                    Room Type
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Beds
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {rooms.map(
                  (room) => (

                    <tr
                      key={
                        room.id
                      }
                    >

                      <td>

                        <div className="receptionist-room-number">

                          <div className="receptionist-room-icon">
                            R
                          </div>

                          <div>

                            <strong>
                              {
                                room.room_number ||
                                "-"
                              }
                            </strong>

                            <span>
                              Room
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>

                        <span className="receptionist-room-type">

                          {
                            room.room_type ||
                            "-"
                          }

                        </span>

                      </td>

                      <td>

                        <span className="receptionist-room-department">

                          {
                            room.department_name ||
                            "-"
                          }

                        </span>

                      </td>

                      <td>

                        <span
                          className={`receptionist-room-status ${getRoomStatusClass(
                            room.status
                          )}`}
                        >
                          {
                            room.status ||
                            "-"
                          }
                        </span>

                      </td>

                      <td>

                        <div className="receptionist-room-bed-count">

                          <strong>
                            {room.bed_count ??
                              0}
                          </strong>

                          <span>
                            beds
                          </span>

                        </div>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="receptionist-rooms-beds-edit-btn"
                          onClick={() =>
                            handleEditRoom(
                              room
                            )
                          }
                        >

                          <span>
                            ✎
                          </span>

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

      {/* ======================================================
          BEDS
      ====================================================== */}

      <div className="receptionist-rooms-beds-section">

        <div className="receptionist-rooms-beds-section-header">

          <div>

            <h2>
              Beds
            </h2>

            <p>
              Current bed allocation and
              availability.
            </p>

          </div>

          <span className="receptionist-rooms-beds-section-count">
            {beds.length}{" "}
            {beds.length === 1
              ? "bed"
              : "beds"}
          </span>

        </div>

        {beds.length === 0 ? (

          <div className="receptionist-rooms-beds-empty">

            <div className="receptionist-rooms-beds-empty-icon">
              B
            </div>

            <h3>
              No beds found
            </h3>

            <p>
              There are currently no
              beds available.
            </p>

          </div>

        ) : (

          <div className="receptionist-rooms-beds-table-wrapper">

            <table className="receptionist-rooms-beds-table">

              <thead>

                <tr>

                  <th>
                    Room
                  </th>

                  <th>
                    Bed
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {beds.map(
                  (bed) => (

                    <tr
                      key={
                        bed.id
                      }
                    >

                      <td>

                        <div className="receptionist-bed-room">

                          <strong>
                            Room{" "}
                            {
                              bed.room_number ||
                              "-"
                            }
                          </strong>

                        </div>

                      </td>

                      <td>

                        <div className="receptionist-bed-number">

                          <div className="receptionist-bed-icon">
                            B
                          </div>

                          <strong>
                            {
                              bed.bed_number ||
                              "-"
                            }
                          </strong>

                        </div>

                      </td>

                      <td>

                        <span className="receptionist-room-department">

                          {
                            bed.department_name ||
                            "-"
                          }

                        </span>

                      </td>

                      <td>

                        <span
                          className={`receptionist-bed-status ${getBedStatusClass(
                            bed.status
                          )}`}
                        >
                          {
                            bed.status ||
                            "-"
                          }
                        </span>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="receptionist-rooms-beds-edit-btn"
                          onClick={() =>
                            handleEditBed(
                              bed
                            )
                          }
                        >

                          <span>
                            ✎
                          </span>

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

export default ReceptionistRoomsBeds;