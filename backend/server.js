const express = require("express");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./routes/auth");
const billsRoutes = require("./routes/bills");
const loansRoutes = require("./routes/loans");
const spendingRoutes = require("./routes/spending");
const earningRoutes = require("./routes/earnings");
const app = express();

app.use(cors());
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/bills", billsRoutes);
app.use("/api/loans", loansRoutes);
app.use("/api/spending", spendingRoutes);
app.use("/api/earnings", earningRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Spending Tracker API",
    status: "running",
    port: process.env.PORT || 5000,
  });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
