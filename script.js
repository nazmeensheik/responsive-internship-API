
const API_URL = "https://responsive-internship-api.onrender.com/api/internships";
const PAGE_SIZE = 5;

const form = document.getElementById("internshipForm");
const recordsBox = document.getElementById("records");
const statusBox = document.getElementById("status");
const searchInput = document.getElementById("search");
const formMessage = document.getElementById("formMessage");
const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");
const pageNumber = document.getElementById("pageNumber");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");

let currentPage = 1;
let totalPages = 1;
let editingId = null;
let searchTimer;

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.error || "Request failed");
    }

    return result;
}

function createTextElement(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text ?? "";
    if (className) element.className = className;
    return element;
}

async function loadRecords() {
    statusBox.textContent = "Loading records...";
    recordsBox.replaceChildren();

    try {
        const query = new URLSearchParams({
            page: currentPage,
            limit: PAGE_SIZE,
            search: searchInput.value.trim()
        });

        const result = await apiRequest(`${API_URL}?${query}`);
        const records = result.data || [];

        totalPages = Math.max(1, result.pagination?.totalPages || 1);

        pageNumber.textContent = `Page ${currentPage} of ${totalPages}`;
        previousButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;

        if (records.length === 0) {
            statusBox.textContent = "No internships found.";
            return;
        }

        statusBox.textContent =
            `${result.pagination?.total ?? records.length} internship(s) found.`;

        records.forEach(record => {
            const card = document.createElement("article");
            card.className = "record";

            card.appendChild(createTextElement("h3", record.title));
            card.appendChild(createTextElement("p", `Company: ${record.company}`));
            card.appendChild(createTextElement("p", `Domain: ${record.domain}`));
            card.appendChild(createTextElement("p", `Location: ${record.location}`));
            card.appendChild(createTextElement("p", `Duration: ${record.duration}`));

            const editButton = createTextElement("button", "Edit");
            editButton.type = "button";
            editButton.addEventListener("click", () => startEdit(record));

            const deleteButton = createTextElement("button", "Delete", "delete-button");
            deleteButton.type = "button";
            deleteButton.addEventListener("click", () => deleteRecord(record.id));

            card.append(editButton, deleteButton);
            recordsBox.appendChild(card);
        });
    } catch (error) {
        statusBox.textContent =
            `Unable to load records: ${error.message}. Please check the server.`;
    }
}

function getFormData() {
    return {
        title: document.getElementById("title").value.trim(),
        company: document.getElementById("company").value.trim(),
        domain: document.getElementById("domain").value.trim(),
        location: document.getElementById("location").value.trim(),
        duration: document.getElementById("duration").value.trim()
    };
}

form.addEventListener("submit", async event => {
    event.preventDefault();
    formMessage.textContent = "Saving...";

    const data = getFormData();

    if (Object.values(data).some(value => !value)) {
        formMessage.textContent = "Please fill in every field.";
        return;
    }

    try {
        if (editingId === null) {
            await apiRequest(API_URL, {
                method: "POST",
                body: JSON.stringify(data)
            });
            formMessage.textContent = "Internship added successfully.";
        } else {
            await apiRequest(`${API_URL}/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(data)
            });
            formMessage.textContent = "Internship updated successfully.";
        }

        resetForm();
        currentPage = 1;
        await loadRecords();
    } catch (error) {
        formMessage.textContent = error.message;
    }
});

function startEdit(record) {
    editingId = record.id;

    document.getElementById("title").value = record.title;
    document.getElementById("company").value = record.company;
    document.getElementById("domain").value = record.domain;
    document.getElementById("location").value = record.location;
    document.getElementById("duration").value = record.duration;

    document.getElementById("formTitle").textContent = "Edit Internship";
    submitButton.textContent = "Save Changes";
    cancelButton.hidden = false;
    formMessage.textContent = `Editing record ${record.id}`;
    document.getElementById("title").focus();
}

function resetForm() {
    form.reset();
    editingId = null;
    document.getElementById("formTitle").textContent = "Add Internship";
    submitButton.textContent = "Add Record";
    cancelButton.hidden = true;
}

cancelButton.addEventListener("click", () => {
    resetForm();
    formMessage.textContent = "Edit cancelled.";
});

async function deleteRecord(id) {
    if (!confirm("Are you sure you want to delete this internship?")) return;

    try {
        await apiRequest(`${API_URL}/${id}`, { method: "DELETE" });
        formMessage.textContent = "Internship deleted successfully.";
        await loadRecords();
    } catch (error) {
        formMessage.textContent = error.message;
    }
}

searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        currentPage = 1;
        loadRecords();
    }, 300);
});

previousButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        loadRecords();
    }
});

nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadRecords();
    }
});

loadRecords();
