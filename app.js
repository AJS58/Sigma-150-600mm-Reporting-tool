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
  const W = 210, H = 297;
  const blue = [0, 94, 211];
  const dark = [8, 18, 32];
  const pale = [239, 246, 255];
  const line = [200, 209, 222];
  let y = 12;

  // Page base
  doc.setFillColor(255,255,255);
  doc.rect(0,0,W,H,'F');
  doc.setDrawColor(225,225,225);
  doc.rect(5,5,W-10,H-10);

  // Header
  doc.setFillColor(...dark);
  doc.roundedRect(10,10,190,37,2,2,'F');
  try {
    const logo = await imageToDataUrl('assets/cameracal-logo.png');
    doc.setFillColor(255,255,255);
    doc.roundedRect(14,14,70,29,1.5,1.5,'F');
    doc.addImage(logo,'PNG',16,15.5,66,25.5);
  } catch(e) {
    doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.setTextColor(255,255,255);
    doc.text('CAMERACAL SERVICES',16,28);
  }
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold'); doc.setFontSize(18);
  doc.text('Sigma 150-600mm',92,23);
  doc.text('USB Dock Calibration Report',92,32);
  doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(220,230,242);
  doc.text('Calibration performed using Sigma USB Dock and Sigma Optimization Pro software',92,41);
  y = 55;

  // Detail cards
  sectionBar(doc,'CUSTOMER DETAILS',10,y,190); y += 8;
  drawInfoGrid(doc, y, [
    ['Customer Name', val('customerName') || '—'],
    ['Reference Number', val('reference') || '—'],
    ['Date of Calibration', ukDate(val('date')) || '—'],
    ['Technician', val('technician') || '—']
  ], 4);
  y += 24;

  sectionBar(doc,'LENS INFORMATION',10,y,190); y += 8;
  drawInfoGrid(doc, y, [
    ['Camera Body', val('cameraBody') || '—'],
    ['Lens Model', val('lensModel') || '—'],
    ['Lens Version', val('lensVersion') || '—'],
    ['Lens Mount', val('mount') || '—'],
    ['Serial Number', val('serialNumber') || '—'],
    ['Firmware Version', val('firmware') || '—']
  ], 3);
  y += 35;

  sectionBar(doc,'CALIBRATION RESULTS',10,y,190); y += 8;
  doc.setFont('helvetica','italic'); doc.setFontSize(9.2); doc.setTextColor(50,50,50);
  doc.text('Adjustments were applied using the Sigma USB Dock and Sigma Optimization Pro software at Cameracal’s selected practical working distances.',12,y+3,{maxWidth:184});
  y += 13;
  drawCalTable(doc,y); y += 60;
  doc.setFont('helvetica','italic'); doc.setFontSize(8.6); doc.setTextColor(70,70,70);
  doc.text('Note: Working distances are measured from the front of the lens to the test target.',12,y); y += 8;

  sectionBar(doc,'LENS CONFIGURATION',10,y,190,'Optional'); y += 9;
  drawConfiguration(doc,y); y += 29;

  sectionBar(doc,'TECHNICIAN NOTES',10,y,190,'Optional'); y += 9;
  drawNotesBox(doc,y); y += 34;

  // Footer
  doc.setDrawColor(...line);
  doc.line(10,258,200,258);
  doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(20,20,20);
  doc.text('Thank you for trusting Cameracal Services with your equipment.', W/2, 265, {align:'center'});
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...blue);
  doc.text('Cameracal Services',12,276);
  doc.setFont('helvetica','normal'); doc.setFontSize(8.6); doc.setTextColor(40,40,40);
  doc.text('Professional Camera & Lens Calibration',12,282);
  doc.text('Sensor Cleaning  •  Autofocus Optimisation  •  Training',12,287);
  doc.setTextColor(...blue); doc.text('www.cameracalservices.co.uk',12,292);

  // Filename
  const filename = (val('reference') || 'Sigma-150-600-Calibration-Report').replace(/[^a-z0-9-_]/gi,'-') + '.pdf';
  doc.save(filename);
}

function ukDate(d){ if(!d) return ''; const [yy,mm,dd]=d.split('-'); return `${dd}/${mm}/${yy}`; }

function sectionBar(doc,title,x,y,w,tag=''){
  doc.setFillColor(235,242,252);
  doc.setDrawColor(196,209,226);
  doc.roundedRect(x,y,w,7,1.2,1.2,'FD');
  doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(0,86,190);
  doc.text(title,x+3,y+5);
  if(tag){
    doc.setFont('helvetica','normal'); doc.setFontSize(8.8); doc.setTextColor(80,80,80);
    doc.text(`(${tag})`,x+45,y+5);
  }
}

