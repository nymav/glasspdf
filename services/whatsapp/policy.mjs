import { createHmac, timingSafeEqual } from 'node:crypto';
export function validSignature(raw, signature, secret) {
 if (!secret || !/^sha256=[a-f0-9]{64}$/.test(signature || '')) return false;
 const expected = createHmac('sha256', secret).update(raw).digest();
 return timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'));
}
export function parseCommand(text = '') {
 const parts = text.trim().toLowerCase().split(/\s+/);const tool=parts[0];
 if (tool === 'pdf') return {tool:'pdf'};
 if (tool === 'rotate' && ['90','180','270'].includes(parts[1])) return {tool,angle:Number(parts[1])};
 if (tool === 'extract' && /^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/.test(parts[1]||'')) return {tool,range:parts[1]};
 throw new Error('Send a file with caption: pdf, rotate 90, or extract 1-3.');
}
export function pageIndices(range,count){
 const pages=new Set();for(const part of range.split(',')){const [a,b=a]=part.split('-').map(Number);if(a<1||b<a||b>count)throw new Error('Page range is outside the document.');for(let n=a;n<=b;n++)pages.add(n-1);}return [...pages];
}
export function configured(env){return Boolean(env.DATABASE_URL&&env.META_APP_SECRET&&env.WHATSAPP_VERIFY_TOKEN&&env.WHATSAPP_ACCESS_TOKEN&&env.WHATSAPP_PHONE_NUMBER_ID&&/^v\d+\.\d+$/.test(env.META_API_VERSION||'')&&env.ENABLE_OUTBOUND==='true'&&/^\d+$/.test(env.OUTBOUND_COST_MICRO||'')&&Number(env.DAILY_BUDGET_MICRO)>0);}
