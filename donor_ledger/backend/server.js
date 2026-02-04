const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");
const http = require("http");
// const WebSocket = require("ws");
// const { ethers } = require("ethers");
const ethers = require("ethers");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");




dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT"] }
});

// CORS Configuration
app.use(cors());
app.use(bodyParser.json());

// /* ================== WEBSOCKET SETUP ================== */
// // =============== SOCKET.IO ===============
// io.on("connection", (socket) => {
//   console.log("🟢 socket.io client connected:", socket.id);

//   socket.on("disconnect", () => {
//     console.log("🔴 socket.io client disconnected:", socket.id);
//   });
// });

// helper to broadcast updates
const broadcastUpdate = (event, payload) => {
  io.emit(event, payload);
};


/* ================== MONGODB CONNECTION ================== */
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ================== SCHEMAS ================== */

// Donor Schema
const donorSchema = new mongoose.Schema({
  donorId: { type: String, unique: true },
  name: String,
  email: { type: String, required: true },
  age: Number,
  bloodType: String,
  organ: String,
  status: { type: String, default: "Available" },
  txHash: { type: String, default: null },
  matchStatus: { type: String, default: "NotMatched" },
  date: { type: String, default: new Date().toISOString().split("T")[0] },
});
const Donor = mongoose.model("donor", donorSchema);


// Recipient Schema
const recipientSchema = new mongoose.Schema({
  recipientId: { type: String, unique: true },
  name: String,
  email: { type: String, required: true },   // 🔥 ADD THIS
  age: Number,
  bloodType: String,
  organ: String,
  urgency: {
    type: String,
    enum: ["Critical", "High", "Medium", "Low"],
  },
  waitTime: String,
  status: { type: String, default: "Waiting" },
  txHash: { type: String, default: null },
  matchStatus: { type: String, default: "NotMatched" },
});

const Recipient = mongoose.model("recipient", recipientSchema);



// Hospital Schema
const hospitalSchema = new mongoose.Schema({
  hospitalId: { type: String, unique: true },
  name: String,
  location: String,
  transplants: { type: Number, default: 0 },
  verification: { type: String, default: "Pending" },
  rating: { type: Number, default: 0 },
  date: { type: String, default: new Date().toISOString().split("T")[0] },
});
const Hospital = mongoose.model("hospital", hospitalSchema);



// User Schema
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, unique: true, required: true },
  aadhaar: { type: String, unique: true, required: true },
  accountType: { type: String, required: true },
  age: { type: Number, required: true },
  organName: { type: String, required: true },
    urgency: {
    type: String,
    enum: ["Critical", "High", "Medium", "Low"],
  },
  status: { type: String, default: null },
  bloodType: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  password: { type: String, required: true },

  // 🔥 NEW FIELD


  createdAt: { type: Date, default: Date.now },
  tempOtp: { type: String },
  otpExpires: { type: Date },
});

const User = mongoose.model("userdetails", userSchema);




// Unified Request Schema
const requestSchema = new mongoose.Schema({
  // Custom human-readable ID like "REQ-2B1882"
  requestId: { type: String, unique: true, sparse: true },

  // Optional link to a donor user (Mongo ObjectId)
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "userdetails" },

  // These are the only things we really know are always there
  recipientId: { type: String, required: true },      // e.g. "R-0008"
  organ:      { type: String, required: true },       // e.g. "Kidney"

  // These are nice-to-have but NOT always sent from frontend
  recipientName:   { type: String },                  // no 'required'
  recipientEmail:  { type: String },
  recipientPhone:  { type: String },
  

  // Blood type can be optional – UI may still show it if present
  bloodTypeRequired: { type: String },                // remove 'required'

  urgency: {
  type: String,
  enum: ["Critical", "High", "Medium", "Low"],  // now supports Critical
  // default: "Medium",
},

  recipientAge: { type: Number },
  hospitalName:    { type: String },
  hospitalAddress: { type: String },

  message: { type: String },

  requestStatus: {
    type: String,
    enum: ["Pending", "Matched", "Approved", "Accepted", "Rejected"],
    default: "Pending",
  },

  matchedDonorId:   { type: String, default: null },
  matchedDonorName: { type: String, default: null },

  txHash:      { type: String, default: null },
  blockNumber: { type: Number, default: null },

  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date, default: null },
});

// IMPORTANT: keep explicit collection name "requests"
const Request = mongoose.model("request", requestSchema, "requests");



