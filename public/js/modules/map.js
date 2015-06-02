define([
    'avalon',
    'modules/earth',
    'modules/globe',
    'modules/ditu',
    'modules/point',
    'css!rootui/chameleon/oniui-common.css', 
    'css!rootui/slider/avalon.slider.css',
    'oniui/slider/avalon.slider',
    'domReady!'
], function(avalon, earth, globe, ditu) {
    // 初始地球
    earth.preLoadLocation();

    var mapSlider = avalon.define({
        $id: 'map',
        $mapOpt: {
            min: 0,
            max: __DQ__.map.maxLevel,
            value: 0,
            index: false,
            onDragStart: function(ev, data) {},
            onDrag: function(vm, data) {},
            onDragEnd: function(data) {
                var level = avalon.vmodels.mapLevel.value;

                switch (level) {
                    case 0:
                        ditu.hide();
                        earth.show();
                        if(avalon.vmodels.root.toggleHome == true){
                            earth.returnToHome();
                        }else{
                            earth.show();
                        }
                        break;

                    case 1:
                        earth.hide();
                        ditu.show();
                        break;

                    default:
                        if(document.getElementById("map-canvas-container").style.display != 'none'){
                            earth.hide();
                        }
                        ditu.setLevel(level + 2);
                }
                var slider = $('.map-slider')
                slider.css('opacity', '1')
                setTimeout(function() {
                    slider.css('opacity', '.5')
                }, 300)
                setTimeout(function() {
                    mapSlider.sliderValue = level
                },  2000)
            }
        },
        sliderValue: 0,
        addLevel: function() {
            if(globe.hidding){
                return false;
            }
            avalon.vmodels.mapLevel.value++;
        },
        minusLevel: function() {
            if(globe.hidding){
                return false;
            }
            avalon.vmodels.mapLevel.value--;
        },
        wheelLevel: function(ev) {
            ev.preventDefault();
            if(globe.hidding){
                return false;
            }
            avalon.vmodels.mapLevel.value += ev.wheelDelta/120;
        }
    });
    
    mapSlider.$watch('sliderValue', function(value) {
        avalon.vmodels.point.height = value;
        avalon.vmodels.point.renderPoints()
    })
})