import { useState } from "react";

const LINE_URL = "https://line.me/R/ti/p/@148cciyn";

// ============================================================
// 共通ユーティリティ
// ============================================================
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;800&family=Yomogi&display=swap');* { box-sizing:border-box; margin:0; padding:0; }`;

function getLineType(score, totalMax) {
  const pct = totalMax > 0 ? (score / totalMax) * 100 : 0;
  if (pct >= 75) return "Aタイプ";
  if (pct >= 50) return "Bタイプ";
  if (pct >= 25) return "Cタイプ";
  return "Dタイプ";
}

function getPercentile(score, totalMax) {
  const pct = totalMax > 0 ? (score / totalMax) * 100 : 0;
  if (pct >= 75) return "上位20%";
  if (pct >= 50) return "上位50%";
  if (pct >= 25) return "上位75%";
  return "下位25%";
}

function calcSumaiAge(score, totalMax) {
  const pct = totalMax > 0 ? score / totalMax : 0;
  return Math.round(85 - pct * 65);
}

function getRiskType(worstCat) {
  if (!worstCat) return { emoji:"🌱", name:"安心維持型", num:1 };
  if (worstCat.includes("水害") || worstCat.includes("浸水")) return { emoji:"🌊", name:"災害脆弱型", num:2 };
  if (worstCat.includes("耐震") || worstCat.includes("構造")) return { emoji:"🏚️", name:"老朽化リスク型", num:3 };
  if (worstCat.includes("家計") || worstCat.includes("住居費")) return { emoji:"💰", name:"維持費圧迫型", num:4 };
  if (worstCat.includes("売却") || worstCat.includes("資産")) return { emoji:"📊", name:"資産価値低下型", num:5 };
  if (worstCat.includes("街") || worstCat.includes("設備")) return { emoji:"🛣️", name:"インフラ依存型", num:6 };
  if (worstCat.includes("コミュニティ") || worstCat.includes("近隣")) return { emoji:"🤝", name:"孤立リスク型", num:7 };
  if (worstCat.includes("地盤") || worstCat.includes("基礎")) return { emoji:"📉", name:"地盤リスク型", num:8 };
  if (worstCat.includes("自立") || worstCat.includes("住む人")) return { emoji:"🧑", name:"生活自立リスク型", num:9 };
  return { emoji:"⚠️", name:"複合リスク型", num:10 };
}

function defaultRisk(score, totalMax) {
  const pct = totalMax > 0 ? (score / totalMax) * 100 : 0;
  const levels = [
    { min:75, label:"住まう力：高い", color:"#16a34a", bg:"#f0fdf4", border:"#86efac", emoji:"🟢", desc:"現時点では大きなリスクは見当たりません。引き続き定期メンテナンスを続けましょう。" },
    { min:50, label:"住まう力：普通", color:"#d97706", bg:"#fefce8", border:"#fcd34d", emoji:"🟡", desc:"いくつか気になる点があります。専門家による確認をおすすめします。" },
    { min:25, label:"住まう力：要改善", color:"#ea580c", bg:"#fff7ed", border:"#fdba74", emoji:"🟠", desc:"複数のリスク要因があります。早めに点検・対策を検討してください。" },
    { min:0,  label:"住まう力：危険", color:"#dc2626", bg:"#fef2f2", border:"#fca5a5", emoji:"🔴", desc:"深刻なリスクの可能性があります。専門家による診断を早急に受けることをおすすめします。" },
  ];
  return levels.find(l => pct >= l.min);
}

