import { useEffect, useState } from "react";
import api from "../services/api";

function PatientBills() {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [paymentMethodFilter, setPaymentMethodFilter] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [showFilters, setShowFilters] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // FETCH BILLS
  // ==========================================

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response =
          await api.get("bills/");

        const data =
          Array.isArray(response.data)
            ? response.data
            : response.data.results || [];

        // Latest bills first
        const sortedBills = [
          ...data,
        ].sort(
          (a, b) => b.id - a.id
        );

        setBills(sortedBills);

        setFilteredBills(
          sortedBills
        );
      } catch (err) {
        console.error(
          "Bills error:",
          err
        );

        setError(
          "Unable to load billing information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  // ==========================================
  // SEARCH / FILTER BILLS
  // ==========================================

  useEffect(() => {
    const searchValue =
      searchTerm
        .trim()
        .toLowerCase();

    const results =
      bills.filter(
        (bill) => {

          // ------------------------------------
          // Bill ID
          // ------------------------------------

          const billId =
            String(
              bill.bill_id || ""
            ).toLowerCase();

          // ------------------------------------
          // Doctor ID
          // ------------------------------------

          const doctorId =
            String(
              bill.doctor_id || ""
            ).toLowerCase();

          // ------------------------------------
          // Doctor Name
          // ------------------------------------

          const doctorName =
            String(
              bill.doctor_name || ""
            ).toLowerCase();

          // ------------------------------------
          // Payment Method
          // ------------------------------------

          const paymentMethod =
            String(
              bill.payment_method ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // Notes
          // ------------------------------------

          const notes =
            String(
              bill.notes || ""
            ).toLowerCase();

          // ------------------------------------
          // Payment Status
          // ------------------------------------

          const paymentStatus =
            String(
              bill.payment_status ||
                ""
            ).toLowerCase();

          // ------------------------------------
          // SEARCH MATCH
          // ------------------------------------

          const matchesSearch =
            !searchValue ||
            billId.includes(
              searchValue
            ) ||
            doctorId.includes(
              searchValue
            ) ||
            doctorName.includes(
              searchValue
            ) ||
            paymentMethod.includes(
              searchValue
            ) ||
            notes.includes(
              searchValue
            );

          // ------------------------------------
          // STATUS FILTER
          // ------------------------------------

          const matchesStatus =
            !statusFilter ||
            paymentStatus ===
              statusFilter.toLowerCase();

          // ------------------------------------
          // PAYMENT METHOD FILTER
          // ------------------------------------

          const matchesPaymentMethod =
            !paymentMethodFilter ||
            paymentMethod ===
              paymentMethodFilter.toLowerCase();

          // ------------------------------------
          // APPOINTMENT DATE
          // ------------------------------------

          const appointmentDate =
            bill.appointment_date ||
            "";

          const matchesFromDate =
            !fromDate ||
            appointmentDate >=
              fromDate;

          const matchesToDate =
            !toDate ||
            appointmentDate <=
              toDate;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPaymentMethod &&
            matchesFromDate &&
            matchesToDate
          );
        }
      );

    // Latest bills first
    results.sort(
      (a, b) => b.id - a.id
    );

    setFilteredBills(results);
  }, [
    bills,
    searchTerm,
    statusFilter,
    paymentMethodFilter,
    fromDate,
    toDate,
  ]);

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPaymentMethodFilter("");
    setFromDate("");
    setToDate("");
  };

  // ==========================================
  // STATUS OPTIONS
  // ==========================================

  const statusOptions = [
    ...new Set(
      bills
        .map(
          (bill) =>
            bill.payment_status
        )
        .filter(Boolean)
    ),
  ];

  // ==========================================
  // PAYMENT METHOD OPTIONS
  // ==========================================

  const paymentMethodOptions = [
    ...new Set(
      bills
        .map(
          (bill) =>
            bill.payment_method
        )
        .filter(Boolean)
    ),
  ];

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="patient-bills-loading">

        <div className="patient-bills-spinner"></div>

        <p>
          Loading bills...
        </p>

      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="patient-bills-error">

        <h2>
          Unable to Load Bills
        </h2>

        <p>
          {error}
        </p>

      </div>
    );
  }

  // ==========================================
  // BILL SUMMARY
  // ==========================================

  // Summary is based on ALL bills,
  // not filtered bills.

  const totalBilled =
    bills.reduce(
      (sum, bill) =>
        sum +
        Number(
          bill.total_amount || 0
        ),
      0
    );

  const totalPaid =
    bills.reduce(
      (sum, bill) =>
        sum +
        Number(
          bill.paid_amount || 0
        ),
      0
    );

  const totalOutstanding =
    totalBilled - totalPaid;

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="patient-bills-page">

      {/* ======================================
          HEADER
          ====================================== */}

      <div className="patient-bills-header">

        <div>

          <span className="patient-bills-eyebrow">
            BILLING & PAYMENTS
          </span>

          <h1>
            My Bills
          </h1>

          <p>
            View your medical bills and
            payment information.
          </p>

        </div>

        <div className="patient-bills-total-card">

          <span>
            Total Bills
          </span>

          <strong>
            {bills.length}
          </strong>

        </div>

      </div>

      {/* ======================================
          BILL SUMMARY
          ====================================== */}

      <div className="patient-bills-summary-grid">

        {/* Total Billed */}

        <div className="patient-bills-summary-card">

          <div className="patient-bills-summary-icon">
            ₹
          </div>

          <div>

            <span>
              Total Billed
            </span>

            <strong>
              ₹{totalBilled.toFixed(2)}
            </strong>

          </div>

        </div>

        {/* Total Paid */}

        <div className="patient-bills-summary-card">

          <div className="patient-bills-summary-icon">
            ✓
          </div>

          <div>

            <span>
              Total Paid
            </span>

            <strong>
              ₹{totalPaid.toFixed(2)}
            </strong>

          </div>

        </div>

        {/* Outstanding */}

        <div className="patient-bills-summary-card">

          <div className="patient-bills-summary-icon">
            !
          </div>

          <div>

            <span>
              Outstanding
            </span>

            <strong>
              ₹{totalOutstanding.toFixed(2)}
            </strong>

          </div>

        </div>

      </div>

      {/* ======================================
          FILTER TOGGLE
          ====================================== */}

      <div className="patient-bills-filter-toggle">

        <button
          type="button"
          className="patient-bills-filter-button"
          onClick={() =>
            setShowFilters(
              !showFilters
            )
          }
        >
          {showFilters
            ? "✕ Hide Search & Filters"
            : "☰ Search & Filter"}
        </button>

        <span>
          {showFilters
            ? "Search and filter your billing records"
            : `${filteredBills.length} bill${
                filteredBills.length !==
                1
                  ? "s"
                  : ""
              } available`}
        </span>

      </div>

      {/* ======================================
          SEARCH / FILTER CARD
          ====================================== */}

      {showFilters && (
        <div className="patient-bills-filter-card">

          <div className="patient-bills-section-title">

            <h2>
              Search & Filter Bills
            </h2>

            <p>
              Find bills by doctor, payment
              status, payment method or date.
            </p>

          </div>

          <div className="patient-bills-filter-grid">

            {/* Search */}

            <div className="patient-bills-filter-field">

              <label>
                Search Bills
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Bill ID, Doctor ID, Doctor Name, Payment Method or Notes"
              />

            </div>

            {/* Payment Status */}

            <div className="patient-bills-filter-field">

              <label>
                Payment Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Statuses
                </option>

                {statusOptions.map(
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

            {/* Payment Method */}

            <div className="patient-bills-filter-field">

              <label>
                Payment Method
              </label>

              <select
                value={
                  paymentMethodFilter
                }
                onChange={(e) =>
                  setPaymentMethodFilter(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Payment Methods
                </option>

                {paymentMethodOptions.map(
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

            {/* From Date */}

            <div className="patient-bills-filter-field">

              <label>
                From Appointment Date
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

            {/* To Date */}

            <div className="patient-bills-filter-field">

              <label>
                To Appointment Date
              </label>

              <input
                type="date"
                value={toDate}
                min={
                  fromDate ||
                  undefined
                }
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="patient-bills-filter-actions">

            <button
              type="button"
              className="patient-bills-clear-button"
              onClick={
                handleClearFilters
              }
            >
              Clear Filters
            </button>

            <span className="patient-bills-result-count">

              Showing{" "}

              <strong>
                {filteredBills.length}
              </strong>

              {" "}of{" "}

              <strong>
                {bills.length}
              </strong>

              {" "}bills

            </span>

          </div>

        </div>
      )}

      {/* ======================================
          BILLS TABLE
          ====================================== */}

      {filteredBills.length ===
      0 ? (

        <div className="patient-bills-empty-state">

          <div className="patient-bills-empty-icon">
            ₹
          </div>

          <h3>
            No Bills Found
          </h3>

          <p>
            {bills.length === 0
              ? "You currently have no billing records."
              : "No bills match the selected search or filters."}
          </p>

        </div>

      ) : (

        <div className="patient-bills-table-card">

          <div className="patient-bills-table-header">

            <div>

              <h2>
                Billing History
              </h2>

              <p>
                Your medical billing and
                payment records.
              </p>

            </div>

            <span>
              {filteredBills.length} Records
            </span>

          </div>

          <div className="patient-bills-table-wrapper">

            <table className="patient-bills-table">

              <thead>

                <tr>

                  <th>
                    Bill ID
                  </th>

                  <th>
                    Doctor
                  </th>

                  <th>
                    Appointment Date
                  </th>

                  <th>
                    Appointment Time
                  </th>

                  <th>
                    Consultation Fee
                  </th>

                  <th>
                    Additional Charges
                  </th>

                  <th>
                    Total Amount
                  </th>

                  <th>
                    Paid Amount
                  </th>

                  <th>
                    Payment Status
                  </th>

                  <th>
                    Payment Method
                  </th>

                  <th>
                    Notes
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredBills.map(
                  (bill) => (

                    <tr
                      key={bill.id}
                    >

                      {/* Bill ID */}

                      <td>

                        <span className="patient-bill-id">
                          {
                            bill.bill_id ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Doctor */}

                      <td>

                        <strong>
                          {
                            bill.doctor_id ||
                            "-"
                          }
                        </strong>

                        <br />

                        <span className="patient-bills-secondary-text">
                          {
                            bill.doctor_name ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Appointment Date */}

                      <td>
                        {
                          bill.appointment_date ||
                          "-"
                        }
                      </td>

                      {/* Appointment Time */}

                      <td>
                        {
                          bill.appointment_time ||
                          "-"
                        }
                      </td>

                      {/* Consultation Fee */}

                      <td>
                        ₹
                        {Number(
                          bill.consultation_fee ||
                            0
                        ).toFixed(2)}
                      </td>

                      {/* Additional Charges */}

                      <td>
                        ₹
                        {Number(
                          bill.additional_charges ||
                            0
                        ).toFixed(2)}
                      </td>

                      {/* Total Amount */}

                      <td>

                        <span className="patient-bill-total-amount">
                          ₹
                          {Number(
                            bill.total_amount ||
                              0
                          ).toFixed(2)}
                        </span>

                      </td>

                      {/* Paid Amount */}

                      <td>
                        ₹
                        {Number(
                          bill.paid_amount ||
                            0
                        ).toFixed(2)}
                      </td>

                      {/* Payment Status */}

                      <td>

                        <span
                          className={`patient-bills-status-badge patient-bills-status-${bill.payment_status?.toLowerCase()}`}
                        >
                          {
                            bill.payment_status ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* Payment Method */}

                      <td>
                        {
                          bill.payment_method ||
                          "-"
                        }
                      </td>

                      {/* Notes */}

                      <td>
                        {
                          bill.notes ||
                          "-"
                        }
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

export default PatientBills;