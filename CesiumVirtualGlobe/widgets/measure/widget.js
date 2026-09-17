// Module: Measure Tools
mars3d.widget.bindClass(mars3d.widget.BaseWidget.extend({
    options: {
        // Popup window
        view: {
            type: "window",
            url: "view.html",
            windowOptions: {
                width: 380,
                height: 160
            }
        },
    },
    measureControl: null,
    // Initialize [executed once]
    create: function () {
        this.measureControl = new mars3d.Measure({
            viewer: this.viewer
        })
    },
    // viewWindow: null,
    // // Called after each window is created
    // winCreateOK: function (opt, result) {
    //    this.viewWindow = result;
    // },
    // Activate plugin
    activate: function () {
        this.viewWindow = null;
        this.removeRotation()

    },
    // Release plugin
    disable: function () {
        this.clearDraw();
    },
    removeRotation: function () {
        var that = this;

        that.viewer.clock.shouldAnimate = false;
        that.viewer.clock.onTick._listeners.forEach(function (ev) {
            if (ev.name == 'onTickCallback') {
                that.viewer.clock.onTick.removeEventListener(ev)
            }
        })
    },
    drawPolyline: function (options) {
        this.measureControl.measuerLength(options);
    },
    drawPolygon: function (options) {
        this.measureControl.measureArea(options);
    },
    drawHeight: function (options) {
        this.measureControl.measureHeight(options);
    },
    drawSection: function (options) {
        this.measureControl.measureSection(options);
    },
    measureAngle: function (options) {
        this.measureControl.measureAngle(options);
    },
    updateUnit: function (thisType, danwei) {
        this.measureControl.updateUnit(thisType, danwei);
    },
    clearDraw: function () {
        this.measureControl.clearMeasure();
        mars3d.widget.disable(this.jkWidgetUri);
    },
    formatArea: function (val, unit) {
        return this.measureControl.formatArea(val, unit);
    },
    formatLength: function (val, unit) {
        return this.measureControl.formatLength(val, unit);
    },
    jkWidgetUri: 'widgets/sectionChars/widget.js',
    showSectionChars: function (data) {
        mars3d.widget.activate({
            uri: this.jkWidgetUri,
            data: data
        });
    },



}));