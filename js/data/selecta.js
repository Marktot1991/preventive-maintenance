/* PM Selecta — from "PM Selecta_261121_135512.pdf" (7 pages).
   EM2: main cabinet / D01 / D02, with only nonempty inspection tasks.
   The source has six numbered slots per equipment; unused empty slots are
   not active checks and do not count towards PM Progress.
   Equipment numbers marked * are reproduced verbatim from the PDF. */
const selectaTanks = ["T-M-01-01-SEL", "T-M-01-01-SEL-001", "T-M-01-01-SEL-002"];
const selectaTaskSets = {
  control: [
    ["ตรวจสอบไฟสถานะหน้าตู้", "ติดครบทุกดวง"],
    ["ตรวจสอบพัดลมระบายความร้อน", "ทำงานปกติ"],
    ["ตรวจสอบแผ่นกรองอากาศ", "ไม่อุดตัน ระบายอากาศได้ดี"],
    ["ตรวจสอบภายในตู้", "สะอาด, Terminal ยึดสายแน่นไม่หลวม"]
  ],
  pc: [
    ["เป่าฝุ่น ทำความสะอาด", "ไม่มีฝุ่น และคราบสกปรก"],
    ["ตรวจเช็คอุณหภูมิ CPU", "ไม่เกิน 60 °C"],
    ["ตรวจเช็คความสมบูรณ์ของ Hard disk", "ไม่มี Bad sectors"],
    ["ตรวจเช็ค UPS", "จ่ายไฟสำรองได้ปกติ"]
  ],
  weight3000: [
    ["ตรวจเช็คการทำงานของ Load cell", "อ่านค่าได้ปกติ ค่าไม่สวิง"],
    ["ตรวจเช็คสภาพสายสัญญาณ", "ไม่หลวม ไม่หลุด ไม่ขาด"],
    ["ทำความสะอาด Load Plate", "สะอาด ไม่มีคราบสี"],
    ["ตรวจสอบรอบๆ platform", "ต้องให้ตัวได้ ไม่เบียดทุกด้าน"]
  ],
  weight60: [
    ["ตรวจเช็คการทำงานของ Load cell", "อ่านค่าได้ปกติ ค่าไม่สวิง"],
    ["ตรวจเช็คสภาพสายสัญญาณ", "ไม่หลวม ไม่หลุด ไม่ขาด"],
    ["ทำความสะอาด Load Plate", "สะอาด ไม่มีคราบสี"]
  ],
  panel: [
    ["ตรวจสอบปุ่ม Emergency", "ใช้งานได้ปกติ"],
    ["พัดลมระบายความร้อน", "ทำงานปกติ"],
    ["แผ่นกรองอากาศ", "ไม่อุดตัน ระบายอากาศได้ดี"]
  ],
  manifold: [
    ["ตรวจเช็คสายลม และ Fitting", "ไม่มีลมรั่ว"],
    ["ตรวจเช็คการทำงานของ Pressure switch", "ทำงานปกติ(ตัดระบบถ้า < 3 Bar)"],
    ["ตรวจสอบ Solenoid valve", "ไม่มีลมรั่ว หรือน้ำรั่ว"]
  ],
  pressure: [
    ["ตรวจเช็คการทำงานของ Pressure switch", "ทำงานปกติ"],
    ["ตรวจเช็คสายสัญญาณ", "ไม่หลวม ไม่หลุด ไม่ขาด"],
    ["ตรวจเช็คสภาพ Connector", "ไม่แตก เกลียวไม่คลาย"]
  ],
  sov: [
    ["ตรวจเช็ค Port ของ Valve", "ไม่มีลมรั่วทะลุผ่าน"],
    ["ตรวจเช็ค Plug coil", "สายไฟต่อแน่นไม่หลุด, หลวม"],
    ["ตรวจสอบ Coil", "ไม่บวม ไม่มีรอยร้าว รอยไหม้"]
  ],
  limit: [
    ["ตรวจเช็คสัญญาณบน HMI", "สัญญาณ On/Off ปกติ ไม่ค้าง"],
    ["ตรวจเช็คสภาพสายสัญญาณ", "ขั้วต่อล็อคแน่น สายไม่ชำรุด"],
    ["ตรวจเช็คล้อลูกกลิ้ง และแกนกด", "ไม่สึกหรอ หรือติดขัด"]
  ],
  reed: [
    ["ตรวจเช็คสัญญาณบน HMI", "สัญญาณ On/Off ปกติ ไม่ค้าง"],
    ["ตรวจเช็คการติดตั้ง", "ล็อคยึดติดแน่น ไม่หลวม"],
    ["ตรวจเช็คสภาพสายสัญญาณ", "สายไม่ชำรุด"]
  ],
  photo: [
    ["ตรวจเช็คหน้าเลนส์ กับแผ่นสะท้อน", "สะอาด ไม่มีคราบสี"],
    ["ตรวจเช็คการทำงานของ Sensor", "ทำงานปกติ"],
    ["ตรวจสอบสภาพสายสัญญาณ", "ไม่หลวม ไม่หลุด ไม่ขาด"]
  ]
};
// Four-tuples: [Equipment, description from PDF, template type, unique section key].
const selectaMachineAssets = {
  "T-M-01-01-SEL": [
    ["MCON011*", "Control Cabinet", "control", "MCON011"],
    ["MPCW011*", "PC Workstation", "pc", "MPCW011"]
  ],
  "T-M-01-01-SEL-001": [
    ["MWEI011*", "D01 - Weight scale 3000 Kg", "weight3000", "MWEI011"],
    ["MWEI012*", "D01 - Weight scale 60 Kg", "weight60", "MWEI012"],
    ["MOPL011*", "D01 - Operation Panel", "panel", "MOPL011"],
    ["MSVM011*", "D01 - Solenoid Valve Manifold", "manifold", "MSVM011"],
    ["MPRS011*", "D01 - Pressure sensor", "pressure", "MPRS011"],
    ["MSOV011*", "D01 - Solenoid valve 2/2", "sov", "MSOV011"],
    ["MILS011*", "D01 - Limit switch", "limit", "MILS011"],
    ["MIRS011*", "D01 - Reed switch", "reed", "MIRS011"],
    ["MIPS011*", "D01 - Photo sensor", "photo", "MIPS011"]
  ],
  "T-M-01-01-SEL-002": [
    ["MWEI011*", "D02 - Weight scale 3000 Kg", "weight3000", "MWEI011"],
    ["MWEI012*", "D02 - Weight scale 60 Kg", "weight60", "MWEI012"],
    ["MOPL011*", "D02 - Operation Panel", "panel", "MOPL011"],
    ["MSVM011*", "D02 - Solenoid Valve Manifold", "manifold", "MSVM011"],
    ["MPRS011*", "D02 - Pressure sensor", "pressure", "MPRS011"],
    ["MSOV011*", "D02 - Solenoid valve 2/2", "sov", "MSOV011"],
    ["MILS011*", "D02 - Limit switch", "limit", "MILS011"],
    ["MIRS011*", "D02 - Reed switch", "reed", "MIRS011"],
    ["MIPS011*", "D02 - Photo sensor", "photo", "MIPS011"]
  ]
};
const selectaMachineInfo = {
  "T-M-01-01-SEL": {fl:"T-M-01-01-SEL", desc:"Selecta", short:"Selecta", code:"SEL"},
  "T-M-01-01-SEL-001": {fl:"T-M-01-01-SEL-001", desc:"Selecta D01", short:"Selecta D01", code:"SEL-001"},
  "T-M-01-01-SEL-002": {fl:"T-M-01-01-SEL-002", desc:"Selecta D02", short:"Selecta D02", code:"SEL-002"}
};
// Match existing PM check schema {i,n,s,p} and save through existing Supabase pm_data path.
const selectaTaskList = kind => (selectaTaskSets[kind] || []).map(([n,s],index)=>({i:index+1,n,s,p:"6M"}));
