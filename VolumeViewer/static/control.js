/*
 * @Descripttion: 
 * @version: 1.0.0
 * @Author: Yuzheng Zhou, Rufu Qin
 * @Date: 2019-09-30 10:20:14
 * @LastEditors: Rufu Qin
 * @LastEditTime: 2019-10-21 18:30:55
 */
// Page initialization
// Define some global variables
var current_tab = "temp";  // Current tab page
var all_tabs = ['temp', 'salinity',  'current', 'current_xy', 'current_z', 'terrain'];
var current_cut_xyz = null;  // Current cross-section being prepared (x, y, z)
var myPlot = null;  // Plot object obtained
var trange = null;  // Calculated data range for plotting (temperature, salinity, current)
var srange = null;
var current_range = null;
var current_show_traceid = [all_tabs.indexOf('current')];
var is_current_zd_show = false;
var tdat = null; 
var sdat = null;

var current_dat = null;
var clr_bar_t = 'Jet', clr_bar_s = 'Jet', clr_bar_c = 'Jet', clr_bar_cxy = 'Jet', clr_bar_cz = 'Jet',  clr_bar_terrain = 'RdBu';
var current_base_path = '';
var current_files_path = '';
var dem_file_path = '';
var region = 'mjj';

// Define some configuration information
var base_path = 'http://localhost/XDA';  
var date_api_url = 'http://localhost:8088/numerical/datelist'; 


// Prepare data file list for display - including date selector and file list under each tab - requires API support
$.getJSON(date_api_url, function (date_data) {
    update_file_path_and_list("temp", tsc_dates[0], '0');
    update_file_path_and_list("current", tsc_dates[0], '0');
})

// Default model initialization
initialize_model();

// Control tab switching and record current tab page parameters
$('a[data-toggle="tab"]').on('hide.bs.tab', function (e) {
    current_tab = e.relatedTarget.id.replace("-tab", ""); // Update current tab name for other related controls

    if (current_tab != "both") {
        // Control slider display
        $(".slider").hide();

        // Control visualization interface change when switching tab pages
        Plotly.restyle('drawBox', { visible: false }, Array.from({ length: all_tabs.length - 1 }, (v, k) => k)); // Hide all except last one (terrain)
        if (current_tab == 'current') {
            Plotly.restyle('drawBox', { visible: true }, current_show_traceid.length > 1 ? current_show_traceid : current_show_traceid[0]);
            //  Control vcurrent slider separately
            if (current_show_traceid.includes(all_tabs.indexOf('current_xy'))) {
                sorh_slider('vcurrent', true);
            }
        } else {
            Plotly.restyle('drawBox', { visible: true }, all_tabs.indexOf(current_tab));
        }

        // Control checkbox status changes
        $(".data-show-control").prop("checked", false);
        $("#show-" + current_tab).prop("checked", true);


        sorh_slider(current_tab, true);
    }
})

// Volume visualization selection - comprehensive analysis tab page - control data display through checkboxes
$(".data-show-control").change(function () {
    var control_layer = this.name;
    var show_layer = this.checked;
    $("#loading").show(1000, function () {
        if (control_layer == 'current') {
            Plotly.restyle('drawBox', { visible: show_layer }, current_show_traceid.length > 1 ? current_show_traceid : current_show_traceid[0]);
            if (current_show_traceid.includes(all_tabs.indexOf('current_xy'))) {
                sorh_slider('vcurrent', show_layer);
            }
        } else {
            Plotly.restyle('drawBox', { visible: show_layer }, all_tabs.indexOf(control_layer));
        }

        sorh_slider(control_layer, show_layer);
        show_loading(false);
    })
})

// Terrain data control
$(".data-show-terrain").change(function () {
    var show_terrain = this.checked;
    $("#loading").show(1000, function () {
        Plotly.restyle('drawBox', { visible: show_terrain }, all_tabs.length - 1);
        Plotly.relayout('drawBox', { 'scene.annotations[0].visible': show_terrain }); // Label display control

        $(".data-show-terrain").prop("checked", show_terrain);
        // Control slider position micro-adjustment
        show_terrain ? $('.slider').css("right", "54px") : $('.slider').css("right", "52px");

        show_loading(false);
    })
})

