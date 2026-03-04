import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, PieChart, Pie
} from "recharts";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ORIGINS     = ["6m","9m","Extremo-Izq","Extremo-Der","Pivote","Penal","Contraataque"];
const TECHNIQUES  = ["Suspensión","Apoyo","Caída","Globo","Rectificado","Vaselina","Penal"];
const PHASES      = ["Posicional","Contraataque","2ª Oleada"];
const NUMERIC_SIT = ["Igualdad","Superioridad","Inferioridad"];
const DEFENSE_SYS = ["6:0","5:1","3:2:1","Individual","Inferioridad"];
const DISTANCES   = ["Corta","Media","Larga"];
const RESULTS     = ["Parada","Gol","Poste","Fuera"];
const ZONE_POS    = {1:[0,0],2:[1,0],3:[2,0],4:[0,1],5:[1,1],6:[2,1],7:[0,2],8:[1,2],9:[2,2]};
const ZONE_LABELS = {1:"↖ S-Izq",2:"↑ S-Cen",3:"↗ S-Der",4:"← M-Izq",5:"• Centro",6:"→ M-Der",7:"↙ I-Izq",8:"↓ I-Cen",9:"↘ I-Der"};
const CHART_COLORS = ["#00ff87","#00d4ff","#ff4757","#ffa502","#a29bfe","#fd79a8","#55efc4","#fdcb6e"];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const genId  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const pct    = (n, t) => t > 0 ? Math.round((n / t) * 100) : 0;
const saves  = (shots) => shots.filter(s => s.result === "Parada").length;
const goals  = (shots) => shots.filter(s => s.result === "Gol").length;
const eff    = (shots) => pct(saves(shots), shots.filter(s => s.result==="Parada"||s.result==="Gol").length);

const groupStats = (shots, key, keys) =>
  keys.map(k => {
    const g = shots.filter(s => s[key] === k);
    const on = g.filter(s => s.result==="Parada"||s.result==="Gol");
    return { name: k, total: g.length, saves: saves(g), goals: goals(g), pct: eff(g), onTarget: on.length };
  });

const exportCSV = (shots, matchName) => {
  const headers = ["Tiempo","Portero","Origen","Técnica","Zona","Distancia","Sistema Def.","Situación","Fase","Resultado"];
  const rows = shots.map(s => [s.timeMin||"",s.gkName||"",s.origin,s.technique,s.zone,s.distance,s.defense,s.numeric,s.phase,s.result]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
  a.download = `handball_${matchName||"match"}_${Date.now()}.csv`;
  a.click();
};

// ─── STORAGE HOOK ─────────────────────────────────────────────────────────────
function useStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });
  const save = useCallback(v => {
    const next = typeof v === "function" ? v(val) : v;
    setVal(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [key, val]);
  return [val, save];
}

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#070d1a", card:"#0d1526", card2:"#111e35", border:"#1a2d4a",
  accent:"#00ff87", accent2:"#00d4ff", red:"#ff4757", warn:"#ffa502",
  text:"#e2e8f0", muted:"#4a6080", font:"'Courier New', monospace",
};

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
const Card = ({children, style={}}) => (
  <div style={{background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:20, ...style}}>
    {children}
  </div>
);

const Sec = ({title, children, action}) => (
  <div style={{marginBottom:32}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <h2 style={{margin:0,fontSize:14,fontWeight:"bold",color:T.accent,letterSpacing:3,textTransform:"uppercase"}}>
        ▸ {title}
      </h2>
      {action}
    </div>
    {children}
  </div>
);

const Btn = ({children, onClick, variant="primary", small, style={}}) => {
  const bg = variant==="primary" ? T.accent : variant==="danger" ? T.red : variant==="ghost" ? "transparent" : T.card2;
  const color = (variant==="primary") ? T.bg : (variant==="secondary") ? T.text : (variant==="ghost") ? T.muted : T.text;
  return (
    <button onClick={onClick} style={{
      background:bg, color, border: variant==="ghost" ? `1px solid ${T.border}` : "none",
      borderRadius:8, padding: small ? "6px 14px" : "10px 20px",
      fontSize: small ? 12 : 13, fontFamily:T.font, fontWeight:"bold",
      cursor:"pointer", transition:"all .15s", ...style,
    }}>{children}</button>
  );
};

const StatBox = ({label, value, sub, color=T.accent}) => (
  <Card style={{textAlign:"center",padding:"16px 12px"}}>
    <div style={{fontSize:28,fontWeight:"bold",color,fontFamily:T.font}}>{value}</div>
    <div style={{fontSize:11,color:T.muted,marginTop:4,letterSpacing:1}}>{label}</div>
    {sub && <div style={{fontSize:12,color:T.text,marginTop:2}}>{sub}</div>}
  </Card>
);

const Input = ({label, value, onChange, type="text", options, required}) => (
  <div style={{marginBottom:12}}>
    <label style={{display:"block",fontSize:11,color:T.muted,letterSpacing:1,marginBottom:4}}>{label}{required&&" *"}</label>
    {options ? (
      <select value={value} onChange={e=>onChange(e.target.value)} style={{
        width:"100%", background:T.card2, color:T.text, border:`1px solid ${T.border}`,
        borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:T.font,
      }}>
        <option value="">— Seleccionar —</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} style={{
        width:"100%", background:T.card2, color:T.text, border:`1px solid ${T.border}`,
        borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:T.font, boxSizing:"border-box",
      }}/>
    )}
  </div>
);

const PctBar = ({value, color=T.accent}) => (
  <div style={{background:T.border,borderRadius:4,height:6,marginTop:4}}>
    <div style={{width:`${value}%`,background:color,borderRadius:4,height:"100%",transition:"width .4s"}}/>
  </div>
);

