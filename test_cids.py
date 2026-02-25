import pdfplumber
import re

url = "https://www.tmd.go.th/uploads/ReportsGenMetnet/Daily/DailyObserved7AM.pdf"
import requests
import io

print("Downloading PDF...")
response = requests.get(url)
pdf_file = io.BytesIO(response.content)

cids = set()

with pdfplumber.open(pdf_file) as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            found = re.findall(r'\(cid:\d+\)', text)
            for c in found:
                cids.add(c)
                
        table = page.extract_table()
        if table:
            for row in table:
                for col in row:
                    if col:
                        found = re.findall(r'\(cid:\d+\)', str(col))
                        for c in found:
                            cids.add(c)

print("Found CIDs:", cids)

with pdfplumber.open(pdf_file) as pdf:
    for page in pdf.pages:
        table = page.extract_table()
        if table:
            for row in table:
                if row and row[0]:
                    station = str(row[0]).replace("\n", "").strip()
                    if "(cid:" in station:
                        print("Station with CID:", station)
