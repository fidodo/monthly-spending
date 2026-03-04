// components/MobileBottomNav.js
import React from "react";
import { Nav } from "react-bootstrap";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaHome,
  FaPlus,
  FaFileInvoiceDollar,
  FaChartPie,
  FaUser,
} from "react-icons/fa";

const MobileBottomNav = ({ user }) => {
  const location = useLocation();

  // Hide on login page
  if (location.pathname === "/login") return null;

  const menuItems = [
    { label: "Home", href: "/", icon: FaHome },
    { label: "Add", href: "/add-spending", icon: FaPlus },
    { label: "Bills", href: "/bills-loans", icon: FaFileInvoiceDollar },
    { label: "Analytics", href: "/analytics", icon: FaChartPie },
    { label: "Profile", href: "/profile", icon: FaUser },
  ];

  return (
    <Nav className="mobile-bottom-nav d-lg-none">
      {menuItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Nav.Link
            key={item.label}
            as={NavLink}
            to={item.href}
            className={({ isActive }) =>
              `mobile-nav-item ${isActive ? "active" : ""}`
            }
            end={item.href === "/"}
          >
            <IconComponent className="mobile-nav-icon" />
            <span className="mobile-nav-label">{item.label}</span>
          </Nav.Link>
        );
      })}
    </Nav>
  );
};

export default MobileBottomNav;
