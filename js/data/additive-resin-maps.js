const additiveFuncLocMap={"T3100":"T-M-01-01-TAD-001","T3101":"T-M-01-01-TAD-002","T3102":"T-M-01-01-TAD-003","T3110":"T-M-01-01-TAD-004","T3111":"T-M-01-01-TAD-005","T3120":"T-M-01-01-TAD-006","T3121":"T-M-01-01-TAD-007","T3122":"T-M-01-01-TAD-008","T3123":"T-M-01-01-TAD-009","T3124":"T-M-01-01-TAD-010","T3125":"T-M-01-01-TAD-011","T3126":"T-M-01-01-TAD-012","T3130":"T-M-01-01-TAD-013","T3140":"T-M-01-01-TAD-014","T3141":"T-M-01-01-TAD-015","T3142":"T-M-01-01-TAD-016","T3150":"T-M-01-01-TAD-017","T3180":"T-M-01-01-TAD-018","T3190":"T-M-01-01-TAD-019","T3191":"T-M-01-01-TAD-020"};
const additiveValveList=[
  {suffix:"-XV40",eq:"MVAC011*",type:"actuator"},
  {suffix:"-XV41",eq:"MVAC011*",type:"actuator"},
  {suffix:"-XV42",eq:"MVAC011*",type:"actuator"},
  {suffix:"-XV402",eq:"MVAC011*",type:"actuator"},
  {suffix:"-XV50",eq:"MSOV011*",type:"solenoid"},
  {suffix:"-FT01",eq:"MIFT011*",type:"flow"}
];

const additiveActuatorTasks=[
  {i:1,n:"ตรวจเช็ค Actuator",s:"ไม่มีลมรั่ว, Position Indicatorไม่หลุด",p:p6},
  {i:2,n:"ตรวจเช็ค Solenoid valve",s:"ไม่มีลมรั่ว, รูเดรนไม่อุดตัน",p:p6},
  {i:3,n:"ตรวจเช็คสภาพสายไฟ",s:"ยึดแน่นกับเทอร์มินอล, ฉนวนไม่ขาด",p:p6},
  {i:4,n:"ตรวจเช็คการทำงานของ Valve",s:"เปิด/ปิดสุด ไม่ติดขัด",p:p6},
  {i:5,n:"ทำความสะอาด Actuator valve",s:"สะอาดไม่มีคราบสกปรก",p:p6}
];

const additiveSolenoidTasks=[
  {i:1,n:"ตรวจสอบ Port ของ Valve",s:"ไม่มีลมรั่วทะลุผ่าน",p:p6},
  {i:2,n:"ตรวจเช็ค Plug coil",s:"สายไฟต่อแน่นไม่หลุด, หลวม",p:p6},
  {i:3,n:"ตรวจสอบ Coil",s:"ไม่บวม ไม่มีรอยร้าว รอยไหม้",p:p6}
];

const additiveFlowTasks=[
  {i:1,n:"ตรวจเช็คการทำงานของ Flow meter",s:"อ่านค่าได้ปกติ, ค่าอ่านตรงกับ DCS",p:p6},
  {i:2,n:"ตรวจเช็คสภาพสายไฟ",s:"ยึดแน่นไม่หลุด/หลวม ฉนวนไม่ขาด",p:p6},
  {i:3,n:"ตรวจสอบหน้าจอแสดงผล",s:"มองเห็นชัด ไม่ดับ",p:p6},
  {i:4,n:"ตรวจสอบฝาครอบ",s:"ปิดสนิท ไม่มีน้ำซึมเข้าภายใน",p:p6},
  {i:5,n:"ตรวจสอบ Housing",s:"ไม่แตกร้าว",p:p6}
];

const additiveTankEquipmentMap={
  "T3100":["-XV40","-XV41","-XV42","-XV402","-XV50","-FT01"],
  "T3101":["-XV40","-XV41","-XV42","-XV402","-XV50","-FT01"],
  "T3102":["-XV40","-XV41","-XV42","-XV402","-XV50","-FT01"],
  "T3110":["-XV40","-XV41","-XV42","-XV402","-XV50","-FT01"],
  "T3111":["-XV40","-XV41","-XV402","-XV50","-FT01"],
  "T3120":["-XV402","-XV50","-FT01"],
  "T3121":["-XV402","-XV50","-FT01"],
  "T3122":["-XV402","-XV50","-FT01"],
  "T3123":["-XV402","-XV50","-FT01"],
  "T3124":["-XV40","-XV41","-XV42","-XV402","-XV50","-FT01"],
  "T3125":["-XV402","-XV50","-FT01"],
  "T3126":["-XV40","-XV41","-XV402","-XV50","-FT01"],
  "T3130":["-XV40","-XV41","-XV402","-XV50","-FT01"],
  "T3140":["-XV50"],
  "T3141":["-XV50"],
  "T3142":["-XV50"],
  "T3150":["-XV40","-XV41","-XV402","-XV50","-FT01"],
  "T3180":["-XV50"],
  "T3190":["-XV40","-XV41","-XV402","-XV50","-FT01"],
  "T3191":["-XV402","-XV50","-FT01"]
};

