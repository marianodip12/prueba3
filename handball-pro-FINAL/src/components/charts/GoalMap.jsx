import { useState } from 'react'
import { T } from '../ui/index.jsx'
import { CUADRANTES_PORTERIA, LABELS } from '../../data/eventSchema.js'

const Cell = ({q,data,color,active,onClick})=>(
  <div onClick={onClick} style={{background:color,border:`2px solid ${active?T.accent:T.border}`,borderRadius:8,padding:'12px 6px',textAlign:'center',cursor:'pointer',transition:'all .15s',transform:active?'scale(1.04)':'scale(1)'}}>
    <div style={{fontSize:18,fontWeight:'bold',color:T.text,fontFamily:T.font}}>{data?.goles??0}</div>
    <div style={{fontSize:8,color:T.muted,marginTop:2}}>goles</div>
    <div style={{fontSize:9,color:T.cyan,marginTop:1}}>{data?.lanzamientos>0?`${data.efectividad}%`:'—'}</div>
  </div>
)

export const GoalMap = ({porCuadrante=[],title='Mapa de Portería'})=>{
  const [active,setActive] = useState(null)
  const data = {}
  porCuadrante.forEach(q=>{data[q.cuadrante]=q})
  const maxGoals = Math.max(1,...Object.values(data).map(d=>d.goles||0))
  const heatColor = q=>{
    const i=(data[q]?.goles||0)/maxGoals
    if(!i) return T.card2
    return `rgba(${Math.round(7+i*248)},${Math.round(13-i*13)},${Math.round(26-i*26)},${0.25+i*0.75})`
  }
  const LAYOUT=[[CUADRANTES_PORTERIA.SUP_IZQ,CUADRANTES_PORTERIA.SUP_DER],[CUADRANTES_PORTERIA.INF_IZQ,CUADRANTES_PORTERIA.INF_DER]]
  return(
    <div>
      <div style={{fontSize:11,color:T.accent,letterSpacing:2,marginBottom:12}}>{title.toUpperCase()}</div>
      <div style={{background:T.card2,borderRadius:10,padding:12,border:`2px solid ${T.border}`,position:'relative'}}>
        <div style={{fontSize:9,color:T.muted,textAlign:'center',marginBottom:6,letterSpacing:1}}>═══ TRAVESAÑO ═══</div>
        {LAYOUT.map((row,ri)=>(
          <div key={ri} style={{display:'grid',gridTemplateColumns:'1fr 80px 1fr',gap:6,marginBottom:ri===0?6:0}}>
            {row.map(q=><Cell key={q} q={q} data={data[q]} color={heatColor(q)} active={active===q} onClick={()=>setActive(active===q?null:q)}/>)}
            <div/>
          </div>
        ))}
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:72,zIndex:2}}>
          <Cell q={CUADRANTES_PORTERIA.CENTRO} data={data[CUADRANTES_PORTERIA.CENTRO]} color={heatColor(CUADRANTES_PORTERIA.CENTRO)} active={active===CUADRANTES_PORTERIA.CENTRO} onClick={()=>setActive(active===CUADRANTES_PORTERIA.CENTRO?null:CUADRANTES_PORTERIA.CENTRO)}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
          <div style={{fontSize:9,color:T.muted}}>| POSTE IZQ</div>
          <div style={{fontSize:9,color:T.muted}}>POSTE DER |</div>
        </div>
      </div>
      {active&&data[active]&&(
        <div style={{marginTop:10,background:T.card2,borderRadius:8,padding:12,border:`1px solid ${T.accent}`,fontSize:12}}>
          <div style={{color:T.accent,fontWeight:'bold',marginBottom:6}}>{LABELS.cuadrantePorteria[active]}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,textAlign:'center'}}>
            {[['Lanz',data[active].lanzamientos,T.text],['Paradas',data[active].paradas,T.accent],['Goles',data[active].goles,T.red],['% Para.',`${data[active].efectividad}%`,data[active].efectividad>=60?T.accent:T.warn]].map(([l,v,c])=>(
              <div key={l}><div style={{fontSize:16,fontWeight:'bold',color:c,fontFamily:T.font}}>{v}</div><div style={{fontSize:9,color:T.muted}}>{l}</div></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
