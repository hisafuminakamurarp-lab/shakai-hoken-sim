import { useState, useEffect } from "react";

// ─── レイアウト定数 ───────────────────────────────
const G = {
  bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
  card: { background:"rgba(255,255,255,0.03)", border:"1px solid #1e3a5f", borderRadius:16, padding:20, marginBottom:14 },
  row2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 },
  row3: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 },
};

// ─── 定数 ────────────────────────────────────────
const KENPO_RATES = {
  "北海道":5.14,"青森":4.925,"岩手":4.755,"宮城":5.05,"秋田":5.005,
  "山形":4.875,"福島":4.75,"茨城":4.76,"栃木":4.91,"群馬":4.84,
  "埼玉":4.835,"千葉":4.865,"東京":4.925,"神奈川":4.96,"新潟":4.605,
  "富山":4.795,"石川":4.85,"福井":4.855,"山梨":4.775,"長野":4.815,
  "岐阜":4.90,"静岡":4.805,"愛知":4.965,"三重":4.885,"滋賀":4.94,
  "京都":4.945,"大阪":5.065,"兵庫":5.06,"奈良":4.955,"和歌山":5.03,
  "鳥取":4.93,"島根":4.97,"岡山":5.025,"広島":4.89,"山口":5.075,
  "徳島":5.12,"香川":5.01,"愛媛":4.99,"高知":5.025,"福岡":5.055,
  "佐賀":5.275,"長崎":5.03,"熊本":5.04,"大分":5.04,"宮崎":4.885,
  "鹿児島":5.065,"沖縄":4.72
};
const KOYO_RATES = { "一般":0.5,"農林水産・清酒製造":0.6,"建設":0.6 };
const KENPO_GRADES = [
  58000,68000,78000,88000,98000,104000,110000,118000,126000,134000,
  142000,150000,160000,170000,180000,190000,200000,220000,240000,260000,
  280000,300000,320000,340000,360000,380000,410000,440000,470000,500000,
  530000,560000,590000,620000,650000,680000,710000,750000,790000,830000,
  880000,930000,980000,1030000,1090000,1150000,1210000,1270000,1330000,1390000
];
const NENKIN_GRADES = [
  88000,98000,104000,110000,118000,126000,134000,142000,150000,160000,
  170000,180000,190000,200000,220000,240000,260000,280000,300000,320000,
  340000,360000,380000,410000,440000,470000,500000,530000,560000,590000,620000
];
const AOSHIRO_MAP = { "65万（e-Tax）":650000,"55万（書面）":550000,"10万（簡易）":100000,"なし（白色）":0 };
const PREFS = Object.keys(KENPO_RATES);

// 社団加入固定値（スクショより）
const ASSOC = {
  memberFee:   35000,   // 月額会員費
  salary:      12000,   // 役員報酬（社保10,908 + 手取り1,092）
  kenpoEmp:    2856,    // 健康保険（員負担）
  nenkinEmp:   8052,    // 厚生年金（員負担）
  koyoEmp:     0,       // 雇用保険（未加入）
  companyShare:11223,   // 法定福利費（会社負担）
  takeHome:    1092,    // 手取り
};
const ASSOC_SOC_EMP    = ASSOC.kenpoEmp + ASSOC.nenkinEmp;                         // 10,908（員負担）
// 実質負担: 35,000 - 役員報酬12,000 - 法定福利費11,223 = 11,777円/月
const ASSOC_REAL_COST_M = ASSOC.memberFee - ASSOC.salary - ASSOC.companyShare;    // 11,777
const ASSOC_REAL_COST_Y = ASSOC_REAL_COST_M * 12;                                 // 141,324

// ─── 計算関数 ─────────────────────────────────────
const fmt  = n => Math.round(n).toLocaleString();
const fmtM = n => Math.round(n/12).toLocaleString();
const getStd = (a,g)=>{ for(const x of g) if(a<=x) return x; return g[g.length-1]; };

function calcIncomeTax(ti) {
  if(ti<=0) return 0;
  let t;
  if(ti<=1950000) t=ti*0.05;
  else if(ti<=3300000) t=ti*0.10-97500;
  else if(ti<=6950000) t=ti*0.20-427500;
  else if(ti<=9000000) t=ti*0.23-636000;
  else if(ti<=18000000) t=ti*0.33-1536000;
  else if(ti<=40000000) t=ti*0.40-2796000;
  else t=ti*0.45-4796000;
  return Math.floor(Math.max(t,0)*1.021);
}

function calcWithholding(monthlyTaxable, dep) {
  if(monthlyTaxable<=0) return 0;
  const B=monthlyTaxable*12;
  let C;
  if(B<=1625000) C=550000;
  else if(B<=1800000) C=B*0.4-100000;
  else if(B<=3600000) C=B*0.3+80000;
  else if(B<=6600000) C=B*0.2+440000;
  else if(B<=8500000) C=B*0.1+1100000;
  else C=1950000;
  const D=Math.floor((B-C)/1000)*1000;
  const Gv=Math.max(Math.floor((D-480000-dep*380000)/1000)*1000,0);
  let H;
  if(Gv<=1950000) H=Gv*0.05;
  else if(Gv<=3300000) H=Gv*0.10-97500;
  else if(Gv<=6950000) H=Gv*0.20-427500;
  else if(Gv<=9000000) H=Gv*0.23-636000;
  else if(Gv<=18000000) H=Gv*0.33-1536000;
  else if(Gv<=40000000) H=Gv*0.40-2796000;
  else H=Gv*0.45-4796000;
  return Math.max(Math.floor(Math.floor(H*1.021)/12),0);
}


// 限界税率（所得税+住民税10%）
function calcMarginalRate(taxableIncome) {
  let rate;
  if (taxableIncome <= 1_950_000)       rate = 5;
  else if (taxableIncome <= 3_300_000)  rate = 10;
  else if (taxableIncome <= 6_950_000)  rate = 20;
  else if (taxableIncome <= 9_000_000)  rate = 23;
  else if (taxableIncome <= 18_000_000) rate = 33;
  else if (taxableIncome <= 40_000_000) rate = 40;
  else                                   rate = 45;
  return rate + 10; // +住民税10%
}

function calcNHI(income, age, deps) {
  const base=Math.max(income-430000,0);
  const iryo =Math.min(base*0.070+42000*(1+deps),650000);
  const shien=Math.min(base*0.023+13000*(1+deps),220000);
  const kaigo=age==="40〜64歳"?Math.min(base*0.017+16000*(1+deps),170000):0;
  return Math.floor(iryo+shien+kaigo);
}

function calcJigyoZei(income) {
  return Math.max(Math.floor((income-2900000)*0.05),0);
}

// ─── 加入前（個人事業主） ─────────────────────────
function calcBefore(jigyoShotoku, aoshiroKey, age, deps) {
  const aokojo = AOSHIRO_MAP[aoshiroKey]||0;
  const shotokuAfter = Math.max(jigyoShotoku-aokojo,0);
  const jigyoZei     = calcJigyoZei(jigyoShotoku);
  // 国保料は事業所得（青色控除前）を基準に計算する
  const nhi          = calcTokyoNHI(jigyoShotoku, age); // 新宿区 令和8年度料率
  const nenkin       = age==="65歳以上" ? 0 : 17920*12; // 国民年金
  const socDed       = nhi+nenkin;
  const taxableIncome= Math.max(shotokuAfter-socDed-jigyoZei-480000-deps*380000,0);
  const incomeTax    = calcIncomeTax(taxableIncome);
  const juminZei     = Math.floor(taxableIncome*0.10)+5000;
  // 月額社会保険コスト
  const monthlyNHI   = Math.round(nhi/12);
  const monthlyNenkin= Math.round(nenkin/12);
  const monthlySoc   = monthlyNHI+monthlyNenkin;
  const taxTotal     = nhi+nenkin+jigyoZei+incomeTax+juminZei;
  const net          = Math.max(jigyoShotoku-taxTotal,0);
  return { nhi, nenkin, jigyoZei, incomeTax, juminZei, taxTotal, taxableIncome,
           net, aokojo, shotokuAfter, monthlyNHI, monthlyNenkin, monthlySoc };
}


