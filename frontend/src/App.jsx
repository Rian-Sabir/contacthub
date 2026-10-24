
import { useEffect, useState } from "react";
import "./App.css";

const API = "/api/contacts";

function App() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadContacts() {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Could not load contacts");
      setContacts(await response.json());
    } catch {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContacts();
  }, []);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function saveContact(event) {
    event.preventDefault();
    setMessage("");

    const url = editingId ? `${API}/${editingId}` : API;
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request failed");

      setForm({ name: "", email: "", phone: "" });
      setEditingId(null);
      setMessage(editingId ? "Contact updated successfully." : "Contact added successfully.");
      await loadContacts();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editContact(contact) {
    setForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "",
    });
    setEditingId(contact.id);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteContact(id) {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Delete failed");
      setMessage("Contact deleted successfully.");
      await loadContacts();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const filtered = contacts.filter((contact) =>
    `${contact.name} ${contact.email} ${contact.phone || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-icon">C</span>
          ContactHub
        </a>
      </header>

      <section className="page-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR PERSONAL DIRECTORY</p>
            <h1>Contacts</h1>
          </div>
          <div className="total-card">
            <span>Total contacts</span>
            <strong>{contacts.length}</strong>
          </div>
        </div>

        <section className="panel form-panel">
          <h2>{editingId ? "Edit contact" : "Add a new contact"}</h2>
          <form onSubmit={saveContact} className="contact-form">
            <label>
              Full name *
              <input
                name="name"
                aria-label="Full name"
                placeholder="e.g. Rian Sabir"
                value={form.name}
                onChange={updateField}
                required
              />
            </label>
            <label>
              Email address *
              <input
                name="email"
                aria-label="Email address"
                type="email"
                placeholder="rian@example.com"
                value={form.email}
                onChange={updateField}
                required
              />
            </label>
            <label>
              Phone number
              <input
                name="phone"
                aria-label="Phone number"
                placeholder="+92 300 1234567"
                value={form.phone}
                onChange={updateField}
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-button">
                {editingId ? "Save changes" : "+ Add contact"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ name: "", email: "", phone: "" });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          {message && <p role="status" className="status-message">{message}</p>}
        </section>

        <section className="panel contacts-panel">
          <div className="list-heading">
            <div>
              <h2>All contacts</h2>
              <p>Manage your saved contacts below.</p>
            </div>
            <input
              className="search-input"
              aria-label="Search contacts"
              placeholder="Search contacts..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {loading ? (
            <p className="empty-state">Loading contacts...</p>
          ) : filtered.length === 0 ? (
            <p className="empty-state">
              {search ? "No matching contacts found." : "No contacts yet. Add your first contact above."}
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contact) => (
                    <tr key={contact.id}>
                      <td>
                        <div className="person-cell">
                          <span className="avatar">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                          <strong>{contact.name}</strong>
                        </div>
                      </td>
                      <td>{contact.email}</td>
                      <td>{contact.phone || "—"}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="edit-button"
                            onClick={() => editContact(contact)}
                            aria-label={`Edit ${contact.name}`}
                          >
                            Edit
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => deleteContact(contact.id)}
                            aria-label={`Delete ${contact.name}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer>ContactHub · Simple, organized, connected.</footer>
      </section>
    </main>
  );
}

export default App;
