var __DQ__ = {
    theme: 'logo_2040',
    map: {
        maxLevel: 16
    },
    zIndex: {
        dialog: 200
    }
};


// 聊天相关参数
var CHAT = {
    apiURL: null,
    appkey: 'rootant#qxqy',
    conn: null
};

// 地图相关参数
var MAP = {
    vecUrl: "http://t0.tianditu.com/vec_w/wmts",
    cvaUrl: "http://t0.tianditu.com/cva_w/wmts",
    ydylUrl: "http://180.166.110.59:6080/arcgis/services/ydyl_20150330/MapServer/WmsServer"
}

require.config({
    debug: false,
    baseUrl: 'js',
    paths: {
        avalon: '../../bower_components/avalon/avalon',
        mmRequest: '../../bower_components/mm-request/public/mmRequest',
        jquery: '../../bower_components/jquery/dist/jquery.min',
        // oniui: 'bower_components/oniui', // for online
        oniui: '../../bower_components/oniui', // for development
        signals: '../../bower_components/js-signals/dist/signals.min',
        three: 'libs/three',
        gsap: '../../bower_components/gsap/src/minified/TweenMax.min',
        strophe: 'libs/strophe-custom-2.0.0',
        im: 'libs/easemob.im-1.0.5',
        leaflet: 'libs/leaflet-0.7.3',
        rootui: '../../css/modules',
        template: '../../template'
    }
})

// 地球半径
var GLOBE_RADIUS =  document.body.clientWidth / 6.5;

require([
    'avalon',
    'modules/ui',
    'modules/user',
    'modules/map',
    'modules/search',
    'modules/article',
    'modules/college',
    'modules/planning',
    'modules/planning-vote',
    'modules/IM'
], function(avalon){
    if (avalon.cookie.get('access_token')) {
        avalon.vmodels.root.isUserSignIn = true;
        IM.tokenLogin();
        avalon.vmodels.root.toggleChatBtn = true
    }
})