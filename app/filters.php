<?php

/*
|--------------------------------------------------------------------------
| Application & Route Filters
|--------------------------------------------------------------------------
|
| Below you will find the "before" and "after" events for the application
| which may be used to do any work before or after a request into your
| application. Here you may also register your custom route filters.
|
*/

App::before(function($request)
{
    //
});


App::after(function($request, $response)
{
    //
});


/*
|--------------------------------------------------------------------------
| Authentication Filters
|--------------------------------------------------------------------------
|
| The following filters are used to verify that the user of the current
| session is logged into this application. The "basic" filter easily
| integrates HTTP Basic authentication for quick, simple checking.
|
*/

Route::filter('auth', function()
{
    if (Auth::guest())
    {
        if (Request::ajax())
        {
            return Response::make('Unauthorized', 401);
        }
        return Redirect::guest('login');
    }
});


Route::filter('auth.basic', function()
{
    return Auth::basic();
});

Route::filter('oauth.checkclient', function($route, $request)
{
    $clientId = Input::get('client_id');
    $clientSecret = Input::get('client_secret');

    $client = DB::table('oauth_clients')
            ->where('id', $clientId)
            ->where('secret', $clientSecret)->get();
    if (empty($client)) {
        throw new Rootant\Api\Exception\OAuth\UnauthorizedClientException;
    }

});

/*
|--------------------------------------------------------------------------
| Guest Filter
|--------------------------------------------------------------------------
|
| The "guest" filter is the counterpart of the authentication filters as
| it simply checks that the current user is not logged in. A redirect
| response will be issued if they are, which you may freely change.
|
*/

Route::filter('guest', function()
{
    if (Auth::check()) return Redirect::to('/');
});

/*
|--------------------------------------------------------------------------
| CSRF Protection Filter
|--------------------------------------------------------------------------
|
| The CSRF filter is responsible for protecting your application against
| cross-site request forgery attacks. If this special token in a user
| session does not match the one given in this request, we'll bail.
|
*/

Route::filter('csrf', function()
{
    if (Session::token() !== Input::get('_token'))
    {
        throw new Illuminate\Session\TokenMismatchException;
    }
});

/*
|--------------------------------------------------------------------------
| 用户投票成功增加积分 Filter
|--------------------------------------------------------------------------
|
| 参与一次投票10个积分
|
*/

Route::filter('vote_integral', function($route, $request, $response)
{
    // 获得用户id
    $uid = intval($response->original->attributes['uid']);
    $vii = intval($response->original->attributes['vote_item_id']);

    $delta = Config::get('integral.base.vote');

    $user = User::find($uid);
    // 用户投票成功积分增加10
    $user->integral += $delta;
    $user->save();

    // 记录-在线规划-投票-积分变化日志
    MultiplexApiController::record($uid, "vote_item_id:$vii", $delta, "投票积分+$delta");
});

/*
|--------------------------------------------------------------------------
| 规划资讯-评论-增加积分 Filter
|--------------------------------------------------------------------------
|
| 一次5个积分，一天最多25个
|
*/

Route::filter('article_comment_integral', function($route, $request, $response)
{
    // 获取响应中的请求参数
    $uid = intval($response->original->attributes['uid']);
    $aid = intval($response->original->attributes['aid']);

    $ca = new CommentArticle();
    $ca->uid = $uid;
    $ca->aid = $aid;
    $ca->save();
    //
    $today_time = date('Y-m-d', time());
    $cnt = CommentArticle::whereRaw('uid = ? and created_at = ?', array($uid, $today_time))->count();
    // 用户一天评论次数超过五次，积分将不增加
    if ($cnt <= 5) {
        $delta = Config::get('integral.base.comment');

        $user = User::find($uid);
        $user->integral += $delta;
        $user->save();

        // 记录-规划资讯-评论-积分变化日志
        MultiplexApiController::record($uid, "article_id:$aid", $delta, "评论了在线规划资讯积分+$delta");
    }
});

/*
|--------------------------------------------------------------------------
| 微大学-评论-增加积分 Filter
|--------------------------------------------------------------------------
|
| 评论一次增加5个积分，一天最多25个
|
*/

Route::filter('mu_reply_filter', function($route, $request, $response)
{
    // 获取响应中的请求参数
    $uid = intval($response->original->attributes['uid']);
    $pid = intval($response->original->attributes['pid']);

    $cn = new CommentNote();
    $cn->uid     = $uid;
    $cn->note_id = $pid;
    $cn->save();

    // 当天日期
    $today_time = date('Y-m-d', time());
    $cnt = CommentNote::whereRaw('uid = ? and created_at = ?', array($uid, $today_time))->count();
    if ($cnt <= 5) {
        $delta = Config::get('integral.base.comment');

        $user = User::find($uid);
        $user->integral += $delta;
        $user->save();

        // 记录-微大学-跟帖-积分变化日志
        MultiplexApiController::record($uid, "note_id:$pid", $delta, "微大学跟帖积分+$delta");
    }
});

