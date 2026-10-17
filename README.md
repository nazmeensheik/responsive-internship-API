
# REST API and Persistent Data — Internship Records

## Project objective

A beginner-friendly internship management application using Node.js, Express, HTML, CSS, JavaScript and JSON-file persistence.

## Features

- List internship records
- Retrieve one internship by ID
- Create new internship records
- Update existing records
- Delete internship records
- Search by title, company, domain or location
- Pagination with page and limit parameters
- Input validation and consistent JSON errors
- JSON-file storage persists data across server restarts
- Responsive and keyboard-accessible frontend

## Requirements

- Node.js and npm

## Run locally

1. Download or clone this repository.
2. Open the project folder in a terminal.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

Do not open `index.html` directly. The frontend needs the Express server to be running.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check server health |
| GET | `/api/internships` | List records |
| GET | `/api/internships/:id` | Get one record |
| POST | `/api/internships` | Create a record |
| PUT | `/api/internships/:id` | Update a record |
| DELETE | `/api/internships/:id` | Delete a record |

### Search and pagination example

`GET /api/internships?search=java&page=1&limit=5`

### Create record example

Send JSON to `POST /api/internships`:

```json
{
  "title": "Java Developer Intern",
  "company": "Example Company",
  "domain": "Java",
  "location": "Hyderabad",
  "duration": "3 Months"
}
```

## Error handling

- `400`: Invalid ID or invalid input
- `404`: Record or API endpoint not found
- `500`: File or server error

## Persistence

Records are saved in `records.json`. Keep the file in the project directory and ensure the server has permission to write to it.

## Security note

This is a learning project. For production use, add authentication, rate limiting, stricter security headers, and a database with appropriate access controls.
