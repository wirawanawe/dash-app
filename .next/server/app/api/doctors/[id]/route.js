(()=>{var e={};e.id=6676,e.ids=[6676],e.modules={28303:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=28303,e.exports=t},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},79428:e=>{"use strict";e.exports=require("buffer")},55511:e=>{"use strict";e.exports=require("crypto")},94735:e=>{"use strict";e.exports=require("events")},29021:e=>{"use strict";e.exports=require("fs")},91645:e=>{"use strict";e.exports=require("net")},21820:e=>{"use strict";e.exports=require("os")},33873:e=>{"use strict";e.exports=require("path")},19771:e=>{"use strict";e.exports=require("process")},27910:e=>{"use strict";e.exports=require("stream")},41204:e=>{"use strict";e.exports=require("string_decoder")},66136:e=>{"use strict";e.exports=require("timers")},34631:e=>{"use strict";e.exports=require("tls")},79551:e=>{"use strict";e.exports=require("url")},28354:e=>{"use strict";e.exports=require("util")},74075:e=>{"use strict";e.exports=require("zlib")},48043:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>h,routeModule:()=>l,serverHooks:()=>g,workAsyncStorage:()=>m,workUnitAsyncStorage:()=>x});var s={};r.r(s),r.d(s,{DELETE:()=>p,GET:()=>c,PUT:()=>d});var o=r(42706),a=r(28203),i=r(45994),n=r(39187),u=r(19637);async function c(e,{params:t}){try{let[e]=await (0,u.P)(`SELECT 
        id, 
        name, 
        specialist, 
        license_number, 
        phone, 
        email, 
        address,
        created_at as createdAt, 
        updated_at as updatedAt
      FROM doctors
      WHERE id = ?`,[t.id]);if(!e)return n.NextResponse.json({message:"Dokter tidak ditemukan"},{status:404});return n.NextResponse.json(e)}catch(e){return console.error("Database error:",e),n.NextResponse.json({message:"Gagal mengambil data dokter",error:e.message},{status:500})}}async function d(e,{params:t}){try{let{name:r,specialist:s,license_number:o,phone:a,email:i,address:c}=await e.json();if(!r)return n.NextResponse.json({message:"Nama dokter harus diisi"},{status:400});let[d]=await (0,u.P)("SELECT * FROM doctors WHERE id = ?",[t.id]);if(!d)return n.NextResponse.json({message:"Dokter tidak ditemukan"},{status:404});await (0,u.P)(`UPDATE doctors SET 
        name = ?, 
        specialist = ?, 
        license_number = ?, 
        phone = ?, 
        email = ?, 
        address = ?,
        updated_at = NOW()
      WHERE id = ?`,[r,s||null,o||null,a||null,i||null,c||null,t.id]);let[p]=await (0,u.P)(`SELECT 
        id, 
        name, 
        specialist, 
        license_number, 
        phone, 
        email, 
        address,
        created_at as createdAt, 
        updated_at as updatedAt
      FROM doctors
      WHERE id = ?`,[t.id]);return n.NextResponse.json(p)}catch(e){return console.error("Error updating doctor:",e),n.NextResponse.json({message:"Gagal mengupdate dokter",error:e.message},{status:500})}}async function p(e,{params:t}){try{let[e]=await (0,u.P)("SELECT id FROM doctors WHERE id = ?",[t.id]);if(!e)return n.NextResponse.json({message:"Dokter tidak ditemukan"},{status:404});return await (0,u.P)("DELETE FROM doctors WHERE id = ?",[t.id]),n.NextResponse.json({success:!0,message:"Dokter berhasil dihapus"})}catch(e){return console.error("Error deleting doctor:",e),n.NextResponse.json({message:"Gagal menghapus dokter",error:e.message},{status:500})}}let l=new o.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/doctors/[id]/route",pathname:"/api/doctors/[id]",filename:"route",bundlePath:"app/api/doctors/[id]/route"},resolvedPagePath:"/Volumes/Data-2/PHC/Project/dash-app/app/api/doctors/[id]/route.js",nextConfigOutput:"",userland:s}),{workAsyncStorage:m,workUnitAsyncStorage:x,serverHooks:g}=l;function h(){return(0,i.patchFetch)({workAsyncStorage:m,workUnitAsyncStorage:x})}},96487:()=>{},78335:()=>{},19637:(e,t,r)=>{"use strict";r.d(t,{P:()=>l,XA:()=>p});var s=r(60820),o=r(95482),a=r(79551),i=r(33873);let n=(0,a.fileURLToPath)("file:///Volumes/Data-2/PHC/Project/dash-app/lib/db.js"),u=(0,i.dirname)(n),c=(0,i.resolve)(u,"..");o.config({path:(0,i.resolve)(c,".env")}),console.log("Database configuration:",{host:"localhost",user:"root",database:"phc_dashboard"});let d=s.createPool({host:"localhost",user:"root",password:"pr1k1t1w",database:"phc_dashboard",waitForConnections:!0,connectionLimit:10,queueLimit:0,debug:!1,connectTimeout:1e4,typeCast:function(e,t){return"TINY"===e.type&&1===e.length?"1"===e.string():t()}});async function p(){try{return await d.getConnection()}catch(e){throw console.error("Error getting DB connection:",e),Error("Database connection failed")}}async function l(e,t=[]){try{let r=t.map(e=>"number"==typeof e?Number(e):e);console.log("Executing SQL with params:",{sql:e,formattedParams:r});let[s]=await d.execute(e,r);return s}catch(e){throw console.error("Database query error:",e),e}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[5994,5452,6673],()=>r(48043));module.exports=s})();