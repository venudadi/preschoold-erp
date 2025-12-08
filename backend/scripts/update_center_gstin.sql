-- Script to update center GSTIN and billing details
-- Run this after migration 049 to configure GST compliance

-- Example: Update center with GSTIN details
-- Replace the values with your actual center information

-- For Karnataka centers (state code: 29)
UPDATE centers
SET
    gstin = '29XXXXXXXXXXXXX',  -- Replace with actual GSTIN (15 characters)
    pan = 'XXXXX0000X',          -- Replace with actual PAN (10 characters)
    state_code = '29',           -- Karnataka state code
    billing_address = 'Your full billing address here',
    place_of_supply = 'Karnataka'
WHERE id = 'your-center-id-here';

-- Example for multiple centers:
/*
UPDATE centers
SET
    gstin = '29ABCDE1234F1Z5',
    pan = 'ABCDE1234F',
    state_code = '29',
    billing_address = '123, Sample Street, Bangalore, Karnataka - 560001',
    place_of_supply = 'Karnataka'
WHERE name = 'NELDRAC KIDS DAYCARE - Bangalore Branch';

UPDATE centers
SET
    gstin = '27ABCDE1234F1Z5',
    pan = 'ABCDE1234F',
    state_code = '27',
    billing_address = '456, Sample Road, Mumbai, Maharashtra - 400001',
    place_of_supply = 'Maharashtra'
WHERE name = 'NELDRAC KIDS DAYCARE - Mumbai Branch';
*/

-- Verify the updates
SELECT id, name, gstin, pan, state_code, place_of_supply
FROM centers;

-- GST State Codes Reference:
-- 01 - Jammu and Kashmir
-- 02 - Himachal Pradesh
-- 03 - Punjab
-- 04 - Chandigarh
-- 05 - Uttarakhand
-- 06 - Haryana
-- 07 - Delhi
-- 08 - Rajasthan
-- 09 - Uttar Pradesh
-- 10 - Bihar
-- 11 - Sikkim
-- 12 - Arunachal Pradesh
-- 13 - Nagaland
-- 14 - Manipur
-- 15 - Mizoram
-- 16 - Tripura
-- 17 - Meghalaya
-- 18 - Assam
-- 19 - West Bengal
-- 20 - Jharkhand
-- 21 - Odisha
-- 22 - Chhattisgarh
-- 23 - Madhya Pradesh
-- 24 - Gujarat
-- 25 - Daman and Diu
-- 26 - Dadra and Nagar Haveli
-- 27 - Maharashtra
-- 28 - Andhra Pradesh (Old)
-- 29 - Karnataka
-- 30 - Goa
-- 31 - Lakshadweep
-- 32 - Kerala
-- 33 - Tamil Nadu
-- 34 - Puducherry
-- 35 - Andaman and Nicobar Islands
-- 36 - Telangana
-- 37 - Andhra Pradesh (New)
-- 38 - Ladakh
