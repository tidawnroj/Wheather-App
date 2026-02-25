import gspread
from oauth2client.service_account import ServiceAccountCredentials
import time

CREDENTIALS_FILE = "credentials/credentials.json"
SHEET_NAME = "TMD Weather Data"

def clear_all_tabs():
    print("Authenticating...")
    scopes = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scopes)
    client = gspread.authorize(creds)
    
    try:
        spreadsheet = client.open(SHEET_NAME)
    except gspread.exceptions.SpreadsheetNotFound:
        print("Sheet not found.")
        return

    worksheets = spreadsheet.worksheets()
    print(f"Found {len(worksheets)} tabs to process.")
    
    # Google Sheets must have at least one tab. We'll create a temporary one to avoid errors when deleting others.
    temp_sheet = spreadsheet.add_worksheet(title="TEMP_CLEANING", rows="1", cols="1")
    
    for ws in worksheets:
        try:
            print(f"Deleting tab: {ws.title}")
            spreadsheet.del_worksheet(ws)
            time.sleep(1) # avoid rate limits
        except Exception as e:
            print(f"Could not delete {ws.title}: {e}")
            
    # Rename temp sheet to default
    temp_sheet.update_title("Sheet1")
    print("Successfully cleared all data! The sheet is now completely blank.")

if __name__ == "__main__":
    clear_all_tabs()
