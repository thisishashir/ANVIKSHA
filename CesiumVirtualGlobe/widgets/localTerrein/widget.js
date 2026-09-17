
// Module: Local Terrain Display
mars3d.widget.bindClass(mars3d.widget.BaseWidget.extend({
    options: {
        // Popup window
        view: {
            type: "window",
            url: "view.html",
            windowOptions: {
                width: 1200,
                height: 800
            }
        },
    },
    // Initialize [executed once]
    create: function () {

    },
    viewWindow:null,
    // Called after each window is created
    winCreateOK: function (opt, result) {
        this.viewWindow = result; 
    },
    // Activate and open
    activate: function () {

        // Test: call method in [view.html popup page]
        this.viewWindow.testIframeFun();

    },
    // Deactivate and release
    disable: function () {
        this.viewWindow = null;


    },


    // Test: called by [view.html popup page]
    testFun: function () {
        toastr.info('This is a test method defined in the index page widget');
    }


}));