const tf2Map={'T2110':['LS','PDTR','TT','XV13','XV40_P','XV41_P','XV42_P','XV43_P','PSV','FT'],'T2111':['LS','PDTR','TT','XV13','XV14','XV40_P','XV42_P','XV43_P','PSV','FT'],'T2112':['LS','PDTR','TT','XV13','XV14','PSV'],'T2113':['LS','PDTR','TT','XV13','XV14','PSV'],'T2210':['LS','PDTD','XV40','XV50','SOV50','FT'],'T2211':['LS','PDTD','XV40','XV50'],'T2212':['LS','PDTD','XV40','XV50','SOV50','FT','REG'],'T2213':['LS','PDTD','XV40','XV50'],'T2214':['LS','PDTD','XV40','XV50','SOV50','FT','REG'],'T2215':['LS','PDTD','XV40','XV50'],'T2216':['LS','PDTD','XV13','XV40','XV50','SOV50','FT'],'T2217':['LS','PDTD','XV13','XV40','XV50','SOV50','FT'],'T2218':['LS','PDTD','XV13','XV40','XV50','SOV50','FT'],'T2219':['LS','PDTD','XV40'],'T2220':['LS','PDTD','XV40'],'T2221':['LS','PDTD','XV40'],'T2410':['LS','PDTD','XV13','XV40','XV41','XV50','SOV50','FT'],'T2411':['LS','PDTD','XV13','XV40','XV41','XV50','SOV50','FT'],'T9110':['LS','PDTD','XV13','XV40','XV41','XV50','SOV50','FT','REG']};
const surpMap={'C1910':['XV80','XV50','XV51','PIC01'],'C1911':['XV80','XV50','PIC01'],'C1920':['XV80','XV50','XV51','PIC01'],'C1921':['XV80','XV50','XV51','XV52','PIC01'],'C1930':['XV80','XV50','XV51','PIC01'],'C1940':['XV80','XV50','PIC01'],'C1960':['XV80','XV51','PIC01'],'C1970':['XV80','PIC01'],'C1980':['XV80','XV51','PIC01'],'C1995':['XV80','XV51','PIC01']};
const siloMap={'S1110':['JET','PRV','TT','LSH','YC','XV50','XV51','XV52','XV53','FB50','RV50','RV51','RV52','RV53'],'S1111':['JET','PRV','TT','LSH','YC','XV50','XV51','XV52','XV53','FB50','RV50','RV51','RV52','RV53'],'S1112':['JET','PRV','TT','LSH','YC','XV50','XV51','XV52','XV53','FB50','RV50','RV51','RV52','RV53'],'S1120':['JET','PRV','TT','LSH','YC','XV50','XV51','XV52','FB50','RV50','RV51','RV52','RV53'],'S1130':['JET','PRV','TT','LSH','YC','XV50','XV51','XV52','XV53','FB50','RV50','RV51','RV52','RV53'],'S1131':['JET','PRV','TT','LSH','YC','XV50','XV51','XV52','XV53','FB50','RV50','RV51','RV52','RV53'],'S1140':['JET','PRV','TT','LSH','YC','XV50','XV51','XV52','XV53','FB50','RV50','RV51','RV52','RV53'],'S1141':['JET','PRV','TT','LSH','YC','XV50','XV51','XV52','XV53','FB50','RV50','RV51','RV52','RV53']};
const hopperMap={'B1210':['XV50','JET','RV50','LSH'],'B1211':['XV50','RV50','JET','LSH'],'B1230':['XV50','RV50','JET','LSH'],'B1240':['XV50','RV50','JET','LSH'],'X1321':['RV50','LSH'],'Y1220':['RV1220-XV50','RV1221-XV50','JET']};

