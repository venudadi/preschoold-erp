// This script generates a detailed system explanation Word document using the docx package.
// Run with: node generate_system_explanation_doc.js

import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import fs from 'fs';

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    text: 'Preschool ERP System - Architecture & Features',
                    heading: HeadingLevel.TITLE,
                }),
                new Paragraph({
                    text: 'System Overview',
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph('This Preschool ERP is a full-stack application designed to manage all aspects of a preschool business, including admissions, billing, classroom management, analytics, and expense tracking. It features a modular Node.js/Express backend, a modern React frontend, and a MySQL database.'),
                new Paragraph({
                    text: 'Architecture',
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph('The system follows a modular architecture with clear separation of concerns:'),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Backend:', bold: true }),
                        new TextRun(' Node.js/Express REST API, modular route files, middleware for security, authentication, and audit logging. Expense management, invoice generation, analytics, and more.'),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Frontend:', bold: true }),
                        new TextRun(' React (Vite), modular components, MUI, glassmorphic theme, role-based dashboards, and protected routes.'),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Database:', bold: true }),
                        new TextRun(' MySQL with normalized tables for users, children, expenses, invoices, audit logs, etc. Migration scripts for schema evolution.'),
                    ],
                }),
                new Paragraph({
                    text: 'Key Modules',
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: '1. User & Role Management',
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph('Supports multiple roles: Super Admin, Owner, Admin, Financial Manager, Teacher, Parent. Role-based access enforced in backend and frontend.'),
                new Paragraph({
                    text: '2. Expense Management',
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph('Log, approve, reject, and analyze expenses. Upload receipts, manage recurring expenses, export to Excel. Full audit logging.'),
                new Paragraph({
                    text: '3. Invoice Management',
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph('Generate invoices in bulk or individually. Download as PDF. Track status and analytics.'),
                new Paragraph({
                    text: '4. Admissions & Enquiries',
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph('Manage child admissions, enquiries, and parent onboarding. Secure parent authentication.'),
                new Paragraph({
                    text: '5. Analytics & Dashboard',
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph('Role-based dashboards with metrics, charts, and export options. Center-level and system-wide analytics.'),
                new Paragraph({
                    text: '6. Security & Audit',
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph('JWT authentication, rate limiting, helmet, input validation, and audit logging for all sensitive actions.'),
                new Paragraph({
                    text: '7. Documentation & Scripts',
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph('PlantUML diagrams, migration scripts, and server management scripts for easy deployment and maintenance.'),
                new Paragraph({
                    text: 'Flow Diagrams',
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph('See PlantUML files in backend/docs for system architecture, invoice flow, and expense approval flow.'),
                new Paragraph({
                    text: 'Conclusion',
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph('This ERP is designed for extensibility, security, and ease of use, supporting all major workflows for a modern preschool business.'),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync('backend/docs/system_explanation.docx', buffer);
    console.log('System explanation Word document generated at backend/docs/system_explanation.docx');
});
