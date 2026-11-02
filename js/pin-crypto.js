/* PIN crypto: PBKDF2-SHA256 200k → AES-GCM 256 */
function b64(u){u=new Uint8Array(u);var s='';for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s);}
function ub64(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
async function lmKey(pin,salt){var k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:200000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function lmEnc(pin,obj){var s=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),k=await lmKey(pin,s);
  var c=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},k,new TextEncoder().encode(JSON.stringify(obj)));return {s:b64(s),i:b64(iv),c:b64(c)};}
async function lmDec(pin,it){var k=await lmKey(pin,ub64(it.s));var p=await crypto.subtle.decrypt({name:'AES-GCM',iv:ub64(it.i)},k,ub64(it.c));return JSON.parse(new TextDecoder().decode(p));}