// Date selection - update start forecast time dropdown and available file list. Currently assumes 4 time slots per day (00 06 12 18)
$(".date-select-options").change(function () {
    // console.log($(this).val())
    // Update available start time slots - todo

    // Update available file list
    update_file_path_and_list(current_tab, $("#" + current_tab + "-selected-date").val(), '0');
})

// Start time selection - update dropdown list and path of available files
$(".start-pre-time").change(function () {
    // console.log($(this).val())
    update_file_path_and_list(current_tab, $("#" + current_tab + "-selected-date").val(), $(this).val());
})

// Update file list dropdown based on selected start time
function update_file_path_and_list(type = 'ts', date = '20190929', start = '0') {
    var url = '';
    var ele = '';
    switch (type) {
        case 'temp':
            // ts_files_path = base_path + region + '/dynamic/' + date + '/' + start + '/ts/3dview/';
            ts_files_path = base_path + '/dynamic/' + date + '/' + start + '/ts/3dview/';
            url = ts_files_path + 'files.json';
            ele = "#temp-selected-time";
            break;
        case 'salinity':
            // ts_files_path = base_path + region + '/dynamic/' + date + '/' + start + '/ts/3dview/';
            ts_files_path = base_path + '/dynamic/' + date + '/' + start + '/ts/3dview/';
            url = ts_files_path + 'files.json';
            ele = "#salinity-selected-time";
            break;
        case 'current':
            // current_files_path = base_path + region + '/dynamic/' + date + '/' + start + '/current/3dview/';
            current_files_path = base_path + '/dynamic/' + date + '/' + start + '/current/3dview/';
            url = current_files_path + 'files.json';
            ele = "#current-selected-time";
            break;
    }
    // console.log(type, url);
    $(ele).empty();
    $.getJSON(url, function (file_data) {
        // console.log(file_data);
        file_data.files.forEach(function (file_name) {
            if (file_name.includes('average')) {
                $(ele).append("<option value='" + file_name + "'>" + file_name.replace('.json', '') + "</option>");
            } else {
                $(ele).append("<option value='" + file_name + "'>" + file_name.substring(0, 4) + "-" + file_name.substring(4, 6) + "-" + file_name.substring(6, 8) + " " + file_name.substring(8, 10) + ":00</option>");
            }
        })
    })
}

