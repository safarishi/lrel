define([
    'avalon',
    'jquery',
    'domReady!'
], function() {
    var planCategoryVM = avalon.define({
        $id: 'planningcate',
        categories: [],
        getCategries: function(){
            $.getJSON(APP.api('/op/categories'), function(data) {
                planCategoryVM.categories = data
            })
        },
        clickPlanningMenu: function(e) {
            var value = $(this).data('id')
            avalon.vmodels.search.handleSearch(e, 'plan', value)
        }
    });
    planCategoryVM.getCategries();
})