// ⚠️ แก้ไขแล้ว: ใช้ Sheet ID ที่คุณให้มาโดยตรง
const TARGET_SPREADSHEET_ID = '1r-PhSbtl4cEyhyjtxV5pN2isge0OrUhazXpchkYjuTSgrXWOY9GeM7ln'; 

// กำหนดชื่อของ Sheet ที่รับ Form Submission (ถ้าไม่ได้เปลี่ยนชื่อจะเป็น 'คำตอบของฟอร์ม 1')
const SHEET_NAME = 'คำตอบของฟอร์ม 1'; 

// กำหนด Index ของคอลัมน์ใน Sheet 
// [Timestamp(1), Name(2), Nickname(3), Class(4), DeskID(5), SeatID(6)]
const DESK_ID_COL = 5; 
const SEAT_ID_COL = 6; 
const NAME_COL = 2;    

/**
 * ฟังก์ชันนี้ทำหน้าที่เป็น Web API สำหรับดึงสถานะการจอง
 */
function doGet() {
  // เปิด Spreadsheet โดยใช้ ID ที่ระบุ
  try {
    const spreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: `Sheet named ${SHEET_NAME} not found.` }))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    // อ่านข้อมูลทั้งหมด ยกเว้นแถวหัวตาราง (Header Row)
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length <= 1) {
      // ไม่มีข้อมูลการจอง
      return ContentService.createTextOutput(JSON.stringify({ bookedSeats: [] }))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    // ประมวลผลข้อมูลการจอง
    const bookedSeats = [];
    // เริ่มจากแถวที่ 1 (index 1) เพื่อข้าม Header Row
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      
      const deskId = row[DESK_ID_COL - 1];
      const seatId = row[SEAT_ID_COL - 1];
      const name = row[NAME_COL - 1];

      if (deskId && seatId) { 
         bookedSeats.push({
             fullSeatId: deskId + '.' + seatId, 
             name: name 
         });
      }
    }

    // ส่งข้อมูลกลับไปในรูปแบบ JSON
    return ContentService.createTextOutput(JSON.stringify({ bookedSeats: bookedSeats }))
                         .setMimeType(ContentService.MimeType.JSON)
                         .setCors(getOrigins()); 

  } catch (e) {
     return ContentService.createTextOutput(JSON.stringify({ error: `Error accessing spreadsheet: ${e.toString()}` }))
                           .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * อนุญาตให้เว็บไซต์ใดๆ เรียกใช้ API นี้ได้
 */
function getOrigins() {
  return [
    'https://script.google.com', 
    'https://docs.google.com', 
    '*' // ใช้ wildcard เพื่อให้มั่นใจว่า GitHub Pages เข้าถึงได้
  ];
}
