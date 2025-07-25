# Work Time Surcharge Calculator

A web application to calculate and visualize work time surcharges based on weekdays, weekends, Sundays, holidays, and night hours.

## Features

- **Time Interval Input**: Define work periods for weekdays, Saturdays, Sundays, and holidays.
- **Night Shift Detection**: Specify a night window and automatically calculate night surcharge minutes.
- **Holiday Awareness**: Load holiday dates per German federal state (`bundestage.json`) and apply holiday surcharges.
- **Detailed Breakdown**: View a tabular breakdown of total and night hours per day and surcharge bucket.
- **Interactive Chart**: Visualize the distribution of hours in a Pie chart (Chart.js) showing weekdays, Saturday, Sunday, holidays, and night hours.
- **Dark Mode Toggle**: Switch between light and dark themes with a button.

## Technologies

- **Vanilla JavaScript** for logic and DOM manipulation
- **Chart.js** for interactive charts
- **HTML5 & CSS3** for layout and styling
- **Fetch API** to load holiday data (`bundestage.json`)

## Prerequisites

- Modern web browser with ES6 support
- Local HTTP server (e.g., [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)) to serve JSON and JS files

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/work-time-calculator.git
   cd work-time-calculator
   ```
2. Start your HTTP server in the project root:
   ```bash
   live-server
   ```

## Usage

1. Open the application in your browser (usually at `http://127.0.0.1:5500`).
2. Fill in:
   - **Start Date** and **End Date**
   - **Federal State** (Bundesland)
   - **Work intervals** for weekdays, Saturdays, Sundays, and holidays
   - **Night shift window** (e.g., 22:00–06:00)
3. Click **Calculate** to see:
   - A table of daily surcharges (total and night hours)
   - A Pie chart showing the distribution of hours
4. Use the **Dark Mode** button to toggle the theme.

## Configuration

- **`config.js`** holds:
  - Hourly wage (`stundenlohn`)
  - Surcharge rates (`zuschlaege`) for each bucket (WK, SA, SO, FT and their night variants)
  - Basic holiday arrays if needed
- **`bundestage.json`** contains holiday dates per year and Bundesland. Must be in the same folder as `index.html` and loaded via `fetch`.

## File Structure

```
├── index.html          # Main HTML page
├── style.css           # Global and dark mode styles
├── config.js           # Surcharge rates and settings
├── bundestage.json     # Holiday dates per state
├── utils/
│   ├── date.js         # Date formatting helpers
│   └── feiertage.js    # Holiday detection helpers (optional)
└── script.js           # Main application logic, fetch, chart, events
```

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m "Add new feature"`)
4. Push to the branch (`git push origin feature-name`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
