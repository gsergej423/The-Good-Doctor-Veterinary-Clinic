/* =========================================================
   Лабораторная работа №3 — Вариант 2 (ветклиника)
   Валидация формы записи питомца + сохранение в localStorage
   ========================================================= */

"use strict";

const STORAGE_KEY = "vet_appointments";

/* Иконки для типов питомцев */
const TYPE_ICONS = {
  "Кошка": "🐱",
  "Собака": "🐶",
  "Птица": "🐦",
  "Грызун": "🐹",
  "Рептилия": "🦎",
  "Другое": "🐾",
};

/* ---------- DOM-элементы ---------- */
const form = document.getElementById("appointmentForm");
const listEl = document.getElementById("appointmentsList");
const emptyEl = document.getElementById("emptyMessage");
const successEl = document.getElementById("successMessage");
const illnessInput = document.getElementById("illness");
const illnessCounter = document.getElementById("illnessCounter");

/* ---------- Правила валидации ---------- */
const validators = {
  petName(value) {
    const v = value.trim();
    if (!v) return "Укажите имя питомца";
    if (v.length < 2) return "Имя должно содержать минимум 2 символа";
    if (v.length > 30) return "Имя должно содержать не более 30 символов";
    if (!/^[А-Яа-яЁёA-Za-z\s\-]+$/.test(v))
      return "Допустимы только буквы, пробел и дефис";
    return "";
  },

  petAge(value) {
    if (value.trim() === "") return "Укажите возраст питомца";
    const n = Number(value);
    if (Number.isNaN(n)) return "Возраст должен быть числом";
    if (n < 0) return "Возраст не может быть отрицательным";
    if (n > 60) return "Проверьте возраст — максимум 60 лет";
    return "";
  },

  ownerName(value) {
    const v = value.trim();
    if (!v) return "Укажите имя владельца";
    if (v.length < 2) return "Имя должно содержать минимум 2 символа";
    if (v.length > 50) return "Имя должно содержать не более 50 символов";
    if (!/^[А-Яа-яЁёA-Za-z\s\-]+$/.test(v))
      return "Допустимы только буквы, пробел и дефис";
    return "";
  },

  petType(value) {
    return value ? "" : "Выберите тип питомца";
  },

  phone(value) {
    const v = value.trim();
    if (!v) return "Укажите номер телефона";
    if (!/^[+]?[\d\s()\-]+$/.test(v))
      return "Недопустимые символы в номере телефона";
    const digits = v.replace(/\D/g, "");
    if (digits.length < 10) return "Номер должен содержать минимум 10 цифр";
    if (digits.length > 15) return "Номер должен содержать максимум 15 цифр";
    return "";
  },

  illness(value) {
    const v = value.trim();
    if (!v) return "Опишите проблему питомца";
    if (v.length < 10) return "Описание должно содержать минимум 10 символов";
    if (v.length > 500) return "Описание должно содержать не более 500 символов";
    return "";
  },
};

/* ---------- Работа с сообщениями об ошибках ---------- */
function showError(name, message) {
  const input = form.elements[name];
  const errorEl = document.getElementById(name + "Error");

  if (errorEl) errorEl.textContent = message;

  if (input) {
    input.classList.toggle("is-invalid", Boolean(message));
    input.classList.toggle("is-valid", !message && input.value.trim() !== "");
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }
}

function validateField(name) {
  const input = form.elements[name];
  if (!input || !validators[name]) return true;

  const message = validators[name](input.value);
  showError(name, message);
  return message === "";
}

function validateForm() {
  let isValid = true;
  let firstInvalid = null;

  Object.keys(validators).forEach((name) => {
    const ok = validateField(name);
    if (!ok) {
      isValid = false;
      if (!firstInvalid) firstInvalid = form.elements[name];
    }
  });

  if (firstInvalid) firstInvalid.focus();
  return isValid;
}

/* ---------- Живая валидация ---------- */
Object.keys(validators).forEach((name) => {
  const input = form.elements[name];
  if (!input) return;

  // проверка при потере фокуса
  input.addEventListener("blur", () => validateField(name));

  // снимаем ошибку по мере исправления
  input.addEventListener("input", () => {
    if (input.classList.contains("is-invalid")) validateField(name);
  });

  if (input.tagName === "SELECT") {
    input.addEventListener("change", () => validateField(name));
  }
});

/* Счётчик символов в textarea */
illnessInput.addEventListener("input", () => {
  illnessCounter.textContent = illnessInput.value.length;
});

/* Фильтр символов в поле телефона */
form.elements.phone.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^\d+\-()\s]/g, "");
});

/* ---------- localStorage ---------- */
function loadAppointments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn("Не удалось прочитать записи:", e);
    return [];
  }
}

function saveAppointments(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Не удалось сохранить записи:", e);
  }
}

/* ---------- Безопасный вывод (защита от XSS) ---------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------- Отрисовка списка записей ---------- */
function renderAppointments() {
  const items = loadAppointments();
  listEl.innerHTML = "";

  if (items.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  // новые записи сверху
  items
    .slice()
    .reverse()
    .forEach((item) => {
      const card = document.createElement("article");
      card.className = "appointment";

      const icon = TYPE_ICONS[item.petType] || "🐾";

      card.innerHTML = `
        <div class="appointment__head">
          <span class="appointment__type">${icon} ${escapeHtml(item.petType)}</span>
          <button
            type="button"
            class="appointment__delete"
            data-id="${escapeHtml(item.id)}"
            title="Удалить запись"
            aria-label="Удалить запись"
          >✕</button>
        </div>
        <h3 class="appointment__title">
          ${escapeHtml(item.petName)}, ${escapeHtml(item.petAge)} лет
        </h3>
        <p class="appointment__owner">Владелец: ${escapeHtml(item.ownerName)}</p>
        <p class="appointment__illness">${escapeHtml(item.illness)}</p>
        <p class="appointment__phone">📞 ${escapeHtml(item.phone)}</p>
        <p class="appointment__date">Создано: ${escapeHtml(item.createdAt)}</p>
      `;

      listEl.appendChild(card);
    });
}

/* ---------- Удаление записи ---------- */
listEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".appointment__delete");
  if (!btn) return;

  const id = btn.dataset.id;
  if (!confirm("Удалить эту запись?")) return;

  const items = loadAppointments().filter((item) => String(item.id) !== id);
  saveAppointments(items);
  renderAppointments();
});

/* ---------- Отправка формы ---------- */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  successEl.hidden = true;

  if (!validateForm()) return;

  const record = {
    id: Date.now().toString(),
    petName: form.elements.petName.value.trim(),
    petAge: form.elements.petAge.value.trim(),
    ownerName: form.elements.ownerName.value.trim(),
    petType: form.elements.petType.value,
    illness: form.elements.illness.value.trim(),
    phone: form.elements.phone.value.trim(),
    createdAt: new Date().toLocaleString("ru-RU"),
  };

  const items = loadAppointments();
  items.push(record);
  saveAppointments(items);

  renderAppointments();

  // очистка формы
  form.reset();
  illnessCounter.textContent = "0";
  Object.keys(validators).forEach((name) => showError(name, ""));

  // сообщение об успехе
  successEl.hidden = false;
  successEl.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => {
    successEl.hidden = true;
  }, 5000);
});

/* ---------- Инициализация ---------- */
renderAppointments();