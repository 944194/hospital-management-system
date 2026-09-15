import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminBilling.css";

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

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateTime(date) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function getStatusClass(status) {
  switch (status) {
    case "PAID":
      return "paid";

    case "PARTIALLY_PAID":
      return "partial";

    case "PENDING":
      return "pending";

    case "CANCELLED":
      return "cancelled";

    default:
      return "default";
  }
}

function getInitials(name = "") {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "P";
  }

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

function AdminBilling() {
  const [bills, setBills] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  const [formData, setFormData] = useState({
    appointment: "",
    additional_charges: "0",
    payment_status: "PENDING",
    payment_method: "",
    paid_amount: "0",
    notes: "",
  });

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  // ==========================================
  // SEARCH / FILTERS
  // ==========================================

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [
    paymentMethodFilter,
    setPaymentMethodFilter,
  ] = useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  // ==========================================
  // FETCH DATA
  // ==========================================

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        billsResponse,
        appointmentsResponse,
        doctorsResponse,
      ] = await Promise.all([
        api.get("bills/"),
        api.get("appointments/"),
        api.get("doctors/"),
      ]);

      const billsData = getData(
        billsResponse.data
      );

      const appointmentsData = getData(
        appointmentsResponse.data
      );

      const doctorsData = getData(
        doctorsResponse.data
      );

      const sortedBills = [
        ...billsData,
      ].sort((a, b) => {
        if (
          a.created_at &&
          b.created_at
        ) {
          return (
            new Date(b.created_at) -
            new Date(a.created_at)
          );
        }

        return (
          Number(b.id || 0) -
          Number(a.id || 0)
        );
      });

      setBills(sortedBills);
      setDoctors(doctorsData);

      const billedAppointmentIds =
        new Set(
          billsData.map((bill) =>
            String(
              bill.appointment
            )
          )
        );

      const billableAppointments =
        appointmentsData.filter(
          (appointment) =>
            (
              appointment.status ===
                "CONFIRMED" ||
              appointment.status ===
                "COMPLETED"
            ) &&
            !billedAppointmentIds.has(
              String(appointment.id)
            )
        );

      setAppointments(
        billableAppointments
      );
    } catch (err) {
      console.error(
        "Billing error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to load billing records."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SELECTED APPOINTMENT
  // ==========================================

  const getSelectedAppointment = () => {
    if (!formData.appointment) {
      return null;
    }

    return appointments.find(
      (appointment) =>
        String(appointment.id) ===
        String(formData.appointment)
    );
  };

  // ==========================================
  // CONSULTATION FEE
  // ==========================================

  const getConsultationFee = () => {
    const selectedAppointment =
      getSelectedAppointment();

    if (!selectedAppointment) {
      return "0.00";
    }

    const selectedDoctor =
      doctors.find(
        (doctor) =>
          String(doctor.id) ===
          String(
            selectedAppointment.doctor
          )
      );

    if (!selectedDoctor) {
      return "0.00";
    }

    return Number(
      selectedDoctor.consultation_fee || 0
    ).toFixed(2);
  };

  // ==========================================
  // ESTIMATED TOTAL
  // ==========================================

  const getEstimatedTotal = () => {
    const consultationFee =
      Number(
        getConsultationFee()
      );

    const additionalCharges =
      Number(
        formData.additional_charges || 0
      );

    return (
      consultationFee +
      additionalCharges
    ).toFixed(2);
  };

  // ==========================================
  // REMAINING AMOUNT
  // ==========================================

  const getRemainingAmount = () => {
    let totalAmount = 0;

    if (editingBill) {
      totalAmount = Number(
        editingBill.total_amount || 0
      );
    } else {
      totalAmount = Number(
        getEstimatedTotal()
      );
    }

    const paidAmount = Number(
      formData.paid_amount || 0
    );

    return Math.max(
      totalAmount - paidAmount,
      0
    ).toFixed(2);
  };

  // ==========================================
  // ADD BILL
  // ==========================================

  const handleAddBill = () => {
    setEditingBill(null);

    setFormData({
      appointment: "",
      additional_charges: "0",
      payment_status: "PENDING",
      payment_method: "",
      paid_amount: "0",
      notes: "",
    });

    setFormError("");
    setSuccessMessage("");
    setShowForm(true);

    setTimeout(() => {
      document
        .getElementById(
          "admin-billing-form"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  };

  // ==========================================
  // CREATE BILL
  // ==========================================

  const handleCreate = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    try {
      const response = await api.post(
        "bills/",
        formData
      );

      setBills((previous) =>
        [
          ...previous,
          response.data,
        ].sort((a, b) => {
          if (
            a.created_at &&
            b.created_at
          ) {
            return (
              new Date(b.created_at) -
              new Date(a.created_at)
            );
          }

          return (
            Number(b.id || 0) -
            Number(a.id || 0)
          );
        })
      );

      setAppointments((previous) =>
        previous.filter(
          (appointment) =>
            String(
              appointment.id
            ) !==
            String(
              response.data.appointment
            )
        )
      );

      setShowForm(false);

      setSuccessMessage(
        "Bill created successfully."
      );

      setFormData({
        appointment: "",
        additional_charges: "0",
        payment_status: "PENDING",
        payment_method: "",
        paid_amount: "0",
        notes: "",
      });
    } catch (err) {
      console.error(
        "Create bill error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to create bill."
        )
      );
    }
  };

  // ==========================================
  // EDIT BILL
  // ==========================================

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setShowForm(false);

    setFormData({
      appointment:
        bill.appointment || "",

      additional_charges:
        bill.additional_charges ||
        "0",

      payment_status:
        bill.payment_status ||
        "PENDING",

      payment_method:
        bill.payment_method || "",

      paid_amount:
        bill.paid_amount || "0",

      notes:
        bill.notes || "",
    });

    setFormError("");
    setSuccessMessage("");

    setTimeout(() => {
      document
        .getElementById(
          "admin-billing-form"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // ==========================================
  // UPDATE BILL
  // ==========================================

  const handleUpdate = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    try {
      const updateData = {
        payment_status:
          formData.payment_status,

        payment_method:
          formData.payment_method,

        paid_amount:
          formData.paid_amount,

        notes:
          formData.notes,
      };

      const response = await api.patch(
        `bills/${editingBill.id}/`,
        updateData
      );

      setBills((previous) =>
        previous
          .map((bill) =>
            bill.id === editingBill.id
              ? response.data
              : bill
          )
          .sort((a, b) => {
            if (
              a.created_at &&
              b.created_at
            ) {
              return (
                new Date(b.created_at) -
                new Date(a.created_at)
              );
            }

            return (
              Number(b.id || 0) -
              Number(a.id || 0)
            );
          })
      );

      setEditingBill(null);

      setSuccessMessage(
        "Bill updated successfully."
      );
    } catch (err) {
      console.error(
        "Update bill error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to update bill."
        )
      );
    }
  };

  // ==========================================
  // CANCEL FORM
  // ==========================================

  const handleCancel = () => {
    setShowForm(false);
    setEditingBill(null);
    setFormError("");
  };

  // ==========================================
  // FILTERING
  // ==========================================

  const filteredBills = useMemo(() => {
    const search =
      searchTerm
        .trim()
        .toLowerCase();

    return bills.filter((bill) => {
      const searchableValues = [
        bill.bill_id,
        bill.patient_id,
        bill.patient_name,
        bill.doctor_id,
        bill.doctor_name,
        bill.appointment_id,
        bill.appointment,
        bill.payment_method,
        bill.notes,
      ];

      const matchesSearch =
        !search ||
        searchableValues.some(
          (value) =>
            String(value || "")
              .toLowerCase()
              .includes(search)
        );

      const matchesStatus =
        !statusFilter ||
        String(
          bill.payment_status || ""
        ) === statusFilter;

      const matchesPaymentMethod =
        !paymentMethodFilter ||
        String(
          bill.payment_method || ""
        ) === paymentMethodFilter;

      const appointmentDate =
        bill.appointment_date || "";

      const matchesFromDate =
        !fromDate ||
        (
          appointmentDate &&
          appointmentDate >= fromDate
        );

      const matchesToDate =
        !toDate ||
        (
          appointmentDate &&
          appointmentDate <= toDate
        );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPaymentMethod &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    bills,
    searchTerm,
    statusFilter,
    paymentMethodFilter,
    fromDate,
    toDate,
  ]);

  // ==========================================
  // FILTER OPTIONS
  // ==========================================

  const paymentStatuses = useMemo(
    () =>
      [
        ...new Set(
          bills
            .map(
              (bill) =>
                bill.payment_status
            )
            .filter(Boolean)
        ),
      ],
    [bills]
  );

  const paymentMethods = useMemo(
    () =>
      [
        ...new Set(
          bills
            .map(
              (bill) =>
                bill.payment_method
            )
            .filter(Boolean)
        ),
      ],
    [bills]
  );

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    const totalBilled = bills.reduce(
      (sum, bill) =>
        sum +
        Number(
          bill.total_amount || 0
        ),
      0
    );

    const totalPaid = bills.reduce(
      (sum, bill) =>
        sum +
        Number(
          bill.paid_amount || 0
        ),
      0
    );

    const pendingAmount =
      Math.max(
        totalBilled - totalPaid,
        0
      );

    const paidBills = bills.filter(
      (bill) =>
        bill.payment_status ===
        "PAID"
    ).length;

    const pendingBills =
      bills.filter(
        (bill) =>
          bill.payment_status ===
            "PENDING" ||
          bill.payment_status ===
            "PARTIALLY_PAID"
      ).length;

    return {
      totalBilled,
      totalPaid,
      pendingAmount,
      paidBills,
      pendingBills,
    };
  }, [bills]);

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPaymentMethodFilter("");
    setFromDate("");
    setToDate("");
  };

  const hasFilters =
    searchTerm ||
    statusFilter ||
    paymentMethodFilter ||
    fromDate ||
    toDate;

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="admin-billing-page">
        <div className="admin-billing-state">
          <div className="admin-billing-spinner" />

          <p>
            Loading billing records...
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
      <div className="admin-billing-page">
        <div className="admin-billing-state">
          <div className="admin-billing-state-icon">
            !
          </div>

          <h2>
            Unable to load billing
            records
          </h2>

          <p>{error}</p>

          <button
            className="admin-billing-primary-btn"
            onClick={fetchData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <div className="admin-billing-page">

      {/* ========================================
          HEADER
          ======================================== */}

      <div className="admin-billing-header">

        <div>
          <p className="admin-billing-eyebrow">
            FINANCE & BILLING
          </p>

          <h1>
            Billing
          </h1>

          <p>
            Manage hospital bills, payments
            and outstanding balances.
          </p>
        </div>

        {!showForm && !editingBill && (
          <button
            className="admin-billing-primary-btn"
            onClick={handleAddBill}
          >
            + Create Bill
          </button>
        )}

      </div>

      {/* ========================================
          MESSAGES
          ======================================== */}

      {successMessage && (
        <div className="admin-billing-success">
          <span>✓</span>
          {successMessage}
        </div>
      )}

      {formError &&
        !showForm &&
        !editingBill && (
          <div className="admin-billing-error">
            <span>!</span>
            {formError}
          </div>
        )}

      {/* ========================================
          SUMMARY
          ======================================== */}

      <div className="admin-billing-summary-grid">

        <div className="admin-billing-summary-card">
          <div className="admin-billing-summary-icon">
            BL
          </div>

          <div>
            <span>Total Bills</span>

            <strong>
              {bills.length}
            </strong>

            <small>
              {summary.paidBills} paid
            </small>
          </div>
        </div>

        <div className="admin-billing-summary-card">
          <div className="admin-billing-summary-icon">
            ₹
          </div>

          <div>
            <span>Total Billed</span>

            <strong>
              {formatCurrency(
                summary.totalBilled
              )}
            </strong>

            <small>
              Across all bills
            </small>
          </div>
        </div>

        <div className="admin-billing-summary-card">
          <div className="admin-billing-summary-icon">
            PD
          </div>

          <div>
            <span>Total Collected</span>

            <strong>
              {formatCurrency(
                summary.totalPaid
              )}
            </strong>

            <small>
              Payments received
            </small>
          </div>
        </div>

        <div className="admin-billing-summary-card">
          <div className="admin-billing-summary-icon">
            DU
          </div>

          <div>
            <span>Due Amount</span>

            <strong>
              {formatCurrency(
                summary.pendingAmount
              )}
            </strong>

            <small>
              {summary.pendingBills} bills
              pending
            </small>
          </div>
        </div>

      </div>

      {/* ========================================
          CREATE / EDIT FORM
          ======================================== */}

      {(showForm || editingBill) && (
        <div
          id="admin-billing-form"
          className="admin-billing-form-card"
        >

          <div className="admin-billing-form-header">

            <div>
              <p>
                {editingBill
                  ? "PAYMENT UPDATE"
                  : "BILL CREATION"}
              </p>

              <h2>
                {editingBill
                  ? "Edit Bill"
                  : "Create New Bill"}
              </h2>

              <span>
                {editingBill
                  ? "Update payment and collection details."
                  : "Create a bill for a confirmed or completed appointment."}
              </span>
            </div>

            <button
              type="button"
              className="admin-billing-close-btn"
              onClick={handleCancel}
            >
              ×
            </button>

          </div>

          {formError && (
            <div className="admin-billing-form-error">
              <span>!</span>
              {formError}
            </div>
          )}

          {editingBill ? (
            <>
              {/* BILL INFORMATION */}

              <div className="admin-billing-info-grid">

                <div>
                  <span>Bill ID</span>

                  <strong>
                    {editingBill.bill_id ||
                      `BILL${editingBill.id}`}
                  </strong>
                </div>

                <div>
                  <span>Patient</span>

                  <strong>
                    {editingBill.patient_name ||
                      "—"}
                  </strong>

                  <small>
                    {editingBill.patient_id ||
                      "—"}
                  </small>
                </div>

                <div>
                  <span>Doctor</span>

                  <strong>
                    {editingBill.doctor_name ||
                      "—"}
                  </strong>

                  <small>
                    {editingBill.doctor_id ||
                      "—"}
                  </small>
                </div>

                <div>
                  <span>Appointment</span>

                  <strong>
                    {editingBill.appointment_id ||
                      editingBill.appointment ||
                      "—"}
                  </strong>

                  <small>
                    {formatDate(
                      editingBill.appointment_date
                    )}{" "}
                    {editingBill.appointment_time ||
                      ""}
                  </small>
                </div>

              </div>

              <div className="admin-billing-amount-grid">

                <div>
                  <span>
                    Consultation Fee
                  </span>

                  <strong>
                    {formatCurrency(
                      editingBill.consultation_fee
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Additional Charges
                  </span>

                  <strong>
                    {formatCurrency(
                      editingBill.additional_charges
                    )}
                  </strong>
                </div>

                <div className="highlight">
                  <span>
                    Total Amount
                  </span>

                  <strong>
                    {formatCurrency(
                      editingBill.total_amount
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Current Due
                  </span>

                  <strong>
                    {formatCurrency(
                      Math.max(
                        Number(
                          editingBill.total_amount ||
                            0
                        ) -
                          Number(
                            editingBill.paid_amount ||
                              0
                          ),
                        0
                      )
                    )}
                  </strong>
                </div>

              </div>

              <form onSubmit={handleUpdate}>

                <div className="admin-billing-form-grid">

                  <div className="admin-billing-form-group">
                    <label>
                      Payment Status
                    </label>

                    <select
                      name="payment_status"
                      value={
                        formData.payment_status
                      }
                      onChange={handleChange}
                      required
                    >
                      <option value="PENDING">
                        PENDING
                      </option>

                      <option value="PARTIALLY_PAID">
                        PARTIALLY PAID
                      </option>

                      <option value="PAID">
                        PAID
                      </option>

                      <option value="CANCELLED">
                        CANCELLED
                      </option>
                    </select>
                  </div>

                  <div className="admin-billing-form-group">
                    <label>
                      Payment Method
                    </label>

                    <select
                      name="payment_method"
                      value={
                        formData.payment_method
                      }
                      onChange={handleChange}
                    >
                      <option value="">
                        Select Payment Method
                      </option>

                      <option value="CASH">
                        CASH
                      </option>

                      <option value="UPI">
                        UPI
                      </option>

                      <option value="CARD">
                        CARD
                      </option>

                      <option value="BANK_TRANSFER">
                        BANK TRANSFER
                      </option>
                    </select>
                  </div>

                  <div className="admin-billing-form-group">
                    <label>
                      Paid Amount
                    </label>

                    <input
                      type="number"
                      name="paid_amount"
                      value={
                        formData.paid_amount
                      }
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="admin-billing-form-group">
                    <label>
                      Remaining Amount
                    </label>

                    <input
                      type="text"
                      value={formatCurrency(
                        getRemainingAmount()
                      )}
                      readOnly
                    />
                  </div>

                </div>

                <div className="admin-billing-form-group full">
                  <label>
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={
                      formData.notes
                    }
                    onChange={handleChange}
                    placeholder="Add billing or payment notes..."
                  />
                </div>

                <div className="admin-billing-form-actions">

                  <button
                    type="button"
                    className="admin-billing-cancel-btn"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-billing-save-btn"
                  >
                    Update Bill
                  </button>

                </div>

              </form>
            </>
          ) : (
            <form onSubmit={handleCreate}>

              <div className="admin-billing-form-grid">

                <div className="admin-billing-form-group full">
                  <label>
                    Appointment
                  </label>

                  <select
                    name="appointment"
                    value={
                      formData.appointment
                    }
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select Appointment
                    </option>

                    {appointments.map(
                      (appointment) => (
                        <option
                          key={
                            appointment.id
                          }
                          value={
                            appointment.id
                          }
                        >
                          #
                          {
                            appointment.id
                          }{" "}
                          —{" "}
                          {
                            appointment.patient_name
                          }{" "}
                          —{" "}
                          {
                            appointment.doctor_name
                          }{" "}
                          —{" "}
                          {
                            appointment.appointment_date
                          }{" "}
                          {
                            appointment.appointment_time
                          }
                        </option>
                      )
                    )}
                  </select>

                  {!appointments.length && (
                    <small className="admin-billing-help">
                      No confirmed or completed
                      unbilled appointments
                      are currently available.
                    </small>
                  )}
                </div>

                <div className="admin-billing-form-group">
                  <label>
                    Consultation Fee
                  </label>

                  <input
                    type="text"
                    value={formatCurrency(
                      getConsultationFee()
                    )}
                    readOnly
                  />
                </div>

                <div className="admin-billing-form-group">
                  <label>
                    Additional Charges
                  </label>

                  <input
                    type="number"
                    name="additional_charges"
                    value={
                      formData.additional_charges
                    }
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="admin-billing-form-group">
                  <label>
                    Estimated Total
                  </label>

                  <input
                    type="text"
                    value={formatCurrency(
                      getEstimatedTotal()
                    )}
                    readOnly
                  />
                </div>

                <div className="admin-billing-form-group">
                  <label>
                    Payment Status
                  </label>

                  <select
                    name="payment_status"
                    value={
                      formData.payment_status
                    }
                    onChange={handleChange}
                    required
                  >
                    <option value="PENDING">
                      PENDING
                    </option>

                    <option value="PARTIALLY_PAID">
                      PARTIALLY PAID
                    </option>

                    <option value="PAID">
                      PAID
                    </option>

                    <option value="CANCELLED">
                      CANCELLED
                    </option>
                  </select>
                </div>

                <div className="admin-billing-form-group">
                  <label>
                    Payment Method
                  </label>

                  <select
                    name="payment_method"
                    value={
                      formData.payment_method
                    }
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Payment Method
                    </option>

                    <option value="CASH">
                      CASH
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="CARD">
                      CARD
                    </option>

                    <option value="BANK_TRANSFER">
                      BANK TRANSFER
                    </option>
                  </select>
                </div>

                <div className="admin-billing-form-group">
                  <label>
                    Paid Amount
                  </label>

                  <input
                    type="number"
                    name="paid_amount"
                    value={
                      formData.paid_amount
                    }
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="admin-billing-form-group">
                  <label>
                    Remaining Amount
                  </label>

                  <input
                    type="text"
                    value={formatCurrency(
                      getRemainingAmount()
                    )}
                    readOnly
                  />
                </div>

              </div>

              <div className="admin-billing-form-group full">
                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={
                    formData.notes
                  }
                  onChange={handleChange}
                  placeholder="Add billing or payment notes..."
                />
              </div>

              <div className="admin-billing-form-actions">

                <button
                  type="button"
                  className="admin-billing-cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-billing-save-btn"
                  disabled={
                    !appointments.length
                  }
                >
                  Create Bill
                </button>

              </div>

            </form>
          )}

        </div>
      )}

      {/* ========================================
          FILTERS
          ======================================== */}

      <div className="admin-billing-filter-card">

        <div className="admin-billing-filter-header">

          <div>
            <p>SEARCH & FILTER</p>

            <h2>
              Billing Records
            </h2>
          </div>

          <span>
            {filteredBills.length} shown
          </span>

        </div>

        <div className="admin-billing-filter-grid">

          <div className="admin-billing-filter-group search">
            <label>
              Search
            </label>

            <div className="admin-billing-search-box">
              <span>⌕</span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Bill ID, patient, doctor, appointment..."
              />
            </div>
          </div>

          <div className="admin-billing-filter-group">
            <label>
              Payment Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Statuses
              </option>

              {paymentStatuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="admin-billing-filter-group">
            <label>
              Payment Method
            </label>

            <select
              value={
                paymentMethodFilter
              }
              onChange={(event) =>
                setPaymentMethodFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Methods
              </option>

              {paymentMethods.map(
                (method) => (
                  <option
                    key={method}
                    value={method}
                  >
                    {method}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="admin-billing-filter-group">
            <label>
              From Date
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
            />
          </div>

          <div className="admin-billing-filter-group">
            <label>
              To Date
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              className="admin-billing-clear-btn"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}

        </div>

      </div>

      {/* ========================================
          TABLE
          ======================================== */}

      <div className="admin-billing-table-card">

        <div className="admin-billing-table-header">

          <div>
            <p>BILLING DIRECTORY</p>

            <h2>
              Hospital Bills
            </h2>
          </div>

          <span className="admin-billing-table-count">
            {filteredBills.length}
          </span>

        </div>

        {bills.length === 0 ? (
          <div className="admin-billing-empty">

            <div className="admin-billing-empty-icon">
              ₹
            </div>

            <h3>
              No billing records
            </h3>

            <p>
              Create a bill for a confirmed
              or completed appointment.
            </p>

          </div>
        ) : filteredBills.length === 0 ? (
          <div className="admin-billing-empty">

            <div className="admin-billing-empty-icon">
              ?
            </div>

            <h3>
              No matching bills
            </h3>

            <p>
              Try changing your search or
              filter criteria.
            </p>

            <button
              type="button"
              className="admin-billing-clear-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          </div>
        ) : (
          <div className="admin-billing-table-wrapper">

            <table className="admin-billing-table">

              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Appointment</th>
                  <th>Charges</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Due</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredBills.map(
                  (bill) => {

                    const total =
                      Number(
                        bill.total_amount ||
                          0
                      );

                    const paid =
                      Number(
                        bill.paid_amount ||
                          0
                      );

                    const remaining =
                      Math.max(
                        total - paid,
                        0
                      );

                    return (
                      <tr
                        key={bill.id}
                      >

                        {/* BILL */}

                        <td>
                          <div className="admin-billing-bill-cell">

                            <strong>
                              {bill.bill_id ||
                                `BILL${String(
                                  bill.id
                                ).padStart(
                                  4,
                                  "0"
                                )}`}
                            </strong>

                            <span>
                              #{bill.id}
                            </span>

                          </div>
                        </td>

                        {/* PATIENT */}

                        <td>
                          <div className="admin-billing-person">

                            <div className="admin-billing-avatar">
                              {getInitials(
                                bill.patient_name
                              )}
                            </div>

                            <div>
                              <strong>
                                {
                                  bill.patient_name ||
                                  "—"
                                }
                              </strong>

                              <span>
                                {
                                  bill.patient_id ||
                                  "—"
                                }
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* DOCTOR */}

                        <td>
                          <div className="admin-billing-doctor">

                            <strong>
                              {
                                bill.doctor_name ||
                                "—"
                              }
                            </strong>

                            <span>
                              {
                                bill.doctor_id ||
                                "—"
                              }
                            </span>

                          </div>
                        </td>

                        {/* APPOINTMENT */}

                        <td>
                          <div className="admin-billing-appointment">

                            <strong>
                              {
                                bill.appointment_id ||
                                bill.appointment ||
                                "—"
                              }
                            </strong>

                            <span>
                              {formatDate(
                                bill.appointment_date
                              )}

                              {bill.appointment_time
                                ? ` • ${bill.appointment_time}`
                                : ""}
                            </span>

                          </div>
                        </td>

                        {/* CHARGES */}

                        <td>
                          <div className="admin-billing-charges">

                            <span>
                              Consultation{" "}
                              {formatCurrency(
                                bill.consultation_fee
                              )}
                            </span>

                            <span>
                              Additional{" "}
                              {formatCurrency(
                                bill.additional_charges
                              )}
                            </span>

                          </div>
                        </td>

                        {/* TOTAL */}

                        <td>
                          <strong className="admin-billing-total">
                            {formatCurrency(
                              bill.total_amount
                            )}
                          </strong>
                        </td>

                        {/* PAYMENT */}

                        <td>
                          <div className="admin-billing-payment">

                            <span
                              className={`admin-billing-status ${getStatusClass(
                                bill.payment_status
                              )}`}
                            >
                              {
                                bill.payment_status ||
                                "—"
                              }
                            </span>

                            <small>
                              {bill.payment_method ||
                                "No method"}
                            </small>

                            <small>
                              Paid{" "}
                              {formatCurrency(
                                bill.paid_amount
                              )}
                            </small>

                          </div>
                        </td>

                        {/* DUE */}

                        <td>
                          <strong
                            className={
                              remaining > 0
                                ? "admin-billing-due"
                                : "admin-billing-paid-total"
                            }
                          >
                            {formatCurrency(
                              remaining
                            )}
                          </strong>
                        </td>

                        {/* CREATED */}

                        <td>
                          <span className="admin-billing-created">
                            {formatDateTime(
                              bill.created_at
                            )}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td>
                          <button
                            type="button"
                            className="admin-billing-edit-btn"
                            onClick={() =>
                              handleEdit(
                                bill
                              )
                            }
                          >
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

export default AdminBilling;