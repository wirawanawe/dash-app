(()=>{var e={};e.id=7694,e.ids=[7694],e.modules={28303:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=28303,e.exports=t},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},79428:e=>{"use strict";e.exports=require("buffer")},55511:e=>{"use strict";e.exports=require("crypto")},94735:e=>{"use strict";e.exports=require("events")},29021:e=>{"use strict";e.exports=require("fs")},91645:e=>{"use strict";e.exports=require("net")},21820:e=>{"use strict";e.exports=require("os")},33873:e=>{"use strict";e.exports=require("path")},19771:e=>{"use strict";e.exports=require("process")},27910:e=>{"use strict";e.exports=require("stream")},41204:e=>{"use strict";e.exports=require("string_decoder")},66136:e=>{"use strict";e.exports=require("timers")},34631:e=>{"use strict";e.exports=require("tls")},79551:e=>{"use strict";e.exports=require("url")},28354:e=>{"use strict";e.exports=require("util")},74075:e=>{"use strict";e.exports=require("zlib")},12396:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>h,routeModule:()=>p,serverHooks:()=>x,workAsyncStorage:()=>l,workUnitAsyncStorage:()=>m});var s={};r.r(s),r.d(s,{GET:()=>u,POST:()=>d});var a=r(42706),o=r(28203),n=r(45994),i=r(39187),c=r(19637);async function u(e){try{let t=new URL(e.url).searchParams.get("search")||"",r=`
      SELECT 
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
    `,s=[];t&&(r+=" WHERE name LIKE ? OR specialist LIKE ?",s=[`%${t}%`,`%${t}%`]),r+=" ORDER BY name ASC";let a=await (0,c.P)(r,s);return i.NextResponse.json(a)}catch(t){console.error("Error fetching doctors:",t);let e="Gagal mengambil data dokter";return"ER_ACCESS_DENIED_ERROR"===t.code?e="Database connection failed: Access denied":"ECONNREFUSED"===t.code?e="Database connection failed: Connection refused":"ER_NO_SUCH_TABLE"===t.code&&(e="Database error: Table does not exist"),i.NextResponse.json({message:e,code:t.code,sqlMessage:t.sqlMessage},{status:500})}}async function d(e){try{let t=await e.json();if(!t.name)return i.NextResponse.json({message:"Nama dokter harus diisi"},{status:400});let r=`
      INSERT INTO doctors 
      (name, specialist, license_number, phone, email, address, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,s=[t.name,t.specialist||null,t.license_number||null,t.phone||null,t.email||null,t.address||null],a=await (0,c.P)(r,s),[o]=await (0,c.P)(`SELECT 
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
      WHERE id = ?`,[a.insertId]);return i.NextResponse.json(o,{status:201})}catch(e){return console.error("Error creating doctor:",e),i.NextResponse.json({message:"Gagal menambahkan dokter",error:e.message},{status:500})}}let p=new a.AppRouteRouteModule({definition:{kind:o.RouteKind.APP_ROUTE,page:"/api/doctors/route",pathname:"/api/doctors",filename:"route",bundlePath:"app/api/doctors/route"},resolvedPagePath:"/Volumes/Data-2/PHC/Project/dash-app/app/api/doctors/route.js",nextConfigOutput:"",userland:s}),{workAsyncStorage:l,workUnitAsyncStorage:m,serverHooks:x}=p;function h(){return(0,n.patchFetch)({workAsyncStorage:l,workUnitAsyncStorage:m})}},96487:()=>{},78335:()=>{},19637:(e,t,r)=>{"use strict";r.d(t,{P:()=>l,XA:()=>p});var s=r(60820),a=r(95482),o=r(79551),n=r(33873);let i=(0,o.fileURLToPath)("file:///Volumes/Data-2/PHC/Project/dash-app/lib/db.js"),c=(0,n.dirname)(i),u=(0,n.resolve)(c,"..");a.config({path:(0,n.resolve)(u,".env")}),console.log("Database configuration:",{host:"localhost",user:"root",database:"phc_dashboard"});let d=s.createPool({host:"localhost",user:"root",password:"pr1k1t1w",database:"phc_dashboard",waitForConnections:!0,connectionLimit:10,queueLimit:0,debug:!1,connectTimeout:1e4,typeCast:function(e,t){return"TINY"===e.type&&1===e.length?"1"===e.string():t()}});async function p(){try{return await d.getConnection()}catch(e){throw console.error("Error getting DB connection:",e),Error("Database connection failed")}}async function l(e,t=[]){try{let r=t.map(e=>"number"==typeof e?Number(e):e);console.log("Executing SQL with params:",{sql:e,formattedParams:r});let[s]=await d.execute(e,r);return s}catch(e){throw console.error("Database query error:",e),e}}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[5994,5452,6673],()=>r(12396));module.exports=s})();