({
    baseUrl: "../js",//找到main.js文件的目录
    paths: {
        text: "../combo/text", //由于分居两个目录，因此路径都需要处理一下
        css: "../combo/css",
        "css-builder": "../combo/css-builder",
        "normalize": "../combo/normalize",
        domReady: "../combo/domReady",

        mmRequest: '../bower_components/mm-request/public/mmRequest',
        jquery: '../bower_components/jquery/dist/jquery.min',
        oniui: '../bower_components/oniui',
        signals: '../bower_components/js-signals/dist/signals.min',
        modernizr: '../bower_components/modernizr/modernizr',
        three: 'libs/three',
        gsap: '../bower_components/gsap/src/minified/TweenMax.min',
        strophe: 'libs/strophe-custom-2.0.0',
        im: 'libs/easemob.im-1.0.5',
        leaflet: 'libs/leaflet-0.7.3',

        rootui: '../css/modules',
        template: '../template'
    },
    name: "app",  //如果从哪一个文件开始合并
    out: "../js/app-built.js", //确定要生成的文件路径及名字,
    preserveLicenseComments: false
})