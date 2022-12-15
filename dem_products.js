///////////////////////////////////////////////////////////////////
//Script Name	: DEM_products_GEE                                                                                            
//Description	: DEM products and a new way of visualize                                                                                
//Author     	: Lais Pool da Silva Freitas                                          
//Email     	: lais.pool@gmail.com                                           
///////////////////////////////////////////////////////////////////
// Panels are the main container widgets
var map2 = ui.Map();

var mainPanel = ui.Panel();
  mainPanel.style().set({
  width: '300px',
  position: 'top-right'
});
map2.add(mainPanel)


var layerpanel = ui.Panel();
  layerpanel.style().set({
  width: '300px',
  position: 'top-right'
});
map2.add(layerpanel)

var title = ui.Label({
  value: 'Products of a Digital Elevation Model - Betha Version',
  style: {'fontSize': '18px'}
});
var subtitle = ui.Label({
  value: 'Draw the transects and click to load (in development)',
  style: {'fontSize': '14px'}
});

mainPanel.add(title)
mainPanel.add(subtitle)

var dropdownPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal'),
});

mainPanel.add(dropdownPanel);

// Create a panel to hold the chart.
var panelchart = ui.Panel(
  {
  layout: ui.Panel.Layout.flow('horizontal'),
})
  panelchart.style().set({
  width: '400px',
  position: 'bottom-right'})
  //panelchart.add(ui.Label('Click on the button on the window above'));
map2.add(panelchart);
/*
var panelchartLeft = ui.Panel();
  panelchartLeft.style().set({
  width: '400px',
  position: 'middle-left'})
Map.add(panelchartLeft);
*/

ui.SplitPanel()
// Creating the ROI 
// to see how access: https://geojson.io/#map=2/0/20
var aoi = ee.Geometry.Polygon(
          [[[-48.908222320016876,-26.01844857093097],
            [-48.9064199035096,-26.50280397532729],
            [-48.46773787525714,-26.5011909647073],
            [-48.47134270827166,-26.02007054297659],
            [-48.688881305890064,-26.021689107410538],
            [-48.908222320016876,-26.01844857093097]]]);
Map.centerObject(aoi,12)       
map2.centerObject(aoi,12)           

// Importing the contour shapefile from the assets window
var feature = ee.FeatureCollection('projects/ee-laispool-sr/assets/Contorno');

// Creating contour from shapefile                                     
var empty = ee.Image().byte(); 
// Contour of the feature
var contour = empty.paint({
  featureCollection: feature,
  color: 1,
  width: 2
});

// PERSONAL PRODUCTS SECTION
var emptyIm = ee.Image().byte(); 

var dems_col = function (img){ //function of two variables
  var dem_1940 = ee.Image("projects/ee-laispool-sr/assets/DEM1940").rename('dem_1940'); //import the DEM from the assets window
  var dem_2021 = ee.Image("projects/ee-laispool-sr/assets/DEM2021").rename('dem_2021'); // import the DEM from the assets window
  var newBands = ee.Image([dem_1940,dem_2021]);
  return img.addBands(newBands)} 

var dems = dems_col(emptyIm);
print('colection of DEMs:', dems)

// Adding the DEM products to the image 
function dem_products (dem) { //function of two variables
  var slope = ee.Terrain.slope(dem).rename ('slope');// Calculate slope. Units are degrees, range is [0,90).
  var aspect = ee.Terrain.aspect(dem).rename ('aspect'); // Calculate aspect. Units are degrees where 0=N, 90=E, 180=S, 270=W.
  var elevation = dem.rename('elevation'); // add the DEM as a band
  var newBands = ee.Image([slope,aspect,elevation]);
  return dem.addBands(newBands)} // Add the new products to the satellite image
  
var DEMproducts1 = dem_products(dems.select('dem_1940')); // Apply the function
print('Produtos da primeira DEM', DEMproducts1);

var DEMproducts2 = dem_products(dems.select('dem_2021'));
print('Produtos da segunda DEM', DEMproducts2);


