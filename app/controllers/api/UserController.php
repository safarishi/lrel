<?php

use Rootant\Api\Exception\ApiException;
use LucaDegasperi\OAuth2Server\Authorizer;
use Rootant\Api\Exception\EaseMobException;
use Rootant\Api\Exception\ValidationException;

class UserApiController extends ApiController
{
    public function __construct(Authorizer $authorizer) {
        $this->authorizer = $authorizer;
        $this->beforeFilter('oauth', ['except' => 'store']);
        $this->beforeFilter('oauth.checkclient', ['only' => 'store']);
        $this->beforeFilter('validation');
    }

    private static $_validate = [
        'store' => [
            'client_id' => 'required',
            'client_secret' => 'required',
            'name' => 'required|unique:users,username',
            'password' => 'required|min:6|confirmed',
            'phone' => 'required|unique:users',
            'email' => 'required|email|unique:users'
        ],
    ];

    /**
     * 获取当前用户信息
     * @return Response
     */
    public function index() {
        return $this->show('~me');
    }

    /**
     * 创建新用户-用户注册
     *
     * @return Response
     */
    public function store() {
        // 获取请求参数
        $email   = Input::get('email');
        $name   = Input::get('name');
        $phone   = Input::get('phone');
        $raw_pwd = Input::get('password');
        DB::beginTransaction();
        $id = DB::table('users')->insertGetId(
            array(
                'username'   => $name,
                'email'      => $email,
                'phone'      => $phone,
                'password'   => Hash::make($raw_pwd),
                'avatar'     => '/statics/images/avatar/default.jpg',
                // 存储创建时间
                'created_at' => date('Y-m-d H:i:s'),
            )
        );
        if ($id) {
            // 获取授权需要的参数
            // $options = Config::get('auth.options');
            // $easemob = new Easemob($options);
            // $rst = $easemob->accreditRegister(array('username' => $id, 'password' => $raw_pwd));
            // $rst_decoded = json_decode($rst);
            // if (isset($rst_decoded->error)) {
            //     DB::rollback();
            //     throw new EaseMobException($rst_decoded->error);
            // }
            // $uuid = json_decode($rst)->entities[0]->uuid;
            // // update uuid
            // DB::table('users')->where('id', $id)->update(array('uuid' => $uuid));
            DB::commit();
            return User::find($id);
        }
        DB::rollback();
        throw new ApiException;
    }

    /**
     * 获取用户信息
     *
     * @param  mixed  $id
     * @return Response
     */
    public function show($id = '~me') {
        if ($id == '~me') {
            $id = $this->authorizer->getResourceOwnerId();
        }
        $user = User::select('id', 'integral', 'avatar', 'username', 'gender', 'org', 'position', 'created_at', 'updated_at')->find($id);
        return $user;
    }

    /**
     * 更新用户信息
     *
     * @return Response
     */
    public function update() {
        $id = $this->authorizer->getResourceOwnerId();

        $validator = Validator::make(Input::all(), [
            'username' => 'unique:users,username,'.$id.',id|min:2',
            'gender' => 'in:1,2'
        ]);

        if ($validator->fails()) {
            $messages = $validator->messages()->all();
            throw new ValidationException($messages);
        }

        $user = User::select('id', 'username', 'avatar', 'gender', 'org', 'position', 'updated_at')->find($id);
        $allowedFields = ['gender', 'org', 'position', 'username', 'avatar'];
        array_walk($allowedFields, function($item) use ($user, $id) {
            $v = Input::get($item);
            $avatar = Input::file('avatar');
            if ($v && $item !== 'avatar') {
                $user->$item = Input::get($item);
            }
            if (Input::hasFile('avatar')) {
                $user->avatar = UserAvatarApiController::uploadAvatar($id);
            }
        });
        $user->save();
        return $user;
    }

}
