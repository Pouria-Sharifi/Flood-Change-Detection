/*******************************************************
 * Flood Monitoring App
 * 
 * Description:
 * This Google Earth Engine (GEE) app identifies areas under flood
 * by analyzing Sentinel-1 radar data for a user-defined time range.
 * It displays flood-related layers, calculates the flooded area
 * (in square meters), and shows precipitation trends.
 * 
 * Features:
 * - User-defined AOI (drawn as a rectangle).
 * - Flood analysis for 1 month before and after a given flood date.
 * - Dynamic calculation of flooded area.
 * - Interactive precipitation chart.
 * 
 * Usage:
 * 1. Draw an AOI using the "Draw AOI" button.
 * 2. Set the flood date using the "Exact Flood Date" slider.
 * 3. Click "Run Analysis" to process the data.
 * 4. View results on the map and in the UI panel.
 * Author: Pouria Sharifi
 *******************************************************/

// Define the Sentinel-1 ImageCollection
var imageCollection = ee.ImageCollection("COPERNICUS/S1_GRD");

// Define UI panel for app controls
var panel = ui.Panel();
panel.style().set({
  width: '300px',
  padding: '8px',
  position: 'top-left'
});
ui.root.add(panel);

// Title of the app
panel.add(ui.Label({
  value: 'Flood Monitoring App',
  style: {fontSize: '20px', fontWeight: 'bold', margin: '10px 0'}
}));

// Placeholder variables for flood date and AOI
var floodDate = ee.Date('2023-11-01'); // Default date
var drawnAOI = null;

// Instructions
panel.add(ui.Label('1. Draw AOI.'));
panel.add(ui.Label('2. Exact Flood Date.'));
panel.add(ui.Label('3. Run Analysis'));

// Button to draw AOI
var drawButton = ui.Button({
  label: 'Draw AOI',
  onClick: function() {
    Map.drawingTools().setShape('rectangle'); // Restrict to rectangle
    Map.drawingTools().setLinked(true);
    Map.drawingTools().draw();
    ui.alert('Draw a rectangle on the map, then click "Run Analysis" when done.');
  }
});
panel.add(drawButton);

// Flood date selector slider
panel.add(ui.Label('Exact Flood Date:'));
var floodDatePicker = ui.DateSlider({
  start: '2023-01-01',
  end: '2024-12-31',
  value: '2023-11-01',
  period: 1,
  onChange: function(dateRange) {
    floodDate = ee.Date(dateRange.start());
  }
});
panel.add(floodDatePicker);

// Placeholder label for displaying flood area
var floodAreaLabel = ui.Label('Flooded Area: Pending...');
panel.add(floodAreaLabel);

// Button to run analysis
var runButton = ui.Button({
  label: 'Run Analysis',
  onClick: function() {
    if (Map.drawingTools().layers().length() === 0) {
      ui.alert('Please draw a rectangle AOI before running the analysis.');
      return;
    }
    var layer = Map.drawingTools().layers().get(0);
    drawnAOI = layer.getEeObject();
    analyzeFlood(drawnAOI, floodDate);
  }
});
panel.add(runButton);

// Main function to perform flood analysis
function analyzeFlood(aoi, floodDate) {
  Map.clear();
  Map.centerObject(aoi);

  // Define before and after periods based on the flood date
  var beforeStart = floodDate.advance(-30, 'days');
  var beforeEnd = floodDate;
  var afterStart = floodDate;
  var afterEnd = floodDate.advance(30, 'days');

  // Calculate the mean radar data for before and after periods
  var sar_before = imageCollection
    .filterDate(beforeStart, beforeEnd)
    .filterBounds(aoi)
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
    .select('VV')
    .mean()
    .clip(aoi);

  var sar_after = imageCollection
    .filterDate(afterStart, afterEnd)
    .filterBounds(aoi)
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
    .select('VV')
    .mean()
    .clip(aoi);

  // Detect changes and apply a threshold
  var change = sar_before.subtract(sar_after);
  var change_thr = change.gt(5);

  // Apply a water mask to refine flooded areas
  var water_mask = ee.ImageCollection("GOOGLE/DYNAMICWORLD/V1")
    .select('label')
    .filterDate('2022', '2023')
    .filterBounds(aoi)
    .mode().eq(0).not();
  var flooded = change_thr.updateMask(water_mask).updateMask(change_thr);

  // Calculate the flooded area in square meters
  var area_img = flooded.multiply(ee.Image.pixelArea()); // Pixel area in square meters
  var flood_area = area_img.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: aoi,
    scale: 30, // Higher resolution
    maxPixels: 1e13
  });

  // Update the flood area label dynamically
  flood_area.evaluate(function(result) {
    if (result && result.constant) {
      var floodAreaValue = result.constant.toFixed(2);
      floodAreaLabel.setValue('Flooded Area: ' + floodAreaValue + ' sq meters');
    } else {
      floodAreaLabel.setValue('Flooded Area: Could not calculate.');
    }
  });

  // Add layers to the map
  Map.addLayer(sar_before, {}, 'Before Flood');
  Map.addLayer(sar_after, {}, 'After Flood');
  Map.addLayer(change, {}, 'Change Detection');
  Map.addLayer(change_thr, {}, 'Thresholded Change');
  Map.addLayer(flooded, {palette: ['blue']}, 'Flooded Area');

  // Display precipitation trends
  var pr = ee.ImageCollection("NASA/GPM_L3/IMERG_V07")
    .select('precipitation')
    .filterDate(beforeStart, afterEnd);
  var precipChart = ui.Chart.image.series(pr, aoi, ee.Reducer.mean(), 10000, 'system:time_start')
    .setOptions({
      title: 'Precipitation Over Time',
      hAxis: {title: 'Date'},
      vAxis: {title: 'Precipitation (mm/hr)'}
    });
  panel.add(precipChart);
}
