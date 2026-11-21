PM Dashboard V11 — Result Note Sidebar form dropdown

ฐาน: PM Dashboard V10 Glass UI + Result Note filter (Supabase)

สิ่งที่เพิ่ม:
1. กด Result Note ครั้งแรก เปิดหน้าและรายการแผนก
2. กด Result Note ซ้ำ: ยุบเมนูแผนก (หน้า Result Note ยังแสดงอยู่); กดอีกครั้งจะกาง
3. กดชื่อแผนก EM1, EM2, Resin PD1, WWT จะเปิดช่องเลือกฟอร์มใต้แผนกนั้นและแสดง Result Note ของแผนก
4. กดชื่อแผนกซ้ำจะยุบเฉพาะช่องเลือกฟอร์ม
5. ช่องเลือกฟอร์มมี ทุกฟอร์มในแผนก / ทั้งกลุ่มอุปกรณ์ / ฟอร์มรายอุปกรณ์ที่มี Result Note จริงเท่านั้น
6. เลือกฟอร์มจาก Sidebar แล้วหน้า Result Note จะแสดงเฉพาะฟอร์มที่เลือก พร้อมรีเซ็ตช่องค้นหาเพื่อให้พบฟอร์มนั้น
7. จำนวนบันทึกและรายการตัวเลือกปรับตามข้อมูลเดิมใน Supabase pm_data โดยไม่ต้องมีตารางใหม่
8. ใช้ select แบบ native ไม่มีเอฟเฟกต์ blur เพิ่ม ลดภาระเครื่อง

ไฟล์เปลี่ยน: index.html, js/ui.js, js/result-notes-v9.js, css/result-notes-v9.css
ไฟล์อื่นและ CSS พิมพ์ PDF คงเดิม

วิธีติดตั้ง: สำรองไฟล์เดิม แตก ZIP อัปโหลดโฟลเดอร์ preventive-maintenance-main ขึ้น GitHub Pages แทนชุดเดิม แล้ว Ctrl+F5
ทดสอบแนะนำ: เลือก Result Note -> EM2 -> ฟอร์ม PGL13 (ที่มีหมายเหตุ) และลองกด EM2 ซ้ำเพื่อยุบ
