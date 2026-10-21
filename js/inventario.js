/* Panel de inventario: operaciones de administrador, solo demostración local. */
(() => {
 'use strict';
 const inv=window.CranInventory,$=id=>document.getElementById(id);
 if(!inv||!$('iv-app'))return;
 const modeKey='cran_ensenada_admin_demo_v2';
 let query='',filter='all',pending=null,active='entrada';
 const money=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);
 const admin=()=>{try{return sessionStorage.getItem(modeKey)!=='false';}catch{return true;}};
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
 const notify=message=>{const toast=$('ce-toast');toast.textContent=message;toast.classList.add('ce-show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('ce-show'),3500);};
 const nameOf=id=>inv.getProducts().find(p=>p.id===id)?.name||id;
 function statusClass(id){return inv.getStatus(id)==='Disponible'?'ok':inv.getStatus(id)==='Stock bajo'?'low':'out';}
 function gate(){const on=admin();$('iv-app').hidden=!on;$('iv-locked').hidden=on;}
 function metrics(){
  const products=inv.getProducts(),cart=inv.cart();const demand=inv.demand(cart);
  const total=products.reduce((n,p)=>n+inv.get(p.id).stock,0);
  const low=products.filter(p=>inv.get(p.id).stock<=inv.get(p.id).min).length;
  $('iv-kpi-products').textContent=products.length;
  $('iv-kpi-stock').textContent=total.toLocaleString('es-CL');
  $('iv-kpi-low').textContent=low;
  $('iv-kpi-cart').textContent=Object.values(demand).reduce((a,b)=>a+b,0);
  $('iv-alert-count').textContent=low?`${low} ${low===1?'producto requiere':'productos requieren'} atención`:'Existencias dentro de los mínimos';
  $('iv-alert-box').classList.toggle('iv-alert-active',!!low);
  $('iv-alert-list').replaceChildren();
  products.filter(p=>inv.get(p.id).stock<=inv.get(p.id).min).forEach(p=>{
    const li=el('li','',`${p.name}: ${inv.get(p.id).stock} disponibles · mínimo ${inv.get(p.id).min}`);$('iv-alert-list').append(li);
  });
  if(!low)$('iv-alert-list').append(el('li','','No hay productos bajo el stock mínimo.'));
 }
 function renderProducts(){
  const rows=$('iv-products-rows');rows.replaceChildren();
  const cart=inv.demand(inv.cart());let visible=0;
  inv.getProducts().forEach(p=>{
    const value=inv.get(p.id),status=inv.getStatus(p.id);
    if(filter==='low' && value.stock>value.min)return;
    if(filter==='out' && value.stock!==0)return;
    if(query && !(p.name+' '+value.sku).toLocaleLowerCase('es').includes(query))return;
    visible++;
    const tr=el('tr');const productTd=el('td');const row=el('div','iv-product-cell');
    const img=el('img');img.src=window.CranRutas.imagen(p.image||'assets/mermelada-premium.webp');img.alt=p.name;
    const info=el('div');info.append(el('strong','',p.name),el('small','',value.sku||'Sin SKU'));row.append(img,info);productTd.append(row);
    const stockTd=el('td');stockTd.append(el('strong','iv-stock-val',value.stock),el('small','','frascos'));
    const minTd=el('td','',value.min);
    const cartTd=el('td');const hold=cart[p.id]||0;
    cartTd.append(el('span','',String(hold)),el('small','','en carro local'));
    const statusTd=el('td');statusTd.append(el('span','iv-pill '+statusClass(p.id),status));
    const actionsTd=el('td');const actions=el('div','iv-row-actions');
    for(const [label,type,cls] of [['+ Entrada','entrada',''],['− Salida','salida',''],['Ajustar','ajuste','iv-ghost'],['Mínimo / SKU','minimo','iv-ghost']]){
      const button=el('button',cls,label);button.type='button';button.dataset.ivAction=type;button.dataset.ivProduct=p.id;actions.append(button);
    }
    actionsTd.append(actions);tr.append(productTd,stockTd,minTd,cartTd,statusTd,actionsTd);rows.append(tr);
  });
  $('iv-products-empty').hidden=visible!==0;
  $('iv-products-count').textContent=`${visible} ${visible===1?'producto':'productos'}`;
 }
 function renderHistory(){
  const container=$('iv-history-rows');container.replaceChildren();
  const records=inv.movements().slice(0,60);$('iv-movements-count').textContent=records.length+' movimientos recientes';
  if(!records.length){const row=el('tr');const td=el('td','iv-history-empty','Aún no hay movimientos. Registra una entrada, salida o ajuste para comenzar.');td.colSpan=6;row.append(td);container.append(row);return;}
  records.forEach(m=>{
    const tr=el('tr');const date=new Date(m.when).toLocaleString('es-CL',{dateStyle:'short',timeStyle:'short'});
    [date,m.productName,m.type==='entrada'?'Entrada':m.type==='salida'?'Salida':'Ajuste',`${m.delta>=0?'+':''}${m.delta}`,`${m.before} → ${m.after}`,m.reason].forEach((value,i)=>{const td=el('td',i===3?(m.delta>=0?'iv-positive':'iv-negative'):'',value);tr.append(td);});
    container.append(tr);
  });
 }
 function render(){gate();if(!admin())return;metrics();renderProducts();renderHistory();}
 function showDialog(productId,type){
  if(!admin())return;
  const p=inv.getProducts().find(x=>x.id===productId);if(!p)return;
  pending=productId;active=type;
  const s=inv.get(productId);
  $('iv-dialog-product').textContent=p.name;
  $('iv-dialog-current').textContent=`Stock actual: ${s.stock} frascos · Stock mínimo: ${s.min}`;
  $('iv-dialog-title').textContent=type==='entrada'?'Registrar entrada':type==='salida'?'Registrar salida':type==='ajuste'?'Ajustar existencias':'Configurar stock mínimo';
  $('iv-movement-fields').hidden=type==='minimo';$('iv-settings-fields').hidden=type!=='minimo';
  $('iv-movement-label').textContent=type==='ajuste'?'Nueva cantidad total en inventario':'Cantidad de frascos';
  $('iv-movement-qty').value=type==='ajuste'?s.stock:'';
  $('iv-movement-reason').value='';
  $('iv-settings-min').value=s.min;
  $('iv-settings-sku').value=s.sku;
  $('iv-movement-qty').min=type==='ajuste'?'0':'1';
  const movement=type!=='minimo';
  $('iv-movement-qty').required=movement;
  $('iv-movement-reason').required=movement;
  $('iv-settings-min').required=!movement;
  $('iv-settings-sku').required=!movement;
  $('iv-dialog-error').hidden=true;
  $('iv-dialog').showModal();
 }
 $('iv-products-rows').addEventListener('click',e=>{
  const button=e.target.closest('button[data-iv-action]');if(button)showDialog(button.dataset.ivProduct,button.dataset.ivAction);
 });
 $('iv-search').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase('es');renderProducts();});
 $('iv-filter').addEventListener('change',e=>{filter=e.target.value;renderProducts();});
 $('iv-dialog-close').addEventListener('click',()=>$('iv-dialog').close());
 $('iv-dialog-cancel').addEventListener('click',()=>$('iv-dialog').close());
 $('iv-dialog').addEventListener('click',e=>{if(e.target===$('iv-dialog'))$('iv-dialog').close();});
 $('iv-dialog-form').addEventListener('submit',e=>{
  e.preventDefault();if(!admin()||!pending)return;
  try{
    if(active==='minimo')inv.logMovement({id:pending,type:'minimo',threshold:$('iv-settings-min').value,sku:$('iv-settings-sku').value});
    else inv.logMovement({id:pending,type:active,quantity:Number($('iv-movement-qty').value),reason:$('iv-movement-reason').value});
    $('iv-dialog').close();render();notify(active==='minimo'?'Configuración de inventario guardada.':'Movimiento de inventario registrado.');
  }catch(error){$('iv-dialog-error').textContent=error.message;$('iv-dialog-error').hidden=false;}
 });
 $('iv-export').addEventListener('click',()=>{
  if(!admin())return;
  const rows=[['ID','Producto','SKU','Existencias','Stock mínimo','Estado'],...inv.getProducts().map(p=>[p.id,p.name,inv.get(p.id).sku,inv.get(p.id).stock,inv.get(p.id).min,inv.getStatus(p.id)])];
  const esc=value=>'"'+String(value).replaceAll('"','""')+'"';
  const csv='\ufeff'+rows.map(row=>row.map(esc).join(';')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);
  const a=el('a');a.href=url;a.download='cran-ensenada-inventario.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 window.addEventListener('storage',e=>{if([inv.stateKey,'cran_ensenada_productos_v2','cran_ensenada_carro_v2'].includes(e.key))render();});
 document.addEventListener('cran:inventory-changed',render);
 document.addEventListener('cran:admin-mode',render);
 window.addEventListener('pageshow',render);
 render();
})();
