define([
    'text!template/article-comment.html',
    'avalon',
    'jquery',
    'modules/qxq',
    'css!rootui/chameleon/oniui-common.css',
    'css!rootui/scrollbar/avalon.scrollbar.css',
    'css!rootui/dialog/avalon.dialog.css',
    'oniui/dialog/avalon.dialog',
    'domReady!'
], function(commentHtml, avalon) {
    var articleVM = avalon.define({
        $id: 'article',
        aid: '',
        categories: [],
        toggleArticleDialog: false,
        toggleArticle: false,
        toggleComment: false,
        showBoxTools: true,
        articleContent: '',
        commentContent: '',
        isStarred: false,
        isFavoured: false,
        demoURL: '',
        $articleScrollerOpt: {
            paddingVertical: 60
        },
        $resizeCallback: function() {
            // 调整 弹窗大小
            var padding = {
                right: 330 + 41 + 50 + 1,
                left: 41
            }

            var $search = $('.search-result')
            var $dialog = $('.article-box')
            var $inner = $('.article-inner')

            // article-box 宽度和高度
            var boxWidth = Math.max($(document).width(), $(window).width()) - padding.left - padding.right
            var boxHeight = $search.innerHeight()

            $dialog.width(boxWidth)
            $dialog.height(boxHeight)
            $inner.width(boxWidth - 40)
            $inner.height(boxHeight - 60)

            $dialog.css({
                left:  ~($dialog.width() + 50 - 2) + 'px'
            })

            avalon.vmodels.artScroller.update()
        },
        handleArticleDialog: function(toggle) {
            articleVM.toggleArticleDialog = !!toggle
        },
        handleArticle: function(toggle) {
            articleVM.toggleArticle = !!toggle
        },
        handleComment: function(toggle) {
            articleVM.toggleArticleDialog = true
            articleVM.toggleComment = !!toggle
        },
        commentData: [],
        getArticleInfo: function() {
            var url
            var searchVM = avalon.vmodels.search

            // 规划编制 - 任务书
            if (searchVM.searchType == 'plan' && searchVM.cate == 2) {
                url = APP.api('/taskbook')
            } else {
                url = APP.api('/article')
            }

            // 资讯类
            // if (searchVM.searchType == 'info') {
            //     url = APP.api('/article')
            // }

            $.getJSON(url, {
                id: articleVM.aid,
                access_token: avalon.cookie.get('access_token')
            }, function(data) {
                if (data) {
                    articleVM.articleContent = data.content
                    articleVM.isStarred = data.is_starred
                    articleVM.isFavoured = data.is_favoured

                    if (data.a_url) {
                        articleVM.demoURL = data.a_url
                    }

                    avalon.vmodels.artScroller.update()
                    $('.article-content img').one('load', function() {
                        avalon.vmodels.artScroller.update()
                    })
                }
            })
        },
        getCommentList: function() {
            var searchVM = avalon.vmodels.search
            var data, url

            // 规划编制
            if (searchVM.searchType == 'plan' && searchVM.cate == 2) {
                url = APP.api('/ab/comments')
                data = {
                    assignment_book_id: articleVM.aid
                }
            } else {
                url = APP.api('/comment')
                data = {
                    aid: articleVM.aid
                }
            }

            $.getJSON(url, data, function(data) {
                if (data) {
                    articleVM.commentData = data.data
                    avalon.vmodels.artScroller.update()
                }
            })
        },
        postComment: function(e) {
            e.preventDefault()
            var data, url
            var input = $('#comment-form-input')
            var searchVM = avalon.vmodels.search
            if(!avalon.vmodels.user.checkSignIn()) {
                return
            }
            if (searchVM.searchType == 'plan' && searchVM.cate == 2) {
                url = APP.api('/ab/comment')
                data = {
                    assignment_book_id: articleVM.aid,
                    content: input.val(),
                    access_token: avalon.cookie.get('access_token')
                }
            } else {
                url = APP.api('/comment')
                data = {
                    aid: articleVM.aid,
                    content: input.val(),
                    access_token: avalon.cookie.get('access_token')
                }
            }
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: data
            })
            .done(function(data) {
                input.val('')
                if (data && data.id) {
                    articleVM.commentData.push(data)
                    avalon.vmodels.artScroller.update()
                    articleVM.$fire('all!creditOperation', 'comment')
                }
            })
            .fail(qxq.ajax.failedCallback)

            return false
        },
        toggleOp: function(api, callback) {
            if (!avalon.vmodels.user.checkSignIn()) {
                return false
            }
            var val
            var api = api || {}
            var isDone = !articleVM[api.op]
            api.method = api.method || (isDone ? 'post' : 'delete')

            // determine success value: method or data
            api.dsv = api.dsv || 'method'

            $.ajax({
                url: APP.api(api.url),
                type: api.method,
                dataType: 'json',
                data: api.data || {}
            })
            .done(function(data, textStatus, jqXHR) {
                if (api.dsv == 'method') {
                    val = api.method == 'post' ? true : false
                } else {
                    val = !!data
                }
                articleVM[api.op] = val

                // 回调操作，目前用于积分
                if (typeof callback == 'function') {
                    callback()
                }
            })
        },
        // 收藏文章
        toggleStar: function() {
            var url = '/collect'
            if (avalon.vmodels.search.searchType == 'plan') {
                url = '/taskbook/star'
                articleVM.toggleOp({
                    op: 'isStarred',
                    url: url,
                    method: 'post',
                    dsv: 'data',
                    data: {
                        access_token: avalon.cookie.get('access_token'),
                        assignment_book_id: articleVM.aid
                    }
                })
            } else {
                articleVM.toggleOp({
                    op: 'isStarred',
                    url: url,
                    data: {
                        access_token: avalon.cookie.get('access_token'),
                        aid: articleVM.aid
                    }
                })
            }
        },
        // 赞文章
        toggleFavour: function() {
            var url = '/favour'
            var data
            var token = avalon.cookie.get('access_token')
            if (avalon.vmodels.search.searchType == 'plan') {
                if (articleVM.isFavoured) {
                    url = '/taskbook/' + articleVM.aid + '/favour'
                    data = {
                        access_token: token
                    }
                } else {
                    url = '/taskbook/favour'
                    data = {
                        access_token: token,
                        assignment_book_id: articleVM.aid
                    }
                }
                articleVM.toggleOp({
                    op: 'isFavoured',
                    url: url,
                    data: {
                        access_token: token,
                        assignment_book_id: articleVM.aid
                    }
                }, function() {
                    articleVM.$fire('all!creditOperation', 'favour', !articleVM.isFavoured)
                })
            } else {
                articleVM.toggleOp({
                    op: 'isFavoured',
                    url: url,
                    data: {
                        access_token: token,
                        aid: articleVM.aid
                    }
                }, function() {
                    articleVM.$fire('all!creditOperation', 'favour', !articleVM.isFavoured)
                })
            }
        },
        getCategories: function() {
            $.ajax({
                url: APP.api('/article/categories'),
                type: 'GET',
                dataType: 'json'
            })
            .done(function(data) {
                articleVM.categories = data
            })
        },
        // 自动清理数据
        clear: function() {
            articleVM.aid = ''
            articleVM.categories = []
            articleVM.showBoxTools = true
            articleVM.isStarred = false
            articleVM.isFavoured = false
            articleVM.demoURL = ''
            articleVM.commentContent = ''
            articleVM.articleContent = ''
        }
    });

    articleVM.$watch('toggleArticleDialog', function(toggle) {
        avalon.vmodels.search.toggleSearchClose = toggle
        if (!!toggle) {
            // 关闭其他窗口
            articleVM.toggleComment = false

            articleVM.toggleArticle = true

            articleVM.$resizeCallback()
            avalon(window).bind('resize', articleVM.$resizeCallback)
        } else {
            avalon.unbind(window, 'resize', articleVM.$resizeCallback)
            // 关闭所有窗口
            articleVM.toggleComment = false
            articleVM.clear()
        }
    })

    articleVM.$watch('toggleComment', function(toggle) {
        articleVM.toggleArticle = articleVM.toggleArticleDialog && !toggle
        if (!!toggle) {
            articleVM.getCommentList()
            articleVM.commentContent = commentHtml
            avalon.scan();
        } else {
            articleVM.commentContent = ''
        }
    })

    articleVM.$watch('articleContent', function() {
        if (!(this.searchType == 'plan' && value == 2)) {
            avalon.vmodels.article.demoURL = ''
        }
    })

    articleVM.getCategories()
})
