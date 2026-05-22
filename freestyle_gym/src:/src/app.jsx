import { useState, useEffect, useRef, useMemo } from 'react';

// ── DATA ──────────────────────────────────────────────────────────────────────

const MUSCLE_GROUPS = [
  'pecho','espalda','hombros','bíceps','tríceps','antebrazos',
  'core','glúteos','cuádriceps','isquios','gemelos',
  'flexores de cadera','aductores','abductores',
];
const EQUIPMENT = ['barra','mancuernas','máquina','polea','peso corporal','kettlebell','banda','banco','cardio','colchoneta'];
const PATTERNS = ['empuje','tracción','bisagra','sentadilla','transporte','rotación','aislamiento','cardio','movilidad','pliometría'];

const EXERCISES = {
  'press-banca': { name: 'Press de banca', muscle: 'pecho', secondary: ['tríceps','hombros'], equipment: 'barra', difficulty: 'intermediate', pattern: 'empuje', type: 'fuerza', alts: ['press-banca-mancuernas','press-maquina','flexiones-lastre','press-inclinado-mancuernas'], aliases: ['bench press','press banca','press pecho'] },
  'press-banca-mancuernas': { name: 'Press de banca con mancuernas', muscle: 'pecho', secondary: ['tríceps','hombros'], equipment: 'mancuernas', difficulty: 'beginner', pattern: 'empuje', type: 'fuerza', alts: ['press-banca','press-inclinado-mancuernas','press-maquina'], aliases: ['db bench','press mancuernas pecho'] },
  'press-inclinado-mancuernas': { name: 'Press inclinado con mancuernas', muscle: 'pecho', secondary: ['hombros','tríceps'], equipment: 'mancuernas', difficulty: 'intermediate', pattern: 'empuje', type: 'fuerza', alts: ['press-inclinado-barra','press-banca-mancuernas','press-maquina'], aliases: ['incline db','incline dumbbell'] },
  'press-inclinado-barra': { name: 'Press inclinado con barra', muscle: 'pecho', secondary: ['hombros','tríceps'], equipment: 'barra', difficulty: 'intermediate', pattern: 'empuje', type: 'fuerza', alts: ['press-inclinado-mancuernas','press-banca'], aliases: ['incline barbell'] },
  'press-maquina': { name: 'Press de pecho en máquina', muscle: 'pecho', secondary: ['tríceps','hombros'], equipment: 'máquina', difficulty: 'beginner', pattern: 'empuje', type: 'fuerza', alts: ['press-banca-mancuernas','press-banca','contractor'], aliases: ['chest press machine','machine press'] },
  'aperturas-mancuernas': { name: 'Aperturas con mancuernas', muscle: 'pecho', secondary: ['hombros'], equipment: 'mancuernas', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['aperturas-polea','contractor','press-banca-mancuernas'], aliases: ['db fly','fly mancuernas'] },
  'aperturas-polea': { name: 'Aperturas en polea', muscle: 'pecho', secondary: [], equipment: 'polea', difficulty: 'intermediate', pattern: 'aislamiento', type: 'fuerza', alts: ['aperturas-mancuernas','contractor'], aliases: ['cable fly','crossover'] },
  'contractor': { name: 'Contractor de pecho', muscle: 'pecho', secondary: [], equipment: 'máquina', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['aperturas-polea','aperturas-mancuernas'], aliases: ['pec deck'] },
  'flexiones': { name: 'Flexiones de brazos', muscle: 'pecho', secondary: ['tríceps','core'], equipment: 'peso corporal', difficulty: 'beginner', pattern: 'empuje', type: 'fuerza', alts: ['flexiones-lastre','press-banca-mancuernas','press-maquina'], aliases: ['push up','push-up','lagartija'] },
  'flexiones-lastre': { name: 'Flexiones con lastre', muscle: 'pecho', secondary: ['tríceps','core'], equipment: 'peso corporal', difficulty: 'intermediate', pattern: 'empuje', type: 'fuerza', alts: ['flexiones','press-banca'], aliases: ['weighted push up'] },
  'fondos': { name: 'Fondos en paralelas', muscle: 'pecho', secondary: ['tríceps','hombros'], equipment: 'peso corporal', difficulty: 'intermediate', pattern: 'empuje', type: 'fuerza', alts: ['press-banca','flexiones-lastre','press-frances'], aliases: ['dip','dips'] },
  'dominadas': { name: 'Dominadas', muscle: 'espalda', secondary: ['bíceps','core'], equipment: 'peso corporal', difficulty: 'advanced', pattern: 'tracción', type: 'fuerza', alts: ['dominadas-asistidas','jalon-pecho','remo-barra'], aliases: ['pull up','pull-up','pullup'] },
  'dominadas-asistidas': { name: 'Dominadas asistidas', muscle: 'espalda', secondary: ['bíceps'], equipment: 'máquina', difficulty: 'beginner', pattern: 'tracción', type: 'fuerza', alts: ['jalon-pecho','dominadas'], aliases: ['assisted pull up'] },
  'jalon-pecho': { name: 'Jalón al pecho', muscle: 'espalda', secondary: ['bíceps'], equipment: 'polea', difficulty: 'beginner', pattern: 'tracción', type: 'fuerza', alts: ['dominadas','dominadas-asistidas','jalon-agarre-cerrado'], aliases: ['lat pulldown','pulldown'] },
  'jalon-agarre-cerrado': { name: 'Jalón agarre cerrado', muscle: 'espalda', secondary: ['bíceps'], equipment: 'polea', difficulty: 'intermediate', pattern: 'tracción', type: 'fuerza', alts: ['jalon-pecho','remo-polea'], aliases: ['close grip pulldown'] },
  'remo-polea': { name: 'Remo en polea sentado', muscle: 'espalda', secondary: ['bíceps'], equipment: 'polea', difficulty: 'beginner', pattern: 'tracción', type: 'fuerza', alts: ['remo-barra','remo-mancuerna','remo-maquina'], aliases: ['cable row','seated row'] },
  'remo-barra': { name: 'Remo con barra', muscle: 'espalda', secondary: ['bíceps'], equipment: 'barra', difficulty: 'intermediate', pattern: 'tracción', type: 'fuerza', alts: ['remo-polea','remo-mancuerna','remo-pendlay'], aliases: ['barbell row','bb row'] },
  'remo-mancuerna': { name: 'Remo con mancuerna a una mano', muscle: 'espalda', secondary: ['bíceps'], equipment: 'mancuernas', difficulty: 'beginner', pattern: 'tracción', type: 'fuerza', alts: ['remo-polea','remo-barra'], aliases: ['db row','one arm row'] },
  'remo-maquina': { name: 'Remo en máquina', muscle: 'espalda', secondary: ['bíceps'], equipment: 'máquina', difficulty: 'beginner', pattern: 'tracción', type: 'fuerza', alts: ['remo-polea','remo-mancuerna'], aliases: ['machine row'] },
  'pullover-polea': { name: 'Pullover en polea', muscle: 'espalda', secondary: [], equipment: 'polea', difficulty: 'intermediate', pattern: 'aislamiento', type: 'fuerza', alts: ['jalon-pecho'], aliases: ['cable pullover','straight arm pulldown'] },
  'hiperextension': { name: 'Hiperextensión lumbar', muscle: 'espalda', secondary: ['glúteos','isquios'], equipment: 'máquina', difficulty: 'beginner', pattern: 'bisagra', type: 'fuerza', alts: ['peso-muerto-rumano'], aliases: ['back extension','hyperextension'] },
  'peso-muerto': { name: 'Peso muerto convencional', muscle: 'espalda', secondary: ['isquios','glúteos','core'], equipment: 'barra', difficulty: 'advanced', pattern: 'bisagra', type: 'fuerza', alts: ['peso-muerto-sumo','peso-muerto-rumano'], aliases: ['deadlift'] },
  'press-militar': { name: 'Press militar de pie', muscle: 'hombros', secondary: ['tríceps','core'], equipment: 'barra', difficulty: 'intermediate', pattern: 'empuje', type: 'fuerza', alts: ['press-militar-mancuernas','press-arnold'], aliases: ['ohp','overhead press'] },
  'press-militar-mancuernas': { name: 'Press militar con mancuernas', muscle: 'hombros', secondary: ['tríceps'], equipment: 'mancuernas', difficulty: 'beginner', pattern: 'empuje', type: 'fuerza', alts: ['press-militar','press-arnold'], aliases: ['db shoulder press','db ohp'] },
  'press-arnold': { name: 'Press Arnold', muscle: 'hombros', secondary: ['tríceps'], equipment: 'mancuernas', difficulty: 'intermediate', pattern: 'empuje', type: 'fuerza', alts: ['press-militar-mancuernas'], aliases: ['arnold press'] },
  'press-maquina-hombros': { name: 'Press de hombros en máquina', muscle: 'hombros', secondary: ['tríceps'], equipment: 'máquina', difficulty: 'beginner', pattern: 'empuje', type: 'fuerza', alts: ['press-militar-mancuernas'], aliases: ['machine shoulder press'] },
  'vuelos-laterales': { name: 'Vuelos laterales', muscle: 'hombros', secondary: [], equipment: 'mancuernas', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['vuelos-polea','vuelos-maquina'], aliases: ['lateral raise','laterales'] },
  'vuelos-polea': { name: 'Vuelos laterales en polea', muscle: 'hombros', secondary: [], equipment: 'polea', difficulty: 'intermediate', pattern: 'aislamiento', type: 'fuerza', alts: ['vuelos-laterales','vuelos-maquina'], aliases: ['cable lateral raise'] },
  'pajaros': { name: 'Pájaros (vuelos posteriores)', muscle: 'hombros', secondary: ['espalda'], equipment: 'mancuernas', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['face-pull'], aliases: ['rear delt fly','reverse fly'] },
  'face-pull': { name: 'Face pull', muscle: 'hombros', secondary: ['espalda'], equipment: 'polea', difficulty: 'beginner', pattern: 'tracción', type: 'fuerza', alts: ['pajaros'], aliases: ['face pull'] },
  'encogimientos': { name: 'Encogimientos', muscle: 'hombros', secondary: [], equipment: 'mancuernas', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: [], aliases: ['shrug','shrugs'] },
  'curl-barra': { name: 'Curl con barra', muscle: 'bíceps', secondary: ['antebrazos'], equipment: 'barra', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['curl-mancuernas','curl-polea','curl-predicador'], aliases: ['barbell curl'] },
  'curl-mancuernas': { name: 'Curl con mancuernas', muscle: 'bíceps', secondary: ['antebrazos'], equipment: 'mancuernas', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['curl-barra','curl-martillo','curl-polea'], aliases: ['db curl','curl alternado'] },
  'curl-martillo': { name: 'Curl martillo', muscle: 'bíceps', secondary: ['antebrazos'], equipment: 'mancuernas', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['curl-mancuernas'], aliases: ['hammer curl'] },
  'curl-polea': { name: 'Curl en polea', muscle: 'bíceps', secondary: ['antebrazos'], equipment: 'polea', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['curl-barra','curl-mancuernas'], aliases: ['cable curl'] },
  'curl-predicador': { name: 'Curl en banco predicador', muscle: 'bíceps', secondary: [], equipment: 'banco', difficulty: 'intermediate', pattern: 'aislamiento', type: 'fuerza', alts: ['curl-barra'], aliases: ['preacher curl','scott curl'] },
  'press-frances': { name: 'Press francés', muscle: 'tríceps', secondary: [], equipment: 'barra', difficulty: 'intermediate', pattern: 'aislamiento', type: 'fuerza', alts: ['extension-polea','extension-overhead'], aliases: ['skull crusher','french press'] },
  'extension-polea': { name: 'Extensión de tríceps en polea', muscle: 'tríceps', secondary: [], equipment: 'polea', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['press-frances','extension-overhead'], aliases: ['triceps pushdown','pushdown'] },
  'extension-overhead': { name: 'Extensión por encima de la cabeza', muscle: 'tríceps', secondary: [], equipment: 'mancuernas', difficulty: 'intermediate', pattern: 'aislamiento', type: 'fuerza', alts: ['press-frances','extension-polea'], aliases: ['overhead tricep extension'] },
  'plancha': { name: 'Plancha abdominal', muscle: 'core', secondary: ['hombros'], equipment: 'peso corporal', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['plancha-lateral'], aliases: ['plank'] },
  'crunch': { name: 'Abdominales clásicos', muscle: 'core', secondary: [], equipment: 'colchoneta', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['crunch-polea'], aliases: ['crunch','sit up','abdominales'] },
  'crunch-polea': { name: 'Crunch en polea', muscle: 'core', secondary: [], equipment: 'polea', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['crunch'], aliases: ['cable crunch'] },
  'elevacion-piernas-colgado': { name: 'Elevación de piernas colgado', muscle: 'core', secondary: ['flexores de cadera'], equipment: 'peso corporal', difficulty: 'intermediate', pattern: 'aislamiento', type: 'fuerza', alts: ['crunch'], aliases: ['hanging leg raise'] },
  'hip-thrust': { name: 'Hip thrust con barra', muscle: 'glúteos', secondary: ['isquios'], equipment: 'barra', difficulty: 'intermediate', pattern: 'bisagra', type: 'fuerza', alts: ['hip-thrust-maquina','puente-gluteo','sentadilla-bulgara'], aliases: ['hip thrust'] },
  'hip-thrust-maquina': { name: 'Hip thrust en máquina', muscle: 'glúteos', secondary: ['isquios'], equipment: 'máquina', difficulty: 'beginner', pattern: 'bisagra', type: 'fuerza', alts: ['hip-thrust','puente-gluteo'], aliases: ['glute drive','machine hip thrust'] },
  'puente-gluteo': { name: 'Puente de glúteos', muscle: 'glúteos', secondary: ['isquios'], equipment: 'peso corporal', difficulty: 'beginner', pattern: 'bisagra', type: 'fuerza', alts: ['hip-thrust'], aliases: ['glute bridge'] },
  'sentadilla-bulgara': { name: 'Sentadilla búlgara', muscle: 'glúteos', secondary: ['cuádriceps','isquios'], equipment: 'mancuernas', difficulty: 'intermediate', pattern: 'sentadilla', type: 'fuerza', alts: ['zancadas','hip-thrust'], aliases: ['bulgarian split squat','split squat'] },
  'sentadilla-libre': { name: 'Sentadilla con barra', muscle: 'cuádriceps', secondary: ['glúteos','core'], equipment: 'barra', difficulty: 'advanced', pattern: 'sentadilla', type: 'fuerza', alts: ['sentadilla-hack','prensa','sentadilla-goblet'], aliases: ['back squat','sentadilla'] },
  'sentadilla-hack': { name: 'Sentadilla hack', muscle: 'cuádriceps', secondary: ['glúteos'], equipment: 'máquina', difficulty: 'intermediate', pattern: 'sentadilla', type: 'fuerza', alts: ['prensa','sentadilla-libre'], aliases: ['hack squat'] },
  'prensa': { name: 'Prensa de piernas', muscle: 'cuádriceps', secondary: ['glúteos'], equipment: 'máquina', difficulty: 'beginner', pattern: 'sentadilla', type: 'fuerza', alts: ['sentadilla-hack','sentadilla-libre'], aliases: ['leg press','prensa piernas'] },
  'sentadilla-goblet': { name: 'Sentadilla goblet', muscle: 'cuádriceps', secondary: ['glúteos','core'], equipment: 'mancuernas', difficulty: 'beginner', pattern: 'sentadilla', type: 'fuerza', alts: ['sentadilla-libre','prensa'], aliases: ['goblet squat'] },
  'extension-cuadriceps': { name: 'Extensión de cuádriceps', muscle: 'cuádriceps', secondary: [], equipment: 'máquina', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['prensa'], aliases: ['leg extension'] },
  'zancadas': { name: 'Zancadas', muscle: 'cuádriceps', secondary: ['glúteos'], equipment: 'mancuernas', difficulty: 'beginner', pattern: 'sentadilla', type: 'fuerza', alts: ['sentadilla-bulgara'], aliases: ['lunge','desplante'] },
  'peso-muerto-rumano': { name: 'Peso muerto rumano', muscle: 'isquios', secondary: ['glúteos','espalda'], equipment: 'barra', difficulty: 'intermediate', pattern: 'bisagra', type: 'fuerza', alts: ['peso-muerto-rumano-mancuernas','curl-femoral-acostado'], aliases: ['rdl','romanian deadlift'] },
  'peso-muerto-rumano-mancuernas': { name: 'Peso muerto rumano con mancuernas', muscle: 'isquios', secondary: ['glúteos'], equipment: 'mancuernas', difficulty: 'beginner', pattern: 'bisagra', type: 'fuerza', alts: ['peso-muerto-rumano','curl-femoral-acostado'], aliases: ['db rdl'] },
  'curl-femoral-acostado': { name: 'Curl femoral acostado', muscle: 'isquios', secondary: [], equipment: 'máquina', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['curl-femoral-sentado','peso-muerto-rumano'], aliases: ['leg curl','lying leg curl'] },
  'curl-femoral-sentado': { name: 'Curl femoral sentado', muscle: 'isquios', secondary: [], equipment: 'máquina', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['curl-femoral-acostado','peso-muerto-rumano'], aliases: ['seated leg curl'] },
  'gemelos-de-pie': { name: 'Elevación de gemelos de pie', muscle: 'gemelos', secondary: [], equipment: 'máquina', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['gemelos-sentado'], aliases: ['standing calf raise'] },
  'gemelos-sentado': { name: 'Elevación de gemelos sentado', muscle: 'gemelos', secondary: [], equipment: 'máquina', difficulty: 'beginner', pattern: 'aislamiento', type: 'fuerza', alts: ['gemelos-de-pie'], aliases: ['seated calf raise'] },
  'farmer-walk': { name: 'Caminata del granjero', muscle: 'antebrazos', secondary: ['core'], equipment: 'mancuernas', difficulty: 'intermediate', pattern: 'transporte', type: 'funcional', alts: [], aliases: ['farmers walk','farmer carry'] },
  'burpee': { name: 'Burpee', muscle: 'core', secondary: ['pecho','cuádriceps'], equipment: 'peso corporal', difficulty: 'intermediate', pattern: 'pliometría', type: 'funcional', alts: [], aliases: ['burpees'] },
  'kettlebell-swing': { name: 'Swing con kettlebell', muscle: 'glúteos', secondary: ['isquios','espalda','core'], equipment: 'kettlebell', difficulty: 'intermediate', pattern: 'bisagra', type: 'funcional', alts: ['peso-muerto-rumano'], aliases: ['kb swing','swing'] },
  'cinta': { name: 'Cinta', muscle: 'core', secondary: ['cuádriceps','isquios'], equipment: 'cardio', difficulty: 'beginner', pattern: 'cardio', type: 'cardio', alts: ['bici','eliptico'], aliases: ['treadmill','correr','running'] },
  'bici': { name: 'Bicicleta fija', muscle: 'cuádriceps', secondary: ['core'], equipment: 'cardio', difficulty: 'beginner', pattern: 'cardio', type: 'cardio', alts: ['cinta','eliptico'], aliases: ['bike','bicicleta'] },
  'eliptico': { name: 'Elíptico', muscle: 'cuádriceps', secondary: ['core'], equipment: 'cardio', difficulty: 'beginner', pattern: 'cardio', type: 'cardio', alts: ['cinta','bici'], aliases: ['elliptical'] },
};