// ─── 共通UIパーツ ─────────────────────────────────
function RRow({ label, sub, value, color="#38bdf8", bold=false, indent=false, monthly=false }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
      padding:"7px 0",borderBottom:"1px solid #1e293b",fontSize:13,
      paddingLeft:indent?10:0,fontWeight:bold?700:400}}>
      <span style={{color:indent?"#94a3b8":undefined}}>
        {label}{sub&&<span style={{color:"#64748b",fontSize:11}}> {sub}</span>}
      </span>
      <div style={{textAlign:"right"}}>
        <span style={{color,fontVariantNumeric:"tabular-nums",fontWeight:700,transition:"all 0.15s"}}>
          ¥{fmt(value)}
        </span>
        {monthly&&<div style={{fontSize:10,color:"#475569"}}>月額 ¥{fmtM(value)}</div>}
      </div>
    </div>
  );
}

function LiveBadge() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
      <span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",
        boxShadow:"0 0 6px #22c55e",animation:"pulse 1.5s infinite",display:"inline-block"}}/>
      <span style={{fontSize:11,color:"#4ade80",fontWeight:700,letterSpacing:"0.1em"}}>LIVE CALCULATION</span>
    </div>
  );
}

function NetBox({ label, net, total, color1, color2, sub }) {
  const rate=total>0?Math.round(net/total*100):0;
  return (
    <div style={{background:`linear-gradient(135deg,${color1},${color2})`,borderRadius:12,
      padding:"14px 18px",textAlign:"center",marginTop:0}}>
      <div style={{fontSize:10,letterSpacing:"0.1em",color:"rgba(255,255,255,0.6)",marginBottom:2}}>{label}</div>
      <div style={{fontSize:28,fontWeight:700,color:"#fff",transition:"all 0.2s"}}>¥{fmt(net)}</div>
      <div style={{marginTop:6,background:"rgba(0,0,0,0.2)",borderRadius:6,height:5}}>
        <div style={{height:"100%",borderRadius:6,background:"rgba(255,255,255,0.5)",
          width:`${rate}%`,transition:"width 0.3s"}}/>
      </div>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:4}}>
        <strong style={{color:"#fff"}}>{rate}%</strong> 手取り
      </div>
      {sub&&<div style={{fontSize:10,color:"rgba(255,255,255,0.6)",marginTop:2}}>{sub}</div>}
    </div>
  );
}

// ─── 会社員ページ ─────────────────────────────────
function EmployeePage() {
  const [monthly,setMonthly]=useState(""); const [commute,setCommute]=useState("");
  const [pref,setPref]=useState("東京"); const [age,setAge]=useState("40歳未満");
  const [koyo,setKoyo]=useState("一般"); const [deps,setDeps]=useState(0);
  const [jumin,setJumin]=useState("");

  const m=parseInt(monthly)||0, c=parseInt(commute)||0, total=m+c;
  const kStd=getStd(total,KENPO_GRADES), nStd=getStd(total,NENKIN_GRADES);
  const kenpo =total>0?Math.floor(kStd*(KENPO_RATES[pref]||4.925)/100):0;
  const kaigo =total>0&&age==="40〜64歳"?Math.floor(kStd*0.91/100):0;
  const nenkin=total>0?Math.floor(nStd*9.15/100):0;
  const kh    =total>0?Math.floor(total*(KOYO_RATES[koyo]||0.5)/100):0;
  const soc=kenpo+kaigo+nenkin+kh;
  const tax=Math.max(m-soc,0);
  const wh=m>0?calcWithholding(tax,deps):0;
  const jm=parseInt(jumin)||0;
  const net=Math.max(m-soc-wh-jm,0);

  return (<div>
    <div style={G.card}>
      <div className="sec">給与情報</div>
      <div style={G.row2}>
        <div><label>月給額（課税手当）</label><input type="number" placeholder="300000" value={monthly} onChange={e=>setMonthly(e.target.value)}/></div>
        <div><label>交通費（非課税）</label><input type="number" placeholder="20000" value={commute} onChange={e=>setCommute(e.target.value)}/></div>
      </div>
      <div style={G.row3}>
        <div><label>都道府県</label><select value={pref} onChange={e=>setPref(e.target.value)}>{PREFS.map(p=><option key={p}>{p}</option>)}</select></div>
        <div><label>年齢区分</label><select value={age} onChange={e=>setAge(e.target.value)}><option>40歳未満</option><option>40〜64歳</option><option>65歳以上</option></select></div>
        <div><label>雇用保険</label><select value={koyo} onChange={e=>setKoyo(e.target.value)}><option>一般</option><option>農林水産・清酒製造</option><option>建設</option></select></div>
      </div>
      <div style={G.row2}>
        <div><label>扶養人数</label><select value={deps} onChange={e=>setDeps(Number(e.target.value))}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n}人</option>)}</select></div>
        <div><label>住民税（月額）</label><input type="number" placeholder="15000" value={jumin} onChange={e=>setJumin(e.target.value)}/></div>
      </div>
    </div>
    <LiveBadge/>
    <div style={G.card}>
      <div className="sec">社会保険料内訳</div>
      <div style={{fontSize:11,color:"#475569",marginBottom:8}}>健保標準: <strong style={{color:"#94a3b8"}}>{fmt(kStd)}円</strong><span style={{marginLeft:8}}>厚年: <strong style={{color:"#94a3b8"}}>{fmt(nStd)}円</strong></span></div>
      <RRow label="健康保険料" sub={`(${(KENPO_RATES[pref]||4.925).toFixed(3)}%)`} value={kenpo}/>
      {age==="40〜64歳"&&<RRow label="介護保険料" sub="(0.91%)" value={kaigo}/>}
      <RRow label="厚生年金保険料" sub="(9.15%)" value={nenkin}/>
      <RRow label="雇用保険料" sub={`(${KOYO_RATES[koyo]}%)`} value={kh}/>
      <RRow label="社会保険料合計" value={soc} color="#f472b6" bold/>
    </div>
    <div style={G.card}>
      <div className="sec">控除内訳</div>
      <RRow label="課税対象額（月）" value={tax} color="#a3e635"/>
      <RRow label="源泉所得税" sub={`(扶養${deps}人)`} value={wh}/>
      <RRow label="住民税（月額）" value={jm}/>
      <RRow label="控除合計（月）" value={soc+wh+jm} color="#f472b6" bold/>
    </div>
    <NetBox label="月間手取り" net={net} total={m} color1="#0c4a6e" color2="#0e7490" sub={`年間試算 ¥${fmt(net*12)}`}/>
    <p style={{fontSize:11,color:"#334155",textAlign:"center",marginTop:12,lineHeight:1.7}}>※概算です。標準報酬月額の改定・保険組合により異なります。</p>
  </div>);
}

