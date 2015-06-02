<?php

use LucaDegasperi\OAuth2Server\Authorizer;

class StarApiController extends ApiController
{

    public function __construct(Authorizer $authorizer) {
        $this->authorizer = $authorizer;
        $this->beforeFilter('oauth');
        $this->beforeFilter('validation');
    }

    private static $_validate = [
        'store' => [
            'aid' => 'required',
        ],
    ];

    /**
     * 收藏文章
     *
     * @return Star
     */
    public function store() {
        $uid = $this->authorizer->getResourceOwnerId();
        $aid = Input::get('aid');
        $star = new Star;
        $star->aid = $aid;
        $star->uid = $uid;

        $star->save();
        $star->username = User::find($uid)->username;
        return $star;
    }

    /**
     * 查询用户收藏的文章
     *
     * @return mixed
     */
    public function show() {
        $uid = $this->authorizer->getResourceOwnerId();
        $someStar = Star::where('uid', $uid)->paginate(6);
        foreach($someStar as $_v) {
            $_v->username = User::find($uid)->username;
            $_v->user_avatar = User::find($uid)->avatar;
            $_v->article_title = Article::find($_v->aid)->title;
        }
        return $someStar;
    }

    /**
     * 取消对某一篇文章的收藏
     *
     * @param $aid 被取消收藏的文章id
     * @return mixed
     */
    public function del() {
        $uid = intval($this->authorizer->getResourceOwnerId());
        $aid = Input::get('aid');
        $star = Star::whereRaw('aid = ? and uid = ?', array(
            intval($aid),
            $uid,
        ))->first();
        $star->delete();
        return Response::make('', 204);
    }
}