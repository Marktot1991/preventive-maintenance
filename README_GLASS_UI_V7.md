PM Dashboard — Glass UI V7 (21 Nov 2026)
=======================================
ฐาน: preventive-maintenance-administrator-delete-email-display-fixed.zip

ปรับปรุงหน้าจอ:
- Login: พื้นหลังไล่เฉด, กล่อง Login และส่วนแนะนำระบบเป็นกระจกโปร่งแสง
- Sidebar: สีน้ำเงินโปร่งแสง มีเอฟเฟกต์ blur, active/hover และยังย่อ/ขยายได้เหมือนเดิม
- Topbar: โปร่งแสง และยังเลือกอุปกรณ์ได้เหมือนเดิม
- ทุก Dashboard: Progress, History, Activity Log, Next Due, จัดการผู้ใช้, Login & Export Log
- รองรับ Light Mode / Dark Mode
- หน้า PM Checklist: กระจกเฉพาะกรอบใหญ่ โดยคงพื้นหลังตารางให้อ่านง่าย

แก้ไขเฉพาะ:
- index.html: เพิ่มบรรทัดอ้างอิง CSS ใหม่ด้านท้ายรายการ CSS
- css/glassmorphism-v7.css: CSS ธีมใหม่ แยกออกจากโค้ดเดิม (เฉพาะ @media screen)

ไม่เปลี่ยนแปลง:
- ไฟล์ JS ทั้งหมด / บัญชีผู้ใช้ / Supabase / สิทธิ์ Administrator / การแก้ไขและลบ PM
- ระบบแสดง E-Mail ก่อนปุ่ม Logout
- css/print.css และรูปแบบ A4 / พิมพ์ PDF

ติดตั้ง:
1) สำรองโค้ดชุดเดิม และข้อมูลที่สำคัญก่อนอัปเดต
2) อัปโหลดโฟลเดอร์ preventive-maintenance-main ตามโครงสร้างเดิมขึ้น GitHub Pages
3) ต้องมี css/glassmorphism-v7.css อยู่ในโฟลเดอร์ css
4) กด Ctrl+F5 เพื่อให้ Browser โหลด CSS ใหม่
5) ตรวจ Login, Progress/History/Next Due, Sidebar ย่อ/ขยาย และ Print Preview

การทดสอบ: JavaScript syntax ผ่าน, CSS parser ผ่าน, ตรวจ CSS ใน Chromium แบบจำลองหน้าจอ
ครบ 6 หน้า x 2 ธีม และยืนยันว่าการเปลี่ยนใหม่เป็น screen-only ไม่ทำงานใน print media
ไม่ได้ทดสอบจริงกับ Supabase / บัญชีผู้ใช้ที่ใช้งานจริง
