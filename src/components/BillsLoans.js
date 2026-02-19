// components/BillsLoans.js
import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Tab,
  Tabs,
  Badge,
  ListGroup,
  Table,
  Alert,
} from "react-bootstrap";
import {
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { billsAPI, loansAPI } from "../services/api";

const BillsLoans = ({ spending, bills: propBills, loans: propLoans }) => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("bills");
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [items, setItems] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    type: "bill",
    name: "",
    amount: "",
    category: "",
    due_date: new Date().toISOString().split("T")[0],
    recurrence: "monthly",
    status: "unpaid",

    // Loan-specific fields (from your backend)
    totalLoanAmount: "",
    interestRate: "",
    termMonths: "",
    remainingBalance: "",

    // Bill-specific fields
    provider: "",
    accountNumber: "",
  });

  // ✅ Update local state when props change (for viewing)
  useEffect(() => {
    const validBills = (propBills || []).filter((b) => b.type === "bill");

    const validLoans = (propLoans || []).filter((l) => l.type === "loan");

    const combined = [
      ...validBills.map((b) => ({ ...b, type: "bill" })),
      ...validLoans.map((l) => ({ ...l, type: "loan" })),
    ];

    setItems(combined);
    console.log("Filtered items:", combined);
  }, [propBills, propLoans]);

  console.log(items, "items");

  // Filter items by type
  const recurringBills = items.filter((item) => item.type === "bill");
  const loans = items.filter((item) => item.type === "loan");

  // Helper to safely get amount as number
  const getSafeAmount = (value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Find matching payments from spending
  const findMatchingPayments = (item) => {
    if (!spending || !item || !Array.isArray(spending)) return [];

    return spending.filter(
      (spent) =>
        (spent.description?.toLowerCase() || "").includes(
          item.name?.toLowerCase() || "",
        ) ||
        spent.category === "Bills" ||
        spent.category === "Loan Payment" ||
        (item.category && spent.category === item.category),
    );
  };

  // Check if paid
  const checkIfPaid = (item) => {
    if (!item) return false;

    if (item.status === "unpaid") return false;

    if (item.status === "paid") {
      if (item.lastPaid) {
        const lastPaidDate = new Date(item.lastPaid);
        const currentDate = new Date();
        const isSameMonth =
          lastPaidDate.getMonth() === currentDate.getMonth() &&
          lastPaidDate.getFullYear() === currentDate.getFullYear();
        return isSameMonth;
      }
      return true;
    }

    // Check spending history
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const matchingPayments = findMatchingPayments(item);

    return matchingPayments.some((payment) => {
      if (!payment || !payment.date) return false;
      const paymentDate = new Date(payment.date);
      const isSameMonth =
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear;
      const paymentAmount = getSafeAmount(payment.amount);
      const itemAmount = getSafeAmount(item.amount);
      return isSameMonth && paymentAmount >= itemAmount * 0.9;
    });
  };

  // ✅ CREATE - Add new bill/loan
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form with data:", formData);
    try {
      let response;
      if (formData.type === "bill") {
        response = await billsAPI.create({
          type: formData.type,
          name: formData.name,
          amount: parseFloat(formData.amount),
          category: formData.category,
          due_date: formData.due_date,
          recurrence: formData.recurrence,
        });
      } else {
        response = await loansAPI.create({
          name: formData.name,
          amount: parseFloat(formData.amount),
          category: formData.category || null,
          due_date: formData.due_date,
          recurrence: formData.recurrence,
          totalLoanAmount: formData.totalLoanAmount
            ? parseFloat(formData.totalLoanAmount)
            : null,
          interestRate: formData.interestRate
            ? parseFloat(formData.interestRate)
            : null,
          termMonths: formData.termMonths
            ? parseInt(formData.termMonths)
            : null,
          remainingBalance: formData.remainingBalance
            ? parseFloat(formData.remainingBalance)
            : null,
          provider: null, // Loans don't need provider
          accountNumber: null,
        });
      }
      console.log("API response:", response);
      // Add to local state
      const newItem = { ...response.data, type: formData.type };
      setItems([...items, newItem]);

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error("Error creating item:", error);
      console.error("Error response:", error.response?.data);
      alert("Failed to create. Please try again.");
    }
  };

  // ✅ UPDATE - Edit bill/loan
  const handleUpdate = async () => {
    try {
      let response;
      if (formData.type === "bill") {
        response = await billsAPI.update(editingId, {
          name: formData.name,
          amount: parseFloat(formData.amount),
          category: formData.category,
          due_date: formData.due_date,
          recurrence: formData.recurrence,
        });
      } else {
        response = await loansAPI.update(editingId, {
          name: formData.name,
          amount: parseFloat(formData.amount),
          category: formData.category,
          due_date: formData.due_date,
          recurrence: formData.recurrence,
        });
      }

      // Update local state
      setItems(
        items.map((item) =>
          item.id === editingId
            ? { ...response.data, type: formData.type }
            : item,
        ),
      );

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update. Please try again.");
    }
  };

  // ✅ DELETE - Remove bill/loan
  const handleDelete = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      if (type === "bill") {
        await billsAPI.delete(id);
      } else {
        await loansAPI.delete(id);
      }

      // Remove from local state
      setItems(items.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete. Please try again.");
    }
  };

  // ✅ MARK AS PAID
  const handleMarkAsPaid = async (id, type) => {
    try {
      if (type === "bill") {
        await billsAPI.markPaid(id);
      } else {
        await loansAPI.markPaid(id);
      }

      // Update local state
      setItems(
        items.map((item) =>
          item.id === id
            ? { ...item, status: "paid", lastPaid: new Date().toISOString() }
            : item,
        ),
      );
    } catch (error) {
      console.error("Error marking as paid:", error);
      alert("Failed to mark as paid. Please try again.");
    }
  };

  // ✅ MARK AS UNPAID
  const handleMarkAsUnpaid = async (id, type) => {
    try {
      if (type === "bill") {
        await billsAPI.markUnpaid(id);
      } else {
        await loansAPI.markUnpaid(id);
      }

      // Update local state
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, status: "unpaid", lastPaid: null } : item,
        ),
      );
    } catch (error) {
      console.error("Error marking as unpaid:", error);
      alert("Failed to mark as unpaid. Please try again.");
    }
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Edit item
  const handleEdit = (item) => {
    setFormData({
      type: item.type,
      name: item.name || "",
      amount: item.amount != null ? String(item.amount) : "",
      category: item.category || "",
      due_date: item.due_date || new Date().toISOString().split("T")[0],
      recurrence: item.recurrence || "monthly",
      status: item.status || "unpaid",

      totalLoanAmount:
        item.totalLoanAmount != null ? String(item.totalLoanAmount) : "",
      interestRate: item.interestRate != null ? String(item.interestRate) : "",
      termMonths: item.termMonths != null ? String(item.termMonths) : "",
      remainingBalance:
        item.remainingBalance != null ? String(item.remainingBalance) : "",

      provider: item.provider || "",
      accountNumber: item.accountNumber || "",
    });

    setEditMode(true);
    setEditingId(item.id);
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      type: activeTab === "bills" ? "bill" : "loan",
      name: "",
      amount: "",
      category: "",
      due_date: new Date().toISOString().split("T")[0],
      recurrence: "monthly",
      status: "unpaid",
      totalLoanAmount: "",
      interestRate: "",
      termMonths: "",
      remainingBalance: "",
      provider: "",
      accountNumber: "",
    });
    setEditMode(false);
    setEditingId(null);
  };

  // Get status badge
  const getStatusBadge = (item) => {
    const isPaid = checkIfPaid(item);
    return isPaid ? (
      <Badge bg="success" className="me-2">
        <FaCheckCircle /> Paid
      </Badge>
    ) : (
      <Badge bg="danger" className="me-2">
        <FaTimesCircle /> Unpaid
      </Badge>
    );
  };

  // Calculate totals
  const totalBills = recurringBills.reduce(
    (sum, bill) => sum + getSafeAmount(bill.amount),
    0,
  );
  const totalLoans = loans.reduce(
    (sum, loan) => sum + getSafeAmount(loan.amount),
    0,
  );

  const unpaidBills = recurringBills.filter((bill) => !checkIfPaid(bill));
  const unpaidLoans = loans.filter((loan) => !checkIfPaid(loan));

  // Get upcoming items
  const getUpcomingItems = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return items.filter((item) => {
      const due_date = new Date(item.due_date);
      due_date.setHours(0, 0, 0, 0);
      return due_date >= today && due_date <= nextWeek && !checkIfPaid(item);
    });
  };

  const upcomingItems = getUpcomingItems();

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h2>Bills & Loans Management</h2>
          <p className="text-muted">
            Track your recurring bills and loan payments
          </p>
        </Col>
        <Col className="text-end">
          <Button
            variant="primary"
            onClick={() => {
              resetForm();

              setFormData((prev) => ({
                ...prev,
                type: activeTab === "bills" ? "bill" : "loan",
              }));
              setShowModal(true);
            }}
          >
            <FaPlus className="me-2" /> Add New
          </Button>
        </Col>
      </Row>

      {/* Upcoming payments alert */}
      {upcomingItems.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <FaCheckCircle className="me-2" />
          <strong>Upcoming Payments:</strong> You have {upcomingItems.length}{" "}
          bill(s)/loan(s) due soon.
        </Alert>
      )}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Bills</Card.Title>
              <h3 className="text-primary">£{totalBills.toFixed(2)}</h3>
              <small className="text-muted">
                {recurringBills.length} bills
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Loans</Card.Title>
              <h3 className="text-warning">£{totalLoans.toFixed(2)}</h3>
              <small className="text-muted">{loans.length} loans</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Unpaid Bills</Card.Title>
              <h3 className="text-danger">{unpaidBills.length}</h3>
              <small className="text-muted">
                {unpaidBills.length === 0 ? "All paid!" : "Need attention"}
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Unpaid Loans</Card.Title>
              <h3 className="text-danger">{unpaidLoans.length}</h3>
              <small className="text-muted">
                {unpaidLoans.length === 0 ? "All paid!" : "Due this month"}
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for Bills and Loans */}
      <Card>
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab
              eventKey="bills"
              title={`Recurring Bills (${recurringBills.length})`}
            >
              {recurringBills.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="mt-3">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Bill Name</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Recurrence</th>
                        <th>Category</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recurringBills.map((bill) => {
                        const isPaid = checkIfPaid(bill);
                        const isOverdue =
                          !isPaid && new Date(bill.due_date) < new Date();
                        return (
                          <tr
                            key={bill.id}
                            className={
                              isPaid
                                ? "table-success"
                                : isOverdue
                                  ? "table-danger"
                                  : "table-warning"
                            }
                          >
                            <td>{getStatusBadge(bill)}</td>
                            <td>
                              <strong>{bill.name}</strong>
                            </td>
                            <td className="fw-bold">
                              £{getSafeAmount(bill.amount).toFixed(2)}
                            </td>
                            <td>
                              {new Date(bill.due_date).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                              {isOverdue && (
                                <Badge bg="danger" className="ms-2">
                                  Overdue
                                </Badge>
                              )}
                            </td>
                            <td>
                              <Badge bg="info">{bill.recurrence}</Badge>
                            </td>
                            <td>
                              <Badge bg="secondary">
                                {bill.category || "General"}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEdit(bill)}
                                  title="Edit"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(bill.id, "bill")}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </Button>
                                {!isPaid ? (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() =>
                                      handleMarkAsPaid(bill.id, "bill")
                                    }
                                    title="Mark as Paid"
                                  >
                                    Mark Paid
                                  </Button>
                                ) : (
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() =>
                                      handleMarkAsUnpaid(bill.id, "bill")
                                    }
                                    title="Mark as Unpaid"
                                  >
                                    Mark Unpaid
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info" className="mt-3">
                  No recurring bills added yet.
                </Alert>
              )}
            </Tab>

            <Tab eventKey="loans" title={`Loans (${loans.length})`}>
              {loans.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="mt-3">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Loan Name</th>
                        <th>Monthly Payment</th>
                        <th>Due Date</th>
                        <th>Category</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map((loan) => {
                        const isPaid = checkIfPaid(loan);
                        const isOverdue =
                          !isPaid && new Date(loan.due_date) < new Date();
                        return (
                          <tr
                            key={loan.id}
                            className={
                              isPaid
                                ? "table-success"
                                : isOverdue
                                  ? "table-danger"
                                  : "table-warning"
                            }
                          >
                            <td>{getStatusBadge(loan)}</td>
                            <td>
                              <strong>{loan.name}</strong>
                            </td>
                            <td className="fw-bold">
                              £{getSafeAmount(loan.amount).toFixed(2)}
                            </td>
                            <td>
                              {new Date(loan.due_date).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                              {isOverdue && (
                                <Badge bg="danger" className="ms-2">
                                  Overdue
                                </Badge>
                              )}
                            </td>
                            <td>
                              <Badge bg="secondary">
                                {loan.category || "Loan"}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEdit(loan)}
                                  title="Edit"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(loan.id, "loan")}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </Button>
                                {!isPaid ? (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() =>
                                      handleMarkAsPaid(loan.id, "loan")
                                    }
                                    title="Mark as Paid"
                                  >
                                    Mark Paid
                                  </Button>
                                ) : (
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() =>
                                      handleMarkAsUnpaid(loan.id, "loan")
                                    }
                                    title="Mark as Unpaid"
                                  >
                                    Mark Unpaid
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info" className="mt-3">
                  No loans added yet.
                </Alert>
              )}
            </Tab>
          </Tabs>

          {/* Payment Suggestions */}
          {spending?.length > 0 && (
            <Card className="mt-4">
              <Card.Body>
                <Card.Title>Recent Matching Payments</Card.Title>
                <p className="text-muted">
                  Payments that might match your bills/loans:
                </p>
                <ListGroup variant="flush">
                  {spending
                    .filter(
                      (item) =>
                        item.category === "Bills" ||
                        item.category === "Loan Payment",
                    )
                    .slice(0, 5)
                    .map((payment, index) => (
                      <ListGroup.Item
                        key={index}
                        className="d-flex justify-content-between"
                      >
                        <div>
                          <strong>{payment.description}</strong>
                          <br />
                          <small className="text-muted">
                            {payment.date} • {payment.category}
                          </small>
                        </div>
                        <div className="text-danger fw-bold">
                          £{getSafeAmount(payment.amount).toFixed(2)}
                        </div>
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          resetForm();
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode ? "Edit" : "Add New"}{" "}
            {activeTab === "bills" ? "Bill" : "Loan"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Conditionally render different forms based on activeTab */}
          {activeTab === "bills" ? (
            // ========== BILLS FORM ==========
            <Form onSubmit={editMode ? handleUpdate : handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                      name="type"
                      value="bill"
                      onChange={handleFormChange}
                      disabled
                      required
                    >
                      <option value="bill">Recurring Bill</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="e.g., Rent, Netflix, Electric Bill"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount (£) *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="amount"
                      value={formData.amount}
                      onChange={handleFormChange}
                      placeholder="Monthly bill amount"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Due Date *</Form.Label>
                    <Form.Control
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleFormChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Recurrence</Form.Label>
                    <Form.Select
                      name="recurrence"
                      value={formData.recurrence}
                      onChange={handleFormChange}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                      <option value="one-time">One-time</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                    >
                      <option value="">Select Category</option>
                      <option value="Housing">Housing</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Bill-specific fields */}
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Provider</Form.Label>
                    <Form.Control
                      type="text"
                      name="provider"
                      value={formData.provider}
                      onChange={handleFormChange}
                      placeholder="e.g., Netflix, British Gas"
                    />
                    <Form.Text className="text-muted">
                      Service provider name
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Account Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleFormChange}
                      placeholder="Reference number"
                    />
                    <Form.Text className="text-muted">
                      For your reference
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Button
                variant="primary"
                type="submit"
                className="w-100 mt-3"
                size="lg"
              >
                {editMode ? "Update" : "Add"} Bill
              </Button>
            </Form>
          ) : (
            // ========== LOANS FORM ==========
            <Form onSubmit={editMode ? handleUpdate : handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                      name="type"
                      value="loan"
                      onChange={handleFormChange}
                      disabled
                      required
                    >
                      <option value="loan">Loan Payment</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Loan Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="e.g., Car Loan, Mortgage, Student Loan"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Monthly Payment (£) *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="amount"
                      value={formData.amount}
                      onChange={handleFormChange}
                      placeholder="Your monthly payment"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Due Date *</Form.Label>
                    <Form.Control
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleFormChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Loan Details Section */}
              <h6 className="mt-4 mb-3 text-primary fw-bold">Loan Details</h6>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Total Loan Amount (£)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="totalLoanAmount"
                      value={formData.totalLoanAmount}
                      onChange={handleFormChange}
                      placeholder="Original loan amount"
                    />
                    <Form.Text className="text-muted">
                      The total amount borrowed
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Interest Rate (%)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      min="0"
                      name="interestRate"
                      value={formData.interestRate}
                      onChange={handleFormChange}
                      placeholder="e.g., 4.5"
                    />
                    <Form.Text className="text-muted">
                      Annual interest rate
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Term (months)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      name="termMonths"
                      value={formData.termMonths}
                      onChange={handleFormChange}
                      placeholder="e.g., 60"
                    />
                    <Form.Text className="text-muted">
                      Length of loan in months
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Remaining Balance (£)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      name="remainingBalance"
                      value={formData.remainingBalance}
                      onChange={handleFormChange}
                      placeholder="Current balance"
                    />
                    <Form.Text className="text-muted">
                      How much you still owe
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Recurrence</Form.Label>
                    <Form.Select
                      name="recurrence"
                      value={formData.recurrence}
                      onChange={handleFormChange}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                      <option value="one-time">One-time</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                    >
                      <option value="">Select Category</option>
                      <option value="Debt">Debt</option>
                      <option value="Housing">Housing</option>
                      <option value="Education">Education</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Loan-specific note */}
              <Row className="mt-3">
                <Col md={12}>
                  <small className="text-muted fst-italic">
                    * Optional fields help track your loan details
                  </small>
                </Col>
              </Row>

              <Button
                variant="primary"
                type="submit"
                className="w-100 mt-4"
                size="lg"
              >
                {editMode ? "Update" : "Add"} Loan
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default BillsLoans;
