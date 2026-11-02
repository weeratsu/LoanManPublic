function $(i){return document.getElementById(i);}
function f(n){return (n||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function D(s){return new Date(s+'T00:00:00');}function days(a,b){return Math.round((D(b)-D(a))/864e5);}
function ym(s){return s.slice(0,7);}function mEnd(m){var y=+m.slice(0,4),mo=+m.slice(5,7);var d=new Date(y,mo,0);return m+'-'+String(d.getDate()).padStart(2,'0');}
function nextM(m){var y=+m.slice(0,4),mo=+m.slice(5,7)+1;if(mo>12){mo=1;y++;}return y+'-'+String(mo).padStart(2,'0');}
function yr(d){return d.rateU==='m'?d.rate*12/100:d.rate/100;}
function getD(id){return DB.debtors.find(function(x){return x.id===id});}
function txOf(id){return DB.txns.filter(function(t){return t.did===id}).sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0});}
function getP(id){return (DB.people||[]).find(function(x){return x.id===id});}
function pName(d){var p=d&&getP(d.pid);return p?p.name:'-';}
function cLabel(d){return pName(d)+' · '+d.name;}
function isClosed(d,c){return d.status==='closed'||(c&&c.P<=0.005&&c.per.length>0);}
function opts(list,val,all){return (all?'<option value="">'+all+'</option>':'')+list.map(function(x){return '<option value="'+x[0]+'"'+(x[0]===val?' selected':'')+'>'+x[1]+'</option>'}).join('');}
function migrate(){if(!DB.people)DB.people=[];if(!DB.banks)DB.banks=[['KBank','กสิกรไทย'],['SCB','ไทยพาณิชย์'],['BBL','กรุงเทพ'],['KTB','กรุงไทย'],['BAY','กรุงศรีอยุธยา'],['ttb','ทีทีบี'],['UOB','ยูโอบี']].map(function(x,i){return {id:'b'+(i+1),name:x[0],full:x[1]}});if(!DB.methods)DB.methods=[{id:'m1',name:'เงินสด',type:'cash'},{id:'m2',name:'โอนเงิน',type:'transfer'}];if(!DB.txns)DB.txns=[];DB.debtors.forEach(function(d){if(!d.pid||!getP(d.pid)){var nm=d.pname||d.person||(DB.people[0]&&DB.people[0].name)||d.name,p=DB.people.find(function(x){return x.name===nm});if(!p){p={id:nextId('p',DB.people),name:nm};DB.people.push(p);}d.pid=p.id;}});repair();bid2mid();}
function nextId(pre,list){var n=0;list.forEach(function(x){var m=new RegExp('^'+pre+'(\\d+)$').exec(x.id||'');if(m)n=Math.max(n,+m[1]);});return pre+(n+1);}
function repair(){var ch=0;
  DB.debtors.forEach(function(d){if(d.pname){var p=DB.people.find(function(x){return x.name===d.pname});if(!p){p={id:nextId('p',DB.people),name:d.pname};DB.people.push(p);}if(d.pid!==p.id){d.pid=p.id;ch++;}}});
  var real=DB.people.filter(function(p){return !DB.debtors.some(function(d){return d.pid===p.id&&d.name===p.name&&d.kind==='card'})});
  DB.people.forEach(function(p){if(real.indexOf(p)<0&&real[0]){DB.debtors.forEach(function(d){if(d.pid===p.id){d.pid=real[0].id;ch++;}});}});
  DB.people=DB.people.filter(function(p){var used=DB.debtors.some(function(d){return d.pid===p.id});if(!used&&DB.debtors.some(function(d){return d.name===p.name})){ch++;return false;}return true;});
  var pm={};DB.people.forEach(function(p){if(!/^p\d+$/.test(p.id)){var n=nextId('p',DB.people);pm[p.id]=n;p.id=n;ch++;}});
  DB.debtors.forEach(function(d){if(pm[d.pid])d.pid=pm[d.pid];});
  var cm={};DB.debtors.slice().sort(function(a,b){return (a.start||'').localeCompare(b.start||'')}).forEach(function(d){if(!/^c\d+$/.test(d.id)){var n=nextId('c',DB.debtors);cm[d.id]=n;d.id=n;ch++;}});
  DB.txns.forEach(function(t){if(cm[t.did])t.did=cm[t.did];});if(cm[cur])cur=cm[cur];return ch;}

