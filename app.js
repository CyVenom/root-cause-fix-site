(function(){
"use strict";
var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var sleep = function(ms){ return reduce ? Promise.resolve() : new Promise(function(r){ setTimeout(r, ms); }); };
var $ = function(id){ return document.getElementById(id); };
var esc = function(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); };

/* ---- evidence check: mirrors packages/core/src/validate.ts ---- */
var norm = function(s){ return s.replace(/\s+/g," ").trim().toLowerCase(); };
var strip = function(s){ return s.split("\n").map(function(l){ return l.replace(/^[+-]\s?/,""); }).join("\n"); };
function envText(c){ return c.env.map(function(e){ return e.name+" "+e.change; }).join("\n"); }
function verify(c, ev){
  var hay = ev.type==="log" ? norm(c.logs) : ev.type==="diff" ? norm(strip(c.diff)) : norm(envText(c));
  var q = ev.type==="diff" ? norm(strip(ev.quote)) : norm(ev.quote);
  return !!ev.quote && hay.indexOf(q) !== -1;
}
function findLine(c, ev){
  var lines = ev.type==="log" ? c.logs.split("\n") : ev.type==="diff" ? c.diff.split("\n") : c.env.map(function(e){ return e.name+" "+e.change; });
  var q = ev.type==="diff" ? norm(strip(ev.quote)) : norm(ev.quote);
  for (var i=0;i<lines.length;i++){
    var l = ev.type==="diff" ? norm(strip(lines[i])) : norm(lines[i]);
    if (l.indexOf(q) !== -1) return i;
  }
  return -1;
}

/* ---- demo ---- */
var cur = null, token = 0;
var list = $("caseList");
window.CASES.forEach(function(c, i){
  var b = document.createElement("button");
  b.className = "case-btn"; b.type = "button"; b.setAttribute("role","tab");
  b.setAttribute("aria-selected", i===0 ? "true" : "false");
  b.innerHTML = esc(c.title) + "<small>" + esc(c.tag) + "</small>";
  b.addEventListener("click", function(){ select(i); });
  list.appendChild(b);
});

function renderCode(el, text, kind){
  el.innerHTML = "";
  text.split("\n").forEach(function(line, i){
    var d = document.createElement("div");
    d.className = "ln" + (kind==="diff" && /^\+(?!\+\+)/.test(line) ? " add" : kind==="diff" && /^-(?!--)/.test(line) ? " del" : "");
    d.innerHTML = "<i>"+(i+1)+"</i><span>"+esc(line)+"</span>";
    el.appendChild(d);
  });
  el.scrollTop = 0;
}
function renderEnv(c){
  var el = $("envPane"); el.innerHTML = "";
  if (!c.env.length){ el.innerHTML = '<span class="none">no changes detected</span>'; return; }
  c.env.forEach(function(e){
    var s = document.createElement("span"); s.className = "envitem"; s.textContent = e.name+" "+e.change; el.appendChild(s);
  });
}
function clearMarks(){
  document.querySelectorAll(".ln.hit,.ln.miss,.envitem.hit").forEach(function(n){ n.classList.remove("hit","miss"); });
}
function mark(c, ev, bad){
  clearMarks();
  var i = findLine(c, ev); if (i < 0) return false;
  if (ev.type==="env"){ var it = $("envPane").children[i]; if (it) it.classList.add("hit"); return true; }
  var pane = ev.type==="log" ? $("logPane") : $("diffPane");
  var row = pane.children[i]; if (!row) return false;
  row.classList.add("hit");
  pane.scrollTop = Math.max(0, row.offsetTop - pane.clientHeight/3);
  return true;
}
function select(i){
  token++;
  cur = window.CASES[i];
  Array.prototype.forEach.call(list.children, function(b, j){ b.setAttribute("aria-selected", j===i ? "true":"false"); });
  $("caseTitle").textContent = cur.title;
  $("caseBlurb").textContent = cur.blurb;
  $("caseMeta").innerHTML = "failed&nbsp;&nbsp;"+esc(cur.commit)+"<br>last good&nbsp;&nbsp;"+esc(cur.lastGood.replace(/^0ld/,"0ld"));
  renderCode($("logPane"), cur.logs, "log");
  renderCode($("diffPane"), cur.diff, "diff");
  $("logCount").textContent = cur.logs.split("\n").length+" lines";
  $("diffCount").textContent = cur.diff.split("\n").length+" lines";
  renderEnv(cur);
  $("verdict").hidden = true;
  $("runBtn").disabled = false;
}

async function run(){
  var my = ++token, c = cur;
  var btn = $("runBtn"); btn.disabled = true;
  clearMarks();
  var v = $("verdict"); v.hidden = false;
  var cause = $("vCause"), evb = $("vEvidence"), fix = $("vFix"), conf = $("vConf");
  cause.textContent = ""; evb.innerHTML = ""; fix.textContent = ""; conf.innerHTML = "";
  var d = JSON.parse(JSON.stringify(c.diagnosis));
  if ($("fakeToggle").checked) d.evidence[d.evidence.length-1] = { type: c.fake.type, quote: c.fake.quote };

  cause.innerHTML = '<span class="muted mono">redacting &rarr; reducing &rarr; diagnosing&hellip;</span>';
  await sleep(650); if (my!==token) return;
  cause.textContent = "";
  for (var i=0;i<d.cause.length;i+=3){
    cause.textContent = d.cause.slice(0, i+3);
    await sleep(8); if (my!==token) return;
  }
  cause.textContent = d.cause;

  var rows = d.evidence.map(function(ev){
    var b = document.createElement("button");
    b.type = "button"; b.className = "ev pending";
    b.innerHTML = '<span class="st">checking&hellip;</span><span class="tag">'+ev.type+'</span>'+esc(ev.quote);
    evb.appendChild(b); return b;
  });
  await sleep(350); if (my!==token) return;
  var bad = 0;
  for (var k=0;k<d.evidence.length;k++){
    var ev = d.evidence[k], ok = verify(c, ev), row = rows[k];
    await sleep(450); if (my!==token) return;
    row.className = "ev " + (ok ? "ok" : "bad");
    row.querySelector(".st").textContent = ok ? "\u2713 found in "+ev.type : "\u2717 not found";
    (function(ev, ok, row){
      row.addEventListener("click", function(){
        if (ok) mark(c, ev); else { clearMarks(); row.animate && row.animate([{transform:"translateX(0)"},{transform:"translateX(-5px)"},{transform:"translateX(5px)"},{transform:"translateX(0)"}],{duration:220}); }
      });
    })(ev, ok, row);
    if (ok) mark(c, ev); else { bad++; clearMarks(); }
  }
  await sleep(350); if (my!==token) return;
  fix.textContent = d.fix;
  var final = bad===0;
  conf.innerHTML = '<span class="conf '+(final ? d.confidence : "low")+'">'+(final ? d.confidence : "low")+'</span>' +
    (final ? "" : '<span class="conf-note">Downgraded: '+bad+' cited evidence item'+(bad>1?"s":"")+' could not be verified in the logs or diff.</span>');
  btn.disabled = false;
}
$("runBtn").addEventListener("click", run);
$("fakeToggle").addEventListener("change", function(){ if (!$("verdict").hidden) run(); });
select(0);

/* ---- redaction playground: same patterns as packages/core/src/redact.ts ---- */
var P = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"],
  [/\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{10,}\b/g, "[REDACTED_STRIPE_KEY]"],
  [/\bsk-ant-[A-Za-z0-9_-]{10,}\b/g, "[REDACTED_ANTHROPIC_KEY]"],
  [/\b(ghp|gho|ghs|ghu|github_pat)_[A-Za-z0-9_]{20,}\b/g, "[REDACTED_GITHUB_TOKEN]"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED_AWS_KEY]"],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g, "[REDACTED_SLACK_TOKEN]"],
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, "[REDACTED_JWT]"],
  [/\b(postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s"']+/g, "[REDACTED_CONNECTION_STRING]"],
  [/\b([A-Z][A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY)[A-Z0-9_]*)\s*[=:]\s*\S+/g, "$1=[REDACTED]"],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[REDACTED_EMAIL]"]
];
function redact(s){ return P.reduce(function(a, p){ return a.replace(p[0], p[1]); }, s); }
// Fake secrets are assembled at runtime so secret scanners don't flag the source file.
var sample = [
  "Cloning github.com/acme/shop (Branch: main)",
  "Running \"npm run build\"",
  "STRIPE_SECRET_KEY=" + "sk_" + "live_" + "EXAMPLEEXAMPLE1234",
  "AWS key: " + "AKIA" + "IOSFODNN7EXAMPLE",
  "Auth: Bearer " + "eyJ" + "hbGciOiJIUzI1NiJ9" + "." + "eyJzdWIiOiIxMjM0NTY3ODkwIn0" + "." + "c2lnbmF0dXJlc2ln",
  "Connecting to " + "postgres" + "://admin:pa55word@db.internal:5432/shop",
  "Notified owner: jane.doe@acme.com",
  "Error: DATABASE_URL is not defined"
].join("\n");
var rIn = $("rIn"), rOut = $("rOut");
function paintR(){
  rOut.innerHTML = esc(redact(rIn.value)).replace(/\[REDACTED[A-Z_]*\]/g, function(m){ return "<mark>"+m+"</mark>"; });
}
rIn.value = sample; rIn.addEventListener("input", paintR); paintR();

/* ---- hero terminal ---- */
var heroLines = [
  ['<span class="t-k">$</span> npm run diagnose -- fixtures/missing-env-var\n\n'],
  ['<span class="t-k">CAUSE     </span>Commit abc1234 renamed the variable read in\n          src/lib/db.ts from DB_URL to DATABASE_URL, but it\n          is not set in the Vercel project.\n\n'],
  ['<span class="t-k">EVIDENCE</span>\n'],
  ['  <span class="t-a">[log] </span>Error: DATABASE_URL is not defined  <span class="t-ok">\u2713</span>\n'],
  ['  <span class="t-a">[diff]</span>+const url = process.env.DATABASE_URL;  <span class="t-ok">\u2713</span>\n'],
  ['  <span class="t-a">[env] </span>DATABASE_URL removed  <span class="t-ok">\u2713</span>\n\n'],
  ['<span class="t-k">FIX       </span>Add DATABASE_URL to the project env vars,\n          then redeploy.\n\n'],
  ['<span class="t-k">CONFIDENCE </span><span class="t-ok">high</span>   <span class="t-k">VERIFIED </span><span class="t-ok">true</span>']
];
async function hero(){
  var t = $("heroTerm"), s = $("heroState"), out = "";
  s.textContent = "running"; s.className = "live on";
  for (var i=0;i<heroLines.length;i++){
    out += heroLines[i][0]; t.innerHTML = out + '<span class="caret"></span>';
    await sleep(i===0 ? 600 : 520);
  }
  t.innerHTML = out; s.textContent = "verified"; s.className = "live done";
}
hero();
})();
