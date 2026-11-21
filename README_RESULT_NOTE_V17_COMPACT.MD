PM Dashboard V17 — Result Note Sidebar Compact

ปรับปรุงจาก V16 (Login Frameless):
- แสดงชื่อฟอร์ม Result Note ใน Sidebar เฉพาะรหัสอุปกรณ์ เช่น FMU-002, T5120, PGL13
- ไม่แสดงป้ายจำนวนหมายเหตุหรือคำอธิบายซ้ำในแต่ละแถว
- ชื่อเต็มแสดงได้เมื่อชี้เมาส์ (title)
- ปรับรายการให้เป็นแถวเดียว กะทัดรัด เลือกได้ง่าย
- ลดการสร้าง DOM ซ้ำใน Sidebar เพื่อช่วยให้การเลื่อนลื่นขึ้น
- จำนวนฟอร์มที่หัวข้อแผนก และรายละเอียด Result Note บนหน้าหลักยังอยู่
- ไม่มีการเปลี่ยน schema ของ Supabase หรือ CSS พิมพ์ PDF

ติดตั้ง: อัปโหลดโฟลเดอร์ preventive-maintenance-main ทับชุดเดิมบน GitHub Pages และกด Ctrl+F5
