# Preschool ERP System - Comprehensive Product Requirements Document (PRD)

## Executive Summary

The Preschool ERP System is a comprehensive enterprise resource planning solution designed specifically for multi-center preschool and daycare operations. The system provides end-to-end management capabilities including student enrollment, attendance tracking, staff management, financial operations, parent communication, and educational portfolio management.

**Version:** v2.1.0
**Architecture:** Full-stack web application (React frontend + Node.js backend + MySQL database)
**Deployment Status:** Production-ready with 90% completion

## 1. System Architecture

### 1.1 Technology Stack

**Frontend:**
- React 18.2.0 with Vite build system
- Material-UI (MUI) 5.15.2 for UI components
- React Router for navigation
- Framer Motion for animations
- Recharts for data visualization
- Socket.io-client for real-time features

**Backend:**
- Node.js with Express.js framework
- ES6 modules architecture
- Socket.io for WebSocket support
- JWT authentication with session management
- Express Rate Limiting and Helmet for security

**Database:**
- MySQL 2 with 32 migration files
- Comprehensive relational schema
- Indexed tables for performance
- Multi-center data isolation

**Security & Infrastructure:**
- CORS with production-ready configuration
- CSRF protection and security headers
- AWS S3 integration for file storage
- Email notification system (Nodemailer)
- Production deployment with PM2 support

## 2. User Roles & Permissions

### 2.1 Role Hierarchy

1. **Super Admin** - System-wide access across all centers
2. **Owner** - Full access to assigned centers
3. **Financial Manager** - Financial oversight across centers with budget control
4. **Center Director** - Full operational control over assigned center
5. **Admin** - Administrative functions within center
6. **Academic Coordinator** - Academic and operational oversight
7. **Teacher** - Classroom and student management
8. **Parent** - Limited access to own children's information

### 2.2 Permission Matrix

| Feature Category | Super Admin | Owner | Financial Manager | Center Director | Admin | Academic Coordinator | Teacher | Parent |
|------------------|-------------|-------|-------------------|-----------------|-------|----------------------|---------|--------|
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Center Management | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Financial Oversight | ✅ | ✅ | ✅ | Limited | ❌ | ❌ | ❌ | ❌ |
| Staff Management | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Student Management | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | Limited | Limited |
| Portfolio Management | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | View Only |

## 3. Core Modules & Features

### 3.1 Authentication & User Management

**Features:**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Multi-center user assignments
- Password policies and rotation
- Two-factor authentication support (Speakeasy)
- Session management with CSRF protection

**API Endpoints:**
- `/api/auth/login` - User authentication
- `/api/auth/logout` - Session termination
- `/api/auth/verify` - Token validation
- `/api/auth/refresh` - Token refresh

### 3.2 Student Information System

**Features:**
- Comprehensive student profiles with photos
- Multi-center enrollment support
- Parent/guardian information management
- Emergency contact details
- Medical information and allergies
- Student status tracking (active, paused, graduated, withdrawn)
- Class assignment and promotion system

**API Endpoints:**
- `/api/students` - Full CRUD operations
- `/api/students/pause` - Pause student enrollment
- `/api/students/resume` - Resume student enrollment
- `/api/admin-class/promotion` - Class promotion management

**Database Tables:**
- `students` - Core student information
- `student_pause_log` - Pause/resume history
- `student_class_assignments` - Class assignments

### 3.3 Attendance Management

**Features:**
- Real-time attendance tracking
- Entry and exit time logging
- QR code-based check-in/out
- Attendance analytics and reporting
- Late/early pickup notifications
- Attendance history and patterns

**API Endpoints:**
- `/api/attendance` - Daily attendance operations
- `/api/attendance/reports` - Attendance analytics

**Database Tables:**
- `attendance_records` - Daily attendance data
- `attendance_exit_tracking` - Entry/exit timestamps

### 3.4 Classroom Management

**Features:**
- Classroom creation and configuration
- Teacher assignments
- Student enrollment per classroom
- Capacity management
- Age group categorization
- Program timing and schedules

**API Endpoints:**
- `/api/classrooms` - Classroom CRUD operations

**Database Tables:**
- `classrooms` - Classroom information
- `staff_assignments` - Teacher-classroom assignments

### 3.5 Staff Management

**Features:**
- Comprehensive staff profiles
- Role assignments and permissions
- Staff scheduling system
- Performance tracking
- Training records
- Emergency contacts

**API Endpoints:**
- `/api/staff` - Staff management operations
- `/api/center-director` - Director-specific functions

**Database Tables:**
- `users` - Staff user accounts
- `staff_assignments` - Role assignments

