<?php

use Rootant\Api\Exception\ApiException;
use LucaDegasperi\OAuth2Server\Authorizer;
use Rootant\Api\Exception\ValidationException;
use Rootant\Api\Exception\EmailNotMatchException;

class UserPasswordApiController extends ApiController {

    public function __construct(Authorizer $authorizer) {
        parent::__construct($authorizer);
        $this->beforeFilter('validation');
    }

    private static $_validate = [
        'upd_pwd'       => [
            'email'                => 'required|email',
            'curr_pwd'             => 'required',
            'new_pwd'              => 'required|confirmed|min:6',
            'new_pwd_confirmation' => 'required',
        ]
    ];

    /**
     * Update the specified resource in storage.
     *
     * @param  int  $id
     * @return Response
     */
    public function update($id)
    {
        //
    }

    /**
     * 更改用户密码
     *
     */
    public function upd_pwd() {
        $uid = intval($this->authorizer->getResourceOwnerId());
        $user = User::find($uid);
        $email = $user->email;
        $curr_pwd = Input::get('curr_pwd');
        $new_pwd  = Input::get('new_pwd');

        $credentials = [
            'email'    => $email,
            'password' => $curr_pwd,
        ];
        if (Auth::once($credentials)) {
            $user->password = Hash::make($new_pwd);
            $user->save();
            return $user;
        } else {
            throw new InvalidCredentialsException;
        }
    }

    /**
     * 发送验证邮件
     *
     * @throws EmailNotMatchException
     */
    public function sendEmail() {
        $email = Input::get('email');

        $user = User::where('email', $email)->first();
        $uid = $user->id;

        $confirmed = str_replace('-', '', Uuid::generate(4)->string);
        DB::table('pwd_email')->insert(
            array(
                'uid'        => $uid,
                'c_code'     => $confirmed,
                // 链接过期时间为6小时后
                'expired_in' => date('Y-m-d H:i:s', time()+6*60*60),
                'created_at' => date('Y-m-d H:i:s', time()),
            )
        );

        $username = $user->username;
        // 传递到邮件内容模板的视图变量
        $data = array('name' => $username, 'confirmed' => $confirmed);

        Mail::send('emails.view', $data, function($message) use ($email, $uid)
        {
            $message->to($email)->subject('重设密码');
        });

    }

    /**
     * 重置密码
     *
     * @throws ApiException
     * @throws ValidationException
     */
    public function resetPassword() {
        $confirmed = Input::get('confirmed');
        if (!$confirmed) {
            return Redirect::to('/');
        }
        if (Request::getMethod() == 'GET') {
            return View::make('password.reset');
        }
        if (Request::getMethod() == 'POST') {
            $new_pwd   = Input::get('new_pwd');
            $validator = Validator::make([
                'confirmed'            => $confirmed,
                'new_pwd'              => $new_pwd,
                'new_pwd_confirmation' => Input::get('new_pwd_confirmation'),
            ], [
                'confirmed'            => 'required',
                'new_pwd'              => 'required|confirmed|min:6',
                'new_pwd_confirmation' => 'required',
            ]);
            if ($validator->fails())
            {
                return Redirect::action('UserPasswordApiController@resetPassword', array('confirmed'=>$confirmed))->withErrors($validator);
            }
            // 获取重置密码链接的相关信息
            $data = DB::table('pwd_email')->where('c_code', $confirmed)->first();
            if (!$data) {
                return Redirect::action('UserPasswordApiController@resetPassword', array('confirmed'=>$confirmed))->withErrors(array('errors' => 'invalid request'));
            }
            // 判断链接是否失效
            if(time() > strtotime($data->expired_in)) {
                return Redirect::to('password/find');
            }else {
                // 链接有效
                $uid = $data->uid;
                // 手动开启一个事务
                DB::beginTransaction();
                try {
                    // 更新用户密码
                    DB::table('users')
                        ->where('id', $uid)
                        ->update(array('password' => Hash::make($new_pwd)));
                    // 删除重置密码链接对应的数据
                    DB::table('pwd_email')->where('id', $data->id)->delete();
                    // 提交事务
                    DB::commit();
                    // TODO
                    return Redirect::to('/');
                } catch (\Exception $e) {
                    // 回滚事务
                    DB::rollback();
                    return Redirect::action('UserPasswordApiController@resetPassword', array('confirmed'=>$confirmed))->withErrors(array('errors' => 'unknown error'));
                }
            }
        }
    }

    /**
     * 找回密码
     *
     * @throws EmailNotMatchException
     * @throws ValidationException
     */
    public function forgotPassword()
    {
        if (Request::getMethod() == 'GET') {
            return View::make('password.find');
        }
        if (Request::getMethod() == 'POST') {
            $rules =  array(
                'captcha' => 'required|captcha',
                'email'   => 'required|email'
            );
            $validator = Validator::make(Input::all(), $rules);
            if ($validator->fails())
            {
                return Redirect::to('password/find')->withErrors($validator);
            }
            else
            {
                // 发送验证邮件
                $this->sendEmail();
                echo('<script>if(confirm("验证邮件已发送，请注意查收并根据邮件内容重新设置您的密码！")) window.location.href="/password/find"</script>');
            }
        }
    }
}
