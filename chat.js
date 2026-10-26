/* DaysWon chat assistant — scripted FAQ + inquiry form + human handoff. No third-party AI. */
(function(){
"use strict";
var API="https://dayswon.sites.tab.bot/api/lead", FALLBACK_MAIL="mendels-tab+dayswon@mail.tab.bot";
/* Live chat (tawk.to, free plan). Loaded only when a visitor asks for a person, so the page shows
   one chat bubble at a time: ours first, then tawk takes over (our launcher hides, tawk opens). */
var TAWK_SRC="https://embed.tawk.to/6ad218e0c724b834c3da83da/1k52b2bgm", LIVE_KEY="dw_live";
var LIVE={loading:false,loaded:false,pending:null,
 open:function(d){LIVE.pending=d||LIVE.pending;try{localStorage.setItem(LIVE_KEY,"1");}catch(e){}LIVE.load();},
 load:function(){
  if(LIVE.loaded){LIVE.apply();return;}
  if(LIVE.loading)return;LIVE.loading=true;
  window.Tawk_API=window.Tawk_API||{};window.Tawk_LoadStart=new Date();
  window.Tawk_API.onLoad=function(){LIVE.loaded=true;LIVE.apply();};
  window.Tawk_API.onChatEnded=function(){try{localStorage.removeItem(LIVE_KEY);}catch(e){}};
  var s=document.createElement("script");s.async=true;s.src=TAWK_SRC;s.charset="UTF-8";
  s.onerror=function(){LIVE.loading=false;LIVE.loaded=false;};
  document.head.appendChild(s);
 },
 apply:function(){
  var T=window.Tawk_API,d=LIVE.pending;LIVE.pending=null;
  try{document.documentElement.classList.add("nxc-live");}catch(e){}
  if(!T)return;
  try{if(typeof close==="function")close();}catch(e){}
  if(d){
   /* one attribute per call: tawk rejects the whole call if any value is invalid (e.g. an email it dislikes) */
   var attrs=[];if(d.name)attrs.push({name:d.name.slice(0,50)});if(d.email)attrs.push({email:d.email});if(d.phone)attrs.push({phone:d.phone});
   if(d.message)attrs.push({question:d.message.replace(/\s+/g," ").slice(0,250)});
   attrs.forEach(function(a){try{T.setAttributes(a,function(){});}catch(e){}});
   try{T.addTags(["website handoff"],function(){});}catch(e){}
   try{T.addEvent("talk-to-a-person",{name:d.name||"",email:d.email||"",phone:d.phone||"",question:(d.message||"").slice(0,500)},function(){});}catch(e){}
  }
  try{T.showWidget();}catch(e){}
  try{if(d)T.maximize();}catch(e){}
 }};
(function(){var on=false;try{on=localStorage.getItem(LIVE_KEY)==="1";}catch(e){}if(on){document.documentElement.classList.add("nxc-live");LIVE.load();}})();
var transcript=[], state={busy:false,started:false};
var LOGO='<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="clg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stop-color="#a46bff"/><stop offset="1" stop-color="#4f8dff"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="16" fill="url(#clg)"/><path d="M18 15.5H31a16.5 16.5 0 0 1 0 33H18Z" fill="none" stroke="#fff" stroke-width="5.6" stroke-linejoin="round"/><path d="M25 32.3l5 5 9.6-10.4" fill="none" stroke="#fff" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var I={
 chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
 x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>'
};
var MAIN=["What do you build?","How does a project work?","Pricing & timeline","Start a project","Talk to a person"];

/* ---------- knowledge ---------- */
var K=[
 {id:"services",k:["service","services","what do you do","what do you build","offer","build","capabilit","help with","do you do","what can you"],
  a:"We build technology that fits how your business actually runs:\n\n• Custom software: web apps, internal platforms, client portals\n• AI agents & automation: assistants that prepare tasks and run workflows, with people in control\n• ERP & business systems: invoicing, inventory, purchasing, customers, delivery and reporting in one place\n• Dashboards & analytics\n• Integrations between the tools you already use\n• Websites & digital experiences\n\nWhich of these is closest to what you need?",
  c:["Custom software","AI & automation","ERP / business systems","Start a project"]},
 {id:"custom",k:["custom software","web app","webapp","application","portal","internal tool","platform","mobile app","app "],
  a:"Custom software is our core work: web applications, internal tools, client portals and business platforms designed around how your team works, not the other way round.\n\nWe usually start by mapping your current process, then build in focused stages so you see working software early.",
  c:["How does a project work?","Pricing & timeline","Start a project"]},
 {id:"ai",k:["ai","a.i","artificial","agent","agents","automation","automate","chatbot","gpt","llm","machine learning","workflow","bot"],
  a:"We design practical AI: agents and automations that read documents, prepare tasks, answer routine questions, move data between systems and keep a person in control of important decisions.\n\nGood first candidates are repetitive admin work: data entry, follow-ups, reporting, order and invoice handling.",
  c:["Examples of automation","Start a project","Talk to a person"]},
 {id:"examples",k:["example","examples","use case","use cases","like what","such as"],
  a:"A few typical examples:\n\n• Incoming emails or PDFs read and turned into orders or invoices\n• Automatic follow-ups and reminders to customers\n• A daily summary of sales, stock and open tasks\n• An internal assistant that answers questions from your own data\n• Syncing data between your CRM, accounting and spreadsheets\n\nWhat repetitive task takes your team the most time today?",
  c:["Start a project","Talk to a person"]},
 {id:"erp",k:["erp","inventory","invoic","purchas","stock","warehouse","crm","delivery","route","operations","business system","accounting"],
  a:"We build ERP-style business systems that connect invoicing, inventory, purchasing, customer management, delivery operations and reporting into one system, so your team stops copying data between spreadsheets and disconnected tools.\n\nWe can build it from scratch or connect and extend what you already use.",
  c:["Integrations","How does a project work?","Start a project"]},
 {id:"dash",k:["dashboard","analytics","report","reporting","kpi","forecast","data","bi "],
  a:"We turn scattered data into clear dashboards, reports and forecasts, pulled automatically from the systems you already have, so decisions are based on current numbers.",
  c:["Integrations","Start a project"]},
 {id:"integr",k:["integrat","api","connect","sync","zapier","quickbooks","shopify","hubspot","salesforce","google sheets","excel","existing tools"],
  a:"Yes, integrations are a big part of what we do: APIs, automated data flows and dependable connections between your existing tools (accounting, CRM, e-commerce, spreadsheets and more).\n\nWhich tools are you using today?",
  c:["Start a project","Talk to a person"]},
 {id:"web",k:["website","web site","landing","redesign","seo","ecommerce","e-commerce","online store"],
  a:"We design and build premium websites, customer portals and digital experiences, fast, mobile-first and connected to your business systems where it helps (forms, bookings, customer accounts).",
  c:["Pricing & timeline","Start a project"]},
 {id:"process",k:["process","how does","how do you work","project work","steps","approach","methodology","start working","onboard"],
  a:"Our process has four steps:\n\n1. Discover: we learn your business, current systems and biggest opportunities\n2. Design: we map workflows, the experience, architecture and a delivery plan\n3. Build: we develop, test and refine with you along the way\n4. Launch & evolve: we deploy, support and keep improving as you grow\n\nIt starts with a short conversation, with no obligation.",
  c:["Pricing & timeline","Start a project"]},
 {id:"price",k:["price","pricing","cost","costs","how much","budget","quote","estimate","rate","rates","expensive","cheap","fee"],
  a:"Every project is different, so we don't use one-size-fits-all pricing. After a short discovery conversation you get a clear proposal with scope, timeline and cost before any work starts.\n\nIf you share a little about your project, we'll come back with a realistic range.",
  c:["Start a project","Talk to a person"]},
 {id:"time",k:["how long","timeline","time frame","timeframe","deadline","weeks","months","fast","quickly","asap","when can"],
  a:"Timelines depend on scope. A focused automation or website can move quickly; a full business platform is delivered in stages so you get value early. You'll get a concrete timeline in the proposal.",
  c:["Start a project","Talk to a person"]},
 {id:"industry",k:["industry","industries","distribution","logistics","retail","service business","small business","startup","who do you work","clients","customers do you"],
  a:"We work with distribution & logistics, service businesses, retail & e-commerce, and growing companies that have outgrown spreadsheets and disconnected tools.\n\nWhat kind of business are you in?",
  c:["Start a project","Talk to a person"]},
 {id:"support",k:["support","maintain","maintenance","after launch","hosting","update","updates","bug"],
  a:"Yes, we stay with you after launch: deployment, support and ongoing improvements as your business grows. Support is agreed as part of the proposal.",
  c:["Start a project","Talk to a person"]},
 {id:"security",k:["secure","security","privacy","nda","confidential","gdpr","data safe","own the code","ownership","source code"],
  a:"We take data and confidentiality seriously and are happy to sign an NDA before you share details. Questions about code ownership, hosting and data handling are covered in the proposal; a team member can go through specifics with you.",
  c:["Talk to a person","Start a project"]},
 {id:"existing",k:["existing system","legacy","modernize","modernise","replace","migrate","migration","old system","spreadsheet"],
  a:"We often modernize what's already there: replacing spreadsheets, migrating legacy systems, or extending a tool you rely on, step by step so day-to-day work isn't disrupted.",
  c:["Start a project","Talk to a person"]},
 {id:"where",k:["where are you","location","located","based","remote","office","time zone","timezone"],
  a:"We work with clients remotely, with calls and shared progress updates throughout the project. For anything specific about meeting in person, a team member can help.",
  c:["Talk to a person"]},
 {id:"contact",k:["contact","email","phone","call me","call","reach","speak","meeting","book","schedule","appointment","demo"],
  a:"Happy to set that up. Leave your details and a team member will get in touch to arrange a call.",
  c:["Talk to a person","Start a project"]},
 {id:"hello",k:["hi","hello","hey","good morning","good evening","shalom","yo"],
  a:"Hi! How can I help? You can ask about our services, how a project works, or start an inquiry.",c:MAIN},
 {id:"thanks",k:["thanks","thank you","thx","great","perfect","awesome","appreciate"],
  a:"You're welcome. Anything else I can help with?",c:["Start a project","Talk to a person"]}
];
var HUMAN=["human","person","real person","representative","agent please","someone","talk to","speak to","live","staff","owner","manager","sales","help me now"];

function norm(s){return " "+String(s||"").toLowerCase().replace(/[^\w\s.&'-]/g," ").replace(/\s+/g," ")+" ";}
function has(t,w){w=w.toLowerCase();return w.length<=3?(t.indexOf(" "+w+" ")>-1):t.indexOf(w)>-1;}
function match(text){
 var t=norm(text);
 if(/talk to (a|an|some)|speak (to|with)|real person|human|representative|live (agent|person|chat)/.test(t))return {id:"human"};
 if(/start (a )?project|inquiry|enquiry|get started|hire you|work with you|proposal/.test(t))return {id:"form"};
 var best=null,score=0;
 K.forEach(function(e){var s=0;e.k.forEach(function(w){if(has(t,w))s+=w.length>4?2:1;});if(s>score){score=s;best=e;}});
 return score?best:null;
}

/* ---------- DOM ---------- */
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
var root=el("div","nxc");
var launch=el("button","nxc-launch",I.chat+'<span class="nxc-dot"></span><span>Chat with us</span>');
launch.type="button";launch.setAttribute("aria-label","Open chat");
var panel=el("section","nxc-panel");panel.setAttribute("role","dialog");panel.setAttribute("aria-label","DaysWon chat");
panel.innerHTML='<header class="nxc-head"><div class="nxc-av">'+LOGO+'</div><div class="nxc-title"><b>DaysWon Assistant</b><span>Instant answers · our team follows up</span></div><button class="nxc-x" type="button" aria-label="Close chat">'+I.x+'</button></header><div class="nxc-body" aria-live="polite"></div><footer class="nxc-foot"><form class="nxc-input"><textarea rows="1" placeholder="Ask a question…" aria-label="Your message" maxlength="1000"></textarea><button class="nxc-send" type="submit" aria-label="Send">'+I.send+'</button></form><div class="nxc-meta"><span>DaysWon · Win back your days</span><button type="button" class="nxc-person">Talk to a person</button></div></footer>';
root.appendChild(launch);root.appendChild(panel);
document.body.appendChild(root);
var body=panel.querySelector(".nxc-body"),ta=panel.querySelector("textarea"),inForm=panel.querySelector(".nxc-input");

function scroll(){body.scrollTop=body.scrollHeight;}
function add(who,text){var m=el("div","nxc-msg "+(who==="me"?"nxc-me":"nxc-bot"));m.textContent=text;body.appendChild(m);transcript.push((who==="me"?"Visitor: ":"Assistant: ")+text);scroll();return m;}
function chips(list){var c=el("div","nxc-chips");list.forEach(function(l){var b=el("button","nxc-chip"+(l==="Talk to a person"?" nxc-human":""));b.type="button";b.textContent=l;b.onclick=function(){c.remove();user(l);};c.appendChild(b);});body.appendChild(c);scroll();}
function clearChips(){[].slice.call(body.querySelectorAll(".nxc-chips")).forEach(function(c){c.remove();});}
function bot(text,ch,delay){state.busy=true;var t=el("div","nxc-msg nxc-bot nxc-typing","<i></i><i></i><i></i>");body.appendChild(t);scroll();
 setTimeout(function(){t.remove();add("bot",text);if(ch)chips(ch);state.busy=false;},delay==null?Math.min(1100,350+text.length*3):delay);}

function user(text){clearChips();add("me",text);route(text);}
var ALIAS={"What do you build?":"services","How does a project work?":"process","Pricing & timeline":"price","Custom software":"custom","AI & automation":"ai","ERP / business systems":"erp","Integrations":"integr","Examples of automation":"examples"};
var misses=0;
function route(text){
 if(text==="Start a project")return setTimeout(function(){showForm("inquiry");},300);
 if(text==="Talk to a person")return setTimeout(function(){showForm("handoff");},300);
 var e=ALIAS[text]?K.filter(function(x){return x.id===ALIAS[text];})[0]:match(text);
 if(e&&e.id==="human")return setTimeout(function(){showForm("handoff");},300);
 if(e&&e.id==="form")return setTimeout(function(){showForm("inquiry");},300);
 if(e){misses=0;return bot(e.a,e.c);}
 misses++;
 bot(misses>1?"That's a good one for our team. Leave your details and a person will reply to you directly.":"I want to make sure you get the right answer. I can connect you with a team member, or you can pick a topic below.",
   misses>1?null:["Talk to a person","What do you build?","Start a project"]);
 if(misses>1)setTimeout(function(){showForm("handoff",text);},1300);
}

/* ---------- forms ---------- */
var SERVICES=["Custom software","AI agents & automation","ERP / business systems","Dashboards & analytics","Integrations","Website / digital experience","Not sure yet"];
function field(label,name,type,req,extra){return '<label>'+label+(req?' *':'')+(type==="textarea"?'<textarea name="'+name+'" '+(req?'required ':'')+(extra||'')+'></textarea>':'<input name="'+name+'" type="'+type+'" '+(req?'required ':'')+(extra||'')+'>')+'</label>';}
function showForm(kind,question){
 clearChips();
 var hand=kind==="handoff";
 add("bot",hand?"Sure. A team member will take it from here. Share how to reach you and your question, and they'll get back to you directly.":"Great, let's get your project started. A few quick details:");
 var f=el("form","nxc-form");f.noValidate=true;
 f.innerHTML='<h4>'+(hand?'Talk to a person':'Project inquiry')+'</h4>'+
  field("Name","name","text",true,'autocomplete="name" maxlength="120"')+
  (hand?'<div class="nxc-row">'+field("Email","email","email",false,'autocomplete="email" maxlength="200"')+field("Phone","phone","tel",false,'autocomplete="tel" maxlength="40"')+'</div><p>Email or phone, whichever you prefer.</p>'
       :field("Email","email","email",true,'autocomplete="email" maxlength="200"')+field("Company","company","text",false,'autocomplete="organization" maxlength="160"')+
        '<label>What do you need?<select name="service">'+SERVICES.map(function(s){return '<option>'+s+'</option>';}).join("")+'</select></label>')+
  field(hand?"Your question":"Tell us about your project","message","textarea",true,'maxlength="4000" placeholder="'+(hand?'What would you like to ask?':'What are you trying to build, fix or automate?')+'"')+
  '<input class="nxc-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">'+
  '<div class="nxc-err" role="alert"></div><button class="nxc-btn" type="submit">'+(hand?'Send to the team':'Send inquiry')+'</button>';
 if(question)f.querySelector('[name=message]').value=question;
 f.onsubmit=function(ev){ev.preventDefault();submit(f,kind);};
 body.appendChild(f);scroll();
 setTimeout(function(){var n=f.querySelector("[name=name]");if(window.innerWidth>520)n.focus();},50);
}
function submit(f,kind){
 var d={};[].slice.call(f.elements).forEach(function(x){if(x.name)d[x.name]=x.value.trim();});
 var err=f.querySelector(".nxc-err");err.textContent="";
 var emailOk=!d.email||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email);
 if(!d.name)return err.textContent="Please add your name.";
 if(kind==="handoff"&&!d.email&&!d.phone)return err.textContent="Please add an email or phone number so we can reach you.";
 if(kind!=="handoff"&&!d.email)return err.textContent="Please add your email.";
 if(!emailOk)return err.textContent="That email doesn't look right.";
 if(!d.message||d.message.length<2)return err.textContent=kind==="handoff"?"Please add your question.":"Please tell us a little about your project.";
 var btn=f.querySelector(".nxc-btn");btn.disabled=true;btn.textContent="Sending…";
 d.type=kind;d.transcript=transcript.join("\n").slice(-6000);d.page=location.href;
 send(d).then(function(ok){
  if(ok){f.remove();var first=d.name.split(" ")[0];
   add("bot",kind==="handoff"
    ?"Thanks, "+first+". Your message is with our team. Opening live chat now: if someone is available you can talk right here, otherwise a person will reach out to you at "+(d.email||d.phone)+" as soon as possible."
    :"Thanks, "+first+". Your inquiry is in. We'll review it and reply to "+d.email+" with next steps.");
   if(kind==="handoff"&&typeof LIVE.open==="function"){try{LIVE.open(d);}catch(e){}}
   chips(["What do you build?","How does a project work?"]);
  }else{btn.disabled=false;btn.textContent="Try again";
   err.innerHTML='Something went wrong sending this. Please try again, or <a style="color:#c9d0ff;text-decoration:underline" href="'+mailto(d)+'">send it by email</a>.';}
 });
}
function mailto(d){var s=(d.type==="handoff"?"Chat question from ":"Project inquiry from ")+d.name;
 var b="Name: "+d.name+"\nEmail: "+(d.email||"")+"\nPhone: "+(d.phone||"")+"\nCompany: "+(d.company||"")+"\nService: "+(d.service||"")+"\n\n"+d.message;
 return "mailto:"+FALLBACK_MAIL+"?subject="+encodeURIComponent(s)+"&body="+encodeURIComponent(b);}
function send(d){
 if(!window.fetch)return Promise.resolve(false);
 return fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d)})
  .then(function(r){return r.json().then(function(j){return !!(r.ok&&j.ok);});}).catch(function(){return false;});
}
window.DaysWonLead={send:send,mailto:mailto};

