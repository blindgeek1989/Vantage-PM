'use strict';
const IS_ELECTRON = typeof window.electronAPI !== 'undefined';

const WCAG_CRITERIA=[
  {id:'1.1.1',name:'Non-text Content',level:'A',desc:'All non-text content has a text alternative.'},
  {id:'1.3.1',name:'Info and Relationships',level:'A',desc:'Structure conveyed through presentation is programmatically determinable.'},
  {id:'1.4.3',name:'Contrast (Minimum)',level:'AA',desc:'Text has a contrast ratio of at least 4.5:1.'},
  {id:'1.4.11',name:'Non-text Contrast',level:'AA',desc:'UI components and graphics have 3:1 contrast ratio.'},
  {id:'1.4.12',name:'Text Spacing',level:'AA',desc:'No loss of content when text spacing is adjusted.'},
  {id:'2.1.1',name:'Keyboard',level:'A',desc:'All functionality is operable through a keyboard.'},
  {id:'2.1.2',name:'No Keyboard Trap',level:'A',desc:'Keyboard focus is not trapped.'},
  {id:'2.4.1',name:'Bypass Blocks',level:'A',desc:'Mechanism to skip repeated blocks of content.'},
  {id:'2.4.3',name:'Focus Order',level:'A',desc:'Focus order preserves meaning and operability.'},
  {id:'2.4.7',name:'Focus Visible',level:'AA',desc:'Keyboard focus indicator is visible.'},
  {id:'2.4.11',name:'Focus Appearance',level:'AA',desc:'Focus indicator meets minimum size and contrast.'},
  {id:'2.5.3',name:'Label in Name',level:'A',desc:'Accessible name contains visible label text.'},
  {id:'2.5.8',name:'Target Size (Minimum)',level:'AA',desc:'Target size is at least 24x24 CSS pixels.'},
  {id:'3.1.1',name:'Language of Page',level:'A',desc:'Default human language is programmatically determinable.'},
  {id:'3.3.1',name:'Error Identification',level:'A',desc:'Input errors are identified and described in text.'},
  {id:'3.3.2',name:'Labels or Instructions',level:'A',desc:'Labels or instructions provided for user input.'},
  {id:'3.3.3',name:'Error Suggestion',level:'AA',desc:'Error correction suggestions are provided when known.'},
  {id:'4.1.2',name:'Name, Role, Value',level:'A',desc:'UI components have accessible name, role, and state/value.'},
  {id:'4.1.3',name:'Status Messages',level:'AA',desc:'Status messages can be programmatically determined.'},
];

const DEFAULT_SETTINGS = {
  theme:'system',language:'en',fontSize:16,reduceMotion:false,highContrast:false,
  driveFolderId:'',driveFolderName:'',syncInterval:5,reminderLeadDays:1,
  focusModeUser:'',hasSeenOnboarding:false,
  shortcuts:{
    newTask:'Alt+N',goToDashboard:'Alt+1',goToTasks:'Alt+2',goToCalendar:'Alt+3',
    goToTeam:'Alt+4',goToReports:'Alt+5',goToSettings:'Alt+Comma',
    saveItem:'Alt+S',closeModal:'Escape',searchTasks:'Alt+F',
    syncDrive:'Alt+R',toggleTheme:'Alt+T',focusNav:'Alt+M',focusMain:'Alt+C',
    dailyBriefing:'Alt+B',focusMode:'Alt+G',exportCSV:'Alt+E',
    globalSearch:'Alt+Slash',quickShortcuts:'Alt+K',quickCapture:'Alt+Q',sessionSummary:'Alt+Y',
  },
  notifications:true,autoSync:true,confirmOnDelete:true,dateFormat:'MM/DD/YYYY',
  googleConnected:false,googleEmail:null,platform:'win32',appVersion:'9.3.0',agingThresholdDays:5,
};

let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
let systemDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', e => {
  systemDark = e.matches;
  if (settings.theme === 'system') applyTheme();
});
let focusMode = false;
let customStatuses = [];
let templates = [];
let nextTemplateId=10;
let projects=[];
let milestones=[];
let tasks=[];
let members=[];
let activityLog=[];
let auditResults={};
let projectNotes={};
let sessionLog=[];
const sessionStart=new Date();
let nextTaskId=10,nextMemberId=10,nextProjectId=10,nextMilestoneId=10,nextStatusId=10;
let editingTaskId=null,currentView='dashboard';
let sortCol='due',sortAsc=true;
let filterStatus='all',filterPriority='all',filterProject='all',searchText='';
let auditFilter='all',auditSearch='';
let calYear=new Date().getFullYear(),calMonth=new Date().getMonth();
let selectedFolderId=null,selectedFolderName=null;
let activeSettingsTab='general';
let lastSync=null;
let modalStack=[],modalFocusReturn=null;
let currentTaskComments=[],currentTaskAttachments=[],currentTaskDependencies=[],currentTaskTimeLog=[];
let globalSearchOpen=false;
let bulkSelected=new Set();
let pendingSettings={},settingsHasChanges=false,settingsSnapshot={},pendingNavTarget=null;
let filterPresets=[];
let activePresetIdx=-1;
let changeRoleMemberId=null;
let undoStack=[];
let _addProjectFromTask=false;
const today=new Date();

function allStatuses(){return[{id:'todo',name:'To Do',color:'#1547C8'},{id:'inprogress',name:'In Progress',color:'#7A4700'},{id:'done',name:'Done',color:'#0A6B3C'},...customStatuses];}
function statusName(id){return allStatuses().find(s=>s.id===id)?.name||id;}

async function init(){
  if(IS_ELECTRON){
    window.electronAPI.onInitSettings(s=>{applySettings(s);});
    window.electronAPI.onSystemTheme(t=>{systemDark=t==='dark';applyTheme();});
    window.electronAPI.onNav(a=>handleNavAction(a));
    window.electronAPI.onUpdateDownloaded(()=>announce('A new version is ready. Check the Help menu.'));
    window.electronAPI.onCheckReminders(()=>checkReminders());
    const s=await window.electronAPI.getSettings();applySettings(s);
    const local=await window.electronAPI.localLoad();
    if(local.data)applyDataSnapshot(local.data);
    if(s.autoSync&&s.googleConnected&&s.driveFolderId) syncDrive();
  } else { applyTheme(); }
  nav('dashboard',document.querySelector('[data-view=dashboard]'));
  if(!settings.hasSeenOnboarding||!settings.focusModeUser) openSetupModal();
  document.addEventListener('keydown',handleKey,{capture:true});
  document.addEventListener('click',closeAllRowMenus);
}
function applySettings(s){Object.assign(settings,s);applyTheme();document.documentElement.lang=settings.language;document.documentElement.style.setProperty('--fs',settings.fontSize+'px');if(settings.reduceMotion)document.documentElement.setAttribute('data-reduce-motion','');else document.documentElement.removeAttribute('data-reduce-motion');if(settings.highContrast)document.documentElement.setAttribute('data-contrast','');else document.documentElement.removeAttribute('data-contrast');}
function applyTheme(){
  const dark = settings.theme==='dark' || (settings.theme==='system' && systemDark);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}
function applyDataSnapshot(data){
  if(!data)return;
  if(data.tasks){tasks=data.tasks;if(tasks.length)nextTaskId=Math.max(nextTaskId,...tasks.map(t=>t.id+1));}
  if(data.members){members=data.members;if(members.length)nextMemberId=Math.max(nextMemberId,...members.map(m=>m.id+1));}
  if(data.projects){projects=data.projects;if(projects.length)nextProjectId=Math.max(nextProjectId,...projects.map(p=>p.id+1));}
  if(data.milestones){milestones=data.milestones;if(milestones.length)nextMilestoneId=Math.max(nextMilestoneId,...milestones.map(m=>m.id+1));}
  if(data.templates){templates=data.templates;if(templates.length)nextTemplateId=Math.max(nextTemplateId,...templates.map(t=>t.id+1));}
  if(data.activityLog)activityLog=data.activityLog;
  if(data.auditResults)auditResults=data.auditResults;
  if(data.customStatuses)customStatuses=data.customStatuses;
  if(data.projectNotes)projectNotes=data.projectNotes;
  if(data.filterPresets)filterPresets=data.filterPresets;
  if(data.persona)settings.persona=data.persona;
}
let _localSaveTimer=null;
function scheduleLocalSave(){
  if(!IS_ELECTRON)return;
  clearTimeout(_localSaveTimer);
  _localSaveTimer=setTimeout(()=>window.electronAPI.localSave({tasks,members,projects,milestones,activityLog,auditResults,customStatuses,templates,projectNotes,filterPresets,persona:settings.persona}),800);
}

function checkReminders(){if(!settings.notifications)return;const lead=settings.reminderLeadDays||1;const cutoff=new Date();cutoff.setDate(cutoff.getDate()+lead);tasks.forEach(t=>{if(t.status==='done')return;const due=new Date(t.due+'T00:00');if(due<=cutoff&&IS_ELECTRON)window.electronAPI.sendReminder({title:due<today?'Overdue':'Upcoming',body:`"${t.name}" ${due<today?'is overdue':'is due '+fmtDate(t.due)}.`});});}

function suggestPriority(){const due=document.getElementById('t-due')?.value;const name=document.getElementById('t-name')?.value?.toLowerCase()||'';const box=document.getElementById('priority-suggestion');if(!box||!due){if(box)box.classList.add('hidden');return;}const days=Math.ceil((new Date(due+'T00:00')-today)/86400000);const urgent=['urgent','critical','blocker','asap'].some(w=>name.includes(w));const assignee=document.getElementById('t-assignee')?.value;const load=tasks.filter(t=>t.assignee===assignee&&t.status!=='done').length;let sug='',reason='';if(days<=2||urgent){sug='high';reason=urgent?'task name suggests urgency':'due within 2 days';}else if(days<=7||load>=5){sug='high';reason=load>=5?`${assignee} has ${load} open tasks`:'due within a week';}else if(days<=14){sug='medium';reason='due within 2 weeks';}else{box.classList.add('hidden');return;}box.classList.remove('hidden');box.innerHTML=`<span aria-hidden="true">💡</span> Suggested: <strong>${sug}</strong> — ${esc(reason)}. <button class="btn btn-secondary btn-sm" onclick="document.getElementById('t-priority').value='${sug}';document.getElementById('priority-suggestion').classList.add('hidden');announce('Priority set to ${sug}.');">Apply</button>`;announce(`Priority suggestion: ${sug}. ${reason}.`);}

function dailyBriefing(){const user=settings.focusModeUser||members[0]?.name||'';const my=tasks.filter(t=>t.assignee===user);const ov=my.filter(t=>t.status!=='done'&&new Date(t.due+'T00:00')<today);const ts=today.toISOString().split('T')[0];const dt=my.filter(t=>t.due===ts&&t.status!=='done');const ip=my.filter(t=>t.status==='inprogress');const lines=[`Good ${getTimeOfDay()}, ${user.split(' ')[0]}. Briefing for ${today.toLocaleDateString(settings.language,{weekday:'long',month:'long',day:'numeric'})}.`,ov.length?`${ov.length} overdue: ${ov.map(t=>t.name).join(', ')}.`:'No overdue tasks.',dt.length?`Due today: ${dt.map(t=>t.name).join(', ')}.`:'Nothing due today.',ip.length?`In progress: ${ip.map(t=>t.name).join(', ')}.`:'Nothing in progress.',`${my.filter(t=>t.status==='todo').length} to do. ${my.filter(t=>t.status==='done').length} done.`];document.getElementById('briefing-content').innerHTML=`<ol style="list-style:none;padding:0" aria-label="Briefing">${lines.map((l,i)=>`<li style="padding:10px 0;border-bottom:1px solid var(--border);font-size:.9rem;line-height:1.6" tabindex="0"><span class="sr-only">Item ${i+1}: </span>${esc(l)}</li>`).join('')}</ol>`;openModalEl('briefing-modal');readBriefingAloud(lines.join('. '));}
function readBriefingAloud(text){announce(text||'');if('speechSynthesis' in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=0.9;window.speechSynthesis.speak(u);}}
function getTimeOfDay(){const h=new Date().getHours();return h<12?'morning':h<17?'afternoon':'evening';}

function toggleFocusMode(){focusMode=!focusMode;document.getElementById('focus-bar').hidden=!focusMode;document.getElementById('focus-btn').setAttribute('aria-pressed',String(focusMode));announce(focusMode?`Focus mode on. Showing tasks for ${settings.focusModeUser}.`:'Focus mode off.');if(['tasks','dashboard'].includes(currentView))nav(currentView,document.querySelector(`[data-view=${currentView}]`));}

function exportCSV(){const headers=['ID','Name','Project','Assignee','Priority','Status','Due','Progress','Recurring','Color','Hours','Comments','Dependencies'];const rows=tasks.map(t=>{const proj=projects.find(p=>p.id===t.projectId);const hours=(t.timeLog||[]).reduce((a,e)=>a+e.hours,0);return[t.id,t.name,proj?.name||'',t.assignee,t.priority,statusName(t.status),t.due,t.progress,t.recur||'none',t.colorLabel||'',hours,(t.comments||[]).length,(t.dependencies||[]).length];});const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`accesspm-${today.toISOString().split('T')[0]}.csv`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);announce('CSV exported.');toast('CSV exported.','success');}

function toggleGlobalSearch(){globalSearchOpen=!globalSearchOpen;const bar=document.getElementById('search-bar');const btn=document.getElementById('search-toggle-btn');bar.hidden=!globalSearchOpen;btn.setAttribute('aria-expanded',String(globalSearchOpen));if(globalSearchOpen){requestAnimationFrame(()=>document.getElementById('global-search')?.focus());announce('Global search opened.');}else{document.getElementById('global-search').value='';document.getElementById('search-results').classList.add('hidden');announce('Search closed.');}}
function runGlobalSearch(query){const res=document.getElementById('search-results');if(!query||query.length<2){res.classList.add('hidden');return;}const q=query.toLowerCase();const results=[];tasks.filter(t=>t.name.toLowerCase().includes(q)||(t.desc||'').toLowerCase().includes(q)||(t.comments||[]).some(c=>c.text.toLowerCase().includes(q))).slice(0,5).forEach(t=>results.push({type:'Task',name:t.name,meta:t.assignee+' · '+statusName(t.status),action:()=>{toggleGlobalSearch();nav('tasks');setTimeout(()=>openEditTask(t.id),200);}}));projects.filter(p=>p.name.toLowerCase().includes(q)||(p.desc||'').toLowerCase().includes(q)).slice(0,3).forEach(p=>results.push({type:'Project',name:p.name,meta:p.desc||'',action:()=>{toggleGlobalSearch();nav('projects');}}));members.filter(m=>m.name.toLowerCase().includes(q)||m.role.toLowerCase().includes(q)||(m.dept||'').toLowerCase().includes(q)||(m.email||'').toLowerCase().includes(q)).slice(0,3).forEach(m=>results.push({type:'Team',name:m.name,meta:m.role+(m.dept?` · ${m.dept}`:''),action:()=>{toggleGlobalSearch();nav('team');}}));Object.entries(projectNotes).forEach(([pid,notes])=>{const proj=projects.find(p=>String(p.id)===pid);if(!proj)return;(notes||[]).filter(n=>(n.text||'').toLowerCase().includes(q)).slice(0,2).forEach(n=>results.push({type:'Note',name:n.text.slice(0,60),meta:proj.name,action:()=>{toggleGlobalSearch();openNotes(proj.id,proj.name);}}));});activityLog.filter(a=>a.text.toLowerCase().includes(q)).slice(0,2).forEach(a=>results.push({type:'Activity',name:a.text.slice(0,60),meta:new Date(a.timestamp).toLocaleDateString(),action:()=>{toggleGlobalSearch();nav('activity');}}));if(!results.length){res.innerHTML=`<div style="padding:16px;text-align:center;color:var(--muted)">No results for "${esc(query)}"</div>`;res.classList.remove('hidden');announce('No results.');return;}res.innerHTML=results.map((r,i)=>`<div class="search-result-item" role="option" tabindex="0" onclick="(${r.action.toString()})()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();(${r.action.toString()})();}" aria-label="${esc(r.type)}: ${esc(r.name)}. ${esc(r.meta)}"><span class="search-result-type">${esc(r.type)}</span><span class="search-result-name">${esc(r.name)}</span><span class="search-result-meta">${esc(r.meta)}</span></div>`).join('');res.classList.remove('hidden');announce(`${results.length} result${results.length!==1?'s':''} found.`);}

function handleKey(e){const tag=document.activeElement?.tagName;const isTyping=['INPUT','TEXTAREA','SELECT'].includes(tag)||document.activeElement?.isContentEditable;if(isTyping&&e.key!=='Escape')return;const sc=settings.shortcuts;const combo=buildCombo(e);const map={[sc.newTask]:()=>{if(!modalStack.length)openAddTask();},[sc.goToDashboard]:()=>navWithCheck('dashboard'),[sc.goToTasks]:()=>navWithCheck('tasks'),[sc.goToCalendar]:()=>navWithCheck('calendar'),[sc.goToTeam]:()=>navWithCheck('team'),[sc.goToReports]:()=>navWithCheck('reports'),[sc.goToSettings]:()=>navWithCheck('settings'),[sc.syncDrive]:()=>syncDrive(),[sc.toggleTheme]:()=>toggleTheme(),[sc.focusNav]:()=>document.getElementById('main-nav')?.querySelector('button')?.focus(),[sc.focusMain]:()=>document.getElementById('main-content')?.focus(),[sc.searchTasks]:()=>{navWithCheck('tasks');setTimeout(()=>document.getElementById('search-input')?.focus(),120);},[sc.closeModal]:()=>closeTopModal(),[sc.dailyBriefing]:()=>dailyBriefing(),[sc.focusMode]:()=>toggleFocusMode(),[sc.exportCSV]:()=>exportCSV(),[sc.globalSearch]:()=>toggleGlobalSearch(),[sc.quickShortcuts]:()=>showShortcutsModal()};if(map[combo]){e.preventDefault();map[combo]();return;}if(globalSearchOpen&&e.key==='ArrowDown'){e.preventDefault();document.querySelector('#search-results .search-result-item')?.focus();return;}if(e.altKey&&!e.ctrlKey&&!e.shiftKey&&e.key>='1'&&e.key<='9'){const idx=parseInt(e.key)-1;if(idx<filterPresets.length){e.preventDefault();loadFilterPreset(idx);}}}
function buildCombo(e){const parts=[];if(e.ctrlKey)parts.push('Ctrl');if(e.altKey)parts.push('Alt');if(e.shiftKey)parts.push('Shift');if(e.metaKey)parts.push('Meta');const key=e.key===','?'Comma':e.key==='/'?'Slash':e.key;if(!['Control','Alt','Shift','Meta'].includes(key))parts.push(key);return parts.join('+');}
function handleNavAction(a){const m={goToDashboard:()=>navWithCheck('dashboard'),goToTasks:()=>navWithCheck('tasks'),goToCalendar:()=>navWithCheck('calendar'),goToTeam:()=>navWithCheck('team'),goToReports:()=>navWithCheck('reports'),goToSettings:()=>navWithCheck('settings'),newTask:()=>openAddTask(),syncDrive:()=>syncDrive(),toggleTheme:()=>toggleTheme(),focusNav:()=>document.getElementById('main-nav')?.querySelector('button')?.focus(),focusMain:()=>document.getElementById('main-content')?.focus(),showShortcuts:()=>showShortcutsModal(),dailyBriefing:()=>dailyBriefing(),exportCSV:()=>exportCSV(),globalSearch:()=>toggleGlobalSearch(),quickCapture:()=>openQuickCapture()};if(m[a])m[a]();}

function navWithCheck(view,btn,settingsTab){if(currentView==='settings'&&settingsHasChanges&&view!=='settings'){pendingNavTarget={view,btn,settingsTab};openModalEl('unsaved-modal');return;}nav(view,btn,settingsTab);}
function discardAndNavigate(){settingsHasChanges=false;pendingSettings={};closeModal('unsaved-modal');if(pendingNavTarget)nav(pendingNavTarget.view,pendingNavTarget.btn,pendingNavTarget.settingsTab);pendingNavTarget=null;}

