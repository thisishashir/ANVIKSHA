
//var baseUrl = 'http://localhost:8888/hfgh-api/';
var baseUrl = '';


// Unified method to access backend API
function sendAjax(opts) {
    console.log('Request Info:\n' + JSON.stringify(opts)); // Log


    $.ajax({
        url: baseUrl + "/" + opts.url,
        type: opts.type || "post",
        dataType: opts.dataType || "json",
        timeout: opts.timeout || 12000,
        contentType: opts.contentType,
        data: opts.data,
        crossDomain: true,
        beforeSend: function (request) {
            if (opts.loading)
                haoutil.loading.show(opts.loading);

            var token = haoutil.storage.get("token");
            if (token)
                request.setRequestHeader("token", token);
        },
        success: function (result, status, xhr) {
            if (opts.loading)
                haoutil.loading.hide();

            console.log('Response Result:\n' + JSON.stringify(result)); // Log

            if (result && result.code !== 0) {
                if (result.code == 401 && window.top) {
                    top.location.href = "theme/login.html";
                }
                haoutil.msg(result.msg);

                if (opts.error) {
                    opts.error();
                }
            }
            else {
                // Normal response
                if (opts.success) {
                    opts.success(result.data);
                }
            }
        },
        error: function (data) {
            if (opts.loading)
                haoutil.loading.hide();
            if (opts.noError) return;

            console.log('Service Access Error:\n' + JSON.stringify(data)); // Log
            if (data.status == 401 && window.top) {
                top.location.href = "theme/login.html";
            }
            var msg = opts.errorMsg || ("Service Access Error(" + data.status + "): " + data.statusText);
            haoutil.msg(msg);

            if (opts.error) {
                opts.error();
            }
        }
    });
}