/*
|--------------------------------------------------------------------------
| 用户-连续登录-送积分 Filter
|--------------------------------------------------------------------------
|
| 连续登录一天5个积分，两天10个积分，最多25个
|
*/

Route::filter('login_integral', function($route, $request, $response)
{
    // 获取当前返回参数
    $data = $response->original;

    $sid = DB::table('oauth_access_tokens')
        ->where('id', $response->original['access_token'])
        ->first()->session_id;
    $uid = DB::table('oauth_sessions')->where('id', $sid)->first()->owner_id;

    $tmp = DB::table('user_login_tmp')->where('uid', $uid)->first();

    $user = User::find($uid);
    // 获取积分配置参数
    $nums = Config::get('integral.base.login');

    if ($tmp) {
        // 用户最后登陆日期
        $tmp_date   = $tmp->updated_at;
        // 日期增加一天
        $tmp_date_1 = date('Y-m-d', strtotime($tmp_date) + 86400);
        // 当前日期
        $now_date = date('Y-m-d', time());
        // 记录用户连续登陆的天数
        $continue_days = $tmp->continue_days;

        if ($now_date === $tmp_date) {
            // 用户在当天又进行了登陆
            DB::table('user_login_tmp')->where('uid', $uid)
            ->update(array('updated_at' => date('Y-m-d', time())));
            // 添加返回参数
            $data['today_first_login'] = false;
        } elseif ($now_date === $tmp_date_1) {
            // 用户在连续的两天内登陆
            DB::table('user_login_tmp')->where('uid', $uid)
                ->update(array('updated_at' => date('Y-m-d', time()), 'continue_days' => ++$continue_days));
            $cnt = DB::table('user_login_tmp')->where('uid', $uid)->first()->continue_days;
            if ($cnt <= 5) {
                $delta = $cnt * $nums;
                $user->integral += $delta;
                $user->save();

                // 记录-用户连续登陆-积分变化日志
                MultiplexApiController::record($uid, "uid:$uid", $delta, "用户连续登录{$cnt}天，积分+{$delta}");
            } else {
                // 最多25积分
                $user->integral += 25;
                $user->save();

                // 记录-用户连续登陆超过五天-积分变化日志
                MultiplexApiController::record($uid, "uid:$uid", 25, "用户连续登录{$cnt}天，积分+25");
            }
            // 添加返回参数
            $data['today_first_login'] = true;
        } else {
            // 其他
            DB::table('user_login_tmp')->where('uid', $uid)
                ->update(array('updated_at' => date('Y-m-d', time()), 'continue_days' => 1));
            $user->integral += $nums;
            $user->save();
            // 添加返回参数
            $data['today_first_login'] = true;

            // 记录-用户登陆-积分变化日志
            MultiplexApiController::record($uid, "uid:$uid", $nums, "用户连续登录中断，重新登录，积分+{$nums}");
        }
    } else {
        DB::table('user_login_tmp')->insert(
            array(
                'uid' => $uid,
                'created_at' => date('Y-m-d', time()),
                'updated_at' => date('Y-m-d', time()),
            )
        );
        // 用户第一次登陆的情况
        $user->integral += $nums;
        $user->save();
        // 添加返回参数
        $data['today_first_login'] = true;

        // 记录-用户注册后首次登陆-积分变化日志
        MultiplexApiController::record($uid, "uid:$uid", $nums, "用户注册后首次登录积分+{$nums}");
    }
    // 设置返回响应数据
    $response->setContent($data);
});

/*
|--------------------------------------------------------------------------
| 用户-取消文章点赞-积分 Filter
|--------------------------------------------------------------------------
|
|
*/

Route::filter('caf_filter', function($route, $request, $response)
{
    $uid = $response->original->attributes['uid'];
    // 获得被点赞文章的id
    $aid = $response->original->attributes['aid'];

    $exist_flag = DB::table('favours_tmp')
        ->where('uid', $uid)
        ->where('article_id', $aid)
        ->first();
    if ($exist_flag) {
        // 取消赞成功，删除tmp数据表中存在的点赞记录
        DB::table('favours_tmp')->where('id', $exist_flag->id)->delete();

        $now_date = date('Y-m-d', time());
        // 判断用户当天总的点赞次数
        $cnt = MultiplexApiController::quantity($uid, $now_date);
        if ($cnt < 5) {
            $delta = Config::get('integral.base.favour');
            // 积分减一
            $user = User::find($uid);
            $user->integral -= $delta;
            $user->save();

            // 记录-用户取消点赞文章-积分变化日志
            MultiplexApiController::record($uid, "article_id:$aid", $delta, "取消点赞文章积分-{$delta}");
        }
    }
});

