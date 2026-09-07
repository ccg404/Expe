(() => {
    'use strict';

    const CURRENCY = 'PHP';
    const STORAGE_KEY = 'expe.expenses';

    const currencyFormatter = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: CURRENCY,
    });

    const dateFormatter = new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const modal = document.getElementById('modalOverlay');
    const openBtn = document.getElementById('addBtn');
    const form = document.getElementById('entryForm');

    const fields = {
        category: document.getElementById('category'),
        amount: document.getElementById('amount'),
        expenseDate: document.getElementById('expenseDate'),
    };

    const errors = {
        category: document.getElementById('categoryError'),
        amount: document.getElementById('amountError'),
        expenseDate: document.getElementById('dateError'),
    };

    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');
    const totalSpent = document.getElementById('total-spent');

    const loadExpenses = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(parsed)) return [];
            // Sanitize persisted data so corrupt entries can't crash rendering
            return parsed
                .filter((entry) => entry && typeof entry === 'object')
                .map((entry) => ({
                    category: String(entry.category ?? 'Other'),
                    amount: Number(entry.amount),
                    date: String(entry.date ?? ''),
                }))
                .filter((entry) => Number.isFinite(entry.amount) && entry.amount > 0 && entry.date);
        } catch {
            return [];
        }
    };

    const saveExpenses = (expenses) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    };

    const setFieldError = (key, hasError) => {
        const input = fields[key];
        const message = errors[key];
        if (!input || !message) return;
        input.setAttribute('aria-invalid', hasError ? 'true' : 'false');
        input.setAttribute('aria-describedby', hasError ? message.id : '');
        message.hidden = !hasError;
    };

    const validate = () => {
        let firstInvalid = null;

        const categoryOk = fields.category.value !== '';
        setFieldError('category', !categoryOk);
        if (!categoryOk) firstInvalid = fields.category;

        const amountValue = Number(fields.amount.value);
        const amountOk = fields.amount.value !== '' && Number.isFinite(amountValue) && amountValue > 0;
        setFieldError('amount', !amountOk);
        if (!amountOk && !firstInvalid) firstInvalid = fields.amount;

        const dateOk = fields.expenseDate.value !== '';
        setFieldError('expenseDate', !dateOk);
        if (!dateOk && !firstInvalid) firstInvalid = fields.expenseDate;

        if (firstInvalid) {
            firstInvalid.focus();
            return null;
        }

        return {
            category: fields.category.value,
            amount: amountValue,
            date: fields.expenseDate.value,
        };
    };

    const render = (expenses) => {
        historyList.textContent = '';

        for (const expense of expenses) {
            const item = document.createElement('li');
            item.className = 'history-item';

            const category = document.createElement('span');
            category.className = 'category';
            category.textContent = expense.category;

            const parsedDate = new Date(`${expense.date}T00:00:00`);
            const date = document.createElement('span');
            date.className = 'date';
            date.textContent = Number.isNaN(parsedDate.getTime())
                ? expense.date
                : dateFormatter.format(parsedDate);

            const amount = document.createElement('span');
            amount.className = 'amount';
            amount.textContent = currencyFormatter.format(expense.amount);

            item.append(category, date, amount);
            historyList.append(item);
        }

        historyEmpty.hidden = expenses.length > 0;

        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        totalSpent.textContent = currencyFormatter.format(total);
    };

    const clearErrors = () => {
        for (const key of Object.keys(fields)) {
            setFieldError(key, false);
        }
    };

    const resetForm = () => {
        form.reset();
        clearErrors();
    };

    openBtn.addEventListener('click', () => {
        resetForm();
        // showModal() moves focus to the first focusable control (the category select)
        modal.showModal();
    });

    // Fires for Cancel button, × button, and Esc key (all close via method="dialog")
    modal.addEventListener('close', () => {
        clearErrors();
        openBtn.focus();
    });

    // Close when the backdrop (the dialog element itself) is clicked
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.close();
        }
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const entry = validate();
        if (!entry) return;

        const expenses = loadExpenses();
        expenses.push(entry);
        saveExpenses(expenses);
        render(expenses);

        modal.close();
    });

    render(loadExpenses());
})();