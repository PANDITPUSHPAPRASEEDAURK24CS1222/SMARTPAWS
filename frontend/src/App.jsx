import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  PawPrint,
  LayoutDashboard,
  Plus,
  Search,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Pencil,
  Trash2,
  HeartPulse,
  Syringe,
  X,
  LoaderCircle,
  Download,
  Upload,
} from "lucide-react";
import "./App.css";

const API_URL = "http://localhost:5000/api/pets";

const emptyForm = {
  name: "",
  species: "Dog",
  breed: "",
  age: "",
  ownerName: "",
  ownerPhone: "",
  gender: "Unknown",
  medicalNotes: "",
  vaccinationDueDate: "",
};

function App() {
  const [pets, setPets] = useState([]);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [searchParams, setSearchParams] = useSearchParams();

  // New vaccination filters
  const [vaccinationFilter, setVaccinationFilter] = useState("All");
  const [vaccinationSort, setVaccinationSort] = useState("soonest");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadPets() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load pets.");
      }

      const data = await response.json();
      setPets(data.pets || []);
    } catch {
      setError(
        "Cannot connect to SmartPaws. Make sure the backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPets();
  }, []);

  // Use the start of today to calculate vaccination status
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function getVaccinationStatus(pet) {
    if (!pet.vaccinationDueDate) {
      return "none";
    }

    const due = new Date(pet.vaccinationDueDate);
    due.setHours(0, 0, 0, 0);

    const days = Math.round(
      (due.getTime() - today.getTime()) / 86400000
    );

    if (days < 0) return "overdue";
    if (days <= 30) return "upcoming";
    return "scheduled";
  }

  // Search, species filtering and vaccination filtering
  const filteredPets = pets
    .filter((pet) => {
      const text =
        `${pet.name} ${pet.ownerName} ${pet.breed}`.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesSpecies =
        speciesFilter === "All" ||
        pet.species === speciesFilter;

      const status = getVaccinationStatus(pet);

      const matchesVaccination =
        vaccinationFilter === "All" ||
        (vaccinationFilter === "Overdue" &&
          status === "overdue") ||
        (vaccinationFilter === "DueSoon" &&
          status === "upcoming") ||
        (vaccinationFilter === "Scheduled" &&
          status === "scheduled") ||
        (vaccinationFilter === "NotScheduled" &&
          status === "none");

      return (
        matchesSearch &&
        matchesSpecies &&
        matchesVaccination
      );
    })
    .sort((a, b) => {
      // Pets without a vaccination date always appear last
      const dateA = a.vaccinationDueDate
        ? new Date(a.vaccinationDueDate).getTime()
        : null;

      const dateB = b.vaccinationDueDate
        ? new Date(b.vaccinationDueDate).getTime()
        : null;

      if (dateA === null && dateB === null) return 0;
      if (dateA === null) return 1;
      if (dateB === null) return -1;

      if (vaccinationSort === "latest") {
        return dateB - dateA;
      }

      return dateA - dateB;
    });

  const upcomingVaccinations = pets.filter(
    (pet) => getVaccinationStatus(pet) === "upcoming"
  ).length;

  const overdueVaccinations = pets.filter(
    (pet) => getVaccinationStatus(pet) === "overdue"
  ).length;

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEditForm(pet) {
    setEditingId(pet._id);

    setForm({
      name: pet.name || "",
      species: pet.species || "Dog",
      breed: pet.breed || "",
      age: String(pet.age ?? ""),
      ownerName: pet.ownerName || "",
      ownerPhone: pet.ownerPhone || "",
      gender: pet.gender || "Unknown",
      medicalNotes: pet.medicalNotes || "",
      vaccinationDueDate: pet.vaccinationDueDate
        ? pet.vaccinationDueDate.slice(0, 10)
        : "",
    });

    setError("");
    setShowForm(true);
  }

  useEffect(() => {
    const petIdToEdit = searchParams.get("edit");

    if (!petIdToEdit || loading) return;

    const petToEdit = pets.find(
      (pet) => pet._id === petIdToEdit
    );

    if (petToEdit) {
      openEditForm(petToEdit);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, pets, loading, setSearchParams]);
  
function validatePetForm() {
  if (!form.name.trim()) {
    setError("Please enter the pet's name.");
    return false;
  }

  if (!form.ownerName.trim()) {
    setError("Please enter the owner's name.");
    return false;
  }

  const age = Number(form.age);

  if (
    form.age === "" ||
    !Number.isFinite(age) ||
    age < 0 ||
    age > 100
  ) {
    setError("Age must be a number between 0 and 100.");
    return false;
  }

  if (form.ownerPhone.trim()) {
    const digits = form.ownerPhone.replace(/\D/g, "");

    if (digits.length < 7 || digits.length > 15) {
      setError("Enter a valid phone number with 7–15 digits.");
      return false;
    }
  }

  if (
    form.vaccinationDueDate &&
    Number.isNaN(new Date(form.vaccinationDueDate).getTime())
  ) {
    setError("Please enter a valid vaccination date.");
    return false;
  }

  if (form.name.trim().length > 80) {
    setError("Pet name cannot exceed 80 characters.");
    return false;
  }

  if (form.ownerName.trim().length > 100) {
    setError("Owner name cannot exceed 100 characters.");
    return false;
  }

  setError("");
  return true;
}
  
function exportPets() {
  const json = JSON.stringify(pets, null, 2);
  const blob = new Blob([json], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "smartpaws-pets.json";
  link.click();

  URL.revokeObjectURL(url);
}

async function importPets(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  setError("");
  setNotice("");

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(
        "The JSON file must contain a non-empty array of pet records."
      );
    }

    const validPets = data.every(
      (pet) =>
        pet &&
        typeof pet.name === "string" &&
        pet.name.trim() &&
        typeof pet.species === "string" &&
        typeof pet.ownerName === "string" &&
        pet.ownerName.trim() &&
        pet.age !== undefined &&
        Number.isFinite(Number(pet.age)) &&
        Number(pet.age) >= 0 &&
        Number(pet.age) <= 100
    );

    if (!validPets) {
      throw new Error(
        "Invalid pet data. Each record needs a name, species, owner name, and valid age."
      );
    }

    let imported = 0;

    for (const pet of data) {
      const payload = {
        name: pet.name.trim(),
        species: pet.species,
        breed: pet.breed || "",
        age: Number(pet.age),
        ownerName: pet.ownerName.trim(),
        ownerPhone: pet.ownerPhone || "",
        gender: pet.gender || "Unknown",
        medicalNotes: pet.medicalNotes || "",
        vaccinationDueDate: pet.vaccinationDueDate || null,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Import stopped after ${imported} pet records.`
        );
      }

      imported++;
    }

    await loadPets();
    setNotice(`Successfully imported ${imported} pet records.`);
  } catch (err) {
    setError(
      err instanceof SyntaxError
        ? "The file is not valid JSON."
        : err.message || "Unable to import pet records."
    );

    await loadPets();
  } finally {
    event.target.value = "";
  }
}

  async function savePet(event) {
    event.preventDefault();
    if (!validatePetForm()) return;
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      ...form,
      age: Number(form.age),
      vaccinationDueDate: form.vaccinationDueDate || null,
    };

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save pet.");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);

      setNotice(
        editingId
          ? "Pet details updated."
          : "Pet registered successfully."
      );

      await loadPets();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePet(pet) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${pet.name}'s record?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/${pet._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete pet.");
      }

      setNotice(`${pet.name}'s record was deleted.`);
      await loadPets();
    } catch (err) {
      setError(err.message || "Unable to delete pet.");
    }
  }

  function petIcon(species) {
    if (species === "Cat") return <Cat size={21} />;
    if (species === "Bird") return <Bird size={21} />;
    if (species === "Rabbit") return <Rabbit size={21} />;
    return <Dog size={21} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-icon">
            <PawPrint size={25} />
          </span>

          <span>
            Smart<span className="brand-accent">Paws</span>
            <small>PET CARE MANAGEMENT</small>
          </span>
        </a>

        <p className="side-label">WORKSPACE</p>

        <a className="nav-link active" href="#dashboard">
          <LayoutDashboard size={19} />
          Dashboard
        </a>

        <button className="nav-link" onClick={openAddForm}>
          <Plus size={19} />
          Register a pet
        </button>

        <div className="sidebar-bottom">
          <div className="care-card">
            <HeartPulse size={22} />
            <strong>Every pet matters.</strong>
            <p>
              Better records. Healthier, happier companions.
            </p>
          </div>

          <div className="profile-mini">
            <div className="avatar">SP</div>
            <div>
              <strong>Pet Care Team</strong>
              <small>Management portal</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              Workspace / Overview
            </div>

            <h1>
              Good day, Pet Care Team <span>âœ¦</span>
            </h1>

            <p className="subtitle">
              Here's what's happening with your pets today.
            </p>
          </div>

          
<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
  <button
    type="button"
    className="primary-button"
    onClick={exportPets}
  >
    <Download size={18} />
    Export JSON
  </button>

  <label className="primary-button" style={{ cursor: "pointer" }}>
    <Upload size={18} />
    Import JSON
    <input
      type="file"
      accept=".json,application/json"
      onChange={importPets}
      style={{ display: "none" }}
    />
  </label>

  <button
    type="button"
    className="primary-button"
    onClick={openAddForm}
  >
    <Plus size={19} />
    Register pet
  </button>
</div>

        </header>

        {notice && (
          <div className="notice success-notice">
            {notice}
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss notice"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {error && (
          <div className="notice error-notice">
            {error}
            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top">
              <span>Total registered pets</span>
              <span className="stat-icon lavender">
                <PawPrint />
              </span>
            </div>

            <strong className="stat-number">
              {pets.length}
            </strong>

            <span className="stat-foot">
              Records stored in MongoDB
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Dogs &amp; cats</span>
              <span className="stat-icon peach">
                <HeartPulse />
              </span>
            </div>

            <strong className="stat-number">
              {
                pets.filter((pet) =>
                  ["Dog", "Cat"].includes(pet.species)
                ).length
              }
            </strong>

            <span className="stat-foot">
              Your most common companions
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Vaccines due soon</span>
              <span className="stat-icon mint">
                <Syringe />
              </span>
            </div>

            <strong className="stat-number">
              {upcomingVaccinations}
            </strong>

            <span className="stat-foot">
              Due within the next 30 days
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Overdue vaccines</span>
              <span className="stat-icon rose">
                <HeartPulse />
              </span>
            </div>

            <strong className="stat-number">
              {overdueVaccinations}
            </strong>

            <span className="stat-foot">
              Past their due date
            </span>
          </article>
        </section>
        

        <section className="content-panel" style={{ marginBottom: "24px" }}>
         <div className="panel-heading">
           <div>
             <h2>Vaccination Reminders</h2>
             <p>Keep track of upcoming and overdue pet vaccinations.</p>
           </div>

           <span className="record-count">
           {pets.filter(
             (pet) =>
               getVaccinationStatus(pet) === "overdue" ||
               getVaccinationStatus(pet) === "upcoming"
            ).length}{" "}
            reminders
          </span>
        </div>

         {pets.length === 0 ? (
           <div className="empty-state">
              <Syringe size={30} />
              <p>Register a pet to start tracking vaccinations.</p>
           </div>
            ) : (
        <div className="table-responsive">
           <table className="table align-middle pet-table">
             <thead>
               <tr>
                 <th>Pet Name</th>
                 <th>Owner</th>
                 <th>Vaccination Date</th>
                 <th>Status</th>
                 <th>Profile</th>
                </tr>
             </thead>

             <tbody>
               {[...pets]
                 .sort((a, b) => {
                   if (!a.vaccinationDueDate) return 1;
                   if (!b.vaccinationDueDate) return -1;

                   return (
                   new Date(a.vaccinationDueDate) -
                   new Date(b.vaccinationDueDate)
                   );
                })
                .map((pet) => {
                  const status = getVaccinationStatus(pet);

                  const statusDetails = {
                    overdue: {
                      label: "Overdue",
                      className: "overdue",
                    },
                    upcoming: {
                      label: "Due within 30 days",
                      className: "upcoming",
                    },
                    scheduled: {
                    label: "Scheduled",
                    className: "healthy",
                    },
                    none: {
                    label: "Not scheduled",
                    className: "no-vaccine",
                    },
                }[status];

                return (
                  <tr key={pet._id}>
                    <td>
                      <strong>{pet.name}</strong>
                    </td>

                    <td>{pet.ownerName}</td>

                    <td>
                      {pet.vaccinationDueDate
                        ? new Date(
                            pet.vaccinationDueDate
                          ).toLocaleDateString()
                        : "No date set"}
                    </td>

                    <td>
                      <span
                         className={`vaccine-badge ${statusDetails.className}`}
                      >
                         {statusDetails.label}
                      </span>
                    </td>

                    <td>
                      <Link
                        to={`/pets/${pet._id}`}
                        className="primary-button"
                        style={{
                          display: "inline-flex",
                          textDecoration: "none",
                        }}
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    )}
  </section>

        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h2>Pet directory</h2>
              <p>
                Manage profiles and keep important information
                in one place.
              </p>
            </div>

            <span className="record-count">
              {filteredPets.length} records
            </span>
          </div>

          <div className="toolbar">
            <label className="search-box">
              <Search size={19} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search pet, breed or owner..."
                aria-label="Search pets"
              />
            </label>

            <select
              className="filter-select"
              value={speciesFilter}
              onChange={(event) =>
                setSpeciesFilter(event.target.value)
              }
              aria-label="Filter by species"
            >
              <option value="All">All species</option>
              <option value="Dog">Dogs</option>
              <option value="Cat">Cats</option>
              <option value="Bird">Birds</option>
              <option value="Rabbit">Rabbits</option>
              <option value="Other">Other</option>
            </select>

            {/* New vaccination status filter */}
            <select
              className="filter-select"
              value={vaccinationFilter}
              onChange={(event) =>
                setVaccinationFilter(event.target.value)
              }
              aria-label="Filter by vaccination status"
            >
              <option value="All">All vaccinations</option>
              <option value="Overdue">Overdue</option>
              <option value="DueSoon">
                Due within 30 days
              </option>
              <option value="Scheduled">
                Scheduled later
              </option>
              <option value="NotScheduled">
                No date scheduled
              </option>
            </select>

            {/* New vaccination date sorting */}
            <select
              className="filter-select"
              value={vaccinationSort}
              onChange={(event) =>
                setVaccinationSort(event.target.value)
              }
              aria-label="Sort by vaccination date"
            >
              <option value="soonest">
                Vaccination: Soonest first
              </option>
              <option value="latest">
                Vaccination: Latest first
              </option>
            </select>
          </div>

          {loading ? (
            <div className="empty-state">
              <LoaderCircle className="spin" size={30} />
              <p>Loading pet records...</p>
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">
                <PawPrint size={32} />
              </span>

              <h3>
                {pets.length === 0
                  ? "Your pet directory starts here"
                  : "No matching pets found"}
              </h3>

              <p>
                {pets.length === 0
                  ? "Register your first pet to begin building your care records."
                  : "Try another search term or change your filters."}
              </p>

              {pets.length === 0 && (
                <button
                  className="primary-button"
                  onClick={openAddForm}
                >
                  <Plus size={18} />
                  Register your first pet
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table pet-table align-middle">
                <thead>
                  <tr>
                    <th>Pet</th>
                    <th>Species / breed</th>
                    <th>Age</th>
                    <th>Owner</th>
                    <th>Vaccination</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPets.map((pet) => {
                    const due = pet.vaccinationDueDate
                      ? new Date(pet.vaccinationDueDate)
                      : null;

                    const status = getVaccinationStatus(pet);

                    return (
                      <tr key={pet._id}>
                        <td>
                          <div className="pet-cell">
                            <span className="pet-avatar">
                              {petIcon(pet.species)}
                            </span>

                            <div>
                              <strong>
                                <Link
                                  to={`/pets/${pet._id}`}
                                  style={{
                                    color: "inherit",
                                    textDecoration: "none",
                                    cursor: "pointer",
                                  }}
                                >
                                  {pet.name}
                                </Link>
                              </strong>
                              <small>
                                {pet.gender || "Unknown"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="species-name">
                            {pet.species}
                          </span>

                          <small className="breed-name">
                            {pet.breed || "Breed not specified"}
                          </small>
                        </td>

                        <td>
                          {pet.age}{" "}
                          {pet.age === 1 ? "yr" : "yrs"}
                        </td>

                        <td>
                          <div className="owner-cell">
                            <strong>{pet.ownerName}</strong>
                            <small>
                              {pet.ownerPhone ||
                                "No phone added"}
                            </small>
                          </div>
                        </td>

                        <td>
                          {due ? (
                            <span
                              className={`vaccine-badge ${
                                status === "overdue"
                                  ? "overdue"
                                  : status === "upcoming"
                                  ? "upcoming"
                                  : "healthy"
                              }`}
                            >
                              {status === "overdue"
                                ? "Overdue"
                                : status === "upcoming"
                                ? "Due soon"
                                : "Scheduled"}
                              {" Â· "}
                              {due.toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="no-vaccine">
                              Not scheduled
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="action-buttons">
                            <button
                              className="icon-button edit"
                              title="Edit pet"
                              onClick={() => openEditForm(pet)}
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              className="icon-button delete"
                              title="Delete pet"
                              onClick={() => deletePet(pet)}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="footer-note">
          <span>
            <span className="online-dot" />
            Connected to MongoDB
          </span>

          <span>SmartPaws Â· Pet care, made simpler</span>
        </footer>
      </main>

      {showForm && (
        <div
          className="modal-backdrop-custom"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <section
            className="pet-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pet-form-title"
          >
            <div className="modal-heading">
              <div>
                <span className="modal-eyebrow">
                  {editingId ? "UPDATE PROFILE" : "NEW PROFILE"}
                </span>

                <h2 id="pet-form-title">
                  {editingId
                    ? "Edit pet details"
                    : "Register a pet"}
                </h2>

                <p>
                  Enter the details below to keep the pet's
                  record up to date.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X />
              </button>
            </div>

            <form onSubmit={savePet}>
              <div className="form-grid">
                <label>
                  Pet name *
                  <input
                    required
                    maxLength={80}
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="e.g. Coco"
                  />
                </label>

                <label>
                  Species *
                  <select
                    required
                    value={form.species}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        species: event.target.value,
                      })
                    }
                  >
                    <option>Dog</option>
                    <option>Cat</option>
                    <option>Bird</option>
                    <option>Rabbit</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Breed
                  <input
                    maxLength={80}
                    value={form.breed}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        breed: event.target.value,
                      })
                    }
                    placeholder="e.g. Labrador"
                  />
                </label>

                <label>
                  Age (years) *
                  <input
                    required
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.age}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        age: event.target.value,
                      })
                    }
                    placeholder="e.g. 2"
                  />
                </label>

                <label>
                  Owner name *
                  <input
                    required
                    maxLength={100}
                    value={form.ownerName}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        ownerName: event.target.value,
                      })
                    }
                    placeholder="Owner's full name"
                  />
                </label>

                <label>
                  Owner phone
                  <input
                    type="tel"
                    maxLength={20}
                    value={form.ownerPhone}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        ownerPhone: event.target.value,
                      })
                    }
                    placeholder="Contact number"
                  />
                </label>

                <label>
                  Gender
                  <select
                    value={form.gender}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        gender: event.target.value,
                      })
                    }
                  >
                    <option>Unknown</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </label>

                <label>
                  Next vaccination date
                  <input
                    type="date"
                    value={form.vaccinationDueDate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        vaccinationDueDate: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="full-width">
                  Medical notes
                  <textarea
                    rows="3"
                    maxLength={1000}
                    value={form.medicalNotes}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        medicalNotes: event.target.value,
                      })
                    }
                    placeholder="Allergies, health notes or care instructions..."
                  />
                </label>
              </div>

              {error && (
                <p className="form-error">{error}</p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        className="spin"
                        size={18}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      {editingId
                        ? "Save changes"
                        : "Register pet"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;

