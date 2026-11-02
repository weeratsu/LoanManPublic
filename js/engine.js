/* ---- engine: billing-cycle (match Excel) ----
 งวดตัดรอบทุกวันที่ d.day · ดอก = ต้นยกมา × วัน × อัตรา/365 (ทบเข้าต้น ณ วันตัดรอบ)
 รายการระหว่าง [วันตัดรอบ, รอบถัดไป) นับเป็นของงวดนั้น · หลังวันนี้ = คาดการณ์ด้วยยอดจ่าย/งวด */
function bdate(y,m,day){var last=new Date(y,m+1,0).getDate();return new Date(y,m,Math.min(day,last));}
function iso(dt){return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');}
function nextB(s,day){var d=D(s);return iso(bdate(d.getFullYear(),d.getMonth()+1,day));}
function firstB(start,day){var d=D(start),b=bdate(d.getFullYear(),d.getMonth(),day);if(iso(b)<=start)b=bdate(d.getFullYear(),d.getMonth()+1,day);return iso(b);}
function addDay(s,n){var d=D(s);d.setDate(d.getDate()+n);return iso(d);}
function calc(d,pay,maxF){
  if(d.kind==='hist'||d.kind==='card')return calcFixed(d,pay);
  var tx=txOf(d.id),day=+d.day||1,r=yr(d),inst=+d.inst||0,td=today();
  if(pay==null)pay=inst;if(maxF==null)maxF=600;if(d.status==='closed')maxF=0;
  var start=d.start||(tx[0]&&tx[0].date);if(!start)return {per:[],P:0,I:0,tot:{lent:0,paid:0,paidI:0,paidP:0,int:0}};
  var P=+d.openP||0,prev=addDay(start,-1),b=firstB(start,day),per=[],k=0,i=0,f=0,last=null;
  var tot={lent:+d.openP||0,paid:0,paidI:0,paidP:0,int:0};
  while(i<1200){i++;
    var nb=nextB(b,day),n=days(prev,b),H=P>0?P*r*n/365:0,J=P+H,real=b<=td,bor=0,rep=0,c=0;
    if(real){while(k<tx.length&&tx[k].date<nb){var t=tx[k++];c++;if(t.type==='borrow')bor+=t.amt;else rep+=t.amt;}}
    else{if(f>=maxF||J<=0.005||!(pay>0))break;rep=Math.min(J,pay);f++;}
    var pI=Math.min(rep,H),due=inst>0?Math.min(inst,Math.max(J,0)):H,dI=Math.min(due,H);
    var p={idx:per.length+1,m:ym(b),b:b,nb:nb,days:n,oP:P,int:H,owe:J,borrow:bor,paid:rep,pI:pI,pP:rep-pI,cP:J-rep+bor,cI:0,due:due,dI:dI,dP:due-dI,net:rep-bor,diff:rep-due,n:c,fc:!real};
    per.push(p);if(real){last=p;tot.lent+=bor;tot.paid+=rep;tot.paidI+=pI;tot.paidP+=rep-pI;tot.int+=H;}
    if(!real&&rep<=H&&f>2){p.never=true;break;}
    if(real&&d.status==='closed'&&k>=tx.length)break;
    P=p.cP;prev=b;b=nb;
    if(real&&k>=tx.length&&nb>td&&!(pay>0)&&maxF===0)break;
  }
  var cur=last?last.cP:(+d.openP||0),acc=last&&cur>0?cur*r*Math.max(days(last.b,td),0)/365:0;
  return {per:per,P:cur,I:acc,tot:tot,last:last};
}
function real(c){return c.per.filter(function(p){return !p.fc});}

/* ---- ประเภทสัญญา: daily (ดอกรายวัน ตามรายการ) / hist (ตารางย้อนหลังนำเข้า) / card (ผ่อนบัตร 0% หรือดอกคงที่) ---- */
function calcFixed(d,pay){var rows=d.rows||[],per=[],td=today(),tot={lent:+d.openP||0,paid:0,paidI:0,paidP:0,int:0};
  if(d.kind==='card'&&!(d.rows&&d.rows.length)){var n=+d.months||1,P=+d.openP||0,ti=P*(+d.rate||0)/100*n/12,ins=(P+ti)/n,b=firstB(d.start,+d.day||1),bal=P;rows=[];
    for(var i=0;i<n;i++){var pI=ti/n,pP=P/n;rows.push({b:b,days:0,oP:bal,int:pI,paid:ins,pI:pI,pP:pP,cP:Math.max(bal-pP,0),fc:b>td});bal-=pP;b=nextB(b,+d.day||1);}}
  rows.forEach(function(r,i){var p={idx:i+1,m:ym(r.b),b:r.b,days:r.days||0,oP:r.oP,int:r.int,borrow:0,paid:r.paid,pI:r.pI,pP:r.pP,cP:r.cP,due:r.paid,dI:r.pI,dP:r.pP,net:r.paid,diff:0,n:r.date?1:0,fc:!!r.fc,pd:r.date};
    per.push(p);if(!p.fc){tot.paid+=p.paid;tot.paidI+=p.pI;tot.paidP+=p.pP;tot.int+=p.int;}});
  var lr=per.filter(function(p){return !p.fc}).pop();return {per:per,P:lr?lr.cP:(+d.openP||0),I:0,tot:tot,last:lr};}
