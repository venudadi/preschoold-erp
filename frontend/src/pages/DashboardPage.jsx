import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, 
    Typography, 
    Grid, 
    Button,
    ButtonGroup,
    useMediaQuery,
    useTheme,
    Alert,
    Card,
    CardContent,
    Chip,
    CardActionArea,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReceiptIcon from '@mui/icons-material/Receipt';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ClassIcon from '@mui/icons-material/Class';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import DashboardIcon from '@mui/icons-material/Dashboard';


import AdminDashboard from '../components/AdminDashboard.jsx';
import TeacherDashboard from '../components/TeacherDashboard.jsx';
import ParentDashboard from '../components/ParentDashboard.jsx';
import OwnerDashboard from '../components/OwnerDashboard.jsx';
import SuperAdminDashboard from '../components/SuperAdminDashboard.jsx';
import FinancialManagerDashboard from '../components/FinancialManagerDashboard.jsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];


const DashboardPage = () => {
  let user = {};
  try {
    const raw = localStorage.getItem('user');
    user = raw ? JSON.parse(raw) : {};
  } catch (e) {
    user = {};
  }
  switch (user.role) {
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'teacher':
      return <TeacherDashboard user={user} />;
    case 'parent':
      return <ParentDashboard user={user} />;
    case 'owner':
      return <OwnerDashboard user={user} />;
    case 'super_admin':
      return <SuperAdminDashboard user={user} />;
    case 'financial_manager':
      return <FinancialManagerDashboard user={user} />;
    default:
      return <div>Welcome{user?.fullName ? `, ${user.fullName}` : ''}.</div>;
  }
};

export default DashboardPage;

