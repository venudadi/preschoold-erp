# Phase 2 Implementation Roadmap - Tie-Up Billing System

## Overview
This document outlines the remaining implementation tasks for the comprehensive tie-up billing system. Phase 1 (database schema and core backend APIs) is complete and committed.

---

## Phase 1 Completed ✅

### Database (Migration 048)
- ✅ `main_vendors` table created
- ✅ `companies` table enhanced with contribution percentages
- ✅ `children` table enhanced with payment_mode and billing_frequency
- ✅ `admission_fee_details` table enhanced with GST calculations
- ✅ `payment_receipts` table created
- ✅ `invoices` table enhanced for company/vendor invoicing
- ✅ Seeded Krisla Pvt Ltd and Sevis as main vendors

### Backend APIs
- ✅ `mainVendorRoutes.js` - Full CRUD for main vendors + revenue reporting
- ✅ `receiptRoutes.js` - Cash payment tracking with PDF generation
- ✅ `companyRoutes.js` - Company management with contribution configuration
- ✅ Routes registered in `backend/index.js`

---

## Phase 2: Remaining Implementation

### 1. Backend API Updates

#### 1.1 Update `admissionRoutes.js` ⏳
**File:** `backend/admissionRoutes.js`

**Add new endpoint:**
```javascript
POST /admissions/calculate-preview
```
- Accept: originalFee, paymentMode, billingFrequency, hasTieUp, companyId, discountPercentage
- Return: Complete fee breakdown with GST calculations
- For tie-ups: Split by parent/company contribution
- For non-tie-ups: Apply discount percentage
- Calculate monthly/term/annual totals

**Update endpoint:**
```javascript
POST /admissions/submit-for-approval/:enquiryId
```
- Accept additional fields: paymentMode, billingFrequency, companyId, parentContributionPercent, companyContributionPercent
- Validate: If has_tie_up, force billingFrequency = 'Monthly'
- Calculate all GST amounts and store in admission_fee_details
- Link company_id to enquiry

**Update endpoint:**
```javascript
POST /admissions/approvals/:approvalId/approve
```
- When creating child, populate: payment_mode, billing_frequency, locked_monthly_fee, company_id, has_tie_up
- Use contribution % from company if tie-up

---

#### 1.2 Update `invoiceRoutes.js` ⏳
**File:** `backend/invoiceRoutes.js`

**Update endpoint:**
```javascript
POST /invoices/generate-monthly
```
- Skip children with payment_mode = 'Cash'
- For non-tie-up: Generate parent invoice with GST
- For tie-up: Generate parent invoice for their contribution % + GST

**Add new endpoint:**
```javascript
POST /invoices/generate-company-invoices
```
- Parameters: month, year, consolidationType ('per_child', 'per_company', 'per_main_vendor')
- **Per Child:** One invoice per child to main vendor
- **Per Company:** One consolidated invoice per sub-company to main vendor
- **Per Main Vendor:** One mega invoice per main vendor for all children
- Calculate company contribution % + GST
- Set invoice_type, company_id/main_vendor_id accordingly
- Use main vendor GST number and billing address

**Update PDF generation:**
- Include main vendor/company billing info
- Show contribution breakdown for company invoices
- Display main vendor GST number

---

### 2. Frontend API Client

#### 2.1 Update `frontend/src/services/api.js` ⏳

**Add functions:**
```javascript
// Main Vendors
export const createMainVendor = async (data)
export const getMainVendors = async (includeInactive = false)
export const getMainVendor = async (id)
export const updateMainVendor = async (id, data)
export const deleteMainVendor = async (id)
export const getMainVendorRevenue = async (id, startDate, endDate)

// Companies
export const createCompany = async (data)
export const getCompanies = async (includeInactive = false, mainVendorId = null)
export const getCompany = async (id)
export const updateCompany = async (id, data)
export const deleteCompany = async (id)
export const getCompanyContributionConfig = async (id)
export const checkCompanyTieUp = async (companyName)

// Admissions
export const calculateAdmissionPreview = async (data)
export const submitAdmissionWithBilling = async (enquiryId, data)

// Invoices
export const generateCompanyInvoices = async (month, year, consolidationType)

// Receipts
export const createReceipt = async (data)
export const getReceipts = async (filters)
export const getReceipt = async (id)
export const updateReceipt = async (id, data)
export const getPendingCashPayments = async ()
export const generateReceiptPDF = async (id)
```

