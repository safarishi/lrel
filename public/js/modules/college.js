define([
    'avalon',
    'text!template/college.html',
    'text!template/college.tab.html',
    'text!template/college-thread.html',
    'css!rootui/chameleon/oniui-common.css',
    'css!rootui/tab/avalon.tab.css',
    'css!rootui/scrollbar/avalon.scrollbar.css',
    "css!rootui/pager/avalon.pager.css",
    'modules/communication-category',
    'modules/qxq',
    'oniui/tab/avalon.tab',
    'oniui/pager/avalon.pager',
    'modules/IM',
    'domReady!'
], function(avalon, collegeHtml, collegeTabHtml, collegeThreadHtml) {
    var tabs = []
    var tabpanels = []

    var collegeVM = avalon.define({
        $id: 'college',
        toggleCollege: false,
        toggleGroup: true, // 微大学分组
        toggleThread: false, // 帖子内容和评论
        toggleThreadContent: false,
        toggleThreadComment: false,
        toggleApply: false, // 申请
        cateId: 0, // 一级
        cateName: '',
        cateDesc: '',
        groupActive: 0, // 二级
        threadActive: 0,
        threadCommentCount: 0,
        threads: [],
        applyList: [],
        applyDateList: [],
        applyTmp: [],
        $scrollers: [],
        isGroupAdmin: false,
        groupThreadNum: 0, // 帖子数量
        groupApplyNum: 0, // 新申请数量
        groupMemberNum: 0, // 群组总人数
        groupOnlineNum: 0, // 在线人数
        setCollegeTpl: function() {
            if ($('#college').length == 0) {
                $('.search').after(collegeHtml)
                avalon.scan()
            }
        },
        handleCollege: function(toggle) {
            var isLogin = avalon.vmodels.user.checkSignIn()
            collegeVM.toggleCollege = isLogin && (toggle === false ? toggle : toggle || isLogin)
        },
        $resizeCallback: function() {
            // ！TODO switch
            var padding = {
                top: 40,
                right: 40,
                bottom: 90,
                left: 40
            }

            var $document = $(document)
            var $window = $(window)
            var $dialog = $('.college')

            var boxWidth = Math.max($document.width(), $window.width()) - padding.left - padding.right
            var boxHeight = Math.max($document.height(), $window.height()) - padding.top - padding.bottom

            $dialog.width(boxWidth)
            $dialog.height(boxHeight)
            $dialog.css({
                bottom: padding.bottom + 'px',
                left: padding.left + 'px'
            })
            collegeVM.$resizeCollegeTab()
            collegeVM.$resizeCollegeScroller()
        },
        $resizeCollegeTab: function() {
            if (!avalon.vmodels.collegeTab) return;
            var tab = $('.college-tab')
            var box = $('.college-box')
            var width = box.innerWidth() - 465
            var info = avalon.vmodels.commcate.getCategoryInfo(collegeVM.cateId)
            tab.width(width)
            avalon.vmodels.collegeTab.computeSlider()
        },
        $resizeCollegeScroller: function() {
            if (!avalon.vmodels[collegeVM.$scrollers[active]]) return;
            var tab = $('.college-tab')
            var active = avalon.vmodels.collegeTab.active
            var collegeBox = $('.college-box')
            var panel = tab.find('.oni-tab-panel').eq(active).find('.oni-scrollbar-scroller')
            panel.width(collegeBox.width() - 60).height(collegeBox.height() - 90)
            avalon.vmodels[collegeVM.$scrollers[active]].update()
        },
        $collegeTabOpt: {
            distroyDom: false,
            active: 0,
            event: 'click',
            getTemplate: function(template, vm, tplName) {
                if (tplName !== 'panel') {
                    return collegeTabHtml
                }
            },
            tabs: tabs,
            tabpanels: tabpanels,
            onInit: function() {
                // if (avalon.vmodels.root.isUserSignIn) {
                //     collegeVM.initGroups()
                // }
            },
            onActivate: function(ev, vm) {
            },
            onClickActive: function() {
            }
        },
        $collegePagerOpt: {
            totalItems: 0,
            onJump: function(e, pager) {
                collegeVM.getGroupThreads(collegeVM.groupActive, pager.currentPage)
            }
        },
        initGroups: function() {
            var tabVM = avalon.vmodels.collegeTab;
            var active = avalon.vmodels.collegeTab.active = 0;
            $.ajax({
                url: APP.api('/groups'),
                type: 'GET',
                dataType: 'json',
                data: {
                    ic_group_id: collegeVM.cateId,
                    access_token: avalon.cookie.get('access_token')
                }
            })
            .done(function(data) {
                var tabs = []
                var _data = data
                data = data.data || []
                if (!Array.isArray(data)) {
                    return
                }
                data.forEach(function(element, index){
                    tabs.push({
                        id: element.id,
                        gid: element.gid,
                        title: element.group_name
                    })
                    avalon.vmodels.collegeTab.tabpanels.push({
                        contentType: 'content',
                        content: ''
                    })
                });
                tabVM.tabs = tabs

                collegeVM.groupActive = tabVM.tabs[active].gid
                collegeVM.$resizeCollegeTab()

                collegeVM.groupThreadNum = _data.numbers
                collegeVM.groupApplyNum = _data.apply_quantity
                collegeVM.groupMemberNum = _data.members
                // collegeVM.groupOnlineNum
            }).fail(function(data) {
                if (data && data.error_code == 14007) {
                    // 申请加入
                }
                return false
            })

            avalon.vmodels.collegeTab.$watch('active', function(active) {
                collegeVM.groupActive = tabVM.tabs[active].gid
            })
        },
        getGroupThreads: function(gid, page) {
            var tabVM = avalon.vmodels.collegeTab;
            var active = avalon.vmodels.collegeTab.active
            var threads = collegeVM.threads.clear()
            $.ajax({
                url: APP.api('/notes'),
                type: 'GET',
                dataType: 'json',
                data: {
                    gid: gid || collegeVM.groupActive,
                    page: page || 1,
                    access_token: avalon.cookie.get('access_token')
                }
            })
            .done(function(data) {
                if (data && Array.isArray(data.data)) {
                    var threadList = []
                    var list = data.data || []
                    threads.pushArray(list)
                    tabVM.tabpanels[active].content = collegeThreadHtml

                    // set pager
                    var pager = avalon.vmodels.collegeThreadPager
                    pager.perPages = data.per_page
                    pager.currentPage = data.current_page
                    pager.totalItems = data.total
                }
            })
        },
        $threadScrollOpt: {
            onInit: function(vmodel, options, vmodels) {
                var scrollerId = vmodel.$id
                var idx = $(vmodel.viewElement).parents('.oni-tab-panel').index()
                collegeVM.$scrollers[idx] = scrollerId
            },
            paddingVertical: 40
        },
        clickThreadItem: function() {
            var id = $(this).data('id')
            collegeVM.threadActive = id
            collegeVM.toggleGroup = false
            collegeVM.toggleThread = true
            collegeVM.toggleThreadContent = true
            collegeThreadContentVM.isTop = collegeVM.threadSticky(id)
        },
        handleThread: function(toggle) {
            collegeVM.toggleThread = toggle && !!toggle || !collegeVM.toggleThread
        },
        handleThreadContent: function(toggle) {
            collegeVM.toggleThreadContent = toggle && !!toggle || !collegeVM.toggleThreadContent
        },
        postThreadComment: function(e) {
            e.preventDefault()
            $.ajax({
                url: APP.api('/follow'),
                type: 'POST',
                dataType: 'json',
                data: {
                    pid: collegeVM.threadActive,
                    content: $('#thread-comment-input').val(),
                    access_token: avalon.cookie.get('access_token')
                }
            })
            .done(function(data) {
                if (data && data.id) {
                    avalon.vmodels.collegeThreadComment.commentData.push(data)
                    collegeVM.threadCommentCount++
                    collegeVM.$fire('all!creditOperation', 'comment')
                }
            })
            .always(function() {
                $('#thread-comment-input').val('')
            });
            return false
        },
        handleApply: function(toggle) {
            collegeVM.toggleApply = toggle
        },
        getApplies: function(dir) {
            var applyList = collegeVM.applyList.length > 0
                            ? collegeVM.applyList.slice() : []
            var applyDateList = collegeVM.applyDateList.length > 0
                                ? collegeVM.applyDateList.slice() : []

            var $apply = $('.college-apply-bd')

            if ($apply.data('pending')) {
                return false
            }

            // TODO
            if (dir === false) {
                return false
            }

            var page = $apply.data('page') || 0
            var lastPage = $apply.data('last_page')

            page = !dir && dir != void 0 ? --page : ++page

            if ((lastPage && page > lastPage) || page < 1) {
                return false
            }

            $apply.data('pending', true)

            $.getJSON(APP.api('/applies'), {
                page: page,
                ic_group_id: collegeVM.cateId,
                access_token: avalon.cookie.get('access_token')
            }, function(data) {
                var date
                var list = data.data || []
                list.forEach(function(item, index) {
                    date = new Date(item.created_at)
                    date = date.getFullYear() + '年' + (+date.getMonth() + 1) + '月' + date.getDate() + '日'
                    if (applyDateList.indexOf(date) === -1) {
                        applyDateList.push(date)
                    }
                    var idx = applyDateList.indexOf(date)
                    var alist = applyList[idx]
                    applyList[idx] = alist || []
                    applyList[idx].push(item)
                })
                collegeVM.applyList.clear()
                collegeVM.applyDateList.clear()
                collegeVM.applyList.pushArray(applyList)
                collegeVM.applyDateList.pushArray(applyDateList)
                $apply.data('page', data.current_page)
                $apply.data('last_page', data.last_page)
            }).always(function() {
                $apply.data('pending', false)
            })
        },
        // 处理申请
        requestApply: function(value) {
            var $parent = $(this).parents('.college-apply-op')
            var applyId = $parent.data('apply-id')
            var applyIdx = $parent.data('apply-idx')
            var outerIdx = $parent.data('outer-idx')
            var flag = value === 1 ? value : -1

            $.ajax({
                url: APP.api('/applies/' + applyId + '/verify'),
                type: 'put',
                dataType: 'json',
                data: {
                    flag: flag,
                    access_token: avalon.cookie.get('access_token')
                }
            })
            .done(function(data) {
                if (data && data.id) {
                    collegeVM.applyList[outerIdx][applyIdx].status_flag = data.status_flag
                    // 新申请 -1
                    collegeVM.groupApplyNum--
                }
                if (data && data.status_flag === 1) {
                    // 群组成员 + 1
                    collegeVM.groupMemberNum++
                }
            })
        },
        scrollApplyList: function(e) {
            var target = e.target
            var scrolledRate = target.scrollTop / (target.scrollHeight - target.clientHeight)
            if (scrolledRate > .9) {
                collegeVM.getApplies(true)
            }
            if (scrolledRate < .1) {
                collegeVM.getApplies(false)
            }
        },
        setThreadSticky: function(tid, toggle, callback) {
            var val = toggle ? 1 : 0
            callback = callback || function(data) {
                collegeVM.threadSticky(data.id, !!+data.top)
            }
            $.ajax({
                url: APP.api('/note/' + tid + '/stick'),
                type: 'PUT',
                dataType: 'json',
                data: {top_flag: val, access_token: avalon.cookie.get('access_token')}
            })
            .done(callback)
            .fail(qxq.ajax.failedCallback)
        },
        threadSticky: function(id, val) {
            var elem = collegeVM.threads.filter(function(el, idx) {
                return el.id === id
            })
            if (val != void 0) {
                elem[0].top = !!val
            }
            return elem[0].top
        }
    })

    var collegeThreadContentVM = avalon.define({
        $id: 'collegeThreadContent',
        $skipArray: ['getThread'],
        tid: 0,
        title: '',
        info: '',
        content: '',
        isTop: false,
        getThread: function() {
            var _this = this
            $.ajax({
                url: APP.api('/note'),
                type: 'GET',
                dataType: 'json',
                data: {
                    id: collegeVM.threadActive,
                    access_token: avalon.cookie.get('access_token')
                }
            })
            .done(function(data) {
                _this.tid = data.id
                _this.title = data.title
                _this.info = data.info
                _this.content = data.content
                _this.isTop = !!data.top
                collegeVM.threadCommentCount = data.comment
            })
        },
        setThreadSticky: function(tid, toggle) {
            collegeVM.setThreadSticky(tid, toggle, function(data) {
                collegeThreadContentVM.isTop = toggle
                collegeVM.threadSticky(tid, toggle)
            })
        }
    })

    var collegeThreadCommentVM = avalon.define({
        $id: 'collegeThreadComment',
        $skipArray: ['getComment'],
        commentData: [],
        getComment: function() {
            var _this = this
            $.ajax({
                url: APP.api('/follow'),
                type: 'GET',
                dataType: 'json',
                data: {
                    pid: collegeVM.threadActive,
                    access_token: avalon.cookie.get('access_token')
                }
            })
            .done(function(data) {
                _this.commentData = data.data
            })
        },
        removeComment: function() {
            var id = $(this).data('id')
            $.ajax({
                url: APP.api('/follownote/' + id),
                type: 'delete',
                dataType: 'json',
                data: {
                    access_token: avalon.cookie.get('access_token')
                }
            })
            .done(function() {
                var commentData = collegeThreadCommentVM.commentData
                commentData.forEach(function(el, idx) {
                    if (el.id == id) {
                        commentData.removeAt(idx)
                        collegeVM.threadCommentCount--
                    }
                })
            })
        }
    })

    collegeVM.$watch('cateId', function(cid) {
        var info = avalon.vmodels.commcate.getCategoryInfo(cid)
        this.cateName = info.name
        this.cateDesc = info.description
        this.isGroupAdmin = info.is_group_admin
    })

    collegeVM.$watch('groupActive', function(gid) {
        collegeVM.getGroupThreads()
    })

    collegeVM.$watch('threadActive', function(tid) {
        collegeThreadContentVM.getThread()
        this.toggleThreadContent = true
    })

    collegeVM.$watch('toggleCollege', function(toggle) {
        if (!!toggle) {
            collegeVM.setCollegeTpl()
            collegeVM.initGroups()
            collegeVM.$resizeCallback()
            avalon(window).bind('resize', collegeVM.$resizeCallback)

            IM.entry('1427571391405253');

            $('.college-chat').off('submit', '.chat-input').on('submit', '.chat-input', function(e){
                e.preventDefault();
                var msg = $(this).find('.chat-text').val();
                if(!msg) {
                    return false;
                }
                var options = {
                    to : '1427571391405253',
                    msg : msg,
                    type : 'groupchat'
                };
                IM.sendMessage(msg, options);
                $(this).find('.chat-text').val('');
                return false;
            });
        } else {
            collegeVM.toggleApply = false
            avalon.unbind(window, 'resize', collegeVM.$resizeCallback)
        }
    })

    collegeVM.$watch('toggleThread', function(toggle) {
        if (!collegeVM.toggleApply) {
            // 与 toggleGroup 互斥
            collegeVM.toggleGroup = !toggle
        }
    })

    collegeVM.$watch('toggleThreadContent', function(toggle) {
        collegeVM.toggleThreadComment = !toggle && collegeVM.toggleThread
    })

    collegeVM.$watch('toggleThreadComment', function(toggle) {
        if (!!toggle) {
            collegeThreadCommentVM.getComment()
        }
    })

    collegeVM.$watch('toggleApply', function(toggle) {
        if (!!toggle) {
            collegeVM.toggleThread = false
            collegeVM.toggleGroup = false
            collegeVM.getApplies()
        } else {
            collegeVM.toggleGroup = true
            collegeVM.toggleThread = false
            collegeVM.applyDateList = []
            collegeVM.applyList = []
            $('.college-apply-bd').data('page', null)
        }
    })

    collegeVM.$watch('isUserSignIn', function(value) {
        if (!value) {
            collegeVM.toggleCollege = false
            collegeVM.isGroupAdmin = false
        }
    })
})