const mixFlMap={'D7301':'001','D7302':'002','D7303':'003','D7304':'004','D7305':'005','D7306':'006','D7307':'007','D7308':'008','D7309':'009','D7310':'010','D7311':'011','D7312':'012','D7313':'017','D7314':'018','D7315':'019'};
const tf2FlMap={'T2110':'005','T2111':'006','T2112':'018','T2113':'022','T2210':'007','T2211':'008','T2212':'009','T2213':'010','T2214':'011','T2215':'012','T2216':'013','T2217':'014','T2218':'015','T2219':'019','T2220':'020','T2221':'021','T2410':'016','T2411':'017','T9110':'001'};
const surpFlMap={'C1910':'001','C1911':'002','C1920':'003','C1921':'004','C1930':'005','C1940':'006','C1960':'007','C1970':'008','C1980':'009','C1995':'010'};
const siloFlMap={'S1110':'001','S1111':'002','S1112':'003','S1120':'004','S1130':'005','S1131':'006','S1140':'007','S1141':'008'};
const hopperFlMap={'B1210':'001','B1211':'002','B1230':'003','B1240':'004','X1321':'005','Y1220':'006'};
const divFlMap={'XV1110':'001','XV1111':'002','XV1112':'003','XV1113':'004','XV1114':'005','XV1115':'006','XV1116':'007','XV1117':'008','XV1130':'009','XV1131':'010','XV1132':'011','XV1133':'012','XV1134':'013','XV1135':'014','XV1136':'015','XV1137':'016','XV1138':'017','XV1139':'018','XV1141':'019','XV1142':'020','XV1143':'021','XV1150':'022','XV1151':'023','XV1160':'024','XV1210':'025','XV1211':'026','XV1220':'027','XV1221':'028','XV1222':'029','XV1223':'030','XV1230':'031','XV1231':'032','XV1232':'035','XV1240':'033','XV1144':'034','XV1241':'036','XV1242':'037','XV1311':'038','XV1313':'039','XV1314':'040','XV1315':'041','XV1316':'042','XV1317':'043','XV1318':'044','XV1319':'045','XV1320':'046','XV1321':'047','XV1322':'048','XV1323':'049','XV1324':'050','XV1325':'051','XV1326':'052','XV1327':'053','XV1328':'054','XV1350':'055','XV1351':'056'};

