define(['jquery', 'three', 'signals', 'domReady!'], function($, THREE, Signal) {

    var PI = Math.PI;
    var PI_HALF = PI / 2;
    var PI_2 = PI * 2;

    var tmp = document.createElement('canvas').getContext('2d');
    tmp.globalCompositeOperation = 'screen';
    var _isSupportBlendMode =  tmp.globalCompositeOperation == 'screen';

    function Coordinate(dom, isShitty, isPlan) {

        var self = this;
        this.isShitty = isShitty;
        this.target = dom;
        this.isNew = this.target.isNew;
        this.color = this.target.color;
        this.point_id = this.target.location_id;
        this.point_name = isPlan == 3 ? '微大学' : this.target.point_name;
        this.isPlan = isPlan || 0;
        
        this.normalObj = new THREE.Object3D();
        this.normalObj.name = 'pointObj';
        var q = new THREE.Quaternion();

        q.setFromAxisAngle((new THREE.Vector3(1,0,0)).normalize(), - parseFloat(this.target.lat) / 180 * PI);
        this.normalObj.quaternion.multiplyQuaternions( q, this.normalObj.quaternion );
        q = new THREE.Quaternion();
        q.setFromAxisAngle((new THREE.Vector3(0,1,0)).normalize(), (90 + parseFloat(this.target.lng) + 158) / 180 * PI);
        this.normalObj.quaternion.multiplyQuaternions( q, this.normalObj.quaternion );
        this.normalObj.translateZ(GLOBE_RADIUS + 14);
        if(isPlan > 0){
            this._buildI(isPlan);
        }else{
            this._buildI();
        }
        
        // this._buildT();

        this.visibleValue = 0;
        this.hoverValue = 0;
        this.additionalScale = this.target.isNew ? 1.2 : 1;

        this._boundUpdate = function(){
            self._update();
        };
    }

    var _p = Coordinate.prototype;

    function _buildI(isPlan) {
        var canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#b31d0a';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        if(isPlan == 1){
            var text = this.target.work_nums;
        }else if(isPlan == 3){
            // TODO 微大学数据结构重做
            var text = 1;
        }else{
            var text = this.target.nums;
        }
        var size = 50;
        var halfSize = size / 2;
        canvas.width = size;
        canvas.height = size + halfSize;

        ctx.fillStyle = '#139cb9';
        ctx.beginPath();
        ctx.arc(halfSize, halfSize, halfSize, 0, 2 * PI);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.fillStyle = "#139cb9";
        ctx.moveTo(0, halfSize + 8);
        ctx.lineTo(size, halfSize + 8);
        ctx.lineTo(halfSize, size + halfSize - 8);
        ctx.fill();
        ctx.closePath();

        if(isPlan == 1){
            ctx.fillStyle = '#139cb9';
        }else{
            ctx.fillStyle = '#fff';
        }
        ctx.beginPath();
        ctx.arc(halfSize, halfSize, halfSize - 5, 0, 2 * PI);
        ctx.fill();
        ctx.closePath();

        if(isPlan == 1){
            ctx.fillStyle = '#fff';
        }else{
            ctx.fillStyle = '#139cb9';
        }
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, halfSize, halfSize + 8);

        var geometry = new THREE.PlaneGeometry(size, size + halfSize);

        this.newIconTexture = new THREE.Texture(canvas);
        this.newIconMaterial = new THREE.MeshBasicMaterial( { map: this.newIconTexture, transparent: true });
        this.newIcon = new THREE.Mesh(geometry, this.newIconMaterial);
        this.newIcon.name = 'point';
        this.newIcon.position.x = 35;
        this.newIcon.position.y = 100 + 22;
        this.newIcon.position.z = 5 + size;
        this.newIcon.scale.x = this.newIcon.scale.y = 0.5;
        this.newIcon.localItem = this;
        this.newIconTexture.needsUpdate = true;
        this.line = this.newIcon;

        if(!this.isShitty) {
            this.cloneNewIconTexture = new THREE.Texture(canvas);
            this.cloneNewIcon = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial( { map: this.cloneNewIconTexture, transparent: true }));
            this.cloneNewIcon.name = 'pointPanel';
            this.cloneNewIcon.position.x = 35;
            this.cloneNewIcon.position.y = 100 + 22;
            this.cloneNewIcon.position.z = 5 + size;
            this.cloneNewIcon.scale.x = this.cloneNewIcon.scale.y = 0.5;
            this.cloneNewIconTexture.needsUpdate = true;
            this.cloneLine = this.cloneNewIcon;
        }

    }

    // function _buildT() {
    //     var canvas = document.createElement('canvas');
    //     canvas.width = 128;
    //     canvas.height = 128;
    //     var ctx = canvas.getContext('2d');
    //     ctx.fillStyle = '#b31d0a';
    //     ctx.font = '36px Arial';
    //     ctx.textAlign = 'center';
    //     var text = this.target.name;
    //     var size = ctx.measureText(text).width + 30;
    //     var halfSize = size / 2;
    //     canvas.width = size;
    //     canvas.height = 40;

    //     ctx.fillStyle="#fff";  //填充的颜色
    //     // ctx.strokeStyle="000";  //边框颜色
    //     ctx.fillRect(0,0,canvas.width,canvas.height);  //填充颜色 x y坐标 宽 高
    //     // ctx.strokeRect(0,0,canvas.width,canvas.height);  //填充边框 x y坐标 宽 高
        
    //     ctx.fillStyle = '#b31d0a';
    //     ctx.font = '28px Arial';
    //     ctx.textAlign = 'center';
    //     ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    //     var geometry = new THREE.PlaneGeometry(canvas.width, canvas.height);

    //     this.newTextTexture = new THREE.Texture(canvas);
    //     this.newTextMaterial = new THREE.MeshBasicMaterial( { map: this.newTextTexture, transparent: true });
    //     this.newText = new THREE.Mesh(geometry, this.newTextMaterial);
    //     this.newText.position.x = 95;
    //     this.newText.position.y = 0;
    //     this.newText.position.z = 20 + size;
    //     this.newText.scale.x = this.newText.scale.y = 0.5;
    //     this.newText.localItem = this;
    //     this.newTextTexture.needsUpdate = true;
    //     this.line.add(this.newText);
       
    // }

    // function _buildLine() {
    //     this.lineMaterial = new THREE.MeshBasicMaterial({
    //         color: 0xffffff, transparent: true, opacity: 1
    //     });
    //     // var geometry = new THREE.Geometry();
    //     // geometry.vertices.push(
    //     //     new THREE.Vector3( -0.5,  68, 0),
    //     //     new THREE.Vector3( 0.5, 68, 0 ),
    //     //     new THREE.Vector3(  -0.5, 0, 0 ),
    //     //     new THREE.Vector3(  0.5, 0, 0 )
    //     // );
    //     // geometry.faces.push( new THREE.Face3( 0, 2, 1 ), new THREE.Face3( 1, 2, 3 ) );
    //     // geometry.computeBoundingSphere();

    //     var radius = 24;
    //     var segments = 32;

    //     var circleGeometry = new THREE.CircleGeometry( radius, segments );      
    //     this.line = new THREE.Mesh(circleGeometry, this.lineMaterial);

    //     if(!this.isShitty) {
    //         // this.cloneLine = new THREE.Mesh(circleGeometry, this.lineMaterial);
    //     }
    // }

    // function _buildPlane() {
    //     var self = this;
    //     var canvas = this.planeCanvas = document.createElement('canvas');
    //     canvas.width = canvas.height = 128;
    //     this.planeCtx = canvas.getContext('2d');
    //     //
    //     var geometry = new THREE.PlaneGeometry(128, 128);
    //     var img = this.planeImg = new Image();
    //     this.planeTexture = new THREE.Texture(canvas);
    //     this.planeMaterial = new THREE.MeshBasicMaterial({ map: this.planeTexture, transparent: true, depthWrite: false });
    //     this.plane = new THREE.Mesh(geometry, this.planeMaterial);
    //     this.plane.position.y = 100;
    //     this.plane.position.z = 0;
    //     this.plane.scale.x = this.plane.scale.y = 0.5;
    //     this.plane.localItem = this;
    //     this.plane.interactive = this;
    //     this.line.add(this.plane);


    //     // if(!this.isShitty) {
    //     //     this.clonePlaneTexture = new THREE.Texture(canvas);
    //     //     this.clonePlane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: this.clonePlaneTexture, transparent: true, depthWrite: false }));
    //     //     this.clonePlane.position.y = 100;
    //     //     this.clonePlane.position.z = 0;
    //     //     this.clonePlane.scale.x = this.clonePlane.scale.y = 0.5;
    //     //     this.cloneLine.add(this.clonePlane);
    //     // }

    //     // img.src = 'uploads/gallery/thumbnail/73f9d64728616efaaf1d8c8cb0ca3d0e_large.jpeg';
    //     img.src = 'images/' + this.data.directoryimage + this.data.image;
    //     if(img.width) {
    //         self._onPlaneImgLoaded(img);
    //     } else {
    //         self._updatePlaneTexture();
    //         img.onload = function(){
    //             self._onPlaneImgLoaded(img);
    //         };
    //     }
    // }

    // function _buildText() {
    //     var canvas = document.createElement('canvas');
    //     canvas.width = 256;
    //     canvas.height = 56;
    //     var ctx = canvas.getContext('2d');
    //     ctx.fillStyle = '#fff';
    //     // ctx.font = '28px arial';
    //     ctx.font = '22px questrialregular';
    //     ctx.textAlign = 'center';
    //     var text = this.target.find('.home-item-name').text();
    //     var words = text.split(' ');
    //     var lines = [];
    //     var line = '';
    //     var x = 128;
    //     var y = 24;
    //     for(var i = 0; i < words.length; i++) {
    //         var testLine = line + words[i] + ' ';
    //         var testWidth = ctx.measureText(testLine).width;
    //         if (testWidth > 256 && i > 0) {
    //             lines.push(line);
    //             line = words[i] + ' ';
    //             y += 24;
    //         }else {
    //             line = testLine;
    //         }
    //     }
    //     lines.push(line);
    //     canvas.height = 30 * lines.length + 8;
    //     ctx.fillStyle = '#b31d0a';
    //     // ctx.font = '28px arial';
    //     ctx.font = '36px arial';
    //     ctx.textAlign = 'center';
    //     for(var i = 0, len = lines.length; i < len; i++) {
    //         ctx.fillText(lines[i], x, (i + 1) * 30);
    //         if(this.isShitty) {
    //             ctx.fillText(lines[i], x + 0.75, (i + 1) * 30);
    //             ctx.fillText(lines[i], x - 0.75, (i + 1) * 30);
    //         }
    //     }

    //     var geometry = new THREE.PlaneGeometry(256, canvas.height);

    //     this.textTexture = new THREE.Texture(canvas);
    //     this.textMaterial = new THREE.MeshBasicMaterial( { map: this.textTexture, transparent: false });
    //     this.text = new THREE.Mesh(geometry, this.textMaterial);
    //     this.text.position.y = this.textY = canvas.height * 0.1 + 20;
    //     this.text.scale.x = this.text.scale.y = 0.5;
    //     this.text.localItem = this;
    //     this.textTexture.needsUpdate = true;
    //     this.line.add(this.text);

    //     if(!this.isShitty) {
    //         this.cloneText = new THREE.Mesh(geometry, this.textMaterial);
    //         this.cloneText.position.y = this.textY;
    //         this.cloneText.scale.x = this.cloneText.scale.y = 0.5;
    //         // this.cloneLine.add(this.cloneText);
    //     }

    // }

    // function _buildNewIcon() {
    //     var canvas = document.createElement('canvas');
    //     canvas.width = 128;
    //     canvas.height = 128;
    //     var ctx = canvas.getContext('2d');
    //     ctx.fillStyle = '#b31d0a';
    //     ctx.font = '72px Arial';
    //     ctx.textAlign = 'center';
    //     var text = '35';
    //     var size = ctx.measureText(text).width + 50;
    //     var halfSize = size / 2;
    //     canvas.width = canvas.height = size;

    //     ctx.fillStyle = '#fff';
    //     ctx.beginPath();
    //     ctx.arc(halfSize, halfSize, halfSize, 0, 2 * PI);
    //     ctx.fill();
    //     ctx.closePath();

    //     ctx.fillStyle = '#b31d0a';
    //     ctx.font = '72px Arial';
    //     ctx.textAlign = 'center';
    //     ctx.fillText(text, halfSize, halfSize + 24);

    //     var geometry = new THREE.PlaneGeometry(size, size);

    //     this.newIconTexture = new THREE.Texture(canvas);
    //     this.newIconMaterial = new THREE.MeshBasicMaterial( { map: this.newIconTexture, transparent: true });
    //     this.newIcon = new THREE.Mesh(geometry, this.newIconMaterial);
    //     this.newIcon.position.x = 35;
    //     this.newIcon.position.y = 100 + 22;
    //     this.newIcon.position.z = 20 + size;
    //     this.newIcon.scale.x = this.newIcon.scale.y = 0.3;
    //     this.newIcon.localItem = this;
    //     this.newIconTexture.needsUpdate = true;
    //     this.line.add(this.newIcon);

    //     if(!this.isShitty) {
    //         this.cloneNewIconTexture = new THREE.Texture(canvas);
    //         this.cloneNewIcon = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial( { map: this.cloneNewIconTexture, transparent: true }));
    //         this.cloneNewIcon.position.x = 35;
    //         this.cloneNewIcon.position.y = 100 + 22;
    //         this.cloneNewIcon.position.z = 20 + size;
    //         this.cloneNewIcon.scale.x = this.cloneNewIcon.scale.y = 0.3;
    //         this.cloneNewIconTexture.needsUpdate = true;
    //         this.line.add(this.cloneNewIcon);
    //     }

    // }

    function _updatePlaneTexture() {
        var _ctx = this.planeCtx;
        var hoverValue = this.hoverValue;
        _ctx.clearRect(0, 0, 128, 128);


        if(hoverValue > 0) {
            _ctx.save();
            _ctx.translate(64, 64);
            _ctx.rotate(0.4 + (hoverValue < 0.5 ? 0 : PI));
            _ctx.translate(-64, -64);
            _ctx.beginPath();

            var level = hoverValue < 0.5 ? hoverValue * 2 : 1 - (hoverValue - 0.5) * 2;
            _ctx.arc(64, 64, 62, -level * PI, PI * level);
            _ctx.fillStyle = '#fff';
            _ctx.fill();
            _ctx.closePath();
            _ctx.restore();
        }

        _ctx.beginPath();
        _ctx.arc(64, 64, 62, 0, 2 * PI);
        _ctx.strokeStyle = this.color;
        _ctx.lineWidth = 4;
        _ctx.stroke();
        _ctx.closePath();
        this.planeTexture.needsUpdate = true;
        if(!this.isShitty) {
            this.clonePlaneTexture.needsUpdate = true;
        }
    }

    function _onPlaneImgLoaded(img) {
        this._updatePlaneTexture();
    }

    function show(duration, delay) {
        TweenLite.killTweensOf(this);
        TweenLite.to(this, duration || 0, {visibleValue: 1, delay: delay || 0, ease: 'easeOutBack'});
    }

    function hide(duration, delay) {
        TweenLite.killTweensOf(this);
        TweenLite.to(this, duration || 0, {visibleValue: 0, delay: delay || 0, ease: 'easeInBack'});
    }

    function _update() {
        this.newIcon.scale.x = this.newIcon.scale.y = 0.5 + 0.1 * this.hoverValue;
        this.newIcon.rotation.z = -0.1 * this.hoverValue;

        if(!this.isShitty) {
            this.cloneNewIcon.scale.x = this.cloneNewIcon.scale.y = 0.5 + 0.1 * this.hoverValue;
            this.cloneNewIcon.rotation.z = -0.1 * this.hoverValue;
        }
    }
   
    function onOver() {
        if(!this.isShitty) {
            TweenLite.to(this, 0.3, {hoverValue: 1, ease: 'easeInOutSine', onUpdate: this._boundUpdate});
        }
        // 在这里插入hover事件
    }

    function onOut() {
        if(!this.isShitty) {
            TweenLite.to(this, 0.3, {hoverValue: 0, ease: 'easeInOutSine', onUpdate: this._boundUpdate});
        }
    }

    _p.show = show;
    _p.hide = hide;
    _p._onPlaneImgLoaded = _onPlaneImgLoaded;
    _p._buildI = _buildI;
     // _p._buildT = _buildT;
    // _p._buildPlane = _buildPlane;
    // _p._buildText = _buildText;
    // _p._buildNewIcon = _buildNewIcon;
    // _p._updatePlaneTexture = _updatePlaneTexture;
    _p._update = _update;

    _p.onOver = onOver;
    _p.onOut = onOut;

    return Coordinate;
});