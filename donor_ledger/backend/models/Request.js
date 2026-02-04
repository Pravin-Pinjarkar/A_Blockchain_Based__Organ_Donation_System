const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    recipientId: String,
    organ: String,
    bloodType: String,
    urgency: String,
    status: {
      type: String,
      default: "Waiting",
    },
    hospital: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "recipients" }
);

// Prevent OverwriteModelError
module.exports =
  mongoose.models.Request || mongoose.model("Request", RequestSchema);