---

### 3. Frontend Pages & Components

#### 3.1 Main Vendor Management Page ⏳
**New files:**
- `frontend/src/pages/MainVendorManagementPage.jsx`
- `frontend/src/components/MainVendorList.jsx`
- `frontend/src/components/MainVendorForm.jsx`
- `frontend/src/components/MainVendorRevenueCard.jsx`

**Features:**
- Table showing all main vendors
- Create/Edit modal for vendor details
- Fields: Vendor Name, GST Number, Billing Address, Contact Info
- Revenue summary cards per vendor
- Deactivate vendor (soft delete)

**Access:** Super Admin, Financial Manager only

---

#### 3.2 Company Management Enhancement ⏳
**Update:** `frontend/src/pages/CompanyManagementPage.jsx` (or create if missing)
**Update:** `frontend/src/components/CompanyForm.jsx` (or create if missing)

**Add fields:**
- Main Vendor dropdown (select from active vendors)
- Parent Contribution % slider (0-100)
- Company Contribution % slider (auto-calculated as 100 - parent %)
- Real-time validation: Sum must equal 100%
- Link to enrolled children count

---

#### 3.3 Admission Modal Overhaul ⏳
**Update:** `frontend/src/components/AdmissionFormModal.jsx`

**Add new sections:**

**A. Payment Configuration:**
```jsx
<FormControl>
  <FormLabel>Payment Mode</FormLabel>
  <RadioGroup value={paymentMode} onChange={handlePaymentModeChange}>
    <FormControlRadio value="Cash" label="Cash" />
    <FormControlRadio value="Online" label="Online" />
  </RadioGroup>
</FormControl>

<FormControl>
  <InputLabel>Billing Frequency</InputLabel>
  <Select
    value={billingFrequency}
    disabled={hasTieUp} // Force Monthly for tie-ups
    onChange={handleBillingFrequencyChange}
  >
    <MenuItem value="Monthly">Monthly</MenuItem>
    <MenuItem value="Term">Term (4+3+3 months)</MenuItem>
    <MenuItem value="Annual">Annual (10 months)</MenuItem>
  </Select>
  {hasTieUp && <FormHelperText>Tie-up students are billed monthly only</FormHelperText>}
</FormControl>
```

**B. Real-Time Fee Calculator:**
```jsx
<Card>
  <CardContent>
    <Typography variant="h6">Fee Breakdown Preview</Typography>

    {!hasTieUp && (
      <>
        <Typography>Original Fee per Month: ₹{originalFee}</Typography>
        <Typography>Discount ({discountPercentage}%): -₹{discountAmount}</Typography>
        <Typography>Subtotal: ₹{subtotal}</Typography>
      </>
    )}

    {hasTieUp && (
      <>
        <Typography>Original Fee per Month: ₹{originalFee}</Typography>
        <Typography color="primary">Company Contribution ({companyPercent}%): ₹{companyAmount}</Typography>
        <Typography color="secondary">Parent Contribution ({parentPercent}%): ₹{parentAmount}</Typography>
      </>
    )}

    <Typography>Student Kit: ₹{kitAmount}</Typography>

    {paymentMode === 'Online' && (
      <>
        <Typography>Parent Subtotal: ₹{parentSubtotal}</Typography>
        <Typography>GST (18%): ₹{gstAmount}</Typography>
      </>
    )}

    <Typography variant="h6" color="primary">
      Total Parent Monthly Due: ₹{totalMonthlyDue}
    </Typography>
  </CardContent>
</Card>
```

**C. Billing Summary:**
```jsx
<Alert severity="info">
  {billingFrequency === 'Monthly' && `Parent will pay ₹${totalMonthlyDue}/month`}
  {billingFrequency === 'Term' && `Parent will pay ₹${term1Total} (Term 1: 4 months), ₹${term2Total} (Term 2: 3 months), ₹${term3Total} (Term 3: 3 months)`}
  {billingFrequency === 'Annual' && `Parent will pay ₹${annualTotal} upfront (10 months)`}
  {annualFeeWaiveOff && ' - Annual fee waived off'}
</Alert>
```

