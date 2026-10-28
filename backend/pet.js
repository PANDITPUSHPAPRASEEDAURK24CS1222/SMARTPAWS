
const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Pet name is required"],
      trim: true,
    },

    species: {
      type: String,
      required: [true, "Species is required"],
      enum: ["Dog", "Cat", "Bird", "Rabbit", "Other"],
    },

    breed: {
      type: String,
      trim: true,
      default: "Unknown",
    },

    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [0, "Age cannot be negative"],
    },

    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
    },

    ownerPhone: {
      type: String,
      trim: true,
      default: "",
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Unknown"],
      default: "Unknown",
    },

    // Existing medical notes
    medicalNotes: {
      type: String,
      trim: true,
      default: "",
    },

    // Existing vaccination due date
    vaccinationDueDate: {
      type: Date,
      default: null,
    },

    // NEW: Multiple medical visits for each pet
    medicalHistory: [
      {
        visitDate: {
          type: Date,
          default: Date.now,
        },
        diagnosis: {
          type: String,
          trim: true,
          default: "",
        },
        treatment: {
          type: String,
          trim: true,
          default: "",
        },
        notes: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],

    // NEW: Multiple vaccination records for each pet
    vaccinations: [
      {
        vaccineName: {
          type: String,
          required: true,
          trim: true,
        },
        vaccinationDate: {
          type: Date,
          required: true,
        },
        nextDueDate: {
          type: Date,
          default: null,
        },
        notes: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Pet", petSchema);
