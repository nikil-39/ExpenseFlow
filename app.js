/* ============================================
   ExpenseFlow — Application Logic
   ============================================ */

// ==================== DATA STORE ====================
const Store = {
  KEY: 'expenseFlowData',

  defaultData() {
    return {
      months: {},
      subcategories: {
        'Investments': ['Stocks', 'Mutual Funds', 'FD', 'Gold', 'Crypto', 'PPF', 'Real Estate'],
        'Need': ['Family', 'Petrol', 'Groceries', 'Rent', 'Utilities', 'Medical', 'Education', 'Insurance'],
        'Fun Money': ['Entertainment', 'Shopping', 'Dining Out', 'Travel', 'Hobbies', 'Subscriptions']
      },
      settings: { theme: 'dark', currency: '₹' }
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this.defaultData();
      const data = JSON.parse(raw);
      // Merge with defaults for safety
      const def = this.defaultData();
      return {
        months: data.months || {},
        subcategories: { ...def.subcategories, ...data.subcategories },
        settings: { ...def.settings, ...data.settings }
      };
    } catch { return this.defaultData(); }
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  getMonth(data, key) {
    if (!data.months[key]) {
      data.months[key] = { income: 0, expenses: [] };
    }
    return data.months[key];
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }
};


// ==================== FORMATTERS ====================
const Fmt = {
  currency(n) {
    const abs = Math.abs(n);
    if (abs >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (abs >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
    return '₹' + n.toLocaleString('en-IN');
  },

  currencyFull(n) {
    return '₹' + n.toLocaleString('en-IN');
  },

  percent(n) {
    return n.toFixed(1) + '%';
  },

  monthName(key) {
    const [y, m] = key.split('-');
    const date = new Date(+y, +m - 1);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  },

  shortMonth(m) {
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m];
  },

  dateShort(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  monthKey(year, month) {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
};


// ==================== CHARTS MANAGER ====================
const Charts = {
  instances: {},
  colors: {
    primary: '#6C5CE7',
    primaryLight: '#a29bfe',
    accent: '#00B894',
    accentLight: '#55efc4',
    danger: '#FF6B6B',
    dangerLight: '#ff8787',
    warning: '#FECA57',
    info: '#74b9ff',
    investments: '#6C5CE7',
    need: '#00B894',
    fun: '#FECA57',
  },

  getThemeConfig() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      textColor: isDark ? '#9B9BB4' : '#6B7280',
      bgColor: isDark ? '#14142B' : '#FFFFFF',
    };
  },

  destroy(name) {
    if (this.instances[name]) {
      this.instances[name].destroy();
      delete this.instances[name];
    }
  },

  renderIncomeVsExpense(canvas, data, year) {
    this.destroy('incomeVsExpense');
    const theme = this.getThemeConfig();
    const labels = [];
    const incomeData = [];
    const expenseData = [];

    for (let m = 1; m <= 12; m++) {
      labels.push(Fmt.shortMonth(m - 1));
      const key = Fmt.monthKey(year, m);
      const month = data.months[key];
      incomeData.push(month ? month.income : 0);
      expenseData.push(month ? month.expenses.reduce((s, e) => s + e.amount, 0) : 0);
    }

    this.instances['incomeVsExpense'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: this.colors.accent + '80',
            borderColor: this.colors.accent,
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Expenses',
            data: expenseData,
            backgroundColor: this.colors.danger + '60',
            borderColor: this.colors.danger,
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: theme.textColor, usePointStyle: true, pointStyle: 'circle', padding: 20, font: { size: 12, weight: '500' } }
          },
          tooltip: {
            backgroundColor: theme.bgColor,
            titleColor: theme.textColor,
            bodyColor: theme.textColor,
            borderColor: 'rgba(108,92,231,0.2)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${Fmt.currencyFull(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: theme.textColor, font: { size: 11 } }
          },
          y: {
            grid: { color: theme.gridColor },
            ticks: {
              color: theme.textColor,
              font: { size: 11 },
              callback: v => Fmt.currency(v)
            }
          }
        }
      }
    });
  },

  renderCategoryDonut(canvas, data, year) {
    this.destroy('categoryDonut');
    const theme = this.getThemeConfig();
    const totals = { Investments: 0, Need: 0, 'Fun Money': 0 };

    for (let m = 1; m <= 12; m++) {
      const key = Fmt.monthKey(year, m);
      const month = data.months[key];
      if (month) {
        month.expenses.forEach(e => {
          if (totals.hasOwnProperty(e.category)) totals[e.category] += e.amount;
        });
      }
    }

    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    document.getElementById('donutCenter').querySelector('.donut-total').textContent = Fmt.currency(total);

    this.instances['categoryDonut'] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Investments', 'Need', 'Fun Money'],
        datasets: [{
          data: [totals.Investments, totals.Need, totals['Fun Money']],
          backgroundColor: [this.colors.investments, this.colors.need, this.colors.fun],
          borderWidth: 0,
          hoverOffset: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: theme.textColor, usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12, weight: '500' } }
          },
          tooltip: {
            backgroundColor: theme.bgColor,
            titleColor: theme.textColor,
            bodyColor: theme.textColor,
            borderColor: 'rgba(108,92,231,0.2)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: ctx => {
                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return `${ctx.label}: ${Fmt.currencyFull(ctx.parsed)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  renderSpendingTrend(canvas, data) {
    this.destroy('spendingTrend');
    const theme = this.getThemeConfig();
    const now = new Date();
    const labels = [];
    const investData = [];
    const needData = [];
    const funData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = Fmt.monthKey(d.getFullYear(), d.getMonth() + 1);
      labels.push(Fmt.shortMonth(d.getMonth()) + ' ' + d.getFullYear().toString().substr(2));
      const month = data.months[key];
      let inv = 0, need = 0, fun = 0;
      if (month) {
        month.expenses.forEach(e => {
          if (e.category === 'Investments') inv += e.amount;
          else if (e.category === 'Need') need += e.amount;
          else if (e.category === 'Fun Money') fun += e.amount;
        });
      }
      investData.push(inv);
      needData.push(need);
      funData.push(fun);
    }

    this.instances['spendingTrend'] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Investments',
            data: investData,
            borderColor: this.colors.investments,
            backgroundColor: this.colors.investments + '15',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2.5,
          },
          {
            label: 'Need',
            data: needData,
            borderColor: this.colors.need,
            backgroundColor: this.colors.need + '15',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2.5,
          },
          {
            label: 'Fun Money',
            data: funData,
            borderColor: this.colors.fun,
            backgroundColor: this.colors.fun + '15',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2.5,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { color: theme.textColor, usePointStyle: true, pointStyle: 'circle', padding: 20, font: { size: 12, weight: '500' } }
          },
          tooltip: {
            backgroundColor: theme.bgColor,
            titleColor: theme.textColor,
            bodyColor: theme.textColor,
            borderColor: 'rgba(108,92,231,0.2)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: { label: ctx => `${ctx.dataset.label}: ${Fmt.currencyFull(ctx.parsed.y)}` }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: theme.textColor, font: { size: 11 } }
          },
          y: {
            grid: { color: theme.gridColor },
            ticks: { color: theme.textColor, font: { size: 11 }, callback: v => Fmt.currency(v) }
          }
        }
      }
    });
  },

  renderSavingsTrend(canvas, data) {
    this.destroy('savingsTrend');
    const theme = this.getThemeConfig();
    const now = new Date();
    const labels = [];
    const savingsData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = Fmt.monthKey(d.getFullYear(), d.getMonth() + 1);
      labels.push(Fmt.shortMonth(d.getMonth()));
      const month = data.months[key];
      if (month) {
        const totalExp = month.expenses.reduce((s, e) => s + e.amount, 0);
        savingsData.push(month.income - totalExp);
      } else {
        savingsData.push(0);
      }
    }

    this.instances['savingsTrend'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Savings',
          data: savingsData,
          backgroundColor: savingsData.map(v => v >= 0 ? this.colors.accent + '80' : this.colors.danger + '80'),
          borderColor: savingsData.map(v => v >= 0 ? this.colors.accent : this.colors.danger),
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.bgColor,
            titleColor: theme.textColor,
            bodyColor: theme.textColor,
            borderColor: 'rgba(108,92,231,0.2)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: { label: ctx => `Savings: ${Fmt.currencyFull(ctx.parsed.y)}` }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: theme.textColor, font: { size: 11 } }
          },
          y: {
            grid: { color: theme.gridColor },
            ticks: { color: theme.textColor, font: { size: 11 }, callback: v => Fmt.currency(v) }
          }
        }
      }
    });
  },

  renderSubcategoryBar(canvas, data, year) {
    this.destroy('subcategoryBar');
    const theme = this.getThemeConfig();
    const subcatTotals = {};

    for (let m = 1; m <= 12; m++) {
      const key = Fmt.monthKey(year, m);
      const month = data.months[key];
      if (month) {
        month.expenses.forEach(e => {
          const label = e.subcategory || 'Other';
          subcatTotals[label] = (subcatTotals[label] || 0) + e.amount;
        });
      }
    }

    // Sort and take top 8
    const sorted = Object.entries(subcatTotals).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const labels = sorted.map(s => s[0]);
    const values = sorted.map(s => s[1]);
    const palette = ['#6C5CE7','#00B894','#FECA57','#FF6B6B','#74b9ff','#a29bfe','#fd79a8','#55efc4'];

    this.instances['subcategoryBar'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Amount',
          data: values,
          backgroundColor: palette.slice(0, values.length).map(c => c + '80'),
          borderColor: palette.slice(0, values.length),
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.bgColor,
            titleColor: theme.textColor,
            bodyColor: theme.textColor,
            borderColor: 'rgba(108,92,231,0.2)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: { label: ctx => Fmt.currencyFull(ctx.parsed.x) }
          }
        },
        scales: {
          y: {
            grid: { display: false },
            ticks: { color: theme.textColor, font: { size: 11 } }
          },
          x: {
            grid: { color: theme.gridColor },
            ticks: { color: theme.textColor, font: { size: 11 }, callback: v => Fmt.currency(v) }
          }
        }
      }
    });
  },

  refreshAll(data, overviewYear) {
    this.renderIncomeVsExpense(document.getElementById('chartIncomeVsExpense'), data, overviewYear);
    this.renderCategoryDonut(document.getElementById('chartCategoryDonut'), data, overviewYear);
    this.renderSpendingTrend(document.getElementById('chartSpendingTrend'), data);
    this.renderSavingsTrend(document.getElementById('chartSavingsTrend'), data);
    this.renderSubcategoryBar(document.getElementById('chartSubcategoryBar'), data, overviewYear);
  }
};


// ==================== MAIN APP ====================
const App = {
  data: null,
  overviewYear: new Date().getFullYear(),
  spendYear: new Date().getFullYear(),
  spendMonth: new Date().getMonth() + 1,
  currentFilter: 'all',
  currentSubcatTab: 'Investments',
  selectedExpenseCategory: 'Investments',
  editSelectedCategory: 'Investments',

  init() {
    this.data = Store.load();
    this.applyTheme(this.data.settings.theme);
    this.bindEvents();
    this.render();
  },

  // ---------- Theme ----------
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.data.settings.theme = theme;
  },

  toggleTheme() {
    const newTheme = this.data.settings.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    Store.save(this.data);
    Charts.refreshAll(this.data, this.overviewYear);
  },

  // ---------- Tab Switching ----------
  switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.querySelector(`.nav-item[data-tab="${tabName}"]`).classList.add('active');

    // Close mobile sidebar and overlay
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');

    // Refresh charts when switching tabs
    setTimeout(() => Charts.refreshAll(this.data, this.overviewYear), 100);
  },

  // ---------- Modals ----------
  openModal(id) {
    document.getElementById(id).classList.add('active');
    document.getElementById('overlay').classList.add('active');
  },

  closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
  },

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.getElementById('overlay').classList.remove('active');
  },

  // ---------- Toast ----------
  toast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // ---------- Month Key Helpers ----------
  getSpendKey() {
    return Fmt.monthKey(this.spendYear, this.spendMonth);
  },

  navigateSpendMonth(dir) {
    this.spendMonth += dir;
    if (this.spendMonth > 12) { this.spendMonth = 1; this.spendYear++; }
    if (this.spendMonth < 1) { this.spendMonth = 12; this.spendYear--; }
    this.render();
  },

  navigateOverviewYear(dir) {
    this.overviewYear += dir;
    this.render();
  },

  // ---------- Income ----------
  openIncomeModal() {
    const key = this.getSpendKey();
    const month = Store.getMonth(this.data, key);
    document.getElementById('incomeModalMonth').textContent = Fmt.monthName(key);
    document.getElementById('incomeAmountInput').value = month.income || '';
    this.openModal('incomeModal');
    setTimeout(() => document.getElementById('incomeAmountInput').focus(), 200);
  },

  saveIncome() {
    const amount = parseFloat(document.getElementById('incomeAmountInput').value);
    if (isNaN(amount) || amount < 0) {
      this.toast('Please enter a valid income amount', 'error');
      return;
    }
    const key = this.getSpendKey();
    const month = Store.getMonth(this.data, key);
    month.income = amount;
    Store.save(this.data);
    this.closeModal('incomeModal');
    this.toast(`Income set to ${Fmt.currencyFull(amount)} for ${Fmt.monthName(key)}`);
    this.render();
  },

  // ---------- Expenses ----------
  openExpenseModal() {
    const key = this.getSpendKey();
    const [y, m] = key.split('-');
    const today = new Date();
    let dateVal;
    if (today.getFullYear() == y && (today.getMonth() + 1) == m) {
      dateVal = today.toISOString().split('T')[0];
    } else {
      dateVal = `${y}-${m}-01`;
    }
    document.getElementById('expenseDateInput').value = dateVal;
    document.getElementById('expenseDescInput').value = '';
    document.getElementById('expenseAmountInput').value = '';

    // Reset category selection
    this.selectedExpenseCategory = 'Investments';
    this.updateCategorySelection();
    this.updateSubcategoryDropdown();

    this.openModal('expenseModal');
    setTimeout(() => document.getElementById('expenseDescInput').focus(), 200);
  },

  selectCategory(category) {
    this.selectedExpenseCategory = category;
    this.updateCategorySelection();
    this.updateSubcategoryDropdown();
  },

  updateCategorySelection() {
    document.querySelectorAll('#expenseModal .cat-select-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === this.selectedExpenseCategory);
    });
  },

  updateSubcategoryDropdown() {
    const select = document.getElementById('expenseSubcatInput');
    const subcats = this.data.subcategories[this.selectedExpenseCategory] || [];
    select.innerHTML = subcats.map(s => `<option value="${s}">${s}</option>`).join('') + '<option value="__other__">✏️ Other (type your own)</option>';
    const otherInput = document.getElementById('expenseOtherSubcatInput');
    otherInput.style.display = 'none';
    otherInput.value = '';
  },

  saveExpense() {
    const date = document.getElementById('expenseDateInput').value;
    const desc = document.getElementById('expenseDescInput').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmountInput').value);
    let subcat = document.getElementById('expenseSubcatInput').value;

    // If "Other" is selected, use the custom input value
    if (subcat === '__other__') {
      subcat = document.getElementById('expenseOtherSubcatInput').value.trim();
      if (!subcat) { this.toast('Please enter a custom subcategory name', 'error'); return; }
    }

    if (!date) { this.toast('Please select a date', 'error'); return; }
    if (!desc) { this.toast('Please enter a description', 'error'); return; }
    if (isNaN(amount) || amount <= 0) { this.toast('Please enter a valid amount', 'error'); return; }

    // Determine the month key from the date
    const [y, m] = date.split('-');
    const key = `${y}-${m}`;
    const month = Store.getMonth(this.data, key);

    month.expenses.push({
      id: Store.generateId(),
      date,
      category: this.selectedExpenseCategory,
      subcategory: subcat,
      description: desc,
      amount
    });

    // Sort by date descending
    month.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    Store.save(this.data);
    this.closeModal('expenseModal');
    this.toast(`Expense of ${Fmt.currencyFull(amount)} added!`);
    this.render();
  },

  deleteExpense(monthKey, id) {
    if (!confirm('Delete this expense?')) return;
    const month = this.data.months[monthKey];
    if (month) {
      month.expenses = month.expenses.filter(e => e.id !== id);
      Store.save(this.data);
      this.toast('Expense deleted', 'info');
      this.render();
    }
  },

  openEditExpenseModal(monthKey, id) {
    const month = this.data.months[monthKey];
    if (!month) return;
    const expense = month.expenses.find(e => e.id === id);
    if (!expense) return;

    document.getElementById('editExpenseId').value = id;
    document.getElementById('editExpenseMonthKey').value = monthKey;
    document.getElementById('editExpenseDateInput').value = expense.date;
    document.getElementById('editExpenseDescInput').value = expense.description;
    document.getElementById('editExpenseAmountInput').value = expense.amount;

    this.editSelectedCategory = expense.category;
    document.querySelectorAll('#editCategorySelector .cat-select-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === expense.category);
    });

    // Populate subcategory dropdown
    const select = document.getElementById('editExpenseSubcatInput');
    const subcats = this.data.subcategories[expense.category] || [];
    const isCustom = expense.subcategory && !subcats.includes(expense.subcategory);
    select.innerHTML = subcats.map(s => `<option value="${s}" ${s === expense.subcategory ? 'selected' : ''}>${s}</option>`) .join('') + '<option value="__other__"' + (isCustom ? ' selected' : '') + '>✏️ Other (type your own)</option>';
    const editOtherInput = document.getElementById('editOtherSubcatInput');
    if (isCustom) {
      editOtherInput.style.display = 'block';
      editOtherInput.value = expense.subcategory;
    } else {
      editOtherInput.style.display = 'none';
      editOtherInput.value = '';
    }

    this.openModal('editExpenseModal');
  },

  updateExpense() {
    const id = document.getElementById('editExpenseId').value;
    const oldMonthKey = document.getElementById('editExpenseMonthKey').value;
    const date = document.getElementById('editExpenseDateInput').value;
    const desc = document.getElementById('editExpenseDescInput').value.trim();
    const amount = parseFloat(document.getElementById('editExpenseAmountInput').value);
    let subcat = document.getElementById('editExpenseSubcatInput').value;

    // If "Other" is selected, use the custom input value
    if (subcat === '__other__') {
      subcat = document.getElementById('editOtherSubcatInput').value.trim();
      if (!subcat) { this.toast('Please enter a custom subcategory name', 'error'); return; }
    }

    if (!date || !desc || isNaN(amount) || amount <= 0) {
      this.toast('Please fill all fields correctly', 'error');
      return;
    }

    // Remove from old month
    const oldMonth = this.data.months[oldMonthKey];
    if (oldMonth) {
      oldMonth.expenses = oldMonth.expenses.filter(e => e.id !== id);
    }

    // Add to new month
    const [y, m] = date.split('-');
    const newKey = `${y}-${m}`;
    const newMonth = Store.getMonth(this.data, newKey);
    newMonth.expenses.push({
      id,
      date,
      category: this.editSelectedCategory,
      subcategory: subcat,
      description: desc,
      amount
    });
    newMonth.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    Store.save(this.data);
    this.closeModal('editExpenseModal');
    this.toast('Expense updated!');
    this.render();
  },

  // ---------- Subcategories ----------
  openSubcatModal() {
    this.currentSubcatTab = 'Investments';
    this.renderSubcatModal();
    this.openModal('subcatModal');
  },

  renderSubcatModal() {
    // Update tabs
    document.querySelectorAll('.subcat-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.cat === this.currentSubcatTab);
    });

    // Render chips
    const list = document.getElementById('subcatList');
    const subcats = this.data.subcategories[this.currentSubcatTab] || [];
    list.innerHTML = subcats.map(s => `
      <span class="subcat-chip">
        ${s}
        <button class="subcat-chip-remove" onclick="App.removeSubcategory('${s}')">&times;</button>
      </span>
    `).join('');
  },

  addSubcategory() {
    const input = document.getElementById('newSubcatInput');
    const name = input.value.trim();
    if (!name) return;
    if (!this.data.subcategories[this.currentSubcatTab]) {
      this.data.subcategories[this.currentSubcatTab] = [];
    }
    if (this.data.subcategories[this.currentSubcatTab].includes(name)) {
      this.toast('Subcategory already exists', 'error');
      return;
    }
    this.data.subcategories[this.currentSubcatTab].push(name);
    Store.save(this.data);
    input.value = '';
    this.renderSubcatModal();
    this.toast(`"${name}" added to ${this.currentSubcatTab}`);
  },

  addSubcategoryInline() {
    const name = prompt('Enter new subcategory name:');
    if (!name || !name.trim()) return;
    const cat = this.selectedExpenseCategory;
    if (!this.data.subcategories[cat]) this.data.subcategories[cat] = [];
    if (this.data.subcategories[cat].includes(name.trim())) {
      this.toast('Already exists', 'error');
      return;
    }
    this.data.subcategories[cat].push(name.trim());
    Store.save(this.data);
    this.updateSubcategoryDropdown();
    // Select the new one
    document.getElementById('expenseSubcatInput').value = name.trim();
    this.toast(`"${name.trim()}" added!`);
  },

  removeSubcategory(name) {
    const cat = this.currentSubcatTab;
    this.data.subcategories[cat] = this.data.subcategories[cat].filter(s => s !== name);
    Store.save(this.data);
    this.renderSubcatModal();
    this.toast(`"${name}" removed`, 'info');
  },

  // ---------- Export ----------
  exportCSV() {
    let csv = 'Month,Income,Category,Subcategory,Description,Date,Amount\n';
    const keys = Object.keys(this.data.months).sort();
    keys.forEach(key => {
      const month = this.data.months[key];
      if (month.expenses.length === 0) {
        csv += `${Fmt.monthName(key)},${month.income},,,,\n`;
      }
      month.expenses.forEach(e => {
        csv += `${Fmt.monthName(key)},${month.income},${e.category},${e.subcategory || ''},${e.description},${e.date},${e.amount}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ExpenseFlow_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast('CSV exported successfully!');
  },

  // ---------- Render Everything ----------
  render() {
    this.renderOverview();
    this.renderSpend();
    this.renderAnalytics();
    Charts.refreshAll(this.data, this.overviewYear);
  },

  renderOverview() {
    const year = this.overviewYear;
    document.getElementById('overviewYear').textContent = year;

    let totalIncome = 0, totalExpense = 0;
    let prevYearIncome = 0, prevYearExpense = 0;

    for (let m = 1; m <= 12; m++) {
      const key = Fmt.monthKey(year, m);
      const month = this.data.months[key];
      if (month) {
        totalIncome += month.income;
        totalExpense += month.expenses.reduce((s, e) => s + e.amount, 0);
      }
      const prevKey = Fmt.monthKey(year - 1, m);
      const prevMonth = this.data.months[prevKey];
      if (prevMonth) {
        prevYearIncome += prevMonth.income;
        prevYearExpense += prevMonth.expenses.reduce((s, e) => s + e.amount, 0);
      }
    }

    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Animate stat values
    this.animateValue('statTotalIncome', Fmt.currency(totalIncome));
    this.animateValue('statTotalExpense', Fmt.currency(totalExpense));
    this.animateValue('statNetSavings', Fmt.currency(savings));
    this.animateValue('statSavingsRate', Fmt.percent(savingsRate));

    // Trends
    const incomeTrend = document.getElementById('incomeTrend');
    const expenseTrend = document.getElementById('expenseTrend');
    const savingsTrend = document.getElementById('savingsTrend');
    const savingsBadge = document.getElementById('savingsBadge');

    if (prevYearIncome > 0) {
      const pct = ((totalIncome - prevYearIncome) / prevYearIncome * 100).toFixed(1);
      incomeTrend.textContent = (pct >= 0 ? '+' : '') + pct + '%';
      incomeTrend.className = 'stat-trend ' + (pct >= 0 ? 'up' : 'down');
    } else {
      incomeTrend.textContent = '—';
      incomeTrend.className = 'stat-trend';
    }

    if (prevYearExpense > 0) {
      const pct = ((totalExpense - prevYearExpense) / prevYearExpense * 100).toFixed(1);
      expenseTrend.textContent = (pct >= 0 ? '+' : '') + pct + '%';
      expenseTrend.className = 'stat-trend ' + (pct <= 0 ? 'up' : 'down');
    } else {
      expenseTrend.textContent = '—';
      expenseTrend.className = 'stat-trend';
    }

    savingsTrend.textContent = Fmt.percent(savingsRate);
    savingsTrend.className = 'stat-trend ' + (savings >= 0 ? 'up' : 'down');

    if (savingsRate >= 30) { savingsBadge.textContent = '🏆 Great'; savingsBadge.style.color = 'var(--accent)'; }
    else if (savingsRate >= 15) { savingsBadge.textContent = '👍 Good'; savingsBadge.style.color = 'var(--warning)'; }
    else if (savingsRate >= 0) { savingsBadge.textContent = '⚠️ Low'; savingsBadge.style.color = 'var(--danger)'; }
    else { savingsBadge.textContent = '🚨 Deficit'; savingsBadge.style.color = 'var(--danger)'; }

    // Recent transactions (last 5 across all months)
    this.renderRecentTransactions();
  },

  animateValue(elementId, targetText) {
    document.getElementById(elementId).textContent = targetText;
  },

  renderRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    const allExpenses = [];

    Object.entries(this.data.months).forEach(([key, month]) => {
      month.expenses.forEach(e => {
        allExpenses.push({ ...e, monthKey: key });
      });
    });

    allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = allExpenses.slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
          <p>No transactions yet. Start tracking your expenses!</p>
        </div>`;
      return;
    }

    container.innerHTML = recent.map(e => this.renderTransactionItem(e, e.monthKey, false)).join('');
  },

  renderTransactionItem(expense, monthKey, showActions = true) {
    const catClass = expense.category === 'Investments' ? 'investments' :
                     expense.category === 'Need' ? 'need' : 'fun';
    const catIcon = expense.category === 'Investments' ? '📈' :
                    expense.category === 'Need' ? '🏠' : '🎉';

    const actions = showActions ? `
      <div class="txn-actions">
        <button class="txn-btn edit-btn" onclick="App.openEditExpenseModal('${monthKey}','${expense.id}')" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="txn-btn" onclick="App.deleteExpense('${monthKey}','${expense.id}')" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>` : '';

    return `
      <div class="transaction-item">
        <div class="txn-icon ${catClass}">${catIcon}</div>
        <div class="txn-details">
          <div class="txn-desc">${expense.description}</div>
          <div class="txn-meta">${expense.subcategory || expense.category} · ${Fmt.dateShort(expense.date)}</div>
        </div>
        <div class="txn-amount expense">-${Fmt.currencyFull(expense.amount)}</div>
        ${actions}
      </div>`;
  },

  renderSpend() {
    const key = this.getSpendKey();
    document.getElementById('spendMonth').textContent = Fmt.monthName(key);

    const month = Store.getMonth(this.data, key);
    const income = month.income;
    const totalExpense = month.expenses.reduce((s, e) => s + e.amount, 0);
    const balance = income - totalExpense;

    document.getElementById('monthlyIncomeValue').textContent = Fmt.currencyFull(income);
    document.getElementById('monthlyExpenseValue').textContent = Fmt.currencyFull(totalExpense);
    document.getElementById('monthlyBalanceValue').textContent = Fmt.currencyFull(balance);

    // Update button text
    const incomeBtn = document.getElementById('setIncomeBtn');
    incomeBtn.innerHTML = income > 0 ?
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit` :
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Set Income`;

    // Progress bars
    const maxVal = Math.max(income, totalExpense, 1);
    document.getElementById('incomeBarFill').style.width = '100%';
    document.getElementById('expenseBarFill').style.width = (income > 0 ? Math.min((totalExpense / income) * 100, 100) : 0) + '%';
    document.getElementById('balanceBarFill').style.width = (income > 0 ? Math.max((balance / income) * 100, 0) : 0) + '%';

    // Category breakdown
    const catTotals = { Investments: 0, Need: 0, 'Fun Money': 0 };
    month.expenses.forEach(e => {
      if (catTotals.hasOwnProperty(e.category)) catTotals[e.category] += e.amount;
    });

    document.getElementById('catInvestments').textContent = Fmt.currencyFull(catTotals.Investments);
    document.getElementById('catNeed').textContent = Fmt.currencyFull(catTotals.Need);
    document.getElementById('catFun').textContent = Fmt.currencyFull(catTotals['Fun Money']);

    const invPct = totalExpense > 0 ? (catTotals.Investments / totalExpense * 100).toFixed(0) : 0;
    const needPct = totalExpense > 0 ? (catTotals.Need / totalExpense * 100).toFixed(0) : 0;
    const funPct = totalExpense > 0 ? (catTotals['Fun Money'] / totalExpense * 100).toFixed(0) : 0;
    document.getElementById('catInvestmentsPercent').textContent = invPct + '%';
    document.getElementById('catNeedPercent').textContent = needPct + '%';
    document.getElementById('catFunPercent').textContent = funPct + '%';

    // Transactions list
    this.renderSpendTransactions();
  },

  renderSpendTransactions() {
    const key = this.getSpendKey();
    const month = Store.getMonth(this.data, key);
    const container = document.getElementById('spendTransactions');
    let expenses = [...month.expenses];

    if (this.currentFilter !== 'all') {
      expenses = expenses.filter(e => e.category === this.currentFilter);
    }

    if (expenses.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
          <p>${this.currentFilter === 'all' ? 'No expenses this month. Click "Add Expense" to get started!' : `No ${this.currentFilter} expenses this month.`}</p>
        </div>`;
      return;
    }

    container.innerHTML = expenses.map(e => this.renderTransactionItem(e, key, true)).join('');
  },

  renderAnalytics() {
    // Top Expenses
    this.renderTopExpenses();
    // Smart Insights
    this.renderInsights();
  },

  renderTopExpenses() {
    const container = document.getElementById('topExpensesList');
    const allExpenses = [];
    const year = this.overviewYear;

    for (let m = 1; m <= 12; m++) {
      const key = Fmt.monthKey(year, m);
      const month = this.data.months[key];
      if (month) {
        month.expenses.forEach(e => allExpenses.push(e));
      }
    }

    allExpenses.sort((a, b) => b.amount - a.amount);
    const top = allExpenses.slice(0, 5);

    if (top.length === 0) {
      container.innerHTML = '<div class="empty-state small"><p>No expense data available yet.</p></div>';
      return;
    }

    container.innerHTML = top.map((e, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      return `
        <div class="top-expense-item">
          <div class="top-expense-rank ${rankClass}">${i + 1}</div>
          <div class="top-expense-info">
            <div class="top-expense-name">${e.description}</div>
            <div class="top-expense-cat">${e.category} · ${e.subcategory || ''}</div>
          </div>
          <div class="top-expense-amount">${Fmt.currencyFull(e.amount)}</div>
        </div>`;
    }).join('');
  },

  renderInsights() {
    const container = document.getElementById('insightsList');
    const insights = [];
    const year = this.overviewYear;

    let totalIncome = 0, totalExpense = 0;
    const catTotals = { Investments: 0, Need: 0, 'Fun Money': 0 };
    let monthsWithData = 0;

    for (let m = 1; m <= 12; m++) {
      const key = Fmt.monthKey(year, m);
      const month = this.data.months[key];
      if (month && (month.income > 0 || month.expenses.length > 0)) {
        monthsWithData++;
        totalIncome += month.income;
        month.expenses.forEach(e => {
          totalExpense += e.amount;
          if (catTotals.hasOwnProperty(e.category)) catTotals[e.category] += e.amount;
        });
      }
    }

    if (monthsWithData === 0) {
      container.innerHTML = `<div class="insight-item"><span class="insight-icon">📊</span><span>Start tracking your expenses to get personalized insights!</span></div>`;
      return;
    }

    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome * 100) : 0;

    // Savings insight
    if (savingsRate >= 30) {
      insights.push({ icon: '🏆', text: `Amazing! You're saving ${savingsRate.toFixed(1)}% of your income. Keep it up!` });
    } else if (savingsRate >= 15) {
      insights.push({ icon: '👍', text: `Good job! You're saving ${savingsRate.toFixed(1)}% of your income. Try to push it above 30%!` });
    } else if (savingsRate >= 0) {
      insights.push({ icon: '⚠️', text: `Your savings rate is ${savingsRate.toFixed(1)}%. Consider reducing expenses to save more.` });
    } else {
      insights.push({ icon: '🚨', text: `You're spending more than you earn! Time to cut back on expenses.` });
    }

    // Category breakdown insight
    if (totalExpense > 0) {
      const maxCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
      const pct = (maxCat[1] / totalExpense * 100).toFixed(0);
      insights.push({ icon: '📈', text: `${maxCat[0]} takes up ${pct}% of your total spending (${Fmt.currency(maxCat[1])}).` });
    }

    // Investment ratio
    if (totalIncome > 0) {
      const investPct = (catTotals.Investments / totalIncome * 100).toFixed(1);
      if (investPct >= 20) {
        insights.push({ icon: '💰', text: `Great investing! ${investPct}% of your income goes to investments.` });
      } else {
        insights.push({ icon: '💡', text: `You're investing ${investPct}% of income. Financial experts recommend at least 20%.` });
      }
    }

    // Average monthly expense
    if (monthsWithData > 0) {
      const avgExpense = totalExpense / monthsWithData;
      insights.push({ icon: '📅', text: `Your average monthly expense is ${Fmt.currency(avgExpense)} across ${monthsWithData} month(s).` });
    }

    // Fun money check
    if (totalExpense > 0) {
      const funPct = (catTotals['Fun Money'] / totalExpense * 100).toFixed(0);
      if (funPct > 30) {
        insights.push({ icon: '🎉', text: `Fun spending is ${funPct}% of your expenses. Consider allocating more to needs or investments.` });
      }
    }

    container.innerHTML = insights.map(i => `
      <div class="insight-item">
        <span class="insight-icon">${i.icon}</span>
        <span>${i.text}</span>
      </div>
    `).join('');
  },

  // ---------- Event Bindings ----------
  bindEvents() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab(item.dataset.tab);
      });
    });

    // Mobile hamburger
    document.getElementById('hamburger').addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('overlay');
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active', sidebar.classList.contains('open'));
    });

    // Overlay click closes modals & sidebar
    document.getElementById('overlay').addEventListener('click', () => {
      this.closeAllModals();
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('overlay').classList.remove('active');
    });

    // Overview year navigation
    document.getElementById('overviewYearPrev').addEventListener('click', () => this.navigateOverviewYear(-1));
    document.getElementById('overviewYearNext').addEventListener('click', () => this.navigateOverviewYear(1));

    // Spend month navigation
    document.getElementById('spendMonthPrev').addEventListener('click', () => this.navigateSpendMonth(-1));
    document.getElementById('spendMonthNext').addEventListener('click', () => this.navigateSpendMonth(1));

    // Income modal
    document.getElementById('setIncomeBtn').addEventListener('click', () => this.openIncomeModal());
    document.getElementById('saveIncomeBtn').addEventListener('click', () => this.saveIncome());

    // Expense modal
    document.getElementById('addExpenseBtn').addEventListener('click', () => this.openExpenseModal());
    document.getElementById('saveExpenseBtn').addEventListener('click', () => this.saveExpense());

    // Category selection in expense modal
    document.querySelectorAll('#expenseModal .cat-select-btn').forEach(btn => {
      btn.addEventListener('click', () => this.selectCategory(btn.dataset.category));
    });

    // Edit category selection
    document.querySelectorAll('#editCategorySelector .cat-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.editSelectedCategory = btn.dataset.category;
        document.querySelectorAll('#editCategorySelector .cat-select-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.category === btn.dataset.category);
        });
        const select = document.getElementById('editExpenseSubcatInput');
        const subcats = this.data.subcategories[btn.dataset.category] || [];
        select.innerHTML = subcats.map(s => `<option value="${s}">${s}</option>`).join('') + '<option value="__other__">✏️ Other (type your own)</option>';
        document.getElementById('editOtherSubcatInput').style.display = 'none';
        document.getElementById('editOtherSubcatInput').value = '';
      });
    });

    // Update expense
    document.getElementById('updateExpenseBtn').addEventListener('click', () => this.updateExpense());

    // Toggle 'Other' custom input for Add Expense
    document.getElementById('expenseSubcatInput').addEventListener('change', (e) => {
      const otherInput = document.getElementById('expenseOtherSubcatInput');
      if (e.target.value === '__other__') {
        otherInput.style.display = 'block';
        setTimeout(() => otherInput.focus(), 50);
      } else {
        otherInput.style.display = 'none';
        otherInput.value = '';
      }
    });

    // Toggle 'Other' custom input for Edit Expense
    document.getElementById('editExpenseSubcatInput').addEventListener('change', (e) => {
      const otherInput = document.getElementById('editOtherSubcatInput');
      if (e.target.value === '__other__') {
        otherInput.style.display = 'block';
        setTimeout(() => otherInput.focus(), 50);
      } else {
        otherInput.style.display = 'none';
        otherInput.value = '';
      }
    });

    // Inline add subcategory
    document.getElementById('addNewSubcatInline').addEventListener('click', () => this.addSubcategoryInline());

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentFilter = tab.dataset.filter;
        this.renderSpendTransactions();
      });
    });

    // Manage subcategories
    document.getElementById('manageSubcatBtn').addEventListener('click', () => this.openSubcatModal());

    // Subcategory tabs
    document.querySelectorAll('.subcat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentSubcatTab = tab.dataset.cat;
        this.renderSubcatModal();
      });
    });

    // Add subcategory
    document.getElementById('addSubcatBtn').addEventListener('click', () => this.addSubcategory());
    document.getElementById('newSubcatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addSubcategory();
    });

    // Export CSV
    document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportCSV());

    // Income modal Enter key
    document.getElementById('incomeAmountInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.saveIncome();
    });

    // Expense modal Enter key
    document.getElementById('expenseAmountInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.saveExpense();
    });

    // Keyboard shortcut: Escape closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAllModals();
    });

    // Export data
    document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());

    // Import data
    document.getElementById('importDataBtn').addEventListener('click', () => {
      document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput').addEventListener('change', (e) => this.importData(e));
  },

  // ---------- Export/Import Data ----------
  exportData() {
    const dataStr = JSON.stringify(this.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `expenseflow-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toast('Data exported successfully!', 'success');
  },

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result.trim();
        // Remove BOM if present
        const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
        const importedData = JSON.parse(cleanText);
        // Validate structure
        if (!importedData.months || !importedData.subcategories || !importedData.settings) {
          throw new Error('Invalid backup file structure');
        }
        // Merge or replace
        if (confirm('Do you want to REPLACE all current data? Click Cancel to MERGE instead.')) {
          this.data = importedData;
        } else {
          // Merge months
          Object.keys(importedData.months).forEach(key => {
            if (!this.data.months[key]) {
              this.data.months[key] = importedData.months[key];
            } else {
              // Merge expenses
              const existingIds = this.data.months[key].expenses.map(exp => exp.id);
              importedData.months[key].expenses.forEach(exp => {
                if (!existingIds.includes(exp.id)) {
                  this.data.months[key].expenses.push(exp);
                }
              });
              // Keep higher income
              this.data.months[key].income = Math.max(this.data.months[key].income, importedData.months[key].income);
            }
          });
        }
        Store.save(this.data);
        this.refreshAll();
        this.toast('Data imported successfully!', 'success');
      } catch (err) {
        console.error('Import error:', err);
        this.toast('Failed to import: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  }
};


// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => App.init());
