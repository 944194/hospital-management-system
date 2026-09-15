import { useEffect, useState } from "react";
import api from "../services/api";
import "./ReceptionistBilling.css";

function ReceptionistBilling() {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const getData = (response) => {
    return Array.isArray(response?.data)
      ? response.data
      : response?.data?.results || [];
  };

  const getErrorMessage = (err) => {
    const data = err.response?.data;

    if (!data) {
      return "Unable to save billing record.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (typeof data === "object") {
      return Object.entries(data)
        .map(([field, message]) => {
          if (Array.isArray(message)) {
            return `${field}: ${message.join(" ")}`;
          }

          return `${field}: ${message}`;
        })
        .join(" ");
    }

    return "Unable to save billing record.";
  };

  // ==========================================
  // FETCH BILLING DATA
  // ==========================================

  const fetchData = async () => {
    try {
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

      const billsData = getData(billsResponse);
      const appointmentsData = getData(appointmentsResponse);
      const doctorsData = getData(doctorsResponse);

      const sortedBills = [...billsData].sort((a, b) => {
        return (
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
        );
      });

      setBills(sortedBills);
      setFilteredBills(sortedBills);
      setAppointments(appointmentsData);
      setDoctors(doctorsData);
    } catch (err) {
      console.error("Billing data error:", err);
      setError("Unable to load billing data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // SEARCH BILL
  // ==========================================

  const handleBillSearch = (e) => {
    const value = e.target.value.toLowerCase();

    setSearchTerm(e.target.value);

    if (!value.trim()) {
      setFilteredBills(bills);
      return;
    }

    const results = bills.filter((bill) => {
      const billId = bill.bill_id?.toLowerCase() || "";
      const patientId = bill.patient_id?.toLowerCase() || "";

      const patientName =
        bill.patient_name?.toLowerCase() || "";

      return (
        billId.includes(value) ||
        patientId.includes(value) ||
        patientName.includes(value)
      );
    });

    setFilteredBills(results);
  };

  // ==========================================
  // HANDLE FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData({
      appointment: "",
      additional_charges: "0",
      payment_status: "PENDING",
      payment_method: "",
      paid_amount: "0",
      notes: "",
    });

    setEditingBill(null);
    setShowForm(false);
    setError("");
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

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // ==========================================
  // EDIT BILL
  // ==========================================

  const handleEdit = (bill) => {
    setEditingBill(bill);

    setFormData({
      appointment: bill.appointment || "",
      additional_charges:
        bill.additional_charges || "0",
      payment_status:
        bill.payment_status || "PENDING",
      payment_method:
        bill.payment_method || "",
      paid_amount:
        bill.paid_amount || "0",
      notes: bill.notes || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // ==========================================
  // GET CONSULTATION FEE
  // ==========================================

  const getConsultationFee = () => {
    if (!formData.appointment) {
      return 0;
    }

    const appointment = appointments.find(
      (item) =>
        item.id === Number(formData.appointment)
    );

    if (!appointment) {
      return 0;
    }

    const doctor = doctors.find(
      (item) => item.id === appointment.doctor
    );

    return Number(
      doctor?.consultation_fee || 0
    );
  };

  // ==========================================
  // GET TOTAL AMOUNT
  // ==========================================

  const getTotalAmount = () => {
    const consultationFee =
      getConsultationFee();

    const additionalCharges = Number(
      formData.additional_charges || 0
    );

    return consultationFee + additionalCharges;
  };

  // ==========================================
  // GET CURRENT TOTAL
  // ==========================================

  const getCurrentTotalAmount = () => {
    if (editingBill) {
      return Number(
        editingBill.total_amount || 0
      );
    }

    return getTotalAmount();
  };

  // ==========================================
  // GET REMAINING AMOUNT
  // ==========================================

  const getRemainingAmount = () => {
    const totalAmount =
      getCurrentTotalAmount();

    const paidAmount = Number(
      formData.paid_amount || 0
    );

    return Math.max(
      totalAmount - paidAmount,
      0
    );
  };

  // ==========================================
  // TABLE REMAINING AMOUNT
  // ==========================================

  const getBillRemainingAmount = (bill) => {
    const totalAmount = Number(
      bill.total_amount || 0
    );

    const paidAmount = Number(
      bill.paid_amount || 0
    );

    return Math.max(
      totalAmount - paidAmount,
      0
    ).toFixed(2);
  };

  // ==========================================
  // PAYMENT STATUS
  // ==========================================

  const handleStatusChange = (e) => {
    const status = e.target.value;

    let paidAmount =
      formData.paid_amount;

    if (
      status === "PENDING" ||
      status === "CANCELLED"
    ) {
      paidAmount = "0";
    }

    if (status === "PAID") {
      if (editingBill) {
        paidAmount =
          editingBill.total_amount;
      } else {
        paidAmount =
          getTotalAmount().toFixed(2);
      }
    }

    setFormData((previous) => ({
      ...previous,
      payment_status: status,
      paid_amount: paidAmount,
    }));

    setError("");
  };

  // ==========================================
  // SUBMIT BILL
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      if (editingBill) {
        await api.patch(
          `bills/${editingBill.id}/`,
          {
            payment_status:
              formData.payment_status,
            payment_method:
              formData.payment_method || null,
            paid_amount: Number(
              formData.paid_amount
            ),
            notes: formData.notes,
          }
        );

        setSuccess(
          "Bill updated successfully."
        );
      } else {
        if (!formData.appointment) {
          setError(
            "Please select an appointment."
          );
          return;
        }

        await api.post("bills/", {
          appointment: Number(
            formData.appointment
          ),
          additional_charges: Number(
            formData.additional_charges
          ),
          payment_status:
            formData.payment_status,
          payment_method:
            formData.payment_method || null,
          paid_amount: Number(
            formData.paid_amount
          ),
          notes: formData.notes,
        });

        setSuccess(
          "Bill created successfully."
        );
      }

      resetForm();
      await fetchData();
    } catch (err) {
      console.error(
        "Billing save error:",
        err
      );

      setError(getErrorMessage(err));
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="receptionist-billing-page">
        <div className="receptionist-billing-state">
          <div className="receptionist-billing-spinner" />
          <p>Loading billing records...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="receptionist-billing-page">

      {/* HEADER */}

      <div className="receptionist-billing-header">
        <div>
          <div className="receptionist-billing-eyebrow">
            FINANCE & PAYMENTS
          </div>

          <h1>Billing Management</h1>

          <p>
            View and manage hospital billing
            and payment records.
          </p>
        </div>

        <button
          className="receptionist-billing-primary-btn"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              handleAddBill();
            }
          }}
        >
          {showForm
            ? "Close Form"
            : "+ Add Bill"}
        </button>
      </div>

      {/* SUMMARY + SEARCH */}

      <div className="receptionist-billing-toolbar">

        <div className="receptionist-billing-summary">
          <span>Total Bills</span>
          <strong>{bills.length}</strong>
        </div>

        <div className="receptionist-billing-search">
          <span>⌕</span>

          <input
            type="text"
            value={searchTerm}
            onChange={handleBillSearch}
            placeholder="Search Bill ID, Patient ID or patient name"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFilteredBills(bills);
              }}
            >
              ×
            </button>
          )}
        </div>

      </div>

      {/* MESSAGES */}

      {success && (
        <div className="receptionist-billing-success">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="receptionist-billing-error">
          ⚠ {error}
        </div>
      )}

      {/* FORM */}

      {showForm && (
        <div className="receptionist-billing-form-card">

          <div className="receptionist-billing-form-header">
            <div>
              <span className="receptionist-billing-section-eyebrow">
                BILLING RECORD
              </span>

              <h2>
                {editingBill
                  ? "Edit Bill"
                  : "Create New Bill"}
              </h2>
            </div>

            <button
              type="button"
              className="receptionist-billing-close-btn"
              onClick={resetForm}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="receptionist-billing-form-grid">

              {/* APPOINTMENT */}

              {!editingBill && (
                <div className="receptionist-billing-form-group full">
                  <label>
                    Appointment *
                  </label>

                  <select
                    name="appointment"
                    value={formData.appointment}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select Appointment
                    </option>

                    {appointments
                      .filter(
                        (appointment) =>
                          appointment.status ===
                            "CONFIRMED" ||
                          appointment.status ===
                            "COMPLETED"
                      )
                      .filter(
                        (appointment) =>
                          !bills.some(
                            (bill) =>
                              bill.appointment ===
                              appointment.id
                          )
                      )
                      .map((appointment) => (
                        <option
                          key={appointment.id}
                          value={appointment.id}
                        >
                          {appointment.patient_name} -
                          Dr.{" "}
                          {appointment.doctor_name} -
                          {appointment.appointment_date}{" "}
                          {appointment.appointment_time}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* EDIT APPOINTMENT */}

              {editingBill && (
                <div className="receptionist-billing-form-group full">
                  <label>Appointment</label>

                  <input
                    type="text"
                    value={`${editingBill.patient_name} - Dr. ${editingBill.doctor_name} - ${editingBill.appointment_date} ${editingBill.appointment_time}`}
                    readOnly
                  />
                </div>
              )}

              {/* CREATE AMOUNTS */}

              {!editingBill &&
                formData.appointment && (
                  <>
                    <div className="receptionist-billing-form-group">
                      <label>
                        Consultation Fee
                      </label>

                      <input
                        type="text"
                        value={`₹${getConsultationFee().toFixed(
                          2
                        )}`}
                        readOnly
                      />
                    </div>

                    <div className="receptionist-billing-form-group">
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

                    <div className="receptionist-billing-form-group">
                      <label>Total Amount</label>

                      <input
                        type="text"
                        value={`₹${getTotalAmount().toFixed(
                          2
                        )}`}
                        readOnly
                      />
                    </div>
                  </>
                )}

              {/* EDIT AMOUNTS */}

              {editingBill && (
                <>
                  <div className="receptionist-billing-form-group">
                    <label>
                      Consultation Fee
                    </label>

                    <input
                      type="text"
                      value={`₹${Number(
                        editingBill.consultation_fee
                      ).toFixed(2)}`}
                      readOnly
                    />
                  </div>

                  <div className="receptionist-billing-form-group">
                    <label>
                      Additional Charges
                    </label>

                    <input
                      type="text"
                      value={`₹${Number(
                        editingBill.additional_charges
                      ).toFixed(2)}`}
                      readOnly
                    />
                  </div>

                  <div className="receptionist-billing-form-group">
                    <label>Total Amount</label>

                    <input
                      type="text"
                      value={`₹${Number(
                        editingBill.total_amount
                      ).toFixed(2)}`}
                      readOnly
                    />
                  </div>
                </>
              )}

              {/* PAYMENT STATUS */}

              <div className="receptionist-billing-form-group">
                <label>
                  Payment Status *
                </label>

                <select
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleStatusChange}
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

              {/* PAYMENT METHOD */}

              <div className="receptionist-billing-form-group">
                <label>
                  Payment Method
                </label>

                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                >
                  <option value="">
                    Select Payment Method
                  </option>

                  <option value="CASH">
                    CASH
                  </option>

                  <option value="CARD">
                    CARD
                  </option>

                  <option value="UPI">
                    UPI
                  </option>

                  <option value="ONLINE">
                    ONLINE
                  </option>
                </select>
              </div>

              {/* PAID AMOUNT */}

              <div className="receptionist-billing-form-group">
                <label>Paid Amount</label>

                <input
                  type="number"
                  name="paid_amount"
                  value={formData.paid_amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* REMAINING */}

              <div className="receptionist-billing-form-group">
                <label>Remaining Amount</label>

                <input
                  type="text"
                  value={`₹${getRemainingAmount().toFixed(
                    2
                  )}`}
                  readOnly
                />
              </div>

              {/* NOTES */}

              <div className="receptionist-billing-form-group full">
                <label>Notes</label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional billing notes"
                />
              </div>

            </div>

            <div className="receptionist-billing-form-actions">
              <button
                type="submit"
                className="receptionist-billing-save-btn"
              >
                {editingBill
                  ? "Save Changes"
                  : "Create Bill"}
              </button>

              <button
                type="button"
                className="receptionist-billing-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      )}

      {/* BILL TABLE */}

      <div className="receptionist-billing-table-section">

        <div className="receptionist-billing-table-header">
          <div>
            <span className="receptionist-billing-section-eyebrow">
              BILLING RECORDS
            </span>

            <h2>Hospital Bills</h2>
          </div>

          <span className="receptionist-billing-table-count">
            {filteredBills.length} records
          </span>
        </div>

        {filteredBills.length === 0 ? (
          <div className="receptionist-billing-empty">
            <div className="receptionist-billing-empty-icon">
              ₹
            </div>

            <h3>
              {searchTerm
                ? "No bills found"
                : "No billing records"}
            </h3>

            <p>
              {searchTerm
                ? "Try searching with a different Bill ID or Patient ID."
                : "Billing records will appear here."}
            </p>

            {searchTerm && (
              <button
                className="receptionist-billing-clear-btn"
                onClick={() => {
                  setSearchTerm("");
                  setFilteredBills(bills);
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="receptionist-billing-table-wrapper">
            <table className="receptionist-billing-table">

              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Appointment</th>
                  <th>Consultation</th>
                  <th>Additional</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Notes</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id}>

                    <td>
                      <span className="receptionist-billing-bill-id">
                        {bill.bill_id || "-"}
                      </span>
                    </td>

                    <td>
                      <div className="receptionist-billing-person">
                        <div className="receptionist-billing-avatar">
                          {(bill.patient_name ||
                            "P")[0].toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {bill.patient_name || "-"}
                          </strong>

                          <span>
                            {bill.patient_id || "-"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="receptionist-billing-person">
                        <div className="receptionist-billing-avatar doctor">
                          {(bill.doctor_name ||
                            "D")[0].toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {bill.doctor_name || "-"}
                          </strong>

                          <span>
                            {bill.doctor_id || "-"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="receptionist-billing-appointment">
                        <strong>
                          {bill.appointment_date ||
                            "-"}
                        </strong>

                        <span>
                          {bill.appointment_time ||
                            "-"}
                        </span>
                      </div>
                    </td>

                    <td>
                      ₹
                      {Number(
                        bill.consultation_fee || 0
                      ).toFixed(2)}
                    </td>

                    <td>
                      ₹
                      {Number(
                        bill.additional_charges || 0
                      ).toFixed(2)}
                    </td>

                    <td>
                      <strong className="receptionist-billing-total">
                        ₹
                        {Number(
                          bill.total_amount || 0
                        ).toFixed(2)}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`receptionist-billing-status ${
                          bill.payment_status
                            ?.toLowerCase()
                            .replace("_", "-") ||
                          "pending"
                        }`}
                      >
                        {bill.payment_status ||
                          "PENDING"}
                      </span>
                    </td>

                    <td>
                      {bill.payment_method || "-"}
                    </td>

                    <td>
                      ₹
                      {Number(
                        bill.paid_amount || 0
                      ).toFixed(2)}
                    </td>

                    <td>
                      <strong>
                        ₹
                        {getBillRemainingAmount(
                          bill
                        )}
                      </strong>
                    </td>

                    <td>
                      <span className="receptionist-billing-notes">
                        {bill.notes || "-"}
                      </span>
                    </td>

                    <td>
                      {bill.created_at
                        ? new Date(
                            bill.created_at
                          ).toLocaleString()
                        : "-"}
                    </td>

                    <td>
                      <button
                        className="receptionist-billing-edit-btn"
                        onClick={() =>
                          handleEdit(bill)
                        }
                      >
                        Edit
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default ReceptionistBilling;