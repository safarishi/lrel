define([
    'avalon',
    'jquery',
    'text!template/sign-in-box.html',
    'text!template/sign-up-box.html',
    'modules/earth',
    'modules/ditu',
    'oniui/cookie/avalon.cookie',
    'css!rootui/chameleon/oniui-common.css',
    'css!rootui/dialog/avalon.dialog.css',
    'oniui/dialog/avalon.dialog',
    'modules/IM',
    'modules/ui-prompt',
    'modules/ui-notify',
    'modules/qxq',
    'domReady!'
], function(avalon, $, loginBoxHtml, registerBoxHtml, earth, ditu) {
    var rootVM = avalon.define({
        $id: 'root',
        logo: '/images/' + __DQ__.theme + '.png',
        isLoadingCompleted: false,
        isUserSignIn: false, // 用户登录否
        toggleUserNav: false, // 用户菜单显示否
        toggleMenuNav: false, // 右侧菜单显示否
        toggleChatBtn: false, // 左下方聊天按钮显示否
        toggleChatBox: false, // 聊天窗口显示否
        toggleHdTool: true, // 头部菜单
        toggleWriteBox: false,
        toggleHome: true,
        // resizeWindow: function() {
        //     console.log('resized')
        // },
        /**
         * 点击用户按钮
         * 已登录：弹出用户菜单
         * 未登录：弹出登录界面
         */
        clickUserBtn: function(e) {
            if (rootVM.isUserSignIn) {
                rootVM.toggleUserNav = !rootVM.toggleUserNav;
            }
            if (!rootVM.isUserSignIn) {
                avalon.vmodels.signDialog.setContent(loginBoxHtml);
                avalon.vmodels.signDialog.toggle = true;
            }
        },
        /**
         * 点击菜单按钮
         */
        clickMenuBtn: function(e) {
            rootVM.toggleMenuNav = !rootVM.toggleMenuNav;
        },
        /**
         * 关闭菜单
         */
        closeMenuNav: function(e) {
            avalon.vmodels.root.toggleHome = false
            rootVM.toggleMenuNav = false;
        },
        closeIndexMenuNav: function(e) {
            avalon.vmodels.root.toggleHome = true
            rootVM.toggleMenuNav = false;
        },
        /**
         * 关闭用户菜单
         */
        closeUserNav: function(e) {
            rootVM.toggleUserNav = false;
        },
        /**
         * 登录弹窗参数
         */
        $SignDialogOpt: {
            zIndex: __DQ__.zIndex.dialog
        },
        /**
         * 显示注册弹窗
         */
        showSignUpDialog: function() {
            var signDialog = avalon.vmodels.signDialog
            signDialog.setContent(registerBoxHtml);
            avalon.ui.dialog.utils.resetCenter(signDialog, signDialog.widgetElement)
        },
        showSignInDialog: function(toggle) {
            avalon.vmodels.signDialog.setContent(loginBoxHtml);
        },
        /**
         * 关闭注册/登录弹窗
         */
        closeSignDialog: function() {
            avalon.vmodels.signDialog.toggle = false;
        },
        /**
         * 检测登录
         */
        checkLogin: function(e) {
            e.preventDefault()
            $.ajax({
                url: APP.api('/oauth/access-token'),
                type: 'post',
                contentType: 'application/x-www-form-urlencoded',
                dataType: 'json',
                data: {
                    grant_type: 'password',
                    username: $('#sign-in-name').val(),
                    password: $('#sign-in-pwd').val(),
                    client_id: APP.client_id,
                    client_secret: APP.client_secret
                }
            })
            .done(function(data) {
                // 登录IM服务器
                IM.login(data.access_token, $('#sign-in-pwd').val());

                $('#sign-user-name').val('')
                $('#sign-user-pwd').val('')
                if (!data || !data.access_token) {
                    return false
                }

                if (data && data.error) {
                    avalon.vmodels.prompt.error(data.error_description)
                    return false
                }

                avalon.cookie.set('access_token', data.access_token)
                avalon.cookie.set('refresh_token', data.refresh_token)
                rootVM.isUserSignIn = true
                rootVM.toggleChatBtn = true
                avalon.vmodels.signDialog.toggle = false;

                rootVM.$fire('all!isTodayFirstLogin', data.today_first_login)
            })
            .fail(qxq.ajax.failedCallback)
        },
        checkRegister: function(e) {
            e.preventDefault()
            $.ajax({
                url: APP.api('/user'),
                type: 'post',
                dataType: 'json',
                data: {
                    client_id: APP.client_id,
                    client_secret: APP.client_secret,
                    email: $('#sign-up-email').val(),
                    name: $('#sign-up-name').val(),
                    phone: $('#sign-up-phone').val(),
                    password: $('#sign-up-password').val(),
                    password_confirmation: $('#sign-up-password2').val()
                }
            })
            .done(function(data) {
                avalon.vmodels.signDialog.toggle = false;
            })
            .fail(qxq.ajax.failedCallback)
        },
        /**
         * 处理聊天窗口
         * @param  {bool} toggle
         */
        handleChatBox: function(toggle) {
            rootVM.toggleChatBox = !!toggle;
            if(toggle){
                IM.entry(avalon.vmodels.point.height);

                $('.footer-chat').off('submit', '.chat-input').on('submit', '.chat-input', function(e){
                    e.preventDefault();
                    var msg = $('.chat-text').val();
                    if(!msg) {
                        return false;
                    }
                    var options = {
                        to : IM.getRoomId(avalon.vmodels.point.height),
                        msg : msg,
                        type : 'groupchat'
                    };
                    IM.sendMessage(msg, options);
                    $('.chat-text').val('');
                    return false;
                });
            }else{

            }
        },
        handleCollegeBox: function(toggle) {
            avalon.vmodels.college.toggleCollege = toggle || rootVM.isUserSignIn
        },
        renderPoints: function(data) {
            avalon.vmodels.period.togglePeriod = true
            avalon.vmodels.point.type_id = data
            avalon.vmodels.point.renderPoints();
        },
        returnToHome: function(e) {
            rootVM.toggleHome = true
            if(avalon.vmodels.mapLevel.value != 0){
                avalon.vmodels.mapLevel.value = 0
            }else{
                earth.returnToHome();
            }
        },
        handlePlanning: function(toggle) {
            avalon.vmodels.planning.toggleList = !!toggle
        },
        // handleWriteBox: function(toggle) {
        //     rootVM.toggleWriteBox = toggle
        // },
        preventDefault: function(e) {
            e.preventDefault && e.preventDefault()
            return false
        },
        handleAuthDialog: function() {
            avalon.vmodels.authDialog.toggle = true
        },
        handleAccountDialog: function() {
            avalon.vmodels.accountDialog.toggle = true
        }
    });

    var periodVM = avalon.define({
        $id: 'period',
        togglePeriod: true,
        currentPeriod: 2,
        handlePeriod: function(index) {
            periodVM.currentPeriod = index;
        }
    });

    rootVM.$watch('isUserSignIn', function(value) {
        // 注销用户
        if (!value) {
            rootVM.toggleChatBtn = false;
        }
        this.$fire("all!isUserSignIn", value)
    })

    // 监听年代变化
    periodVM.$watch('currentPeriod', function(value) {
        avalon.vmodels.point.status_id = value;
        avalon.vmodels.point.renderPoints()
    })
})
