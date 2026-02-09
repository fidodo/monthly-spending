// components/SpendingInput.js
import React, { useState } from "react";
import { Card, Form, Button, Alert, Row, Col } from "react-bootstrap";

const SpendingInput = ({ onAddSpending, monthlyEarning, totalSpent }) => {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
  });

  const [submitted, setSubmitted] = useState(false);

  const categories = [
    "Food",
    "Transportation",
    "Entertainment",
    "Shopping",
    "Bills",
    "Healthcare",
    "Education",
    "Other",
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.amount && formData.description) {
      const newEntry = {
        ...formData,
        amount: parseFloat(formData.amount),
        timestamp: new Date().toISOString(),
      };

      onAddSpending(newEntry);
      setSubmitted(true);

      // Reset form
      setFormData({
        amount: "",
        description: "",
        category: "Food",
        date: new Date().toISOString().split("T")[0],
      });

      // Hide success message after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  const remaining = monthlyEarning - totalSpent;
  const warningPercentage =
    monthlyEarning > 0 ? (totalSpent / monthlyEarning) * 100 : 0;

  return (
    <Row className="justify-content-center">
      <Col md={8} lg={6}>
        <Card className="shadow">
          <Card.Body>
            <h2 className="text-center mb-4">Add Spending</h2>

            {submitted && (
              <Alert variant="success" className="text-center">
                Spending added successfully!
              </Alert>
            )}

            {warningPercentage >= 80 && (
              <Alert variant="warning">
                ⚠️ You've spent {warningPercentage.toFixed(1)}% of your monthly
                earning. Remaining: £{remaining.toFixed(2)}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Amount (£)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What did you spend on?"
                  required
                />
              </Form.Group>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-grid gap-2">
                <Button variant="primary" type="submit" size="lg">
                  Add Spending
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default SpendingInput;
