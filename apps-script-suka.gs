// Google Apps Script — penghitung suka Preloved Mini
// Pasang di: Google Sheets > Extensions > Apps Script
// Siapkan tab bernama "Suka" dengan header: key | count

function doGet() {
  const rows = SpreadsheetApp.getActive().getSheetByName("Suka").getDataRange().getValues().slice(1);
  const out = {};
  rows.forEach(r => { if (r[0]) out[r[0]] = Number(r[1]) || 0; });
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName("Suka");
    const key = String(e.parameter.key || "").trim().toLowerCase();
    const delta = Number(e.parameter.delta) === -1 ? -1 : 1;
    if (!key) return ContentService.createTextOutput("no key");

    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sh.getRange(i + 1, 2).setValue(Math.max(0, (Number(data[i][1]) || 0) + delta));
        return ContentService.createTextOutput("ok");
      }
    }
    sh.appendRow([key, Math.max(0, delta)]);
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}