// Initialize default model
function initialize_model() {
    var temp = {
        name: 'Temperature',
        x: [119],
        y: [19],
        z: [-1000],
        value: [15],
        visible: false,
        type: 'volume',
        colorbar: {
            len: 0.18,
            y: 0.82,
            yanchor: 'bottom',
            tickformat: '.4n',
            title: {
                text: 'Temp(℃)'
            }
        }
    };

    var salinity = {
        name: 'Salinity',
        x: [119],
        y: [19],
        z: [-1000],
        value: [15],
        visible: false,
        type: 'volume',
        colorbar: {
            len: 0.18,
            y: 0.64,
            yanchor: 'bottom',
            tickformat: '.4n',
            title: {
                text: 'Salinity'
            }
        }
    };

    var current = {
        name: 'Currents',
        x: [119],
        y: [19],
        z: [-1000],
        value: [15],
        visible: false,
        type: 'volume',
        // coloraxis: "coloraxis"
        colorscale: clr_bar_c,
        colorbar: {
            len: 0.18,
            y: 0.46,
            yanchor: 'bottom',
            tickformat: '.3n',
            title: {
                text: 'Current(m)'
            }
        }
    };

    var current_xy = {
        name: 'Currents (v)',
        x: [119],
        y: [19],
        z: [-1000],
        value: [15],
        visible: false,
        type: 'volume',
        // coloraxis: 'coloraxis'
        colorscale: clr_bar_cxy,
        colorbar: {
            len: 0.18,
            y: 0.28,
            yanchor: 'bottom',
            tickformat: '.2n',
            title: {
                text: 'Currents (v)'
            }
        }
    };

    var current_z = {
        name: 'Currents',
        x: [119],
        y: [19],
        z: [-1000],
        u: [1],
        v: [1],
        w: [15],
        visible: false,
        type: 'cone',
        // sizemode: 'absolute',
        sizeref: 0.06,  // Current direction cone size
        colorscale: clr_bar_cz,
        // colorscale: [[0, 'rgb(128,128,128)'], [1, 'rgb(128,128,128)']],
        showscale: false
    };


    var layout = {
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0
        },
        scene: {
            aspectratio: {
                x: 1.7,
                y: 1.7,
                z: 0.6
            },
            xaxis: {
                color: "#fff",
                title: { text: 'Longitude （ X ）' }
            },
            yaxis: {
                color: "#fff",
                title: { text: 'Latitude （ Y ）' }
            },
            zaxis: {
                color: "#fff",
                title: { text: 'Depth （ Z ）' }
            },
            camera: {
                eye: { x: -1.25, y: -1.75, z: 1.25 }
            },
        }
    };

    var config = {
        locale: 'zh-CN',
        displaylogo: false,
        displayModeBar: false,
        responsive: true
    };

    dem_file_path = './static/' + region + '-dem.json';
    $.getJSON(dem_file_path, function (dem_data) {
        var terrain = {
            type: 'surface',
            name: 'Terrain',
            x: dem_data.lon,
            y: dem_data.lat,
            z: dem_data.value,
            colorscale: clr_bar_terrain,
            visible: true,
            contours: {
                x: { show: false },
                y: { show: false },
                z: {
                    show: true,
                    usecolormap: true,
                    highlightcolor: "#42f462",
                    project: { z: true }
                }
            },
            colorbar: {
                len: 0.1,
                y: 0,
                yanchor: 'bottom',
                title: {
                    text: 'Depth (m)'
                },
                tickformat: '.2s'
            }
        };

        Plotly.newPlot('drawBox', [temp, salinity,  current, current_xy, current_z, terrain], layout, config);
        myPlot = document.getElementById('drawBox');
        myPlot.on('plotly_click', my_click_handler); // Bind click event

        $(".data-show-terrain").prop("checked", true);
        // $("#show-" + current_tab).prop("checked", true);
    })
}

// Handle click event on volume to select cross-section  
function my_click_handler(data) {
    // console.log(data);
    var sid = "#" + current_tab + "-selected";
    if (current_cut_xyz == null) {
        return;
    };

    var x = data.points[0].x, y = data.points[0].y, z = data.points[0].z;
    if (current_cut_xyz == 'x') { $(sid + "X").append("<option value='" + x + "'>" + x + "</option>"); };
    if (current_cut_xyz == 'y') { $(sid + "Y").append("<option value='" + y + "'>" + y + "</option>"); };
    if (current_cut_xyz == 'z') { $(sid + "Z").append("<option value='" + z + "'>" + z + "</option>"); };
    if (current_cut_xyz == 'a') { $(sid + "A").append("<option value='" + data.points[0].customdata[0] + "'>" + data.points[0].customdata[0] + "</option>"); };
}


// Load model based on selected date
function load_ts_model(type = "temp") {
    if ($("#" + type + "-selected-time").val() == null) {
        $('#' + type + '-model-btn').popover('show');
        setTimeout(function () {
            $('#' + type + '-model-btn').popover('hide')
        }, 1500)
        return;
    }

    show_loading(true);
    var url = ts_files_path + $("#" + type + "-selected-time").val();

    $.getJSON(url, function (raw_data) {
        // raw_data is the original data retrieved
        draw_new_ts(data_prep_ts(raw_data, type), type);
        $("#show-" + type).prop("checked", true);

        show_loading(false);
    });
}

// Render updated data model
function draw_new_ts(dat, type = "temp") {
    var traceid = all_tabs.indexOf(type);
    var vrange = get_max_min(dat.v);

    var update = {
        x: [dat.x], // to apply an array as a value, you need to wrap it in an additional array.
        y: [dat.y],
        z: [dat.z],
        value: [dat.v],
        opacity: 0.5,
        // opacityscale: [[[0, 0], [0.0009, 0.5], [0.001, 0.5], [1, 0.5]]],
        colorscale: type == "temp" ? clr_bar_t : clr_bar_s,
        cmin: vrange.vmin,
        cmax: vrange.vmax,
        isomin: vrange.vmin,
        isomax: vrange.vmax,
        // surface: { show: true, count: 6 }, // Whether to show isosurface
        visible: true
    };

    Plotly.restyle('drawBox', update, traceid);

    if (type == "temp") {
        tdat = dat;
        trange = vrange;

        init_slider(type, trange)
    } else {
        sdat = dat;
        srange = vrange;

        init_slider(type, srange)
    }
}