// ─── 個人事業主ページ ─────────────────────────────
function FreelancePage() {
  const [sales,setSales]=useState(""); const [expenses,setExpenses]=useState("");
  const [aoshiro,setAoshiro]=useState("65万（e-Tax）");
  const [age,setAge]=useState("40歳未満"); const [deps,setDeps]=useState(0);

  const S=parseInt(sales)||0, E=parseInt(expenses)||0;
  const jigyoShotoku=Math.max(S-E,0);
  const r=calcBefore(jigyoShotoku,aoshiro,age,deps);
  const net=r.net;

  return (<div>
    <div style={G.card}>
      <div className="sec">事業情報（年間）</div>
      <div style={G.row2}>
        <div><label>課税売上（年間）</label><input type="number" placeholder="6000000" value={sales} onChange={e=>setSales(e.target.value)}/></div>
        <div><label>経費（年間）</label><input type="number" placeholder="1500000" value={expenses} onChange={e=>setExpenses(e.target.value)}/></div>
      </div>
      <div style={G.row3}>
        <div><label>青色申告控除</label><select value={aoshiro} onChange={e=>setAoshiro(e.target.value)}>{Object.keys(AOSHIRO_MAP).map(k=><option key={k}>{k}</option>)}</select></div>
        <div><label>年齢区分</label><select value={age} onChange={e=>setAge(e.target.value)}><option>40歳未満</option><option>40〜64歳</option><option>65歳以上</option></select></div>
        <div><label>扶養人数</label><select value={deps} onChange={e=>setDeps(Number(e.target.value))}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n}人</option>)}</select></div>
      </div>
    </div>
    <LiveBadge/>
    <div style={G.card}>
      <div className="sec">所得の計算</div>
      <RRow label="課税売上" value={S} color="#a3e635"/>
      <RRow label="（－）経費" value={E} color="#f87171" indent/>
      <RRow label="事業所得" value={jigyoShotoku} color="#e2e8f0" bold/>
      <RRow label="（－）青色申告特別控除" sub={aoshiro} value={r.aokojo} color="#f87171" indent/>
      <RRow label="青色控除後の事業所得" value={r.shotokuAfter} color="#a3e635" bold/>
    </div>
    <div style={G.card}>
      <div className="sec">税・社会保険の内訳（年間）</div>
      <RRow label="国民健康保険料" sub="(東京・新宿区 令和8年度)" value={r.nhi} monthly/>
      {age!=="65歳以上"&&<RRow label="国民年金保険料" sub="(17,920円×12)" value={r.nenkin} monthly/>}
      
      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"6px 10px",margin:"6px 0",fontSize:11,color:"#64748b"}}>
        課税所得: <strong style={{color:"#94a3b8"}}>¥{fmt(r.taxableIncome)}</strong>
      </div>
      <RRow label="所得税（確定申告）" sub="(復興税込)" value={r.incomeTax}/>
      <RRow label="住民税" sub="(所得割10%＋均等割)" value={r.juminZei}/>
      <div style={{borderTop:"2px solid #334155",paddingTop:6,marginTop:4}}>
        <RRow label="税・保険料 合計" value={r.taxTotal} color="#f472b6" bold monthly/>
      </div>
    </div>
    <NetBox label="年間手取り（事業所得ベース）" net={net} total={jigyoShotoku} color1="#14532d" color2="#166534" sub={`月換算 ¥${fmt(Math.floor(net/12))}`}/>
    <p style={{fontSize:11,color:"#334155",textAlign:"center",marginTop:12,lineHeight:1.8}}>
      ※国民健康保険は市区町村により大きく異なります<br/>※売上1,000万超の場合は消費税が別途かかります
    </p>
  </div>);
}

