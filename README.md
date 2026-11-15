# Daybook Server

A RESTful API built with **Node.js, Express.js, TypeScript, and MongoDB (Mongoose)** for the Daybook appointment management application.

## 🚀 Features

- RESTful API using Express.js
- TypeScript for type safety
- MongoDB integration using Mongoose
- Environment-based configuration using dotenv
- CORS support
- Appointment management
- Database seeding
- Automated API testing with Node.js test runner and Supertest
- TypeScript type checking and production builds

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js (>= 20) | JavaScript runtime |
| Express.js | Backend framework |
| TypeScript | Type safety |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| dotenv | Environment variables |
| CORS | Cross-origin resource sharing |
| tsx | TypeScript development runtime |
| Supertest | API testing |

## 📁 Project Structure

```text
daybook-server/
│
├── src/
│   ├── index.ts
│   ├── seed.ts
│   └── ...
│
├── test/
│   └── appointments.test.ts
│
├── dist/                  # Generated after build
│
├── .env                   # Environment variables
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── tsconfig.test.json
```

## 📋 Prerequisites

Make sure you have the following installed:

- Node.js >= 20
- npm >= 10
- MongoDB (local installation or MongoDB Atlas)

## ⚙️ Installation

**1. Clone the repository**

```bash
git clone <your-repository-url>
```

**2. Navigate to the project directory**

```bash
cd daybook-server
```

**3. Install dependencies**

```bash
npm install
```

## 🔐 Environment Variables

Create a `.env` file in the root directory.

```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/daybook
```

Update the MongoDB connection string according to your database configuration.

For MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/daybook
```

**Note:** Never commit your `.env` file or expose database credentials publicly.

## ▶️ Running the Application

**Development mode**

Starts the server with automatic restart on file changes.

```bash
npm run dev
```

**Production build**

Compile TypeScript into JavaScript.

```bash
npm run build
```

**Start production server**

```bash
npm start
```

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server using tsx watch |
| `npm run build` | Compile TypeScript into the dist directory |
| `npm start` | Start the compiled production server |
| `npm run seed` | Execute database seed script |
| `npm test` | Run appointment tests |
| `npm run typecheck` | Type-check application and test TypeScript files |

## 🌱 Database Seeding

To populate the database with initial data, execute:

```bash
npm run seed
```

Make sure your MongoDB connection is configured before running the seed command.

## 🧪 Testing

Run the automated test suite:

```bash
npm test
```

The project uses:

- Node.js built-in test runner
- Supertest for HTTP endpoint testing
- TypeScript through tsx

Test file:

```text
test/appointments.test.ts
```

## 🔍 Type Checking

Run TypeScript checks for the application and tests:

```bash
npm run typecheck
```

## 🏗️ Production Deployment

Build the project:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The production entry point is:

```text
dist/index.js
```

Ensure that your deployment environment has:

- Node.js 20 or higher
- MongoDB connection configured
- Required environment variables
- Production dependencies installed

## 🔒 Security Recommendations

- Keep sensitive credentials inside environment variables.
- Never commit `.env` files.
- Validate incoming API requests.
- Use appropriate CORS configuration.
- Handle errors centrally.
- Secure MongoDB connection credentials.
- Use HTTPS in production.

## 📄 License

This project is private and intended for the Daybook application.

---

**Daybook Server** – Backend API for managing appointments efficiently.