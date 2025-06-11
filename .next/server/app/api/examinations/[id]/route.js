(()=>{var e={};e.id=3562,e.ids=[3562],e.modules={28303:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=28303,e.exports=t},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},79428:e=>{"use strict";e.exports=require("buffer")},55511:e=>{"use strict";e.exports=require("crypto")},94735:e=>{"use strict";e.exports=require("events")},29021:e=>{"use strict";e.exports=require("fs")},91645:e=>{"use strict";e.exports=require("net")},21820:e=>{"use strict";e.exports=require("os")},33873:e=>{"use strict";e.exports=require("path")},19771:e=>{"use strict";e.exports=require("process")},27910:e=>{"use strict";e.exports=require("stream")},41204:e=>{"use strict";e.exports=require("string_decoder")},66136:e=>{"use strict";e.exports=require("timers")},34631:e=>{"use strict";e.exports=require("tls")},79551:e=>{"use strict";e.exports=require("url")},28354:e=>{"use strict";e.exports=require("util")},74075:e=>{"use strict";e.exports=require("zlib")},55607:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>v,routeModule:()=>m,serverHooks:()=>g,workAsyncStorage:()=>l,workUnitAsyncStorage:()=>h});var s={};r.r(s),r.d(s,{DELETE:()=>c,GET:()=>u,PUT:()=>p});var a=r(42706),i=r(28203),o=r(45994),n=r(39187),d=r(19637);async function u(e,{params:t}){try{let[e]=await (0,d.P)(`SELECT 
        e.id, 
        e.blood_pressure as bloodPressure, 
        e.heart_rate as heartRate, 
        e.temperature, 
        e.weight, 
        e.height, 
        e.notes,
        e.diagnosis,
        e.created_at as createdAt,
        e.updated_at as updatedAt,
        v.id as visitId,
        v.complaint as visitComplaint,
        v.status as visitStatus,
        p.id as patientId,
        p.name as patientName,
        p.mrn as patientMRN,
        d.id as doctorId,
        d.name as doctorName
      FROM examinations e
      LEFT JOIN visits v ON e.visit_id = v.id
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN doctors d ON v.doctor_id = d.id
      WHERE e.id = ?`,[t.id]);if(!e)return n.NextResponse.json({message:"Pemeriksaan tidak ditemukan"},{status:404});let r={id:e.id,bloodPressure:e.bloodPressure,heartRate:e.heartRate,temperature:e.temperature,weight:e.weight,height:e.height,notes:e.notes,diagnosis:e.diagnosis,createdAt:e.createdAt,updatedAt:e.updatedAt,visit:{id:e.visitId,complaint:e.visitComplaint,status:e.visitStatus,patient:{id:e.patientId,name:e.patientName,mrNumber:e.patientMRN},doctor:{id:e.doctorId,name:e.doctorName}}};return n.NextResponse.json(r)}catch(e){return console.error("Error:",e),n.NextResponse.json({message:"Gagal mengambil data pemeriksaan"},{status:500})}}async function p(e,{params:t}){try{let r=await e.json();await (0,d.P)(`UPDATE examinations 
       SET 
        blood_pressure = ?, 
        heart_rate = ?, 
        temperature = ?, 
        weight = ?, 
        height = ?, 
        notes = ?,
        diagnosis = ?,
        updated_at = NOW()
       WHERE id = ?`,[r.bloodPressure,r.heartRate,r.temperature,r.weight,r.height,r.notes,r.diagnosis,t.id]);let[s]=await (0,d.P)(`SELECT 
        e.id, 
        e.blood_pressure as bloodPressure, 
        e.heart_rate as heartRate, 
        e.temperature, 
        e.weight, 
        e.height, 
        e.notes,
        e.diagnosis,
        e.created_at as createdAt,
        e.updated_at as updatedAt,
        v.id as visitId,
        v.complaint as visitComplaint,
        v.status as visitStatus,
        p.id as patientId,
        p.name as patientName,
        p.mrn as patientMRN,
        d.id as doctorId,
        d.name as doctorName
      FROM examinations e
      LEFT JOIN visits v ON e.visit_id = v.id
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN doctors d ON v.doctor_id = d.id
      WHERE e.id = ?`,[t.id]),a={id:s.id,bloodPressure:s.bloodPressure,heartRate:s.heartRate,temperature:s.temperature,weight:s.weight,height:s.height,notes:s.notes,diagnosis:s.diagnosis,createdAt:s.createdAt,updatedAt:s.updatedAt,visit:{id:s.visitId,complaint:s.visitComplaint,status:s.visitStatus,patient:{id:s.patientId,name:s.patientName,mrNumber:s.patientMRN},doctor:{id:s.doctorId,name:s.doctorName}}};return n.NextResponse.json(a)}catch(e){return console.error("Error:",e),n.NextResponse.json({message:"Gagal mengupdate pemeriksaan"},{status:500})}}async function c(e,{params:t}){try{return await (0,d.P)("DELETE FROM examinations WHERE id = ?",[t.id]),n.NextResponse.json({message:"Pemeriksaan berhasil dihapus"})}catch(e){return console.error("Error:",e),n.NextResponse.json({message:"Gagal menghapus pemeriksaan"},{status:500})}}let m=new a.AppRouteRouteModule({definition:{kind:i.RouteKind.APP_ROUTE,page:"/api/examinations/[id]/route",pathname:"/api/examinations/[id]",filename:"route",bundlePath:"app/api/examinations/[id]/route"},resolvedPagePath:"/Volumes/Data-2/PHC/Project/dash-app/app/api/examinations/[id]/route.js",nextConfigOutput:"",userland:s}),{workAsyncStorage:l,workUnitAsyncStorage:h,serverHooks:g}=m;function v(){return(0,o.patchFetch)({workAsyncStorage:l,workUnitAsyncStorage:h})}},96487:()=>{},78335:()=>{},19637:(e,t,r)=>{"use strict";r.d(t,{P:()=>m,XA:()=>c});var s=r(60820),a=r(95482),i=r(79551),o=r(33873);let n=(0,i.fileURLToPath)("file:///Volumes/Data-2/PHC/Project/dash-app/lib/db.js"),d=(0,o.dirname)(n),u=(0,o.resolve)(d,"..");a.config({path:(0,o.resolve)(u,".env")}),console.log("Database configuration:",{host:"localhost",user:"root",database:"phc_dashboard"});let p=s.createPool({host:"localhost",user:"root",password:"pr1k1t1w",database:"phc_dashboard",waitForConnections:!0,connectionLimit:10,queueLimit:0,debug:!1,connectTimeout:1e4,typeCast:function(e,t){return"TINY"===e.type&&1===e.length?"1"===e.string():t()}});async function c(){try{return await p.getConnection()}catch(e){throw console.error("Error getting DB connection:",e),Error("Database connection failed")}}async function m(e,t=[]){try{let r=t.map(e=>"number"==typeof e?Number(e):e);console.log("Executing SQL with params:",{sql:e,formattedParams:r});let[s]=await p.execute(e,r);return s}catch(e){throw console.error("Database query error:",e),e}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[5994,5452,6673],()=>r(55607));module.exports=s})();