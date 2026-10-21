/* CRAN ENSENADA · Inventario compartido (demostración local, sin servidor) */
(() => {
  'use strict';
  const key='cran_ensenada_inventario_v1';
  const productsKey='cran_ensenada_productos_v2';
  const cartKey='cran_ensenada_carro_v2';
  const defaults={mermelada:{stock:36,min:12,sku:'CE-MER-450'},conserva:{stock:24,min:12,sku:'CE-CON-450'}};
  const read=(k,fall)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??fall;}catch{return fall;}};
  const keepInt=(value,fall=0)=>Number.isSafeInteger(Number(value))&&Number(value)>=0?Number(value):fall;
  function starter(){return {version:1,items:{},movements:[],isDemo:true};}
  function getProducts(){
    const stored=read(productsKey,null);
    return Array.isArray(stored)?stored.filter(p=>p&&typeof p.id==='string'): [
      {id:'mermelada',name:'Mermelada de Cranberry',image:'assets/mermelada-premium.webp',type:'Mermelada'},
      {id:'conserva',name:'Conserva de Cranberry',image:'assets/conserva-premium.webp',type:'Conserva'}
    ];
  }
  function readState(){
    let state=read(key,null);
    if(!state||typeof state!=='object'||Array.isArray(state))state=starter();
    if(!state.items||typeof state.items!=='object')state.items={};
    if(!Array.isArray(state.movements))state.movements=[];
    getProducts().forEach(p=>{
      if(!state.items[p.id])state.items[p.id]={stock:defaults[p.id]?.stock??0,min:defaults[p.id]?.min??6,sku:defaults[p.id]?.sku??('CE-'+p.id.slice(0,12).toUpperCase())};
    });
    return state;
  }
  function save(state){
    try{localStorage.setItem(key,JSON.stringify(state));window.dispatchEvent(new CustomEvent('cran:inventory-changed'));return true;}
    catch{return false;}
  }
  let initial=read(key,null);
  if(!initial){save(readState());}
  function sync(){const state=readState();save(state);return state;}
  function get(id){
    const state=readState();const item=state.items[id];
    return item?{stock:keepInt(item.stock),min:keepInt(item.min),sku:String(item.sku||'')}:{stock:0,min:6,sku:''};
  }
  function getStatus(id){const item=get(id);return item.stock===0?'Agotado':item.stock<=item.min?'Stock bajo':'Disponible';}
  function demand(cart){
    const units={};
    (cart||[]).forEach(item=>{
      const qty=keepInt(item.qty);
      if(item.kind==='retail')units[item.productId]=(units[item.productId]||0)+qty;
      if(item.kind==='wholesale-single')units[item.productId]=(units[item.productId]||0)+12*qty;
      if(item.kind==='wholesale-mixed'){
        units.mermelada=(units.mermelada||0)+6*qty;
        units.conserva=(units.conserva||0)+6*qty;
      }
    });
    return units;
  }
  function checkCart(cart){const d=demand(cart);return Object.entries(d).filter(([id,n])=>n>get(id).stock).map(([id,n])=>({id,requested:n,available:get(id).stock}));}
  function logMovement({id,type,quantity,reason,threshold,sku}){
    const state=readState();const p=getProducts().find(x=>x.id===id);
    if(!p)throw Error('El producto ya no existe en el catálogo.');
    const row=state.items[id]||{stock:0,min:6,sku:''};
    const before=keepInt(row.stock);
    if(type==='minimo'){
      row.min=keepInt(threshold,6);
      row.sku=String(sku||'').trim().slice(0,34).toUpperCase();
      if(!row.sku)throw Error('Ingresa un SKU para el producto.');
      state.items[id]=row;
      const accepted=save(state);if(!accepted)throw Error('No fue posible guardar el inventario.');
      return {before,after:before};
    }
    const qty=keepInt(quantity,-1);
    if(qty===-1|| (type!=='ajuste' && qty===0))throw Error('Ingresa una cantidad mayor que cero.');
    let after;
    if(type==='entrada')after=before+qty;
    else if(type==='salida')after=before-qty;
    else if(type==='ajuste')after=qty;
    else throw Error('El tipo de movimiento no es válido.');
    if(after<0)throw Error(`No hay stock suficiente. Disponibles: ${before} frascos.`);
    if(after>1000000)throw Error('El stock máximo permitido es 1.000.000 frascos.');
    const message=String(reason||'').trim().slice(0,160);
    if(message.length<3)throw Error('Escribe un motivo de al menos 3 caracteres.');
    row.stock=after;state.items[id]=row;
    state.movements.unshift({id:('mov-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)),productId:id,productName:p.name,type,quantity:qty,delta:after-before,before,after,reason:message,when:new Date().toISOString()});
    state.movements=state.movements.slice(0,1000);
    if(!save(state))throw Error('No se pudo guardar el movimiento.');
    return {before,after};
  }
  function movements(){return readState().movements.slice();}
  window.CranInventory={getProducts,get,sync,getStatus,demand,checkCart,logMovement,movements,getState:readState,cart:()=>read(cartKey,[]),stateKey:key};
})();