function nav(view,btn,settingsTab){
  currentView=view;
  document.querySelectorAll('.nav-btn').forEach(b=>b.removeAttribute('aria-current'));
  const target=btn||document.querySelector(`[data-view=${view}]`);if(target)target.setAttribute('aria-current','page');
  const titles={dashboard:'Dashboard',tasks:'Tasks',projects:'Projects',milestones:'Milestones',health:'Project Health',templates:'Task Templates',calendar:'Calendar',team:'Team',reports:'Reports',audit:'WCAG 2.2 Audit',activity:'Activity Log',onboarding:'Onboarding',settings:'Settings'};
  const title=titles[view]||view;
  document.getElementById('page-title').textContent=title;
  document.getElementById('breadcrumb-current').textContent=title;
  const pb=document.getElementById('primary-btn');
  if(view==='team'){pb.textContent='＋ Add Member';pb.onclick=openAddMember;pb.style.display='';}
  else if(view==='projects'){pb.textContent='＋ Add Project';pb.onclick=openAddProject;pb.style.display='';}
  else if(view==='milestones'){pb.textContent='＋ Add Milestone';pb.onclick=openAddMilestone;pb.style.display='';}
  else if(view==='templates'){pb.textContent='＋ Add Template';pb.onclick=openAddTemplate;pb.style.display='';}
  else if(['settings','activity','reports','audit','onboarding','health'].includes(view)){pb.style.display='none';}
  else{pb.textContent='＋ Add Task';pb.onclick=openAddTask;pb.style.display='';}
  if(view!=='settings'){settingsHasChanges=false;pendingSettings={};}
  const root=document.getElementById('main-content');
  if(view==='dashboard')root.innerHTML=renderDashboard();
  else if(view==='tasks')root.innerHTML=renderTasks();
  else if(view==='projects')root.innerHTML=renderProjects();
  else if(view==='milestones')root.innerHTML=renderMilestones();
  else if(view==='health')    root.innerHTML=renderHealth();
  else if(view==='templates')root.innerHTML=renderTemplates();
  else if(view==='calendar'){root.innerHTML=renderCalendar();bindCalNav();}
  else if(view==='team')root.innerHTML=renderTeam();
  else if(view==='reports')root.innerHTML=renderReports();
  else if(view==='audit')root.innerHTML=renderAudit();
  else if(view==='activity')root.innerHTML=renderActivity();
  else if(view==='onboarding')root.innerHTML=renderOnboarding();
  else if(view==='settings'){root.innerHTML=renderSettings();if(settingsTab)showSettingsTab(settingsTab);}
  root.focus();announce(`Navigated to ${title}.`);
}
function renderDashboard(){const _setupNotice=settings.focusModeUser?'':`<div class="card" role="note" style="margin-bottom:16px;border-color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,var(--surface))"><strong style="display:block;margin-bottom:6px"><span aria-hidden="true">👤</span> Complete your setup</strong><p style="font-size:.86rem;margin-bottom:8px">Enter your name in <strong>Settings → General</strong> as the Focus Mode User to personalize your Daily Briefing and Focus Mode.</p><button class="btn btn-primary btn-sm" onclick="nav('settings',null,'general')">Open Settings</button></div>`;let myT=focusMode?tasks.filter(t=>t.assignee===(settings.focusModeUser||members[0]?.name)):tasks;const total=myT.length,done=myT.filter(t=>t.status==='done').length,todo=myT.filter(t=>t.status==='todo').length,ip=myT.filter(t=>t.status==='inprogress').length,overdue=myT.filter(t=>t.status!=='done'&&new Date(t.due+'T00:00')<today).length,avg=total?Math.round(myT.reduce((a,t)=>a+t.progress,0)/total):0;const ts=today.toISOString().split('T')[0];const todayTasks=myT.filter(t=>t.due===ts&&t.status!=='done');const upMs=milestones.filter(m=>{const d=new Date(m.date+'T00:00');return d>=today&&d<=new Date(today.getTime()+14*86400000);}).sort((a,b)=>new Date(a.date)-new Date(b.date));return`${_setupNotice}<div class="today-widget" role="region" aria-label="Tasks due today"><h2 style="font-size:.9rem;font-weight:700;color:var(--accent);margin-bottom:10px"><span aria-hidden="true">📅</span> Due Today — ${today.toLocaleDateString(settings.language,{weekday:'long',month:'long',day:'numeric'})}</h2>${todayTasks.length===0?'<p style="font-size:.85rem;color:var(--muted)">Nothing due today.</p>':`<ul style="list-style:none;padding:0;margin:0">${todayTasks.map(t=>`<li class="today-task-item">${sBadge(t.status)}<span style="flex:1;font-weight:600">${esc(t.name)}</span><button class="btn btn-success btn-sm" onclick="markDone(${t.id})" aria-label="Mark ${esc(t.name)} done">Done</button><button class="btn btn-secondary btn-sm" onclick="openEditTask(${t.id})" aria-label="Edit ${esc(t.name)}">Edit</button></li>`).join('')}</ul>`}</div>${upMs.length?`<div class="card mt-16" role="region" aria-label="Upcoming milestones"><h2 class="section-h"><span aria-hidden="true">🏁</span> Upcoming Milestones</h2><ul style="list-style:none;padding:0">${upMs.map(m=>{const proj=projects.find(p=>p.id===m.projectId);return`<li class="milestone-item"><span aria-hidden="true">🏁</span><span style="flex:1;font-weight:600">${esc(m.name)}</span>${proj?`<span class="project-chip" style="color:${proj.color};border-color:${proj.color}">${esc(proj.name)}</span>`:''}<span style="font-size:.82rem;color:var(--muted)">${fmtDate(m.date)}</span></li>`;}).join('')}</ul></div>`:''}<section aria-label="Summary" class="mt-16"><div class="stat-grid" role="list">${[['Total',total,'var(--accent)'],['To Do',todo,'var(--warn)'],['In Progress',ip,'var(--accent)'],['Done',done,'var(--success)'],['Overdue',overdue,'var(--danger)'],['Avg Progress',avg+'%','var(--accent)']].map(([l,v,c])=>`<div class="card stat-card" role="listitem"><div class="stat-num" style="color:${c}">${v}</div><div class="stat-lbl">${l}</div></div>`).join('')}</div></section><section class="mt-16" aria-label="Recent tasks"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><h2 class="section-h" style="margin-bottom:0;border:none">Recent Tasks</h2><button class="btn btn-secondary btn-sm" onclick="exportCSV()"><span aria-hidden="true">📥</span> Export CSV</button></div><div class="tbl-wrap"><table aria-label="Recent tasks"><thead><tr><th scope="col">Task</th><th scope="col">Assignee</th><th scope="col">Status</th><th scope="col">Due</th></tr></thead><tbody>${[...myT].sort((a,b)=>new Date(b.due)-new Date(a.due)).slice(0,5).map(t=>`<tr><td><span style="display:inline-flex;align-items:center;gap:6px">${t.colorLabel?`<span class="color-dot" style="background:${t.colorLabel}" aria-hidden="true"></span>`:''}<strong>${esc(t.name)}</strong></span></td><td>${esc(t.assignee)}</td><td>${sBadge(t.status)}</td><td>${fmtDate(t.due)}</td></tr>`).join('')}</tbody></table></div></section>`;}
function renderTasks(){const filtered=tasks.filter(t=>{if(focusMode&&t.assignee!==(settings.focusModeUser||members[0]?.name))return false;if(filterStatus!=='all'&&t.status!==filterStatus)return false;if(filterPriority!=='all'&&t.priority!==filterPriority)return false;if(filterProject!=='all'&&String(t.projectId)!==filterProject)return false;if(searchText){const q=searchText.toLowerCase();const inName=t.name.toLowerCase().includes(q);const inAssignee=t.assignee.toLowerCase().includes(q);const inDesc=(t.desc||'').toLowerCase().includes(q);const inComments=(t.comments||[]).some(c=>c.text.toLowerCase().includes(q));const inDue=(t.due||'').includes(q);if(!inName&&!inAssignee&&!inDesc&&!inComments&&!inDue)return false;}return true;});filtered.sort((a,b)=>{let av=a[sortCol],bv=b[sortCol];if(sortCol==='due'){av=new Date(av);bv=new Date(bv);}return sortAsc?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0);});filtered.sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0));const si=c=>sortCol===c?(sortAsc?' ↑':' ↓'):'';const sa=c=>sortCol===c?(sortAsc?'ascending':'descending'):'none';const selCount=bulkSelected.size;return`${renderPresetBar()}<div id="bulk-bar" class="bulk-bar${selCount===0?' hidden':''}" role="region" aria-live="polite" aria-label="Bulk actions — ${selCount} selected"><span>${selCount} task${selCount!==1?'s':''} selected</span><label for="bulk-status" class="sr-only">Change status</label><select id="bulk-status" class="form-select" style="width:auto" aria-label="Change status"><option value="">— Change status —</option>${allStatuses().map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select><label for="bulk-assignee" class="sr-only">Reassign</label><select id="bulk-assignee" class="form-select" style="width:auto" aria-label="Reassign"><option value="">— Reassign —</option>${members.map(m=>`<option value="${esc(m.name)}">${esc(m.name)}</option>`).join('')}</select><button class="btn btn-secondary btn-sm" onclick="applyBulk()">Apply</button><button class="btn btn-secondary btn-sm" onclick="clearBulk()">Clear</button><button class="btn btn-danger btn-sm" onclick="bulkDelete()">Delete Selected</button></div><div class="filters" role="search" aria-label="Task filters"><label for="search-input" class="sr-only">Search</label><input id="search-input" class="form-input" type="search" placeholder="Search…" value="${esc(searchText)}" style="width:180px" oninput="searchText=this.value;document.getElementById('main-content').innerHTML=renderTasks()" aria-label="Search tasks"/><label for="fs" class="sr-only">Status</label><select id="fs" class="form-select" style="width:auto" onchange="filterStatus=this.value;document.getElementById('main-content').innerHTML=renderTasks()" aria-label="Filter by status"><option value="all">All Statuses</option>${allStatuses().map(s=>`<option value="${s.id}" ${filterStatus===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select><label for="fp" class="sr-only">Priority</label><select id="fp" class="form-select" style="width:auto" onchange="filterPriority=this.value;document.getElementById('main-content').innerHTML=renderTasks()" aria-label="Filter by priority"><option value="all">All Priorities</option><option value="high" ${filterPriority==='high'?'selected':''}>High</option><option value="medium" ${filterPriority==='medium'?'selected':''}>Medium</option><option value="low" ${filterPriority==='low'?'selected':''}>Low</option></select><label for="fproj" class="sr-only">Project</label><select id="fproj" class="form-select" style="width:auto" onchange="filterProject=this.value;document.getElementById('main-content').innerHTML=renderTasks()" aria-label="Filter by project"><option value="all">All Projects</option>${projects.map(p=>`<option value="${p.id}" ${filterProject===String(p.id)?'selected':''}>${esc(p.name)}</option>`).join('')}</select><button class="btn btn-secondary btn-sm" onclick="exportCSV()"><span aria-hidden="true">📥</span> Export CSV</button><button class="btn btn-secondary btn-sm" onclick="importCSVClick()"><span aria-hidden="true">📤</span> Import CSV</button><button class="btn btn-secondary btn-sm" onclick="openBatchTimeLog()" aria-haspopup="dialog"><span aria-hidden="true">⏱</span> Log Time</button><button class="btn btn-secondary btn-sm" onclick="openSavePreset()" aria-haspopup="dialog"><span aria-hidden="true">🔖</span> Save Preset</button><span aria-live="polite" style="font-size:.82rem;color:var(--muted)">${filtered.length} shown</span></div><div class="tbl-wrap"><table aria-label="Tasks"><thead><tr><th scope="col"><input type="checkbox" onchange="toggleSelectAll(this.checked,${JSON.stringify(filtered.map(t=>t.id))})" aria-label="Select all"/></th><th scope="col"><button onclick="setSort('name')" aria-sort="${sa('name')}">Task${si('name')}</button></th><th scope="col">Project</th><th scope="col"><button onclick="setSort('assignee')" aria-sort="${sa('assignee')}">Assignee${si('assignee')}</button></th><th scope="col"><button onclick="setSort('priority')" aria-sort="${sa('priority')}">Priority${si('priority')}</button></th><th scope="col"><button onclick="setSort('status')" aria-sort="${sa('status')}">Status${si('status')}</button></th><th scope="col"><button onclick="setSort('due')" aria-sort="${sa('due')}">Due${si('due')}</button></th><th scope="col">Progress</th><th scope="col">Actions</th></tr></thead><tbody>${filtered.length===0?`<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px">No tasks match your filters.</td></tr>`:filtered.map(t=>{const proj=projects.find(p=>p.id===t.projectId);const isOverdue=new Date(t.due+'T00:00')<today&&t.status!=='done';const totalH=(t.timeLog||[]).reduce((a,e)=>a+e.hours,0);const sel=bulkSelected.has(t.id);return`<tr style="${sel?'background:color-mix(in srgb,var(--accent) 8%,var(--surface))':''}"><td><input type="checkbox" ${sel?'checked':''} onchange="toggleBulkSelect(${t.id},this.checked)" aria-label="Select ${esc(t.name)}"/></td><td><span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap">${t.colorLabel?`<span class="color-dot" style="background:${t.colorLabel}" aria-hidden="true"></span>`:''}<strong>${esc(t.name)}</strong>${t.recur&&t.recur!=='none'?` <span class="badge badge-low"><span aria-hidden="true">🔁</span>${t.recur}</span>`:''} ${isTaskAging(t)?`<span class="badge badge-aging" aria-label="No update in ${taskAgeDays(t)} days"><span aria-hidden="true">🕐</span> ${taskAgeDays(t)}d stale</span>`:''}</span></td><td>${proj?`<span class="project-chip" style="color:${proj.color};border-color:${proj.color}">${esc(proj.name)}</span>`:'—'}</td><td>${esc(t.assignee)}</td><td>${pBadge(t.priority)}</td><td><button class="btn-inline-status" onclick="cycleStatus(${t.id})" aria-label="Status: ${esc(statusName(t.status))}. Activate to cycle.">${sBadge(t.status)}</button></td><td>${fmtDate(t.due)}${isOverdue?` <span class="badge badge-high" aria-label="Overdue">!</span>`:''}</td><td><div style="display:flex;align-items:center;gap:7px;min-width:80px"><div class="prog-wrap" role="progressbar" aria-valuenow="${t.progress}" aria-valuemin="0" aria-valuemax="100" aria-label="${t.progress}%" style="flex:1"><div class="prog-bar" style="width:${t.progress}%"></div></div><span style="font-size:.75rem;color:var(--muted);width:28px;text-align:right">${t.progress}%</span></div>${totalH>0?`<div style="font-size:.72rem;color:var(--muted)"><span aria-hidden="true">⏱</span> ${totalH}h</div>`:''}</td><td><div class="act-btns"><button class="pin-btn" onclick="togglePin(${t.id})" aria-pressed="${t.pinned?'true':'false'}" aria-label="${t.pinned?'Unpin':'Pin'} ${esc(t.name)}"><span aria-hidden="true">${t.pinned?'📌':'📍'}</span></button><button class="btn btn-secondary btn-sm" onclick="openEditTask(${t.id})" aria-label="Edit ${esc(t.name)}">Edit</button><button class="btn btn-danger btn-sm" onclick="confirmDelete('task',${t.id},'${esc(t.name)}')" aria-label="Delete ${esc(t.name)}">Delete</button></div></td></tr>`;}).join('')}</tbody></table></div>`;}
function setSort(col){if(sortCol===col)sortAsc=!sortAsc;else{sortCol=col;sortAsc=true;}document.getElementById('main-content').innerHTML=renderTasks();announce(`Sorted by ${col}, ${sortAsc?'ascending':'descending'}.`);}
function cycleStatus(id){const t=tasks.find(t=>t.id===id);if(!t)return;const sts=allStatuses();const idx=sts.findIndex(s=>s.id===t.status);t.status=sts[(idx+1)%sts.length].id;logActivity(`"${t.name}" → ${statusName(t.status)}`,'✏️');scheduleLocalSave();document.getElementById('main-content').innerHTML=renderTasks();announce(`${t.name} status changed to ${statusName(t.status)}.`);}
function markDone(id){const t=tasks.find(t=>t.id===id);if(!t)return;t.status='done';t.progress=100;if(t.recur&&t.recur!=='none'){const nd=new Date(t.due+'T00:00');if(t.recur==='daily')nd.setDate(nd.getDate()+1);else if(t.recur==='weekly')nd.setDate(nd.getDate()+7);else nd.setMonth(nd.getMonth()+1);tasks.push({...t,id:nextTaskId++,status:'todo',progress:0,due:nd.toISOString().split('T')[0],comments:[],timeLog:[]});announce(`${t.name} marked done. Recurring task scheduled for ${fmtDate(nd.toISOString().split('T')[0])}.`);}else{announce(`${t.name} marked done.`);}logActivity(`"${t.name}" marked done`,'✅');scheduleLocalSave();nav(currentView,document.querySelector(`[data-view=${currentView}]`));toast(`${t.name} done.`,'success');}
function toggleBulkSelect(id,sel){if(sel)bulkSelected.add(id);else bulkSelected.delete(id);document.getElementById('main-content').innerHTML=renderTasks();announce(`${bulkSelected.size} task${bulkSelected.size!==1?'s':''} selected.`);}
function toggleSelectAll(sel,ids){ids.forEach(id=>sel?bulkSelected.add(id):bulkSelected.delete(id));document.getElementById('main-content').innerHTML=renderTasks();announce(sel?`All ${ids.length} tasks selected.`:'All deselected.');}
function clearBulk(){bulkSelected.clear();document.getElementById('main-content').innerHTML=renderTasks();announce('Selection cleared.');}
function applyBulk(){const status=document.getElementById('bulk-status')?.value;const assignee=document.getElementById('bulk-assignee')?.value;if(!status&&!assignee){announce('Select a status or assignee to apply.');return;}bulkSelected.forEach(id=>{const t=tasks.find(t=>t.id===id);if(!t)return;if(status)t.status=status;if(assignee)t.assignee=assignee;});const count=bulkSelected.size;logActivity(`Bulk updated ${count} task${count>1?'s':''}${status?' — status: '+statusName(status):''}${assignee?' — assigned to '+assignee:''}`, '✏️');bulkSelected.clear();document.getElementById('main-content').innerHTML=renderTasks();announce(`${count} task${count>1?'s':''} updated.`);toast(`${count} updated.`,'success');}
function bulkDelete(){const count=bulkSelected.size;if(!count){announce('No tasks selected.');return;}if(settings.confirmOnDelete){document.getElementById('cf-title').textContent='Delete Selected Tasks';document.getElementById('cf-desc').textContent=`Delete ${count} task${count>1?'s':''}? This cannot be undone.`;document.getElementById('cf-ok').onclick=()=>{doBulkDelete();closeModal('confirm-modal');};openModalEl('confirm-modal');}else doBulkDelete();}
function doBulkDelete(){const count=bulkSelected.size;const deleted=tasks.filter(t=>bulkSelected.has(t.id));undoStack.push({type:'bulk-tasks',data:deleted});tasks=tasks.filter(t=>!bulkSelected.has(t.id));logActivity(`Deleted ${count} task${count>1?'s':''}`, '🗑️');scheduleLocalSave();bulkSelected.clear();document.getElementById('main-content').innerHTML=renderTasks();announce(`${count} deleted.`);toast(`${count} deleted.`,'',{label:'Undo',fn:undoLast});}
function renderProjects(){return`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px" role="list" aria-label="Projects">${projects.map(p=>{const pt=tasks.filter(t=>t.projectId===p.id);const dn=pt.filter(t=>t.status==='done').length;const pct=pt.length?Math.round((dn/pt.length)*100):0;const aging=pt.filter(t=>isTaskAging(t)).length;const noteCount=(projectNotes[p.id]||[]).length;return`<article class="card" role="listitem" aria-label="Project: ${esc(p.name)}, ${pct}% complete"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div style="width:14px;height:14px;border-radius:50%;background:${p.color}" aria-hidden="true"></div><h2 style="font-size:1rem;font-weight:700">${esc(p.name)}</h2></div>${p.desc?`<p style="font-size:.82rem;color:var(--muted);margin-bottom:10px">${esc(p.desc)}</p>`:''}<p style="font-size:.82rem;color:var(--muted);margin-bottom:8px">${pt.length} task${pt.length!==1?'s':''} · ${dn} done${aging>0?` · <span style="color:var(--warn)">${aging} aging</span>`:''}</p><div class="prog-wrap" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${pct}%" style="margin-bottom:10px"><div class="prog-bar" style="width:${pct}%;background:${p.color}"></div></div><div class="act-btns"><button class="btn btn-secondary btn-sm" onclick="filterProject='${p.id}';nav('tasks')" aria-label="View tasks for ${esc(p.name)}">View Tasks</button><button class="btn btn-secondary btn-sm" onclick="openNotes(${p.id},'${esc(p.name)}')" aria-label="Notes for ${esc(p.name)} — ${noteCount} note${noteCount!==1?'s':''}" aria-haspopup="dialog">📝 Notes${noteCount?` (${noteCount})`:''}</button><button class="btn btn-danger btn-sm" onclick="confirmDelete('project',${p.id},'${esc(p.name)}')" aria-label="Delete ${esc(p.name)}">Delete</button></div></article>`;}).join('')}</div>`;}
function openAddProject(){openModalEl('project-modal');}
function openAddProjectFromTask(){_addProjectFromTask=true;document.getElementById('p-name').value='';document.getElementById('p-desc').value='';document.getElementById('p-color').value='#1547C8';openModalEl('project-modal');}
function saveProject(){const name=document.getElementById('p-name').value.trim();if(!name){announce('Enter a project name.');return;}const newProj={id:nextProjectId++,name,desc:document.getElementById('p-desc').value.trim(),color:document.getElementById('p-color').value};projects.push(newProj);logActivity(`Project "${name}" created`,'📁');closeModal('project-modal');if(_addProjectFromTask){_addProjectFromTask=false;populateProjectSelect(newProj.id);announce(`Project "${name}" created and selected.`);toast(`Project "${name}" added.`,'success');}else{nav('projects',document.querySelector('[data-view=projects]'));announce('Project added.');toast('Project added.','success');}}