/*
|--------------------------------------------------------------------------
| 用户-点赞文章-积分 Filter
|--------------------------------------------------------------------------
|
|
*/

Route::filter('af_filter', function($route, $request, $response)
{
    $uid = $response->original->attributes['uid'];
    // 获得被点赞文章的id
    $aid = $response->original->attributes['aid'];

    // 点赞成功后存储点赞记录
    $exist_flag = DB::table('favours_tmp')
        ->where('uid', $uid)
        ->where('article_id', $aid)
        ->first();
    if (!$exist_flag) {
        DB::table('favours_tmp')->insert(
            array('uid' => $uid, 'article_id' => $aid, 'created_at' => date('Y-m-d', time()), 'updated_at' => date('Y-m-d H:i:s', time()))
        );
    }

    $now_date = date('Y-m-d', time());
    $cnt = MultiplexApiController::quantity($uid, $now_date);
    if ($cnt <= 5) {
        $delta = Config::get('integral.base.favour');
        // 用户积分加一
        $user = User::find($uid);
        $user->integral += $delta;
        $user->save();

        // 记录-用户点赞文章-积分变化日志
        MultiplexApiController::record($uid, "article_id:$aid", $delta, "点赞文章积分+{$delta}");
    }
});

/*
|--------------------------------------------------------------------------
| 用户-点赞任务书-积分 Filter
|--------------------------------------------------------------------------
|
|
*/

Route::filter('fab_integral', function($route, $request, $response)
{
    $uid = $response->original->attributes['uid'];
    // 获得被点赞任务书的id
    $abi = $response->original->attributes['assignment_book_id'];

    // 点赞成功后存储点赞记录，得先判断是否已经被存储了
    $exist_flag = DB::table('favours_tmp')
        ->where('uid', $uid)
        ->where('assignment_book_id', $abi)
        ->first();
    if (!$exist_flag) {
        DB::table('favours_tmp')->insert(
            array('uid' => $uid, 'assignment_book_id' => $abi, 'created_at' => date('Y-m-d', time()), 'updated_at' => date('Y-m-d H:i:s', time()))
        );
    }

    $now_date = date('Y-m-d', time());
    $cnt = MultiplexApiController::quantity($uid, $now_date);
    if ($cnt <= 5) {
        $delta = Config::get('integral.base.favour');
        // 用户积分加一
        $user = User::find($uid);
        $user->integral += $delta;
        $user->save();

        // 记录-用户点赞任务书-积分变化日志
        MultiplexApiController::record($uid, "assignment_book_id:$abi", $delta, "点赞任务书积分+{$delta}");
    }
});

/*
|--------------------------------------------------------------------------
| 用户-取消点赞任务书-积分 Filter
|--------------------------------------------------------------------------
|
|
*/

Route::filter('cfab_integral', function($route, $request, $response)
{
    $uid = $response->original->attributes['uid'];
    // 获得被点赞任务书的id
    $abi = $response->original->attributes['assignment_book_id'];

    $exist_flag = DB::table('favours_tmp')
        ->where('uid', $uid)
        ->where('assignment_book_id', $abi)
        ->first();

    if ($exist_flag) {
        // 取消赞成功，删除tmp数据表中存在的点赞记录
        DB::table('favours_tmp')->where('id', $exist_flag->id)->delete();

        $now_date = date('Y-m-d', time());
        // 判断用户当天总的点赞次数
        $cnt = MultiplexApiController::quantity($uid, $now_date);
        if ($cnt < 5) {
            $delta = Config::get('integral.base.favour');
            $user = User::find($uid);
            $user->integral -= $delta;
            $user->save();

            // 记录-用户取消点赞任务书-积分变化日志
            MultiplexApiController::record($uid, "assignment_book_id:$abi", $delta, "取消点赞任务书积分-{$delta}");
        }
    }
});

/*
|--------------------------------------------------------------------------
| 用户-点赞文章的某一篇评论-积分 Filter
|--------------------------------------------------------------------------
|
|
*/

