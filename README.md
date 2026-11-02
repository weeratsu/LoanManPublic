# LoanManPublic
หน้าดูยอดสำหรับลูกหนี้ (read-only, ใส่ PIN)

อัปเดต: LoanMan → ข้อมูล → 🔒 Export Public → วาง `data.js` ทับไฟล์นี้ → commit + push

`data.js` เข้ารหัส AES-GCM ด้วย PIN ของแต่ละคน (PBKDF2 200k) — ไม่มีชื่อ/PIN แบบอ่านได้ในไฟล์
