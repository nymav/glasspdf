import { PDFDocument, degrees } from 'pdf-lib';
import { pageIndices } from './policy.mjs';
export async function processFile(bytes,mime,command){
 const pdf=await PDFDocument.create();
 if(command.tool==='pdf'&&['image/jpeg','image/png'].includes(mime)){
  const img=mime==='image/png'?await pdf.embedPng(bytes):await pdf.embedJpg(bytes);const size=img.width>img.height?[841.89,595.28]:[595.28,841.89];const scale=Math.min((size[0]-48)/img.width,(size[1]-48)/img.height);const w=img.width*scale,h=img.height*scale;pdf.addPage(size).drawImage(img,{x:(size[0]-w)/2,y:(size[1]-h)/2,width:w,height:h});
 }else{
  if(mime!=='application/pdf')throw new Error('This command requires a PDF.');
  const source=await PDFDocument.load(bytes);if(source.getPageCount()>100)throw new Error('Free jobs support up to 100 pages.');
  const indices=command.tool==='extract'?pageIndices(command.range,source.getPageCount()):source.getPageIndices();
  for(const page of await pdf.copyPages(source,indices)){if(command.tool==='rotate')page.setRotation(degrees((page.getRotation().angle+command.angle)%360));pdf.addPage(page);}
 }
 pdf.setProducer('GlassPDF');return pdf.save();
}
