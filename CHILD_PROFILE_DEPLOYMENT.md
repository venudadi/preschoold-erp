# Child Profile System - Deployment Guide

## ✅ MySQL Promise Compliance Verification

All queries in the child profile system are **100% MySQL promise-compliant** using `mysql2/promise`:

### Backend Queries ([adminRoutes.js:147-340](backend/adminRoutes.js#L147-L340))

```javascript
// ✅ Correct mysql2/promise pattern
const [childRows] = await pool.query(childSql, [id]);
const [parents] = await pool.query(parentsSql, [id]);
const [billingRows] = await pool.query(billingSql, [id]);
```

All queries use:
- `await pool.query(sql, params)` - Returns a Promise
- Destructuring pattern `const [rows] = ...` - Extracts result rows
- Parameterized queries with `?` placeholders - Prevents SQL injection

**Status**: ✅ All queries are compliant with mysql2/promise

---

## 📋 Database Schema Requirements

The system requires these tables (already exist in 000_initial_schema.sql):

### 1. `parents` Table
```sql
CREATE TABLE IF NOT EXISTS parents (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    relationship_to_child ENUM('Mother', 'Father', 'Guardian', 'Other') DEFAULT 'Guardian',
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. `parent_children` Junction Table
```sql
CREATE TABLE IF NOT EXISTS parent_children (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,
    child_id VARCHAR(36) NOT NULL,
    relationship_type ENUM('Mother', 'Father', 'Guardian', 'Other') DEFAULT 'Guardian',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_parent_child (parent_id, child_id)
);
```

### 3. `children` Table Fields Used
```sql
-- Essential columns:
id, first_name, last_name, date_of_birth, gender, student_id, status,
center_id, classroom_id, company_id, has_tie_up, allergies,
emergency_contact_name, emergency_contact_phone, medical_info,
service_hours, program_start_time, program_end_time,
pause_start_date, pause_end_date, pause_reason, created_at
```

### 4. Foreign Key Constraints
```sql
-- Add these if not already present:
ALTER TABLE parent_children
ADD CONSTRAINT fk_parent_children_parent
FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;

ALTER TABLE parent_children
ADD CONSTRAINT fk_parent_children_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;
```

---

## 🚀 Deployment Steps

### Step 1: Verify Database Schema

Run this query to check if all required tables exist:

```sql
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('parents', 'parent_children', 'children', 'invoices', 'classrooms', 'centers', 'companies');
```

**Expected Result**: All 7 tables should be present.

---

### Step 2: Seed Test Parents (CRITICAL!)

**⚠️ IMPORTANT**: Every child MUST have at least 1 parent (non-negotiable requirement).

Run the seed script to create test parents and link orphaned children:

```bash
# On the DigitalOcean server or database client:
mysql -h YOUR_DB_HOST -u YOUR_DB_USER -p YOUR_DB_NAME < backend/scripts/seed_test_parents.sql
```

This script will:
1. Create 7 test parents with `@vanisris.com` email addresses:
   - Priya Sharma (priya.sharma@vanisris.com) - Mother
   - Raj Sharma (raj.sharma@vanisris.com) - Father
   - Anita Kumar (anita.kumar@vanisris.com) - Mother
   - Amit Kumar (amit.kumar@vanisris.com) - Father
   - Sunita Reddy (sunita.reddy@vanisris.com) - Guardian
   - Meera Patel (meera.patel@vanisris.com) - Mother
   - Vikram Patel (vikram.patel@vanisris.com) - Father

2. Link all children without parents to these test parents
3. Verify all children have at least 1 parent

---

### Step 3: Verify Parent-Child Relationships

Run this verification query:

```sql
-- Check all children have parents
SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.student_id,
    COUNT(pc.id) as parent_count,
    GROUP_CONCAT(CONCAT(p.first_name, ' ', p.last_name) SEPARATOR ', ') as parents
FROM children c
LEFT JOIN parent_children pc ON c.id = pc.child_id
LEFT JOIN parents p ON pc.parent_id = p.id
GROUP BY c.id
HAVING parent_count = 0;
```

**Expected Result**: ZERO rows (no children without parents)

---

### Step 4: Test the Profile Endpoint

Test the backend API endpoint:

```bash
# Replace with actual child ID from your database
curl -X GET "https://YOUR_API_URL/api/admin/children/CHILD_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Session-Token: YOUR_SESSION_TOKEN"
```

**Expected Response**:
```json
{
  "child": {
    "id": "...",
    "first_name": "...",
    "full_name": "...",
    "age": {"years": 3, "months": 6},
    "student_id": "NKD2511001",
    ...
  },
  "parents": [
    {
      "full_name": "Priya Sharma",
      "email": "priya.sharma@vanisris.com",
      "phone": "+91-9876543210",
      "relationship": "Mother",
      "is_primary": true
    }
  ],
  "billing": {...},
  "classroom": {...},
  "center": {...}
}
```

---

### Step 5: Deploy Frontend Changes

The frontend changes are already committed:
- `ChildProfileModal.jsx` - Modal component
- `ChildList.jsx` - Integration with View button
- `api.js` - getChildProfile() function

Deploy to DigitalOcean:

```bash
# Commit is already done:
# 65a9dc9 feat: Add comprehensive child profile viewing system

