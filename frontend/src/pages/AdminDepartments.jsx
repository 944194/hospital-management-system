import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminDepartments.css";

function AdminDepartments() {
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);

      const response = await api.get("departments/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setDepartments(data);
      setError("");
    } catch (err) {
      console.error("Departments error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load departments."
      );
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (err, fallback) => {
    if (!err.response?.data) {
      return fallback;
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
      return Object.values(data)
        .flat()
        .join(" ");
    }

    return fallback;
  };

  const filteredDepartments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return [...departments]
      .filter((department) => {
        if (!search) {
          return true;
        }

        return (
          String(department.id || "")
            .toLowerCase()
            .includes(search) ||
          String(department.name || "")
            .toLowerCase()
            .includes(search)
        );
      })
      .sort(
        (a, b) =>
          Number(a.id) - Number(b.id)
      );
  }, [departments, searchTerm]);

  // CREATE / EDIT DEPARTMENT
  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setMessage("");

    const trimmedName = departmentName.trim();

    if (!trimmedName) {
      setFormError(
        "Department name is required."
      );
      return;
    }

    try {
      if (editingDepartment) {
        // EDIT DEPARTMENT
        const response = await api.put(
          `departments/${editingDepartment.id}/`,
          {
            name: trimmedName,
          }
        );

        setDepartments((currentDepartments) =>
          currentDepartments.map((department) =>
            department.id === editingDepartment.id
              ? response.data
              : department
          )
        );

        setMessage(
          `"${trimmedName}" updated successfully.`
        );
      } else {
        // CREATE DEPARTMENT
        const response = await api.post(
          "departments/",
          {
            name: trimmedName,
          }
        );

        setDepartments((currentDepartments) => [
          ...currentDepartments,
          response.data,
        ]);

        setMessage(
          "Department created successfully."
        );
      }

      setDepartmentName("");
      setEditingDepartment(null);
      setShowForm(false);

    } catch (err) {
      console.error(
        editingDepartment
          ? "Update department error:"
          : "Create department error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          editingDepartment
            ? "Unable to update department."
            : "Unable to create department."
        )
      );
    }
  };

  // EDIT DEPARTMENT
  const handleEdit = (department) => {
    setEditingDepartment(department);
    setDepartmentName(department.name || "");
    setShowForm(true);
    setFormError("");
    setMessage("");
  };

  // DELETE DEPARTMENT
  const handleDelete = async (department) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${department.name}"?`
    );

    if (!confirmDelete) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await api.delete(
        `departments/${department.id}/`
      );

      setDepartments((currentDepartments) =>
        currentDepartments.filter(
          (item) =>
            item.id !== department.id
        )
      );

      setMessage(
        `"${department.name}" deleted successfully.`
      );
    } catch (err) {
      console.error(
        "Delete department error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to delete department."
        )
      );
    }
  };

  // TOGGLE CREATE / EDIT FORM
  const handleToggleForm = () => {
    if (showForm) {
      setShowForm(false);
      setEditingDepartment(null);
      setDepartmentName("");
      setFormError("");
      setMessage("");
      return;
    }

    setEditingDepartment(null);
    setDepartmentName("");
    setShowForm(true);
    setFormError("");
    setMessage("");
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="admin-departments-page">
        <div className="admin-departments-state">
          <div className="admin-departments-spinner" />
          <p>Loading departments...</p>
        </div>
      </div>
    );
  }

  if (error && departments.length === 0) {
    return (
      <div className="admin-departments-page">
        <div className="admin-departments-state">
          <div className="admin-departments-state-icon">
            !
          </div>

          <h2>Unable to load departments</h2>

          <p>{error}</p>

          <button
            className="admin-departments-retry-btn"
            onClick={fetchDepartments}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-departments-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="admin-departments-header">
        <div>
          <p className="admin-departments-eyebrow">
            HOSPITAL ADMINISTRATION
          </p>

          <h1>Departments</h1>

          <p>
            Manage hospital departments and
            clinical specialties.
          </p>
        </div>

        <div className="admin-departments-header-actions">
          <div className="admin-departments-count">
            <span>Total</span>

            <strong>
              {departments.length}
            </strong>

            <small>Departments</small>
          </div>

          <button
            className="admin-departments-primary-btn"
            onClick={handleToggleForm}
          >
            <span>
              {showForm ? "×" : "+"}
            </span>

            {showForm
              ? "Close Form"
              : "Add Department"}
          </button>
        </div>
      </div>

      {/* =========================
          MESSAGES
      ========================= */}

      {message && (
        <div className="admin-departments-success">
          <span>✓</span>
          {message}
        </div>
      )}

      {error && departments.length > 0 && (
        <div className="admin-departments-error">
          <span>!</span>
          {error}
        </div>
      )}

      {/* =========================
          CREATE / EDIT FORM
      ========================= */}

      {showForm && (
        <div className="admin-departments-form-card">

          <div className="admin-departments-form-header">
            <div>
              <p>
                {editingDepartment
                  ? "EDIT DEPARTMENT"
                  : "NEW DEPARTMENT"}
              </p>

              <h2>
                {editingDepartment
                  ? "Edit Department"
                  : "Create Department"}
              </h2>
            </div>

            <button
              type="button"
              className="admin-departments-close-btn"
              onClick={handleToggleForm}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="admin-departments-form"
          >
            {formError && (
              <div className="admin-departments-form-error">
                <span>!</span>
                {formError}
              </div>
            )}

            <div className="admin-departments-input-group">
              <label>
                Department Name
              </label>

              <input
                type="text"
                value={departmentName}
                onChange={(event) =>
                  setDepartmentName(
                    event.target.value
                  )
                }
                placeholder="Example: Neurology"
                autoFocus
                required
              />

              <small>
                Enter the official hospital
                department name.
              </small>
            </div>

            <div className="admin-departments-form-actions">

              <button
                type="button"
                className="admin-departments-cancel-btn"
                onClick={handleToggleForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-departments-save-btn"
              >
                {editingDepartment
                  ? "Save Changes"
                  : "Create Department"}
              </button>

            </div>
          </form>
        </div>
      )}

      {/* =========================
          SEARCH
      ========================= */}

      <div className="admin-departments-search-card">

        <div className="admin-departments-search-header">
          <div>
            <p>DEPARTMENT DIRECTORY</p>

            <h2>Search Departments</h2>
          </div>

          <span>
            {filteredDepartments.length} result
            {filteredDepartments.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        <div className="admin-departments-search-box">
          <span>⌕</span>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search by department name or ID..."
          />

          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {searchTerm && (
          <div className="admin-departments-search-footer">
            Showing {filteredDepartments.length} of{" "}
            {departments.length} departments
          </div>
        )}
      </div>

      {/* =========================
          TABLE
      ========================= */}

      <div className="admin-departments-table-card">

        <div className="admin-departments-table-header">
          <div>
            <p>ALL DEPARTMENTS</p>

            <h2>Department Directory</h2>
          </div>

          <span>
            {departments.length} Total
          </span>
        </div>

        {filteredDepartments.length === 0 ? (
          <div className="admin-departments-empty">

            <div className="admin-departments-empty-icon">
              {departments.length === 0
                ? "+"
                : "⌕"}
            </div>

            <h3>
              {departments.length === 0
                ? "No departments found"
                : "No matching departments"}
            </h3>

            <p>
              {departments.length === 0
                ? "Create your first hospital department to get started."
                : "Try changing your search term."}
            </p>

            {searchTerm && (
              <button
                className="admin-departments-clear-btn"
                onClick={clearSearch}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="admin-departments-table-wrapper">

            <table className="admin-departments-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDepartments.map(
                  (department) => (
                    <tr key={department.id}>

                      <td>
                        <span className="admin-departments-id">
                          #{department.id}
                        </span>
                      </td>

                      <td>
                        <div className="admin-departments-person">

                          <div className="admin-departments-avatar">
                            {department.name
                              ?.charAt(0)
                              ?.toUpperCase() || "D"}
                          </div>

                          <div>
                            <strong>
                              {department.name}
                            </strong>

                            <span>
                              Hospital Department
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span className="admin-departments-status">
                          <i />
                          Active
                        </span>
                      </td>

                      <td>
                        <div className="admin-departments-action-buttons">

                          <button
                            type="button"
                            className="admin-departments-edit-btn"
                            onClick={() =>
                              handleEdit(department)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="admin-departments-delete-btn"
                            onClick={() =>
                              handleDelete(department)
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

export default AdminDepartments;