
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const Pet = require("./pet");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Home route: check whether the API is running
app.get("/", (req, res) => {
  res.json({
    message: "SmartPaws API is running",
    status: "success",
  });
});

// CREATE: Register a new pet
app.post("/api/pets", async (req, res) => {
  try {
    const pet = await Pet.create(req.body);

    res.status(201).json({
      message: "Pet registered successfully",
      pet,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// READ: Get all pets, with optional search

 // READ: Get all pets, with optional search
app.get("/api/pets", async (req, res) => {
  try {
    const { search, species } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const searchTerm = search.trim();

      const searchConditions = [
        { name: { $regex: searchTerm, $options: "i" } },
        { ownerName: { $regex: searchTerm, $options: "i" } },
        { breed: { $regex: searchTerm, $options: "i" } },
      ];

      // Search by MongoDB Pet ID when a valid ID is entered
      if (/^[0-9a-fA-F]{24}$/.test(searchTerm)) {
        searchConditions.push({ _id: searchTerm });
      }

      filter.$or = searchConditions;
    }

    if (species) {
      filter.species = species;
    }

    const pets = await Pet.find(filter).sort({ createdAt: -1 });

    res.json({
      count: pets.length,
      pets,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// READ: Get one pet by its MongoDB ID
app.get("/api/pets/:id", async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        message: "Pet not found",
      });
    }

    res.json({ pet });
  } catch (error) {
    res.status(400).json({
      message: "Invalid pet ID",
    });
  }
});

// UPDATE: Edit a pet
app.put("/api/pets/:id", async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!pet) {
      return res.status(404).json({
        message: "Pet not found",
      });
    }

    res.json({
      message: "Pet updated successfully",
      pet,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// DELETE: Remove a pet
app.delete("/api/pets/:id", async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);

    if (!pet) {
      return res.status(404).json({
        message: "Pet not found",
      });
    }

    res.json({
      message: "Pet deleted successfully",
      pet,
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid pet ID",
    });
  }
});

/* MEDICAL RECORDS: Add a medical visit */
app.post("/api/pets/:id/medical", async (req, res) => {
  try {
    const { visitDate, diagnosis, treatment, notes } = req.body;

    if (!diagnosis || !diagnosis.trim()) {
      return res.status(400).json({
        message: "Diagnosis is required",
      });
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        message: "Pet not found",
      });
    }

    pet.medicalHistory.push({
      visitDate: visitDate || Date.now(),
      diagnosis,
      treatment: treatment || "",
      notes: notes || "",
    });

    await pet.save();

    res.status(201).json({
      message: "Medical record added successfully",
      pet,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

/* MEDICAL RECORDS: Delete a medical visit */
app.delete(
  "/api/pets/:id/medical/:recordId",
  async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);

      if (!pet) {
        return res.status(404).json({
          message: "Pet not found",
        });
      }

      const record = pet.medicalHistory.id(
        req.params.recordId
      );

      if (!record) {
        return res.status(404).json({
          message: "Medical record not found",
        });
      }

      record.deleteOne();
      await pet.save();

      res.json({
        message: "Medical record deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

/* MEDICAL RECORDS: Update an existing medical visit */
app.put("/api/pets/:id/medical/:recordId", async (req, res) => {
  try {
    const { visitDate, diagnosis, treatment, notes } = req.body;

    if (!diagnosis || !diagnosis.trim()) {
      return res.status(400).json({
        message: "Diagnosis is required",
      });
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        message: "Pet not found",
      });
    }

    const record = pet.medicalHistory.id(req.params.recordId);

    if (!record) {
      return res.status(404).json({
        message: "Medical record not found",
      });
    }

    record.visitDate = visitDate || record.visitDate;
    record.diagnosis = diagnosis.trim();
    record.treatment = treatment || "";
    record.notes = notes || "";

    await pet.save();

    res.json({
      message: "Medical record updated successfully",
      pet,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});


/* VACCINATIONS: Add a vaccination record */
app.post(
  "/api/pets/:id/vaccinations",
  async (req, res) => {
    try {
      const {
        vaccineName,
        vaccinationDate,
        nextDueDate,
        notes,
      } = req.body;

      if (!vaccineName || !vaccineName.trim()) {
        return res.status(400).json({
          message: "Vaccine name is required",
        });
      }

      if (!vaccinationDate) {
        return res.status(400).json({
          message: "Vaccination date is required",
        });
      }

      const pet = await Pet.findById(req.params.id);

      if (!pet) {
        return res.status(404).json({
          message: "Pet not found",
        });
      }

      pet.vaccinations.push({
        vaccineName,
        vaccinationDate,
        nextDueDate: nextDueDate || null,
        notes: notes || "",
      });

      await pet.save();

      res.status(201).json({
        message: "Vaccination added successfully",
        pet,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

/* VACCINATIONS: Delete a vaccination record */
app.delete(
  "/api/pets/:id/vaccinations/:recordId",
  async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);

      if (!pet) {
        return res.status(404).json({
          message: "Pet not found",
        });
      }

      const record = pet.vaccinations.id(
        req.params.recordId
      );

      if (!record) {
        return res.status(404).json({
          message: "Vaccination record not found",
        });
      }

      record.deleteOne();
      await pet.save();

      res.json({
        message: "Vaccination record deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

/* VACCINATIONS: Update an existing vaccination record */
app.put(
  "/api/pets/:id/vaccinations/:recordId",
  async (req, res) => {
    try {
      const {
        vaccineName,
        vaccinationDate,
        nextDueDate,
        notes,
      } = req.body;

      if (!vaccineName || !vaccineName.trim()) {
        return res.status(400).json({
          message: "Vaccine name is required",
        });
      }

      if (!vaccinationDate) {
        return res.status(400).json({
          message: "Vaccination date is required",
        });
      }

      const pet = await Pet.findById(req.params.id);

      if (!pet) {
        return res.status(404).json({
          message: "Pet not found",
        });
      }

      const record = pet.vaccinations.id(req.params.recordId);

      if (!record) {
        return res.status(404).json({
          message: "Vaccination record not found",
        });
      }

      record.vaccineName = vaccineName.trim();
      record.vaccinationDate = vaccinationDate;
      record.nextDueDate = nextDueDate || null;
      record.notes = notes || "";

      await pet.save();

      res.json({
        message: "Vaccination record updated successfully",
        pet,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);


// Connect to MongoDB before starting the server
async function startServer() {
  try {
    await connectDB();

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(
        `SmartPaws API running on http://localhost:${port}`
      );
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
}

startServer();
