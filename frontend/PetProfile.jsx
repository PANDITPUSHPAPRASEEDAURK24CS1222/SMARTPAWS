
import { useEffect, useState } from "react";
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
} from "lucide-react";

const API_URL = "http://localhost:5000/api/pets";

function PetProfile() {
  const { id } = useParams();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPet() {
      try {
        const response = await fetch(`${API_URL}/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load pet profile.");
        }

        setPet(data.pet);
      } catch (err) {
        setError(err.message || "Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    loadPet();
  }, [id]);

  if (loading) {
    return (
      <div className="empty-state">
        <LoaderCircle className="spin" size={30} />
        <p>Loading pet profile...</p>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="content-panel" style={{ padding: "32px" }}>
        <h2>Unable to display pet profile</h2>
        <p>{error || "Pet not found."}</p>
        <Link to="/" className="primary-button">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const vaccinationDate = pet.vaccinationDueDate
    ? new Date(pet.vaccinationDueDate).toLocaleDateString()
    : "Not scheduled";

  return (
    <main className="main-content">
      <Link
        to="/"
        className="primary-button"
        style={{
          display: "inline-flex",
          textDecoration: "none",
          marginBottom: "24px",
        }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>

      <header className="topbar">
        <div>
          <div className="breadcrumb">Workspace / Pet Profile</div>
          <h1>{pet.name}</h1>
          <p className="subtitle">
            Complete information and care details for your pet.
          </p>
        </div>

        <span className="pet-avatar">
          <PawPrint size={28} />
        </span>
      </header>

      <section className="content-panel" style={{ padding: "28px" }}>
        <h2>Pet Information</h2>

        <div className="form-grid" style={{ marginTop: "20px" }}>
          <div>
            <strong><PawPrint size={17} /> Pet Name</strong>
            <p>{pet.name}</p>
          </div>

          <div>
            <strong>Species</strong>
            <p>{pet.species}</p>
          </div>

          <div>
            <strong>Breed</strong>
            <p>{pet.breed || "Not specified"}</p>
          </div>

          <div>
            <strong>Age</strong>
            <p>{pet.age} {pet.age === 1 ? "year" : "years"}</p>
          </div>

          <div>
            <strong>Gender</strong>
            <p>{pet.gender || "Unknown"}</p>
          </div>
        </div>
      </section>

      <section className="content-panel" style={{ padding: "28px", marginTop: "20px" }}>
        <h2><UserRound size={21} /> Owner Information</h2>

        <div className="form-grid" style={{ marginTop: "20px" }}>
          <div>
            <strong>Owner Name</strong>
            <p>{pet.ownerName}</p>
          </div>

          <div>
            <strong><Phone size={17} /> Contact Number</strong>
            <p>{pet.ownerPhone || "Not provided"}</p>
          </div>
        </div>
      </section>

      <section className="content-panel" style={{ padding: "28px", marginTop: "20px" }}>
        <h2><HeartPulse size={21} /> Health and Vaccination</h2>

        <div style={{ marginTop: "20px" }}>
          <strong><Syringe size={17} /> Next Vaccination</strong>
          <p>{vaccinationDate}</p>
        </div>

        <div style={{ marginTop: "20px" }}>
          <strong>Medical Notes</strong>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {pet.medicalNotes || "No medical notes added."}
          </p>
        </div>

        <div style={{ marginTop: "20px" }}>
          <strong><CalendarDays size={17} /> Record Created</strong>
          <p>
            {pet.createdAt
              ? new Date(pet.createdAt).toLocaleDateString()
              : "Not available"}
          </p>
        </div>
      </section>
    </main>
  );
}

export default PetProfile;
