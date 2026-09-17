
// Module: Basemap Manager
mars3d.widget.bindClass(mars3d.widget.BaseWidget.extend({
    options: {
        // Popup window
        view: {
            type: "window",
            url: "view.html",
            windowOptions: {
                width: 190,
                height: 160
            }
        }
    },

    // Initialize [executed once]
    create: function () {
        var index = 0;
        var basemapsCfg = this.getBasemaps();
        for (var i = 0; i < basemapsCfg.length; i++) {
            var item = basemapsCfg[i];

            if (item.name == null || item.name == '' || item._layer == null)
                continue;
            index++;
        }

        if (index <= 4) {
            this.options.view.windowOptions = {
                width: 190,
                height: Math.ceil(index / 2) * 100 + 70
            }
        }
        else if (index > 4 && index <= 6) {
            this.options.view.windowOptions = {
                width: 270,
                height: Math.ceil(index / 3) * 100 + 70
            }
        } else {
            this.options.view.windowOptions = {
                width: 360,
                height: Math.ceil(index / 4) * 105 + 70
            }
        }


    },
    viewWindow: null,
    // Called after each window is created
    winCreateOK: function (opt, result) {
        this.viewWindow = result;
    },
    // Activate and open
    activate: function () {

    },
    // Deactivate and release
    disable: function () {
        this.viewWindow = null;

    },
    hasTerrain: function () {
        return this.viewer.mars.hasTerrain();
    },
    getBasemaps: function () {
        return this.viewer.gisdata.config.basemaps;
    },
    getLayerVisible: function (model) {
        return model.getVisible();
    },
    updateLayerVisible: function (model, visible) {
        model.setVisible(visible);
    },
    updateTerrainVisible: function (isStkTerrain) {
        this.viewer.mars.updateTerrainProvider(isStkTerrain);
    }





}));

