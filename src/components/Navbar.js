// components/Navbar.js
import React from "react";
import { Navbar, Nav, Container, Image } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  FaChartPie,
  FaPlus,
  FaHome,
  FaFileInvoiceDollar,
} from "react-icons/fa";

const CustomNavbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <FaHome className="me-2" />
          Spending Tracker
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav
            className="me-auto"
            variant="pills"
            defaultActiveKey="#dashboard"
          >
            <Nav.Link as={Link} to="/" href="#dashboard">
              <FaHome className="me-1" />
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/add-spending" href="#add-spending">
              <FaPlus className="me-1" />
              Add Spending
            </Nav.Link>
            <Nav.Link as={Link} to="/bills-loans" href="#bills-loans">
              <FaFileInvoiceDollar className="me-1" />
              Bills & Loans
            </Nav.Link>
            <Nav.Link as={Link} to="/analytics" href="#analytics">
              <FaChartPie className="me-1" />
              Analytics
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link
              as={Link}
              to="/profile"
              className="d-flex align-items-center"
              href="#profile"
            >
              <Image
                src={user.imageUrl}
                roundedCircle
                width="30"
                height="30"
                className="me-2"
              />
              {user.name}
            </Nav.Link>
            <Nav.Link onClick={handleLogout} href="#logout">
              Logout
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
