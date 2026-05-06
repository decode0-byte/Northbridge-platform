require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const rateLimit = require("express-rate-limit");

const app = express();
cloudinary.config({

    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

    api_key: process.env.CLOUDINARY_API_KEY,

    api_secret: process.env.CLOUDINARY_API_SECRET
});
app.use(helmet());
const loginLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 5,

    message:
        "Too many login attempts. Try again later."
});

const applyLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 10,

    message:
        "Too many applications submitted. Try again later."
});

app.use(session({

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {

        secure: true,

        httpOnly: true,

        sameSite: "lax"
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.use(express.static("public"));

app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS
    }
});

function isAdmin(req, res, next) {

    if (!req.session.admin) {
        return res.status(401).send("Unauthorized");
    }

    next();
}

const applicantSchema = new mongoose.Schema({
    name: String,
    email: String,
    cv: String,
    job: String,

    status: {
        type: String,
        default: "Pending"
    },

     notes: {
    type: String,
    default: ""
},

interviewDate: {
    type: String,
    default: ""
}

});

const Applicant = mongoose.model("Applicant", applicantSchema);
const adminSchema = new mongoose.Schema({
    username: String,
    password: String
});

const Admin = mongoose.model("Admin", adminSchema);
async function createAdmin() {

    await Admin.deleteMany({});

    const hashedPassword =
        await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            10
        );

    const admin = new Admin({

        username:
            process.env.ADMIN_USERNAME,

        password:
            hashedPassword
    });

    await admin.save();

    console.log("Fresh admin created");
}

createAdmin();

const storage = new CloudinaryStorage({

    cloudinary: cloudinary,

    params: {

        folder: "northbridge-cvs",

        allowed_formats: [
            "pdf",
            "doc",
            "docx"
        ]
    }
});

const upload = multer({
    storage: storage
});

app.post("/apply", applyLimiter, upload.single("cv"), async (req, res) => {

    const applicant = {
        name: req.body.name,
        email: req.body.email,
        cv: req.file.path,
        job: req.body.job
    };

    const newApplicant = new Applicant(applicant);

    await newApplicant.save();

    await transporter.sendMail({

    from: "keenes656@gmail.com",

    to: req.body.email,

    subject: "Application Received",

html: `

<div style="
    font-family: Arial;
    max-width: 600px;
    margin: auto;
    padding: 30px;
    background: #f4f4f4;
">

    <div style="
        background: white;
        padding: 40px;
        border-radius: 15px;
    ">

        <h1 style="
            color: #222;
            text-align: center;
        ">
            Northbridge Solutions
        </h1>

        <hr>

        <h2>
            Application Received
        </h2>

        <p>
            Hello ${req.body.name},
        </p>

        <p>
            Thank you for applying for the
            <strong>${req.body.job}</strong>
            position at Blink Careers.
        </p>

        <p>
            Our recruitment team has successfully
            received your application and CV.
        </p>

        <p>
            Your application is currently under review.
            If shortlisted, you will be contacted
            for the next stage of the hiring process.
        </p>

        <div style="
            background: #f9f9f9;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        ">

            <h3>Application Details</h3>

            <p>
                <strong>Name:</strong>
                ${req.body.name}
            </p>

            <p>
                <strong>Email:</strong>
                ${req.body.email}
            </p>

            <p>
                <strong>Position:</strong>
                ${req.body.job}
            </p>

            <p>
                <strong>Status:</strong>
                Pending Review
            </p>

        </div>

        <p style="
            margin-top: 30px;
        ">
            We appreciate your interest in joining
            Northbridge Solutions and wish you success
            throughout the recruitment process.
        </p>

        <p>
            Best regards,
            <br>
            Northbridge Solutions Recruitment Team
        </p>

    </div>

</div>

`

});

    res.send("Application received!");
});

app.get("/applicants", isAdmin, async (req, res) => {

    const applicants = await Applicant.find();

    res.json(applicants);
});

app.delete("/applicants/:id", isAdmin, async (req, res) => {

    await Applicant.findByIdAndDelete(req.params.id);

    res.send("Applicant deleted");
});

app.put("/applicants/:id", isAdmin, async (req, res) => {

    const applicant =
        await Applicant.findByIdAndUpdate(

            req.params.id,

            {
                status: req.body.status
            },

            {
                new: true
            }
        );

    await transporter.sendMail({

        from: "keenes656@gmail.com",

        to: applicant.email,

        subject: "Application Status Updated",

        html: `

        <div style="
            font-family: Arial;
            max-width: 600px;
            margin: auto;
            padding: 30px;
            background: #f4f4f4;
        ">

            <div style="
                background: white;
                padding: 40px;
                border-radius: 15px;
            ">

                <h1>Northbridge Solutions</h1>

                <hr>

                <h2>
                    Application Status Update
                </h2>

                <p>
                    Hello ${applicant.name},
                </p>

                <p>
                    Your application for the
                    <strong>${applicant.job}</strong>
                    role has been updated.
                </p>

                <div style="
                    background: #f9f9f9;
                    padding: 20px;
                    border-radius: 10px;
                    margin-top: 20px;
                ">

                    <h3>
                        Current Status:
                    </h3>

                    <p style="
                        font-size: 22px;
                        font-weight: bold;
                    ">
                        ${applicant.status}
                    </p>

                </div>

                <p style="
                    margin-top: 25px;
                ">
                    Thank you for your interest
                    in Northbridge Solutions.
                </p>

            </div>

        </div>

        `
    });

    res.send("Status updated");
});

app.put("/notes/:id", isAdmin, async (req, res) => {

    await Applicant.findByIdAndUpdate(

        req.params.id,

        {
            notes: req.body.notes
        }
    );

    res.send("Notes saved");
});

app.put("/interview/:id", isAdmin, async (req, res) => {

    const applicant =
        await Applicant.findByIdAndUpdate(

            req.params.id,

            {
                interviewDate:
                    req.body.interviewDate
            },

            {
                new: true
            }
        );

    await transporter.sendMail({

        from: "keenes656@gmail.com",

        to: applicant.email,

        subject: "Interview Scheduled",

        html: `

        <h1>Northbridge Solutions</h1>

        <p>
            Hello ${applicant.name},
        </p>

        <p>
            Your interview for the
            <strong>${applicant.job}</strong>
            role has been scheduled.
        </p>

        <h2>
            ${applicant.interviewDate}
        </h2>

        <p>
            Please be available at the
            scheduled time.
        </p>

        `
    });

    res.send("Interview scheduled");
});

app.post("/login", loginLimiter, async (req, res) => {

    const { username, password } = req.body;

    const admin = await Admin.findOne({
        username: username
    });

    if (!admin) {
        return res.send("Admin not found");
    }

    const validPassword =
        await bcrypt.compare(
            password,
            admin.password
        );

    if (!validPassword) {
        return res.send("Wrong password");
    }

    req.session.admin = admin;

    res.send("Login successful");
});

app.get("/", (req, res) => {

    res.sendFile(
        __dirname + "/public/index.html"
    );
});

app.get("/logout", (req, res) => {

    req.session.destroy();

    res.redirect("/admin.html");
});

app.get("/dashboard", (req, res) => {

    if (!req.session.admin) {

        return res.redirect("/admin.html");
    }

    res.sendFile(
        __dirname + "/dashboard-private.html"
    );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/applicant", (req, res) => {

    if (!req.session.admin) {
        return res.redirect("/admin.html");
    }

    res.sendFile(
        __dirname + "/applicant.html"
    );
});
