# 💸 Digital Wallet System

A secure and scalable digital wallet system inspired by **bKash**. Built using **Node.js**, **Express.js**, and **MongoDB**, it supports core wallet operations such as Cash-In, Cash-Out, Add Money, Withdraw, Send Money, Admin controls, and Agent requests.

---

### 🛡️ Admin Account

```json
{
  "name": "Admin Man",
  "phoneNumber": "01622334455",
  "password": "12345678"
}
```

## 🚀 Project Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/digital-wallet-system.git
cd digital-wallet-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env` file

```
PORT=4000
DB_URL=mongodb://localhost:27017/your_db_name
NODE_ENV=development

# JWT
JWT_ACCESS_SECRET=access_secret
JWT_ACCESS_EXPIRES=1d
JWT_REFRESH_SECRET=JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES=30d

# BCRYPT
BCRYPT_SALT_ROUND=10

# ADMIN
ADMIN_PHONE_NUMBER=01622334455
ADMIN_PASSWORD=12345678

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 4. Run the server

```bash
npm run dev
```

---

## 🌐 Base URL

```
http://localhost:4000/api/v1
```

---

## 📌 Features Implemented

### ✅ User Authentication

- **Register**: `/user/register`
- **Login**: `/auth/login`
- **Logout**: `/auth/logout`
- **Profile**: `/user/me`

### 💰 Wallet

- **View My Wallet**: `/wallet/my`
- **Admin Fund Agent**: `/wallet/fund-agent`
- **Admin Block/Unblock Wallet**: `/wallet/:walletId/block` / `/wallet/:walletId/unblock`

### 🔁 Transactions

- **User Add Money**: `/transactions/add-money`
- **User Withdraw**: `/transactions/withdraw`
- **User Send Money**: `/transactions/send-money`
- **Cash In** *(Agent → User)*: `/transactions/cash-in`
- **Cash Out** *(User → Agent)*: `/transactions/cash-out`
- **View My Transactions**: `/transactions/my`
- **View Agent Commissions**: `/transactions/agent-commissions`

### 🧑‍💼 Admin Panel

- **View All Users**: `/admin/users`
- **View All Agents**: `/admin/agents`
- **View All Wallets**: `/admin/wallets`
- **View All Transactions**: `/admin/transactions`
- **Block/Unblock Wallets**

### 🧾 Agent Request

- **Request to become Agent**: `/agent-requests`
- **Admin Approve Agent**: `/agent-requests/:id/approve`
- **Admin Suspend Agent**: `/agent-requests/suspend/:id`
- **Admin View All Requests**: `/agent-requests`

---

## 🛡️ Admin Permissions

Admins can:

- Approve or suspend agents
- View all data: users, wallets, agents, transactions
- Fund agents
- Block/unblock wallets

---

## 👨‍💻 Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB (Mongoose)**
- **TypeScript**
- **JWT Authentication**
- **Postman** (API testing)

---