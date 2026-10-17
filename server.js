
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "records.json");

// Allow the GitHub Pages frontend to access this public API.
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json({ limit: "100kb" }));

function readRecords() {
    const records = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

    if (!Array.isArray(records)) {
        throw new Error("Invalid records file");
    }

    return records;
}

function saveRecords(records) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
}

function validRecord(data) {
    const fields = ["title", "company", "domain", "location", "duration"];

    return data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        fields.every(field =>
            typeof data[field] === "string" &&
            data[field].trim().length > 0
        );
}

function validId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function handleError(res, message, error) {
    console.error(message, error.message);
    return res.status(500).json({ error: message });
}

// Health check
app.get("/", (req, res) => {
    res.json({ message: "Internship API is running" });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Internship API is running"
    });
});

// Get all internships with search and pagination
app.get("/api/internships", (req, res) => {
    try {
        let records = readRecords();
        const search = String(req.query.search || "").trim().toLowerCase();
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            20,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        if (search) {
            records = records.filter(record =>
                ["title", "company", "domain", "location", "duration"]
                    .some(field =>
                        String(record[field] || "").toLowerCase().includes(search)
                    )
            );
        }

        const total = records.length;
        const totalPages = Math.ceil(total / limit);
        const start = (page - 1) * limit;

        res.json({
            data: records.slice(start, start + limit),
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    } catch (error) {
        handleError(res, "Could not read internship records", error);
    }
});

// Get one internship
app.get("/api/internships/:id", (req, res) => {
    const id = validId(req.params.id);

    if (id === null) {
        return res.status(400).json({ error: "Invalid internship ID" });
    }

    try {
        const record = readRecords().find(item => item.id === id);

        if (!record) {
            return res.status(404).json({ error: "Internship not found" });
        }

        res.json({ data: record });
    } catch (error) {
        handleError(res, "Could not read internship record", error);
    }
});

// Create an internship
app.post("/api/internships", (req, res) => {
    if (!validRecord(req.body)) {
        return res.status(400).json({
            error: "All fields are required and must be non-empty strings"
        });
    }

    try {
        const records = readRecords();
        const id = records.reduce(
            (max, record) => Math.max(max, Number(record.id) || 0),
            0
        ) + 1;

        const record = {
            id,
            title: req.body.title.trim(),
            company: req.body.company.trim(),
            domain: req.body.domain.trim(),
            location: req.body.location.trim(),
            duration: req.body.duration.trim()
        };

        records.push(record);
        saveRecords(records);

        res.status(201).json({
            message: "Internship created successfully",
            data: record
        });
    } catch (error) {
        handleError(res, "Could not save internship", error);
    }
});

// Update an internship
app.put("/api/internships/:id", (req, res) => {
    const id = validId(req.params.id);

    if (id === null) {
        return res.status(400).json({ error: "Invalid internship ID" });
    }

    if (!validRecord(req.body)) {
        return res.status(400).json({
            error: "All fields are required and must be non-empty strings"
        });
    }

    try {
        const records = readRecords();
        const index = records.findIndex(record => record.id === id);

        if (index === -1) {
            return res.status(404).json({ error: "Internship not found" });
        }

        records[index] = {
            id,
            title: req.body.title.trim(),
            company: req.body.company.trim(),
            domain: req.body.domain.trim(),
            location: req.body.location.trim(),
            duration: req.body.duration.trim()
        };

        saveRecords(records);

        res.json({
            message: "Internship updated successfully",
            data: records[index]
        });
    } catch (error) {
        handleError(res, "Could not update internship", error);
    }
});

// Delete an internship
app.delete("/api/internships/:id", (req, res) => {
    const id = validId(req.params.id);

    if (id === null) {
        return res.status(400).json({ error: "Invalid internship ID" });
    }

    try {
        const records = readRecords();
        const updatedRecords = records.filter(record => record.id !== id);

        if (updatedRecords.length === records.length) {
            return res.status(404).json({ error: "Internship not found" });
        }

        saveRecords(updatedRecords);

        res.json({ message: "Internship deleted successfully" });
    } catch (error) {
        handleError(res, "Could not delete internship", error);
    }
});

// Unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
});

// Handle invalid JSON
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({ error: "Invalid JSON request body" });
    }

    console.error("Unexpected error:", error.message);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Internship API is running on port ${PORT}`);
});