**Logic:**
- Call `calculateAdmissionPreview` API on field changes
- Show loading state during calculation
- Lock values on "Confirm Admission"
- If has_tie_up, fetch company contribution % automatically

---

#### 3.4 Receipt Management Page ⏳
**New files:**
- `frontend/src/pages/ReceiptManagementPage.jsx`
- `frontend/src/components/ReceiptList.jsx`
- `frontend/src/components/CreateReceiptForm.jsx`
- `frontend/src/components/PendingCashPayments.jsx`

**Features:**
- Table showing all receipts (filterable by status, child, date range)
- Create receipt modal:
  - Select child (filter by payment_mode = 'Cash')
  - Billing period, amount, due date
  - Mark as collected/pending
- Dashboard widget showing overdue cash receipts
- Generate receipt PDF
- Bulk operations: Mark multiple as collected

**Access:** Admin, Owner, Center Director

---

#### 3.5 Billing Management Page Enhancement ⏳
**Update:** `frontend/src/pages/BillingManagementPage.jsx`

**Add new section: "Company Invoice Generation"**
```jsx
<Card>
  <CardHeader title="Company Invoice Generation" />
  <CardContent>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <TextField
          type="month"
          label="Billing Month"
          value={selectedMonth}
          onChange={handleMonthChange}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControl>
          <FormLabel>Consolidation Type</FormLabel>
          <RadioGroup value={consolidationType} onChange={handleConsolidationChange}>
            <FormControlLabel
              value="per_child"
              control={<Radio />}
              label="Per Child - Individual invoice for each child to main vendor"
            />
            <FormControlLabel
              value="per_company"
              control={<Radio />}
              label="Per Company - One consolidated invoice per sub-company to main vendor"
            />
            <FormControlLabel
              value="per_main_vendor"
              control={<Radio />}
              label="Per Main Vendor - One mega invoice per main vendor for all children"
            />
          </RadioGroup>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Button
          variant="contained"
          onClick={handleGenerateCompanyInvoices}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate Company Invoices'}
        </Button>
      </Grid>
    </Grid>

    {/* Preview table showing what will be generated */}
    {preview && (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice To</TableCell>
              <TableCell>Children Count</TableCell>
              <TableCell>Total Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {preview.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.vendorName}</TableCell>
                <TableCell>{item.childrenCount}</TableCell>
                <TableCell>₹{item.totalAmount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </CardContent>
</Card>
```

---

### 4. Permissions & Routing

#### 4.1 Update `frontend/src/config/permissions.js` ⏳

**Add features:**
```javascript
FEATURES.MAIN_VENDOR_MANAGEMENT: 'main_vendor_management',
FEATURES.COMPANY_CONTRIBUTION_CONFIG: 'company_contribution_config',
FEATURES.RECEIPT_MANAGEMENT: 'receipt_management',
FEATURES.COMPANY_INVOICE_GENERATION: 'company_invoice_generation',
```

**Grant permissions:**
```javascript
[ROLES.SUPER_ADMIN]: [
  ...existing,
  FEATURES.MAIN_VENDOR_MANAGEMENT,
  FEATURES.COMPANY_CONTRIBUTION_CONFIG,
  FEATURES.RECEIPT_MANAGEMENT,
  FEATURES.COMPANY_INVOICE_GENERATION
],

[ROLES.FINANCIAL_MANAGER]: [
  ...existing,
  FEATURES.MAIN_VENDOR_MANAGEMENT,
  FEATURES.COMPANY_CONTRIBUTION_CONFIG,
  FEATURES.COMPANY_INVOICE_GENERATION
],

[ROLES.CENTER_DIRECTOR]: [
  ...existing,
  FEATURES.RECEIPT_MANAGEMENT
],

[ROLES.ADMIN]: [
  ...existing,
  FEATURES.RECEIPT_MANAGEMENT
]
```

**Add navigation items:**
```javascript
{
  text: 'Main Vendors',
  icon: 'BusinessIcon',
  path: '/main-vendors',
  requiredFeatures: [FEATURES.MAIN_VENDOR_MANAGEMENT]
},
{
  text: 'Cash Receipts',
  icon: 'ReceiptIcon',
  path: '/receipts',
  requiredFeatures: [FEATURES.RECEIPT_MANAGEMENT]
}
```