function renderMilestones(){const sorted=[...milestones].sort((a,b)=>new Date(a.date)-new Date(b.date));return`<div class="tbl-wrap"><table aria-label="Milestones"><thead><tr><th scope="col">Milestone</th><th scope="col">Project</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead><tbody>${sorted.length===0?`<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">No milestones yet.</td></tr>`:sorted.map(m=>{const proj=projects.find(p=>p.id===m.projectId);const mDate=new Date(m.date+'T00:00');const isPast=mDate<today;const isNear=!isPast&&mDate<=new Date(today.getTime()+7*86400000);return`<tr><td><strong>${esc(m.name)}</strong>${m.desc?`<br><span style="font-size:.76rem;color:var(--muted)">${esc(m.desc)}</span>`:''}</td><td>${proj?`<span class="project-chip" style="color:${proj.color};border-color:${proj.color}">${esc(proj.name)}</span>`:'—'}</td><td>${fmtDate(m.date)}</td><td>${isPast?`<span class="badge badge-done">Past</span>`:isNear?`<span class="badge badge-high">This week</span>`:`<span class="badge badge-todo">Upcoming</span>`}</td><td><button class="btn btn-danger btn-sm" onclick="confirmDelete('milestone',${m.id},'${esc(m.name)}')" aria-label="Delete ${esc(m.name)}">Delete</button></td></tr>`;}).join('')}</tbody></table></div>`;}
function openAddMilestone(){document.getElementById('ml-project').innerHTML='<option value="">— No project —</option>'+projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');openModalEl('milestone-modal');}
function saveMilestone(){const name=document.getElementById('ml-name').value.trim(),date=document.getElementById('ml-date').value;if(!name||!date){announce('Enter a name and date.');return;}const pv=document.getElementById('ml-project').value;milestones.push({id:nextMilestoneId++,name,date,projectId:pv?parseInt(pv):null,desc:document.getElementById('ml-desc').value.trim()});logActivity(`Milestone "${name}" added`,'🏁');closeModal('milestone-modal');nav('milestones',document.querySelector('[data-view=milestones]'));announce('Milestone added.');toast('Milestone added.','success');}

function renderTemplates(){return`<p style="font-size:.85rem;color:var(--muted);margin-bottom:16px">Save common task structures as templates. Use a template when adding a new task to pre-fill the details.</p>${templates.length===0?'<p style="color:var(--muted)">No templates yet. Open any task and click Save as Template.</p>':`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px" role="list" aria-label="Templates">${templates.map(t=>`<article class="card" role="listitem" aria-label="Template: ${esc(t.name)}"><h2 style="font-size:.95rem;font-weight:700;margin-bottom:8px">${esc(t.name)}</h2><p style="font-size:.8rem;color:var(--muted);margin-bottom:10px">${esc(t.data.desc||'No description')}</p><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${pBadge(t.data.priority||'medium')}${t.data.recur&&t.data.recur!=='none'?`<span class="badge badge-low"><span aria-hidden="true">🔁</span>${t.data.recur}</span>`:''}</div><div class="act-btns"><button class="btn btn-primary btn-sm" onclick="useTemplate(${t.id})" aria-label="Use template ${esc(t.name)}">Use Template</button><button class="btn btn-danger btn-sm" onclick="deleteTemplate(${t.id})" aria-label="Delete ${esc(t.name)}">Delete</button></div></article>`).join('')}</div>`}`;}
function openAddTemplate(){openAddTask();document.getElementById('tm-title').textContent='Create Template';announce('Fill in the details and click Save as Template.');}
function saveAsTemplate(){const name=document.getElementById('t-name').value.trim();if(!name){announce('Enter a task name first.');return;}templates.push({id:nextTemplateId++,name,data:{desc:document.getElementById('t-desc').value.trim(),priority:document.getElementById('t-priority').value,status:document.getElementById('t-status').value,recur:document.getElementById('t-recur').value,colorLabel:document.getElementById('t-color').value,projectId:document.getElementById('t-project').value?parseInt(document.getElementById('t-project').value):null}});closeModal('task-modal');announce(`Template "${name}" saved.`);toast(`Template saved.`,'success');logActivity(`Template "${name}" created`,'📋');}
function useTemplate(id){const tmpl=templates.find(t=>t.id===id);if(!tmpl)return;openAddTask();document.getElementById('t-name').value=tmpl.name;document.getElementById('t-desc').value=tmpl.data.desc||'';document.getElementById('t-priority').value=tmpl.data.priority||'medium';document.getElementById('t-recur').value=tmpl.data.recur||'none';document.getElementById('t-color').value=tmpl.data.colorLabel||'';if(tmpl.data.projectId)document.getElementById('t-project').value=tmpl.data.projectId;announce(`Template "${tmpl.name}" loaded. Edit and save.`);}
function deleteTemplate(id){const t=templates.find(t=>t.id===id);templates=templates.filter(t=>t.id!==id);nav('templates',document.querySelector('[data-view=templates]'));announce('Template deleted.');toast('Template deleted.');}

function renderCalendar(){const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];const first=new Date(calYear,calMonth,1),last=new Date(calYear,calMonth+1,0).getDate(),dow=first.getDay();const byDate={};tasks.forEach(t=>{if(!byDate[t.due])byDate[t.due]=[];byDate[t.due].push(t);});const msByDate={};milestones.forEach(m=>{if(!msByDate[m.date])msByDate[m.date]=[];msByDate[m.date].push(m);});let cells='';const total=Math.ceil((dow+last)/7)*7;for(let i=0,day=1;i<total;i++){if(i<dow||day>last){cells+=`<div class="cal-day other" aria-hidden="true"></div>`;continue;}const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;const isTod=calYear===today.getFullYear()&&calMonth===today.getMonth()&&day===today.getDate();const dts=byDate[ds]||[];const mts=msByDate[ds]||[];const lbl=`${MONTHS[calMonth]} ${day}${isTod?' today':''}${dts.length?`, ${dts.length} task${dts.length>1?'s':''}`:''} ${mts.length?`, ${mts.length} milestone`:''}.`;cells+=`<div class="cal-day${isTod?' today':''}${mts.length?' milestone':''}" tabindex="0" role="button" aria-label="${lbl}" onclick="calDayClick('${ds}',${dts.length})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();calDayClick('${ds}',${dts.length});}"><div class="cal-dn" aria-hidden="true">${day}</div>${mts.map(m=>`<div class="cal-milestone"><span aria-hidden="true">🏁</span> ${esc(m.name)}</div>`).join('')}${dts.slice(0,2).map(t=>`<div class="cal-ev">${esc(t.name)}</div>`).join('')}${dts.length>2?`<div style="font-size:.65rem;color:var(--muted)">+${dts.length-2} more</div>`:''}</div>`;day++;}return`<div class="card"><div class="cal-nav"><button class="btn btn-secondary btn-sm" id="cal-prev" aria-label="Previous month">‹ Prev</button><div class="cal-month-lbl" aria-live="polite" aria-atomic="true">${MONTHS[calMonth]} ${calYear}</div><button class="btn btn-secondary btn-sm" id="cal-next" aria-label="Next month">Next ›</button></div><div class="cal-grid" role="grid" aria-label="Calendar ${MONTHS[calMonth]} ${calYear}"><div class="cal-hdr" role="columnheader">Sun</div><div class="cal-hdr" role="columnheader">Mon</div><div class="cal-hdr" role="columnheader">Tue</div><div class="cal-hdr" role="columnheader">Wed</div><div class="cal-hdr" role="columnheader">Thu</div><div class="cal-hdr" role="columnheader">Fri</div><div class="cal-hdr" role="columnheader">Sat</div>${cells}</div></div>`;}
function bindCalNav(){document.getElementById('cal-prev').onclick=()=>{calMonth--;if(calMonth<0){calMonth=11;calYear--;}document.getElementById('main-content').innerHTML=renderCalendar();bindCalNav();announce(new Date(calYear,calMonth).toLocaleString('default',{month:'long',year:'numeric'}));};document.getElementById('cal-next').onclick=()=>{calMonth++;if(calMonth>11){calMonth=0;calYear++;}document.getElementById('main-content').innerHTML=renderCalendar();bindCalNav();announce(new Date(calYear,calMonth).toLocaleString('default',{month:'long',year:'numeric'}));};}
function calDayClick(ds,count){if(count){searchText=ds;nav('tasks',document.querySelector('[data-view=tasks]'));announce(`Showing ${count} task${count!==1?'s':''} due on ${ds}.`);}else{announce('No tasks due on this date.');}}

function renderTeam(){const maxLoad=10;const canChange=settings.persona==='lead'||settings.persona==='manager';return`<section class="card" style="margin-bottom:20px" aria-label="Team workload"><h2 class="section-h">Team Availability</h2><ul style="list-style:none;padding:0;margin:0">${members.map(m=>{const open=tasks.filter(t=>t.assignee===m.name&&t.status!=='done').length;const pct=Math.min(100,Math.round((open/maxLoad)*100));const col=pct>=80?'var(--danger)':pct>=50?'var(--warn)':'var(--success)';return`<li style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)" aria-label="${esc(m.name)}: ${open} open tasks"><span style="font-weight:600;min-width:140px;font-size:.88rem">${esc(m.name)}</span><div class="avail-bar" style="flex:1" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${open} open tasks"><div class="avail-fill" style="width:${pct}%;background:${col}"></div></div><span style="font-size:.78rem;color:var(--muted);width:80px;text-align:right">${open} open</span></li>`;}).join('')}</ul></section><section class="card" aria-label="Team members"><h2 class="section-h">Team Members</h2><div class="tbl-wrap"><table aria-label="Team members"><thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Department</th><th scope="col">Email</th><th scope="col">Tasks</th><th scope="col">Actions</th></tr></thead><tbody>${members.length===0?`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px">No team members yet.</td></tr>`:members.map(m=>{const open=tasks.filter(t=>t.assignee===m.name&&t.status!=='done').length;const done=tasks.filter(t=>t.assignee===m.name&&t.status==='done').length;const isTester=m.role.toLowerCase().includes('tester');return`<tr><td><div style="display:flex;align-items:center;gap:8px"><div class="m-avatar-sm" aria-hidden="true">${initials(m.name)}</div><strong>${esc(m.name)}</strong></div></td><td>${esc(m.role)}</td><td>${esc(m.dept)||'—'}</td><td>${m.email?`<a href="mailto:${esc(m.email)}" aria-label="Email ${esc(m.name)}">${esc(m.email)}</a>`:'—'}</td><td aria-label="${open} open, ${done} done">${open} open · ${done} done</td><td><div class="act-btns">${canChange&&isTester?`<div class="row-menu-wrap"><button class="btn btn-secondary btn-sm" id="row-menu-btn-${m.id}" onclick="toggleRowMenu(event,${m.id})" aria-haspopup="true" aria-expanded="false" aria-label="Actions for ${esc(m.name)}"><span aria-hidden="true">⋮</span> Actions</button><ul class="row-menu" id="row-menu-${m.id}" role="menu" aria-labelledby="row-menu-btn-${m.id}" hidden><li role="none"><button role="menuitem" onclick="openChangeRole(${m.id})">Change Role</button></li></ul></div>`:''}<button class="btn btn-danger btn-sm" onclick="confirmDelete('member',${m.id},'${esc(m.name)}')" aria-label="Remove ${esc(m.name)}">Remove</button></div></td></tr>`;}).join('')}</tbody></table></div></section>`;}

function renderReports(){const total=tasks.length||1;const byS=allStatuses().map(s=>({l:s.name,c:tasks.filter(t=>t.status===s.id).length,col:s.color}));const byP=[{l:'High',c:tasks.filter(t=>t.priority==='high').length,col:'var(--danger)'},{l:'Medium',c:tasks.filter(t=>t.priority==='medium').length,col:'var(--warn)'},{l:'Low',c:tasks.filter(t=>t.priority==='low').length,col:'var(--success)'}];const byM=members.map(m=>{const mt=tasks.filter(t=>t.assignee===m.name);return{n:m.name,c:mt.length,d:mt.filter(t=>t.status==='done').length,h:mt.reduce((a,t)=>(t.timeLog||[]).reduce((b,e)=>b+e.hours,0)+a,0)};});const row=item=>{const p=Math.round((item.c/total)*100);return`<div class="rep-row"><span class="rep-lbl">${item.l}</span><div class="rep-bar"><div class="prog-wrap" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" aria-label="${item.l}: ${item.c}"><div class="prog-bar" style="width:${p}%;background:${item.col}"></div></div></div><span class="rep-pct" style="color:${item.col}">${item.c}</span></div>`;};return`<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px"><button class="btn btn-secondary btn-sm" onclick="openBatchTimeLog()" aria-haspopup="dialog"><span aria-hidden="true">⏱</span> Log Time</button><button class="btn btn-secondary btn-sm" onclick="exportCSV()"><span aria-hidden="true">📥</span> Export CSV</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px"><section class="card" aria-label="By status"><h2 class="section-h">By Status</h2>${byS.map(row).join('')}</section><section class="card" aria-label="By priority"><h2 class="section-h">By Priority</h2>${byP.map(row).join('')}</section></div><section class="card" aria-label="By team member"><h2 class="section-h">By Team Member</h2><div class="tbl-wrap" style="border:none;box-shadow:none"><table aria-label="Per member"><thead><tr><th scope="col">Name</th><th scope="col">Assigned</th><th scope="col">Done</th><th scope="col">Rate</th><th scope="col">Hours</th></tr></thead><tbody>${byM.map(m=>{const r=m.c?Math.round((m.d/m.c)*100):0;return`<tr><td><strong>${esc(m.n)}</strong></td><td>${m.c}</td><td>${m.d}</td><td><div style="display:flex;align-items:center;gap:7px"><div class="prog-wrap" role="progressbar" aria-valuenow="${r}" aria-valuemin="0" aria-valuemax="100" aria-label="${r}%" style="flex:1;min-width:60px"><div class="prog-bar" style="width:${r}%;background:var(--success)"></div></div><span style="font-size:.8rem;font-weight:700;color:var(--success)">${r}%</span></div></td><td><strong>${m.h.toFixed(1)}h</strong></td></tr>`;}).join('')}</tbody></table></div></section>`+renderTimeSummary();
}
function renderAudit(){const counts={pass:0,fail:0,review:0,na:0,notset:0};WCAG_CRITERIA.forEach(c=>{const r=auditResults[c.id];if(r?.status)counts[r.status]=(counts[r.status]||0)+1;else counts.notset++;});const _byStatus=auditFilter==='all'?WCAG_CRITERIA:auditFilter==='notset'?WCAG_CRITERIA.filter(c=>!auditResults[c.id]?.status):WCAG_CRITERIA.filter(c=>auditResults[c.id]?.status===auditFilter);const filtered=auditSearch?_byStatus.filter(c=>c.id.includes(auditSearch)||c.name.toLowerCase().includes(auditSearch.toLowerCase())):_byStatus;return`<div class="audit-summary" role="list" aria-label="Audit summary">${[['Pass',counts.pass,'var(--success)'],['Fail',counts.fail,'var(--danger)'],['Review',counts.review,'var(--warn)'],['N/A',counts.na,'var(--muted)'],['Not Set',counts.notset,'var(--border)']].map(([l,v,c])=>`<div class="audit-summary-card" role="listitem" aria-label="${l}: ${v}"><div class="audit-sum-num" style="color:${c}">${v}</div><div class="audit-sum-lbl">${l}</div></div>`).join('')}</div><div class="audit-filter-bar"><label for="audit-search" class="sr-only">Search criteria</label><input id="audit-search" class="form-input" type="search" placeholder="Search by ID or name…" value="${esc(auditSearch)}" style="width:200px" oninput="auditSearch=this.value;document.getElementById('main-content').innerHTML=renderAudit()" aria-label="Search WCAG criteria"/>${[['all','All'],['pass','Pass'],['fail','Fail'],['review','Review'],['na','N/A'],['notset','Not Set']].map(([v,l])=>`<button class="btn btn-sm ${auditFilter===v?'btn-primary':'btn-secondary'}" onclick="auditFilter='${v}';document.getElementById('main-content').innerHTML=renderAudit()" aria-pressed="${auditFilter===v?'true':'false'}">${l}</button>`).join('')}<label for="audit-bulk-sel" class="sr-only">Mark all unset criteria as</label><select id="audit-bulk-sel" class="form-select" style="width:auto" aria-label="Mark all unset criteria as"><option value="">— Mark unset as… —</option><option value="pass">Pass</option><option value="fail">Fail</option><option value="review">Review</option><option value="na">N/A</option></select><button class="btn btn-secondary btn-sm" onclick="bulkMarkAudit(document.getElementById('audit-bulk-sel').value)">Apply to Unset</button><button class="btn btn-secondary btn-sm" onclick="exportAuditCSV()"><span aria-hidden="true">📥</span> Export CSV</button><button class="btn btn-secondary btn-sm" onclick="exportAuditReport()"><span aria-hidden="true">🖨️</span> Print Report</button><span aria-live="polite" style="font-size:.82rem;color:var(--muted)">${filtered.length} criteria</span></div><section class="card" aria-label="WCAG 2.2 criteria"><p class="sr-only">Select Pass, Fail, Review, or N/A for each criterion and add optional notes.</p>${filtered.map(c=>{const r=auditResults[c.id]||{};return`<div class="audit-criterion"><div class="audit-crit-header"><span class="audit-crit-id">${c.id}</span><span class="audit-crit-name">${esc(c.name)}</span><span class="audit-crit-level">Level ${c.level}</span>${r.status?`<span class="badge badge-${r.status==='pass'?'pass':r.status==='fail'?'fail':r.status==='na'?'na':'review'}">${r.status==='pass'?'Pass':r.status==='fail'?'Fail':r.status==='na'?'N/A':'Review'}</span>`:''}</div><p class="audit-crit-desc">${esc(c.desc)}</p><div class="audit-controls" role="group" aria-label="Result for ${c.id}">${['pass','fail','review','na'].map(s=>`<button class="audit-status-btn${r.status===s?' active-'+s:''}" onclick="setAuditStatus('${c.id}','${s}')" aria-pressed="${r.status===s?'true':'false'}">${s==='pass'?'✅ Pass':s==='fail'?'❌ Fail':s==='review'?'⚠️ Review':'— N/A'}</button>`).join('')}<label for="note-${c.id.replace('.','_')}" class="sr-only">Notes for ${c.id}</label><input class="audit-note-input" type="text" id="note-${c.id.replace('.','_')}" value="${esc(r.note||'')}" placeholder="Notes…" onchange="setAuditNote('${c.id}',this.value)" aria-label="Notes for ${c.id}"/></div></div>`;}).join('')}</section>`;}
function exportAuditReport(){
  const counts={pass:0,fail:0,review:0,na:0,notset:0};
  WCAG_CRITERIA.forEach(c=>{const r=auditResults[c.id];if(r?.status)counts[r.status]=(counts[r.status]||0)+1;else counts.notset++;});
  const date=today.toLocaleDateString(settings.language,{year:'numeric',month:'long',day:'numeric'});
  const passRate=WCAG_CRITERIA.length?Math.round((counts.pass/WCAG_CRITERIA.length)*100):0;
  const rows=WCAG_CRITERIA.map(c=>{
    const r=auditResults[c.id]||{};
    const s=r.status||'notset';
    const badge=s==='pass'?'✅ Pass':s==='fail'?'❌ Fail':s==='review'?'⚠️ Review':s==='na'?'— N/A':'• Not Set';
    const noteCell=r.note?r.note.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'):'';
    return`<tr><td>${c.id}</td><td>${c.name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td><td>Level ${c.level}</td><td class="s-${s}">${badge}</td><td>${noteCell}</td></tr>`;
  }).join('');
  const html=`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>WCAG 2.2 Audit Report — ${date}</title><style>
*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;max-width:1000px;margin:0 auto;padding:24px;color:#111;font-size:14px}
h1{font-size:1.3rem;margin:0 0 4px}p.meta{color:#666;font-size:.82rem;margin:0 0 20px}
.summary{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px}
.sc{border:1px solid #ccc;border-radius:6px;padding:12px 18px;text-align:center;min-width:80px}
.sc-n{font-size:1.5rem;font-weight:700}.sc-l{font-size:.72rem;color:#666;margin-top:3px}
table{width:100%;border-collapse:collapse;font-size:.82rem}th{background:#f2f2f2;text-align:left;padding:7px 9px;border:1px solid #ccc}
td{padding:6px 9px;border:1px solid #ddd;vertical-align:top}tr:nth-child(even) td{background:#fafafa}
.s-pass{color:#0A6B3C;font-weight:600}.s-fail{color:#b91c1c;font-weight:600}
.s-review{color:#7A4700;font-weight:600}.s-na{color:#666}.s-notset{color:#aaa}
.no-print{margin-bottom:16px}
@media print{.no-print{display:none}body{max-width:none;padding:10px}}
</style></head><body>
<div class="no-print"><button onclick="window.print()" style="padding:8px 18px;background:#1547C8;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:.88rem;font-weight:600">Print / Save as PDF</button></div>
<h1>WCAG 2.2 Audit Report</h1><p class="meta">Generated ${date} &nbsp;·&nbsp; Pass rate: ${passRate}% (${counts.pass} of ${WCAG_CRITERIA.length} criteria)</p>
<div class="summary">
<div class="sc"><div class="sc-n" style="color:#0A6B3C">${counts.pass}</div><div class="sc-l">Pass</div></div>
<div class="sc"><div class="sc-n" style="color:#b91c1c">${counts.fail}</div><div class="sc-l">Fail</div></div>
<div class="sc"><div class="sc-n" style="color:#7A4700">${counts.review||0}</div><div class="sc-l">Review</div></div>
<div class="sc"><div class="sc-n" style="color:#666">${counts.na||0}</div><div class="sc-l">N/A</div></div>
<div class="sc"><div class="sc-n" style="color:#aaa">${counts.notset}</div><div class="sc-l">Not Set</div></div>
</div>
<table><thead><tr><th>ID</th><th>Criterion</th><th>Level</th><th>Result</th><th>Notes</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
  const win=window.open('','_blank');
  if(win){win.document.write(html);win.document.close();announce('Report opened in new window. Use Print to save as PDF.');}
  else{toast('Pop-up blocked — allow pop-ups and try again.','error');announce('Pop-up was blocked.');}
}
function setAuditStatus(id,status){if(!auditResults[id])auditResults[id]={};auditResults[id].status=status;document.getElementById('main-content').innerHTML=renderAudit();announce(`${id} marked ${status}.`);scheduleLocalSave();}
function setAuditNote(id,note){if(!auditResults[id])auditResults[id]={};auditResults[id].note=note;scheduleLocalSave();}
function bulkMarkAudit(status){if(!status){announce('Select a status to apply.');return;}const unset=WCAG_CRITERIA.filter(c=>!auditResults[c.id]?.status);if(!unset.length){announce('No unset criteria to mark.');toast('All criteria already have a status.');return;}unset.forEach(c=>{if(!auditResults[c.id])auditResults[c.id]={};auditResults[c.id].status=status;});scheduleLocalSave();document.getElementById('main-content').innerHTML=renderAudit();const label=status==='pass'?'Pass':status==='fail'?'Fail':status==='review'?'Review':'N/A';announce(`${unset.length} unset criteria marked ${label}.`);toast(`${unset.length} criteria marked ${label}.`,'success');}
function exportAuditCSV(){const headers=['ID','Name','Level','Status','Notes'];const rows=WCAG_CRITERIA.map(c=>{const r=auditResults[c.id]||{};return[c.id,c.name,c.level,r.status||'not set',r.note||''];});const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`wcag-audit-${today.toISOString().split('T')[0]}.csv`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);announce('Audit exported.');toast('Audit exported.','success');}

function renderActivity(){const sorted=[...activityLog].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));if(!sorted.length)return`<section class="card"><h2 class="section-h">Activity Log</h2><p style="color:var(--muted)">No activity yet.</p></section>`;return`<section class="card" aria-label="Activity log — ${sorted.length} entries"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px"><h2 class="section-h" style="margin-bottom:0;border:none">Activity Log</h2><span style="font-size:.8rem;color:var(--muted)" aria-hidden="true">${sorted.length} entr${sorted.length===1?'y':'ies'}</span></div><p class="sr-only">Each item shows a timestamp and description. Use arrow keys to navigate.</p><ul class="activity-list" role="list" aria-label="Activity, most recent first">${sorted.map(a=>{const dt=new Date(a.timestamp);const dateStr=dt.toLocaleDateString(settings.language,{month:'short',day:'numeric',year:'numeric'});const timeStr=dt.toLocaleTimeString(settings.language,{hour:'2-digit',minute:'2-digit'});return`<li class="activity-entry" tabindex="0" aria-label="${dateStr} at ${timeStr}. ${esc(a.text)}"><div class="activity-icon" aria-hidden="true">${a.icon||'📋'}</div><div><span class="activity-time">${dateStr} at ${timeStr}</span><span class="activity-text">${esc(a.text)}</span></div></li>`;}).join('')}</ul></section>`;}
function logActivity(text,icon='📋',sessionType='update'){
  const entry={timestamp:new Date().toISOString(),text,icon};
  activityLog.push(entry);
  if(activityLog.length>500)activityLog=activityLog.slice(-500);
  sessionLog.push({type:sessionType,text,timestamp:entry.timestamp});
  scheduleLocalSave();
}

function renderOnboarding(){
  const personaLabel={tester:'Accessibility Tester',lead:'Project Lead',manager:'Project Manager',blank:'Blank Slate'}[settings.persona]||null;
  const canChangeRole=!!settings.persona;
  const setupSection=canChangeRole?`<section class="card" style="margin-bottom:20px" aria-labelledby="persona-h2"><h2 id="persona-h2" style="font-size:1rem;font-weight:700;margin-bottom:6px"><span aria-hidden="true">🚀</span> Quick Setup</h2><p style="font-size:.84rem;color:var(--muted);margin-bottom:14px;line-height:1.6">${personaLabel?`Currently set up as <strong>${esc(personaLabel)}</strong>. Select a different role below to reseed sample data.`:'Choose your role to pre-populate VantagePM with realistic sample data — projects, tasks, team members, and saved filter presets.'}</p><fieldset style="border:none;padding:0;margin:0 0 14px"><legend style="font-size:.88rem;font-weight:700;margin-bottom:10px;display:block">Select a role</legend><div class="setup-role-grid"><label class="setup-role-option"><span class="setup-role-radio-row"><input type="radio" name="onboard-role" value="tester"${settings.persona==='tester'?' checked':''}/><span class="setup-role-name">Accessibility Tester</span></span><span class="setup-role-desc">Solo auditor running WCAG tests. Gets one audit project, five test tasks, two templates, and two saved filter presets.</span></label><label class="setup-role-option"><span class="setup-role-radio-row"><input type="radio" name="onboard-role" value="lead"${settings.persona==='lead'?' checked':''}/><span class="setup-role-name">Project Lead</span></span><span class="setup-role-desc">Leading a small remediation team. Gets four team members, two projects, distributed tasks, milestones, and saved filter presets.</span></label><label class="setup-role-option"><span class="setup-role-radio-row"><input type="radio" name="onboard-role" value="manager"${settings.persona==='manager'?' checked':''}/><span class="setup-role-name">Project Manager</span></span><span class="setup-role-desc">Managing multiple accessibility programs. Gets five team members, three projects, time logs, milestones, and four saved filter presets.</span></label><label class="setup-role-option"><span class="setup-role-radio-row"><input type="radio" name="onboard-role" value="blank"${settings.persona==='blank'?' checked':''}/><span class="setup-role-name">Blank Slate</span></span><span class="setup-role-desc">No sample data. Start fresh and build your workspace from scratch at your own pace.</span></label></div></fieldset><button class="btn btn-primary btn-sm" onclick="applyOnboardingPersona()"><span aria-hidden="true">🔁</span> Apply Setup</button></section>`:'';
  const steps=[
    {num:1,title:'Welcome to VantagePM',desc:'VantagePM is a WCAG 2.2 AA compliant project management app built for digital accessibility professionals. Whether you work independently or within an organization, VantagePM helps you manage accessibility projects, audits, and team tasks across any company or client.',srHint:`<strong>NVDA:</strong> Press NVDA+Space to switch between Browse and Focus Mode. Use Tab to move between controls.<br><strong>JAWS:</strong> Press Insert+Z to toggle Virtual PC Cursor.<br><strong>VoiceOver:</strong> Use VO+Arrow keys to navigate, VO+Space to activate.`,action:null},
    {num:2,title:'Set up your profile',desc:'Go to Settings → General and set your name as the Focus Mode User. This personalizes your Daily Briefing and Focus Mode to show your assigned tasks. You can update this anytime as your role or team changes. Remember to press Save Settings after making changes.',srHint:`Press <strong>Alt+Comma</strong> to open Settings. Every settings tab has a <strong>Save Settings</strong> button and a <strong>Cancel</strong> button at the bottom. Changes do not save until you press Save Settings.`,action:{label:'Open Settings',fn:"nav('settings')"}},
    {num:3,title:'Connect Google Drive',desc:'Go to Settings → Google Drive, sign in with your Google account, and choose the shared folder. All team members must use the same folder to share data.',srHint:`After signing in, your browser opens for Google authentication. Return to VantagePM when done. NVDA announces "Signed in" when complete. Drive sign-in saves immediately without needing the Save button.`,action:{label:'Open Drive Settings',fn:"nav('settings',null,'drive')"}},
    {num:4,title:'Keyboard shortcuts',desc:'VantagePM has fully customizable keyboard shortcuts. Press Alt+K anytime to see all shortcuts. Change any shortcut in Settings → Shortcuts if it conflicts with JAWS or NVDA.',srHint:`Key shortcuts:<br><strong>Alt+B</strong> — Daily Briefing<br><strong>Alt+N</strong> — New Task<br><strong>Alt+G</strong> — Focus Mode<br><strong>Alt+/</strong> — Global Search<br><strong>Alt+K</strong> — Shortcuts Reference<br><strong>Escape</strong> — Close dialog`,action:{label:'View Shortcuts',fn:'showShortcutsModal()'}},
    {num:5,title:'Add your first task',desc:'Press Alt+N or click Add Task. Tasks can be tied to any project. Set a project, priority, status, due date, color label, and recurring schedule. Pin important tasks to always keep them at the top of your list. Use Save as Template to reuse common task structures.',srHint:`The task dialog has five tabs: Details, Time, Comments, Attachments, Dependencies. Tab between the tab buttons and press Enter to switch. NVDA announces the active tab. Use the pin button (📍) in the Tasks view to pin a task to the top.`,action:{label:'Add a Task',fn:'openAddTask()'}},
    {num:6,title:'Task templates, bulk actions, and filter presets',desc:'Save task structures as templates from the task dialog. Select multiple tasks with checkboxes to bulk-update status or assignee. In the Tasks view, set your filters and click Save Preset to name that combination — you can reload it instantly from the preset bar at the top of the task list.',srHint:`Checkboxes in the task table are keyboard accessible. Tab to a checkbox and press Space to select. The bulk action bar appears at the top when tasks are selected. Import tasks from any CSV with the Import CSV button in the Tasks view.`,action:{label:'View Templates',fn:"nav('templates')"}},
    {num:7,title:'Daily Briefing',desc:'Press Alt+B at any time to hear a spoken summary of your day — overdue tasks, what is due today, and what is in progress.',srHint:`The briefing uses <strong>aria-live</strong> for NVDA and JAWS, and <strong>Web Speech API</strong> for spoken audio. Press "Read Again" in the briefing dialog to repeat it. The briefing personalizes to whoever is set as the Focus Mode User in Settings.`,action:{label:'Try Daily Briefing',fn:'dailyBriefing()'}}
  ];
  return`<div style="max-width:700px">${setupSection}<div class="card" style="margin-bottom:20px;background:color-mix(in srgb,var(--accent) 8%,var(--surface));border-color:var(--accent)"><h2 style="font-size:1.1rem;font-weight:700;color:var(--accent);margin-bottom:8px"><span aria-hidden="true">👋</span> Setup Guide</h2><p style="font-size:.88rem;color:var(--muted);line-height:1.6">Step-by-step guidance for setting up VantagePM with a screen reader. Each step includes specific tips for NVDA, JAWS, and VoiceOver.</p></div>${steps.map(s=>`<div class="onboard-step" aria-label="Step ${s.num}: ${s.title}"><div class="onboard-step-header"><div class="onboard-num" aria-hidden="true">${s.num}</div><h2 class="onboard-title">${esc(s.title)}</h2></div><p class="onboard-desc">${esc(s.desc)}</p><div class="sr-hint-box" role="note" aria-label="Screen reader guidance for step ${s.num}"><strong>Screen reader tip:</strong><br>${s.srHint}</div>${s.action?`<div style="margin-top:12px"><button class="btn btn-primary btn-sm" onclick="${s.action.fn}" aria-label="${esc(s.action.label)}">${esc(s.action.label)}</button></div>`:''}</div>`).join('')}</div>`;
}
function populateStatusSelect(){const el=document.getElementById('t-status');if(!el)return;const cur=el.value;el.innerHTML=allStatuses().map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');if(cur)el.value=cur;}
function populateProjectSelect(selId){document.getElementById('t-project').innerHTML='<option value="">— No project —</option>'+projects.map(p=>`<option value="${p.id}" ${p.id===selId?'selected':''}>${esc(p.name)}</option>`).join('');}
function populateAssigneeSelect(sel){document.getElementById('t-assignee').innerHTML=members.map(m=>`<option value="${esc(m.name)}" ${m.name===sel?'selected':''}>${esc(m.name)}</option>`).join('');}

function switchTab(tab){['details','time','comments','attachments','dependencies'].forEach(t=>{document.getElementById('tab-'+t).hidden=t!==tab;document.getElementById('tbtn-'+t).setAttribute('aria-selected',t===tab?'true':'false');});if(tab==='time')renderTimeLog();if(tab==='comments')renderComments();if(tab==='attachments')renderAttachments();if(tab==='dependencies')renderDependencies();announce(tab+' tab selected.');}

function renderTimeLog(){const list=document.getElementById('time-log-list'),totalEl=document.getElementById('total-hours-display');if(!list)return;const sum=currentTaskTimeLog.reduce((a,e)=>a+e.hours,0);if(totalEl)totalEl.textContent=sum.toFixed(1);if(!currentTaskTimeLog.length){list.innerHTML='<p style="color:var(--muted);font-size:.84rem">No time logged yet.</p>';return;}list.innerHTML=`<ul style="list-style:none;padding:0;margin:0 0 10px">${currentTaskTimeLog.map((e,i)=>`<li class="time-log-item" aria-label="${e.person}, ${e.hours} hours"><span style="font-weight:600;min-width:80px">${esc(e.person)}</span><span class="badge badge-todo">${e.hours}h</span><span style="flex:1;color:var(--muted)">${esc(e.note||'')}</span><span style="font-size:.74rem;color:var(--muted)">${new Date(e.date).toLocaleDateString()}</span><button class="btn btn-danger btn-sm" onclick="removeTimeLog(${i})" aria-label="Remove entry by ${esc(e.person)}">✕</button></li>`).join('')}</ul>`;}
function addTimeLog(){const person=document.getElementById('tl-person').value.trim(),hours=parseFloat(document.getElementById('tl-hours').value);if(!person||isNaN(hours)||hours<=0){announce('Enter a name and valid hours.');return;}currentTaskTimeLog.push({person,hours,note:document.getElementById('tl-note').value.trim(),date:new Date().toISOString()});document.getElementById('tl-hours').value='';document.getElementById('tl-note').value='';renderTimeLog();announce(`${hours} hours logged.`);}
function removeTimeLog(i){currentTaskTimeLog.splice(i,1);renderTimeLog();announce('Entry removed.');}

function renderComments(){const list=document.getElementById('comment-list');if(!list)return;if(!currentTaskComments.length){list.innerHTML='<p style="color:var(--muted);font-size:.84rem">No comments yet.</p>';return;}list.innerHTML=`<ul style="list-style:none;padding:0;margin:0">${currentTaskComments.map((c,i)=>`<li style="background:var(--surface2);border-radius:var(--radius);padding:10px;margin-bottom:8px" aria-label="Comment by ${esc(c.author)}"><div style="display:flex;justify-content:space-between;font-size:.76rem;margin-bottom:5px"><strong style="color:var(--accent)">${esc(c.author)}</strong><span>${new Date(c.timestamp).toLocaleDateString()}</span></div><p style="font-size:.85rem;margin-bottom:6px">${esc(c.text)}</p><button class="btn btn-danger btn-sm" onclick="removeComment(${i})" aria-label="Delete comment">Delete</button></li>`).join('')}</ul>`;}
function addComment(){const author=document.getElementById('comment-author').value.trim(),text=document.getElementById('comment-text').value.trim();if(!author||!text){announce('Enter your name and a comment.');return;}currentTaskComments.push({author,text,timestamp:new Date().toISOString()});document.getElementById('comment-text').value='';renderComments();announce('Comment added.');}
function removeComment(i){currentTaskComments.splice(i,1);renderComments();announce('Comment deleted.');}

function renderAttachments(){const list=document.getElementById('attach-list');if(!list)return;if(!currentTaskAttachments.length){list.innerHTML='<p style="color:var(--muted);font-size:.84rem">No attachments yet.</p>';return;}list.innerHTML=`<ul style="list-style:none;padding:0;margin:0 0 10px">${currentTaskAttachments.map((a,i)=>`<li style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--surface2);border-radius:6px;margin-bottom:6px" aria-label="Attachment: ${esc(a.name)}"><span aria-hidden="true">📎</span><span style="flex:1;font-weight:600">${esc(a.name)}</span><a href="${esc(a.url)}" target="_blank" aria-label="Open ${esc(a.name)}" style="color:var(--accent);font-size:.8rem">Open</a><button class="btn btn-danger btn-sm" onclick="removeAttachment(${i})" aria-label="Remove ${esc(a.name)}">✕</button></li>`).join('')}</ul>`;}
function addAttachment(){const name=document.getElementById('attach-name').value.trim(),url=document.getElementById('attach-url').value.trim();if(!name||!url){announce('Enter name and URL.');return;}currentTaskAttachments.push({name,url});document.getElementById('attach-name').value='';document.getElementById('attach-url').value='';renderAttachments();announce('Attachment added.');}
function removeAttachment(i){currentTaskAttachments.splice(i,1);renderAttachments();announce('Attachment removed.');}

function renderDependencies(){const list=document.getElementById('dep-list'),sel=document.getElementById('dep-select');if(!list||!sel)return;const available=tasks.filter(t=>t.id!==editingTaskId&&!currentTaskDependencies.includes(t.id));sel.innerHTML=available.length?available.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join(''):'<option disabled>No tasks available</option>';if(!currentTaskDependencies.length){list.innerHTML='<p style="color:var(--muted);font-size:.84rem">No dependencies.</p>';return;}list.innerHTML=`<ul style="list-style:none;padding:0;margin:0 0 10px">${currentTaskDependencies.map(id=>{const dep=tasks.find(t=>t.id===id);if(!dep)return'';return`<li style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface2);border-radius:6px;margin-bottom:6px" aria-label="Blocked by ${esc(dep.name)}"><span aria-hidden="true">${dep.status==='done'?'✅':'🔒'}</span><span style="flex:1">${esc(dep.name)} ${sBadge(dep.status)}</span><button class="btn btn-danger btn-sm" onclick="removeDependency(${id})" aria-label="Remove dependency on ${esc(dep.name)}">✕</button></li>`;}).join('')}</ul>`;}
function addDependency(){const sel=document.getElementById('dep-select');if(!sel||!sel.value)return;const id=parseInt(sel.value);if(!currentTaskDependencies.includes(id))currentTaskDependencies.push(id);renderDependencies();announce('Dependency added.');}
function removeDependency(id){currentTaskDependencies=currentTaskDependencies.filter(d=>d!==id);renderDependencies();announce('Dependency removed.');}



function saveTask(){const name=document.getElementById('t-name').value.trim(),due=getResolvedDate('t-due');let ok=true;if(!name){document.getElementById('t-name-err').classList.remove('hidden');ok=false;}else document.getElementById('t-name-err').classList.add('hidden');if(!due){document.getElementById('t-due-err').classList.remove('hidden');ok=false;}else document.getElementById('t-due-err').classList.add('hidden');if(!ok){announce('Please fix the form errors.');return;}const pv=document.getElementById('t-project').value;const taskData={name,desc:document.getElementById('t-desc').value.trim(),assignee:document.getElementById('t-assignee').value,priority:document.getElementById('t-priority').value,status:document.getElementById('t-status').value,due,progress:parseInt(document.getElementById('t-prog').value),projectId:pv?parseInt(pv):null,recur:document.getElementById('t-recur').value,colorLabel:document.getElementById('t-color').value,comments:currentTaskComments,attachments:currentTaskAttachments,dependencies:currentTaskDependencies,timeLog:currentTaskTimeLog};if(editingTaskId){const i=tasks.findIndex(t=>t.id===editingTaskId);tasks[i]={...tasks[i],...taskData};logActivity(`${taskData.assignee} updated "${taskData.name}"`,'✏️','update');}else{tasks.push({id:nextTaskId++,...taskData});logActivity(`${taskData.assignee} created "${taskData.name}"`,'✅','create');}if(taskData.status==='done'&&taskData.recur&&taskData.recur!=='none'){const nd=new Date(taskData.due+'T00:00');if(taskData.recur==='daily')nd.setDate(nd.getDate()+1);else if(taskData.recur==='weekly')nd.setDate(nd.getDate()+7);else nd.setMonth(nd.getMonth()+1);tasks.push({id:nextTaskId++,...taskData,status:'todo',progress:0,due:nd.toISOString().split('T')[0],comments:[],timeLog:[]});announce(`Recurring task scheduled for ${fmtDate(nd.toISOString().split('T')[0])}.`);}closeModal('task-modal');if(currentView!=='settings')nav(currentView,document.querySelector(`[data-view=${currentView}]`));announce('Task saved.');toast('Task saved.','success');if(settings.autoSync&&settings.googleConnected&&settings.driveFolderId)syncDrive();}

function openAddMember(){openModalEl('member-modal');}
function saveMember(){const name=document.getElementById('m-name').value.trim(),email=document.getElementById('m-email').value.trim(),role=document.getElementById('m-role').value.trim();if(!name||!email||!role){announce('Fill in name, email, and role.');return;}members.push({id:nextMemberId++,name,email,role,dept:document.getElementById('m-dept').value.trim(),photo:document.getElementById('m-photo').value.trim()});logActivity(`Member "${name}" added`,'👤');closeModal('member-modal');nav('team',document.querySelector('[data-view=team]'));announce('Member added.');toast('Member added.','success');}

function confirmDelete(type,id,name){if(!settings.confirmOnDelete){doDelete(type,id,name);return;}document.getElementById('cf-title').textContent='Delete '+(type==='task'?'Task':type==='project'?'Project':type==='milestone'?'Milestone':'Member');document.getElementById('cf-desc').textContent=`Delete "${name}"? This cannot be undone.`;document.getElementById('cf-ok').onclick=()=>{doDelete(type,id,name);closeModal('confirm-modal');};openModalEl('confirm-modal');}
function doDelete(type,id,name){
  let snap=null;
  if(type==='task'){snap={type,data:tasks.find(t=>t.id===id)};tasks=tasks.filter(t=>t.id!==id);logActivity(`Task "${name}" deleted`,'🗑️');announce('Task deleted.');}
  else if(type==='project'){snap={type,data:projects.find(p=>p.id===id),related:tasks.filter(t=>t.projectId===id)};projects=projects.filter(p=>p.id!==id);logActivity(`Project "${name}" deleted`,'🗑️');announce('Project deleted.');}
  else if(type==='milestone'){snap={type,data:milestones.find(m=>m.id===id)};milestones=milestones.filter(m=>m.id!==id);logActivity(`Milestone "${name}" deleted`,'🗑️');announce('Milestone deleted.');}
  else{snap={type:'member',data:members.find(m=>m.id===id)};members=members.filter(m=>m.id!==id);logActivity(`Member "${name}" removed`,'👤');announce('Member removed.');}
  if(snap)undoStack.push(snap);
  scheduleLocalSave();
  if(currentView!=='settings')nav(currentView,document.querySelector(`[data-view=${currentView}]`));
  toast('Deleted.','',{label:'Undo',fn:undoLast});
}
function undoLast(){
  const snap=undoStack.pop();if(!snap)return;
  if(snap.type==='task')tasks.push(snap.data);
  else if(snap.type==='project'){projects.push(snap.data);if(snap.related)tasks.push(...snap.related);}
  else if(snap.type==='milestone')milestones.push(snap.data);
  else if(snap.type==='member')members.push(snap.data);
  else if(snap.type==='bulk-tasks')tasks.push(...snap.data);
  scheduleLocalSave();
  nav(currentView,document.querySelector(`[data-view=${currentView}]`));
  announce('Undo complete.');
  toast('Restored.','success');
}

function openModalEl(id){modalFocusReturn=document.activeElement;const el=document.getElementById(id);el.removeAttribute('hidden');modalStack.push(id);requestAnimationFrame(()=>{const first=el.querySelector('input:not([type=hidden]),select,textarea,button,[tabindex]');if(first)first.focus();});el.addEventListener('keydown',trapFocus);const title=el.querySelector('.modal-title')?.textContent;if(title)announce(title+' dialog opened.');}
function closeModal(id){const el=document.getElementById(id);el.setAttribute('hidden','');el.removeEventListener('keydown',trapFocus);modalStack=modalStack.filter(m=>m!==id);if(modalFocusReturn&&document.body.contains(modalFocusReturn))modalFocusReturn.focus();announce('Dialog closed.');}
function closeTopModal(){if([...document.querySelectorAll('.row-menu')].some(m=>!m.hidden)){closeAllRowMenus();return;}if(!modalStack.length)return;const top=modalStack[modalStack.length-1];if(top==='setup-modal'){announce('Please complete setup to continue.');return;}closeModal(top);}
function trapFocus(e){if(e.key!=='Tab')return;const modal=e.currentTarget.querySelector('.modal');if(!modal)return;const els=[...modal.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&el.offsetParent!==null);if(!els.length)return;const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
const SHORTCUT_LABELS={newTask:'New Task',quickCapture:'Quick Capture',sessionSummary:'Session Summary',goToDashboard:'Dashboard',goToTasks:'Tasks',goToCalendar:'Calendar',goToTeam:'Team',goToReports:'Reports',goToSettings:'Settings',saveItem:'Save Item',closeModal:'Close Modal',searchTasks:'Search Tasks',syncDrive:'Sync Drive',toggleTheme:'Toggle Theme',focusNav:'Focus Navigation',focusMain:'Focus Main',dailyBriefing:'Daily Briefing',focusMode:'Focus Mode',exportCSV:'Export CSV',globalSearch:'Global Search',quickShortcuts:'Shortcuts Reference'};
const SHORTCUT_SR_NOTES={closeModal:'⚠️ Escape exits JAWS/NVDA virtual mode.',focusNav:'⚠️ Alt+M may conflict with JAWS.',focusMain:'⚠️ Alt+C may conflict with NVDA.'};

function renderSettings(){return`<div class="settings-layout"><nav class="settings-nav" aria-label="Settings categories">${[['general','<span aria-hidden="true">⚙️</span> General'],['appearance','<span aria-hidden="true">🎨</span> Appearance'],['accessibility','<span aria-hidden="true">♿</span> Accessibility'],['drive','<span aria-hidden="true">☁️</span> Google Drive'],['shortcuts','<span aria-hidden="true">⌨️</span> Shortcuts'],['statuses','<span aria-hidden="true">🏷️</span> Statuses'],['notifications','<span aria-hidden="true">🔔</span> Notifications'],['about','<span aria-hidden="true">ℹ️</span> About']].map(([k,l])=>`<button class="settings-nav-btn${activeSettingsTab===k?' active':''}${settingsHasChanges&&activeSettingsTab===k?' has-changes':''}" onclick="switchSettingsTab('${k}')" aria-current="${activeSettingsTab===k?'true':'false'}">${l}</button>`).join('')}</nav><div class="settings-panel" id="settings-panel"><div class="settings-panel-body" id="settings-panel-body">${renderSettingsTab(activeSettingsTab)}</div><div class="settings-save-bar" id="settings-save-bar" role="region" aria-live="polite" aria-label="Settings save controls"><div style="display:flex;justify-content:space-between;align-items:center;width:100%"><div class="settings-unsaved-label" id="settings-save-label">${settingsHasChanges?'<span aria-hidden="true">⚠️</span> Unsaved changes — press Save Settings to apply.':'No unsaved changes.'}</div><div style="display:flex;gap:10px;align-items:center"><button class="btn btn-secondary settings-change-btn" onclick="cancelSettings()" aria-label="Cancel and revert changes" ${settingsHasChanges?'':'disabled'}>Cancel</button><button class="btn btn-primary settings-change-btn" onclick="saveSettings()" aria-label="Save settings" ${settingsHasChanges?'':'disabled'}>Save Settings</button><button class="btn btn-secondary" onclick="navWithCheck('dashboard')" aria-label="Close settings and return to dashboard">Close Settings</button></div></div></div></div></div>`;}

function switchSettingsTab(tab){if(settingsHasChanges&&tab!==activeSettingsTab){pendingNavTarget={settingsTab:tab};openModalEl('unsaved-modal');return;}activeSettingsTab=tab;settingsSnapshot=JSON.parse(JSON.stringify(settings));document.querySelectorAll('.settings-nav-btn').forEach(b=>{const a=b.getAttribute('onclick')?.includes(`'${tab}'`);b.classList.toggle('active',a);b.setAttribute('aria-current',a?'true':'false');});const body=document.getElementById('settings-panel-body');if(body)body.innerHTML=renderSettingsTab(tab);updateSaveBar();announce(tab+' settings loaded. Make changes, then press Save Settings at the bottom.');}
function showSettingsTab(tab){switchSettingsTab(tab);}
function updateSaveBar(){const bar=document.getElementById('settings-save-bar');if(!bar)return;const lbl=document.getElementById('settings-save-label');if(lbl)lbl.innerHTML=settingsHasChanges?'<span aria-hidden="true">⚠️</span> Unsaved changes — press Save Settings to apply.':'No unsaved changes.';bar.querySelectorAll('.settings-change-btn').forEach(b=>b.disabled=!settingsHasChanges);document.querySelectorAll('.settings-nav-btn').forEach(b=>{const a=b.getAttribute('onclick')?.includes(`'${activeSettingsTab}'`);b.classList.toggle('has-changes',a&&settingsHasChanges);});if(settingsHasChanges)announce('Settings changed. Press Save Settings to apply, or Cancel to revert.');}
function setPending(key,value){pendingSettings[key]=value;settings[key]=value;settingsHasChanges=true;applySettings(settings);updateSaveBar();}
function setPendingShortcuts(sc){pendingSettings.shortcuts=sc;settings.shortcuts=sc;settingsHasChanges=true;updateSaveBar();}
async function saveSettings(){if(IS_ELECTRON){const updated=await window.electronAPI.saveSettings(pendingSettings);Object.assign(settings,updated);}settingsHasChanges=false;pendingSettings={};settingsSnapshot=JSON.parse(JSON.stringify(settings));updateSaveBar();announce('Settings saved.');toast('Settings saved.','success');logActivity('Settings updated','⚙️');}
function cancelSettings(){Object.assign(settings,settingsSnapshot);applySettings(settings);settingsHasChanges=false;pendingSettings={};const body=document.getElementById('settings-panel-body');if(body)body.innerHTML=renderSettingsTab(activeSettingsTab);updateSaveBar();announce('Changes cancelled. Settings reverted.');toast('Changes cancelled.');}

function renderSettingsTab(tab){if(tab==='general')return renderGeneral();if(tab==='appearance')return renderAppearance();if(tab==='accessibility')return renderAccessibility();if(tab==='drive')return renderDrive();if(tab==='shortcuts')return renderShortcuts();if(tab==='statuses')return renderStatuses();if(tab==='notifications')return renderNotifications();if(tab==='about')return renderAbout();return '';}
function toggle(key,val,extra=''){return`<label class="toggle" aria-label="Toggle ${key}"><input type="checkbox" ${val?'checked':''} onchange="setPending('${key}',this.checked);${extra}" aria-label="${key}"/><span class="toggle-track" aria-hidden="true"></span><span class="toggle-thumb" aria-hidden="true"></span></label>`;}
async function saveSetting(key,value){settings[key]=value;if(IS_ELECTRON){const u=await window.electronAPI.saveSettings({[key]:value});Object.assign(settings,u);}}
const NOTICE=`<p style="font-size:.82rem;color:var(--muted);margin-bottom:16px;background:var(--warn-bg);border:1px solid var(--warn);border-radius:var(--radius);padding:10px 12px" role="note">Make your changes, then press <strong>Save Settings</strong> at the bottom. Press <strong>Cancel</strong> to revert.</p>`;
function renderGeneral(){return`<div><h2 class="settings-section-title">General</h2>${NOTICE}<div class="settings-row"><div><div class="settings-row-label">Language</div></div><div class="settings-row-control"><select class="form-select" style="width:160px" onchange="setPending('language',this.value)" aria-label="Language"><option value="en" ${settings.language==='en'?'selected':''}>English</option><option value="es" ${settings.language==='es'?'selected':''}>Español</option><option value="fr" ${settings.language==='fr'?'selected':''}>Français</option><option value="de" ${settings.language==='de'?'selected':''}>Deutsch</option></select></div></div><div class="settings-row"><div><div class="settings-row-label">Your Name</div><div class="settings-row-desc">Used in Focus Mode, Daily Briefing, and time logs. Enter your full name.</div></div><div class="settings-row-control"><input type="text" class="form-input" style="width:200px" value="${esc(settings.focusModeUser)}" onchange="setPending('focusModeUser',this.value.trim())" aria-label="Your name for Focus Mode and Daily Briefing" placeholder="e.g. Aaron Smith"/></div></div><div class="settings-row"><div><div class="settings-row-label">Date Format</div></div><div class="settings-row-control"><select class="form-select" style="width:160px" onchange="setPending('dateFormat',this.value)" aria-label="Date format"><option value="MM/DD/YYYY" ${settings.dateFormat==='MM/DD/YYYY'?'selected':''}>MM/DD/YYYY</option><option value="DD/MM/YYYY" ${settings.dateFormat==='DD/MM/YYYY'?'selected':''}>DD/MM/YYYY</option><option value="YYYY-MM-DD" ${settings.dateFormat==='YYYY-MM-DD'?'selected':''}>YYYY-MM-DD</option></select></div></div><div class="settings-row"><div><div class="settings-row-label">Confirm on Delete</div></div><div class="settings-row-control">${toggle('confirmOnDelete',settings.confirmOnDelete)}</div></div><div class="settings-row"><div><div class="settings-row-label">Auto-Sync with Drive</div></div><div class="settings-row-control">${toggle('autoSync',settings.autoSync)}</div></div><div class="settings-row"><div><div class="settings-row-label">Sync Interval</div></div><div class="settings-row-control"><select class="form-select" style="width:100px" onchange="setPending('syncInterval',parseInt(this.value))" aria-label="Sync interval">${[1,2,5,10,15,30].map(v=>`<option value="${v}" ${settings.syncInterval===v?'selected':''}>${v} min</option>`).join('')}</select></div></div><div class="settings-row"><div><div class="settings-row-label">Task Aging Threshold</div><div class="settings-row-desc">Flag stale tasks after this many days with no activity.</div></div><div class="settings-row-control"><select class="form-select" style="width:120px" onchange="setPending('agingThresholdDays',parseInt(this.value))" aria-label="Aging threshold">${[3,5,7,10,14].map(v=>`<option value="${v}" ${(settings.agingThresholdDays||5)===v?'selected':''}>${v} days</option>`).join('')}</select></div></div></div>`;}
function renderAppearance(){return`<div><h2 class="settings-section-title">Appearance</h2>${NOTICE}<div class="settings-row"><div><div class="settings-row-label">Theme</div><div class="settings-row-desc">System follows your OS automatically. Preview updates immediately.</div></div><div class="settings-row-control"><select class="form-select" style="width:150px" onchange="setPending('theme',this.value)" aria-label="Theme"><option value="system" ${settings.theme==='system'?'selected':''}>System default</option><option value="light" ${settings.theme==='light'?'selected':''}>Light</option><option value="dark" ${settings.theme==='dark'?'selected':''}>Dark</option></select></div></div><div class="settings-row"><div><div class="settings-row-label">Font Size</div><div class="settings-row-desc">Preview updates immediately. Default is 16px.</div></div><div class="settings-row-control" style="display:flex;align-items:center;gap:10px"><input type="range" min="12" max="24" step="1" value="${settings.fontSize}" style="width:120px;accent-color:var(--accent)" oninput="this.nextElementSibling.textContent=this.value+'px';setPending('fontSize',parseInt(this.value));document.documentElement.style.setProperty('--fs',this.value+'px')" aria-label="Font size" aria-valuemin="12" aria-valuemax="24" aria-valuenow="${settings.fontSize}"/><span aria-live="polite" style="font-size:.85rem;font-weight:600;min-width:40px">${settings.fontSize}px</span></div></div></div>`;}
function renderAccessibility(){return`<div><h2 class="settings-section-title">Accessibility</h2>${NOTICE}<div class="settings-row"><div><div class="settings-row-label">High Contrast Mode</div><div class="settings-row-desc">Black/white/gold for maximum contrast. Previews immediately.</div></div><div class="settings-row-control">${toggle('highContrast',settings.highContrast,"if(settings.highContrast)document.documentElement.setAttribute('data-contrast','');else document.documentElement.removeAttribute('data-contrast')")}</div></div><div class="settings-row"><div><div class="settings-row-label">Reduce Motion</div></div><div class="settings-row-control">${toggle('reduceMotion',settings.reduceMotion,"if(settings.reduceMotion)document.documentElement.setAttribute('data-reduce-motion','');else document.documentElement.removeAttribute('data-reduce-motion')")}</div></div><div class="settings-row"><div><div class="settings-row-label">Reminder Lead Time</div></div><div class="settings-row-control"><select class="form-select" style="width:120px" onchange="setPending('reminderLeadDays',parseInt(this.value))" aria-label="Lead time">${[1,2,3,5,7].map(v=>`<option value="${v}" ${settings.reminderLeadDays===v?'selected':''}>${v} day${v>1?'s':''}</option>`).join('')}</select></div></div><div class="settings-row"><div><div class="settings-row-label">Daily Briefing</div><div class="settings-row-desc">Press Alt+B anytime for a spoken summary.</div></div><div class="settings-row-control"><button class="btn btn-secondary btn-sm" onclick="dailyBriefing()">Try Now</button></div></div><div class="settings-row"><div><div class="settings-row-label">Screen Reader Support</div></div><div class="settings-row-control"><span class="badge badge-done">Always On</span></div></div></div>`;}
function renderDrive(){const c=settings.googleConnected;return`<div><h2 class="settings-section-title">Google Drive</h2><p style="font-size:.85rem;color:var(--muted);margin-bottom:14px">Sign in and choose a shared folder. All team members must use the same folder. <strong>Drive sign-in and folder selection save immediately</strong> — no Save button needed for those.</p><div class="settings-row"><div><div class="settings-row-label">Google Account</div><div class="settings-row-desc">${c?`Signed in as <strong>${esc(settings.googleEmail||'')}</strong>`:'Not connected.'}</div></div><div class="settings-row-control">${c?`<button class="btn btn-danger btn-sm" onclick="signOut()">Sign Out</button>`:`<button class="btn btn-primary btn-sm" onclick="signIn()">Sign in with Google</button>`}</div></div><div class="settings-row"><div><div class="settings-row-label">Drive Folder</div><div class="settings-row-desc">${settings.driveFolderName?`Current: <strong>${esc(settings.driveFolderName)}</strong>`:'No folder selected.'}</div></div><div class="settings-row-control"><button class="btn btn-secondary btn-sm" onclick="openFolderPicker()" ${!c?'disabled':''}><span aria-hidden="true">📁</span> Choose Folder</button></div></div><div style="margin-top:12px"><div class="drive-status"><div class="drive-dot ${c&&settings.driveFolderId?'connected':'disconnected'}" aria-hidden="true"></div><span>${c&&settings.driveFolderId?`Connected — ${esc(settings.driveFolderName)}`:'Not fully configured.'}</span></div></div>${c&&settings.driveFolderId?`<div style="margin-top:12px;display:flex;gap:10px;align-items:center"><button class="btn btn-primary btn-sm" onclick="syncDrive()"><span aria-hidden="true">🔄</span> Sync Now</button><span style="font-size:.8rem;color:var(--muted)">${lastSync?'Last synced: '+lastSync:''}</span></div>`:''}${!c?`<div style="margin-top:18px;padding:14px;background:var(--surface2);border-radius:var(--radius);border:1px solid var(--border)"><div style="font-weight:700;font-size:.85rem;margin-bottom:8px"><span aria-hidden="true">⚙️</span> Setup Steps</div><ol style="font-size:.82rem;color:var(--muted);line-height:2.2;padding-left:20px"><li>Go to <strong>console.cloud.google.com</strong> and create a project.</li><li>Enable the <strong>Google Drive API</strong>.</li><li>Create OAuth 2.0 credentials — Desktop app type.</li><li>Add <code>http://localhost:42813</code> as redirect URI.</li><li>Set <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> as environment variables.</li></ol></div>`:''}</div>`;}
function renderShortcuts(){const sc=settings.shortcuts;const conflicts=findConflicts(sc);return`<div><h2 class="settings-section-title">Keyboard Shortcuts</h2><p style="font-size:.84rem;color:var(--muted);margin-bottom:14px;line-height:1.6">Click a field and press a key combination to change it. Then press <strong>Save Settings</strong> at the bottom to keep changes.</p><div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap"><button class="btn btn-secondary btn-sm" onclick="resetShortcutsToDefault()">Reset to Defaults</button><button class="btn btn-secondary btn-sm" onclick="showShortcutsModal()">View Reference</button></div><div class="tbl-wrap"><table aria-label="Keyboard shortcuts with screen reader conflict detection"><thead><tr><th scope="col">Action</th><th scope="col">Shortcut</th><th scope="col">SR Conflicts</th></tr></thead><tbody>${Object.entries(SHORTCUT_LABELS).map(([k,l])=>{const srW=checkSRConflict(sc[k]||'');return`<tr><td><strong>${l}</strong></td><td><input class="shortcut-input" type="text" readonly value="${esc(sc[k]||'')}" aria-label="Shortcut for ${l}${srW?'. Warning: screen reader conflict':''}" onkeydown="captureShortcut(event,'${k}')" onclick="this.select()"/>${conflicts[k]?`<div class="shortcut-conflict" role="alert"><span aria-hidden="true">⚠️</span> ${esc(conflicts[k])}</div>`:''}</td><td><div class="sr-conflict-warn" ${srW?'':' hidden'} role="alert">${srW?`<span aria-hidden="true">⚠️</span> ${esc(srW)}`:''}</div></td></tr>`;}).join('')}</tbody></table></div></div>`;}

function findConflicts(sc){const r={};const v=Object.entries(sc);v.forEach(([k,val])=>{if(!val)return;const d=v.find(([k2,v2])=>k2!==k&&v2===val);if(d)r[k]=`same as "${SHORTCUT_LABELS[d[0]]||d[0]}"`;});return r;}
function resetShortcutsToDefault(){const sc=JSON.parse(JSON.stringify(DEFAULT_SETTINGS.shortcuts));settings.shortcuts=sc;setPendingShortcuts(sc);const body=document.getElementById('settings-panel-body');if(body)body.innerHTML=renderSettingsTab('shortcuts');announce('Shortcuts reset to defaults. Press Save Settings to keep them.');}
function renderStatuses(){return`<div><h2 class="settings-section-title">Custom Task Statuses</h2><p style="font-size:.84rem;color:var(--muted);margin-bottom:14px">Add statuses beyond To Do, In Progress, and Done. <strong>Status changes save immediately</strong> — no Save button needed.</p><div style="margin-bottom:14px"><h3 style="font-size:.85rem;font-weight:700;margin-bottom:8px">Built-in statuses</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><span class="badge badge-todo">To Do</span><span class="badge badge-ip">In Progress</span><span class="badge badge-done">Done</span></div></div>${customStatuses.length?`<div style="margin-bottom:14px"><h3 style="font-size:.85rem;font-weight:700;margin-bottom:8px">Custom statuses</h3><ul style="list-style:none;padding:0;margin:0" aria-label="Custom statuses">${customStatuses.map(s=>`<li style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)" aria-label="Status: ${esc(s.name)}"><span style="width:12px;height:12px;border-radius:50%;background:${s.color};flex-shrink:0" aria-hidden="true"></span><span style="flex:1;font-weight:600">${esc(s.name)}</span><button class="btn btn-danger btn-sm" onclick="deleteCustomStatus('${s.id}')" aria-label="Delete ${esc(s.name)}">Delete</button></li>`).join('')}</ul></div>`:'<p style="color:var(--muted);font-size:.84rem;margin-bottom:14px">No custom statuses yet.</p>'}<button class="btn btn-primary btn-sm" onclick="openModalEl('status-modal')" aria-haspopup="dialog">＋ Add Custom Status</button></div>`;}
function saveCustomStatus(){const name=document.getElementById('st-name').value.trim();if(!name){announce('Enter a status name.');return;}const id='custom_'+nextStatusId++;customStatuses.push({id,name,color:document.getElementById('st-color').value});logActivity(`Custom status "${name}" created`,'🏷️');closeModal('status-modal');announce(`Status "${name}" added.`);toast(`Status added.`,'success');const body=document.getElementById('settings-panel-body');if(body)body.innerHTML=renderSettingsTab('statuses');}
function deleteCustomStatus(id){const s=customStatuses.find(s=>s.id===id);customStatuses=customStatuses.filter(s=>s.id!==id);logActivity(`Custom status "${s?.name}" deleted`,'🗑️');const body=document.getElementById('settings-panel-body');if(body)body.innerHTML=renderSettingsTab('statuses');announce(`Status "${s?.name||id}" deleted.`);toast('Status deleted.');}
function renderNotifications(){return`<div><h2 class="settings-section-title">Notifications</h2>${NOTICE}<div class="settings-row"><div><div class="settings-row-label">Enable Notifications</div></div><div class="settings-row-control">${toggle('notifications',settings.notifications)}</div></div><div class="settings-row"><div><div class="settings-row-label">Overdue Alerts</div></div><div class="settings-row-control">${toggle('notifyOverdue',settings.notifyOverdue!==false)}</div></div><div class="settings-row"><div><div class="settings-row-label">Sync Failure Alerts</div></div><div class="settings-row-control">${toggle('notifySyncFail',settings.notifySyncFail!==false)}</div></div><div class="settings-row"><div><div class="settings-row-label">Test Notification</div><div class="settings-row-desc">Sends a test right now — no Save needed.</div></div><div class="settings-row-control"><button class="btn btn-secondary btn-sm" onclick="testReminder()">Send Test</button></div></div></div>`;}
function testReminder(){if(IS_ELECTRON)window.electronAPI.sendReminder({title:'VantagePM Test',body:'Notifications are working!'});toast('Test sent.','success');announce('Test notification sent.');}
function renderAbout(){return`<div class="about-box"><div style="display:flex;justify-content:center;margin-bottom:8px">
        <svg viewBox="0 0 280 72" width="280" height="72" aria-label="VantagePM logo" role="img">
          <rect x="0" y="0" width="280" height="72" rx="10" fill="#0F1E3C"/>
          <polyline points="20,56 42,20 64,56" fill="none" stroke="#2563EB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="30,56 42,36 54,56" fill="none" stroke="#60A5FA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="42" cy="19" r="3.5" fill="#60A5FA"/>
          <line x1="14" y1="59" x2="70" y2="59" stroke="#2563EB" stroke-width="1"/>
          <text x="80" y="46" font-family="Georgia,serif" font-size="28" font-weight="700" fill="#F0F6FF" letter-spacing="-0.5">Vantage</text>
          <text x="206" y="46" font-family="Georgia,serif" font-size="28" font-weight="400" fill="#2563EB">PM</text>
          <text x="80" y="62" font-family="'Segoe UI',Arial,sans-serif" font-size="8" fill="#60A5FA" letter-spacing="2.5">PROJECT MANAGEMENT</text>
        </svg>
      </div><div class="about-version">VantagePM ${settings.appVersion||'5.0.0'} · WCAG 2.2 AA</div><div class="about-desc">Project management for digital accessibility professionals. Manage audits, remediation tasks, and team work across any company or client — optimized for JAWS, NVDA, and VoiceOver.</div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px"><button class="btn btn-secondary" onclick="showShortcutsModal()">Shortcuts</button><button class="btn btn-secondary" onclick="nav('onboarding')">Onboarding</button><button class="btn btn-secondary" onclick="dailyBriefing()">Daily Briefing</button><button class="btn btn-secondary" onclick="exportCSV()">Export CSV</button></div><div style="margin-top:24px;font-size:.78rem;color:var(--muted)">© 2026 Blind Institute of Technology · MIT License</div></div>`;}

async function signIn(){announce('Opening Google sign-in.');const r=await window.electronAPI.googleSignIn();if(r.error){toast('Error: '+r.error,'error');return;}settings.googleConnected=true;settings.googleEmail=r.email;await saveSetting('googleEmail',r.email);toast('Signed in as '+r.email,'success');announce('Signed in as '+r.email);switchSettingsTab('drive');}
async function signOut(){const r=await window.electronAPI.googleSignOut();if(r.success){settings.googleConnected=false;settings.googleEmail=null;toast('Signed out.','success');announce('Signed out.');switchSettingsTab('drive');}}
async function openFolderPicker(){openModalEl('folder-modal');const wrap=document.getElementById('folder-list-wrap');wrap.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted)">Loading…</div>';announce('Loading Google Drive folders.');const res=await window.electronAPI.driveListFolders();if(res.error){wrap.innerHTML=`<div style="padding:20px;color:var(--danger)">Error: ${esc(res.error)}</div>`;return;}const folders=res.folders||[];if(!folders.length){wrap.innerHTML='<div style="padding:20px;color:var(--muted)">No folders found.</div>';return;}wrap.innerHTML=folders.map(f=>`<div class="folder-item" role="option" tabindex="0" data-id="${esc(f.id)}" data-name="${esc(f.name)}" aria-selected="${settings.driveFolderId===f.id?'true':'false'}" onclick="selectFolder('${esc(f.id)}','${esc(f.name)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectFolder('${esc(f.id)}','${esc(f.name)}');}">📁 ${esc(f.name)}</div>`).join('');announce(`${folders.length} folders found.`);}
function selectFolder(id,name){selectedFolderId=id;selectedFolderName=name;document.querySelectorAll('.folder-item').forEach(el=>el.setAttribute('aria-selected',el.dataset.id===id?'true':'false'));document.getElementById('folder-ok').disabled=false;announce(`Selected: ${name}. Press Select Folder to confirm.`);}
async function confirmFolder(){await saveSetting('driveFolderId',selectedFolderId);await saveSetting('driveFolderName',selectedFolderName);settings.driveFolderId=selectedFolderId;settings.driveFolderName=selectedFolderName;closeModal('folder-modal');toast('Drive folder set: '+selectedFolderName,'success');announce('Drive folder set.');switchSettingsTab('drive');}

async function syncDrive(){if(!IS_ELECTRON){toast('Drive sync available in the installed app.');return;}if(!settings.googleConnected||!settings.driveFolderId){toast('Configure Google Drive in Settings.','error');announce('Google Drive not configured.');return;}document.getElementById('sync-status').textContent='Syncing…';announce('Syncing with Google Drive.');try{const remote=await window.electronAPI.driveRead();if(remote.data&&remote.data.tasks){const ids=new Set(remote.data.tasks.map(t=>t.id));tasks=[...remote.data.tasks,...tasks.filter(t=>!ids.has(t.id))];if(remote.data.members)members=remote.data.members;if(remote.data.projects)projects=remote.data.projects;if(remote.data.milestones)milestones=remote.data.milestones;if(remote.data.activityLog)activityLog=remote.data.activityLog;if(remote.data.auditResults)auditResults=remote.data.auditResults;if(remote.data.customStatuses)customStatuses=remote.data.customStatuses;if(remote.data.templates)templates=remote.data.templates;
      if(remote.data.projectNotes)projectNotes=remote.data.projectNotes;}const res=await window.electronAPI.driveWrite({tasks,members,projects,milestones,activityLog,auditResults,customStatuses,templates,projectNotes,filterPresets,persona:settings.persona,syncedAt:new Date().toISOString(),version:'9.0.0'});if(res.error)throw new Error(res.error);lastSync=new Date().toLocaleTimeString();document.getElementById('sync-status').textContent='Synced '+lastSync;logActivity('Synced with Google Drive','🔄');announce('Sync complete.');toast('Synced.','success');if(currentView!=='settings')nav(currentView,document.querySelector(`[data-view=${currentView}]`));}catch(e){document.getElementById('sync-status').textContent='Sync failed';toast('Sync failed: '+e.message,'error');announce('Sync failed.');}}

function showShortcutsModal(){const sc=settings.shortcuts;document.getElementById('shortcuts-list').innerHTML=`<div class="tbl-wrap"><table aria-label="All shortcuts"><thead><tr><th scope="col">Action</th><th scope="col">Shortcut</th></tr></thead><tbody>${Object.entries(SHORTCUT_LABELS).map(([k,l])=>`<tr><td>${l}</td><td><kbd style="background:var(--surface2);padding:2px 8px;border-radius:4px;border:1px solid var(--border);font-family:monospace;font-size:.85rem">${esc(sc[k]||'—')}</kbd></td></tr>`).join('')}</tbody></table></div>`;openModalEl('shortcuts-modal');}

function toggleTheme(){settings.theme=settings.theme==='dark'?'light':'dark';applyTheme();saveSetting('theme',settings.theme);announce(settings.theme==='dark'?'Dark mode on.':'Light mode on.');}

let toastTimer=null;
function toast(msg,type='',action=null){
  const el=document.getElementById('toast');
  el.className='show'+(type?' '+type:'');
  if(action){
    el.innerHTML='';
    const span=document.createElement('span');span.textContent=msg;el.appendChild(span);
    const btn=document.createElement('button');btn.className='toast-undo-btn';btn.textContent=action.label;
    btn.setAttribute('aria-label',action.label+'. Activate to undo last deletion.');
    btn.onclick=()=>{action.fn();el.className='';clearTimeout(toastTimer);};
    el.appendChild(btn);
  } else {
    el.textContent=msg;
  }
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{el.className='';},5000);
}
function announce(msg){const r=document.getElementById('live');r.textContent='';requestAnimationFrame(()=>{r.textContent=msg;});}

// ═══════════════════════════════════════════════════════════════════════════
// ── TASK TIMER ─────────────────────────────────────────────────────────────
// Rounds elapsed time UP to nearest 15-minute interval (billing style):
//   0:01–0:15 → 0.25h,  0:16–0:30 → 0.50h,  0:31–0:45 → 0.75h,
//   0:46–1:00 → 1.00h,  1:01–1:15 → 1.25h, etc.
// ═══════════════════════════════════════════════════════════════════════════

let timerTaskId    = null;   // which task is being timed
let timerTaskName  = '';     // display name
let timerStart     = null;   // Date when timer last started/resumed
let timerElapsed   = 0;      // ms accumulated before current run
let timerInterval  = null;   // setInterval handle
let timerPaused    = false;

function roundTo15Min(ms) {
  // Round elapsed milliseconds UP to nearest 15-min ceiling, return decimal hours
  const totalMinutes = ms / 60000;
  if (totalMinutes <= 0) return 0;
  const intervals = Math.ceil(totalMinutes / 15);
  return intervals * 0.25; // each 15-min interval = 0.25h
}

function fmtElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function tickTimer() {
  if (timerPaused || !timerStart) return;
  const now = Date.now();
  const total = timerElapsed + (now - timerStart);
  const rounded = roundTo15Min(total);
  document.getElementById('timer-display').textContent = fmtElapsed(total);
  document.getElementById('timer-rounded').textContent = `(${rounded.toFixed(2)}h billed)`;
}

function startTimerFromTask() {
  // Called from the Time tab Start Timer button
  if (!editingTaskId) { announce('Please save the task first before starting a timer.'); return; }
  if(timerTaskId!==null&&timerTaskId!==editingTaskId){
    document.getElementById('cf-title').textContent='Timer Already Running';
    document.getElementById('cf-desc').textContent=`A timer is already running for "${timerTaskName}". Stop and log it, then start a new one?`;
    document.getElementById('cf-ok').textContent='Stop & Start New';
    document.getElementById('cf-ok').onclick=()=>{stopTimer(true);closeModal('confirm-modal');startTimerFromTask();};
    openModalEl('confirm-modal');
    return;
  }
  const task = tasks.find(t => t.id === editingTaskId);
  if (!task) return;
  timerTaskId   = editingTaskId;
  timerTaskName = task.name;
  timerElapsed  = 0;
  timerPaused   = false;
  timerStart    = Date.now();
  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 1000);
  // Show timer bar
  const bar = document.getElementById('timer-bar');
  bar.hidden = false;
  document.getElementById('timer-task-name').textContent = task.name;
  document.getElementById('timer-display').textContent = '00:00';
  document.getElementById('timer-rounded').textContent = '(0.00h billed)';
  document.getElementById('timer-pause-btn').textContent = 'Pause';
  document.getElementById('timer-pause-btn').setAttribute('aria-label', 'Pause timer');
  bar.setAttribute('aria-label', `Timer running for ${task.name}`);
  // Update start button in dialog if open
  const startBtn = document.getElementById('timer-start-btn');
  if (startBtn) { startBtn.textContent = '⏱ Running…'; startBtn.disabled = true; }
  announce(`Timer started for "${task.name}". NVDA will not read the time automatically to avoid interruptions. Tab to the timer bar at the top of the page to check elapsed time.`);
  toast(`Timer started for "${task.name}".`, 'success');
}

function pauseResumeTimer() {
  if (!timerStart && !timerPaused) return;
  const btn = document.getElementById('timer-pause-btn');
  if (!timerPaused) {
    // Pause — accumulate elapsed
    timerElapsed += Date.now() - timerStart;
    timerStart = null;
    timerPaused = true;
    clearInterval(timerInterval);
    btn.textContent = 'Resume';
    btn.setAttribute('aria-label', 'Resume timer');
    const rounded = roundTo15Min(timerElapsed);
    announce(`Timer paused at ${fmtElapsed(timerElapsed)}. Billed time so far: ${rounded.toFixed(2)} hours.`);
  } else {
    // Resume
    timerStart = Date.now();
    timerPaused = false;
    timerInterval = setInterval(tickTimer, 1000);
    btn.textContent = 'Pause';
    btn.setAttribute('aria-label', 'Pause timer');
    announce('Timer resumed.');
  }
}

function stopTimer(log) {
  clearInterval(timerInterval);
  const total = timerElapsed + (timerStart ? Date.now() - timerStart : 0);
  const rounded = roundTo15Min(total);
  if (log && timerTaskId !== null && total > 0) {
    const task = tasks.find(t => t.id === timerTaskId);
    if (task) {
      if (!task.timeLog) task.timeLog = [];
      task.timeLog.push({
        person: settings.focusModeUser || members[0]?.name || 'Unknown',
        hours: rounded,
        note: `Timed session — ${fmtElapsed(total)} elapsed, rounded to nearest 15 min`,
        date: new Date().toISOString(),
      });
      logActivity(`Logged ${rounded.toFixed(2)}h on "${task.name}" via timer`, '⏱');
      announce(`Timer stopped. ${rounded.toFixed(2)} hours logged to "${task.name}". That is ${fmtElapsed(total)} elapsed, rounded up to the nearest 15 minutes.`);
      toast(`${rounded.toFixed(2)}h logged to "${task.name}".`, 'success');
    }
  } else if (!log) {
    announce('Timer discarded. No time was logged.');
    toast('Timer discarded.');
  }
  // Reset state
  timerTaskId   = null;
  timerTaskName = '';
  timerElapsed  = 0;
  timerStart    = null;
  timerPaused   = false;
  timerInterval = null;
  // Hide bar
  document.getElementById('timer-bar').hidden = true;
  document.getElementById('timer-display').textContent = '00:00';
  document.getElementById('timer-rounded').textContent = '';
  // Re-enable start button if task dialog still open
  const startBtn = document.getElementById('timer-start-btn');
  if (startBtn) { startBtn.textContent = '▶ Start Timer'; startBtn.disabled = false; }
  // Refresh current view to show updated time log
  if (currentView !== 'settings') nav(currentView, document.querySelector(`[data-view=${currentView}]`));
}

// ═══════════════════════════════════════════════════════════════════════════
// ── NATURAL LANGUAGE DUE DATE ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function parseNaturalDate(input) {
  if (!input || !input.trim()) return null;
  const s = input.trim().toLowerCase();
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Already a date-like string — try parsing directly
  const direct = new Date(input);
  if (!isNaN(direct) && input.includes('/') || input.includes('-')) {
    return direct;
  }

  // "today"
  if (s === 'today') return new Date(todayMidnight);

  // "tomorrow"
  if (s === 'tomorrow') {
    const d = new Date(todayMidnight); d.setDate(d.getDate() + 1); return d;
  }

  // "yesterday" — allowed so user can backdate
  if (s === 'yesterday') {
    const d = new Date(todayMidnight); d.setDate(d.getDate() - 1); return d;
  }

  // "next <weekday>" e.g. "next friday"
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const nextDay = s.match(/^next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (nextDay) {
    const target = DAYS.indexOf(nextDay[1]);
    const cur = todayMidnight.getDay();
    let diff = target - cur;
    if (diff <= 0) diff += 7;
    const d = new Date(todayMidnight); d.setDate(d.getDate() + diff); return d;
  }

  // "this <weekday>" — same week, possibly today
  const thisDay = s.match(/^this\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (thisDay) {
    const target = DAYS.indexOf(thisDay[1]);
    const cur = todayMidnight.getDay();
    let diff = target - cur;
    if (diff < 0) diff += 7;
    const d = new Date(todayMidnight); d.setDate(d.getDate() + diff); return d;
  }

  // "in N days" / "in N day"
  const inDays = s.match(/^in\s+(\d+)\s+days?$/);
  if (inDays) {
    const d = new Date(todayMidnight); d.setDate(d.getDate() + parseInt(inDays[1])); return d;
  }

  // "in N weeks" / "in N week"
  const inWeeks = s.match(/^in\s+(\d+)\s+weeks?$/);
  if (inWeeks) {
    const d = new Date(todayMidnight); d.setDate(d.getDate() + parseInt(inWeeks[1]) * 7); return d;
  }

  // "in N months"
  const inMonths = s.match(/^in\s+(\d+)\s+months?$/);
  if (inMonths) {
    const d = new Date(todayMidnight); d.setMonth(d.getMonth() + parseInt(inMonths[1])); return d;
  }

  // "end of month" / "end of the month"
  if (s.includes('end of') && s.includes('month')) {
    const d = new Date(todayMidnight.getFullYear(), todayMidnight.getMonth() + 1, 0); return d;
  }

  // "end of week" — Saturday
  if (s.includes('end of') && s.includes('week')) {
    const d = new Date(todayMidnight);
    d.setDate(d.getDate() + (6 - d.getDay())); return d;
  }

  // "next month"
  if (s === 'next month') {
    const d = new Date(todayMidnight); d.setMonth(d.getMonth() + 1); return d;
  }

  // "next week"
  if (s === 'next week') {
    const d = new Date(todayMidnight); d.setDate(d.getDate() + 7); return d;
  }

  // "N weeks from now"
  const weeksFromNow = s.match(/^(\d+)\s+weeks?\s+from\s+now$/);
  if (weeksFromNow) {
    const d = new Date(todayMidnight); d.setDate(d.getDate() + parseInt(weeksFromNow[1]) * 7); return d;
  }

  return null;
}

function resolveNaturalDate(inputId, hintId) {
  const input = document.getElementById(inputId);
  const hint  = document.getElementById(hintId);
  if (!input || !hint) return;
  const val = input.value.trim();
  if (!val) { hint.textContent = ''; return; }

  const resolved = parseNaturalDate(val);
  if (resolved) {
    const formatted = resolved.toLocaleDateString(settings.language, { weekday:'long', month:'long', day:'numeric', year:'numeric' });
    const iso = resolved.toISOString().split('T')[0]; // YYYY-MM-DD for saving
    hint.textContent = '✓ ' + formatted;
    hint.style.color = 'var(--success)';
    input.dataset.resolvedDate = iso; // store resolved ISO for saving
    announce(`Due date resolved to ${formatted}.`);
  } else {
    // Check if it looks like a date format they might be typing still
    if (val.length >= 3) {
      hint.textContent = 'Try: "next Friday", "in 2 weeks", "tomorrow", "end of month"';
      hint.style.color = 'var(--muted)';
    } else {
      hint.textContent = '';
    }
    input.dataset.resolvedDate = '';
  }
}

function getResolvedDate(inputId) {
  // Returns ISO date string from either a resolved natural language date
  // or a direct date input value
  const input = document.getElementById(inputId);
  if (!input) return '';
  if (input.dataset.resolvedDate) return input.dataset.resolvedDate;
  // Try direct ISO / MM-DD-YYYY parsing
  const val = input.value.trim();
  const direct = parseNaturalDate(val);
  if (direct && !isNaN(direct)) return direct.toISOString().split('T')[0];
  return val; // pass through, let saveTask validate
}

// ═══════════════════════════════════════════════════════════════════════════
// ── QUICK CAPTURE ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function openQuickCapture() {
  // Populate selects
  const projSel = document.getElementById('qc-project');
  const asgnSel = document.getElementById('qc-assignee');
  projSel.innerHTML = '<option value="">— Select project —</option>' +
    projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  asgnSel.innerHTML = '<option value="">— Select person —</option>' +
    members.map(m => `<option value="${esc(m.name)}">${esc(m.name)}</option>`).join('');
  // Pre-select focus user
  if (settings.focusModeUser) {
    [...asgnSel.options].forEach(o => { if (o.value === settings.focusModeUser) o.selected = true; });
  }
  // Clear fields
  document.getElementById('qc-name').value = '';
  document.getElementById('qc-due').value = '';
  document.getElementById('qc-date-hint').textContent = '';
  document.getElementById('qc-priority').value = 'medium';
  document.getElementById('qc-name-err').classList.add('hidden');
  document.getElementById('qc-proj-err').classList.add('hidden');
  document.getElementById('qc-asgn-err').classList.add('hidden');
  openModalEl('qc-modal');
}

function saveQuickCapture() {
  const name     = document.getElementById('qc-name').value.trim();
  const projVal  = document.getElementById('qc-project').value;
  const assignee = document.getElementById('qc-assignee').value;
  const priority = document.getElementById('qc-priority').value;
  const dueRaw   = getResolvedDate('qc-due');

  let ok = true;
  if (!name)     { document.getElementById('qc-name-err').classList.remove('hidden'); ok = false; }
  else             document.getElementById('qc-name-err').classList.add('hidden');
  if (!projVal)  { document.getElementById('qc-proj-err').classList.remove('hidden'); ok = false; }
  else             document.getElementById('qc-proj-err').classList.add('hidden');
  if (!assignee) { document.getElementById('qc-asgn-err').classList.remove('hidden'); ok = false; }
  else             document.getElementById('qc-asgn-err').classList.add('hidden');
  if (!ok) { announce('Please fill in the required fields.'); return; }

  const due = dueRaw || new Date(Date.now() + 7*86400000).toISOString().split('T')[0]; // default 1 week out
  tasks.push({
    id: nextTaskId++,
    name,
    desc: '',
    assignee,
    priority,
    status: 'todo',
    due,
    progress: 0,
    projectId: parseInt(projVal),
    recur: 'none',
    colorLabel: '',
    comments: [],
    attachments: [],
    dependencies: [],
    timeLog: [],
  });
  logActivity(`${assignee} quick-captured "${name}"`, '⚡');
  closeModal('qc-modal');
  announce(`Task "${name}" captured and saved. Due ${fmtDate(due)}.`);
  toast(`"${name}" captured.`, 'success');
  if (currentView !== 'settings') nav(currentView, document.querySelector(`[data-view=${currentView}]`));
  if (settings.autoSync && settings.googleConnected && settings.driveFolderId) syncDrive();
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function initials(n){return String(n||'').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);}
function fmtDate(d){if(!d)return'—';return new Date(d+'T00:00').toLocaleDateString(settings.language||'en',{month:'short',day:'numeric',year:'numeric'});}
function sBadge(s){const sObj=allStatuses().find(st=>st.id===s);if(sObj){const isDone=sObj.id==='done';const isIp=sObj.id==='inprogress';const bg=isDone?'#D4F4E2':isIp?'var(--warn-bg)':sObj.color?sObj.color+'22':'#E8EEFF';const col=isDone?'#0A6B3C':isIp?'var(--warn)':sObj.color||'#1547C8';return`<span class="badge" style="background:${bg};color:${col}">${esc(sObj.name)}</span>`;}return`<span class="badge badge-low">${esc(s)}</span>`;}
function pBadge(p){const m={high:'badge-high High',medium:'badge-medium Medium',low:'badge-low Low'};const q=(m[p]||'badge-low '+p).split(' ');return`<span class="badge ${q[0]}">${q.slice(1).join(' ')||p}</span>`;}


// ═══════════════════════════════════════════════════════════════════════════
// VantagePM v7 — New feature functions
// ═══════════════════════════════════════════════════════════════════════════

// ── Screen reader reserved key database ──────────────────────────────────
const SR_RESERVED={
  'Insert+T':'JAWS: Read Window Title','Insert+B':'JAWS: Read Window',
  'Insert+M':'JAWS: Move to PC Cursor','Insert+Z':'JAWS: Toggle Virtual Cursor',
  'Insert+Escape':'JAWS: Refresh Screen','Insert+F1':'JAWS: Help',
  'Insert+F5':'JAWS: Select Language','Insert+F7':'JAWS: Links List',
  'Insert+F12':'JAWS: Say Date/Time','Alt+Insert':'JAWS: Say Line',
  'NVDA+Space':'NVDA: Toggle Focus/Browse Mode','NVDA+F1':'NVDA: Help',
  'NVDA+F4':'NVDA: Quit','NVDA+F7':'NVDA: Elements List',
  'NVDA+F8':'NVDA: Preferences','NVDA+F12':'NVDA: Report Time/Date',
  'NVDA+T':'NVDA: Read Window Title','NVDA+B':'NVDA: Read Window',
  'NVDA+N':'NVDA: NVDA Menu','NVDA+Q':'NVDA: Quit',
  'VO+F1':'VoiceOver: Help','VO+F8':'VoiceOver: VoiceOver Utility',
  'VO+H':'VoiceOver: Help','VO+M':'VoiceOver: Menu Bar',
  'Alt+F4':'Windows: Close Window','Alt+Tab':'Windows: Switch App',
  'Ctrl+Alt+Delete':'Windows: Task Manager',
};

function checkSRConflict(combo){
  if(!combo) return null;
  if(SR_RESERVED[combo]) return SR_RESERVED[combo];
  if(combo.startsWith('Insert+')) return 'JAWS: Insert is the JAWS modifier. Most Insert combinations are reserved.';
  if(combo.startsWith('NVDA+')||combo.startsWith('Capslock+')) return 'NVDA: CapsLock/NVDA combinations are reserved by NVDA.';
  return null;
}

// ── Update captureShortcut to check SR conflicts ──────────────────────────
function captureShortcut(e,key){
  e.preventDefault();e.stopPropagation();
  if(['Tab','CapsLock','NumLock','ScrollLock'].includes(e.key))return;
  const combo=buildCombo(e);
  if(!combo||['Alt','Ctrl','Shift','Meta'].includes(combo))return;
  const newSc={...settings.shortcuts,[key]:combo};
  settings.shortcuts=newSc;
  e.target.value=combo;
  setPendingShortcuts(newSc);
  const srConflict=checkSRConflict(combo);
  const row=e.target.closest('tr');
  if(row){
    const warn=row.querySelector('.sr-conflict-warn');
    if(warn){
      if(srConflict){warn.textContent=`⚠️ ${srConflict}`;warn.removeAttribute('hidden');}
      else{warn.textContent='';warn.setAttribute('hidden','');}
    }
  }
  if(srConflict){
    announce(`Shortcut for ${SHORTCUT_LABELS[key]||key} set to ${combo}. Warning: ${srConflict} Press Save Settings to keep.`);
  } else {
    announce(`Shortcut for ${SHORTCUT_LABELS[key]||key} set to ${combo}. No screen reader conflicts detected. Press Save Settings to keep.`);
  }
}

// ── Task aging helpers ────────────────────────────────────────────────────
function taskAgeDays(task){
  const entries=activityLog.filter(e=>e.text.includes(`"${task.name}"`));
  if(!entries.length) return null;
  const latest=new Date(entries[entries.length-1].timestamp);
  return Math.floor((Date.now()-latest)/86400000);
}

function isTaskAging(task){
  if(task.status==='done') return false;
  const days=taskAgeDays(task);
  if(days===null) return false;
  return days>=(settings.agingThresholdDays||5);
}

// ── Workload balancing ────────────────────────────────────────────────────
function memberOpenCount(name){
  return tasks.filter(t=>t.assignee===name&&t.status!=='done').length;
}

function leastLoadedMember(excludeName){
  return [...members].filter(m=>m.name!==excludeName)
    .sort((a,b)=>memberOpenCount(a.name)-memberOpenCount(b.name))[0]||null;
}

function checkWorkload(selectEl){
  const name=selectEl.value;
  let container=document.getElementById('workload-warn-box');
  if(!name){if(container)container.classList.add('hidden');return;}
  const threshold=5;
  const open=memberOpenCount(name);
  if(open>=threshold){
    if(!container){
      container=document.createElement('div');
      container.id='workload-warn-box';
      container.className='workload-warn';
      container.setAttribute('role','status');
      container.setAttribute('aria-live','polite');
      selectEl.parentNode.appendChild(container);
    }
    const alt=leastLoadedMember(name);
    container.classList.remove('hidden');
    container.innerHTML=`<span aria-hidden="true">⚠️</span>
      <span><strong>${esc(name)}</strong> has ${open} open tasks — at capacity.
      ${alt?`<strong>${esc(alt.name)}</strong> has ${memberOpenCount(alt.name)} and has more availability.`:''}</span>
      ${alt?`<button class="btn btn-secondary btn-sm" onclick="document.getElementById('t-assignee').value='${esc(alt.name)}';checkWorkload(document.getElementById('t-assignee'));announce('Reassigned to ${esc(alt.name)}.');">Assign to ${esc(alt.name)}</button>`:''}`;
    announce(`Workload warning: ${name} has ${open} open tasks.${alt?` ${alt.name} has more availability.`:''}`);
  } else {
    if(container) container.classList.add('hidden');
  }
}

function openAddTask(){
  editingTaskId=null;
  document.getElementById('tm-title').textContent='Add Task';
  document.getElementById('t-name').value='';
  document.getElementById('t-desc').value='';
  const di=document.getElementById('t-due');di.value='';di.dataset.resolvedDate='';document.getElementById('t-date-hint').textContent='';
  document.getElementById('t-prog').value=0;document.getElementById('t-prog-val').textContent='0';
  document.getElementById('t-priority').value='medium';
  document.getElementById('t-recur').value='none';
  document.getElementById('t-color').value='';
  document.getElementById('t-name-err').classList.add('hidden');
  document.getElementById('t-due-err').classList.add('hidden');
  currentTaskComments=[];currentTaskAttachments=[];currentTaskDependencies=[];currentTaskTimeLog=[];
  const _pu=settings.focusModeUser||'';document.getElementById('comment-author').value=_pu;document.getElementById('tl-person').value=_pu;
  populateStatusSelect();populateProjectSelect(null);populateAssigneeSelect(members[0]?.name||'');
  switchTab('details');
  openModalEl('task-modal');
  setTimeout(()=>{const asgn=document.getElementById('t-assignee');if(asgn)asgn.setAttribute('onchange','checkWorkload(this)');},60);
}
function openEditTask(id){
  const t=tasks.find(t=>t.id===id);if(!t)return;
  editingTaskId=id;
  document.getElementById('tm-title').textContent='Edit Task';
  document.getElementById('t-name').value=t.name;
  document.getElementById('t-desc').value=t.desc||'';
  const di=document.getElementById('t-due');
  if(t.due){const[y,mo,d]=t.due.split('-');di.value=`${mo}/${d}/${y}`;di.dataset.resolvedDate=t.due;}
  else{di.value='';di.dataset.resolvedDate='';}
  document.getElementById('t-date-hint').textContent='';
  document.getElementById('t-prog').value=t.progress||0;document.getElementById('t-prog-val').textContent=String(t.progress||0);
  document.getElementById('t-priority').value=t.priority||'medium';
  document.getElementById('t-recur').value=t.recur||'none';
  document.getElementById('t-color').value=t.colorLabel||'';
  document.getElementById('t-name-err').classList.add('hidden');
  document.getElementById('t-due-err').classList.add('hidden');
  currentTaskComments=[...(t.comments||[])];currentTaskAttachments=[...(t.attachments||[])];
  currentTaskDependencies=[...(t.dependencies||[])];currentTaskTimeLog=[...(t.timeLog||[])];
  populateStatusSelect();populateProjectSelect(t.projectId);populateAssigneeSelect(t.assignee);
  document.getElementById('t-status').value=t.status||'todo';
  const _eu=settings.focusModeUser||'';document.getElementById('comment-author').value=_eu;document.getElementById('tl-person').value=_eu;
  switchTab('details');
  openModalEl('task-modal');
  setTimeout(()=>{const asgn=document.getElementById('t-assignee');if(asgn)asgn.setAttribute('onchange','checkWorkload(this)');},60);
}

// ── Project Health view ───────────────────────────────────────────────────
function projectHealth(p){
  const pt=tasks.filter(t=>t.projectId===p.id);
  if(!pt.length) return{status:'healthy',label:'✅ Healthy',pct:0,overdue:0,aging:0,daysToMs:null,nearestMs:null};
  const done=pt.filter(t=>t.status==='done').length;
  const pct=Math.round((done/pt.length)*100);
  const overdue=pt.filter(t=>t.status!=='done'&&new Date(t.due+'T00:00')<today).length;
  const aging=pt.filter(t=>isTaskAging(t)).length;
  const upMs=milestones.filter(m=>m.projectId===p.id&&new Date(m.date+'T00:00')>=today)
    .sort((a,b)=>new Date(a.date)-new Date(b.date));
  const nearestMs=upMs[0]||null;
  const daysToMs=nearestMs?Math.ceil((new Date(nearestMs.date+'T00:00')-today)/86400000):null;
  let score=100;
  if(overdue>0) score-=Math.min(40,overdue*10);
  if(aging>0)   score-=Math.min(20,aging*5);
  if(daysToMs!==null&&daysToMs<=7) score-=10;
  const status=score>=75?'healthy':score>=45?'risk':'critical';
  const label=score>=75?'✅ Healthy':score>=45?'⚠️ At Risk':'🚨 Critical';
  return{status,label,pct,overdue,aging,daysToMs,nearestMs};
}

function renderHealth(){
  if(!projects.length) return'<p style="color:var(--muted);margin-top:20px">No projects yet.</p>';
  const healthy=projects.filter(p=>projectHealth(p).status==='healthy').length;
  const atRisk=projects.filter(p=>projectHealth(p).status==='risk').length;
  const critical=projects.filter(p=>projectHealth(p).status==='critical').length;
  return`
  <div class="card" style="margin-bottom:20px" aria-label="Portfolio summary">
    <h2 class="section-h">Portfolio Health</h2>
    <div style="display:flex;gap:14px;flex-wrap:wrap" role="list">
      <div role="listitem"><span class="health-indicator health-healthy"><span aria-hidden="true">✅</span> Healthy: ${healthy}</span></div>
      <div role="listitem"><span class="health-indicator health-risk"><span aria-hidden="true">⚠️</span> At Risk: ${atRisk}</span></div>
      <div role="listitem"><span class="health-indicator health-critical"><span aria-hidden="true">🚨</span> Critical: ${critical}</span></div>
    </div>
  </div>
  <div class="health-grid" role="list" aria-label="Project health cards">
    ${projects.map(p=>{
      const h=projectHealth(p);
      const noteCount=(projectNotes[p.id]||[]).length;
      return`<article class="card health-card" role="listitem" aria-label="Project ${esc(p.name)}, ${h.label.replace(/[✅⚠️🚨]/g,'').trim()}">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:12px;height:12px;border-radius:50%;background:${p.color};flex-shrink:0" aria-hidden="true"></div>
          <h2 style="font-size:1rem;font-weight:700;flex:1">${esc(p.name)}</h2>
          <span class="health-indicator health-${h.status}" aria-hidden="true">${h.label}</span>
        </div>
        <div class="prog-wrap" role="progressbar" aria-valuenow="${h.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Completion ${h.pct}%">
          <div class="prog-bar" style="width:${h.pct}%;background:${p.color}"></div>
        </div>
        <div class="health-stats" role="list" aria-label="Project stats">
          <div class="health-stat" role="listitem" aria-label="${h.pct}% complete"><div class="health-stat-num" style="color:${p.color}">${h.pct}%</div><div class="health-stat-lbl">Complete</div></div>
          <div class="health-stat" role="listitem" aria-label="${h.overdue} overdue"><div class="health-stat-num" style="color:${h.overdue>0?'var(--danger)':'var(--success)'}">${h.overdue}</div><div class="health-stat-lbl">Overdue</div></div>
          <div class="health-stat" role="listitem" aria-label="${h.aging} aging"><div class="health-stat-num" style="color:${h.aging>0?'var(--warn)':'var(--success)'}">${h.aging}</div><div class="health-stat-lbl">Aging</div></div>
          <div class="health-stat" role="listitem" aria-label="${h.daysToMs!==null?h.daysToMs+' days to milestone':'No upcoming milestones'}"><div class="health-stat-num" style="color:${h.daysToMs!==null&&h.daysToMs<=7?'var(--warn)':'var(--accent)'}">${h.daysToMs!==null?h.daysToMs+'d':'—'}</div><div class="health-stat-lbl">To Milestone</div></div>
        </div>
        ${h.nearestMs?`<p style="font-size:.78rem;color:var(--muted)">Next: <strong>${esc(h.nearestMs.name)}</strong> — ${fmtDate(h.nearestMs.date)}</p>`:''}
        ${h.overdue>0?`<p style="font-size:.78rem;color:var(--danger)" role="alert">${h.overdue} task${h.overdue>1?'s':''} past due.</p>`:''}
        ${h.aging>0?`<p style="font-size:.78rem;color:var(--warn)">${h.aging} task${h.aging>1?'s':''} stale — no update in ${settings.agingThresholdDays||5}+ days.</p>`:''}
        <div class="act-btns" style="margin-top:4px">
          <button class="btn btn-secondary btn-sm" onclick="filterProject='${p.id}';nav('tasks')" aria-label="View tasks for ${esc(p.name)}">View Tasks</button>
          <button class="btn btn-secondary btn-sm" onclick="openNotes(${p.id},'${esc(p.name)}')" aria-label="Notes for ${esc(p.name)}, ${noteCount} note${noteCount!==1?'s':''}" aria-haspopup="dialog">📝 Notes${noteCount?` (${noteCount})`:''}</button>
        </div>
      </article>`;
    }).join('')}
  </div>`;
}

// ── Team notes ────────────────────────────────────────────────────────────
let notesProjectId=null;

function openNotes(projectId,projectName){
  notesProjectId=projectId;
  if(!projectNotes[projectId]) projectNotes[projectId]=[];
  document.getElementById('nm-title').innerHTML=`<span aria-hidden="true">📝</span> Notes — ${esc(projectName)}`;
  document.getElementById('notes-project-label').textContent=`Shared notes for ${projectName}. Leave context, decisions, or links for the team.`;
  document.getElementById('note-author').value=settings.focusModeUser||'';
  document.getElementById('note-text').value='';
  renderNotesList(projectId);
  openModalEl('notes-modal');
}

function renderNotesList(projectId){
  const list=document.getElementById('notes-list');if(!list) return;
  const notes=(projectNotes[projectId]||[]).slice().reverse();
  if(!notes.length){list.innerHTML='<p style="color:var(--muted);font-size:.85rem">No notes yet. Add the first one below.</p>';return;}
  list.innerHTML=`<ul style="list-style:none;padding:0;margin:0" role="list" aria-label="Project notes, newest first">
    ${notes.map(n=>{
      const dt=new Date(n.timestamp);
      const ds=dt.toLocaleDateString(settings.language,{month:'short',day:'numeric',year:'numeric'});
      const ts=dt.toLocaleTimeString(settings.language,{hour:'2-digit',minute:'2-digit'});
      return`<li class="notes-entry" tabindex="0" aria-label="${esc(n.author)} on ${ds} at ${ts}: ${esc(n.text)}">
        <div><span class="note-author">${esc(n.author)}</span><span class="note-time">${ds} at ${ts}</span></div>
        <div class="note-text">${esc(n.text)}</div>
      </li>`;
    }).join('')}
  </ul>`;
}

function saveNote(){
  const author=document.getElementById('note-author').value.trim();
  const text=document.getElementById('note-text').value.trim();
  if(!author||!text){announce('Please enter your name and a note.');return;}
  if(!projectNotes[notesProjectId]) projectNotes[notesProjectId]=[];
  projectNotes[notesProjectId].push({author,text,timestamp:new Date().toISOString()});
  document.getElementById('note-text').value='';
  renderNotesList(notesProjectId);
  const pName=projects.find(p=>p.id===notesProjectId)?.name||'project';
  logActivity(`${author} added a note to "${pName}"`,'📝','note');
  announce('Note added.');toast('Note added.','success');
}

// ── Time tracking summary ─────────────────────────────────────────────────
function renderTimeSummary(){
  const now=new Date();
  const startOfWeek=new Date(now);startOfWeek.setDate(now.getDate()-now.getDay());startOfWeek.setHours(0,0,0,0);
  const startOfMonth=new Date(now.getFullYear(),now.getMonth(),1);
  function hoursInRange(logs,from){return logs.filter(e=>new Date(e.date)>=from).reduce((a,e)=>a+e.hours,0);}
  const byPerson=members.map(m=>{
    const logs=tasks.flatMap(t=>(t.timeLog||[]).filter(e=>e.person===m.name));
    return{name:m.name,week:hoursInRange(logs,startOfWeek),month:hoursInRange(logs,startOfMonth),total:logs.reduce((a,e)=>a+e.hours,0)};
  }).filter(r=>r.total>0);
  const byProject=projects.map(p=>{
    const logs=tasks.filter(t=>t.projectId===p.id).flatMap(t=>t.timeLog||[]);
    return{name:p.name,week:hoursInRange(logs,startOfWeek),month:hoursInRange(logs,startOfMonth),total:logs.reduce((a,e)=>a+e.hours,0)};
  }).filter(r=>r.total>0);
  if(!byPerson.length&&!byProject.length) return'<section style="margin-top:24px" aria-label="Time tracking"><h2 class="section-h"><span aria-hidden="true">⏱</span> Time Tracking Summary</h2><p style="color:var(--muted)">No time logged yet.</p></section>';
  const totW=byPerson.reduce((a,r)=>a+r.week,0),totM=byPerson.reduce((a,r)=>a+r.month,0),totA=byPerson.reduce((a,r)=>a+r.total,0);
  const tbl=(rows,showTotal)=>`<div class="tbl-wrap"><table class="time-sum-tbl" aria-label="Hours breakdown"><thead><tr><th scope="col">Name</th><th scope="col">This Week</th><th scope="col">This Month</th><th scope="col">All Time</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${esc(r.name)}</strong></td><td>${r.week.toFixed(2)}h</td><td>${r.month.toFixed(2)}h</td><td>${r.total.toFixed(2)}h</td></tr>`).join('')}${showTotal?`<tr class="total-row"><td>Total</td><td>${totW.toFixed(2)}h</td><td>${totM.toFixed(2)}h</td><td>${totA.toFixed(2)}h</td></tr>`:''}</tbody></table></div>`;
  return`<section style="margin-top:24px" aria-label="Time tracking summary"><h2 class="section-h"><span aria-hidden="true">⏱</span> Time Tracking Summary</h2><p style="font-size:.82rem;color:var(--muted);margin-bottom:14px">All hours use 15-minute rounding. Week starts Sunday. Month is the current calendar month.</p>${byPerson.length?`<h3 style="font-size:.88rem;font-weight:700;margin-bottom:10px">By Team Member</h3>${tbl(byPerson,true)}`:''}${byProject.length?`<h3 style="font-size:.88rem;font-weight:700;margin:18px 0 10px">By Project</h3>${tbl(byProject,false)}`:''}</section>`;
}

// ── Session summary ───────────────────────────────────────────────────────
function showSessionSummary(){
  const now=new Date();
  const created=sessionLog.filter(e=>e.type==='create');
  const updated=sessionLog.filter(e=>e.type==='update');
  const noted=sessionLog.filter(e=>e.type==='note');
  const sessionHours=tasks.flatMap(t=>t.timeLog||[])
    .filter(e=>new Date(e.date)>=sessionStart)
    .reduce((a,e)=>a+e.hours,0);
  const lines=[
    `Session summary for ${now.toLocaleDateString(settings.language,{weekday:'long',month:'long',day:'numeric'})} at ${now.toLocaleTimeString(settings.language,{hour:'2-digit',minute:'2-digit'})}.`,
    created.length?`${created.length} task${created.length>1?'s':''} created.`:'No tasks created this session.',
    updated.length?`${updated.length} task${updated.length>1?'s':''} updated.`:'No tasks updated.',
    sessionHours>0?`${sessionHours.toFixed(2)} hours logged.`:'No time logged this session.',
    noted.length?`${noted.length} project note${noted.length>1?'s':''} added.`:'',
    sessionLog.length===0?'No activity recorded yet.':null,
  ].filter(Boolean);
  const el=document.getElementById('session-content');
  el.innerHTML=`<ul style="list-style:none;padding:0;margin:0" role="list" aria-label="Session activity">
    ${lines.map((l,i)=>`<li class="session-item" tabindex="0"><span class="sr-only">Item ${i+1}: </span>${esc(l)}</li>`).join('')}
  </ul>
  ${sessionLog.length>0?`<details style="margin-top:16px"><summary style="font-size:.85rem;font-weight:600;cursor:pointer;color:var(--accent)">Full session log (${sessionLog.length} items)</summary><ul style="list-style:none;padding:8px 0 0;margin:0" aria-label="Full log">${sessionLog.slice().reverse().map(e=>{const dt=new Date(e.timestamp);return`<li style="padding:5px 0;border-bottom:1px solid var(--border);font-size:.82rem" tabindex="0" aria-label="${dt.toLocaleTimeString(settings.language,{hour:'2-digit',minute:'2-digit'})}: ${esc(e.text)}"><span style="color:var(--muted);margin-right:8px">${dt.toLocaleTimeString(settings.language,{hour:'2-digit',minute:'2-digit'})}</span>${esc(e.text)}</li>`;}).join('')}</ul></details>`:'' }`;
  openModalEl('session-modal');
}

function readSessionAloud(text){
  const full=text||document.getElementById('session-content')?.innerText||'';
  announce(full);
  if('speechSynthesis' in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(full);u.rate=0.9;window.speechSynthesis.speak(u);}
}


// ═══════════════════════════════════════════════════════════════════════════
// ── BATCH TIME LOG ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function openBatchTimeLog(){
  const dateEl=document.getElementById('tlb-date');
  if(dateEl)dateEl.value=today.toISOString().split('T')[0];
  const personEl=document.getElementById('tlb-person');
  if(personEl){
    const cur=settings.focusModeUser||members[0]?.name||'';
    personEl.innerHTML=members.map(m=>`<option value="${esc(m.name)}" ${m.name===cur?'selected':''}>${esc(m.name)}</option>`).join('');
    if(!members.length)personEl.innerHTML='<option value="">No team members</option>';
  }
  renderBatchTimeRows();
  openModalEl('timelog-batch-modal');
}

function renderBatchTimeRows(){
  const person=document.getElementById('tlb-person')?.value||'';
  const openTasks=tasks.filter(t=>t.status!=='done'&&(!person||t.assignee===person));
  const rows=document.getElementById('tlb-rows');
  const empty=document.getElementById('tlb-empty');
  if(!rows)return;
  if(!openTasks.length){rows.innerHTML='';if(empty)empty.classList.remove('hidden');return;}
  if(empty)empty.classList.add('hidden');
  rows.innerHTML=openTasks.map(t=>{
    const proj=projects.find(p=>p.id===t.projectId);
    return`<div role="listitem" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--border)">
      <div style="flex:1;min-width:0"><div style="font-size:.84rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(t.name)}">${esc(t.name)}</div>${proj?`<div style="font-size:.74rem;color:var(--muted)">${esc(proj.name)}</div>`:''}</div>
      <label class="sr-only" for="tlb-h-${t.id}">Hours for ${esc(t.name)}</label>
      <input class="form-input" id="tlb-h-${t.id}" type="number" min="0" max="24" step="0.25" placeholder="0" style="width:68px;text-align:right" aria-label="Hours for ${esc(t.name)}"/>
      <label class="sr-only" for="tlb-n-${t.id}">Note for ${esc(t.name)}</label>
      <input class="form-input" id="tlb-n-${t.id}" type="text" placeholder="Note (optional)" style="width:150px;font-size:.8rem" aria-label="Note for ${esc(t.name)}"/>
    </div>`;
  }).join('');
}

function saveBatchTime(){
  const date=document.getElementById('tlb-date')?.value||today.toISOString().split('T')[0];
  const person=document.getElementById('tlb-person')?.value||settings.focusModeUser||'';
  const openTasks=tasks.filter(t=>t.status!=='done'&&(!person||t.assignee===person));
  let saved=0;
  openTasks.forEach(t=>{
    const raw=parseFloat(document.getElementById('tlb-h-'+t.id)?.value||'0');
    if(!raw||raw<=0)return;
    const note=(document.getElementById('tlb-n-'+t.id)?.value||'').trim();
    const rounded=Math.ceil(raw*4)/4;
    if(!t.timeLog)t.timeLog=[];
    t.timeLog.push({person,hours:rounded,note,date:new Date(date+'T12:00').toISOString()});
    logActivity(`${person} logged ${rounded}h on "${t.name}"`,'⏱','update');
    saved++;
  });
  if(!saved){announce('No hours entered. Fill in at least one task.');toast('Enter at least one time value.','error');return;}
  scheduleLocalSave();
  closeModal('timelog-batch-modal');
  const msg=`${saved} time entr${saved!==1?'ies':'y'} saved.`;
  announce(msg);toast(msg,'success');
  if(currentView==='reports')nav('reports',document.querySelector('[data-view=reports]'));
}

// ═══════════════════════════════════════════════════════════════════════════
// ── FILTER PRESETS ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function renderPresetBar(){
  if(!filterPresets.length) return '';
  return`<nav class="preset-bar" aria-label="Saved filter presets"><span style="font-size:.75rem;font-weight:700;color:var(--muted);flex-shrink:0;margin-right:4px">Presets:</span>${filterPresets.map((p,i)=>{const key=i<9?`Alt+${i+1}`:null;return`<span style="display:inline-flex;align-items:center"><button class="preset-chip${activePresetIdx===i?' active-preset':''}" onclick="loadFilterPreset(${i})" aria-pressed="${activePresetIdx===i?'true':'false'}" aria-label="Load preset: ${esc(p.name)}${key?` (${key})`:''}">${esc(p.name)}${key?`<span aria-hidden="true" style="font-size:.66rem;opacity:.6;margin-left:5px">${key}</span>`:''}</button><button class="preset-del-btn" onclick="deleteFilterPreset(${i})" aria-label="Delete preset ${esc(p.name)}">✕</button></span>`;}).join('')}</nav>`;
}

function openSavePreset(){
  document.getElementById('preset-name').value='';
  document.getElementById('preset-name-err').classList.add('hidden');
  openModalEl('preset-modal');
}

function saveFilterPreset(){
  const name=document.getElementById('preset-name').value.trim();
  if(!name){document.getElementById('preset-name-err').classList.remove('hidden');announce('Enter a preset name.');return;}
  document.getElementById('preset-name-err').classList.add('hidden');
  filterPresets.push({name,status:filterStatus,priority:filterPriority,project:filterProject,search:searchText});
  closeModal('preset-modal');
  scheduleLocalSave();
  document.getElementById('main-content').innerHTML=renderTasks();
  announce(`Preset "${name}" saved.`);
  toast(`Preset "${name}" saved.`,'success');
}

function loadFilterPreset(idx){
  const p=filterPresets[idx];if(!p)return;
  filterStatus=p.status;filterPriority=p.priority;filterProject=p.project;searchText=p.search;
  activePresetIdx=idx;
  nav('tasks',document.querySelector('[data-view=tasks]'));
  announce(`Preset "${p.name}" applied.`);
}

function deleteFilterPreset(idx){
  const name=filterPresets[idx]?.name||'preset';
  filterPresets.splice(idx,1);
  if(activePresetIdx===idx)activePresetIdx=-1;
  else if(activePresetIdx>idx)activePresetIdx--;
  scheduleLocalSave();
  if(currentView==='tasks')document.getElementById('main-content').innerHTML=renderTasks();
  announce(`Preset "${name}" deleted.`);
  toast('Preset deleted.');
}

// ═══════════════════════════════════════════════════════════════════════════
// ── TASK PINNING ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function togglePin(id){
  const t=tasks.find(t=>t.id===id);if(!t)return;
  t.pinned=!t.pinned;
  scheduleLocalSave();
  document.getElementById('main-content').innerHTML=renderTasks();
  announce(`${t.name} ${t.pinned?'pinned to top':'unpinned'}.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ── CSV IMPORT ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function importCSVClick(){
  document.getElementById('csv-file-input').value='';
  document.getElementById('csv-file-input').click();
}

function handleCSVImport(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>parseAndImportCSV(e.target.result);
  reader.readAsText(file,'utf-8');
}

function parseAndImportCSV(text){
  const lines=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l=>l.trim());
  if(lines.length<2){announce('CSV appears empty or has no data rows.');toast('CSV is empty or invalid.','error');return;}
  const parseRow=line=>{const r=[];let cur='',inQ=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&!inQ){inQ=true;}else if(c==='"'&&inQ){if(line[i+1]==='"'){cur+='"';i++;}else inQ=false;}else if(c===','&&!inQ){r.push(cur);cur='';}else cur+=c;}r.push(cur);return r;};
  const headers=parseRow(lines[0]).map(h=>h.trim().toLowerCase());
  const col=name=>headers.indexOf(name);
  let imported=0,skipped=0;
  for(let i=1;i<lines.length;i++){
    if(!lines[i].trim()){skipped++;continue;}
    const row=parseRow(lines[i]);
    const name=(row[col('name')]||'').trim();if(!name){skipped++;continue;}
    // Project — look up by name, create if new
    let projectId=null;
    const projName=(row[col('project')]||'').trim();
    if(projName){
      let proj=projects.find(p=>p.name.toLowerCase()===projName.toLowerCase());
      if(!proj){proj={id:nextProjectId++,name:projName,desc:'',color:'#1547C8'};projects.push(proj);logActivity(`Project "${projName}" created via import`,'📁');}
      projectId=proj.id;
    }
    // Assignee — look up by name, create member if new
    let assignee=(row[col('assignee')]||'').trim()||settings.focusModeUser||members[0]?.name||'';
    if(assignee&&!members.find(m=>m.name.toLowerCase()===assignee.toLowerCase())){
      members.push({id:nextMemberId++,name:assignee,email:'',role:'Imported',dept:'',photo:''});
      logActivity(`Member "${assignee}" added via import`,'👤');
    }
    const priority=['high','medium','low'].includes((row[col('priority')]||'').toLowerCase())?(row[col('priority')].toLowerCase()):'medium';
    const statusRaw=(row[col('status')]||'').toLowerCase();
    const statusId=allStatuses().find(s=>s.name.toLowerCase()===statusRaw||s.id===statusRaw)?.id||'todo';
    const dueRaw=(row[col('due')]||'').trim();
    const dueDate=dueRaw?parseNaturalDate(dueRaw):null;
    const due=dueDate?dueDate.toISOString().split('T')[0]:new Date(Date.now()+7*86400000).toISOString().split('T')[0];
    const progress=Math.min(100,Math.max(0,parseInt(row[col('progress')])||0));
    const recurRaw=(row[col('recurring')]||'').toLowerCase();
    const recur=['daily','weekly','monthly'].includes(recurRaw)?recurRaw:'none';
    tasks.push({id:nextTaskId++,name,desc:'',assignee,priority,status:statusId,due,progress,projectId,recur,colorLabel:'',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:false});
    imported++;
  }
  logActivity(`Imported ${imported} task${imported!==1?'s':''} from CSV`,'📤');
  scheduleLocalSave();
  if(currentView==='tasks')nav('tasks',document.querySelector('[data-view=tasks]'));
  const msg=`Imported ${imported} task${imported!==1?'s':''}${skipped?`, skipped ${skipped} empty row${skipped!==1?'s':''}`:''}.`;
  announce(msg);toast(msg,'success');
}