const SUGGESTED_SESSIONS = {
  empuje: { title:'Empuje', primary:['pecho','hombros','tríceps'], exercises:[
    {exId:'press-banca',sets:4,reps:'6–8',weight:80,rir:2},
    {exId:'press-inclinado-mancuernas',sets:3,reps:'8–10',weight:28,rir:2},
    {exId:'press-maquina-hombros',sets:3,reps:'8–10',weight:50,rir:2},
    {exId:'vuelos-laterales',sets:4,reps:'12–15',weight:10,rir:1},
    {exId:'extension-polea',sets:3,reps:'10–12',weight:30,rir:1},
  ]},
  traccion: { title:'Tracción', primary:['espalda','bíceps'], exercises:[
    {exId:'dominadas',sets:4,reps:'6–8',weight:0,rir:2},
    {exId:'remo-polea',sets:3,reps:'8–10',weight:70,rir:2},
    {exId:'jalon-pecho',sets:3,reps:'10–12',weight:60,rir:1},
    {exId:'face-pull',sets:3,reps:'12–15',weight:22,rir:1},
    {exId:'curl-barra',sets:3,reps:'8–10',weight:35,rir:1},
  ]},
  piernas: { title:'Piernas', primary:['cuádriceps','isquios','glúteos'], exercises:[
    {exId:'sentadilla-libre',sets:4,reps:'5–7',weight:110,rir:2},
    {exId:'peso-muerto-rumano',sets:3,reps:'8–10',weight:90,rir:2},
    {exId:'prensa',sets:3,reps:'10–12',weight:180,rir:1},
    {exId:'curl-femoral-acostado',sets:3,reps:'10–12',weight:50,rir:1},
    {exId:'gemelos-de-pie',sets:4,reps:'12–15',weight:80,rir:1},
  ]},
};

const today = new Date();
const dayOffset = (n) => { const d=new Date(today); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); };

const MOCK_HISTORY = [
  { date:dayOffset(2), title:'Tracción', exercises:[
    {exId:'dominadas', sets:[{reps:8,weight:0,rir:2},{reps:7,weight:0,rir:1},{reps:6,weight:0,rir:0}]},
    {exId:'remo-polea', sets:[{reps:10,weight:65,rir:2},{reps:9,weight:65,rir:1},{reps:8,weight:65,rir:1}]},
    {exId:'jalon-pecho', sets:[{reps:12,weight:55,rir:2},{reps:11,weight:55,rir:1},{reps:10,weight:55,rir:0}]},
    {exId:'curl-barra', sets:[{reps:10,weight:32.5,rir:2},{reps:9,weight:32.5,rir:1},{reps:8,weight:32.5,rir:0}]},
  ]},
  { date:dayOffset(4), title:'Piernas', exercises:[
    {exId:'sentadilla-libre', sets:[{reps:6,weight:105,rir:2},{reps:6,weight:105,rir:1},{reps:5,weight:105,rir:0},{reps:5,weight:100,rir:1}]},
    {exId:'peso-muerto-rumano', sets:[{reps:8,weight:85,rir:2},{reps:8,weight:85,rir:1},{reps:7,weight:85,rir:1}]},
    {exId:'prensa', sets:[{reps:12,weight:170,rir:2},{reps:11,weight:170,rir:1},{reps:10,weight:170,rir:0}]},
  ]},
  { date:dayOffset(6), title:'Empuje', exercises:[
    {exId:'press-banca', sets:[{reps:7,weight:77.5,rir:2},{reps:6,weight:77.5,rir:1},{reps:5,weight:77.5,rir:0}]},
    {exId:'press-inclinado-mancuernas', sets:[{reps:9,weight:26,rir:2},{reps:8,weight:26,rir:1},{reps:7,weight:26,rir:0}]},
    {exId:'vuelos-laterales', sets:[{reps:13,weight:9,rir:1},{reps:12,weight:9,rir:0},{reps:11,weight:9,rir:0},{reps:10,weight:9,rir:0}]},
  ]},
  { date:dayOffset(8), title:'Tracción', exercises:[
    {exId:'remo-polea', sets:[{reps:10,weight:62.5,rir:2},{reps:9,weight:62.5,rir:1}]},
    {exId:'jalon-pecho', sets:[{reps:12,weight:52.5,rir:2},{reps:11,weight:52.5,rir:1}]},
  ]},
  { date:dayOffset(9), title:'Piernas', exercises:[
    {exId:'sentadilla-libre', sets:[{reps:6,weight:102.5,rir:2},{reps:6,weight:102.5,rir:1},{reps:5,weight:102.5,rir:0}]},
    {exId:'peso-muerto-rumano', sets:[{reps:8,weight:82.5,rir:2},{reps:7,weight:82.5,rir:1}]},
  ]},
  { date:dayOffset(11), title:'Empuje', exercises:[
    {exId:'press-banca', sets:[{reps:7,weight:75,rir:2},{reps:6,weight:75,rir:1},{reps:5,weight:75,rir:0}]},
    {exId:'press-inclinado-mancuernas', sets:[{reps:9,weight:24,rir:2},{reps:8,weight:24,rir:1}]},
  ]},
  { date:dayOffset(13), title:'Tracción', exercises:[
    {exId:'dominadas', sets:[{reps:7,weight:0,rir:2},{reps:6,weight:0,rir:1},{reps:5,weight:0,rir:0}]},
    {exId:'remo-polea', sets:[{reps:10,weight:60,rir:2},{reps:9,weight:60,rir:1}]},
  ]},
  { date:dayOffset(15), title:'Piernas', exercises:[
    {exId:'sentadilla-libre', sets:[{reps:6,weight:100,rir:2},{reps:5,weight:100,rir:1}]},
  ]},
  { date:dayOffset(18), title:'Empuje', exercises:[
    {exId:'press-banca', sets:[{reps:7,weight:72.5,rir:2},{reps:6,weight:72.5,rir:1}]},
  ]},
  { date:dayOffset(22), title:'Piernas', exercises:[
    {exId:'sentadilla-libre', sets:[{reps:6,weight:97.5,rir:2},{reps:5,weight:97.5,rir:1}]},
  ]},
  { date:dayOffset(25), title:'Empuje', exercises:[
    {exId:'press-banca', sets:[{reps:7,weight:70,rir:2}]},
  ]},
];

const CUSTOM_EXERCISES = {};
let _customCounter = 0;

