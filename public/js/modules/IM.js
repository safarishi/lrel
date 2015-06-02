define([
    'avalon',
    'jquery',
    'im',
    'oniui/cookie/avalon.cookie',
    'domReady!'
], function(avalon, $, Easemob) {
    var IM = {}
    IM.conn = new Easemob.im.Connection();
    //初始化连接
    IM.conn.init({
        https: false,
        //当连接成功时的回调方法
        onOpened: function() {
            handleOpen(IM.conn);
        },
        // //当连接关闭时的回调方法
        // onClosed : function() {
        //     handleClosed();
        // },
        // //收到文本消息时的回调方法
        onTextMessage: function(message) {
            handleTextMessage(message);
        },
        // //收到表情消息时的回调方法
        // onEmotionMessage : function(message) {
        //     handleEmotion(message);
        // },
        // //收到图片消息时的回调方法
        // onPictureMessage : function(message) {
        //     handlePictureMessage(message);
        // },
        // //收到音频消息的回调方法
        // onAudioMessage : function(message) {
        //     handleAudioMessage(message);
        // },
        // //收到位置消息的回调方法
        // onLocationMessage : function(message) {
        //     handleLocationMessage(message);
        // },
        // //收到文件消息的回调方法
        // onFileMessage : function(message) {
        //     handleFileMessage(message);
        // },
        // //收到视频消息的回调方法
        // onVideoMessage : function(message) {
        //     handleVideoMessage(message);
        // },
        // //收到联系人订阅请求的回调方法
        // onPresence : function(message) {
        //     handlePresence(message);
        // },
        // //收到联系人信息的回调方法
        // onRoster : function(message) {
        //     handleRoster(message);
        // },
        // //收到群组邀请时的回调方法
        // onInviteMessage : function(message) {
        //     handleInviteMessage(message);
        // },
        //异常时的回调方法
        onError: function(message) {
            console.log(message);
            handleError(message);
        }
    });


    //登录系统时的操作方法
    IM.login = function(access_token, password) {
        $.ajax({
            url: APP.api('/user'),
            type: 'get',
            dataType: 'json',
            data: {
                access_token: access_token
            }
        })
        .done(function(data) {
            IM.conn.close();
            IM.conn.open({
                user : data.id.toString(),
                pwd : password,
                appKey : CHAT.appkey
            });
        })
        return false;
    };

    IM.tokenLogin = function() {
        IM.conn.close();
        IM.conn.open({
            user : avalon.cookie.get('im_uid'),
            accessToken : avalon.cookie.get('im_access_token'),
            appKey : CHAT.appkey
        });
        return false;
    };

    // 进入空间聊天室
    IM.entry = function(height) {
        var roomId = isNaN(height) ? height : IM.getRoomId(height);
        IM.conn.join({
            roomId : roomId
        });
    }

    IM.getRoomId = function(height) {
        var roomId;
        switch(height){
            case 0:
            case 1:
            case 2:
                roomId = '1426143043950087';
                break;
            case 3:
            case 4:
            case 5:
                roomId = '142756074955701';
                break;
            case 6:
            case 7:
            case 8:
                roomId = '1427560989178884';
                break;
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
            case 16:
                roomId = '1427561090788781';
                break;
        }
        return roomId;
    }

    IM.sendMessage = function(msg, options) {
        IM.conn.sendTextMessage(options);
        appendMsg(null, msg, 'me');
    }

    //处理连接时函数,主要是登录成功后对页面元素做处理
    var handleOpen = function(conn) {
        //从连接中获取到当前的登录人注册帐号名
        curUserId = conn.context.userId;
        conn.getRoster({
            success: function(roster) {
                // 将Token存入本地
                avalon.cookie.set('im_uid', conn.context.userId);
                avalon.cookie.set('im_access_token', conn.context.accessToken);
                conn.setPresence();
                // 页面处理
                // var curroster;
                // for ( var i in roster) {
                //     var ros = roster[i];
                //     //both为双方互为好友，要显示的联系人,from我是对方的单向好友
                //     if (ros.subscription == 'both'
                //             || ros.subscription == 'from') {
                //         bothRoster.push(ros);
                //     } else if (ros.subscription == 'to') {
                //         //to表明了联系人是我的单向好友
                //         toRoster.push(ros);
                //     }
                // }
                // if (bothRoster.length > 0) {
                //     curroster = bothRoster[0];
                // }
                // //获取当前登录人的群组列表
                // conn.listRooms({
                //     success : function(rooms) {
                //          console.log(rooms);
                //         if (rooms && rooms.length > 0) {

                //         }
                //         conn.setPresence();//设置用户上线状态，必须调用
                //     },
                //     error : function(e) {

                //     }
                // });
            }
        });
    };

    var appendMsg = function(from, content, type){
        var message = '<div class="chat-item ' + type + '">'+
            '<div class="chat-item-content">'+
                '<img src="/statics/images/avatar/default.jpg" alt="" class="avatar">'+
                (type == 'you' ? '<div class="name">用户UID' + from + '</div>' : '') +
                '<div class="cloud cloud-text">'+
                    '<div class="cloud-panel">'+
                        '<div class="send-status"></div>'+
                        '<div class="cloud-body">'+
                            '<pre>' + content + '</pre>'+
                        '</div>'+
                    '</div>'+
                    '<div class="cloud-arrow"></div>'+
                '</div>'+
            '</div>'+
        '</div>';

        $('.chat').append(message);
        $('.chat').scrollTop($('.chat')[0].scrollHeight);
        return false;
    };

    var handleTextMessage = function(message) {
        var from = message.from;//消息的发送者
        var mestype = message.type;//消息发送的类型是群组消息还是个人消息
        var messageContent = message.data;//文本消息体
        var roomId = IM.getRoomId(avalon.vmodels.point.height)
        var room = message.to
        if (mestype == 'groupchat' && roomId == room) {
            appendMsg(message.from, message.data, 'you');
        }
    };

    // login();
    window.IM = IM;
})