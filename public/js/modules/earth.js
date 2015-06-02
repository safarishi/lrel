define(['jquery', 'three', 'signals', 'modules/inputcontroller', 'modules/coordinate', 'modules/globe', 'gsap', 'domReady!'], function($, THREE, Signal, inputController, Coordinate, globe) {
        var earth = {}
        var container = earth.container = null;
        var containerWidth = earth.containerWidth = 0;
        var containerHeight = earth.containerHeight = 0;

        var _canvasContainer;

        var _isShitty = earth._isShitty = false;          // 是否支持GPU
        var _isRendering = earth._isRendering = false;       // 是否渲染中
        var _isAnimating = 0;
        var _isDown = globe._isDown = 0;                // 鼠标按下
        var _isDownThroughLink = globe._isDownThroughLink = false;
        var _isPause = 0;
        var onDowned = earth.onDowned = new Signal();
        var onMoved = globe.onMoved = new Signal();
        var onUped = earth.onUped = new Signal();
        var onClicked = globe.onClicked = new Signal();
        var locateItems = globe.locateItems = [];

        // 鼠标按下事件
        function _onDown(e) {
            globe._isDownThroughLink = !!e.__isThroughLink;
            if(!_isAnimating) {
                if(!e.isSkipPreventDefault) e.preventDefault();
                globe._isDown = true;
                onDowned.dispatch(e);
                _onMove(e);
            }
        }

        // 鼠标拖曳事件
        function _onMove(e) {
            if(!_isAnimating) {
                if(globe._isDown && !globe._isDownThroughLink) {
                    e.preventDefault();
                }
                onMoved.dispatch(e);
            }
        }

        // 鼠标抬起事件
        function _onUp(e) {
            if(!_isAnimating && globe._isDown) {
                onUped.dispatch(e);
                if(e.isClick && !globe._isDownThroughLink) {
                    onClicked.dispatch();
                }
            }
            globe._isDown = false;
        }

        function show(isEarth) {

            if(!isEarth) {
                // inputController.onMove.add(_onMove);
                inputController.add($('.map-container'), 'down', _onDown);
                inputController.onMove.add(_onMove);
                inputController.onUp.add(_onUp);

                layout();
                
                if(!_isRendering) {
                    _isRendering = true;
                    _render();
                }
            }
            globe.show();
        }

        function _render(){

            if(_isRendering) {
                globe.render();
                window.requestAnimationFrame(_render);
            }
        }

        function layout() {
            containerWidth = earth.containerWidth = 1920;
            containerHeight = earth.containerHeight = 1080 - 51;
            globe.layout();
        }
        /**
         * 初始化地球
         */
        function init(data) {
           
            if(!container) {
                container = earth.container = $('.map-container');
            }
            $('.map-container').height($(window).height());
            _isShitty = false;
            _canvasContainer = $('.map-canvas-container');


            if(Coordinate && Coordinate.init) Coordinate.init();

            inputController.init();

            // $('.home-item').each(function(){
            //     var __homeItem = new Coordinate(this, _isShitty);
            //     homeItemss.push(__homeItem);
            // });
            $.each(data, function(ind, ele){
                var _locateItem = new Coordinate(ele, _isShitty);
                globe.locateItems.push(_locateItem);
            });
            
            globe.onMoved = onMoved;
            globe.onClicked = onClicked;
            globe.preInit(_isShitty);

            _canvasContainer.append(globe.container);
            show();
        }

        function preLoadLocation() {
            init([]);
        }
        // 重新加载坐标点
        function reloadLocation(points) {
            globe.locateItems = [];
            $.each(points, function(ind, ele){
                if(ele.type_id == 2){
                    var _locateItem = new Coordinate(ele, _isShitty, 1);
                    globe.locateItems.push(_locateItem);

                    var rightItem = ele;
                    rightItem.lng -= 12;
                    _locateItem = new Coordinate(rightItem, _isShitty);
                    globe.locateItems.push(_locateItem);
                    // var leftItem = ele;
                    // leftItem.lng += 10;
                    // _locateItem = new Coordinate(leftItem, _isShitty, 2);
                    // globe.locateItems.push(_locateItem);

                }else if(ele.type_id == 3){
                    var _locateItem = new Coordinate(ele, _isShitty, 3);
                    globe.locateItems.push(_locateItem);
                }else{
                    var _locateItem = new Coordinate(ele, _isShitty);
                    globe.locateItems.push(_locateItem);
                }
                
            });
            globe.reloadLocations();
        }

        // 返回原点
        function returnToHome(){
            globe.locateItems = []
            globe.reloadLocations();
        }

        function hide(isHome) {
            if(!isHome) {
                inputController.remove(container, 'down');
                inputController.onMove.remove(_onMove);
                inputController.onUp.remove(_onUp);
                _onUp();
                TweenLite.delayedCall(2, _onHidden);
            }
            globe.hide(isHome);
        }

        function _onHidden() {
            _isRendering = false;
        }

        earth.init = init;
        earth.hide = hide;
        earth.show = show;
        earth.layout = layout;
        earth.preLoadLocation = preLoadLocation;
        earth.reloadLocation = reloadLocation;
        earth.returnToHome = returnToHome;
        return earth;
})