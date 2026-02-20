[![Issues][issues-shield]][issues-url]
[![LinkedIn][linkedin-shield]][linkedin-url]


# Monthly-spending-app

<!-- PROJECT LOGO -->
<br />
<p align="center">

  <h3 align="center">Monthly spending app</h3>

  <p align="center">
  Monthly Spending App
    <br />
    <a href="https://github.com/fidodo/monthly-spending"><strong>Explore the repo »</strong></a>
    <br />
    <br />
    <a href="">View Demo</a>
    ·
    <a href="https://github.com/fidodo/monthly-spending/issues">Report Bug</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->

## Table of Contents


[Features](#features)

[Advanced Features](#advanced-features)

[Tech Stack](#tech-stack)

[Prerequisites](#prerequisites)

[Installation](#installation)

[Configuration](#configuration)

[Running the Application](#running-the-application)

[API Endpoints](#api-endpoint)

[Database Schema](#data-schema)

[Usage Guide](#user-guide)

[Troubleshooting](#troubleshooting)

[Contributing](#contributing)

[License](#license)


<!-- Features -->
## Features
Core Functionality
✅ User Authentication - Google OAuth and email/password login

✅ Monthly Budget Tracking - Set and monitor monthly earnings

✅ Expense Management - Add, edit, and delete spending entries

✅ Bills & Loans Management - Track recurring bills and loan payments

✅ Spending Analytics - Visual breakdown of expenses by category

✅ 80% Spending Alert - Warning when reaching 80% of monthly budget

✅ Dark/Light Theme - Toggle between themes for comfortable viewing


<!-- Advanced Features -->
## Advanced Features
📊 Interactive Charts - progress bars for spending visualization

🖨️ Print Reports - Generate printable spending reports

📱 Responsive Design - Works on desktop, tablet, and mobile

💾 Local Storage - Data persistence between sessions

🔒 Secure Authentication - JWT-based authentication

<!-- Tech Stack -->
## Tech Stack
Frontend
React 19 - UI library

React Router DOM 7 - Navigation and routing

Bootstrap 5 + React-Bootstrap - Styling and components

Axios - HTTP client for API requests

Chart.js + React-Chartjs-2 - Data visualization

React Icons - Icon library

React Google OAuth - Google authentication

Backend
Node.js - Runtime environment

Express 4 - Web framework

PostgreSQL - Database

pg - PostgreSQL client for Node.js

bcryptjs - Password hashing

jsonwebtoken - JWT authentication

cors - Cross-origin resource sharing

dotenv - Environment variables

<!-- Prerequisites-->
## Prerequisites
Before you begin, ensure you have installed:

Node.js (v14 or higher)

npm (v6 or higher)

PostgreSQL (v12 or higher)

PGAdmin 4 (optional, for database management)

Git (for cloning the repository)

<!-- Installation -->
## Installation
### 1. Clone the Repository
```sh
git clone https://github.com/fidodo/monthly-spending.git
```
cd monthly-spending
### 2. Install Frontend Dependencies
cd frontend
```sh
npm install
```
### 3. Install Backend Dependencies
cd ../backend
```sh
npm install
```
### 4. Set Up PostgreSQL Database
# Access PostgreSQL
```sh
sudo -u postgres psql
```
# Create database
CREATE DATABASE spending_tracker;

# Create user (if needed)
1. CREATE USER your_user WITH PASSWORD 'your_password';

2. GRANT ALL PRIVILEGES ON DATABASE spending_tracker TO your_user;

 Exit
\q

<!-- Configuration-->
##⚙️ Configuration
Create .env file for backend

 ```bash
   cp .env.example .env
   ```
# Server Configuration
1. PORT=5000
2. NODE_ENV=development

# Database Configuration
1. DB_USER=postgres
2. DB_HOST=localhost
3. DB_NAME=spending_tracker
4. DB_PASSWORD=your_password_here
5. DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Google OAuth (optional - for Google login)
1. GOOGLE_CLIENT_ID=your_google_client_id_here
2 .GOOGLE_CLIENT_SECRET=your_google_client_secret_here

Create .env file for frontend
1. REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
2. REACT_APP_API_URL=http://localhost:5000/api

<!-- Running the Application-->
## Running The Application
### Start the Backend Server
cd backend

```sh
npm run dev
```
# Server runs on http://localhost:5000
### Start the frontend
cd frontend

```sh
npm start
```
# App runs on http://localhost:3000
### Access the application
http://localhost:3000

<!-- API Endpoints -->
## API Endpoints
### Authentication Routes (/api/auth)
Method	Endpoint	Description
POST	/register	Register new user
POST	/login	Login user
POST	/google	Google OAuth login
GET	/me	Get current user info
### Spending Routes (/api/spending)
Method	Endpoint	Description
GET	/	Get all spending entries
GET	/:id	Get single spending entry
POST	/	Create new spending entry
PUT	/:id	Update spending entry
DELETE	/:id	Delete spending entry
GET	/analytics/summary	Get spending summary
GET	/analytics/categories	Get category breakdown
### Bills Routes (/api/bills)
Method	Endpoint	Description
GET	/	Get all bills
POST	/	Create new bill
PUT	/:id	Update bill
DELETE	/:id	Delete bill
PUT	/:id/paid	Mark bill as paid
PUT	/:id/unpaid	Mark bill as unpaid
### Loans Routes (/api/loans)
Method	Endpoint	Description
GET	/	Get all loans
GET	/active	Get active (unpaid) loans
GET	/paid	Get paid loans
POST	/	Create new loan
PUT	/:id	Update loan
DELETE	/:id	Delete loan
PUT	/:id/paid	Mark loan as paid
PUT	/:id/unpaid	Mark loan as unpaid
POST	/:id/payments	Record loan payment
GET	/:id/payments	Get loan payment history
### Earnings Routes (/api/earnings)
Method	Endpoint	Description
GET	/current	Get current month's earning
GET	/history	Get earnings history
POST	/	Set monthly earning
PUT	/:id	Update earning
DELETE	/:id	Delete earning
GET	/analytics/comparison	Compare spending vs earnings

<!--- Usage Guide -->
## Usage Guide
1. First Time Setup
Register with email/password or Google account

Set your monthly earning on the dashboard

2. Adding Expenses
Click "Add Spending" in the navigation

Enter amount, description, category, and date

Submit to save the expense

3. Managing Bills & Loans
Navigate to "Bills & Loans" page

Click "Add New" to create a bill or loan

Fill in the details (different forms for bills vs loans)

Mark as paid/unpaid as needed

4. Viewing Analytics
Go to "Analytics" page

View spending breakdown by category

Toggle between list view and pie chart

Click "Show more" to see additional categories

5. Printing Reports
On Analytics page, click "Print Report"

Choose between recent spending or all spending

Generate a formatted PDF-style report

6. Theme Switching
Click the sun/moon icon in the navbar

Toggle between light and dark themes

Preference is saved in localStorage