// ─── 節税シミュレーションページ ──────────────────
function SimPage({ onCalc, inputs, setInputs }) {
  const sales    = inputs.sales;
  const expenses = inputs.expenses;
  const aoshiro  = inputs.aoshiro;
  const age      = inputs.age;
  const deps     = inputs.deps;
  const setSales    = v => setInputs(p=>({...p, sales:v}));
  const setExpenses = v => setInputs(p=>({...p, expenses:v}));
  const setAoshiro  = v => setInputs(p=>({...p, aoshiro:v}));
  const setAge      = v => setInputs(p=>({...p, age:v}));
  const setDeps     = v => setInputs(p=>({...p, deps:v}));

  const S = parseInt(sales)||0;
  const E = parseInt(expenses)||0;
  const customFee = ASSOC.memberFee;  // 固定35,000円
  const jigyoShotoku = Math.max(S-E,0);

  // 加入前
  const bef = calcBefore(jigyoShotoku, aoshiro, age, deps);

  // 加入後（カスタム会員費で再計算）
  // 実質負担 = 会員費 - 役員報酬 - 法定福利費
  const memberFeeAnnual = customFee*12;
  const netMemberCost   = customFee * 12;  // 会員費全額（35,000×12=420,000）

  const aokojo          = AOSHIRO_MAP[aoshiro]||0;
  const jigyoShotokuAdj = jigyoShotoku;  // 経費算入なし
  const shotokuAfterAft = Math.max(jigyoShotokuAdj - aokojo, 0);
  const jigyoZeiAft     = calcJigyoZei(jigyoShotokuAdj);
  // 社保は会員費420,000の中に含まれているため別途控除しない
  const taxableAft      = Math.max(shotokuAfterAft - jigyoZeiAft - 480000 - deps*380000, 0);
  const incomeTaxAft    = bef.incomeTax;
  const juminZeiAft     = bef.juminZei;
  const realMemberCost  = (ASSOC.memberFee - ASSOC.takeHome) * 12;  // 406,896
  const taxTotalAft     = realMemberCost + jigyoZeiAft + incomeTaxAft + juminZeiAft;
  const netAft          = Math.max(jigyoShotoku - taxTotalAft, 0);

  // 節税額（手取り増加額）
  const saving     = netAft - bef.net;
  const isPositive = saving >= 0;

  // 解説ページへ計算値を渡す
  const simData = {
    nhi: bef.nhi, nenkin: bef.nenkin,
    socEmp: 0,  // 社保は会員費に含まれるため0
    fee: customFee*12, takehome: ASSOC.takeHome*12,
    netMemberCost,
    taxRate: calcMarginalRate(bef.taxableIncome),
    saving,
    cashSaving: (bef.nhi + bef.nenkin) - netMemberCost, // (国保+国年) - 420,000
    taxChangeBef: bef.incomeTax + bef.juminZei,
    taxChangeAft: incomeTaxAft + juminZeiAft,
    jigyoShotoku,
  };

  // 解説ページへ値を渡す（副作用はuseEffectで）
  useEffect(() => {
    if (onCalc) onCalc(simData);
  }, [saving, bef.nhi, bef.nenkin, incomeTaxAft, juminZeiAft, netMemberCost, jigyoShotoku]);


  // 月額比較
  const befMonthlySoc = bef.monthlyNHI + bef.monthlyNenkin;
  const aftMonthlyNet = customFee - ASSOC.salary - ASSOC.companyShare; // 実質月額負担
  const aftMonthlySoc = ASSOC_SOC_EMP; // 10,908

  return (<div>
    <div className="pc-two-col">
    <div className="pc-left">
    {/* 入力 */}
    <div style={G.card}>
      <div className="sec">事業情報（年間）</div>
      <div style={G.row2}>
        <div><label>課税売上（年間）</label><input type="number" placeholder="6000000" value={sales} onChange={e=>setSales(e.target.value)}/></div>
        <div><label>経費（年間）</label><input type="number" placeholder="1500000" value={expenses} onChange={e=>setExpenses(e.target.value)}/></div>
      </div>
      <div style={G.row3}>
        <div><label>青色申告控除</label><select value={aoshiro} onChange={e=>setAoshiro(e.target.value)}>{Object.keys(AOSHIRO_MAP).map(k=><option key={k}>{k}</option>)}</select></div>
        <div><label>年齢区分</label><select value={age} onChange={e=>setAge(e.target.value)}><option>40歳未満</option><option>40〜64歳</option><option>65歳以上</option></select></div>
        <div><label>扶養人数</label><select value={deps} onChange={e=>setDeps(Number(e.target.value))}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n}人</option>)}</select></div>
      </div>
      {jigyoShotoku>0&&<div style={{background:"rgba(56,189,248,0.06)",border:"1px solid #1e3a5f",borderRadius:8,padding:"7px 12px",fontSize:12,color:"#64748b"}}>
        事業所得 <strong style={{color:"#e2e8f0"}}>¥{fmt(jigyoShotoku)}</strong>
        <span style={{marginLeft:8}}>月換算 ¥{fmt(Math.floor(jigyoShotoku/12))}</span>
      </div>}
    </div>

    {/* 社団プラン固定値 */}
    <div style={G.card}>
      <div className="sec">社団加入プランの条件</div>
      <div style={{fontSize:11,color:"#64748b",marginBottom:10}}>スクリーンショットの数値に基づく固定値。会員費のみ変更可能。</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        {[
          ["役員報酬",`¥${fmt(ASSOC.salary)}/月`,"#e2e8f0"],
          ["　手取り",`¥${fmt(ASSOC.takeHome)}/月`,"#a3e635"],
          ["健康保険（員負担）",`¥${fmt(ASSOC.kenpoEmp)}/月`,"#38bdf8"],
          ["厚生年金（員負担）",`¥${fmt(ASSOC.nenkinEmp)}/月`,"#38bdf8"],
          ["社保計（員負担）",`¥${fmt(ASSOC_SOC_EMP)}/月`,"#f472b6"],
          ["法定福利費（会社）",`¥${fmt(ASSOC.companyShare)}/月`,"#94a3b8"],
        ].map(([k,v,c])=>(
          <div key={k} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"7px 10px"}}>
            <div style={{fontSize:10,color:"#64748b"}}>{k}</div>
            <div style={{fontSize:13,fontWeight:700,color:c}}>{v}</div>
          </div>
        ))}
      </div>
      <div>
        <label>月額会員費</label>
        <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,padding:"8px 12px",fontSize:14,color:"#94a3b8"}}>
          ¥{fmt(ASSOC.memberFee)}/月（固定）
        </div>
      </div>

    </div>

    </div>{/* pc-left end */}
    <div className="pc-right">
    <LiveBadge/>

    {/* 節税効果ビッグボックス + 5年累積 + CTA */}
    <div style={{
      background:isPositive?"linear-gradient(135deg,#14532d,#166534)":"linear-gradient(135deg,#7f1d1d,#991b1b)",
      borderRadius:18, padding:"24px 20px", textAlign:"center", marginBottom:14,
      border:isPositive?"1px solid #4ade80":"1px solid #f87171",
      boxShadow:isPositive?"0 0 24px rgba(74,222,128,0.15)":"0 0 24px rgba(248,113,113,0.15)"
    }}>
      {jigyoShotoku === 0 ? (
        <>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",padding:"20px 0"}}>
            売上・経費を入力してください
          </div>
        </>
      ) : isPositive ? (
        <>
          {/* 損失訴求 */}
          <div style={{fontSize:12,letterSpacing:"0.08em",color:"#fca5a5",marginBottom:6,fontWeight:700}}>
            ⚠️ 現状、あなたは年間
          </div>
          <div style={{fontSize:42,fontWeight:700,color:"#fef2f2",letterSpacing:"-0.02em",lineHeight:1.1}}>
            ¥{fmt(saving)}
          </div>
          <div style={{fontSize:13,color:"#fca5a5",marginTop:4,fontWeight:600}}>
            損をしています
          </div>

          {/* 矢印 */}
          <div style={{fontSize:24,color:"rgba(255,255,255,0.4)",margin:"14px 0 10px"}}>↓</div>

          {/* 回収提示 */}
          <div style={{fontSize:11,letterSpacing:"0.08em",color:"#86efac",marginBottom:4,fontWeight:700}}>
            今すぐ社団加入で改善すれば
          </div>
          <div style={{fontSize:34,fontWeight:700,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.2}}>
            年間 +¥{fmt(saving)}
          </div>
          <div style={{fontSize:13,color:"#86efac",marginTop:4}}>
            のキャッシュが手元に残ります（月 +¥{fmt(Math.round(saving/12))}）
          </div>

          {/* 5年・10年の長期インパクト */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:18}}>
            <div style={{background:"rgba(255,255,255,0.08)",borderRadius:10,padding:"10px"}}>
              <div style={{fontSize:10,color:"#86efac",letterSpacing:"0.06em"}}>5年で</div>
              <div style={{fontSize:20,fontWeight:700,color:"#fff",marginTop:2}}>+¥{fmt(saving*5)}</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.08)",borderRadius:10,padding:"10px"}}>
              <div style={{fontSize:10,color:"#86efac",letterSpacing:"0.06em"}}>10年で</div>
              <div style={{fontSize:20,fontWeight:700,color:"#fff",marginTop:2}}>+¥{fmt(saving*10)}</div>
            </div>
          </div>

          {/* CTA */}
          <a
            href="https://zaimusienkikou-website.vercel.app/contact.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:"block",
              marginTop:18,
              background:"linear-gradient(135deg,#c9a84c,#e0c068)",
              color:"#1a2744",
              padding:"16px 24px",
              borderRadius:10,
              fontSize:15,
              fontWeight:700,
              letterSpacing:"0.05em",
              textDecoration:"none",
              boxShadow:"0 4px 16px rgba(201,168,76,0.4)",
              transition:"transform 0.15s, box-shadow 0.15s",
            }}
            onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(201,168,76,0.5)";}}
            onMouseOut={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 16px rgba(201,168,76,0.4)";}}
          >
            ＼無料で最適プランを作成／<br/>
            お問い合わせ・無料相談はこちら →
          </a>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:8}}>
            約30秒で送信完了・しつこい営業なし
          </div>
        </>
      ) : (
        <>
          {/* 加入してもメリットが出ない場合 */}
          <div style={{fontSize:12,letterSpacing:"0.08em",color:"#fca5a5",marginBottom:6,fontWeight:700}}>
            ⚠️ 現状の所得では加入メリットが出ません
          </div>
          <div style={{fontSize:36,fontWeight:700,color:"#fff",letterSpacing:"-0.02em"}}>
            年間 ¥{fmt(Math.abs(saving))}
          </div>
          <div style={{fontSize:13,color:"#fca5a5",marginTop:4}}>
            のコスト増になります（月 ¥{fmt(Math.round(Math.abs(saving)/12))}）
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:14,lineHeight:1.7}}>
            所得が一定額（目安: 課税所得200万円以上）を<br/>
            超えるとメリットが出やすくなります
          </div>
        </>
      )}
    </div>

    {/* 年間詳細比較 */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
      {/* 加入前 */}
      <div style={{...G.card,marginBottom:0,padding:14}}>
        <div style={{fontSize:10,color:"#f59e0b",fontWeight:700,marginBottom:8}}>📋 加入前（年間）</div>
        {[
          ["国民健康保険",bef.nhi,"#f59e0b"],
          ["国民年金",bef.nenkin,"#f59e0b"],
          bef.jigyoZei>0&&["個人事業税",bef.jigyoZei,"#f87171"],
          ["所得税",bef.incomeTax,"#f87171"],
          ["住民税",bef.juminZei,"#f87171"],
        ].filter(Boolean).map(([k,v,c])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",
            padding:"4px 0",borderBottom:"1px solid #0f172a",fontSize:11}}>
            <span style={{color:"#94a3b8"}}>{k}</span>
            <span style={{color:c,fontWeight:700}}>¥{fmt(v)}</span>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:12,fontWeight:700,marginTop:4}}>
          <span style={{color:"#e2e8f0"}}>合計</span>
          <span style={{color:"#f472b6"}}>¥{fmt(bef.taxTotal)}</span>
        </div>
        <div style={{fontSize:10,color:"#64748b",marginTop:4,textAlign:"center"}}>
          月換算 ¥{fmtM(bef.taxTotal)}
        </div>
      </div>

      {/* 加入後 */}
      <div style={{...G.card,marginBottom:0,padding:14}}>
        <div style={{fontSize:10,color:"#38bdf8",fontWeight:700,marginBottom:8}}>✅ 加入後（年間）</div>
        {[
          ["実質会員費", (ASSOC.memberFee - ASSOC.takeHome)*12, "#f59e0b"],
          ["個人事業税",jigyoZeiAft,"#f87171"],
          ["所得税",incomeTaxAft,"#f87171"],
          ["住民税",juminZeiAft,"#f87171"],
        ].filter(Boolean).map(([k,v,c],idx)=>(
          <div key={k}>
            <div style={{display:"flex",justifyContent:"space-between",
              padding:"4px 0",borderBottom:"1px solid #0f172a",fontSize:11}}>
              <span style={{color:"#94a3b8"}}>{k}</span>
              <span style={{color:c,fontWeight:700}}>¥{fmt(v)}</span>
            </div>
            {idx===0 && (
              <div style={{fontSize:9,color:"#64748b",padding:"2px 0 4px",borderBottom:"1px solid #0f172a"}}>
                内訳: 会費 ¥{fmt(ASSOC.memberFee*12)} − 役員報酬手取り ¥{fmt(ASSOC.takeHome*12)}
              </div>
            )}
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:12,fontWeight:700,marginTop:4}}>
          <span style={{color:"#e2e8f0"}}>合計</span>
          <span style={{color:"#f472b6"}}>¥{fmt(taxTotalAft)}</span>
        </div>
        <div style={{fontSize:10,color:"#64748b",marginTop:4,textAlign:"center"}}>
          月換算 ¥{fmtM(taxTotalAft)}
        </div>
      </div>
    </div>

    {/* 手取り比較 */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
      <NetBox label="加入前 年間手取り" net={bef.net} total={jigyoShotoku} color1="#78350f" color2="#92400e"/>
      <NetBox label="加入後 年間手取り" net={netAft} total={jigyoShotoku} color1="#0c4a6e" color2="#0e7490"/>
    </div>

    {/* ボトムCTA */}
    {jigyoShotoku > 0 && isPositive && (
      <div style={{
        background:"linear-gradient(135deg,rgba(201,168,76,0.15),rgba(224,192,104,0.1))",
        border:"1px solid #c9a84c",borderRadius:14,padding:"18px 16px",
        textAlign:"center",marginBottom:14
      }}>
        <div style={{fontSize:12,color:"#e0c068",fontWeight:700,marginBottom:6}}>
          年間 ¥{fmt(saving)} の損失、見過ごせますか？
        </div>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:14,lineHeight:1.7}}>
          実際にご自身の状況で最大限の効果が出るか<br/>
          無料で確認できます
        </div>
        <a
          href="https://zaimusienkikou-website.vercel.app/contact.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:"inline-block",
            background:"linear-gradient(135deg,#c9a84c,#e0c068)",
            color:"#1a2744",
            padding:"14px 28px",
            borderRadius:8,
            fontSize:14,
            fontWeight:700,
            letterSpacing:"0.05em",
            textDecoration:"none",
            boxShadow:"0 4px 12px rgba(201,168,76,0.3)",
          }}
        >
          無料で相談する →
        </a>
      </div>
    )}

    <p style={{fontSize:11,color:"#334155",textAlign:"center",lineHeight:1.9}}>
      ※国民健康保険は東京・新宿区 令和8年度料率に基づく概算。市区町村により異なります<br/>
      ※会員費の経費算入可否は税務上の判断が必要です<br/>
      ※所得税・住民税の試算は概算です
    </p>
    </div>{/* pc-right end */}
    </div>{/* pc-two-col end */}
  </div>);
}