/* ---------- open / close ---------- */
function open(){document.documentElement.classList.add("nxc-open");root.classList.add("on");
 if(!state.started){state.started=true;
  bot("Hi, welcome to DaysWon. I can answer questions about what we build, walk you through how a project works, or help you start an inquiry.\n\nIf you'd rather talk to a person, just say so.",MAIN,500);}
 if(window.innerWidth>520)setTimeout(function(){ta.focus();},250);
 try{if(window.innerWidth<=520)document.body.style.overflow="hidden";}catch(e){}}
function close(){document.documentElement.classList.remove("nxc-open");document.body.style.overflow="";launch.focus();}
launch.onclick=open;panel.querySelector(".nxc-x").onclick=close;
panel.querySelector(".nxc-person").onclick=function(){if(!state.busy)showForm("handoff");};
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&document.documentElement.classList.contains("nxc-open"))close();});
inForm.onsubmit=function(e){e.preventDefault();var v=ta.value.trim();if(!v)return;ta.value="";ta.style.height="";user(v);};
ta.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();inForm.requestSubmit?inForm.requestSubmit():inForm.onsubmit(e);}});
ta.addEventListener("input",function(){ta.style.height="auto";ta.style.height=Math.min(110,ta.scrollHeight)+"px";});
[].slice.call(document.querySelectorAll('[data-chat]')).forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();open();});});
if(/[?&#]chat\b/.test(location.search+location.hash))open();
})();
