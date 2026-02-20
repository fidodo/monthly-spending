// components/Navbar.js
import React from "react";
import { Navbar, Nav, Container, Image } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom"; // 👈 Change Link to NavLink
import {
  FaChartPie,
  FaPlus,
  FaHome,
  FaFileInvoiceDollar,
  FaSignOutAlt,
} from "react-icons/fa";
import SimpleThemeSwitcher from "./SimpleThemeSwitcher";

const CustomNavbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      onLogout();
      navigate("/login");
    }
  };

  // Style for active links
  const activeStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: "5px",
    color: "#fff",
    fontWeight: "bold",
    borderBottom: "3px solid #ffc107",
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 shadow">
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="fw-bold">
          <FaHome className="me-2" />
          Spending Tracker
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* 👇 Using NavLink with 'end' prop for exact matching */}
            <Nav.Link
              as={NavLink}
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "active-nav-link fw-bold" : ""
              }
              style={({ isActive }) => (isActive ? activeStyle : {})}
            >
              <FaHome className="me-1" />
              Dashboard
            </Nav.Link>

            <Nav.Link
              as={NavLink}
              to="/add-spending"
              className={({ isActive }) =>
                isActive ? "active-nav-link fw-bold" : ""
              }
              style={({ isActive }) => (isActive ? activeStyle : {})}
            >
              <FaPlus className="me-1" />
              Add Spending
            </Nav.Link>

            <Nav.Link
              as={NavLink}
              to="/bills-loans"
              className={({ isActive }) =>
                isActive ? "active-nav-link fw-bold" : ""
              }
              style={({ isActive }) => (isActive ? activeStyle : {})}
            >
              <FaFileInvoiceDollar className="me-1" />
              Bills & Loans
            </Nav.Link>

            <Nav.Link
              as={NavLink}
              to="/analytics"
              className={({ isActive }) =>
                isActive ? "active-nav-link fw-bold" : ""
              }
              style={({ isActive }) => (isActive ? activeStyle : {})}
            >
              <FaChartPie className="me-1" />
              Analytics
            </Nav.Link>
          </Nav>

          <Nav className="align-items-center">
            <div className="mx-3">
              <SimpleThemeSwitcher />
            </div>

            <Nav.Link
              as={NavLink}
              to="/profile"
              className="d-flex align-items-center"
              style={({ isActive }) => (isActive ? activeStyle : {})}
            >
              <Image
                src={
                  user?.imageUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=4a6fa5&color=fff&bold=true`
                }
                roundedCircle
                width="30"
                height="30"
                className="me-2"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=4a6fa5&color=fff&bold=true`;
                }}
              />
              <span className="d-none d-md-inline">{user?.name}</span>
            </Nav.Link>

            <Nav.Link onClick={handleLogout} className="text-danger">
              <FaSignOutAlt className="me-1" />
              <span className="d-none d-md-inline">Logout</span>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
