# Dashboard.js

This file is part of the **Data Visualization Framework** developed for the Faculty of Computer Science and Mathematics at the University of Passau. It is responsible for rendering and managing the interactive dashboard, which includes multiple visualizations such as a sunburst chart, histogram, box plot, and radar chart.

## File Overview

### Key Features:
1. **Sunburst Chart**:
   - Visualizes hierarchical data based on two categorical groupings.
   - Allows users to interact with segments to filter data for other charts.
   - Tooltip displays category details on hover.

2. **Histogram**:
   - Displays the distribution of exam scores.
   - Includes a slider to adjust the number of bins dynamically.

3. **Box Plot**:
   - Shows the distribution of exam scores grouped by internet quality.
   - Interactive tooltips display statistical details (min, Q1, median, Q3, max).
   - Clicking on a box filters data for the radar chart.

4. **Radar Chart**:
   - Compares average values of multiple metrics (e.g., study hours, mental health rating).
   - Normalizes data to fit within a circular grid.

5. **Dynamic Dropdowns**:
   - Allows users to select primary and secondary groupings for the sunburst chart.

6. **Fullscreen Toggle**:
   - Expands charts to fullscreen for better visibility.

---

## Functions

### Initialization
- **`initDashboard(_data)`**:
  - Initializes the dashboard with the provided data.
  - Sets up the dimensions and creates the four charts.

- **`createDropdowns()`**:
  - Generates dropdown menus for selecting primary and secondary groupings.

### Chart Rendering
- **`createChart1()`**:
  - Renders the sunburst chart.
  - Uses `buildSunburstHierarchy()` to structure data hierarchically.
  - Handles user interactions like clicks and hovers.

- **`createChart2(filteredData)`**:
  - Renders the histogram of exam scores.
  - Dynamically updates based on the number of bins.

- **`createChart3(filteredData)`**:
  - Renders the box plot grouped by internet quality.
  - Includes interactive tooltips and click-to-filter functionality.

- **`createChart4(filteredData)`**:
  - Renders the radar chart comparing average values of multiple metrics.
  - Normalizes data and plots a closed polygon.

### Utility Functions
- **`refreshCharts()`**:
  - Clears and re-renders all charts with the current filtered data.

- **`clearDashboard()`**:
  - Clears all charts from the dashboard.

- **`clearChart(chart)`**:
  - Removes all elements from a specific chart.

- **`toggleFullscreen(btn)`**:
  - Expands a chart to fullscreen mode.

---

## Data Structure

### Input Data
The dashboard expects data in the following format:
```csv
student_id,age,gender,study_hours_per_day,social_media_hours,netflix_hours,part_time_job,attendance_percentage,sleep_hours,diet_quality,exercise_frequency,parental_education_level,internet_quality,mental_health_rating,extracurricular_participation,exam_score
S1000,23,Female,0.0,1.2,1.1,No,85.0,8.0,Fair,6,Master,Average,8,Yes,56.2
S1001,20,Female,6.9,2.8,2.3,No,97.3,4.6,Good,6,High School,Average,8,No,100.0