// ─── 解説ページ ───────────────────────────────────
function ExplainPage({ simInputs }) {
  // simInputsがあれば実数、なければデモ値を使う
  const nhi      = simInputs?.nhi      ?? 760000;
  const nenkin   = simInputs?.nenkin   ?? 203760;
  const socEmp   = 0;  // 社保は会員費に含まれるため控除なし
  const fee      = simInputs?.fee      ?? ASSOC.memberFee*12;
  const takehome = simInputs?.takehome ?? ASSOC.takeHome*12;
  const taxRate  = simInputs?.taxRate ?? calcMarginalRate(0);
  const saving   = simInputs?.saving   ?? null;

  const totalBef    = nhi + nenkin;
  const netFeeCost  = simInputs?.netMemberCost ?? (ASSOC.memberFee - ASSOC.takeHome) * 12;
  const totalAft    = netFeeCost + socEmp;
  const taxEffect   = Math.round(netFeeCost * taxRate / 100);
  const isDemo      = simInputs === null;

  // 税金変動・その他（実数 or デモ値）— expDedはdedChangeより先に定義
  const expDed = false;
  const taxChangeBef   = simInputs?.taxChangeBef ?? null;
  const taxChangeAft   = simInputs?.taxChangeAft ?? null;
  const taxChange      = (taxChangeBef !== null && taxChangeAft !== null) ? taxChangeAft - taxChangeBef : null;
  const cashSaving     = simInputs?.cashSaving ?? (totalBef - netFeeCost);
  const dedChange      = socEmp - totalBef;

  const Block = ({title, color, children}) => (
    <div style={{borderLeft:`3px solid ${color}`,paddingLeft:12,marginBottom:20}}>
      <div style={{fontSize:12,color,fontWeight:700,letterSpacing:"0.06em",marginBottom:8}}>{title}</div>
      {children}
    </div>
  );

  const MiniCard = ({label, value, color, sub}) => (
    <div style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
      <div style={{fontSize:10,color:"#64748b",marginBottom:2}}>{label}</div>
      <div style={{fontSize:16,fontWeight:700,color}}>{value}</div>
      {sub&&<div style={{fontSize:9,color:"#475569",marginTop:1}}>{sub}</div>}
    </div>
  );

  return (
    <div>
      {isDemo&&(
        <div style={{background:"rgba(56,189,248,0.07)",border:"1px solid #1e3a5f",borderRadius:10,
          padding:"8px 14px",marginBottom:14,fontSize:12,color:"#64748b"}}>
          💡 節税シミュタブで売上・経費を入力すると、この解説が実際の金額でリアルタイム更新されます
        </div>
      )}

      {/* ■ 結論 */}
      {(() => {
        const taxUp = taxChange !== null ? taxChange > 0 : null;
        const netUp = saving !== null ? saving >= 0 : null;
        return (
          <div style={{background:"linear-gradient(135deg,#14532d,#166534)",borderRadius:14,
            padding:"16px 18px",marginBottom:14,border:"1px solid #4ade80"}}>
            <div style={{fontSize:12,color:"#86efac",fontWeight:700,marginBottom:8}}>■ 結論</div>
            <div style={{fontSize:14,color:"#fff",lineHeight:1.9}}>
              {taxChange !== null ? (
                taxUp
                  ? <>所得税・住民税<span style={{color:"#f87171",fontWeight:700}}>↑</span> でも 手取り<span style={{color:"#4ade80",fontWeight:700}}>{netUp?"↑":"↓"}</span></>
                  : <>所得税・住民税<span style={{color:"#4ade80",fontWeight:700}}>↓</span>、手取り<span style={{color:"#4ade80",fontWeight:700}}>{netUp?"↑":"↓"}</span></>
              ) : "社会保険加入でトータルの手取りが増えやすい構造"}
            </div>
            <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              <MiniCard label="国保削減効果" value={`¥${fmt(cashSaving)}`} color="#4ade80" sub="年間キャッシュ改善"/>
              <MiniCard label="税金変動" value={taxChange!==null?`${taxChange>=0?"+":""}¥${fmt(taxChange)}`:"±概算"} color={taxChange!==null?(taxChange<=0?"#4ade80":"#f59e0b"):"#f59e0b"} sub={taxChange!==null?(taxChange<=0?"税金が減少":"税金が増加"):"上下する可能性"}/>
              <MiniCard label="年間手取り増減" value={saving!==null?`${saving>=0?"+":""}¥${fmt(saving)}`:"計算中"} color={saving!==null?(saving>=0?"#4ade80":"#f87171"):"#38bdf8"} sub="節税シミュで計算"/>
            </div>
          </div>
        );
      })()}

      {/* ■ なぜ所得税が上がるか */}
      <div style={G.card}>
        <Block title="■ なぜ所得税・住民税が上がる可能性があるのか" color="#f59e0b">
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:10}}>
            社会保険料控除の金額が変わるため
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            {/* 加入前 */}
            <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid #92400e",borderRadius:10,padding:"10px"}}>
              <div style={{fontSize:10,color:"#f59e0b",fontWeight:700,marginBottom:8}}>国保＋国民年金の場合</div>
              {[
                ["国民健康保険",nhi],
                ["国民年金",nenkin],
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{color:"#94a3b8"}}>{k}</span>
                  <span style={{color:"#f59e0b",fontWeight:700}}>¥{fmt(v)}</span>
                </div>
              ))}
              <div style={{marginTop:8,textAlign:"center"}}>
                <div style={{fontSize:10,color:"#64748b"}}>合計控除</div>
                <div style={{fontSize:20,fontWeight:700,color:"#f59e0b"}}>¥{fmt(totalBef)}</div>
                <div style={{fontSize:10,color:"#f59e0b",marginTop:2}}>→ {fmt(totalBef)}円分、課税所得が下がる</div>
              </div>
            </div>

            {/* 加入後 */}
            <div style={{background:"rgba(56,189,248,0.08)",border:"1px solid #1e3a5f",borderRadius:10,padding:"10px"}}>
              <div style={{fontSize:10,color:"#38bdf8",fontWeight:700,marginBottom:8}}>社会保険の場合</div>
              {[
                ["社保員負担（社会保険料控除）", socEmp],
                
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{color:"#94a3b8"}}>{k}</span>
                  <span style={{color:"#38bdf8",fontWeight:700}}>¥{fmt(v)}</span>
                </div>
              ))}
              <div style={{marginTop:8,textAlign:"center"}}>
                <div style={{fontSize:10,color:"#64748b"}}>合計控除</div>
                <div style={{fontSize:20,fontWeight:700,color:"#38bdf8"}}>¥{fmt(socEmp)}</div>
                <div style={{fontSize:10,color:dedChange>=0?"#4ade80":"#f87171",marginTop:2}}>
                → 控除が¥{fmt(Math.abs(dedChange))}{dedChange>=0?"増える":"減る"}
              </div>
              </div>
            </div>
          </div>

          {/* 控除差フロー */}
          <div style={{background:dedChange>=0?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)",border:dedChange>=0?"1px solid #166534":"1px solid #7f1d1d",borderRadius:8,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:11,color:dedChange>=0?"#86efac":"#fca5a5",lineHeight:1.8}}>
              控除が <strong style={{color:dedChange>=0?"#4ade80":"#f87171",fontSize:14}}>¥{fmt(Math.abs(dedChange))}</strong> {dedChange>=0?"増える":"減る"}
              <span style={{margin:"0 8px",color:"#475569"}}>→</span>
              課税所得が <strong style={{color:dedChange>=0?"#4ade80":"#f87171",fontSize:14}}>¥{fmt(Math.abs(dedChange))}</strong> {dedChange>=0?"減少":"増加"}
              <span style={{margin:"0 8px",color:"#475569"}}>→</span>
              所得税・住民税 <strong style={{color:dedChange>=0?"#4ade80":"#f87171"}}>{dedChange>=0?"↓":"↑"}</strong>
            </div>
          </div>
        </Block>

        {/* ■ しかし重要なのはキャッシュ */}
        <Block title="■ しかし重要なのは実際のキャッシュ支出" color="#4ade80">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid #92400e",borderRadius:10,padding:"10px"}}>
              <div style={{fontSize:10,color:"#f59e0b",fontWeight:700,marginBottom:8}}>国保の場合（年間）</div>
              {[["国保",nhi],["国民年金",nenkin]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{color:"#94a3b8"}}>{k}</span>
                  <span style={{color:"#f87171",fontWeight:700}}>¥{fmt(v)}</span>
                </div>
              ))}
              <div style={{textAlign:"center",marginTop:6}}>
                <div style={{fontSize:11,color:"#64748b"}}>合計支出</div>
                <div style={{fontSize:18,fontWeight:700,color:"#f87171"}}>¥{fmt(totalBef)}</div>
              </div>
            </div>
            <div style={{background:"rgba(56,189,248,0.08)",border:"1px solid #1e3a5f",borderRadius:10,padding:"10px"}}>
              <div style={{fontSize:10,color:"#38bdf8",fontWeight:700,marginBottom:8}}>社会保険の場合（年間）</div>
              {[["実質会員費（会員費-手取り）",netFeeCost]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{color:"#94a3b8"}}>{k}</span>
                  <span style={{color:"#f87171",fontWeight:700}}>¥{fmt(v)}</span>
                </div>
              ))}
              <div style={{fontSize:10,color:"#64748b",marginTop:4,textAlign:"center"}}>※社保は会員費に含まれます</div>
              <div style={{textAlign:"center",marginTop:4}}>
                <div style={{fontSize:11,color:"#64748b"}}>合計支出</div>
                <div style={{fontSize:18,fontWeight:700,color:"#38bdf8"}}>¥{fmt(netFeeCost)}</div>
              </div>
            </div>
          </div>
          <div style={{background:"rgba(74,222,128,0.1)",border:"1px solid #166534",borderRadius:8,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:11,color:"#86efac"}}>キャッシュ改善効果</div>
            <div style={{fontSize:28,fontWeight:700,color:"#4ade80"}}>▲¥{fmt(cashSaving)}</div>
            <div style={{fontSize:11,color:"#86efac"}}>月換算 ▲¥{fmt(Math.round(cashSaving/12))}</div>
          </div>
        </Block>


        {/* ■ 全体整理 */}
        <Block title="■ 全体整理" color="#38bdf8">
          {[
            {label:"社会保険削減効果", val:`+¥${fmt(cashSaving)}`, color:"#4ade80"},
            {label:"税金変動（目安）", val:"▲0〜10万円程度", color:"#f59e0b"},
          ].map(({label,val,color})=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"8px 0",borderBottom:"1px solid #1e293b",fontSize:13}}>
              <span style={{color:"#94a3b8"}}>{label}</span>
              <span style={{color,fontWeight:700}}>{val}</span>
            </div>
          ))}
        </Block>

        {/* ■ 判断基準 */}
        <Block title="■ 判断の3ステップ" color="#f472b6">
          {[
            {n:"①", text:"社会保険料がいくら減るか", sub:"国保＋国民年金の現在額を確認"},
            {n:"②", text:"法人・社団コストがいくらかかるか", sub:"会員費 - 役員報酬手取り = 実質負担"},
            {n:"③", text:"税金がどの程度変動するか", sub:"控除の変化 × 実効税率で概算"},
          ].map(({n,text,sub})=>(
            <div key={n} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid #1e293b"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"#be185d",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,fontWeight:700,color:"#fff",flexShrink:0,marginTop:1}}>{n}</div>
              <div>
                <div style={{fontSize:13,color:"#e2e8f0",fontWeight:500}}>{text}</div>
                <div style={{fontSize:11,color:"#64748b",marginTop:1}}>{sub}</div>
              </div>
            </div>
          ))}
          <div style={{background:"rgba(244,114,182,0.1)",borderRadius:8,padding:"10px",marginTop:10,
            fontSize:12,color:"#f9a8d4",textAlign:"center",lineHeight:1.7}}>
            <strong>必ずトータルキャッシュで判断する</strong><br/>
            税金だけを見て判断しないこと
          </div>
        </Block>

        {/* ■ 国保 vs 社保 メリット・デメリット */}
        <Block title="■ 国保 vs 社保 メリット・デメリット" color="#e2e8f0">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>

            {/* 国民健康保険 */}
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#f59e0b",marginBottom:8,textAlign:"center",
                background:"rgba(245,158,11,0.1)",borderRadius:8,padding:"6px"}}>
                📋 国民健康保険
              </div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,color:"#4ade80",fontWeight:700,marginBottom:4}}>✅ メリット</div>
                {[
                  "収入が低いと保険料も安い",
                  "手続きがシンプル",
                  "個人単位（扶養の概念なし）",
                ].map(t=>(
                  <div key={t} style={{display:"flex",gap:5,fontSize:11,color:"#94a3b8",padding:"3px 0",borderBottom:"1px solid #0f172a"}}>
                    <span style={{color:"#4ade80",flexShrink:0}}>＋</span>{t}
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:10,color:"#f87171",fontWeight:700,marginBottom:4}}>❌ デメリット</div>
                {[
                  "所得↑で保険料がかなり高くなる",
                  "傷病手当金なし",
                  "出産手当金なし",
                  "将来の年金が少ない（国年のみ）",
                ].map(t=>(
                  <div key={t} style={{display:"flex",gap:5,fontSize:11,color:"#94a3b8",padding:"3px 0",borderBottom:"1px solid #0f172a"}}>
                    <span style={{color:"#f87171",flexShrink:0}}>－</span>{t}
                  </div>
                ))}
              </div>
            </div>

            {/* 社会保険 */}
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#38bdf8",marginBottom:8,textAlign:"center",
                background:"rgba(56,189,248,0.1)",borderRadius:8,padding:"6px"}}>
                ✅ 社会保険
              </div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,color:"#4ade80",fontWeight:700,marginBottom:4}}>✅ メリット</div>
                {[
                  "保険料が一定で安定",
                  "国保より安くなるケース多い",
                  "傷病手当金あり",
                  "出産手当金あり",
                  "厚生年金で将来の年金↑",
                  "扶養制度が使える",
                  "キャッシュフロー安定",
                  "各種審査が通りやすい",
                ].map(t=>(
                  <div key={t} style={{display:"flex",gap:5,fontSize:11,color:"#94a3b8",padding:"3px 0",borderBottom:"1px solid #0f172a"}}>
                    <span style={{color:"#4ade80",flexShrink:0}}>＋</span>{t}
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:10,color:"#f87171",fontWeight:700,marginBottom:4}}>❌ デメリット</div>
                {[
                  "所得が低いとメリット薄い",
                  "社保等級に影響される",
                ].map(t=>(
                  <div key={t} style={{display:"flex",gap:5,fontSize:11,color:"#94a3b8",padding:"3px 0",borderBottom:"1px solid #0f172a"}}>
                    <span style={{color:"#f87171",flexShrink:0}}>－</span>{t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 結論ひとこと */}
          <div style={{background:"rgba(56,189,248,0.07)",border:"1px solid #1e3a5f",borderRadius:8,
            padding:"10px 12px",marginTop:12,fontSize:12,color:"#7dd3fc",lineHeight:1.8}}>
            💡 <strong style={{color:"#fff"}}>課税所得200万円以上の個人事業主</strong>なら、社会保険のメリットが上回るケースがほとんど。保険料削減＋将来年金増＋各種手当の三重メリット。
          </div>
        </Block>
      </div>
    </div>
  );
}

// ─── 概算早見表ページ ─────────────────────────────
// 新宿区 令和8年度 国民健康保険料（PDF早見表に準拠）
// 所得割合計 10.58%（医療＋支援＋子育て）/ 均等割合計 67,073 / 限度額合計 960,000
// 介護分（40〜64歳のみ）: 所得割 2.43% / 均等割 17,800 / 限度額 170,000
function calcTokyoNHI(income, age) {
  const base = Math.max(income - 430000, 0);
  // 医療分 + 後期高齢者支援金分 + 子ども・子育て支援金分（合算）
  const main = Math.min(Math.floor(base * 0.1058 + 67073), 960000);
  // 介護分（40〜64歳のみ）
  const kaigo = age === "40〜64歳"
    ? Math.min(Math.floor(base * 0.0243 + 17800), 170000)
    : 0;
  return main + kaigo;
}

// 加入後の年間実質負担額: 会費 - 役員報酬手取り = 33,908円/月 × 12
const AFTER_ANNUAL = (ASSOC.memberFee - ASSOC.takeHome) * 12; // 406,896 (33,908×12)

function QuickTablePage() {
  const [age, setAge]   = useState("40歳未満");
  const [pref, setPref] = useState("東京");

  // 所得レンジ 150万〜1200万
  const incomes = [150,200,250,300,350,400,450,500,600,700,800,900,1000,1200].map(v=>v*10000);

  // 国民年金（令和8年度）
  const nenkinM = age === "65歳以上" ? 0 : 17920;
  const nenkinY = nenkinM * 12;

  return (
    <div>
      {/* 条件設定 */}
      <div style={G.card}>
        <div className="sec">表示条件</div>
        <div style={G.row2}>
          <div>
            <label>都道府県</label>
            <select value={pref} onChange={e=>setPref(e.target.value)}>
              {PREFS.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label>年齢区分</label>
            <select value={age} onChange={e=>setAge(e.target.value)}>
              <option>40歳未満</option><option>40〜64歳</option>
            </select>
          </div>
        </div>
        {/* 加入後固定コスト説明 */}
        <div style={{background:"rgba(56,189,248,0.06)",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#64748b",lineHeight:1.8}}>
          <strong style={{color:"#38bdf8"}}>加入後コスト（固定）</strong><br/>
          会員費 ¥{fmt(ASSOC.memberFee*12)}/年 − 役員報酬手取り ¥{fmt(ASSOC.takeHome*12)}/年<br/>
          ＝ <strong style={{color:"#fff"}}>実質 ¥{fmt((ASSOC.memberFee - ASSOC.takeHome)*12)}/年</strong>
          <span style={{fontSize:10,color:"#475569"}}> （月換算 ¥{fmt(ASSOC.memberFee - ASSOC.takeHome)}）</span>
        </div>
      </div>

      <div style={{fontSize:11,color:"#64748b",marginBottom:10,textAlign:"center"}}>
        ※社会保険コストのみの比較。税金の増減は含まれません。<br/>
        {pref !== "東京" && <span style={{color:"#f59e0b"}}>※現在のバージョンでは国保は東京・新宿区料率を使用しています</span>}
      </div>

      {/* 早見表カードリスト */}
      <div className="hayami-grid">
      {incomes.map(income => {
        const nhiY  = calcTokyoNHI(income, age);
        const nhiM  = Math.round(nhiY / 12);
        const befM  = nhiM + nenkinM;
        const befY  = nhiY + nenkinY;
        const savingY = befY - AFTER_ANNUAL;
        const isPositive = savingY > 0;

        return (
          <div key={income} style={{
            background: isPositive
              ? "rgba(20,83,45,0.25)"
              : "rgba(127,29,29,0.25)",
            border: `1px solid ${isPositive ? "#166534" : "#7f1d1d"}`,
            borderRadius:14, padding:"14px 16px", marginBottom:10,
          }}>
            {/* タイトル行 */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <span style={{fontSize:16,fontWeight:700,color:"#e2e8f0"}}>所得 {fmt(income/10000)}万円</span>
                <span style={{fontSize:10,color:"#64748b",marginLeft:6}}>{pref}・{age}</span>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:isPositive?"#86efac":"#fca5a5"}}>年間節約効果</div>
                <div style={{fontSize:20,fontWeight:700,color:isPositive?"#4ade80":"#f87171"}}>
                  {isPositive?"▲":"＋"}¥{fmt(Math.abs(savingY))}
                </div>
              </div>
            </div>

            {/* 加入前後の横並び比較 */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {/* 加入前 */}
              <div style={{background:"rgba(245,158,11,0.1)",borderRadius:10,padding:"10px"}}>
                <div style={{fontSize:10,color:"#f59e0b",fontWeight:700,marginBottom:6}}>📋 加入前</div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}>
                  <span style={{color:"#94a3b8"}}>国保</span>
                  <span style={{color:"#f59e0b",fontWeight:700}}>¥{fmt(nhiM)}/月</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}>
                  <span style={{color:"#94a3b8"}}>国民年金</span>
                  <span style={{color:"#f59e0b",fontWeight:700}}>¥{fmt(nenkinM)}/月</span>
                </div>
                <div style={{borderTop:"1px solid rgba(245,158,11,0.2)",marginTop:6,paddingTop:6}}>
                  <div style={{fontSize:10,color:"#64748b",textAlign:"center"}}>月合計</div>
                  <div style={{fontSize:17,fontWeight:700,color:"#f59e0b",textAlign:"center"}}>¥{fmt(befM)}</div>
                  <div style={{fontSize:10,color:"#64748b",textAlign:"center"}}>年間 ¥{fmt(befY)}</div>
                </div>
              </div>

              {/* 加入後 */}
              <div style={{background:"rgba(56,189,248,0.1)",borderRadius:10,padding:"10px"}}>
                <div style={{fontSize:10,color:"#38bdf8",fontWeight:700,marginBottom:6}}>✅ 加入後</div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}>
                  <span style={{color:"#94a3b8"}}>実質会員費</span>
                  <span style={{color:"#38bdf8",fontWeight:700}}>¥{fmt(ASSOC.memberFee-ASSOC.takeHome)}/月</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}>
                  <span style={{color:"#94a3b8"}}>国保・国年</span>
                  <span style={{color:"#4ade80",fontWeight:700}}>不要</span>
                </div>
                <div style={{borderTop:"1px solid rgba(56,189,248,0.2)",marginTop:6,paddingTop:6}}>
                  <div style={{fontSize:10,color:"#64748b",textAlign:"center"}}>月合計</div>
                  <div style={{fontSize:17,fontWeight:700,color:"#38bdf8",textAlign:"center"}}>¥{fmt(ASSOC.memberFee-ASSOC.takeHome)}</div>
                  <div style={{fontSize:10,color:"#64748b",textAlign:"center"}}>年間 ¥{fmt(AFTER_ANNUAL)}</div>
                </div>
              </div>
            </div>

            {/* 結果バー */}
            <div style={{marginTop:10,background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"8px 12px",
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,color:"#94a3b8"}}>
                ¥{fmt(befY)} － ¥{fmt(AFTER_ANNUAL)}
              </span>
              <span style={{fontSize:14,fontWeight:700,color:isPositive?"#4ade80":"#f87171"}}>
                = {isPositive?"▲":"＋"}¥{fmt(Math.abs(savingY))}/年
              </span>
            </div>

            {/* 月換算 */}
            {isPositive && (
              <div style={{textAlign:"center",marginTop:6,fontSize:11,color:"#86efac"}}>
                月換算 約 <strong style={{color:"#4ade80"}}>¥{fmt(Math.round(savingY/12))}</strong> の所得アップ
              </div>
            )}
          </div>
        );
      })}
      </div>

      {/* CTA: 早見表ページ */}
      <div style={{
        background:"linear-gradient(135deg,rgba(201,168,76,0.15),rgba(224,192,104,0.1))",
        border:"1px solid #c9a84c",borderRadius:14,padding:"20px 18px",
        textAlign:"center",marginTop:20,marginBottom:14
      }}>
        <div style={{fontSize:13,color:"#e0c068",fontWeight:700,marginBottom:6}}>
          ご自身の状況で正確に試算するなら
        </div>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:14,lineHeight:1.7}}>
          売上・経費を入力すれば、より精緻な節税効果が分かります<br/>
          専門家による無料相談も受付中
        </div>
        <a
          href="https://zaimusienkikou-website.vercel.app/contact.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:"inline-block",
            background:"linear-gradient(135deg,#c9a84c,#e0c068)",
            color:"#1a2744",
            padding:"14px 32px",
            borderRadius:8,
            fontSize:14,
            fontWeight:700,
            letterSpacing:"0.05em",
            textDecoration:"none",
            boxShadow:"0 4px 12px rgba(201,168,76,0.3)",
          }}
        >
          ＼無料相談はこちら／ →
        </a>
      </div>

      <p style={{fontSize:11,color:"#334155",textAlign:"center",marginTop:8,lineHeight:1.8}}>
        ※国保は東京・新宿区 令和8年度料率を使用した概算です<br/>
        ※所得税・住民税の増減は含まれていません<br/>
        ※実際の節税効果は節税シミュタブで確認ください
      </p>
    </div>
  );
}

