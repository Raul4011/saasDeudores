const STORAGE_KEY = "deudores_ropa_v1";

const debtorForm = document.querySelector("#debtor-form");
const nameInput = document.querySelector("#name");
const amountInput = document.querySelector("#amount");
const debtorList = document.querySelector("#debtor-list");
const debtorTemplate = document.querySelector("#debtor-template");
const summary = document.querySelector("#summary");

/** @type {{id:string,name:string,remaining:number,payments:{amount:number,date:string}[]}[]} */
let debtors = loadDebtors();

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);
}

function loadDebtors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDebtors() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(debtors));
}

function updateSummary() {
  const total = debtors.reduce((acc, debtor) => acc + debtor.remaining, 0);
  summary.textContent = `${debtors.length} persona(s) | Deuda total: ${formatMoney(total)}`;
}

function renderDebtors() {
  debtorList.innerHTML = "";

  if (debtors.length === 0) {
    debtorList.innerHTML = '<p class="muted">Aún no has agregado deudores.</p>';
    updateSummary();
    return;
  }

  debtors.forEach((debtor) => {
    const fragment = debtorTemplate.content.cloneNode(true);
    const wrapper = fragment.querySelector(".debtor-item");
    const debtorName = fragment.querySelector(".debtor-name");
    const debtorAmount = fragment.querySelector(".debtor-amount");
    const paymentForm = fragment.querySelector(".payment-form");
    const paymentInput = fragment.querySelector(".payment-input");
    const paymentHistory = fragment.querySelector(".payment-history");
    const deleteBtn = fragment.querySelector(".delete-btn");

    debtorName.textContent = debtor.name;
    debtorAmount.textContent = `Debe: ${formatMoney(debtor.remaining)}`;

    if (debtor.payments.length === 0) {
      paymentHistory.innerHTML = '<li class="muted">Sin pagos registrados</li>';
    } else {
      debtor.payments.forEach((payment) => {
        const item = document.createElement("li");
        item.textContent = `${formatMoney(payment.amount)} - ${new Date(payment.date).toLocaleDateString("es-MX")}`;
        paymentHistory.appendChild(item);
      });
    }

    paymentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const payment = Number(paymentInput.value);

      if (!payment || payment <= 0) {
        alert("Ingresa un pago válido.");
        return;
      }

      if (payment > debtor.remaining) {
        alert("El pago no puede ser mayor a la deuda pendiente.");
        return;
      }

      debtor.remaining = Number((debtor.remaining - payment).toFixed(2));
      debtor.payments.unshift({ amount: payment, date: new Date().toISOString() });
      saveDebtors();
      renderDebtors();
    });

    deleteBtn.addEventListener("click", () => {
      const confirmDelete = window.confirm(`¿Eliminar el registro de ${debtor.name}?`);
      if (!confirmDelete) return;

      debtors = debtors.filter((item) => item.id !== debtor.id);
      saveDebtors();
      renderDebtors();
    });

    wrapper.classList.toggle("paid", debtor.remaining === 0);
    debtorList.appendChild(fragment);
  });

  updateSummary();
}

debtorForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const amount = Number(amountInput.value);

  if (!name || !amount || amount <= 0) {
    alert("Completa los campos correctamente.");
    return;
  }

  debtors.unshift({
    id: crypto.randomUUID(),
    name,
    remaining: Number(amount.toFixed(2)),
    payments: [],
  });

  saveDebtors();
  renderDebtors();
  debtorForm.reset();
});

renderDebtors();
