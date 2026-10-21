/* Fuente única de Blog y Noticias (prototipo local, no backend). */
(() => {
 'use strict';
 const KEY='cran_ensenada_articulos_v1';
 const original=window.CRAN_ARTICULOS||{blog:[],noticias:[]};
 const clone=x=>JSON.parse(JSON.stringify(x));
 const defaults=clone(original);
 function validPost(p){return !!(p&&typeof p.id==='string'&&typeof p.title==='string'&&Array.isArray(p.sections));}
 function normalized(raw){
   const result={};
   for(const type of ['blog','noticias']){
     const group=Array.isArray(raw?.[type])?raw[type]:[];
     result[type]=group.filter(validPost).slice(0,100).map(p=>({
       id:p.id.slice(0,120),title:p.title.slice(0,150),category:String(p.category||'GENERAL').slice(0,80),
       subtitle:String(p.subtitle||'').slice(0,400),date:String(p.date||'Publicación local').slice(0,90),
       read:String(p.read||'3 min de lectura').slice(0,55),
       photo:cleanPhoto(p.photo),link:cleanLink(p.link),linktext:String(p.linktext||'Seguir explorando').slice(0,80),
       sections:p.sections.filter(x=>Array.isArray(x)&&x.length>=2).slice(0,12)
         .map(x=>[String(x[0]).slice(0,130),String(x[1]).slice(0,1800)])
     }));
   }
   return result;
 }
 function cleanPhoto(url){
   const s=String(url||'');
   if(/^(?:assets\/|img\/|\.\.\/img\/)[a-z0-9\/_.-]+\.(?:webp|png|jpe?g|svg)$/i.test(s))return s;
   if(/^https:\/\/[^\s]+$/i.test(s))return s;
   if(/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(s) && s.length<650000)return s;
   return 'assets/cosecha-en-ensenada.webp';
 }
 const allowedLinks=['recetas.html','productos.html','nosotros.html','blog.html','noticias.html','index.html'];
 const cleanLink=link=>allowedLinks.includes(link)?link:'productos.html';
 let all=defaults;
 function reload(){
   try {const saved=localStorage.getItem(KEY);all=saved?normalized(JSON.parse(saved)):clone(defaults);} 
   catch {all=clone(defaults);}
   return all;
 }
 function save(updated){
   const next=normalized(updated);
   try {localStorage.setItem(KEY,JSON.stringify(next));}
   catch {return false;}
   all=next;
   document.dispatchEvent(new CustomEvent('cran:articulos-changed'));
   return true;
 }
 function restore(type){const next=clone(all);next[type]=clone(defaults[type]);return save(next);}
 const isAdmin=()=>{try{return sessionStorage.getItem('cran_ensenada_admin_demo_v2')!=='false';}catch{return true;}};
 window.CranArticulos={get:()=>all,save,reload,restore,isAdmin,cleanPhoto,cleanLink,defaults};
 reload();
 window.addEventListener('storage',event=>{if(event.key===KEY){reload();document.dispatchEvent(new CustomEvent('cran:articulos-changed'));}});
})();
