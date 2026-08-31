/**
 * Google Sheets sync para la lista de antojos del iglú.
 *
 * 1. Crea una hoja en Google Sheets (puede estar vacía).
 * 2. Extensiones → Apps Script → pega este archivo.
 * 3. Ejecuta setSecret una vez y pon un PIN (ej. "val2026").
 * 4. Implementar → Nueva implementación → Aplicación web.
 *    - Ejecutar como: yo
 *    - Quién tiene acceso: cualquiera
 * 5. Copia la URL en antojos-config.json del iglú.
 */

function setSecret() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt("PIN del iglú", "Elige un PIN corto (Val y Miguel lo usarán en el juego):", ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;
  const pin = result.getResponseText().trim();
  if (!pin) return;
  PropertiesService.getScriptProperties().setProperty("SECRET", pin);
  ui.alert("Listo. Ahora implementa la app web y copia la URL.");
}

function getSecret_() {
  return PropertiesService.getScriptProperties().getProperty("SECRET") || "";
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("antojos");
  if (!sheet) {
    sheet = ss.insertSheet("antojos");
    sheet.appendRow(["id", "text", "done", "date"]);
  }
  return sheet;
}

function rowsToAntojos_(data) {
  return data
    .slice(1)
    .filter((row) => row[0])
    .map((row) => ({
      id: String(row[0]),
      text: String(row[1]),
      done: row[2] === true || String(row[2]).toLowerCase() === "true",
      date: String(row[3] || ""),
    }));
}

function readAntojos_() {
  const data = getSheet_().getDataRange().getValues();
  return { antojos: rowsToAntojos_(data) };
}

function writeAntojos_(antojos) {
  const sheet = getSheet_();
  sheet.clearContents();
  sheet.appendRow(["id", "text", "done", "date"]);
  antojos.forEach((item) => {
    sheet.appendRow([item.id, item.text, Boolean(item.done), item.date]);
  });
  return { antojos };
}

function checkSecret_(secret) {
  const expected = getSecret_();
  return expected && secret === expected;
}

function doGet(e) {
  if (!checkSecret_(e.parameter.secret)) {
    return jsonResponse_({ error: "unauthorized", antojos: [] });
  }
  return jsonResponse_(readAntojos_());
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  if (!checkSecret_(body.secret)) {
    return jsonResponse_({ error: "unauthorized", antojos: [] });
  }

  let antojos = readAntojos_().antojos;
  if (body.action === "add") {
    antojos.push({
      id: `antojo-${Date.now()}`,
      text: String(body.text || "").trim(),
      done: false,
      date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    });
  } else if (body.action === "toggle") {
    antojos = antojos.map((item) =>
      item.id === body.id ? { ...item, done: !item.done } : item,
    );
  } else if (body.action === "remove") {
    antojos = antojos.filter((item) => item.id !== body.id);
  }

  antojos = antojos.filter((item) => item.text);
  return jsonResponse_(writeAntojos_(antojos));
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
