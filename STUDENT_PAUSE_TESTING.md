# Student Pause Functionality - Testing Guide

## Overview
This guide covers testing the newly implemented student pause functionality in the preschool ERP system.

## Prerequisites

1. **Database Migration**: Run the migration to add pause functionality
```bash
cd backend
node migrate.js
```

2. **Backend Dependencies**: Ensure all backend dependencies are installed
```bash
cd backend
npm install
```

3. **Frontend Dependencies**: Ensure all frontend dependencies are installed
```bash
cd frontend
npm install
```

## Testing Steps

### 1. Database Setup
First, verify that the migration ran successfully:

```sql
-- Check if the pause columns were added to children table
DESCRIBE children;

-- Check if student_pause_history table was created
DESCRIBE student_pause_history;

-- Verify the students view includes pause information
SELECT * FROM students LIMIT 1;

-- Check if the paused_students view was created
DESCRIBE paused_students;
```

### 2. Backend API Testing

#### Start the Backend Server
```bash
cd backend
npm run dev
```

#### Test Pause Endpoints (using Postman or curl)

**Get All Students (including pause info):**
```bash
curl -X GET "http://localhost:5000/api/students" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Session-Token: YOUR_SESSION_TOKEN"
```

**Get Paused Students:**
```bash
curl -X GET "http://localhost:5000/api/students/paused" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Session-Token: YOUR_SESSION_TOKEN"
```

**Pause a Student:**
```bash
curl -X PATCH "http://localhost:5000/api/students/STUDENT_ID/pause" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Session-Token: YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pause_start_date": "2024-01-15",
    "pause_end_date": "2024-01-30",
    "reason": "Family vacation",
    "notes": "Will return after winter break"
  }'
```

**Resume a Student:**
```bash
curl -X PATCH "http://localhost:5000/api/students/STUDENT_ID/resume" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Session-Token: YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Student has returned and ready to resume classes"
  }'
```

**Get Pause History:**
```bash
curl -X GET "http://localhost:5000/api/students/STUDENT_ID/pause-history" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Session-Token: YOUR_SESSION_TOKEN"
```

### 3. Frontend Testing

#### Start the Frontend Server
```bash
cd frontend
npm run dev
```

#### Test UI Components

1. **Navigate to Student Management Page**
   - Go to Children Management section
   - Verify that the student list shows:
     - Status column with colored chips
     - Pause/Resume action buttons based on student status
     - Two tabs: "All Students" and "Paused Students"

2. **Test Student Pause Flow**
   - Click the pause button (⏸️) for an active student
   - Fill out the pause modal:
     - Set start date (tomorrow or later)
     - Set end date (after start date)
     - Enter reason for pause
     - Add optional notes
   - Submit and verify success message
   - Verify student status changed to "Paused"

3. **Test Student Resume Flow**
   - Find a paused student
   - Click the resume button (▶️)
   - Add optional resume notes
   - Submit and verify success message
   - Verify student status changed back to "Active"

4. **Test Paused Students View**
   - Click on "Paused Students" tab
   - Verify the dedicated view shows:
     - Summary cards with counts
     - DataGrid with paused student details
     - Status indicators (expired, due soon, etc.)
     - Resume and details buttons

5. **Test Status Filtering**
   - Use the status filter dropdown
   - Test filtering by: All, Active, Paused, Left
   - Verify results update accordingly

### 4. Integration Testing

#### Test Attendance System Integration
1. **Verify Paused Students Excluded from Attendance**
   - Pause a student
   - Go to Attendance Management
   - Verify the paused student doesn't appear in daily attendance lists

2. **Test Auto-Resume Functionality**
   - Create a pause with an end date in the past
   - Run the auto-resume stored procedure:
   ```sql
   CALL AutoResumeExpiredPauses();
   ```
   - Verify the student status changed back to "active"

#### Test Admin Routes Integration
1. **Children List API**
   - Call `/api/admin/children`
   - Verify pause information is included in response

### 5. Error Handling Testing

#### Test Validation Errors
1. **Invalid Pause Dates**
   - Try to set end date before start date
   - Try to set start date in the past
   - Verify appropriate error messages

2. **Duplicate Operations**
   - Try to pause an already paused student
   - Try to resume a non-paused student
   - Verify appropriate error messages

3. **Authorization Testing**
   - Test with non-admin user roles
   - Verify only admins can pause/resume students

#### Test Database Constraints
1. **Foreign Key Constraints**
   - Verify user relationships work correctly
   - Test center access restrictions

2. **Data Integrity**
   - Verify pause history records are created correctly
   - Test transaction rollbacks on errors

### 6. Performance Testing

#### Test with Large Data Sets
1. **Bulk Operations**
   - Test with multiple paused students
   - Verify performance of filtered queries

2. **Index Usage**
   - Verify database indexes are being used efficiently
   - Check query execution plans

### 7. User Experience Testing

#### Test Responsive Design
1. **Mobile/Tablet Views**
   - Test pause modals on smaller screens
   - Verify table responsiveness

2. **Accessibility**
   - Test with screen readers
   - Verify keyboard navigation
   - Check color contrast for status indicators

#### Test User Workflow
1. **Complete Pause Cycle**
   - Pause a student → View in paused list → Resume student
   - Verify all steps work smoothly

2. **Error Recovery**
   - Test network failures during operations
   - Verify user can recover from errors

## Expected Results

### Successful Implementation Should Show:

1. **Database Layer**
   - ✅ New columns added to children table
   - ✅ student_pause_history table created
   - ✅ Views updated with pause information
   - ✅ Indexes created for performance

2. **Backend API**
   - ✅ All CRUD operations for pause functionality
   - ✅ Proper validation and error handling
   - ✅ Role-based access control
   - ✅ Transaction management

3. **Frontend Components**
   - ✅ Intuitive pause/resume UI
   - ✅ Status indicators and filtering
   - ✅ Dedicated paused students view
   - ✅ Comprehensive modals with validation

4. **System Integration**
   - ✅ Attendance system excludes paused students
   - ✅ Auto-resume functionality
   - ✅ Audit trail maintained

## Troubleshooting

### Common Issues

1. **Migration Fails**
   - Check MySQL version compatibility
   - Verify user permissions
   - Check for existing column conflicts

2. **Frontend Build Errors**
   - Ensure all Material-UI dependencies are installed
   - Check for missing imports

3. **API Authorization Errors**
   - Verify JWT tokens are valid
   - Check user roles and permissions

4. **Database Connection Issues**
   - Verify database credentials
   - Check network connectivity

### Debug Commands

```bash
# Check backend logs
cd backend && npm run dev

# Check database connections
node backend/check-db.js

# Verify migration status
node backend/migrate.js --status
```

## Success Criteria

- [ ] Database migration completes successfully
- [ ] All API endpoints respond correctly
- [ ] Frontend components render and function properly
- [ ] Student pause/resume operations work end-to-end
- [ ] Paused students are excluded from attendance
- [ ] Auto-resume functionality works
- [ ] Proper error handling and validation
- [ ] Role-based access control enforced
- [ ] Audit trail maintained in history table

The implementation is complete when all these criteria are met and the system handles the student pause workflow seamlessly.