function drawInfoGrid(doc,y,items,cols){
  const x=10, w=190, gap=2;
  const cellW = (w - (cols-1)*gap)/cols;
  const rows = Math.ceil(items.length/cols);
  const cellH = 12;
  doc.setFontSize(8.2);
  items.forEach((item,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const cx=x+col*(cellW+gap), cy=y+row*(cellH+2);
    doc.setDrawColor(220,226,235); doc.setFillColor(252,253,255);
    doc.roundedRect(cx,cy,cellW,cellH,1,1,'FD');
    doc.setFont('helvetica','bold'); doc.setTextColor(40,40,40);
    doc.text(item[0]+':',cx+2,cy+4.5);
    doc.setFont('helvetica','normal'); doc.setTextColor(15,15,15);
    const split = doc.splitTextToSize(String(item[1]),cellW-4);
    doc.text(split.slice(0,2),cx+2,cy+9);
  });
}

function drawCalTable(doc,y){
  const rows=getRows();
  const x=10; const widths=[25,37,42,37,49];
  const headers=['Focal Length','Calibration Distance\n(Working Distance)','Final USB Dock Adjustment\n(-20 to +20)','Optimum Aperture\n(Recommended)','Notes\n(Optional)'];
  doc.setDrawColor(196,209,226);
  doc.setFillColor(230,240,255);
  doc.roundedRect(x,y,190,13,1,1,'FD');
  let cx=x;
  headers.forEach((h,i)=>{
    doc.rect(cx,y,widths[i],13);
    const parts=h.split('\n');
    doc.setFont('helvetica','bold'); doc.setFontSize(7.6); doc.setTextColor(0,65,160);
    doc.text(parts[0],cx+widths[i]/2,y+4.8,{align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(7.2); doc.setTextColor(30,30,30);
    if(parts[1]) doc.text(parts[1],cx+widths[i]/2,y+9.2,{align:'center'});
    cx+=widths[i];
  });
  y+=13;
  rows.forEach((r,idx)=>{
    cx=x;
    doc.setFillColor(idx%2===0 ? 255 : 248, idx%2===0 ? 255 : 250, idx%2===0 ? 255 : 253);
    doc.rect(x,y,190,11,'F');
    const vals=[r.focal,r.distance,sign(r.value),r.aperture,r.notes || ''];
    vals.forEach((v,i)=>{
      doc.setDrawColor(216,224,235); doc.rect(cx,y,widths[i],11);
      if(i===0){ doc.setFont('helvetica','bold'); doc.setFontSize(9.2); }
      else { doc.setFont('helvetica','normal'); doc.setFontSize(8.6); }
      doc.setTextColor(20,20,20);
      if(i===2){
        const n=Number(r.value);
        if(!Number.isNaN(n)){
          const abs=Math.abs(n);
          if(abs<=2) doc.setFillColor(220,252,231);
          else if(abs<=5) doc.setFillColor(254,243,199);
          else doc.setFillColor(254,226,226);
          doc.roundedRect(cx+11,y+2,20,7,1,1,'F');
        }
      }
      const align = i===4 ? 'left' : 'center';
      const tx = i===4 ? cx+3 : cx+widths[i]/2;
      const text = doc.splitTextToSize(String(v), widths[i]-5).slice(0,2);
      doc.text(text,tx,y+7,{align});
      cx+=widths[i];
    });
    y+=11;
  });
}

function drawConfiguration(doc,y){
  const items=[
    ['AF Speed Priority',val('afSpeed') || '—'],
    ['OS (Stabiliser) Mode',val('osMode') || '—'],
    ['Focus Limiter',val('focusLimiter') || '—'],
    ['Custom Mode C1',val('c1') || '—'],
    ['Custom Mode C2',val('c2') || '—'],
    ['Firmware Updated',val('firmwareUpdated') || '—']
  ];
  const x=10,w=190,gap=2,cols=3,cellW=(w-(cols-1)*gap)/cols,cellH=12;
  items.forEach((it,i)=>{
    const col=i%cols,row=Math.floor(i/cols),cx=x+col*(cellW+gap),cy=y+row*(cellH+2);
    doc.setDrawColor(220,226,235); doc.setFillColor(252,253,255);
    doc.roundedRect(cx,cy,cellW,cellH,1,1,'FD');
    doc.setFont('helvetica','bold'); doc.setFontSize(8.2); doc.setTextColor(35,35,35);
    doc.text(it[0]+':',cx+2,cy+4.7);
    doc.setFont('helvetica','normal'); doc.setFontSize(8.3); doc.setTextColor(15,15,15);
    doc.text(doc.splitTextToSize(String(it[1]),cellW-4).slice(0,1),cx+2,cy+9.2);
  });
}

function drawNotesBox(doc,y){
  doc.setDrawColor(196,209,226); doc.setFillColor(252,253,255);
  doc.roundedRect(10,y,190,27,1.2,1.2,'FD');
  doc.setFont('helvetica','normal'); doc.setFontSize(8.6); doc.setTextColor(25,25,25);
  const notes = val('technicianNotes') || '—';
  const lines = doc.splitTextToSize(notes,182).slice(0,6);
  doc.text(lines,14,y+6);
}

function sign(v){ if(v === '') return ''; const n=Number(v); if(Number.isNaN(n)) return v; return n>0 ? '+'+n : String(n); }
