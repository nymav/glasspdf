export class Meta{
 constructor(env,store){this.env=env;this.store=store;this.base=`https://graph.facebook.com/${env.META_API_VERSION}`;}
 async call(path,options={}){const r=await fetch(this.base+'/'+path,{...options,headers:{Authorization:'Bearer '+this.env.WHATSAPP_ACCESS_TOKEN,...options.headers},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('WhatsApp provider request failed.');return r.json();}
 async download(id){
  const info=await this.call(encodeURIComponent(id));if(info.file_size>25*1024*1024)throw new Error('File exceeds 25 MB.');const url=new URL(info.url);if(url.protocol!=='https:'||!(url.hostname==='fbsbx.com'||url.hostname.endsWith('.fbsbx.com')||url.hostname==='facebook.com'||url.hostname.endsWith('.facebook.com')))throw new Error('Unexpected media host.');
  const r=await fetch(url,{headers:{Authorization:'Bearer '+this.env.WHATSAPP_ACCESS_TOKEN},redirect:'error',signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('Unable to download media.');const reader=r.body.getReader(),chunks=[];let size=0;
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>25*1024*1024){await reader.cancel();throw new Error('File exceeds 25 MB.');}chunks.push(value);}return {bytes:Buffer.concat(chunks),mime:info.mime_type};
 }
 async send(to,payload){
  const cost=Number(this.env.OUTBOUND_COST_MICRO),limit=Number(this.env.DAILY_BUDGET_MICRO);if(!Number.isSafeInteger(cost)||cost<0||!Number.isSafeInteger(limit)||limit<=0)throw new Error('Cost configuration required.');
  if(!await this.store.budget(cost,limit))throw new Error('Daily spending cap reached.');
  return this.call(this.env.WHATSAPP_PHONE_NUMBER_ID+'/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to,...payload})});
 }
 async text(to,body){return this.send(to,{type:'text',text:{body}});}
 async document(to,bytes){const form=new FormData();form.set('messaging_product','whatsapp');form.set('file',new Blob([bytes],{type:'application/pdf'}),'glasspdf-result.pdf');const media=await this.call(this.env.WHATSAPP_PHONE_NUMBER_ID+'/media',{method:'POST',body:form});try{return await this.send(to,{type:'document',document:{id:media.id,filename:'glasspdf-result.pdf',caption:'Processed by GlassPDF. Your source file is unchanged.'}});}finally{await this.call(media.id,{method:'DELETE'}).catch(()=>{});}}
}
