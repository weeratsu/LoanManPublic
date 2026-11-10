/* ข้อมูล: ดึงจาก Google Sheet (public endpoint, อ่านอย่างเดียว ไม่มี token) — ถ้าไม่ได้ ใช้ data.js สำรอง */
var LMP_SRC='';
async function lmpItems(){var u=(window.LMP_CFG&&LMP_CFG.endpoint)||'';
  if(/^https:/.test(u)){for(var i=0;i<3;i++){try{if(i){$('pinMsg').textContent='⏳ กำลังปลุก Google…';await new Promise(function(r){setTimeout(r,i*2500)});}
    var r=await fetch(u+'?action=pub&t='+Date.now()),j=JSON.parse(await r.text());if(j&&j.ok&&j.items&&j.items.length){LMP_SRC='sheet';return j.items;}}catch(e){}}}
  LMP_SRC='file';return (window.LMP_DATA&&LMP_DATA.items)||[];}
/* LoanManPublic — read only, ไม่มี localStorage/แก้ไข/import/export */
var DB={people:[],debtors:[],txns:[]},CH={},COL=['#2a64b8','#e67e22','#27ae60','#8e44ad','#c0392b'],KIND={daily:'เงินสด ดอกรายวัน',card:'ผ่อนบัตร',hist:'ประวัติ'};
function chart(id,cfg){if(typeof Chart==='undefined')return;try{if(CH[id])CH[id].destroy();CH[id]=new Chart($(id),cfg);}catch(e){}}
function safeRender(){renderC();}
var busy=false;
async function unlock(){if(busy)return;var pin=$('pin').value.trim(),m=$('pinMsg');if(!pin)return;busy=true;m.textContent='กำลังตรวจสอบ…';
  var its=await lmpItems(),ok=null;
  if(!window.crypto||!crypto.subtle){m.textContent='⚠ browser นี้ใช้ถอดรหัสไม่ได้ (ต้องเปิดผ่าน https หรือ Chrome/Edge)';busy=false;return;}
  if(!its.length){m.textContent='⚠ ไม่พบข้อมูลใน data.js';busy=false;return;}
  var err='';for(var i=0;i<its.length&&!ok;i++){try{ok=await lmDec(pin,its[i]);}catch(e){if(e&&e.name!=='OperationError')err=e.name+': '+e.message;}}
  if(!ok){m.textContent=err?'⚠ '+err:'PIN ไม่ถูกต้อง ('+its.length+' ชุดข้อมูล)';setTimeout(function(){busy=false;m.textContent='';},2000);$('pin').value='';return;}
  DB=ok;busy=false;$('pin').value='';$('pinBox').classList.add('hide');$('view').classList.remove('hide');$('lockBtn').style.display='';render();}
