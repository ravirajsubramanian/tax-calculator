// Debounce function to wait for user to type the input completely before calling the function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Tab switching logic
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));

  document.getElementById(`page-${pageId}`).classList.add('active');
  document.getElementById(`nav-${pageId === 'home' ? 'home' : 'calc'}`).classList.add('active');
}

// Dynamically add input fields for accounts/dividends
function addDynamicRow(containerId, placeholderText) {
  const container = document.getElementById(containerId);
  const row = document.createElement('div');
  const baseId = containerId === 'bank-container' ? 'bank_account' : 'dividend_account';
  const idSuffix = container.querySelectorAll('.dynamic-row').length + 1; // To create unique IDs
  row.className = 'dynamic-row';
  row.innerHTML = `
        <input type="text" placeholder="${placeholderText}">
        <input type="number" id="${baseId}_${idSuffix}" class="amount" placeholder="Amount" value="0" oninput="calculateTax()">
        <button class="btn-sm" onclick="this.parentElement.remove(); calculateTax();">X</button>
    `;
  container.appendChild(row);

  // Add event listener for the new input
  const newInput = row.querySelector('input[type="number"]');
  newInput.addEventListener('input', function () {
    if (validateInput(this)) {
      localStorage.setItem(this.id, this.value);
      calculateTax();
    }
  });
}

function resetAllValues() {
  if (confirm('Are you sure you want to reset all values to 0?')) {
    // localStorage.clear();

    // Clear only the values from local storage, but keep the keys (for dynamic accounts)
    Object.keys(localStorage).forEach(key => {
      localStorage.setItem(key, 0);
    });
    localStorage.setItem('slab-rate', 30);

    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
      input.value = 0;
    });
    calculateTax();
  }
}

// Calculation Engine
const calculateTax = debounce(() => {
  const slabRate = parseFloat(document.getElementById('slab-rate').value) / 100;

  // 1. Gather Slab incomes
  let totalSlabIncome = 0;

  // Bank interest
  document.querySelectorAll('#bank-container .amount').forEach(input => {
    totalSlabIncome += parseFloat(input.value) || 0;
  });

  // Dividends
  document.querySelectorAll('#dividend-container .amount').forEach(input => {
    totalSlabIncome += parseFloat(input.value) || 0;
  });

  // Gold STCG (taxed at slab)
  const goldStcg = parseFloat(document.getElementById('gold-stcg').value) || 0;
  totalSlabIncome += goldStcg;

  // Debt Gains (all taxed at slab)
  const debtGains = parseFloat(document.getElementById('debt-gains').value) || 0;
  totalSlabIncome += debtGains;

  // Calculate tax on slab incomes
  const slabTax = totalSlabIncome * slabRate;

  // 2. Calculate Capital Gains Taxes (Special Rates)
  // Equity STCG @ 20%
  const equityStcg = parseFloat(document.getElementById('equity-stcg').value) || 0;
  const equityStcgTax = equityStcg * 0.20;

  // Equity LTCG @ 12.5% over 1,25,000 exemption
  const equityLtcg = parseFloat(document.getElementById('equity-ltcg').value) || 0;
  const taxableEquityLtcg = Math.max(0, equityLtcg - 125000);
  const equityLtcgTax = taxableEquityLtcg * 0.125;

  // Gold LTCG @ 12.5%
  const goldLtcg = parseFloat(document.getElementById('gold-ltcg').value) || 0;
  const goldLtcgTax = goldLtcg * 0.125;

  const totalCgTax = equityStcgTax + equityLtcgTax + goldLtcgTax;

  // 3. Overall Totals
  const totalTax = slabTax + totalCgTax;

  // Render output dashboard values
  document.getElementById('lbl-slab-income').innerText = '₹' + totalSlabIncome.toLocaleString('en-IN');
  document.getElementById('lbl-slab-tax').innerText = '₹' + slabTax.toLocaleString('en-IN');
  document.getElementById('lbl-cg-tax').innerText = '₹' + totalCgTax.toLocaleString('en-IN');
  document.getElementById('lbl-total-tax').innerText = '₹' + totalTax.toLocaleString('en-IN');
}, 500); // Debounce to prevent excessive event triggers

function loadFromLocalStorage() {
  // Load slab rate
  const savedSlabRate = localStorage.getItem('slab-rate');
  if (savedSlabRate !== null) {
    document.getElementById('slab-rate').value = savedSlabRate;
  }

  // Load dynamic bank accounts
  let bankIndex = 1;
  while (localStorage.getItem(`bank_account_${bankIndex}`) !== null) {
    if (bankIndex > 1) {
      addDynamicRow('bank-container', 'Account Name (e.g., SBI, HDFC)');
    }
    document.getElementById(`bank_account_${bankIndex}`).value = localStorage.getItem(`bank_account_${bankIndex}`);
    bankIndex++;
  }

  // Load dynamic dividend accounts
  let dividendIndex = 1;
  while (localStorage.getItem(`dividend_account_${dividendIndex}`) !== null) {
    if (dividendIndex > 1) {
      addDynamicRow('dividend-container', 'Demat Account (e.g., Zerodha, Groww)');
    }
    document.getElementById(`dividend_account_${dividendIndex}`).value = localStorage.getItem(`dividend_account_${dividendIndex}`);
    dividendIndex++;
  }
}

function loadValueFromLocalStorage(id) {
  const savedValue = localStorage.getItem(id);
  if (savedValue !== null) {
    document.getElementById(id).value = savedValue;
  }
}

window.onload = function () {

  // Initialize local storage values on load
  loadFromLocalStorage();

  // Initialize view with base values on load
  calculateTax();

  document.getElementById('btn-add-bank').addEventListener('click', () => addDynamicRow('bank-container', 'Account Name (e.g., SBI, HDFC)'));
  document.getElementById('btn-add-dividend').addEventListener('click', () => addDynamicRow('dividend-container', 'Demat Account (e.g., Zerodha, Groww)'));
  document.getElementById('btn-go-to-calc').addEventListener('click', () => switchPage('calc'));
  document.getElementById('nav-calc').addEventListener('click', () => switchPage('calc'));
  document.getElementById('btn-reset').addEventListener('click', resetAllValues);


  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach(input => {
    loadValueFromLocalStorage(input.id); // Load each input value from local storage
    input.addEventListener('input', function () {
      if (validateInput(this)) {
        localStorage.setItem(this.id, this.value);
        calculateTax();
      }
    });
  });


  const slabRateInput = document.getElementById('slab-rate');
  loadValueFromLocalStorage(slabRateInput.id);
  slabRateInput.addEventListener('input', function () {
    if (validateInput(this)) {
      localStorage.setItem(this.id, this.value);
      calculateTax();
    }
  });
};

function validateInput(input) {
  if (input.value === '') {
    input.value = 0;
  }
  return !isNaN(input.value) && parseFloat(input.value) >= 0;
}

// function addNewAccount(id) {
//   const input = document.getElementById(id);
//   input.addEventListener('input', function () {
//     if (validateInput(this)) {
//       localStorage.setItem(this.id, this.value);
//       calculateTax();
//     }
//   });
// }

// function removeAcccount(id) {
//   const element = document.querySelector(`[data-id="${id}"]`);
//   if (element) {
//     localStorage.removeItem(id);
//     element.remove();
//     calculateTax();
//   }
// }
