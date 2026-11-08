/**
 * Lịch Làm Việc - Google Apps Script Backend (Standalone)
 * Backend sheet: Data Web App Rural (1RtVPThy95QMdHGvfL_9lCMNwcgStXCxxqLj1Cpf-KwY)
 *   - Tab "LichLamViec_Data": lưu trữ task records
 *   - Tab "LichLamViec_Store": copy storelist lookup
 */

// ========== CONFIG ==========
var BACKEND_SHEET_ID = '1RtVPThy95QMdHGvfL_9lCMNwcgStXCxxqLj1Cpf-KwY'; // sheet backend
var STORELIST_SOURCE_ID = '1fMmEm1GC9aei_3oeu2vcadPVsUM9ms9eVhm99d7pF8A'; // storelist nguồn
var STORE_SHEET_NAME = 'Store_list';
var DATA_SHEET_NAME = 'LichLamViec_Data';
var STORE_REF_SHEET_NAME = 'LichLamViec_Store';

// ========== doGet() - web app entry point ==========
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Khai Báo Lịch Làm Việc')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// ========== doPost() - API CRUD ==========
function doPost(e) {
  var action = e.parameter.action;
  var data = JSON.parse(e.postData.contents);
  var result;
  
  try {
    switch (action) {
      case 'getSchedule':
        result = getSchedule(data);
        break;
      case 'saveSchedule':
        result = saveSchedule(data);
        break;
      case 'updateTask':
        result = updateTask(data);
        break;
      case 'deleteTask':
        result = deleteTask(data);
        break;
      case 'getStorelist':
        result = getStorelist(data);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========== CRUD FUNCTIONS ==========
function getOrCreateSheet(sheetName, headers) {
  var ss = SpreadsheetApp.openById(BACKEND_SHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#C00000').setFontColor('#ffffff');
    }
  }
  return sheet;
}

function getSchedule(data) {
  var sheet = getOrCreateSheet(DATA_SHEET_NAME, [
    'id', 'ho_ten', 'vai_tro', 'nam', 'tuan', 'ngay',
    'task_type', 'task_custom', 'ma_ch', 'ten_ch', 'ghi_chu',
    'created_at', 'updated_at'
  ]);
  
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { success: true, data: [] };
  
  var headers = rows[0];
  var results = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[0]) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j] || '';
    }
    results.push(obj);
  }
  
  // Filter
  if (data) {
    if (data.ho_ten) results = results.filter(function(r) { return r.ho_ten === data.ho_ten; });
    if (data.vai_tro) results = results.filter(function(r) { return r.vai_tro === data.vai_tro; });
    if (data.nam)   results = results.filter(function(r) { return r.nam === data.nam; });
    if (data.tuan)    results = results.filter(function(r) { return String(r.tuan) === String(data.tuan); });
  }
  
  return { success: true, data: results };
}

function saveSchedule(data) {
  var tasks = data.tasks;
  if (!tasks || !Array.isArray(tasks)) return { success: false, error: 'Invalid tasks array' };
  
  var sheet = getOrCreateSheet(DATA_SHEET_NAME, [
    'id', 'ho_ten', 'vai_tro', 'nam', 'tuan', 'ngay',
    'task_type', 'task_custom', 'ma_ch', 'ten_ch', 'ghi_chu',
    'created_at', 'updated_at'
  ]);
  
  // Lấy dữ liệu hiện tại để tìm/xóa task cũ của tuần này
  var allRows = sheet.getDataRange().getValues();
  var headers = allRows[0];
  var idCol = headers.indexOf('id') + 1;
  var hoTenCol = headers.indexOf('ho_ten') + 1;
  var namCol = headers.indexOf('nam') + 1;
  var tuanCol = headers.indexOf('tuan') + 1;
  
  // Collect IDs to save
  var saveIds = tasks.map(function(t) { return t.id; }).filter(Boolean);
  
  // Delete existing rows that match (ho_ten, nam, tuan) and are being replaced
  if (tasks.length > 0 && allRows.length > 1) {
    var sample = tasks[0];
    var rowsToDelete = [];
    for (var i = allRows.length - 1; i >= 1; i--) {
      var row = allRows[i];
      if (row[hoTenCol - 1] === sample.ho_ten &&
          row[namCol - 1] === sample.nam &&
          String(row[tuanCol - 1]) === String(sample.tuan)) {
        rowsToDelete.push(i + 1);
      }
    }
    // Xóa từ dưới lên
    for (var k = 0; k < rowsToDelete.length; k++) {
      sheet.deleteRow(rowsToDelete[k]);
    }
  }
  
  // Append new tasks
  var now = new Date().toISOString();
  var newRows = tasks.map(function(t) {
    return [
      t.id || Utilities.getUuid(),
      t.ho_ten || '',
      t.vai_tro || '',
      t.nam || '',
      t.tuan || '',
      t.ngay || '',
      t.task_type || '',
      t.task_custom || '',
      t.ma_ch || '',
      t.ten_ch || '',
      t.ghi_chu || '',
      t.created_at || now,
      now
    ];
  });
  
  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  
  return { success: true, message: 'Đã lưu ' + newRows.length + ' task', count: newRows.length };
}

