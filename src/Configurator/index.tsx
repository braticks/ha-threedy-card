import React, {useEffect, useRef, useState} from 'react';

const known = {Status:'Būsena',ETA:'Pabaiga · ETA',Remaining:'Likęs laikas',Elapsed:'Praėjęs laikas',Hotend:'Antgalis',Bed:'Stalas',Chamber:'Kameros temperatūra',CurrentLayer:'Sluoksnis',TotalLayers:'Iš viso sluoksnių',FileName:'Failas'};
const control = {boxSizing:'border-box',width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid var(--divider-color, #888)',background:'var(--card-background-color, white)',color:'var(--primary-text-color, #222)',fontSize:14};
const field = {display:'grid',gap:6,margin:'12px 0'};
const row = {display:'flex',alignItems:'center',gap:10,margin:'10px 0',flexWrap:'wrap'};
const Configurator = ({hass, config, threedy}) => {
    const [current,setCurrent] = useState(config || {type:'custom:threedy-card'});
    const latest = useRef(current);
    useEffect(()=>{ const next=config || {type:'custom:threedy-card'}; latest.current=next;setCurrent(next); },[config]);
    const [newKey,setNewKey] = useState('');
    const update = changes => {
        const next={...latest.current,...changes};latest.current=next;setCurrent(next);
        threedy.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));
    };
    const sensor = (key, changes) => update({sensors:{...latest.current.sensors,[key]:{...latest.current.sensors?.[key],...changes}}});
    const monitored=current.monitored || [];
    const keys=Array.from(new Set([...Object.keys(known),...monitored,...Object.keys(current.sensors || {}).filter(k=>!['Progress','progress'].includes(k))]));
    const toggle = key => update({monitored:monitored.includes(key)?monitored.filter(v=>v!==key):[...monitored,key]});
    const move = (key,direction) => {
        const list=[...monitored],i=list.indexOf(key),j=i+direction;
        if(i<0 || j<0 || j>=list.length)return;
        [list[i],list[j]]=[list[j],list[i]];update({monitored:list});
    };
    const text = (label, value, change, props={}) => <label style={field}><span>{label}</span><input aria-label={label} style={control} value={value ?? ''} onChange={e=>change(e.target.value)} {...props}/></label>;
    const select = (label,value,options,change) => <label style={field}><span>{label}</span><select aria-label={label} style={control} value={value} onChange={e=>change(e.target.value)}>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>;
    const check = (label,key,defaultValue=false) => <label style={row}><input type="checkbox" checked={current[key] ?? defaultValue} onChange={e=>update({[key]:e.target.checked})}/><span>{label}</span></label>;
    const entityField = (label,value,change) => text(label,value,change,{list:'threedy-entities',placeholder:'sensor.…'});
    return <div style={{padding:16,color:'var(--primary-text-color)',fontFamily:'var(--primary-font-family, sans-serif)',boxSizing:'border-box',width:'100%'}}>
        <datalist id="threedy-entities">{Object.keys(hass?.states || {}).sort().map(id=><option key={id} value={id}>{hass.states[id].attributes?.friendly_name || id}</option>)}</datalist>
        {text('Pavadinimas',current.name,v=>update({name:v}))}
        {select('Spausdintuvo piešinys',current.printer_type || 'I3',[['I3','I3'],['Cantilever','Cantilever'],['CoreXY','CoreXY · uždaras korpusas']],v=>update({printer_type:v}))}
        {entityField('Progreso jutiklis',current.sensors?.Progress?.entity || current.sensors?.progress?.entity,v=>sensor('Progress',{entity:v}))}
        {entityField('Būsenos jutiklis',current.sensors?.Status?.entity,v=>sensor('Status',{entity:v}))}
        <h3>Rodoma informacija</h3>
        <p>Pažymėk laukus, kuriuos nori matyti kortoje. Rodyklėmis pakeisk jų tvarką.</p>
        {keys.map(key=><div key={key} style={{borderBottom:'1px solid var(--divider-color)',padding:'8px 0'}}>
            <div style={row}><label style={{flex:1,display:'flex',gap:10,alignItems:'center'}}><input type="checkbox" checked={monitored.includes(key)} onChange={()=>toggle(key)}/><span>{known[key] || current.sensors?.[key]?.name || key}</span></label>
                {monitored.includes(key) && <><button type="button" aria-label={`Aukštyn ${key}`} disabled={monitored.indexOf(key)===0} onClick={()=>move(key,-1)}>↑</button><button type="button" aria-label={`Žemyn ${key}`} disabled={monitored.indexOf(key)===monitored.length-1} onClick={()=>move(key,1)}>↓</button></>}
            </div>
            <details><summary>Jutiklis ir užrašas · {key}</summary>
                {entityField(`${key} entitetas`,current.sensors?.[key]?.entity,v=>sensor(key,{entity:v}))}
                {text(`${key} užrašas`,current.sensors?.[key]?.name,v=>sensor(key,{name:v}))}
                {text(`${key} atributas`,current.sensors?.[key]?.attribute,v=>sensor(key,{attribute:v}))}
                {['ETA','Remaining','Elapsed'].includes(key) ? select(`${key} laiko vienetas`,current.sensors?.[key]?.unit || '',[['','Automatiškai'],['s','Sekundės'],['min','Minutės'],['h','Valandos']],v=>{const next={...current.sensors?.[key]};if(v)next.unit=v;else delete next.unit;update({sensors:{...current.sensors,[key]:next}});}) : !['Status','Hotend','Bed'].includes(key) && text(`${key} skaičiai po kablelio`,current.sensors?.[key]?.precision,v=>{const next={...current.sensors?.[key]};if(v==='')delete next.precision;else next.precision=Math.max(0,Math.min(10,Number(v)));update({sensors:{...current.sensors,[key]:next}});},{type:'number',min:0,max:10})}
            </details>
        </div>)}
        <div style={row}><input aria-label="Naujo lauko raktas" placeholder="Papildomas laukas" value={newKey} onChange={e=>setNewKey(e.target.value)} style={{...control,flex:1}}/><button type="button" disabled={!newKey.trim() || keys.includes(newKey.trim())} onClick={()=>{const key=newKey.trim();update({sensors:{...current.sensors,[key]:{}},monitored:[...monitored,key]});setNewKey('');}}>Pridėti</button></div>
        <h3>Išvaizda</h3>
        {check('Visada rodyti išskleistą kortą','always_show')}
        {check('Rodyti antraštę','show_header',true)}
        {check('Rodyti informaciją','show_stats',true)}
        {check('Vertikalus išdėstymas','vertical')}
        {check('Rodyti sekundes','show_seconds',true)}
        {check('Apvalinti laiką žodžiais','round_time')}
        {check('Apvalinti temperatūrą','round_temperature')}
        {check('24 valandų laikas','use_24hr')}
        {select('Tema',current.theme || 'Default',[['Default','Standartinė'],['Neumorphic','Neumorphic']],v=>update({theme:v}))}
        {select('Temperatūros vienetas',current.temperature_unit || 'C',[['C','°C'],['F','°F']],v=>update({temperature_unit:v}))}
        {text('Piešinio mastelis',current.scale ?? 1,v=>update({scale:Number(v)}),{type:'number',min:.25,max:1,step:.05})}
        {entityField('Kamera',current.camera_entity,v=>update({camera_entity:v}))}
        {entityField('Maitinimo jungiklis',current.power_entity,v=>update({power_entity:v}))}
        {entityField('Apšvietimo jungiklis',current.light_entity,v=>update({light_entity:v}))}
        <details><summary>Suderinamumas ir animacija</summary>
            {text('Bazinis entitetas (OctoPrint)',current.base_entity,v=>update({base_entity:v}))}
            {check('Naudoti OctoPrint MQTT','use_mqtt')}
            {text('Spausdinimo būsenos, atskirtos kableliu',current.printing_states?.join(', ') || '',v=>{const next={...latest.current};const values=v.split(',').map(s=>s.trim()).filter(Boolean);if(values.length)next.printing_states=values;else delete next.printing_states;latest.current=next;setCurrent(next);threedy.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));})}
        </details>
    </div>;
};
export default Configurator;
