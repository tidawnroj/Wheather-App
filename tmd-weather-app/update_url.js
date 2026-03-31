import fs from 'fs';
const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/const GOOGLE_SHEET_CSV_URL.*/, "const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJXklPJR4YW55WZxQnfoPqjWK6dpXwWA4sBmAHVeGHXStzjk0UCdZNs002Vow_9T_-xn4P02-JFl8T/pub?gid=1977620023&single=true&output=csv'");
fs.writeFileSync(file, content);
