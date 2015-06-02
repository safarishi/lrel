define(['jquery', 'signals', 'domReady!'], function($, Signal) {
    var inputController = (function() {
        function indexOf(arr, item, fromIndex) {
            fromIndex = fromIndex || 0;
            if (arr == null) {
                return -1;
            }
            var len = arr.length,
                i = fromIndex < 0 ? len + fromIndex : fromIndex;
            while (i < len) {
                // we iterate over sparse items since there is no way to make it
                // work properly on IE 7-8. see #64
                if (arr[i] === item) {
                    return i;
                }
                i++;
            }
            return -1;
        }

        function contains(arr, val) {
            return indexOf(arr, val) !== -1;
        }

        function forEach(arr, callback, thisObj) {
            if (arr == null) {
                return;
            }
            var i = -1,
                len = arr.length;
            while (++i < len) {
                // we iterate over sparse items since there is no way to make it
                // work properly on IE 7-8. see #64
                if (callback.call(thisObj, arr[i], i, arr) === false) {
                    break;
                }
            }
        }
        var undef;
        var _win = window;
        var _doc = document;
        var _documentElement = _doc.documentElement;
        var _isDownSkippedPreventDefault = false;
        var exports = {
            hasTouch: 'ontouchstart' in _win,
            // supportPointerEvents: false,
            onDown: new Signal(),
            onMove: new Signal(),
            onUp: new Signal(),
            onSwipeH: new Signal(),
            onSwipeV: new Signal(),
            isDown: false,
            isScrollH: false,
            isScrollV: false,
            isFirstTouch: undef, // if it is undefined, which means it is not ready yet. If it is true, which means the first event is touch. If it is false, which means the first event is mouse.
            distanceX: 0,
            distanceY: 0,
            deltaX: 0,
            deltaY: 0,
            deltaTime: 0,
            downBubbleHistory: [],
            currentBubbleHistory: [],
            lastUpTime: 0,
            isOnSwipePane: false,
            elems: [],
            disablePreventDefault: false,
            clickTime: 500,
            clickDistance: 40
        };
        var _hasTouch = exports.hasTouch;
        var _hasEventListener = 'addEventListener' in _win;
        var __docElement = _doc.documentElement;
        var _injectPrefix = '__ek';
        var _isDown = false;
        var _downTime = 0;
        var _downX = 0;
        var _downY = 0;
        var _currentTime = 0;
        var _currentX = 0;
        var _currentY = 0;
        var _pointerEventsNoneList = [];
        var elems = exports.elems;
        var TYPE_CONVERSION = _hasTouch ? {
            'over': 'touchstart mouseenter',
            'out': 'touchend mouseleave'
        } : {
            'over': 'mouseenter',
            'out': 'mouseleave'
        };
        var TYPE_LIST = ['over', 'out', 'tap', 'click', 'down', 'move', 'up', 'wheel'];

        function add(elem, type, func) {
            if (elem.jquery) {
                elem.each(function() {
                    add(this, type, func);
                });
                return;
            }
            if (!elem) return;
            elem[_injectPrefix + type] = func;
            if (type == 'over' || type == 'out') {
                $(elem).bind(TYPE_CONVERSION[type], func);
            }
            elem[_injectPrefix + 'hasInput'] = true;
            elems.push(elem);
        }

        function remove(elem, type) {
            if (elem.jquery) {
                elem.each(function() {
                    remove(this, type);
                });
                return;
            }
            if (!elem) return;
            if (type) {
                if (type == 'over' || type == 'out') {
                    if (elem[_injectPrefix + type]) $(elem).unbind(TYPE_CONVERSION[type], elem[_injectPrefix + type]);
                }
                elem[_injectPrefix + type] = undef;
            } else {
                if (elem[_injectPrefix + 'over']) $(elem).unbind(TYPE_CONVERSION['over'], elem[_injectPrefix + 'over']);
                if (elem[_injectPrefix + 'out']) $(elem).unbind(TYPE_CONVERSION['out'], elem[_injectPrefix + 'out']);
                forEach(TYPE_LIST, function(ev) {
                    elem[_injectPrefix + ev] = undef;
                });
                elem[_injectPrefix + 'hasInput'] = false;
            }
            var hasEvent = false;
            for (var i = 0, len = TYPE_LIST.length; i < len; i++) {
                if (elem[_injectPrefix + TYPE_LIST[i]]) {
                    hasEvent = true;
                    break;
                }
            }
            if (!hasEvent) {
                for (i = 0, len = elems.length; i < len; i++) {
                    if (elems[i] == elem) {
                        elems.splice(i, 1);
                        break;
                    }
                }
            }
        }

        function init() {
            _doc.ondragstart = function() {
                return false;
            };

            var inputTarget = $('.map-container')[0];

            if (exports.hasTouch) {
                inputTarget.addEventListener('touchstart', _bindEventDown, false);
                inputTarget.addEventListener('touchmove', _bindEventMove, false);
                _documentElement.addEventListener('touchend', _bindEventUp, false);
                inputTarget.addEventListener('mousedown', _bindEventDown, false);
                inputTarget.addEventListener('mousemove', _bindEventMove, false);
                _documentElement.addEventListener('mouseup', _bindEventUp, false);
                // inputTarget.addEventListener('gesturechange', _preventDefault, false);
            } else if (_hasEventListener) {
                inputTarget.addEventListener('mousedown', _bindEventDown, false);
                inputTarget.addEventListener('mousemove', _bindEventMove, false);
                _documentElement.addEventListener('mouseup', _bindEventUp, false);
                // inputTarget.addEventListener('mousewheel', _boundEventWheel, false);
                inputTarget.addEventListener('DOMMouseScroll', _boundEventWheel, false);
                //inputTarget.addEventListener("contextmenu", _preventDefault, false);
            } else {
                inputTarget.attachEvent('onmousedown', _bindEventDown);
                inputTarget.attachEvent('onmousemove', _bindEventMove);
                _documentElement.attachEvent('onmouseup', _bindEventUp);
                // inputTarget.attachEvent('onmousewheel', _boundEventWheel);
                //inputTarget.attachEvent("contextmenu", _preventDefault, false);
            }
            exports.onDown.add(_onDown, exports, 1024);
            exports.onMove.add(_onMove, exports, 1024);
            exports.onUp.add(_onUp, exports, 1024);
            exports.onUp.add(_afterOnUp, exports, -1024);
        }

        function _boundEventWheel(ev) {
            ev = ev || _win.event;
            var delta = ev.wheelDelta;
            if (delta) {
                delta = delta / 120;
            } else {
                delta = -ev.detail / 3;
            }
            var target;
            var bubbleHistory = exports.currentBubbleHistory;
            var i = bubbleHistory.length;
            while (i--) {
                target = bubbleHistory[i];
                if (target[_injectPrefix + 'wheel']) {
                    ev.currentTarget = target;
                    target[_injectPrefix + 'wheel'].call(target, delta);
                }
            }
        }

        function _preventDefault(ev) {
            if (exports.disablePreventDefault) {
                return;
            }
            if (ev.preventDefault) {
                ev.preventDefault();
            } else {
                ev.returnValue = false;
            }
        }

        function _bindEventDown(ev) {
            return _mixInputEvent.call(this, ev, function(ev) {
                var targetTagName = ev.target.nodeName.toLowerCase();
                if (_doc.activeElement && !contains(['input', 'select', 'label', 'option', 'textarea'], targetTagName) && ev.target.contentEditable !== 'true') {
                    var activeElement = _doc.activeElement;
                    if (!contains(['body'], activeElement.nodeName.toLowerCase())) {
                        _doc.activeElement.blur();
                    }
                }
                exports.onDown.dispatch(ev);
            });
        }

        function _bindEventMove(ev) {
            return _mixInputEvent.call(this, ev, function(ev) {
                exports.onMove.dispatch(ev);
            });
        }

        function _bindEventUp(ev) {
            return _mixInputEvent.call(this, ev, function(ev) {
                exports.onUp.dispatch(ev);
            });
        }

        function _preventDefaultFunc(ev) {
            return function() {
                _preventDefault.call(this, ev);
            };
        }

        function _isSkipPreventDefaultElement(target, isMove) {
            if (target.__skipPreventDefault) return true;
            var nodeName = target.nodeName.toLowerCase();
            if (contains(['source', 'object', 'iframe'], nodeName)) return true;
            if (isMove) return false;
            return target.contentEditable === 'true' || contains(['input', 'select', 'label', 'textarea', 'option'], nodeName);
        }
        // function _detectPointEventsNone(target, x, y) {
        //     var realTarget = target;
        //     while (target) {
        //         if (target.__isPointerEventsNone) {
        //             _pointerEventsNoneList.push(target);
        //             target.style.visibility = 'hidden';
        //             return _detectPointEventsNone(_doc.elementFromPoint(x, y), x, y);
        //         }
        //         target = target.parentNode;
        //     }
        //     return realTarget;
        // }
        // function _cleanUpPointEventsNoneList() {
        //     for (var i = 0, len = _pointerEventsNoneList.length; i < len; i++) {
        //         _pointerEventsNoneList[i].style.display;
        //         _pointerEventsNoneList[i].style.visibility = 'visible'; // TODO: deal with the exceptions
        //     }
        //     _pointerEventsNoneList = [];
        // }
        function _mixInputEvent(ev, func) {
            ev = ev || _win.event;
            var fakedEvent = {
                originalEvent: ev,
                button: ev.button,
                preventDefault: _preventDefaultFunc(ev)
            };
            var i, elem, x, y, touchEvent, bubbleHistory, target;
            var type = ev.type;
            var time = fakedEvent.currentTime = (new Date()).getTime();
            var isDown = type.indexOf('start') > -1 || type.indexOf('down') > -1;
            var isUp = type.indexOf('end') > -1 || type.indexOf('up') > -1;
            var isMove = type.indexOf('move') > -1;
            var isTouch = fakedEvent.isTouch = type.indexOf('touch') > -1;
            var isSkipPreventDefault = false;
            if (exports.isFirstTouch === undef) exports.isFirstTouch = isTouch;
            if (isTouch) {
                touchEvent = ev.touches.length ? ev.touches[0] : ev.changedTouches[0];
                fakedEvent.x = x = touchEvent.pageX;
                fakedEvent.y = y = touchEvent.pageY;
                fakedEvent.target = target = touchEvent.target;
                // if (!exports.supportPointerEvents) {
                //  fakedEvent.target = target = _detectPointEventsNone(target, x, y);
                //  _cleanUpPointEventsNoneList();
                // }
                bubbleHistory = exports.currentBubbleHistory = fakedEvent.bubbleHistory = [];
                while (target) {
                    bubbleHistory.unshift(target);
                    if (!isSkipPreventDefault && _isSkipPreventDefaultElement(target, isMove)) {
                        isSkipPreventDefault = fakedEvent.isSkipPreventDefault = true;
                    }
                    target = target.parentNode;
                }
            } else {
                fakedEvent.x = x = _hasEventListener ? ev.pageX : ev.clientX + __docElement.scrollLeft;
                fakedEvent.y = y = _hasEventListener ? ev.pageY : ev.clientY + __docElement.scrollTop;
                fakedEvent.target = target = ev.target ? ev.target : ev.srcElement;
                // if (!exports.supportPointerEvents) {
                //  fakedEvent.target = target = _detectPointEventsNone(target, x, y);
                //  _cleanUpPointEventsNoneList();
                // }
                bubbleHistory = exports.currentBubbleHistory = fakedEvent.bubbleHistory = [];
                while (target) {
                    bubbleHistory.unshift(target);
                    if (!isSkipPreventDefault && _isSkipPreventDefaultElement(target, isMove)) {
                        isSkipPreventDefault = fakedEvent.isSkipPreventDefault = true;
                    }
                    target = target.parentNode;
                }
            }
            if (isDown) {
                _isDown = true;
                _downTime = _currentTime = time;
                _downX = _currentX = x;
                _downY = _currentY = y;
                exports.downBubbleHistory = bubbleHistory;
                i = bubbleHistory.length;
                while (i--) {
                    elem = bubbleHistory[i];
                    if (isTouch && elem[_injectPrefix + 'over']) {
                        fakedEvent.currentTarget = elem;
                        elem[_injectPrefix + 'over'].call(elem, fakedEvent);
                    }
                    if (elem[_injectPrefix + 'down']) {
                        fakedEvent.currentTarget = elem;
                        elem[_injectPrefix + 'down'].call(elem, fakedEvent);
                    }
                }
                _isDownSkippedPreventDefault = isSkipPreventDefault;
            }
            // TODO: add the skip preventDefault logic
            if (!_isDownSkippedPreventDefault) { //  || isMove) {
                // fakedEvent.preventDefault();
            }
            if (_isDown) {
                fakedEvent.distanceTime = time - _downTime;
                fakedEvent.distanceX = x - _downX;
                fakedEvent.distanceY = y - _downY;
                fakedEvent.distance = Math.sqrt((x - _downX) * (x - _downX) + (y - _downY) * (y - _downY));
            }
            fakedEvent.deltaTime = time - _currentTime;
            fakedEvent.deltaX = x - _currentX;
            fakedEvent.deltaY = y - _currentY;
            _currentTime = time;
            _currentX = x;
            _currentY = y;
            if (type.indexOf('end') > -1 || type.indexOf('up') > -1) {
                _isDown = false;
            }
            func(fakedEvent);
        }

        function _onDown(ev) {
            exports.isDown = true;
            var i = ev.bubbleHistory.length;
            var target;
            while (i--) {
                target = ev.bubbleHistory[i];
                if (target[_injectPrefix + 'tap']) {
                    ev.currentTarget = target;
                    target[_injectPrefix + 'tap'].call(target, ev);
                }
            }
        }

        function _onMove(ev) {
            exports.currentBubbleHistory = ev.bubbleHistory;
            exports.deltaX = ev.deltaX;
            exports.deltaY = ev.deltaY;
            exports.deltaTime = ev.deltaTime;
            var hasDistance = ev.distanceX !== undef;
            if (!hasDistance) {
                ev.distanceX = exports.distanceX;
                ev.distanceY = exports.distanceY;
            }
            exports.distanceX = ev.distanceX;
            exports.distanceY = ev.distanceY;
            exports.distanceTime = ev.distanceTime;
            if (!exports.isScrollH && !exports.isScrollV && exports.isDown) {
                if (ev.distance > 0) {
                    if (Math.abs(ev.distanceX) > Math.abs(ev.distanceY)) {
                        exports.isScrollH = true;
                        exports.onSwipeH.dispatch(ev);
                    } else {
                        exports.isScrollV = true;
                        exports.onSwipeV.dispatch(ev);
                    }
                }
            }
            var i = ev.bubbleHistory.length;
            var target;
            while (i--) {
                target = ev.bubbleHistory[i];
                if (target[_injectPrefix + 'move']) {
                    ev.currentTarget = target;
                    target[_injectPrefix + 'move'].call(target, ev);
                }
            }
            if (!hasDistance) {
                exports.distanceX = ev.distanceX;
                exports.distanceY = ev.distanceY;
            }
        }

        function _onUp(ev) {
            exports.isDown = false;
            exports.distanceTime = ev.distanceTime;
            var i = ev.bubbleHistory.length;
            var downBubbleHistory = exports.downBubbleHistory;
            var target, j;
            var isClick = ev.isClick = ev.distanceTime !== null && ev.distanceTime < exports.clickTime && ev.distance < exports.clickDistance;
            ev.isDoubleClick = ev.currentTime - exports.lastUpTime < 400;
            // if(!ev.isSkipPreventDefault) {
            //     ev.preventDefault();
            // }
            while (i--) {
                target = ev.bubbleHistory[i];
                if (ev.isTouch && target[_injectPrefix + 'out']) {
                    ev.currentTarget = target;
                    target[_injectPrefix + 'out'].call(target, ev);
                }
                if (target[_injectPrefix + 'up']) {
                    ev.currentTarget = target;
                    target[_injectPrefix + 'up'].call(target, ev);
                }
                if (isClick && target[_injectPrefix + 'click']) {
                    j = downBubbleHistory.length;
                    while (j--) {
                        if (downBubbleHistory[j] === target) {
                            ev.currentTarget = target;
                            target[_injectPrefix + 'click'].call(target, ev);
                            break;
                        }
                    }
                }
            }
        }

        function _afterOnUp(ev) {
            exports.isScrollH = false;
            exports.isScrollV = false;
            exports.lastUpTime = ev.currentTime;
        }
        exports.init = init;
        exports.add = add;
        exports.remove = remove;
        return exports;
    }());

    return inputController;
})