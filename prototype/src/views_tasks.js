/* =====================================================================
   Tasks & Projects
   ===================================================================== */
function taskFilters() {
  const f = App.ui.tf || (App.ui.tf = { view: 'list', who: me().scope === 'self' ? 'mine' : 'all', q: '', company: 'all', project: 'all', status: 'open', priority: 'all', assignee: 'all' });
  return f;
}
function filteredTasks() {
  const f = taskFilters(); const u = me();
  let ts = tasksInView();
  if (f.who === 'mine') ts = ts.filter(t => t.assigneeId === u.id);
  else if (f.who === 'created') ts = ts.filter(t => t.creatorId === u.id || t.chain.some(c => c.from === u.id));
  else if (f.who === 'review') ts = ts.filter(t => t.reviewerId === u.id && t.status === 'submitted');
  if (f.company !== 'all') ts = ts.filter(t => t.companyId === f.company);
  if (f.project !== 'all') ts = ts.filter(t => t.projectId === f.project);
  if (f.priority !== 'all') ts = ts.filter(t => t.priority === f.priority);
  if (f.assignee !== 'all') ts = ts.filter(t => t.assigneeId === f.assignee);
  if (f.view === 'list') {
    if (f.status === 'open') ts = ts.filter(t => t.status !== 'completed');
    else if (f.status === 'overdue') ts = ts.filter(isOverdue);
    else if (f.status !== 'all') ts = ts.filter(t => t.status === f.status);
  }
  if (f.q) { const q = f.q.toLowerCase(); ts = ts.filter(t => t.title.toLowerCase().includes(q) || t.key.toLowerCase().includes(q) || user(t.assigneeId).name.toLowerCase().includes(q)); }
  const pr = { critical: 0, high: 1, medium: 2, low: 3 };
  return ts.sort((a, b) => (a.status === 'completed') - (b.status === 'completed') || (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : pr[a.priority] - pr[b.priority]));
}
VIEWS.tasks = function () {
  const f = taskFilters(); const u = me();
  const ts = filteredTasks();
  const all = tasksInView();
  let h = pageHead('Tasks', 'Workflow: assign → delegate → do the work → submit → manager review → completed. Every step is recorded.', can('tasks.create') ? '<button class="btn primary" data-act="new-task">' + icon('plus') + 'New task</button>' : '');
  const whoOpts = [['mine', 'Assigned to me'], ['created', 'Assigned by me'], ['review', 'To review']].concat(u.scope !== 'self' ? [['all', u.scope === 'department' ? 'My department' : 'All in scope']] : []);
  h += '<div class="filters">' + segEl([['list', icon('list').replace('<svg', '<svg width="15" height="15"') + ' List'], ['board', icon('board').replace('<svg', '<svg width="15" height="15"') + ' Board']], f.view, 'tf-view') +
    selectEl('tf-who', whoOpts, f.who, 'data-act-change="tf" data-k="who" aria-label="Whose tasks"') +
    '<input class="input" id="tf-q" placeholder="Filter by title, key, person" value="' + esc(f.q) + '" data-act-input="tf" data-k="q" style="min-width:200px">' +
    (activeCompanyIds().length > 1 ? selectEl('tf-company', companyOptions(null, true), f.company, 'data-act-change="tf" data-k="company" aria-label="Company"') : '') +
    selectEl('tf-project', [['all', 'All projects']].concat(projectsInView().map(p => [p.id, p.name])), f.project, 'data-act-change="tf" data-k="project" aria-label="Project"') +
    (f.view === 'list' ? selectEl('tf-status', [['open', 'Open'], ['overdue', 'Overdue'], ['all', 'All statuses']].concat(Object.entries(TASK_STATUS).map(([k, v]) => [k, v.label])), f.status, 'data-act-change="tf" data-k="status" aria-label="Status"') : '') +
    selectEl('tf-priority', [['all', 'Any priority']].concat(Object.entries(PRIORITY).map(([k, v]) => [k, v.label])), f.priority, 'data-act-change="tf" data-k="priority" aria-label="Priority"') + '</div>';
  h += '<div class="row small muted" style="margin:-4px 0 12px">' + ts.length + ' shown · ' + all.filter(t => t.status !== 'completed').length + ' open · ' + all.filter(isOverdue).length + ' overdue · ' + all.filter(t => t.status === 'submitted').length + ' awaiting review</div>';
  if (f.view === 'board') h += taskBoard(ts);
  else h += card('', tableEl([
    { h: 'Task', v: t => '<div class="row" style="flex-wrap:nowrap;gap:10px"><span class="mono muted">' + t.key + '</span><div style="min-width:0"><b>' + esc(t.title) + '</b>' + (t.recurrence ? ' <span class="tag" title="Recurring">' + icon('repeat').replace('<svg', '<svg width="11" height="11"') + ' ' + t.recurrence + '</span>' : '') + '<div class="muted small">' + esc(company(t.companyId).short) + (t.projectId ? ' · ' + esc(project(t.projectId).name) : '') + '</div></div></div>' },
    { h: 'Assignee', v: t => person(t.assigneeId) },
    { h: 'Priority', v: t => prioBadge(t.priority) },
    { h: 'Status', v: t => taskStatusBadge(t) },
    { h: 'Due', nowrap: 1, v: t => '<span class="' + (isOverdue(t) ? 'down strong' : '') + '">' + fmtShort(t.dueDate) + '</span>' },
    { h: 'Progress', v: t => '<div style="width:90px">' + progressBar(t.status === 'completed' ? 100 : t.progress, t.status === 'completed' ? 'good' : '') + '</div>' },
  ], ts, { rowAct: 'open-task', pageSize: 25, pageKey: 'tpg', empty: 'No tasks match these filters.' }), { cls: '', flush: true });
  return h;
};
function taskBoard(ts) {
  const cols = [['todo', 'To do'], ['in_progress', 'In progress'], ['submitted', 'Awaiting review'], ['attention', 'Changes / blocked'], ['completed', 'Completed · 14 days']];
  const inCol = (t, c) => c === 'attention' ? ['changes', 'blocked'].includes(t.status) : c === 'completed' ? t.status === 'completed' && (t.completedAt || '').slice(0, 10) >= rel(-14) : t.status === c;
  return '<div class="board">' + cols.map(([c, l]) => { const items = ts.filter(t => inCol(t, c)); return '<div class="col" data-drop="' + c + '"><div class="col-h"><span>' + l + '</span><span class="tag">' + items.length + '</span></div>' + items.map(t => '<div class="tcard" draggable="true" data-drag="' + t.id + '" data-act="open-task" data-id="' + t.id + '"><div class="row" style="justify-content:space-between"><span class="mono muted">' + t.key + '</span>' + prioBadge(t.priority) + '</div><div class="tt">' + esc(t.title) + '</div>' + (t.status !== 'completed' && t.status !== 'todo' ? progressBar(t.progress) : '') + '<div class="foot"><span class="person">' + avatar(t.assigneeId, 'sm') + '<span>' + esc(user(t.assigneeId).name.split(' ')[0]) + '</span></span><span class="' + (isOverdue(t) ? 'down strong' : '') + '">' + (t.status === 'completed' ? 'Done' : dueLabel(t.dueDate)) + '</span></div>' + (['changes', 'blocked'].includes(t.status) ? taskStatusBadge(t) : '') + '</div>').join('') + (items.length ? '' : '<div class="muted small" style="padding:6px">Nothing here</div>') + '</div>'; }).join('') + '</div><p class="muted small">Drag a card to change status. Moving to “Awaiting review” opens the submit form; only the reviewer can move work to Completed.</p>';
}
Object.assign(ACT, {
  'tf-view': el => { taskFilters().view = el.dataset.v; render(); },
  'open-task': el => openDrawer('task', el.dataset.id),
  'new-task': el => openNewTask(el && el.dataset ? el.dataset : {}),
});
CHANGE.tf = el => { taskFilters()[el.dataset.k] = el.value; App.ui.tpg = 0; render(); };
/* drag & drop on the board */
document.addEventListener('dragstart', ev => { const c = ev.target.closest && ev.target.closest('[data-drag]'); if (c) { ev.dataTransfer.setData('text/plain', c.dataset.drag); ev.dataTransfer.effectAllowed = 'move'; } });
document.addEventListener('dragover', ev => { const c = ev.target.closest && ev.target.closest('[data-drop]'); if (c) { ev.preventDefault(); document.querySelectorAll('.col.drop').forEach(x => x !== c && x.classList.remove('drop')); c.classList.add('drop'); } });
document.addEventListener('drop', ev => {
  const c = ev.target.closest && ev.target.closest('[data-drop]'); if (!c) return; ev.preventDefault(); c.classList.remove('drop');
  const t = get('tasks', ev.dataTransfer.getData('text/plain')); if (!t) return; moveTask(t, c.dataset.drop);
});
function moveTask(t, to) {
  const u = me(); const isA = t.assigneeId === u.id;
  if (to === t.status) return;
  if (to === 'completed') { if (canReviewTask(t)) { reviewTask(t, 'approve', ''); toast('Approved and completed'); refresh(); } else toast(t.status === 'submitted' ? 'Only ' + user(t.reviewerId).name + ' can approve this work.' : 'Submit the work for review first.', true); return; }
  if (!isA && !(state.roles[u.role].level >= 4)) { toast('Only the assignee can change the status of this task.', true); return; }
  if (to === 'submitted') { openSubmit(t); return; }
  if (to === 'attention') { openBlocker(t); return; }
  if (t.status === 'submitted' || t.status === 'completed') { toast('This work is with the reviewer. Ask them to request changes.', true); return; }
  setTaskStatus(t, to); refresh();
}

