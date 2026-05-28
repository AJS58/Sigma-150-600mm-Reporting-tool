const defaultRows = [
  { focal: '150mm', distance: '4.7 m', value: '0', aperture: 'f/6.3', notes: '' },
  { focal: '250mm', distance: '6.5 m', value: '0', aperture: 'f/7.1', notes: '' },
  { focal: '400mm', distance: '8.5 m', value: '0', aperture: 'f/7.1', notes: '' },
  { focal: '600mm', distance: '12.0 m', value: '0', aperture: 'f/8', notes: '' }
];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('date').value = new Date().toISOString().slice(0,10);
  renderRows();
  document.getElementById('clearBtn').addEventListener('click', clearAll);
  document.getElementById('pdfBtn').addEventListener('click', generatePdf);
});

function renderRows(){
  const tbody = document.getElementById('calibrationRows');
  tbody.innerHTML = '';
  defaultRows.forEach((r,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="focal">${r.focal}</td>
      <td><input id="distance${i}" value="${r.distance}" /></td>
      <td><input id="value${i}" type="number" min="-20" max="20" value="${r.value}" /></td>
      <td><select id="aperture${i}">${apertureOptions(r.aperture)}</select></td>
      <td><input id="notes${i}" placeholder="Enter notes (optional)" /></td>`;
    tbody.appendChild(tr);
  });
}
function apertureOptions(selected){
  return ['f/5.6','f/6.3','f/7.1','f/8','f/9','f/10','f/11'].map(v=>`<option ${v===selected?'selected':''}>${v}</option>`).join('');
}
function val(id){ return document.getElementById(id)?.value || ''; }
function clearAll(){
  ['customerName','reference','cameraBody','serialNumber','firmware','technicianNotes','c1','c2'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('reference').value='CC-SIGMA-001';
  document.getElementById('technician').value='Anthony Sinfield';
  renderRows();
}
function getRows(){
  return defaultRows.map((r,i)=>({
    focal:r.focal, distance:val('distance'+i), value:val('value'+i), aperture:val('aperture'+i), notes:val('notes'+i)
  }));
}
async function imageToDataUrl(url){
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img,0,0);
  return c.toDataURL('image/png');
}
async function generatePdf(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p','mm','a4');
  const W = 210, M = 8;
  let y = 10;
  const logo = await imageToDataUrl('assets/cameracal-logo.png');
  doc.addImage(logo,'PNG',8,8,82,55);
  doc.setFont('helvetica','bold'); doc.setFontSize(21);
  doc.text('Sigma 150-600mm',108,18); doc.text('USB Dock Calibration Report',108,27);
  doc.setFont('helvetica','normal'); doc.setFontSize(11);
  doc.text('Calibration performed using Sigma USB Dock',108,38);
  doc.text('and Sigma Optimization Pro software',108,45);
  y = 62; line(doc,y); y += 9;
  section(doc,'CUSTOMER DETAILS',y); y += 10;
  kvRow(doc,y,[['Customer Name:',val('customerName')],['Reference Number:',val('reference')],['Date of Calibration:',ukDate(val('date'))]]); y += 8;
  kvRow(doc,y,[['Technician:',val('technician')]]); y += 13; line(doc,y); y += 9;
  section(doc,'LENS INFORMATION',y); y += 10;
  kvRow(doc,y,[['Camera Body:',val('cameraBody')],['Lens Model:',val('lensModel')],['Lens Version:',val('lensVersion')]]); y += 8;
  kvRow(doc,y,[['Lens Mount:',val('mount')],['Serial Number:',val('serialNumber')],['Firmware Version:',val('firmware')]]); y += 13; line(doc,y); y += 9;
  section(doc,'CALIBRATION RESULTS',y); y += 7;
  doc.setFont('helvetica','italic'); doc.setFontSize(10);
  doc.text('Adjustments were applied using the Sigma USB Dock and Sigma Optimization Pro software',M+2,y); y += 5;
  doc.text('at Cameracal’s selected practical working distances.',M+2,y); y += 8;
  drawCalTable(doc,y); y += 58;
  doc.setFont('helvetica','italic'); doc.setFontSize(9);
  doc.text('Note: Working distances are measured from the front of the lens to the test target.',M+2,y); y += 9; line(doc,y); y += 8;
  section(doc,'LENS CONFIGURATION',y); doc.setFontSize(10); doc.setTextColor(60); doc.text('(Optional)',65,y); y += 11;
  configBlock(doc,y); y += 24; line(doc,y); y += 8;
  section(doc,'TECHNICIAN NOTES',y); doc.setFontSize(10); doc.setTextColor(60); doc.text('(Optional)',66,y); y += 6;
  doc.setDrawColor(190); doc.roundedRect(M+2,y,190,25,1,1);
  doc.setFont('helvetica','normal'); doc.setTextColor(20); doc.setFontSize(9);
  const notes = doc.splitTextToSize(val('technicianNotes'),184);
  doc.text(notes,M+5,y+6); y += 35;
  line(doc,y); y += 8;
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(20);
  doc.text('Thank you for trusting Cameracal Services with your equipment.', W/2, y, {align:'center'});
  y += 13;
  doc.setFont('helvetica','bold'); doc.setTextColor(0,86,190); doc.text('Cameracal Services',M+2,y);
  doc.setFont('helvetica','normal'); doc.setTextColor(20); y+=6;
  doc.text('Professional Camera & Lens Calibration',M+2,y); y+=5;
  doc.text('Sensor Cleaning  •  Autofocus Optimisation  •  Training',M+2,y); y+=5;
  doc.setTextColor(0,86,190); doc.text('www.cameracalservices.co.uk',M+2,y);
  const filename = (val('reference') || 'Sigma-150-600-Calibration-Report').replace(/[^a-z0-9-_]/gi,'-') + '.pdf';
  doc.save(filename);
}
function ukDate(d){ if(!d) return ''; const [yy,mm,dd]=d.split('-'); return `${dd}/${mm}/${yy}`; }
function line(doc,y){ doc.setDrawColor(140); doc.line(8,y,202,y); }
function section(doc,t,y){ doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(0,86,190); doc.text(t,10,y); doc.setTextColor(20); }
function kvRow(doc,y,pairs){
  const xs=[10,78,150];
  pairs.forEach((p,i)=>{ doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.text(p[0],xs[i],y); doc.setFont('helvetica','normal'); doc.text(String(p[1]||'—'),xs[i]+35,y); });
}
function drawCalTable(doc,y){
  const rows=getRows(); const x=10; const widths=[28,40,48,40,38]; const headers=['Focal Length','Calibration Distance\n(Working Distance)','Final USB Dock Adjustment\n(-20 to +20)','Optimum Aperture\n(Recommended)','Notes\n(Optional)'];
  doc.setFontSize(8.5); doc.setDrawColor(200); doc.setFillColor(234,242,255); doc.rect(x,y,190,14,'FD');
  let cx=x; headers.forEach((h,i)=>{doc.rect(cx,y,widths[i],14); doc.setFont('helvetica','bold'); doc.setTextColor(0,65,160); doc.text(h.split('\n'),cx+widths[i]/2,y+5,{align:'center'}); cx+=widths[i];});
  y+=14; doc.setTextColor(20); doc.setFont('helvetica','normal');
  rows.forEach(r=>{cx=x; const vals=[r.focal,r.distance,sign(r.value),r.aperture,r.notes]; vals.forEach((v,i)=>{doc.rect(cx,y,widths[i],10); if(i===0) doc.setFont('helvetica','bold'); else doc.setFont('helvetica','normal'); doc.text(String(v||''),cx+widths[i]/2,y+6.5,{align:'center',maxWidth:widths[i]-3}); cx+=widths[i];}); y+=10;});
}
function sign(v){ if(v === '') return ''; const n=Number(v); if(Number.isNaN(n)) return v; return n>0 ? '+'+n : String(n); }
function configBlock(doc,y){
  const items=[['AF Speed Priority:',val('afSpeed')],['OS (Stabiliser) Mode:',val('osMode')],['Focus Limiter:',val('focusLimiter')],['Custom Mode C1:',val('c1')||'—'],['Custom Mode C2:',val('c2')||'—']];
  const xs=[10,52,94,136,174];
  items.forEach((it,i)=>{ doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.text(it[0],xs[i],y); doc.setFont('helvetica','normal'); doc.text(String(it[1]),xs[i],y+7,{maxWidth:34}); });
  doc.setFont('helvetica','bold'); doc.text('Firmware Updated:',10,y+18); doc.setFont('helvetica','normal'); doc.text(val('firmwareUpdated'),43,y+18);
}
