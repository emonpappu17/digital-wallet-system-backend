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

# **API Endpoints Summary**

## **Authentication (`/api/v1/auth`)**

| Endpoint | Method | Description | Required Role(s) | Request Body Example |
| --- | --- | --- | --- | --- |
| `/login` | POST | Log in a user | Public | `{"phoneNumber": "01622334455", "password": "12345678"}` |
| `/logout` | POST | Invalidate session token | User, Agent, Admin | - |

---

## **User Management (`/api/v1/user`)**

| Endpoint | Method | Description | Required Role(s) | Request Body Example |
| --- | --- | --- | --- | --- |
| `/register` | POST | Register new user | Public | `{"name": "John Doe", "phoneNumber": "01711223344", "password": "Pass123@"}` |
| `/me` | GET | Get user profile | User, Agent, Admin | - |

---

## **Wallet Operations (`/api/v1/wallet`)**

| Endpoint | Method | Description | Required Role(s) | Request Body Example |
| --- | --- | --- | --- | --- |
| `/my` | GET | Get wallet balance | User, Agent | - |
| `/fund-agent` | POST | Add balance to agent | Admin | `{"agentNumber": "01988776655", "amount": 5000}` |
| `/:walletId/block` | POST | Block wallet | Admin | - |
| `/:walletId/unblock` | POST | Unblock wallet | Admin | - |

---

## **Transactions (`/api/v1/transactions`)**

| Endpoint | Method | Description | Required Role(s) | Request Body Example |
| --- | --- | --- | --- | --- |
| `/add-money` | POST | Add money to wallet | User | `{"amount": 1000}` |
| `/send-money` | POST | Send money to user | User | `{"receiverPhoneNumber": "01766554432", "amount": 500}` |
| `/withdraw` | POST | Withdraw money | User | `{"amount": 300}` |
| `/cash-in` | POST | Agent adds money | Agent | `{"userPhoneNumber": "01711223344", "amount": 1000}` |
| `/cash-out` | POST | Withdraw via agent | User | `{"agentPhoneNumber": "01988776655", "amount": 500}` |
| `/my` | GET | Transaction history | User, Agent | - |
| `/agent-commissions` | GET | Commission history | Agent | - |

---

## **Agent Requests (`/api/v1/agent-requests`)**

| Endpoint | Method | Description | Required Role(s) | Request Body Example |
| --- | --- | --- | --- | --- |
| `/` | POST | Submit application | User | `{"name": "Agent Smith", "phoneNumber": "01988776655", "password": "asdfQ123@", "tradeLicenseNumber": "TRADE12345"}` |
| `/` | GET | List requests | Admin | - |
| `/:requestId/approve` | PATCH | Approve request | Admin | - |
| `/:requestId/suspend` | PATCH | Suspend agent | Admin | - |

---

## **Admin Dashboard (`/api/v1/admin`)**

| Endpoint | Method | Description | Required Role(s) | Request Body Example |
| --- | --- | --- | --- | --- |
| `/users` | GET | List all users | Admin | - |
| `/wallets` | GET | List all wallets | Admin | - |
| `/agents` | GET | List all agents | Admin | - |
| `/transactions` | GET | All transactions | Admin | - |

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