### **README**

# Flood Monitoring App

This **Flood Monitoring App** leverages Google Earth Engine (GEE) to detect and analyze flood-affected areas using Sentinel-1 radar data. It allows users to define an area of interest (AOI), specify a flood date, and compute changes in radar backscatter before and after the flood. Results are visualized on the map and in the UI panel.

---

### **Features**
- **Draw AOI**: Users can draw a rectangular AOI directly on the map.
- **Flood Analysis**: Processes radar data one month before and after the selected flood date.
- **Flooded Area Calculation**: Displays the total flooded area in square meters in the UI panel.
- **Precipitation Trends**: Displays a precipitation chart for the AOI and time range.

---

### **Usage Instructions**
1. **Define AOI**: Click the **"Draw AOI"** button and draw a rectangle on the map.
2. **Set Flood Date**: Use the **"Exact Flood Date"** slider to select the flood date.
3. **Run Analysis**: Click the **"Run Analysis"** button to process the data.
4. **View Results**:
   - Flood layers are displayed on the map.
   - The total flooded area is shown in the UI panel.
   - A precipitation chart is displayed in the panel.

---

### **Requirements**
- Google Earth Engine Code Editor.
- Access to the Sentinel-1 (`COPERNICUS/S1_GRD`) and Dynamic World (`GOOGLE/DYNAMICWORLD/V1`) datasets.

---

### **License**
This app is distributed under the [MIT License](LICENSE).
