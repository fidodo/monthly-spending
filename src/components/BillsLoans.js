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

  // Single source of truth for all items
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("billsLoans");
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("billsLoans", JSON.stringify(items));
  }, [items]);

  // Filter items by type
  const recurringBills = items.filter((item) => item.type === "bill");
  console.log("Recurring Bills:", recurringBills);
  const loans = items.filter((item) => item.type === "loan");

  // Filter spending to find payments for bills/loans
  const findMatchingPayments = (item) => {
    if (!spending || !item) return [];

    return spending.filter(
      (spent) =>
        spent.description?.toLowerCase().includes(item.name?.toLowerCase()) ||
        spent.category === "Bills" ||
        spent.category === "Loan Payment" ||
        (item.category && spent.category === item.category),
    );
  };

  const checkIfPaid = (item) => {
    if (!item) return false;

    if (item.status === "unpaid") {
      return false;
    }

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

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const matchingPayments = findMatchingPayments(item);

    const isPaidFromSpending = matchingPayments.some((payment) => {
      if (!payment || !payment.date) return false;

      const paymentDate = new Date(payment.date);
      const isSameMonth =
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear;

      // Check if payment amount covers the bill/loan
      const amountPaid = payment.amount >= (item.amount || 0);

      console.log(
        `${item.name}: Payment ${payment.description} - amount: ${payment.amount}, isSameMonth: ${isSameMonth}, amountPaid: ${amountPaid}`,
      );
      return isSameMonth && amountPaid;
    });

    return isPaidFromSpending;
  };

  // Improved Mark as Paid function
  const handleMarkAsPaid = (id) => {
    console.log(`Marking item ${id} as paid`);
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = {
            ...item,
            status: "paid",
            lastPaid: new Date().toISOString(),
          };

          return updatedItem;
        }
        return item;
      }),
    );
  };

  // Improved Mark as Unpaid function
  const handleMarkAsUnpaid = (id) => {
    console.log(`Marking item ${id} as unpaid`);
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = {
            ...item,
            status: "unpaid",
            lastPaid: null,
          };

          return updatedItem;
        }
        return item;
      }),
    );
  };

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
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === editingId ? { ...formData, id: editingId } : item,
        ),
      );
    } else {
      // Add new item
      const newItem = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      setItems((prevItems) => [...prevItems, newItem]);
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
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    }
  };

  // Get status badge
  const getStatusBadge = (item) => {
    const isPaid = checkIfPaid(item);

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

  const unpaidBills = recurringBills.filter((bill) => !checkIfPaid(bill));
  const unpaidLoans = loans.filter((loan) => !checkIfPaid(loan));

  // Get items due in next 7 days
  const getUpcomingItems = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return items.filter((item) => {
      const dueDate = new Date(item.dueDate);
      return dueDate >= today && dueDate <= nextWeek && !checkIfPaid(item);
    });
  };

  const upcomingItems = getUpcomingItems();

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h2>Bills & Loans Management</h2>
          <p className="theme-text-muted">
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

      {/* Alert for upcoming payments */}
      {upcomingItems.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <FaCheckCircle className="me-2" />
          <strong>Upcoming Payments:</strong> You have {upcomingItems.length}{" "}
          bill(s)/loan(s) due in the next 7 days.
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
                {recurringBills.length} bill
                {recurringBills.length !== 1 ? "s" : ""}
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Loans</Card.Title>
              <h3 className="text-warning">£{totalLoans.toFixed(2)}</h3>
              <small className="text-muted">
                {loans.length} loan{loans.length !== 1 ? "s" : ""}
              </small>
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
                          !isPaid && new Date(bill.dueDate) < new Date();

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
                              {bill.category && (
                                <div>
                                  <small className="theme-text-muted">
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
                                  onClick={() => handleDelete(bill.id)}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </Button>
                                {!isPaid ? (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleMarkAsPaid(bill.id)}
                                    title="Mark as Paid"
                                  >
                                    Mark Paid
                                  </Button>
                                ) : (
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => handleMarkAsUnpaid(bill.id)}
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
                  No recurring bills added yet. Click "Add New" to add your
                  first bill.
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
                          !isPaid && new Date(loan.dueDate) < new Date();

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
                              {loan.category && (
                                <div>
                                  <small className="theme-text-muted">
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
                                  onClick={() => handleDelete(loan.id)}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </Button>
                                {!isPaid ? (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleMarkAsPaid(loan.id)}
                                    title="Mark as Paid"
                                  >
                                    Mark Paid
                                  </Button>
                                ) : (
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => handleMarkAsUnpaid(loan.id)}
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
                  No loans added yet. Click "Add New" to add your first loan.
                </Alert>
              )}
            </Tab>
          </Tabs>

          {/* Payment Suggestions */}
          {spending.length > 0 && (
            <Card className="mt-4">
              <Card.Body>
                <Card.Title>Recent Matching Payments</Card.Title>
                <p className="theme-text-muted">
                  These are payments from your spending that might match your
                  bills/loans:
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
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <strong>{payment.description}</strong>
                          <br />
                          <small className="theme-text-muted">
                            {payment.date} • {payment.category}
                          </small>
                        </div>
                        <div className="text-danger fw-bold">
                          £{payment.amount.toFixed(2)}
                        </div>
                      </ListGroup.Item>
                    ))}
                  {spending.filter(
                    (item) =>
                      item.category === "Bills" ||
                      item.category === "Loan Payment",
                  ).length === 0 && (
                    <ListGroup.Item>
                      <small className="theme-text-muted">
                        No matching payments found in your spending history.
                      </small>
                    </ListGroup.Item>
                  )}
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
                  <Form.Label>Name *</Form.Label>
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
                  <Form.Label>Amount (£) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0.01"
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
                  <Form.Label>Due Date *</Form.Label>
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

            <div className="d-grid gap-2 mt-4">
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