Route::filter('fac_integral', function($route, $request, $response)
{
    $uid = $response->original->attributes['uid'];
    // 获得被点赞文章评论的id
    $cid = $response->original->attributes['comment_id'];

    $exist_flag = DB::table('favours_tmp')
        ->where('uid', $uid)
        ->where('comment_id', $cid)
        ->first();

    if (!$exist_flag) {
        DB::table('favours_tmp')->insert(
            array('uid' => $uid, 'comment_id' => $cid, 'created_at' => date('Y-m-d', time()), 'updated_at' => date('Y-m-d H:i:s', time()))
        );
    }

    $now_date = date('Y-m-d', time());
    $cnt = MultiplexApiController::quantity($uid, $now_date);
    if ($cnt <= 5) {
        $delta = Config::get('integral.base.favour');
        // 用户积分加一
        $user = User::find($uid);
        $user->integral += $delta;
        $user->save();

        // 记录-用户点赞文章的某一篇评论-积分变化日志
        MultiplexApiController::record($uid, "comment_id:$cid", $delta, "点赞文章的某一篇评论积分+{$delta}");
    }
});

/*
|--------------------------------------------------------------------------
| 用户-取消点赞文章评论-积分 Filter
|--------------------------------------------------------------------------
|
|
*/

Route::filter('cfac_integral', function($route, $request, $response)
{
    $uid = $response->original->attributes['uid'];
    // 获得被取消点赞文章评论的id
    $cid = $response->original->attributes['comment_id'];

    $exist_flag = DB::table('favours_tmp')
        ->where('uid', $uid)
        ->where('comment_id', $cid)
        ->first();

    if ($exist_flag) {
        // 取消赞成功，删除tmp数据表中存在的点赞记录
        DB::table('favours_tmp')->where('id', $exist_flag->id)->delete();

        $now_date = date('Y-m-d', time());
        // 判断用户当天总的点赞数
        $cnt = MultiplexApiController::quantity($uid, $now_date);
        if ($cnt < 5) {
            $delta = Config::get('integral.base.favour');

            $user = User::find($uid);
            $user->integral -= $delta;
            $user->save();

            // 记录-用户取消点赞文章的某一篇评论-积分变化日志
            MultiplexApiController::record($uid, "comment_id:$cid", $delta, "取消点赞文章的某一篇评论积分-{$delta}");
        }
    }
});

/*
|--------------------------------------------------------------------------
| 用户-点赞在线规划资讯-积分 Filter
|--------------------------------------------------------------------------
|
|
*/

Route::filter('foi_integral', function($route, $request, $response)
{
    $uid = $response->original->attributes['uid'];
    // 获得被点赞在线规划资讯的id
    $oii = $response->original->attributes['op_info_id'];

    // 点赞成功后存储点赞记录，先判断是否已经存储
    $flag = DB::table('favours_tmp')
        ->where('op_info_id', $oii)
        ->where('uid', $uid)
        ->first();
    if (!$flag) {
        DB::table('favours_tmp')->insert(
            array('uid' => $uid, 'op_info_id' => $oii, 'created_at' => date('Y-m-d', time()), 'updated_at' => date('Y-m-d H:i:s', time()))
        );
    }

    // 系统当前日期
    $now_date = date('Y-m-d', time());
    $cnt = MultiplexApiController::quantity($uid, $now_date);
    if ($cnt <= 5) {
        $delta = Config::get('integral.base.favour');
        // 用户积分加一
        $user = User::find($uid);
        $user->integral += $delta;
        $user->save();

        // 记录-用户点赞在线规划-资讯-积分变化日志
        MultiplexApiController::record($uid, "op_info_id:$oii", $delta, "点赞在线规划资讯积分+{$delta}");
    }
});

/*
|--------------------------------------------------------------------------
| 用户-取消点赞在线规划资讯-积分 Filter
|--------------------------------------------------------------------------
|
|
*/

Route::filter('cfoi_integral', function($route, $request, $response)
{
    $uid = $response->original->attributes['uid'];
    // 获得被点赞任务书的id
    $oii = $response->original->attributes['op_info_id'];

    // 点赞成功后存储点赞记录，先判断是否已经存储
    $flag = DB::table('favours_tmp')
        ->where('op_info_id', $oii)
        ->where('uid', $uid)
        ->first();
    if ($flag) {
        // 取消赞成功，删除tmp数据表中存在的点赞记录
        DB::table('favours_tmp')->where('id', $flag->id)->delete();

        $now_date = date('Y-m-d', time());
        // 获取并判断用户当天总的点赞次数
        $cnt = MultiplexApiController::quantity($uid, $now_date);
        if ($cnt < 5) {
            $delta = Config::get('integral.base.favour');

            $user = User::find($uid);
            $user->integral -= $delta;
            $user->save();

            // 记录-用户取消点赞在线规划-资讯-积分变化日志
            MultiplexApiController::record($uid, "op_info_id:$oii", $delta, "取消点赞在线规划资讯积分-{$delta}");
        }
    }
});
