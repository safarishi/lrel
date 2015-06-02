<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <link rel="shortcut icon" href="images/favicon.ico"/>
    <title>全心全意</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
<div class="info-wrap clearfix">
    <section class="main">
        <section class="content">
            <div class="info-box-wrap">
                <div class="info-box main-box">
                    <div class="info-box-hd main-box-hd">
                        <h3 class="title"><?php echo $article['title']; ?></h3>
                        <div class="main-box-hd-tool">
                            <a href="/info" class="back">返回列表</a>
                        </div>
                    </div>
                    <div class="info-box-bd single-page-box article-default-style">
                        <?php echo $article['content']; ?>
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
</body>
</html>