import React, { useMemo, useState } from 'react';

export default function App() {
  const [step, setStep] = useState(0);
  const [solution, setSolution] = useState(0);
  const [photos, setPhotos] = useState({});
  const [error, setError] = useState('');
  const [data, setData] = useState({
    affaire: 'EDF-RUN-001', client: 'EDF', site: 'Saint-Denis', technicien: 'Technicien SECAB',
    rm: '30', rn: '50', rc: '14', coeff: '', distance: '8', resistivite: '220',
    sol: 'Normal', terrain: 'Terre', meteo: 'Sec',
    masses: false, cloture: false, canalisation: false, cableArme: false, ferraillage: false,
    rm2: '', rn2: '', rc2: '', coeff2: '', rm3: '', rn3: '', rc3: '',
    beton: true, enrobe: false, bitume: false, terre: false, dallage: false, paves: false,
    longBeton: '4', largBeton: '0.60', profBeton: '0.15',
    longEnrobe: '', largEnrobe: '', profEnrobe: '',
    longBitume: '', largBitume: '', profBitume: '',
    longTerre: '', largTerre: '', profTerre: '',
    longDallage: '', largDallage: '', profDallage: '',
    longPaves: '', largPaves: '', profPaves: '',
    travauxARealiser: '', travauxRealises: '', emails: ''
  });

  const steps = [
    ['Accueil','🏠'], ['Chantier + GPS','📍'], ['Mesures','📷'], ['Diagnostic','🧠'], ['Solutions','🥇'], ['Améliorer RM','⚡'], ['Améliorer RN','🔵'], ['Recalcul','🔁'], ['Plan d’action','🚧'], ['Rapport + mail','📄']
  ];

  const n = v => Number(String(v || '').replace(',', '.')) || 0;
  const update = (k,v) => setData(d => ({...d,[k]:v}));
  const K_TARGET = 0.15;

  const kInitial = useMemo(() => {
    if (data.coeff) return n(data.coeff);
    return n(data.rn) ? n(data.rc) / n(data.rn) : 0;
  }, [data.coeff, data.rn, data.rc]);

  const kAfter1 = useMemo(() => n(data.rn2 || data.rn) ? n(data.rc2 || data.rc) / n(data.rn2 || data.rn) : 0, [data.rn2, data.rc2, data.rn, data.rc]);
  const kFinal = useMemo(() => n(data.rn3 || data.rn2 || data.rn) ? n(data.rc3 || data.rc2 || data.rc) / n(data.rn3 || data.rn2 || data.rn) : 0, [data.rn3, data.rc3, data.rn2, data.rc2, data.rn, data.rc]);

  const rho = n(data.resistivite);
  const resistiviteExtreme = rho >= 1000;
  const resistiviteTresForte = rho >= 800;
  const rmTarget = rho > 800 ? 10 : rho > 300 ? 15 : 20;
  const rnTarget = 50;
  const rcTarget = n(data.rn) * K_TARGET;
  const rcTargetAfter1 = n(data.rn2 || data.rn) * K_TARGET;
  const rcToReduce = Math.max(0, n(data.rc) - rcTarget);

  const apportTerreVegetale = resistiviteExtreme
    ? 'Résistivité extrêmement forte : aucune prise de terre superficielle seule ne doit être considérée comme suffisante. Prévoir forage/piquet profond + remblai conducteur ou apport de terre végétale adaptée en complément, puis valider uniquement par mesures.'
    : resistiviteTresForte
      ? 'Résistivité très forte : forage/piquet profond prioritaire. Apport de terre végétale ou remblai conducteur recommandé en complément des tranchées/cuivre nu/piquets.'
      : rho > 300
        ? 'Résistivité élevée : apport de terre végétale recommandé si terrain sec, rocheux ou remblayé, en complément du cuivre nu 25 mm² ou des piquets.'
        : 'Résistivité acceptable : apport de terre végétale non prioritaire, sauf sol excavé sec, caillouteux ou remblayé.';

  const after1Base = {
    rm: n(data.rm2) || n(data.rm),
    rn: n(data.rn2) || n(data.rn),
    rc: n(data.rc2) || n(data.rc),
    k: kAfter1 || kInitial
  };

  const volumes = {
    beton: (n(data.longBeton)*n(data.largBeton)*n(data.profBeton)).toFixed(3),
    enrobe: (n(data.longEnrobe)*n(data.largEnrobe)*n(data.profEnrobe)).toFixed(3),
    bitume: (n(data.longBitume)*n(data.largBitume)*n(data.profBitume)).toFixed(3),
    terre: (n(data.longTerre)*n(data.largTerre)*n(data.profTerre)).toFixed(3),
    dallage: (n(data.longDallage)*n(data.largDallage)*n(data.profDallage)).toFixed(3),
    paves: (n(data.longPaves)*n(data.largPaves)*n(data.profPaves)).toFixed(3),
  };

  const diagnostic = useMemo(() => {
    const proche = n(data.distance) > 0 && n(data.distance) < 10;
    const parasites = data.masses || data.cloture || data.canalisation || data.cableArme || data.ferraillage;
    const solDifficile = rho > 300 || data.terrain === 'Rocheux' || data.sol === 'Sec / résistant';
    const solConducteur = data.sol === 'Très conducteur / humide' || data.meteo === 'Humide / pluie récente';
    const coeffMauvais = kInitial > 0.15;
    const causes = [];
    if (coeffMauvais) causes.push(`Coefficient K = ${kInitial.toFixed(3)} > 0,15 : RC doit descendre à ${rcTarget.toFixed(2)} Ω maximum.`);
    if (n(data.rm) > rmTarget) causes.push(`RM initiale = ${data.rm} Ω : objectif RM ≈ ${rmTarget} Ω.`);
    if (n(data.rn) > rnTarget) causes.push(`RN initiale = ${data.rn} Ω : objectif RN ≤ ${rnTarget} Ω.`);
    if (proche) causes.push('Distance RM/RN faible : priorité au découplage avant la baisse des ohms.');
    if (parasites) causes.push('Liaison parasite possible : contrôle de continuité obligatoire.');
    if (solDifficile) causes.push('Sol difficile / résistivité élevée : piquet profond ou forage à privilégier.');
    if (solConducteur) causes.push('Sol conducteur/humide : priorité à la distance et à la géométrie.');
    if (resistiviteExtreme) causes.push('Résistivité extrêmement forte : aucune prise de terre superficielle seule ne doit être considérée efficace.');
    if (!causes.length) causes.push('Situation favorable ou données à compléter.');
    return { proche, parasites, solDifficile, solConducteur, coeffMauvais, causes };
  }, [data, rho, kInitial, rcTarget, rmTarget]);

  const prises = useMemo(() => {
    const list = [];
    if (diagnostic.coeffMauvais || diagnostic.proche || diagnostic.solConducteur) {
      list.push({
        name: 'Patte d’oie déportée', tag: '🥇 Plus efficace', type: 'patte',
        initial: `RM mesurée : ${data.rm || '—'} Ω / RC mesuré : ${data.rc || '—'} Ω`,
        target: `Objectif : RM ≤ ${rmTarget} Ω / RC ≤ ${rcTarget.toFixed(2)} Ω / K ≤ 0,15`,
        detail: `Cuivre nu 25 mm², 3 branches de 10 à 12 m, profondeur 0,5 à 0,8 m, orientées à l’opposé de RN. Piquets 2 m en extrémité si possible. ${apportTerreVegetale}`,
        formula: 'K = RC / RN : réduire RC par distance + géométrie.'
      });
    }
    if (!diagnostic.solDifficile) {
      list.push({
        name: 'Piquets espacés + cuivre nu', tag: '🥈 Compatible', type: 'piquets',
        initial: `RM mesurée : ${data.rm || '—'} Ω`,
        target: `Objectif : RM ≤ ${rmTarget} Ω puis contrôle K ≤ 0,15`,
        detail: `2 à 4 piquets de 2 m reliés par cuivre nu 25 mm². Espacement minimal = longueur du piquet, idéalement 2 × longueur. ${apportTerreVegetale}`,
        formula: 'Réq = 1 / (1/R1 + 1/R2 + ...).'
      });
    }
    list.push({
      name: 'Cuivre nu enterré linéaire', tag: '✅ Complément', type: 'lineaire',
      initial: `RM mesurée : ${data.rm || '—'} Ω`,
      target: `Objectif : RM ≤ ${rmTarget} Ω sans augmenter le couplage`,
      detail: `Cuivre nu 25 mm² enterré sur 10 à 30 m, orienté latéralement ou à l’opposé de RN. ${apportTerreVegetale}`,
      formula: 'R ≈ ρ / L développée.'
    });
    if (diagnostic.solDifficile) {
      list.unshift({
        name: 'Piquet profond / forage', tag: '🥇 Plus efficace sol difficile', type: 'profond',
        initial: `RM mesurée : ${data.rm || '—'} Ω / résistivité : ${data.resistivite || '—'} Ω.m`,
        target: `Objectif : RM ≤ ${rmTarget} Ω puis contrôle RC ≤ ${rcTarget.toFixed(2)} Ω`,
        detail: resistiviteExtreme
          ? 'Piquet profond / forage obligatoire à privilégier. Aucune prise superficielle seule n’est considérée suffisante. Remblai conducteur ou terre végétale adaptée uniquement en complément, avec mesure à chaque étape.'
          : `Piquet rallongeable ou forage. Démarrer à 2 m puis rallonger par pas de 1 à 2 m avec mesure après chaque rallonge. ${apportTerreVegetale}`,
        formula: 'Rpiquet ≈ ρ / (2πL) × ln(4L/d).'
      });
    }
    if (n(data.rn) > rnTarget) {
      list.push({
        name: 'Renforcement RN éloigné de RM', tag: '⚡ Si RN mauvaise', type: 'rn',
        initial: `RN mesurée : ${data.rn || '—'} Ω`,
        target: `Objectif : RN ≤ ${rnTarget} Ω avec contrôle K ≤ 0,15`,
        detail: `Créer ou renforcer RN à distance de RM. Ne pas renforcer RN côté RM si le coefficient est mauvais. ${apportTerreVegetale}`,
        formula: 'Réq = 1 / (1/R1 + 1/R2 + ...), puis K = RC / RN.'
      });
    }
    return list;
  }, [diagnostic, data, rmTarget, rnTarget, rcTarget, apportTerreVegetale, resistiviteExtreme]);

  const solutions = useMemo(() => {
    const initial = `RM ${data.rm || '—'} Ω • RN ${data.rn || '—'} Ω • RC ${data.rc || '—'} Ω • K ${kInitial ? kInitial.toFixed(3) : '—'}`;
    const target = `RM ≤ ${rmTarget} Ω • RN ≤ ${rnTarget} Ω • RC ≤ ${rcTarget.toFixed(2)} Ω • K ≤ 0,15`;
    const complementBase = `Base reprise après amélioration 1 : RM ${after1Base.rm} Ω • RN ${after1Base.rn} Ω • RC ${after1Base.rc} Ω • K ${after1Base.k.toFixed(3)}`;
    const complementTarget = `Compléter jusqu’à RM ≤ ${rmTarget} Ω • RN ≤ ${rnTarget} Ω • RC ≤ ${rcTargetAfter1.toFixed(2)} Ω • K ≤ 0,15`;
    return [
      { title: diagnostic.solDifficile ? 'Forage / piquet profond + découplage' : 'Patte d’oie déportée + découplage RM/RN', badge: '🥇 Recommandée', initial, target, why: 'On traite d’abord le couplage, car une très bonne terre peut rester mauvaise si elle influence RN.', earths: prises.slice(0,2), rm: ['Implanter la RM à l’opposé de RN.', 'Poser cuivre nu 25 mm² selon le schéma.', 'Ajouter piquets 2 m en extrémité si possible.', 'Mesurer RM/RN/RC après chaque ajout.'], rn: ['Ne pas renforcer RN côté RM.', 'Vérifier connexions RN.', 'Si RN mauvaise, renforcer RN à distance de RM.']},
      { title: 'Piquets espacés + cuivre nu 25 mm²', badge: '🥈 Alternative', initial: `RM initiale ${data.rm || '—'} Ω • K initial ${kInitial ? kInitial.toFixed(3) : '—'}`, target: `RM cible ≤ ${rmTarget} Ω avec contrôle K ≤ 0,15`, why: 'Compatible si la distance avec RN reste suffisante et si le sol n’est pas trop résistant.', earths: prises.filter(p=>p.name.includes('Piquets')||p.name.includes('Cuivre')), rm: ['Planter 2 à 4 piquets espacés.', 'Relier en cuivre nu 25 mm².', 'Éviter l’axe vers RN.', 'Recalculer K.'], rn: ['RN inchangée si correcte.', 'Renforcer RN uniquement si valeur mauvaise.', 'Implanter à distance de RM.']},
      { title: 'Amélioration complémentaire automatique', badge: '🥉 Complément', initial: complementBase, target: complementTarget, why: 'Si la première amélioration ne suffit pas, la suite reprend les valeurs obtenues juste avant, pas les valeurs initiales.', earths: prises, rm: ['1. Réduire RC / couplage.', '2. Vérifier parasites.', '3. Compléter RM.', '4. Renforcer RN uniquement si nécessaire.'], rn: ['RN traitée uniquement après correction du couplage et de RM.']}
    ];
  }, [data, kInitial, rmTarget, rnTarget, rcTarget, rcTargetAfter1, after1Base, prises, diagnostic]);

  const active = solutions[solution] || solutions[0];

  const field = (label, key) => <label className="block"><span className="text-sm font-bold text-slate-600">{label}</span><input value={data[key]} onChange={e=>update(key,e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-500" /></label>;
  const select = (label, key, opts) => <label className="block"><span className="text-sm font-bold text-slate-600">{label}</span><select value={data[key]} onChange={e=>update(key,e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-500">{opts.map(o=><option key={o}>{o}</option>)}</select></label>;
  const check = (label, key) => <label className="flex items-center gap-3 rounded-2xl bg-slate-100 p-3 font-bold"><input type="checkbox" checked={data[key]} onChange={e=>update(key,e.target.checked)} />{label}</label>;
  const photo = (label, key) => <div className={`rounded-3xl border p-4 ${photos[key]?'bg-green-50 border-green-300':'bg-white border-red-200'}`}><p className="font-black">📷 {label}</p><p className="text-sm font-bold text-red-600">Photo obligatoire</p><label className="mt-2 inline-block cursor-pointer rounded-2xl bg-blue-600 px-4 py-3 font-black text-white">Prendre une photo<input type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=()=>setPhotos(p=>({...p,[key]:String(r.result)})); r.readAsDataURL(f);}} /></label>{photos[key] && <img src={photos[key]} className="mt-3 max-h-48 rounded-2xl border object-contain"/>}</div>;

  const SolNotice = () => <div className={`mt-4 rounded-2xl p-4 font-bold ${resistiviteExtreme?'bg-red-50 text-red-800 border-l-4 border-red-600':resistiviteTresForte?'bg-orange-50 text-orange-800 border-l-4 border-orange-500':'bg-green-50 text-green-800 border-l-4 border-green-500'}`}>🌱 {apportTerreVegetale}</div>;

  const Drawing = ({type}) => <div className="mt-3 rounded-3xl border bg-white p-4">
    {type==='patte' && <svg viewBox="0 0 560 230" className="w-full"><circle cx="55" cy="45" r="12" fill="#dc2626"/><text x="38" y="25" fontWeight="800">RN</text><line x1="70" y1="55" x2="210" y2="105" stroke="#94a3b8" strokeDasharray="6 6"/><rect x="230" y="90" width="115" height="42" rx="10" fill="#1e3a8a"/><text x="248" y="117" fill="white" fontWeight="800">Barrette RM</text><line x1="288" y1="132" x2="288" y2="205" stroke="#b45309" strokeWidth="6"/><line x1="288" y1="132" x2="155" y2="205" stroke="#b45309" strokeWidth="6"/><line x1="288" y1="132" x2="420" y2="205" stroke="#b45309" strokeWidth="6"/><text x="305" y="180" fontWeight="800">Cu 25 mm²</text><circle cx="155" cy="205" r="9" fill="#16a34a"/><circle cx="288" cy="205" r="9" fill="#16a34a"/><circle cx="420" cy="205" r="9" fill="#16a34a"/></svg>}
    {type==='piquets' && <svg viewBox="0 0 560 200" className="w-full"><rect x="30" y="75" width="100" height="40" rx="10" fill="#1e3a8a"/><text x="48" y="100" fill="white" fontWeight="800">Barrette</text><line x1="130" y1="95" x2="500" y2="95" stroke="#b45309" strokeWidth="6"/>{[190,330,470].map((x,i)=><g key={x}><line x1={x} y1="95" x2={x} y2="170" stroke="#16a34a" strokeWidth="8"/><text x={x-18} y="195" fontWeight="800">P{i+1} 2m</text></g>)}<text x="235" y="70" fontWeight="800">Cuivre nu 25 mm²</text></svg>}
    {type==='lineaire' && <svg viewBox="0 0 560 160" className="w-full"><rect x="35" y="60" width="90" height="40" rx="10" fill="#1e3a8a"/><text x="64" y="86" fill="white" fontWeight="800">RM</text><line x1="125" y1="80" x2="505" y2="80" stroke="#b45309" strokeWidth="7"/><text x="220" y="55" fontWeight="800">Cuivre nu 25 mm² enterré</text><text x="230" y="120">10 à 30 m / profondeur 0,5 à 0,8 m</text></svg>}
    {type==='profond' && <svg viewBox="0 0 560 230" className="w-full"><rect x="220" y="20" width="120" height="42" rx="10" fill="#1e3a8a"/><text x="240" y="47" fill="white" fontWeight="800">Barrette</text><line x1="280" y1="62" x2="280" y2="205" stroke="#16a34a" strokeWidth="10"/><text x="315" y="105" fontWeight="800">2 m</text><text x="315" y="155" fontWeight="800">+2 m</text><text x="315" y="205" fontWeight="800">+2 m</text></svg>}
    {type==='rn' && <svg viewBox="0 0 560 180" className="w-full"><circle cx="80" cy="90" r="18" fill="#2563eb"/><text x="63" y="95" fill="white" fontWeight="800">RN</text><line x1="100" y1="90" x2="455" y2="90" stroke="#b45309" strokeWidth="6"/><circle cx="455" cy="90" r="14" fill="#16a34a"/><text x="250" y="65" fontWeight="800">Renfort RN éloigné de RM</text></svg>}
  </div>;

  return <main className="min-h-screen bg-slate-950 p-4 text-slate-900"><div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl"><header className="bg-gradient-to-r from-slate-950 via-blue-900 to-slate-800 p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-200">SECAB Couplage Expert V5 PRO — Windows</p><h1 className="mt-2 text-4xl font-black">Couplage Expert Terrain</h1><p className="mt-1 text-blue-100">Interface V5 conservée • Version Windows corrigée.</p><div className="mt-5 grid gap-3 md:grid-cols-4"><div className="rounded-2xl bg-white/10 p-4"><div className="text-xs">K initial</div><div className="text-3xl font-black">{kInitial.toFixed(3)}</div></div><div className="rounded-2xl bg-white/10 p-4"><div className="text-xs">RC cible</div><div className="text-3xl font-black">{rcTarget.toFixed(2)} Ω</div></div><div className="rounded-2xl bg-white/10 p-4"><div className="text-xs">RC à réduire</div><div className="text-3xl font-black">{rcToReduce.toFixed(2)} Ω</div></div><div className="rounded-2xl bg-white/10 p-4"><div className="text-xs">K après 1</div><div className="text-3xl font-black">{kAfter1.toFixed(3)}</div></div></div></header>{error && <div className="m-5 rounded-2xl border-l-4 border-red-600 bg-red-50 p-4 font-black text-red-700">⚠ {error}</div>}<div className="grid lg:grid-cols-[310px_1fr]"><aside className="space-y-2 bg-slate-100 p-5">{steps.map(([s,icon],i)=><button key={s} onClick={()=>setStep(i)} className={`w-full rounded-2xl p-3 text-left font-black ${step===i?'bg-blue-600 text-white':'bg-white'}`}>{icon} {i+1}. {s}</button>)}</aside><section className="p-6">
    {step===0 && <div><h2 className="text-3xl font-black">🏠 Accueil</h2><div className="grid gap-4 md:grid-cols-4"><div className="rounded-3xl bg-blue-50 p-5"><b>Objectif</b><p>K ≤ 0,15.</p></div><div className="rounded-3xl bg-green-50 p-5"><b>Cuivre</b><p>25 mm².</p></div><div className="rounded-3xl bg-orange-50 p-5"><b>Photos</b><p>Obligatoires.</p></div><div className="rounded-3xl bg-purple-50 p-5"><b>Sol</b><p>Résistivité prise en compte.</p></div></div></div>}
    {step===1 && <div><h2 className="text-3xl font-black">📍 Chantier + GPS</h2><div className="grid gap-4 md:grid-cols-2">{field('Affaire','affaire')}{field('Client','client')}{field('Site','site')}{field('Technicien','technicien')}</div><button onClick={()=>setError('Géolocalisation active dans le projet ZIP / Netlify.')} className="mt-4 rounded-2xl bg-green-600 px-6 py-4 font-black text-white">📍 Géolocaliser</button></div>}
    {step===2 && <div><h2 className="text-3xl font-black">📷 Mesures initiales</h2><div className="grid gap-4 md:grid-cols-3">{field('RM initiale (Ω)','rm')}{field('RN initiale (Ω)','rn')}{field('RC/RMN initiale (Ω)','rc')}{field('Distance RM/RN (m)','distance')}{field('Résistivité ρ (Ω.m)','resistivite')}</div><div className="mt-4 rounded-2xl bg-blue-50 p-4 font-bold">K = RC / RN = {kInitial.toFixed(3)} — RC cible = 0,15 × RN = {rcTarget.toFixed(2)} Ω</div><SolNotice/><div className="mt-4 grid gap-4 md:grid-cols-2">{photo('Mesure RM initiale','photoRm')}{photo('Mesure RN initiale','photoRn')}{photo('Mesure RC/RMN initiale','photoRc')}{photo('Environnement / implantation','photoEnv')}</div></div>}
    {step===3 && <div><h2 className="text-3xl font-black">🧠 Diagnostic</h2><div className="grid gap-4 md:grid-cols-3">{select('Terrain','terrain',['Terre','Béton','Enrobé','Rocheux'])}{select('Sol','sol',['Normal','Sec / résistant','Très conducteur / humide'])}{select('Météo','meteo',['Sec','Humide / pluie récente'])}</div><div className="mt-4 grid gap-3 md:grid-cols-2">{check('Masses métalliques','masses')}{check('Clôture','cloture')}{check('Canalisation','canalisation')}{check('Câble armé','cableArme')}{check('Ferraillage','ferraillage')}</div>{diagnostic.causes.map((c,i)=><div key={i} className="mt-3 rounded-2xl border-l-4 border-orange-500 bg-orange-50 p-4 font-bold">{c}</div>)}<SolNotice/></div>}
    {step===4 && <div><h2 className="text-3xl font-black">🥇 Solutions proposées</h2><div className="space-y-4">{solutions.map((s,i)=><div key={s.title} onClick={()=>setSolution(i)} className={`cursor-pointer rounded-3xl border-2 p-5 ${solution===i?'border-blue-600 bg-blue-50':'border-slate-200'}`}><div className="font-black text-blue-700">{s.badge}</div><h3 className="text-2xl font-black">{s.title}</h3><p className="mt-2 rounded-xl bg-white p-3"><b>Valeurs initiales / base :</b> {s.initial}</p><p className="mt-2 rounded-xl bg-green-50 p-3"><b>Valeurs à obtenir :</b> {s.target}</p><p className="mt-2 font-bold text-orange-700">{s.why}</p><p className="mt-2"><b>Prises compatibles :</b> {s.earths.map(e=>e.name).join(' • ')}</p></div>)}</div><SolNotice/><h3 className="mt-6 text-2xl font-black">Prises compatibles avec l’objectif</h3>{active.earths.map(e=><div key={e.name} className="my-4 rounded-3xl bg-slate-100 p-5"><h4 className="text-xl font-black text-blue-900">{e.name} — {e.tag}</h4><p><b>Valeur initiale mesurée :</b> {e.initial}</p><p className="rounded-xl bg-white p-3"><b>Valeur à atteindre :</b> {e.target}</p><p><b>Mise en œuvre :</b> {e.detail}</p><p className="font-bold"><b>Formule :</b> {e.formula}</p><Drawing type={e.type}/></div>)}</div>}
    {step===5 && <div><h2 className="text-3xl font-black">⚡ Améliorer RM</h2><div className="rounded-3xl bg-blue-50 p-5"><b>Solution choisie :</b> {active.title}</div><SolNotice/>{active.rm.map((x,i)=><div key={i} className="my-3 rounded-2xl border bg-white p-4 shadow-sm"><b>RM étape {i+1}</b><br/>{x}</div>)}</div>}
    {step===6 && <div><h2 className="text-3xl font-black">🔵 Améliorer RN</h2><div className="rounded-3xl bg-green-50 p-5"><b>Solution choisie :</b> {active.title}</div><SolNotice/>{active.rn.map((x,i)=><div key={i} className="my-3 rounded-2xl border bg-white p-4 shadow-sm"><b>RN étape {i+1}</b><br/>{x}</div>)}</div>}
    {step===7 && <div><h2 className="text-3xl font-black">🔁 Recalcul</h2><div className="grid gap-4 md:grid-cols-3">{field('RM après amélioration 1','rm2')}{field('RN après amélioration 1','rn2')}{field('RC après amélioration 1','rc2')}</div><div className="mt-4 rounded-2xl bg-blue-50 p-4 font-black">K après amélioration 1 : {kAfter1.toFixed(3)}</div><div className="mt-4 grid gap-4 md:grid-cols-3">{photo('RM après amélioration 1','photoRm2')}{photo('RN après amélioration 1','photoRn2')}{photo('RC/RMN après amélioration 1','photoRc2')}</div><div className="mt-4 rounded-2xl bg-yellow-50 p-4 font-bold">Si complément nécessaire, la suite repart de : RM {after1Base.rm} Ω • RN {after1Base.rn} Ω • RC {after1Base.rc} Ω • K {after1Base.k.toFixed(3)}.<br/>Ordre : réduire RC/couplage → vérifier parasites → compléter RM → renforcer RN seulement si nécessaire.</div><div className="mt-4 grid gap-4 md:grid-cols-3">{field('RM après complément','rm3')}{field('RN après complément','rn3')}{field('RC après complément','rc3')}</div><div className="mt-4 rounded-2xl bg-purple-50 p-4 font-black">K final : {kFinal.toFixed(3)}</div><div className="mt-4 grid gap-4 md:grid-cols-3">{photo('RM après complément','photoRm3')}{photo('RN après complément','photoRn3')}{photo('RC/RMN après complément','photoRc3')}</div></div>}
    {step===8 && <div><h2 className="text-3xl font-black">🚧 Plan d’action</h2><SolNotice/><div className="grid gap-4 md:grid-cols-2"><div className="rounded-3xl bg-blue-50 p-5"><h3 className="font-black">Béton</h3><div className="grid gap-3 md:grid-cols-3">{field('Longueur béton (m)','longBeton')}{field('Largeur béton (m)','largBeton')}{field('Profondeur béton (m)','profBeton')}</div><b>Volume béton : {volumes.beton} m³</b></div><div className="rounded-3xl bg-slate-100 p-5"><h3 className="font-black">Enrobé</h3><div className="grid gap-3 md:grid-cols-3">{field('Longueur enrobé (m)','longEnrobe')}{field('Largeur enrobé (m)','largEnrobe')}{field('Profondeur enrobé (m)','profEnrobe')}</div><b>Volume enrobé : {volumes.enrobe} m³</b></div><div className="rounded-3xl bg-slate-100 p-5"><h3 className="font-black">Bitume</h3><div className="grid gap-3 md:grid-cols-3">{field('Longueur bitume (m)','longBitume')}{field('Largeur bitume (m)','largBitume')}{field('Profondeur bitume (m)','profBitume')}</div><b>Volume bitume : {volumes.bitume} m³</b></div><div className="rounded-3xl bg-green-50 p-5"><h3 className="font-black">Terre / terrain naturel</h3><div className="grid gap-3 md:grid-cols-3">{field('Longueur terre (m)','longTerre')}{field('Largeur terre (m)','largTerre')}{field('Profondeur terre (m)','profTerre')}</div><b>Volume terre : {volumes.terre} m³</b></div><div className="rounded-3xl bg-slate-100 p-5"><h3 className="font-black">Dallage</h3><div className="grid gap-3 md:grid-cols-3">{field('Longueur dallage (m)','longDallage')}{field('Largeur dallage (m)','largDallage')}{field('Profondeur dallage (m)','profDallage')}</div><b>Volume dallage : {volumes.dallage} m³</b></div><div className="rounded-3xl bg-slate-100 p-5"><h3 className="font-black">Pavés</h3><div className="grid gap-3 md:grid-cols-3">{field('Longueur pavés (m)','longPaves')}{field('Largeur pavés (m)','largPaves')}{field('Profondeur pavés (m)','profPaves')}</div><b>Volume pavés : {volumes.paves} m³</b></div></div><label className="mt-4 block"><span className="font-bold">Travaux à réaliser</span><textarea value={data.travauxARealiser} onChange={e=>update('travauxARealiser', e.target.value)} className="mt-2 h-24 w-full rounded-2xl border p-4"/></label><label className="mt-4 block"><span className="font-bold">Travaux réalisés</span><textarea value={data.travauxRealises} onChange={e=>update('travauxRealises', e.target.value)} className="mt-2 h-24 w-full rounded-2xl border p-4"/></label><div className="mt-4 grid gap-4 md:grid-cols-2">{photo('État final chantier après travaux','photoFinal')}{photo('Réfection surface terminée','photoRefection')}</div></div>}
    {step===9 && <div><h2 className="text-3xl font-black">📄 Rapport + mail</h2><SolNotice/><textarea value={data.emails} onChange={e=>update('emails', e.target.value)} className="h-28 w-full rounded-2xl border p-4" placeholder="responsable@secab.fr; client@mail.com"/><div className="mt-4 flex flex-wrap gap-3"><button onClick={()=>setError('Export Word actif dans le projet ZIP / Netlify.')} className="rounded-2xl bg-blue-600 px-6 py-4 font-black text-white">📄 Générer rapport Word</button><button onClick={()=>setError('Transmission mail active dans le projet ZIP / Netlify.')} className="rounded-2xl bg-green-600 px-6 py-4 font-black text-white">📧 Transmettre par mail</button></div></div>}
    <div className="mt-8 flex justify-between border-t pt-5"><button onClick={()=>setStep(Math.max(0,step-1))} className="rounded-xl bg-slate-200 px-5 py-3 font-bold">Précédent</button><button onClick={()=>setStep(Math.min(steps.length-1,step+1))} className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">Suivant</button></div>
  </section></div></div></main>;
}