const WEEKDAY_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const WEEKDAY_LONG = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTH_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function fmtDateLong(d) { return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`; }

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}
function levenshtein(a,b) {
  if (a===b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
  let prev=Array(b.length+1).fill(0).map((_,i)=>i);
  for (let i=1;i<=a.length;i++) {
    const curr=[i];
    for (let j=1;j<=b.length;j++) curr[j]=a[i-1]===b[j-1]?prev[j-1]:1+Math.min(prev[j-1],prev[j],curr[j-1]);
    prev=curr;
  }
  return prev[b.length];
}
function searchExercises(query,db=EXERCISES) {
  const q=normalize(query);
  if (!q) return {type:'empty',hits:[],suggestions:[]};
  const ranked=[];
  for (const [id,ex] of Object.entries(db)) {
    const name=normalize(ex.name);
    const aliases=(ex.aliases||[]).map(normalize);
    const allTerms=[name,...aliases,normalize(ex.muscle),normalize(ex.equipment)];
    let bestSubstring=Infinity;
    for (const t of allTerms) { if (t.includes(q)) { bestSubstring=Math.min(bestSubstring,t.indexOf(q)); } }
    if (bestSubstring!==Infinity) { ranked.push({id,score:bestSubstring*0.01,kind:'substring'}); continue; }
    let minDist=Infinity;
    for (const t of [name,...aliases]) {
      const tokens=t.split(' ');
      for (const tok of [t,...tokens]) {
        if (Math.abs(tok.length-q.length)>4) continue;
        const d=levenshtein(q,tok); const ratio=d/Math.max(q.length,tok.length);
        if (ratio<0.45&&d<minDist) minDist=d;
      }
    }
    if (minDist<Infinity) ranked.push({id,score:1+minDist*0.1,kind:'fuzzy'});
  }
  ranked.sort((a,b)=>a.score-b.score);
  const goodHits=ranked.filter((r)=>r.kind==='substring');
  if (goodHits.length>0) return {type:'matches',hits:goodHits.slice(0,30),suggestions:[]};
  if (ranked.length>0) return {type:'no-match',hits:[],suggestions:ranked.slice(0,5)};
  return {type:'no-match',hits:[],suggestions:[]};
}
function suggestionReason(query,exId,db=EXERCISES) {
  const ex=db[exId]; if (!ex) return 'Similar';
  const q=normalize(query);
  const muscleMention=MUSCLE_GROUPS.find((m)=>q.includes(normalize(m)));
  if (muscleMention&&ex.muscle===muscleMention) return `Mismo grupo: ${ex.muscle}`;
  const equipMention=EQUIPMENT.find((e)=>q.includes(normalize(e)));
  if (equipMention&&ex.equipment===equipMention) return `Mismo equipo: ${ex.equipment}`;
  return 'Nombre similar';
}
function muscleHeatFromHistory(history,days=7) {
  const cutoff=new Date(today); cutoff.setDate(cutoff.getDate()-days);
  const heat={}; MUSCLE_GROUPS.forEach((m)=>heat[m]=0);
  history.forEach((s)=>{
    const d=new Date(s.date); if (d<cutoff) return;
    const recencyDays=Math.floor((today-d)/86400000);
    const weight=Math.max(0,1-recencyDays/days);
    s.exercises.forEach((e)=>{
      const ex=EXERCISES[e.exId]||CUSTOM_EXERCISES[e.exId]; if (!ex) return;
      heat[ex.muscle]=(heat[ex.muscle]||0)+e.sets.length*weight;
      (ex.secondary||[]).forEach((m)=>{heat[m]=(heat[m]||0)+e.sets.length*weight*0.4;});
    });
  });
  const max=Math.max(0.01,...Object.values(heat));
  Object.keys(heat).forEach((k)=>heat[k]=heat[k]/max);
  return heat;
}
function progressionFor(history,exId) {
  return history.map((s)=>{
    const e=s.exercises.find((x)=>x.exId===exId); if (!e) return null;
    return {date:s.date,weight:Math.max(...e.sets.map((set)=>set.weight))};
  }).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date));
}
function getExercise(id) { return EXERCISES[id]||CUSTOM_EXERCISES[id]||null; }
function createCustomExercise({name,muscle,secondary=[],equipment,difficulty='intermediate',pattern='aislamiento'}) {
  _customCounter++;
  const id=`custom-${Date.now()}-${_customCounter}`;
  CUSTOM_EXERCISES[id]={name,muscle,secondary,equipment,difficulty,pattern,type:'personalizado',alts:[],aliases:[],custom:true};
  return id;
}

// ── LAYOUT WRAPPER (mobile-first, sin frame iOS) ──────────────────────────────

function AppShell({children,accent,setAccent}) {
  const ACCENT_PRESETS=[
    {c:'#f5f5f0',l:'Off-white'},{c:'#d8ff3d',l:'Volt'},{c:'#ff5b2e',l:'Brasa'},
    {c:'#7c5cff',l:'Iris'},{c:'#3dd6a8',l:'Menta'},
  ];
  return (
    <div style={{width:'100%',height:'100%',background:'#000',position:'relative',overflow:'hidden'}}>
      {children}
      <div style={{position:'fixed',bottom:16,right:16,zIndex:200,display:'flex',gap:6,padding:'8px 10px',background:'rgba(10,10,10,0.92)',border:'0.5px solid #222',borderRadius:999}}>
        {ACCENT_PRESETS.map((p)=>(
          <button key={p.c} title={p.l} onClick={()=>setAccent(p.c)}
            style={{width:22,height:22,borderRadius:'50%',border:accent===p.c?`2px solid ${p.c}`:'1.5px solid rgba(255,255,255,0.15)',background:p.c,cursor:'pointer',boxShadow:accent===p.c?`0 0 0 2px #000, 0 0 0 3.5px ${p.c}`:'none',transition:'box-shadow .15s'}}/>
        ))}
      </div>
    </div>
  );
}

// ── PRIMITIVES ────────────────────────────────────────────────────────────────

