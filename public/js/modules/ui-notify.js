define([
    'avalon',
    'jquery',
    'domReady!'
], function() {

    function flattenUpdatedData(data, n, origin) {
        var flatten = data.reduce(function(prev, curr, idx, arr) {
            if (curr.second_menu) {
                curr.second_menu.forEach(function(el, i) {
                    curr.second_menu[i].pmenu = curr.name
                })
            }
            if (curr.third_menu) {
                curr.third_menu.forEach(function(el, i) {
                    curr.third_menu[i].pmenu = curr.name
                })
            }
            var dd = prev.concat(curr.second_menu || curr.third_menu || [])
            delete curr.second_menu
            delete curr.third_menu
            return dd
        }, origin || data)
        if (n !== 1) {
            return arguments.callee(flatten, n - 1, flatten)
        }
        return flatten
    }

    function findWhere(list, filter) {
        var found =  list.filter(function(el, idx) {
            for (var prop in filter) {
                if (el[prop] !== filter[prop]) {
                    return false
                }
            }
            return true
        })
        return found.length > 0 ? found[0] : {}
    }

    var notifyVM = avalon.define({
        $id: 'notify',
        notifyData: [],
        getUpdatedData: function() {
            $.getJSON(APP.api('/column'), function(data) {
                data = flattenUpdatedData(data, 2)
                notifyVM.updateLocalUpdatedData(data)
            })
        },
        getLocalUpdatedStatus: function(filter) {
            if (typeof filter == 'string') {
                filter = {
                    name: filter
                }
            }
            var notifyData = notifyVM.notifyData
            var found = findWhere(notifyData, filter)
            return found && found.showNotify || false
        },
        setLocalUpdatedStatus: function(name, status) {
            var notifyData = notifyVM.notifyData
            notifyData.forEach(function(el, idx) {
                if (el.name == name) {
                    el.showNotify = status || false
                }
            })
            notifyVM.setLocalUpdatedData(notifyData)
        },
        setLocalUpdatedData: function(data) {
            notifyVM.updateDOM()
            return localStorage.setItem('pc/columns', JSON.stringify(data))
        },
        getLocalUpdatedData: function() {
            return JSON.parse(localStorage.getItem('pc/columns'))
        },
        updateLocalUpdatedData: function(data) {
            if (!data) {
                return false
            }
            var updatedData = notifyVM.getLocalUpdatedData()
            var notifyData = notifyVM.notifyData
            data.forEach(function(el, idx) {
                if (updatedData) {
                    var old = updatedData.filter(function(_el, _idx) {
                        return _el.name == el.name && _el.pmenu == el.pmenu
                    })
                    if (old.length == 0) {
                        data[idx].showNotify = false
                    } else {
                        old = old[0]
                        data[idx].showNotify = old && old.showNotify || (el.updated_at > old.updated_at)
                    }
                } else {
                    data[idx].showNotify = true
                }
            })
            notifyData.clear()
            notifyData.pushArray(data)
            notifyVM.setLocalUpdatedData(data)
        },
        updateDOM: function() {
            var notifyFrag = '<span class="has-notify"></span>'
            $('[data-notify]').each(function(el, idx) {
                var $this = $(this)
                var name = $this.data('notify')
                var level = $this.data('notify-level')
                var hasNotify = $this.find('.has-notify')
                var filter = {name: name}

                switch (level) {
                    case 2:
                        var searchType = avalon.vmodels.search.searchType
                        if (searchType == 'plan') {
                            filter.pmenu = '在线规划'
                        } else {
                            filter.pmenu = '规划资讯'
                        }
                        break;
                    case 3:
                        filter.pmenu = avalon.vmodels.college.cateName
                        break;
                }

                state  = notifyVM.getLocalUpdatedStatus(filter)

                if (state) {
                    if(hasNotify.length == 0) {
                        $this.append(notifyFrag)
                    }
                } else {
                    if(hasNotify.length > 0) {
                        hasNotify.remove()
                    }
                }
            })
        }
    })

    $(document).on('click', '[data-notify]', function() {
        var $this = $(this)
        var name = $this.data('notify')
        $this.find('.has-notify').remove()
        notifyVM.setLocalUpdatedStatus(name, false)
    })

    setTimeout(notifyVM.getUpdatedData, 30 * 1000)
    setInterval(notifyVM.getUpdatedData, 2 * 60 * 1000);
})
