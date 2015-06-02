define(['avalon', 'modules/earth', 'modules/ditu'], function(avalon, earth, ditu) {
    var areaVM = avalon.define({
        $id: 'point',
        $skipArray: ['renderPoints'],
        east: -180,
        south: -90,
        west: 180,
        north: 90,
        height: 0,
        type_id: 1,
        status_id: 2,
        renderPoints: function() {
            // 首页不操作
            if(avalon.vmodels.root.toggleHome != true){
                var url ='';
                if (areaVM.type_id == 3) {
                    url = APP.api_url + '/grouppoints';
                }else{
                    url = APP.api_url + '/points';
                }

                $.get(url, {
                    height: areaVM.height,
                    type_id: areaVM.type_id, 
                    status_id: areaVM.status_id, 
                    east: areaVM.east, 
                    south: areaVM.south, 
                    west: areaVM.west, 
                    north: areaVM.north,
                    cate: avalon.vmodels.search.cate,
                    access_token: avalon.cookie.get('access_token')
                }, function(data){
                    if(areaVM.height == 0){
                        earth.reloadLocation(data);
                    }else{
                        ditu.reloadLocation(data);
                    }
                });
            }
        }
    })
})