/* ---------- task drawer ---------- */
DRAWERS.task = function (id) {
  const t = get('tasks', id); if (!t || !visibleTask(t)) return '';
  const u = me(); const isA = t.assigneeId === u.id; const p = t.projectId ? project(t.projectId) : null;
  let actions = '';
  if (isA && t.status === 'todo') actions += '<button class="btn primary" data-act="task-start" data-id="' + t.id + '">' + icon('arrowR') + 'Start work</button>';
  if (isA && ['in_progress', 'changes'].includes(t.status)) actions += '<button class="btn primary" data-act="task-submit" data-id="' + t.id + '">' + icon('send') + 'Submit work</button><button class="btn" data-act="task-block" data-id="' + t.id + '">' + icon('flag') + 'Flag blocker</button>';
  if (isA && t.status === 'blocked') actions += '<button class="btn primary" data-act="task-resume" data-id="' + t.id + '">Resume work</button>';
  if (canReviewTask(t)) actions += '<button class="btn good" data-act="task-approve" data-id="' + t.id + '">' + icon('ok') + 'Approve & complete</button><button class="btn danger" data-act="task-changes" data-id="' + t.id + '">Request changes</button>';
  const canDelegate = t.status !== 'completed' && (isA || t.creatorId === u.id || t.reviewerId === u.id || state.roles[u.role].level >= 4) && assignableUsers().some(x => x.id !== t.assigneeId);
  if (canDelegate) actions += '<button class="btn" data-act="task-delegate" data-id="' + t.id + '">' + icon('arrowR') + (isA ? 'Delegate' : 'Reassign') + '</button>';
  if (t.status !== 'completed' && (t.creatorId === u.id || t.reviewerId === u.id || state.roles[u.role].level >= 4)) actions += '<button class="btn ghost" data-act="task-edit" data-id="' + t.id + '">' + icon('edit') + 'Edit</button>';
  let note = '';
  if (t.status === 'submitted' && !canReviewTask(t)) note = noticeEl('Waiting for <b>' + esc(user(t.reviewerId).name) + '</b> to review. ' + (t.reviewerId === u.id ? 'You cannot approve work you submitted yourself.' : ''), '', 'clock');
  if (t.status === 'changes') note = noticeEl('Changes requested by ' + esc(user(t.reviewerId).name) + '. Update the work and submit again.', 'warn', 'undo');
  if (t.status === 'blocked') note = noticeEl('Blocked. ' + esc(((t.comments.filter(c => c.kind === 'blocker').slice(-1)[0]) || {}).text || ''), 'bad', 'flag');
  // workflow chain
  const chainIds = [t.chain[0] ? t.chain[0].from : t.creatorId].concat(t.chain.map(c => c.to));
  const steps = chainIds.map((id, i) => '<span class="step ' + (i < chainIds.length - 1 ? 'done' : t.status === 'completed' ? 'done' : 'cur') + '"><i>' + (i + 1) + '</i>' + esc(user(id).name.split(' ')[0]) + ' <small class="muted" style="font-weight:500">' + esc(roleLabel(user(id).role)) + '</small></span>').join('<span class="step-arrow">→</span>') +
    '<span class="step-arrow">→</span><span class="step ' + (t.status === 'submitted' ? 'cur' : t.status === 'completed' ? 'done' : '') + '"><i>' + icon('stamp').replace('<svg', '<svg width="10" height="10"') + '</i>Review · ' + esc(user(t.reviewerId).name.split(' ')[0]) + '</span><span class="step-arrow">→</span><span class="step ' + (t.status === 'completed' ? 'done' : '') + '"><i>' + icon('ok').replace('<svg', '<svg width="10" height="10"') + '</i>Completed</span>';
  const prog = isA && ['in_progress', 'changes'].includes(t.status) ? '<div class="row" style="gap:12px"><input type="range" min="0" max="100" step="5" value="' + t.progress + '" id="prog-' + t.id + '" data-act-change="task-progress" data-id="' + t.id + '" style="flex:1;accent-color:var(--brand)" aria-label="Progress"><b class="num">' + t.progress + '%</b></div>' : '<div class="row" style="gap:12px"><div style="flex:1">' + progressBar(t.progress, t.status === 'completed' ? 'good' : '') + '</div><b class="num">' + t.progress + '%</b></div>';
  return drawerHead('<span class="mono">' + t.key + '</span> · Task', esc(t.title), taskStatusBadge(t) + prioBadge(t.priority) + (t.recurrence ? badge('Repeats ' + t.recurrence, 'b-info', true) : '') + companyTag(t.companyId)) +
    '<div class="drawer-b">' + (actions ? '<div class="action-bar">' + actions + '</div>' : '') + note +
    card('Workflow', '<div class="steps">' + steps + '</div>') +
    card('Details', '<dl class="dl"><dt>Company</dt><dd>' + esc(company(t.companyId).name) + '</dd><dt>Department</dt><dd>' + esc(dept(t.departmentId).name) + '</dd><dt>Project</dt><dd>' + (p ? '<button class="link" data-act="open" data-t="project" data-id="' + p.id + '">' + esc(p.name) + '</button>' : '—') + '</dd><dt>Created by</dt><dd>' + person(t.creatorId) + '</dd><dt>Assignee</dt><dd>' + person(t.assigneeId, { title: 1 }) + '</dd><dt>Reviewer</dt><dd>' + person(t.reviewerId) + '</dd><dt>Start</dt><dd>' + fmtDate(t.startDate) + '</dd><dt>Due</dt><dd>' + fmtDate(t.dueDate) + (t.status !== 'completed' ? ' <span class="' + (isOverdue(t) ? 'down' : 'muted') + ' small">(' + dueLabel(t.dueDate) + ')</span>' : '') + '</dd><dt>Approval</dt><dd>' + badge(titleCase(t.approvalStatus), t.approvalStatus === 'approved' ? 'b-good' : t.approvalStatus === 'pending' ? 'b-brand' : t.approvalStatus === 'changes_requested' ? 'b-warn' : '') + '</dd></dl>' + (t.description ? '<div class="hr"></div><p style="margin:0">' + esc(t.description) + '</p>' : '') + '<div class="hr"></div><div class="small strong" style="margin-bottom:6px">Progress</div>' + prog) +
    card('Comments', '<div class="stack" style="gap:10px">' + (t.comments.length ? t.comments.map(c => '<div class="comment">' + avatar(c.userId, 'sm') + '<div class="bubble"><div class="row" style="justify-content:space-between"><b>' + esc(user(c.userId).name) + '</b><small>' + ago(c.at) + '</small></div>' + (c.kind ? '<div style="margin:2px 0">' + badge({ submission: 'Submitted work', approval: 'Approved', changes: 'Changes requested', blocker: 'Blocker' }[c.kind] || c.kind, { submission: 'b-brand', approval: 'b-good', changes: 'b-warn', blocker: 'b-bad' }[c.kind]) + '</div>' : '') + '<div>' + esc(c.text) + '</div></div></div>').join('') : '<div class="muted small">No comments yet.</div>') +
      '<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><textarea class="input" id="cmt-' + t.id + '" placeholder="Write a comment…" style="flex:1;min-height:44px"></textarea><button class="btn" data-act="task-comment" data-id="' + t.id + '">Post</button></div></div>') +
    card('Attachments', attachList(t.attachments, { act: 'task', id: t.id })) +
    card('History', historyTimeline(t.id)) + '</div>';
};
CHANGE['task-progress'] = el => { const t = get('tasks', el.dataset.id); const v = Number(el.value); audit('progress', 'task', t.id, 'Progress ' + t.progress + '% → ' + v + '%'); t.progress = v; refresh(); };
Object.assign(ACT, {
  'task-start': el => { setTaskStatus(get('tasks', el.dataset.id), 'in_progress'); toast('Work started'); refresh(); },
  'task-resume': el => { setTaskStatus(get('tasks', el.dataset.id), 'in_progress', 'Blocker resolved'); refresh(); },
  'task-submit': el => openSubmit(get('tasks', el.dataset.id)),
  'task-block': el => openBlocker(get('tasks', el.dataset.id)),
  'task-approve': el => { const t = get('tasks', el.dataset.id); reviewTask(t, 'approve', (document.getElementById('cmt-' + t.id) || {}).value || ''); toast('Approved — ' + t.key + ' completed' + (t.recurrence ? '. Next occurrence created.' : '')); refresh(); },
  'task-changes': el => {
    const t = get('tasks', el.dataset.id);
    openModal(modalShell('Request changes', field('What needs to change?', '<textarea class="input" name="comment" id="f_comment" required></textarea>', { hint: 'The assignee is notified and the task moves back to them.' }), '<button class="btn" data-act="close-modal">Cancel</button><button class="btn danger solid" data-act="task-changes-go" data-id="' + t.id + '">Send back</button>'));
  },
  'task-changes-go': el => { const v = formVals(); if (!v.comment.trim()) { toast('Add a comment so the assignee knows what to fix.', true); return; } reviewTask(get('tasks', el.dataset.id), 'changes', v.comment.trim()); closeModal(); toast('Sent back with changes requested'); refresh(); },
  'task-comment': el => { const t = get('tasks', el.dataset.id); const ta = document.getElementById('cmt-' + t.id); const v = ta.value.trim(); if (!v) return; t.comments.push({ id: uid('c'), userId: me().id, at: nowISO(), text: v }); audit('commented', 'task', t.id, 'Commented: “' + v.slice(0, 80) + (v.length > 80 ? '…' : '') + '”'); notify([t.assigneeId, t.reviewerId, t.creatorId], { type: 'task', title: 'New comment on ' + t.title, body: me().name + ': ' + v.slice(0, 80), link: { page: 'tasks', id: t.id } }); refresh(); },
  'task-delegate': el => {
    const t = get('tasks', el.dataset.id); const pool = assignableUsers().filter(x => x.id !== t.assigneeId);
    openModal(modalShell((t.assigneeId === me().id ? 'Delegate' : 'Reassign') + ' “' + esc(t.title) + '”', field('Assign to', selectF('to', userOptions(pool), pool[0] && pool[0].id)) + '<div style="height:12px"></div>' + field('Instructions (optional)', '<textarea class="input" name="note" id="f_note"></textarea>') + '<div style="height:12px"></div>' + noticeEl('You become the reviewer for the person you delegate to. The full chain is kept in the task history.'), '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="task-delegate-go" data-id="' + t.id + '">Delegate</button>'));
  },
  'task-delegate-go': el => { const v = formVals(); const t = get('tasks', el.dataset.id); delegateTask(t, v.to, v.note.trim()); closeModal(); toast('Delegated to ' + user(v.to).name); refresh(); },
  'task-edit': el => {
    const t = get('tasks', el.dataset.id);
    openModal(modalShell('Edit task', '<div class="form-grid">' + field('Title', inputEl('title', t.title), { full: 1 }) + field('Description', '<textarea class="input" name="description" id="f_description">' + esc(t.description) + '</textarea>', { full: 1 }) + field('Priority', selectF('priority', Object.entries(PRIORITY).map(([k, v]) => [k, v.label]), t.priority)) + field('Due date', inputEl('dueDate', t.dueDate, 'type="date"')) + field('Repeats', selectF('recurrence', [['', 'Does not repeat'], ['weekly', 'Weekly'], ['biweekly', 'Every 2 weeks'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly']], t.recurrence || '')) + '</div>', '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="task-edit-go" data-id="' + t.id + '">Save changes</button>'));
  },
  'task-edit-go': el => {
    const t = get('tasks', el.dataset.id); const v = formVals(); const ch = [];
    for (const k of ['title', 'description', 'priority', 'dueDate', 'recurrence']) { const nv = v[k] || (k === 'recurrence' ? null : ''); if ((t[k] || '') !== (nv || '')) { ch.push(k === 'dueDate' ? 'due ' + fmtShort(t.dueDate) + ' → ' + fmtShort(nv) : k === 'priority' ? 'priority ' + t.priority + ' → ' + nv : k); t[k] = nv; } }
    if (!t.title) { toast('Title is required', true); return; }
    if (ch.length) { audit('edited', 'task', t.id, 'Edited ' + ch.join(', ')); notify(t.assigneeId, { type: 'task', title: 'Task updated: ' + t.title, body: ch.join(', '), link: { page: 'tasks', id: t.id } }); }
    closeModal(); refresh();
  },
  'task-submit-go': el => { const t = get('tasks', el.dataset.id); const v = formVals(); if (App.ui.pendingFiles) { t.attachments.push(...App.ui.pendingFiles); audit('attached', 'task', t.id, 'Attached ' + App.ui.pendingFiles.map(f => f.name).join(', ')); App.ui.pendingFiles = null; } submitTask(t, v.note.trim()); closeModal(); toast('Submitted to ' + user(t.reviewerId).name + ' for review'); refresh(); },
  'task-block-go': el => { const t = get('tasks', el.dataset.id); const v = formVals(); if (!v.note.trim()) { toast('Describe the blocker', true); return; } t.comments.push({ id: uid('c'), userId: me().id, at: nowISO(), text: v.note.trim(), kind: 'blocker' }); setTaskStatus(t, 'blocked', v.note.trim()); closeModal(); refresh(); },
});
function openSubmit(t) {
  App.ui.pendingFiles = null;
  openModal(modalShell('Submit work for review', '<p class="muted" style="margin-top:0">' + esc(t.title) + ' goes to <b>' + esc(user(t.reviewerId).name) + '</b> for review.</p>' + field('Summary of what you did', '<textarea class="input" name="note" id="f_note" placeholder="What changed, where to find it, anything the reviewer should check"></textarea>') + '<div style="height:12px"></div>' + field('Attach deliverables', '<label class="btn sm" style="align-self:flex-start">' + icon('clip') + 'Choose files<input type="file" hidden multiple data-upload="modal"></label><div id="pending-files" class="stack" style="gap:6px"></div>'), '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="task-submit-go" data-id="' + t.id + '">' + icon('send') + 'Submit for review</button>'));
}
function openBlocker(t) { openModal(modalShell('Flag a blocker', field('What is blocking this work?', '<textarea class="input" name="note" id="f_note"></textarea>', { hint: user(t.reviewerId).name + ' will be notified.' }), '<button class="btn" data-act="close-modal">Cancel</button><button class="btn danger solid" data-act="task-block-go" data-id="' + t.id + '">Flag blocker</button>')); }

function openNewTask(pre) {
  pre = pre || {};
  if (!can('tasks.create')) { toast('Your role cannot create tasks. Ask your manager.', true); return; }
  const pool = assignableUsers();
  const pj = pre.project ? project(pre.project) : null;
  const cid = pj ? pj.companyId : (activeCompanyIds().includes(me().companyId) ? me().companyId : activeCompanyIds()[0]);
  App.ui.pendingFiles = null;
  openModal(modalShell('New task', '<div class="form-grid">' +
    field('Title', inputEl('title', '', 'placeholder="e.g. Prepare vendor comparison" required'), { full: 1 }) +
    field('Description', '<textarea class="input" name="description" id="f_description" placeholder="Context, acceptance criteria, links"></textarea>', { full: 1 }) +
    field('Company', selectF('companyId', companyOptions(), cid, 'data-act-change="nt-company"')) +
    field('Department', '<span id="nt-dept">' + selectF('departmentId', deptOptions(cid), pj ? pj.departmentId : (state.departments.find(d => d.companyId === cid && d.id === me().departmentId) || {}).id) + '</span>') +
    field('Project', '<span id="nt-proj">' + selectF('projectId', [['', 'No project']].concat(state.projects.filter(p => p.companyId === cid && p.status !== 'completed').map(p => [p.id, p.name])), pj ? pj.id : '') + '</span>') +
    field('Assign to', selectF('assigneeId', userOptions(pool), (pool.find(x => x.id !== me().id) || me()).id), { hint: 'People you can assign to, based on your reporting line and scope.' }) +
    field('Priority', selectF('priority', Object.entries(PRIORITY).map(([k, v]) => [k, v.label]), 'medium')) +
    field('Repeats', selectF('recurrence', [['', 'Does not repeat'], ['weekly', 'Weekly'], ['biweekly', 'Every 2 weeks'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly']], '')) +
    field('Start date', inputEl('startDate', TODAY_S, 'type="date"')) + field('Due date', inputEl('dueDate', rel(7), 'type="date"')) +
    field('Attachments', '<label class="btn sm" style="align-self:flex-start">' + icon('clip') + 'Choose files<input type="file" hidden multiple data-upload="modal"></label><div id="pending-files" class="stack" style="gap:6px"></div>', { full: 1 }) +
    '</div>', '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="new-task-go">Create task</button>'), true);
}
CHANGE['nt-company'] = el => {
  const cid = el.value;
  document.getElementById('nt-dept').innerHTML = selectF('departmentId', deptOptions(cid));
  document.getElementById('nt-proj').innerHTML = selectF('projectId', [['', 'No project']].concat(state.projects.filter(p => p.companyId === cid && p.status !== 'completed').map(p => [p.id, p.name])), '');
};
ACT['new-task-go'] = () => {
  const v = formVals();
  if (!v.title.trim()) { toast('Give the task a title', true); return; }
  if (v.dueDate < v.startDate) { toast('Due date is before the start date', true); return; }
  const t = createTask({ title: v.title.trim(), description: v.description.trim(), companyId: v.companyId, departmentId: v.departmentId, projectId: v.projectId || null, assigneeId: v.assigneeId, priority: v.priority, startDate: v.startDate, dueDate: v.dueDate, recurrence: v.recurrence || null, attachments: App.ui.pendingFiles || [] });
  App.ui.pendingFiles = null; closeModal(); toast('Task ' + t.key + ' created and assigned to ' + user(t.assigneeId).name); refresh();
};

/* ---------- Projects ---------- */
VIEWS.projects = function () {
  if (App.route.id) return projectDetail(App.route.id);
  const f = App.ui.pf || (App.ui.pf = { status: 'active', view: 'cards', company: 'all' });
  let ps = projectsInView();
  if (f.company !== 'all') ps = ps.filter(p => p.companyId === f.company);
  const counts = { active: ps.filter(p => p.status === 'active').length, proposed: ps.filter(p => p.status === 'proposed').length, on_hold: ps.filter(p => p.status === 'on_hold').length, completed: ps.filter(p => p.status === 'completed').length, all: ps.length };
  if (f.status !== 'all') ps = ps.filter(p => p.status === f.status);
  const showBudget = can('finance.view') || can('budget.view_own');
  let h = pageHead('Projects', projectsInView().length + ' projects in your scope', can('projects.manage') ? '<button class="btn primary" data-act="new-project">' + icon('plus') + 'New project</button>' : '');
  h += tabsEl([['active', 'Active', counts.active], ['proposed', 'Proposed', counts.proposed], ['on_hold', 'On hold', counts.on_hold], ['completed', 'Completed', counts.completed], ['all', 'All', counts.all]], f.status, 'pf-status');
  h += '<div class="filters">' + segEl([['cards', 'Cards'], ['table', 'Table']], f.view, 'pf-view') + (activeCompanyIds().length > 1 ? selectEl('pf-company', companyOptions(null, true), f.company, 'data-act-change="pf" data-k="company" aria-label="Company"') : '') + '</div>';
  if (!ps.length) return h + card('', emptyState('No projects here.'));
  if (f.view === 'cards') h += '<div class="grid g4">' + ps.map((p, i) => projectCard(p, i % 4 !== 0)).join('') + '</div>';
  else h += card('', tableEl([
    { h: 'Project', v: p => '<b>' + esc(p.name) + '</b><div class="muted small">' + esc(company(p.companyId).short) + ' · ' + esc(dept(p.departmentId).name) + '</div>' },
    { h: 'Owner', v: p => person(p.ownerId) },
    { h: 'Status', v: p => badge(PROJECT_STATUS[p.status][0], PROJECT_STATUS[p.status][1]) },
    { h: 'Health', v: p => { const s = projectStats(p); return badge(HEALTH[s.health][0], HEALTH[s.health][1]); } },
    { h: 'Progress', v: p => { const s = projectStats(p); return '<div class="row" style="flex-wrap:nowrap"><div style="width:80px">' + progressBar(s.progress) + '</div><span class="num small">' + s.progress + '%</span></div>'; } },
    { h: 'Tasks', r: 1, v: p => { const s = projectStats(p); return s.done + '/' + s.total + (s.overdue ? ' <span class="down">(' + s.overdue + ' late)</span>' : ''); } },
  ].concat(showBudget ? [{ h: 'Budget used', r: 1, v: p => { const s = projectStats(p); return p.budget ? money(s.spent, { compact: true }) + ' / ' + money(p.budget, { compact: true }) : '—'; } }] : []).concat([{ h: 'Due', nowrap: 1, v: p => fmtShort(p.dueDate) }]), ps, { rowAct: 'open-project' }), { flush: true });
  return h;
};
Object.assign(ACT, {
  'pf-status': el => { App.ui.pf.status = el.dataset.v; render(); },
  'pf-view': el => { App.ui.pf.view = el.dataset.v; render(); },
  'new-project': () => openNewProject(),
  'back-projects': () => go('projects'),
});
CHANGE.pf = el => { App.ui.pf[el.dataset.k] = el.value; render(); };
function projectDetail(id) {
  const p = project(id);
  if (!p || !visibleProject(p)) return pageHead('Project not available', 'It may be outside your access scope.') + '<button class="btn" data-act="back-projects">' + icon('arrowL') + 'Back to projects</button>';
  const s = projectStats(p); const showBudget = can('finance.view') || (can('budget.view_own') && (p.ownerId === me().id || deptTree(me().departmentId).includes(p.departmentId)));
  const manage = can('projects.manage') && (p.ownerId === me().id || visibleProject(p) && me().scope !== 'self');
  const pendingAp = state.approvals.find(a => a.projectId === p.id && a.type === 'project' && a.status === 'pending');
  let h = '<button class="btn ghost sm" data-act="back-projects" style="margin-bottom:10px">' + icon('arrowL') + 'All projects</button>';
  h += pageHead(esc(p.name), esc(company(p.companyId).name) + ' · ' + esc(dept(p.departmentId).name) + ' · Owner ' + esc(user(p.ownerId).name), (can('tasks.create') ? '<button class="btn" data-act="new-task" data-project="' + p.id + '">' + icon('plus') + 'Add task</button>' : '') + (manage ? selectEl('proj-status', Object.entries(PROJECT_STATUS).map(([k, v]) => [k, v[0]]), p.status, 'data-act-change="proj-status" data-id="' + p.id + '" aria-label="Project status"' + (p.status === 'proposed' && pendingAp ? ' disabled' : '')) : ''));
  h += '<div class="row" style="margin:-8px 0 16px">' + badge(PROJECT_STATUS[p.status][0], PROJECT_STATUS[p.status][1]) + badge(HEALTH[s.health][0], HEALTH[s.health][1]) + prioBadge(p.priority) + '<span class="muted small">' + fmtDate(p.startDate) + ' → ' + fmtDate(p.dueDate) + '</span></div>';
  if (p.status === 'proposed') h += noticeEl(pendingAp ? 'This project is waiting for approval (<button class="link" data-act="open" data-t="approval" data-id="' + pendingAp.id + '">' + pendingAp.no + '</button>). It becomes Active automatically once approved.' : 'Proposed project. Submit it for approval to activate it.', 'warn', 'stamp') + '<div style="height:16px"></div>';
  h += '<div class="grid g4" style="margin-bottom:16px">' + kpiTile('Progress', s.progress + '%', progressBar(s.progress), { hero: true }) + kpiTile('Tasks done', s.done + ' / ' + s.total, '<span class="muted">' + (s.total - s.done) + ' open</span>') + kpiTile('Overdue tasks', String(s.overdue), '<span class="' + (s.overdue ? 'down' : 'up') + '">' + (s.overdue ? 'Needs follow-up' : 'On schedule') + '</span>') +
    (showBudget ? kpiTile('Budget spent', p.budget ? money(s.spent, { compact: true }) : '—', p.budget ? '<span class="' + (s.spent > p.budget ? 'down' : 'muted') + '">' + pct(s.spent, p.budget) + '% of ' + money(p.budget, { compact: true }) + '</span>' : '<span class="muted">No budget set</span>') : kpiTile('Due', fmtShort(p.dueDate), '<span class="muted">' + dueLabel(p.dueDate).replace('Due ', '') + '</span>')) + '</div>';
  const tasks = s.tasks.filter(visibleTask);
  h += '<div class="grid g-2-1" style="margin-bottom:16px">' + card('Tasks', tableEl([
    { h: 'Task', v: t => '<b>' + esc(t.title) + '</b><div class="muted small mono">' + t.key + '</div>' }, { h: 'Assignee', v: t => person(t.assigneeId) }, { h: 'Status', v: t => taskStatusBadge(t) }, { h: 'Due', nowrap: 1, v: t => fmtShort(t.dueDate) }],
    tasks.sort((a, b) => (a.status === 'completed') - (b.status === 'completed') || (a.dueDate < b.dueDate ? -1 : 1)), { rowAct: 'open-task', empty: 'No tasks yet.' }), { flush: true, sub: tasks.length + ' visible to you' }) +
    '<div class="stack">' + card('About', '<p style="margin:0 0 12px">' + esc(p.description) + '</p><div class="small strong" style="margin-bottom:8px">Team</div><div class="stack" style="gap:8px">' + [p.ownerId].concat(p.members).map(id => person(id, { title: 1 })).join('') + '</div>') +
    card('Risks & issues', (() => { const rs = state.risks.filter(r => r.projectId === p.id); return rs.length ? '<div class="list">' + rs.map(r => '<div class="li clickable" data-act="open" data-t="risk" data-id="' + r.id + '"><div class="grow"><div class="ttl">' + esc(r.title) + '</div><div class="meta">' + r.key + ' · ' + titleCase(r.status) + '</div></div>' + sevBadge(r.severity) + '</div>').join('') + '</div>' : emptyState('No risks logged.'); })(), { flush: true }) + '</div></div>';
  const docs = state.documents.filter(d => d.linked && d.linked.id === p.id && (!d.confidential || can('finance.confidential')));
  h += '<div class="grid g2">' + card('Documents', docs.length ? '<div class="stack" style="gap:8px">' + docs.map(d => '<div class="file">' + icon('file') + '<div style="flex:1"><b>' + esc(d.name) + '</b><div class="muted small">' + esc(user(d.uploadedBy).name) + ' · ' + ago(d.at) + '</div></div>' + (d.confidential ? badge('Confidential', 'b-warn', true) : '') + '</div>').join('') + '</div>' : emptyState('No documents linked.')) + card('Activity', historyTimeline(p.id, 12)) + '</div>';
  return h;
}
CHANGE['proj-status'] = el => { const p = project(el.dataset.id); const old = p.status; p.status = el.value; audit('status', 'project', p.id, 'Status ' + PROJECT_STATUS[old][0] + ' → ' + PROJECT_STATUS[p.status][0]); notify(p.members.concat(p.ownerId), { type: 'task', title: 'Project ' + p.name + ' is now ' + PROJECT_STATUS[p.status][0], body: 'Changed by ' + me().name, link: { page: 'projects', id: p.id } }); toast('Project status updated'); render(); };
function sevBadge(s) { return badge(titleCase(s), { low: '', medium: 'b-info', high: 'b-warn', critical: 'b-bad' }[s]); }
function openNewProject() {
  const cid = activeCompanyIds().includes(me().companyId) ? me().companyId : activeCompanyIds()[0];
  const people = state.users.filter(u => scopeCompanyIds().includes(u.companyId) && u.active !== false);
  openModal(modalShell('New project', '<div class="form-grid">' + field('Project name', inputEl('name', ''), { full: 1 }) + field('Description', '<textarea class="input" name="description" id="f_description"></textarea>', { full: 1 }) +
    field('Company', selectF('companyId', companyOptions(), cid, 'data-act-change="np-company"')) + field('Department', '<span id="np-dept">' + selectF('departmentId', deptOptions(cid)) + '</span>') +
    field('Owner', selectF('ownerId', userOptions(people), me().id)) + field('Priority', selectF('priority', Object.entries(PRIORITY).map(([k, v]) => [k, v.label]), 'medium')) +
    field('Start date', inputEl('startDate', TODAY_S, 'type="date"')) + field('Due date', inputEl('dueDate', rel(60), 'type="date"')) +
    field('Budget (' + state.settings.currency + ')', inputEl('budget', '0', 'type="number" min="0" step="500"'), { hint: 'Every new project is routed for approval using the project rules in Settings.' }) +
    field('Team members', '<select class="select" name="members" id="f_members" multiple size="5">' + people.map(u => '<option value="' + u.id + '">' + esc(u.name) + ' — ' + esc(company(u.companyId).short) + '</option>').join('') + '</select>', { hint: 'Ctrl/Cmd-click to select several.' }) + '</div>',
    '<button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="new-project-go">Create & submit for approval</button>'), true);
}
CHANGE['np-company'] = el => { document.getElementById('np-dept').innerHTML = selectF('departmentId', deptOptions(el.value)); };
ACT['new-project-go'] = () => {
  const v = formVals(); const members = [...document.getElementById('f_members').selectedOptions].map(o => o.value);
  if (!v.name.trim()) { toast('Name the project', true); return; }
  const p = { id: uid('p'), name: v.name.trim(), description: v.description.trim(), companyId: v.companyId, departmentId: v.departmentId, ownerId: v.ownerId, members, status: 'proposed', priority: v.priority, startDate: v.startDate, dueDate: v.dueDate, budget: Number(v.budget) || 0, spentBase: 0, createdAt: nowISO() };
  state.projects.unshift(p);
  audit('created', 'project', p.id, 'Created project “' + p.name + '” (proposed)');
  const a = createApproval({ type: 'project', title: 'New project: ' + p.name, description: p.description, amount: p.budget, companyId: p.companyId, departmentId: p.departmentId, projectId: p.id });
  closeModal(); toast('Project created and sent for approval (' + a.no + ')'); go('projects', { id: p.id });
};
