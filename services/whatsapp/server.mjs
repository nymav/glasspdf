import http from 'node:http';
import { createHmac } from 'node:crypto';
import { validSignature,parseCommand,configured } from './policy.mjs';
import { processFile } from './processing.mjs';
import { Store } from './store.mjs';import { Meta } from './meta.mjs';
const env=process.env;let ready=false,busy=false;let store,meta;
if(configured(env)){store=new Store(env.DATABASE_URL);await store.init();await store.cleanup();meta=new Meta(env,store);ready=true;}
async function job(message){
 const to=message.from,account=createHmac('sha256',env.META_APP_SECRET).update(to).digest('hex');let reserved=false;
 try{
  const attachment=message.document||message.image;
  if(!attachment){await meta.text(to,'GlassPDF Free: 5 successful jobs/day (UTC), 25 MB/file. Send a PDF with caption rotate 90 or extract 1-3; send JPG/PNG with caption pdf. Larger allowances: request Pro at teyrinlabs.com.');return;}
  const command=parseCommand(attachment.caption||'pdf');reserved=await store.reserve(account);
  if(!reserved){await meta.text(to,'You’re on GlassPDF Free and today’s 5 jobs are used. Try tomorrow (UTC), or request Pro at teyrinlabs.com. Pro checkout is not live yet.');return;}
  const {bytes,mime}=await meta.download(attachment.id);const output=await processFile(bytes,mime,command);if(output.length>25*1024*1024)throw new Error('Output too large.');await meta.document(to,output);
 }catch{if(reserved)await store.refund(account);await meta.text(to,'We could not complete this job. It did not consume your processing allowance. Try a smaller supported file or check the command.').catch(()=>{});}
}
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');const reply=(code,body)=>{res.writeHead(code,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end(body);};
 if(req.method==='GET'&&url.pathname==='/health')return reply(200,ready?'ready':'setup-required');
 if(url.pathname!=='/webhook')return reply(404,'Not found');
 if(req.method==='GET'){if(env.WHATSAPP_VERIFY_TOKEN&&url.searchParams.get('hub.mode')==='subscribe'&&url.searchParams.get('hub.verify_token')===env.WHATSAPP_VERIFY_TOKEN)return reply(200,url.searchParams.get('hub.challenge')||'');return reply(403,'Verification failed');}
 if(req.method!=='POST')return reply(405,'Method not allowed');if(!ready)return reply(503,'Setup required');
 try{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1024*1024){reply(413,'Too large');return;}chunks.push(chunk);}const raw=Buffer.concat(chunks);if(!validSignature(raw,req.headers['x-hub-signature-256'],env.META_APP_SECRET))return reply(401,'Invalid signature');const data=JSON.parse(raw);
 const messages=(data.entry||[]).flatMap(e=>(e.changes||[]).filter(c=>c.value?.metadata?.phone_number_id===env.WHATSAPP_PHONE_NUMBER_ID).flatMap(c=>c.value.messages||[]));
 if(busy&&messages.length)return reply(503,'Busy; retry');if(messages.length>20)return reply(503,'Batch too large');
 if(!messages.length)return reply(200,'OK');busy=true;reply(200,'Accepted');
 (async()=>{for(const message of messages){if(!message.id||!message.from||!message.timestamp||Date.now()/1000-Number(message.timestamp)>23*3600)continue;if(await store.claim(message.id))await job(message);}})().catch(()=>console.error('Job batch failed; inspect service health.')).finally(()=>{busy=false;});
 }catch{reply(400,'Invalid request');}
});
server.listen(Number(env.PORT||10000),'0.0.0.0',()=>console.log('GlassPDF WhatsApp backend: '+(ready?'ready':'setup-required')));
