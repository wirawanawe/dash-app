(()=>{var t={};t.id=3582,t.ids=[3582],t.modules={28303:t=>{function e(t){var e=Error("Cannot find module '"+t+"'");throw e.code="MODULE_NOT_FOUND",e}e.keys=()=>[],e.resolve=e,e.id=28303,t.exports=e},10846:t=>{"use strict";t.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},44870:t=>{"use strict";t.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3295:t=>{"use strict";t.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},29294:t=>{"use strict";t.exports=require("next/dist/server/app-render/work-async-storage.external.js")},63033:t=>{"use strict";t.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},79428:t=>{"use strict";t.exports=require("buffer")},55511:t=>{"use strict";t.exports=require("crypto")},94735:t=>{"use strict";t.exports=require("events")},29021:t=>{"use strict";t.exports=require("fs")},91645:t=>{"use strict";t.exports=require("net")},21820:t=>{"use strict";t.exports=require("os")},33873:t=>{"use strict";t.exports=require("path")},19771:t=>{"use strict";t.exports=require("process")},27910:t=>{"use strict";t.exports=require("stream")},41204:t=>{"use strict";t.exports=require("string_decoder")},66136:t=>{"use strict";t.exports=require("timers")},34631:t=>{"use strict";t.exports=require("tls")},79551:t=>{"use strict";t.exports=require("url")},28354:t=>{"use strict";t.exports=require("util")},74075:t=>{"use strict";t.exports=require("zlib")},61979:(t,e,r)=>{"use strict";r.r(e),r.d(e,{patchFetch:()=>x,routeModule:()=>c,serverHooks:()=>v,workAsyncStorage:()=>m,workUnitAsyncStorage:()=>l});var a={};r.r(a),r.d(a,{GET:()=>u,POST:()=>p});var s=r(42706),o=r(28203),i=r(45994),n=r(39187),d=r(19637);async function u(){try{let t=(await (0,d.P)(`
      SELECT 
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
      ORDER BY v.created_at DESC
    `)).map(t=>({id:t.id,complaint:t.complaint,treatment:t.treatment,notes:t.notes,status:t.status,room:t.room,createdAt:t.createdAt,updatedAt:t.updatedAt,patient:{id:t.patientId,name:t.patientName,mrNumber:t.patientMRN},doctor:{id:t.doctorId,name:t.doctorName},examinations:[]}));return n.NextResponse.json(t)}catch(t){return console.error("Error:",t),n.NextResponse.json({message:"Gagal mengambil data kunjungan"},{status:500})}}async function p(t){try{let e=await t.json(),r=(await (0,d.P)(`INSERT INTO visits 
        (patient_id, doctor_id, room, complaint, treatment, notes, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,[e.patientId,e.doctorId,e.room,e.complaint,e.treatment,e.notes,e.status||"Menunggu"])).insertId,[a]=await (0,d.P)(`SELECT 
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
      WHERE v.id = ?`,[r]),s={id:a.id,complaint:a.complaint,treatment:a.treatment,notes:a.notes,status:a.status,room:a.room,createdAt:a.createdAt,updatedAt:a.updatedAt,patient:{id:a.patientId,name:a.patientName,mrNumber:a.patientMRN},doctor:{id:a.doctorId,name:a.doctorName},examinations:[]};return n.NextResponse.json(s)}catch(t){return console.error("Error:",t),n.NextResponse.json({message:"Gagal menambahkan kunjungan"},{status:500})}}let c=new s.AppRouteRouteModule({definition:{kind:o.RouteKind.APP_ROUTE,page:"/api/visits/route",pathname:"/api/visits",filename:"route",bundlePath:"app/api/visits/route"},resolvedPagePath:"/Volumes/Data-2/PHC/Project/dash-app/app/api/visits/route.js",nextConfigOutput:"",userland:a}),{workAsyncStorage:m,workUnitAsyncStorage:l,serverHooks:v}=c;function x(){return(0,i.patchFetch)({workAsyncStorage:m,workUnitAsyncStorage:l})}},96487:()=>{},78335:()=>{},19637:(t,e,r)=>{"use strict";r.d(e,{P:()=>m,XA:()=>c});var a=r(60820),s=r(95482),o=r(79551),i=r(33873);let n=(0,o.fileURLToPath)("file:///Volumes/Data-2/PHC/Project/dash-app/lib/db.js"),d=(0,i.dirname)(n),u=(0,i.resolve)(d,"..");s.config({path:(0,i.resolve)(u,".env")}),console.log("Database configuration:",{host:"localhost",user:"root",database:"phc_dashboard"});let p=a.createPool({host:"localhost",user:"root",password:"pr1k1t1w",database:"phc_dashboard",waitForConnections:!0,connectionLimit:10,queueLimit:0,debug:!1,connectTimeout:1e4,typeCast:function(t,e){return"TINY"===t.type&&1===t.length?"1"===t.string():e()}});async function c(){try{return await p.getConnection()}catch(t){throw console.error("Error getting DB connection:",t),Error("Database connection failed")}}async function m(t,e=[]){try{let r=e.map(t=>"number"==typeof t?Number(t):t);console.log("Executing SQL with params:",{sql:t,formattedParams:r});let[a]=await p.execute(t,r);return a}catch(t){throw console.error("Database query error:",t),t}}}};var e=require("../../../webpack-runtime.js");e.C(t);var r=t=>e(e.s=t),a=e.X(0,[5994,5452,6673],()=>r(61979));module.exports=a})();