// ═══════════════════════════════════════════════════════════════════════════
// ── PERSONA SETUP ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function toggleRowMenu(e,id){e.stopPropagation();const menu=document.getElementById('row-menu-'+id);const btn=document.getElementById('row-menu-btn-'+id);const wasOpen=!menu.hidden;closeAllRowMenus();if(!wasOpen){menu.hidden=false;btn.setAttribute('aria-expanded','true');const first=menu.querySelector('[role=menuitem]');if(first)first.focus();}}
function closeAllRowMenus(){document.querySelectorAll('.row-menu').forEach(m=>{m.hidden=true;const id=m.id.replace('row-menu-','');const btn=document.getElementById('row-menu-btn-'+id);if(btn)btn.setAttribute('aria-expanded','false');});}
function openChangeRole(id){changeRoleMemberId=id;const m=members.find(m=>m.id===id);if(!m)return;document.getElementById('cr-member-name').textContent=`Changing role for: ${m.name} (current: ${m.role})`;document.getElementById('cr-role').value=m.role||'';document.getElementById('cr-role-err').classList.add('hidden');closeAllRowMenus();openModalEl('change-role-modal');}
function saveChangeRole(){const role=(document.getElementById('cr-role')?.value||'').trim();if(!role){document.getElementById('cr-role-err').classList.remove('hidden');announce('Please enter a role.');return;}document.getElementById('cr-role-err').classList.add('hidden');const m=members.find(m=>m.id===changeRoleMemberId);if(!m)return;const prev=m.role;m.role=role;logActivity(`${m.name}: role changed from "${prev}" to "${role}"`,'👤');scheduleLocalSave();closeModal('change-role-modal');nav('team',document.querySelector('[data-view=team]'));announce(`${m.name}'s role updated to ${role}.`);toast('Role updated.','success');}
function applyOnboardingPersona(){const el=document.querySelector('input[name="onboard-role"]:checked');if(!el){announce('Please select a role first.');return;}if(settings.persona==='tester'&&el.value!=='tester'){document.getElementById('cf-title').textContent='Changing Your Role';document.getElementById('cf-desc').textContent='You are currently set up as an Accessibility Tester. Moving to a different role will replace your workspace and sample data. If you are unsure whether this change is right for you, check with your project lead or administrator before continuing.';document.getElementById('cf-ok').textContent='Change Role';document.getElementById('cf-ok').onclick=()=>{closeModal('confirm-modal');setupPersona(el.value);};openModalEl('confirm-modal');return;}setupPersona(el.value);}
function openSetupModal(){
  document.querySelectorAll('input[name="setup-role"]').forEach(r=>r.checked=false);
  if(settings.persona){const ex=document.querySelector(`input[name="setup-role"][value="${settings.persona}"]`);if(ex)ex.checked=true;}
  const nameEl=document.getElementById('setup-name');
  if(nameEl)nameEl.value=settings.focusModeUser||'';
  document.getElementById('setup-role-err').classList.add('hidden');
  document.getElementById('setup-name-err').classList.add('hidden');
  openModalEl('setup-modal');
}
function completeSetup(){
  const roleEl=document.querySelector('input[name="setup-role"]:checked');
  const name=(document.getElementById('setup-name')?.value||'').trim();
  let ok=true;
  if(!roleEl){document.getElementById('setup-role-err').classList.remove('hidden');ok=false;}
  else document.getElementById('setup-role-err').classList.add('hidden');
  if(!name){document.getElementById('setup-name-err').classList.remove('hidden');ok=false;}
  else document.getElementById('setup-name-err').classList.add('hidden');
  if(!ok){announce('Please fix the errors above.');return;}
  settings.focusModeUser=name;
  settings.hasSeenOnboarding=true;
  if(IS_ELECTRON)window.electronAPI.saveSettings({focusModeUser:name,hasSeenOnboarding:true});
  closeModal('setup-modal');
  doSetupPersona(roleEl.value);
}
function setupPersona(type){
  if(type!=='blank'&&(tasks.length||projects.length||members.length)){
    document.getElementById('cf-title').textContent='Replace Existing Data?';
    document.getElementById('cf-desc').textContent='This will replace your current tasks, projects, and team members with persona sample data. Your settings and audit results will be kept.';
    document.getElementById('cf-ok').textContent='Replace Data';
    document.getElementById('cf-ok').onclick=()=>{doSetupPersona(type);closeModal('confirm-modal');};
    openModalEl('confirm-modal');return;
  }
  doSetupPersona(type);
}