function TabBar({active,onChange,accent}) {
  const tabs=[
    {id:'home',label:'Hoy',icon:<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9z"/>},
    {id:'session',label:'Entrenar',icon:<path d="M5 12h14M7 8v8M17 8v8M3 10v4M21 10v4"/>},
    {id:'history',label:'Historial',icon:<path d="M3 5h18M3 12h18M3 19h18"/>},
    {id:'settings',label:'Ajustes',icon:<path d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>},
  ];
  return (
    <div style={{position:'absolute',left:0,right:0,bottom:0,zIndex:40,display:'flex',alignItems:'flex-end',justifyContent:'space-around',padding:'12px 4px env(safe-area-inset-bottom, 16px)',background:'linear-gradient(to top, #000 60%, rgba(0,0,0,0))'}}>
      {tabs.map((t)=>{
        const on=active===t.id;
        return (
          <button key={t.id} onClick={()=>onChange(t.id)} style={{background:'transparent',border:0,padding:'6px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:3,color:on?accent:'rgba(255,255,255,0.42)',fontFamily:'Inter,system-ui',fontSize:10,fontWeight:500,letterSpacing:0.2,cursor:'pointer',minWidth:64}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
            <span style={{textTransform:'uppercase',fontSize:9,letterSpacing:0.6}}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Button({children,onClick,variant='primary',accent='#f5f5f0',style={},disabled}) {
  const base={fontFamily:'Inter,system-ui',fontSize:14,fontWeight:600,letterSpacing:-0.1,height:48,borderRadius:12,border:0,padding:'0 18px',display:'flex',alignItems:'center',justifyContent:'center',gap:8,cursor:disabled?'not-allowed':'pointer',transition:'transform .12s, opacity .12s',opacity:disabled?0.45:1,width:'100%'};
  const variants={primary:{background:accent,color:'#000'},secondary:{background:'#141414',color:'#f5f5f0',border:'0.5px solid #2a2a2a'},ghost:{background:'transparent',color:'rgba(245,245,240,0.6)'},accent:{background:'transparent',color:accent,border:`0.5px solid ${accent}`}};
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseDown={(e)=>!disabled&&(e.currentTarget.style.transform='scale(0.98)')}
      onMouseUp={(e)=>(e.currentTarget.style.transform='scale(1)')}
      onMouseLeave={(e)=>(e.currentTarget.style.transform='scale(1)')}
      style={{...base,...variants[variant],...style}}>{children}</button>
  );
}
function MonoNumber({children,size=28,weight=600,color='#f5f5f0',style={}}) {
  return <span style={{fontFamily:'ui-monospace,monospace',fontSize:size,fontWeight:weight,color,lineHeight:1,fontVariantNumeric:'tabular-nums',letterSpacing:-0.5,...style}}>{children}</span>;
}
function Label({children,style={}}) {
  return <div style={{fontFamily:'Inter,system-ui',fontSize:10,fontWeight:600,color:'rgba(245,245,240,0.42)',textTransform:'uppercase',letterSpacing:1.2,...style}}>{children}</div>;
}
function Card({children,style={},onClick}) {
  return <div onClick={onClick} style={{background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:14,padding:16,...style}}>{children}</div>;
}
function Pill({children,color='rgba(245,245,240,0.6)',bg='#141414',style={}}) {
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,fontFamily:'Inter,system-ui',fontSize:10,fontWeight:600,color,background:bg,padding:'4px 8px',borderRadius:999,letterSpacing:0.4,textTransform:'uppercase',...style}}>{children}</span>;
}
function Header({title,subtitle,right,style={}}) {
  return (
    <div style={{padding:'64px 20px 14px',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,...style}}>
      <div style={{flex:1,minWidth:0}}>
        {subtitle&&<Label style={{marginBottom:6}}>{subtitle}</Label>}
        <div style={{fontFamily:'Inter,system-ui',fontSize:22,fontWeight:600,letterSpacing:-0.5,color:'#f5f5f0',lineHeight:1.1}}>{title}</div>
      </div>
      {right&&<div style={{display:'flex',gap:8,alignItems:'center'}}>{right}</div>}
    </div>
  );
}

function BodyDiagram({heat={},accent='#f5f5f0',size=220,view='front'}) {
  const fill=(m)=>{const v=heat[m]||0;if(v===0) return 'rgba(255,255,255,0.05)';return `color-mix(in oklab, ${accent} ${Math.round(20+v*80)}%, #1a1a1a)`;};
  const stroke='rgba(255,255,255,0.18)';
  const front=(<g>
    <circle cx="100" cy="22" r="13" fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth="0.6"/>
    <ellipse cx="76" cy="46" rx="13" ry="9" fill={fill('hombros')} stroke={stroke} strokeWidth="0.6"/>
    <ellipse cx="124" cy="46" rx="13" ry="9" fill={fill('hombros')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M82 44 Q100 38 118 44 L122 70 Q100 76 78 70 Z" fill={fill('pecho')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M86 72 Q100 75 114 72 L112 110 Q100 114 88 110 Z" fill={fill('core')} stroke={stroke} strokeWidth="0.6"/>
    <ellipse cx="64" cy="64" rx="7" ry="14" fill={fill('bíceps')} stroke={stroke} strokeWidth="0.6"/>
    <ellipse cx="136" cy="64" rx="7" ry="14" fill={fill('bíceps')} stroke={stroke} strokeWidth="0.6"/>
    <ellipse cx="60" cy="89" rx="6" ry="13" fill={fill('antebrazos')} stroke={stroke} strokeWidth="0.6"/>
    <ellipse cx="140" cy="89" rx="6" ry="13" fill={fill('antebrazos')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M84 112 L116 112 L120 130 L80 130 Z" fill={fill('flexores de cadera')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M82 132 L98 132 L96 178 L82 178 Z" fill={fill('cuádriceps')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M102 132 L118 132 L118 178 L104 178 Z" fill={fill('cuádriceps')} stroke={stroke} strokeWidth="0.6"/>
  </g>);
  const back=(<g>
    <circle cx="100" cy="22" r="13" fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth="0.6"/>
    <ellipse cx="76" cy="46" rx="13" ry="9" fill={fill('hombros')} stroke={stroke} strokeWidth="0.6"/>
    <ellipse cx="124" cy="46" rx="13" ry="9" fill={fill('hombros')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M82 44 Q100 40 118 44 L120 80 Q100 84 80 80 Z" fill={fill('espalda')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M84 82 Q100 86 116 82 L114 110 Q100 114 86 110 Z" fill={fill('espalda')} stroke={stroke} strokeWidth="0.6"/>
    <ellipse cx="64" cy="64" rx="7" ry="14" fill={fill('tríceps')} stroke={stroke} strokeWidth="0.6"/>
    <ellipse cx="136" cy="64" rx="7" ry="14" fill={fill('tríceps')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M82 112 L100 112 L100 134 L84 134 Z" fill={fill('glúteos')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M100 112 L118 112 L116 134 L100 134 Z" fill={fill('glúteos')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M82 136 L100 136 L98 178 L84 178 Z" fill={fill('isquios')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M100 136 L118 136 L116 178 L102 178 Z" fill={fill('isquios')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M84 182 L96 182 L94 215 L86 215 Z" fill={fill('gemelos')} stroke={stroke} strokeWidth="0.6"/>
    <path d="M104 182 L116 182 L114 215 L106 215 Z" fill={fill('gemelos')} stroke={stroke} strokeWidth="0.6"/>
  </g>);
  return <svg viewBox="0 0 200 230" width={size} height={size*230/200} style={{display:'block'}}>{view==='front'?front:back}</svg>;
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────

function Onboarding({onComplete,accent}) {
  const [step,setStep]=useState(0);
  const [data,setData]=useState({name:'',goal:'hipertrofia',priorities:['pecho','espalda','piernas'],frequency:4,experience:'intermedio'});
  const canNext=step===0?data.name.trim().length>0:true;
  const next=()=>{if(!canNext) return; step<4?setStep(step+1):onComplete(data);};
  const back=()=>setStep(Math.max(0,step-1));
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#000',color:'#f5f5f0'}}>
      <div style={{padding:'60px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <button onClick={back} disabled={step===0} style={{background:'transparent',border:0,color:step===0?'transparent':'rgba(245,245,240,0.5)',fontFamily:'Inter',fontSize:13,cursor:step===0?'default':'pointer',padding:0}}>← Atrás</button>
        <div style={{display:'flex',gap:6}}>
          {[0,1,2,3,4].map((i)=><div key={i} style={{width:i===step?18:6,height:6,borderRadius:3,background:i<=step?accent:'rgba(245,245,240,0.18)',transition:'all .25s'}}/>)}
        </div>
        <div style={{width:50,fontFamily:'ui-monospace,monospace',fontSize:11,color:'rgba(245,245,240,0.4)',textAlign:'right'}}>{String(step+1).padStart(2,'0')}/05</div>
      </div>
      <div style={{flex:1,padding:'40px 24px 24px',display:'flex',flexDirection:'column',overflow:'auto'}}>
        {step===0&&<StepName data={data} setData={setData} accent={accent}/>}
        {step===1&&<StepGoal data={data} setData={setData} accent={accent}/>}
        {step===2&&<StepPriorities data={data} setData={setData} accent={accent}/>}
        {step===3&&<StepFrequency data={data} setData={setData} accent={accent}/>}
        {step===4&&<StepExperience data={data} setData={setData} accent={accent}/>}
      </div>
      <div style={{padding:'0 24px 40px'}}>
        <Button onClick={next} accent={accent} disabled={!canNext}>{step===4?'Finalizar configuración':'Continuar'}</Button>
      </div>
    </div>
  );
}

function StepName({data,setData,accent}) {
  return (
    <>
      <StepHeader eyebrow="00 — Bienvenida" title="¿Cómo te llamás?" sub="Lo usamos para personalizar tu experiencia. Solo vos ves esto."/>
      <div style={{marginTop:8}}>
        <input autoFocus value={data.name} onChange={(e)=>setData({...data,name:e.target.value})} placeholder="Tu nombre…"
          style={{width:'100%',height:52,background:'#0a0a0a',border:`0.5px solid ${data.name.trim()?accent:'#1f1f1f'}`,borderRadius:12,padding:'0 18px',color:'#f5f5f0',fontFamily:'Inter',fontSize:18,fontWeight:500,outline:'none',transition:'border .2s'}}/>
        {data.name.trim().length>0&&(
          <div style={{marginTop:20,padding:'16px 18px',background:'rgba(245,245,240,0.03)',border:`0.5px solid ${accent}`,borderRadius:12}}>
            <div style={{fontFamily:'Inter',fontSize:13,color:'rgba(245,245,240,0.5)',marginBottom:4}}>Vista previa</div>
            <div style={{fontFamily:'Inter',fontSize:20,fontWeight:600,color:'#f5f5f0'}}>Hola, {data.name.trim()} 👋</div>
          </div>
        )}
      </div>
    </>
  );
}

function StepHeader({eyebrow,title,sub}) {
  return (
    <div style={{marginBottom:32}}>
      <Label style={{marginBottom:12}}>{eyebrow}</Label>
      <div style={{fontFamily:'Inter',fontSize:26,fontWeight:600,lineHeight:1.15,letterSpacing:-0.7,color:'#f5f5f0'}}>{title}</div>
      {sub&&<div style={{marginTop:10,fontFamily:'Inter',fontSize:14,color:'rgba(245,245,240,0.55)',lineHeight:1.4}}>{sub}</div>}
    </div>
  );
}
function OptionRow({label,desc,selected,onClick,accent}) {
  return (
    <button onClick={onClick} style={{width:'100%',textAlign:'left',background:selected?'rgba(245,245,240,0.04)':'#0a0a0a',border:selected?`0.5px solid ${accent}`:'0.5px solid #1a1a1a',borderRadius:12,padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,transition:'all .15s'}}>
      <div>
        <div style={{fontFamily:'Inter',fontSize:15,fontWeight:500,color:'#f5f5f0'}}>{label}</div>
        {desc&&<div style={{fontFamily:'Inter',fontSize:12,color:'rgba(245,245,240,0.45)',marginTop:3}}>{desc}</div>}
      </div>
      <div style={{width:18,height:18,borderRadius:9,border:selected?`1.5px solid ${accent}`:'1.5px solid rgba(245,245,240,0.2)',background:selected?accent:'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        {selected&&<div style={{width:6,height:6,borderRadius:3,background:'#000'}}/>}
      </div>
    </button>
  );
}
function StepGoal({data,setData,accent}) {
  const goals=[{id:'fuerza',label:'Fuerza',desc:'Carga alta, pocas reps. 1–6 RM.'},{id:'hipertrofia',label:'Hipertrofia',desc:'Carga moderada, 6–12 reps.'},{id:'resistencia',label:'Resistencia',desc:'Carga liviana, 15+ reps.'},{id:'general',label:'Estado físico general',desc:'Rangos de reps mixtos.'}];
  return (<><StepHeader eyebrow="01 — Objetivo" title="¿Cuál es tu objetivo principal?" sub="Define los rangos de reps y la lógica de carga para las sesiones sugeridas."/><div style={{display:'flex',flexDirection:'column',gap:8}}>{goals.map((g)=><OptionRow key={g.id} label={g.label} desc={g.desc} selected={data.goal===g.id} onClick={()=>setData({...data,goal:g.id})} accent={accent}/>)}</div></>);
}
function StepPriorities({data,setData,accent}) {
  const groups=['pecho','espalda','piernas','hombros','brazos','core'];
  const move=(m,dir)=>{const arr=[...data.priorities];const i=arr.indexOf(m);const j=i+dir;if(i===-1||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];setData({...data,priorities:arr});};
  const toggle=(m)=>setData({...data,priorities:data.priorities.includes(m)?data.priorities.filter((x)=>x!==m):[...data.priorities,m]});
  const ordered=[...data.priorities,...groups.filter((g)=>!data.priorities.includes(g))];
  return (<><StepHeader eyebrow="02 — Prioridades" title="Ordená tus zonas de foco" sub="Las primeras tienen más rotación. Tocá para activar; flechas para reordenar."/><div style={{display:'flex',flexDirection:'column',gap:6}}>{ordered.map((m)=>{const active=data.priorities.includes(m);const rank=active?data.priorities.indexOf(m)+1:null;return(<div key={m} style={{display:'flex',alignItems:'center',gap:8,background:active?'rgba(245,245,240,0.04)':'#0a0a0a',border:active?`0.5px solid ${accent}`:'0.5px solid #1a1a1a',borderRadius:12,padding:'10px 12px'}}><div onClick={()=>toggle(m)} style={{flex:1,display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}><MonoNumber size={14} color={active?accent:'rgba(245,245,240,0.3)'}>{rank?String(rank).padStart(2,'0'):'··'}</MonoNumber><span style={{fontFamily:'Inter',fontSize:15,fontWeight:500,color:'#f5f5f0',textTransform:'capitalize'}}>{m}</span></div>{active&&(<div style={{display:'flex',gap:2}}><button onClick={()=>move(m,-1)} style={{background:'transparent',border:0,color:'rgba(245,245,240,0.5)',cursor:'pointer',padding:'4px 6px',fontSize:14}}>↑</button><button onClick={()=>move(m,1)} style={{background:'transparent',border:0,color:'rgba(245,245,240,0.5)',cursor:'pointer',padding:'4px 6px',fontSize:14}}>↓</button></div>)}</div>);})}</div></>);
}
function StepFrequency({data,setData,accent}) {
  return (<><StepHeader eyebrow="03 — Frecuencia" title="¿Cuántos días por semana?" sub="Planificamos descanso y rotación del split en torno a esto."/><div style={{display:'flex',justifyContent:'center',alignItems:'baseline',gap:8,padding:'40px 0 32px'}}><MonoNumber size={96} weight={500} color={accent}>{data.frequency}</MonoNumber><div style={{fontFamily:'Inter',fontSize:14,color:'rgba(245,245,240,0.5)'}}>días/sem</div></div><div style={{display:'flex',gap:8}}>{[2,3,4,5,6].map((n)=>(<button key={n} onClick={()=>setData({...data,frequency:n})} style={{flex:1,height:48,background:data.frequency===n?accent:'#0a0a0a',color:data.frequency===n?'#000':'#f5f5f0',border:data.frequency===n?'none':'0.5px solid #1a1a1a',borderRadius:12,fontFamily:'ui-monospace,monospace',fontSize:16,fontWeight:600,cursor:'pointer',transition:'all .15s'}}>{n}</button>))}</div><div style={{marginTop:24,padding:'14px 16px',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12}}><Label style={{marginBottom:6}}>Split sugerido</Label><div style={{fontFamily:'Inter',fontSize:13,color:'rgba(245,245,240,0.7)',lineHeight:1.4}}>{data.frequency===2&&'Cuerpo completo, 2× por semana.'}{data.frequency===3&&'Cuerpo completo, 3× por semana.'}{data.frequency===4&&'Tren superior / inferior, 2× cada uno.'}{data.frequency===5&&'Empuje / Tracción / Piernas / Superior / Inferior.'}{data.frequency===6&&'Empuje / Tracción / Piernas, 2× cada uno.'}</div></div></>);
}
function StepExperience({data,setData,accent}) {
  const levels=[{id:'principiante',label:'Principiante',desc:'Recién empezás o volvés después de un parate.'},{id:'intermedio',label:'Intermedio',desc:'Más de 6 meses entrenando consistente.'},{id:'avanzado',label:'Avanzado',desc:'2+ años, cómodo con todos los movimientos.'}];
  return (<><StepHeader eyebrow="04 — Experiencia" title="Experiencia entrenando" sub="Ajusta cargas iniciales y velocidad de progresión."/><div style={{display:'flex',flexDirection:'column',gap:8}}>{levels.map((l)=><OptionRow key={l.id} label={l.label} desc={l.desc} selected={data.experience===l.id} onClick={()=>setData({...data,experience:l.id})} accent={accent}/>)}</div></>);
}

// ── HOME ──────────────────────────────────────────────────────────────────────

function HomeScreen({profile,history,onStartSession,onStartFreestyle,accent}) {
  const [bodyView,setBodyView]=useState('front');
  const heat=muscleHeatFromHistory(history,7);
  const recentTitles=history.slice(0,3).map((h)=>h.title);
  const candidates=['Empuje','Tracción','Piernas'];
  const next=candidates.find((c)=>!recentTitles.includes(c))||'Empuje';
  const sessionKeyMap={'Empuje':'empuje','Tracción':'traccion','Piernas':'piernas'};
  const sessionKey=sessionKeyMap[next];
  const session=SUGGESTED_SESSIONS[sessionKey];
  const dates=new Set(history.map((h)=>h.date));
  let streak=0;
  for (let i=0;i<30;i++){const d=new Date(today);d.setDate(d.getDate()-i);if(dates.has(d.toISOString().slice(0,10)))streak++;else if(i>1)break;}
  const cutoff=new Date(today);cutoff.setDate(cutoff.getDate()-7);
  const sessionsThisWeek=history.filter((h)=>new Date(h.date)>=cutoff).length;
  const lastTitle=history[0]?.title||'descanso';
  const daysAgo=history[0]?Math.floor((today-new Date(history[0].date))/86400000):'–';
  const dateStr=`${WEEKDAY_LONG[today.getDay()]}, ${today.getDate()} ${MONTH_SHORT[today.getMonth()]}`.toUpperCase();
  return (
    <div style={{height:'100%',overflow:'auto',background:'#000',color:'#f5f5f0',paddingBottom:100}}>
      <Header subtitle={dateStr} title={profile.name?`Hola, ${profile.name}`:'Hoy'} right={<StreakBadge n={streak} accent={accent}/>}/>
      <div style={{padding:'0 20px 20px',fontFamily:'Inter',fontSize:13,color:'rgba(245,245,240,0.55)',lineHeight:1.4}}>Última sesión: {lastTitle}, hace {daysAgo}d. {next} en cola.</div>
      <div style={{padding:'0 16px 16px'}}>
        <div style={{background:'linear-gradient(180deg,#0d0d0d 0%,#0a0a0a 100%)',border:'0.5px solid #1f1f1f',borderRadius:16,overflow:'hidden'}}>
          <div style={{padding:'18px 18px 14px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <Label>Sesión sugerida</Label>
              <Pill color={accent} bg="rgba(245,245,240,0.06)">~{session.exercises.length*12} min</Pill>
            </div>
            <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:4}}>
              <div style={{fontFamily:'Inter',fontSize:32,fontWeight:600,letterSpacing:-1,color:'#f5f5f0'}}>{session.title}</div>
              <div style={{fontFamily:'Inter',fontSize:13,color:'rgba(245,245,240,0.45)'}}>· {session.exercises.length} ejercicios</div>
            </div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:10}}>
              {session.primary.map((m)=><span key={m} style={{fontFamily:'ui-monospace,monospace',fontSize:10,fontWeight:500,color:'rgba(245,245,240,0.7)',background:'rgba(245,245,240,0.05)',padding:'4px 7px',borderRadius:4,textTransform:'uppercase',letterSpacing:0.5}}>{m}</span>)}
            </div>
          </div>
          <div style={{borderTop:'0.5px solid #1a1a1a',padding:'12px 18px'}}>
            {session.exercises.slice(0,3).map((e,i)=>(
              <div key={e.exId} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:i<2?'0.5px solid #131313':'none'}}>
                <MonoNumber size={11} color="rgba(245,245,240,0.35)">{String(i+1).padStart(2,'0')}</MonoNumber>
                <span style={{flex:1,fontFamily:'Inter',fontSize:13,color:'#f5f5f0'}}>{getExercise(e.exId)?.name}</span>
                <MonoNumber size={11} color="rgba(245,245,240,0.45)">{e.sets}×{e.reps}</MonoNumber>
              </div>
            ))}
            {session.exercises.length>3&&<div style={{paddingTop:6,fontFamily:'Inter',fontSize:11,color:'rgba(245,245,240,0.4)'}}>+{session.exercises.length-3} más</div>}
          </div>
          <div style={{padding:'12px 16px 16px'}}>
            <Button onClick={()=>onStartSession(sessionKey)} accent={accent}>Empezar sesión →</Button>
          </div>
        </div>
      </div>
      <div style={{padding:'0 16px 16px'}}>
        <button onClick={onStartFreestyle} style={{width:'100%',height:44,background:'transparent',border:'0.5px dashed rgba(245,245,240,0.2)',borderRadius:12,color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:13,fontWeight:500,cursor:'pointer',letterSpacing:-0.1}}>+ Registrar sesión libre</button>
      </div>
      <div style={{padding:'8px 16px 16px'}}>
        <Card style={{padding:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <Label>Entrenado · últimos 7 días</Label>
            <div style={{display:'flex',background:'#141414',borderRadius:8,padding:2}}>
              {[{id:'front',l:'Frente'},{id:'back',l:'Espalda'}].map((v)=>(
                <button key={v.id} onClick={()=>setBodyView(v.id)} style={{background:bodyView===v.id?'#262626':'transparent',border:0,color:bodyView===v.id?'#f5f5f0':'rgba(245,245,240,0.5)',fontFamily:'Inter',fontSize:11,fontWeight:500,padding:'4px 12px',borderRadius:6,cursor:'pointer'}}>{v.l}</button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <div style={{flexShrink:0}}><BodyDiagram heat={heat} accent={accent} size={140} view={bodyView}/></div>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
              {Object.entries(heat).sort(([,a],[,b])=>b-a).slice(0,6).map(([m,v])=>(
                <div key={m} style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{flex:1,fontFamily:'Inter',fontSize:11,color:'rgba(245,245,240,0.7)',textTransform:'capitalize'}}>{m}</div>
                  <div style={{width:60,height:3,background:'rgba(245,245,240,0.06)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{width:`${v*100}%`,height:'100%',background:v>0?accent:'transparent'}}/>
                  </div>
                  <MonoNumber size={9} color="rgba(245,245,240,0.4)" style={{width:22,textAlign:'right'}}>{Math.round(v*100)}</MonoNumber>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <div style={{padding:'0 16px 16px'}}>
        <Card style={{padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
            <Label>Esta semana</Label>
            <div><MonoNumber size={22} color="#f5f5f0">{sessionsThisWeek}</MonoNumber><span style={{fontFamily:'ui-monospace,monospace',fontSize:11,color:'rgba(245,245,240,0.4)'}}> /{profile.frequency}</span></div>
          </div>
          <WeekDots history={history} accent={accent}/>
        </Card>
      </div>
    </div>
  );
}

function StreakBadge({n,accent}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:4,background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:999,padding:'6px 10px'}}>
      <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M5 0c1 2-2 3-2 5s1 3 2 3 2-1 2-2c0 0 2 1 2 4s-3 2-4 2-4-1-4-4S4 4 5 0z" fill={accent}/></svg>
      <MonoNumber size={12} color="#f5f5f0">{n}</MonoNumber>
    </div>
  );
}
function WeekDots({history,accent}) {
  const dates=new Set(history.map((h)=>h.date));
  const days=[];
  for (let i=6;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);const iso=d.toISOString().slice(0,10);days.push({d,iso,trained:dates.has(iso),today:i===0});}
  return (
    <div style={{display:'flex',justifyContent:'space-between',gap:4}}>
      {days.map((day)=>(
        <div key={day.iso} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
          <div style={{fontFamily:'Inter',fontSize:9,color:'rgba(245,245,240,0.4)',textTransform:'uppercase',letterSpacing:0.5}}>{WEEKDAY_SHORT[day.d.getDay()].slice(0,1)}</div>
          <div style={{width:'100%',height:32,borderRadius:6,background:day.trained?accent:'rgba(245,245,240,0.05)',border:day.today?`0.5px solid ${accent}`:'none',opacity:day.trained?1:(day.today?1:0.5)}}/>
          <MonoNumber size={9} color={day.today?'#f5f5f0':'rgba(245,245,240,0.4)'}>{String(day.d.getDate()).padStart(2,'0')}</MonoNumber>
        </div>
      ))}
    </div>
  );
}

// ── SESSION ───────────────────────────────────────────────────────────────────

function SessionScreen({sessionKey,freestyle,accent,onFinish,onCancel}) {
  const initial=!freestyle&&SUGGESTED_SESSIONS[sessionKey]?SUGGESTED_SESSIONS[sessionKey].exercises.map((e,i)=>({...e,uid:`e${i}`,completedSets:Array(e.sets).fill(null),notes:''})):[];
  const [exercises,setExercises]=useState(initial);
  const [activeIdx,setActiveIdx]=useState(0);
  const [showSwap,setShowSwap]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [restTimer,setRestTimer]=useState(null);
  const [now,setNow]=useState(Date.now());
  const [sessionStart]=useState(Date.now()-(freestyle?0:8*60*1000));
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(id);},[]);
  const elapsedMin=Math.floor((now-sessionStart)/60000);
  const elapsedSec=Math.floor(((now-sessionStart)%60000)/1000);
  const completeSet=(uid,setIdx,data)=>{setExercises((prev)=>prev.map((e)=>{if(e.uid!==uid)return e;const cs=[...e.completedSets];cs[setIdx]=data;return{...e,completedSets:cs};}));setRestTimer({start:Date.now(),duration:90});};
  const swapExercise=(uid,newExId)=>{setExercises((prev)=>prev.map((e)=>e.uid!==uid?e:{...e,exId:newExId}));setShowSwap(null);};
  const addExercise=(exId)=>{setExercises((prev)=>[...prev,{exId,sets:3,reps:'8–10',weight:20,rir:2,uid:`f${Date.now()}`,completedSets:[null,null,null],notes:''}]);setShowAdd(false);};
  const removeExercise=(uid)=>setExercises((prev)=>prev.filter((e)=>e.uid!==uid));
  const totalSets=exercises.reduce((s,e)=>s+e.completedSets.length,0);
  const doneSets=exercises.reduce((s,e)=>s+e.completedSets.filter((x)=>x).length,0);
  const progress=totalSets?doneSets/totalSets:0;
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#000',color:'#f5f5f0'}}>
      <div style={{padding:'54px 16px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'0.5px solid #141414'}}>
        <button onClick={onCancel} style={{background:'transparent',border:0,color:'rgba(245,245,240,0.55)',fontFamily:'Inter',fontSize:13,cursor:'pointer',padding:0}}>✕ Cancelar</button>
        <div style={{display:'flex',alignItems:'baseline',gap:6}}>
          <MonoNumber size={18} color="#f5f5f0">{String(elapsedMin).padStart(2,'0')}:{String(elapsedSec).padStart(2,'0')}</MonoNumber>
          <span style={{fontFamily:'Inter',fontSize:10,color:'rgba(245,245,240,0.4)',textTransform:'uppercase',letterSpacing:0.5}}>transcurrido</span>
        </div>
        <div style={{width:70,textAlign:'right'}}>
          <MonoNumber size={13} color={accent}>{doneSets}</MonoNumber>
          <span style={{fontFamily:'ui-monospace,monospace',fontSize:11,color:'rgba(245,245,240,0.4)'}}>/{totalSets}</span>
        </div>
      </div>
      <div style={{height:2,background:'#0a0a0a'}}><div style={{height:'100%',width:`${progress*100}%`,background:accent,transition:'width .3s'}}/></div>
      <div style={{padding:'14px 20px 4px'}}>
        <Label>{freestyle?'Sesión libre':'Sugerida'}</Label>
        <div style={{fontFamily:'Inter',fontSize:22,fontWeight:600,letterSpacing:-0.5,marginTop:4}}>{freestyle?'Sesión libre':SUGGESTED_SESSIONS[sessionKey].title}</div>
      </div>
      <div style={{flex:1,overflow:'auto',padding:'16px 16px 200px'}}>
        {exercises.length===0&&<div style={{padding:'40px 16px',textAlign:'center',color:'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:13}}>Todavía no hay ejercicios. Tocá + para agregar.</div>}
        {exercises.map((e,i)=>(<ExerciseCard key={e.uid} exercise={e} idx={i} active={activeIdx===i} onActivate={()=>setActiveIdx(i)} onSwap={()=>setShowSwap(e.uid)} onCompleteSet={(setIdx,data)=>completeSet(e.uid,setIdx,data)} onUpdate={(patch)=>setExercises((prev)=>prev.map((x)=>x.uid===e.uid?{...x,...patch}:x))} onRemove={()=>removeExercise(e.uid)} accent={accent}/>))}
        <button onClick={()=>setShowAdd(true)} style={{width:'100%',height:48,marginTop:8,background:'transparent',border:'0.5px dashed rgba(245,245,240,0.2)',borderRadius:12,color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:13,fontWeight:500,cursor:'pointer'}}>+ Agregar ejercicio</button>
      </div>
      <div style={{position:'absolute',left:0,right:0,bottom:0,padding:'12px 16px 24px',background:'linear-gradient(to top, #000 70%, rgba(0,0,0,0))'}}>
        {restTimer&&<RestTimer timer={restTimer} now={now} accent={accent} onSkip={()=>setRestTimer(null)} onAdd={()=>setRestTimer({...restTimer,duration:restTimer.duration+30})}/>}
        <Button onClick={onFinish} accent={accent} variant={doneSets>=totalSets*0.5?'primary':'secondary'}>Terminar sesión</Button>
      </div>
      {showSwap&&<SwapSheet exercise={exercises.find((e)=>e.uid===showSwap)} onSwap={(id)=>swapExercise(showSwap,id)} onClose={()=>setShowSwap(null)} accent={accent}/>}
      {showAdd&&<AddSheet onAdd={addExercise} onClose={()=>setShowAdd(false)} accent={accent}/>}
    </div>
  );
}

function ExerciseCard({exercise,idx,active,onActivate,onSwap,onCompleteSet,onUpdate,onRemove,accent}) {
  const ex=getExercise(exercise.exId);
  const [dragX,setDragX]=useState(0);
  const [dragging,setDragging]=useState(false);
  const startX=useRef(0);
  const onTouchStart=(e)=>{startX.current=(e.touches?.[0]||e).clientX;setDragging(true);};
  const onTouchMove=(e)=>{if(!dragging)return;const x=(e.touches?.[0]||e).clientX;setDragX(Math.min(0,Math.max(-100,x-startX.current)));};
  const onTouchEnd=()=>{if(dragX<-60)onSwap();setDragX(0);setDragging(false);};
  const allDone=exercise.completedSets.every((s)=>s);
  if (!ex) return null;
  return (
    <div style={{position:'relative',marginBottom:10}}>
      <div style={{position:'absolute',inset:0,borderRadius:12,background:'rgba(245,245,240,0.04)',border:`0.5px solid ${accent}`,display:'flex',alignItems:'center',justifyContent:'flex-end',padding:'0 18px',pointerEvents:'none'}}>
        <div style={{display:'flex',alignItems:'center',gap:6,color:accent,fontFamily:'Inter',fontSize:12,fontWeight:600}}>CAMBIAR</div>
      </div>
      <div onMouseDown={onTouchStart} onMouseMove={onTouchMove} onMouseUp={onTouchEnd} onMouseLeave={()=>dragging&&onTouchEnd()} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onClick={onActivate}
        style={{background:'#0a0a0a',border:active?'0.5px solid #2a2a2a':'0.5px solid #1a1a1a',borderRadius:12,transform:`translateX(${dragX}px)`,transition:dragging?'none':'transform .25s',overflow:'hidden',opacity:allDone?0.55:1}}>
        <div style={{padding:'14px 16px 10px',display:'flex',alignItems:'center',gap:10}}>
          <MonoNumber size={11} color="rgba(245,245,240,0.35)">{String(idx+1).padStart(2,'0')}</MonoNumber>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:'Inter',fontSize:15,fontWeight:600,color:'#f5f5f0',lineHeight:1.2}}>{ex.name}</div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3}}>
              <span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:0.5}}>{ex.muscle}</span>
              <span style={{color:'rgba(245,245,240,0.2)'}}>·</span>
              <span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:0.5}}>{ex.equipment}</span>
              {ex.custom&&<><span style={{color:'rgba(245,245,240,0.2)'}}>·</span><span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:accent,textTransform:'uppercase',letterSpacing:0.5}}>personalizado</span></>}
            </div>
          </div>
          <button onClick={(e)=>{e.stopPropagation();onSwap();}} style={{background:'transparent',border:0,padding:6,cursor:'pointer'}}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5h9M9 2l3 3-3 3M14 11H5M7 14l-3-3 3-3" stroke="rgba(245,245,240,0.5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        {active&&(
          <div style={{padding:'0 16px 14px'}}>
            <div style={{display:'flex',gap:6,marginBottom:8,padding:'6px 0',borderTop:'0.5px solid #141414',borderBottom:'0.5px solid #141414'}}>
              {['SERIE','PESO','REPS','RIR',''].map((h,i)=><div key={i} style={{width:i===0||i===4?28:i===3?36:undefined,flex:i===1||i===2?1:undefined,fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.4)',textTransform:'uppercase',letterSpacing:0.5}}>{h}</div>)}
            </div>
            {exercise.completedSets.map((s,i)=><SetRow key={i} idx={i} target={{weight:exercise.weight,reps:exercise.reps,rir:exercise.rir}} completed={s} onComplete={(data)=>onCompleteSet(i,data)} accent={accent}/>)}
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button onClick={()=>onUpdate({completedSets:[...exercise.completedSets,null]})} style={{flex:1,height:34,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:8,color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:12,fontWeight:500,cursor:'pointer'}}>+ Agregar serie</button>
              <button onClick={onRemove} style={{width:34,height:34,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:8,color:'rgba(245,245,240,0.5)',fontFamily:'Inter',fontSize:14,cursor:'pointer'}}>−</button>
            </div>
            <input type="text" placeholder="Notas…" value={exercise.notes} onChange={(e)=>onUpdate({notes:e.target.value})} onClick={(e)=>e.stopPropagation()}
              style={{width:'100%',marginTop:10,height:32,background:'transparent',border:0,borderTop:'0.5px solid #141414',color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:12,paddingTop:8,outline:'none'}}/>
          </div>
        )}
      </div>
    </div>
  );
}
function SetRow({idx,target,completed,onComplete,accent}) {
  const [weight,setWeight]=useState(completed?.weight??target.weight);
  const [reps,setReps]=useState(completed?.reps??'');
  const [rir,setRir]=useState(completed?.rir??'');
  const done=!!completed;
  return (
    <div style={{display:'flex',gap:6,alignItems:'center',padding:'6px 0',opacity:done?0.6:1}}>
      <div style={{width:28}}><MonoNumber size={12} color={done?accent:'rgba(245,245,240,0.5)'}>{idx+1}</MonoNumber></div>
      <SetInput value={weight} onChange={setWeight} placeholder={String(target.weight)} disabled={done}/>
      <SetInput value={reps} onChange={setReps} placeholder={String(target.reps)} disabled={done}/>
      <div style={{width:36}}><SetInput value={rir} onChange={setRir} placeholder={String(target.rir)} disabled={done}/></div>
      <button onClick={(e)=>{e.stopPropagation();if(done)return;onComplete({weight:Number(weight)||target.weight,reps:Number(reps)||0,rir:Number(rir)||0});}}
        style={{width:28,height:28,borderRadius:6,background:done?accent:'#141414',border:done?'none':'0.5px solid #1f1f1f',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
        {done?<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-7" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            :<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-5" stroke="rgba(245,245,240,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>
    </div>
  );
}
function SetInput({value,onChange,placeholder,disabled}) {
  return <input type="text" inputMode="decimal" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled} onClick={(e)=>e.stopPropagation()}
    style={{flex:1,height:32,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:6,color:'#f5f5f0',fontFamily:'ui-monospace,monospace',fontSize:13,fontWeight:500,textAlign:'center',outline:'none',padding:0,width:'100%'}}/>;
}
function RestTimer({timer,now,accent,onSkip,onAdd}) {
  const elapsed=Math.floor((now-timer.start)/1000);
  const remaining=Math.max(0,timer.duration-elapsed);
  const pct=Math.min(100,(elapsed/timer.duration)*100);
  const done=remaining===0;
  return (
    <div style={{background:'#0a0a0a',border:'0.5px solid #1f1f1f',borderRadius:12,padding:'10px 12px',marginBottom:10,display:'flex',alignItems:'center',gap:10,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:`${pct}%`,background:done?'rgba(245,245,240,0.06)':'rgba(245,245,240,0.025)',transition:'width .5s linear'}}/>
      <div style={{position:'relative',display:'flex',alignItems:'center',gap:8,flex:1}}><Label>Descanso</Label><MonoNumber size={20} color={done?accent:'#f5f5f0'}>{String(Math.floor(remaining/60)).padStart(1,'0')}:{String(remaining%60).padStart(2,'0')}</MonoNumber></div>
      <div style={{position:'relative',display:'flex',gap:6}}>
        <button onClick={onAdd} style={{background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:6,padding:'6px 10px',color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:11,cursor:'pointer'}}>+30s</button>
        <button onClick={onSkip} style={{background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:6,padding:'6px 10px',color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:11,cursor:'pointer'}}>Saltar</button>
      </div>
    </div>
  );
}
function SheetOverlay({children,onClose,title,subtitle}) {
  return (
    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',zIndex:100,display:'flex',alignItems:'flex-end'}} onClick={onClose}>
      <div onClick={(e)=>e.stopPropagation()} style={{width:'100%',background:'#000',borderRadius:'20px 20px 0 0',borderTop:'0.5px solid #2a2a2a',maxHeight:'88%',display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',justifyContent:'center',padding:'8px 0 0'}}><div style={{width:36,height:4,borderRadius:2,background:'rgba(245,245,240,0.15)'}}/></div>
        <div style={{padding:'12px 20px 14px'}}><Label>{subtitle}</Label><div style={{fontFamily:'Inter',fontSize:18,fontWeight:600,color:'#f5f5f0',marginTop:4}}>{title}</div></div>
        <div style={{overflow:'auto',flex:1}}>{children}</div>
      </div>
    </div>
  );
}
function SwapSheet({exercise,onSwap,onClose,accent}) {
  const ex=getExercise(exercise.exId);
  const alts=(ex?.alts||[]).map((id)=>({id,...getExercise(id)})).filter((e)=>e.name);
  return (
    <SheetOverlay onClose={onClose} title="Cambiar ejercicio" subtitle={`${ex?.name||''} · alternativas`}>
      <div style={{display:'flex',flexDirection:'column',gap:6,padding:'4px 16px 16px'}}>
        {alts.length===0&&<div style={{padding:'24px 8px',textAlign:'center',color:'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:12}}>Sin alternativas registradas.</div>}
        {alts.map((a,i)=>(
          <button key={a.id} onClick={()=>onSwap(a.id)} style={{background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,padding:'14px 16px',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:12}}>
            <MonoNumber size={11} color={i===0?accent:'rgba(245,245,240,0.4)'}>{i===0?'TOP':String(i+1).padStart(2,'0')}</MonoNumber>
            <div style={{flex:1}}><div style={{fontFamily:'Inter',fontSize:14,fontWeight:500,color:'#f5f5f0'}}>{a.name}</div><div style={{display:'flex',gap:6,marginTop:3}}><span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:0.5}}>{a.muscle}</span><span style={{color:'rgba(245,245,240,0.2)'}}>·</span><span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:0.5}}>{a.equipment}</span></div></div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 1l5 5-5 5" stroke="rgba(245,245,240,0.4)" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        ))}
      </div>
    </SheetOverlay>
  );
}
function AddSheet({onAdd,onClose,accent}) {
  const [mode,setMode]=useState('search');
  const [query,setQuery]=useState('');
  const [selectedId,setSelectedId]=useState(null);
  const allDb=useMemo(()=>({...EXERCISES,...CUSTOM_EXERCISES}),[mode]);
  const result=useMemo(()=>searchExercises(query,allDb),[query,allDb]);
  if (mode==='custom') return <CustomExerciseSheet initialName={query} onClose={onClose} onCreate={(id)=>onAdd(id)} onBack={()=>setMode('search')} accent={accent}/>;
  if (mode==='confirm'&&selectedId) return <ConfirmExerciseSheet exId={selectedId} onClose={onClose} onBack={()=>{setMode('search');setSelectedId(null);}} onAdd={onAdd} accent={accent}/>;
  return (
    <SheetOverlay onClose={onClose} title="Agregar ejercicio" subtitle="Buscá por nombre, músculo o equipo">
      <div style={{padding:'0 16px 12px'}}>
        <div style={{position:'relative'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{position:'absolute',left:14,top:13,pointerEvents:'none'}}><circle cx="6" cy="6" r="4.5" stroke="rgba(245,245,240,0.4)" strokeWidth="1.2"/><path d="M9.5 9.5L13 13" stroke="rgba(245,245,240,0.4)" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <input autoFocus value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Ej: press banca, dominadas, sentadilla…"
            style={{width:'100%',height:40,background:'#0a0a0a',border:'0.5px solid #1f1f1f',borderRadius:10,padding:'0 14px 0 36px',color:'#f5f5f0',fontFamily:'Inter',fontSize:14,outline:'none'}}/>
        </div>
      </div>
      <div style={{padding:'0 16px 16px',maxHeight:380,overflow:'auto'}}>
        {result.type==='empty'&&<PopularList onPick={(id)=>{setSelectedId(id);setMode('confirm');}} accent={accent}/>}
        {result.type==='matches'&&(<><div style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.4)',textTransform:'uppercase',letterSpacing:0.6,padding:'4px 4px 8px'}}>{result.hits.length} coincidencias</div><div style={{display:'flex',flexDirection:'column',gap:4}}>{result.hits.map(({id})=>{const ex=getExercise(id);return <ResultRow key={id} ex={ex} onClick={()=>{setSelectedId(id);setMode('confirm');}}/>;})}</div><CustomCTA query={query} onClick={()=>setMode('custom')} accent={accent}/></>)}
        {result.type==='no-match'&&(<><div style={{padding:'12px 14px',background:'#0a0a0a',border:'0.5px solid #1f1f1f',borderRadius:10,marginBottom:12}}><div style={{fontFamily:'Inter',fontSize:13,color:'#f5f5f0',marginBottom:4}}>No encontré "<span style={{color:accent}}>{query}</span>".</div><div style={{fontFamily:'Inter',fontSize:11,color:'rgba(245,245,240,0.55)',lineHeight:1.4}}>{result.suggestions.length>0?'¿Quisiste decir alguno de estos?':'Podés agregarlo como personalizado.'}</div></div>{result.suggestions.length>0&&(<div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:4}}>{result.suggestions.map(({id})=>{const ex=getExercise(id);return <ResultRow key={id} ex={ex} reason={suggestionReason(query,id,allDb)} accent={accent} onClick={()=>{setSelectedId(id);setMode('confirm');}}/>;})}</div>)}<CustomCTA query={query} onClick={()=>setMode('custom')} accent={accent} primary/></>)}
      </div>
    </SheetOverlay>
  );
}
function ResultRow({ex,reason,accent,onClick}) {
  if (!ex) return null;
  return (
    <button onClick={onClick} style={{background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:10,padding:'11px 12px',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:'Inter',fontSize:13,color:'#f5f5f0',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ex.name}</div>
        <div style={{display:'flex',gap:6,marginTop:3,alignItems:'center'}}>
          <span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:0.5}}>{ex.muscle}</span>
          <span style={{color:'rgba(245,245,240,0.2)'}}>·</span>
          <span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:0.5}}>{ex.equipment}</span>
          {reason&&<><span style={{color:'rgba(245,245,240,0.2)'}}>·</span><span style={{fontFamily:'Inter',fontSize:10,color:accent||'rgba(245,245,240,0.7)',fontStyle:'italic'}}>{reason}</span></>}
        </div>
      </div>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 1l4 4-4 4" stroke="rgba(245,245,240,0.4)" strokeWidth="1.4" strokeLinecap="round"/></svg>
    </button>
  );
}
function CustomCTA({query,onClick,accent,primary}) {
  return (
    <button onClick={onClick} style={{width:'100%',marginTop:12,padding:'12px 14px',background:primary?'rgba(245,245,240,0.04)':'transparent',border:primary?`0.5px solid ${accent}`:'0.5px dashed rgba(245,245,240,0.2)',borderRadius:10,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
      <div><div style={{fontFamily:'Inter',fontSize:13,fontWeight:500,color:primary?accent:'rgba(245,245,240,0.8)'}}>+ Agregar como personalizado</div><div style={{fontFamily:'Inter',fontSize:11,color:'rgba(245,245,240,0.45)',marginTop:2}}>{query?`"${query}" se guarda en tu lista`:'Creá tu propio ejercicio'}</div></div>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 1l4 4-4 4" stroke={primary?accent:'rgba(245,245,240,0.5)'} strokeWidth="1.4" strokeLinecap="round"/></svg>
    </button>
  );
}
function PopularList({onPick,accent}) {
  const groups=[{label:'Pecho',ids:['press-banca','press-banca-mancuernas','aperturas-mancuernas','flexiones']},{label:'Espalda',ids:['dominadas','jalon-pecho','remo-polea','remo-barra']},{label:'Piernas',ids:['sentadilla-libre','prensa','peso-muerto-rumano','curl-femoral-acostado']},{label:'Hombros',ids:['press-militar-mancuernas','vuelos-laterales','face-pull']},{label:'Brazos',ids:['curl-barra','curl-martillo','extension-polea','press-frances']},{label:'Core',ids:['plancha','crunch-polea','elevacion-piernas-colgado']}];
  return (<div>{groups.map((g)=>(<div key={g.label} style={{marginBottom:14}}><div style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.4)',textTransform:'uppercase',letterSpacing:0.6,padding:'0 4px 6px'}}>{g.label}</div><div style={{display:'flex',flexDirection:'column',gap:4}}>{g.ids.map((id)=>{const ex=getExercise(id);return ex?<ResultRow key={id} ex={ex} onClick={()=>onPick(id)}/>:null;})}</div></div>))}</div>);
}
function ConfirmExerciseSheet({exId,onClose,onBack,onAdd,accent}) {
  const ex=getExercise(exId); if (!ex) return null;
  const diffLabel={beginner:'Principiante',intermediate:'Intermedio',advanced:'Avanzado'}[ex.difficulty]||ex.difficulty;
  return (
    <SheetOverlay onClose={onClose} title={ex.name} subtitle="Confirmar y agregar">
      <div style={{padding:'0 16px 16px'}}>
        <div style={{background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,padding:16}}>
          {[['Músculo principal',ex.muscle,accent],['Músculos secundarios',(ex.secondary||[]).join(', ')||'—',null],['Equipamiento',ex.equipment,null],['Patrón',ex.pattern,null],['Dificultad',diffLabel,null],['Tipo',ex.type,null]].map(([l,v,c],i,arr)=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<arr.length-1?'0.5px solid #141414':'none'}}>
              <span style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:0.5}}>{l}</span>
              <span style={{fontFamily:'Inter',fontSize:13,color:c||'#f5f5f0',textAlign:'right',maxWidth:'60%'}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:8,marginTop:14}}>
          <button onClick={onBack} style={{flex:1,height:44,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:10,color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:13,fontWeight:500,cursor:'pointer'}}>← Volver</button>
          <button onClick={()=>onAdd(exId)} style={{flex:2,height:44,background:accent,border:0,borderRadius:10,color:'#000',fontFamily:'Inter',fontSize:13,fontWeight:600,cursor:'pointer'}}>Agregar a sesión</button>
        </div>
      </div>
    </SheetOverlay>
  );
}
function CustomExerciseSheet({initialName,onClose,onCreate,onBack,accent}) {
  const [step,setStep]=useState(0);
  const [name,setName]=useState(initialName||'');
  const [muscle,setMuscle]=useState('');
  const [secondary,setSecondary]=useState([]);
  const [equipment,setEquipment]=useState('');
  const [difficulty,setDifficulty]=useState('intermediate');
  const [pattern,setPattern]=useState('aislamiento');
  const [created,setCreated]=useState(false);
  const canStep1=name.trim().length>0&&muscle;
  const canCreate=canStep1&&equipment;
  const create=()=>{const id=createCustomExercise({name:name.trim(),muscle,secondary,equipment,difficulty,pattern});setCreated(true);setTimeout(()=>onCreate(id),700);};
  const toggleSecondary=(m)=>setSecondary((prev)=>prev.includes(m)?prev.filter((x)=>x!==m):[...prev,m]);
  if (created) return (<SheetOverlay onClose={onClose} title="Listo" subtitle="Ejercicio personalizado"><div style={{padding:'20px 24px 32px',textAlign:'center'}}><div style={{width:48,height:48,borderRadius:24,background:accent,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16}}><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-10" stroke="#000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div style={{fontFamily:'Inter',fontSize:16,fontWeight:600,color:'#f5f5f0',marginBottom:6}}>"{name}" guardado</div></div></SheetOverlay>);
  return (
    <SheetOverlay onClose={onClose} title="Nuevo ejercicio" subtitle={`Personalizado · paso ${step+1} de 2`}>
      <div style={{padding:'0 16px 16px',maxHeight:460,overflow:'auto'}}>
        {step===0&&(<><div style={{marginBottom:14}}><Label style={{marginBottom:6}}>Nombre</Label><input value={name} onChange={(e)=>setName(e.target.value)} autoFocus placeholder="Ej: Press de banca con pausa" style={{width:'100%',height:40,background:'#0a0a0a',border:'0.5px solid #1f1f1f',borderRadius:10,padding:'0 14px',color:'#f5f5f0',fontFamily:'Inter',fontSize:14,outline:'none'}}/></div><div style={{marginBottom:14}}><Label style={{marginBottom:6}}>Grupo muscular principal</Label><ChipGrid options={MUSCLE_GROUPS} value={muscle} onChange={setMuscle} accent={accent}/></div></>)}
        {step===1&&(<><div style={{marginBottom:14}}><Label style={{marginBottom:6}}>Músculos secundarios</Label><ChipGrid options={MUSCLE_GROUPS.filter((m)=>m!==muscle)} value={secondary} onChange={toggleSecondary} multi accent={accent}/></div><div style={{marginBottom:14}}><Label style={{marginBottom:6}}>Equipamiento</Label><ChipGrid options={EQUIPMENT} value={equipment} onChange={setEquipment} accent={accent}/></div><div style={{marginBottom:14}}><Label style={{marginBottom:6}}>Patrón de movimiento</Label><ChipGrid options={PATTERNS} value={pattern} onChange={setPattern} accent={accent}/></div><div style={{marginBottom:14}}><Label style={{marginBottom:6}}>Dificultad</Label><div style={{display:'flex',gap:6}}>{[{id:'beginner',l:'Principiante'},{id:'intermediate',l:'Intermedio'},{id:'advanced',l:'Avanzado'}].map((d)=>(<button key={d.id} onClick={()=>setDifficulty(d.id)} style={{flex:1,height:36,background:difficulty===d.id?accent:'#0a0a0a',border:difficulty===d.id?'none':'0.5px solid #1a1a1a',color:difficulty===d.id?'#000':'#f5f5f0',borderRadius:8,fontFamily:'Inter',fontSize:12,fontWeight:500,cursor:'pointer'}}>{d.l}</button>))}</div></div></>)}
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <button onClick={step===0?onBack:()=>setStep(0)} style={{flex:1,height:44,background:'#141414',border:'0.5px solid #1f1f1f',borderRadius:10,color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:13,fontWeight:500,cursor:'pointer'}}>← {step===0?'Volver':'Atrás'}</button>
          {step===0?<button disabled={!canStep1} onClick={()=>setStep(1)} style={{flex:2,height:44,background:canStep1?accent:'#1a1a1a',border:0,borderRadius:10,opacity:canStep1?1:0.5,color:canStep1?'#000':'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:13,fontWeight:600,cursor:canStep1?'pointer':'not-allowed'}}>Continuar →</button>
          :<button disabled={!canCreate} onClick={create} style={{flex:2,height:44,background:canCreate?accent:'#1a1a1a',border:0,borderRadius:10,opacity:canCreate?1:0.5,color:canCreate?'#000':'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:13,fontWeight:600,cursor:canCreate?'pointer':'not-allowed'}}>Crear y agregar</button>}
        </div>
      </div>
    </SheetOverlay>
  );
}
function ChipGrid({options,value,onChange,multi,accent}) {
  const isOn=(o)=>multi?value.includes(o):value===o;
  return (<div style={{display:'flex',flexWrap:'wrap',gap:6}}>{options.map((o)=>{const on=isOn(o);return(<button key={o} onClick={()=>onChange(o)} style={{height:30,padding:'0 12px',background:on?accent:'#0a0a0a',border:on?'none':'0.5px solid #1a1a1a',color:on?'#000':'rgba(245,245,240,0.8)',borderRadius:15,fontFamily:'Inter',fontSize:12,fontWeight:500,cursor:'pointer',textTransform:'capitalize'}}>{o}</button>);})}</div>);
}

// ── HISTORY & SETTINGS ────────────────────────────────────────────────────────

function HistoryScreen({history,accent}) {
  const [selected,setSelected]=useState(null);
  const [view,setView]=useState('calendar');
  const firstEx=history[0]?.exercises[0]?.exId||'press-banca';
  const [exFilter,setExFilter]=useState(firstEx);
  return (
    <div style={{height:'100%',overflow:'auto',background:'#000',color:'#f5f5f0',paddingBottom:100}}>
      <Header subtitle="REGISTROS" title="Historial"/>
      <div style={{padding:'0 16px 14px'}}>
        <div style={{display:'flex',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:10,padding:3}}>
          {[{id:'calendar',l:'Calendario'},{id:'progression',l:'Progresión'}].map((v)=>(<button key={v.id} onClick={()=>setView(v.id)} style={{flex:1,height:30,background:view===v.id?'#1a1a1a':'transparent',border:0,borderRadius:7,color:view===v.id?'#f5f5f0':'rgba(245,245,240,0.5)',fontFamily:'Inter',fontSize:12,fontWeight:500,cursor:'pointer'}}>{v.l}</button>))}
        </div>
      </div>
      {view==='calendar'&&<CalendarView history={history} selected={selected} setSelected={setSelected} accent={accent}/>}
      {view==='progression'&&<ProgressionView history={history} exFilter={exFilter} setExFilter={setExFilter} accent={accent}/>}
    </div>
  );
}
function CalendarView({history,selected,setSelected,accent}) {
  const weeks=[];
  const dates=new Map(history.map((h)=>[h.date,h]));
  const todayCopy=new Date(today);
  const startOfWeek=new Date(todayCopy);startOfWeek.setDate(todayCopy.getDate()-todayCopy.getDay());
  for (let w=7;w>=0;w--){const week=[];for (let d=0;d<7;d++){const date=new Date(startOfWeek);date.setDate(startOfWeek.getDate()-w*7+d);const iso=date.toISOString().slice(0,10);week.push({iso,date,session:dates.get(iso),future:date>todayCopy,today:iso===todayCopy.toISOString().slice(0,10)});}weeks.push(week);}
  const sel=selected?dates.get(selected):null;
  return (
    <>
      <div style={{padding:'0 16px 16px'}}>
        <div style={{display:'flex',gap:4,padding:'0 0 8px'}}>{['D','L','M','M','J','V','S'].map((d,i)=><div key={i} style={{flex:1,textAlign:'center',fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.35)'}}>{d}</div>)}</div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {weeks.map((week,wi)=>(<div key={wi} style={{display:'flex',gap:4}}>{week.map((d)=>{const trained=!!d.session;const isSel=d.iso===selected;return(<button key={d.iso} onClick={()=>trained&&setSelected(d.iso)} disabled={!trained} style={{flex:1,aspectRatio:'1',border:0,borderRadius:6,padding:0,background:trained?accent:(d.future?'#050505':'#0a0a0a'),opacity:trained?(isSel?1:0.85):(d.today?1:0.6),boxShadow:isSel?`0 0 0 1.5px ${accent}`:(d.today?`inset 0 0 0 0.5px ${accent}`:'none'),cursor:trained?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'ui-monospace,monospace',fontSize:10,fontWeight:500,color:trained?'#000':'rgba(245,245,240,0.4)'}}>{d.date.getDate()}</button>);})}</div>))}
        </div>
        <div style={{display:'flex',gap:16,padding:'12px 0 0',justifyContent:'center'}}>
          {[{dot:accent,l:'Entrenado'},{dot:'#0a0a0a',l:'Descanso',b:true},{dot:'transparent',l:'Hoy',o:accent}].map(({dot,l,b,o})=>(<div key={l} style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:10,height:10,borderRadius:3,background:dot,border:b?'0.5px solid #1a1a1a':(o?`1px solid ${o}`:'none')}}/><span style={{fontFamily:'Inter',fontSize:10,color:'rgba(245,245,240,0.55)',textTransform:'uppercase',letterSpacing:0.5}}>{l}</span></div>))}
        </div>
      </div>
      {sel?(
        <div style={{padding:'0 16px 16px'}}>
          <Card>
            <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:12}}>
              <div><Label>{fmtDateLong(new Date(sel.date))}</Label><div style={{fontFamily:'Inter',fontSize:18,fontWeight:600,marginTop:4}}>{sel.title}</div></div>
              <div><MonoNumber size={20} color={accent}>{sel.exercises.reduce((s,e)=>s+e.sets.length,0)}</MonoNumber><span style={{fontFamily:'Inter',fontSize:10,color:'rgba(245,245,240,0.4)',marginLeft:4,textTransform:'uppercase',letterSpacing:0.5}}>series</span></div>
            </div>
            {sel.exercises.map((e,i)=>{const ex=getExercise(e.exId);const top=Math.max(...e.sets.map((s)=>s.weight));const totalReps=e.sets.reduce((a,s)=>a+s.reps,0);return(<div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:i<sel.exercises.length-1?'0.5px solid #141414':'none'}}><div style={{flex:1}}><div style={{fontFamily:'Inter',fontSize:13,color:'#f5f5f0'}}>{ex?.name}</div><div style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.45)',marginTop:2,textTransform:'uppercase',letterSpacing:0.5}}>{e.sets.length} series · {totalReps} reps</div></div><MonoNumber size={14}>{top}<span style={{fontSize:10,color:'rgba(245,245,240,0.4)'}}>kg</span></MonoNumber></div>);})}
          </Card>
        </div>
      ):(
        <div style={{padding:'0 16px 16px'}}><div style={{padding:'24px 16px',textAlign:'center',color:'rgba(245,245,240,0.4)',fontFamily:'Inter',fontSize:12}}>Tocá un día entrenado para ver el detalle.</div></div>
      )}
    </>
  );
}
function ProgressionView({history,exFilter,setExFilter,accent}) {
  const exIds=useMemo(()=>{const seen=new Set();history.forEach((s)=>s.exercises.forEach((e)=>seen.add(e.exId)));return [...seen];},[history]);
  const data=progressionFor(history,exFilter);
  const ex=getExercise(exFilter);
  const max=Math.max(...data.map((d)=>d.weight),1);
  const min=Math.min(...data.map((d)=>d.weight));
  const range=Math.max(max-min,1);
  const totalVolume=useMemo(()=>history.map((s)=>{const e=s.exercises.find((x)=>x.exId===exFilter);if(!e)return null;return{date:s.date,vol:e.sets.reduce((a,set)=>a+set.reps*set.weight,0)};}).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date)),[history,exFilter]);
  return (
    <>
      <div style={{padding:'0 16px 14px',display:'flex',gap:6,overflowX:'auto'}}>
        {exIds.map((id)=>(<button key={id} onClick={()=>setExFilter(id)} style={{flexShrink:0,height:28,padding:'0 12px',background:exFilter===id?accent:'#0a0a0a',color:exFilter===id?'#000':'#f5f5f0',border:exFilter===id?'none':'0.5px solid #1a1a1a',borderRadius:14,fontFamily:'Inter',fontSize:11,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap'}}>{getExercise(id)?.name}</button>))}
      </div>
      <div style={{padding:'0 16px 16px'}}>
        <Card>
          <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:4}}><Label>Serie tope · peso</Label><Label>{ex?.muscle}</Label></div>
          <div style={{fontFamily:'Inter',fontSize:18,fontWeight:600,color:'#f5f5f0',marginBottom:4}}>{ex?.name}</div>
          <div style={{display:'flex',alignItems:'baseline',gap:12,marginTop:16}}>
            <div><MonoNumber size={36} color="#f5f5f0">{data.length?data[data.length-1].weight:'—'}</MonoNumber><span style={{fontFamily:'Inter',fontSize:12,color:'rgba(245,245,240,0.4)',marginLeft:4}}>kg</span></div>
            {data.length>1&&<span style={{fontFamily:'ui-monospace,monospace',fontSize:11,color:accent,fontWeight:500}}>+{(data[data.length-1].weight-data[0].weight).toFixed(1)}kg</span>}
          </div>
          <div style={{height:120,marginTop:18,position:'relative'}}>
            <svg viewBox="0 0 300 120" width="100%" height="120" style={{overflow:'visible'}}>
              {[0,0.5,1].map((p)=><line key={p} x1="0" y1={p*100+10} x2="300" y2={p*100+10} stroke="#141414" strokeWidth="0.5"/>)}
              {data.length>1&&(()=>{const pts=data.map((d,i)=>{const x=(i/(data.length-1))*290+5;const y=110-((d.weight-min)/range)*95;return [x,y];});const path=pts.map(([x,y],i)=>`${i===0?'M':'L'} ${x} ${y}`).join(' ');const area=`${path} L ${pts[pts.length-1][0]} 115 L ${pts[0][0]} 115 Z`;return(<><defs><linearGradient id="grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.18"/><stop offset="100%" stopColor={accent} stopOpacity="0"/></linearGradient></defs><path d={area} fill="url(#grad)"/><path d={path} stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>{pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===pts.length-1?3:1.5} fill={accent}/>)}</>);})()} 
            </svg>
          </div>
          <div style={{marginTop:14,paddingTop:14,borderTop:'0.5px solid #141414',display:'flex',justifyContent:'space-between'}}>
            {[['Sesiones',data.length],['Volumen total',`${Math.round(totalVolume.reduce((a,v)=>a+v.vol,0)).toLocaleString('es-AR')}kg`],['Mejor serie',`${data.length?Math.max(...data.map((d)=>d.weight)):0}kg`]].map(([l,v])=>(<div key={l}><Label style={{marginBottom:4}}>{l}</Label><div style={{fontFamily:'ui-monospace,monospace',fontSize:14,fontWeight:500,color:'#f5f5f0',fontVariantNumeric:'tabular-nums'}}>{v}</div></div>))}
          </div>
        </Card>
      </div>
    </>
  );
}
function SettingsScreen({profile,setProfile,accent}) {
  const goalLabels={fuerza:'Fuerza',hipertrofia:'Hipertrofia',resistencia:'Resistencia',general:'Estado físico general'};
  const expLabels={principiante:'Principiante',intermedio:'Intermedio',avanzado:'Avanzado'};
  const splits={2:'Cuerpo completo, 2× por semana',3:'Cuerpo completo, 3× por semana',4:'Tren superior / inferior, 2× cada uno',5:'Empuje / Tracción / Piernas / Superior / Inferior',6:'Empuje / Tracción / Piernas, 2× cada uno'};
  const repHint={fuerza:'5–7 reps, ~85% 1RM',hipertrofia:'6–12 reps, RIR 1–3',resistencia:'15+ reps, RIR 0–2',general:'rangos mixtos'};
  return (
    <div style={{height:'100%',overflow:'auto',background:'#000',color:'#f5f5f0',paddingBottom:100}}>
      <Header subtitle="PERFIL" title="Ajustes"/>
      {[{title:'Objetivo',rows:[['Objetivo principal',goalLabels[profile.goal]||profile.goal],['Frecuencia',`${profile.frequency} días/sem`],['Experiencia',expLabels[profile.experience]||profile.experience]]}].map(({title,rows})=>(<div key={title} style={{marginBottom:8}}><div style={{padding:'14px 20px 6px'}}><Label>{title}</Label></div><div style={{margin:'0 16px',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,overflow:'hidden'}}>{rows.map(([l,v],i)=>(<div key={l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:i<rows.length-1?'0.5px solid #141414':'none'}}><span style={{fontFamily:'Inter',fontSize:14,color:'#f5f5f0'}}>{l}</span><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontFamily:'Inter',fontSize:13,color:'rgba(245,245,240,0.5)'}}>{v}</span><svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1l4 4-4 4" stroke="rgba(245,245,240,0.3)" strokeWidth="1.4" strokeLinecap="round"/></svg></div></div>))}</div></div>))}
      <div style={{marginBottom:8}}><div style={{padding:'14px 20px 6px'}}><Label>Split actual</Label></div><div style={{margin:'0 16px',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,padding:'14px 16px'}}><div style={{fontFamily:'Inter',fontSize:14,color:'#f5f5f0',marginBottom:8}}>{splits[profile.frequency]}</div><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{profile.priorities.map((p,i)=><span key={p} style={{fontFamily:'ui-monospace,monospace',fontSize:10,color:'rgba(245,245,240,0.7)',background:'rgba(245,245,240,0.05)',padding:'4px 8px',borderRadius:4,textTransform:'uppercase',letterSpacing:0.5}}>{String(i+1).padStart(2,'0')} {p}</span>)}</div></div></div>
      <div style={{marginBottom:8}}><div style={{padding:'14px 20px 6px'}}><Label>Lógica de sugerencias</Label></div><div style={{margin:'0 16px',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,padding:'14px 16px',fontFamily:'Inter',fontSize:12,color:'rgba(245,245,240,0.6)',lineHeight:1.6}}>Las sesiones se sugieren en base a:<ul style={{margin:'8px 0 0',paddingLeft:16,color:'rgba(245,245,240,0.7)'}}><li>Músculos entrenados en las últimas 48–72h</li><li>Frecuencia objetivo ({profile.frequency}× / semana)</li><li>{goalLabels[profile.goal]} → {repHint[profile.goal]}</li><li>Rotación entre zonas prioritarias</li></ul></div></div>
      <div style={{marginBottom:8}}><div style={{padding:'14px 20px 6px'}}><Label>Preferencias</Label></div><div style={{margin:'0 16px',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,overflow:'hidden'}}>{[['Auto-iniciar timer de descanso',true],['Vibración al completar serie',true],['Mostrar campo RIR',true]].map(([l,v],i)=><SettingsToggle key={l} label={l} value={v} last={i===2}/>)}</div></div>
    </div>
  );
}
function SettingsToggle({label,value,last}) {
  const [on,setOn]=useState(value);
  return (<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:last?'none':'0.5px solid #141414'}}><span style={{fontFamily:'Inter',fontSize:14,color:'#f5f5f0'}}>{label}</span><button onClick={()=>setOn(!on)} style={{width:38,height:22,borderRadius:999,border:0,background:on?'#f5f5f0':'rgba(245,245,240,0.15)',position:'relative',cursor:'pointer',padding:0,transition:'background .15s'}}><div style={{position:'absolute',top:2,left:on?18:2,width:18,height:18,borderRadius:9,background:on?'#000':'#fff',transition:'left .15s'}}/></button></div>);
}
function TrainPicker({accent,onStart,onFreestyle,onOnboarding}) {
  return (
    <div style={{height:'100%',overflow:'auto',background:'#000',color:'#f5f5f0',paddingBottom:100}}>
      <Header subtitle="EMPEZAR" title="Entrenar"/>
      <div style={{padding:'0 16px 12px'}}>
        <div style={{fontFamily:'Inter',fontSize:12,color:'rgba(245,245,240,0.5)',marginBottom:12,lineHeight:1.4}}>Elegí una plantilla de sesión, o entrená libre y registrá sobre la marcha.</div>
        {Object.entries(SUGGESTED_SESSIONS).map(([key,s])=>(<button key={key} onClick={()=>onStart(key)} style={{width:'100%',textAlign:'left',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,padding:'14px 16px',cursor:'pointer',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><div><div style={{fontFamily:'Inter',fontSize:16,fontWeight:600,color:'#f5f5f0'}}>{s.title}</div><div style={{display:'flex',gap:6,marginTop:4}}>{s.primary.map((m)=><span key={m} style={{fontFamily:'ui-monospace,monospace',fontSize:9,color:'rgba(245,245,240,0.5)',textTransform:'uppercase',letterSpacing:0.5}}>{m}</span>)}</div></div><div style={{display:'flex',alignItems:'center',gap:10}}><MonoNumber size={11} color="rgba(245,245,240,0.4)">{s.exercises.length} EJ</MonoNumber><svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M1 1l6 5-6 5" stroke="rgba(245,245,240,0.4)" strokeWidth="1.5" strokeLinecap="round"/></svg></div></button>))}
        <button onClick={onFreestyle} style={{width:'100%',height:48,marginTop:4,background:'transparent',border:'0.5px dashed rgba(245,245,240,0.2)',borderRadius:12,color:'rgba(245,245,240,0.7)',fontFamily:'Inter',fontSize:13,fontWeight:500,cursor:'pointer'}}>+ Sesión libre</button>
        <div style={{marginTop:24}}><Label style={{marginBottom:8}}>Demo</Label><button onClick={onOnboarding} style={{width:'100%',height:40,background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:10,color:'rgba(245,245,240,0.65)',fontFamily:'Inter',fontSize:12,cursor:'pointer'}}>Repetir flujo de onboarding</button></div>
      </div>
    </div>
  );
}
function FinishSummary({accent,onDone}) {
  return (
    <div style={{height:'100%',background:'#000',color:'#f5f5f0',display:'flex',flexDirection:'column'}}>
      <div style={{flex:1,padding:'80px 24px 24px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:56,height:56,borderRadius:28,background:accent,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-12" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        <Label style={{marginBottom:8}}>Sesión completada</Label>
        <div style={{fontFamily:'Inter',fontSize:24,fontWeight:600,letterSpacing:-0.5,marginBottom:32,textAlign:'center'}}>Registrada.</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,width:'100%',maxWidth:320}}>
          {[['Duración','48','min'],['Series','14',''],['Volumen','2.4','kt']].map(([l,v,u])=>(<div key={l}><Label style={{marginBottom:6}}>{l}</Label><div style={{display:'flex',alignItems:'baseline',gap:3}}><MonoNumber size={26} color="#f5f5f0">{v}</MonoNumber><span style={{fontFamily:'Inter',fontSize:11,color:'rgba(245,245,240,0.5)'}}>{u}</span></div></div>))}
        </div>
        <div style={{marginTop:32,padding:'14px 16px',background:'#0a0a0a',border:'0.5px solid #1a1a1a',borderRadius:12,width:'100%',maxWidth:320}}><Label style={{marginBottom:6}}>Próximo</Label><div style={{fontFamily:'Inter',fontSize:13,color:'rgba(245,245,240,0.7)',lineHeight:1.4}}>Tracción en cola para mañana. Piernas en 48h.</div></div>
      </div>
      <div style={{padding:'0 24px 40px'}}><Button accent={accent} onClick={onDone}>Listo</Button></div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────

const ACCENT_PRESETS=[
  {c:'#f5f5f0',l:'Off-white'},{c:'#d8ff3d',l:'Volt'},{c:'#ff5b2e',l:'Brasa'},
  {c:'#7c5cff',l:'Iris'},{c:'#3dd6a8',l:'Menta'},
];

export default function App() {
  const [accent,setAccent]=useState('#d8ff3d');
  const [view,setView]=useState('app');
  const [profile,setProfile]=useState({name:'',goal:'hipertrofia',priorities:['pecho','espalda','piernas','hombros','brazos'],frequency:4,experience:'intermedio'});
  const [tab,setTab]=useState('home');
  const [sessionState,setSessionState]=useState(null);
  const [history]=useState(MOCK_HISTORY);
  const [showOnboarding,setShowOnboarding]=useState(true);

  const startSession=(sessionKey)=>{setSessionState({sessionKey,freestyle:false});setView('session');};
  const startFreestyle=()=>{setSessionState({sessionKey:null,freestyle:true});setView('session');};
  const finishSession=()=>setView('finish');
  const cancelSession=()=>{setSessionState(null);setView('app');};
  const dismissFinish=()=>{setSessionState(null);setView('app');setTab('home');};

  const inner=(
    <div style={{height:'100%',position:'relative',background:'#000'}}>
      {showOnboarding?(
        <Onboarding accent={accent} onComplete={(d)=>{setProfile(d);setShowOnboarding(false);}}/>
      ):view==='session'?(
        <SessionScreen sessionKey={sessionState.sessionKey} freestyle={sessionState.freestyle} accent={accent} onFinish={finishSession} onCancel={cancelSession}/>
      ):view==='finish'?(
        <FinishSummary accent={accent} onDone={dismissFinish}/>
      ):(
        <>
          {tab==='home'&&<HomeScreen profile={profile} history={history} accent={accent} onStartSession={startSession} onStartFreestyle={startFreestyle}/>}
          {tab==='session'&&<TrainPicker accent={accent} onStart={startSession} onFreestyle={startFreestyle} onOnboarding={()=>setShowOnboarding(true)}/>}
          {tab==='history'&&<HistoryScreen history={history} accent={accent}/>}
          {tab==='settings'&&<SettingsScreen profile={profile} setProfile={setProfile} accent={accent}/>}
          <TabBar active={tab} onChange={setTab} accent={accent}/>
        </>
      )}
    </div>
  );

  return <AppShell accent={accent} setAccent={setAccent}>{inner}</AppShell>;
}