// 📌 Blockchain Events Schema (Fix for dashboard count)
const blockchainEventSchema = new mongoose.Schema({
  donorId: String,
  recipientId: String,
  txHash: String,
  ageDonor: Number,
  ageRecipient: Number,
  bloodDonor: String,
  bloodRecipient: String,
  organ: String,
  timestamp: { type: Date, default: Date.now }
}, { collection: "blockchainevents" });   // ⬅️ your actual collection name

const BlockchainEvent = mongoose.model("blockchainevents", blockchainEventSchema);


/* ====================== SOCKET.IO CONNECTION ====================== */ 
io.on("connection", (socket) => {
  console.log("🟢 Client Connected:", socket.id);

  socket.on("disconnect", () =>
    console.log("🔴 Client Disconnected:", socket.id)
  );
});



// // helper to broadcast activity feed 🔥
// const broadcastActivity = (message) => {
//   io.emit("activity_event", {
//     message,
//     time: new Date().toLocaleTimeString(),
//   });
// };


/* ================== UTILITY FUNCTIONS ================== */

// Normalize account type
const normalizeAccountType = (type) => {
  const lower = type?.toLowerCase().trim();
  if (lower === "hospital" || lower === "hospital admin") return "hospital admin";
  if (lower === "donor") return "donor";
  if (lower === "recipient") return "recipient";
  return lower;
};

// Generate auto-incrementing ID
// Generate auto-incrementing ID (Fixed)
const generateNextId = async (Model, idField, prefix) => {
  const lastDoc = await Model.findOne({ [idField]: { $exists: true } })
    .sort({ [idField]: -1 });

  let nextId = `${prefix}-0001`;

  if (lastDoc && lastDoc[idField]) {
    const numberPart = parseInt(lastDoc[idField].split("-")[1], 10) + 1;
    nextId = `${prefix}-${String(numberPart).padStart(4, "0")}`;
  }
  return nextId;
};


/* ================== JWT AUTH MIDDLEWARE ================== */

const authenticate = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: "No token provided" });
    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* ================== AUTH ROUTES ================== */