# Push to your deployment branch
git push origin staging-clean
```

DigitalOcean App Platform will auto-deploy.

---

### Step 6: Test in Production

1. **Login** as admin, super_admin, or center_director
2. **Navigate** to Children Management page
3. **Click** the eye icon (👁️) on any student row
4. **Verify** the modal shows:
   - Child details (name, age, DOB, student ID)
   - All parents with contact information
   - Billing summary
   - Company tie-up (if applicable)
   - Emergency contacts
   - Medical information

---

## 🔍 Troubleshooting

### Issue 1: "Child not found" Error

**Cause**: Child ID doesn't exist
**Fix**: Verify child exists in database:
```sql
SELECT id, first_name, last_name FROM children LIMIT 10;
```

### Issue 2: No Parents Showing

**Cause**: parent_children relationships missing
**Fix**: Run the seed script (Step 2)

### Issue 3: 403 Forbidden Error

**Cause**: User role doesn't have access
**Fix**: Ensure user has role: `admin`, `super_admin`, `center_director`, or `owner`

### Issue 4: MySQL Syntax Error

**Cause**: Database doesn't support syntax
**Fix**: All queries are MySQL 5.7+ compatible. Verify MySQL version:
```sql
SELECT VERSION();
```

---

## 📝 SQL Query Breakdown

### Query 1: Child Information
```sql
SELECT
    c.id, c.first_name, c.last_name, c.date_of_birth, c.gender,
    c.student_id, c.status, c.allergies, c.emergency_contact_name,
    cl.name as classroom_name,
    ce.name as center_name,
    co.company_name
FROM children c
LEFT JOIN classrooms cl ON c.classroom_id = cl.id
LEFT JOIN centers ce ON c.center_id = ce.id
LEFT JOIN companies co ON c.company_id = co.id
WHERE c.id = ?
```

### Query 2: Parents Information
```sql
SELECT
    p.id, p.first_name, p.last_name, p.email, p.phone_number,
    pc.relationship_type, pc.is_primary
FROM parent_children pc
JOIN parents p ON pc.parent_id = p.id
WHERE pc.child_id = ?
ORDER BY pc.is_primary DESC
```

### Query 3: Billing Summary
```sql
SELECT
    SUM(CASE WHEN status IN ('Sent', 'Partial', 'Overdue') THEN balance ELSE 0 END) as outstanding_balance,
    SUM(amount_paid) as total_paid,
    MAX(payment_date) as last_payment_date,
    COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as overdue_count
FROM invoices
WHERE child_id = ?
```

---

## 🔐 Security Features

1. **Role-Based Access Control**
   - Only admin, super_admin, center_director, owner can access
   - Center filtering for non-super_admin users

2. **SQL Injection Prevention**
   - All queries use parameterized statements
   - No string concatenation of user input

3. **Authentication Required**
   - JWT token + session token required
   - CSRF token for modifications (future)

---

## 📊 Test Data Summary

After running seed script, you'll have:
- **7 test parents** with @vanisris.com emails
- **3 parent couples** (Mother + Father)
- **1 single guardian**
- **All children linked** to at least 1 parent

Parent distribution:
- Children #1, #4, #7, ... → Sharma family
- Children #2, #5, #8, ... → Kumar family
- Children #3, #6, #9, ... → Guardian or Patel family

---

## ✅ Verification Checklist

Before marking deployment as complete:

- [ ] All queries are mysql2/promise compliant ✅
- [ ] parent_children table exists
- [ ] Test parents created with @vanisris.com emails
- [ ] All children have at least 1 parent linked
- [ ] Backend endpoint returns 200 with profile data
- [ ] Frontend modal displays all sections
- [ ] Age calculation works (years + months)
- [ ] Billing summary displays correctly
- [ ] Company tie-up shows when applicable
- [ ] Emergency contacts visible
- [ ] Medical info/allergies show warnings

---

## 🎯 Next Steps (Future Enhancement)

Edit functionality is prepared but not yet implemented:
1. Backend routes for updating child info
2. Backend routes for managing parents (add/remove/edit)
3. Frontend edit mode in modal
4. Validation to enforce minimum 1 parent

The "Edit Profile" button is visible but not functional yet.

---

## 📞 Support

If issues arise:
1. Check DigitalOcean runtime logs
2. Verify database connection in backend logs
3. Check browser console for frontend errors
4. Verify authentication tokens are present

---

**Status**: ✅ Ready for deployment and testing
**Commit**: 65a9dc9 feat: Add comprehensive child profile viewing system
