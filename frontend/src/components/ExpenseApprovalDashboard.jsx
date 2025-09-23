import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ExpenseApprovalDashboard = ({ onAction }) => {
  const [pending, setPending] = useState([]);
  const [actionNote, setActionNote] = useState({});

  useEffect(() => {
    api.get('/expenses?status=pending').then(res => {
      setPending(res.data.expenses || []);
    });
  }, [onAction]);

  const handleApprove = async (expense_id) => {
    await api.post(`/expenses/approve/${expense_id}`);
    if (onAction) onAction();
  };

  const handleReject = async (expense_id) => {
    await api.post(`/expenses/reject/${expense_id}`, { approval_notes: actionNote[expense_id] || '' });
    if (onAction) onAction();
  };

  return (
    <div>
      <h3>Pending Expense Approvals</h3>
      {pending.length === 0 && <div>No pending requests.</div>}
      {pending.map(exp => (
        <div key={exp.expense_id} style={{ border: '1px solid #ccc', margin: 8, padding: 8 }}>
          <div><b>Date:</b> {exp.date}</div>
          <div><b>Amount:</b> {exp.amount}</div>
          <div><b>Description:</b> {exp.description}</div>
          <div><b>Category:</b> {exp.category}</div>
          <div><b>Payment Mode:</b> {exp.payment_mode}</div>
          <div><b>Vendor:</b> {exp.vendor}</div>
          <div><b>Recurring:</b> {exp.recurring} {exp.recurring_type && `(${exp.recurring_type})`}</div>
          <div><b>GST:</b> {exp.GST}</div>
          <div><b>Proforma Invoice:</b> {exp.proforma_invoice_number}</div>
          {exp.receipt_image_url && <div><a href={`/${exp.receipt_image_url}`} target="_blank" rel="noopener noreferrer">View Receipt</a></div>}
          <textarea
            placeholder="Approval notes (optional for reject)"
            value={actionNote[exp.expense_id] || ''}
            onChange={e => setActionNote(a => ({ ...a, [exp.expense_id]: e.target.value }))}
          />
          <button onClick={() => handleApprove(exp.expense_id)}>Approve</button>
          <button onClick={() => handleReject(exp.expense_id)}>Reject</button>
        </div>
      ))}
    </div>
  );
};

export default ExpenseApprovalDashboard;
