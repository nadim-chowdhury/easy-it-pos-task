# 🐳 Full Stack Dockerized Project

This is a fully Dockerized full-stack project with:

- **Frontend**: [http://127.0.0.1:3000](http://127.0.0.1:3000)
- **Backend API**: [http://127.0.0.1:3001/api](http://127.0.0.1:3001/api)
- **Swagger Docs**: [http://127.0.0.1:3001/api/docs](http://127.0.0.1:3001/api/docs)

---

## 📦 Prerequisites

- **Docker** and **Docker Desktop** installed
- (Optional) **Node.js** and **npm** for manual fallback

---

## 🚀 Getting Started (Using Docker)

1. **Start Docker Desktop** (ensure it’s running)

2. **Open terminal in the project root directory**

3. **Run the following command**:
   ```bash
   docker-compose up --build
   ```

4. **Wait for the build to complete**. This includes building:

   - Frontend (port `3000`)
   - Backend (port `3001`)
   - Database (if applicable)

5. **Check logs** to verify all services are running:

   ```bash
   docker-compose logs
   ```

6. **Visit the following links to test:**

   - Frontend UI: [http://127.0.0.1:3000](http://127.0.0.1:3000)
   - Backend API: [http://127.0.0.1:3001/api](http://127.0.0.1:3001/api)
   - Swagger Docs: [http://127.0.0.1:3001/api/docs](http://127.0.0.1:3001/api/docs)

---

## ⚙️ Manual Setup (If Docker Fails)

> In case Docker is not working properly, you can manually start both frontend and backend servers.

### 🔧 1. Backend Setup (Port `3001`)

1. Go to the backend directory:

   ```bash
   cd backend
   ```

2. **Update the `.env` file** with the correct database URL.

3. Install dependencies:

   ```bash
   npm install
   ```

4. Generate Prisma client:

   ```bash
   npx prisma generate
   ```

5. Start the development server:

   ```bash
   npm run start:dev
   ```

---

### 🎨 2. Frontend Setup (Port `3000`)

1. Go to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

---

## ✅ Final Testing

Once both servers are up and running, test the project at:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001/api](http://localhost:3001/api)
- Swagger Docs: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 🛠 Troubleshooting

- Ensure ports `3000` and `3001` are not in use by other applications.
- Double-check Docker Desktop is running.
- Make sure environment variables (especially DB URLs) are correct.

---

Happy coding! 🚀

---

Developed by [Nadim Chowdhury](https://nadim.vercel.app)
