# GST-Compliant Invoice System

## Overview
This system now generates GST-compliant invoices for educational services with proper HSN/SAC codes, tax breakdown, and all required fields as per Indian GST regulations.

## Features Implemented

### 1. HSN/SAC Codes
Two HSN codes are supported for educational services:
- **999210** - Pre-School Education
- **999351** - Daycare Services

These are automatically assigned based on the classroom's `service_type` setting.

### 2. GST Calculation
The system automatically calculates GST at 18% (standard rate for educational services):
- **Intrastate transactions**: CGST (9%) + SGST (9%)
- **Interstate transactions**: IGST (18%)

### 3. Invoice Components
Each invoice includes:
- Company GSTIN (GST Identification Number)
- HSN/SAC code for services
- Subtotal before tax
- GST breakdown (CGST/SGST or IGST)
- Total amount including GST
- Amount in words
- Place of supply
- GST declaration

## Setup Instructions

### Step 1: Run Database Migration
```bash
cd backend
node migrate.js
```

This will:
- Create `hsn_codes` table with pre-populated HSN codes
- Add GSTIN fields to `centers` table
- Add GST breakdown fields to `invoices` and `invoice_line_items` tables
- Add `service_type` and `hsn_code` fields to `classrooms` table

### Step 2: Configure Center GSTIN
Update your center's GST details using the provided SQL script:

```bash
# Edit the script with your center's details
mysql -u your_user -p your_database < backend/scripts/update_center_gstin.sql
```

Required information:
- **GSTIN**: 15-character GST Identification Number
- **PAN**: 10-character Permanent Account Number
- **State Code**: 2-digit state code from GST system
- **Billing Address**: Full registered address
- **Place of Supply**: State name

### Step 3: Configure Classroom Service Types
Update classrooms to specify their service type:

```sql
-- For Pre-School classrooms
UPDATE classrooms
SET service_type = 'Pre-School',
    hsn_code = '999210'
WHERE id IN ('classroom-id-1', 'classroom-id-2');

-- For Daycare classrooms
UPDATE classrooms
SET service_type = 'Daycare',
    hsn_code = '999351'
WHERE id IN ('classroom-id-3', 'classroom-id-4');
```

## How It Works

### Invoice Generation Flow

1. **Monthly Invoice Generation**
   - System fetches eligible children with their classroom details
   - Retrieves HSN code from classroom (defaults to '999210' if not set)
   - Calculates base fee amount
   - Applies GST calculation (18% split into CGST 9% + SGST 9% for intrastate)
   - Stores complete breakdown in database

2. **PDF Generation**
   - Fetches invoice with center GST details
   - Displays company name, address, and GSTIN prominently
   - Shows "TAX INVOICE" header
   - Line items include HSN code
   - Separate sections for:
     - Subtotal (Before Tax)
     - CGST @ 9%
     - SGST @ 9%
     - Total Amount
   - Amount in words
   - GST declaration

### Interstate vs Intrastate Detection

Currently, the system defaults to intrastate transactions (CGST + SGST). To enable interstate detection:

1. Add customer state information to the system
2. Compare center's state code with customer's state
3. If different, set `is_interstate = true` in invoice
4. System will automatically use IGST instead of CGST+SGST

## Invoice Template

The GST-compliant invoice includes:

```
+------------------------------------------------------------------+
|  [LOGO]              CENTER NAME                                 |
|                      Address Line                                |
|                      Phone: XXX-XXX-XXXX                        |
|                      Email: email@example.com                    |
|                      GSTIN: 29XXXXXXXXXXXXX                     |
|------------------------------------------------------------------|
|  TAX INVOICE                                                     |
|                                                                  |
|  Invoice Number: INV2512XXXX        Bill To:                    |
|  Invoice Date: DD/MM/YYYY            Customer Name               |
|  Due Date: DD/MM/YYYY                Phone: XXX-XXX-XXXX        |
|  Place of Supply: Karnataka          Email: email@example.com   |
|                                                                  |
|  Student Details:                                                |
|  Name: Student Name                                              |
|  Student ID: STU001                                              |
|  Classroom: Nursery                                              |
|                                                                  |
|------------------------------------------------------------------|
|  Description              HSN    Qty    Rate         Amount      |
|------------------------------------------------------------------|
|  Monthly Fee - Program    999210  1    ₹10,000.00  ₹10,000.00  |
|                                                                  |
|------------------------------------------------------------------|
|                          Subtotal (Before Tax):    ₹10,000.00   |
|                          CGST @ 9.00%:                ₹900.00   |
|                          SGST @ 9.00%:                ₹900.00   |
|------------------------------------------------------------------|
|                          Total Amount:             ₹11,800.00   |
|                                                                  |
|  Amount in Words: Eleven Thousand Eight Hundred Rupees Only     |
|                                                                  |
|  Declaration:                                                    |
|  This is a computer-generated invoice. GST is payable on        |
|  reverse charge basis if applicable.                            |
|                                                                  |
|  Payment Terms:                                                  |
|  Please make payment within 30 days of invoice date.            |
|  Thank you for your business!                                    |
+------------------------------------------------------------------+
```

## GST Rates for Educational Services

As per GST Schedule:
- **Pre-School Education (999210)**: 18% GST
- **Daycare Services (999351)**: 18% GST

**Note**: Some educational services may be exempt from GST. Consult with your tax advisor to determine if your specific services qualify for exemption.

## Exemptions (If Applicable)

If your services are GST-exempt:
1. Update `gst_rate` to 0 in the migration
2. Invoice will show "GST Exempt" instead of tax breakdown
3. Total will equal subtotal

```sql
-- To make services GST exempt
UPDATE hsn_codes
SET gst_rate = 0
WHERE hsn_code IN ('999210', '999351');
```

## API Endpoints

### Generate Monthly Invoices
```
POST /api/invoices/generate-monthly
```
Automatically calculates GST and generates compliant invoices.

### Generate PDF Invoice
```
GET /api/invoices/generate-pdf/:id
```
Downloads GST-compliant PDF invoice with all tax details.

## Testing

### Test Invoice Generation

1. Ensure center has GSTIN configured
2. Create test classroom with service type
3. Add test students to classroom
4. Generate monthly invoices
5. Download PDF to verify GST compliance

### Verification Checklist
- [ ] GSTIN displayed on invoice
- [ ] HSN/SAC code shown in line items
- [ ] Subtotal before tax calculated correctly
- [ ] CGST and SGST each at 9% (or IGST at 18%)
- [ ] Total amount = Subtotal + GST
- [ ] Amount in words displayed
- [ ] Place of supply mentioned
- [ ] GST declaration included

## Compliance Notes

1. **GSTIN Format**: 15 characters (2-digit state code + 10-digit PAN + entity code + checksum)
2. **HSN Codes**: 6-digit codes as per GST nomenclature
3. **Tax Rates**: Verify current rates with GST portal (rates may change)
4. **Record Keeping**: Maintain all invoices for minimum 6 years as per GST law
5. **Filing**: Use invoice data for GSTR-1 and GSTR-3B filing

## Support & References

- GST Portal: https://www.gst.gov.in/
- HSN Code Search: https://www.gst.gov.in/services/searchhsnsac
- GST Rates: https://cbic-gst.gov.in/

## Troubleshooting

### Issue: GSTIN not showing on invoice
**Solution**: Update center GSTIN using the SQL script

### Issue: Wrong HSN code
**Solution**: Update classroom service_type and hsn_code

### Issue: GST calculation incorrect
**Solution**: Verify `is_interstate` flag and state codes match

### Issue: Invoice shows IGST instead of CGST+SGST
**Solution**: Check `is_interstate` flag in invoice - should be false for same-state transactions

## Future Enhancements

- [ ] Automatic interstate detection based on customer address
- [ ] Support for multiple tax rates
- [ ] GST return report generation (GSTR-1)
- [ ] E-invoicing integration (for applicable businesses)
- [ ] GST exemption certificate upload
- [ ] Reverse charge mechanism support

---

**Version**: 1.0
**Last Updated**: December 2025
**Migration**: 049_add_hsn_code_and_gst_compliance.sql