### 3.6 Financial Management

**Features:**
- Dynamic fee structure configuration
- Invoice generation and management
- Payment tracking and processing
- Budget approval system with role-based limits
- Expense tracking and categorization
- Financial analytics and reporting
- Multi-currency support

**API Endpoints:**
- `/api/invoices` - Invoice operations
- `/api/invoices/requests` - Invoice requests
- `/api/expenses` - Expense management
- `/api/fee-structures` - Fee configuration
- `/api/financial-manager` - Financial oversight

**Database Tables:**
- `fee_structures` - Fee configurations
- `invoices` - Invoice records
- `invoice_requests` - Payment requests
- `expenses` - Expense tracking
- `budget_approvals` - Budget approval workflow
- `budget_approval_limits` - Role-based spending limits

### 3.7 Parent Communication

**Features:**
- Secure messaging system
- Classroom announcements
- Parent feedback collection
- Digital portfolio sharing
- Parent portal access
- Real-time notifications

**API Endpoints:**
- `/api/messaging` - Communication system
- `/api/parent` - Parent portal features
- `/api/classroom-announcements` - Announcements

**Database Tables:**
- `messages` - Communication records
- `parent_feedback` - Feedback collection
- `classroom_announcements` - Announcements

### 3.8 Digital Portfolio System

**Features:**
- Photo and video portfolio management
- Teacher upload capabilities with camera integration
- Admin oversight across all portfolios
- Portfolio analytics and statistics
- Offline support with sync capabilities
- Image processing and optimization
- Favorite marking and categorization

**API Endpoints:**
- `/api/digital-portfolio` - Portfolio operations
- `/api/digital-portfolio/center/all` - Admin access
- `/api/digital-portfolio/center/stats` - Portfolio analytics

**Database Tables:**
- `digital_portfolio` - Portfolio items
- Portfolio statistics and metadata

### 3.9 Academic Management

**Features:**
- Lesson plan creation and management
- Assignment tracking
- Observation logs
- Student progress monitoring
- Curriculum management
- Assessment tools

**API Endpoints:**
- `/api/lesson-plans` - Lesson planning
- `/api/assignments` - Assignment management
- `/api/observation-logs` - Student observations

**Database Tables:**
- `lesson_plans` - Lesson planning data
- `assignments` - Assignment tracking
- `observation_logs` - Student observations

### 3.10 Document Management

**Features:**
- Centralized document storage
- Role-based document access
- Document categorization
- Version control
- Bulk upload capabilities
- Integration with student/staff profiles

**API Endpoints:**
- `/api/documents` - Document operations

**Database Tables:**
- `documents` - Document metadata
- `document_associations` - Entity relationships

### 3.11 Emergency Management System

**Features:**
- Emergency alert system
- Drill scheduling and tracking
- Emergency contact management
- Evacuation procedures
- Incident reporting
- Safety compliance tracking

**Database Tables:**
- `emergency_alerts` - Alert management
- `emergency_contacts` - Contact information
- `emergency_procedures` - Procedures and protocols
- `emergency_drill_logs` - Drill tracking

### 3.12 Analytics & Reporting

**Features:**
- Comprehensive dashboard analytics
- Real-time metrics and KPIs
- Center performance comparison
- Financial reporting
- Attendance analytics
- Custom report generation
- Data visualization with charts

**API Endpoints:**
- `/api/analytics` - Analytics data

**Components:**
- Multiple dashboard variants for different roles
- Chart containers and metric cards
- Performance analytics

## 4. Technical Features

### 4.1 Real-time Capabilities

- WebSocket integration with Socket.io
- Real-time dashboard updates
- Live attendance tracking
- Instant messaging and notifications
- Center-specific room management

### 4.2 Multi-Center Support

- Center-based data isolation
- Cross-center analytics for owners
- Center-specific configurations
- Hierarchical user management
- Center comparison tools

### 4.3 Security Features

- Production-ready CORS configuration
- CSRF protection and security headers
- Rate limiting and request validation
- Secure file upload handling
- Data encryption and hashing
- Session management and timeout
- SQL injection prevention

### 4.4 Performance Optimization

- Database indexing for critical queries
- Pagination for large datasets
- Image optimization and compression
- Lazy loading and code splitting
- Offline support with service workers
- Connection pooling
- Caching mechanisms

### 4.5 Mobile & Responsive Design

- Fully responsive Material-UI components
- Touch-friendly interfaces
- Mobile-optimized navigation
- Responsive grid layouts
- Touch gestures support

## 5. Integration Capabilities

