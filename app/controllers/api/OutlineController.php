<?php

use LucaDegasperi\OAuth2Server\Authorizer;

class OutlineApiController extends ApiController {

    public function __construct(Authorizer $authorizer) {
//        parent::__construct($authorizer);
        $this->beforeFilter('validation');
    }

    private static $_validate = [
        'store' => [
            'content' => 'required',
            'user_mobile' => 'required',
            // user_name todo
        ],
    ];

    /**
     * 提交我的纲要
     *
     * @return mixed
     */
    public function store() {
        // 获取请求参数
        $content     = Input::get('content');
        $user_name   = Input::get('user_name');
        $user_mobile = Input::get('user_mobile');
        // 获得ip地址
        $real_ip = $this->getRealIP();

        $id = DB::table('outline')->insertGetId(
            array(
                'content'     => $content,
                'user_name'   => $user_name,
                'user_mobile' => $user_mobile,
                'user_ip'     => $real_ip,
                'created_at'  => date("Y-m-d H:i:s", time()),
            )
        );

        return Outline::find($id);
    }

    /**
     *
     * @return mixed|string
     */
    function getRealIP(){
        if(!empty($_SERVER['HTTP_X_FORWARDED_FOR'])){
            $client_ip =
                ( !empty($_SERVER['REMOTE_ADDR']) ) ?
                    $_SERVER['REMOTE_ADDR']
                    :
                    ( ( !empty($_ENV['REMOTE_ADDR']) ) ?
                        $_ENV['REMOTE_ADDR']
                        :
                        "unknown" );

            $entries = explode('[, ]', $_SERVER['HTTP_X_FORWARDED_FOR']);

            reset($entries);
            while (list(, $entry) = each($entries)){
                $entry = trim($entry);
                if ( preg_match("/^([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/", $entry, $ip_list) ){
                    // http://www.faqs.org/rfcs/rfc1918.html
                    $private_ip = array(
                        '/^0\./',
                        '/^127\.0\.0\.1/',
                        '/^192\.168\..*/',
                        '/^172\.((1[6-9])|(2[0-9])|(3[0-1]))\..*/',
                        '/^10\..*/');

                    $found_ip = preg_replace($private_ip, $client_ip, $ip_list[1]);

                    if ($client_ip != $found_ip){
                        $client_ip = $found_ip;
                        break;
                    }
                }
            }
        } else {
            $client_ip =
                ( !empty($_SERVER['REMOTE_ADDR']) ) ?
                    $_SERVER['REMOTE_ADDR']
                    :
                    ( ( !empty($_ENV['REMOTE_ADDR']) ) ?
                        $_ENV['REMOTE_ADDR']
                        :
                        "unknown" );
        }
        return $client_ip;
    }

}