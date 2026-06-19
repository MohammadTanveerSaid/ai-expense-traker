const monthlyBudget = 25000;
let selectedType = 'expense';
let selectedCategory = 'Food';
let activeFilter = 'all';

const categories = {
  expense: [
    { name: 'Food', icon: '🍔' },
    { name: 'Transport', icon: '🚗' },
    { name: 'Shopping', icon: '🛍️' },
    { name: 'Bills', icon: '📄' },
    { name: 'Entertainment', icon: '🎬' },
    { name: 'Other', icon: '📦' },
  ],
  income: [
    { name: 'Salary', icon: '💼' },
    { name: 'Freelance', icon: '💻' },
    { name: 'Investment', icon: '📈' },
    { name: 'Other', icon: '💰' },
  ],
};

let transactions = [
  { id: 1, type: 'income', description: 'Monthly Salary', amount: 45000, category: 'Salary', date: new Date() },
  { id: 2, type: 'expense', description: 'Swiggy Order', amount: 450, category: 'Food', date: new Date() },
  { id: 3, type: 'expense', description: 'Uber Ride', amount: 280, category: 'Transport', date: new Date() },
  { id: 4, type: 'expense', description: 'Netflix Subscription', amount: 649, category: 'Entertainment', date: new Date() },
  { id: 5, type: 'expense', description: 'Electricity Bill', amount: 1200, category: 'Bills', date: new Date() },
];

const formatCurrency = (amount) =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const getCategoryIcon = (categoryName, type) => {
  const list = categories[type] || categories.expense;
  const match = list.find((cat) => cat.name === categoryName);
  return match ? match.icon : '📦';
};

const showToast = (message) => {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
};

const setGreeting = () => {
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  document.getElementById('greeting').textContent = greeting;
};

const renderCategoryChips = () => {
  const container = document.getElementById('categoryChips');
  const list = categories[selectedType];
  container.innerHTML = list
    .map(
      (cat) =>
        `<button type="button" class="chip ${cat.name === selectedCategory ? 'active' : ''}" data-category="${cat.name}">${cat.icon} ${cat.name}</button>`
    )
    .join('');

  container.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      selectedCategory = chip.dataset.category;
      renderCategoryChips();
    });
  });
};

const createTransactionItem = (tx, showDelete = true) => {
  const icon = getCategoryIcon(tx.category, tx.type);
  const dateStr = tx.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const amountClass = tx.type === 'expense' ? 'expense' : 'income';
  const sign = tx.type === 'expense' ? '-' : '+';

  const li = document.createElement('li');
  li.className = 'transaction-item';
  li.innerHTML = `
    <div class="tx-icon ${amountClass}">${icon}</div>
    <div class="tx-details">
      <strong>${tx.description}</strong>
      <span>${tx.category} · ${dateStr}</span>
    </div>
    <span class="tx-amount ${amountClass}">${sign}${formatCurrency(tx.amount)}</span>
    ${showDelete ? `<button class="delete-btn" data-id="${tx.id}" aria-label="Delete">×</button>` : ''}
  `;

  if (showDelete) {
    li.querySelector('.delete-btn').addEventListener('click', () => {
      transactions = transactions.filter((item) => item.id !== tx.id);
      updateUI();
      showToast('Transaction removed');
    });
  }

  return li;
};

const renderTransactionList = (containerId, items, limit = null) => {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const displayItems = limit ? items.slice(0, limit) : items;

  if (displayItems.length === 0) {
    container.innerHTML = '<li class="empty-state">No transactions yet. Click "Add Transaction" to start.</li>';
    return;
  }

  displayItems.forEach((tx) => container.appendChild(createTransactionItem(tx)));
};

const getFilteredTransactions = () => {
  if (activeFilter === 'all') return [...transactions];
  return transactions.filter((tx) => tx.type === activeFilter);
};

const updateStats = () => {
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpenses;
  const expenseCount = transactions.filter((tx) => tx.type === 'expense').length;
  const incomeCount = transactions.filter((tx) => tx.type === 'income').length;
  const budgetUsed = Math.min((totalExpenses / monthlyBudget) * 100, 100);

  document.getElementById('totalBalance').textContent = formatCurrency(balance);
  document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
  document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
  document.getElementById('balanceChange').textContent = `${balance >= 0 ? '+' : ''}${formatCurrency(balance)} net`;
  document.getElementById('expenseChange').textContent = `${expenseCount} transaction${expenseCount !== 1 ? 's' : ''}`;
  document.getElementById('incomeChange').textContent = `${incomeCount} source${incomeCount !== 1 ? 's' : ''}`;

  document.getElementById('budgetFill').style.width = `${budgetUsed}%`;
  document.getElementById('budgetHint').textContent = `${budgetUsed.toFixed(0)}% of budget used`;
};

