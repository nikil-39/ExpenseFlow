<div align="center">

# 💸 ExpenseFlow

### A Smart, Beautiful Expense Tracker — Built as a PWA

Track income, expenses, investments, and savings with stunning charts, smart insights, and offline support.  
**Works on Desktop & Mobile. No server needed. Your data stays on your device.**

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-GitHub_Pages-6C5CE7?style=for-the-badge&logo=github)](https://nikil-39.github.io/ExpenseFlow/)
[![PWA](https://img.shields.io/badge/PWA-Installable-00B894?style=for-the-badge&logo=googlechrome&logoColor=white)](https://nikil-39.github.io/ExpenseFlow/)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Overview Dashboard** | Yearly income, expenses, savings rate with trend indicators |
| 💰 **Monthly Spend Tracker** | Set income at month start, add expenses throughout the month |
| 📈 **3 Expense Categories** | **Investments**, **Need**, **Fun Money** — each with customizable subcategories |
| 🏷️ **Custom Subcategories** | Add/remove subcategories per category + "Other" option for quick manual entry |
| 📉 **Interactive Charts** | Income vs Expense bars, Category donut, Spending trends, Savings trend (Chart.js) |
| 🧠 **Smart Insights** | Auto-generated financial tips based on your spending patterns |
| 🏆 **Top Expenses** | See your biggest expenses at a glance |
| 📤 **Export CSV** | Download all your data as a CSV file for backup |
| 🌙 **Dark / Light Theme** | Toggle between themes — your preference is saved |
| 📱 **PWA — Installable** | Install on phone or desktop as a native-like app, works offline |
| 💾 **localStorage** | All data persists in your browser — no account, no server |
| 📐 **Fully Responsive** | Works perfectly on desktop, tablet, and mobile |

---

## 🏗️ Project Structure

```
ExpenseFlow/
├── index.html          # Main HTML — all 3 tabs, modals, layout
├── style.css           # Complete styling — dark/light themes, responsive
├── app.js              # Application logic — data, charts, CRUD, export
├── sw.js               # Service Worker — offline caching
├── manifest.json       # PWA manifest — installability
├── icons/
│   ├── icon-192.png    # App icon (192×192)
│   └── icon-512.png    # App icon (512×512)
└── README.md
```

---

## 🚀 How to Use

### Option 1: GitHub Pages (Easiest — Zero Setup)

1. Go to **[https://nikil-39.github.io/ExpenseFlow/](https://nikil-39.github.io/ExpenseFlow/)**
2. That's it! Start tracking.
3. To install as an app:
   - **Chrome/Edge Desktop**: Click the ⊕ install icon in the address bar
   - **Android Chrome**: Menu (⋮) → "Install app"
   - **iPhone Safari**: Share → "Add to Home Screen"

### Option 2: Run Locally

```bash
# Clone the repo
git clone https://github.com/nikil-39/ExpenseFlow.git
cd ExpenseFlow

# Start a local server (Python 3)
python -m http.server 8080

# Open in your browser
# http://localhost:8080
```

> Any static file server works — Python, Node (`npx serve`), VS Code Live Server, etc.

### Option 3: Access on Your Phone (Same WiFi)

1. Find your laptop's local IP:
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address, e.g., 192.168.1.5

   # Mac/Linux
   ifconfig | grep "inet "
   ```
2. Run the server on your laptop:
   ```bash
   python -m http.server 8080
   ```
3. On your phone, open: `http://192.168.1.5:8080`
4. Install it as an app (see Option 1 instructions above)

---

## 📱 App Walkthrough

### Tab 1 — Overview
- View **yearly** financial summary
- 4 stat cards: Total Income, Total Expenses, Net Savings, Savings Rate
- **Income vs Expenses** bar chart (monthly breakdown)
- **Spending by Category** donut chart
- Recent transactions list

### Tab 2 — Spend
- Navigate months (← March 2026 →)
- **Set monthly income** at the start of each month
- **Add expenses** with:
  - Category: Investments / Need / Fun Money
  - Subcategory: Choose from preset list **or select "Other" to type your own**
  - Description & Amount
- Filter transactions by category
- Edit or delete any transaction

### Tab 3 — Analytics
- **Spending Trends** — 6-month line chart by category
- **Savings Trend** — monthly savings bar chart
- **Top 5 Expenses** for the year
- **Subcategory Breakdown** — horizontal bar chart
- **Smart Insights** — personalized tips based on your data
- **Export CSV** — download all data
- **Manage Categories** — add/remove subcategories

---

## 💾 Data Storage

| What | Where |
|---|---|
| All data | Browser's **localStorage** |
| Key | `expenseFlowData` |
| Includes | Monthly income, all expenses, subcategories, theme preference |
| Backup | Use **Export CSV** button in Analytics tab |

> ⚠️ Data is tied to your **browser + domain**. Clearing browser data will erase it.  
> 💡 Different devices (phone vs laptop) have **separate** data stores.

---

## 🛠️ Tech Stack

- **HTML5** / **CSS3** / **Vanilla JavaScript** — Zero dependencies, zero build step
- **[Chart.js 4](https://www.chartjs.org/)** — Beautiful interactive charts (loaded via CDN)
- **Service Worker** — Offline caching & PWA installability
- **localStorage** — Client-side data persistence

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ♥ by [nikil-39](https://github.com/nikil-39)**

</div>
