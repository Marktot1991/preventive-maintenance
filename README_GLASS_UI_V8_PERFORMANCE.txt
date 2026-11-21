PM Dashboard Glass UI V8 — Dark Transparency + Performance
อัปเดตจาก PM Dashboard — Administrator + Delete Glass UI V7

รายการแก้ไข:
1) โหมดมืด: Login, Sidebar, Topbar, Dashboard, History, Activity Log, Next Due, Admin เป็นพื้นหลังสีโปร่งแสง
2) ลดการใช้ GPU: เอาการเบลอ (backdrop-filter) ออกจากการ์ด/กราฟ/ตารางที่ซ้อนกัน และแถบด้านข้าง/แถบด้านบน
3) Login ใช้ blur เบา ๆ เฉพาะกล่องหลัก (7px) เพื่อยังคงลักษณะกระจก
4) ยกเลิกพื้นหลังแบบ fixed ที่อาจทำให้ภาพต้องวาดใหม่บ่อยขณะเลื่อนหน้า และลดการเคลื่อน/เงาของการ์ดเมื่อชี้เมาส์
5) ปรับความต่างสีข้อความในโหมดมืดให้อ่านง่าย

ไฟล์ใหม่:
css/glassmorphism-v8-performance.css
ไฟล์ที่แก้ไข:
index.html (เพิ่มลิงก์ CSS ใหม่ พร้อมเลขเวอร์ชันกันแคช)

ส่วนที่ไม่ได้แก้:
- JavaScript, ระบบ Login/Supabase, สิทธิ์ Administrator, การบันทึกข้อมูล, ปุ่มลบรายการ PM
- รูปแบบส่งออก PDF/print.css และข้อมูลแม่แบบฟอร์ม
- การย่อ/ขยาย Sidebar และโครงสร้างหน้าเว็บเดิม

วิธีติดตั้ง:
1) สำรองเว็บเดิม แล้วแตก ZIP และอัปโหลดโฟลเดอร์/ไฟล์ทั้งหมดของ preventive-maintenance-main แทนของเดิม
2) สำคัญ: อัปโหลดไฟล์ใหม่ css/glassmorphism-v8-performance.css ให้ครบ
3) รีเฟรชแบบไม่ใช้แคช (Ctrl+F5) หรือทดสอบในหน้าต่างไม่ระบุตัวตน
4) ทดลองเปิด Login/Dashboard ใน Dark Mode และเลื่อน History ที่มีข้อมูลเยอะ

หมายเหตุการทดสอบ:
ทดสอบภาพหน้าจอ CSS แบบออฟไลน์ด้วย Chromium ทั้ง Light/Dark,
ตรวจ computed styles ว่าหน้า Dashboard และหน้าข้อมูลหลักไม่ใช้ blur ซ้อนกัน,
ตรวจ syntax CSS/JavaScript และยืนยันว่า print.css/JavaScript เหมือน V7 เดิม
ยังไม่ได้ทดสอบความเร็วกับอุปกรณ์จริงของผู้ใช้ หรือการดึงข้อมูล Supabase จริง
