/* reporte/resumen de ventas */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('cn-report-content')) return;
  const salesKey = 'cran_ensenada_ventas_demo_v1';
  const modeKey = 'cran_ensenada_admin_demo_v2';
  const money = n => new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);
  const dateLabel = iso => {const [y,m,d]=iso.split('-');return `${d}/${m}/${y}`;};
  const read = () => {try {const v=JSON.parse(localStorage.getItem(salesKey));return Array.isArray(v)?v.filter(s=>s&&typeof s.id==='string'&&Number.isFinite(s.total)):[];} catch {return [];} };
  let sales = read();let pendingDelete = null;
  const el = (tag,text,cls) => {const node=document.createElement(tag); if(text!==undefined)node.textContent=text; if(cls)node.className=cls; return node;};
  const save = () => {try{localStorage.setItem(salesKey,JSON.stringify(sales));return true;}catch{alert('No se pudo guardar el registro. Revisa el almacenamiento disponible en este navegador.');return false;}};
  function isAdmin(){try{return sessionStorage.getItem(modeKey)!=='false';}catch{return true;}}
  function gate(){const allowed=isAdmin();$('cn-report-locked').hidden=allowed;$('cn-report-content').hidden=!allowed;}
  document.querySelectorAll('[data-ce-toggle-mode]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(gate,0)));
  document.addEventListener('cran:admin-mode',gate);
  window.addEventListener('pageshow',gate);
  window.addEventListener('storage',e=>{if(e.key===salesKey){sales=read();render();}});
  function getFiltered(){
    const period=$('cn-period').value;
    if(period==='all')return [...sales].sort((a,b)=>b.date.localeCompare(a.date));
    const today=new Date(); today.setHours(23,59,59,999);
    const min=new Date(today);min.setHours(0,0,0,0);min.setDate(min.getDate()-(Number(period)-1));
    return sales.filter(s=>{const day=new Date(s.date+'T12:00:00');return day>=min&&day<=today;}).sort((a,b)=>b.date.localeCompare(a.date));
  }
  function render(){
    gate();const values=getFiltered();
    const total=values.reduce((sum,s)=>sum+s.total,0);
    const units=values.reduce((sum,s)=>sum+s.units,0);
    $('cn-kpi-count').textContent=String(values.length); $('cn-kpi-total').textContent=money(total);
    $('cn-kpi-units').textContent=String(units);$('cn-kpi-avg').textContent=money(values.length?total/values.length:0);
    $('cn-report-rows').textContent=values.length+' registros';
    const tbody=$('cn-sales-rows');tbody.replaceChildren();
    for(const sale of values){
      const row=el('tr');
      for(const value of [dateLabel(sale.date),sale.product,sale.kind,String(sale.units),money(sale.total)])row.append(el('td',value));
      const action=el('td');const button=el('button','Eliminar','cn-row-delete');button.type='button';button.dataset.saleId=sale.id;action.append(button);row.append(action);tbody.append(row);
    }
    $('cn-history-empty').hidden=values.length>0;
    drawChart(values);drawProductBars(values);
  }
  function drawChart(values){
    const box=$('cn-sales-chart');box.replaceChildren();
    const byDay=new Map();values.forEach(s=>byDay.set(s.date,(byDay.get(s.date)||0)+s.total));
    const keys=[...byDay.keys()].sort().slice(-10);
    if(!keys.length){box.append(el('p','Aún no hay ventas registradas para este período.','cn-empty-chart'));return;}
    const max=Math.max(...byDay.values());
    const chart=el('div',undefined,'cn-chart-columns');
    keys.forEach(day=>{
      const val=byDay.get(day);const wrap=el('div',undefined,'cn-chart-column');
      const num=el('small',money(val),'cn-chart-num');
      const bar=el('div',undefined,'cn-chart-bar');bar.style.height=Math.max(8,Math.round(val/max*155))+'px';bar.title=dateLabel(day)+' · '+money(val);
      const label=el('small',day.slice(5).replace('-','/'),'cn-chart-label');wrap.append(num,bar,label);chart.append(wrap);
    });box.append(chart);
  }
  function drawProductBars(values){
    const box=$('cn-product-bars');box.replaceChildren();const byName=new Map();
    values.forEach(s=>byName.set(s.product,(byName.get(s.product)||0)+s.total));
    const total=[...byName.values()].reduce((s,n)=>s+n,0);
    if(!total){box.append(el('p','Todavía no hay productos vendidos.','cn-empty-chart'));return;}
    [...byName.entries()].sort((a,b)=>b[1]-a[1]).forEach(([name,revenue])=>{
      const item=el('div',undefined,'cn-product-bar'); const heading=el('div',undefined,'cn-bar-label');heading.append(el('strong',name),el('span',money(revenue)));
      const track=el('div',undefined,'cn-bar-track');const fill=el('div',undefined,'cn-bar-fill');fill.style.width=(revenue/total*100).toFixed(1)+'%';track.append(fill);
      item.append(heading,track);box.append(item);
    });
  }
  function open(){if(!isAdmin())return;$('cn-sale-form').reset();const now=new Date();const localDate=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');$('cn-sale-date').value=localDate;$('cn-sale-dialog').showModal();}
  $('cn-report-add').addEventListener('click',open);$('cn-report-empty-add').addEventListener('click',open);
  for(const id of ['cn-sale-cancel','cn-sale-back'])$(id).addEventListener('click',()=>$('cn-sale-dialog').close());
  $('cn-sale-form').addEventListener('submit',event=>{
    event.preventDefault();if(!isAdmin())return;
    const date=$('cn-sale-date').value,product=$('cn-sale-product').value,kind=$('cn-sale-kind').value;
    const units=Number($('cn-sale-qty').value),total=Number($('cn-sale-amount').value);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(units)||units<1||!Number.isFinite(total)||total<=0)return;
    const sale={id:'manual-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),date,product,kind,units,total,notes:$('cn-sale-notes').value.trim(),source:'manual'};
    sales.push(sale);save();$('cn-sale-dialog').close();render();
  });
  $('cn-sale-product').addEventListener('change',suggestTotal);$('cn-sale-kind').addEventListener('change',suggestTotal);$('cn-sale-qty').addEventListener('input',suggestTotal);
  function suggestTotal(){
    const product=$('cn-sale-product').value,units=Number($('cn-sale-qty').value)||1;
    const per=$('cn-sale-kind').value==='Mayorista'?6800:product.includes('Conserva')?8500:7500;
    $('cn-sale-amount').value=String(units*per);
  }
  $('cn-sales-rows').addEventListener('click',event=>{const button=event.target.closest('[data-sale-id]');if(!button||!isAdmin())return;pendingDelete=button.dataset.saleId;$('cn-delete-sale-dialog').showModal();});
  for(const id of ['cn-delete-sale-cancel','cn-delete-sale-close'])$(id).addEventListener('click',()=>$('cn-delete-sale-dialog').close());
  $('cn-delete-sale-confirm').addEventListener('click',()=>{if(!isAdmin()||!pendingDelete)return;sales=sales.filter(s=>s.id!==pendingDelete);pendingDelete=null;save();$('cn-delete-sale-dialog').close();render();});
  $('cn-period').addEventListener('change',render);
  $('cn-report-export').addEventListener('click',()=>{
    if(!isAdmin())return;
    const vals=getFiltered();if(!vals.length){alert('No hay datos para exportar en este período.');return;}
    const header=['Fecha','Producto','Modalidad','Unidades','Total CLP','Origen','Observaciones'];
    const escapeCell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
    const rows=[header,...vals.map(s=>[s.date,s.product,s.kind,s.units,s.total,s.source||'manual',s.notes||''])];
    const data='\ufeff'+rows.map(row=>row.map(escapeCell).join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='cran-ensenada-reporte-ventas.csv';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
  });
  render();
})();
