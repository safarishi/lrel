define([
    'text!template/search.html',
    'text!template/search.dropdown.html',
    'avalon',
    'jquery',
    'css!rootui/chameleon/oniui-common.css',
    'css!rootui/scrollbar/avalon.scrollbar.css',
    'css!rootui/dropdown/avalon.dropdown.css',
    'oniui/dropdown/avalon.dropdown',
    'domReady!'
], function(searchTpl, searchDropdownTpl) {
    var searchVM = avalon.define({
        $id: 'search',
        toggleSearch: false,
        toggleSearchClose: false,
        searchPlaceholder: '搜索中',
        data: [],
        cate: 'all',
        searchType: 'info',
        categories: [{
            value: 'all',
            label: '全部'
        }],
        $artCateOpt: {
            container: 'search-category',
            data: [],
            height: 260,
            onSelect: function() {
                searchVM.handleSearch()
            },
            getTemplate: function() {
                return searchDropdownTpl
            }
        },
        handleSearch: function(e, type, value) {
            var setTplCallback = avalon.noop
            var url

            // set searchType
            type = type || searchVM.searchType
            if (type !== searchVM.searchType) {
                searchVM.searchType = type
            }

            searchVM.toggleSearch = true

            // 规划资讯
            if (type == 'info') {
                searchVM.initCategories({
                    label: 'title',
                    value: 'id'
                }, value)
                url = '/search'
            }
            // 在线规划
            if (type == 'plan') {
                searchVM.initCategories({
                    label: 'name',
                    value: 'id'
                }, value)
                url = '/op/search'
            }
            setTplCallback = function(cate) {
                var title = $('#search-form-input').val()
                $.getJSON(APP.api(url), {
                    title: title,
                    cid: searchVM.cate
                }, function(data) {
                    searchVM.data = data.data
                    searchVM.searchPlaceholder = '◀ 搜索结果'
                    searchVM.$resizeCallback()
                })
                searchVM.$fire('all!isSearchCateChanged', searchVM.cate, searchVM.searchType)
            }
            searchVM.setSrTpl(setTplCallback)
        },
        closeSearch: function(e) {
            e.preventDefault();
            searchVM.toggleSearch = false;
        },
        $srScrollerOpt: {
            paddingVertical: 40
        },
        clickArticleItem: function(e) {
            e.preventDefault()
            var id = $(this).data('id')
            avalon.vmodels.article.toggleArticleDialog = true

            if (searchVM.searchType == 'plan' && searchVM.cate == 3) {
                avalon.vmodels.votelist.getVoteList(id)
            } else {
                avalon.vmodels.article.aid = $(this).data('id')
                avalon.vmodels.article.toggleComment = false
                avalon.vmodels.article.getArticleInfo(id)
            }
        },
        $resizeCallback: function() {
            $('.search-item-list').height(Math.max($(window).height(), $(document).height()) - 130 - 46);
            searchVM.updateSrScroller()
        },
        /**
         * 初始化分类
         * @param  {object} opt 数据源字段定义
         * - label: label
         * - value: value
         */
        initCategories: function(opt, value) {
            var source = []
            var _hasFindCid = false
            var _source = []
            opt = opt || {}
            opt.label = opt.label || 'label'
            opt.value = opt.value || 'value'

            if (searchVM.searchType == 'info') {
                source = avalon.vmodels.article.categories
                _source.push({label:'全部',value:'all'})
            }
            if (searchVM.searchType == 'plan') {
                source = avalon.vmodels.planningcate.categories
            }

            source.forEach(function(element, index){
                _source.push({
                    value: element[opt.value],
                    label: element[opt.label]
                })
                if (value && value == element[opt.value]) {
                    _hasFindCid = true
                }
            })

            searchVM.categories.clear()
            searchVM.categories.pushArray(_source)

            if ((value && _hasFindCid) || value == 'all') {
                searchVM.cate = value
            }
        },
        // 查看更多资讯
        showInfoList: function(e) {
            e.preventDefault()
            var title = $('#search-form-input').val()
            var cid = searchVM.cate
            window.open(this.href + '?title=' + title + '&cid=' + cid)
        },
        setSrTpl: function(callback) {
            var cate = searchVM.cate
            if (!$('.search-container').length) {
                $('.search').append(searchTpl)
                avalon.scan(null, searchVM)
            }
            searchVM.cate = cate
            callback(cate)
        },
        updateSrScroller: function() {
            searchVM.setSrTpl(function() {
                avalon.vmodels.srScroller.update();
            })
        }
    });

    searchVM.$watch('toggleSearch', function(value) {
        if (value === false) {
            searchVM.searchType = 'info'
            searchVM.data = []
            searchVM.searchPlaceholder = '搜索中'
            searchVM.initCategories({
                label: 'title',
                value: 'id'
            }, 'all')
            avalon.unbind(window, 'resize', this.$resizeCallback)
        } else {
            avalon.vmodels.root.closeMenuNav()
            avalon(window).bind('resize', this.$resizeCallback)
        }
    })

    searchVM.$watch('cate', function(value) {
        // 设置收藏点赞是否显示
        if (this.searchType == 'plan' && value == 3) {
            avalon.vmodels.article.showBoxTools = false
        } else {
            avalon.vmodels.article.showBoxTools = true
        }

        this.$fire('all!isSearchCateChanged', value, searchVM.searchType)
    })

    searchVM.data.$watch('length', function(value) {
        searchVM.updateSrScroller()
    })

    searchVM.$artCateOpt.$source = searchVM.categories
})