// ─── メインApp ────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("hayami");
  const [simData, setSimData] = useState(null);

  // SimPageの入力をAppで保持 → タブ切り替えでも消えない
  const [simInputs, setSimInputs] = useState({
    sales:"", expenses:"", aoshiro:"65万（e-Tax）", age:"40歳未満", deps:0
  });

  const TABS=[
    {key:"hayami",  icon:"📊", label:"早見表"},
    {key:"sim",     icon:"⚡", label:"節税シミュ"},
    {key:"explain", icon:"📖", label:"解説"},
  ];

  return (
    <div style={{minHeight:"100vh",background:G.bg,
      fontFamily:"'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif",
      color:"#e2e8f0",padding:"20px 16px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
        *{box-sizing:border-box;}
        input,select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;
          padding:8px 12px;font-size:14px;width:100%;outline:none;transition:border-color 0.2s;font-family:inherit;}
        input:focus,select:focus{border-color:#38bdf8;box-shadow:0 0 0 2px rgba(56,189,248,0.15);}
        label{font-size:12px;color:#94a3b8;margin-bottom:4px;display:block;font-weight:500;letter-spacing:0.05em;}
        .sec{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#475569;font-weight:700;margin-bottom:12px;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}

        /* ── レスポンシブ ── */
        .pc-layout { display: block; }
        .pc-two-col { display: block; }
        .hayami-grid { display: block; }

        @media (min-width: 768px) {
          .main-container { max-width: 1100px !important; }
          .header-area { margin-bottom: 24px; }
          .tab-bar button { padding: 14px 10px !important; font-size: 14px !important; }
          .tab-bar button div:first-child { font-size: 24px !important; }
          .tab-bar button div:last-child { font-size: 13px !important; }

          /* 節税シミュ: 入力 左 / 結果 右 の2カラム */
          .pc-two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            align-items: start;
          }

          /* 早見表: 2列グリッド */
          .hayami-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          /* カードのフォントサイズをPCで少し大きく */
          .result-value { font-size: 16px !important; }
          .net-amount { font-size: 32px !important; }
        }

        @media (min-width: 1024px) {
          /* 早見表: 3列に */
          .hayami-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
      `}</style>

      <div className="main-container" style={{maxWidth:480,margin:"0 auto"}}>
        {/* えんむすびブランディング */}
        <div className="header-area" style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:16, paddingBottom:14,
          borderBottom:"1px solid rgba(201,168,76,0.2)",
        }}>
          <div>
            <div style={{fontSize:10,letterSpacing:"0.15em",color:"#38bdf8",fontWeight:700,marginBottom:3}}>TAX SIMULATOR</div>
            <h1 style={{fontSize:18,fontWeight:700,margin:0,lineHeight:1.3}}>社会保険・税金シミュレーター</h1>
            <p style={{fontSize:11,color:"#64748b",marginTop:2}}>令和8年度（2026年）対応</p>
          </div>
          <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
            <div style={{fontSize:9,color:"#c9a84c",letterSpacing:"0.1em",marginBottom:2,opacity:0.8}}>Provided by</div>
            <div style={{fontSize:13,fontWeight:700,color:"#c9a84c",letterSpacing:"0.08em",lineHeight:1.2}}>えんむすび</div>
            <div style={{fontSize:8,color:"#475569",marginTop:2,lineHeight:1.4}}>一般社団法人<br/>中小企業財務支援機構</div>
          </div>
        </div>

        <div className="tab-bar" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:18}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{
              background:tab===t.key?"linear-gradient(135deg,#0c4a6e,#0e7490)":"rgba(255,255,255,0.03)",
              border:tab===t.key?"1px solid #38bdf8":"1px solid #334155",
              borderRadius:10,padding:"10px 6px",cursor:"pointer",
              color:"#e2e8f0",transition:"all 0.2s",textAlign:"center",
            }}>
              <div style={{fontSize:20,marginBottom:1}}>{t.icon}</div>
              <div style={{fontSize:12,fontWeight:700}}>{t.label}</div>
            </button>
          ))}
        </div>

        {tab==="hayami"   && <QuickTablePage/>}
        <div style={{display: tab==="sim" ? "block" : "none"}}>
          <SimPage onCalc={setSimData} inputs={simInputs} setInputs={setSimInputs}/>
        </div>
        {tab==="explain"  && <ExplainPage simInputs={simData}/>}
      </div>
    </div>
  );
}
