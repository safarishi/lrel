<?php

use LucaDegasperi\OAuth2Server\Authorizer;

class FavourApiController extends ApiController
{

    public function __construct(Authorizer $authorizer) {
        $this->authorizer = $authorizer;
        $this->beforeFilter('oauth');
        $this->beforeFilter('validation');
        $this->afterFilter('caf_filter', ['only' => ['del']]);
        $this->afterFilter('af_filter', ['only' => ['store']]);
    }

    private static $_validate = [
        'store' => [
            'aid' => 'required',
        ],
    ];

    /**
     * 规划资讯-文章-点赞
     *
     * @return Favour
     */
    public function store() {
        $uid = $this->authorizer->getResourceOwnerId();
        $aid = Input::get('aid');

        $favour = new Favour();
        $favour->aid = $aid;
        $favour->uid = $uid;
        $favour->save();

        $favour->username = User::find($uid)->username;
        return $favour;
    }

    /**
     * 规划资讯-文章-取消点赞
     *
     * @return mixed
     */
    public function del() {
        $uid = intval($this->authorizer->getResourceOwnerId());
        $aid = Input::get('aid');
        $favour = Favour::select('id', 'uid', 'aid')
            ->where('uid', $uid)
            ->where('aid', $aid)
            ->first();
        $favour->delete();
        return Response::make($favour, 200);
    }

    /**
     * 获取点赞
     *
     * @return mixed
     */
    public function show() {
        $uid = $this->authorizer->getResourceOwnerId();
        $favours = Favour::where('uid', $uid)->get();
        foreach($favours as $_v) {
            $_v->username = User::find($uid)->username;
        }
        return $favours;
    }

}