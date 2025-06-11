(()=>{var t={};t.id=5796,t.ids=[5796],t.modules={28303:t=>{function e(t){var e=Error("Cannot find module '"+t+"'");throw e.code="MODULE_NOT_FOUND",e}e.keys=()=>[],e.resolve=e,e.id=28303,t.exports=e},10846:t=>{"use strict";t.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},44870:t=>{"use strict";t.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3295:t=>{"use strict";t.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},29294:t=>{"use strict";t.exports=require("next/dist/server/app-render/work-async-storage.external.js")},63033:t=>{"use strict";t.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},79428:t=>{"use strict";t.exports=require("buffer")},55511:t=>{"use strict";t.exports=require("crypto")},94735:t=>{"use strict";t.exports=require("events")},29021:t=>{"use strict";t.exports=require("fs")},91645:t=>{"use strict";t.exports=require("net")},21820:t=>{"use strict";t.exports=require("os")},33873:t=>{"use strict";t.exports=require("path")},19771:t=>{"use strict";t.exports=require("process")},27910:t=>{"use strict";t.exports=require("stream")},41204:t=>{"use strict";t.exports=require("string_decoder")},66136:t=>{"use strict";t.exports=require("timers")},34631:t=>{"use strict";t.exports=require("tls")},79551:t=>{"use strict";t.exports=require("url")},28354:t=>{"use strict";t.exports=require("util")},74075:t=>{"use strict";t.exports=require("zlib")},18049:(t,e,r)=>{"use strict";r.r(e),r.d(e,{patchFetch:()=>g,routeModule:()=>m,serverHooks:()=>x,workAsyncStorage:()=>l,workUnitAsyncStorage:()=>v});var s={};r.r(s),r.d(s,{DELETE:()=>c,GET:()=>u,PUT:()=>p});var a=r(42706),o=r(28203),i=r(45994),n=r(39187),d=r(19637);async function u(t,{params:e}){try{let[t]=await (0,d.P)(`SELECT 
        v.id, 
        v.complaint, 
        v.treatment, 
        v.notes, 
        v.status, 
        v.room,
        v.created_at as createdAt,
        v.updated_at as updatedAt,
        p.id as patientId, 
        p.name as patientName, 
        p.mrn as patientMRN,
        d.id as doctorId, 
        d.name as doctorName
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN doctors d ON v.doctor_id = d.id
      WHERE v.id = ?`,[e.id]);if(!t)return n.NextResponse.json({message:"Kunjungan tidak ditemukan"},{status:404});let r={id:t.id,complaint:t.complaint,treatment:t.treatment,notes:t.notes,status:t.status,room:t.room,createdAt:t.createdAt,updatedAt:t.updatedAt,patient:{id:t.patientId,name:t.patientName,mrNumber:t.patientMRN},doctor:{id:t.doctorId,name:t.doctorName},examinations:[]};return n.NextResponse.json(r)}catch(t){return console.error("Error:",t),n.NextResponse.json({message:"Gagal mengambil data kunjungan"},{status:500})}}async function p(t,{params:e}){try{let r=await t.json();await (0,d.P)(`UPDATE visits 
       SET 
        patient_id = ?, 
        doctor_id = ?, 
        room = ?, 
        complaint = ?, 
        treatment = ?, 
        notes = ?, 
        status = ?,
        updated_at = NOW()
       WHERE id = ?`,[r.patientId,r.doctorId,r.room,r.complaint,r.treatment,r.notes,r.status,e.id]);let[s]=await (0,d.P)(`SELECT 
        v.id, 
        v.complaint, 
        v.treatment, 
        v.notes, 
        v.status, 
        v.room,
        v.created_at as createdAt,
        v.updated_at as updatedAt,
        p.id as patientId, 
        p.name as patientName, 
        p.mrn as patientMRN,
        d.id as doctorId, 
        d.name as doctorName
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN doctors d ON v.doctor_id = d.id
      WHERE v.id = ?`,[e.id]),a={id:s.id,complaint:s.complaint,treatment:s.treatment,notes:s.notes,status:s.status,room:s.room,createdAt:s.createdAt,updatedAt:s.updatedAt,patient:{id:s.patientId,name:s.patientName,mrNumber:s.patientMRN},doctor:{id:s.doctorId,name:s.doctorName},examinations:[]};return n.NextResponse.json(a)}catch(t){return console.error("Error:",t),n.NextResponse.json({message:"Gagal mengupdate kunjungan"},{status:500})}}async function c(t,{params:e}){try{return await (0,d.P)("DELETE FROM visits WHERE id = ?",[e.id]),n.NextResponse.json({message:"Kunjungan berhasil dihapus"})}catch(t){return console.error("Error:",t),n.NextResponse.json({message:"Gagal menghapus kunjungan"},{status:500})}}let m=new a.AppRouteRouteModule({definition:{kind:o.RouteKind.APP_ROUTE,page:"/api/visits/[id]/route",pathname:"/api/visits/[id]",filename:"route",bundlePath:"app/api/visits/[id]/route"},resolvedPagePath:"/Volumes/Data-2/PHC/Project/dash-app/app/api/visits/[id]/route.js",nextConfigOutput:"",userland:s}),{workAsyncStorage:l,workUnitAsyncStorage:v,serverHooks:x}=m;function g(){return(0,i.patchFetch)({workAsyncStorage:l,workUnitAsyncStorage:v})}},96487:()=>{},78335:()=>{},19637:(t,e,r)=>{"use strict";r.d(e,{P:()=>m,XA:()=>c});var s=r(60820),a=r(95482),o=r(79551),i=r(33873);let n=(0,o.fileURLToPath)("file:///Volumes/Data-2/PHC/Project/dash-app/lib/db.js"),d=(0,i.dirname)(n),u=(0,i.resolve)(d,"..");a.config({path:(0,i.resolve)(u,".env")}),console.log("Database configuration:",{host:"localhost",user:"root",database:"phc_dashboard"});let p=s.createPool({host:"localhost",user:"root",password:"pr1k1t1w",database:"phc_dashboard",waitForConnections:!0,connectionLimit:10,queueLimit:0,debug:!1,connectTimeout:1e4,typeCast:function(t,e){return"TINY"===t.type&&1===t.length?"1"===t.string():e()}});async function c(){try{return await p.getConnection()}catch(t){throw console.error("Error getting DB connection:",t),Error("Database connection failed")}}async function m(t,e=[]){try{let r=e.map(t=>"number"==typeof t?Number(t):t);console.log("Executing SQL with params:",{sql:t,formattedParams:r});let[s]=await p.execute(t,r);return s}catch(t){throw console.error("Database query error:",t),t}}}};var e=require("../../../../webpack-runtime.js");e.C(t);var r=t=>e(e.s=t),s=e.X(0,[5994,5452,6673],()=>r(18049));module.exports=s})();