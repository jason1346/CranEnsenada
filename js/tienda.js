/* Los productos y el carro se comparten entre páginas mediante localStorage */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const inventory=window.CranInventory;
  if(!inventory)console.warn('Inventario compartido no disponible.');
  const page = document.body.dataset.cePage || 'inicio';
  const catalogKey = 'cran_ensenada_productos_v2';
  const oldCatalogKey = 'cran_ensenada_catalogo_demo_v1';
  const cartKey = 'cran_ensenada_carro_v2';
  const modeKey = 'cran_ensenada_admin_demo_v2';
  const wholesaleUnit = 6800;
  const boxSize = 12;
  const boxPrice = wholesaleUnit * boxSize;
  const defaults = [
    {id:'mermelada', name:'Mermelada de Cranberry', type:'Mermelada', format:'Formato Premium Gourmet · 450 g', price:7500, max:10000,
     description:'Ideal para desayunos, repostería, pastelería, quesos, tablas, brunch y preparaciones dulces con un sello del sur de Chile.',
     uses:'Desayunos · Quesos · Repostería', image:'assets/mermelada-premium.webp'},
    {id:'conserva', name:'Conserva de Cranberry', type:'Conserva', format:'Formato Premium Gourmet · 450 g', price:8500, max:12000,
     description:'Una alternativa versátil para picoteos, quesos, preparaciones saladas, coctelería de autor, brunch y presentaciones gourmet.',
     uses:'Picoteos · Quesos · Brunch', image:'assets/conserva-premium.webp'}
  ];
  const clone = source => source.map(item => ({...item}));
  const fmt = amount => new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(amount);
  const element = (tag, cls, text) => {
    const node = document.createElement(tag);
    if(cls) node.className=cls;
    if(text!==undefined) node.textContent=text;
    return node;
  };
  const read = (key) => {try {return JSON.parse(localStorage.getItem(key));} catch {return null;}};
  const write = (key, value) => {try {localStorage.setItem(key,JSON.stringify(value));return true;} catch {toast('Se actualizó la vista, pero no fue posible guardar los cambios en este navegador.');return false;}};
  const cleanProducts = values => values.filter(x => x && typeof x.id==='string' && typeof x.name==='string').slice(0,80).map(x=>({
    id:x.id, name:x.name, type: typeof x.type==='string'?x.type:'Otro',format: typeof x.format==='string'?x.format:'Frasco 450 g',
    description: typeof x.description==='string'?x.description:'', uses:typeof x.uses==='string'?x.uses:'',
    price:Math.max(1,Number(x.price||x.min)||7500),max:Math.max(1,Number(x.max)||10000),
    image:typeof x.image==='string'?x.image:'assets/mermelada-premium.webp'
  }));
  function initialProducts(){
    const stored=read(catalogKey);
    if(Array.isArray(stored))return cleanProducts(stored);
    const old=read(oldCatalogKey);
    if(Array.isArray(old)){
      const migrated=cleanProducts(old);
      write(catalogKey,migrated);
      return migrated;
    }
    return clone(defaults);
  }
  let products=initialProducts();
  let cart=read(cartKey);
  if(!Array.isArray(cart))cart=[];
  cart=cart.filter(x=>x && typeof x.key==='string' && typeof x.name==='string' && Number.isInteger(x.qty) && x.qty>0 && x.qty<=99 && Number.isFinite(x.price) && x.price>0).slice(0,100);
  let isAdmin = true;
  try {isAdmin = sessionStorage.getItem(modeKey)!=='false';} catch {}
  let selectedId=null, editId=null, pendingDelete=null, detailQty=1, toastTimer;
  const getProduct = id => products.find(p=>p.id===id);
  function toast(message){const t=$('ce-toast'); if(!t)return; t.textContent=message;t.classList.add('ce-show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('ce-show'),3600);}
  function updateCartCount(){const total=cart.reduce((n,x)=>n+x.qty,0); document.querySelectorAll('[data-ce-cart-count]').forEach(n=>n.textContent=String(total));}
  function saveCart(){write(cartKey,cart);updateCartCount();}
  function cartAvailable(next){
    const issues=inventory?.checkCart(next)||[];
    if(issues.length){
      const issue=issues[0];const product=products.find(p=>p.id===issue.id);
      toast(`Stock insuficiente de ${product?.name||issue.id}: ${issue.available} frascos disponibles; ${issue.requested} solicitados en el carro.`);
      return false;
    }
    return true;
  }
  function addToCart({key,kind,productId,name,image,price,qty}){
    const next=cart.map(item=>({...item}));
    const existing=next.find(item=>item.key===key);
    if(existing){
      if(existing.qty+qty>99)return toast('El máximo es 99 unidades o cajas por artículo.');
      existing.qty+=qty;existing.price=price;existing.name=name;existing.image=image;
    }else next.push({key,kind,productId,name,image,price,qty});
    if(!cartAvailable(next))return;
    cart=next;saveCart();
    toast('Añadido al carro. Puedes revisarlo cuando quieras.');
  }
  function setAdminUi(){
    document.querySelectorAll('[data-ce-admin-only]').forEach(node=>node.hidden=!isAdmin);
    document.querySelectorAll('[data-ce-toggle-mode]').forEach(node=>node.textContent=isAdmin?'Ver como cliente':'Activar vista de administrador');
    // El estado de la vista se refleja en los dos botones de todas las páginas.
    document.body.dataset.ceViewMode=isAdmin?'administrador':'cliente';
    document.querySelectorAll('[data-ce-set-mode]').forEach(node=>{
      const active=(node.dataset.ceSetMode==='administrador')===isAdmin;
      node.classList.toggle('is-selected',active);
      node.setAttribute('aria-pressed',String(active));
    });
    const status=document.querySelector('[data-ce-toolbar-caption]');
    if(status)status.textContent=isAdmin?'Panel de administración de productos':'Selección Premium Gourmet · CRAN ENSENADA';
    if(page==='catalogo')drawCatalog();
    if(page==='detalle')renderDetail();
    document.dispatchEvent(new CustomEvent('cran:admin-mode',{detail:{isAdmin}}));
  }
  function makeButton(text,cls,action,id){
    const b=element('button',cls,text);b.type='button';b.dataset.ceAction=action;
    if(id)b.dataset.ceId=id;return b;
  }
  function drawCatalog(){
    const grid=$('ce-products-grid');if(!grid)return;
    grid.replaceChildren();
    products.forEach(p=>{
      const article=element('article','ce-card');
      const media=element('a','ce-card-picture');media.href='producto.html?producto='+encodeURIComponent(p.id);
      const img=element('img');img.src=window.CranRutas.imagen(p.image);img.alt='Frasco de '+p.name+' de CRAN ENSENADA';img.loading='lazy';
      media.append(img,element('span','ce-card-stamp',p.type+' · Gourmet'));
      const body=element('div','ce-card-body');body.append(element('p','ce-kicker','LÍNEA PREMIUM GOURMET'));
      const title=element('h3');const titleLink=element('a','',p.name);titleLink.href=media.href;title.append(titleLink);
      body.append(title,element('p','ce-card-format',p.format),element('p','ce-card-description',p.description));
      const status=inventory?.getStatus(p.id)||'Disponible';
      body.append(element('span','iv-catalog-stock '+(status==='Disponible'?'ok':status==='Stock bajo'?'low':'out'),status==='Agotado'?'Sin existencias':status==='Stock bajo'?'Pocas unidades disponibles':'Disponible'));
      const tags=element('div','ce-card-tags');p.uses.split('·').map(x=>x.trim()).filter(Boolean).slice(0,3).forEach(tag=>tags.append(element('span','',tag)));body.append(tags);
      const bottom=element('div','ce-card-bottom'),priceBox=element('div');priceBox.append(element('small','','CONOCE NUESTRO PRODUCTO'),element('span','ce-card-caption','Detalles y presentación'));
      const link=element('a','ce-btn','Ver producto y precios →');link.href=media.href;
      bottom.append(priceBox,link);body.append(bottom);
      if(isAdmin){const controls=element('div','ce-admin-controls');controls.append(element('small','','Administrar'),makeButton('Editar producto','','edit',p.id),makeButton('Eliminar producto','ce-delete','delete',p.id));body.append(controls);}
      article.append(media,body);grid.append(article);
    });
    $('ce-products-count').textContent=products.length+' '+(products.length===1?'producto':'productos');
    $('ce-products-empty').hidden=products.length!==0;
  }
  function selectedProduct(){
    const url=new URLSearchParams(location.search);return url.get('producto') || 'mermelada';
  }
  function renderDetail(){
    if(page!=='detalle')return;
    selectedId=selectedProduct();
    const p=getProduct(selectedId);
    $('ce-detail').hidden=!p;
    $('ce-missing').hidden=!!p;
    if(!p)return;
    document.title=p.name+' | CRAN ENSENADA';
    $('ce-detail-image').src=window.CranRutas.imagen(p.image);
    $('ce-detail-image').alt='Frasco de '+p.name+' de CRAN ENSENADA';
    $('ce-detail-type').textContent=p.type.toUpperCase()+' · LÍNEA PREMIUM GOURMET';
    const title=$('ce-detail-title');title.textContent='';
    const name=p.name.trim();const words=name.split(/\s+/);const accent=words.pop();
    title.append(document.createTextNode(words.length?words.join(' ')+' ':''),element('em','',accent));
    $('ce-detail-format').textContent=p.format;
    $('ce-detail-description').textContent=p.description;
    $('ce-detail-price').textContent=fmt(p.price);
    const amount=inventory?.get(p.id).stock??0, status=inventory?.getStatus(p.id)||'Agotado';
    const stockNote=$('ce-detail-stock');
    if(stockNote){stockNote.className='iv-detail-stock '+(status==='Disponible'?'ok':status==='Stock bajo'?'low':'out');stockNote.textContent=status==='Agotado'?'Producto agotado temporalmente':`${status} · ${amount} frascos en inventario (demo)`;}
    $('ce-add-retail').disabled=amount===0;
    $('ce-qty-plus').disabled=detailQty>=99 || amount<=detailQty;
    $('ce-qty-minus').disabled=detailQty<=1;
    $('ce-add-wholesale').disabled=amount<12;
    // La disponibilidad de cajas mixtas se evalúa considerando 6 unidades de cada referencia.
    $('ce-detail-price-note').textContent='Valor individual usado en el prototipo (extremo inferior del rango referencial '+fmt(p.price)+' – '+fmt(p.max)+'). Puede variar según punto de venta.';
    $('ce-qty-output').textContent=detailQty;
    const related=products.find(x=>x.id!==p.id),relatedDiv=$('ce-related');relatedDiv.replaceChildren();
    if(related){const row=element('div','ce-also-card'),img=element('img');img.src=window.CranRutas.imagen(related.image);img.alt=related.name;
      const text=element('div');text.append(element('h3','',related.name));const link=element('a','','Conocer este producto →');link.href='producto.html?producto='+encodeURIComponent(related.id);text.append(link);row.append(img,text);relatedDiv.append(row);
    }
    const mixedOption=document.querySelector('input[name=ce-pack][value=mixed]');
    const hasMix=!!getProduct('mermelada') && !!getProduct('conserva') && (inventory?.get('mermelada').stock??0)>=6 && (inventory?.get('conserva').stock??0)>=6;
    mixedOption.disabled=!hasMix;
    if(!hasMix&&mixedOption.checked)document.querySelector('input[name=ce-pack][value=single]').checked=true;
    mixedOption.parentElement.title=hasMix?'':'La caja mixta requiere ambos productos disponibles';
    $('ce-wholesale-section').querySelector('.ce-pack-total strong').textContent=fmt(boxPrice);
    updateWholesaleAvailability();
  }
  function updateWholesaleAvailability(){
    const p=getProduct(selectedId);if(!p)return;
    const mixed=document.querySelector('input[name=ce-pack]:checked')?.value==='mixed';
    const allowed=mixed?(inventory.get('mermelada').stock>=6&&inventory.get('conserva').stock>=6):inventory.get(p.id).stock>=12;
    $('ce-add-wholesale').disabled=!allowed;
    const notice=$('ce-wholesale-stock-note');
    if(notice)notice.textContent=mixed?'Caja mixta: se necesitan 6 frascos de cada producto.':`Caja de ${p.name}: se necesitan 12 frascos disponibles.`;
  }
  function renderCart(){
    const list=$('ce-cart-list');if(!list)return;
    list.replaceChildren();
    cart.forEach(item=>{
      const article=element('article','ce-cart-item');
      const img=element('img');img.src=window.CranRutas.imagen(item.image || 'assets/mermelada-premium.webp');img.alt=item.name;
      const main=element('div','ce-cart-item-main');
      main.append(element('h3','',item.name),element('p','',item.kind==='retail'?'Frasco individual · '+fmt(item.price)+' c/u':'Caja mayorista (12 frascos) · '+fmt(item.price)+' por caja'),element('strong','',fmt(item.price*item.qty)));
      const side=element('div','ce-cart-item-aside');
      const steps=element('div','ce-cart-qty');
      const down=makeButton('−','','cart-minus',item.key);down.setAttribute('aria-label','Disminuir cantidad');
      const up=makeButton('+','','cart-plus',item.key);up.setAttribute('aria-label','Aumentar cantidad');
      steps.append(down,element('output','',String(item.qty)),up);
      side.append(steps,makeButton('Eliminar','ce-cart-remove','cart-remove',item.key));
      article.append(img,main,side);list.append(article);
    });
    $('ce-cart-empty').hidden=cart.length!==0;
    $('ce-cart-list').hidden=cart.length===0;
    $('ce-summary-qty').textContent=String(cart.reduce((s,x)=>s+x.qty,0));
    $('ce-summary-total').textContent=fmt(cart.reduce((s,x)=>s+x.qty*x.price,0));
    $('ce-demo-checkout').disabled=cart.length===0;
    $('ce-demo-checkout').style.opacity=cart.length===0?'.55':'1';
    const warning=$('ce-cart-stock-warning');const issues=inventory.checkCart(cart);
    if(warning){warning.hidden=issues.length===0;warning.textContent=issues.length?`Atención: tu carro supera las existencias actuales (${issues.map(x=>`${getProduct(x.id)?.name||x.id}: ${x.requested} solicitados, ${x.available} disponibles`).join('; ')}). Reduce las cantidades.`:'';}
    $('ce-demo-checkout').disabled=cart.length===0||issues.length>0;
  }
  function openEditor(id){
    if(!isAdmin){toast('Activa la vista de administrador para editar.');return;}
    editId=id;
    const p=id?getProduct(id):null;
    $('ce-editor-title').textContent=p?'Editar producto':'Nuevo producto';
    $('ce-field-name').value=p?.name||'';
    $('ce-field-format').value=p?.format||'Formato Premium Gourmet · 450 g';
    $('ce-field-description').value=p?.description||'';
    $('ce-field-uses').value=p?.uses||'';
    $('ce-field-price').value=p?.price||7500;
    $('ce-field-max').value=p?.max||10000;
    $('ce-field-type').value=['Mermelada','Conserva','Otro'].includes(p?.type)?p.type:'Mermelada';
    $('ce-field-image').value='';
    $('ce-editor').showModal();
  }
  function refresh(){
    write(catalogKey,products);
    inventory.sync();
    setAdminUi();
  }
  function safeImage(file){
    return new Promise((resolve,reject)=>{
      if(!file)return resolve(null);
      if(!['image/png','image/jpeg','image/webp'].includes(file.type))return reject(Error('Selecciona una imagen PNG, JPG o WebP.'));
      if(file.size>600000)return reject(Error('La imagen debe pesar menos de 600 KB.'));
      const reader=new FileReader(); reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('No se pudo leer la fotografía.'));reader.readAsDataURL(file);
    });
  }
  async function saveEditor(event){
    event.preventDefault();if(!isAdmin)return;
    const name=$('ce-field-name').value.trim();const price=Number($('ce-field-price').value),max=Number($('ce-field-max').value);
    if(price<=0||max<price)return toast('Revisa los precios: el máximo no puede ser menor que el precio inicial.');
    try{
      const image=await safeImage($('ce-field-image').files[0]);
      const old=getProduct(editId);
      const type=$('ce-field-type').value;
      const product={id:old?.id||('producto-'+Date.now()),name,type,format:$('ce-field-format').value.trim(),description:$('ce-field-description').value.trim(),uses:$('ce-field-uses').value.trim(),price,max,image:image||old?.image||(type==='Conserva'?'assets/conserva-premium.webp':'assets/mermelada-premium.webp')};
      if(old)products=products.map(x=>x.id===old.id?product:x);else products.push(product);
      refresh();$('ce-editor').close();toast(old?'Producto actualizado en esta demostración.':'Producto añadido al catálogo de demostración.');
      if(page==='detalle'&&!old)location.href='producto.html?producto='+encodeURIComponent(product.id);
    }catch(error){toast(error.message);}
  }
  function confirmDelete(id){
    if(!isAdmin)return;
    if(!getProduct(id))return;
    pendingDelete=id;
    $('ce-confirm').showModal();
  }
  //Navegacion y acciones compartidas por la pagina de catalogo y producto
  function selectMode(nextAdmin){
    if(nextAdmin===isAdmin)return;
    isAdmin=nextAdmin;
    try{sessionStorage.setItem(modeKey,String(isAdmin));}catch{}
    setAdminUi();
    toast(isAdmin?'Vista de administrador activada (demostración).':'Vista de cliente activada (demostración).');
    document.querySelector('.ce-admin-menu')?.removeAttribute('open');
    document.querySelector('.main-nav')?.classList.remove('is-open');
    document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');
  }
  document.querySelectorAll('[data-ce-set-mode]').forEach(button=>button.addEventListener('click',()=>selectMode(button.dataset.ceSetMode==='administrador')));
  // También funcionan los botones dentro de los avisos de acceso exclusivo.
  document.querySelectorAll('[data-ce-toggle-mode]').forEach(button=>button.addEventListener('click',()=>selectMode(!isAdmin)));
  document.querySelectorAll('[data-ce-new]').forEach(button=>button.addEventListener('click',()=>openEditor(null)));
  document.querySelectorAll('[data-ce-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  ['ce-editor','ce-confirm'].forEach(id=>$(id)?.addEventListener('click',event=>{if(event.target===$(id))$(id).close();}));
  $('ce-editor-form')?.addEventListener('submit',saveEditor);
  $('ce-confirm-delete')?.addEventListener('click',()=>{
    products=products.filter(x=>x.id!==pendingDelete);
    const removed=pendingDelete;pendingDelete=null;
    $('ce-confirm').close();refresh();toast('Producto eliminado de la demostración.');
    if(page==='detalle'&&removed===selectedId)location.href='productos.html';
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('button[data-ce-action]');if(!button)return;
    const {ceAction:action,ceId:id}=button.dataset;
    if(action==='edit')openEditor(id);
    if(action==='delete')confirmDelete(id);
    if(action.startsWith('cart-')){
      const item=cart.find(x=>x.key===id);if(!item)return;
      if(action==='cart-plus'){
        if(item.qty>=99)return toast('Máximo de 99 artículos o cajas.');
        const next=cart.map(x=>x.key===id?{...x,qty:x.qty+1}:{...x});
        if(!cartAvailable(next))return;
        cart=next;
      }
      if(action==='cart-minus')item.qty=Math.max(1,item.qty-1);
      if(action==='cart-remove')cart=cart.filter(x=>x.key!==id);
      saveCart();renderCart();
    }
  });
  document.querySelector('[data-ce-restore]')?.addEventListener('click',()=>{
    if(!isAdmin)return;
    products=clone(defaults);refresh();toast('Catálogo original restaurado.');
  });
  $('ce-qty-minus')?.addEventListener('click',()=>{detailQty=Math.max(1,detailQty-1);renderDetail();});
  $('ce-qty-plus')?.addEventListener('click',()=>{detailQty=Math.min(99,inventory.get(selectedId).stock,detailQty+1);renderDetail();});
  document.querySelectorAll('input[name=ce-pack]').forEach(input=>input.addEventListener('change',updateWholesaleAvailability));
  $('ce-add-retail')?.addEventListener('click',()=>{
    const p=getProduct(selectedId);if(!p)return;
    addToCart({key:'retail:'+p.id,kind:'retail',productId:p.id,name:p.name,image:p.image,price:p.price,qty:detailQty});
  });
  $('ce-add-wholesale')?.addEventListener('click',()=>{
    const p=getProduct(selectedId);if(!p)return;
    const mixed=document.querySelector('input[name=ce-pack]:checked').value==='mixed';
    if(mixed){
      if(!getProduct('mermelada')||!getProduct('conserva'))return toast('Para la caja mixta se necesitan ambos productos.');
      addToCart({key:'box:mixed',kind:'wholesale-mixed',productId:'mixed',name:'Caja mixta · 6 mermeladas + 6 conservas',image:'assets/mermelada-premium.webp',price:boxPrice,qty:1});
    }else addToCart({key:'box:'+p.id,kind:'wholesale-single',productId:p.id,name:'Caja mayorista · 12 '+p.name,image:p.image,price:boxPrice,qty:1});
  });
  document.querySelector('[data-ce-edit-current]')?.addEventListener('click',()=>openEditor(selectedId));
  document.querySelector('[data-ce-delete-current]')?.addEventListener('click',()=>confirmDelete(selectedId));
  $('ce-demo-checkout')?.addEventListener('click',()=>toast('La compra aún no está habilitada: este sitio es un prototipo y no realiza cobros ni pedidos.'));
  //muestra la pagina activa y actualiza el navbar acorde
  updateCartCount();
  if(page==='catalogo')drawCatalog();
  if(page==='detalle')renderDetail();
  if(page==='carro')renderCart();
  setAdminUi();
  window.addEventListener('storage',event=>{
    if(event.key===inventory.stateKey || event.key===catalogKey){
      if(event.key===catalogKey)products=initialProducts();
      if(page==='catalogo')drawCatalog();
      if(page==='detalle')renderDetail();
      if(page==='carro')renderCart();
    }
  });
  document.addEventListener('cran:inventory-changed',()=>{
    if(page==='catalogo')drawCatalog();
    if(page==='detalle')renderDetail();
    if(page==='carro')renderCart();
  });
})();