function render(){var p=DB.people[0];$('who').textContent='👤 '+p.name;$('upd').textContent='ข้อมูล ณ '+new Date(DB.at).toLocaleString('th-TH')+(LMP_SRC==='sheet'?' · ☁ ล่าสุดจาก Sheet':' · 📄 จากไฟล์');
  var L=DB.debtors.map(function(d){return {d:d,c:calc(d,0,0)}}).sort(function(a,b){var x=isClosed(a.d,a.c)?1:0,y=isClosed(b.d,b.c)?1:0;return x-y||(b.d.start||'').localeCompare(a.d.start||'')});
  var T={P:0,I:0,paid:0,pI:0,n:0};L.forEach(function(o){var cl=isClosed(o.d,o.c);if(!cl){T.n++;T.I+=o.c.I;}T.P+=o.c.P;T.paid+=o.c.tot.paid;T.pI+=o.c.tot.paidI;});
  var DU=dueSum(L.map(function(o){return o.d}));$('kpis').innerHTML='<div class="kpi" style="grid-column:1/-1;background:#fff8e6;border-left:4px solid #e67e22" title="'+DU.tip+'"><small>💡 ยอดที่ต้องคืนงวดนี้ (ทุกสัญญา ณ วันนี้)'+(DU.end?' · ภายใน '+dmy(DU.end):'')+'</small><b class="pos">'+f(DU.left)+'</b> <small>ดิว '+f(DU.due)+' · คืนแล้ว '+f(DU.paid)+'</small></div>'+[['ยอดคงเหลือ',f(T.P),'pos'],['ดอกสะสมถึงวันนี้',f(T.I),''],['รวมที่ต้องชำระ',f(T.P+T.I),'pos'],['ชำระแล้วรวม',f(T.paid),'neg'],['ดอกที่ชำระแล้ว',f(T.pI),''],['สัญญาที่ยังผ่อน',T.n+' / '+L.length,'']].map(function(k){return '<div class="kpi"><small>'+k[0]+'</small><b class="'+k[2]+'">'+k[1]+'</b></div>'}).join('');
  $('cTbl').innerHTML='<table><tr><th class="l">สัญญา</th><th class="l">ประเภท</th><th>ดอก</th><th>ค่างวด</th><th class="l">เริ่ม</th><th>ยอดยกมา</th><th>ยืมเพิ่ม</th><th>ชำระแล้ว</th><th>ดอกเบี้ยรวม</th><th>คงเหลือ</th><th class="l">สถานะ</th></tr>'+L.map(function(o){var d=o.d,c=o.c,cl=isClosed(d,c);
    return '<tr'+(cl?' class="closed"':'')+'><td class="l"><a href="#" onclick="$(\'selC\').value=\''+d.id+'\';renderC();lmpFlash();return false">'+d.name+'</a></td><td class="l">'+(KIND[d.kind]||KIND.daily)+(d.mname?' · '+d.mname:'')+'</td><td>'+d.rate+'%</td><td>'+f(+d.inst)+'</td><td class="l">'+(d.start||'')+'</td><td>'+f(+d.openP)+'</td><td class="pos">'+f(Math.max((c.tot.lent||0)-(+d.openP||0),0))+'</td><td>'+f(c.tot.paid)+'</td><td>'+f(c.tot.int)+'</td><td class="pos">'+f(c.P)+'</td><td class="l">'+(cl?'✅ ปิดแล้ว':'🟢 ผ่อนอยู่')+'</td></tr>'}).join('')+'</table>';
  renderSh();$('selC').innerHTML=L.map(function(o){return '<option value="'+o.d.id+'">'+o.d.name+(isClosed(o.d,o.c)?' (ปิดแล้ว)':'')+'</option>'}).join('');renderC();}
function renderSh(){var s=DB.shares,el=$('shBox');if(!el)return;if(!s){el.parentNode.style.display='none';return;}el.parentNode.style.display='';
  var hd=s.net<-0.005?'คุณต้องจ่ายคืน <b class="pos">'+f(-s.net)+'</b>':s.net>0.005?'คุณจะได้คืน <b class="neg">'+f(s.net)+'</b>':'✅ เคลียร์แล้ว';
  el.innerHTML='<p>'+hd+'</p>'+(s.settle.length?'<p>'+s.settle.map(function(x){return x.from+' → '+x.to+' <b>'+f(x.amt)+'</b>'}).join('<br>')+'</p>':'')+
  '<div class="tw"><table><tr><th class="l">วันที่</th><th class="l">รายการ</th><th class="l">ใครจ่าย</th><th>ยอดรวม</th><th>ส่วนของคุณ</th></tr>'+s.items.slice().sort(function(a,b){return a.date<b.date?1:-1}).map(function(x){return '<tr'+(x.settle?' class="closed"':'')+'><td class="l">'+x.date+'</td><td class="l">'+(x.title||'-')+'</td><td class="l">'+x.payer+'</td><td>'+f(x.amt)+'</td><td>'+f(x.mine)+'</td></tr>'}).join('')+'</table></div>';}
