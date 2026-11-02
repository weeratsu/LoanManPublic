/* Sort: คลิกหัวคอลัมน์ = เรียงคอลัมน์นั้น (คลิกซ้ำ = กลับด้าน)
   Shift+คลิก = เพิ่มเป็นเงื่อนไขถัดไป (เช่น สถานะ ▲1 > เริ่ม ▼2) · ปุ่ม ↺ = กลับค่าเริ่มต้น */
var SORT={};
function cellVal(td){var t=(td?td.textContent:'').trim(),n=t.replace(/[,฿%\s]/g,'');if(n!==''&&!isNaN(n))return +n;return t.toLowerCase();}
function cmp(x,y){if(typeof x!==typeof y)return typeof x==='number'?-1:1;return x<y?-1:x>y?1:0;}
function applySort(tb,keys){var rows=[].slice.call(tb.querySelectorAll('tr'));if(!rows.length)return;var head=rows.shift(),p=head.parentNode;
  var tot=rows.filter(function(r){return r.classList.contains('tot')});rows=rows.filter(function(r){return !r.classList.contains('tot')});
  rows.sort(function(a,b){for(var k=0;k<keys.length;k++){var c=cmp(cellVal(a.cells[keys[k].i]),cellVal(b.cells[keys[k].i]))*keys[k].d;if(c)return c;}return 0;});
  rows.concat(tot).forEach(function(r){p.appendChild(r)});
  [].forEach.call(head.cells,function(h,j){var k=-1;keys.forEach(function(x,n){if(x.i===j)k=n;});h.setAttribute('data-s',k<0?'':(keys[k].d>0?' ▲':' ▼')+(keys.length>1?k+1:''));});}
function resetSort(id){delete SORT[id];safeRender();}
document.addEventListener('click',function(e){var th=e.target.closest('th');if(!th)return;var tb=th.closest('table'),c=tb&&tb.parentElement;if(!c||!c.id)return;
  var i=[].indexOf.call(th.parentElement.cells,th),ks=SORT[c.id]||[],ex=ks.filter(function(k){return k.i===i})[0];
  if(e.shiftKey){if(ex)ex.d=-ex.d;else ks.push({i:i,d:1});}
  else ks=[{i:i,d:ex&&ks.length===1&&ex.d===1?-1:1}];
  SORT[c.id]=ks;applySort(tb,ks);});
function reSort(){Object.keys(SORT).forEach(function(k){var c=document.getElementById(k),tb=c&&c.querySelector('table');if(tb)applySort(tb,SORT[k]);});}
