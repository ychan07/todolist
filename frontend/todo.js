const API_BASE = '/api';

const CHECK_SVG = `
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7.2l2.8 2.8L11 4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

const pendingList = document.querySelector('[data-column="pending"] .todo-list');
const completedList = document.querySelector('[data-column="completed"] .todo-list');
const failedList = document.querySelector('[data-column="failed"] .todo-list');
const modal = document.getElementById("todoModal");
const modalTitle = document.getElementById("todoModalTitle");
const modalDesc = document.getElementById("todoModalDesc");
const detailModal = document.getElementById("detailModal");
const detailTitle = document.getElementById("detailTitle");
const detailDue = document.getElementById("detailDue");
const detailDeleteBtn = document.getElementById("detailDeleteBtn");
const deleteModal = document.getElementById("deleteModal");
const editModal = document.getElementById("editModal");
const editTitleInput = document.getElementById("editTitleInput");
const editDueInput = document.getElementById("editDueInput");
const addModal = document.getElementById("addModal");
const addTitleInput = document.getElementById("addTitleInput");
const addDueInput = document.getElementById("addDueInput");

let pendingUncheckItem = null;
let detailItem = null;

function anyModalOpen() {
  return !modal.hidden || !detailModal.hidden || !deleteModal.hidden || !editModal.hidden || !addModal.hidden;
} //flase 혹은 true로 반환

function syncBodyScroll() {
  document.body.classList.toggle("todo-modal-open", anyModalOpen());
}

function getTitle(item) {
  return item.querySelector(".todo-item__title").textContent.trim();
}

function getDue(item) {
  const dueEl = item.querySelector(".todo-item__due");
  if (dueEl) {
    return dueEl.textContent.trim();
  }
  return item.dataset.due || "";
}

function setCheckButton(button, done) {
  button.classList.toggle("todo-item__check--done", done);
  button.innerHTML = done ? CHECK_SVG : "";
}

async function moveToCompleted(item) {
  const due = getDue(item);
  if (due) {
    item.dataset.due = due;
  }

  const dueEl = item.querySelector(".todo-item__due");
  if (dueEl) {
    dueEl.remove();
  }

  item.classList.remove("todo-item--failed");
  item.classList.add("todo-item--done");
  setCheckButton(item.querySelector(".todo-item__check"), true);
  completedList.appendChild(item);

  const id = item.dataset.id;
  if (id) {
    try {
      await fetch(`${API_BASE}/todos/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'completed' })
      });
    } catch (err) {
      console.error(err);
    }
  }
}
//무한 재활용 가능?