const updateCategoryBreakdown = () => {
  const container = document.getElementById('categoryBreakdown');
  const expenses = transactions.filter((tx) => tx.type === 'expense');

  if (expenses.length === 0) {
    container.innerHTML = '';
    return;
  }

  const totals = {};
  expenses.forEach((tx) => {
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  });

  const maxAmount = Math.max(...Object.values(totals));

  container.innerHTML = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, amount]) => {
      const width = (amount / maxAmount) * 100;
      return `
        <div class="category-row">
          <span>${name}</span>
          <div class="category-bar-wrap"><div class="category-bar" style="width:${width}%"></div></div>
          <span>${formatCurrency(amount)}</span>
        </div>
      `;
    })
    .join('');
};

const updateAIInsights = () => {
  const expenses = transactions.filter((tx) => tx.type === 'expense');
  const totalExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0);

  if (expenses.length === 0) {
    document.getElementById('aiMessage').textContent =
      'Add a few transactions and I\'ll analyze your spending patterns.';
    document.getElementById('trendInsight').textContent = 'Your spending data will appear here.';
    document.getElementById('topCategoryInsight').textContent = 'No category data yet.';
    document.getElementById('smartTip').textContent = 'Start tracking daily expenses to get personalized tips.';
    return;
  }

  const categoryTotals = {};
  expenses.forEach((tx) => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
  });

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const topPercent = ((topCategory[1] / totalExpenses) * 100).toFixed(0);

  document.getElementById('aiMessage').textContent =
    `You've spent ${formatCurrency(totalExpenses)} so far. ${topCategory[0]} is your biggest category at ${topPercent}% of total expenses.`;

  document.getElementById('trendInsight').textContent =
    `Total of ${expenses.length} expenses totaling ${formatCurrency(totalExpenses)} this period.`;

  document.getElementById('topCategoryInsight').textContent =
    `${topCategory[0]} leads at ${formatCurrency(topCategory[1])} (${topPercent}% of spending).`;

  const budgetLeft = monthlyBudget - totalExpenses;
  document.getElementById('smartTip').textContent =
    budgetLeft > 0
      ? `You have ${formatCurrency(budgetLeft)} left in your monthly budget. Keep it up!`
      : `You've exceeded your budget by ${formatCurrency(Math.abs(budgetLeft))}. Consider cutting ${topCategory[0]} expenses.`;
};

const switchView = (viewName) => {
  document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));

  document.getElementById(`${viewName}View`).classList.add('active');
  document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
};

const openModal = () => {
  document.getElementById('modalOverlay').classList.add('open');
  renderCategoryChips();
};

const closeModal = () => {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('transactionForm').reset();
  selectedType = 'expense';
  selectedCategory = 'Food';
  document.querySelectorAll('.type-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.type === 'expense');
  });
};

const updateUI = () => {
  updateStats();
  renderTransactionList('recentList', transactions, 5);
  renderTransactionList('fullList', getFilteredTransactions());
  updateCategoryBreakdown();
  updateAIInsights();
};

const initApp = () => {
  setGreeting();
  renderCategoryChips();
  updateUI();

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => switchView(item.dataset.view));
  });

  document.getElementById('openModalBtn').addEventListener('click', openModal);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (event) => {
    if (event.target.id === 'modalOverlay') closeModal();
  });

  document.getElementById('seeAllBtn').addEventListener('click', () => switchView('transactions'));

  document.querySelectorAll('.type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedType = btn.dataset.type;
      selectedCategory = categories[selectedType][0].name;
      document.querySelectorAll('.type-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderCategoryChips();
    });
  });

  document.querySelectorAll('.filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeFilter = tab.dataset.filter;
      document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      renderTransactionList('fullList', getFilteredTransactions());
    });
  });

  document.getElementById('transactionForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);

    if (!description || !amount || amount <= 0) return;

    const newTransaction = {
      id: Date.now(),
      type: selectedType,
      description,
      amount,
      category: selectedCategory,
      date: new Date(),
    };

    transactions.unshift(newTransaction);
    updateUI();
    closeModal();
    showToast(`${selectedType === 'expense' ? 'Expense' : 'Income'} added successfully!`);
  });
};

initApp();