const StatsTable = ({data}) => (
  <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:T.font}}>
      <thead>
        <tr style={{borderBottom:`1px solid ${T.border}`}}>
          {["","Lanz","Goles","Paradas","% Efect"].map(h=>(
            <th key={h} style={{padding:"8px 12px",color:T.muted,fontWeight:"normal",textAlign:h===""?"left":"center",whiteSpace:"nowrap"}}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.filter(r=>r.total>0).map((r,i)=>(
          <tr key={i} style={{borderBottom:`1px solid ${T.border}22`}}>
            <td style={{padding:"10px 12px",color:T.text,fontWeight:"bold"}}>{r.name}</td>
            <td style={{padding:"10px 12px",color:T.muted,textAlign:"center"}}>{r.total}</td>
            <td style={{padding:"10px 12px",color:T.red,textAlign:"center",fontWeight:"bold"}}>{r.goals}</td>
            <td style={{padding:"10px 12px",color:T.accent,textAlign:"center"}}>{r.saves}</td>
            <td style={{padding:"10px 12px",textAlign:"center"}}>
              <span style={{color: r.pct>=70?T.accent:r.pct>=50?T.warn:T.red, fontWeight:"bold"}}>{r.pct}%</span>
              <PctBar value={r.pct} color={r.pct>=70?T.accent:r.pct>=50?T.warn:T.red}/>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── MATCHES VIEW ─────────────────────────────────────────────────────────────
function MatchesView({matches, setMatches, activeMatch, setActiveMatch, setTab}) {
  const empty = {id:genId(),date:new Date().toISOString().split("T")[0],opponent:"",season:"",competition:"",goalkeepers:[{id:genId(),name:"Portero 1"}],shots:[]};
  const [form, setForm] = useState(null);
  const [gkName, setGkName] = useState("");

  const save = () => {
    if (!form.opponent) return alert("Ingresa el nombre del rival");
    if (matches.find(m=>m.id===form.id)) setMatches(prev=>prev.map(m=>m.id===form.id?form:m));
    else setMatches(prev=>[...prev,form]);
    setForm(null);
  };

  const del = (id) => {
    if (!confirm("¿Eliminar este partido y todos sus datos?")) return;
    setMatches(prev=>prev.filter(m=>m.id!==id));
    if (activeMatch===id) setActiveMatch(null);
  };

  const addGK = () => {
    if (!gkName.trim()) return;
    setForm(f=>({...f,goalkeepers:[...f.goalkeepers,{id:genId(),name:gkName.trim()}]}));
    setGkName("");
  };

  const removeGK = (id) => setForm(f=>({...f,goalkeepers:f.goalkeepers.filter(g=>g.id!==id)}));

  const select = (m) => { setActiveMatch(m.id); setTab("register"); };

  return (
    <div>
      <Sec title="Gestión de Partidos" action={<Btn onClick={()=>setForm({...empty,id:genId()})}>+ Nuevo Partido</Btn>}>
        {matches.length === 0 && (
          <Card style={{textAlign:"center",padding:48}}>
            <div style={{fontSize:48,marginBottom:12}}>🏐</div>
            <div style={{color:T.muted,marginBottom:20}}>No hay partidos registrados. Crea el primero.</div>
            <Btn onClick={()=>setForm({...empty,id:genId()})}>+ Crear Partido</Btn>
          </Card>
        )}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {matches.map(m=>(
            <Card key={m.id} style={{borderColor: activeMatch===m.id ? T.accent : T.border, cursor:"pointer"}} onClick={()=>select(m)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:16,fontWeight:"bold",color:T.text}}>vs {m.opponent}</div>
                  <div style={{fontSize:12,color:T.muted,marginTop:4}}>{m.date} {m.competition&&`· ${m.competition}`}</div>
                  <div style={{display:"flex",gap:12,marginTop:10}}>
                    <span style={{fontSize:12,color:T.accent}}>🏐 {m.shots?.length||0} lanzamientos</span>
                    <span style={{fontSize:12,color:T.muted}}>🧤 {m.goalkeepers?.length||0} porteros</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <Btn small variant="secondary" onClick={e=>{e.stopPropagation();setForm(m);}}>✏️</Btn>
                  <Btn small variant="danger" onClick={e=>{e.stopPropagation();del(m.id);}}>🗑️</Btn>
                </div>
              </div>
              {activeMatch===m.id && (
                <div style={{marginTop:10,fontSize:11,color:T.accent,letterSpacing:1}}>▸ PARTIDO ACTIVO</div>
              )}
            </Card>
          ))}
        </div>
      </Sec>

      {form && (
        <div style={{position:"fixed",inset:0,background:"#000a",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
          <Card style={{width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"}}>
            <h3 style={{margin:"0 0 20px",color:T.accent}}>{form.opponent?"Editar":"Nuevo"} Partido</h3>
            <Input label="RIVAL" value={form.opponent} onChange={v=>setForm(f=>({...f,opponent:v}))} required/>
            <Input label="FECHA" type="date" value={form.date} onChange={v=>setForm(f=>({...f,date:v}))}/>
            <Input label="COMPETICIÓN" value={form.competition||""} onChange={v=>setForm(f=>({...f,competition:v}))}/>
            <Input label="TEMPORADA" value={form.season||""} onChange={v=>setForm(f=>({...f,season:v}))}/>
            <div style={{margin:"16px 0 8px",fontSize:11,color:T.muted,letterSpacing:1}}>PORTEROS</div>
            {form.goalkeepers.map(g=>(
              <div key={g.id} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                <div style={{flex:1,background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 14px",fontSize:13,color:T.text}}>🧤 {g.name}</div>
                {form.goalkeepers.length>1 && <Btn small variant="danger" onClick={()=>removeGK(g.id)}>×</Btn>}
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <input value={gkName} onChange={e=>setGkName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGK()}
                placeholder="Nombre del portero..." style={{flex:1,background:T.card2,color:T.text,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:T.font}}/>
              <Btn small onClick={addGK}>+ Agregar</Btn>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn variant="ghost" onClick={()=>setForm(null)}>Cancelar</Btn>
              <Btn onClick={save}>💾 Guardar</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── REGISTER VIEW ────────────────────────────────────────────────────────────
const SHOT_INIT = {gkId:"",gkName:"",origin:"",technique:"",zone:"",distance:"",defense:"",numeric:"",phase:"",result:"",timeMin:""};

function RegisterView({match, addShot, deleteShot, shots}) {
  const [form, setForm] = useState(SHOT_INIT);
  const [filter, setFilter] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleGK = (id) => {
    const gk = match.goalkeepers.find(g=>g.id===id);
    setForm(f=>({...f,gkId:id,gkName:gk?.name||""}));
  };

  const submit = () => {
    const req = ["gkId","origin","technique","zone","distance","defense","numeric","phase","result"];
    if (req.some(k=>!form[k])) return alert("Completa todos los campos obligatorios (*)");
    addShot({...form});
    setForm(prev=>({...SHOT_INIT, gkId:prev.gkId, gkName:prev.gkName, defense:prev.defense, numeric:prev.numeric, phase:prev.phase, timeMin:prev.timeMin}));
  };

  const lastShots = [...shots].reverse().slice(0,30).filter(s=>!filter||s.gkName.includes(filter)||s.origin.includes(filter)||s.result.includes(filter));

  const resultColor = {Parada:T.accent, Gol:T.red, Poste:T.warn, Fuera:T.muted};

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
      {/* FORM */}
      <div>
        <Sec title={`Registrar Lanzamiento · vs ${match.opponent}`}>
          <Card>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
              <div>
                <div style={{marginBottom:12}}>
                  <label style={{display:"block",fontSize:11,color:T.muted,letterSpacing:1,marginBottom:4}}>PORTERO *</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {match.goalkeepers.map(g=>(
                      <button key={g.id} onClick={()=>handleGK(g.id)} style={{
                        background: form.gkId===g.id ? T.accent : T.card2,
                        color: form.gkId===g.id ? T.bg : T.text,
                        border:`1px solid ${form.gkId===g.id?T.accent:T.border}`,
                        borderRadius:8, padding:"8px 14px", fontSize:12, fontFamily:T.font, cursor:"pointer"
                      }}>🧤 {g.name}</button>
                    ))}
                  </div>
                </div>
                <Input label="MIN. PARTIDO" type="number" value={form.timeMin} onChange={v=>set("timeMin",v)}/>
                <Input label="ORIGEN *" value={form.origin} onChange={v=>set("origin",v)} options={ORIGINS}/>
                <Input label="TÉCNICA *" value={form.technique} onChange={v=>set("technique",v)} options={TECHNIQUES}/>
                <Input label="DISTANCIA *" value={form.distance} onChange={v=>set("distance",v)} options={DISTANCES}/>
              </div>
              <div>
                <Input label="FASE *" value={form.phase} onChange={v=>set("phase",v)} options={PHASES}/>
                <Input label="SISTEMA DEF. *" value={form.defense} onChange={v=>set("defense",v)} options={DEFENSE_SYS}/>
                <Input label="SITUACIÓN *" value={form.numeric} onChange={v=>set("numeric",v)} options={NUMERIC_SIT}/>

                <div style={{marginBottom:12}}>
                  <label style={{display:"block",fontSize:11,color:T.muted,letterSpacing:1,marginBottom:8}}>ZONA PORTERÍA * (9 zonas)</label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4,background:T.border,padding:4,borderRadius:8}}>
                    {[1,2,3,4,5,6,7,8,9].map(z=>(
                      <button key={z} onClick={()=>set("zone",String(z))} style={{
                        background: form.zone===String(z) ? T.accent : T.card2,
                        color: form.zone===String(z) ? T.bg : T.text,
                        border:"none", borderRadius:6, padding:"10px 4px", fontSize:10,
                        fontFamily:T.font, cursor:"pointer", fontWeight: form.zone===String(z)?"bold":"normal"
                      }}>{ZONE_LABELS[z]}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{marginTop:8}}>
              <label style={{display:"block",fontSize:11,color:T.muted,letterSpacing:1,marginBottom:8}}>RESULTADO *</label>
              <div style={{display:"flex",gap:8}}>
                {RESULTS.map(r=>(
                  <button key={r} onClick={()=>set("result",r)} style={{
                    flex:1, background: form.result===r ? resultColor[r]||T.accent : T.card2,
                    color: form.result===r ? (r==="Parada"||r==="Poste"?T.bg:T.text) : T.text,
                    border:`1px solid ${form.result===r?resultColor[r]||T.accent:T.border}`,
                    borderRadius:8, padding:"12px 4px", fontFamily:T.font, fontSize:12,
                    fontWeight:"bold", cursor:"pointer",
                  }}>
                    {r==="Parada"?"🧤":r==="Gol"?"🥅":r==="Poste"?"🔕":"↗"} {r}
                  </button>
                ))}
              </div>
            </div>

            <Btn style={{width:"100%",marginTop:16,padding:"14px",fontSize:14}} onClick={submit}>
              ⚡ REGISTRAR LANZAMIENTO ({shots.length})
            </Btn>
          </Card>
        </Sec>
      </div>

      {/* LAST SHOTS */}
      <div>
        <Sec title="Últimos Lanzamientos" action={
          <div style={{display:"flex",gap:8}}>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrar..."
              style={{background:T.card2,color:T.text,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",fontSize:12,fontFamily:T.font,width:120}}/>
            <Btn small variant="secondary" onClick={()=>exportCSV(shots,match.opponent)}>📥 CSV</Btn>
          </div>
        }>
          <Card style={{padding:0,overflow:"hidden"}}>
            <div style={{overflowY:"auto",maxHeight:520}}>
              {lastShots.length===0&&<div style={{padding:32,textAlign:"center",color:T.muted}}>Sin lanzamientos aún</div>}
              {lastShots.map((s,i)=>(
                <div key={s.id||i} style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:`1px solid ${T.border}22`,gap:8}}>
                  <span style={{fontSize:10,color:T.muted,minWidth:28}}>#{shots.length-i}</span>
                  <span style={{fontSize:11,color:T.accent2,minWidth:60}}>{s.gkName}</span>
                  <span style={{fontSize:11,color:T.muted,flex:1}}>{s.origin} · Z{s.zone} · {s.technique}</span>
                  <span style={{fontSize:12,fontWeight:"bold",color:resultColor[s.result]||T.text,minWidth:56,textAlign:"center",background:resultColor[s.result]+"22",borderRadius:4,padding:"2px 6px"}}>{s.result}</span>
                  {s.timeMin&&<span style={{fontSize:10,color:T.muted}}>{s.timeMin}'</span>}
                  <button onClick={()=>deleteShot(s.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,padding:4}}>×</button>
                </div>
              ))}
            </div>
          </Card>
        </Sec>
      </div>
    </div>
  );
}

// ─── TEAM STATS ───────────────────────────────────────────────────────────────
function TeamStatsView({shots, match}) {
  const onTarget = shots.filter(s=>s.result==="Parada"||s.result==="Gol");
  const totalSaves = saves(shots);
  const totalGoals = goals(shots);
  const eff70 = eff(shots);

  // Timeline: group by every 5 min
  const timeline = useMemo(() => {
    const buckets = {};
    shots.filter(s=>s.timeMin).forEach(s=>{
      const b = Math.floor((+s.timeMin)/5)*5;
      if(!buckets[b]) buckets[b]={min:b,saves:0,goals:0};
      if(s.result==="Parada") buckets[b].saves++;
      if(s.result==="Gol") buckets[b].goals++;
    });
    return Object.values(buckets).sort((a,b)=>a.min-b.min).map(b=>({...b, pct:pct(b.saves,b.saves+b.goals)}));
  }, [shots]);

  const byResult = RESULTS.map(r=>({name:r, value:shots.filter(s=>s.result===r).length}));

  return (
    <div>
      <Sec title={`Estadísticas Equipo · vs ${match.opponent}`}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:24}}>
          <StatBox label="LANZAMIENTOS" value={shots.length}/>
          <StatBox label="AL ARCO" value={onTarget.length} color={T.accent2}/>
          <StatBox label="PARADAS" value={totalSaves} color={T.accent}/>
          <StatBox label="GOLES" value={totalGoals} color={T.red}/>
          <StatBox label="EFECTIVIDAD" value={`${eff70}%`} color={eff70>=70?T.accent:eff70>=50?T.warn:T.red}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
          <Card>
            <div style={{fontSize:12,color:T.accent,letterSpacing:2,marginBottom:12}}>EVOLUCIÓN TEMPORAL</div>
            {timeline.length>0?(
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="min" stroke={T.muted} tick={{fontSize:10,fill:T.muted}} label={{value:"Min",position:"insideRight",fill:T.muted}}/>
                  <YAxis stroke={T.muted} tick={{fontSize:10,fill:T.muted}}/>
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,color:T.text,fontSize:11}}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Line type="monotone" dataKey="saves" stroke={T.accent} name="Paradas" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="goals" stroke={T.red} name="Goles" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="pct" stroke={T.accent2} name="% Ef." strokeWidth={2} dot={false} strokeDasharray="4 2"/>
                </LineChart>
              </ResponsiveContainer>
            ):<div style={{color:T.muted,textAlign:"center",padding:60,fontSize:12}}>Registra lanzamientos con minuto para ver evolución</div>}
          </Card>

          <Card>
            <div style={{fontSize:12,color:T.accent,letterSpacing:2,marginBottom:12}}>DISTRIBUCIÓN RESULTADOS</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byResult.filter(r=>r.value>0)} cx="50%" cy="50%" outerRadius={80}
                  dataKey="value" nameKey="name" label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                  {byResult.map((_,i)=><Cell key={i} fill={[T.accent,T.red,T.warn,T.muted][i]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,color:T.text,fontSize:11}}/>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </Sec>
    </div>
  );
}

// ─── GK STATS ─────────────────────────────────────────────────────────────────
function GKStatsView({shots, match}) {
  const gkStats = match.goalkeepers.map(g=>{
    const gs = shots.filter(s=>s.gkId===g.id);
    const on = gs.filter(s=>s.result==="Parada"||s.result==="Gol");
    return {name:g.name, total:gs.length, saves:saves(gs), goals:goals(gs), pct:eff(gs), onTarget:on.length,
      posts:gs.filter(s=>s.result==="Poste").length, out:gs.filter(s=>s.result==="Fuera").length};
  }).filter(g=>g.total>0);

  const radarData = ["6m","9m","Extremo-Izq","Extremo-Der","Pivote","Penal","Contraataque"].map(origin=>{
    const row = {origin};
    match.goalkeepers.forEach(g=>{
      const gs = shots.filter(s=>s.gkId===g.id&&s.origin===origin);
      row[g.name] = eff(gs);
    });
    return row;
  });

  return (
    <div>
      <Sec title="Estadísticas por Portero">
        {gkStats.length===0&&<Card><div style={{textAlign:"center",color:T.muted,padding:32}}>Sin datos de porteros aún</div></Card>}

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16,marginBottom:24}}>
          {gkStats.map((g,i)=>(
            <Card key={i} style={{borderColor:CHART_COLORS[i%8]}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{width:10,height:10,background:CHART_COLORS[i%8],borderRadius:"50%"}}/>
                <div style={{fontSize:14,fontWeight:"bold",color:T.text}}>🧤 {g.name}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[["LANZ",g.total,T.text],["AL ARCO",g.onTarget,T.accent2],["PARADAS",g.saves,T.accent],["GOLES",g.goals,T.red]].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:"center",background:T.card2,borderRadius:8,padding:"10px 6px"}}>
                    <div style={{fontSize:20,fontWeight:"bold",color:c,fontFamily:T.font}}>{v}</div>
                    <div style={{fontSize:10,color:T.muted}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:"bold",color:g.pct>=70?T.accent:g.pct>=50?T.warn:T.red,fontFamily:T.font}}>{g.pct}%</div>
                <div style={{fontSize:11,color:T.muted}}>Efectividad</div>
                <PctBar value={g.pct} color={g.pct>=70?T.accent:g.pct>=50?T.warn:T.red}/>
              </div>
            </Card>
          ))}
        </div>

        {gkStats.length>1&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <Card>
              <div style={{fontSize:12,color:T.accent,letterSpacing:2,marginBottom:12}}>COMPARATIVA EFECTIVIDAD %</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={gkStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="name" stroke={T.muted} tick={{fontSize:10,fill:T.muted}}/>
                  <YAxis domain={[0,100]} stroke={T.muted} tick={{fontSize:10,fill:T.muted}}/>
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,color:T.text,fontSize:11}}/>
                  <Bar dataKey="pct" name="% Efectividad" radius={[4,4,0,0]}>
                    {gkStats.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%8]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div style={{fontSize:12,color:T.accent,letterSpacing:2,marginBottom:12}}>RADAR POR ORIGEN</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border}/>
                  <PolarAngleAxis dataKey="origin" tick={{fontSize:9,fill:T.muted}}/>
                  <PolarRadiusAxis domain={[0,100]} tick={{fontSize:8,fill:T.muted}}/>
                  {match.goalkeepers.filter(g=>shots.some(s=>s.gkId===g.id)).map((g,i)=>(
                    <Radar key={g.id} name={g.name} dataKey={g.name} stroke={CHART_COLORS[i%8]} fill={CHART_COLORS[i%8]} fillOpacity={0.15}/>
                  ))}
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,color:T.text,fontSize:11}}/>
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </Sec>
    </div>
  );
}

// ─── ZONES VIEW ───────────────────────────────────────────────────────────────
function ZonesView({shots}) {
  const [activeZone, setActiveZone] = useState(null);

  const zoneData = useMemo(()=>{
    const z={};
    for(let i=1;i<=9;i++) {
      const zs=shots.filter(s=>s.zone===String(i));
      z[i]={total:zs.length,saves:saves(zs),goals:goals(zs),pct:eff(zs)};
    }
    return z;
  },[shots]);

  const maxGoals = Math.max(1,...Object.values(zoneData).map(z=>z.goals));
  const maxTotal = Math.max(1,...Object.values(zoneData).map(z=>z.total));

  const heatColor = (zone) => {
    const g = zoneData[zone]?.goals||0;
    const intensity = g/maxGoals;
    const r=Math.round(7+intensity*248), gr=Math.round(13+intensity*-13), b=Math.round(26+intensity*-26);
    return `rgba(${r},${gr},${b},${0.3+intensity*0.7})`;
  };

  const barData = Object.entries(zoneData).filter(([,v])=>v.total>0).map(([k,v])=>({name:`Z${k}`,...v}));

  return (
    <div>
      <Sec title="Mapa de Portería · Distribución por Zonas">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
          <div>
            <Card style={{padding:24}}>
              <div style={{fontSize:12,color:T.accent,letterSpacing:2,marginBottom:16,textAlign:"center"}}>HEATMAP DE GOLES</div>
              {/* Goal visual frame */}
              <div style={{background:T.card2,borderRadius:12,padding:16,border:`2px solid ${T.border}`}}>
                <div style={{fontSize:10,color:T.muted,textAlign:"center",marginBottom:8,letterSpacing:1}}>▲ PORTERÍA ▲</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,position:"relative"}}>
                  {[1,2,3,4,5,6,7,8,9].map(z=>{
                    const d=zoneData[z];
                    const isActive=activeZone===z;
                    return(
                      <div key={z} onClick={()=>setActiveZone(isActive?null:z)} style={{
                        background: heatColor(z), border:`2px solid ${isActive?T.accent:T.border}`,
                        borderRadius:8, padding:"14px 8px", textAlign:"center", cursor:"pointer",
                        transition:"all .2s", transform: isActive?"scale(1.03)":"scale(1)",
                      }}>
                        <div style={{fontSize:20,fontWeight:"bold",color:T.text,fontFamily:T.font}}>{d.goals}</div>
                        <div style={{fontSize:9,color:T.muted,marginTop:2}}>goles</div>
                        <div style={{fontSize:9,color:T.accent,marginTop:1}}>{d.total>0?`${d.pct}%`:"-"}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                  <div style={{fontSize:9,color:T.muted}}>Sin goles</div>
                  <div style={{height:8,flex:1,maxWidth:120,background:"linear-gradient(to right,#070d1a,#ff4757)",borderRadius:4}}/>
                  <div style={{fontSize:9,color:T.red}}>Muchos goles</div>
                </div>
              </div>

              {activeZone&&(
                <div style={{marginTop:12,background:T.card2,borderRadius:8,padding:12,border:`1px solid ${T.accent}`}}>
                  <div style={{fontSize:11,color:T.accent,fontWeight:"bold",marginBottom:8}}>ZONA {activeZone} – {ZONE_LABELS[activeZone]}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,textAlign:"center"}}>
                    {[["Lanz",zoneData[activeZone].total,T.text],["Paradas",zoneData[activeZone].saves,T.accent],["Goles",zoneData[activeZone].goals,T.red],["Efect.",`${zoneData[activeZone].pct}%`,zoneData[activeZone].pct>=70?T.accent:T.warn]].map(([l,v,c])=>(
                      <div key={l}><div style={{fontSize:16,fontWeight:"bold",color:c}}>{v}</div><div style={{fontSize:9,color:T.muted}}>{l}</div></div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card>
              <div style={{fontSize:12,color:T.accent,letterSpacing:2,marginBottom:12}}>GOLES POR ZONA</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="name" stroke={T.muted} tick={{fontSize:10,fill:T.muted}}/>
                  <YAxis stroke={T.muted} tick={{fontSize:10,fill:T.muted}}/>
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,color:T.text,fontSize:11}}/>
                  <Bar dataKey="saves" name="Paradas" fill={T.accent} stackId="a" radius={[0,0,0,0]}/>
                  <Bar dataKey="goals" name="Goles" fill={T.red} stackId="a" radius={[4,4,0,0]}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{marginTop:16}}>
              <div style={{fontSize:12,color:T.accent,letterSpacing:2,marginBottom:12}}>EFECTIVIDAD POR ZONA %</div>
              <StatsTable data={Object.entries(zoneData).map(([k,v])=>({name:`Zona ${k} – ${ZONE_LABELS[k]}`, ...v}))}/>
            </Card>
          </div>
        </div>
      </Sec>
    </div>
  );
}

// ─── ADVANCED VIEW ────────────────────────────────────────────────────────────
function AdvancedView({shots}) {
  const [subtab, setSubtab] = useState("origin");
  const subtabs = [
    {id:"origin",label:"🎯 Origen"},
    {id:"technique",label:"🤸 Técnica"},
    {id:"phase",label:"⏱ Fase"},
    {id:"numeric",label:"🔢 Numérica"},
    {id:"defense",label:"🛡 Sistema"},
    {id:"distance",label:"📏 Distancia"},
  ];

  const config = {
    origin:    {key:"origin",    keys:ORIGINS,     title:"Origen del Lanzamiento"},
    technique: {key:"technique", keys:TECHNIQUES,  title:"Técnica de Lanzamiento"},
    phase:     {key:"phase",     keys:PHASES,       title:"Fase de Juego"},
    numeric:   {key:"numeric",   keys:NUMERIC_SIT,  title:"Situación Numérica"},
    defense:   {key:"defense",   keys:DEFENSE_SYS,  title:"Sistema Defensivo"},
    distance:  {key:"distance",  keys:DISTANCES,    title:"Distancia de Lanzamiento"},
  };

  const {key, keys, title} = config[subtab];
  const data = groupStats(shots, key, keys).filter(r=>r.total>0);

  return (
    <div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
        {subtabs.map(t=>(
          <button key={t.id} onClick={()=>setSubtab(t.id)} style={{
            background: subtab===t.id ? T.accent : T.card, color: subtab===t.id ? T.bg : T.text,
            border:`1px solid ${subtab===t.id?T.accent:T.border}`, borderRadius:8, padding:"8px 16px",
            fontSize:12, fontFamily:T.font, fontWeight:"bold", cursor:"pointer",
          }}>{t.label}</button>
        ))}
      </div>

      <Sec title={title}>
        {data.length===0&&<Card><div style={{textAlign:"center",color:T.muted,padding:32}}>Sin datos para este filtro</div></Card>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <Card>
            <div style={{fontSize:12,color:T.accent,letterSpacing:2,marginBottom:12}}>LANZAMIENTOS & GOLES</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" stroke={T.muted} tick={{fontSize:10,fill:T.muted}}/>
                <YAxis type="category" dataKey="name" width={110} stroke={T.muted} tick={{fontSize:10,fill:T.muted}}/>
                <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,color:T.text,fontSize:11}}/>
                <Bar dataKey="saves" name="Paradas" fill={T.accent} stackId="a"/>
                <Bar dataKey="goals" name="Goles" fill={T.red} stackId="a" radius={[0,4,4,0]}/>
                <Legend wrapperStyle={{fontSize:11}}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <div style={{fontSize:12,color:T.accent,letterSpacing:2,marginBottom:12}}>EFECTIVIDAD % POR CATEGORÍA</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" domain={[0,100]} stroke={T.muted} tick={{fontSize:10,fill:T.muted}}/>
                <YAxis type="category" dataKey="name" width={110} stroke={T.muted} tick={{fontSize:10,fill:T.muted}}/>
                <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,color:T.text,fontSize:11}} formatter={v=>`${v}%`}/>
                <Bar dataKey="pct" name="% Efectividad" radius={[0,4,4,0]}>
                  {data.map((d,i)=><Cell key={i} fill={d.pct>=70?T.accent:d.pct>=50?T.warn:T.red}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card style={{marginTop:16}}>
          <StatsTable data={data}/>
        </Card>
      </Sec>
    </div>
  );
}

// ─── AI ANALYSIS ──────────────────────────────────────────────────────────────
function AIView({shots, match}) {
  const analysis = useMemo(()=>{
    if(shots.length<5) return null;

    // Best/worst zone
    const zoneD = Array.from({length:9},(_,i)=>i+1).map(z=>{
      const zs=shots.filter(s=>s.zone===String(z));
      return {z,total:zs.length,pct:eff(zs),goals:goals(zs)};
    }).filter(z=>z.total>=2);
    const sortedZ = [...zoneD].sort((a,b)=>a.pct-b.pct);
    const worstZone = sortedZ[0];
    const bestZone  = sortedZ[sortedZ.length-1];

    // Best/worst origin
    const originD = groupStats(shots,"origin",ORIGINS).filter(r=>r.total>=2);
    const sortedO = [...originD].sort((a,b)=>a.pct-b.pct);
    const worstOrigin = sortedO[0];
    const bestOrigin  = sortedO[sortedO.length-1];

    // Best/worst defense system
    const defD = groupStats(shots,"defense",DEFENSE_SYS).filter(r=>r.total>=2);
    const sortedD = [...defD].sort((a,b)=>a.pct-b.pct);
    const worstDef = sortedD[0];
    const bestDef  = sortedD[sortedD.length-1];

    // Best/worst technique
    const techD = groupStats(shots,"technique",TECHNIQUES).filter(r=>r.total>=2);
    const sortedT = [...techD].sort((a,b)=>a.pct-b.pct);
    const worstTech = sortedT[0];
    const bestTech  = sortedT[sortedT.length-1];

    // Patterns: check if any zone has >40% of goals
    const totalGoals = goals(shots);
    const patterns = [];
    zoneD.forEach(z=>{
      if(totalGoals>3&&z.goals/totalGoals>0.35)
        patterns.push(`⚠️ El ${Math.round(z.goals/totalGoals*100)}% de los goles se concentra en Zona ${z.z} (${ZONE_LABELS[z.z]})`);
    });
    ORIGINS.forEach(o=>{
      const og=shots.filter(s=>s.origin===o&&s.result==="Gol");
      if(totalGoals>3&&og.length/totalGoals>0.3)
        patterns.push(`🎯 Alta vulnerabilidad desde ${o}: ${og.length} goles (${Math.round(og.length/totalGoals*100)}% del total)`);
    });
    const infer=shots.filter(s=>s.numeric==="Inferioridad");
    if(infer.length>=3&&eff(infer)<40)
      patterns.push(`🔴 Rendimiento crítico en inferioridad numérica: solo ${eff(infer)}% de efectividad`);

    // Recommendations
    const recs = [];
    if(worstZone) recs.push(`📌 Trabajar colocación en ${ZONE_LABELS[worstZone.z]} (Zona ${worstZone.z}) — solo ${worstZone.pct}% efectividad`);
    if(worstOrigin) recs.push(`📌 Mejorar respuesta a lanzamientos desde ${worstOrigin.name} — ${worstOrigin.pct}% efectividad`);
    if(worstTech) recs.push(`📌 Desarrollar técnica específica contra lanzamientos en ${worstTech.name}`);
    if(worstDef) recs.push(`📌 Revisar posicionamiento en sistema ${worstDef.name} — ${worstDef.pct}% efectividad`);
    if(bestDef) recs.push(`✅ Potenciar situaciones de defensa ${bestDef.name} — punto fuerte (${bestDef.pct}%)`);

    return { worstZone, bestZone, worstOrigin, bestOrigin, worstDef, bestDef, worstTech, bestTech, patterns, recs,
      overallEff: eff(shots), totalShots: shots.length };
  }, [shots]);

  if(!analysis) return (
    <Card style={{textAlign:"center",padding:60}}>
      <div style={{fontSize:48,marginBottom:12}}>🧠</div>
      <div style={{color:T.muted,marginBottom:8}}>Necesitas al menos 5 lanzamientos registrados</div>
      <div style={{fontSize:12,color:T.muted}}>para generar el análisis de inteligencia artificial</div>
    </Card>
  );

  const InsightCard = ({emoji,title,value,sub,color=T.text}) => (
    <Card style={{borderLeft:`3px solid ${color}`}}>
      <div style={{fontSize:20,marginBottom:6}}>{emoji}</div>
      <div style={{fontSize:11,color:T.muted,letterSpacing:1}}>{title}</div>
      <div style={{fontSize:15,fontWeight:"bold",color,marginTop:4}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:T.muted,marginTop:2}}>{sub}</div>}
    </Card>
  );

  return (
    <div>
      <Sec title="Análisis de Inteligencia Artificial">
        <div style={{background:T.card2,border:`1px solid ${T.accent}33`,borderRadius:12,padding:16,marginBottom:24,display:"flex",gap:12,alignItems:"center"}}>
          <div style={{fontSize:28}}>🧠</div>
          <div>
            <div style={{fontSize:13,fontWeight:"bold",color:T.accent}}>Análisis generado automáticamente</div>
            <div style={{fontSize:11,color:T.muted}}>Basado en {analysis.totalShots} lanzamientos · vs {match.opponent} · Efectividad global: {analysis.overallEff}%</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
          {analysis.bestZone && <InsightCard emoji="💪" title="ZONA FUERTE" value={`Zona ${analysis.bestZone.z}`} sub={`${ZONE_LABELS[analysis.bestZone.z]} · ${analysis.bestZone.pct}% ef.`} color={T.accent}/>}
          {analysis.worstZone && <InsightCard emoji="🎯" title="ZONA VULNERABLE" value={`Zona ${analysis.worstZone.z}`} sub={`${ZONE_LABELS[analysis.worstZone.z]} · ${analysis.worstZone.pct}% ef.`} color={T.red}/>}
          {analysis.bestDef && <InsightCard emoji="🛡️" title="MEJOR SISTEMA" value={analysis.bestDef.name} sub={`${analysis.bestDef.pct}% efectividad`} color={T.accent}/>}
          {analysis.worstDef && <InsightCard emoji="⚠️" title="PEOR SISTEMA" value={analysis.worstDef.name} sub={`${analysis.worstDef.pct}% efectividad`} color={T.warn}/>}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
          {analysis.bestOrigin && <InsightCard emoji="✅" title="MEJOR ORIGEN" value={analysis.bestOrigin.name} sub={`${analysis.bestOrigin.pct}% efectividad`} color={T.accent}/>}
          {analysis.worstOrigin && <InsightCard emoji="❌" title="ORIGEN DÉBIL" value={analysis.worstOrigin.name} sub={`${analysis.worstOrigin.pct}% efectividad`} color={T.red}/>}
          {analysis.bestTech && <InsightCard emoji="🤸" title="TÉCNICA DOMINADA" value={analysis.bestTech.name} sub={`${analysis.bestTech.pct}% efectividad`} color={T.accent}/>}
          {analysis.worstTech && <InsightCard emoji="⚡" title="TÉCNICA A MEJORAR" value={analysis.worstTech.name} sub={`${analysis.worstTech.pct}% efectividad`} color={T.red}/>}
        </div>

        {analysis.patterns.length>0&&(
          <Sec title="Alertas Tácticas Detectadas">
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {analysis.patterns.map((p,i)=>(
                <div key={i} style={{background:"#ff475714",border:`1px solid ${T.red}44`,borderRadius:10,padding:"12px 16px",fontSize:13,color:T.text}}>
                  {p}
                </div>
              ))}
            </div>
          </Sec>
        )}

        <Sec title="Recomendaciones Tácticas Personalizadas">
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {analysis.recs.map((r,i)=>(
              <div key={i} style={{background:`${r.startsWith("✅")?T.accent:T.accent2}11`,border:`1px solid ${r.startsWith("✅")?T.accent:T.accent2}44`,borderRadius:10,padding:"12px 16px",fontSize:13,color:T.text}}>
                {r}
              </div>
            ))}
          </div>
        </Sec>
      </Sec>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function HandballGKApp() {
  const [matches, setMatches] = useStorage("hb_matches", []);
  const [activeMatch, setActiveMatch] = useStorage("hb_active", null);
  const [tab, setTab] = useState("matches");

  const match = useMemo(()=>matches.find(m=>m.id===activeMatch),[matches,activeMatch]);
  const shots = match?.shots||[];

  const updateMatch = useCallback((fn)=>{
    setMatches(prev=>prev.map(m=>m.id===activeMatch?fn(m):m));
  },[activeMatch,setMatches]);

  const addShot = useCallback((s)=>{
    updateMatch(m=>({...m,shots:[...(m.shots||[]),{...s,id:genId()}]}));
  },[updateMatch]);

  const deleteShot = useCallback((id)=>{
    updateMatch(m=>({...m,shots:m.shots.filter(s=>s.id!==id)}));
  },[updateMatch]);

  const TABS = [
    {id:"matches",label:"🏆 Partidos"},
    {id:"register",label:"⚡ Registrar",disabled:!activeMatch},
    {id:"team",label:"📊 Equipo",disabled:!activeMatch},
    {id:"gk",label:"🧤 Porteros",disabled:!activeMatch},
    {id:"zones",label:"🎯 Zonas",disabled:!activeMatch},
    {id:"advanced",label:"📈 Avanzado",disabled:!activeMatch},
    {id:"ai",label:"🧠 IA",disabled:!activeMatch},
  ];

  return (
    <div style={{background:T.bg,minHeight:"100vh",color:T.text,fontFamily:T.font}}>
      {/* HEADER */}
      <div style={{background:T.card,borderBottom:`2px solid ${T.accent}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"stretch",overflowX:"auto",maxWidth:1400,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,paddingRight:20,borderRight:`1px solid ${T.border}`,minWidth:160}}>
            <div style={{fontSize:22}}>🧤</div>
            <div>
              <div style={{fontSize:13,fontWeight:"bold",color:T.accent,letterSpacing:2}}>HB ANALYTICS</div>
              <div style={{fontSize:9,color:T.muted,letterSpacing:1}}>GOALKEEPER PRO</div>
            </div>
          </div>
          {TABS.map(t=>(
            <button key={t.id} disabled={t.disabled} onClick={()=>!t.disabled&&setTab(t.id)} style={{
              background: tab===t.id ? `${T.accent}22` : "transparent",
              color: tab===t.id ? T.accent : t.disabled ? T.muted : T.text,
              border:"none", borderBottom: tab===t.id ? `2px solid ${T.accent}` : "2px solid transparent",
              padding:"16px 18px", fontSize:12, fontFamily:T.font, fontWeight: tab===t.id?"bold":"normal",
              cursor: t.disabled?"not-allowed":"pointer", whiteSpace:"nowrap",
              transition:"all .15s", marginBottom:-2,
            }}>{t.label}</button>
          ))}
          {activeMatch&&match&&(
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",padding:"0 8px"}}>
              <div style={{fontSize:11,color:T.muted}}>Activo: <span style={{color:T.accent2,fontWeight:"bold"}}>vs {match.opponent}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{maxWidth:1400,margin:"0 auto",padding:"28px 20px"}}>
        {tab==="matches"  && <MatchesView  matches={matches} setMatches={setMatches} activeMatch={activeMatch} setActiveMatch={setActiveMatch} setTab={setTab}/>}
        {tab==="register" && match && <RegisterView match={match} addShot={addShot} deleteShot={deleteShot} shots={shots}/>}
        {tab==="team"     && match && <TeamStatsView shots={shots} match={match}/>}
        {tab==="gk"       && match && <GKStatsView shots={shots} match={match}/>}
        {tab==="zones"    && match && <ZonesView shots={shots}/>}
        {tab==="advanced" && match && <AdvancedView shots={shots}/>}
        {tab==="ai"       && match && <AIView shots={shots} match={match}/>}
      </div>
    </div>
  );
}