const L111=["IPSI013008|RPD1-PS1008 Safety Valve|psv","ITRE013046|RPD1-TRE046 Temp Elelment T111|temp","MVAC013154|SV11012 Solenoid Valve Steam Supply|sv","MVAC013155|SV11013 Solenoid Valve By Pass ST Cond|sv","MVAC013156|SV11014 Solenoid Valve Steam Cond|sv","MVAC013157|SV1111 Solenoid Valve Transfer T111|sv","MVAC013158|SV1123 Solenoid Valve D20 T111|sv","MVAC013159|SV11842 Solenoid Vave WS T111|sv","MVAC013160|SV11901 Solenoid Valve CWS|sv","MVAC013161|SV11902 Solenoid Valve CWS E112|sv","MVAC013162|SV11911 Solenoid Vave CWR|sv","MVAC013163|SV11966 Solenoid Vave CHWS|sv","MVAC013164|SV11976 Solenoid Valve CHWR|sv","MVAC013165|SV11982 Solenoid Valve N2 by Pass|sv","MVAC013166|SV14512 Solenoid Valve Xylene > T111|sv"];
const L141=["IFV1013007|RPD1-FV1007 Rotameter T141|rota","ITRE013047|RPD1-TRE047 Temp Elelment T141|temp","ITRE013048|RPD1-TRE048 Temp Elelment ref. T141|temp","MVAC013167|SV14914 Solenoid Valve CWR T141|sv","MVAC013168|SV14915 Solenoid Valve CHWR T141|sv","MVAC013169|SV14916 Solenoid Valve CHWS T141|sv","MVAC013170|SV14917 Solenoid Valve CWS T141|sv","MVAC013171|SV14918 Solenid Valve CWS & CHWS T141|sv","MVAC013172|SV14919 Solenoid Valve Fast Drain T141|sv","MVAC013173|SV14920 Solenoid Valve Drain ST T141|sv","MVAC013174|SV14921 Solenoid Valve Dernin T141|sv","MVCT013031|TCV1405 Control Valve Transfer T141|sv","MVCT013032|TCV14904 Control Valve Steam > T141|sv"];
const LR111=["EVM0013004|BTV1110 Bottom Valve R111|btv","IFMT013012|RPD1-FMT012 Flow Transmitter DEMIN|ft","IFVI013003|RPD1-FV1003 Flow Meter N2|ft","IPAT013003|RPD1-PAT003 Pressure Transmitter R111|pt","IPSI013004|RPD1-PS1004 Safety Valve|psv","IPSI013005|RPD1-PS1005 Safety Valve|psv","ITRE013026|RPD1-TRE026 Temp Elelment R111|temp","ITRE013027|RPD1-TRE027 Temp Elelment ref.R111|temp","ITRE013028|RPD1-TRE028 Temp Elelment Hot oil R111|temp","ITRE013029|RPD1-TRE029 Temp Elelmen Head Cond R111|temp","ITRE013030|RPD1-TRE030 Temp Elelmen End Cond R111|temp","ITRE013031|TE1106PD Temp Elelment Cooling R111|temp","MVAC013103|SV11015 Solenoid valve Vac line E111|sv","MVAC013104|SV1120 Solenoid Valve Vent E111|sv","MVAC013105|SV1121 Solenoid Valve Vent D111|sv","MVAC013106|SV1122 Solenoid Valve E111 to D111|sv","MVAC013107|SV11903 Solenoid Valve CWS|sv","MVAC013108|SV11904 Solenoid Valve CWS E113|sv","MVAC013109|SV11905 Solenoid Valve CWS E111|sv","MVAC013110|SV11913 Solenoid Valve CWR|sv","MVAC013111|SV11914 Solenoid Valve CWR E113|sv","MVAC013112|SV11915 Solenoid Valve CWR E111|sv","MVAC013113|SV11931 Solenoid Valve By pass ST cond|sv","MVAC013114|SV11961 Solenoid Valve CHWS|sv","MVAC013115|SV11962 Solenoid Valve CHWS E113|sv","MVAC013116|SV11963 Solenoid Valve CHWS E111|sv","MVAC013117|SV11971 Solenoid Valve CHWR|sv","MVAC013118|SV11971 Solenoid Valve CHWR E113|sv","MVAC013119|SV11972 Solenoid Valve CHWR E111|sv","MVAC013120|SV11980 Solenoid Valve N2 by pass|sv","MVAC013121|SV11981 Solenoid Valve N2 Supply|sv","MVCT013021|TCV11011 Control Valve Hot Oil Supply|cv","MVCT013022|TCV11012 Control Valve CWS|cv","MVCT013023|TCV11014 Cornitrol Valve Steam|cv","MVD1013002|TWV11011 T-WAY Valve Steam Supply|cv","MVD1013003|TWV11012 T-WAY Valve Steam Cond|cv"];
const LR141=["EVM0013005|BTV14006 Bottom Valve R141|btv","IFMT013013|RPD1-FMT013 Steam Flow Meter|rota","IFVI013004|RPD1-FV1004 Nitrogen Flow Meter|rota","IFV1013005|RPD1-FV1005 Rotameter R141|rota","IPAT013004|RPD1-PAT004 Pressure Transmitter R141|pt","IPGI013003|RPD1-PG1003 Pressure Gauge|pg","IPGI013004|RPD1-PG1004 Pressure Gauge|pg","IPGI013005|RPD1-PG1005 Pressure Gauge|pg","IPSI013006|RPD1-PS1006 Safety Valve|psv","ITRE013032|RPD1-TRE032 Temp Elelmetn R141|temp","ITRE013033|RPD1-TRE033 Temp Elelment Ref R141|temp","ITRE013034|RPD1-TRE034 Temp Elelment HOS R141|temp","ITRE013035|RPD1-TRE035 Temp Elelmen Head Cond R141|temp","ITRE013036|RPD1-TRE036 Temp Elelmen End Cond R141|temp","ITRE013037|RPD1-TRE037 Temp Elelment CHWS R141|temp","MVAC013122|SV14901 Solenoid Valve HT14901|sv","MVAC013123|SV14902 Solenoid Valve CWS DWS to D142|sv","MVAC013124|SV14903 Solenoid Valve Condenser1|sv","MVAC013125|SV14904 Solenoid Valve Total Condenser|sv","MVAC013126|SV14905 Solenoid Valve Vent D142|sv","MVAC013127|SV14906 Solenoid Valve Toatal Condenser|sv","MVAC013128|SV14907 Solenoid Valve D142|sv","MVAC013129|SV14908 Solenoid Valve CHWR R141|sv","MVAC013130|SV14909 Solenoid Valve CWR R141|sv","MVAC013131|SV14910 Solenoid Valve Fast Drain R141|sv","MVAC013132|SV14911 Solenoid Valve Drain Steam Trap|sv","MVAC013133|SV14912 Solenoid Vlave CHWS > R141|sv","MVAC013134|SV14913 Solenoid Valve CWS > R141|sv","MVAC013135|SV14941 Solenoid Valve T144>R141|sv","MVAC013136|SV14961 Solenoid Valve T146>R141|sv","MVCT013024|PCV1405 Control Valve Vent R141|cv","MVCT013025|TCV14011 Temp Control Valve HOS R141|cv","MVCT013026|TCV14901 Temp Control Valve Steam R141|cv","MVCT013027|TCV14902 Temp Control Valve CHWS R141|cv","MVD1013004|TWV14901 T-Way Valve D141, R141|sv","MVD1013005|TWV14902 T-Way Valve R141|sv"];
