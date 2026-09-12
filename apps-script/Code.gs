/**
 * Ostro Nightlife Stock Control - Google Sheets backend.
 *
 * Deploy this file as a web app from Apps Script. The existing frontend
 * already calls GET ?action=getAll and POSTs { key, value } records.
 */

const DATA_SHEET_NAME = "Data";
const SPREADSHEET_ID_PROPERTY = "SPREADSHEET_ID";

/**
 * Run once from the Apps Script editor before deploying.
 * For a bound script, the active spreadsheet is used automatically.
 * For a standalone script, set the SPREADSHEET_ID script property first.
 */
function setup() {
  const sheet = getDataSheet_();
  sheet.getRange("A1:C1").setValues([["Key", "Value", "Updated At"]]);
  sheet.setFrozenRows(1);
  sheet.getRange("A:C").setNumberFormat("@");
  return `Ready: ${sheet.getParent().getName()} / ${sheet.getName()}`;
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = params.action || "health";

  try {
    if (action === "getAll") {
      const payload = readAll_();
      return jsonp_(params.callback, payload);
    }

    return json_({ ok: true, service: "ostro-stock-control" });
  } catch (error) {
    return jsonp_(params.callback, {
      ok: false,
      error: String(error.message || error),
    });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (typeof body.key !== "string" || !body.key.trim()) {
      return json_({ ok: false, error: "A non-empty key is required." });
    }
    if (typeof body.value !== "string") {
      return json_({ ok: false, error: "Value must be a JSON string." });
    }

    writeValue_(body.key.trim(), body.value);
    return json_({ ok: true, key: body.key.trim() });
  } catch (error) {
    return json_({ ok: false, error: String(error.message || error) });
  }
}

function getDataSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(
    SPREADSHEET_ID_PROPERTY,
  );
  const spreadsheet = spreadsheetId
    ? SpreadsheetApp.openById(spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error(
      "No spreadsheet configured. Bind this script to a Sheet or set the SPREADSHEET_ID script property.",
    );
  }

  const sheet =
    spreadsheet.getSheetByName(DATA_SHEET_NAME) ||
    spreadsheet.insertSheet(DATA_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange("A1:C1").setValues([["Key", "Value", "Updated At"]]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readAll_() {
  const sheet = getDataSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  const records = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  return records.reduce((result, record) => {
    const key = String(record[0] || "");
    if (key) result[key] = String(record[1] || "");
    return result;
  }, {});
}

function writeValue_(key, value) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getDataSheet_();
    const row = findKeyRow_(sheet, key);
    const values = [[key, value, new Date()]];

    if (row > 0) {
      sheet.getRange(row, 1, 1, 3).setValues(values);
    } else {
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, 3).setValues(values);
    }
  } finally {
    lock.releaseLock();
  }
}

function findKeyRow_(sheet, key) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const index = keys.findIndex((record) => String(record[0]) === key);
  return index === -1 ? -1 : index + 2;
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function jsonp_(callback, payload) {
  const safeCallback = /^[A-Za-z_$][\w.$]*$/.test(callback || "")
    ? callback
    : null;
  const response = JSON.stringify(payload);
  return ContentService.createTextOutput(
    safeCallback ? `${safeCallback}(${response});` : response,
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
