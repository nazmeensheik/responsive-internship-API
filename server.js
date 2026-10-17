
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "records.json");

app.use(express.json());
app.use(express.static(__dirname));

function readRecords() {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveRecords(records) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
}

function validRecord(data) {
    return data &&
        typeof data.title === "string" && data.title.trim() &&
        typeof data.company === "string" && data.company.trim() &&
        typeof data.domain === "string" && data.domain.trim() &&
        typeof data.location === "string" && data.location.trim() &&
        typeof data.duration === "string" && data.duration.trim();
}

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Internship API is running" });
});

app.get("/api/internships", (req, res) => {
    try {
        let records = readRecords();
        const search = (req.query.search || "").toLowerCase();
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));

        if (search) {
            records = records.filter(r =>
                [r.title, r.company, r.domain, r.location]
                    .some(value => value.toLowerCase().includes(search))
            );
        }

        const total = records.length;
        const start = (page - 1) * limit;

        res.json({
            data: records.slice(start, start + limit),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Could not read internship records" });
    }
});

app.get("/api/internships/:id", (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: "Invalid internship ID" });
        }

        const record = readRecords().find(r => r.id === id);

        if (!record) {
            return res.status(404).json({ error: "Internship not found" });
        }

        res.json({ data: record });
    } catch (error) {
        res.status(500).json({ error: "Could not read internship record" });
    }
});

app.post("/api/internships", (req, res) => {
    try {
        if (!validRecord(req.body)) {
            return res.status(400).json({
                error: "All fields are required and must be non-empty strings"
            });
        }

        const records = readRecords();
        const id = records.length
            ? Math.max(...records.map(r => r.id)) + 1
            : 1;

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
        res.status(500).json({ error: "Could not save internship" });
    }
});

app.put("/api/internships/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: "Invalid internship ID" });
        }

        if (!validRecord(req.body)) {
            return res.status(400).json({
                error: "All fields are required and must be non-empty strings"
            });
        }

        const records = readRecords();
        const index = records.findIndex(r => r.id === id);

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
        res.status(500).json({ error: "Could not update internship" });
    }
});

app.delete("/api/internships/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: "Invalid internship ID" });
        }

        const records = readRecords();
        const updated = records.filter(r => r.id !== id);

        if (updated.length === records.length) {
            return res.status(404).json({ error: "Internship not found" });
        }

        saveRecords(updated);
        res.json({ message: "Internship deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Could not delete internship" });
    }
});

app.use("/api", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
});

app.listen(PORT, () => {
    console.log(`Internship API running at http://localhost:${PORT}`);
});
