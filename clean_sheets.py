import gspread
from oauth2client.service_account import ServiceAccountCredentials
import time
import os

CREDENTIALS_FILE = "credentials/credentials.json"
SHEET_NAME = "TMD Weather Data"

def clean_sheets():
    print("Authenticating...")
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
    creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scopes)
    client = gspread.authorize(creds)
    
    try:
        spreadsheet = client.open(SHEET_NAME)
    except Exception as e:
        print(f"Error opening spreadsheet: {e}")
        return

    worksheets = spreadsheet.worksheets()
    print(f"Found {len(worksheets)} worksheets.")
    
    if not worksheets:
        return

    # Keep the first worksheet, delete the rest to clear the corrupted tabs
    keep_ws = worksheets[0]
    
    deleted_count = 0
    for ws in worksheets[1:]:
        print(f"Deleting {ws.title}...")
        try:
            spreadsheet.del_worksheet(ws)
            deleted_count += 1
            time.sleep(1) # Avoid rate limits
        except Exception as e:
            print(f"Failed to delete {ws.title}: {e}")
            
    # Clear the remaining worksheet
    print(f"Clearing remaining worksheet: {keep_ws.title}...")
    keep_ws.clear()
    
    print(f"Successfully deleted {deleted_count} tabs and cleared the main tab.")

if __name__ == "__main__":
    clean_sheets()
