### ✅ **Step 1: Start the container**

Open a terminal in the same directory as your `docker-compose.yml` file and run:

```bash
docker-compose up -d
```

This will:

- Download the `postgres:15` image if needed
- Start a PostgreSQL container
- Expose it on `localhost:5432`

---

### ✅ **Step 2: Connect to PostgreSQL**

You can connect using:

#### 🔹 Connection string (for Prisma, etc.):

```
postgresql://myuser:mypassword@localhost:5432/mydb
```

#### 🔹 CLI:

```bash
docker exec -it local_postgres psql -U myuser -d mydb
```

#### 🔹 GUI (e.g., pgAdmin, TablePlus, DBeaver):

- Host: `localhost`
- Port: `5432`
- User: `myuser`
- Password: `mypassword`
- Database: `mydb`

---

### ✅ Optional: Stop & Clean Up

- Stop container:

  ```bash
  docker-compose down
  ```

- Stop and remove volumes (wipe data):

  ```bash
  docker-compose down -v
  ```

---

Developed by Nadim Chowdhury (https://nadim.vercel.app)
