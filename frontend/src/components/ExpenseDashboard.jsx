import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import './ExpenseDashboard.css';

const ExpenseDashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/expenses').then(res => {
      setExpenses(res.data.expenses || []);
      setLoading(false);
    });
  }, []);

  const handleExport = async () => {
    const res = await api.get('/expenses/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box className="glass-card" sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>Expense Dashboard</Typography>
      <Button className="gradient-btn" startIcon={<DownloadIcon />} onClick={handleExport}>
        Export to Excel
      </Button>
      {loading ? <Typography>Loading...</Typography> : (
        <Box sx={{ mt: 2 }}>
          {expenses.length === 0 ? <Typography>No expenses found.</Typography> : (
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Recurring</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.expense_id}>
                    <td>{exp.date}</td>
                    <td>{exp.amount}</td>
                    <td>{exp.category}</td>
                    <td>{exp.status}</td>
                    <td>{exp.recurring === 'Yes' ? `${exp.recurring_type}` : 'No'}</td>
                    <td>{exp.receipt_image_url && <a href={`/${exp.receipt_image_url}`} target="_blank" rel="noopener noreferrer">View</a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ExpenseDashboard;