// View cross-section
function draw_tsPM(tab = "temp") {
    // show_loading(true);
    var tsdat = tab == "temp" ? tdat : sdat;
    var vPMMax = 0, vPMMin = 999;
    var selectedJD = [], selectedWD = [], selectedDepth = [];
    var traceid = all_tabs.indexOf(tab);

    // Get selected cross-section index list
    selectedJD = get_option_list("#" + tab + "-selectedX");
    selectedWD = get_option_list("#" + tab + "-selectedY");
    selectedDepth = get_option_list("#" + tab + "-selectedZ");

    // Get max/min values of selected cross-sections
    tsdat.v.forEach(function (val, index) {
        if (selectedJD.includes(tsdat.x[index]) || selectedWD.includes(tsdat.y[index]) || selectedDepth.includes(tsdat.z[index])) {
            if (vPMMax < val) {
                vPMMax = val;
            };
            if (val > 0 && vPMMin > val) {
                vPMMin = val;
            }
        }
    });
    vPMMin = Math.round(vPMMin);
    vPMMax = Math.ceil(vPMMax);

    // console.log(selectedJD, selectedWD, selectedDepth, vPMMin, vPMMax);

    var update = {
        cmin: vPMMin,
        cmax: vPMMax,
        surface: { show: false },
        slices: {
            x: {
                show: selectedJD.length > 0 ? true : false,
                locations: selectedJD
            },
            y: {
                show: selectedWD.length > 0 ? true : false,
                locations: selectedWD
            },
            z: {
                show: selectedDepth.length > 0 ? true : false,
                locations: selectedDepth
            }
        },
        caps: {
            x: {
                show: false
            },
            y: {
                show: false
            },
            z: {
                show: false
            }
        }
    };
    Plotly.restyle('drawBox', update, traceid);

    // Set checkbox to false
    $("#" + tab + "-checkboxX").prop("checked", false);
    $("#" + tab + "-checkboxY").prop("checked", false);
    $("#" + tab + "-checkboxZ").prop("checked", false);

    init_slider(tab, { vmin: vPMMin, vmax: vPMMax });

    show_loading(false);
}

// Restore volume visualization
function reset_ts(tab = "temp") {
    // show_loading(true);
    var traceid = all_tabs.indexOf(tab);
    var vrange = tab == "temp" ? trange : srange;

    var update = {
        cmin: vrange.vmin,
        cmax: vrange.vmax,
        isomin: vrange.vmin,
        isomax: vrange.vmax,
        surface: { show: true, count: 2 },
        slices: {
            x: {
                show: false
            },
            y: {
                show: false
            },
            z: {
                show: false
            }
        },
        caps: {
            x: {
                show: true
            },
            y: {
                show: true
            },
            z: {
                show: true
            }
        }
    };
    Plotly.restyle('drawBox', update, traceid);

    init_slider(tab, vrange)

    show_loading(false);
}

// Preprocess raw temperature/salinity data
function data_prep_ts(raw_data, type) {
    var dat = {
        x: raw_data.x.map(x => parseFloat(x.toFixed(3))),
        y: raw_data.y.map(x => parseFloat(x.toFixed(3))),
        z: raw_data.z,
        v: type == "temp" ? raw_data.T.map(t => t == -9999 ? null : t) : raw_data.S.map(s => s == -9999 ? null : s)
    };

    return dat;
}


// Load current velocity data based on selected date/time
function load_current_model() {
    if ($("#current-selected-time").val() == null) {
        $('#current-model-btn').popover('show');
        setTimeout(function () {
            $('#current-model-btn').popover('hide')
        }, 1500)
        return;
    }

    show_loading(true);
    var url = current_files_path + $("#current-selected-time").val();

    $.getJSON(url, function (raw_data) {
        // raw_data is the original data retrieved
        current_dat = data_prep_current(raw_data);
        draw_new_current_volume(current_dat);
        show_loading(false);
    });
}

// Render current velocity volume data
function draw_new_current_volume(dat) {
    var traceid = all_tabs.indexOf('current');
    var vrange = get_max_min(dat.w);

    var update = {
        x: [dat.x], // to apply an array as a value, you need to wrap it in an additional array.
        y: [dat.y],
        z: [dat.z],
        value: [dat.w],
        opacity: 0.5,
        cmin: vrange.vmin,
        cmax: vrange.vmax,
        isomin: vrange.vmin,
        isomax: vrange.vmax,
        visible: true
    };

    Plotly.restyle('drawBox', update, traceid);

    current_range = vrange;
    init_slider('current', vrange)
}

// Restore current velocity volume visualization
function reset_current_volume() {
    // show_loading(true);
    var traceid = all_tabs.indexOf('current');
    var vrange = current_range;

    var update = {
        visible: true,
        cmin: vrange.vmin,
        cmax: vrange.vmax,
        isomin: vrange.vmin,
        isomax: vrange.vmax,
        surface: { show: true, count: 2 },
        slices: {
            x: {
                show: false
            },
            y: {
                show: false
            },
            z: {
                show: false
            }
        },
        caps: {
            x: {
                show: true
            },
            y: {
                show: true
            },
            z: {
                show: true
            }
        }
    };
    Plotly.restyle('drawBox', update, traceid);

    Plotly.restyle('drawBox', { visible: false }, [all_tabs.indexOf('current_xy'), all_tabs.indexOf('current_z')]);
    sorh_slider('vcurrent', false);

    current_show_traceid = [all_tabs.indexOf('current')];
    init_slider('current', vrange)
    show_loading(false);
}

// Current flow direction cross-section control visibility
$("#show-current-zd").change(function () {
    if (is_current_zd_show) {
        var show_czd = this.checked;
        $("#loading").show(1000, function () {
            Plotly.restyle('drawBox', { visible: show_czd }, all_tabs.indexOf('current_z'));
            $("#show-current-zd").prop("checked", show_czd);
            if (show_czd) {
                // Ensure current_show_traceid contains current_z
                current_show_traceid.push(all_tabs.indexOf('current_z'));
            } else {
                // Ensure current_show_traceid does not contain current_z
                current_show_traceid.pop();
            }

            show_loading(false);
        })
    }
})

// Current flow cross-section drawing function
function draw_new_current_PM() {
    // show_loading(true);
    // Get selected cross-section index list
    var selectedJD = [], selectedWD = [], selectedDepth = [];
    selectedJD = get_option_list("#current-selectedX");
    selectedWD = get_option_list("#current-selectedY");
    selectedDepth = get_option_list("#current-selectedZ");

    // Maintain current current family traceid to display
    current_show_traceid = [all_tabs.indexOf('current')];
    is_current_zd_show = false;

    if (selectedJD.length + selectedWD.length > 0) {
        draw_new_current_xy(current_dat, selectedJD, selectedWD);
        current_show_traceid.push(all_tabs.indexOf('current_xy'));
    }

    if (selectedDepth.length > 0) {
        draw_new_current_z_d(get_data_from_z(current_dat, selectedDepth, 2)); // 2 means sample one data every other one
        draw_new_current_z_PM(selectedDepth);
        current_show_traceid.push(all_tabs.indexOf('current_z'));
        is_current_zd_show = true;
        $("#show-current-zd").prop("checked", true);
    } else {
        Plotly.restyle('drawBox', { visible: false }, all_tabs.indexOf('current'));
        current_show_traceid.shift();
    }

    show_loading(false);
}

// Draw current velocity xy cross-section
function draw_new_current_xy(dat_with_null, selectedJD, selectedWD) {
    var traceid = all_tabs.indexOf('current_xy');
    var dat = {
        x: dat_with_null.x,
        y: dat_with_null.y,
        z: dat_with_null.z,
        v: dat_with_null.v.concat()
    }

    // Get max/min values of selected cross-sections
    var vPMMax = 0, vPMMin = 9999;
    dat.v.forEach(function (val, index) {
        if (selectedJD.includes(dat.x[index]) || selectedWD.includes(dat.y[index])) {
            if (vPMMax < val) {
                vPMMax = val;
            };
            if (val != null) {
                if (vPMMin > val) {
                    vPMMin = val;
                }
            } else {
                dat.v[index] = -999
            }
        }
    })

    var update = {
        x: [dat.x],
        y: [dat.y],
        z: [dat.z],
        value: [dat.v],
        visible: true,
        cmin: vPMMin,
        cmax: vPMMax,
        isomin: vPMMin,
        isomax: vPMMax,
        opacity: 0.5,
        surface: { show: false },
        slices: {
            x: {
                show: selectedJD.length > 0 ? true : false,
                locations: selectedJD
            },
            y: {
                show: selectedWD.length > 0 ? true : false,
                locations: selectedWD
            }
        },
        caps: {
            x: {
                show: false
            },
            y: {
                show: false
            },
            z: {
                show: false
            }
        }
    };

    Plotly.restyle('drawBox', update, traceid);

    init_slider('vcurrent', { vmax: vPMMax, vmin: vPMMin });
}

// Render updated data model
function draw_new_current_z_d(dat) {
    var traceid = all_tabs.indexOf('current_z'); // current layer id

    var update = {
        x: [dat.x], // to apply an array as a value, you need to wrap it in an additional array.
        y: [dat.y],
        z: [dat.z],
        u: [dat.u],
        v: [dat.v],
        w: [dat.w],
        opacity: 0.5,
        visible: true
    };

    Plotly.restyle('drawBox', update, traceid);
}

// Render updated data model - draw arrow
function draw_new_current_z_PM(selectedDepth) {
    var traceid = all_tabs.indexOf('current'); // current layer id

    var update = {
        visible: true,
        surface: { show: false },
        slices: {
            z: {
                show: true,
                locations: selectedDepth
            }
        },
        caps: {
            x: {
                show: false
            },
            y: {
                show: false
            },
            z: {
                show: false
            }
        }
    };

    Plotly.restyle('drawBox', update, traceid);
}

// Get data based on selected z for drawing arrows
function get_data_from_z(dat, z_array, xygap = 2) {
    var res = {
        x: [],
        y: [],
        z: [],
        u: [],
        v: [],
        w: []
    };
    var tmpw = [];

    var needx = chouqu(dat.x, xygap), needy = chouqu(dat.y, xygap);

    for (let i = 0; i < dat.z.length; i++) {
        if (z_array.includes(dat.z[i]) && needx.includes(dat.x[i]) && needy.includes(dat.y[i])) {
            res.x.push(dat.x[i])
            res.y.push(dat.y[i])
            res.z.push(dat.z[i])
            res.u.push(dat.u[i])
            res.v.push(dat.v[i])
            tmpw.push(dat.w[i])
        }
    }

    // Update current selected cross-section range
    var vrange = get_max_min(tmpw);
    init_slider('current', vrange)

    res.w = Array(res.x.length).fill(0);

    return res;
}

// Extract xyz data - pass xyz and interval, return extracted result
function chouqu(xyz, gap = 5) {
    var unique_xyz = Array.from(new Set(xyz));
    return unique_xyz.filter(function (ele, index) {
        return index % gap == 0
    })
}

// Preprocess raw current data
function data_prep_current(raw_data) {
    var dat = {
        x: raw_data.x.map(x => parseFloat(x.toFixed(3))),
        y: raw_data.y.map(x => parseFloat(x.toFixed(3))),
        z: raw_data.z,
        u: raw_data.U.map(s => s == -9999 ? null : parseFloat(s.toFixed(3))),
        v: raw_data.V.map(s => s == -9999 ? null : parseFloat(s.toFixed(3))),
        w: raw_data.W.map(s => s == -9999 ? null : parseFloat(s.toFixed(3)))
    };

    return dat;
}


// Enable selection tool
function cut_select(type) {
    // Disable tool under different tabs
    switch (current_tab) {
        case 'both':
            return;
            break;
        default:
            if (type == 'a') {
                return;
            }
            break;
    }

    $("body").css("cursor", "url('./static/" + type + ".ico'), crosshair");

    current_cut_xyz = type;
}

// Disable selection tool
function clc_select() {
    $("body").css("cursor", "auto");

    current_cut_xyz = null;
}

// Clear current cross-section selection
function empty_select() {
    // Disable tool under sonar and comprehensive analysis tabs
    if (current_tab == 'both') {
        return;
    }

    clear_selectedPM(current_tab)
}

// Clear selected cross-section and set corresponding checkbox to unchecked
function clear_selectedPM(tab = "temp") {
    var sid = "#" + tab + "-selected";
    $(sid + "X").empty();
    $(sid + "Y").empty();
    $(sid + "Z").empty();
    $(sid + "A").empty();

}

// View cross-section
function view_select() {
    if (current_tab == 'both') {
        return;
    }

    $("#loading").show(1000, function () {
        switch (current_tab) {
            case "temp":
                draw_tsPM(current_tab)
                break;
            case "salinity":
                draw_tsPM(current_tab)
                break;
            case "current":
                draw_new_current_PM()
                break;
            default:
                // Disable
                break;
        }
        clc_select()
    })
}

// Return to volume visualization
function reset_select() {
    if (current_tab == 'both') {
        return;
    }

    $("#loading").show(1000, function () {
        switch (current_tab) {
            case "temp":
                reset_ts(current_tab)
                break;
            case "salinity":
                reset_ts(current_tab)
                break;
            case "current":
                reset_current_volume()
                break;

            default:
                // Disable
                break;
        }
    })
}

/*
 Slider control range related code  Slider control range related code
 Slider control range related code  Slider control range related code
 Slider control range related code  Slider control range related code
 Slider control range related code  Slider control range related code
*/

// Colorbar adjustment button function
var tempSlider = document.getElementById('slider-temp');
var saltSlider = document.getElementById('slider-salinity');
var currentSlider = document.getElementById('slider-current');
var vcurrentSlider = document.getElementById('slider-vcurrent');
var opacitySlider = document.getElementById('slider-opacity');
var vcurrentsizeSlider = document.getElementById('slider-vcurrent-size');

noUiSlider.create(tempSlider, {
    orientation: 'vertical',
    tooltips: [wNumb({ decimals: 2 }), wNumb({ decimals: 2 })],
    margin: 0.1,
    direction: 'rtl',
    start: [14.6, 15.4],
    range: {
        'min': [14],
        'max': [16]
    }
});

noUiSlider.create(saltSlider, {
    orientation: 'vertical',
    tooltips: [wNumb({ decimals: 2 }), wNumb({ decimals: 2 })],
    margin: 0.1,
    direction: 'rtl',
    start: [14.6, 15.4],
    range: {
        'min': [14],
        'max': [16]
    }
});

noUiSlider.create(currentSlider, {
    orientation: 'vertical',
    tooltips: [wNumb({ decimals: 2 }), wNumb({ decimals: 2 })],
    margin: 0.1,
    direction: 'rtl',
    start: [14.6, 15.4],
    range: {
        'min': [14],
        'max': [16]
    }
});

noUiSlider.create(vcurrentSlider, {
    orientation: 'vertical',
    tooltips: [wNumb({ decimals: 2 }), wNumb({ decimals: 2 })],
    margin: 0.1,
    direction: 'rtl',
    start: [14.6, 15.4],
    range: {
        'min': [14],
        'max': [16]
    }
});

noUiSlider.create(opacitySlider, {
    tooltips: [wNumb({ decimals: 2 })],
    start: [0.50],
    range: {
        'min': [0],
        'max': [1]
    }
});

noUiSlider.create(vcurrentsizeSlider, {
    tooltips: [wNumb({ decimals: 2 })],
    start: [0.06],
    range: {
        'min': [0.01],
        'max': [0.99]
    }
});


tempSlider.noUiSlider.on('change', function (values, handle) {
    slider_update_ts('temp', values)
    console.log(values)
});

saltSlider.noUiSlider.on('change', function (values, handle) {
    slider_update_ts('salinity', values)
    console.log(values)
});

// Flow field adjusts visualization area based on colorbar - combined velocity
currentSlider.noUiSlider.on('change', function (values, handle) {
    // show_loading(true);
    var traceid = [all_tabs.indexOf('current'), all_tabs.indexOf('current_z')];

    var update = {
        isomin: parseFloat(values[0]),
        isomax: parseFloat(values[1])
    };

    $("#loading").show(1000, function () {
        Plotly.restyle('drawBox', update, traceid);
    })
    show_loading(false);
});

// Flow field adjusts visualization area based on colorbar - v direction velocity
vcurrentSlider.noUiSlider.on('change', function (values, handle) {
    // show_loading(true);
    var traceid = all_tabs.indexOf('current_xy');

    var update = {
        isomin: parseFloat(values[0]),
        isomax: parseFloat(values[1])
    };

    $("#loading").show(1000, function () {
        Plotly.restyle('drawBox', update, traceid);
    })
    show_loading(false);
});

// Adjust transparency
opacitySlider.noUiSlider.on('change', function (values, handle) {
    // show_loading(true);
    // console.log(values)
    var traceid = '';
    var update = {
        opacity: parseFloat(values[0])
    };

    switch (current_tab) {
        case 'current':
            traceid = [all_tabs.indexOf('current'), all_tabs.indexOf('current_xy'), all_tabs.indexOf('current_z')]
            break;
        case 'both':
            traceid = Array.from({ length: all_tabs.length }, (v, k) => k)
            break;
        default:
            traceid = all_tabs.indexOf(current_tab)
            break;
    }

    $("#loading").show(1000, function () {
        Plotly.restyle('drawBox', update, traceid);
    })

    show_loading(false);
});

// Adjust current velocity arrow direction size
vcurrentsizeSlider.noUiSlider.on('change', function (values, handle) {
    // show_loading(true);
    if (!$("#show-current-zd").prop('checked')) {
        return;
    }
    var traceid = all_tabs.indexOf('current_z');
    var update = {
        sizeref: parseFloat(values[0])
    };

    $("#loading").show(1000, function () {
        Plotly.restyle('drawBox', update, traceid);
    })
    show_loading(false);
    console.log(values)
});


// Initialize slider range
function init_slider(type, range) {
    var theSlider = '';
    switch (type) {
        case 'temp':
            theSlider = tempSlider
            break;
        case 'salinity':
            theSlider = saltSlider
            break;
        case 'current':
            theSlider = currentSlider
            break;
        case 'vcurrent':
            theSlider = vcurrentSlider
            break;
    }

    theSlider.noUiSlider.updateOptions({
        range: {
            'min': range.vmin,
            'max': range.vmax
        }
    });

    theSlider.noUiSlider.set([range.vmin, range.vmax])
    sorh_slider(type, true)
}

// Control slider display visibility
function sorh_slider(type = "temp", sorh) {
    var eid = "#slider-" + type;
    sorh ? $(eid).show() : $(eid).hide();
}

// Slider controlled temperature/salinity data model
function slider_update_ts(type = "temp", values) {
    // show_loading(true);
    var traceid = all_tabs.indexOf(type);

    var update = {
        isomin: parseFloat(values[0]),
        isomax: parseFloat(values[1])
    };

    $("#loading").show(1000, function () {
        Plotly.restyle('drawBox', update, traceid);
    })
    show_loading(false);
}

/*
 Some common helper functions  Some common helper functions
 Some common helper functions  Some common helper functions
 Some common helper functions  Some common helper functions
 Some common helper functions  Some common helper functions
*/

// Get selected option values - prepare for cross-section visualization
function get_option_list(eleid) {
    var locations = [];
    $(eleid + " option").each(function () {
        locations.push(parseFloat($(this).val()));
    });

    return locations;
}

// Show or hide loading indicator
function show_loading(torf = false) {
    torf ? $("#loading").show(1000) : $("#loading").hide(1000);
}

// Block process - implement sleep
function sleep(delay) {
    var start = (new Date()).getTime();
    while ((new Date()).getTime() - start < delay) {
        continue;
    }
}

// Get max/min values from input array - prepare for coloring
function get_max_min(val_array) {
    var vMin = 9999;
    var vMax = 0;
    val_array.forEach(function (val) {
        if (vMax < val) {
            vMax = val;
        };
        if (val != null && vMin > val) {
            vMin = val;
        }
    });

    if (vMin == 0) {
        vMin = 0.001
    }

    return { vmax: vMax, vmin: vMin };
}