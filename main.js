// STATE 
let tasks         = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
let currentFilter = 'all';
let currentCat    = 'all';
let editId        = null;
let isEditMode    = false;

// SAVE 
function saveTasks() {
  localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

// OPEN ADD MODAL
function openAddModal() {
  isEditMode = false;
  editId     = null;
  document.getElementById('modalTitle').textContent    = 'New Task';
  document.getElementById('taskInput').value           = '';
  document.getElementById('prioritySelect').value      = 'medium';
  document.getElementById('categorySelect').value      = 'general';
  document.getElementById('saveBtn').innerHTML         = '<i class="bi bi-check-lg"></i> Save Task';
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('taskInput').focus(), 100);
}

// OPEN EDIT MODAL
function openEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  isEditMode = true;
  editId     = id;
  document.getElementById('modalTitle').textContent    = 'Edit Task';
  document.getElementById('taskInput').value           = task.text;
  document.getElementById('prioritySelect').value      = task.priority;
  document.getElementById('categorySelect').value      = task.category;
  document.getElementById('saveBtn').innerHTML         = '<i class="bi bi-pencil-fill"></i> Update Task';
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('taskInput').focus(), 100);
}

// SAVE TASK (ADD OR EDIT) 
function saveTask() {
  const text     = document.getElementById('taskInput').value.trim();
  const priority = document.getElementById('prioritySelect').value;
  const category = document.getElementById('categorySelect').value;

  if (!text) {
    const input = document.getElementById('taskInput');
    input.style.borderColor = '#ef4444';
    setTimeout(() => input.style.borderColor = '', 1000);
    return;
  }

  if (isEditMode && editId) {
    tasks = tasks.map(t =>
      t.id === editId ? { ...t, text, priority, category } : t
    );
  } else {
    tasks.unshift({
      id:        Date.now(),
      text,
      priority,
      category,
      completed: false,
      date:      new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  }

  saveTasks();
  closeModal();
  renderTasks();
}

// CLOSE MODAL
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editId     = null;
  isEditMode = false;
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

// TOGGLE COMPLETE 
function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks();
  renderTasks();
}

// DELETE
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

// FILTER BY STATUS 
function filterTasks(filter) {
  currentFilter = filter;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`filter-${filter}`).classList.add('active');
  renderTasks();
}

//  FILTER BY CATEGORY
function filterCategory(cat) {
  currentCat = cat;
  document.querySelectorAll('.cat-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`cat-${cat}`).classList.add('active');
  renderTasks();
}

// CLEAR 
function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
}

function clearAll() {
  if (!confirm('Delete all tasks?')) return;
  tasks = [];
  saveTasks();
  renderTasks();
}

// CATEGORY LABEL 
function catLabel(cat) {
  const map = { general: '📌 General', work: '💼 Work', study: '📚 Study', personal: '👤 Personal' };
  return map[cat] || cat;
}

// RENDER
function renderTasks() {
  const search = document.getElementById('searchInput').value.toLowerCase();

  const filtered = tasks.filter(t => {
    const matchStatus =
      currentFilter === 'all'       ? true :
      currentFilter === 'pending'   ? !t.completed :
      currentFilter === 'completed' ? t.completed : true;
    const matchCat    = currentCat === 'all' ? true : t.category === currentCat;
    const matchSearch = t.text.toLowerCase().includes(search);
    return matchStatus && matchCat && matchSearch;
  });

  // UPDATE COUNTS 
  const total   = tasks.length;
  const done    = tasks.filter(t => t.completed).length;
  const pending = total - done;
  const high    = tasks.filter(t => t.priority === 'high' && !t.completed).length;

  document.getElementById('totalCount').textContent   = total;
  document.getElementById('pendingCount').textContent = pending;
  document.getElementById('doneCount').textContent    = done;
  document.getElementById('highCount').textContent    = high;
  document.getElementById('allBadge').textContent     = total;
  document.getElementById('pendingBadge').textContent = pending;
  document.getElementById('doneBadge').textContent    = done;

  // PROGRESS CIRCLE
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
  const circle = document.getElementById('progressCircle');
  const offset = 201 - (201 * pct) / 100;
  circle.style.strokeDashoffset = offset;
  document.getElementById('progPercent').textContent = `${pct}%`;

  //  DATE 
  document.getElementById('dateDisplay').textContent =
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // SHOW/HIDE 
  const list      = document.getElementById('taskList');
  const empty     = document.getElementById('emptyState');
  const bottomBar = document.getElementById('bottomBar');

  empty.style.display     = filtered.length === 0 ? 'block' : 'none';
  bottomBar.style.display = tasks.length > 0       ? 'flex'  : 'none';

  //  RENDER ITEMS 
  list.innerHTML = filtered.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}">
      <div class="task-check ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})">
        ${task.completed ? '<i class="bi bi-check-lg"></i>' : ''}
      </div>
      <div class="task-info">
        <div class="task-text">${escapeHtml(task.text)}</div>
        <div class="task-meta">
          <span class="badge ${task.priority}">${task.priority.toUpperCase()}</span>
          <span class="badge cat">${catLabel(task.category)}</span>
          <span class="task-date">${task.date}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn" onclick="openEdit(${task.id})" title="Edit">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="action-btn delete" onclick="deleteTask(${task.id})" title="Delete">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// ESCAPE HTML 
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ENTER KEY 
document.getElementById('taskInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') saveTask();
});

//  SIDEBAR TOGGLE (MOBILE) 
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}
function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// Close sidebar when nav item clicked on mobile
document.querySelectorAll('.nav-item, .cat-item').forEach(btn => {
  btn.addEventListener('click', () => {
    if (window.innerWidth <= 768) closeSidebar();
  });
});

// INIT 
renderTasks();
