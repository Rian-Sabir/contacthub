const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "contacts_user",
  password: process.env.DB_PASSWORD || "contacts_password",
  database: process.env.DB_NAME || "contacts_db",
});

// Check server and database connectivity
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database health check failed:", error.message);
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

// Create the contacts table automatically
async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(30),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Contacts table is ready.");
}

// Get all contacts
app.get("/api/contacts", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM contacts ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// Add a contact
app.post("/api/contacts", async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO contacts (name, email, phone)
       VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), email.trim(), phone?.trim() || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add contact" });
  }
});

// Update a contact
app.put("/api/contacts/:id", async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    const result = await pool.query(
      `UPDATE contacts
       SET name = $1, email = $2, phone = $3
       WHERE id = $4 RETURNING *`,
      [name.trim(), email.trim(), phone?.trim() || null, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update contact" });
  }
});

// Delete a contact
app.delete("/api/contacts/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM contacts WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Contacts API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Could not initialize the database:", error.message);
    process.exit(1);
  }
}

startServer();
