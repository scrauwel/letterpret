const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/core.js':'core.js','/app.js':'app.js'};
  if(!files[name]){res.writeHead(404);res.end('Niet gevonden');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(files[name])],'Cache-Control':'no-store'});
  fs.createReadStream(path.join(__dirname,'dist',files[name])).pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('Letterpret: http://127.0.0.1:4173'));
