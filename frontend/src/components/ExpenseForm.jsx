import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ExpenseForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    date: '',
    amount: '',
    description: '',
    category: '',
    subcategory: '',
    payment_mode: '',
    vendor: '',
    GST: '',
    proforma_invoice_number: '',
    recurring: 'No',
    recurring_type: '',
    next_due_date: '',
    receipt: null,
  });
  const [showRecurring, setShowRecurring] = useState(false);
  const [categories] = useState([
    'operational', 'capital', 'marketing', 'compliance', 'utilities', 'payroll', 'maintenance', 'IT', 'training', 'other',
  ]);
  const [paymentModes] = useState(['cheque', 'cash', 'UPI', 'online', 'RTGS']);

  useEffect(() => {
    setShowRecurring(form.recurring === 'Yes');
  }, [form.recurring]);

  useEffect(() => {
    if (showRecurring && form.recurring_type && form.date) {
      const date = new Date(form.date);
      let next = new Date(date);
      if (form.recurring_type === 'monthly') next.setMonth(date.getMonth() + 1);
      if (form.recurring_type === 'quarterly') next.setMonth(date.getMonth() + 3);
      if (form.recurring_type === 'yearly') next.setFullYear(date.getFullYear() + 1);
      setForm(f => ({ ...f, next_due_date: next.toISOString().slice(0, 10) }));
    }
  }, [form.recurring_type, form.date, showRecurring]);

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({ ...f, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    let receipt_image_url = '';
    if (form.receipt) {
      const data = new FormData();
      data.append('receipt', form.receipt);
      const uploadRes = await api.post('/expenses/upload-receipt', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      receipt_image_url = uploadRes.data.filePath;
    }
    const payload = { ...form, receipt_image_url };
    delete payload.receipt;
    await api.post('/expenses/log', payload);
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Log Expense</h3>
      <input type="date" name="date" value={form.date} onChange={handleChange} required />
      <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="Amount" required />
      <input type="text" name="description" value={form.description} onChange={handleChange} placeholder="Description" />
      <select name="category" value={form.category} onChange={handleChange} required>
        <option value="">Select Category</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="text" name="subcategory" value={form.subcategory} onChange={handleChange} placeholder="Subcategory" />
      <select name="payment_mode" value={form.payment_mode} onChange={handleChange} required>
        <option value="">Select Payment Mode</option>
        {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <input type="text" name="vendor" value={form.vendor} onChange={handleChange} placeholder="Vendor" />
      <input type="text" name="GST" value={form.GST} onChange={handleChange} placeholder="GST (optional)" />
      <input type="text" name="proforma_invoice_number" value={form.proforma_invoice_number} onChange={handleChange} placeholder="Proforma Invoice Number (optional)" />
      <select name="recurring" value={form.recurring} onChange={handleChange}>
        <option value="No">No</option>
        <option value="Yes">Yes</option>
      </select>
      {showRecurring && (
        <>
          <select name="recurring_type" value={form.recurring_type} onChange={handleChange} required>
            <option value="">Select Recurring Type</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <input type="date" name="next_due_date" value={form.next_due_date} readOnly />
        </>
      )}
      <input type="file" name="receipt" accept="image/*" onChange={handleChange} />
      <button type="submit">Log Expense</button>
    </form>
  );
};

export default ExpenseForm;
