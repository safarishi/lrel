<?php

use LucaDegasperi\OAuth2Server\Authorizer;

class ArticleApiController extends ApiController
{

    public function __construct(Authorizer $authorizer) {
        parent::__construct($authorizer);
        $this->beforeFilter('validation');
    }

    private static $_validate = [
        'show' => [
            'id' => 'required',
        ],
        'showForMobile' => [
            'id' => 'required',
        ],
    ];

    /**
     * 显示文章信息
     *
     * @return mixed
     */
    public function show() {
        $id = intval(Input::get('id'));

        $uid = '';
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        $article = Article::findOrFail($id);
        // 将特殊的 HTML 实体转换回普通字符
        $article->content = htmlspecialchars_decode($article->content);
        if (strlen($uid) > 0) {
            $favour = Favour::whereRaw('uid = ? and aid = ?', array($uid, $id))->first();
            if ($favour) {
                // is_favoured = true 用户已经赞了这篇文章
                $article->is_favoured =  true;
            } else {
                $article->is_favoured = false;
            }

            $star = Star::whereRaw('uid = ? and aid = ?', array($uid, $id))->first();
            if ($star) {
                // is_starred = true 用户收藏了这篇文章
                $article->is_starred =  true;
            } else {
                $article->is_starred = false;
            }
            return $article;
        } else {
            // 用户没有登陆
            $article->is_favoured = false;
            $article->is_starred  = false;
            return $article;
        }
    }

    /**
     * 获取资讯规划，文章，在手机端显示
     *
     * @return mixed
     */
    public function showForMobile() {
        $id = intval(Input::get('id'));

        $article = Article::select('id', 'comment', 'title', 'created_at', 'thumbnail_url', 'pic_url', 'description', 'content')
            ->findOrFail(intval($id));

        $uid = '';
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }
        // 判断用户是否已经登陆
        if(strlen($uid) > 0) {
            $favour = Favour::whereRaw('uid = ? and aid = ?', array($uid, $id))->first();
            if ($favour) {
                // is_favoured = true 用户已经赞了这篇文章
                $article->is_favoured =  true;
            } else {
                $article->is_favoured = false;
            }

            $star = Star::whereRaw('uid = ? and aid = ?', array($uid, $id))->first();
            if ($star) {
                // is_starred = true 用户收藏了这篇文章
                $article->is_starred =  true;
            } else {
                $article->is_starred = false;
            }

            return $article;
        }else {
            // 用户没有登陆
            $article->is_favoured = false;
            $article->is_starred  = false;
            return $article;
        }

    }

    /**
     * 规划资讯搜索
     *
     * @return mixed
     */
    public function search() {
        // 获取请求参数
        $cid   = intval(Input::get('cid'));
        $pid   = intval(Input::get('pid'));
        $sid   = intval(Input::get('sid'));
        $title = Input::get('title');
        // 筛选返回结果
        $someArticles = Article::select('id', 'title', 'description', 'thumbnail_url', 'comment');

        if ($cid) {
            $someArticles->where('category_id', $cid);
        }
        if ($pid) {
            $someArticles->where('location_id', $pid);
        }
        if ($sid) {
            $someArticles->where('status_id', $sid);
        }
        if ($title) {
            $someArticles->where('title', 'like', '%'.$title.'%');
        }
        // 创建时间降序排列
        $someArticles->orderBy('created_at', 'desc');
        // 返回分页后的数据
        return $someArticles->paginate(20);
    }

    /**
     * 获取所有文章分类类别信息
     *
     * @return mixed
     */
    public function getAcs() {
        return Category::select('id', 'title')->orderBy('order', 'desc')->get();
    }

    /**
     * 根据空间位置的高度检索
     * 规划资讯-空间位置-Mobile
     *
     * @return mixed
     */
    public function getPlaces($hid) {
        $hid = $hid ? $hid : intval(Input::get('height_id'));
        $somePoints = Point::select('id', 'point_name');
        $somePoints->where('height_id', $hid);

        return $somePoints->get();
    }

    /**
     * 获得空间位置-高度
     *
     * @return mixed
     */
    public function getAreas() {
        return DB::table('height')
            ->select('id', 'name')
            ->get();
    }

    /**
     * 获取全部空间位置
     */
    public function getLocations() {
        $hs = DB::table('height')
            ->select('id', 'name')
            ->get();
        foreach ($hs as $key => $value) {
            $value->loc = $this->getPlaces($value->id);
        }
        return $hs;
    }

}