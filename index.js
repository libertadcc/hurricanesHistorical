require([
  "esri/Map",
  "esri/views/MapView",
  "esri/WebMap",
  "esri/layers/FeatureLayer",

  "esri/smartMapping/statistics/histogram",
  "esri/smartMapping/statistics/summaryStatistics",
  "esri/renderers/support/jsonUtils",
  "esri/symbols/CIMSymbol",
  "esri/symbols/WebStyleSymbol",
  "esri/symbols/support/cimSymbolUtils",
  "esri/Color",

  "esri/views/draw/Draw",
  "esri/Graphic",

  "esri/widgets/Histogram",
  "esri/widgets/Slider",
  "esri/widgets/Legend",
  "esri/widgets/Expand",
  "esri/widgets/Zoom",
  "esri/widgets/Bookmarks",
  "esri/webmap/Bookmark",

  "esri/geometry/geometryEngine",
  "esri/core/lang",
  "esri/core/watchUtils"
  ], function(
    Map,
    MapView, WebMap, FeatureLayer,
    histogram, summaryStatistics, rendererJsonUtils, CIMSymbol, WebStyleSymbol, cimSymbolUtils, Color,
    Draw, Graphic,
    Histogram, Slider, Legend, Expand, Zoom, Bookmarks, Bookmark,
    geometryEngine, lang, watchUtils
  ) {

    const map = new Map({
      basemap: "gray-vector"
    });
    
    const view = new MapView({
      map: map,
      container: "divMap",
      center: [-28.949852,30.820892],
      zoom: 3
    });
    
    const historicalHurricane = new FeatureLayer({
      url: 'https://services2.arcgis.com/FiaPA4ga0iQKduv3/ArcGIS/rest/services/IBTrACS_ALL_list_v04r00_lines_1/FeatureServer/0', //huracanes
      outFields: ['*']
    });
    
    var legend = new Legend({
      view: view,
      layerInfos: [{
        layer: historicalHurricane,
        title: "Legend"
      }]
    });
    
    view.ui.add(legend, "bottom-right");

    const slider = new Slider({
      container: "sliderDiv",
      min: 1982,
      max: 2021,
      values: [1985, 1986],
      snapOnClickEnabled: false,
      steps: 1,
      visibleElements: {
        labels: true, // nº encima del punto
        rangeLabels: false // nº en los extremos
      }
    });

    slider.tickConfigs = [{
      mode: "position",
      values: [1982, 1985, 1988, 1991, 1994, 1997, 2000, 2003, 2006, 2009, 2012, 2015, 2018, 2021],
      labelsVisible: true
    }];

    renderLayer(slider.values[0], slider.values[1])
   
    const loadingControl = document.getElementById("loading-control");

    checkLayerStatus();
    
    // stops propagation of default behavior when an event fires
    function stopEvtPropagation(event) {
      event.stopPropagation();
    }

    function disableViewInteraction(view) {
      slider.disabled = true;
      loadingControl.style.visibility = "visible";

      const mouseWheelHandle = view.on("mouse-wheel", stopEvtPropagation);
      const doubleClickHandle = view.on("double-click", stopEvtPropagation);
      const doubleClickControlHandle = view.on("double-click", ["Control"], stopEvtPropagation);
      const dragHandle = view.on("drag", stopEvtPropagation);
      const dragShiftHandle = view.on("drag", ["Shift"], stopEvtPropagation);
      const dragShiftCntrlHandle = view.on("drag", ["Shift", "Control"], stopEvtPropagation);

      const keyDownHandle = view.on("key-down", function(event) {
        var prohibitedKeys = ["+", "-", "Shift", "_", "="];
        var keyPressed = event.key;
        if (prohibitedKeys.indexOf(keyPressed) !== -1) {
          event.stopPropagation();
        }
      });

      return [
        mouseWheelHandle,
        doubleClickHandle,
        doubleClickControlHandle,
        dragHandle,
        dragShiftHandle,
        dragShiftCntrlHandle,
        keyDownHandle
      ];
    }

    function enableViewInteraction(handles){
      slider.disabled = false;
      handles.forEach(function(handle){
        handle.remove();
      });
      handles = [];
    }

    slider.on(['segment-drag', 'thumb-drag'], function(event) {
      if (event.state === 'stop') {
        renderLayer(slider.values[0], slider.values[1])
      }
    });

    function renderLayer(initYear, endYear){
      historicalHurricane.definitionExpression = `year >= ${initYear} AND year <= ${endYear}`;
      map.add(historicalHurricane);
      checkLayerStatus();
    };

    function checkLayerStatus() {
      view.whenLayerView(historicalHurricane)
        .then(function(lv){
        const handles = disableViewInteraction(view);


        watchUtils.whenFalseOnce(lv, "updating", function(){
          loadingControl.style.visibility = "hidden";
          enableViewInteraction(handles);
        });
      });
    };
  });
