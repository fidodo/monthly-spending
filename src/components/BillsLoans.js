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

const BillsLoans = ({ spending }) => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("bills");
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    type: "bill",
    name: "",
    amount: "",
    category: "",
    dueDate: new Date().toISOString().split("T")[0],
    recurrence: "monthly",
    status: "unpaid",
  });

  // Load bills and loans from localStorage
  const [bills, setBills] = useState(() => {
    const saved = localStorage.getItem("billsLoans");
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever bills change
  useEffect(() => {
    localStorage.setItem("billsLoans", JSON.stringify(bills));
  }, [bills]);

  // Filter spending to find payments for bills/loans
  const findMatchingPayments = (itemId) => {
    return spending.filter(
      (item) =>
        item.description
          ?.toLowerCase()
          .includes(bills.find((b) => b.id === itemId)?.name?.toLowerCase()) ||
        item.category === "Bills" ||
        item.category === "Loan Payment",
    );
  };

  // Check if a bill/loan has been paid this month
  const checkIfPaidThisMonth = (item) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const matchingPayments = findMatchingPayments(item.id);

    return matchingPayments.some((payment) => {
      const paymentDate = new Date(payment.date);
      return (
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear &&
        payment.amount >= item.amount
      );
    });
  };

  // Filter bills and loans
  const recurringBills = bills.filter((item) => item.type === "bill");
  const loans = bills.filter((item) => item.type === "loan");

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editMode) {
      // Update existing item
      const updatedBills = bills.map((item) =>
        item.id === editingId ? { ...formData, id: editingId } : item,
      );
      setBills(updatedBills);
    } else {
      // Add new item
      const newItem = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      setBills([...bills, newItem]);
    }

    // Reset form and close modal
    resetForm();
    setShowModal(false);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      type: "bill",
      name: "",
      amount: "",
      category: "",
      dueDate: new Date().toISOString().split("T")[0],
      recurrence: "monthly",
      status: "unpaid",
    });
    setEditMode(false);
    setEditingId(null);
  };

  // Edit item
  const handleEdit = (item) => {
    setFormData(item);
    setEditMode(true);
    setEditingId(item.id);
    setShowModal(true);
  };

  // Delete item
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setBills(bills.filter((item) => item.id !== id));
    }
  };

  // Mark as paid
  const handleMarkAsPaid = (id) => {
    setBills(
      bills.map((item) =>
        item.id === id
          ? { ...item, status: "paid", lastPaid: new Date().toISOString() }
          : item,
      ),
    );
  };

  // Get status badge
  const getStatusBadge = (item) => {
    const isPaid = checkIfPaidThisMonth(item) || item.status === "paid";

    if (isPaid) {
      return (
        <Badge bg="success" className="me-2">
          <FaCheckCircle /> Paid
        </Badge>
      );
    } else {
      return (
        <Badge bg="danger" className="me-2">
          <FaTimesCircle /> Unpaid
        </Badge>
      );
    }
  };

  // Calculate totals
  const totalBills = recurringBills.reduce(
    (sum, bill) => sum + parseFloat(bill.amount || 0),
    0,
  );
  const totalLoans = loans.reduce(
    (sum, loan) => sum + parseFloat(loan.amount || 0),
    0,
  );
  const unpaidBills = recurringBills.filter(
    (bill) => !checkIfPaidThisMonth(bill),
  );
  const unpaidLoans = loans.filter((loan) => !checkIfPaidThisMonth(loan));

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
              setShowModal(true);
            }}
          >
            <FaPlus className="me-2" />
            Add New
          </Button>
        </Col>
      </Row>

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
              <small className="text-muted">Need attention</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Unpaid Loans</Card.Title>
              <h3 className="text-danger">{unpaidLoans.length}</h3>
              <small className="text-muted">Due this month</small>
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
                <Table responsive hover className="mt-3">
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
                      const isPaid = checkIfPaidThisMonth(bill);
                      return (
                        <tr
                          key={bill.id}
                          className={isPaid ? "table-success" : "table-warning"}
                        >
                          <td>{getStatusBadge(bill)}</td>
                          <td>
                            <strong>{bill.name}</strong>
                            {bill.category && (
                              <div>
                                <small className="text-muted">
                                  {bill.category}
                                </small>
                              </div>
                            )}
                          </td>
                          <td className="fw-bold">
                            £{parseFloat(bill.amount).toFixed(2)}
                          </td>
                          <td>
                            {new Date(bill.dueDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                            {new Date(bill.dueDate).getDate() <
                              new Date().getDate() &&
                              !isPaid && (
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
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEdit(bill)}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="me-2"
                              onClick={() => handleDelete(bill.id)}
                            >
                              <FaTrash />
                            </Button>
                            {!isPaid && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleMarkAsPaid(bill.id)}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info" className="mt-3">
                  No recurring bills added yet. Click "Add New" to add your
                  first bill.
                </Alert>
              )}
            </Tab>

            <Tab eventKey="loans" title={`Loans (${loans.length})`}>
              {loans.length > 0 ? (
                <Table responsive hover className="mt-3">
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
                      const isPaid = checkIfPaidThisMonth(loan);
                      return (
                        <tr
                          key={loan.id}
                          className={isPaid ? "table-success" : "table-warning"}
                        >
                          <td>{getStatusBadge(loan)}</td>
                          <td>
                            <strong>{loan.name}</strong>
                            {loan.category && (
                              <div>
                                <small className="text-muted">
                                  {loan.category}
                                </small>
                              </div>
                            )}
                          </td>
                          <td className="fw-bold">
                            £{parseFloat(loan.amount).toFixed(2)}
                          </td>
                          <td>
                            {new Date(loan.dueDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </td>
                          <td>
                            <Badge bg="secondary">
                              {loan.category || "Loan"}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEdit(loan)}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="me-2"
                              onClick={() => handleDelete(loan.id)}
                            >
                              <FaTrash />
                            </Button>
                            {!isPaid && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleMarkAsPaid(loan.id)}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info" className="mt-3">
                  No loans added yet. Click "Add New" to add your first loan.
                </Alert>
              )}
            </Tab>
          </Tabs>

          {/* Payment Suggestions */}
          <Card className="mt-4">
            <Card.Body>
              <Card.Title>Recent Matching Payments</Card.Title>
              <p className="text-muted">
                These are payments from your spending that might match your
                bills/loans:
              </p>
              <ListGroup variant="flush">
                {spending
                  .filter(
                    (item) =>
                      item.category === "Bills" ||
                      item.category === "Loan Payment" ||
                      bills.some((bill) =>
                        item.description
                          ?.toLowerCase()
                          .includes(bill.name?.toLowerCase()),
                      ),
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
                        £{payment.amount.toFixed(2)}
                      </div>
                    </ListGroup.Item>
                  ))}
              </ListGroup>
            </Card.Body>
          </Card>
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
            {editMode ? "Edit Item" : "Add New Bill or Loan"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="bill">Recurring Bill</option>
                    <option value="loan">Loan Payment</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g., Rent, Car Loan, Netflix"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount (£)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleFormChange}
                    placeholder="Monthly amount"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {formData.type === "bill"
                      ? "Recurrence"
                      : "Payment Frequency"}
                  </Form.Label>
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
                    <option value="Debt">Debt</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Education">Education</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" size="lg">
                {editMode ? "Update" : "Add"}{" "}
                {formData.type === "bill" ? "Bill" : "Loan"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default BillsLoans;
