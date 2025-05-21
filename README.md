# ProjectPulse CSV Import Tool

This tool helps import projects from a CSV file into the ProjectPulse database. It handles creating projects and project managers as needed.

## Features

- Import projects from a CSV file
- Use Arabic name if available, fallback to English name
- Automatically create project managers if they don't exist
- Validate data before import
- Handle various date and number formats
- Detailed reporting and error handling

## Prerequisites

- Node.js installed (v16 or higher recommended)
- Access to a PostgreSQL database with the ProjectPulse schema
- A CSV file containing project data

## Setup

1. Install required dependencies:

```bash
npm install
```

2. Create a `.env` file with your database connection details:

```
DATABASE_URL=postgresql://username:password@localhost:5432/projectpulse
```

## CSV Format

Your CSV file should have the following columns:

- `STATUS` - Project status (e.g., Completed, In Progress)
- `CONTRACT NO` - Contract number
- `PROJECT NAME` - English project name
- `ARABIC NAME` - Arabic project name (optional)
- `PROJECT OFFICER` - Name of the project officer
- `START DATE` - Project start date
- `END DATE` - Project end date
- `BUDGET IN QAR` - Project budget
- `AMOUNT PAID` - Amount paid

If your CSV uses different column names, you can use the converter tool to map them.

## Usage

### Import Projects

Run the import script with your CSV file:

```bash
node import-projects.js your-projects.csv
```

This will:
1. Read the CSV file
2. Validate the data
3. Check for existing projects (to avoid duplicates)
4. Create project officers if they don't exist
5. Create projects in the database
6. Provide a summary of the import process

### Convert CSV Format

If your CSV file uses different column names, you can convert it:

```bash
node convert-csv.js your-original.csv converted.csv
```

Then edit the `convert-csv.js` file to map your column names to the expected format.

## Behavior Details

- Project Name: Uses the Arabic name if available, otherwise uses the English name
- Project Officer: Creates a new user if the project officer doesn't exist in the database
- Department: All imported projects are assigned to the Signal Corps department
- Status: Maps various status text to the standard status values in the database
- Duplicates: Skips projects that already exist (based on name)

## Troubleshooting

If you encounter issues:

1. Check database connection in the `.env` file
2. Verify your CSV file format
3. Make sure the Signal Corps department exists in the database
4. Check the console output for specific errors

## License

This project is licensed under the MIT License - see the LICENSE file for details. 