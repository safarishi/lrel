<?php

use LucaDegasperi\OAuth2Server\Authorizer;

class MultiplexApiController extends ApiController
{
    public function __construct(Authorizer $authorizer) {
        parent::__construct($authorizer);
        // $this->beforeFilter('validation');
        // $this->beforeFilter('oauth', ['except' => ['search', 'lastModifed', 'commentList']]);
    }

    /**
     * 获取用户当天总共点赞的次数
     *
     * @param  int    $uid  用户id
     * @param  string $date 日期字符串
     * @return int          总点赞次数
     */
    public static function quantity($uid, $date)
    {
        return DB::table('favours_tmp')
            ->where('created_at', $date)
            ->where('uid', $uid)
            ->count();
    }

    /**
     * 积分记录日志
     *
     * @param  int    $uid   用户id
     * @param  string $fk    关联外键描述，类似fk_id:1
     * @param  int    $delta 增量
     * @param  string $desc  描述语
     */
    public static function record($uid, $fk, $delta, $desc)
    {
        $model = new IntegralDeltaLog();

        $model->fk             = $fk;
        $model->user_id        = $uid;
        $model->description    = $desc;
        $model->integral_delta = $delta;

        $model->save();
    }
}