---

#### 4.2 Update `frontend/src/App.jsx` ⏳

**Add routes:**
```jsx
<Route path="main-vendors" element={<MainVendorManagementPage />} />
<Route path="receipts" element={<ReceiptManagementPage />} />
<Route path="companies" element={<CompanyManagementPage />} />
```

---

### 5. Testing Checklist

#### 5.1 Backend API Testing ⏳
- [ ] Main vendor CRUD operations
- [ ] Company CRUD with contribution validation (must sum to 100%)
- [ ] Receipt creation and PDF generation
- [ ] Admission preview calculation (tie-up vs non-tie-up)
- [ ] Company invoice generation (all 3 consolidation types)
- [ ] GST calculation accuracy (18%)

#### 5.2 Frontend Testing ⏳
- [ ] Main vendor management page (create, edit, delete, view revenue)
- [ ] Company management with contribution sliders
- [ ] Admission modal real-time calculator
- [ ] Billing frequency restrictions for tie-ups
- [ ] Receipt management (create, list, mark collected, PDF)
- [ ] Company invoice generation UI with preview

#### 5.3 Integration Testing ⏳
- [ ] End-to-end tie-up admission flow
- [ ] End-to-end cash payment flow
- [ ] Company invoice generation → PDF → Main vendor receives correct amount
- [ ] Parent invoice shows correct contribution split
- [ ] GST applied correctly based on payment mode

#### 5.4 Edge Cases ⏳
- [ ] Contribution % doesn't sum to 100 (should error)
- [ ] Tie-up student with non-monthly billing (should force Monthly)
- [ ] Cash payment with GST calculation (should not have GST)
- [ ] Company with no main vendor (should allow, but warn)
- [ ] Deactivating vendor with active companies (should prevent)

---

### 6. Data Migration Tasks

#### 6.1 Backfill Existing Data ⏳
```sql
-- Link existing companies to a default main vendor (manual task for admin)
UPDATE companies SET main_vendor_id = (SELECT id FROM main_vendors WHERE vendor_name = 'Krisla Pvt Ltd' LIMIT 1)
WHERE company_name LIKE '%pattern%';

-- Set default contribution percentages for existing companies
UPDATE companies SET
  parent_contribution_percent = 30.00,
  company_contribution_percent = 70.00
WHERE parent_contribution_percent IS NULL;

-- Set payment mode for existing children
UPDATE children SET payment_mode = 'Online' WHERE payment_mode IS NULL;
UPDATE children SET billing_frequency = 'Monthly' WHERE billing_frequency IS NULL;
```

---

### 7. Documentation Tasks

#### 7.1 Admin User Guide ⏳
- How to add a new main vendor
- How to configure company contribution percentages
- How to process tie-up admissions
- How to generate company invoices (3 types)
- How to manage cash receipts

#### 7.2 API Documentation ⏳
- Document all new endpoints with request/response examples
- Update Postman collection
- Add inline code comments

---

## Summary

### Phase 1 (Completed)
- Database schema with 6 table updates
- 3 new backend route files (251 lines of code)
- Routes registered in index.js

### Phase 2 (Remaining)
- 2 backend route file updates (admissionRoutes.js, invoiceRoutes.js)
- 1 API client update (api.js)
- 8 new/updated frontend components
- 3 new/updated frontend pages
- Permissions and routing updates
- Comprehensive testing
- Data migration

### Estimated Effort
- Backend updates: 4-6 hours
- Frontend development: 8-10 hours
- Testing: 3-4 hours
- Documentation: 2 hours
- **Total: 17-22 hours**

### Priority Order
1. **High Priority:**
   - Update admissionRoutes.js with preview calculator
   - Update AdmissionFormModal with real-time calculations
   - Update api.js with all new functions

2. **Medium Priority:**
   - Company invoice generation logic
   - Receipt management page
   - Main vendor management page

3. **Low Priority:**
   - Revenue reporting enhancements
   - Bulk operations
   - Advanced filtering

---

## Notes
- All database changes are backward compatible
- Existing admission flow still works (non-tie-up, online payment)
- Cash payment tracking is a new optional feature
- Company contribution configuration is optional (defaults to 50/50)

**Next Session: Start with updating admissionRoutes.js and AdmissionFormModal.jsx**
