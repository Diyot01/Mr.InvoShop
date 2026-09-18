# Mr.InvoShop

**Mr.InvoShop** is a lightweight, fully offline inventory and billing tool built for local shops. No installation, no server, no internet connection required — it runs entirely in the browser and stores everything on your own laptop.

## Features

- **Inventory management** — add, edit, and delete items with name, SKU, category, quantity, price, and a low-stock threshold
- **Live dashboard** — total items, total units in stock, total stock value, and low-stock alerts at a glance
- **Search & filter** — quickly find items by name, SKU, or category
- **Billing** — build a bill by picking items and quantities; stock is automatically deducted from inventory the moment a sale is completed
- **Payment mode tracking** — record whether a sale was paid by Cash, UPI, Card, or Credit
- **Shop settings** — save your shop name, address, GSTIN, and phone number once; they're pulled into every printed invoice
- **Professional printable invoices** — clean, print-ready receipts with shop details, GSTIN, itemized list, payment mode, and total
- **Bill history** — every past sale is logged and can be reopened or reprinted at any time
- **Backup & restore** — export all inventory, bills, and shop settings to a single `.json` file, and import it back on the same or a different machine

## Tech stack

Plain **HTML, CSS, and JavaScript** — no frameworks, no build tools, no dependencies. Data is stored locally using the browser's `localStorage`, so it stays on the device it's used on.

## File structure

```
Mr.InvoShop/
├── index.html   → page structure
├── style.css    → all styling
├── app.js       → all application logic
└── README.md    → this file
```

## How to run

1. Download or clone this repository.
2. Open `index.html` in any modern web browser (double-click it, or use an extension like VS Code's Live Server).
3. That's it — no setup, no server, no internet needed.

> **Note:** Data is saved per-browser and per-location. If you move the folder or open it in a different browser, start by importing a backup if you have one.

## Backing up your data

Use the **Export backup (.json)** button at the bottom of the app to save a copy of your inventory, bills, and shop settings. Use **Import backup** to restore it — on the same laptop, a new one, or a second shop's copy of the app.

## License

Free to use and modify for personal or shop use.

---

*P.S. — sorry for the late upload on this one... this project was actually built a good while before it finally made it to GitHub today. Better late than never! 😅*
