/* muestra receta, crea funcion de lista para marcar los pasos ya hechos y demas */
(() => {
  'use strict';
  const recipes = Array.isArray(window.CRAN_RECETAS) ? window.CRAN_RECETAS : [];
  if (!document.getElementById('crd-title')) return;
  const params = new URLSearchParams(window.location.search);
  const requested = Number(params.get('id'));
  const current = recipes.find(r=>r.id===requested);
  if (!current) {
    document.title='Receta no disponible | CRAN ENSENADA';
    const main=document.querySelector('main');
    if(main) main.innerHTML='<section class="ce-container cn-article-missing"><h1>Esta receta no está disponible.</h1><p>Puede que haya sido eliminada del recetario de demostración.</p><a class="ce-btn" href="recetas.html">Volver al recetario ↗</a></section>';
    return;
  }
  const $=id=>document.getElementById(id);
  document.title=current.title+' | Recetas · CRAN ENSENADA';
  $('crd-title').textContent=current.title;
  $('crd-breadcrumb').textContent=current.title;
  $('crd-category').textContent=current.category.toUpperCase()+' · CRAN ENSENADA';
  $('crd-subtitle').textContent=current.subtitle+' Aprende a prepararla paso a paso y sorprende en tu próxima mesa.';
  $('crd-steps-number').textContent=current.steps.length;
  $('crd-photo').src=window.CranRutas.imagen(current.photo);
  $('crd-photo').alt='Fotografía ilustrativa del plato: '+current.title;
  current.ingredients.forEach((ingredient,index)=>{
    const li=document.createElement('li');
    const label=document.createElement('label');
    const box=document.createElement('input');box.type='checkbox';box.name='ingrediente-'+index;
    const text=document.createElement('span');text.textContent=ingredient;
    label.append(box,text);li.append(label);$('crd-ingredients').append(li);
  });
  current.steps.forEach((step,index)=>{
    const li=document.createElement('li');
    const number=document.createElement('div');number.className='crd-step-number';number.textContent=String(index+1).padStart(2,'0');
    const block=document.createElement('div');
    const heading=document.createElement('h3');heading.textContent='Paso '+(index+1);
    const paragraph=document.createElement('p');paragraph.textContent=step;
    block.append(heading,paragraph);li.append(number,block);$('crd-steps').append(li);
  });
})();
