// App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import SpendingInput from "./components/SpendingInput";
import Analytics from "./components/Analytics";
import Profile from "./components/Profile";
import BillsLoans from "./components/BillsLoans";
import { spendingAPI, earningsAPI, billsAPI, loansAPI } from "./services/api";

function App() {
  const [user, setUser] = useState(null);
  const [monthlyEarning, setMonthlyEarning] = useState(0);
  const [spending, setSpending] = useState([]);
  const [bills, setBills] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check if user is logged in from localStorage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      // Fetch all data for logged in user
      fetchAllUserData();
    }
  }, []);

  // ✅ NEW: Fetch all user data from backend
  const fetchAllUserData = async () => {
    setLoading(true);
    try {
      console.log("📥 Fetching all user data...");

      // Fetch spending
      const spendingRes = await spendingAPI.getAll();
      console.log(spendingRes.data, "spending entries fetched");
      setSpending(spendingRes.data);
      localStorage.setItem("spending", JSON.stringify(spendingRes.data));

      // Fetch current month earning
      try {
        const earningRes = await earningsAPI.getCurrent();
        console.log("Current Monthly Earning:", earningRes.data.amount);
        setMonthlyEarning(earningRes.data.amount || 0);
        localStorage.setItem(
          "monthlyEarning",
          earningRes.data.amount?.toString() || "0",
        );
      } catch (err) {
        console.log("No monthly earning set yet");
      }

      // Fetch bills
      try {
        const billsRes = await billsAPI.getAll();
        setBills(billsRes.data);
        localStorage.setItem("bills", JSON.stringify(billsRes.data));
      } catch (err) {
        console.log("No bills found");
      }

      // Fetch loans
      try {
        const loansRes = await loansAPI.getAll();
        setLoans(loansRes.data);
        localStorage.setItem("loans", JSON.stringify(loansRes.data));
      } catch (err) {
        console.log("No loans found");
      }

      console.log("✅ All user data fetched successfully");
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Handle login - now fetches data after successful login
  const handleLogin = async (userData, token) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (token) {
      localStorage.setItem("token", token);
    }

    // Fetch all data immediately after login
    await fetchAllUserData();
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setSpending([]);
    setMonthlyEarning(0);
    setBills([]);
    setLoans([]);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("spending");
    localStorage.removeItem("monthlyEarning");
    localStorage.removeItem("bills");
    localStorage.removeItem("loans");
  };

  // Update monthly earning
  const updateMonthlyEarning = async (earning) => {
    try {
      const response = await earningsAPI.setEarning({
        amount: earning,
        month: new Date().toISOString().split("T")[0],
      });
      setMonthlyEarning(response.data.amount);
      console.log("Monthly earning updated:", response.data.amount);
      localStorage.setItem("monthlyEarning", response.data.amount.toString());
    } catch (error) {
      console.error("Error updating monthly earning:", error);
    }
  };

  // Add new spending entry
  const addSpending = async (entry) => {
    try {
      const response = await spendingAPI.create(entry);
      const newSpending = [...spending, response.data];
      setSpending(newSpending);
      localStorage.setItem("spending", JSON.stringify(newSpending));
    } catch (error) {
      console.error("Error adding spending:", error);
    }
  };

  // Calculate total spent
  const totalSpent = spending.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  console.log("Total Spent:", totalSpent);
  // Check if 80% threshold is reached
  const isThresholdReached =
    monthlyEarning > 0 && totalSpent / monthlyEarning >= 0.8;

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} onLogout={handleLogout} />}

        <Container className="mt-4">
          {loading && user && (
            <div className="text-center mb-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading your data...</p>
            </div>
          )}

          <Routes>
            <Route
              path="/login"
              element={
                user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
              }
            />
            <Route
              path="/"
              element={
                user ? (
                  <Dashboard
                    monthlyEarning={monthlyEarning}
                    spending={spending}
                    totalSpent={totalSpent}
                    isThresholdReached={isThresholdReached}
                    onUpdateEarning={updateMonthlyEarning}
                    bills={bills}
                    loans={loans}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/add-spending"
              element={
                user ? (
                  <SpendingInput
                    onAddSpending={addSpending}
                    monthlyEarning={monthlyEarning}
                    totalSpent={totalSpent}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/analytics"
              element={
                user ? (
                  <Analytics
                    spending={spending}
                    monthlyEarning={monthlyEarning}
                    totalSpent={totalSpent}
                    bills={bills}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/profile"
              element={
                user ? (
                  <Profile user={user} monthlyEarning={monthlyEarning} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/bills-loans"
              element={
                user ? (
                  <BillsLoans spending={spending} bills={bills} loans={loans} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;