function updateTask(data) {
  var sheet = getOrCreateSheet(DATA_SHEET_NAME, [
    'id', 'ho_ten', 'vai_tro', 'nam', 'tuan', 'ngay',
    'task_type', 'task_custom', 'ma_ch', 'ten_ch', 'ghi_chu',
    'created_at', 'updated_at'
  ]);
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idCol = headers.indexOf('id');
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === data.id) {
      var rowNum = i + 1;
      if (data.task_type !== undefined)     sheet.getRange(rowNum, headers.indexOf('task_type') + 1).setValue(data.task_type);
      if (data.task_custom !== undefined)    sheet.getRange(rowNum, headers.indexOf('task_custom') + 1).setValue(data.task_custom);
      if (data.ma_ch !== undefined)          sheet.getRange(rowNum, headers.indexOf('ma_ch') + 1).setValue(data.ma_ch);
      if (data.ten_ch !== undefined)         sheet.getRange(rowNum, headers.indexOf('ten_ch') + 1).setValue(data.ten_ch);
      if (data.ghi_chu !== undefined)        sheet.getRange(rowNum, headers.indexOf('ghi_chu') + 1).setValue(data.ghi_chu);
      if (data.ngay !== undefined)           sheet.getRange(rowNum, headers.indexOf('ngay') + 1).setValue(data.ngay);
      sheet.getRange(rowNum, headers.indexOf('updated_at') + 1).setValue(new Date().toISOString());
      return { success: true, message: 'Đã cập nhật task' };
    }
  }
  return { success: false, error: 'Task không tìm thấy: ' + data.id };
}

function deleteTask(data) {
  var sheet = getOrCreateSheet(DATA_SHEET_NAME);
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idCol = headers.indexOf('id');
  
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][idCol] === data.id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Đã xóa task' };
    }
  }
  return { success: false, error: 'Task không tìm thấy: ' + data.id };
}

// ========== STORELIST ==========
function getStorelist(data) {
  var sheet = getOrCreateSheet(STORE_REF_SHEET_NAME, ['Mã SAP', 'Tên cửa hàng']);
  var rows = sheet.getDataRange().getValues();
  
  // If storelist ref is empty (only header), try to sync from source
  if (rows.length <= 1) {
    syncStorelist();
    rows = sheet.getDataRange().getValues();
  }
  
  var results = [];
  var search = data && data.search ? data.search.toLowerCase().trim() : '';
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[0]) continue;
    var ma = String(row[0]).trim();
    var ten = String(row[1]).trim();
    if (search) {
      if (ma.toLowerCase().indexOf(search) >= 0 || ten.toLowerCase().indexOf(search) >= 0) {
        results.push({ ma_sap: ma, ten_ch: ten });
      }
    } else {
      results.push({ ma_sap: ma, ten_ch: ten });
    }
  }
  
  if (!search) {
    // Giới hạn 500 kết quả nếu không search
    results = results.slice(0, 500);
  }
  
  return { success: true, data: results };
}

function syncStorelist() {
  try {
    var srcSs = SpreadsheetApp.openById(STORELIST_SOURCE_ID);
    var srcSheet = srcSs.getSheetByName(STORE_SHEET_NAME);
    if (!srcSheet) return;
    
    var srcData = srcSheet.getDataRange().getValues();
    var destSheet = getOrCreateSheet(STORE_REF_SHEET_NAME, ['Mã SAP', 'Tên cửa hàng']);
    
    destSheet.clearContents();
    if (srcData.length > 0) {
      destSheet.getRange(1, 1, 1, 2).setValues([['Mã SAP', 'Tên cửa hàng']]);
      destSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#C00000').setFontColor('#ffffff');
    }
    
    // Copy cols A,B (index 0,1)
    var storeData = [];
    for (var i = 0; i < srcData.length; i++) {
      storeData.push([srcData[i][0], srcData[i][1]]);
    }
    if (storeData.length > 1) {
      destSheet.getRange(2, 1, storeData.length - 1, 2).setValues(storeData.slice(1));
    }
  } catch (e) {
    Logger.log('syncStorelist error: ' + e.toString());
  }
}

// ========== UTILITIES ==========
function testGetSchedule() {
  var result = getSchedule(null);
  Logger.log(JSON.stringify(result));
  return result;
}

function testSyncStorelist() {
  syncStorelist();
  Logger.log('Sync completed');
  return { success: true };
}