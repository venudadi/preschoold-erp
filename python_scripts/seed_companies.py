import mysql.connector
import uuid

# --- 1. CONFIGURATION ---
DB_CONFIG = {
    'host': 'localhost',
    'user': 'python',
    'password': 'Delta.4599',
    'database': 'neldrac_admin'
}

# --- 2. DATA TO BE SEEDED ---
# This is the complete list of companies you provided.
COMPANIES_RAW_DATA = [
    {"name": "IBM Daycare", "value": 13500},
    {"name": "Micron", "value": .5},
    {"name": "UBS", "value": 1.0},
    {"name": "OpenText", "value": 1.0}  # Note the decimal for percentage
]

def seed_companies():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ Database connected successfully.")

        print("\nProcessing and inserting company tie-up data...")
        for company in COMPANIES_RAW_DATA:
            company_name = company['name']
            value = company['value']

            # Check if the company already exists to avoid duplicates
            cursor.execute("SELECT id FROM companies WHERE company_name = %s", (company_name,))
            if cursor.fetchone():
                print(f"  -> Company '{company_name}' already exists. Skipping.")
                continue

            # --- This is the core logic ---
            # If the value is less than 1.0, we assume it's a percentage.
            # Otherwise, we treat it as a fixed amount.
            if 0 < value <= 1.0:
                contribution_type = 'Percentage'
            else:
                contribution_type = 'Fixed Amount'
            
            company_id = str(uuid.uuid4())
            
            insert_query = """
                INSERT INTO companies (id, company_name, contribution_type, contribution_value)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(insert_query, (company_id, company_name, contribution_type, value))
            print(f"  -> Added '{company_name}' with contribution: {contribution_type} ({value})")

        conn.commit()
        print("\n✅ All company data has been successfully seeded.")

    except mysql.connector.Error as err:
        print(f"❌ DATABASE ERROR: {err}")
        if 'conn' in locals() and conn.is_connected(): conn.rollback(); print("  -> Changes rolled back.")
    finally:
        if 'conn' in locals() and conn.is_connected(): cursor.close(); conn.close(); print("\nDatabase connection closed.")


if __name__ == "__main__":
    print("--- Starting Company Seeding Script ---")
    seed_companies()
    print("\n--- Seeding Script Finished ---")
