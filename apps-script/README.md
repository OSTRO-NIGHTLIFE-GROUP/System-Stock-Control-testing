# Google Sheets backend

This Apps Script backend stores the stock-control app data in a Google Sheet using one key/value record per row.

## Setup

1. Create a blank Google Sheet.
2. Open **Extensions > Apps Script**.
3. Replace the default script with the contents of `Code.gs`.
4. Save the project.
5. Run the `setup` function once from the Apps Script editor and approve the permissions.
6. Deploy using **Deploy > New deployment**.
7. Select **Web app** as the deployment type.
8. Set **Execute as** to **Me**.
9. Set **Who has access** to **Anyone**.
10. Deploy and copy the web-app URL ending in `/exec`.
11. In the stock-control app, open **Settings > Cloud Database** and paste that URL.
12. Select **Save & Test Connection**.

The script creates a `Data` tab with these columns:

```text
Key | Value | Updated At
```

The existing frontend uses these endpoints:

- `GET ?action=getAll&callback=...` to load all records
- `POST { "key": "...", "value": "..." }` to save one record

## Standalone Apps Script project

If the Apps Script project is not opened from the Google Sheet, add a script property named `SPREADSHEET_ID` containing the spreadsheet ID. The spreadsheet ID is the part between `/d/` and `/edit` in the Google Sheet URL.

## Testing

Open the deployed `/exec` URL in a browser. A successful response should look like:

```json
{ "ok": true, "service": "ostro-stock-control" }
```

After connecting the frontend, use **Push all local data to cloud** once to upload the current browser data into the Sheet.

## Prototype limitations

This backend is suitable for testing and small internal use. Before production use, add authenticated users, role checks, input validation, audit logging, and a proper relational database or protected API.
