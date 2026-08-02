import React, { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from './supabase.js'

// ── DATA ──────────────────────────────────────────────────────────────────────
const MUSCLE_GROUPS = ['pecho','espalda','hombros','bíceps','tríceps','antebrazos','core','glúteos','cuádriceps','isquios','gemelos','flexores de cadera','aductores','abductores']
const EQUIPMENT = ['barra','mancuernas','máquina','polea','peso corporal','kettlebell','banda','banco','cardio','colchoneta']

const EXERCISES = {
  'press-banca': { name:'Press de banca', muscle:'pecho', secondary:['tríceps','hombros'], equipment:'barra', difficulty:'intermediate', pattern:'empuje', alts:['press-banca-mancuernas','press-maquina','press-inclinado-mancuernas'], aliases:['bench press','press banca'] },
  'press-banca-mancuernas': { name:'Press de banca con mancuernas', muscle:'pecho', secondary:['tríceps','hombros'], equipment:'mancuernas', difficulty:'beginner', pattern:'empuje', alts:['press-banca','press-inclinado-mancuernas'], aliases:['db bench'] },
  'press-inclinado-mancuernas': { name:'Press inclinado con mancuernas', muscle:'pecho', secondary:['hombros','tríceps'], equipment:'mancuernas', difficulty:'intermediate', pattern:'empuje', alts:['press-banca-mancuernas'], aliases:['incline db'] },
  'press-inclinado-barra': { name:'Press inclinado con barra', muscle:'pecho', secondary:['hombros','tríceps'], equipment:'barra', difficulty:'intermediate', pattern:'empuje', alts:['press-inclinado-mancuernas','press-banca'], aliases:['incline barbell'] },
  'press-maquina': { name:'Press de pecho en máquina', muscle:'pecho', secondary:['tríceps','hombros'], equipment:'máquina', difficulty:'beginner', pattern:'empuje', alts:['press-banca-mancuernas'], aliases:['chest press machine'] },
  'aperturas-mancuernas': { name:'Aperturas con mancuernas', muscle:'pecho', secondary:['hombros'], equipment:'mancuernas', difficulty:'beginner', pattern:'aislamiento', alts:['aperturas-polea'], aliases:['db fly'] },
  'aperturas-polea': { name:'Aperturas en polea', muscle:'pecho', secondary:[], equipment:'polea', difficulty:'intermediate', pattern:'aislamiento', alts:['aperturas-mancuernas'], aliases:['cable fly'] },
  'contractor': { name:'Contractor de pecho', muscle:'pecho', secondary:[], equipment:'máquina', difficulty:'beginner', pattern:'aislamiento', alts:['aperturas-polea'], aliases:['pec deck'] },
  'flexiones': { name:'Flexiones de brazos', muscle:'pecho', secondary:['tríceps','core'], equipment:'peso corporal', difficulty:'beginner', pattern:'empuje', alts:['press-banca-mancuernas'], aliases:['push up'] },
  'fondos': { name:'Fondos en paralelas', muscle:'pecho', secondary:['tríceps','hombros'], equipment:'peso corporal', difficulty:'intermediate', pattern:'empuje', alts:['press-banca'], aliases:['dips'] },
  'dominadas': { name:'Dominadas', muscle:'espalda', secondary:['bíceps','core'], equipment:'peso corporal', difficulty:'advanced', pattern:'tracción', alts:['jalon-pecho','remo-barra'], aliases:['pull up'] },
  'dominadas-asistidas': { name:'Dominadas asistidas', muscle:'espalda', secondary:['bíceps'], equipment:'máquina', difficulty:'beginner', pattern:'tracción', alts:['jalon-pecho'], aliases:['assisted pull up'] },
  'jalon-pecho': { name:'Jalón al pecho', muscle:'espalda', secondary:['bíceps'], equipment:'polea', difficulty:'beginner', pattern:'tracción', alts:['dominadas','jalon-agarre-cerrado'], aliases:['lat pulldown'] },
  'jalon-agarre-cerrado': { name:'Jalón agarre cerrado', muscle:'espalda', secondary:['bíceps'], equipment:'polea', difficulty:'intermediate', pattern:'tracción', alts:['jalon-pecho'], aliases:['close grip pulldown'] },
  'remo-polea': { name:'Remo en polea sentado', muscle:'espalda', secondary:['bíceps'], equipment:'polea', difficulty:'beginner', pattern:'tracción', alts:['remo-barra','remo-mancuerna'], aliases:['cable row'] },
  'remo-barra': { name:'Remo con barra', muscle:'espalda', secondary:['bíceps'], equipment:'barra', difficulty:'intermediate', pattern:'tracción', alts:['remo-polea'], aliases:['barbell row'] },
  'remo-mancuerna': { name:'Remo con mancuerna', muscle:'espalda', secondary:['bíceps'], equipment:'mancuernas', difficulty:'beginner', pattern:'tracción', alts:['remo-polea'], aliases:['db row'] },
  'remo-maquina': { name:'Remo en máquina', muscle:'espalda', secondary:['bíceps'], equipment:'máquina', difficulty:'beginner', pattern:'tracción', alts:['remo-polea'], aliases:['machine row'] },
  'hiperextension': { name:'Hiperextensión lumbar', muscle:'espalda', secondary:['glúteos','isquios'], equipment:'máquina', difficulty:'beginner', pattern:'bisagra', alts:['peso-muerto-rumano'], aliases:['back extension'] },
  'peso-muerto': { name:'Peso muerto convencional', muscle:'espalda', secondary:['isquios','glúteos','core'], equipment:'barra', difficulty:'advanced', pattern:'bisagra', alts:['peso-muerto-rumano'], aliases:['deadlift'] },
  'press-militar': { name:'Press militar de pie', muscle:'hombros', secondary:['tríceps','core'], equipment:'barra', difficulty:'intermediate', pattern:'empuje', alts:['press-militar-mancuernas'], aliases:['ohp'] },
  'press-militar-mancuernas': { name:'Press militar con mancuernas', muscle:'hombros', secondary:['tríceps'], equipment:'mancuernas', difficulty:'beginner', pattern:'empuje', alts:['press-militar','press-arnold'], aliases:['db shoulder press'] },
  'press-arnold': { name:'Press Arnold', muscle:'hombros', secondary:['tríceps'], equipment:'mancuernas', difficulty:'intermediate', pattern:'empuje', alts:['press-militar-mancuernas'], aliases:['arnold press'] },
  'press-maquina-hombros': { name:'Press de hombros en máquina', muscle:'hombros', secondary:['tríceps'], equipment:'máquina', difficulty:'beginner', pattern:'empuje', alts:['press-militar-mancuernas'], aliases:['machine shoulder press'] },
  'vuelos-laterales': { name:'Vuelos laterales', muscle:'hombros', secondary:[], equipment:'mancuernas', difficulty:'beginner', pattern:'aislamiento', alts:['vuelos-polea'], aliases:['lateral raise'] },
  'vuelos-polea': { name:'Vuelos laterales en polea', muscle:'hombros', secondary:[], equipment:'polea', difficulty:'intermediate', pattern:'aislamiento', alts:['vuelos-laterales'], aliases:['cable lateral raise'] },
  'pajaros': { name:'Pájaros (vuelos posteriores)', muscle:'hombros', secondary:['espalda'], equipment:'mancuernas', difficulty:'beginner', pattern:'aislamiento', alts:['face-pull'], aliases:['rear delt fly'] },
  'face-pull': { name:'Face pull', muscle:'hombros', secondary:['espalda'], equipment:'polea', difficulty:'beginner', pattern:'tracción', alts:['pajaros'], aliases:['face pull'] },
  'encogimientos': { name:'Encogimientos', muscle:'hombros', secondary:[], equipment:'mancuernas', difficulty:'beginner', pattern:'aislamiento', alts:[], aliases:['shrug'] },
  'curl-barra': { name:'Curl con barra', muscle:'bíceps', secondary:['antebrazos'], equipment:'barra', difficulty:'beginner', pattern:'aislamiento', alts:['curl-mancuernas','curl-polea'], aliases:['barbell curl'] },
  'curl-mancuernas': { name:'Curl con mancuernas', muscle:'bíceps', secondary:['antebrazos'], equipment:'mancuernas', difficulty:'beginner', pattern:'aislamiento', alts:['curl-barra','curl-martillo'], aliases:['db curl'] },
  'curl-martillo': { name:'Curl martillo', muscle:'bíceps', secondary:['antebrazos'], equipment:'mancuernas', difficulty:'beginner', pattern:'aislamiento', alts:['curl-mancuernas'], aliases:['hammer curl'] },
  'curl-polea': { name:'Curl en polea', muscle:'bíceps', secondary:['antebrazos'], equipment:'polea', difficulty:'beginner', pattern:'aislamiento', alts:['curl-barra'], aliases:['cable curl'] },
  'curl-predicador': { name:'Curl en banco predicador', muscle:'bíceps', secondary:[], equipment:'banco', difficulty:'intermediate', pattern:'aislamiento', alts:['curl-barra'], aliases:['preacher curl'] },
  'press-frances': { name:'Press francés', muscle:'tríceps', secondary:[], equipment:'barra', difficulty:'intermediate', pattern:'aislamiento', alts:['extension-polea'], aliases:['skull crusher'] },
  'extension-polea': { name:'Extensión de tríceps en polea', muscle:'tríceps', secondary:[], equipment:'polea', difficulty:'beginner', pattern:'aislamiento', alts:['press-frances'], aliases:['triceps pushdown'] },
  'extension-overhead': { name:'Extensión overhead', muscle:'tríceps', secondary:[], equipment:'mancuernas', difficulty:'intermediate', pattern:'aislamiento', alts:['extension-polea'], aliases:['overhead tricep extension'] },
  'plancha': { name:'Plancha abdominal', muscle:'core', secondary:['hombros'], equipment:'peso corporal', difficulty:'beginner', pattern:'aislamiento', alts:[], aliases:['plank'] },
  'crunch': { name:'Abdominales clásicos', muscle:'core', secondary:[], equipment:'colchoneta', difficulty:'beginner', pattern:'aislamiento', alts:['crunch-polea'], aliases:['crunch'] },
  'crunch-polea': { name:'Crunch en polea', muscle:'core', secondary:[], equipment:'polea', difficulty:'beginner', pattern:'aislamiento', alts:['crunch'], aliases:['cable crunch'] },
  'elevacion-piernas-colgado': { name:'Elevación de piernas colgado', muscle:'core', secondary:['flexores de cadera'], equipment:'peso corporal', difficulty:'intermediate', pattern:'aislamiento', alts:['crunch'], aliases:['hanging leg raise'] },
  'hip-thrust': { name:'Hip thrust con barra', muscle:'glúteos', secondary:['isquios'], equipment:'barra', difficulty:'intermediate', pattern:'bisagra', alts:['hip-thrust-maquina','puente-gluteo'], aliases:['hip thrust'] },
  'hip-thrust-maquina': { name:'Hip thrust en máquina', muscle:'glúteos', secondary:['isquios'], equipment:'máquina', difficulty:'beginner', pattern:'bisagra', alts:['hip-thrust'], aliases:['machine hip thrust'] },
  'puente-gluteo': { name:'Puente de glúteos', muscle:'glúteos', secondary:['isquios'], equipment:'peso corporal', difficulty:'beginner', pattern:'bisagra', alts:['hip-thrust'], aliases:['glute bridge'] },
  'sentadilla-bulgara': { name:'Sentadilla búlgara', muscle:'glúteos', secondary:['cuádriceps','isquios'], equipment:'mancuernas', difficulty:'intermediate', pattern:'sentadilla', alts:['zancadas'], aliases:['bulgarian split squat'] },
  'sentadilla-libre': { name:'Sentadilla con barra', muscle:'cuádriceps', secondary:['glúteos','core'], equipment:'barra', difficulty:'advanced', pattern:'sentadilla', alts:['sentadilla-hack','prensa'], aliases:['back squat'] },
  'sentadilla-hack': { name:'Sentadilla hack', muscle:'cuádriceps', secondary:['glúteos'], equipment:'máquina', difficulty:'intermediate', pattern:'sentadilla', alts:['prensa'], aliases:['hack squat'] },
  'prensa': { name:'Prensa de piernas', muscle:'cuádriceps', secondary:['glúteos'], equipment:'máquina', difficulty:'beginner', pattern:'sentadilla', alts:['sentadilla-hack'], aliases:['leg press'] },
  'sentadilla-goblet': { name:'Sentadilla goblet', muscle:'cuádriceps', secondary:['glúteos','core'], equipment:'mancuernas', difficulty:'beginner', pattern:'sentadilla', alts:['prensa'], aliases:['goblet squat'] },
  'extension-cuadriceps': { name:'Extensión de cuádriceps', muscle:'cuádriceps', secondary:[], equipment:'máquina', difficulty:'beginner', pattern:'aislamiento', alts:['prensa'], aliases:['leg extension'] },
  'zancadas': { name:'Zancadas', muscle:'cuádriceps', secondary:['glúteos'], equipment:'mancuernas', difficulty:'beginner', pattern:'sentadilla', alts:['sentadilla-bulgara'], aliases:['lunge'] },
  'peso-muerto-rumano': { name:'Peso muerto rumano', muscle:'isquios', secondary:['glúteos','espalda'], equipment:'barra', difficulty:'intermediate', pattern:'bisagra', alts:['peso-muerto-rumano-mancuernas','curl-femoral-acostado'], aliases:['rdl'] },
  'peso-muerto-rumano-mancuernas': { name:'Peso muerto rumano con mancuernas', muscle:'isquios', secondary:['glúteos'], equipment:'mancuernas', difficulty:'beginner', pattern:'bisagra', alts:['peso-muerto-rumano'], aliases:['db rdl'] },
  'curl-femoral-acostado': { name:'Curl femoral acostado', muscle:'isquios', secondary:[], equipment:'máquina', difficulty:'beginner', pattern:'aislamiento', alts:['curl-femoral-sentado'], aliases:['leg curl'] },
  'curl-femoral-sentado': { name:'Curl femoral sentado', muscle:'isquios', secondary:[], equipment:'máquina', difficulty:'beginner', pattern:'aislamiento', alts:['curl-femoral-acostado'], aliases:['seated leg curl'] },
  'gemelos-de-pie': { name:'Elevación de gemelos de pie', muscle:'gemelos', secondary:[], equipment:'máquina', difficulty:'beginner', pattern:'aislamiento', alts:['gemelos-sentado'], aliases:['standing calf raise'] },
  'gemelos-sentado': { name:'Elevación de gemelos sentado', muscle:'gemelos', secondary:[], equipment:'máquina', difficulty:'beginner', pattern:'aislamiento', alts:['gemelos-de-pie'], aliases:['seated calf raise'] },
  'kettlebell-swing': { name:'Swing con kettlebell', muscle:'glúteos', secondary:['isquios','espalda','core'], equipment:'kettlebell', difficulty:'intermediate', pattern:'bisagra', alts:['peso-muerto-rumano'], aliases:['kb swing'] },
}

const CUSTOM_EXERCISES = {}
let _customCounter = 0

const SPLIT_TEMPLATES = {
  2: [
    { label:'Día A', title:'Cuerpo completo A', muscles:['pecho','espalda','cuádriceps'], exercises:['press-banca','dominadas','sentadilla-libre','press-militar-mancuernas','peso-muerto-rumano','plancha'] },
    { label:'Día B', title:'Cuerpo completo B', muscles:['hombros','espalda','piernas'], exercises:['press-militar-mancuernas','remo-polea','prensa','vuelos-laterales','curl-femoral-acostado','gemelos-de-pie'] },
  ],
  3: [
    { label:'Día A', title:'Empuje', muscles:['pecho','hombros','tríceps'], exercises:['press-banca','press-inclinado-mancuernas','press-maquina-hombros','vuelos-laterales','extension-polea'] },
    { label:'Día B', title:'Tracción', muscles:['espalda','bíceps'], exercises:['dominadas','remo-polea','jalon-pecho','face-pull','curl-barra'] },
    { label:'Día C', title:'Piernas', muscles:['cuádriceps','isquios','glúteos'], exercises:['sentadilla-libre','peso-muerto-rumano','prensa','curl-femoral-acostado','gemelos-de-pie'] },
  ],
  4: [
    { label:'Día A', title:'Empuje', muscles:['pecho','hombros','tríceps'], exercises:['press-banca','press-inclinado-mancuernas','press-maquina-hombros','vuelos-laterales','extension-polea'] },
    { label:'Día B', title:'Tracción', muscles:['espalda','bíceps'], exercises:['dominadas','remo-polea','jalon-pecho','face-pull','curl-barra'] },
    { label:'Día C', title:'Piernas', muscles:['cuádriceps','isquios','glúteos'], exercises:['sentadilla-libre','peso-muerto-rumano','prensa','curl-femoral-acostado','gemelos-de-pie'] },
    { label:'Día D', title:'Upper', muscles:['hombros','bíceps','tríceps'], exercises:['press-arnold','remo-mancuerna','vuelos-polea','curl-martillo','press-frances'] },
  ],
  5: [
    { label:'Día A', title:'Empuje', muscles:['pecho','hombros','tríceps'], exercises:['press-banca','press-inclinado-mancuernas','vuelos-laterales','extension-polea','press-frances'] },
    { label:'Día B', title:'Tracción', muscles:['espalda','bíceps'], exercises:['dominadas','remo-barra','jalon-pecho','curl-barra','curl-martillo'] },
    { label:'Día C', title:'Piernas', muscles:['cuádriceps','isquios','glúteos'], exercises:['sentadilla-libre','peso-muerto-rumano','prensa','curl-femoral-acostado','gemelos-de-pie'] },
    { label:'Día D', title:'Hombros & Core', muscles:['hombros','core'], exercises:['press-militar-mancuernas','vuelos-laterales','face-pull','pajaros','plancha','crunch-polea'] },
    { label:'Día E', title:'Glúteos & Isquios', muscles:['glúteos','isquios'], exercises:['hip-thrust','sentadilla-bulgara','peso-muerto-rumano-mancuernas','curl-femoral-sentado','gemelos-sentado'] },
  ],
  6: [
    { label:'Día A', title:'Empuje A', muscles:['pecho','tríceps'], exercises:['press-banca','press-inclinado-mancuernas','aperturas-polea','extension-polea','press-frances'] },
    { label:'Día B', title:'Tracción A', muscles:['espalda','bíceps'], exercises:['dominadas','remo-barra','jalon-pecho','curl-barra','curl-predicador'] },
    { label:'Día C', title:'Piernas A', muscles:['cuádriceps','glúteos'], exercises:['sentadilla-libre','prensa','extension-cuadriceps','hip-thrust','gemelos-de-pie'] },
    { label:'Día D', title:'Empuje B', muscles:['hombros','pecho'], exercises:['press-militar-mancuernas','press-arnold','vuelos-laterales','press-banca-mancuernas','extension-overhead'] },
    { label:'Día E', title:'Tracción B', muscles:['espalda','bíceps'], exercises:['remo-polea','jalon-agarre-cerrado','face-pull','curl-martillo','curl-polea'] },
    { label:'Día F', title:'Piernas B', muscles:['isquios','glúteos'], exercises:['peso-muerto-rumano','sentadilla-bulgara','curl-femoral-acostado','puente-gluteo','gemelos-sentado'] },
  ],
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const setsForGoal = g => ({fuerza:4,hipertrofia:3,resistencia:3,general:3}[g]||3)
const repsForGoal = g => ({fuerza:'4–6',hipertrofia:'8–12',resistencia:'15–20',general:'10–15'}[g]||'8–12')
const rirForGoal  = g => ({fuerza:2,hipertrofia:2,resistencia:1,general:2}[g]||2)

function suggestWeight(history, exId, profile) {
  const ex = EXERCISES[exId]; if (!ex) return 20
  const sessions = history.filter(s => s.exercises?.some(e => e.exId === exId))
  if (!sessions.length) {
    return {barra:60,mancuernas:16,máquina:50,polea:40,'peso corporal':0,kettlebell:16,banda:0,banco:20,cardio:0,colchoneta:0}[ex.equipment]||20
  }
  const last = sessions[sessions.length-1].exercises.find(e => e.exId === exId)
  const topWeight = Math.max(...last.sets.map(s => s.weight))
  const allCompleted = last.sets.every(s => s.reps >= parseInt(repsForGoal(profile?.goal||'hipertrofia')))
  return allCompleted ? topWeight + (ex.equipment==='barra'?2.5:1) : topWeight
}

function generatePlan(profile, history=[]) {
  const template = SPLIT_TEMPLATES[profile.frequency]||SPLIT_TEMPLATES[4]
  return {
    weeks: Array(4).fill(null).map((_,w) => template.map((day,di) => ({
      ...day, weekIdx:w, dayIdx:di,
      exercises: day.exercises.map(exId => ({
        exId, sets:setsForGoal(profile.goal), reps:repsForGoal(profile.goal),
        weight:suggestWeight(history,exId,profile), rir:rirForGoal(profile.goal)
      }))
    }))),
    generatedAt: new Date().toISOString()
  }
}

const today = new Date()
const WEEKDAY_LONG  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const WEEKDAY_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MONTH_SHORT   = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const fmtDateLong   = d => `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
const getExercise   = id => EXERCISES[id]||CUSTOM_EXERCISES[id]||null

function normalize(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim() }
function levenshtein(a,b) {
  if(a===b)return 0;if(!a.length)return b.length;if(!b.length)return a.length
  let prev=Array(b.length+1).fill(0).map((_,i)=>i)
  for(let i=1;i<=a.length;i++){const c=[i];for(let j=1;j<=b.length;j++)c[j]=a[i-1]===b[j-1]?prev[j-1]:1+Math.min(prev[j-1],prev[j],c[j-1]);prev=c}
  return prev[b.length]
}
function searchExercises(query, db=EXERCISES) {
  const q=normalize(query); if(!q) return {type:'empty',hits:[],suggestions:[]}
  const ranked=[]
  for(const [id,ex] of Object.entries(db)) {
    const name=normalize(ex.name); const aliases=(ex.aliases||[]).map(normalize)
    const terms=[name,...aliases,normalize(ex.muscle),normalize(ex.equipment)]
    let best=Infinity
    for(const t of terms) if(t.includes(q)) best=Math.min(best,t.indexOf(q))
    if(best!==Infinity){ranked.push({id,score:best*.01,kind:'substring'});continue}
    let minD=Infinity
    for(const t of [name,...aliases]) for(const tok of [t,...t.split(' ')]) {
      if(Math.abs(tok.length-q.length)>4) continue
      const d=levenshtein(q,tok); if(d/Math.max(q.length,tok.length)<.45&&d<minD) minD=d
    }
    if(minD<Infinity) ranked.push({id,score:1+minD*.1,kind:'fuzzy'})
  }
  ranked.sort((a,b)=>a.score-b.score)
  const good=ranked.filter(r=>r.kind==='substring')
  if(good.length) return {type:'matches',hits:good.slice(0,30),suggestions:[]}
  if(ranked.length) return {type:'no-match',hits:[],suggestions:ranked.slice(0,5)}
  return {type:'no-match',hits:[],suggestions:[]}
}
function muscleHeatFromHistory(history, days=7) {
  const cutoff=new Date(today); cutoff.setDate(cutoff.getDate()-days)
  const heat={}; MUSCLE_GROUPS.forEach(m=>heat[m]=0)
  history.forEach(s=>{
    const d=new Date(s.date); if(d<cutoff) return
    const w=Math.max(0,1-Math.floor((today-d)/86400000)/days)
    s.exercises?.forEach(e=>{
      const ex=EXERCISES[e.exId]; if(!ex) return
      heat[ex.muscle]=(heat[ex.muscle]||0)+e.sets.length*w
      ex.secondary?.forEach(m=>{heat[m]=(heat[m]||0)+e.sets.length*w*.4})
    })
  })
  const max=Math.max(.01,...Object.values(heat))
  Object.keys(heat).forEach(k=>heat[k]=heat[k]/max)
  return heat
}
function progressionFor(history, exId) {
  return history.map(s=>{
    const e=s.exercises?.find(x=>x.exId===exId); if(!e) return null
    return {date:s.date, weight:Math.max(...e.sets.map(s=>s.weight))}
  }).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date))
}
function exportHistoryCSV(history) {
  const rows=[['Fecha','Sesión','Ejercicio','Serie','Reps','Peso','RIR']]
  history.forEach(s=>s.exercises?.forEach(e=>{
    const ex=getExercise(e.exId)
    e.sets.forEach((set,i)=>rows.push([s.date,s.title,ex?.name||e.exId,i+1,set.reps,set.weight,set.rir]))
  }))
  const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'})
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='freestylegym.csv'; a.click()
}
function createCustomExercise({name,muscle,secondary=[],equipment,difficulty='intermediate'}) {
  const id=`custom-${Date.now()}-${++_customCounter}`
  CUSTOM_EXERCISES[id]={name,muscle,secondary,equipment,difficulty,pattern:'aislamiento',alts:[],aliases:[],custom:true}
  return id
}

const ACCENT_PRESETS = [{c:'#f5f5f0',l:'Off-white'},{c:'#d8ff3d',l:'Volt'},{c:'#ff5b2e',l:'Brasa'},{c:'#7c5cff',l:'Iris'},{c:'#3dd6a8',l:'Menta'}]

// ── PRIMITIVES ────────────────────────────────────────────────────────────────
function Button({children,onClick,variant='primary',accent='#f5f5f0',style={},disabled}) {
  const base={fontFamily:'Inter,system-ui',fontSize:14,fontWeight:600,height:48,borderRadius:12,border:0,padding:'0 18px',display:'flex',alignItems:'center',justifyContent:'center',gap:8,cursor:disabled?'not-allowed':'pointer',opacity:disabled?.45:1,width:'100%',transition:'transform .12s'}
  const v={primary:{background:accent,color:'#000'},secondary:{background:'#141414',color:'#f5f5f0',border:'0.5px solid #2a2a2a'},ghost:{background:'transparent',color:'rgba(245,245,240,0.6)'},danger:{background:'transparent',color:'#ff6060',border:'0.5px solid rgba(255,80,80,0.3)'}}
  return <button onClick={onClick} disabled={disabled} onMouseDown={e=>!disabled&&(e.currentTarget.style.transform='scale(0.98)')} onMouseUp={e=>(e.currentTarget.style.transform='scale(1)')} onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')} style={{...base,...v[variant],...style}}>{children}</button>
}
const MonoNum = ({children,size=28,weight=600,color='#f5f5f0',style={}}) => <span style={{fontFamily:'ui-monospace,monospace',fontSize:size,fontWeight:weight,color,lineHeight:1,fontVariantNumeric:'tabular-nums',letterSpacing:-.5,...style}}>{children}</span>
const Lbl = ({children,style={}}) => <div style={{fontFamily:'Inter,system-ui',fontSize:10,fontWeight:600,color:'rgba(245,245,240,0.42)',textTransform:'uppercase',letterSpacing:1.2,...style}}>{children}</div>
const Card = ({children,style={},onClick}) => <div onClick={onClick} style={{background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:14,padding:16,...style}}>{children}</div>

function Header({title,subtitle,right,style={}}) {
  return (
    <div style={{padding:'48px 20px 14px',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,...style}}>
      <div style={{flex:1,minWidth:0}}>
        {subtitle&&<Lbl style={{marginBottom:6}}>{subtitle}</Lbl>}
        <div style={{fontFamily:'Inter,system-ui',fontSize:22,fontWeight:600,letterSpacing:-.5,color:'#f5f5f0',lineHeight:1.1}}>{title}</div>
      </div>
      {right&&<div style={{display:'flex',gap:8,alignItems:'center'}}>{right}</div>}
    </div>
  )
}

function TabBar({active,onChange,accent}) {
  const tabs=[
    {id:'home',label:'Hoy',icon:<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9z"/>},
    {id:'session',label:'Entrenar',icon:<path d="M5 12h14M7 8v8M17 8v8M3 10v4M21 10v4"/>},
    {id:'routine',label:'Rutina',icon:<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>},
    {id:'history',label:'Historial',icon:<path d="M3 5h18M3 12h18M3 19h18"/>},
    {id:'settings',label:'Ajustes',icon:<path d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>},
  ]
  return (
    <div style={{position:'absolute',left:0,right:0,bottom:0,zIndex:40,display:'flex',alignItems:'flex-end',justifyContent:'space-around',padding:'12px 4px 24px',background:'linear-gradient(to top,#000 60%,rgba(0,0,0,0))'}}>
      {tabs.map(t=>{const on=active===t.id;return(
        <button key={t.id} onClick={()=>onChange(t.id)} style={{background:'transparent',border:0,padding:'6px 4px',display:'flex',flexDirection:'column',alignItems:'center',gap:3,color:on?accent:'rgba(255,255,255,0.42)',fontFamily:'Inter,system-ui',fontSize:10,fontWeight:500,cursor:'pointer',minWidth:54}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
          <span style={{textTransform:'uppercase',fontSize:8,letterSpacing:.5}}>{t.label}</span>
        </button>
      )})}
    </div>
  )
}

function BodyDiagram({heat={},accent='#f5f5f0',size=220,view='front'}) {
  const fill=m=>{const v=heat[m]||0;return v===0?'rgba(255,255,255,0.05)':`color-mix(in oklab,${accent} ${Math.round(20+v*80)}%,#1a1a1a)`}
  const s='rgba(255,255,255,0.18)'
  const front=<g><circle cx="100" cy="22" r="13" fill="rgba(255,255,255,0.04)" stroke={s} strokeWidth=".6"/><ellipse cx="76" cy="46" rx="13" ry="9" fill={fill('hombros')} stroke={s} strokeWidth=".6"/><ellipse cx="124" cy="46" rx="13" ry="9" fill={fill('hombros')} stroke={s} strokeWidth=".6"/><path d="M82 44 Q100 38 118 44 L122 70 Q100 76 78 70 Z" fill={fill('pecho')} stroke={s} strokeWidth=".6"/><path d="M86 72 Q100 75 114 72 L112 110 Q100 114 88 110 Z" fill={fill('core')} stroke={s} strokeWidth=".6"/><ellipse cx="64" cy="64" rx="7" ry="14" fill={fill('bíceps')} stroke={s} strokeWidth=".6"/><ellipse cx="136" cy="64" rx="7" ry="14" fill={fill('bíceps')} stroke={s} strokeWidth=".6"/><ellipse cx="60" cy="89" rx="6" ry="13" fill={fill('antebrazos')} stroke={s} strokeWidth=".6"/><ellipse cx="140" cy="89" rx="6" ry="13" fill={fill('antebrazos')} stroke={s} strokeWidth=".6"/><path d="M84 112 L116 112 L120 130 L80 130 Z" fill={fill('flexores de cadera')} stroke={s} strokeWidth=".6"/><path d="M82 132 L98 132 L96 178 L82 178 Z" fill={fill('cuádriceps')} stroke={s} strokeWidth=".6"/><path d="M102 132 L118 132 L118 178 L104 178 Z" fill={fill('cuádriceps')} stroke={s} strokeWidth=".6"/></g>
  const back=<g><circle cx="100" cy="22" r="13" fill="rgba(255,255,255,0.04)" stroke={s} strokeWidth=".6"/><ellipse cx="76" cy="46" rx="13" ry="9" fill={fill('hombros')} stroke={s} strokeWidth=".6"/><ellipse cx="124" cy="46" rx="13" ry="9" fill={fill('hombros')} stroke={s} strokeWidth=".6"/><path d="M82 44 Q100 40 118 44 L120 80 Q100 84 80 80 Z" fill={fill('espalda')} stroke={s} strokeWidth=".6"/><path d="M84 82 Q100 86 116 82 L114 110 Q100 114 86 110 Z" fill={fill('espalda')} stroke={s} strokeWidth=".6"/><ellipse cx="64" cy="64" rx="7" ry="14" fill={fill('tríceps')} stroke={s} strokeWidth=".6"/><ellipse cx="136" cy="64" rx="7" ry="14" fill={fill('tríceps')} stroke={s} strokeWidth=".6"/><path d="M82 112 L100 112 L100 134 L84 134 Z" fill={fill('glúteos')} stroke={s} strokeWidth=".6"/><path d="M100 112 L118 112 L116 134 L100 134 Z" fill={fill('glúteos')} stroke={s} strokeWidth=".6"/><path d="M82 136 L100 136 L98 178 L84 178 Z" fill={fill('isquios')} stroke={s} strokeWidth=".6"/><path d="M100 136 L118 136 L116 178 L102 178 Z" fill={fill('isquios')} stroke={s} strokeWidth=".6"/><path d="M84 182 L96 182 L94 215 L86 215 Z" fill={fill('gemelos')} stroke={s} strokeWidth=".6"/><path d="M104 182 L116 182 L114 215 L106 215 Z" fill={fill('gemelos')} stroke={s} strokeWidth=".6"/></g>
  return <svg viewBox="0 0 200 230" width={size} height={size*230/200} style={{display:'block'}}>{view==='front'?front:back}</svg>
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function AuthScreen({accent='#d8ff3d'}) {
  const [mode,setMode]=useState('login')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [name,setName]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [success,setSuccess]=useState('')

  const errMap={'Invalid login credentials':'Email o contraseña incorrectos.','User already registered':'Ya existe una cuenta con ese email.','Password should be at least 6 characters':'La contraseña debe tener al menos 6 caracteres.'}

  const submit = async () => {
    setError('');setSuccess('');setLoading(true)
    try {
      if(mode==='register') {
        const {data,error:e}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}})
        if(e) throw e
        if(data.user&&!data.session) setSuccess('¡Cuenta creada! Revisá tu email para confirmar.')
      } else {
        const {error:e}=await supabase.auth.signInWithPassword({email,password})
        if(e) throw e
      }
    } catch(e) { setError(errMap[e.message]||e.message) }
    setLoading(false)
  }

  const resetPassword = async () => {
    if(!email){setError('Ingresá tu email primero.');return}
    setLoading(true);setError('')
    const{error:e}=await supabase.auth.resetPasswordForEmail(email)
    if(e) setError(e.message); else setSuccess('Te mandamos un email para resetear tu contraseña.')
    setLoading(false)
  }

  return (
    <div style={{width:'100%',height:'100vh',background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px'}}>
      <div style={{marginBottom:40,textAlign:'center'}}>
        <div style={{fontFamily:'Inter,system-ui',fontSize:30,fontWeight:700,color:'#f5f5f0',letterSpacing:-1}}>Freestyle<span style={{color:accent}}>GYM</span></div>
        <div style={{fontFamily:'Inter,system-ui',fontSize:13,color:'rgba(245,245,240,0.4)',marginTop:4}}>Tu entrenamiento, siempre con vos</div>
      </div>
      <div style={{width:'100%',maxWidth:360,background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:20,padding:28}}>
        <div style={{display:'flex',background:'#141414',borderRadius:10,padding:3,marginBottom:24}}>
          {[{id:'login',l:'Iniciar sesión'},{id:'register',l:'Crear cuenta'}].map(t=>(
            <button key={t.id} onClick={()=>{setMode(t.id);setError('');setSuccess('')}}
              style={{flex:1,height:34,background:mode===t.id?'#1f1f1f':'transparent',border:0,borderRadius:7,color:mode===t.id?'#f5f5f0':'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:13,fontWeight:500,cursor:'pointer'}}>
              {t.l}
            </button>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {mode==='register'&&<div><Lbl style={{marginBottom:6}}>Nombre</Lbl><input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={{width:'100%',height:44,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:10,padding:'0 14px',color:'#f5f5f0',fontFamily:'Inter',fontSize:14,outline:'none'}}/></div>}
          <div><Lbl style={{marginBottom:6}}>Email</Lbl><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" style={{width:'100%',height:44,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:10,padding:'0 14px',color:'#f5f5f0',fontFamily:'Inter',fontSize:14,outline:'none'}}/></div>
          <div><Lbl style={{marginBottom:6}}>Contraseña</Lbl><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" onKeyDown={e=>e.key==='Enter'&&submit()} style={{width:'100%',height:44,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:10,padding:'0 14px',color:'#f5f5f0',fontFamily:'Inter',fontSize:14,outline:'none'}}/></div>
        </div>
        {error&&<div style={{marginTop:12,padding:'10px 14px',background:'rgba(255,80,80,0.08)',border:'0.5px solid rgba(255,80,80,0.3)',borderRadius:8,fontFamily:'Inter',fontSize:12,color:'#ff6060'}}>{error}</div>}
        {success&&<div style={{marginTop:12,padding:'10px 14px',background:'rgba(61,214,168,0.08)',border:'0.5px solid rgba(61,214,168,0.3)',borderRadius:8,fontFamily:'Inter',fontSize:12,color:'#3dd6a8'}}>{success}</div>}
        <button onClick={submit} disabled={loading} style={{width:'100%',height:48,marginTop:20,background:accent,border:0,borderRadius:12,color:'#000',fontFamily:'Inter',fontSize:14,fontWeight:700,cursor:loading?'wait':'pointer',opacity:loading?.7:1}}>
          {loading?'Cargando...':(mode==='login'?'Entrar':'Crear cuenta')}
        </button>
        {mode==='login'&&<button onClick={resetPassword} style={{width:'100%',marginTop:10,background:'transparent',border:0,color:'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:12,cursor:'pointer',padding:'8px 0'}}>¿Olvidaste tu contraseña?</button>}
      </div>
    </div>
  )
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function Onboarding({onComplete,accent}) {
  const [step,setStep]=useState(0)
  const [data,setData]=useState({name:'',goal:'hipertrofia',priorities:['pecho','espalda','piernas'],frequency:4,experience:'intermedio'})
  const canNext=step===0?data.name.trim().length>0:true
  const next=()=>{if(!canNext)return;step<5?setStep(step+1):onComplete(data)}
  const back=()=>setStep(Math.max(0,step-1))
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#000',color:'#f5f5f0'}}>
      <div style={{padding:'48px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <button onClick={back} disabled={step===0} style={{background:'transparent',border:0,color:step===0?'transparent':'rgba(245,245,240,0.5)',fontFamily:'Inter',fontSize:13,cursor:step===0?'default':'pointer',padding:0}}>← Atrás</button>
        <div style={{display:'flex',gap:5}}>{[0,1,2,3,4,5].map(i=><div key={i} style={{width:i===step?18:6,height:6,borderRadius:3,background:i<=step?accent:'rgba(245,245,240,0.18)',transition:'all .25s'}}/>)}</div>
        <div style={{width:50,fontFamily:'ui-monospace,monospace',fontSize:11,color:'rgba(245,245,240,0.4)',textAlign:'right'}}>{String(step+1).padStart(2,'0')}/06</div>
      </div>
      <div style={{flex:1,padding:'32px 24px 24px',overflow:'auto'}}>
        {step===0&&<StepName data={data} setData={setData} accent={accent}/>}
        {step===1&&<StepGoal data={data} setData={setData} accent={accent}/>}
        {step===2&&<StepPriorities data={data} setData={setData} accent={accent}/>}
        {step===3&&<StepFrequency data={data} setData={setData} accent={accent}/>}
        {step===4&&<StepExperience data={data} setData={setData} accent={accent}/>}
        {step===5&&<StepPlanPreview data={data} accent={accent}/>}
      </div>
      <div style={{padding:'0 24px 32px'}}><Button onClick={next} accent={accent} disabled={!canNext}>{step===5?'¡Empezar!':'Continuar'}</Button></div>
    </div>
  )
}

const StepHeader = ({eyebrow,title,sub}) => (
  <div style={{marginBottom:28}}>
    <Lbl style={{marginBottom:10}}>{eyebrow}</Lbl>
    <div style={{fontFamily:'Inter',fontSize:24,fontWeight:600,lineHeight:1.15,letterSpacing:-.7,color:'#f5f5f0'}}>{title}</div>
    {sub&&<div style={{marginTop:10,fontFamily:'Inter',fontSize:14,color:'rgba(245,245,240,0.55)',lineHeight:1.4}}>{sub}</div>}
  </div>
)
const OptionRow = ({label,desc,selected,onClick,accent}) => (
  <button onClick={onClick} style={{width:'100%',textAlign:'left',background:selected?'rgba(245,245,240,0.04)':'#0a0a0a',border:selected?`0.5px solid ${accent}`:'0.5px solid #1a1a1a',borderRadius:12,padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,transition:'all .15s'}}>
    <div><div style={{fontFamily:'Inter',fontSize:15,fontWeight:500,color:'#f5f5f0'}}>{label}</div>{desc&&<div style={{fontFamily:'Inter',fontSize:12,color:'rgba(245,245,240,0.45)',marginTop:3}}>{desc}</div>}</div>
    <div style={{width:18,height:18,borderRadius:9,border:selected?`1.5px solid ${accent}`:'1.5px solid rgba(245,245,240,0.2)',background:selected?accent:'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>{selected&&<div style={{width:6,height:6,borderRadius:3,background:'#000'}}/>}</div>
  </button>
)

function StepName({data,setData,accent}) {
  return (<><StepHeader eyebrow="00 — Bienvenida" title="¿Cómo te llamás?" sub="Solo vos ves esto."/><input autoFocus value={data.name} onChange={e=>setData({...data,name:e.target.value})} placeholder="Tu nombre…" style={{width:'100%',height:52,background:'#0a0a0a',border:`0.5px solid ${data.name.trim()?accent:'#1f1f1f'}`,borderRadius:12,padding:'0 18px',color:'#f5f5f0',fontFamily:'Inter',fontSize:18,fontWeight:500,outline:'none'}}/>{data.name.trim()&&<div style={{marginTop:16,padding:'14px 16px',background:'rgba(245,245,240,0.03)',border:`0.5px solid ${accent}`,borderRadius:12}}><Lbl style={{marginBottom:4}}>Vista previa</Lbl><div style={{fontFamily:'Inter',fontSize:18,fontWeight:600,color:'#f5f5f0'}}>Hola, {data.name.trim()} 👋</div></div>}</>)
}
function StepGoal({data,setData,accent}) {
  return (<><StepHeader eyebrow="01 — Objetivo" title="¿Cuál es tu objetivo?"/><div style={{display:'flex',flexDirection:'column',gap:8}}>{[{id:'fuerza',l:'Fuerza',d:'Carga alta, 4–6 reps.'},{id:'hipertrofia',l:'Hipertrofia',d:'Carga moderada, 8–12 reps.'},{id:'resistencia',l:'Resistencia',d:'Carga liviana, 15+ reps.'},{id:'general',l:'General',d:'Rangos mixtos.'}].map(g=><OptionRow key={g.id} label={g.l} desc={g.d} selected={data.goal===g.id} onClick={()=>setData({...data,goal:g.id})} accent={accent}/>)}</div></>)
}
function StepPriorities({data,setData,accent}) {
  const groups=['pecho','espalda','piernas','hombros','brazos','core']
  const move=(m,dir)=>{const a=[...data.priorities];const i=a.indexOf(m);const j=i+dir;if(i<0||j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];setData({...data,priorities:a})}
  const toggle=m=>setData({...data,priorities:data.priorities.includes(m)?data.priorities.filter(x=>x!==m):[...data.priorities,m]})
  const ordered=[...data.priorities,...groups.filter(g=>!data.priorities.includes(g))]
  return (<><StepHeader eyebrow="02 — Prioridades" title="Zonas de foco" sub="Tocá para activar, flechas para reordenar."/><div style={{display:'flex',flexDirection:'column',gap:6}}>{ordered.map(m=>{const active=data.priorities.includes(m);const rank=active?data.priorities.indexOf(m)+1:null;return(<div key={m} style={{display:'flex',alignItems:'center',gap:8,background:active?'rgba(245,245,240,0.04)':'#0a0a0a',border:active?`0.5px solid ${accent}`:'0.5px solid #1a1a1a',borderRadius:12,padding:'10px 12px'}}><div onClick={()=>toggle(m)} style={{flex:1,display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}><MonoNum size={14} color={active?accent:'rgba(245,245,240,0.3)'}>{rank?String(rank).padStart(2,'0'):'··'}</MonoNum><span style={{fontFamily:'Inter',fontSize:15,fontWeight:500,color:'#f5f5f0',textTransform:'capitalize'}}>{m}</span></div>{active&&<div style={{display:'flex',gap:2}}><button onClick={()=>move(m,-1)} style={{background:'transparent',border:0,color:'rgba(245,245,240,0.5)',cursor:'pointer',padding:'4px 6px',fontSize:14}}>↑</button><button onClick={()=>move(m,1)} style={{background:'transparent',border:0,color:'rgba(245,245,240,0.5)',cursor:'pointer',padding:'4px 6px',fontSize:14}}>↓</button></div>}</div>)})}</div></>)
}
function StepFrequency({data,setData,accent}) {
  const splits={2:'Cuerpo completo 2×',3:'Empuje/Tracción/Piernas',4:'PPL + Upper',5:'PPL + Hombros + Glúteos',6:'PPL×2'}
  return (<><StepHeader eyebrow="03 — Frecuencia" title="¿Cuántos días por semana?"/><div style={{display:'flex',justifyContent:'center',alignItems:'baseline',gap:8,padding:'32px 0 24px'}}><MonoNum size={88} weight={500} color={accent}>{data.frequency}</MonoNum><div style={{fontFamily:'Inter',fontSize:14,color:'rgba(245,245,240,0.5)'}}>días/sem</div></div><div style={{display:'flex',gap:8}}>{[2,3,4,5,6].map(n=><button key={n} onClick={()=>setData({...data,frequency:n})} style={{flex:1,height:48,background:data.frequency===n?accent:'#0a0a0a',color:data.frequency===n?'#000':'#f5f5f0',border:data.frequency===n?'none':'0.5px solid #1a1a1a',borderRadius:12,fontFamily:'ui-monospace,monospace',fontSize:16,fontWeight:600,cursor:'pointer'}}>{n}</button>)}</div><div style={{marginTop:16,padding:'12px 14px',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:10}}><Lbl style={{marginBottom:4}}>Split</Lbl><div style={{fontFamily:'Inter',fontSize:13,color:'rgba(245,245,240,0.7)'}}>{splits[data.frequency]}</div></div></>)
}
function StepExperience({data,setData,accent}) {
  return (<><StepHeader eyebrow="04 — Experiencia" title="¿Cómo viene el entrenamiento?"/><div style={{display:'flex',flexDirection:'column',gap:8}}>{[{id:'principiante',l:'Principiante',d:'Recién empezás o volvés.'},{id:'intermedio',l:'Intermedio',d:'Más de 6 meses consistente.'},{id:'avanzado',l:'Avanzado',d:'2+ años, dominio completo.'}].map(l=><OptionRow key={l.id} label={l.l} desc={l.d} selected={data.experience===l.id} onClick={()=>setData({...data,experience:l.id})} accent={accent}/>)}</div></>)
}
function StepPlanPreview({data,accent}) {
  const template=SPLIT_TEMPLATES[data.frequency]||SPLIT_TEMPLATES[4]
  return (<><StepHeader eyebrow="05 — Tu rutina" title="Así queda tu plan" sub="Basado en tu objetivo y frecuencia. Podés editarlo cuando quieras."/><div style={{display:'flex',flexDirection:'column',gap:10}}>{template.map((day,i)=><div key={i} style={{background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,padding:'14px 16px'}}><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}><span style={{fontFamily:'ui-monospace,monospace',fontSize:11,color:accent,fontWeight:600}}>{day.label}</span><span style={{fontFamily:'Inter',fontSize:14,fontWeight:600,color:'#f5f5f0'}}>{day.title}</span></div><div style={{display:'flex',flexDirection:'column',gap:4}}>{day.exercises.map(exId=>{const ex=getExercise(exId);return ex?<div key={exId} style={{display:'flex',justifyContent:'space-between'}}><span style={{fontFamily:'Inter',fontSize:12,color:'rgba(245,245,240,0.7)'}}>{ex.name}</span><span style={{fontFamily:'ui-monospace,monospace',fontSize:10,color:'rgba(245,245,240,0.4)'}}>{setsForGoal(data.goal)}×{repsForGoal(data.goal)}</span></div>:null})}</div></div>)}</div></>)
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeScreen({profile,plan,history,accent,onStartDay,onStartFreestyle,onRenewPlan}) {
  const template=SPLIT_TEMPLATES[profile.frequency]||SPLIT_TEMPLATES[4]
  const [selDay,setSelDay]=useState(()=>{
    const last=history[0]; if(!last) return 0
    const idx=template.findIndex(d=>d.title===last.title)
    return (idx+1)%template.length
  })
  const [bodyView,setBodyView]=useState('front')
  const heat=muscleHeatFromHistory(history,7)
  const cutoff=new Date(today);cutoff.setDate(cutoff.getDate()-7)
  const weekSessions=history.filter(h=>new Date(h.date)>=cutoff).length
  const dateStr=`${WEEKDAY_LONG[today.getDay()]}, ${today.getDate()} ${MONTH_SHORT[today.getMonth()]}`.toUpperCase()

  return (
    <div style={{height:'100%',overflow:'auto',background:'#000',color:'#f5f5f0',paddingBottom:100}}>
      <Header subtitle={dateStr} title={`Hola, ${profile.name} 👋`}/>
      <div style={{padding:'0 16px 20px'}}>
        <div style={{background:'linear-gradient(135deg,#0d0d0d,#0a0a0a)',border:'0.5px solid #1f1f1f',borderRadius:16,padding:20}}>
          <Lbl style={{marginBottom:10}}>¿Qué entrenás hoy?</Lbl>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
            {template.map((day,i)=>{
              const isSel=selDay===i
              return <button key={i} onClick={()=>setSelDay(i)} style={{width:'100%',background:isSel?'rgba(245,245,240,0.06)':'transparent',border:isSel?`0.5px solid ${accent}`:'0.5px solid #1a1a1a',borderRadius:12,padding:'12px 14px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',textAlign:'left',transition:'all .15s'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <MonoNum size={13} color={isSel?accent:'rgba(245,245,240,0.35)'}>{day.label}</MonoNum>
                  <div>
                    <div style={{fontFamily:'Inter',fontSize:14,fontWeight:600,color:'#f5f5f0'}}>{day.title}</div>
                    <div style={{display:'flex',gap:4,marginTop:3,flexWrap:'wrap'}}>{day.muscles?.map(m=><span key={m} style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:.4}}>{m}</span>)}</div>
                  </div>
                </div>
                {isSel&&<div style={{width:18,height:18,borderRadius:9,background:accent,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
              </button>
            })}
          </div>
          <div style={{display:'flex',gap:8}}>
            <Button onClick={()=>onStartDay(selDay)} accent={accent} style={{flex:2}}>Empezar →</Button>
            <Button onClick={onStartFreestyle} variant="secondary" style={{flex:1}}>Libre</Button>
          </div>
        </div>
      </div>

      <div style={{padding:'0 16px 16px'}}>
        <div style={{background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontFamily:'Inter',fontSize:13,fontWeight:500,color:'#f5f5f0'}}>Rutina de 4 semanas</div>
            <div style={{fontFamily:'Inter',fontSize:11,color:'rgba(245,245,240,0.45)',marginTop:2}}>{plan?`Generada ${new Date(plan.generatedAt).toLocaleDateString('es-AR')}`:'No generada aún'}</div>
          </div>
          <button onClick={onRenewPlan} style={{height:32,padding:'0 14px',background:'rgba(245,245,240,0.06)',border:`0.5px solid ${accent}`,borderRadius:8,color:accent,fontFamily:'Inter',fontSize:12,fontWeight:600,cursor:'pointer'}}>↺ Renovar</button>
        </div>
      </div>

      <div style={{padding:'0 16px 16px'}}>
        <Card style={{padding:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <Lbl>Entrenado · 7 días</Lbl>
            <div style={{display:'flex',background:'#141414',borderRadius:8,padding:2}}>
              {[{id:'front',l:'Frente'},{id:'back',l:'Espalda'}].map(v=><button key={v.id} onClick={()=>setBodyView(v.id)} style={{background:bodyView===v.id?'#262626':'transparent',border:0,color:bodyView===v.id?'#f5f5f0':'rgba(245,245,240,0.5)',fontFamily:'Inter',fontSize:11,fontWeight:500,padding:'4px 10px',borderRadius:6,cursor:'pointer'}}>{v.l}</button>)}
            </div>
          </div>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <div style={{flexShrink:0}}><BodyDiagram heat={heat} accent={accent} size={130} view={bodyView}/></div>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
              {Object.entries(heat).sort(([,a],[,b])=>b-a).slice(0,6).map(([m,v])=>(
                <div key={m} style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{flex:1,fontFamily:'Inter',fontSize:11,color:'rgba(245,245,240,0.7)',textTransform:'capitalize'}}>{m}</div>
                  <div style={{width:60,height:3,background:'rgba(245,245,240,0.06)',borderRadius:2,overflow:'hidden'}}><div style={{width:`${v*100}%`,height:'100%',background:v>0?accent:'transparent'}}/></div>
                  <MonoNum size={9} color="rgba(245,245,240,0.4)" style={{width:22,textAlign:'right'}}>{Math.round(v*100)}</MonoNum>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div style={{padding:'0 16px 16px'}}>
        <Card style={{padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
            <Lbl>Esta semana</Lbl>
            <div><MonoNum size={20}>{weekSessions}</MonoNum><span style={{fontFamily:'ui-monospace,monospace',fontSize:11,color:'rgba(245,245,240,0.4)'}}> /{profile.frequency}</span></div>
          </div>
          <WeekDots history={history} accent={accent}/>
        </Card>
      </div>
    </div>
  )
}

function WeekDots({history,accent}) {
  const dates=new Set(history.map(h=>h.date))
  const days=[]
  for(let i=6;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);const iso=d.toISOString().slice(0,10);days.push({d,iso,trained:dates.has(iso),today:i===0})}
  return <div style={{display:'flex',justifyContent:'space-between',gap:4}}>{days.map(day=><div key={day.iso} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}><div style={{fontFamily:'Inter',fontSize:9,color:'rgba(245,245,240,0.4)',textTransform:'uppercase'}}>{WEEKDAY_SHORT[day.d.getDay()].slice(0,1)}</div><div style={{width:'100%',height:32,borderRadius:6,background:day.trained?accent:'rgba(245,245,240,0.05)',border:day.today?`0.5px solid ${accent}`:'none',opacity:day.trained?1:(day.today?1:0.5)}}/><MonoNum size={9} color={day.today?'#f5f5f0':'rgba(245,245,240,0.4)'}>{String(day.d.getDate()).padStart(2,'0')}</MonoNum></div>)}</div>
}

// ── ROUTINE ───────────────────────────────────────────────────────────────────
function RoutineScreen({profile,plan,history,accent,onRenewPlan,onUpdatePlan}) {
  const template=SPLIT_TEMPLATES[profile.frequency]||SPLIT_TEMPLATES[4]
  const [expanded,setExpanded]=useState(null)
  const [editingEx,setEditingEx]=useState(null)
  const [showAdd,setShowAdd]=useState(null)

  const days=plan?.weeks?.[0]||template.map(day=>({...day,exercises:day.exercises.map(exId=>({exId,sets:setsForGoal(profile.goal),reps:repsForGoal(profile.goal),weight:suggestWeight(history,exId,profile),rir:rirForGoal(profile.goal)}))}))

  const swap=(dayIdx,exIdx,newExId)=>{
    if(!plan) return
    const weeks=plan.weeks.map(wk=>wk.map((d,di)=>{if(di!==dayIdx)return d;const exs=[...d.exercises];exs[exIdx]={...exs[exIdx],exId:newExId};return{...d,exercises:exs}}))
    onUpdatePlan({...plan,weeks});setEditingEx(null)
  }
  const addEx=(dayIdx,exId)=>{
    if(!plan) return
    const newEx={exId,sets:setsForGoal(profile.goal),reps:repsForGoal(profile.goal),weight:suggestWeight(history,exId,profile),rir:rirForGoal(profile.goal)}
    const weeks=plan.weeks.map(wk=>wk.map((d,di)=>di!==dayIdx?d:{...d,exercises:[...d.exercises,newEx]}))
    onUpdatePlan({...plan,weeks});setShowAdd(null)
  }
  const removeEx=(dayIdx,exIdx)=>{
    if(!plan) return
    const weeks=plan.weeks.map(wk=>wk.map((d,di)=>di!==dayIdx?d:{...d,exercises:d.exercises.filter((_,i)=>i!==exIdx)}))
    onUpdatePlan({...plan,weeks})
  }

  return (
    <div style={{height:'100%',overflow:'auto',background:'#000',color:'#f5f5f0',paddingBottom:100}}>
      <Header subtitle="MI PLAN" title="Rutina" right={<button onClick={onRenewPlan} style={{height:32,padding:'0 12px',background:'rgba(245,245,240,0.06)',border:`0.5px solid ${accent}`,borderRadius:8,color:accent,fontFamily:'Inter',fontSize:11,fontWeight:600,cursor:'pointer'}}>↺ Renovar</button>}/>
      <div style={{padding:'0 16px 14px'}}>
        <div style={{background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,padding:'12px 16px'}}>
          <Lbl style={{marginBottom:2}}>Plan activo</Lbl>
          <div style={{fontFamily:'Inter',fontSize:12,color:'rgba(245,245,240,0.5)'}}>{plan?`Generado ${new Date(plan.generatedAt).toLocaleDateString('es-AR')}`:'Sin plan'} · {profile.frequency} días/sem · {profile.goal}</div>
        </div>
      </div>
      <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:8}}>
        {days.map((day,dayIdx)=>{
          const isExp=expanded===dayIdx
          return <div key={dayIdx} style={{background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:14,overflow:'hidden'}}>
            <button onClick={()=>setExpanded(isExp?null:dayIdx)} style={{width:'100%',background:'transparent',border:0,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',textAlign:'left'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontFamily:'ui-monospace,monospace',fontSize:11,color:accent,fontWeight:600}}>{day.label}</span>
                <div>
                  <div style={{fontFamily:'Inter',fontSize:15,fontWeight:600,color:'#f5f5f0'}}>{day.title}</div>
                  <div style={{display:'flex',gap:4,marginTop:2}}>{day.muscles?.map(m=><span key={m} style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.4)',textTransform:'uppercase'}}>{m}</span>)}</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontFamily:'ui-monospace,monospace',fontSize:11,color:'rgba(245,245,240,0.4)'}}>{day.exercises.length} ej</span>
                <span style={{color:'rgba(245,245,240,0.4)',fontSize:12,transform:isExp?'rotate(180deg)':'none',transition:'transform .2s'}}>▼</span>
              </div>
            </button>
            {isExp&&<div style={{borderTop:'0.5px solid #141414',padding:'8px 16px 14px'}}>
              {day.exercises.map((ex,exIdx)=>{
                const exercise=getExercise(ex.exId); if(!exercise) return null
                const isEdit=editingEx?.dayIdx===dayIdx&&editingEx?.exIdx===exIdx
                return <div key={exIdx} style={{padding:'10px 0',borderBottom:exIdx<day.exercises.length-1?'0.5px solid #141414':'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <MonoNum size={10} color="rgba(245,245,240,0.3)">{String(exIdx+1).padStart(2,'0')}</MonoNum>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:'Inter',fontSize:13,fontWeight:500,color:'#f5f5f0'}}>{exercise.name}</div>
                      <div style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.4)',marginTop:2,textTransform:'uppercase'}}>{ex.sets} series · {ex.reps} reps · {ex.weight}kg</div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>setEditingEx(isEdit?null:{dayIdx,exIdx})} style={{height:28,padding:'0 10px',background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:6,color:'rgba(245,245,240,0.6)',fontFamily:'Inter',fontSize:11,cursor:'pointer'}}>Cambiar</button>
                      <button onClick={()=>removeEx(dayIdx,exIdx)} style={{width:28,height:28,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:6,color:'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:14,cursor:'pointer'}}>−</button>
                    </div>
                  </div>
                  {isEdit&&<div style={{marginTop:10,background:'#141414',borderRadius:10,padding:10}}>
                    <Lbl style={{marginBottom:8}}>Alternativas</Lbl>
                    {(exercise.alts||[]).length===0&&<div style={{fontFamily:'Inter',fontSize:12,color:'rgba(245,245,240,0.4)'}}>Sin alternativas registradas.</div>}
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      {(exercise.alts||[]).slice(0,4).map(altId=>{const alt=getExercise(altId);return alt?<button key={altId} onClick={()=>swap(dayIdx,exIdx,altId)} style={{textAlign:'left',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:8,padding:'10px 12px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontFamily:'Inter',fontSize:12,color:'#f5f5f0'}}>{alt.name}</div><div style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.4)',textTransform:'uppercase',marginTop:2}}>{alt.equipment}</div></div><span style={{color:accent,fontSize:12}}>→</span></button>:null})}
                    </div>
                  </div>}
                </div>
              })}
              {showAdd===dayIdx
                ?<InlineSearch onAdd={exId=>addEx(dayIdx,exId)} onClose={()=>setShowAdd(null)} accent={accent}/>
                :<button onClick={()=>setShowAdd(dayIdx)} style={{width:'100%',height:36,marginTop:8,background:'transparent',border:'0.5px dashed rgba(245,245,240,0.2)',borderRadius:8,color:'rgba(245,245,240,0.5)',fontFamily:'Inter',fontSize:12,cursor:'pointer'}}>+ Agregar ejercicio</button>
              }
            </div>}
          </div>
        })}
      </div>
    </div>
  )
}

function InlineSearch({onAdd,onClose,accent}) {
  const [q,setQ]=useState('')
  const result=useMemo(()=>searchExercises(q),[q])
  const defaults=['press-banca','dominadas','sentadilla-libre','curl-barra','extension-polea']
  return (
    <div style={{marginTop:10,background:'#141414',borderRadius:10,padding:12}}>
      <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar ejercicio…" style={{width:'100%',height:36,background:'#0a0a0a',border:'0.5px solid #1f1f1f',borderRadius:8,padding:'0 12px',color:'#f5f5f0',fontFamily:'Inter',fontSize:13,outline:'none',marginBottom:8}}/>
      <div style={{maxHeight:160,overflow:'auto',display:'flex',flexDirection:'column',gap:4}}>
        {(q?result.hits.slice(0,6).map(h=>h.id):defaults).map(id=>{const ex=getExercise(id);return ex?<button key={id} onClick={()=>onAdd(id)} style={{textAlign:'left',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:6,padding:'8px 10px',cursor:'pointer',fontFamily:'Inter',fontSize:12,color:'#f5f5f0'}}>{ex.name}</button>:null})}
      </div>
      <button onClick={onClose} style={{marginTop:8,background:'transparent',border:0,color:'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:11,cursor:'pointer',padding:0}}>Cancelar</button>
    </div>
  )
}

// ── TRAIN PICKER ──────────────────────────────────────────────────────────────
function TrainPicker({accent,profile,onStartDay,onStartFreestyle,onOnboarding}) {
  const template=SPLIT_TEMPLATES[profile.frequency]||SPLIT_TEMPLATES[4]
  return (
    <div style={{height:'100%',overflow:'auto',background:'#000',color:'#f5f5f0',paddingBottom:100}}>
      <Header subtitle="EMPEZAR" title="Entrenar"/>
      <div style={{padding:'0 16px 12px'}}>
        <div style={{fontFamily:'Inter',fontSize:12,color:'rgba(245,245,240,0.5)',marginBottom:14,lineHeight:1.4}}>Elegí el día de tu rutina o entrená libre.</div>
        {template.map((day,i)=>(
          <button key={i} onClick={()=>onStartDay(i)} style={{width:'100%',textAlign:'left',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,padding:'14px 16px',cursor:'pointer',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><MonoNum size={11} color={accent}>{day.label}</MonoNum><div style={{fontFamily:'Inter',fontSize:16,fontWeight:600,color:'#f5f5f0'}}>{day.title}</div></div>
              <div style={{display:'flex',gap:6}}>{day.muscles?.map(m=><span key={m} style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:.5}}>{m}</span>)}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <MonoNum size={11} color="rgba(245,245,240,0.4)">{day.exercises.length} EJ</MonoNum>
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M1 1l6 5-6 5" stroke="rgba(245,245,240,0.4)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          </button>
        ))}
        <button onClick={onStartFreestyle} style={{width:'100%',height:48,marginTop:4,background:'transparent',border:'0.5px dashed rgba(245,245,240,0.2)',borderRadius:12,color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:13,fontWeight:500,cursor:'pointer'}}>+ Sesión libre</button>
        <div style={{marginTop:24}}><Lbl style={{marginBottom:8}}>Demo</Lbl><button onClick={onOnboarding} style={{width:'100%',height:40,background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:10,color:'rgba(245,245,240,0.65)',fontFamily:'Inter',fontSize:12,cursor:'pointer'}}>Repetir onboarding</button></div>
      </div>
    </div>
  )
}

// ── SESSION ───────────────────────────────────────────────────────────────────
function SessionScreen({dayTemplate,freestyle,accent,onFinish,onCancel,profile,history}) {
  const initial=freestyle?[]:(dayTemplate?.exercises||[]).map((e,i)=>({...e,uid:`e${i}`,completedSets:Array(e.sets).fill(null),notes:'',weight:suggestWeight(history,e.exId,profile)}))
  const [exercises,setExercises]=useState(initial)
  const [activeIdx,setActiveIdx]=useState(0)
  const [showSwap,setShowSwap]=useState(null)
  const [showAdd,setShowAdd]=useState(false)
  const [restTimer,setRestTimer]=useState(null)
  const [now,setNow]=useState(Date.now())
  const [sessionStart]=useState(Date.now())
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(id)},[])
  useEffect(()=>{
    if(restTimer){const elapsed=Math.floor((now-restTimer.start)/1000);if(elapsed>=restTimer.duration&&!restTimer.notified){if('Notification' in window&&Notification.permission==='granted')new Notification('FreestyleGYM',{body:'¡Descanso terminado!'});setRestTimer(r=>r?{...r,notified:true}:r)}}
  },[now,restTimer])

  const elMin=Math.floor((now-sessionStart)/60000)
  const elSec=Math.floor(((now-sessionStart)%60000)/1000)
  const completeSet=(uid,idx,data)=>{setExercises(prev=>prev.map(e=>{if(e.uid!==uid)return e;const cs=[...e.completedSets];cs[idx]=data;return{...e,completedSets:cs}}));setRestTimer({start:Date.now(),duration:90,notified:false})}
  const swapEx=(uid,newId)=>{setExercises(prev=>prev.map(e=>e.uid!==uid?e:{...e,exId:newId}));setShowSwap(null)}
  const addEx=exId=>{setExercises(prev=>[...prev,{exId,sets:3,reps:repsForGoal(profile?.goal),weight:suggestWeight(history,exId,profile),rir:rirForGoal(profile?.goal),uid:`f${Date.now()}`,completedSets:[null,null,null],notes:''}]);setShowAdd(false)}
  const totalSets=exercises.reduce((s,e)=>s+e.completedSets.length,0)
  const doneSets=exercises.reduce((s,e)=>s+e.completedSets.filter(Boolean).length,0)
  const progress=totalSets?doneSets/totalSets:0
  const finishData={title:freestyle?'Sesión libre':(dayTemplate?.title||'Sesión'),date:new Date().toISOString().slice(0,10),duration:Math.floor((now-sessionStart)/60000),exercises:exercises.map(e=>({exId:e.exId,sets:e.completedSets.filter(Boolean)})).filter(e=>e.sets.length>0)}

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#000',color:'#f5f5f0'}}>
      <div style={{padding:'48px 16px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'0.5px solid #141414'}}>
        <button onClick={onCancel} style={{background:'transparent',border:0,color:'rgba(245,245,240,0.55)',fontFamily:'Inter',fontSize:13,cursor:'pointer',padding:0}}>✕ Cancelar</button>
        <div style={{display:'flex',alignItems:'baseline',gap:6}}><MonoNum size={18}>{String(elMin).padStart(2,'0')}:{String(elSec).padStart(2,'0')}</MonoNum><span style={{fontFamily:'Inter',fontSize:10,color:'rgba(245,245,240,0.4)',textTransform:'uppercase',letterSpacing:.5}}>transcurrido</span></div>
        <div style={{width:70,textAlign:'right'}}><MonoNum size={13} color={accent}>{doneSets}</MonoNum><span style={{fontFamily:'ui-monospace,monospace',fontSize:11,color:'rgba(245,245,240,0.4)'}}>/{totalSets}</span></div>
      </div>
      <div style={{height:2,background:'#0a0a0a'}}><div style={{height:'100%',width:`${progress*100}%`,background:accent,transition:'width .3s'}}/></div>
      <div style={{padding:'14px 20px 4px'}}><Lbl>{freestyle?'Sesión libre':'Rutina'}</Lbl><div style={{fontFamily:'Inter',fontSize:20,fontWeight:600,letterSpacing:-.5,marginTop:4}}>{freestyle?'Sesión libre':dayTemplate?.title}</div></div>
      <div style={{flex:1,overflow:'auto',padding:'16px 16px 180px'}}>
        {exercises.length===0&&<div style={{padding:'40px 16px',textAlign:'center',color:'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:13}}>Tocá + para agregar ejercicios.</div>}
        {exercises.map((e,i)=><ExerciseCard key={e.uid} exercise={e} idx={i} active={activeIdx===i} onActivate={()=>setActiveIdx(i)} onSwap={()=>setShowSwap(e.uid)} onCompleteSet={(si,data)=>completeSet(e.uid,si,data)} onUpdate={patch=>setExercises(prev=>prev.map(x=>x.uid===e.uid?{...x,...patch}:x))} onRemove={()=>setExercises(prev=>prev.filter(x=>x.uid!==e.uid))} accent={accent} history={history}/>)}
        <button onClick={()=>setShowAdd(true)} style={{width:'100%',height:48,marginTop:8,background:'transparent',border:'0.5px dashed rgba(245,245,240,0.2)',borderRadius:12,color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:13,fontWeight:500,cursor:'pointer'}}>+ Agregar ejercicio</button>
      </div>
      <div style={{position:'absolute',left:0,right:0,bottom:0,padding:'12px 16px 24px',background:'linear-gradient(to top,#000 70%,rgba(0,0,0,0))'}}>
        {restTimer&&<RestTimer timer={restTimer} now={now} accent={accent} onSkip={()=>setRestTimer(null)} onAdd={()=>setRestTimer({...restTimer,duration:restTimer.duration+30})}/>}
        <Button onClick={()=>onFinish(finishData)} accent={accent} variant={doneSets>=totalSets*.5?'primary':'secondary'}>Terminar sesión</Button>
      </div>
      {showSwap&&<SwapSheet exercise={exercises.find(e=>e.uid===showSwap)} onSwap={id=>swapEx(showSwap,id)} onClose={()=>setShowSwap(null)} accent={accent}/>}
      {showAdd&&<AddSheet onAdd={addEx} onClose={()=>setShowAdd(false)} accent={accent}/>}
    </div>
  )
}

function ExerciseCard({exercise,idx,active,onActivate,onSwap,onCompleteSet,onUpdate,onRemove,accent,history}) {
  const ex=getExercise(exercise.exId)
  const [dragX,setDragX]=useState(0); const [dragging,setDragging]=useState(false); const startX=useRef(0)
  const onTS=e=>{startX.current=(e.touches?.[0]||e).clientX;setDragging(true)}
  const onTM=e=>{if(!dragging)return;const x=(e.touches?.[0]||e).clientX;setDragX(Math.min(0,Math.max(-100,x-startX.current)))}
  const onTE=()=>{if(dragX<-60)onSwap();setDragX(0);setDragging(false)}
  const allDone=exercise.completedSets.every(s=>s)
  const prog=progressionFor(history,exercise.exId)
  const lastW=prog.length>0?prog[prog.length-1].weight:null
  const trend=prog.length>1?(prog[prog.length-1].weight>prog[prog.length-2].weight?'↑':'→'):null
  if(!ex) return null
  return (
    <div style={{position:'relative',marginBottom:10}}>
      <div style={{position:'absolute',inset:0,borderRadius:12,background:'rgba(245,245,240,0.04)',border:`0.5px solid ${accent}`,display:'flex',alignItems:'center',justifyContent:'flex-end',padding:'0 18px',pointerEvents:'none'}}><div style={{color:accent,fontFamily:'Inter',fontSize:12,fontWeight:600}}>CAMBIAR</div></div>
      <div onMouseDown={onTS} onMouseMove={onTM} onMouseUp={onTE} onMouseLeave={()=>dragging&&onTE()} onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE} onClick={onActivate}
        style={{background:'#0a0a0a',border:active?'0.5px solid #2a2a2a':'0.5px solid #1a1a1a',borderRadius:12,transform:`translateX(${dragX}px)`,transition:dragging?'none':'transform .25s',overflow:'hidden',opacity:allDone?.55:1}}>
        <div style={{padding:'14px 16px 10px',display:'flex',alignItems:'center',gap:10}}>
          <MonoNum size={11} color="rgba(245,245,240,0.35)">{String(idx+1).padStart(2,'0')}</MonoNum>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:'Inter',fontSize:15,fontWeight:600,color:'#f5f5f0',lineHeight:1.2}}>{ex.name}</div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3,flexWrap:'wrap'}}>
              <span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:.5}}>{ex.muscle}</span>
              <span style={{color:'rgba(245,245,240,0.2)'}}>·</span>
              <span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:.5}}>{ex.equipment}</span>
              {lastW!==null&&<><span style={{color:'rgba(245,245,240,0.2)'}}>·</span><span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:accent,letterSpacing:.5}}>ÚLT {lastW}kg {trend||''}</span></>}
            </div>
          </div>
          <button onClick={e=>{e.stopPropagation();onSwap()}} style={{background:'transparent',border:0,padding:6,cursor:'pointer'}}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5h9M9 2l3 3-3 3M14 11H5M7 14l-3-3 3-3" stroke="rgba(245,245,240,0.5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        {active&&<div style={{padding:'0 16px 14px'}}>
          <div style={{display:'flex',gap:6,marginBottom:8,padding:'6px 0',borderTop:'0.5px solid #141414',borderBottom:'0.5px solid #141414'}}>
            {['SERIE','PESO (KG)','REPS','RIR',''].map((h,i)=><div key={i} style={{width:i===0||i===4?28:i===3?36:undefined,flex:i===1||i===2?1:undefined,fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.4)',textTransform:'uppercase',letterSpacing:.5}}>{h}</div>)}
          </div>
          {exercise.completedSets.map((s,i)=><SetRow key={i} idx={i} target={{weight:exercise.weight,reps:exercise.reps,rir:exercise.rir}} completed={s} onComplete={data=>onCompleteSet(i,data)} accent={accent}/>)}
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button onClick={()=>onUpdate({completedSets:[...exercise.completedSets,null]})} style={{flex:1,height:34,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:8,color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:12,fontWeight:500,cursor:'pointer'}}>+ Serie</button>
            <button onClick={onRemove} style={{width:34,height:34,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:8,color:'rgba(245,245,240,0.5)',fontFamily:'Inter',fontSize:14,cursor:'pointer'}}>−</button>
          </div>
          <input type="text" placeholder="Notas…" value={exercise.notes} onChange={e=>onUpdate({notes:e.target.value})} onClick={e=>e.stopPropagation()} style={{width:'100%',marginTop:10,height:32,background:'transparent',border:0,borderTop:'0.5px solid #141414',color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:12,paddingTop:8,outline:'none'}}/>
        </div>}
      </div>
    </div>
  )
}

function SetRow({idx,target,completed,onComplete,accent}) {
  const [weight,setWeight]=useState(completed?.weight??target.weight)
  const [reps,setReps]=useState(completed?.reps??'')
  const [rir,setRir]=useState(completed?.rir??'')
  const done=!!completed
  return (
    <div style={{display:'flex',gap:6,alignItems:'center',padding:'6px 0',opacity:done?.6:1}}>
      <div style={{width:28}}><MonoNum size={12} color={done?accent:'rgba(245,245,240,0.5)'}>{idx+1}</MonoNum></div>
      <div style={{flex:1,position:'relative'}}>
        <input type="text" inputMode="decimal" value={weight} onChange={e=>setWeight(e.target.value)} placeholder={String(target.weight)} disabled={done} onClick={e=>e.stopPropagation()} style={{width:'100%',height:32,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:6,color:'#f5f5f0',fontFamily:'ui-monospace,monospace',fontSize:13,fontWeight:500,textAlign:'center',outline:'none',padding:'0 24px 0 0'}}/>
        <span style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.3)',pointerEvents:'none'}}>kg</span>
      </div>
      <input type="text" inputMode="decimal" value={reps} onChange={e=>setReps(e.target.value)} placeholder={String(target.reps)} disabled={done} onClick={e=>e.stopPropagation()} style={{flex:1,height:32,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:6,color:'#f5f5f0',fontFamily:'ui-monospace,monospace',fontSize:13,fontWeight:500,textAlign:'center',outline:'none',padding:0}}/>
      <div style={{width:36}}><input type="text" inputMode="decimal" value={rir} onChange={e=>setRir(e.target.value)} placeholder={String(target.rir)} disabled={done} onClick={e=>e.stopPropagation()} style={{width:'100%',height:32,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:6,color:'#f5f5f0',fontFamily:'ui-monospace,monospace',fontSize:13,fontWeight:500,textAlign:'center',outline:'none',padding:0}}/></div>
      <button onClick={e=>{e.stopPropagation();if(done)return;onComplete({weight:Number(weight)||target.weight,reps:Number(reps)||0,rir:Number(rir)||0})}} style={{width:28,height:28,borderRadius:6,background:done?accent:'#141414',border:done?'none':'0.5px solid #1f1f1f',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
        {done?<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-7" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>:<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-5" stroke="rgba(245,245,240,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>
    </div>
  )
}

function RestTimer({timer,now,accent,onSkip,onAdd}) {
  const elapsed=Math.floor((now-timer.start)/1000); const remaining=Math.max(0,timer.duration-elapsed); const pct=Math.min(100,(elapsed/timer.duration)*100); const done=remaining===0
  return <div style={{background:'#0a0a0a',border:'0.5px solid #1f1f1f',borderRadius:12,padding:'10px 12px',marginBottom:10,display:'flex',alignItems:'center',gap:10,position:'relative',overflow:'hidden'}}><div style={{position:'absolute',left:0,top:0,bottom:0,width:`${pct}%`,background:done?'rgba(245,245,240,0.06)':'rgba(245,245,240,0.025)',transition:'width .5s linear'}}/><div style={{position:'relative',display:'flex',alignItems:'center',gap:8,flex:1}}><Lbl>Descanso</Lbl><MonoNum size={20} color={done?accent:'#f5f5f0'}>{String(Math.floor(remaining/60)).padStart(1,'0')}:{String(remaining%60).padStart(2,'0')}</MonoNum></div><div style={{position:'relative',display:'flex',gap:6}}><button onClick={onAdd} style={{background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:6,padding:'6px 10px',color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:11,cursor:'pointer'}}>+30s</button><button onClick={onSkip} style={{background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:6,padding:'6px 10px',color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:11,cursor:'pointer'}}>Saltar</button></div></div>
}

const SheetOverlay = ({children,onClose,title,subtitle}) => (
  <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',zIndex:100,display:'flex',alignItems:'flex-end'}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{width:'100%',background:'#000',borderRadius:'20px 20px 0 0',borderTop:'0.5px solid #2a2a2a',maxHeight:'88%',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'center',padding:'8px 0 0'}}><div style={{width:36,height:4,borderRadius:2,background:'rgba(245,245,240,0.15)'}}/></div>
      <div style={{padding:'12px 20px 14px'}}><Lbl>{subtitle}</Lbl><div style={{fontFamily:'Inter',fontSize:18,fontWeight:600,color:'#f5f5f0',marginTop:4}}>{title}</div></div>
      <div style={{overflow:'auto',flex:1}}>{children}</div>
    </div>
  </div>
)

function SwapSheet({exercise,onSwap,onClose,accent}) {
  const ex=getExercise(exercise.exId); const alts=(ex?.alts||[]).map(id=>({id,...getExercise(id)})).filter(e=>e.name)
  return <SheetOverlay onClose={onClose} title="Cambiar ejercicio" subtitle={`${ex?.name||''} · alternativas`}><div style={{display:'flex',flexDirection:'column',gap:6,padding:'4px 16px 16px'}}>{alts.length===0&&<div style={{padding:'24px 8px',textAlign:'center',color:'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:12}}>Sin alternativas.</div>}{alts.map((a,i)=><button key={a.id} onClick={()=>onSwap(a.id)} style={{background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,padding:'14px 16px',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:12}}><MonoNum size={11} color={i===0?accent:'rgba(245,245,240,0.4)'}>{i===0?'TOP':String(i+1).padStart(2,'0')}</MonoNum><div style={{flex:1}}><div style={{fontFamily:'Inter',fontSize:14,fontWeight:500,color:'#f5f5f0'}}>{a.name}</div><div style={{display:'flex',gap:6,marginTop:3}}><span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:.5}}>{a.muscle}</span><span style={{color:'rgba(245,245,240,0.2)'}}>·</span><span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:.5}}>{a.equipment}</span></div></div><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 1l5 5-5 5" stroke="rgba(245,245,240,0.4)" strokeWidth="1.5" strokeLinecap="round"/></svg></button>)}</div></SheetOverlay>
}

function AddSheet({onAdd,onClose,accent}) {
  const [mode,setMode]=useState('search'); const [query,setQuery]=useState(''); const [selId,setSelId]=useState(null)
  const allDb=useMemo(()=>({...EXERCISES,...CUSTOM_EXERCISES}),[mode])
  const result=useMemo(()=>searchExercises(query,allDb),[query,allDb])
  if(mode==='custom') return <CustomExSheet initialName={query} onClose={onClose} onCreate={id=>onAdd(id)} onBack={()=>setMode('search')} accent={accent}/>
  if(mode==='confirm'&&selId) return <ConfirmSheet exId={selId} onClose={onClose} onBack={()=>{setMode('search');setSelId(null)}} onAdd={onAdd} accent={accent}/>
  return <SheetOverlay onClose={onClose} title="Agregar ejercicio" subtitle="Buscá por nombre, músculo o equipo"><div style={{padding:'0 16px 12px'}}><div style={{position:'relative'}}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{position:'absolute',left:14,top:13,pointerEvents:'none'}}><circle cx="6" cy="6" r="4.5" stroke="rgba(245,245,240,0.4)" strokeWidth="1.2"/><path d="M9.5 9.5L13 13" stroke="rgba(245,245,240,0.4)" strokeWidth="1.2" strokeLinecap="round"/></svg><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ej: press banca, dominadas…" style={{width:'100%',height:40,background:'#0a0a0a',border:'0.5px solid #1f1f1f',borderRadius:10,padding:'0 14px 0 36px',color:'#f5f5f0',fontFamily:'Inter',fontSize:14,outline:'none'}}/></div></div><div style={{padding:'0 16px 16px',maxHeight:380,overflow:'auto'}}>{result.type==='empty'&&<PopList onPick={id=>{setSelId(id);setMode('confirm')}} />}{result.type==='matches'&&<><Lbl style={{padding:'4px 4px 8px'}}>{result.hits.length} coincidencias</Lbl><div style={{display:'flex',flexDirection:'column',gap:4}}>{result.hits.map(({id})=>{const ex=getExercise(id);return <ResRow key={id} ex={ex} onClick={()=>{setSelId(id);setMode('confirm')}}/>})}</div></>}{result.type==='no-match'&&<><div style={{padding:'12px 14px',background:'#0a0a0a',border:'0.5px solid #1f1f1f',borderRadius:10,marginBottom:12}}><div style={{fontFamily:'Inter',fontSize:13,color:'#f5f5f0'}}>No encontré "<span style={{color:accent}}>{query}</span>".</div></div><button onClick={()=>setMode('custom')} style={{width:'100%',padding:'12px 14px',background:`0.5px solid ${accent}`,border:`0.5px solid ${accent}`,borderRadius:10,cursor:'pointer',textAlign:'left',color:accent,fontFamily:'Inter',fontSize:13,fontWeight:500}}>+ Agregar como personalizado</button></>}</div></SheetOverlay>
}

const ResRow = ({ex,onClick}) => {
  if(!ex) return null
  return <button onClick={onClick} style={{background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:10,padding:'11px 12px',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}><div style={{flex:1,minWidth:0}}><div style={{fontFamily:'Inter',fontSize:13,color:'#f5f5f0',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ex.name}</div><div style={{display:'flex',gap:6,marginTop:3}}><span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:.5}}>{ex.muscle}</span><span style={{color:'rgba(245,245,240,0.2)'}}>·</span><span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:.5}}>{ex.equipment}</span></div></div><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 1l4 4-4 4" stroke="rgba(245,245,240,0.4)" strokeWidth="1.4" strokeLinecap="round"/></svg></button>
}

function PopList({onPick}) {
  const groups=[{l:'Pecho',ids:['press-banca','press-banca-mancuernas','aperturas-mancuernas','flexiones']},{l:'Espalda',ids:['dominadas','jalon-pecho','remo-polea','remo-barra']},{l:'Piernas',ids:['sentadilla-libre','prensa','peso-muerto-rumano','curl-femoral-acostado']},{l:'Hombros',ids:['press-militar-mancuernas','vuelos-laterales','face-pull']},{l:'Brazos',ids:['curl-barra','curl-martillo','extension-polea','press-frances']},{l:'Core',ids:['plancha','crunch-polea','elevacion-piernas-colgado']}]
  return <div>{groups.map(g=><div key={g.l} style={{marginBottom:14}}><Lbl style={{padding:'0 4px 6px'}}>{g.l}</Lbl><div style={{display:'flex',flexDirection:'column',gap:4}}>{g.ids.map(id=>{const ex=getExercise(id);return ex?<ResRow key={id} ex={ex} onClick={()=>onPick(id)}/>:null})}</div></div>)}</div>
}

function ConfirmSheet({exId,onClose,onBack,onAdd,accent}) {
  const ex=getExercise(exId); if(!ex) return null
  const diffLabel={beginner:'Principiante',intermediate:'Intermedio',advanced:'Avanzado'}[ex.difficulty]||ex.difficulty
  return <SheetOverlay onClose={onClose} title={ex.name} subtitle="Confirmar y agregar"><div style={{padding:'0 16px 16px'}}><div style={{background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,padding:16}}>{[['Músculo principal',ex.muscle,accent],['Músculos secundarios',(ex.secondary||[]).join(', ')||'—',null],['Equipamiento',ex.equipment,null],['Dificultad',diffLabel,null]].map(([l,v,c],i,arr)=><div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<arr.length-1?'0.5px solid #141414':'none'}}><span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:.5}}>{l}</span><span style={{fontFamily:'Inter',fontSize:13,color:c||'#f5f5f0',textAlign:'right',maxWidth:'60%'}}>{v}</span></div>)}</div><div style={{display:'flex',gap:8,marginTop:14}}><button onClick={onBack} style={{flex:1,height:44,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:10,color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:13,fontWeight:500,cursor:'pointer'}}>← Volver</button><button onClick={()=>onAdd(exId)} style={{flex:2,height:44,background:accent,border:0,borderRadius:10,color:'#000',fontFamily:'Inter',fontSize:13,fontWeight:600,cursor:'pointer'}}>Agregar</button></div></div></SheetOverlay>
}

function CustomExSheet({initialName,onClose,onCreate,onBack,accent}) {
  const [step,setStep]=useState(0); const [name,setName]=useState(initialName||''); const [muscle,setMuscle]=useState(''); const [secondary,setSecondary]=useState([]); const [equipment,setEquipment]=useState(''); const [difficulty,setDifficulty]=useState('intermediate'); const [created,setCreated]=useState(false)
  const can1=name.trim().length>0&&muscle; const canC=can1&&equipment
  const create=()=>{const id=createCustomExercise({name:name.trim(),muscle,secondary,equipment,difficulty});setCreated(true);setTimeout(()=>onCreate(id),700)}
  if(created) return <SheetOverlay onClose={onClose} title="Listo" subtitle="Ejercicio personalizado"><div style={{padding:'20px 24px 32px',textAlign:'center'}}><div style={{width:48,height:48,borderRadius:24,background:accent,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16}}><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-10" stroke="#000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div style={{fontFamily:'Inter',fontSize:16,fontWeight:600,color:'#f5f5f0'}}>"{name}" guardado</div></div></SheetOverlay>
  return <SheetOverlay onClose={onClose} title="Nuevo ejercicio" subtitle={`Paso ${step+1} de 2`}><div style={{padding:'0 16px 16px',maxHeight:460,overflow:'auto'}}>{step===0&&<><div style={{marginBottom:14}}><Lbl style={{marginBottom:6}}>Nombre</Lbl><input value={name} onChange={e=>setName(e.target.value)} autoFocus placeholder="Ej: Press con pausa" style={{width:'100%',height:40,background:'#0a0a0a',border:'0.5px solid #1f1f1f',borderRadius:10,padding:'0 14px',color:'#f5f5f0',fontFamily:'Inter',fontSize:14,outline:'none'}}/></div><div style={{marginBottom:14}}><Lbl style={{marginBottom:6}}>Músculo principal</Lbl><ChipGrid options={MUSCLE_GROUPS} value={muscle} onChange={setMuscle} accent={accent}/></div></>}{step===1&&<><div style={{marginBottom:14}}><Lbl style={{marginBottom:6}}>Músculos secundarios</Lbl><ChipGrid options={MUSCLE_GROUPS.filter(m=>m!==muscle)} value={secondary} onChange={m=>setSecondary(p=>p.includes(m)?p.filter(x=>x!==m):[...p,m])} multi accent={accent}/></div><div style={{marginBottom:14}}><Lbl style={{marginBottom:6}}>Equipamiento</Lbl><ChipGrid options={EQUIPMENT} value={equipment} onChange={setEquipment} accent={accent}/></div><div style={{marginBottom:14}}><Lbl style={{marginBottom:6}}>Dificultad</Lbl><div style={{display:'flex',gap:6}}>{[{id:'beginner',l:'Principiante'},{id:'intermediate',l:'Intermedio'},{id:'advanced',l:'Avanzado'}].map(d=><button key={d.id} onClick={()=>setDifficulty(d.id)} style={{flex:1,height:36,background:difficulty===d.id?accent:'#0a0a0a',border:difficulty===d.id?'none':'0.5px solid #1a1a1a',color:difficulty===d.id?'#000':'#f5f5f0',borderRadius:8,fontFamily:'Inter',fontSize:12,fontWeight:500,cursor:'pointer'}}>{d.l}</button>)}</div></div></>}<div style={{display:'flex',gap:8,marginTop:12}}><button onClick={step===0?onBack:()=>setStep(0)} style={{flex:1,height:44,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:10,color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:13,fontWeight:500,cursor:'pointer'}}>← {step===0?'Volver':'Atrás'}</button>{step===0?<button disabled={!can1} onClick={()=>setStep(1)} style={{flex:2,height:44,background:can1?accent:'#1a1a1a',border:0,borderRadius:10,opacity:can1?1:.5,color:can1?'#000':'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:13,fontWeight:600,cursor:can1?'pointer':'not-allowed'}}>Continuar →</button>:<button disabled={!canC} onClick={create} style={{flex:2,height:44,background:canC?accent:'#1a1a1a',border:0,borderRadius:10,opacity:canC?1:.5,color:canC?'#000':'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:13,fontWeight:600,cursor:canC?'pointer':'not-allowed'}}>Crear</button>}</div></div></SheetOverlay>
}

const ChipGrid = ({options,value,onChange,multi,accent}) => <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{options.map(o=>{const on=multi?value.includes(o):value===o;return<button key={o} onClick={()=>onChange(o)} style={{height:30,padding:'0 12px',background:on?accent:'#0a0a0a',border:on?'none':'0.5px solid #1a1a1a',color:on?'#000':'rgba(245,245,240,0.8)',borderRadius:15,fontFamily:'Inter',fontSize:12,fontWeight:500,cursor:'pointer',textTransform:'capitalize'}}>{o}</button>})}</div>

// ── HISTORY ───────────────────────────────────────────────────────────────────
function HistoryScreen({history,accent,onExport}) {
  const [sel,setSel]=useState(null); const [view,setView]=useState('calendar')
  const exIds=useMemo(()=>{const s=new Set();history.forEach(h=>h.exercises?.forEach(e=>s.add(e.exId)));return [...s]},[history])
  const [exFilter,setExFilter]=useState(exIds[0]||'press-banca')
  return (
    <div style={{height:'100%',overflow:'auto',background:'#000',color:'#f5f5f0',paddingBottom:100}}>
      <Header subtitle="REGISTROS" title="Historial" right={<button onClick={onExport} style={{height:32,padding:'0 12px',background:'rgba(245,245,240,0.06)',border:'0.5px solid #2a2a2a',borderRadius:8,color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:11,fontWeight:600,cursor:'pointer'}}>↓ CSV</button>}/>
      <div style={{padding:'0 16px 14px'}}><div style={{display:'flex',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:10,padding:3}}>{[{id:'calendar',l:'Calendario'},{id:'progression',l:'Progresión'}].map(v=><button key={v.id} onClick={()=>setView(v.id)} style={{flex:1,height:30,background:view===v.id?'#1a1a1a':'transparent',border:0,borderRadius:7,color:view===v.id?'#f5f5f0':'rgba(245,245,240,0.5)',fontFamily:'Inter',fontSize:12,fontWeight:500,cursor:'pointer'}}>{v.l}</button>)}</div></div>
      {view==='calendar'&&<CalView history={history} sel={sel} setSel={setSel} accent={accent}/>}
      {view==='progression'&&<ProgView history={history} exFilter={exFilter} setExFilter={setExFilter} exIds={exIds} accent={accent}/>}
    </div>
  )
}

function CalView({history,sel,setSel,accent}) {
  const weeks=[]; const dates=new Map(history.map(h=>[h.date,h])); const tc=new Date(today); const sow=new Date(tc); sow.setDate(tc.getDate()-tc.getDay())
  for(let w=7;w>=0;w--){const wk=[];for(let d=0;d<7;d++){const dt=new Date(sow);dt.setDate(sow.getDate()-w*7+d);const iso=dt.toISOString().slice(0,10);wk.push({iso,date:dt,session:dates.get(iso),future:dt>tc,today:iso===tc.toISOString().slice(0,10)});}weeks.push(wk)}
  const s=sel?dates.get(sel):null
  return (<><div style={{padding:'0 16px 16px'}}><div style={{display:'flex',gap:4,padding:'0 0 8px'}}>{['D','L','M','M','J','V','S'].map((d,i)=><div key={i} style={{flex:1,textAlign:'center',fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.35)'}}>{d}</div>)}</div><div style={{display:'flex',flexDirection:'column',gap:4}}>{weeks.map((wk,wi)=><div key={wi} style={{display:'flex',gap:4}}>{wk.map(d=>{const tr=!!d.session;const isSel=d.iso===sel;return<button key={d.iso} onClick={()=>tr&&setSel(d.iso)} disabled={!tr} style={{flex:1,aspectRatio:'1',border:0,borderRadius:6,padding:0,background:tr?accent:(d.future?'#050505':'#0a0a0a'),opacity:tr?(isSel?1:.85):(d.today?1:.6),boxShadow:isSel?`0 0 0 1.5px ${accent}`:(d.today?`inset 0 0 0 0.5px ${accent}`:'none'),cursor:tr?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'ui-monospace,monospace',fontSize:10,fontWeight:500,color:tr?'#000':'rgba(245,245,240,0.4)'}}>{d.date.getDate()}</button>})}</div>)}</div></div>{s?<div style={{padding:'0 16px 16px'}}><Card><div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:12}}><div><Lbl>{fmtDateLong(new Date(s.date))}</Lbl><div style={{fontFamily:'Inter',fontSize:18,fontWeight:600,marginTop:4}}>{s.title}</div></div><div><MonoNum size={20} color={accent}>{s.exercises?.reduce((a,e)=>a+e.sets.length,0)}</MonoNum><span style={{fontFamily:'Inter',fontSize:10,color:'rgba(245,245,240,0.4)',marginLeft:4,textTransform:'uppercase',letterSpacing:.5}}>series</span></div></div>{s.exercises?.map((e,i)=>{const ex=getExercise(e.exId);const top=e.sets.length?Math.max(...e.sets.map(s=>s.weight)):0;const tr=e.sets.reduce((a,s)=>a+s.reps,0);return<div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:i<s.exercises.length-1?'0.5px solid #141414':'none'}}><div style={{flex:1}}><div style={{fontFamily:'Inter',fontSize:13,color:'#f5f5f0'}}>{ex?.name||e.exId}</div><div style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.45)',marginTop:2,textTransform:'uppercase',letterSpacing:.5}}>{e.sets.length} series · {tr} reps</div></div><MonoNum size={14}>{top}<span style={{fontSize:10,color:'rgba(245,245,240,0.4)'}}>kg</span></MonoNum></div>})}</Card></div>:<div style={{padding:'0 16px 16px'}}><div style={{padding:'24px 16px',textAlign:'center',color:'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:12}}>Tocá un día entrenado para ver el detalle.</div></div>}</>)
}

function ProgView({history,exFilter,setExFilter,exIds,accent}) {
  const data=progressionFor(history,exFilter); const ex=getExercise(exFilter)
  const min=data.length?Math.min(...data.map(d=>d.weight)):0; const range=Math.max(data.length?Math.max(...data.map(d=>d.weight))-min:1,1)
  return (<><div style={{padding:'0 16px 14px',display:'flex',gap:6,overflowX:'auto'}}>{exIds.map(id=><button key={id} onClick={()=>setExFilter(id)} style={{flexShrink:0,height:28,padding:'0 12px',background:exFilter===id?accent:'#0a0a0a',color:exFilter===id?'#000':'#f5f5f0',border:exFilter===id?'none':'0.5px solid #1a1a1a',borderRadius:14,fontFamily:'Inter',fontSize:11,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap'}}>{getExercise(id)?.name||id}</button>)}</div><div style={{padding:'0 16px 16px'}}><Card><div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:4}}><Lbl>Serie tope · peso</Lbl><Lbl>{ex?.muscle}</Lbl></div><div style={{fontFamily:'Inter',fontSize:18,fontWeight:600,color:'#f5f5f0',marginBottom:4}}>{ex?.name||exFilter}</div><div style={{display:'flex',alignItems:'baseline',gap:12,marginTop:16}}><div><MonoNum size={36}>{data.length?data[data.length-1].weight:'—'}</MonoNum><span style={{fontFamily:'Inter',fontSize:12,color:'rgba(245,245,240,0.4)',marginLeft:4}}>kg</span></div>{data.length>1&&<span style={{fontFamily:'ui-monospace,monospace',fontSize:11,color:accent,fontWeight:500}}>+{(data[data.length-1].weight-data[0].weight).toFixed(1)}kg</span>}</div><div style={{height:120,marginTop:18}}><svg viewBox="0 0 300 120" width="100%" height="120" style={{overflow:'visible'}}>{[0,.5,1].map(p=><line key={p} x1="0" y1={p*100+10} x2="300" y2={p*100+10} stroke="#141414" strokeWidth=".5"/>)}{data.length>1&&(()=>{const pts=data.map((d,i)=>{const x=(i/(data.length-1))*290+5;const y=110-((d.weight-min)/range)*95;return[x,y]});const path=pts.map(([x,y],i)=>`${i===0?'M':'L'} ${x} ${y}`).join(' ');const area=`${path} L ${pts[pts.length-1][0]} 115 L ${pts[0][0]} 115 Z`;return<><defs><linearGradient id="g2" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity=".18"/><stop offset="100%" stopColor={accent} stopOpacity="0"/></linearGradient></defs><path d={area} fill="url(#g2)"/><path d={path} stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>{pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===pts.length-1?3:1.5} fill={accent}/>)}</>})()}</svg></div><div style={{marginTop:14,paddingTop:14,borderTop:'0.5px solid #141414',display:'flex',justifyContent:'space-between'}}>{[['Sesiones',data.length],['Mejor',`${data.length?Math.max(...data.map(d=>d.weight)):0}kg`],['Progreso',data.length>1?`+${(data[data.length-1].weight-data[0].weight).toFixed(1)}kg`:'—']].map(([l,v])=><div key={l}><Lbl style={{marginBottom:4}}>{l}</Lbl><div style={{fontFamily:'ui-monospace,monospace',fontSize:14,fontWeight:500,color:'#f5f5f0'}}>{v}</div></div>)}</div></Card></div></>)
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsScreen({profile,onUpdateProfile,accent,setAccent,onOnboarding,onLogout}) {
  const [editing,setEditing]=useState(false)
  const [form,setForm]=useState({name:profile.name,goal:profile.goal,frequency:profile.frequency,experience:profile.experience})
  const gL={fuerza:'Fuerza',hipertrofia:'Hipertrofia',resistencia:'Resistencia',general:'General'}
  const eL={principiante:'Principiante',intermedio:'Intermedio',avanzado:'Avanzado'}

  return (
    <div style={{height:'100%',overflow:'auto',background:'#000',color:'#f5f5f0',paddingBottom:100}}>
      <Header subtitle="PERFIL" title="Ajustes" right={<button onClick={()=>{if(editing)onUpdateProfile(form);setEditing(!editing)}} style={{height:32,padding:'0 12px',background:editing?accent:'rgba(245,245,240,0.06)',border:editing?'none':'0.5px solid #2a2a2a',borderRadius:8,color:editing?'#000':'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:12,fontWeight:600,cursor:'pointer'}}>{editing?'Guardar':'Editar'}</button>}/>

      {editing?(
        <div style={{padding:'0 16px 16px',display:'flex',flexDirection:'column',gap:16}}>
          <div><Lbl style={{marginBottom:6}}>Nombre</Lbl><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{width:'100%',height:44,background:'#0a0a0a',border:'0.5px solid #1f1f1f',borderRadius:10,padding:'0 14px',color:'#f5f5f0',fontFamily:'Inter',fontSize:14,outline:'none'}}/></div>
          <div><Lbl style={{marginBottom:6}}>Objetivo</Lbl><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{Object.entries(gL).map(([v,l])=><button key={v} onClick={()=>setForm({...form,goal:v})} style={{height:34,padding:'0 14px',background:form.goal===v?accent:'#0a0a0a',color:form.goal===v?'#000':'#f5f5f0',border:form.goal===v?'none':'0.5px solid #1a1a1a',borderRadius:8,fontFamily:'Inter',fontSize:13,fontWeight:500,cursor:'pointer'}}>{l}</button>)}</div></div>
          <div><Lbl style={{marginBottom:6}}>Frecuencia</Lbl><div style={{display:'flex',gap:6}}>{[2,3,4,5,6].map(n=><button key={n} onClick={()=>setForm({...form,frequency:n})} style={{flex:1,height:40,background:form.frequency===n?accent:'#0a0a0a',color:form.frequency===n?'#000':'#f5f5f0',border:form.frequency===n?'none':'0.5px solid #1a1a1a',borderRadius:8,fontFamily:'ui-monospace,monospace',fontSize:15,fontWeight:600,cursor:'pointer'}}>{n}</button>)}</div></div>
          <div><Lbl style={{marginBottom:6}}>Experiencia</Lbl><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{Object.entries(eL).map(([v,l])=><button key={v} onClick={()=>setForm({...form,experience:v})} style={{height:34,padding:'0 14px',background:form.experience===v?accent:'#0a0a0a',color:form.experience===v?'#000':'#f5f5f0',border:form.experience===v?'none':'0.5px solid #1a1a1a',borderRadius:8,fontFamily:'Inter',fontSize:13,fontWeight:500,cursor:'pointer'}}>{l}</button>)}</div></div>
          <button onClick={()=>setEditing(false)} style={{height:40,background:'transparent',border:'0.5px solid #1a1a1a',borderRadius:10,color:'rgba(245,245,240,0.5)',fontFamily:'Inter',fontSize:13,cursor:'pointer'}}>Cancelar</button>
        </div>
      ):(
        <>
          <div style={{margin:'0 16px 8px',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,overflow:'hidden'}}>
            {[['Nombre',profile.name],['Objetivo',gL[profile.goal]||profile.goal],['Frecuencia',`${profile.frequency} días/sem`],['Experiencia',eL[profile.experience]||profile.experience]].map(([l,v],i,arr)=><div key={l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:i<arr.length-1?'0.5px solid #141414':'none'}}><span style={{fontFamily:'Inter',fontSize:14,color:'#f5f5f0'}}>{l}</span><span style={{fontFamily:'Inter',fontSize:13,color:'rgba(245,245,240,0.5)'}}>{v}</span></div>)}
          </div>
          <div style={{padding:'14px 20px 6px'}}><Lbl>Color de acento</Lbl></div>
          <div style={{margin:'0 16px 20px',display:'flex',gap:10,padding:16,background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12}}>
            {ACCENT_PRESETS.map(p=><button key={p.c} title={p.l} onClick={()=>setAccent(p.c)} style={{width:32,height:32,borderRadius:'50%',border:accent===p.c?`2px solid ${p.c}`:'1.5px solid rgba(255,255,255,0.15)',background:p.c,cursor:'pointer',boxShadow:accent===p.c?`0 0 0 2px #0a0a0a, 0 0 0 3.5px ${p.c}`:'none'}}/>)}
          </div>
          <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:8}}>
            <button onClick={onOnboarding} style={{width:'100%',height:44,background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:10,color:'rgba(245,245,240,0.65)',fontFamily:'Inter',fontSize:13,cursor:'pointer'}}>Repetir onboarding</button>
            <button onClick={onLogout} style={{width:'100%',height:44,background:'transparent',border:'0.5px solid rgba(255,80,80,0.3)',borderRadius:10,color:'rgba(255,100,100,0.8)',fontFamily:'Inter',fontSize:13,cursor:'pointer'}}>Cerrar sesión</button>
          </div>
        </>
      )}
    </div>
  )
}

// ── FINISH ────────────────────────────────────────────────────────────────────
function FinishSummary({sessionData,accent,onDone}) {
  const totalSets=sessionData.exercises.reduce((a,e)=>a+e.sets.length,0)
  const totalVol=sessionData.exercises.reduce((a,e)=>a+e.sets.reduce((b,s)=>b+s.reps*s.weight,0),0)
  return (
    <div style={{height:'100%',background:'#000',color:'#f5f5f0',display:'flex',flexDirection:'column'}}>
      <div style={{flex:1,padding:'80px 24px 24px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:56,height:56,borderRadius:28,background:accent,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-12" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        <Lbl style={{marginBottom:8}}>Sesión completada</Lbl>
        <div style={{fontFamily:'Inter',fontSize:24,fontWeight:600,letterSpacing:-.5,marginBottom:32,textAlign:'center'}}>{sessionData.title}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,width:'100%',maxWidth:320}}>
          {[['Duración',`${sessionData.duration}`,'min'],['Series',totalSets,''],['Volumen',`${Math.round(totalVol/100)/10}`,'t']].map(([l,v,u])=><div key={l}><Lbl style={{marginBottom:6}}>{l}</Lbl><div style={{display:'flex',alignItems:'baseline',gap:3}}><MonoNum size={26}>{v}</MonoNum><span style={{fontFamily:'Inter',fontSize:11,color:'rgba(245,245,240,0.5)'}}>{u}</span></div></div>)}
        </div>
      </div>
      <div style={{padding:'0 24px 40px'}}><Button accent={accent} onClick={onDone}>Listo</Button></div>
    </div>
  )
}

// ── LOADING ───────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return <div style={{width:'100%',height:'100vh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:'Inter,system-ui',fontSize:28,fontWeight:700,color:'#f5f5f0',letterSpacing:-1}}>Freestyle<span style={{color:'#d8ff3d'}}>GYM</span></div></div>
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authSession,setAuthSession]=useState(null)
  const [authLoading,setAuthLoading]=useState(true)
  const [profile,setProfile]=useState(null)
  const [history,setHistory]=useState([])
  const [plan,setPlan]=useState(null)
  const [accent,setAccentState]=useState('#d8ff3d')
  const [tab,setTab]=useState('home')
  const [view,setView]=useState('app') // 'app' | 'session' | 'finish'
  const [sessionState,setSessionState]=useState(null)
  const [showOnboarding,setShowOnboarding]=useState(false)

  // ── Auth listener
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setAuthSession(session);setAuthLoading(false)})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setAuthSession(session))
    if('Notification' in window&&Notification.permission==='default') Notification.requestPermission()
    return ()=>subscription.unsubscribe()
  },[])

  // ── Load data when session changes
  useEffect(()=>{
    if(!authSession?.user){setProfile(null);setHistory([]);setPlan(null);return}
    loadData(authSession.user.id)
  },[authSession])

  const loadData = async (uid) => {
    try {
      const [{data:prof},{data:sessions},{data:plans}] = await Promise.all([
        supabase.from('profiles').select('*').eq('id',uid).single(),
        supabase.from('sessions').select('*').eq('user_id',uid).order('date',{ascending:false}).limit(50),
        supabase.from('plans').select('*').eq('user_id',uid).order('generated_at',{ascending:false}).limit(1),
      ])
      if(prof?.name){
        setProfile(prof)
        if(prof.accent) setAccentState(prof.accent)
      } else {
        setShowOnboarding(true)
      }
      if(sessions) setHistory(sessions.map(s=>({...s,exercises:s.exercises||[]})))
      if(plans?.[0]) setPlan(plans[0].data)
    } catch(e){ console.error('loadData error:',e) }
  }

  // ── Onboarding complete
  const handleOnboardingComplete = async (data) => {
    if(!authSession?.user) return
    const uid=authSession.user.id
    const newProfile={id:uid,name:data.name,goal:data.goal,frequency:data.frequency,experience:data.experience,priorities:data.priorities,accent}
    await supabase.from('profiles').upsert(newProfile)
    setProfile(newProfile)
    const newPlan=generatePlan(newProfile,[])
    await supabase.from('plans').insert({user_id:uid,data:newPlan})
    setPlan(newPlan)
    setShowOnboarding(false)
  }

  // ── Update profile
  const handleUpdateProfile = async (updates) => {
    if(!authSession?.user||!profile) return
    const updated={...profile,...updates}
    setProfile(updated)
    await supabase.from('profiles').update(updates).eq('id',authSession.user.id)
  }

  // ── Update accent (also save to profile)
  const setAccent = async (c) => {
    setAccentState(c)
    if(authSession?.user) await supabase.from('profiles').update({accent:c}).eq('id',authSession.user.id)
  }

  // ── Renew plan
  const handleRenewPlan = async () => {
    if(!profile||!authSession?.user) return
    const newPlan=generatePlan(profile,history)
    setPlan(newPlan)
    await supabase.from('plans').insert({user_id:authSession.user.id,data:newPlan})
  }

  // ── Update plan (from routine editor)
  const handleUpdatePlan = async (newPlan) => {
    if(!authSession?.user) return
    setPlan(newPlan)
    await supabase.from('plans').insert({user_id:authSession.user.id,data:newPlan})
  }

  // ── Start session
  const handleStartDay = (dayIdx) => {
    const template=SPLIT_TEMPLATES[profile?.frequency]||SPLIT_TEMPLATES[4]
    setSessionState({dayTemplate:template[dayIdx],freestyle:false})
    setView('session')
  }
  const handleStartFreestyle = () => {setSessionState({freestyle:true});setView('session')}

  // ── Finish session — save to Supabase
  const handleFinishSession = async (sessionData) => {
    if(sessionData.exercises.length>0&&authSession?.user) {
      const {data:saved}=await supabase.from('sessions').insert({
        user_id:authSession.user.id,
        title:sessionData.title,
        date:sessionData.date,
        duration:sessionData.duration,
        exercises:sessionData.exercises,
      }).select().single()
      if(saved) setHistory(prev=>[{...saved,exercises:saved.exercises||[]}, ...prev])
    }
    setSessionState({...sessionState,finishData:sessionData})
    setView('finish')
  }

  // ── Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfile(null);setHistory([]);setPlan(null);setTab('home');setView('app')
  }

  // ── Render
  if(authLoading) return <LoadingScreen/>
  if(!authSession) return <AuthScreen accent={accent}/>

  if(showOnboarding||(!profile&&authSession)) return (
    <div style={{width:'100%',height:'100vh',background:'#000',overflow:'hidden'}}>
      <Onboarding accent={accent} onComplete={handleOnboardingComplete}/>
    </div>
  )

  if(!profile) return <LoadingScreen/>

  const template=SPLIT_TEMPLATES[profile.frequency]||SPLIT_TEMPLATES[4]

  return (
    <div style={{width:'100%',height:'100vh',background:'#000',overflow:'hidden',position:'relative',fontFamily:'Inter,system-ui',WebkitFontSmoothing:'antialiased'}}>
      {view==='session'?(
        <SessionScreen dayTemplate={sessionState?.dayTemplate} freestyle={sessionState?.freestyle} accent={accent} onFinish={handleFinishSession} onCancel={()=>{setSessionState(null);setView('app')}} profile={profile} history={history}/>
      ):view==='finish'?(
        <FinishSummary sessionData={sessionState.finishData} accent={accent} onDone={()=>{setSessionState(null);setView('app');setTab('home')}}/>
      ):(
        <>
          {tab==='home'&&<HomeScreen profile={profile} plan={plan} history={history} accent={accent} onStartDay={handleStartDay} onStartFreestyle={handleStartFreestyle} onRenewPlan={handleRenewPlan}/>}
          {tab==='session'&&<TrainPicker accent={accent} profile={profile} onStartDay={handleStartDay} onStartFreestyle={handleStartFreestyle} onOnboarding={()=>setShowOnboarding(true)}/>}
          {tab==='routine'&&<RoutineScreen profile={profile} plan={plan} history={history} accent={accent} onRenewPlan={handleRenewPlan} onUpdatePlan={handleUpdatePlan}/>}
          {tab==='history'&&<HistoryScreen history={history} accent={accent} onExport={()=>exportHistoryCSV(history)}/>}
          {tab==='settings'&&<SettingsScreen profile={profile} onUpdateProfile={handleUpdateProfile} accent={accent} setAccent={setAccent} onOnboarding={()=>setShowOnboarding(true)} onLogout={handleLogout}/>}
          <TabBar active={tab} onChange={setTab} accent={accent}/>
        </>
      )}
    </div>
  )
}
