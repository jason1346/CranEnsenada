/* Destacados de inicio sincronizados con Blog y Noticias del administrador. */
(() => {
 'use strict';const store=window.CranArticulos;if(!store)return;
 for(const [type,index] of [['blog',0],['noticias',1]]){
   const card=document.querySelectorAll('.cn-home-editorial-card')[index];if(!card)continue;
   const draw=()=>{
     const article=store.get()[type]?.[0];
     const image=card.querySelector('img'),cover=card.querySelector(':scope > a'),title=card.querySelector('h3'),lead=card.querySelector('div > p'),more=card.querySelector('.cn-home-editorial-link');
     if(!article){title.textContent=type==='blog'?'Pronto, nuevas historias.':'Pronto, nuevas noticias.';lead.textContent='Muy pronto encontrarás publicaciones en esta sección.';cover.href=window.CranRutas.pagina(type+'.html');more.href=window.CranRutas.pagina(type+'.html');return;}
     const url=window.CranRutas.pagina('articulo.html?tipo='+encodeURIComponent(type)+'&id='+encodeURIComponent(article.id));
     title.textContent=article.title;lead.textContent=article.subtitle;image.src=window.CranRutas.imagen(article.photo);image.alt='Fotografía de '+article.title;cover.href=url;
     more.href=window.CranRutas.pagina(type+'.html');
   };
   draw();document.addEventListener('cran:articulos-changed',draw);
 }
})();