### 5.1 External Services

- **AWS S3** - File storage and management
- **Email Services** - SMTP integration for notifications
- **SMS Integration** - Text messaging capabilities
- **Payment Gateways** - Payment processing integration
- **Backup Services** - Automated backup solutions

### 5.2 API Architecture

- RESTful API design
- Consistent error handling
- Request/response validation
- API versioning support
- Rate limiting and throttling
- Comprehensive logging

## 6. Data Model Overview

### 6.1 Core Entities

**Centers** - Multi-location support
**Users** - Staff and parent accounts
**Students** - Student information and profiles
**Classrooms** - Classroom and program management
**Attendance** - Daily attendance tracking
**Invoices** - Financial transactions
**Portfolios** - Digital content management
**Messages** - Communication system
**Documents** - Document management
**Emergency** - Safety and emergency management

### 6.2 Relationships

- Centers → Users (one-to-many)
- Centers → Students (one-to-many)
- Centers → Classrooms (one-to-many)
- Classrooms → Students (many-to-many)
- Users → Staff Assignments (one-to-many)
- Students → Attendance Records (one-to-many)
- Students → Portfolio Items (one-to-many)

## 7. Current Development Status

### 7.1 Completed Features ✅

- Complete authentication and authorization system
- Multi-center architecture
- Student management with pause/resume functionality
- Staff management and scheduling
- Digital portfolio system with admin oversight
- Financial management with budget controls
- Attendance tracking system
- Parent communication platform
- Emergency management system
- Real-time WebSocket integration
- Comprehensive role-based permissions
- Production security implementation

### 7.2 Recent Major Updates

**v2.1.0 Features:**
- Camera integration for portfolio uploads
- Student pause functionality
- Enhanced offline support
- Admin portfolio oversight
- Performance optimizations

**v2.0.0 Features:**
- Comprehensive ERP functionality
- Multi-role dashboard system
- Advanced financial management
- Emergency alert system
- Center director and financial manager roles

### 7.3 Production Readiness

**Current Status: 90% Production Ready**

**Completed:**
- Security hardening with CSRF protection
- Production CORS configuration
- SSL/TLS preparation
- Performance optimization
- Comprehensive testing framework

**Remaining:**
- Final environment configuration
- SSL certificate installation
- Production database setup
- Monitoring and logging configuration

## 8. System Requirements

### 8.1 Server Requirements

**Minimum:**
- 4 GB RAM
- 2 CPU cores
- 50 GB storage
- Node.js 16+
- MySQL 8.0+

**Recommended:**
- 8 GB RAM
- 4 CPU cores
- 100 GB SSD storage
- Load balancer setup
- Redis caching layer

### 8.2 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 9. Deployment Architecture

### 9.1 Production Setup

- **Frontend**: Static file serving (Nginx/Apache)
- **Backend**: PM2 cluster mode with load balancing
- **Database**: MySQL with replication setup
- **File Storage**: AWS S3 with CDN
- **Monitoring**: Application and infrastructure monitoring
- **Backup**: Automated database and file backups

### 9.2 Scalability Plan

- Horizontal scaling with multiple server instances
- Database read replicas for performance
- CDN integration for global content delivery
- Microservices architecture consideration for future growth

## 10. Security Framework

### 10.1 Data Protection

- Encryption at rest and in transit
- PII data handling compliance
- GDPR compliance considerations
- Data retention policies
- Secure file upload validation

### 10.2 Access Control

- Role-based access control (RBAC)
- Multi-factor authentication
- Session management
- API rate limiting
- Audit trail logging

## 11. Future Roadmap

### 11.1 Planned Enhancements

**Short-term (3-6 months):**
- Advanced reporting and analytics
- Mobile app development
- Integration with learning management systems
- Enhanced parent portal features

**Medium-term (6-12 months):**
- AI-powered insights and recommendations
- Advanced scheduling algorithms
- Integration with payment processors
- Multi-language support

**Long-term (1+ years):**
- Franchise management capabilities
- Advanced business intelligence
- Integration with government reporting systems
- White-label solutions

## 12. Support & Maintenance

### 12.1 Documentation

- API documentation
- User manuals for each role
- Administrator guides
- Deployment documentation
- Security best practices

### 12.2 Training & Support

- Role-based training materials
- Video tutorials
- System administration guides
- Troubleshooting documentation
- Support ticket system

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Prepared By:** System Analysis
**Status:** Current Implementation Analysis

This PRD represents the comprehensive analysis of the currently implemented Preschool ERP System, documenting all features, capabilities, and technical specifications as they exist in the codebase.