// Sign In - Send OTP
app.post("/signin", async (req, res) => {
  try {
    const { email, password, accountType } = req.body;

    if (!email || !password || !accountType)
      return res.status(400).json({ message: "Please fill all fields" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const dbType = normalizeAccountType(user.accountType);
    const loginType = normalizeAccountType(accountType);

    if (dbType !== loginType) {
      return res.status(400).json({
        message: `Incorrect account type selected. This email belongs to a ${user.accountType}.`,
      });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.tempOtp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // Send OTP email
    const msg = {
      to: email,
      from: process.env.EMAIL_SENDER,
      subject: "YOUR LIFELINK LOGIN OTP",
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f9f9fb;padding:25px;text-align:center;">
          <div style="max-width:450px;margin:auto;background:white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);padding:30px;">
            <div style="background:linear-gradient(90deg,#6366F1,#8B5CF6);color:white;padding:12px 0;border-radius:8px 8px 0 0;">
              <h2 style="margin:0;font-size:20px;">LifeLink Secure Login</h2>
            </div>
            <div style="padding:20px 0;">
              <p style="font-size:16px;color:#333;margin-bottom:10px;">Hello 👋</p>
              <p style="font-size:15px;color:#555;margin-bottom:20px;">
                Use the following OTP to complete your sign-in process. <br />
                This code is valid for <b>1 minutes</b>.
              </p>
              <div style="font-size:34px;font-weight:bold;color:#4F46E5;letter-spacing:8px;background:#f3f4f6;display:inline-block;padding:10px 20px;border-radius:8px;">
                ${otp}
              </div>
              <p style="font-size:13px;color:#777;margin-top:20px;">
                If you didn't request this, please ignore this email.
              </p>
            </div>
            <div style="border-top:1px solid #eee;margin-top:20px;padding-top:10px;font-size:12px;color:#aaa;">
              © ${new Date().getFullYear()} LifeLink | Secure Donation Platform
            </div>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);

    res.status(200).json({
      message: "OTP sent to your email!",
      email,
      accountType: dbType,
    });
  } catch (err) {
    console.error("SignIn error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Verify OTP
app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.tempOtp || !user.otpExpires)
      return res.status(400).json({ message: "OTP not generated" });

    if (Date.now() > user.otpExpires)
      return res.status(400).json({ message: "OTP expired" });

    if (user.tempOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    user.tempOtp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const normalizedType = normalizeAccountType(user.accountType);

    const token = jwt.sign(
      { userId: user._id, accountType: normalizedType },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      fullName: user.fullName,
      email: user.email,
      accountType: normalizedType,
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Forgot Password
app.post("/forgot-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found with that email" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect" });

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword)
      return res.status(400).json({
        message: "New password must be different from old password",
      });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

//SignUp page backend
// ---------------- SIGNUP (FIXED) ----------------
app.post("/signup", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      aadhaar,
      accountType,
      age,
      organName,
      bloodType,
      dateOfBirth,
      password,
      status  // 👈 must come from frontend (Critical / High / Medium)
    } = req.body;

    if (accountType.toLowerCase() !== "hospital" && !/^\d{12}$/.test(aadhaar))
      return res.status(400).json({ message: "Invalid Aadhaar number" });

    if (!/^\d{10}$/.test(phone))
      return res.status(400).json({ message: "Invalid phone number" });

    if (!age || isNaN(age) || age <= 0)
      return res.status(400).json({ message: "Age must be a positive number" });

    // Unique validation
    if (await User.findOne({ aadhaar }))
      return res.status(400).json({ message: "Aadhaar already registered" });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already registered" });
    if (await User.findOne({ phone }))
      return res.status(400).json({ message: "Phone already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
  fullName,
  email,
  phone,
  aadhaar,
  accountType,
  age,
  organName,
  bloodType,
  dateOfBirth,
  password: hashedPassword,
  status: accountType.toLowerCase() === "recipient" ? "Waiting" : null,
  urgency: status   // 🔥 FIXED
});


    await newUser.save();

    /* =====================================
     * AUTO-CREATE DONOR (IF ACCOUNT TYPE = DONOR)
     * ===================================== */
    if (accountType.toLowerCase() === "donor") {
      const nextId = await generateNextId(Donor, "donorId", "D");
      const newDonor = new Donor({
        donorId: nextId,
        name: fullName,
        age,
        bloodType,
        organ: organName,
        email // 👈 add donor email
      });

      await newDonor.save();
      broadcastUpdate("donor_created", newDonor);
    }

   
 /* =====================================
 * AUTO-CREATE RECIPIENT + REQUEST (FINAL)
 * ===================================== */
if (accountType.toLowerCase() === "recipient") {
  const nextId = await generateNextId(Recipient, "recipientId", "R");

//   const urgencyValue = urgency ;
//  // 🔥 pick from signup

  // Save to Recipient collection
  const newRecipient = new Recipient({
  recipientId: nextId,
  name: fullName,
  email,               // 🔥 store email in recipient collection
  age,
  bloodType,
  organ: organName,
  urgency: status,
  status: "Waiting",
});



  await newRecipient.save();
  broadcastUpdate("recipient_created", newRecipient);

  // Save to Requests collection
  const newRequest = new Request({
    requestId: "REQ-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    recipientId: nextId,
    recipientName: fullName,
    recipientEmail: email,
    recipientPhone: phone,
    organ: organName,
    bloodTypeRequired: bloodType,
    urgency: status,    // 🔥 save urgencyLevel in request
    recipientAge: age,
    requestStatus: "Pending",
  });

  await newRequest.save();
  broadcastUpdate("request_created", newRequest);
}


    return res.status(201).json({ message: "Account created successfully!" });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ message: "Error creating user", error: err.message });
  }
});


// Get user details by email
app.get("/api/userdetails/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email }).select("-password -tempOtp -otpExpires");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const normalizedType = normalizeAccountType(user.accountType);
    
    // Capitalize for display
    let displayRole = normalizedType
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    res.status(200).json({
      email: user.email,
      fullName: user.fullName,
      accountType: displayRole,
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ================== DONOR ROUTES ================== */

app.get("/donors", async (req, res) => {
  try {
    const donors = await Donor.find().sort({ donorId: 1 });
    res.json(donors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/donors", async (req, res) => {
  try {
    const nextId = await generateNextId(Donor, "D");
    const newDonor = new Donor({ donorId: nextId, ...req.body });
    await newDonor.save();
    broadcastUpdate("donor_created", newDonor);
    res.json(newDonor);
  } catch (err) {
    res.status(400).json({ message: "❌ Error adding donor" });
  }
});

app.put("/donors/:id", async (req, res) => {
  try {
    const updatedDonor = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    broadcastUpdate("donor_updated", updatedDonor);
    res.json(updatedDonor);
  } catch (err) {
    res.status(400).json({ message: "❌ Error updating donor" });
  }
});

app.delete("/donors/:id", async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    // Delete donor from donor collection
    await Donor.findByIdAndDelete(req.params.id);

    // Also delete from userdetails
    await User.findOneAndDelete({ fullName: donor.name });

    broadcastUpdate("donor_deleted", { id: req.params.id });
    res.json({ message: "Donor + Userdetails deleted successfully" });

  } catch (err) {
    console.error("❌ Donor delete error:", err);
    res.status(400).json({ message: "Error deleting donor" });
  }
});


/* ================== RECIPIENT ROUTES ================== */

app.get("/recipients", async (req, res) => {
  try {
    const recipients = await Recipient.find().sort({ recipientId: 1 });
    res.json(recipients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/recipients", async (req, res) => {
  try {
    const nextId = await generateNextId(Recipient, "R");
    const newRecipient = new Recipient({ recipientId: nextId, ...req.body });
    await newRecipient.save();
    broadcastUpdate("recipient_created", newRecipient);
    res.json(newRecipient);
  } catch (err) {
    res.status(400).json({ message: "❌ Error adding recipient" });
  }
});

app.put("/recipients/:id", async (req, res) => {
  try {
    const updatedRecipient = await Recipient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    broadcastUpdate("recipient_updated", updatedRecipient);
    res.json(updatedRecipient);
  } catch (err) {
    res.status(400).json({ message: "❌ Error updating recipient" });
  }
});

app.delete("/recipients/:id", async (req, res) => {
  try {
    const recipient = await Recipient.findById(req.params.id);
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });

    const email = recipient.email; // 👈 email exists now

    // 1️⃣ delete recipient
    await Recipient.findByIdAndDelete(req.params.id);

    // 2️⃣ delete userdetails
    if (email) {
      await User.findOneAndDelete({ email });
    }

    // 3️⃣ delete linked request(s)
    await Request.deleteMany({ recipientId: recipient.recipientId });

    broadcastUpdate("recipient_deleted", { id: req.params.id });
    res.json({ message: "Recipient + Userdetails + Requests deleted successfully" });

  } catch (err) {
    console.error("❌ Recipient delete error:", err);
    res.status(400).json({ message: "Error deleting recipient" });
  }
});



/* ================== HOSPITAL ROUTES ================== */

app.get("/hospitals", async (req, res) => {
  try {
    const hospitals = await Hospital.find().sort({ hospitalId: 1 });
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/hospitals", async (req, res) => {
  try {
    const nextId = await generateNextId(Hospital, "hospitalId", "H");
    const newHospital = new Hospital({
      hospitalId: nextId,
      name: req.body.name,
      location: req.body.location,
      transplants: Number(req.body.transplants),
      verification: req.body.verification || "Pending",
      rating: Number(req.body.rating),
    });

    await newHospital.save();
    broadcastUpdate("hospital_created", newHospital);
    res.json(newHospital);
  } catch (err) {
    res.status(400).json({ message: "❌ Error adding hospital" });
  }
});

app.put("/hospitals/:id", async (req, res) => {
  try {
    const updatedHospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        transplants: Number(req.body.transplants),
        rating: Number(req.body.rating),
      },
      { new: true }
    );
    broadcastUpdate("hospital_updated", updatedHospital);
    res.json(updatedHospital);
  } catch (err) {
    res.status(400).json({ message: "❌ Error updating hospital" });
  }
});

app.delete("/hospitals/:id", async (req, res) => {
  try {
    await Hospital.findByIdAndDelete(req.params.id);
    broadcastUpdate("hospital_deleted", { id: req.params.id });
    res.json({ message: "Hospital deleted" });
  } catch (err) {
    res.status(400).json({ message: "❌ Error deleting hospital" });
  }
});

// =============== REQUESTS ===============

// Create request(s)
app.post(["/requests", "/api/requests"], async (req, res) => {
  try {
    if (!req.body.requestId) {
  req.body.requestId = "REQ-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

    const newRequest = new Request(req.body);
    await newRequest.save();
    broadcastUpdate("request_created", newRequest);
    res.status(201).json(newRequest);
  } catch (err) {
    console.error("Add request error:", err);
    res.status(400).json({ message: "Error adding request", error: err.message });
  }
});

// Update request (generic)
app.put(["/requests/:id", "/api/requests/:id"], async (req, res) => {
  try {
    const updated = await Request.findByIdAndUpdate(req.params.id, req.body, { new: true });
    broadcastUpdate("request_updated", updated);
    res.json(updated);
  } catch (err) { res.status(400).json({ message: "Error updating request", error: err.message }); }
});

// Update hospital for a request (by request _id)
app.put("/api/update-hospital/:id", async (req, res) => {
  try {
    const reqId = req.params.id;
    const { hospitalName, hospitalAddress } = req.body;

    if (!hospitalName)
      return res.status(400).json({ success: false, message: "Hospital name required" });

    const updatedRequest = await Request.findByIdAndUpdate(
      reqId,
      { hospitalName, hospitalAddress: hospitalAddress || "", requestStatus: "Matched" },
      { new: true }
    );

    if (!updatedRequest)
      return res.status(404).json({ success: false, message: "Request not found" });

    broadcastUpdate("hospitalAssigned", updatedRequest);
    res.json({ success: true, message: "Hospital assigned successfully", data: updatedRequest });
  } catch (err) {
    console.error("Update-hospital error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});


// Get all requests (enriched if needed)
app.get("/api/requests", async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 }).lean();
    const recipients = await Recipient.find().lean();

    const enriched = requests.map(r => {
      const rec = recipients.find(rc => rc.recipientId === r.recipientId);
      return {
        ...r,
        recipientAge: r.recipientAge ?? rec?.age ?? null,
        bloodTypeRequired: r.bloodTypeRequired || rec?.bloodType,
        recipientName: r.recipientName || rec?.name || "",
        recipientEmail: r.recipientEmail || "",
        hospital: r.hospitalName || ""
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch requests", error: err.message });
  }
});


// Delete request
app.delete(["/requests/:id", "/api/requests/:id"], async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    broadcastUpdate("request_deleted", { id: req.params.id });
    res.json({ message: "Request deleted" });
  } catch (err) { res.status(400).json({ message: "Error deleting request", error: err.message }); }
});

// =============== UTILITIES ===============
app.get("/health", (req, res) => res.json({ status: "OK" }));

app.get("/api/status", (req, res) => {
  res.json({
    status: "✅ API is running",
    websocket: io.engine.clientsCount + " clients connected",
    blockchain: contractInstance ? "✅ Connected" : "❌ Not connected",
    timestamp: new Date().toISOString(),
  });
});



app.get("/api/endpoints", (req, res) => {
  res.json({
    recipients: [ "GET /recipients", "POST /recipients", "PUT /recipients/:id" ],
    requests: [ "GET /api/requests", "POST /api/requests", "PUT /api/requests/:id", "PUT /api/update-hospital/:id" ],
    hospitals: [ "GET /hospitals", "POST /hospitals", "PUT /hospitals/:id" ],
    auth: [ "POST /signin", "POST /verify-otp", "POST /signup" ]
  });
});


/* ================== UTILITY ENDPOINTS ================== */

app.get("/health", (req, res) => {
  res.json({ status: "✅ Server is running" });
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "✅ API is running",
    websocket: clients.size + " clients connected",
    blockchain: contractInstance ? "✅ Connected" : "❌ Not connected",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/endpoints", (req, res) => {
  res.json({
    auth: [
      "POST /signin",
      "POST /verify-otp",
      "POST /forgot-password",
      "POST /signup",
      "GET /api/userdetails/:email"
    ],
    donors: ["GET /donors", "POST /donors", "PUT /donors/:id", "DELETE /donors/:id"],
    recipients: ["GET /recipients", "POST /recipients", "PUT /recipients/:id", "DELETE /recipients/:id"],
    hospitals: ["GET /hospitals", "POST /hospitals", "PUT /hospitals/:id", "DELETE /hospitals/:id"],
    requests: [
      "GET /requests | /api/requests",
      "POST /requests | /api/requests",
      "PUT /requests/:id | /api/requests/:id",
      "DELETE /requests/:id | /api/requests/:id"
    ],
    blockchain: [
      "POST /api/match/run",
      "POST /api/match/approve",
      "GET /api/match/status/:txHash"
    ],
    utility: ["GET /health", "GET /api/status", "GET /api/endpoints"],
  });
});


/* ================== BLOCKCHAIN INITIALIZATION ================== */

let provider, wallet, contractInstance;

const initBlockchain = async () => {
  try {
    if (!process.env.SEPOLIA_RPC_URL || !process.env.PRIVATE_KEY || !process.env.CONTRACT_ADDRESS) {
      console.warn("⚠ Blockchain env variables missing — running without blockchain");
      return;
    }

    provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const abiPath = path.join(
      __dirname,
      "artifacts",
      "contracts",
      "OrganRegistry.sol",
      "OrganRegistry.json"
    );
    const abiFile = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    const contractABI = abiFile.abi;

    contractInstance = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);
    console.log("🔗 Blockchain connected:", process.env.CONTRACT_ADDRESS);
  } catch (err) {
    console.error("❌ Blockchain init error:", err);
  }
};
initBlockchain();

/* ================== MATCHING LOGIC (FCFS + AGE VALIDATION) ================== */

// Age rule: ✔ allowed if |recipientAge - donorAge| ≤ 15
const validateAgeGap = (donorAge, recipientAge) => {
  if (!donorAge || !recipientAge) return true; // allow if unknown
  return Math.abs(donorAge - recipientAge) <= 15;
};


// app.get("*", (req, res) => {
//   res.sendFile(path.join(frontendPath, "index.html"));
// });

// Get donor by donorId (example: D-0010)
app.get("/api/donors/:donorId", async (req, res) => {
  try {
    const donor = await Donor.findOne(
      { donorId: req.params.donorId },
      { _id: 0, donorId: 1, age: 1, bloodType: 1, organ: 1 }
    );
    if (!donor) return res.status(404).json({});
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Get recipient by recipientId (example: R-0015)
app.get("/api/recipients/:recipientId", async (req, res) => {
  try {
    const rec = await Recipient.findOne(
      { recipientId: req.params.recipientId },
      { _id: 0, recipientId: 1, age: 1, bloodType: 1, organ: 1 }
    );
    if (!rec) return res.status(404).json({});
    res.json(rec);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


//Matching Logic

app.post("/api/match/approve", async (req, res) => {
  try {
    const { requestId, donorBlockchainId } = req.body;


    if (!requestId || !donorBlockchainId)
      return res.status(400).json({ message: "requestId & donorBlockchainId required" });

    const request = await Request.findById(requestId) || await Request.findOne({ requestId });
    const recipient = await Recipient.findOne({ recipientId: request.recipientId });
    const donor = await Donor.findOne({ donorId: donorBlockchainId });

    if (!donor || !recipient)
      return res.status(404).json({ message: "Donor or Recipient not found" });

    /* -------------------- Write on Blockchain (if enabled) -------------------- */
    let txHash = null;
    if (contractInstance) {
      const tx = await contractInstance.recordMatch(
        donorBlockchainId,
        recipient.recipientId,
        ""
      );
      const receipt = await tx.wait();
      txHash = receipt.hash;
    }

    /* -------------------- Update database after approve -------------------- */
    donor.status = "Donated";
    donor.matchStatus = "Matched";
    donor.txHash = txHash;
    await donor.save();

    request.requestStatus = "Approved";
    request.matchedDonorId = donorBlockchainId;
    request.matchedDonorName = donor.name;
    request.txHash = txHash;
    await request.save();

    recipient.status = "Matched";
    recipient.matchStatus = "Matched";
    recipient.txHash = txHash;
    await recipient.save();


    //new blockevent

    
    await new BlockchainEvent({
      donorId: donor.donorId, recipientId: recipient.recipientId,
      txHash, ageDonor: donor.age, ageRecipient: recipient.age,
      bloodDonor: donor.bloodType, bloodRecipient: recipient.bloodType,
      organ: donor.organ
    }).save();

    // broadcastActivity(`🔗 Blockchain Match | Donor ${donor.donorId} → Recipient ${recipient.recipientId}`);
    // broadcastUpdate("match_approved", { donor: donor.donorId, recipient: recipient.recipientId });

    // await Request.findByIdAndDelete(requestId);
    // broadcastUpdate("request_deleted", requestId);



    /* -------------------- SEND EMAIL NOTIFICATIONS -------------------- */
    let donorEmailSent = false;
    let recipientEmailSent = false;

    try {
      const donorUser = await User.findOne({ email: donor.email });
      const recipientUser = await User.findOne({ email: request.recipientEmail });

      
      // Email to Donor
        if (donor.email) {
          await sgMail.send({
            to: donor.email,
            from: process.env.EMAIL_SENDER,
            subject: "🎉 Organ Donation Match Found!",
            html: `
              <h2>Congratulations ${donor.name}!</h2>
              <p>A recipient has been successfully matched to your donated organ.</p>
              <p>Please log in to the LifeLink portal for next steps.</p>
            `,
          });
          donorEmailSent = true;
        }


      // Email to Recipient
      if (recipientUser?.email) {
        await sgMail.send({
          to: recipientUser.email,
          from: process.env.EMAIL_SENDER,
          subject: "🎉 Organ Donor Match Found!",
          html: `
            <h2>Congratulations ${recipientUser.fullName}!</h2>
            <p>A matching donor has been found for your requested organ.</p>
            <p>Please log in to the LifeLink portal for more details.</p>
          `,
        });
        recipientEmailSent = true;
      }

    } catch (emailErr) {
      console.error("❌ EMAIL NOTIFICATION ERROR:", emailErr);
    }

    /* -------------------- WebSocket feedback -------------------- */
    broadcastUpdate("match_approved", {
      requestId,
      donorId: donorBlockchainId,
      patientId: recipient.recipientId,
      txHash
    });


    /* -------------------- ACTIVITY FEED (NEW) -------------------- */
// broadcastActivity(`💚 Match Approved: Donor ${donorBlockchainId} → Recipient ${recipient.recipientId}`);

    /* -------------------- RESPONSE to Frontend -------------------- */
    return res.json({
      success: true,
      message: "Match approved & notifications sent",
      txHash,
      donorEmailSent,
      recipientEmailSent
    });

  } catch (err) {
    console.error("❌ APPROVE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
});


/* ------------------ OVERVIEW STATS ------------------ */
app.get("/api/overview-stats", async (req, res) => {
  try {
    res.json({
      totalDonors: await Donor.countDocuments(),
      totalRecipients: await Recipient.countDocuments(),
      totalHospitals: await Hospital.countDocuments(),
      successfulMatches: await Request.countDocuments({ requestStatus: "Approved" }),
      pendingRequests: await Request.countDocuments({ requestStatus: "Pending" }),
      blockchainTx: await BlockchainEvent.countDocuments()   // 🔥 CORRECT
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* ================== CHECK MATCH STATUS (TX HASH) ================== */

app.get("/api/match/status/:txHash", async (req, res) => {
  try {
    if (!provider) return res.status(500).json({ message: "Blockchain not active" });

    const receipt = await provider.getTransactionReceipt(req.params.txHash);
    if (!receipt) return res.status(404).json({ message: "Transaction not found" });

    res.json({
      status: receipt.status === 1 ? "Success" : "Failed",
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    });

  } catch (err) {
    console.error("❌ Status check error:", err);
    res.status(500).json({ message: err.message });
  }
});



// //Overview Dynamic Working
// app.get("/api/overview-stats", async (req, res) => {
//   try {
//     const totalDonors = await Donor.countDocuments();
//     const totalRecipients = await Recipient.countDocuments();
//     const totalHospitals = await Hospital.countDocuments();

//     const successfulMatches = await Request.countDocuments({ requestStatus: "Approved" });
//     const pendingRequests = await Request.countDocuments({ requestStatus: "Pending" });

//     // Count blockchain transactions (all requests having txHash)
//     const blockchainTx = await BlockchainEvent.countDocuments();

//     return res.json({
//       totalDonors,
//       totalRecipients,
//       totalHospitals,
//       successfulMatches,
//       pendingRequests,
//       blockchainTx
//     });

//   } catch (err) {
//     console.error("❌ Overview stats error:", err);
//     return res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// const broadcastActivity = (message) => {
//   io.emit("activity_event", {
//     message,
//     time: new Date().toLocaleTimeString(),
//   });
// };


/* ================== START SERVER ================== */

const PORT = process.env.PORT || 5000;

// Serve React Frontend (if built)
const frontendPath = path.join(__dirname, "..", "build");
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));

  // Serve index.html for any frontend route not handled by API
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  console.warn("⚠ React build folder not found. API-only mode.");
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`✓ WebSocket ready for real-time updates`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ API endpoints: http://localhost:${PORT}/api/endpoints`);
  console.log(`✓ Connected clients: ${io.engine.clientsCount}`);

  if (contractInstance) {
    console.log(`✓ Blockchain connected: ${process.env.CONTRACT_ADDRESS}`);
  }
});