function doSetupPersona(type){
  tasks=[];projects=[];members=[];milestones=[];templates=[];activityLog=[];filterPresets=[];
  nextTaskId=10;nextProjectId=10;nextMemberId=10;nextMilestoneId=10;nextTemplateId=10;
  activePresetIdx=-1;
  const you=settings.focusModeUser||'You';
  const d=days=>new Date(today.getTime()+days*86400000).toISOString().split('T')[0];

  if(type==='tester'){
    const proj={id:nextProjectId++,name:'Client Website Audit',desc:'WCAG 2.2 AA accessibility audit',color:'#1547C8'};
    projects.push(proj);
    members.push({id:nextMemberId++,name:you,email:'',role:'Accessibility Tester',dept:'',photo:''});
    tasks.push({id:nextTaskId++,name:'Keyboard navigation testing',desc:'Test all interactive elements for keyboard operability — buttons, links, forms, modals.',assignee:you,priority:'high',status:'inprogress',due:d(3),progress:40,projectId:proj.id,recur:'none',colorLabel:'#1E88E5',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:true});
    tasks.push({id:nextTaskId++,name:'Color contrast review',desc:'Check all text and UI element contrast ratios against WCAG 1.4.3 (4.5:1) and 1.4.11 (3:1).',assignee:you,priority:'high',status:'todo',due:d(5),progress:0,projectId:proj.id,recur:'none',colorLabel:'#E53935',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:false});
    tasks.push({id:nextTaskId++,name:'Screen reader compatibility check',desc:'Test with NVDA on Firefox, JAWS on Chrome, and VoiceOver on Safari.',assignee:you,priority:'high',status:'todo',due:d(7),progress:0,projectId:proj.id,recur:'none',colorLabel:'',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:false});
    tasks.push({id:nextTaskId++,name:'ARIA implementation review',desc:'Validate all ARIA roles, states, and properties. Check for aria-hidden misuse.',assignee:you,priority:'medium',status:'todo',due:d(10),progress:0,projectId:proj.id,recur:'none',colorLabel:'',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:false});
    tasks.push({id:nextTaskId++,name:'Form accessibility audit',desc:'Labels, error identification, keyboard flow, and required field indicators.',assignee:you,priority:'medium',status:'todo',due:d(12),progress:0,projectId:proj.id,recur:'none',colorLabel:'',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:false});
    templates.push({id:nextTemplateId++,name:'WCAG Audit Finding',data:{desc:'Criterion: \nElement: \nIssue: \nRecommended fix: ',priority:'high',status:'todo',recur:'none',colorLabel:'#E53935',projectId:proj.id}});
    templates.push({id:nextTemplateId++,name:'Remediation Follow-up',data:{desc:'Verify the fix was applied correctly and re-test with a screen reader.',priority:'medium',status:'todo',recur:'none',colorLabel:'#43A047',projectId:proj.id}});
    filterPresets=[{name:'Active Tests',status:'inprogress',priority:'all',project:String(proj.id),search:''},{name:'High Priority',status:'all',priority:'high',project:String(proj.id),search:''}];
    settings.persona='tester';
  } else if(type==='lead'){
    const p1={id:nextProjectId++,name:'Remediation Sprint Q3',desc:'Fixing WCAG failures identified in the last audit',color:'#0A6B3C'};
    const p2={id:nextProjectId++,name:'Client Audit — Acme Corp',desc:'Full WCAG 2.2 AA audit engagement',color:'#1547C8'};
    projects.push(p1,p2);
    members.push({id:nextMemberId++,name:you,email:'',role:'Project Lead',dept:'',photo:''});
    members.push({id:nextMemberId++,name:'Alex Rivera',email:'alex@example.com',role:'Accessibility Engineer',dept:'Engineering',photo:''});
    members.push({id:nextMemberId++,name:'Jordan Kim',email:'jordan@example.com',role:'QA Tester',dept:'QA',photo:''});
    members.push({id:nextMemberId++,name:'Sam Patel',email:'sam@example.com',role:'Front-end Developer',dept:'Engineering',photo:''});
    tasks.push({id:nextTaskId++,name:'Fix button contrast ratios',desc:'Update 12 button colors to meet 4.5:1 contrast. Affects primary, secondary, and danger buttons.',assignee:'Alex Rivera',priority:'high',status:'inprogress',due:d(3),progress:60,projectId:p1.id,recur:'none',colorLabel:'#E53935',comments:[],attachments:[],dependencies:[],timeLog:[{person:'Alex Rivera',hours:2,note:'Identified all affected buttons',date:new Date().toISOString()}],pinned:true});
    tasks.push({id:nextTaskId++,name:'Add alt text to product images',desc:'Catalogue decorative vs. informative images and write appropriate alt text.',assignee:'Jordan Kim',priority:'high',status:'todo',due:d(4),progress:0,projectId:p1.id,recur:'none',colorLabel:'',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:false});
    tasks.push({id:nextTaskId++,name:'Implement skip navigation',desc:'Add skip-to-main-content link at the top of every page.',assignee:'Sam Patel',priority:'medium',status:'done',due:d(-2),progress:100,projectId:p1.id,recur:'none',colorLabel:'#43A047',comments:[{author:'Sam Patel',text:'Implemented and tested with NVDA — works correctly.',timestamp:new Date(Date.now()-86400000).toISOString()}],attachments:[],dependencies:[],timeLog:[{person:'Sam Patel',hours:1,note:'Implemented and tested',date:new Date(Date.now()-86400000).toISOString()}],pinned:false});
    tasks.push({id:nextTaskId++,name:'Sprint review prep',desc:'Compile all completed items with before/after screenshots for the sprint review demo.',assignee:you,priority:'high',status:'todo',due:d(14),progress:0,projectId:p1.id,recur:'none',colorLabel:'',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:false});
    tasks.push({id:nextTaskId++,name:'Keyboard trap investigation',desc:'Three modals reported with keyboard traps on the checkout flow.',assignee:'Alex Rivera',priority:'high',status:'todo',due:d(5),progress:0,projectId:p2.id,recur:'none',colorLabel:'#E53935',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:false});
    tasks.push({id:nextTaskId++,name:'Mobile screen reader testing',desc:'Test key flows with iOS VoiceOver and Android TalkBack.',assignee:'Jordan Kim',priority:'medium',status:'todo',due:d(8),progress:0,projectId:p2.id,recur:'none',colorLabel:'',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:false});
    milestones.push({id:nextMilestoneId++,name:'Sprint Review',date:d(14),projectId:p1.id,desc:'Demo all completed remediation items to stakeholders'});
    milestones.push({id:nextMilestoneId++,name:'Audit Report Delivery',date:d(21),projectId:p2.id,desc:'Final WCAG 2.2 audit report delivered to Acme Corp'});
    templates.push({id:nextTemplateId++,name:'Remediation Task',data:{desc:'WCAG criterion: \nAffected component: \nAcceptance criteria: ',priority:'high',status:'todo',recur:'none',colorLabel:'#E53935',projectId:p1.id}});
    templates.push({id:nextTemplateId++,name:'Audit Finding',data:{desc:'Criterion: \nElement: \nSeverity: \nSteps to reproduce: ',priority:'high',status:'todo',recur:'none',colorLabel:'#E53935',projectId:p2.id}});
    filterPresets=[{name:'Sprint Tasks',status:'all',priority:'all',project:String(p1.id),search:''},{name:'Audit Tasks',status:'all',priority:'all',project:String(p2.id),search:''},{name:'Open High Priority',status:'todo',priority:'high',project:'all',search:''}];
    settings.persona='lead';
  } else if(type==='manager'){
    const p1={id:nextProjectId++,name:'Q3 Accessibility Initiative',desc:'Cross-team WCAG 2.2 compliance program',color:'#1547C8'};
    const p2={id:nextProjectId++,name:'Mobile App Remediation',desc:'iOS and Android accessibility improvements',color:'#0A6B3C'};
    const p3={id:nextProjectId++,name:'Design System Audit',desc:'Component library WCAG accessibility audit',color:'#7A4700'};
    projects.push(p1,p2,p3);
    members.push({id:nextMemberId++,name:you,email:'',role:'Program Manager',dept:'',photo:''});
    members.push({id:nextMemberId++,name:'Morgan Lee',email:'morgan@example.com',role:'Accessibility Lead',dept:'Engineering',photo:''});
    members.push({id:nextMemberId++,name:'Taylor Ross',email:'taylor@example.com',role:'UX Designer',dept:'Design',photo:''});
    members.push({id:nextMemberId++,name:'Casey Nguyen',email:'casey@example.com',role:'iOS Developer',dept:'Mobile',photo:''});
    members.push({id:nextMemberId++,name:'Drew Chen',email:'drew@example.com',role:'Android Developer',dept:'Mobile',photo:''});
    tasks.push({id:nextTaskId++,name:'Stakeholder accessibility briefing',desc:'Present WCAG 2.2 requirements and Q3 goals to leadership.',assignee:you,priority:'high',status:'done',due:d(-7),progress:100,projectId:p1.id,recur:'none',colorLabel:'#43A047',comments:[],attachments:[],dependencies:[],timeLog:[{person:you,hours:2,note:'Presentation delivered — positive reception',date:new Date(Date.now()-7*86400000).toISOString()}],pinned:false});
    tasks.push({id:nextTaskId++,name:'Define Q3 accessibility OKRs',desc:'Set measurable objectives: 95% WCAG 2.2 AA pass rate by end of Q3.',assignee:you,priority:'high',status:'done',due:d(-5),progress:100,projectId:p1.id,recur:'none',colorLabel:'#43A047',comments:[],attachments:[],dependencies:[],timeLog:[{person:you,hours:3,note:'OKRs finalized and shared with team',date:new Date(Date.now()-5*86400000).toISOString()}],pinned:true});
    tasks.push({id:nextTaskId++,name:'Accessibility maturity assessment',desc:'Evaluate current process maturity across all teams using the BOIA framework.',assignee:'Morgan Lee',priority:'high',status:'inprogress',due:d(7),progress:50,projectId:p1.id,recur:'none',colorLabel:'#1E88E5',comments:[],attachments:[],dependencies:[],timeLog:[{person:'Morgan Lee',hours:4,note:'Assessment 50% complete',date:new Date().toISOString()}],pinned:false});
    tasks.push({id:nextTaskId++,name:'Quarterly compliance report',desc:'Aggregate WCAG pass/fail rates from all three projects for the executive report.',assignee:you,priority:'medium',status:'todo',due:d(21),progress:0,projectId:p1.id,recur:'none',colorLabel:'',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:false});
    tasks.push({id:nextTaskId++,name:'VoiceOver gesture support',desc:'Implement swipe navigation and custom gesture hints for all iOS flows.',assignee:'Casey Nguyen',priority:'high',status:'inprogress',due:d(5),progress:35,projectId:p2.id,recur:'none',colorLabel:'#1E88E5',comments:[],attachments:[],dependencies:[],timeLog:[{person:'Casey Nguyen',hours:6,note:'Swipe navigation done, working on hints',date:new Date().toISOString()}],pinned:false});
    tasks.push({id:nextTaskId++,name:'TalkBack navigation fixes',desc:'Fix 8 reported TalkBack issues: focus order, missing labels, and edit field announcements.',assignee:'Drew Chen',priority:'high',status:'todo',due:d(8),progress:0,projectId:p2.id,recur:'none',colorLabel:'',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:false});
    tasks.push({id:nextTaskId++,name:'Touch target size audit',desc:'Verify all interactive elements meet 24×24 CSS px minimum (WCAG 2.5.8).',assignee:'Taylor Ross',priority:'medium',status:'done',due:d(-3),progress:100,projectId:p2.id,recur:'none',colorLabel:'#43A047',comments:[],attachments:[],dependencies:[],timeLog:[{person:'Taylor Ross',hours:2,note:'Audit complete — 14 issues filed in Jira',date:new Date(Date.now()-3*86400000).toISOString()}],pinned:false});
    tasks.push({id:nextTaskId++,name:'Button component audit',desc:'Review all 22 button variants for name, role, and state exposure.',assignee:'Morgan Lee',priority:'medium',status:'done',due:d(-4),progress:100,projectId:p3.id,recur:'none',colorLabel:'#43A047',comments:[],attachments:[],dependencies:[],timeLog:[{person:'Morgan Lee',hours:3,note:'All 22 components reviewed',date:new Date(Date.now()-4*86400000).toISOString()}],pinned:false});
    tasks.push({id:nextTaskId++,name:'Form component accessibility',desc:'Labels, error messages, required indicators, and keyboard flow for all form atoms.',assignee:'Taylor Ross',priority:'high',status:'inprogress',due:d(6),progress:60,projectId:p3.id,recur:'none',colorLabel:'#1E88E5',comments:[],attachments:[],dependencies:[],timeLog:[{person:'Taylor Ross',hours:5,note:'Labels and error states done',date:new Date().toISOString()}],pinned:false});
    tasks.push({id:nextTaskId++,name:'Color token contrast check',desc:'Validate all design token color pairs meet 4.5:1 contrast across light and dark themes.',assignee:'Morgan Lee',priority:'medium',status:'todo',due:d(10),progress:0,projectId:p3.id,recur:'none',colorLabel:'',comments:[],attachments:[],dependencies:[],timeLog:[],pinned:false});
    milestones.push({id:nextMilestoneId++,name:'Q3 Mid-Point Review',date:d(14),projectId:p1.id,desc:'Program health check with executive sponsors'});
    milestones.push({id:nextMilestoneId++,name:'Mobile v2.1 Launch',date:d(10),projectId:p2.id,desc:'First accessible mobile release'});
    milestones.push({id:nextMilestoneId++,name:'Design System v3.0',date:d(28),projectId:p3.id,desc:'Fully WCAG-compliant component library released'});
    filterPresets=[{name:'My Tasks',status:'all',priority:'all',project:'all',search:you},{name:'In Progress',status:'inprogress',priority:'all',project:'all',search:''},{name:'High Priority',status:'all',priority:'high',project:'all',search:''},{name:'Initiative',status:'all',priority:'all',project:String(p1.id),search:''}];
    settings.persona='manager';
  } else {
    settings.persona='blank';
  }

  scheduleLocalSave();
  if(IS_ELECTRON)window.electronAPI.saveSettings({persona:settings.persona});
  const labels={tester:'Accessibility Tester',lead:'Project Lead',manager:'Project Manager',blank:'Blank Slate'};
  logActivity(`Set up as ${labels[type]||type}`,'🚀');
  nav('dashboard',document.querySelector('[data-view=dashboard]'));
  announce(`Welcome to VantagePM. Set up as ${labels[type]||type}.`);
  toast(`Set up as ${labels[type]||type}.`,'success');
}

init();
