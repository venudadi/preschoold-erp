#!/bin/bash

# GST Compliance Deployment Script
# This script deploys the HSN code and GST compliance feature

echo "=========================================="
echo "GST Compliance Feature Deployment"
echo "=========================================="
echo ""

# Step 1: Run migrations
echo "Step 1: Running database migrations..."
cd "$(dirname "$0")/.."
node migrate.js

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "=========================================="
echo "Next Steps (Manual Configuration Required)"
echo "=========================================="
echo ""
echo "1. Update Center GSTIN Details:"
echo "   Edit: backend/scripts/update_center_gstin.sql"
echo "   Run: mysql -u your_user -p your_database < backend/scripts/update_center_gstin.sql"
echo ""
echo "2. Configure Classroom Service Types:"
echo "   UPDATE classrooms SET service_type = 'Pre-School', hsn_code = '999210' WHERE ..."
echo "   UPDATE classrooms SET service_type = 'Daycare', hsn_code = '999351' WHERE ..."
echo ""
echo "3. Test Invoice Generation:"
echo "   - Generate a test invoice"
echo "   - Download PDF and verify GST compliance"
echo ""
echo "4. Review Documentation:"
echo "   Read: GST_INVOICE_GUIDE.md"
echo ""
echo "=========================================="
echo "Feature Summary"
echo "=========================================="
echo ""
echo "✓ HSN codes added: 999210 (Pre-School), 999351 (Daycare)"
echo "✓ GST calculation: 18% (CGST 9% + SGST 9%)"
echo "✓ Invoice template: GST-compliant with tax breakdown"
echo "✓ Center GSTIN: Ready for configuration"
echo ""
echo "Deployment completed! Please complete manual configuration steps above."