// Showing the results 
Map.addLayer(DEMproducts1.select('slope'), {min: 0, max: 3, palette:['green','lime', 'yellow','orange','red']}, 'Slope 1940',false);
Map.addLayer(DEMproducts1.select('aspect'), {min: 0, max: 360, palette:['red', 'orange', 'yellow','green','cyan','LightBlue','blue','pink','red']}, 'Aspect 1940',false);
Map.addLayer(DEMproducts1.select('elevation'),{min: -30, max: 0}, 'Elevation_1940',false);

Map.addLayer(DEMproducts2.select('slope'), {min: 0, max: 3, palette:['green','lime', 'yellow','orange','red']}, 'Slope 2021',false);
Map.addLayer(DEMproducts2.select('aspect'), {min: 0, max: 360, palette:['red', 'orange', 'yellow','green','cyan','LightBlue','blue','pink','red']}, 'Aspect 2021',false);
Map.addLayer(DEMproducts2.select('elevation'),{min: -30, max: 0}, 'Elevation_2021', false);

map2.addLayer(DEMproducts1.select('slope'), {min: 0, max: 3, palette:['green','lime', 'yellow','orange','red']}, 'Slope 1940',false);
map2.addLayer(DEMproducts1.select('aspect'), {min: 0, max: 360, palette:['red', 'orange', 'yellow','green','cyan','LightBlue','blue','pink','red']}, 'Aspect 1940',false);
map2.addLayer(DEMproducts1.select('elevation'),{min: -30, max: 0}, 'Elevation_1940',false);

map2.addLayer(DEMproducts2.select('slope'), {min: 0, max: 3, palette:['green','lime', 'yellow','orange','red']}, 'Slope 2021',false);
map2.addLayer(DEMproducts2.select('aspect'), {min: 0, max: 360, palette:['red', 'orange', 'yellow','green','cyan','LightBlue','blue','pink','red']}, 'Aspect 2021',false);
map2.addLayer(DEMproducts2.select('elevation'),{min: -30, max: 0}, 'Elevation_2021', false);

// Normalize the image 

// Machine learning algorithms work best on images when all features have
// the same range

// Function to Normalize Image
// Pixel Values should be between 0 and 1
// Formula is (x - xmin) / (xmax - xmin)
//************************************************************************** 
function normalize(image){
  var bandNames = image.bandNames();
  // Compute min and max of the image
  var minDict = image.reduceRegion({
    reducer: ee.Reducer.min(),
    geometry: aoi,
    scale: 20,
    maxPixels: 1e9,
    bestEffort: true,
    tileScale: 16
  });
  var maxDict = image.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: aoi,
    scale: 20,
    maxPixels: 1e9,
    bestEffort: true,
    tileScale: 16
  });
  var mins = ee.Image.constant(minDict.values(bandNames));
  var maxs = ee.Image.constant(maxDict.values(bandNames));

  var normalized = image.subtract(mins).divide(maxs.subtract(mins));
  return normalized;
}

var DEMproducts1 = normalize(DEMproducts1);
var DEMproducts2 = normalize(DEMproducts2);

var vis_SABlue = { // Define the visualization parameters
  bands: ['slope', 'aspect','elevation'],
};
Map.centerObject(dems.select('dem_2021'),12);
Map.addLayer(DEMproducts1, vis_SABlue, 'Slope - Aspect - Elevation (1940)');
Map.addLayer(DEMproducts2, vis_SABlue, 'Slope - Aspect - Elevation (2021)',false);

map2.centerObject(dems.select('dem_2021'),12);
map2.addLayer(DEMproducts1, vis_SABlue, 'Slope - Aspect - Elevation (1940)',false);
map2.addLayer(DEMproducts2, vis_SABlue, 'Slope - Aspect - Elevation (2021)');

// CONTOURLINE GENERATION 
var lines = ee.List.sequence(-30, 0, 2);
var contourlines = lines.map(function(line) {
  var myContour = dems.select('dem_1940')
    .convolve(ee.Kernel.gaussian(5, 3))
    .subtract(ee.Image.constant(line)).zeroCrossing();
    
  return myContour
    .multiply(ee.Image.constant(line)).toFloat()
    .mask(myContour);
});

