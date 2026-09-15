import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminReceptionists.css";

function AdminReceptionists() {
  const [receptionists, setReceptionists] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const emptyForm = {
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    aadhaar_number: "",
  };

  const [formData, setFormData] =
    useState(emptyForm);

  const [editReceptionist, setEditReceptionist] =
    useState(null);

  const [editFormData, setEditFormData] =
    useState(emptyForm);

  const [deleteReceptionist, setDeleteReceptionist] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  useEffect(() => {
    fetchReceptionists();
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
          const text = Array.isArray(messages)
            ? messages.join(", ")
            : messages;

          return `${field}: ${text}`;
        })
        .join(" | ");
    }

    return fallback;
  };

  const fetchReceptionists = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "admin/receptionists/"
      );

      setReceptionists(getData(response));
    } catch (err) {
      console.error(
        "Fetch receptionists error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to fetch receptionists."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredReceptionists = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return [...receptionists]
      .filter((receptionist) => {
        if (!search) {
          return true;
        }

        const values = [
          receptionist.receptionist_id,
          receptionist.username,
          receptionist.first_name,
          receptionist.last_name,
          `${receptionist.first_name || ""} ${
            receptionist.last_name || ""
          }`,
          receptionist.email,
          receptionist.mobile_number,
          receptionist.aadhaar_number,
        ];

        return values.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search)
        );
      })
      .sort((a, b) =>
        String(
          b.receptionist_id || ""
        ).localeCompare(
          String(
            a.receptionist_id || ""
          ),
          undefined,
          { numeric: true }
        )
      );
  }, [receptionists, searchTerm]);

  const receptionistStats = useMemo(() => {
    return {
      total: receptionists.length,
      active: receptionists.filter(
        (receptionist) =>
          receptionist.is_active !== false
      ).length,
      withEmail: receptionists.filter(
        (receptionist) =>
          receptionist.email
      ).length,
      withMobile: receptionists.filter(
        (receptionist) =>
          receptionist.mobile_number
      ).length,
    };
  }, [receptionists]);

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]:
        event.target.value,
    }));
  };

  const handleEditChange = (event) => {
    setEditFormData((previous) => ({
      ...previous,
      [event.target.name]:
        event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    try {
      const response = await api.post(
        "admin/receptionists/",
        formData
      );

      const data = response.data;

      setSuccessMessage(
        `Receptionist ${data.receptionist_id} created successfully.`
      );

      setFormData({
        ...emptyForm,
      });

      setShowCreateForm(false);

      fetchReceptionists();
    } catch (err) {
      console.error(
        "Create receptionist error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to create receptionist."
        )
      );
    }
  };

  const handleEditClick = (
    receptionist
  ) => {
    setError("");
    setSuccessMessage("");

    setEditReceptionist(
      receptionist
    );

    setEditFormData({
      username:
        receptionist.username || "",
      password: "",
      first_name:
        receptionist.first_name || "",
      last_name:
        receptionist.last_name || "",
      email:
        receptionist.email || "",
      mobile_number:
        receptionist.mobile_number || "",
      aadhaar_number:
        receptionist.aadhaar_number || "",
    });

    setTimeout(() => {
      document
        .querySelector(
          ".admin-receptionists-edit-card"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editReceptionist) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      const updateData = {
        username:
          editFormData.username,
        first_name:
          editFormData.first_name,
        last_name:
          editFormData.last_name,
        email:
          editFormData.email,
        mobile_number:
          editFormData.mobile_number,
        aadhaar_number:
          editFormData.aadhaar_number,
      };

      if (
        editFormData.password.trim() !== ""
      ) {
        updateData.password =
          editFormData.password;
      }

      const response = await api.put(
        `admin/receptionists/${editReceptionist.id}/`,
        updateData
      );

      const data = response.data;

      setSuccessMessage(
        `Receptionist ${data.receptionist_id} updated successfully.`
      );

      setReceptionists(
        (currentReceptionists) =>
          currentReceptionists.map(
            (item) =>
              item.id ===
              editReceptionist.id
                ? data
                : item
          )
      );

      setEditReceptionist(null);
      setEditFormData({
        ...emptyForm,
      });
    } catch (err) {
      console.error(
        "Update receptionist error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to update receptionist."
        )
      );
    }
  };

  const handleDeleteClick = (
    receptionist
  ) => {
    setError("");
    setSuccessMessage("");

    setDeleteReceptionist(
      receptionist
    );
  };

  const handleDelete = async () => {
    if (!deleteReceptionist) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      const response = await api.delete(
        `admin/receptionists/${deleteReceptionist.id}/delete/`
      );

      const data = response.data;

      setSuccessMessage(
        data.message ||
          `${deleteReceptionist.receptionist_id} deleted successfully.`
      );

      setReceptionists(
        (currentReceptionists) =>
          currentReceptionists.filter(
            (item) =>
              item.id !==
              deleteReceptionist.id
          )
      );

      setDeleteReceptionist(null);
    } catch (err) {
      console.error(
        "Delete receptionist error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to delete receptionist."
        )
      );
    }
  };

  const handleCancelEdit = () => {
    setEditReceptionist(null);

    setEditFormData({
      ...emptyForm,
    });

    setError("");
  };

  const handleToggleCreate = () => {
    setShowCreateForm(
      (previous) => !previous
    );

    setFormData({
      ...emptyForm,
    });

    setError("");
    setSuccessMessage("");
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="admin-receptionists-page">
        <div className="admin-receptionists-state">
          <div className="admin-receptionists-spinner" />
          <p>
            Loading receptionists...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-receptionists-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="admin-receptionists-header">
        <div>
          <p className="admin-receptionists-eyebrow">
            HOSPITAL ADMINISTRATION
          </p>

          <h1>Receptionists</h1>

          <p>
            Manage front-desk staff accounts
            and receptionist access.
          </p>
        </div>

        <div className="admin-receptionists-header-actions">

          <div className="admin-receptionists-count">
            <span>Total</span>

            <strong>
              {receptionists.length}
            </strong>

            <small>
              Receptionists
            </small>
          </div>

          <button
            className="admin-receptionists-primary-btn"
            onClick={
              handleToggleCreate
            }
          >
            <span>
              {showCreateForm
                ? "×"
                : "+"}
            </span>

            {showCreateForm
              ? "Close Form"
              : "Add Receptionist"}
          </button>

        </div>
      </div>

      {/* =========================
          MESSAGES
      ========================= */}

      {successMessage && (
        <div className="admin-receptionists-success">
          <span>✓</span>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="admin-receptionists-error">
          <span>!</span>
          {error}
        </div>
      )}

      {/* =========================
          SUMMARY
      ========================= */}

      <div className="admin-receptionists-summary-grid">

        <div className="admin-receptionists-summary-card">
          <div className="admin-receptionists-summary-icon">
            RC
          </div>

          <div>
            <span>Total Staff</span>
            <strong>
              {receptionistStats.total}
            </strong>
            <small>
              Receptionist accounts
            </small>
          </div>
        </div>

        <div className="admin-receptionists-summary-card">
          <div className="admin-receptionists-summary-icon">
            ✓
          </div>

          <div>
            <span>Active</span>
            <strong>
              {receptionistStats.active}
            </strong>
            <small>
              Active accounts
            </small>
          </div>
        </div>

        <div className="admin-receptionists-summary-card">
          <div className="admin-receptionists-summary-icon">
            @
          </div>

          <div>
            <span>Email Available</span>
            <strong>
              {receptionistStats.withEmail}
            </strong>
            <small>
              Contactable by email
            </small>
          </div>
        </div>

        <div className="admin-receptionists-summary-card">
          <div className="admin-receptionists-summary-icon">
            ☎
          </div>

          <div>
            <span>Mobile Available</span>
            <strong>
              {receptionistStats.withMobile}
            </strong>
            <small>
              Contactable by phone
            </small>
          </div>
        </div>

      </div>

      {/* =========================
          CREATE FORM
      ========================= */}

      {showCreateForm && (
        <div className="admin-receptionists-form-card">

          <div className="admin-receptionists-form-header">
            <div>
              <p>NEW STAFF ACCOUNT</p>

              <h2>
                Create Receptionist
              </h2>
            </div>

            <button
              type="button"
              className="admin-receptionists-close-btn"
              onClick={
                handleToggleCreate
              }
            >
              ×
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="admin-receptionists-form"
          >

            <div className="admin-receptionists-section-title">
              <span>01</span>

              <div>
                <h3>
                  Account Information
                </h3>

                <p>
                  Login credentials for the
                  receptionist.
                </p>
              </div>
            </div>

            <div className="admin-receptionists-form-grid">

              <div className="admin-receptionists-form-group">
                <label>
                  Username
                </label>

                <input
                  type="text"
                  name="username"
                  value={
                    formData.username
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="admin-receptionists-form-group">
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
                  placeholder="Enter password"
                  required
                />
              </div>

              <div className="admin-receptionists-form-group">
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
                  placeholder="First name"
                  required
                />
              </div>

              <div className="admin-receptionists-form-group">
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
                  placeholder="Last name"
                  required
                />
              </div>

              <div className="admin-receptionists-form-group">
                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Email address"
                />
              </div>

              <div className="admin-receptionists-form-group">
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
                  placeholder="Mobile number"
                />
              </div>

              <div className="admin-receptionists-form-group full">
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
                  placeholder="12-digit Aadhaar number"
                  maxLength="12"
                  required
                />
              </div>

            </div>

            <div className="admin-receptionists-form-actions">

              <button
                type="button"
                className="admin-receptionists-cancel-btn"
                onClick={
                  handleToggleCreate
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-receptionists-save-btn"
              >
                Create Receptionist
              </button>

            </div>

          </form>
        </div>
      )}

      {/* =========================
          SEARCH
      ========================= */}

      <div className="admin-receptionists-search-card">

        <div className="admin-receptionists-search-header">
          <div>
            <p>STAFF DIRECTORY</p>

            <h2>
              Search Receptionists
            </h2>
          </div>

          <span>
            {filteredReceptionists.length} result
            {filteredReceptionists.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        <div className="admin-receptionists-search-box">
          <span>⌕</span>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search receptionist ID, name, username, email, mobile..."
          />

          {searchTerm && (
            <button
              type="button"
              onClick={
                clearSearch
              }
            >
              ×
            </button>
          )}
        </div>

        {searchTerm && (
          <div className="admin-receptionists-search-footer">
            Showing{" "}
            {filteredReceptionists.length}{" "}
            of {receptionists.length}{" "}
            receptionists
          </div>
        )}

      </div>

      {/* =========================
          LIST
      ========================= */}

      <div className="admin-receptionists-table-card">

        <div className="admin-receptionists-table-header">

          <div>
            <p>FRONT DESK STAFF</p>

            <h2>
              Receptionist Directory
            </h2>
          </div>

          <span>
            {receptionists.length} Total
          </span>

        </div>

        {receptionists.length === 0 ? (
          <div className="admin-receptionists-empty">

            <div className="admin-receptionists-empty-icon">
              RC
            </div>

            <h3>
              No receptionists found
            </h3>

            <p>
              Create the first receptionist
              account to get started.
            </p>

            <button
              className="admin-receptionists-primary-btn"
              onClick={
                handleToggleCreate
              }
            >
              + Add Receptionist
            </button>

          </div>
        ) : filteredReceptionists.length ===
          0 ? (
          <div className="admin-receptionists-empty">

            <div className="admin-receptionists-empty-icon">
              ⌕
            </div>

            <h3>
              No matching receptionist
            </h3>

            <p>
              Try changing the receptionist
              ID or search term.
            </p>

            <button
              className="admin-receptionists-clear-btn"
              onClick={
                clearSearch
              }
            >
              Clear Search
            </button>

          </div>
        ) : (
          <div className="admin-receptionists-table-wrapper">

            <table className="admin-receptionists-table">

              <thead>
                <tr>
                  <th>
                    Receptionist
                  </th>
                  <th>
                    Account
                  </th>
                  <th>
                    Contact
                  </th>
                  <th>
                    Aadhaar
                  </th>
                  <th>
                    Role
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
                {filteredReceptionists.map(
                  (receptionist) => {
                    const initials =
                      `${receptionist.first_name || ""}${receptionist.last_name || ""}`
                        .trim()
                        .slice(0, 2)
                        .toUpperCase() ||
                      "RC";

                    return (
                      <tr
                        key={
                          receptionist.id
                        }
                      >

                        <td>
                          <div className="admin-receptionists-person">

                            <div className="admin-receptionists-avatar">
                              {initials}
                            </div>

                            <div>
                              <strong>
                                {
                                  receptionist.first_name
                                }{" "}
                                {
                                  receptionist.last_name
                                }
                              </strong>

                              <span>
                                {
                                  receptionist.receptionist_id
                                }
                              </span>
                            </div>

                          </div>
                        </td>

                        <td>
                          <div className="admin-receptionists-account">
                            <strong>
                              {
                                receptionist.username
                              }
                            </strong>

                            <small>
                              User Account
                            </small>
                          </div>
                        </td>

                        <td>
                          <div className="admin-receptionists-contact">

                            <span>
                              {receptionist.email ||
                                "No email"}
                            </span>

                            <small>
                              {
                                receptionist.mobile_number ||
                                "No mobile"
                              }
                            </small>

                          </div>
                        </td>

                        <td>
                          <span className="admin-receptionists-aadhaar">
                            {receptionist.aadhaar_number ||
                              "Not provided"}
                          </span>
                        </td>

                        <td>
                          <span className="admin-receptionists-role">
                            {receptionist.role ||
                              "RECEPTIONIST"}
                          </span>
                        </td>

                        <td>
                          <span className="admin-receptionists-status">
                            <i />
                            {receptionist.is_active ===
                            false
                              ? "Inactive"
                              : "Active"}
                          </span>
                        </td>

                        <td>
                          <div className="admin-receptionists-actions">

                            <button
                              type="button"
                              className="admin-receptionists-edit-btn"
                              onClick={() =>
                                handleEditClick(
                                  receptionist
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="admin-receptionists-delete-btn"
                              onClick={() =>
                                handleDeleteClick(
                                  receptionist
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

      {/* =========================
          EDIT
      ========================= */}

      {editReceptionist && (
        <div className="admin-receptionists-edit-card">

          <div className="admin-receptionists-form-header">

            <div>
              <p>
                UPDATE STAFF ACCOUNT
              </p>

              <h2>
                Edit Receptionist
              </h2>

              <small>
                Receptionist ID:{" "}
                <strong>
                  {
                    editReceptionist.receptionist_id
                  }
                </strong>
              </small>
            </div>

            <button
              type="button"
              className="admin-receptionists-close-btn"
              onClick={
                handleCancelEdit
              }
            >
              ×
            </button>

          </div>

          <form
            onSubmit={handleUpdate}
            className="admin-receptionists-form"
          >

            <div className="admin-receptionists-form-grid">

              <div className="admin-receptionists-form-group">
                <label>
                  Username
                </label>

                <input
                  type="text"
                  name="username"
                  value={
                    editFormData.username
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                />
              </div>

              <div className="admin-receptionists-form-group">
                <label>
                  New Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={
                    editFormData.password
                  }
                  onChange={
                    handleEditChange
                  }
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div className="admin-receptionists-form-group">
                <label>
                  First Name
                </label>

                <input
                  type="text"
                  name="first_name"
                  value={
                    editFormData.first_name
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                />
              </div>

              <div className="admin-receptionists-form-group">
                <label>
                  Last Name
                </label>

                <input
                  type="text"
                  name="last_name"
                  value={
                    editFormData.last_name
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                />
              </div>

              <div className="admin-receptionists-form-group">
                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={
                    editFormData.email
                  }
                  onChange={
                    handleEditChange
                  }
                />
              </div>

              <div className="admin-receptionists-form-group">
                <label>
                  Mobile Number
                </label>

                <input
                  type="text"
                  name="mobile_number"
                  value={
                    editFormData.mobile_number
                  }
                  onChange={
                    handleEditChange
                  }
                />
              </div>

              <div className="admin-receptionists-form-group full">
                <label>
                  Aadhaar Number
                </label>

                <input
                  type="text"
                  name="aadhaar_number"
                  value={
                    editFormData.aadhaar_number
                  }
                  onChange={
                    handleEditChange
                  }
                  maxLength="12"
                  required
                />
              </div>

            </div>

            <div className="admin-receptionists-form-actions">

              <button
                type="button"
                className="admin-receptionists-cancel-btn"
                onClick={
                  handleCancelEdit
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-receptionists-save-btn"
              >
                Save Changes
              </button>

            </div>

          </form>
        </div>
      )}

      {/* =========================
          DELETE MODAL
      ========================= */}

      {deleteReceptionist && (
        <div className="admin-receptionists-modal-overlay">

          <div className="admin-receptionists-delete-modal">

            <div className="admin-receptionists-delete-icon">
              !
            </div>

            <h2>
              Delete Receptionist?
            </h2>

            <p>
              Are you sure you want to delete
              this receptionist account?
            </p>

            <div className="admin-receptionists-delete-person">
              <strong>
                {
                  deleteReceptionist.receptionist_id
                }
              </strong>

              <span>
                {
                  deleteReceptionist.first_name
                }{" "}
                {
                  deleteReceptionist.last_name
                }
              </span>
            </div>

            <small>
              This action cannot be undone.
            </small>

            <div className="admin-receptionists-modal-actions">

              <button
                type="button"
                className="admin-receptionists-cancel-btn"
                onClick={() =>
                  setDeleteReceptionist(
                    null
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-receptionists-confirm-delete-btn"
                onClick={
                  handleDelete
                }
              >
                Delete Receptionist
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminReceptionists;