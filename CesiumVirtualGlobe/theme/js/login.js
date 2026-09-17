'use strict';  

$(document).ready(function () {
    initView();
});

function initView() {
    // Load different styles or skins based on settings
    setStyleByTheme();

    var guid;

    // Refresh verification code
    $('.reload-vify').on('click', function () {
        var $img = $(this).children('img');
        guid = getGUID();

        $img.prop('src', baseUrl + 'userlogin/captcha.jpg?uuid=' + guid);
    });
    $('.reload-vify').click();




    // Login button
    $("#btnLogin").click(function () {

        var user = $("#txtUser").val();
        if (user == null || user.length == 0) {
            layer.tips('Please enter username', '#txtUser');
            return;
        }

        var pwd = $("#txtPwd").val();
        if (pwd == null || pwd.length == 0) {
            layer.tips('Please enter password', '#txtPwd');
            return;
        }
        //var captcha = $("#txtCaptcha").val();
        //if (captcha == null || captcha.length == 0) {
        //    layer.tips('Please enter verification code', '#txtCaptcha');
        //    return;
        //}

        // Request backend for login verification
        //sendAjax({
        //    url: "userlogin/login",
        //    data: {
        //        "username": user,     // Login username
        //        "password": pwd,      // Login password
        //        "captcha": captcha,   // Login verification code
        //        "uuid": guid,         // UUID corresponding to verification code
        //    },
        //    type: "post",
        //    success: function (data) { 
        //        haoutil.storage.add("token", data.token);
        //        haoutil.storage.add("user", JSON.stringify(data));

        //        location.href = "index.html"; 
        //    },
        //    error: function () {
        //        $("#txtCaptcha").val('');
        //        $('.reload-vify').click();
        //    }
        //});

        // Client-side validation
        var arrUser = [
            { user: 'admin', pwd: 'admin' },
        ];

        var checkStatus = false;
        for (var i = 0; i < arrUser.length; i++) {
            var item = arrUser[i];
            if (user == item.user && pwd == item.pwd ) {
                checkStatus = true;
                break;
            }
        }
        if (checkStatus) {
            haoutil.storage.add("user", JSON.stringify({ name: user}));
            location.href = "index.html";
        } else {
            layer.tips('Username or password is incorrect', '#txtUser'); 
        }


    });

    $(document).keyup(function (event) {
        if (event.keyCode == 13) {
            $("#btnLogin").trigger("click");
        } 
    });


}



function getGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


//根据设置，加载不同样式
function setStyleByTheme() {
    setInterval(slideSwitch, 5000);
    slideSwitch();
}

//图片轮播
function slideSwitch() {
    var $active = $('#loginBJ IMG.active');
    if ($active.length == 0) $active = $('#loginBJ IMG:last');

    // use this to pull the images in the order they appear in the markup
    var $next = $active.next().length ? $active.next()
        : $('#loginBJ IMG:first');
    $active.addClass('last-active');

    $next.css({ opacity: 0.0 })
        .addClass('active')
        .animate({ opacity: 1.0 }, 1000, function () {
            $active.removeClass('active last-active');
        });
}