function ProgressBar({ cur, total }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, width:"100%", maxWidth:540 }}>
      <div style={{ flex:1, height:8, background:"#e5e7eb", borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${(cur/total)*100}%`, background:"linear-gradient(90deg,#7c3aed,#db2777)", borderRadius:99, transition:"width 0.4s" }} />
      </div>
      <span style={{ fontSize:13, color:"#6b7280", whiteSpace:"nowrap", fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>{cur} / {total}</span>
    </div>
  );
}

function ScoreBar({ pct }) {
  const color = pct>=75?"#4ade80":pct>=50?"#facc15":pct>=25?"#fb923c":"#f87171";
  return <div style={{ height:10, background:"#e5e7eb", borderRadius:99, overflow:"hidden", marginTop:6 }}><div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:99, transition:"width 0.8s" }} /></div>;
}

// ============================================================
// 24問データ（8分野×3問）
// ============================================================
const QUESTIONS = [
  // 耐震・構造
  {id:1,category:"耐震・構造",emoji:"🏠",text:"建物が建てられたのはいつ頃ですか？",hint:"1981年以前は旧耐震基準で設計されており、大地震への対応が不十分な場合があります。",options:[{label:"1981年以前",score:0},{label:"1981年〜2000年頃",score:1},{label:"2000年以降",score:2},{label:"わからない",score:0}]},
  {id:2,category:"耐震・構造",emoji:"🔍",text:"外壁にひび割れ（クラック）はありますか？",hint:"0.3mm以上のひび割れは構造上の問題を示している可能性があります。",options:[{label:"ほとんど見当たらない",score:2},{label:"細いひび割れが数箇所",score:1},{label:"幅広いひび割れや段差がある",score:0},{label:"確認したことがない",score:0}]},
  {id:3,category:"耐震・構造",emoji:"🔧",text:"定期的なメンテナンス（外壁塗装・防水など）を行っていますか？",hint:"外壁塗装の目安は10〜15年。放置すると構造材の劣化を招きます。",options:[{label:"定期的に実施している",score:2},{label:"気になった時に対処",score:1},{label:"ほぼ手を入れていない",score:0}]},

  // 基礎・地盤
  {id:4,category:"基礎・地盤",emoji:"🪨",text:"建物の基礎の種類を把握していますか？",hint:"ベタ基礎は地盤への荷重分散が優れており、不同沈下が起きにくいです。",options:[{label:"ベタ基礎（床全面コンクリート）",score:2},{label:"布基礎（線状コンクリート）",score:1},{label:"把握していない",score:0}]},
  {id:5,category:"基礎・地盤",emoji:"🗺️",text:"ハザードマップで液状化リスクを確認しましたか？",hint:"国土交通省「ハザードマップポータルサイト」で無料確認できます。",options:[{label:"確認済み（リスク低）",score:2},{label:"確認済み（リスク高・対策検討中）",score:1},{label:"確認していない",score:0}]},
  {id:6,category:"基礎・地盤",emoji:"📐",text:"建物に傾きや床の傾斜を感じますか？",hint:"1/100以上の傾きは不同沈下の可能性があり、早急な専門家診断が必要です。",options:[{label:"まったく感じない",score:2},{label:"わずかに感じることがある",score:1},{label:"明らかに傾いている",score:0}]},

  // 設備・インフラ
  {id:7,category:"設備・インフラ",emoji:"🚿",text:"蛇口から赤水・濁り水が出たことがありますか？",hint:"赤水は給水管の腐食サイン。放置すると管の破裂リスクもあります。",options:[{label:"一度もない",score:2},{label:"たまに出る",score:1},{label:"よく出る・最近出た",score:0}]},
  {id:8,category:"設備・インフラ",emoji:"⚡",text:"分電盤（ブレーカー）はいつ頃設置・交換しましたか？",hint:"分電盤の耐用年数は13〜15年。古いものは漏電・火災リスクがあります。",options:[{label:"10年以内に交換済み",score:2},{label:"10〜20年前",score:1},{label:"20年以上前・わからない",score:0}]},
  {id:9,category:"設備・インフラ",emoji:"🔥",text:"ガス給湯器の設置からどのくらい経ちますか？",hint:"給湯器の耐用年数は10〜15年。古いものは一酸化炭素中毒のリスクがあります。",options:[{label:"10年以内",score:2},{label:"10〜15年",score:1},{label:"15年以上・わからない",score:0}]},

  // 水害・浸水
  {id:10,category:"水害・浸水",emoji:"🌊",text:"市区町村の洪水ハザードマップを確認しましたか？",hint:"国土交通省「ハザードマップポータルサイト」で無料確認できます。",options:[{label:"確認済み・浸水リスクなし",score:2},{label:"確認済み・リスクあり",score:0},{label:"まだ確認していない",score:0}]},
  {id:11,category:"水害・浸水",emoji:"📋",text:"火災保険に水災補償を付けていますか？",hint:"水災補償は別途オプションの場合が多く、未加入だと浸水被害が自己負担になります。",options:[{label:"水災補償あり",score:2},{label:"保険はあるが補償内容不明",score:1},{label:"水災補償なし・保険未加入",score:0}]},
  {id:12,category:"水害・浸水",emoji:"🔒",text:"浸水対策（止水板・防水扉・土のう等）を準備していますか？",hint:"ハザードマップでリスクがある場合、簡易止水板だけでも大きな効果があります。",options:[{label:"対策済み・準備している",score:2},{label:"検討中",score:1},{label:"何も準備していない",score:0}]},

  // 売却・資産価値
  {id:13,category:"売却・資産価値",emoji:"🚉",text:"最寄り駅からの距離はどのくらいですか？",hint:"駅徒歩10分以内は資産価値維持に有利。15分超は価格に影響することが多いです。",options:[{label:"徒歩10分以内",score:2},{label:"徒歩11〜20分",score:1},{label:"徒歩20分超・バス利用",score:0}]},
  {id:14,category:"売却・資産価値",emoji:"📜",text:"土地・建物の権利関係は明確ですか？",hint:"共有持分・抵当権・借地権などの複雑な権利は売却を難しくします。",options:[{label:"単独所有・権利明確",score:2},{label:"一部複雑な点がある",score:1},{label:"共有・借地・抵当権あり",score:0}]},
  {id:15,category:"売却・資産価値",emoji:"📉",text:"周辺の空き家・空き地・廃墟は増えていますか？",hint:"周辺の空き家増加は地域の資産価値下落のシグナルです。",options:[{label:"増えていない・活気がある",score:2},{label:"少し気になる",score:1},{label:"明らかに増えている",score:0}]},

  // 家計・住居費
  {id:16,category:"家計・住居費",emoji:"🏦",text:"住宅ローンまたは家賃は月収の何割ですか？",hint:"住居費は手取り月収の25〜30%以内が安全ラインとされています。",options:[{label:"25%未満",score:2},{label:"25〜35%",score:1},{label:"35%超・わからない",score:0}]},
  {id:17,category:"家計・住居費",emoji:"💳",text:"半年分以上の生活費を緊急予備資金として確保していますか？",hint:"緊急予備資金がないと収入減・突発的な出費で住居費が払えなくなるリスクがあります。",options:[{label:"6ヶ月分以上確保している",score:2},{label:"3〜6ヶ月分程度",score:1},{label:"3ヶ月未満・ほぼない",score:0}]},
  {id:18,category:"家計・住居費",emoji:"👴",text:"老後も現在の住居に住み続けられる資金計画がありますか？",hint:"年金だけで住居費・維持費を賄えるか、定年前に試算しておくことが重要です。",options:[{label:"試算済み・計画がある",score:2},{label:"漠然と考えている",score:1},{label:"まったく考えていない",score:0}]},

  // 近隣コミュニティ
  {id:19,category:"近隣コミュニティ",emoji:"👋",text:"近所の人と顔を合わせたとき挨拶していますか？",hint:"挨拶は地域コミュニティの最小単位。毎日の挨拶が信頼関係の土台になります。",options:[{label:"毎回挨拶する・立ち話もする",score:2},{label:"会えば挨拶する程度",score:1},{label:"ほとんど挨拶しない",score:0}]},
  {id:20,category:"近隣コミュニティ",emoji:"🆘",text:"災害時に助けを求められる近所の人がいますか？",hint:"災害時は行政より先に近隣が助け合います。顔の見える関係が命を救います。",options:[{label:"複数いる",score:2},{label:"1人はいる",score:1},{label:"いない・わからない",score:0}]},
  {id:21,category:"近隣コミュニティ",emoji:"😊",text:"最近1週間、近所の人と会話しましたか？",hint:"近所との会話頻度は孤立度の重要な指標です。週1回以上が望ましい。",options:[{label:"複数回あった",score:2},{label:"1回あった",score:1},{label:"なかった",score:0}]},

  // 住む人の自立力
  {id:22,category:"住む人の自立力",emoji:"🚶",
    text:"食事・入浴・着替えなど日常的な動作を一人でできていますか？",
    hint:"ADL（日常生活動作）の低下は早期発見・早期対応が重要です。",
    options:[{label:"すべて一人でできる",score:2},{label:"一部に不安がある",score:1},{label:"介助が必要な動作がある",score:0}]},
  {id:23,category:"住む人の自立力",emoji:"🧠",
    text:"最近、物忘れが増えた・同じことを繰り返し話すことが多くなりましたか？",
    hint:"認知機能の変化は本人より周囲が気づきやすいです。家族とも確認を。",
    options:[{label:"特に気になることはない",score:2},{label:"少し気になることがある",score:1},{label:"明らかに増えた・指摘された",score:0}]},
  {id:24,category:"住む人の自立力",emoji:"📋",
    text:"緊急時に連絡できる家族・支援者の連絡先を整理していますか？",
    hint:"緊急連絡先リストは、いざという時に自分を守る最低限の備えです。",
    options:[{label:"整理済み・共有している",score:2},{label:"おおよそ把握している",score:1},{label:"整理していない",score:0}]},

  // 街の維持力
  {id:25,category:"街の維持力",emoji:"🛒",text:"徒歩圏内にスーパー・コンビニはありますか？",hint:"「買い物難民」リスクのある地域は高齢化とともに住みにくくなります。",options:[{label:"徒歩10分以内にある",score:2},{label:"車で5〜10分程度",score:1},{label:"車で15分以上・ない",score:0}]},
  {id:26,category:"街の維持力",emoji:"🏗️",text:"近隣に再開発・新駅・大型商業施設などの計画はありますか？",hint:"開発計画は地域の将来価値を左右します。自治体HPや都市計画図で確認を。",options:[{label:"開発計画がある・進行中",score:2},{label:"特に情報なし",score:1},{label:"縮小・廃止の情報がある",score:0}]},
  {id:27,category:"街の維持力",emoji:"🏚️",text:"近所に空き家・空き地・廃墟は増えていますか？",hint:"空き家率の上昇は地域の衰退サイン。防犯・衛生・景観への悪影響も懸念されます。",options:[{label:"ほとんどない",score:2},{label:"少し目につく",score:1},{label:"明らかに増えている",score:0}]},
];

const TOTAL_MAX = QUESTIONS.reduce((acc,q) => acc + Math.max(...q.options.map(o=>o.score)), 0);
const CATEGORIES = [...new Set(QUESTIONS.map(q=>q.category))];

const CATEGORY_COMMENTS = {
  "耐震・構造":{high:"耐震・構造リスクは低い状態です。",middle:"耐震性に一部不安があります。耐震診断を検討しましょう。",low:"耐震・構造に深刻なリスクがあります。専門家の診断を受けてください。"},
  "基礎・地盤":{high:"基礎・地盤のリスクは低い状態です。",middle:"地盤や基礎に確認が必要な点があります。",low:"基礎・地盤に深刻なリスクがあります。早急に専門家の診断を。"},
  "設備・インフラ":{high:"設備は良好な状態です。",middle:"設備に一部老朽化があります。点検をおすすめします。",low:"設備に深刻なリスクがあります。専門業者による点検を早急に。"},
  "水害・浸水":{high:"水害リスクへの備えは良好です。",middle:"水害リスクに一部懸念があります。ハザードマップを確認しましょう。",low:"水害リスクが高い状態です。早急な対策が必要です。"},
  "売却・資産価値":{high:"資産価値の維持力は高い状態です。",middle:"資産価値に一部改善の余地があります。",low:"資産価値が低下するリスクがあります。専門家への相談を。"},
  "家計・住居費":{high:"住居費の持続力は高い状態です。",middle:"住居費の負担に一部懸念があります。資金計画を見直しましょう。",low:"住居費の持続に深刻なリスクがあります。早急に対策を。"},
  "近隣コミュニティ":{high:"近隣とのつながりは良好です。",middle:"近隣との関係に改善の余地があります。",low:"孤立リスクが高い状態です。つながりを意識して作りましょう。"},
  "住む人の自立力":{high:"日常生活の自立力・将来への備えは良好です。",middle:"一部に不安があります。かかりつけ医や家族と早めに相談しましょう。",low:"生活自立に深刻なリスクがあります。地域包括支援センターへの相談をおすすめします。"},
  "街の維持力":{high:"街の維持力は高い状態です。",middle:"街の将来に一部懸念があります。地域情報を収集しましょう。",low:"街の衰退リスクがあります。将来の住み替えも検討を。"},
};


const wrap = { minHeight:"100vh", fontFamily:"'M PLUS Rounded 1c',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", padding:"20px 16px 60px" };

export default function App() {
  const [housingType, setHousingType] = useState(null); // "mochiie" or "chintai"
  const [screen, setScreen] = useState("type"); // 最初は住居形態選択
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flash, setFlash] = useState(null);
  const [hint, setHint] = useState(false);

  const isChintai = housingType === "chintai";
  const ACTIVE_QUESTIONS = isChintai ? CHINTAI_QUESTIONS : QUESTIONS;
  const ACTIVE_CATEGORY_LIST = isChintai ? CHINTAI_CATEGORY_LIST : [["🏠","耐震・構造","3問"],["🪨","基礎・地盤","3問"],["🔧","設備・インフラ","3問"],["🌊","水害・浸水","3問"],["💰","売却・資産価値","3問"],["💴","家計・住居費","3問"],["🤝","近隣コミュニティ","3問"],["🚶","住む人の自立力","3問"],["🏗️","街の維持力","3問"]];
  const ACTIVE_COMMENTS = isChintai ? CHINTAI_CATEGORY_COMMENTS : CATEGORY_COMMENTS;
  const ACTIVE_TOTAL_MAX = ACTIVE_QUESTIONS.reduce((acc,q) => acc + Math.max(...q.options.map(o=>o.score)), 0);
  const ACTIVE_CATEGORIES = [...new Set(ACTIVE_QUESTIONS.map(q=>q.category))];

  const q = ACTIVE_QUESTIONS[cur];
  const totalScore = Object.values(answers).reduce((a,b)=>a+b, 0);
  const risk = defaultRisk(totalScore, ACTIVE_TOTAL_MAX);

  function selectHousingType(type) {
    setHousingType(type);
    setScreen("top");
  }

  function handleSelect(idx, score) {
    if (flash !== null) return;
    setFlash(idx);
    setTimeout(() => {
      const newAns = { ...answers, [q.id]: score };
      setAnswers(newAns);
      setFlash(null);

      setHint(false);
      if (cur + 1 < ACTIVE_QUESTIONS.length) setCur(cur + 1);
      else setScreen("result");
    }, 380);
  }

  function restart() { setScreen("type"); setHousingType(null); setCur(0); setAnswers({}); setFlash(null); setHint(false); window.scrollTo({top:0}); }

  const accent = "#7c3aed";
  const accentDark = "#5b21b6";
  const accentBg = "#f5f3ff";
  const accentBorder = "#c4b5fd";
  const grad = "linear-gradient(135deg,#7c3aed,#db2777)";
  const card = { width:"100%", maxWidth:540, background:"#fff", borderRadius:24, border:`2.5px solid ${accentBorder}`, boxShadow:`4px 6px 0px ${accentBorder}`, padding:"28px 24px" };

  // ── TOP
  // ── TYPE SELECT（住居形態選択）
  if (screen === "type") return (
    <div style={{ ...wrap, background:"linear-gradient(160deg,#f5f3ff 0%,#fdf2f8 100%)" }}>
      <style>{FONTS}</style>
      <div style={{ width:"100%", maxWidth:540 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>🏆</div>
          <h1 style={{ fontFamily:"'Yomogi',cursive", fontSize:26, color:accent, lineHeight:1.4, marginBottom:4 }}>「住まう力」総合診断</h1>
          <div style={{ textAlign:"right", marginBottom:8 }}>
            <span style={{ fontSize:10, color:"#9ca3af", fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>マンション管理士監修</span>
          </div>
          <p style={{ fontSize:14, color:"#9ca3af", lineHeight:1.7 }}>まず、あなたのお住まいを教えてください</p>
        </div>
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:"#374151", textAlign:"center", marginBottom:16 }}>あなたのお住まいは？</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <button onClick={()=>selectHousingType("mochiie")}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"18px 16px", background:"#faf5ff", border:"2.5px solid #c4b5fd", borderRadius:16, cursor:"pointer", textAlign:"left" }}>
              <span style={{ fontSize:32 }}>🏠</span>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:"#374151" }}>持ち家</div>
                <div style={{ fontSize:12, color:"#9ca3af" }}>一戸建て・マンション（所有）</div>
              </div>
              <span style={{ marginLeft:"auto", fontSize:18, color:"#7c3aed" }}>›</span>
            </button>
            <button onClick={()=>selectHousingType("chintai")}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"18px 16px", background:"#f0f9ff", border:"2.5px solid #93c5fd", borderRadius:16, cursor:"pointer", textAlign:"left" }}>
              <span style={{ fontSize:32 }}>🏢</span>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:"#374151" }}>賃貸</div>
                <div style={{ fontSize:12, color:"#9ca3af" }}>アパート・マンション（賃貸）</div>
              </div>
              <span style={{ marginLeft:"auto", fontSize:18, color:"#3b82f6" }}>›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── TOP
  if (screen === "top") return (
    <div style={{ ...wrap, background:"linear-gradient(160deg,#f5f3ff 0%,#fdf2f8 100%)" }}>
      <style>{FONTS}</style>
      <div style={{ width:"100%", maxWidth:540 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          {/* 吹き出し */}
          <div style={{ display:"inline-block", position:"relative", marginBottom:18 }}>
            <div style={{ background:"#fff", border:`2.5px solid ${accent}`, borderRadius:20, padding:"6px 22px", fontSize:20, fontWeight:900, color:accent, fontFamily:"'Yomogi',cursive", boxShadow:"2px 3px 0px #ddd6fe" }}>ここに</div>
            <div style={{ position:"absolute", bottom:-12, left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"10px solid transparent", borderRight:"10px solid transparent", borderTop:`12px solid ${accent}` }}/>
          </div>
          <div style={{ fontSize:52, marginTop:14, marginBottom:8 }}>{isChintai ? "🏢" : "🏆"}</div>
          <h1 style={{ fontFamily:"'Yomogi',cursive", fontSize:26, color:accent, lineHeight:1.4, marginBottom:4 }}>{isChintai ? "「賃貸の住まう力」総合診断" : "「住まう力」総合診断"}</h1>
          <div style={{ textAlign:"right", marginBottom:8 }}>
            <span style={{ fontSize:10, color:"#9ca3af", fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>マンション管理士監修</span>
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:10 }}>
            <span style={{ background:"#fef9c3", border:"1.5px solid #fde047", borderRadius:20, padding:"4px 12px", fontSize:13, color:"#854d0e", fontWeight:800, fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>🆓 完全無料</span>
            <span style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:20, padding:"4px 12px", fontSize:13, color:"#15803d", fontWeight:800, fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>登録不要</span>
          </div>
          <p style={{ fontSize:14, color:"#9ca3af", lineHeight:1.7 }}>9分野27問で住まいの総合力を診断<br/>あなたのリスクタイプと住まう年齢がわかります</p>
        </div>

        <div style={card}>
          <button onClick={()=>setScreen("quiz")} style={{ width:"100%", padding:"16px", background:grad, color:"#fff", borderRadius:16, border:"none", fontSize:17, fontWeight:800, fontFamily:"'M PLUS Rounded 1c',sans-serif", boxShadow:`0 4px 0 ${accentDark}`, cursor:"pointer", marginBottom:20, display:"block" }}>🚀 診断スタート</button>
          <div style={{ background:accentBg, borderRadius:12, padding:"12px 14px", marginBottom:16, fontSize:13, color:accentDark, lineHeight:1.7 }}>💡 所要時間は約<b>30秒〜10分</b>。タップするだけで自動で次へ進みます！</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {ACTIVE_CATEGORY_LIST.map(([em,lb,ct])=>(
              <div key={lb} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:accentBg, borderRadius:12, border:`1.5px dashed ${accentBorder}`, padding:"9px 14px" }}>
                <span style={{ fontSize:13, color:"#374151" }}>{em} {lb}</span>
                <span style={{ fontSize:12, color:accent, fontWeight:700 }}>{ct}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ textAlign:"center", fontSize:12, color:"#d1d5db", marginTop:20 }}>※ この診断は簡易的な目安です。正確な診断は専門家にご相談ください。</p>
      </div>
    </div>
  );

  // ── QUIZ
  if (screen === "quiz") return (
    <div style={{ ...wrap, background:"linear-gradient(160deg,#f5f3ff 0%,#fdf2f8 100%)" }}>
      <style>{FONTS}</style>
      <ProgressBar cur={cur+1} total={ACTIVE_QUESTIONS.length} />
      <div style={card}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:accentBg, border:`2px dashed ${accentBorder}`, borderRadius:20, padding:"4px 14px", fontSize:13, color:accent, fontWeight:700, marginBottom:16 }}>{q.emoji} {q.category}</div>
        <p style={{ fontSize:17, fontWeight:700, color:"#1f2937", lineHeight:1.6, marginBottom:20 }}>Q{q.id}. {q.text}</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
          {q.options.map((opt,i)=>{ const isFlash=flash===i; return (
            <button key={i} onClick={()=>handleSelect(i,opt.score)} disabled={flash!==null}
              style={{ width:"100%", padding:"13px 16px", background:isFlash?accentBg:"#f9fafb", border:isFlash?`2.5px solid ${accent}`:"2px solid #e5e7eb", borderRadius:12, textAlign:"left", fontSize:14, color:isFlash?accent:"#374151", fontWeight:isFlash?700:400, fontFamily:"'M PLUS Rounded 1c',sans-serif", cursor:flash!==null?"default":"pointer", transition:"all 0.15s", display:"flex", alignItems:"center", gap:10, transform:isFlash?"scale(0.98)":"scale(1)" }}>
              <span style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, border:isFlash?`2.5px solid ${accent}`:"2px solid #d1d5db", background:isFlash?accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {isFlash&&<span style={{ width:8, height:8, background:"#fff", borderRadius:"50%", display:"block" }}/>}
              </span>
              {opt.label}
            </button>
          );})}
        </div>
        <div>
          <button onClick={()=>setHint(!hint)} style={{ background:"none", border:"none", color:accent, fontSize:13, fontWeight:700, fontFamily:"'M PLUS Rounded 1c',sans-serif", cursor:"pointer" }}>{hint?"▲ ヒントを閉じる":"💡 ヒントを見る"}</button>
          {hint&&<div style={{ marginTop:8, background:accentBg, border:`1.5px dashed ${accentBorder}`, borderRadius:10, padding:"10px 12px", fontSize:13, color:accentDark, lineHeight:1.7 }}>{q.hint}</div>}
        </div>
      </div>
    </div>
  );

  // ── RESULT
  const allPoints = ACTIVE_QUESTIONS.map(q => ({ q, score: answers[q.id]??0, max: Math.max(...q.options.map(o=>o.score)) })).filter(item => item.max > 0);
  const weakPoints = allPoints.filter(item => item.score < item.max).sort((a,b) => (a.score/a.max) - (b.score/b.max)).slice(0,3);

  const catRatios = {};
  allPoints.forEach(item => {
    const cat = item.q.category;
    if (!catRatios[cat]) catRatios[cat] = { total:0, max:0 };
    catRatios[cat].total += item.score;
    catRatios[cat].max += item.max;
  });
  const worstCat = Object.entries(catRatios).map(([cat,v]) => ({ cat, ratio: v.max>0?v.total/v.max:0 })).sort((a,b)=>a.ratio-b.ratio)[0]?.cat || "";
  const riskType = isChintai ? getChintaiRiskType(worstCat) : getRiskType(worstCat);

  const getCatScore = (cat) => {
    const qs = ACTIVE_QUESTIONS.filter(q=>q.category===cat);
    const earned = qs.reduce((a,q)=>a+(answers[q.id]??0), 0);
    const max = qs.reduce((a,q)=>a+Math.max(...q.options.map(o=>o.score)), 0);
    return { earned, max, pct: max>0?Math.round((earned/max)*100):0 };
  };

  const getCatComment = (cat, pct) => {
    const c = ACTIVE_COMMENTS[cat];
    if (!c) return null;
    if (pct >= 70) return { text:c.high, level:"high" };
    if (pct >= 40) return { text:c.middle, level:"middle" };
    return { text:c.low, level:"low" };
  };


  const lineType = getLineType(totalScore, ACTIVE_TOTAL_MAX);
  const lineUrl = LINE_URL + "?oatext=" + encodeURIComponent(String(riskType.num));

  return (
    <div style={{ ...wrap, background:"linear-gradient(160deg,#f5f3ff 0%,#fdf2f8 100%)" }}>
      <style>{FONTS}</style>
      <div style={{ width:"100%", maxWidth:540 }}>

        {/* 総合スコアカード */}
        <div style={{ width:"100%", maxWidth:540, background:risk.bg, border:`2.5px solid ${risk.border}`, boxShadow:`4px 6px 0px ${risk.border}`, borderRadius:24, padding:"28px 24px", textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>{risk.emoji}</div>

          {/* リスクタイプ */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'M PLUS Rounded 1c',sans-serif", marginBottom:4 }}>あなたのリスクタイプ</div>
            <div style={{ fontSize:34, fontWeight:900, fontFamily:"'Yomogi',cursive", lineHeight:1.1, color:risk.color }}>
              {riskType.emoji} {riskType.name}
            </div>
          </div>

          {/* 住まう年齢 */}
          <div style={{ background:"rgba(255,255,255,0.7)", borderRadius:16, padding:"10px 20px", marginBottom:10, display:"inline-block" }}>
            <div style={{ fontSize:11, color:"#6b7280", fontFamily:"'M PLUS Rounded 1c',sans-serif", marginBottom:2 }}>🏠 住まう年齢</div>
            <div style={{ fontSize:36, fontWeight:800, color:risk.color, fontFamily:"'Yomogi',cursive", lineHeight:1 }}>
              {calcSumaiAge(totalScore, ACTIVE_TOTAL_MAX)}<span style={{ fontSize:18 }}>歳</span>
            </div>
          </div>

          {/* 診断ランク */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:13, color:"#6b7280", fontFamily:"'M PLUS Rounded 1c',sans-serif", marginBottom:4 }}>診断ランク</div>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:8 }}>
              <div style={{ fontSize:44, fontWeight:900, color:risk.color, fontFamily:"'Yomogi',cursive", lineHeight:1 }}>{lineType}</div>
              <div style={{ background:risk.color, color:"#fff", fontSize:13, fontWeight:800, fontFamily:"'M PLUS Rounded 1c',sans-serif", borderRadius:20, padding:"3px 12px" }}>{getPercentile(totalScore, ACTIVE_TOTAL_MAX)}</div>
            </div>
          </div>

          <div style={{ fontSize:13, color:"#6b7280", marginBottom:8, fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>{totalScore} / {ACTIVE_TOTAL_MAX}点</div>
          <p style={{ fontSize:14, color:"#374151", lineHeight:1.7 }}>{risk.desc}</p>
        </div>

        {/* LINE未来診断書CTA */}
        <a href={lineUrl} target="_blank" rel="noopener noreferrer"
          style={{ display:"block", width:"100%", maxWidth:540, background:"linear-gradient(135deg,#06c755,#00a040)", border:"2px solid #04a844", boxShadow:"4px 6px 0px #027a30", borderRadius:20, padding:"20px 22px", marginBottom:20, textDecoration:"none" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <span style={{ fontSize:24 }}>📮</span>
            <div>
              <div style={{ fontSize:11, color:"#d1fae5", fontWeight:700, fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>あなた専用</div>
              <div style={{ fontSize:17, fontWeight:800, color:"#fff", fontFamily:"'M PLUS Rounded 1c',sans-serif", lineHeight:1.3 }}>この結果の解説を見る（無料）</div>
            </div>
          </div>

          {/* ひとまとまりの白背景ブロック */}
          <div style={{ background:"#fff", borderRadius:14, padding:"16px", textAlign:"center" }}>
            {["なぜこの結果になったのか","20年後の危険箇所","今やるべき改善策"].map((t,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#374151", fontFamily:"'M PLUS Rounded 1c',sans-serif", fontWeight:700, marginBottom:6, justifyContent:"center" }}>
                <span style={{ color:"#06c755" }}>✓</span> {t}
              </div>
            ))}

            <div style={{ height:1, background:"#e5e7eb", margin:"12px 0" }} />

            <div style={{ fontSize:15, fontWeight:800, color:"#06c755", fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>🆓 LINEで無料配布中</div>
            <div style={{ fontSize:11, color:"#9ca3af", marginTop:2, marginBottom:12, fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>お友だち追加だけ・料金一切なし</div>

            <div style={{ background:"#f0fdf4", borderRadius:10, padding:"10px 14px" }}>
              <div style={{ fontSize:12, color:"#15803d", fontFamily:"'M PLUS Rounded 1c',sans-serif", marginBottom:6 }}>追加後にLINEへこの番号を送ってください</div>
              <div style={{ fontSize:18, fontWeight:800, color:"#374151", fontFamily:"'M PLUS Rounded 1c',sans-serif", marginBottom:4 }}>
                {riskType.emoji} {riskType.name}
              </div>
              <div style={{ fontSize:42, fontWeight:900, color:"#06c755", fontFamily:"'Yomogi',cursive", lineHeight:1 }}>
                → {riskType.num}番
              </div>
            </div>
          </div>
        </a>

        {/* 弱点TOP3 */}
        {weakPoints.length > 0 && (
          <div style={{ ...card, marginBottom:20, border:"2.5px solid #fcd34d", boxShadow:"4px 6px 0px #fcd34d", background:"#fefce8" }}>
            <h3 style={{ fontFamily:"'Yomogi',cursive", fontSize:17, color:"#92400e", marginBottom:14 }}>⚠️ 優先確認事項</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {weakPoints.map((item,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, background:"#fff", borderRadius:12, padding:"10px 14px", border:"1.5px solid #fde68a" }}>
                  <span style={{ fontSize:15, fontWeight:800, color:"#d97706", minWidth:22, fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>{"①②③"[i]}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1f2937", fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>{item.q.text}</div>
                    <div style={{ fontSize:11, color:"#9ca3af", marginTop:2, fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>{item.q.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* カテゴリ別スコア */}
        <div style={{ ...card, marginBottom:20 }}>
          <h3 style={{ fontFamily:"'Yomogi',cursive", fontSize:18, color:accent, marginBottom:16 }}>📊 カテゴリ別の結果</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            {ACTIVE_CATEGORIES.map(cat=>{
              const {earned,max,pct}=getCatScore(cat);
              const q0=ACTIVE_QUESTIONS.find(q=>q.category===cat);
              const comment=getCatComment(cat,pct);
              return (
                <div key={cat}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:13, color:"#374151", fontWeight:700 }}>{q0?.emoji} {cat}</span>
                    <span style={{ fontSize:13, color:"#6b7280" }}>{earned}/{max}点</span>
                  </div>
                  <ScoreBar pct={pct}/>
                  {comment && (
                    <div style={{ marginTop:8, fontSize:12, color:comment.level==="high"?"#15803d":comment.level==="middle"?"#92400e":"#dc2626", background:comment.level==="high"?"#f0fdf4":comment.level==="middle"?"#fefce8":"#fef2f2", borderRadius:8, padding:"7px 10px", lineHeight:1.6, fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>
                      {comment.level==="high"?"✅ ":comment.level==="middle"?"💡 ":"⚠️ "}{comment.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>


        {/* 代行診断CTA */}
        <div style={{ width:"100%", maxWidth:540, background:"linear-gradient(135deg,#1f2937,#374151)", border:"2.5px solid #4b5563", boxShadow:"4px 6px 0px #111827", borderRadius:24, padding:"28px 24px", marginBottom:20 }}>
          <div style={{ textAlign:"center", marginBottom:16 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🔎</div>
            <h3 style={{ fontFamily:"'Yomogi',cursive", fontSize:19, color:"#fff", marginBottom:8 }}>自分で調べるのが面倒なら…</h3>
            <p style={{ fontSize:13, color:"#d1d5db", lineHeight:1.7 }}>書類確認・現地確認・詳細レポートまで<br/><b style={{ color:"#fbbf24" }}>マンション管理士が代わりに診断</b>します。</p>
          </div>
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
            <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"'M PLUS Rounded 1c',sans-serif", marginBottom:8 }}>この診断ではわからない</div>
            {["20年後のリスク","今やるべき優先対策","住み続けるか、住み替えるかの判断"].map((t,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#fff", fontFamily:"'M PLUS Rounded 1c',sans-serif", fontWeight:700, marginBottom:i<2?6:0 }}>
                <span style={{ color:"#fbbf24" }}>✅</span> {t}
              </div>
            ))}
            <div style={{ marginTop:10, fontSize:12, color:"#d1d5db", fontFamily:"'M PLUS Rounded 1c',sans-serif", lineHeight:1.7 }}>を詳しく分析します。</div>
          </div>
          <a href={LINE_URL} target="_blank" rel="noopener noreferrer" style={{ display:"block", width:"100%", padding:"15px 15px 12px", background:"linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius:14, boxShadow:"0 3px 0 #92400e", cursor:"pointer", textDecoration:"none", textAlign:"center" }}>
            <div style={{ color:"#fff", fontSize:16, fontWeight:800, fontFamily:"'M PLUS Rounded 1c',sans-serif", marginBottom:8 }}>🔎 プロ代行診断の内容を見てみる</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"rgba(255,255,255,0.9)", borderRadius:10, padding:"8px 12px" }}>
              <span style={{ fontSize:16 }}>💬</span>
              <span style={{ fontSize:13, color:"#374151", fontWeight:700, fontFamily:"'M PLUS Rounded 1c',sans-serif" }}>LINEお友だちから <span style={{ background:"#fef9c3", padding:"1px 6px", borderRadius:4 }}>「代行」</span> と送ってください</span>
            </div>
          </a>
        </div>

        <button onClick={restart} style={{ width:"100%", maxWidth:540, padding:"12px", background:"#fff", color:accent, borderRadius:14, border:`2px solid ${accentBorder}`, fontSize:14, fontWeight:700, fontFamily:"'M PLUS Rounded 1c',sans-serif", cursor:"pointer" }}>🔄 もう一度診断する</button>
      </div>
    </div>
  );
}
// ============================================================
// 賃貸版 9カテゴリ×3問＝27問
// ============================================================
const CHINTAI_QUESTIONS = [
  // ── 物件・設備の状態
  {id:1,category:"物件・設備の状態",emoji:"🏠",text:"建物の築年数はどのくらいですか？",hint:"築古物件は設備の老朽化・耐震性・建替えリスクが高まります。",options:[{label:"築20年未満",score:2},{label:"築20〜35年",score:1},{label:"築35年以上・わからない",score:0}]},
  {id:2,category:"物件・設備の状態",emoji:"🚿",text:"給排水設備（水回り）に問題はありますか？",hint:"水漏れ・錆・詰まりなどは大家への修繕請求が可能です。",options:[{label:"問題ない",score:2},{label:"少し気になる点がある",score:1},{label:"明らかな問題がある",score:0}]},
  {id:3,category:"物件・設備の状態",emoji:"❄️",text:"エアコン・給湯器などの設備は正常に動いていますか？",hint:"設備の故障は大家負担で修繕を依頼できます。不具合は早めに報告を。",options:[{label:"すべて正常",score:2},{label:"一部不具合がある",score:1},{label:"故障・修繕されていない",score:0}]},

  // ── 防災・災害への備え
  {id:4,category:"防災・災害への備え",emoji:"🌊",text:"建物がハザードマップ上のリスク区域に入っていないか確認しましたか？",hint:"国土交通省「ハザードマップポータルサイト」で無料確認できます。",options:[{label:"確認済み・リスクなし",score:2},{label:"確認済み・リスクあり",score:0},{label:"確認していない",score:0}]},
  {id:5,category:"防災・災害への備え",emoji:"🔒",text:"防犯設備（鍵・オートロック・防犯カメラなど）は十分ですか？",hint:"防犯設備は安全な住環境の基本です。",options:[{label:"十分に整っている",score:2},{label:"やや不安がある",score:1},{label:"防犯上の問題がある",score:0}]},
  {id:6,category:"防災・災害への備え",emoji:"🧯",text:"非常食・避難用品などの備えはありますか？",hint:"賃貸でも自分自身での防災備蓄は重要です。",options:[{label:"備えている",score:2},{label:"一部だけ用意している",score:1},{label:"まったく備えていない",score:0}]},

  // ── 家賃・家計の持続力
  {id:7,category:"家賃・家計の持続力",emoji:"💴",text:"家賃は手取り月収の何割ですか？",hint:"家賃は手取りの25〜30%以内が安全ラインです。",options:[{label:"25%未満",score:2},{label:"25〜35%",score:1},{label:"35%超・わからない",score:0}]},
  {id:8,category:"家賃・家計の持続力",emoji:"📉",text:"収入が減少・不安定になった場合でも家賃を払い続けられますか？",hint:"収入減少時のシミュレーションは重要なリスク管理です。",options:[{label:"余裕がある",score:2},{label:"なんとかなると思う",score:1},{label:"厳しくなる可能性が高い",score:0}]},
  {id:9,category:"家賃・家計の持続力",emoji:"🏦",text:"半年分以上の生活費を緊急予備資金として確保していますか？",hint:"緊急予備資金がないと収入減で家賃が払えなくなるリスクがあります。",options:[{label:"6ヶ月分以上確保している",score:2},{label:"3〜6ヶ月分程度",score:1},{label:"3ヶ月未満・ほぼない",score:0}]},

  // ── 老後資金・将来計画
  {id:10,category:"老後資金・将来計画",emoji:"👴",text:"年金収入だけになった場合、今の家賃を払い続けられますか？",hint:"老後は収入が大幅に減ります。年金額と家賃のバランスを試算しておくことが重要です。",options:[{label:"試算済み・払える見通し",score:2},{label:"漠然と大丈夫だと思う",score:1},{label:"払えなくなる可能性が高い",score:0}]},
  {id:11,category:"老後資金・将来計画",emoji:"💡",text:"固定費（家賃・光熱費・通信費など）の総額を把握していますか？",hint:"固定費の把握は家計管理の基本です。",options:[{label:"すべて把握・管理している",score:2},{label:"おおよそ把握している",score:1},{label:"把握していない",score:0}]},
  {id:12,category:"老後資金・将来計画",emoji:"🎯",text:"NISAやiDeCoなど資産形成を行っていますか？",hint:"賃貸の場合、持ち家以上に老後の資産形成が住まいの選択肢を左右します。",options:[{label:"積極的に活用している",score:2},{label:"一部活用している",score:1},{label:"まったくしていない",score:0}]},

  // ── 契約・更新の安定性
  {id:13,category:"契約・更新の安定性",emoji:"📋",text:"現在の賃貸契約の種類を把握していますか？",hint:"普通借家契約と定期借家契約では更新・立退きのリスクが大きく異なります。",options:[{label:"普通借家契約（把握済み）",score:2},{label:"定期借家契約（把握済み）",score:1},{label:"わからない",score:0}]},
  {id:14,category:"契約・更新の安定性",emoji:"📅",text:"次の契約更新まで何年ありますか？",hint:"更新時に条件変更・立退き要求が起こる場合があります。",options:[{label:"2年以上",score:2},{label:"1〜2年",score:1},{label:"1年以内・わからない",score:0}]},
  {id:15,category:"契約・更新の安定性",emoji:"📜",text:"賃貸借契約書の内容（禁止事項・特約など）を把握していますか？",hint:"特約の見落としがトラブルの原因になります。",options:[{label:"内容を把握している",score:2},{label:"おおよそ把握している",score:1},{label:"ほとんど把握していない",score:0}]},

  // ── 立退き・建替えリスク
  {id:16,category:"立退き・建替えリスク",emoji:"🏢",text:"建物の老朽化による建替え・取り壊しのリスクを感じますか？",hint:"築古物件は建替えを理由とした立退き要求のリスクがあります。",options:[{label:"まったく感じない",score:2},{label:"少し気になる",score:1},{label:"明らかにリスクがある",score:0}]},
  {id:17,category:"立退き・建替えリスク",emoji:"👤",text:"大家や管理会社との関係は良好ですか？",hint:"良好な関係は更新時の交渉や修繕依頼をスムーズにします。",options:[{label:"良好",score:2},{label:"普通・接点が少ない",score:1},{label:"トラブルがある",score:0}]},
  {id:18,category:"立退き・建替えリスク",emoji:"🔑",text:"連帯保証人・家賃保証会社の状況は問題ありませんか？",hint:"高齢になると保証人が見つかりにくくなる場合があります。",options:[{label:"問題ない",score:2},{label:"一部不安がある",score:1},{label:"保証人がいない・審査が不安",score:0}]},

  // ── 住み続ける力（身体・認知）
  {id:19,category:"住み続ける力",emoji:"🚶",text:"日常生活の動作（階段・買い物・通院など）を一人でできていますか？",hint:"身体機能の低下は住み続けるための重要なリスク因子です。",options:[{label:"一人で問題なくできる",score:2},{label:"やや不安がある",score:1},{label:"介助が必要な場面がある",score:0}]},
  {id:20,category:"住み続ける力",emoji:"🧠",text:"金銭管理・手続き（家賃振込・更新手続きなど）を自分でできていますか？",hint:"認知機能の低下は家賃滞納・契約更新の失敗につながるリスクがあります。",options:[{label:"問題なくできている",score:2},{label:"少し不安がある",score:1},{label:"管理が難しくなってきた",score:0}]},
  {id:21,category:"住み続ける力",emoji:"🔑",text:"将来、賃貸審査が通らなくなるリスクを考えていますか？",hint:"高齢・無職・保証人なしになると賃貸審査が厳しくなります。",options:[{label:"考えており対策している",score:2},{label:"なんとかなると思っている",score:1},{label:"考えていない",score:0}]},

  // ── 孤立・支援体制
  {id:22,category:"孤立・支援体制",emoji:"👥",text:"緊急時に頼れる家族・知人が近くにいますか？",hint:"賃貸では高齢者の孤独死・孤立が深刻なリスクです。",options:[{label:"複数いる",score:2},{label:"1人はいる",score:1},{label:"いない・遠方",score:0}]},
  {id:23,category:"孤立・支援体制",emoji:"📋",text:"高齢・障害があっても住み続けられる環境を整えていますか？",hint:"バリアフリー・見守りサービス・ヘルパーなど、早めの準備が選択肢を広げます。",options:[{label:"整えている・検討済み",score:2},{label:"これから考えたい",score:1},{label:"まったく考えていない",score:0}]},
  {id:24,category:"孤立・支援体制",emoji:"🏥",text:"かかりつけ医・介護サービスとの関係を作っていますか？",hint:"定期受診・介護サービスのネットワークは住み続ける力を支えます。",options:[{label:"かかりつけ医がいる・定期受診している",score:2},{label:"病院はあるが定期的でない",score:1},{label:"かかりつけ医がいない",score:0}]},

  // ── 地域・住み替え力
  {id:25,category:"地域・住み替え力",emoji:"🛒",text:"徒歩圏内にスーパー・病院はありますか？",hint:"車なし生活・高齢化後も歩いて生活できる環境かを確認しましょう。",options:[{label:"徒歩10分以内にある",score:2},{label:"車で5〜10分程度",score:1},{label:"車で15分以上・ない",score:0}]},
  {id:26,category:"地域・住み替え力",emoji:"🏠",text:"もし引越しが必要になった場合、次の住まいを確保できる見通しがありますか？",hint:"高齢・障害・低収入の場合、賃貸審査が通りにくくなります。",options:[{label:"見通しがある・準備している",score:2},{label:"なんとかなると思う",score:1},{label:"見通しが立たない",score:0}]},
  {id:27,category:"地域・住み替え力",emoji:"🤝",text:"住み替えの相談ができる専門家・窓口を知っていますか？",hint:"不動産会社・地域包括支援センター・居住支援法人など、相談窓口を知っておくと安心です。",options:[{label:"知っている・相談したことがある",score:2},{label:"なんとなく知っている",score:1},{label:"まったく知らない",score:0}]},
];

const CHINTAI_CATEGORY_LIST = [
  ["🏠","物件・設備の状態","3問"],["🌊","防災・災害への備え","3問"],["💴","家賃・家計の持続力","3問"],
  ["👴","老後資金・将来計画","3問"],["📋","契約・更新の安定性","3問"],["🏢","立退き・建替えリスク","3問"],
  ["🚶","住み続ける力","3問"],["🤝","孤立・支援体制","3問"],["🏘️","地域・住み替え力","3問"],
];

const CHINTAI_CATEGORY_COMMENTS = {
  "物件・設備の状態":{high:"物件・設備の状態は良好です。",middle:"物件・設備に一部老朽化が見られます。大家への修繕依頼を検討しましょう。",low:"物件・設備に深刻な問題があります。住み替えも含めた対策を早急に検討してください。"},
  "防災・災害への備え":{high:"防災・災害への備えは十分です。",middle:"防災備えに一部不足があります。ハザードマップの確認をおすすめします。",low:"防災・災害への備えが不足しています。早急に確認・準備をしてください。"},
  "家賃・家計の持続力":{high:"家賃・家計の持続力は高い状態です。",middle:"家賃・家計に一部懸念があります。収支の見直しをおすすめします。",low:"家賃・家計の持続に深刻なリスクがあります。早急に家計改善を検討してください。"},
  "老後資金・将来計画":{high:"老後資金・将来計画は整っています。",middle:"老後の資金計画に一部不足があります。早めの試算をおすすめします。",low:"老後資金が不足するリスクがあります。早急に専門家への相談をおすすめします。"},
  "契約・更新の安定性":{high:"契約・更新の状況は安定しています。",middle:"契約内容に一部不安があります。更新条件の確認をおすすめします。",low:"契約・更新に深刻なリスクがあります。専門家への相談を検討してください。"},
  "立退き・建替えリスク":{high:"立退き・建替えリスクは低い状態です。",middle:"立退き・建替えに一部懸念があります。大家との関係構築をおすすめします。",low:"立退き・建替えリスクが高い状態です。早めの対策を検討してください。"},
  "住み続ける力":{high:"住み続ける力は高い状態です。",middle:"住み続ける力に一部不安があります。早めに支援体制を検討しましょう。",low:"住み続ける力に深刻なリスクがあります。地域包括支援センターへの相談をおすすめします。"},
  "孤立・支援体制":{high:"孤立リスクは低く、支援体制も整っています。",middle:"孤立・支援体制に一部不安があります。関係構築をおすすめします。",low:"孤立リスクが高い状態です。早急に支援体制の構築を検討してください。"},
  "地域・住み替え力":{high:"地域環境・住み替え力は良好です。",middle:"地域環境や住み替えに一部懸念があります。",low:"地域環境・住み替えに深刻なリスクがあります。専門家との相談をおすすめします。"},
};

function getChintaiRiskType(worstCat) {
  if (!worstCat) return { emoji:"🌱", name:"安心維持型", num:1 };
  if (worstCat.includes("防災")) return { emoji:"🌊", name:"災害脆弱型", num:2 };
  if (worstCat.includes("物件")) return { emoji:"🏚️", name:"物件老朽型", num:3 };
  if (worstCat.includes("家賃")||worstCat.includes("老後")) return { emoji:"💸", name:"家賃圧迫型", num:4 };
  if (worstCat.includes("契約")) return { emoji:"📜", name:"契約不安定型", num:5 };
  if (worstCat.includes("立退き")) return { emoji:"🚨", name:"立退きリスク型", num:6 };
  if (worstCat.includes("孤立")) return { emoji:"🤝", name:"孤立リスク型", num:7 };
  if (worstCat.includes("住み続ける")) return { emoji:"🪜", name:"生活継続困難型", num:8 };
  if (worstCat.includes("地域")) return { emoji:"🏘️", name:"住み替え困難型", num:9 };
  return { emoji:"⚠️", name:"複合リスク型", num:10 };
}