var contourlines1 = ee.ImageCollection(contourlines).mosaic();
 
Map.addLayer(contourlines1, {min: -30, max: 0, palette:['0000FF','00FF00','FF0000']}, 'contours1940',false);
map2.addLayer(contourlines1, {min: -30, max: 0, palette:['0000FF','00FF00','FF0000']}, 'contours1940',false);


var contourlines = lines.map(function(line) {
  var myContour = dems.select('dem_2021')
    .convolve(ee.Kernel.gaussian(5, 3))
    .subtract(ee.Image.constant(line)).zeroCrossing();
    
  return myContour
    .multiply(ee.Image.constant(line)).toFloat()
    .mask(myContour);
});

var contourlines2 = ee.ImageCollection(contourlines).mosaic();
 
Map.addLayer(contourlines2, {min: -30, max: 0, palette:['0000FF','00FF00','FF0000']}, 'contours2021',false);
map2.addLayer(contourlines2, {min: -30, max: 0, palette:['0000FF','00FF00','FF0000']}, 'contours2021',false);

// TRANSECTS GENERATION
// Plot elevation along a transect.
//var Loadtransect =  (function() {
//Map.onClick(function() {
var geometry1 = ee.Geometry.MultiLineString(
  [[-48.58841140770876, -26.178340170130287],[-48.580600815057394, -26.188738300406403]]);
var geometry2 = ee.Geometry.MultiLineString(
  [[-48.57036831840016, -26.158795861787876],[-48.55766537650563, -26.169811995122767]]);
var geometry3 = ee.Geometry.MultiLineString(
  [[-48.555605439982195, -26.1468485931926], [-48.53972676261403, -26.16125557209963]]);
var geometry4 = ee.Geometry.MultiLineString(
  [[-48.525908021769304, -26.16503036865806],[-48.514921693644304, -26.155785752169404]]);

//function loop(geo){
map2.addLayer(geometry1,{color: 'FF0000'}, 'Pontal transect');

  // Extract band values along the transect line.
  var image2array = function(image,line){
    return image.reduceRegion(
      ee.Reducer.toList(), line, 10).toArray()};// Create arrays for charting, For the Y axis.
  
///////// geometry 1
  var elev1 = image2array(dems.select('dem_1940'),geometry1);
  //var elve1 = elev1.slice(1, 0, -1);
  var elev2 = image2array(dems.select('dem_2021'),geometry1);
  var elev2 = elev2.slice(1, 0, -1);

  var elevation = ee.Array.cat([elev1, elev2], 0)//.rename('none','elev1','elev2');
  var comprimento = elev1.length().get([1]).subtract(1).multiply(10);
  // Sort points along the transect by their distance from the starting point.
  var distances = ee.List.sequence(0, comprimento, 10);
  // Generate and style the chart.
  var chart = ui.Chart.array.values(elevation, 1, distances);
      chart.setChartType('LineChart');
      chart.setSeriesNames(['Bathymetry 1940','Bathymetry 2021']);
      chart.setOptions({
        title: 'Bathymetry along Pontal transect',
        vAxes: {
          0: {
            title: 'Elevation (meters)',
            baselineColor: 'transparent'
            },
        },
        hAxis: {
          title: 'Distance (m)'
        },
        interpolateNulls: true,
        pointSize: 0,
        lineWidth: 1,
      });
panelchart.widgets().set(0, chart);
//print(cahrt);