function renderC(){var d=getD($('selC').value);if(!d)return;var c=calc(d),h='';
  c.per.filter(function(p){return !p.fc}).reverse().concat(c.per.filter(function(p){return p.fc})).forEach(function(p){h+='<tr'+(p.fc&&!p.n?' class="fc"':' class="'+(p.fc?'fc ':'')+'clk" title="คลิกดูรายการของงวดนี้" onclick="perTx(\''+d.id+'\',\''+p.b+'\',\''+(p.nb||'')+'\')"')+'><td>'+p.idx+'</td><td class="l">'+p.b+(p.fc?' 🔮':'')+'</td><td>'+f(p.oP)+'</td><td>'+f(p.int)+'</td><td>'+f(p.due)+'</td><td class="neg">'+(p.paid?f(p.paid):'')+'</td><td class="pos">'+(p.borrow?f(p.borrow):'')+'</td><td>'+f(p.pP)+'</td><td>'+f(p.pI)+'</td><td><b>'+f(p.cP)+'</b></td><td>'+(p.n||'')+'</td></tr>';});
  $('perTbl').innerHTML='<table><tr><th>#</th><th class="l">วันตัดรอบ</th><th>ยอดยกมา</th><th>ดอกงวดนี้</th><th>ยอดดิว</th><th>ชำระ</th><th>ยืมเพิ่ม</th><th>ชำระ:ต้น</th><th>ชำระ:ดอก</th><th>คงเหลือ</th><th>รายการ</th></tr>'+h+'</table>';var pt=$('perTbl');if(pt)pt.scrollTop=0;
  chart('cPer',{plugins:[todayLine(c.per.map(function(p){return p.b}))],type:'line',data:{labels:c.per.map(function(p){return p.b}),datasets:[{label:'คงเหลือ',data:c.per.map(function(p){return +p.cP.toFixed(2)}),borderColor:'#c0392b',backgroundColor:'#c0392b22',fill:true,pointRadius:0,segment:{borderDash:function(x){return c.per[x.p1DataIndex].fc?[6,4]:undefined}}}]}});
  var tx=txOf(d.id).slice().reverse();
  $('txTbl').innerHTML=tx.length?'<table><tr><th class="l">วันที่</th><th class="l">ประเภท</th><th>ชำระ</th><th>ยืม</th><th class="l">วิธีจ่าย</th><th class="l">หมายเหตุ</th></tr>'+tx.map(function(t){return '<tr><td class="l">'+t.date+'</td><td class="l"><span class="tag '+(t.type==='borrow'?'tb">ยืม':'tr">ชำระ')+'</span></td><td class="neg">'+(t.type==='repay'?f(t.amt):'')+'</td><td class="pos">'+(t.type==='borrow'?f(t.amt):'')+'</td><td class="l">'+(t.m||'')+'</td><td class="l">'+(t.note||'')+'</td></tr>'}).join('')+'</table>':'<p class="muted">สัญญานี้ไม่มีรายการยืม/คืน (ผ่อนตามตาราง)</p>';}
$('pin').addEventListener('keydown',function(e){if(e.key==='Enter')unlock();});

/* คลิกสัญญา → เลื่อนไปสรุปงวด + กระพริบแถวงวดที่มีรายการล่าสุด */
function lmpFlash(){var d=getD($('selC').value);if(!d)return;var tx=txOf(d.id),c=calc(d),t=tx[tx.length-1],box=$('perTbl');
  box.scrollIntoView({behavior:'smooth',block:'start'});if(!t)return;
  var p=c.per.find(function(p){return t.date>=p.b&&t.date<(p.nb||'9999')})||c.per.find(function(p){return t.date<=p.b});if(!p)return;
  var tr=[].find.call(box.querySelectorAll('tr'),function(r){return r.cells[1]&&r.cells[1].textContent.trim().indexOf(p.b)===0});if(!tr)return;
  setTimeout(function(){box.scrollTop=Math.max(tr.offsetTop-box.clientHeight/2,0);tr.classList.remove('flash');void tr.offsetWidth;tr.classList.add('flash');},400);}
