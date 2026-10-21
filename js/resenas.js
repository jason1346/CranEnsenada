/* mostrar, añadir y elimnar reseñas */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const root=$('cn-reviews-title');if(!root)return;
  const productId=new URLSearchParams(location.search).get('producto')||'mermelada';
  const key='cran_ensenada_resenas_v1',modeKey='cran_ensenada_admin_demo_v2';
  let stars=0;
  let stored={};
  try{const obj=JSON.parse(localStorage.getItem(key));if(obj&&typeof obj==='object'&&!Array.isArray(obj))stored=obj;}catch{}
  const isAdmin=()=>{try{return sessionStorage.getItem(modeKey)!=='false';}catch{return true;}};
  const make=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
  function toast(msg){const n=$('ce-toast');if(!n)return;n.textContent=msg;n.classList.add('ce-show');setTimeout(()=>n.classList.remove('ce-show'),3200);}
  function save(){try{localStorage.setItem(key,JSON.stringify(stored));return true;}catch{toast('No se pudo guardar el comentario en este navegador.');return false;}}
  function records(){return Array.isArray(stored[productId])?stored[productId].filter(r=>r&&typeof r.name==='string'&&Number.isInteger(r.stars)):[];}
  function updateStars(){
    document.querySelectorAll('[data-cn-star]').forEach(btn=>{
      const active=Number(btn.dataset.cnStar)<=stars;
      btn.classList.toggle('is-selected',active);btn.setAttribute('aria-pressed',String(Number(btn.dataset.cnStar)===stars));
    });
    $('cn-star-label').textContent=stars?stars+' de 5 estrellas':'Sin selección';
  }
  document.querySelectorAll('[data-cn-star]').forEach(b=>b.addEventListener('click',()=>{stars=Number(b.dataset.cnStar);updateStars();}));
  function draw(){
    const rows=records(),list=$('cn-review-list');list.replaceChildren();
    const avg=rows.length?rows.reduce((n,r)=>n+r.stars,0)/rows.length:0;
    $('cn-rating-value').textContent=rows.length?avg.toFixed(1).replace('.',','):'—';
    $('cn-rating-stars').textContent='★'.repeat(Math.round(avg))+'☆'.repeat(5-Math.round(avg));
    $('cn-rating-stars').setAttribute('aria-label',rows.length?'Valoración media de '+avg.toFixed(1)+' sobre 5':'Aún sin valoraciones');
    $('cn-rating-count').textContent=rows.length?rows.length+(rows.length===1?' valoración':' valoraciones'):'Todavía no hay valoraciones';
    if(!rows.length){list.append(make('p','cn-review-empty','Este producto aún no tiene comentarios. ¡Sé la primera persona en opinar!'));return;}
    rows.slice().reverse().forEach(r=>{
      const card=make('article','cn-review-card');const top=make('div','cn-review-top');
      const name=make('strong','',r.name);const date=make('time','',r.date||'');
      const rating=make('span','cn-rating-stars','★'.repeat(r.stars)+'☆'.repeat(5-r.stars));rating.setAttribute('aria-label',r.stars+' de 5 estrellas');
      const text=make('p','',r.comment);top.append(name,date);card.append(top,rating,text);
      if(isAdmin()){
        const del=make('button','cn-review-delete','Eliminar comentario');del.type='button';del.addEventListener('click',()=>{
          if(!isAdmin()||!window.confirm('¿Eliminar este comentario del navegador?'))return;
          stored[productId]=records().filter(x=>x.id!==r.id);
          if(save()){draw();toast('Comentario eliminado de esta demostración.');}
        });card.append(del);
      }
      list.append(card);
    });
  }
  $('cn-review-form').addEventListener('submit',event=>{
    event.preventDefault();
    if(!stars)return toast('Selecciona de 1 a 5 estrellas para valorar el producto.');
    const name=$('cn-review-name').value.trim(),comment=$('cn-review-comment').value.trim();
    if(name.length<2||comment.length<10)return toast('Completa tu nombre y un comentario de al menos 10 caracteres.');
    const old=records();
    const id='resena-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
    stored[productId]=[...old,{id,name,comment,stars,date:new Date().toLocaleDateString('es-CL')}].slice(-100);
    if(save()){$('cn-review-form').reset();stars=0;updateStars();draw();toast('Comentario publicado en esta demostración.');}
  });
  document.addEventListener('cran:admin-mode',draw);
  updateStars();draw();
})();