////////////// geometry 2
map2.addLayer(geometry2,{color: 'FF0000'}, 'Entrance transect');

  var elev3 = image2array(dems.select('dem_1940'),geometry2);
  //var elve1 = elev1.slice(1, 0, -1);
  var elev4 = image2array(dems.select('dem_2021'),geometry2);

  var elevation = ee.Array.cat([elev3, elev4], 0)//.rename('none','elev1','elev2');
  var comprimento = elev3.length().get([1]).subtract(1).multiply(10);
  // Sort points along the transect by their distance from the starting point.
  var distances = ee.List.sequence(0, comprimento, 10);
  // Generate and style the chart.
  var chart = ui.Chart.array.values(elevation, 1, distances);
      chart.setChartType('LineChart');
      chart.setSeriesNames(['Bathymetry 1940','Bathymetry 2021']);
      chart.setOptions({
        title: 'Bathymetry along the Entrance transect',
        vAxes: {
          0: {
            title: 'Elevation (meters)',
            baselineColor: 'transparent'
            },
        },
        hAxis: {
          title: 'Distance (m)'
        },
        interpolateNulls: true,
        pointSize: 0,
        lineWidth: 1,
      });
panelchart.widgets().set(1, chart);

///////////// geometry 3
map2.addLayer(geometry3,{color: 'FF0000'}, 'Curve transect');

  var elev5 = image2array(dems.select('dem_1940'),geometry3);
  //var elve1 = elev1.slice(1, 0, -1);
  var elev6 = image2array(dems.select('dem_2021'),geometry3);

  var elevation = ee.Array.cat([elev5, elev6], 0)//.rename('none','elev1','elev2');
  var comprimento = elev5.length().get([1]).subtract(1).multiply(10);
  // Sort points along the transect by their distance from the starting point.
  var distances = ee.List.sequence(0, comprimento, 10);
  // Generate and style the chart.
  var chart2 = ui.Chart.array.values(elevation, 1, distances);
      chart2.setChartType('LineChart');
      chart2.setSeriesNames(['Bathymetry 1940','Bathymetry 2021']);
      chart2.setOptions({
        title: 'Bathymetry along the Curve transect',
        vAxes: {
          0: {
            title: 'Elevation (meters)',
            baselineColor: 'transparent'
            },
        },
        hAxis: {
          title: 'Distance (m)'
        },
        interpolateNulls: true,
        pointSize: 0,
        lineWidth: 1,
      });
panelchart.widgets().set(2, chart2);

///////////// geometry 4
map2.addLayer(geometry4,{color: 'FF0000'}, 'Entrance Chanel');

  var elev7 = image2array(dems.select('dem_1940'),geometry4);
  //var elve1 = elev1.slice(1, 0, -1);
  var elev8 = image2array(dems.select('dem_2021'),geometry4);

  var elevation = ee.Array.cat([elev7, elev8], 0)//.rename('none','elev1','elev2');
  var comprimento = elev7.length().get([1]).subtract(1).multiply(10);
  // Sort points along the transect by their distance from the starting point.
  var distances = ee.List.sequence(0, comprimento, 10);
  // Generate and style the chart.
  var chart3 = ui.Chart.array.values(elevation, 1, distances);
      chart3.setChartType('LineChart');
      chart3.setSeriesNames(['Bathymetry 1940','Bathymetry 2021']);
      chart3.setOptions({
        title: 'Bathymetry along Entrance Chanel transect',
        vAxes: {
          0: {
            title: 'Elevation (meters)',
            baselineColor: 'transparent'
            },
        },
        hAxis: {
          title: 'Distance (m)'
        },
        interpolateNulls: true,
        pointSize: 0,
        lineWidth: 1,
      });
panelchart.widgets().set(3, chart3);

var button = ui.Button({
  label: 'Load profile(s)',
  disabled: true});
dropdownPanel.add(button);
//button.onClick(Loadtransect);

var tinypanel = ui.Panel();
  tinypanel.style().set({
  width: '130px',
  position: 'bottom-left',
});
Map.add(tinypanel);
var authorLabel = ui.Label(
{
  value: 'App by: Laís Pool',
  style: {'fontSize': '12px'}
});
tinypanel.add(authorLabel);


// Link the two panels
var linker = ui.Map.Linker([ui.root.widgets().get(0), map2]);
// Create the split panels

var splitPanel = ui.SplitPanel({
  firstPanel: ui.root.widgets().get(0),
  secondPanel: map2,
  orientation: 'horizontal',
  wipe: true,
  style: {stretch: 'both'}
});

// Set the split panels to ui roots
ui.root.widgets().reset([splitPanel]);
