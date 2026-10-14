# Newark Airport Delay Analysis

This interactive presentation was created for a **COMM 3050 class project at the University of Virginia in Spring 2026**. It examines flight delays at Newark Liberty International Airport (EWR) using analysis covering 2022–2025 and presents recommendations for improving airport operations.

The 17-slide deck covers airport performance, weather, cascading late-inbound delays, carrier delays, staffing, scheduling, recommendations, data sources, and lessons learned.

## Open the presentation

Open `index.html` in a modern web browser. No installation or build step is required. Keep the `assets` folder alongside `index.html`.

- Use the sidebar or Previous/Next buttons to move between slides.
- Press the left and right arrow keys to navigate.
- Press **F** or use the Fullscreen button to toggle presentation mode.
- Explore chart hover details, filters, and replay controls where available.

An internet connection is required for the external chart libraries, map resources, and Google Fonts. These dependencies load from their respective providers.

## Project structure

```text
3050/
├── index.html                     # Presentation markup and slide content
├── README.md
└── assets/
    ├── css/
    │   └── styles.css             # Presentation layout and styling
    ├── js/
    │   └── presentation.js        # Navigation, charts, and embedded analysis data
    └── images/
        ├── data-sources.png       # Data-source illustration
        ├── ewr-torch.png          # Airport torch mark
        └── lessons-learned.png    # Lessons-learned illustration
```

## Technology and data

The project uses HTML, CSS, and JavaScript, with Plotly 2.30.0, Chart.js 4.4.0, and the Figtree font from Google Fonts. Analysis data is embedded in `assets/js/presentation.js`; separate raw datasets are not included in this folder.

The presentation identifies the U.S. Department of Transportation's Bureau of Transportation Statistics as a primary data source: [BTS TranStats](https://www.transtats.bts.gov/). It also describes combining airline datasets with aircraft and airport performance information, limiting the analysis to domestic flights, and using Tableau during analysis.

## Organization

The final presentation is retained as `index.html`. Duplicate copies, earlier versioned drafts, and unreferenced images were removed. Styling, presentation logic, and images are organized under `assets` for easier maintenance. To edit the deck, update the slide markup in `index.html`, its styles in `assets/css/styles.css`, or chart data and behavior in `assets/js/presentation.js`.
