/* Blog y Noticias · Lectura y CRUD administrativo local. */
(() => {
 'use strict';
 const store=window.CranArticulos;
 if(!store)return;
 const $=id=>document.getElementById(id);
 const make=(tag,css='',txt)=>{const e=document.createElement(tag);if(css)e.className=css;if(txt!==undefined)e.textContent=txt;return e;};
 const page=document.body.dataset.cePage;
 const category=page==='noticias'?'noticias':'blog';
 const list=$('cn-articles-grid');
 const detail=$('cn-article-detail');
 if(!list&&!detail)return;
 const params=new URLSearchParams(location.search);
 const detailType=['blog','noticias'].includes(params.get('tipo'))?params.get('tipo'):'blog';
 const detailId=params.get('id');
 let editing=null, deletion=null, toastTimer;
 const href=(type,id)=>'articulo.html?tipo='+encodeURIComponent(type)+'&id='+encodeURIComponent(id);
 const getPosts=type=>store.get()[type]||[];
 const getPost=(type,id)=>getPosts(type).find(p=>p.id===id);
 const btn=(label,action,cls='')=>{const b=make('button','cn-edit-btn '+cls,label);b.type='button';b.dataset.cnAction=action;return b;};
 function notice(message){const node=$('ce-toast');if(!node)return;node.textContent=message;node.classList.add('ce-show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('ce-show'),3800);}
 function controls(type,id){const box=make('div','cn-mag-admin-card');box.append(btn('Editar','edit'),btn('Eliminar','delete','danger'));box.dataset.type=type;box.dataset.id=id;return box;}
 function drawList(){
   if(!list)return;
   const posts=getPosts(category);
   list.replaceChildren();
   posts.forEach((post,index)=>{
     const card=make('article','cn-mag-card'+(index===0?' is-featured':''));
     const a=make('a','cn-mag-card-cover');a.href=href(category,post.id);
     const image=make('img');image.src=window.CranRutas.imagen(post.photo);image.alt='Fotografía de '+post.title;image.loading='lazy';image.decoding='async';a.append(image);
     const content=make('div','cn-mag-card-text');content.append(make('span','ce-kicker',post.category+' · '+post.read));
     const h=make('h3'),name=make('a','',post.title);name.href=a.href;h.append(name);
     const more=make('a','cn-mag-read','Leer artículo ↗');more.href=a.href;
     content.append(h,make('p','',post.subtitle),more);
     if(store.isAdmin())content.append(controls(category,post.id));
     card.append(a,content);list.append(card);
   });
   if(!posts.length){const empty=make('div','cn-mag-empty');empty.append(make('h3','','Todavía no hay publicaciones'),make('p','','El administrador puede añadir una desde esta misma página.'));list.append(empty);}
   const count=$('cn-mag-count');if(count)count.textContent=posts.length+' '+(posts.length===1?'publicación':'publicaciones');
   const bar=$('cn-mag-admin');if(bar)bar.hidden=!store.isAdmin();
 }
 function renderDetail(){
   if(!detail)return;
   const post=getPost(detailType,detailId);
   detail.replaceChildren();
   if(!post){
     const msg=make('section','ce-container cn-article-missing');msg.append(make('h1','', 'Publicación no encontrada'),make('p','', 'Esta publicación se eliminó o no existe.'));
     const back=make('a','ce-btn','Volver a '+(detailType==='blog'?'Blog':'Noticias')+' ↗');back.href=detailType+'.html';msg.append(back);detail.append(msg);return;
   }
   document.title=post.title+' | CRAN ENSENADA';
   const section=make('section','cn-article-page ce-container');
   const crumbs=make('nav','ce-crumbs');crumbs.setAttribute('aria-label','Ruta de navegación');
   const home=make('a','','Inicio');home.href=window.CranRutas.pagina('index.html');
   const parent=make('a','',detailType==='blog'?'Blog':'Noticias');parent.href=detailType+'.html';
   crumbs.append(home,make('span','','/'),parent,make('span','','/'),make('strong','',post.title));section.append(crumbs);
   const heading=make('div','cn-article-heading');heading.append(make('p','ce-kicker',post.category+' · '+post.read));
   heading.append(make('h1','',post.title),make('p','cn-article-lead',post.subtitle),make('span','cn-article-date',post.date));
   if(store.isAdmin()){const control=controls(detailType,post.id);control.classList.add('cn-detail-edit');heading.append(control);}
   section.append(heading);
   const image=make('img','cn-article-hero-img');image.src=window.CranRutas.imagen(post.photo);image.alt='Imagen editorial de '+post.title;section.append(image);
   const body=make('div','cn-article-body'),main=make('div','cn-article-prose');
   for(const [subtitle,paragraph] of post.sections)main.append(make('h2','',subtitle),make('p','',paragraph));
   main.append(make('p','cn-article-disclaimer','Esta publicación forma parte de un sitio de demostración. Los cambios se almacenan únicamente en este navegador.'));
   const sidebar=make('aside','cn-article-side');sidebar.append(make('span','ce-kicker','CONTINÚA DESCUBRIENDO'),make('h3','','Del sabor a tu mesa.'),make('p','','Explora nuestros productos, recetas y novedades.'));
   const related=make('a','ce-btn',post.linktext+' ↗');related.href=window.CranRutas.pagina(post.link);sidebar.append(related);
   const back=make('a','cn-article-back','← Volver a '+(detailType==='blog'?'Blog':'Noticias'));back.href=parent.href;sidebar.append(back);
   body.append(main,sidebar);section.append(body);detail.append(section);
 }
 /* Herramientas administrativas */
 if(list){
   const parent=$('articulos');
   const bar=make('div','cn-mag-admin');bar.id='cn-mag-admin';bar.dataset.ceAdminOnly='';
   const caption=make('div');caption.append(make('strong','','Administración de '+(category==='blog'?'Blog':'Noticias')),make('span','','Crea, edita y elimina publicaciones en este navegador.'));
   const actions=make('div','cn-mag-admin-actions');actions.append(btn('＋ Añadir '+(category==='blog'?'artículo':'noticia'),'add','primary'),btn('Restaurar originales','restore'));
   bar.append(caption,actions);
   const head=parent.querySelector('.cn-magazine-head');head?.insertAdjacentElement('afterend',bar);
   const count=parent.querySelector('.cn-magazine-head>span');if(count)count.id='cn-mag-count';
 }
 const editor=make('dialog','cn-editor-dialog cn-article-editor');editor.id='cn-article-editor';
 editor.innerHTML=`<div class="cn-editor-top"><div><p class="ce-kicker">ADMINISTRACIÓN · BLOG Y NOTICIAS</p><h2 id="cn-art-editor-title">Nueva publicación</h2></div><button type="button" data-editor-close aria-label="Cerrar">×</button></div>
 <form class="cn-editor-form" id="cn-art-form">
 <label>Título<input name="title" minlength="4" maxlength="150" required></label>
 <label>Categoría<input name="category" maxlength="80" placeholder="INSPIRACIÓN / NOVEDADES" required></label>
 <label>Descripción breve<textarea name="subtitle" rows="2" minlength="8" maxlength="400" required></textarea></label>
 <div class="cn-art-form-grid"><label>Tiempo de lectura<select name="read"><option>2 min de lectura</option><option selected>3 min de lectura</option><option>4 min de lectura</option><option>5 min de lectura</option><option>6 min de lectura</option><option>7 min de lectura</option><option>8 min de lectura</option></select></label><label>Fecha / etiqueta<input name="date" maxlength="90" placeholder="Ej. 19 de octubre de 2026" required></label></div>
 <label>URL de la fotografía (opcional)<input name="photo" type="text" placeholder="assets/.../imagen.webp o https://..."></label>
 <label>O subir una fotografía (JPG, PNG, WebP, máx. 350 KB)<input name="file" type="file" accept="image/jpeg,image/png,image/webp"></label>
 <div class="cn-art-sections-head"><strong>Contenido del artículo</strong><button class="cn-edit-btn" type="button" data-editor-section-add>＋ Añadir apartado</button></div>
 <div class="cn-art-sections" id="cn-art-sections"></div>
 <div class="cn-art-form-grid"><label>Enlace recomendado<select name="link"><option value="recetas.html">Recetas</option><option value="productos.html">Nuestros Productos</option><option value="nosotros.html">Sobre Nosotros</option><option value="blog.html">Blog</option><option value="noticias.html">Noticias</option><option value="index.html">Inicio</option></select></label><label>Texto del enlace<input name="linktext" maxlength="80" required></label></div>
 <p class="cn-art-editor-hint">Los cambios son locales y no se publican en un servidor. Para una web real se necesita autenticación y una base de datos.</p>
 <div class="cn-editor-actions"><button class="ce-btn ce-btn-stroke" type="button" data-editor-close>Cancelar</button><button class="ce-btn" type="submit">Guardar publicación</button></div>
 </form>`;
 document.body.append(editor);
 const sections=$('cn-art-sections'),form=$('cn-art-form');
 const del=make('dialog','cn-editor-dialog cn-editor-confirm cn-article-confirm');del.id='cn-article-confirm';
 del.innerHTML=`<div class="cn-editor-top"><div><p class="ce-kicker">ELIMINAR PUBLICACIÓN</p><h2>¿Seguro que deseas eliminarla?</h2></div><button aria-label="Cerrar" type="button" data-delete-close>×</button></div><p id="cn-delete-title"></p><p>Dejará de mostrarse en el Blog o las Noticias. Podrás restaurar las publicaciones originales.</p><div class="cn-editor-actions"><button class="ce-btn ce-btn-stroke" type="button" data-delete-close>Cancelar</button><button class="ce-btn ce-btn-red" type="button" id="cn-delete-accept">Sí, eliminar</button></div>`;
 document.body.append(del);
 function sectionRow(heading='',paragraph=''){
   const row=make('div','cn-art-section-row');
   const top=make('div','cn-art-section-title');top.append(make('strong','','Apartado del artículo'),btn('Quitar apartado','remove-section','danger'));
   const h=make('label','','Subtítulo');const hin=make('input');hin.name='section-title';hin.maxLength=130;hin.required=true;hin.value=heading;h.append(hin);
   const b=make('label','','Párrafo');const text=make('textarea');text.name='section-body';text.rows=4;text.maxLength=1800;text.required=true;text.value=paragraph;b.append(text);
   row.append(top,h,b);sections.append(row);
 }
 function openEditor(type,id){if(!store.isAdmin())return;
   editing={type,id};const post=id?getPost(type,id):null;
   form.reset();form.elements.title.value=post?.title||'';
   form.elements.category.value=post?.category||(type==='blog'?'INSPIRACIÓN':'NOVEDADES');
   form.elements.subtitle.value=post?.subtitle||'';
   form.elements.read.value=post?.read||'3 min de lectura';
   form.elements.date.value=post?.date||new Date().toLocaleDateString('es-CL',{day:'numeric',month:'long',year:'numeric'});
   form.elements.photo.value=post?.photo?.startsWith('data:')?'':(post?.photo||'');
   form.elements.photo.placeholder=post?.photo?.startsWith('data:')?'Imagen cargada. Deja vacío para conservarla.':'assets/.../imagen.webp o https://...';
   form.elements.link.value=post?.link||'recetas.html';
   form.elements.linktext.value=post?.linktext||'Conoce más';
   sections.replaceChildren();(post?.sections?.length?post.sections:[['','']]).forEach(([h,body])=>sectionRow(h,body));
   $('cn-art-editor-title').textContent=(post?'Editar ':'Nueva ')+(type==='blog'?'publicación del Blog':'noticia');
   editor.showModal();
 }
 async function uploadedPhoto(file){
   if(!file)return null;
   if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Selecciona una fotografía JPG, PNG o WebP.');
   if(file.size>350000)throw Error('La imagen debe pesar menos de 350 KB.');
   return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('No se pudo leer la fotografía.'));reader.readAsDataURL(file);});
 }
 form.addEventListener('submit',async event=>{
   event.preventDefault();if(!store.isAdmin()||!editing)return;
   const rows=[...sections.querySelectorAll('.cn-art-section-row')];
   const parts=rows.map(row=>[row.querySelector('[name=section-title]').value.trim(),row.querySelector('[name=section-body]').value.trim()]).filter(([a,b])=>a&&b);
   if(parts.length<1)return notice('Debes incluir al menos un apartado con título y texto.');
   try {
     const original=editing.id?getPost(editing.type,editing.id):null;
     const image=await uploadedPhoto(form.elements.file.files[0]);
     const written=form.elements.photo.value.trim();
     if(written && store.cleanPhoto(written)!==written)return notice('Usa una fotografía de la carpeta assets o una URL https válida.');
     const photo=image||written||original?.photo||'assets/cosecha-en-ensenada.webp';
     const id=original?.id||'publicacion-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
     const post={id,title:form.elements.title.value.trim(),category:form.elements.category.value.trim(),subtitle:form.elements.subtitle.value.trim(),
       read:form.elements.read.value,date:form.elements.date.value.trim(),photo,sections:parts,
       link:form.elements.link.value,linktext:form.elements.linktext.value.trim()};
     const all=store.get(),updated={blog:[...all.blog],noticias:[...all.noticias]};
     const group=updated[editing.type],index=group.findIndex(p=>p.id===id);
     if(index>=0)group[index]=post;else group.unshift(post);
     if(!store.save(updated))return notice('No se pudo guardar. Usa una fotografía más liviana o libera espacio del navegador.');
     editor.close();notice(original?'Publicación editada correctamente.':'Publicación agregada correctamente.');
     if(detail && (!original||detailId!==id))location.href=href(editing.type,id);
   } catch(error){notice(error.message||'Error al guardar.');}
 });
 document.body.addEventListener('click',event=>{
   const closeEditor=event.target.closest('[data-editor-close]');if(closeEditor){editor.close();return;}
   const closeDelete=event.target.closest('[data-delete-close]');if(closeDelete){del.close();return;}
   const addSec=event.target.closest('[data-editor-section-add]');if(addSec){if(sections.children.length<12)sectionRow();else notice('Máximo 12 apartados por artículo.');return;}
   const removeSec=event.target.closest('[data-cn-action="remove-section"]');if(removeSec){if(sections.children.length>1)removeSec.closest('.cn-art-section-row').remove();else notice('Debe quedar al menos un apartado.');return;}
   const action=event.target.closest('[data-cn-action]');if(!action||!store.isAdmin())return;
   const intent=action.dataset.cnAction;
   const parent=action.closest('[data-type][data-id]');
   if(intent==='add'){openEditor(category,null);return;}
   if(intent==='restore'){
     if(confirm('¿Restaurar las publicaciones originales de '+(category==='blog'?'Blog':'Noticias')+'? Se perderán las ediciones de esta sección.')){
       if(store.restore(category))notice('Publicaciones originales restauradas.');else notice('No se pudo restaurar la sección.');
     }return;
   }
   if(!parent)return;
   const type=parent.dataset.type,id=parent.dataset.id;
   if(intent==='edit'){openEditor(type,id);return;}
   if(intent==='delete'){
     deletion={type,id};$('cn-delete-title').textContent='«'+(getPost(type,id)?.title||'Publicación')+'»';del.showModal();
   }
 });
 $('cn-delete-accept').addEventListener('click',()=>{
   if(!store.isAdmin()||!deletion)return;
   const all=store.get(),updated={blog:[...all.blog],noticias:[...all.noticias]};
   updated[deletion.type]=updated[deletion.type].filter(p=>p.id!==deletion.id);
   if(!store.save(updated))return notice('No se pudo eliminar en este navegador.');
   del.close();notice('Publicación eliminada.');
   if(detail)location.href=deletion.type+'.html';
 });
 [editor,del].forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();}));
 document.addEventListener('cran:admin-mode',()=>{if(list)drawList();if(detail)renderDetail();});
 document.addEventListener('cran:articulos-changed',()=>{if(list)drawList();if(detail)renderDetail();});
 if(list)drawList();if(detail)renderDetail();
})();
