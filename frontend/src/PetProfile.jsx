
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  PawPrint,
  HeartPulse,
  Syringe,
  UserRound,
  Phone,
  CalendarDays,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  ClipboardList,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/pets";

function PetProfile() {
  const { id } = useParams();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [medicalForm, setMedicalForm] = useState({
    visitDate: new Date().toISOString().slice(0, 10),
    diagnosis: "",
    treatment: "",
    notes: "",
  });

  const [vaccineForm, setVaccineForm] = useState({
    vaccineName: "",
    vaccinationDate: new Date().toISOString().slice(0, 10),
    nextDueDate: "",
    notes: "",
  });

  const loadPet = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load pet.");
      }

      setPet(data.pet);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  async function submitRecord(event, type) {
    event.preventDefault();
    setMessage("");
    setError("");

    const isMedical = type === "medical";
    const form = isMedical ? medicalForm : vaccineForm;

    if (isMedical && !form.diagnosis.trim()) {
      setError("Please enter a diagnosis.");
      return;
    }

    if (!isMedical && !form.vaccineName.trim()) {
      setError("Please enter the vaccine name.");
      return;
    }

    if (!isMedical && !form.vaccinationDate) {
      setError("Please select the vaccination date.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/${id}/${type === "medical" ? "medical" : "vaccinations"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save record.");
      }

      setMessage(data.message || "Record saved successfully.");

      if (isMedical) {
        setMedicalForm({
          visitDate: new Date().toISOString().slice(0, 10),
          diagnosis: "",
          treatment: "",
          notes: "",
        });
      } else {
        setVaccineForm({
          vaccineName: "",
          vaccinationDate: new Date().toISOString().slice(0, 10),
          nextDueDate: "",
          notes: "",
        });
      }

      await loadPet();
    } catch (err) {
      setError(err.message || "Could not save the record.");
    } finally {
      setSaving(false);
    }
  }
  
function startEditing(type, record) {
  setError("");
  setMessage("");

  setEditingRecord({
    type,
    recordId: record._id,
  });

  if (type === "medical") {
    setEditForm({
      visitDate: record.visitDate
        ? new Date(record.visitDate).toISOString().slice(0, 10)
        : "",
      diagnosis: record.diagnosis || "",
      treatment: record.treatment || "",
      notes: record.notes || "",
    });
  } else {
    setEditForm({
      vaccineName: record.vaccineName || "",
      vaccinationDate: record.vaccinationDate
        ? new Date(record.vaccinationDate).toISOString().slice(0, 10)
        : "",
      nextDueDate: record.nextDueDate
        ? new Date(record.nextDueDate).toISOString().slice(0, 10)
        : "",
      notes: record.notes || "",
    });
  }
}

function cancelEditing() {
  setEditingRecord(null);
  setEditForm({});
}
  