async function moveToPending(item) {
  item.classList.remove("todo-item--done", "todo-item--failed");

  const body = item.querySelector(".todo-item__body");
  const dueText = item.dataset.due;
  if (dueText && body && !body.querySelector(".todo-item__due")) {
    const dueEl = document.createElement("span");
    dueEl.className = "todo-item__due";
    dueEl.textContent = dueText;
    body.appendChild(dueEl);
  }

  setCheckButton(item.querySelector(".todo-item__check"), false);
  pendingList.appendChild(item);

  const id = item.dataset.id;
  if (id) {
    try {
      await fetch(`${API_BASE}/todos/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'pending' })
      });
    } catch (err) {
      console.error(err);
    }
  }
}

function openModal(item) {
  const title = getTitle(item);
  pendingUncheckItem = item;
  modalTitle.textContent = `${title} 를(을) to do 상태로 바꾸시겠습니까?`;
  modalDesc.textContent = `바꿀 경우 ${title} 는(은) to do목록에 표시됩니다.`;
  modal.hidden = false;
  syncBodyScroll();
}

function closeModal() {
  pendingUncheckItem = null;
  modal.hidden = true;
  syncBodyScroll();
}

function openDetailModal(item) {
  detailItem = item;
  detailTitle.textContent = getTitle(item);
  detailDue.textContent = getDue(item);
  detailDeleteBtn.classList.remove("is-muted");
  detailModal.hidden = false;
  syncBodyScroll();
  positionAtItem(detailModal.querySelector(".detail-modal__dialog"), item);
}

function positionAtItem(dialog, item) {
  const column = item.closest(".todo-column");
  const columnRect = column.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const margin = 12;

  dialog.style.width = `${columnRect.width}px`;

  const dialogHeight = dialog.offsetHeight;
  let top = itemRect.top;
  let left = columnRect.left;

  const maxTop = window.innerHeight - dialogHeight - margin;
  const maxLeft = window.innerWidth - dialog.offsetWidth - margin;
  top = Math.max(margin, Math.min(top, maxTop));
  left = Math.max(margin, Math.min(left, maxLeft));

  dialog.style.top = `${top}px`;
  dialog.style.left = `${left}px`;
}

function closeDetailModal() {
  closeDeleteModal();
  closeEditModal(false);
  detailItem = null;
  detailDeleteBtn.classList.remove("is-muted");
  detailModal.hidden = true;
  syncBodyScroll();
}

function openDeleteModal() {
  detailDeleteBtn.classList.add("is-muted");
  deleteModal.hidden = false;
  syncBodyScroll();
}

function closeDeleteModal() {
  deleteModal.hidden = true;
  detailDeleteBtn.classList.remove("is-muted");
  syncBodyScroll();
}

async function confirmDelete() {
  if (!detailItem) return;

  const id = detailItem.dataset.id;
  if (id) {
    try {
      await fetch(`${API_BASE}/todos/${id}/`, {
        method: 'DELETE',
        credentials: 'include'
      });
    } catch (err) {
      console.error(err);
    }
  }

  detailItem.remove();
  detailItem = null;
  deleteModal.hidden = true;
  detailDeleteBtn.classList.remove("is-muted");
  detailModal.hidden = true;
  syncBodyScroll();
}

function openEditModal() {
  if (!detailItem) return;

  const dialog = editModal.querySelector(".edit-modal__dialog");
  dialog.style.top = "";
  dialog.style.left = "";
  dialog.style.width = "";

  editTitleInput.value = getTitle(detailItem);
  editDueInput.value = getDue(detailItem);
  detailModal.hidden = true;
  editModal.hidden = false;
  syncBodyScroll();
  editTitleInput.focus();
}

function closeEditModal(reopenDetail) {
  editModal.hidden = true;
  if (reopenDetail && detailItem) {
    detailTitle.textContent = getTitle(detailItem);
    detailDue.textContent = getDue(detailItem);
    detailModal.hidden = false;
    positionAtItem(detailModal.querySelector(".detail-modal__dialog"), detailItem);
  }
  syncBodyScroll();
}

async function saveEdit() {
  if (!detailItem) return;

  const title = editTitleInput.value.trim();
  const due = editDueInput.value.trim();
  if (!title) {
    editTitleInput.focus();
    return;
  }

  detailItem.querySelector(".todo-item__title").textContent = title;

  let dueEl = detailItem.querySelector(".todo-item__due");
  if (due) {
    if (!dueEl) {
      dueEl = document.createElement("span");
      dueEl.className = "todo-item__due";
      detailItem.querySelector(".todo-item__body").appendChild(dueEl);
    }
    dueEl.textContent = due;
    detailItem.dataset.due = due;
  } else if (dueEl) {
    dueEl.remove();
    delete detailItem.dataset.due;
  }

  const id = detailItem.dataset.id;
  if (id) {
    try {
      await fetch(`${API_BASE}/todos/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, due_date: due })
      });
    } catch (err) {
      console.error(err);
    }
  }

  editModal.hidden = true;
  detailItem = null;
  detailModal.hidden = true;
  syncBodyScroll();
}

function formatDueFromDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}까지`;
}

function createTodoItem(id, title, due, status = 'pending') {
  const item = document.createElement("li");
  item.className = "todo-item";
  if (id) item.dataset.id = id;

  const body = document.createElement("div");
  body.className = "todo-item__body";

  const titleEl = document.createElement("span");
  titleEl.className = "todo-item__title";
  titleEl.textContent = title;
  body.appendChild(titleEl);

  if (due && status !== 'completed') {
    const dueEl = document.createElement("span");
    dueEl.className = "todo-item__due";
    dueEl.textContent = due;
    body.appendChild(dueEl);
  }
  if (due) {
    item.dataset.due = due;
  }

  const check = document.createElement("button");
  check.className = "todo-item__check";
  check.type = "button";

  if (status === 'completed') {
    item.classList.add("todo-item--done");
    setCheckButton(check, true);
  } else if (status === 'failed') {
    item.classList.add("todo-item--failed");
    setCheckButton(check, false);
  }

  item.appendChild(body);
  item.appendChild(check);
  return item;
}

function openAddModal() {
  addTitleInput.value = "";
  addDueInput.value = "";
  addModal.hidden = false;
  syncBodyScroll();
  addTitleInput.focus();
}

function closeAddModal() {
  addModal.hidden = true;
  syncBodyScroll();
}

async function saveAdd() {
  const title = addTitleInput.value.trim();
  if (!title) {
    addTitleInput.focus();
    return;
  }

  const due = formatDueFromDate(addDueInput.value);

  try {
    const res = await fetch(`${API_BASE}/todos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, due_date: due, status: 'pending' })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      pendingList.appendChild(createTodoItem(data.todo.id, data.todo.title, data.todo.due_date, data.todo.status));
      closeAddModal();
    }
  } catch (err) {
    console.error(err);
  }
}

