let DRUGS=[];const $=s=>document.querySelector(s);
function renderSuggestions(items){const ul=$('#suggestions');if(!items.length){ul.style.display='none';ul.innerHTML='';return;}ul.innerHTML=items.slice(0,100).map(d=>`<li data-name="${d.name.replace(/"/g,'&quot;')}">${d.name}</li>`).join('');ul.style.display='block';}
function badgeClass(sym){if(sym==='✓')return'badge ok';if(sym==='✕')return'badge no';return'badge na';}
function showDrug(d){$('#drug-name').textContent=d.name;$('#drug-indications').textContent=d.indications||'—';$('#drug-diluents').innerHTML=(d.diluents||[]).map(x=>`<span class="chip">${x}</span>`).join('')||'<span class="muted">—</span>';
const r=d.routes||{};$('#badge-im').className=badgeClass(r.IM||'—');$('#badge-im').textContent=`IM: ${r.IM||'—'}`;$('#badge-ivd').className=badgeClass(r.IV_direct||'—');$('#badge-ivd').textContent=`IV direct: ${r.IV_direct||'—'}`;$('#badge-ivi').className=badgeClass(r.IV_infusion||'—');$('#badge-ivi').textContent=`IV infusion: ${r.IV_infusion||'—'}`;
const other=(d.instructions&&d.instructions.Other)||'';$('#badge-other').textContent=other?`อื่นๆ: ${other.split('\n')[0]}`:'อื่นๆ: —';
$('#inst-im').textContent=d.instructions?.IM||'—';$('#inst-ivd').textContent=d.instructions?.IV_direct||'—';$('#inst-ivi').textContent=d.instructions?.IV_infusion||'—';$('#inst-other').textContent=d.instructions?.Other||'—';
const sel=$('#diluent-select');sel.innerHTML=(d.diluents||[]).map(x=>`<option>${x}</option>`).join('');$('#conc-result').textContent='';$('#drug-card').classList.remove('hidden');$('#drug-card').dataset.current=JSON.stringify(d);}
function calcConc(e){e.preventDefault();const dose=parseFloat($('#dose-mg').value||'0');const vol=parseFloat($('#volume-ml').value||'0');if(vol<=0){$('#conc-result').textContent='กรอกปริมาตรให้ถูกต้อง';return;}const conc=dose/vol;const d=JSON.parse($('#drug-card').dataset.current||'{}');let msg=`ความเข้มข้น = ${conc.toFixed(3)} mg/mL`;const min=d?.concentration_mg_per_ml?.min,max=d?.concentration_mg_per_ml?.max;if(min!=null&&max!=null){if(conc<min)msg+=` • ต่ำกว่าช่วงแนะนำ (${min}-${max})`;else if(conc>max)msg+=` • สูงกว่าช่วงแนะนำ (${min}-${max})`;else msg+=` • อยู่ในช่วงแนะนำ (${min}-${max})`;}
$('#conc-result').textContent=msg;}
async function load(){try{const resp=await fetch('./drugs.json');DRUGS=await resp.json();}catch(e){console.error(e);DRUGS=[];}
$('#search').addEventListener('input',function(){const q=this.value.trim().toLowerCase();if(!q){renderSuggestions([]);return;}renderSuggestions(DRUGS.filter(d=>d.name.toLowerCase().includes(q)));});
$('#suggestions').addEventListener('click',ev=>{if(ev.target.tagName==='LI'){const name=ev.target.getAttribute('data-name');const d=DRUGS.find(x=>x.name===name);if(d){showDrug(d);$('#suggestions').style.display='none';}}});
$('#conc-form').addEventListener('submit',calcConc);if(DRUGS.length){showDrug(DRUGS[0]);}}
document.addEventListener('DOMContentLoaded',load);

/* ==== Enhancements injected ==== */
(function(){
  const Q = (sel)=>document.querySelector(sel);
  const hideIfEmpty = (idWrap, idContent) => {
    const wrap = Q(idWrap);
    const content = Q(idContent);
    if(!wrap || !content) return;
    const txt = (content.textContent||"").trim();
    if(!txt || txt === "—" || txt === "-") { wrap.style.display = "none"; }
    else { wrap.style.display = ""; }
  };

  // Hook into the existing render of a drug card:
  const _renderDrug = window.renderDrug || window.showDrug;
  if (_renderDrug) {
    const wrapped = function(d){
      const r = _renderDrug.call(this, d);
      // show code under name (fallback '-')
      const codeEl = document.getElementById('drug-code');
      if (codeEl && d) { codeEl.textContent = d.code ? ("โค้ด: " + d.code) : "โค้ด: —"; }

      // hide instruction blocks that are empty
      hideIfEmpty('#inst-im-wrap','#inst-im');
      hideIfEmpty('#inst-ivd-wrap','#inst-ivd');
      hideIfEmpty('#inst-ivi-wrap','#inst-ivi');

      // make calc compact
      const calc = document.getElementById('calc');
      if (calc) calc.classList.add('calc-mini');
      return r;
    };
    if (window.renderDrug) window.renderDrug = wrapped;
    else window.showDrug = wrapped;
  }

  // Typeahead highlight for suggestions
  function highlight(text, query){
    if(!query) return text;
    try{
      const esc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(esc, 'ig');
      return text.replace(rx, (m)=>'<mark>'+m+'</mark>');
    }catch(e){ return text; }
  }
  const sug = document.getElementById('suggestions');
  const input = document.getElementById('searchInput');
  if (sug && input){
    const origRender = window.renderSuggestions;
    if (origRender){
      window.renderSuggestions = function(items){
        origRender.call(this, items);
        // enhance with highlighting
        const q = input.value.trim();
        [...sug.querySelectorAll('li')].forEach(li=>{
          const t = li.getAttribute('data-name') || li.textContent;
          if (!t) return;
          li.innerHTML = highlight(t, q);
        });
      }
    }else{
      input.addEventListener('input', ()=>{
        const q = input.value.trim();
        [...sug.querySelectorAll('li')].forEach(li=>{
          const t = li.getAttribute('data-name') || li.textContent;
          if (!t) return;
          li.innerHTML = highlight(t, q);
        });
      });
    }
  }
})();