/* สัญญาลิงก์วิธีจ่าย (mid) — แปลง bid เดิม → บัตรของธนาคารนั้น (สร้างให้ถ้ายังไม่มี) */
function bid2mid(){DB.debtors.forEach(function(d){if(d.bid&&!d.mid){var m=DB.methods.find(function(x){return x.type==='card'&&x.bid===d.bid});
  if(!m){var b=(DB.banks||[]).find(function(x){return x.id===d.bid});m={id:nextId('m',DB.methods),name:'บัตร '+(b?b.name:d.bid),type:'card',bid:d.bid};DB.methods.push(m);}d.mid=m.id;}if(d.mid)delete d.bid;});}

/* เส้น "วันนี้" บนกราฟรายงวด (labels = วันตัดรอบ YYYY-MM-DD) — วางตามสัดส่วนวันระหว่างงวด */
function todayLine(labels){var td=today();return {id:'todayLine',afterDatasetsDraw:function(ch){var x=ch.scales.x,a=ch.chartArea,n=labels.length;if(!x||!n||td<labels[0]||td>labels[n-1])return;
  var i=0;for(var k=0;k<n;k++)if(labels[k]<=td)i=k;var px=x.getPixelForValue(i);
  if(i<n-1){var fr=days(labels[i],td)/Math.max(days(labels[i],labels[i+1]),1);px+=(x.getPixelForValue(i+1)-px)*fr;}
  var c=ch.ctx,L=px>a.right-90;c.save();c.strokeStyle='#2a64b8';c.lineWidth=1.5;c.setLineDash([4,3]);c.beginPath();c.moveTo(px,a.top);c.lineTo(px,a.bottom);c.stroke();c.setLineDash([]);
  c.fillStyle='#2a64b8';c.beginPath();c.arc(px,a.top,3.5,0,7);c.fill();c.font='600 11px '+(Chart.defaults.font.family||'sans-serif');c.textAlign=L?'right':'left';c.fillText('📍 วันนี้ '+td,px+(L?-6:6),a.top+12);c.restore();}};}

/* คลิกแถวงวด → popup รายการ trx ของงวดนั้น (วันที่ >= วันตัดรอบ และ < วันตัดรอบถัดไป) */
function showPop(title,html){var bg=document.createElement('div');bg.style.cssText='position:fixed;inset:0;background:#0006;z-index:2000;display:flex;align-items:flex-start;justify-content:center;padding:60px 12px;overflow:auto';
  bg.innerHTML='<div style="background:#fff;border-radius:12px;padding:18px;max-width:760px;width:100%;box-shadow:0 10px 40px #0004"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">'+title+'</h3><button class="btn g s">✕ ปิด</button></div><div style="margin-top:12px;overflow:auto">'+html+'</div></div>';
  function cl(){bg.remove();document.removeEventListener('keydown',k,true);}function k(e){if(e.key==='Escape'){cl();e.stopPropagation();e.preventDefault();}}
  bg.querySelector('button').onclick=cl;bg.onclick=function(e){if(e.target===bg)cl();};document.addEventListener('keydown',k,true);document.body.appendChild(bg);}
function perTx(did,b,nb){var d=getD(did),pv=prevB(b,+(d&&d.day)||1),tx=txOf(did).filter(function(t){return t.date>pv&&t.date<=b}),inn=0,out=0;
  var h=tx.map(function(t){if(t.type==='repay')inn+=t.amt;else out+=t.amt;var m=t.m||(t.mid&&typeof mName==='function'?mName(t.mid):'');
    return '<tr><td class="l">'+t.date+'</td><td class="l"><span class="tag '+(t.type==='borrow'?'tb">ยืม':'tr">คืน')+'</span></td><td class="neg">'+(t.type==='repay'?f(t.amt):'')+'</td><td class="pos">'+(t.type==='borrow'?f(t.amt):'')+'</td><td class="l">'+m+'</td><td class="l">'+(t.note||'')+'</td></tr>'}).join('');
  showPop('งวด '+addDay(pv,1)+' → '+b+' (ตัดยอด)'+' · '+(d?d.name:''),tx.length?'<table><tr><th class="l">วันที่</th><th class="l">ประเภท</th><th>คืน</th><th>ยืม</th><th class="l">วิธีจ่าย</th><th class="l">หมายเหตุ</th></tr>'+h+'<tr class="tot"><td class="l">รวม '+tx.length+' รายการ</td><td></td><td>'+f(inn)+'</td><td>'+f(out)+'</td><td class="l" colspan="2">สุทธิ '+f(inn-out)+'</td></tr></table>':'<p class="muted">งวดนี้ไม่มีรายการยืม/คืน'+(d&&d.kind!=='daily'?' (ผ่อนตามตาราง)':'')+'</p>');}