async function checkAuthAndLoadTodos() {
  try {
    const res = await fetch(`${API_BASE}/me/`, { credentials: 'include' });
    const data = await res.json();
    if (!data.authenticated) {
      window.location.href = '/';
      return;
    }
    const nameEl = document.querySelector('.todo-header__name');
    if (nameEl && data.user) {
      nameEl.textContent = `${data.user.name}님`;
    }
    loadTodos();
  } catch (err) {
    console.error('인증 확인 실패:', err);
  }
}

async function loadTodos() {
  try {
    const res = await fetch(`${API_BASE}/todos/`, { credentials: 'include' });
    const data = await res.json();
    if (res.ok && data.todos) {
      pendingList.innerHTML = '';
      completedList.innerHTML = '';
      if (failedList) failedList.innerHTML = '';

      data.todos.forEach(todo => {
        const item = createTodoItem(todo.id, todo.title, todo.due_date, todo.status);
        if (todo.status === 'completed') {
          completedList.appendChild(item);
        } else if (todo.status === 'failed') {
          if (failedList) failedList.appendChild(item);
        } else {
          pendingList.appendChild(item);
        }
      });
    }
  } catch (err) {
    console.error('Todo 로딩 실패:', err);
  }
}

// Event Listeners
document.querySelector(".todo-board").addEventListener("click", (event) => {
  if (event.target.closest(".todo-column__add")) {
    openAddModal();
    return;
  }

  const checkBtn = event.target.closest(".todo-item__check");
  if (checkBtn) {
    const item = checkBtn.closest(".todo-item");
    const column = checkBtn.closest("[data-column]").dataset.column;

    if (column === "pending") {
      moveToCompleted(item);
      return;
    }

    if (column === "completed") {
      openModal(item);
    }
    return;
  }

  const titleEl = event.target.closest(".todo-item__title");
  if (!titleEl) return;

  const column = titleEl.closest("[data-column]").dataset.column;
  if (column !== "pending") return;

  openDetailModal(titleEl.closest(".todo-item"));
});

modal.addEventListener("click", (event) => {
  if (event.target.closest("[data-modal-dismiss]")) {
    closeModal();
    return;
  }

  if (event.target.closest("[data-modal-confirm]") && pendingUncheckItem) {
    const item = pendingUncheckItem;
    closeModal();
    moveToPending(item);
  }
});

detailModal.addEventListener("click", (event) => {
  if (event.target.closest(".detail-modal__edit")) {
    openEditModal();
    return;
  }

  if (event.target.closest(".detail-modal__delete")) {
    openDeleteModal();
    return;
  }

  if (event.target.closest("[data-detail-close]")) {
    if (!deleteModal.hidden) {
      closeDeleteModal();
      return;
    }
    closeDetailModal();
  }
});

deleteModal.addEventListener("click", (event) => {
  if (event.target.closest("[data-delete-cancel]")) {
    closeDeleteModal();
    return;
  }

  if (event.target.closest("[data-delete-confirm]")) {
    confirmDelete();
  }
});

editModal.addEventListener("click", (event) => {
  if (event.target.closest("[data-edit-cancel]")) {
    closeEditModal(true);
    return;
  }

  if (event.target.closest("[data-edit-save]")) {
    saveEdit();
  }
});

addModal.addEventListener("click", (event) => {
  if (event.target.closest("[data-add-cancel]")) {
    closeAddModal();
    return;
  }

  if (event.target.closest("[data-add-save]")) {
    saveAdd();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (!deleteModal.hidden) {
    closeDeleteModal();
    return;
  }

  if (!addModal.hidden) {
    closeAddModal();
    return;
  }

  if (!editModal.hidden) {
    closeEditModal(true);
    return;
  }

  if (!detailModal.hidden) {
    closeDetailModal();
    return;
  }

  if (!modal.hidden) {
    closeModal();
  }
});

const logoutBtn = document.querySelector('.todo-header__logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/logout/`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error(err);
    }
    window.location.href = '/';
  });
}


checkAuthAndLoadTodos(); //최초 로드
