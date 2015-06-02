define(['three', 'jquery', 'signals', 'gsap', 'avalon', 'domReady!'], function(THREE, $, Signal) {

    var globe = {};

    var PI = Math.PI;
    var PI_HALF = PI / 2;
    var PI_2 = PI * 2;

    var container = null;

    var _images = {};

    var _locateItems = globe.locateItems;

    var _camera;
    var _scene;
    var _renderer;
    var _domElement;
    var _darkRenderer;
    var _composer;

    var _fixedScalePoint;

    var _shaders;
    var _globePhongMat;
    var _globeGeometry;
    var _globeMesh;

    var _bgVec2;

    var _darkMat;
    var _darkGeometry;
    var _darkMesh;

    var _projector;
    var _raycaster;

    var _loadCount = 0;
    var _isActive = false;
    var _wasReady = false;
    var _isReady = false;
    var _isAutoRotate = true;
    var _isShitty = false;

    var _zoom = 0;
    var _time = 0;

    var _mx = 0;
    var _my = 0;
    var _hoverTarget;
    var _yaw = 0;
    var _pitch = 0;

    var _winWidth;
    var _winHeight;
    var _winWidthHalf;
    var _winHeightHalf;
    var _useNorth = false;

    var _northImgStyle;
    var _northObject;
    var _northRotateObject;

    var _tweenObj = {fadeIn: 0};
    var _pos = {x: 0, y: 0, z: 0};

    var _transform3dStyle = transform3dStyle() ? 'transform' : false;


    var _fogNear = 0;
    var _fogFar = 0;
    var onMoved = globe.onMoved;
    var onClicked = globe.onClicked;

    var docElement = document.documentElement,
    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style;

    function transform3dStyle() {
        var ret = true;
        injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function( node, rule ) {
            ret = node.offsetLeft === 9 && node.offsetHeight === 3;
        });
        return ret;
    }

    function injectElementWithStyles( rule, callback, nodes, testnames ) {

        var style, ret, node, docOverflow,
            div = document.createElement('div'),
            // After page load injecting a fake body doesn't work so check if body exists
            body = document.body,
            // IE6 and 7 won't return offsetWidth or offsetHeight unless it's in the body element, so we fake it.
            fakeBody = body || document.createElement('body');

        if ( parseInt(nodes, 10) ) {
            // In order not to give false positives we create a node for each test
            // This also allows the method to scale for unspecified uses
            while ( nodes-- ) {
                node = document.createElement('div');
                node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
                div.appendChild(node);
            }
        }

        // <style> elements in IE6-9 are considered 'NoScope' elements and therefore will be removed
        // when injected with innerHTML. To get around this you need to prepend the 'NoScope' element
        // with a 'scoped' element, in our case the soft-hyphen entity as it won't mess with our measurements.
        // msdn.microsoft.com/en-us/library/ms533897%28VS.85%29.aspx
        // Documents served as xml will throw if using &shy; so use xml friendly encoded version. See issue #277
        style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
        div.id = mod;
        // IE6 will false positive on some tests due to the style element inside the test div somehow interfering offsetHeight, so insert it into body or fakebody.
        // Opera will act all quirky when injecting elements in documentElement when page is served as xml, needs fakebody too. #270
        (body ? div : fakeBody).innerHTML += style;
        fakeBody.appendChild(div);
        if ( !body ) {
            //avoid crashing IE8, if background image is used
            fakeBody.style.background = '';
            //Safari 5.13/5.1.4 OSX stops loading if ::-webkit-scrollbar is used and scrollbars are visible
            fakeBody.style.overflow = 'hidden';
            docOverflow = docElement.style.overflow;
            docElement.style.overflow = 'hidden';
            docElement.appendChild(fakeBody);
        }

        ret = callback(div, rule);
        // If this is done after page load we don't want to remove the body so check if body exists
        if ( !body ) {
            fakeBody.parentNode.removeChild(fakeBody);
            docElement.style.overflow = docOverflow;
        } else {
            div.parentNode.removeChild(div);
        }

        return !!ret;

    }

    function preInit(isShitty, northImg) {
        _isShitty = isShitty;

        _renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, preserveDrawingBuffer: false, devicePixelRatio: 1, sortObjects: true });
        _domElement = _renderer.domElement;
         globe.container = $(_domElement);


        _camera = new THREE.PerspectiveCamera(45, 1, 1, 2500);
        _camera.position.z = 1500;

        _scene = new THREE.Scene();
        if((navigator.appVersion.indexOf('Mac')!=-1)) {
            _fogNear = 1469;
            _fogFar = 2300;
        } else {
            _fogNear = 1000;
            _fogFar = 2100;
    	}
        _scene.fog = new THREE.Fog( 0x00e4ff, _fogNear, _fogFar );

        _projector = new THREE.Projector();
        _raycaster = new THREE.Raycaster();

        _renderer.setSize(1, 1);
        _renderer.gammaInput = true;
        _renderer.gammaOutput = true;


        setTimeout(function(){
            var _timestamp = + new Date;
            if(_isShitty) {
                _loadCount = 3;
                _loadImage('tDiffuse', 'shitty_diffuse.jpg');
                _loadImage('tBg', 'bg-new.jpg');
                _loadImage('tGlow', 'glow.png');
            } else {
                _loadCount = 6;
                _loadImage('tDiffuse', 'earth_day.jpg');
                _loadImage('tDisplacement', 'earth_bump.jpg');
                _loadImage('tSpecular', 'earth_specular.jpg');
                _loadImage('tBg', 'bg-new.jpg');
                _loadImage('tDark', 'earth_light.jpg');
                _loadImage('tGlow', 'glow.png');
            }
        }, 4);
    }

    function _loadImage(id, filename) {
        var img = _images[id] = new Image();
        img.src = 'images/earth/' + filename;
        if(img.width) {
            _loadImageLoaded();
        } else {
            img.onload = _loadImageLoaded;
        }
    }

    function _loadImageLoaded() {
        _loadCount--;
        // 更新加载进度
        UNLOADED_EARTH_PIC--;
        if(!_loadCount) {
            init();
        }
    }

    function init() {
        _locateItems = globe.locateItems;

        for(var id in _images) {
            var texture = _images[id].texture = new THREE.Texture(_images[id]);
            texture.needsUpdate = true;
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }

        _fixedScalePoint = new THREE.Object3D();

        if(_isShitty) {
            _globePhongMat = new THREE.MeshPhongMaterial({
                map: _images.tDiffuse.texture,
                shininess: 20
            });
        } else {
            _globePhongMat = new THREE.MeshPhongMaterial({
                map: _images.tDiffuse.texture,
                bumpMap: _images.tDisplacement.texture,
                specularMap: _images.tSpecular.texture,
                specular: new THREE.Color(0x074192),
                shininess: 20,
                bumpScale: 5
            });
        }

        _globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 32, 32, 160 / 180 * PI);
        _globeGeometry.computeTangents();
        _globeMesh = new THREE.Mesh(_globeGeometry, _globePhongMat);
        _globeMesh.position.y = 0;
        _globeMesh.position.z = -250;
        _scene.add(_globeMesh);

        _northObject = new THREE.Object3D();
        _northRotateObject = new THREE.Object3D();
        _northObject.position.y = GLOBE_RADIUS;
        _globeMesh.add(_northObject);
        _globeMesh.add(_northRotateObject);

        if(!_isShitty) {
            _darkScene = new THREE.Scene();
            // _darkScene.fog = new THREE.Fog( 0x00e4ff, 1000, 1600 );
            _darkGeometry = new THREE.SphereGeometry(GLOBE_RADIUS + 1, 32, 32, 160 / 180 * PI);
            _darkGeometry.computeTangents();
            _darkMat = new THREE.MeshBasicMaterial({
                map: _images.tDark.texture
            });
            _darkMesh = new THREE.Mesh(_darkGeometry, _darkMat);
            _darkScene.add(_darkMesh);
        }

        // LIGHTS
        var light00 = new THREE.PointLight( 0xffffff, 2, 1500 );
        light00.position.set( 800, 100, 900 );
        _scene.add( light00);

        var light01 = new THREE.PointLight( 0x87b4ff, 1, 5000 );
        light01.position.set( 0, 200, -300 );
        _scene.add( light01 );

        var renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: false };
        _composer = new THREE.EffectComposer( _renderer, new THREE.WebGLRenderTarget( 1, 1, renderTargetParameters));
        _renderPass = new THREE.RenderPass( _scene, _camera );

        if(!_isShitty) {

            _darkRenderPass = new THREE.RenderPass( _darkScene, _camera );
            _saveEffect = new THREE.SavePass();
            _postprocessing = new THREE.ShaderPass( THREE.GlobeShader );
            _postprocessing.uniforms.tDiffuse2.value = _saveEffect.renderTarget;
            _postprocessing.uniforms.tDiffuse3.value = _images.tGlow.texture;

            _composer.addPass( _darkRenderPass );
            _composer.addPass( _saveEffect );

        } else {
            _postprocessing = new THREE.ShaderPass( THREE.ShittyGlobeShader );
            _postprocessing.uniforms.tDiffuse2.value = _images.tGlow.texture;
        }
        _postprocessing.uniforms.tBg.value = _images.tBg.texture;
        _postprocessing.uniforms.bgScale.value = new THREE.Vector2(1,1);
        _postprocessing.uniforms.res.value = new THREE.Vector2(1,1);
        _postprocessing.uniforms.r.value = new THREE.Vector2(0,0);

        _composer.addPass( _renderPass );
        _composer.addPass( _postprocessing );
        _postprocessing.renderToScreen = true;
        // _renderPass.renderToScreen = true;

        for(var i = 0, len = _locateItems.length; i < len; i++) {
            _globeMesh.add(_locateItems[i].normalObj);
            _scene.add(_locateItems[i].line);
            if(!_isShitty) {
                _darkScene.add(_locateItems[i].cloneLine);
            }
        }

        globe.onMoved.add(_onMove);
        globe.onClicked.add(_onClick);

        _isReady = true;
        IS_EARTH_LOADED = true;
        if(_isActive) {
            show(_filterId);
        }
    }

    function _onMove(evt) {
        // if(home.isDownThroughLink) return;
        _mx = evt.x / _winWidth * 2 - 1;
        _my =  - evt.y / _winHeight * 2 + 1;
        if(globe._isDown) {
            _yaw += evt.deltaX ? evt.deltaX * 0.002 : 0;
            _pitch += evt.deltaY ? evt.deltaY * 0.002 : 0;
        }

    }

    function _onClick(evt) {
        if(_hoverTarget) {
            _hoverTarget.line.position.x

            var projector = new THREE.Projector();  
  
              
            var vector = projector.projectVector(_hoverTarget.line.position, _camera);  
              
            var halfWidth = window.innerWidth / 2;  
            var halfHeight = window.innerHeight / 2;  
              
            var result = {  
              
                x: Math.round(vector.x * halfWidth + halfWidth),  
                y: Math.round(-vector.y * halfHeight + halfHeight)  
              
            };
            // isPlan
            // 1: 资讯
            // 3: 互动交流
            if(_hoverTarget.isPlan == 1){
                avalon.vmodels.planning.toggleList = true;
                avalon.vmodels.planning.pointId = _hoverTarget.point_id
            }else if(_hoverTarget.isPlan == 3){
                if (avalon.vmodels.user.checkSignIn()) {
                    $.getJSON(APP.api('/join'), {access_token: avalon.cookie.get('access_token')}, function(data) {
                        if (data && !data.is_join) {
                            var prompt = avalon.vmodels.prompt
                            prompt.showBtns = true
                            prompt.info('加入微大学？')
                            avalon.vmodels.promptDialog.onConfirm = function() {
                                $.post(APP.api('/group'), {gid: 1, access_token: avalon.cookie.get('access_token')}, function(data, textStatus, xhr) {
                                    if (data) {
                                        avalon.vmodels.college.cateId = 1
                                        avalon.vmodels.college.toggleCollege = true
                                    }
                                })
                            }
                        } else if(data.is_join) {
                            avalon.vmodels.college.cateId = 1
                            avalon.vmodels.college.toggleCollege = true
                        }
                    })
                }
            }else{
                $.get(APP.api_url + '/point', {id: _hoverTarget.point_id, type_id: 1, status_id: 2}, function(data){
                    // 临时解决方案
                    avalon.vmodels.search.searchType = 'info';
                    avalon.vmodels.search.initCategories({
                        label: 'title',
                        value: 'id'
                    }, 'all')
                    avalon.vmodels.search.toggleSearch = true;
                    avalon.vmodels.search.data = data;
                    avalon.vmodels.search.$resizeCallback();
                })
            }

            // 这里加入点击事件

            // $('.square').css('left', result.x);
            // $('.square').css('top', result.y);
            // alert(_hoverTarget);
            // window.location.href = _hoverTarget.url;
        }
    }

    function show(filterId, wasHome) {
        _isActive = true;
        globe.hidding = true;
        _filterId = filterId;
        layout();
        if(_isReady) {
            if(!wasHome) {
                // $('.map-canvas-container').fadeIn();
                TweenLite.killTweensOf(_pos);
                TweenLite.to(_pos, _isShitty ? 0 : 3, {z: 0, y : 0, ease: 'easeInOutSine'});
                // TweenLite.to(_pos, _isShitty ? 0 : (dispatch.isFirstRoute ? 3 : 2), {z: -1200, y : 0, ease: 'easeInOutSine'});
                TweenLite.fromTo(_tweenObj, _isShitty ? 1 : 3, {fadeIn: 0}, {fadeIn: 1, ease: 'easeInOutSine', onComplete: function(){
                    globe.hidding = false;
                }});
                if(_isShitty) {
                    render();
                }
            }

            for(var i = 0, len = _locateItems.length; i < len; i++) {
               _locateItems[i].show(0.5, (wasHome ? 0 : _isShitty ? 1 : 2.5) + Math.random() * 0.3);
            }
           
        }
    }

    function hide(isHome) {
        _isActive = false;
        globe.hidding = true;
        if(_isReady) {
            if(!isHome) {
                if(_isShitty) {
                    _tweenObj.fadeIn = 0.5;
                } else {
                    TweenLite.to(_pos, 3, {z: 3100, y : 0, ease: 'easeInOutQuint', onComplete: function(){
                    globe.hidding = false;
                    // $('.map-canvas-container').fadeOut(1000);
                }});
                }
            }
            for(var i = 0, len = _locateItems.length; i < len; i++) {
                _locateItems[i].hide(0.5, Math.random() * 0.3);
            }
        }
    }

    function goTo(lat, lng, duration) {

    }

    function onNorthClick() {
        var fX = _globeMesh.rotation.x;
        var fY = _globeMesh.rotation.y;
        var fZ = _globeMesh.rotation.z;
        var tX = _getNearAngle(fX, _northRotateObject.rotation.x);
        var tY = _getNearAngle(fY, _northRotateObject.rotation.y);
        var tZ = _getNearAngle(fZ, _northRotateObject.rotation.z);
        var duration = 0.2 + _length3( tX - fX, tY - fY, tZ - fZ ) * 0.5;
        _useNorth = true;
        TweenLite.to(_globeMesh.rotation, duration, {x: tX, y: tY, z: tZ, onComplete: function(){
            _useNorth = false;
        }});
    }

    function _clamp(val, min, max) {
        return val < min ? min : val > max ? max : val;
    }

    function _clampLng(lng) {
        return ((lng + 180) % 360) - 180;
    }

    function _getNearAngle(from, to) {
        return Math.abs(to - from) > PI ? from - to > 0 ? to + PI_2 : to - PI_2 : to;
    }

    function _length2(dx, dy) {
        return Math.sqrt( dx * dx + dy * dy );
    }

    function _length3(dx, dy, dz) {
        return Math.sqrt( dx * dx + dy * dy + dz * dz );
    }

    function render() {
        if(_isReady && !(_isShitty && (_tweenObj.fadeIn != ~~_tweenObj.fadeIn))) {
            if(!_wasReady) {
                layout();
            }
            var autoRatio = _isAutoRotate ? 1 : 1 - _zoom;

            var detlaYaw = _yaw * 0.1;
            var detlaPitch = _pitch * 0.1;
            _yaw -= detlaYaw;
            _pitch -= detlaPitch;

            if(!_hoverTarget) {
                // _yaw -=0.001 * _mx;
                _yaw +=0.005;
                // _pitch -=0.001 * _mx; 
            }

            if(!_useNorth) {
                var q = new THREE.Quaternion();
                q.setFromAxisAngle((new THREE.Vector3(0,1,0)).normalize(), detlaYaw);
                _globeMesh.quaternion.multiplyQuaternions( q, _globeMesh.quaternion );
                q = new THREE.Quaternion();
                q.setFromAxisAngle((new THREE.Vector3(1,0,0)).normalize(), detlaPitch);
                _globeMesh.quaternion.multiplyQuaternions( q, _globeMesh.quaternion );
            }

            _globeMesh.position.x = _pos.x;
            _globeMesh.position.y = _pos.y;
            _globeMesh.position.z = _pos.z;

            _fixedScaleFactor = 2 * Math.tan(_camera.fov / 360 * PI) / screen.height;
            _fixedScalePoint.position.copy(_camera.position);
            _fixedScalePoint.rotation.copy(_camera.rotation);
            var fixedScalePointLength = 1 / _fixedScaleFactor;

            if(!_isShitty) {
                _darkMesh.position.copy(_globeMesh.position);
                _darkMesh.rotation.copy(_globeMesh.rotation);
                _darkMesh.scale.copy(_globeMesh.scale);
            }
            _camera.position.z = fixedScalePointLength - _zoom * GLOBE_RADIUS;
            var cameraPositionClone = _camera.position.clone().normalize();
            var cameraUpPositionClone = _camera.up.clone().normalize();

            var cameraDirection = _camera.position.clone().sub(_globeMesh.position).normalize();

            _camera.updateMatrixWorld();
            _globeMesh.updateMatrixWorld();

            _northObject.updateMatrixWorld();
            var tmp = (new THREE.Vector3()).setFromMatrixPosition(_northObject.matrixWorld);
            var dX = tmp.x - _globeMesh.position.x;
            var dY = tmp.y - _globeMesh.position.y;
            var q = new THREE.Quaternion();
            var northAngle = -Math.atan2(dY, dX) + PI_HALF;
            q.setFromAxisAngle((new THREE.Vector3(0,0,1)).normalize(), northAngle);
            _northRotateObject.position.copy(_globeMesh.position);
            _northRotateObject.rotation.copy(_globeMesh.rotation);
            _northRotateObject.quaternion.multiplyQuaternions( q, _globeMesh.quaternion );

            // var rX = _globeMesh.rotation.x;
            // var rY = _globeMesh.rotation.y;
            // var rZ = _globeMesh.rotation.z;
            // _globeMesh.lookAt(_camera.position);
            // _globeMesh.rotation.x = rX;
            // _globeMesh.rotation.y = rY;
            // _globeMesh.rotation.z = rZ;
            // _northImgStyle[_transform3dStyle] = 'rotateZ(' + (northAngle) + 'rad)';

            var cameraPoint = (new THREE.Vector3()).setFromMatrixPosition(_camera.matrixWorld);

            var localItem, normalObj, normalMatrix, worldNormal, visibleValue;
            for(var i = 0, len = _locateItems.length; i < len; i++) {
                localItem = _locateItems[i];
                var visibleValue = localItem.visibleValue;
                normalObj = localItem.normalObj;
                normalMatrix = new THREE.Matrix3().getNormalMatrix( normalObj.matrixWorld );
                worldNormal = new THREE.Vector3(0,0,1).applyMatrix3( normalMatrix).normalize();
                localItem.line.position.setFromMatrixPosition( normalObj.matrixWorld );
                localItem.line.lookAt(_camera.position);
                if(!_isShitty) {
                    localItem.cloneLine.position.setFromMatrixPosition( normalObj.matrixWorld );
                    localItem.cloneLine.lookAt(_camera.position);
                }

                var worldDotValue = worldNormal.dot(cameraDirection);
                var isVisible = worldDotValue > 0 && visibleValue > 0;

                if(isVisible) {
                    var opacity = (worldDotValue > 0.2 ? 1 : worldDotValue * 5);
                    localItem.line.traverse( function( node ) {
                        if( node.material ) {
                            node.material.opacity = node == localItem.line ? Math.pow(opacity, 3) : opacity;
                        }
                    });
                    // localItem.line.scale.x = localItem.line.scale.y = localItem.line.scale.z = visibleValue;
                    if(!_isShitty) {
                        localItem.cloneLine.traverse( function( node ) {
                            if( node.material ) {
                                node.material.opacity = (node == localItem.line ? Math.pow(opacity, 3) : opacity);
                            }
                        });
                        // localItem.cloneLine.scale.x = localItem.cloneLine.scale.y = localItem.cloneLine.scale.z = visibleValue;
                    }
                    localItem.distance = cameraPoint.distanceTo( (new THREE.Vector3()).setFromMatrixPosition(localItem.line.matrixWorld));

                } else {
                    localItem.distance = 99999;
                }
                localItem.line.visible = isVisible;
                if(!_isShitty) {
                    localItem.cloneLine.visible = isVisible;
                }
            }

            _locateItems.sort(function(a, b) {
                return a.distance - b.distance;
            });


            var fadeIn = _isShitty ? 1 : _tweenObj.fadeIn;


            _renderer.clearTarget( null, false, true );
            _postprocessing.uniforms.time.value = _time;
            _postprocessing.uniforms.zoom.value = _zoom;
            _postprocessing.uniforms.fadeIn.value = fadeIn;
            _postprocessing.uniforms.y.value = _globeMesh.position.y / _winHeight;
            _postprocessing.uniforms.res.value.x = _winWidth;
            _postprocessing.uniforms.res.value.y = _winHeight;
            _postprocessing.uniforms.globeRadius.value = _winHeight / GLOBE_RADIUS;// / 0.5;
            _postprocessing.uniforms.r.value.x = _yaw;
            _postprocessing.uniforms.r.value.y = _pitch;
            var imgRatio = _winWidth / _images.tBg.width > _winHeight / _images.tBg.height ? _winWidth / _images.tBg.width : _winHeight / _images.tBg.height;
            var imgWidth = _images.tBg.width * imgRatio;
            var imgHeight = _images.tBg.height * imgRatio;
            _postprocessing.uniforms.bgScale.value.x = _winWidth / imgWidth * (2 - fadeIn);
            _postprocessing.uniforms.bgScale.value.y = _winHeight / imgHeight * (2 - fadeIn);
            _composer.render(0.1);

            // _renderer.render( _scene, _camera );

            var mouseVector = new THREE.Vector3(_mx, _my, 1);
            _projector.unprojectVector( mouseVector, _camera );
            _raycaster.set( _camera.position, mouseVector.sub( _camera.position ).normalize() );

            var target;
            // _locateItems
            for(var i = 0, len = _locateItems.length; i < len; i++) {
                localItem = _locateItems[i];
                if(localItem.line.visible) {
                    target = _raycaster.intersectObject(localItem.line)[0];
                    if(target) {
                        target = target.object.localItem;
                        break;
                    }
                    
                    // else {
                    //     target = _raycaster.intersectObject(localItem.text)[0];
                    //     if(target) {
                    //         target = target.object.localItem;
                    //         break;
                    //     }
                    // }
                }
            }

            if ( (!target && _hoverTarget) || (_hoverTarget && target && target != _hoverTarget) ) {
                //ROLLOUT
                $('.map-canvas-container').find('.earth_tip').remove();
                _hoverTarget.onOut();
                _domElement.style.cursor = 'auto';
                _hoverTarget = null;
            }

            if (target) {
                if ( _hoverTarget != target ) {
                    //ROLLOVER
                    _hoverTarget = target;
                    _domElement.style.cursor = 'pointer';

                    var projector = new THREE.Projector();  
                    var vector = projector.projectVector(_hoverTarget.line.position, _camera);  
                          
                    var halfWidth = window.innerWidth / 2;  
                    var halfHeight = window.innerHeight / 2;  
                      
                    var result = {  
                      
                        x: Math.round(vector.x * halfWidth + halfWidth + 40 ),  
                        y: Math.round(-vector.y * halfHeight + halfHeight - 18 )  
                      
                    }; 
                    $('.map-canvas-container').append('<div class="earth_tip" style="left:' + result.x + 'px;top:' + result.y + 'px;">' + _hoverTarget.point_name + '</div>');
                    _hoverTarget.onOver();
                }
            }

            _time += 1;
        }
        _wasReady = _isReady;
    }

    function layout() {
        if(_isReady) {

            _winWidth = $(window).width();
            _winHeight = $(window).height();

            _winWidthHalf = _winWidth / 2;
            _winHeightHalf = _winHeight / 2;

            // in case user has multiple monitors
            var idealWidth = screen.width;
            var idealHeight = screen.height;

            _camera.aspect = _winWidth / _winHeight;

            // use a fixed ratio instead of scaling
            _camera.setViewOffset(idealWidth, idealHeight, idealWidth - _winWidth >> 1, idealHeight - _winHeight >> 1, _winWidth, _winHeight);

            _renderer.setSize(_winWidth, _winHeight);
            _composer.setSize(_winWidth, _winHeight);
        }
    }

    function reloadLocations() {
        _locateItems = globe.locateItems;
        // 清除原有点
        var obj, i;
        for(var i = 0, len = _globeMesh.children.length - 2; i < len; i++) {
            obj = _globeMesh.children[ i ];
            _globeMesh.remove( _globeMesh.getObjectByName('pointObj') );
            _scene.remove( _scene.getObjectByName('point') );
            _darkScene.remove( _darkScene.getObjectByName('pointPanel') );
        }

        if(_locateItems.length && _locateItems.length > 0){
            // 将点重新加入图层
            for(var i = 0, len = _locateItems.length; i < len; i++) {
                _globeMesh.add(_locateItems[i].normalObj);
                _scene.add(_locateItems[i].line);
                if(!_isShitty) {
                    _darkScene.add(_locateItems[i].cloneLine);
                }
            }
        }
        show();

    }
    
    globe.preInit = preInit;
    globe.init = init;
    globe.show = show;
    globe.hide = hide;
    globe.goTo = goTo;
    globe.render = render;
    globe.layout = layout;
    globe.reloadLocations = reloadLocations;
    globe.onNorthClick = onNorthClick;
    


    return globe;
});