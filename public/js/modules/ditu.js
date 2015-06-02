define(['avalon', 'leaflet', 'jquery', 'domReady!'], function() {

    var dituVM = avalon.define({
        $id: 'ditu',
        groupText: '加入 +',
        isJoin: false,
        enterGroup: function(e) {
            var gid;
            if (e && e.target) {
                gid = $(e.target).data('id');
            } else if(typeof e === 'number' && !isNaN(e)) {
                gid = e;
            }
            if (!dituVM.isJoin) {
                dituVM.joinGroup(gid)
            } else {
                avalon.vmodels.root.handleCollegeBox(true)
            }
        },
        joinGroup: function(gid) {
            $.post(APP.api('/group'), {
                gid: gid,
                access_token: avalon.cookie.get('access_token')
            }, function(data) {
                data = data || {}

                if (data.gid) {
                    dituVM.isJoin = true
                    dituVM.enterGroup()
                }

                if (data.Information == 'Your Are Already Joined This Group!') {
                    dituVM.isJoin = true
                    avalon.vmodels.root.handleCollegeBox(true)
                }

                if (data.Information == 'Your Are Not Login!') {
                    avalon.vmodels.user.checkSignIn()
                }
            })
        }
    })

    var Ditu = {};
    // 初始化地图经度并将中心对准上海
    Ditu.map = L.map('map-ditu-container', {
        zoomControl: false, // 缩放控制器
        attributionControl: false, // 右下角标识隐藏
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        maxZoom: 18, // 最大缩放级别
        minZoom: 3,
        maxBounds: [
            [-90, -180],
            [80, 180]
        ],
    });
    Ditu.pointLayer = L.layerGroup().addTo(Ditu.map);
    Ditu.setLocation = function(lng, lat, num, name, id, work_nums, group) {
        if (group) {
            var html = '<img src="' + group.icon + '"><dl><dt>微大学</dt><dd class="title">' + group.name + '</dd><dd>' + '<em>' + group.member + '名成员</em></dd></dl>';
            dituVM.isJoin = !!group.isJoin;
            html += '<a href="javascript:;" ms-click="enterGroup" data-id="' + id + '">{{groupText}}</a>'
            var popup = L.popup({
                offset: [0, 123]
            }).setContent(html);
            popup.on('contentupdate', function() {
                avalon.scan(null, dituVM)
            })
            var tempIcon = L.divIcon({
                className: 'location-icon-group',
                html: "<span data-id=" + id + " data-name=" + name + "></span>"
            });
            L.marker([lat, lng], {
                icon: tempIcon
            }).unbindPopup().bindPopup(popup).addTo(Ditu.pointLayer);
        } else if (work_nums >= 0) {
            num > 99 ? num = '99+' : null;
            work_nums > 99 ? work_nums = '99+' : null;
            var tempIcon = L.divIcon({
                className: 'location-icon-work',
                html: "<span data-id=" + id + " data-name=" + name + ">" + work_nums + "</span>"
            });
            L.marker([lat, lng], {
                icon: tempIcon
            }).addTo(Ditu.pointLayer);
            tempIcon1 = L.divIcon({
                className: 'location-icon-right',
                html: "<span data-id=" + id + " data-name=" + name + ">" + num + "</span>"
            });
            L.marker([lat, lng], {
                icon: tempIcon1
            }).addTo(Ditu.pointLayer);
            tempIcon2 = L.divIcon({
                className: 'location-icon-left',
                html: "<span data-id=" + id + " data-name=" + name + ">+</span>"
            });
            L.marker([lat, lng], {
                icon: tempIcon2
            }).addTo(Ditu.pointLayer);
        } else {
            num > 99 ? num = '99+' : null;
            var tempIcon = L.divIcon({
                className: 'location-icon',
                html: "<span data-id=" + id + " data-name=" + name + ">" + num + "</span>"
            });
            L.marker([lat, lng], {
                icon: tempIcon
            }).addTo(Ditu.pointLayer);
        }
    }
    // 地图加载点
    Ditu.reloadLocation = function(points) {
        Ditu.pointLayer.clearLayers();
        // TODO: 自己看不下去了待重写
        $.each(points, function(ind, ele) {
            if (ele.type_id == 3) {
                Ditu.setLocation(ele.lng, ele.lat, false, ele.point_name, ele.id, -1, ele);
            } else if (ele.type_id == 2) {
                Ditu.setLocation(ele.lng, ele.lat, ele.nums, ele.point_name, ele.id, ele.work_nums);
            } else {
                Ditu.setLocation(ele.lng, ele.lat, ele.nums, ele.point_name, ele.id, -1);
            }
        });
    }
    Ditu.map.setView([31.24, 121.47], 3);
    Ditu.vec = L.tileLayer.wmts(MAP.vecUrl, {
        layer: 'vec',
        style: 'default',
        format: 'tiles',
        tilematrixSet: 'w'
    });
    Ditu.cva = L.tileLayer.wmts(MAP.cvaUrl, {
        layer: 'cva',
        style: 'default',
        format: 'tiles',
        tilematrixSet: 'w'
    });
    Ditu.vec.addTo(Ditu.map);
    Ditu.cva.addTo(Ditu.map);

    Ditu.ydyl = function(toggle) {
        if(toggle){
            if(Ditu.ydylLayer)
                return true;
            Ditu.ydylLayer = L.tileLayer.wms(MAP.ydylUrl, {
                layers: '1',
                format: 'image/png',
                transparent: true,
            });
            Ditu.ydylLayer.addTo(Ditu.map);
        }else{
            if(Ditu.ydylLayer) {
                Ditu.map.removeLayer(Ditu.ydylLayer);
                Ditu.ydylLayer = null;
            }
        }
    }
    
    Ditu.show = function() {
        $('.map-ditu-container').fadeIn(1000);
    }
    Ditu.hide = function() {
        $('.map-ditu-container').fadeOut(1000);
    }
    Ditu.setLevel = function(level) {
        Ditu.map.setZoom(level);
    }
    $('#map-ditu-container')
    .on('click', '.location-icon, .location-icon-right', function() {
        var obj = $(this);
        $.get(APP.api('/point'), {
            id: obj.find('span').data('id'),
            type_id: avalon.vmodels.point.type_id,
            status_id: avalon.vmodels.point.status_id
        }, function(data) {
            // 临时解决方案
            avalon.vmodels.search.searchType = 'info';
            avalon.vmodels.search.initCategories({
                label: 'title',
                value: 'id'
            }, '')
            avalon.vmodels.search.toggleSearch = true;
            avalon.vmodels.search.data = data;
            avalon.vmodels.search.$resizeCallback();
        });
    }).on('click', '.location-icon-work', function() {
        var obj = $(this);
        var id = obj.find('span').data('id');
        $.get(APP.api('/writing'), {
            id: id,
            type_id: avalon.vmodels.point.type_id
        }, function(data) {
            // 调用作品
            avalon.vmodels.planning.toggleList = true;
            avalon.vmodels.planning.pointId = id;
            $('.planning').css('top', obj.offset().top).css('left', obj.offset().left - 250);

            var wheight = parseInt($(window).height()),
            	fheight = parseInt(obj.offset().top),
            	bheight = 777;
            if(wheight - fheight < bheight) {
            	$('.planning-detail').css('top', - fheight + wheight - bheight);
            }
        });
    }).on('click', '.location-icon-left', function() {
        window.open('http://baidu.com');
    }).on('hover', '.location-icon, .location-icon-work', function() {
        var obj = $(this);
        obj.addClass('hover');
    }, function() {
        var obj = $(this);
        obj.removeClass('hover');
    });

    dituVM.$watch('isJoin', function(value) {
        if (!!value) {
            this.groupText = '进入'
        } else {
            this.groupText = '加入 +'
        }
    })

    dituVM.$watch('isSearchCateChanged', function(value, type) {
        // 一带一路增加图层
        if (value == 9 && type == 'info') {
            Ditu.ydyl(true)
        } else {
            Ditu.ydyl(false)
        }
    })

    return Ditu;
})