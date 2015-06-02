<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <link rel="shortcut icon" href="images/favicon.ico"/>
    <title>全心全意</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="bower_components/jquery/dist/jquery.js"></script>
    <script src="js/libs/URI.js"></script>
</head>
<body>
<div class="info-wrap clearfix">
<section class="main">
<section class="content">
<div class="info-box-wrap">
<div class="info-box main-box">
<div class="info-box-hd main-box-hd">
    <h3 class="title">规划资讯</h3>
</div>
<div class="info-box-bd">
<div class="info-filter">
    <div class="info-filter-item info-filter-category">
        <h5 class="info-filter-title">资讯类别：</h5>
        <ul class="info-filter-list">
            <li <?php if($cid == '') echo 'class="active"'; ?>><a href="#" data-query="cid" data-cid="">全部</a></li>
            <?php foreach($categories as $category) {?>
            <li <?php if($cid == $category['id']) echo 'class="active"'; ?>><a href="#" data-query="cid" data-cid="<?php echo $category['id']; ?>"><?php echo $category['title']; ?></a></li>
            <?php }?>
        </ul>
    </div>
    <div class="info-filter-item info-filter-location">
        <h5 class="info-filter-title">空间位置：</h5>
        <ul class="info-filter-list">
            <li <?php if($pid == $ppid) echo 'class="active"'; ?>><a href="#" data-query="pid" data-pid="">全部</a></li>
            <!-- -->
            <?php foreach($info as $_v) { ?>
                <li <?php if($_v['id'] == $ppid) { ?> class="active" <?php } ?>>
                    <a href="#" data-isloc="true"><?php echo $_v['name']; ?></a>
                    <ul>
                        <?php foreach($point_info as $v) { ?>
                            <?php if($_v['id'] == $v['height_id']) { ?>
                                <li><a href="#" <?php if($v['id'] == $pid) { ?> class="on" <?php } ?> data-query="pid" data-pid="<?php echo $v['id']; ?>"><?php echo $v['point_name']; ?></a></li>
                            <?php } ?>
                        <?php } ?>
                    </ul>
                </li>
            <?php } ?>
            <!-- -->
        </ul>
    </div>
    <div class="info-filter-item info-filter-period">
        <h5 class="info-filter-title">资讯时间：</h5>
        <ul class="info-filter-list">
            <li <?php if($sid == '') echo 'class="active"'; ?>><a href="#" data-query="sid" data-sid="">全部</a></li>
            <?php foreach($status as $st) {?>
            <li <?php if($sid == $st['id']) echo 'class="active"'; ?>><a href="#" data-query="sid" data-sid="<?php echo $st['id']; ?>"><?php echo $st['name']; ?></a></li>
            <?php }?>
        </ul>
    </div>
</div>
<div class="info-list">
    <ul class="info-item-list item-list">
        <?php foreach($data as $_v) {?>
        <li>
            <div class="mod clearfix">
                <div class="mod-sd">
                    <a href="#"><img src="<?php echo $_v['thumbnail_url']?>" alt="<?php echo $_v['title']; ?>" height="60" width="80"></a>
                </div>
                <div class="mod-mn">
                    <div class="mod-hd">
                        <h5>
                            <a href="/article?id=<?php echo $_v['id']?>" class=""><span class="title ellipsis"><?php echo $_v['title']; ?></span></a>
                        </h5>
                    </div>
                    <div class="mod-bd">
                        <p><?php echo $_v['description']; ?></p>
                    </div>
                    <div class="mod-ft">
                        <a href="#"><?php echo $_v['comment']; ?></a>
                    </div>
                </div>
            </div>
        </li>
        <?php }?>
    </ul>

<?php echo $data->links(); ?>

</div>
</div>
</div>
</div>
</section>
<footer class="footer">
    <div class="footer-bar">
        <div class="footer-bar-left">
            <img src="images/qxqy_logo.png" height="50" alt="">
            <p> &copy; 2015 上海市城市规划建筑设计工程有限公司 上海数城网络信息有限公司</p>
        </div>
        <div class="footer-tools">
            <a href="#" title="手机浏览"><span class="ft-icons-sprite ft-icons-app"></span></a>
            <a href="#" title="我要分享"><span class="ft-icons-sprite ft-icons-share"></span></a>
            <a href="#" title="联系我们"><span class="ft-icons-sprite ft-icons-mail"></span></a>
            <a href="statement.html" target="_blank" title="关于我们"><span class="ft-icons-sprite ft-icons-menu"></span></a>
        </div>
    </div>
</footer>
</section>
</div>
<script>
    $(function() {
        var url = new URI(window.location.href)
        $('.info-filter-list').on('click', 'a', function() {
            var $this = $(this)
            if ($this.data('isloc')) {
                var li = $this.parent()
                li.siblings().removeClass('active')
                li.addClass('active')
            } else {
                var query = $this.data('query')
                if (query) {
                    var id = $this.data(query)
                    var obj = {}
                    obj[query] = id
                    url.removeQuery(query)
                    url.addQuery(obj)
                    window.location.href = url
                }
            }
        })
    })
</script>
</body>
</html>