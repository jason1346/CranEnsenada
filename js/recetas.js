/* crear, editar o eliminar recetas SOLO ADMIN */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const grid=$('cn-recipe-grid');if(!grid)return;
  const key='cran_ensenada_recetas_v2',modeKey='cran_ensenada_admin_demo_v2';
  let recipes=Array.isArray(window.CRAN_RECETAS)?window.CRAN_RECETAS:[];
  let category='Todas',editingId=null,deletingId=null;
  const isAdmin=()=>{try{return sessionStorage.getItem(modeKey)!=='false';}catch{return true;}};
  function toast(message){const node=$('ce-toast');if(!node)return;node.textContent=message;node.classList.add('ce-show');setTimeout(()=>node.classList.remove('ce-show'),3300);}
  function persist(){
    try {localStorage.setItem(key,JSON.stringify(recipes));window.CRAN_RECETAS=recipes;return true;}
    catch(e){toast('No se pudo guardar: verifica el espacio del navegador.');return false;}
  }
  function make(tag,cls,content){const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e;}
  function card(item){
    const article=make('article','cn-recipe-card');
    const link=make('a','cn-recipe-poster');link.href='receta.html?id='+encodeURIComponent(item.id);link.setAttribute('aria-label','Ver receta '+item.title);
    const image=make('img');image.src=window.CranRutas.imagen(item.photo||'assets/recetas/platos/plato-01.webp');image.alt='Fotografía ilustrativa de '+item.title;image.loading='lazy';image.decoding='async';
    link.append(image,make('span','',item.category));
    const body=make('div','cn-recipe-card-body');body.append(make('p','ce-kicker','RECETARIO · CRAN ENSENADA'));
    const heading=make('h3');const title=make('a','',item.title);title.href=link.href;heading.append(title);
    body.append(heading,make('p','',item.subtitle),make('span','cn-card-steps',item.steps.length+' pasos · Ingredientes y preparación'));
    const more=make('a','cn-recipe-open','Ver receta ↗');more.href=link.href;body.append(more);
    if(isAdmin()){
      const tools=make('div','cn-recipe-card-admin');
      const edit=make('button','','Editar');edit.type='button';edit.dataset.recipeEdit=String(item.id);
      const remove=make('button','cn-danger','Eliminar');remove.type='button';remove.dataset.recipeDelete=String(item.id);
      tools.append(edit,remove);body.append(tools);
    }
    article.append(link,body);return article;
  }
  function draw(){
    const shown=category==='Todas'?recipes:recipes.filter(r=>r.category===category);
    grid.replaceChildren(...shown.map(card));
    if(!shown.length){const empty=make('div','cn-recipe-empty');empty.append(make('h3','', 'No hay recetas en esta categoría.'),make('p','', 'Prueba con otro filtro o añade una nueva receta desde la vista de administrador.'));grid.append(empty);}
    $('cn-recipes-count').textContent=shown.length+(shown.length===1?' receta':' recetas');
    document.querySelectorAll('.cn-recipe-admin').forEach(node=>node.hidden=!isAdmin());
  }
  document.querySelectorAll('[data-cn-filter]').forEach(b=>b.addEventListener('click',()=>{
    category=b.dataset.cnFilter;
    document.querySelectorAll('[data-cn-filter]').forEach(other=>{const yes=b===other;other.classList.toggle('is-active',yes);other.setAttribute('aria-pressed',String(yes));});draw();
  }));
  const editor=$('cn-recipe-editor'),confirm=$('cn-recipe-delete-dialog');
  function openEditor(id){if(!isAdmin())return;
    editingId=id;
    const r=recipes.find(x=>x.id===id);
    $('cn-recipe-editor-title').textContent=r?'Editar receta':'Nueva receta';
    $('cn-recipe-name').value=r?.title||'';$('cn-recipe-category').value=r?.category||'Brunch';
    $('cn-recipe-subtitle').value=r?.subtitle||'';
    $('cn-recipe-ingredients').value=r?.ingredients.join('\n')||'';
    $('cn-recipe-steps').value=r?.steps.join('\n')||'';
    $('cn-recipe-photo').value='';editor.showModal();
  }
  $('cn-recipe-add').addEventListener('click',()=>openEditor(null));
  $('cn-recipe-restore').addEventListener('click',()=>{
    if(!isAdmin())return;
    if(!confirmOriginals())return;
    recipes=window.CRAN_RECETAS_ORIGINALES.map(r=>({...r,ingredients:[...r.ingredients],steps:[...r.steps]}));
    if(persist()){draw();toast('Se restauraron las recetas originales.');}
  });
  function confirmOriginals(){return window.confirm('¿Restaurar el recetario original? Se perderán las ediciones guardadas en este navegador.');}
  grid.addEventListener('click',e=>{
    const edit=e.target.closest('[data-recipe-edit]'),del=e.target.closest('[data-recipe-delete]');
    if(edit){openEditor(Number(edit.dataset.recipeEdit));return;}
    if(del&&isAdmin()){deletingId=Number(del.dataset.recipeDelete);confirm.showModal();}
  });
  const closeEditor=()=>editor.close(),closeDelete=()=>confirm.close();
  ['cn-recipe-editor-close','cn-recipe-editor-cancel'].forEach(id=>$(id).addEventListener('click',closeEditor));
  ['cn-recipe-delete-close','cn-recipe-delete-cancel'].forEach(id=>$(id).addEventListener('click',closeDelete));
  [editor,confirm].forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));
  $('cn-recipe-delete-confirm').addEventListener('click',()=>{
    if(!isAdmin())return;
    recipes=recipes.filter(r=>r.id!==deletingId);if(persist()){draw();closeDelete();toast('Receta eliminada de esta demostración.');}
  });
  const splitLines=(text)=>text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,35);
  async function readImage(file){
    if(!file)return null;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Selecciona una imagen JPG, PNG o WebP.');
    if(file.size>400000)throw new Error('La fotografía debe pesar menos de 400 KB.');
    return await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>reject(Error('No se pudo cargar la imagen.'));fr.readAsDataURL(file);});
  }
  $('cn-recipe-editor-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!isAdmin())return;
    const ingredients=splitLines($('cn-recipe-ingredients').value),steps=splitLines($('cn-recipe-steps').value);
    if(!ingredients.length||!steps.length)return toast('Agrega al menos un ingrediente y un paso.');
    try{
      const image=await readImage($('cn-recipe-photo').files[0]);
      const previous=recipes.find(r=>r.id===editingId);
      const id=previous?.id||Math.max(0,...recipes.map(r=>r.id))+1;
      const updated={id,title:$('cn-recipe-name').value.trim(),category:$('cn-recipe-category').value,subtitle:$('cn-recipe-subtitle').value.trim(),ingredients,steps,stepsCount:steps.length,
        photo:image||previous?.photo||'assets/recetas/platos/plato-01.webp',
        img:previous?.img||'',thumb:previous?.thumb||''};
      const copy=recipes.slice();
      const idx=copy.findIndex(x=>x.id===id);
      if(idx>=0)copy[idx]=updated;else copy.unshift(updated);
      const old=recipes;recipes=copy;
      if(!persist()){recipes=old;return;}
      editor.close();draw();toast(previous?'Cambios guardados en la receta.':'Nueva receta añadida.');
    }catch(error){toast(error.message);}
  });
  document.addEventListener('cran:admin-mode',draw);
  draw();
})();