async function saveEditedRecord(event) {
  event.preventDefault();

  if (!editingRecord) return;

  const { type, recordId } = editingRecord;
  const isMedical = type === "medical";

  if (isMedical && !editForm.diagnosis?.trim()) {
    setError("Please enter a diagnosis.");
    return;
  }

  if (!isMedical && !editForm.vaccineName?.trim()) {
    setError("Please enter the vaccine name.");
    return;
  }

  if (!isMedical && !editForm.vaccinationDate) {
    setError("Please select the vaccination date.");
    return;
  }

  setSaving(true);
  setError("");
  setMessage("");

  try {
    const response = await fetch(
      `${API_URL}/${id}/${type}/${recordId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to update record.");
    }

    setMessage(data.message || "Record updated successfully.");
    cancelEditing();
    await loadPet();
  } catch (err) {
    setError(err.message || "Could not update the record.");
  } finally {
    setSaving(false);
  }
}

  async function deleteRecord(type, recordId) {
    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/${id}/${type}/${recordId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete record.");
      }

      setMessage(data.message || "Record deleted successfully.");
      await loadPet();
    } catch (err) {
      setError(err.message || "Could not delete the record.");
    }
  }

  function formatDate(date) {
    if (!date) return "Not specified";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? "Not specified"
      : parsed.toLocaleDateString();
  }

  function getVaccinationStatus(date) {
    if (!date) return "No due date";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(date);
    due.setHours(0, 0, 0, 0);

    const days = Math.ceil((due - today) / 86400000);

    if (days < 0) return "Overdue";
    if (days <= 30) return "Due soon";
    return "Scheduled";
  }

  if (loading) {
    return (
      <div className="empty-state">
        <LoaderCircle className="spin" size={30} />
        <p>Loading pet profile...</p>
      </div>
    );
  }

  if (error && !pet) {
    return (
      <div className="content-panel" style={{ padding: 32 }}>
        <h2>Unable to display pet profile</h2>
        <p>{error}</p>
        <Link to="/" className="primary-button">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!pet) return null;

  const vaccinations = pet.vaccinations || [];
  const medicalHistory = pet.medicalHistory || [];

  return (
    <main className="main-content">
      <Link
        to="/"
        className="primary-button"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          marginBottom: 24,
        }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>

      <header className="topbar">
        <div>
          <div className="breadcrumb">Workspace / Pet Profile</div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <h1 style={{ margin: 0 }}>{pet.name}</h1>

            <Link
              to={`/?edit=${pet._id}`}
              className="primary-button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
              }}
            >
              <Pencil size={17} /> Edit Pet
            </Link>
          </div>

          <p className="subtitle">
            Pet information, medical history, and vaccination records.
          </p>
        </div>

        <span className="pet-avatar">
          <PawPrint size={28} />
        </span>
      </header>

      {message && (
        <div className="content-panel" role="status"
          style={{ padding: 14, marginBottom: 16 }}>
          {message}
        </div>
      )}

      {error && (
        <div className="content-panel" role="alert"
          style={{ padding: 14, marginBottom: 16 }}>
          <p>{error}</p>
        </div>
      )}

      {/* Pet details */}
      <section className="content-panel" style={{ padding: 28 }}>
        <h2><PawPrint size={21} /> Pet Information</h2>

        <div className="form-grid" style={{ marginTop: 20 }}>
          <div><strong>Pet Name</strong><p>{pet.name}</p></div>
          <div><strong>Species</strong><p>{pet.species}</p></div>
          <div><strong>Breed</strong><p>{pet.breed || "Not specified"}</p></div>
          <div>
            <strong>Age</strong>
            <p>{pet.age} {pet.age === 1 ? "year" : "years"}</p>
          </div>
          <div><strong>Gender</strong><p>{pet.gender || "Unknown"}</p></div>
        </div>
      </section>

      {/* Owner details */}
      <section className="content-panel" style={{ padding: 28, marginTop: 20 }}>
        <h2><UserRound size={21} /> Owner Information</h2>

        <div className="form-grid" style={{ marginTop: 20 }}>
          <div><strong>Owner Name</strong><p>{pet.ownerName}</p></div>
          <div>
            <strong><Phone size={17} /> Contact Number</strong>
            <p>{pet.ownerPhone || "Not provided"}</p>
          </div>
        </div>
      </section>

      {/* Add medical record */}
      <section className="content-panel" style={{ padding: 28, marginTop: 20 }}>
        <h2><HeartPulse size={21} /> Add Medical Record</h2>
        <p>Record a visit, diagnosis, and treatment for this pet.</p>

        <form onSubmit={(event) => submitRecord(event, "medical")}>
          <div className="form-grid" style={{ marginTop: 20 }}>
            <label>
              Visit Date
              <input
                type="date"
                value={medicalForm.visitDate}
                onChange={(e) => setMedicalForm({
                  ...medicalForm, visitDate: e.target.value
                })}
                required
              />
            </label>

            <label>
              Diagnosis
              <input
                value={medicalForm.diagnosis}
                onChange={(e) => setMedicalForm({
                  ...medicalForm, diagnosis: e.target.value
                })}
                placeholder="Enter diagnosis"
                required
              />
            </label>

            <label>
              Treatment
              <input
                value={medicalForm.treatment}
                onChange={(e) => setMedicalForm({
                  ...medicalForm, treatment: e.target.value
                })}
                placeholder="Enter treatment"
              />
            </label>

            <label>
              Notes
              <input
                value={medicalForm.notes}
                onChange={(e) => setMedicalForm({
                  ...medicalForm, notes: e.target.value
                })}
                placeholder="Additional notes"
              />
            </label>
          </div>

          <button className="primary-button" type="submit"
            disabled={saving} style={{ marginTop: 20 }}>
            <Plus size={17} /> Add Medical Record
          </button>
        </form>
      </section>

      {/* Medical history */}
      <section className="content-panel" style={{ padding: 28, marginTop: 20 }}>
        <h2><ClipboardList size={21} /> Medical History ({medicalHistory.length})</h2>

        {medicalHistory.length === 0 ? (
          <p>No medical visits recorded yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
            {[...medicalHistory].reverse().map((record) => (
              <div key={record._id} style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16,
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}>
  <h3 style={{ margin: 0 }}>{record.diagnosis}</h3>

  <div style={{ display: "flex", gap: 8 }}>
    <button
      type="button"
      className="secondary-button"
      onClick={() => startEditing("medical", record)}
      aria-label="Edit medical record"
    >
      <Pencil size={16} /> Edit
    </button>

    <button
      type="button"
      className="secondary-button"
      onClick={() => deleteRecord("medical", record._id)}
      aria-label="Delete medical record"
    >
      <Trash2 size={16} /> Delete
    </button>
  </div>
</div>

{editingRecord?.type === "medical" &&
  editingRecord.recordId === record._id && (
    <form
      onSubmit={saveEditedRecord}
      style={{ marginTop: 16 }}
    >
      <div className="form-grid">
        <label>
          Visit Date
          <input
            type="date"
            value={editForm.visitDate || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                visitDate: e.target.value,
              })
            }
            required
          />
        </label>

        <label>
          Diagnosis
          <input
            value={editForm.diagnosis || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                diagnosis: e.target.value,
              })
            }
            required
          />
        </label>

        <label>
          Treatment
          <input
            value={editForm.treatment || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                treatment: e.target.value,
              })
            }
          />
        </label>

        <label>
          Notes
          <input
            value={editForm.notes || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                notes: e.target.value,
              })
            }
          />
        </label>
      </div>

      <div style={{
        display: "flex",
        gap: 8,
        marginTop: 12,
      }}>
        <button
          type="submit"
          className="primary-button"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={cancelEditing}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  )}




                <p><strong>Visit date:</strong> {formatDate(record.visitDate)}</p>
                <p><strong>Treatment:</strong> {record.treatment || "Not specified"}</p>
                <p style={{ whiteSpace: "pre-wrap" }}>
                  <strong>Notes:</strong> {record.notes || "None"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add vaccination */}
      <section className="content-panel" style={{ padding: 28, marginTop: 20 }}>
        <h2><Syringe size={21} /> Add Vaccination</h2>
        <p>Maintain a separate record for every vaccination.</p>

        <form onSubmit={(event) => submitRecord(event, "vaccinations")}>
          <div className="form-grid" style={{ marginTop: 20 }}>
            <label>
              Vaccine Name
              <input
                value={vaccineForm.vaccineName}
                onChange={(e) => setVaccineForm({
                  ...vaccineForm, vaccineName: e.target.value
                })}
                placeholder="e.g. Rabies"
                required
              />
            </label>

            <label>
              Vaccination Date
              <input
                type="date"
                value={vaccineForm.vaccinationDate}
                onChange={(e) => setVaccineForm({
                  ...vaccineForm, vaccinationDate: e.target.value
                })}
                required
              />
            </label>

            <label>
              Next Due Date
              <input
                type="date"
                value={vaccineForm.nextDueDate}
                onChange={(e) => setVaccineForm({
                  ...vaccineForm, nextDueDate: e.target.value
                })}
              />
            </label>

            <label>
              Notes
              <input
                value={vaccineForm.notes}
                onChange={(e) => setVaccineForm({
                  ...vaccineForm, notes: e.target.value
                })}
                placeholder="Optional notes"
              />
            </label>
          </div>

          <button className="primary-button" type="submit"
            disabled={saving} style={{ marginTop: 20 }}>
            <Plus size={17} /> Add Vaccination
          </button>
        </form>
      </section>

      {/* Vaccination history */}
      <section className="content-panel" style={{ padding: 28, marginTop: 20 }}>
        <h2><CalendarDays size={21} /> Vaccination History ({vaccinations.length})</h2>

        {vaccinations.length === 0 ? (
          <p>No vaccination records added yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
            {[...vaccinations].reverse().map((record) => (
              <div key={record._id} style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16,
              }}>
                
                <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  }}
>
  <h3 style={{ margin: 0 }}>{record.vaccineName}</h3>

  <div style={{ display: "flex", gap: 8 }}>
    <button
      type="button"
      className="secondary-button"
      onClick={() => startEditing("vaccinations", record)}
      aria-label="Edit vaccination record"
    >
      <Pencil size={16} /> Edit
    </button>

    <button
      type="button"
      className="secondary-button"
      onClick={() => deleteRecord("vaccinations", record._id)}
      aria-label="Delete vaccination record"
    >
      <Trash2 size={16} /> Delete
    </button>
  </div>
  {editingRecord?.type === "vaccinations" &&
  editingRecord.recordId === record._id && (
    <form
      onSubmit={saveEditedRecord}
      style={{ marginTop: 16 }}
    >
      <div className="form-grid">
        <label>
          Vaccine Name
          <input
            value={editForm.vaccineName || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                vaccineName: e.target.value,
              })
            }
            required
          />
        </label>

        <label>
          Vaccination Date
          <input
            type="date"
            value={editForm.vaccinationDate || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                vaccinationDate: e.target.value,
              })
            }
            required
          />
        </label>

        <label>
          Next Due Date
          <input
            type="date"
            value={editForm.nextDueDate || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                nextDueDate: e.target.value,
              })
            }
          />
        </label>

        <label>
          Notes
          <input
            value={editForm.notes || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                notes: e.target.value,
              })
            }
            placeholder="Optional notes"
          />
        </label>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
        }}
      >
        <button
          type="submit"
          className="primary-button"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={cancelEditing}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  )}
</div>

                <p>
                  <strong>Vaccination date:</strong>{" "}
                  {formatDate(record.vaccinationDate)}
                </p>
                <p>
                  <strong>Next due date:</strong>{" "}
                  {formatDate(record.nextDueDate)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {getVaccinationStatus(record.nextDueDate)}
                </p>
                <p style={{ whiteSpace: "pre-wrap" }}>
                  <strong>Notes:</strong> {record.notes || "None"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Existing pet notes and record date */}
      <section className="content-panel" style={{ padding: 28, marginTop: 20 }}>
        <h2><HeartPulse size={21} /> Existing Health Information</h2>

        <div style={{ marginTop: 20 }}>
          <strong>Original Medical Notes</strong>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {pet.medicalNotes || "No original medical notes added."}
          </p>
        </div>

        <div style={{ marginTop: 20 }}>
          <strong>Original Next Vaccination Date</strong>
          <p>{formatDate(pet.vaccinationDueDate)}</p>
        </div>

        <div style={{ marginTop: 20 }}>
          <strong><CalendarDays size={17} /> Record Created</strong>
          <p>{formatDate(pet.createdAt)}</p>
        </div>
      </section>
    </main>
  );
}

export default PetProfile;
