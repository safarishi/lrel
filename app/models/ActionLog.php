<?php

class ActionLog extends Eloquent
{
    protected $table = 'action_log';

    /**
     * 记录行为日志，并执行该行为的规则
     * @param  string $action 行为标识
     * @param  string $model 触发行为的模型名
     * @param  int    $record_id 触发行为的记录id
     * @param  int    $user_id 执行行为的用户id
     * @return mixed
     */
    public function actionLog($action = null, $model = null, $record_id = null, $user_id = null)
    {
        //参数检查
        if (empty($action) || empty($model) || empty($record_id) || empty($user_id)) {
            return '参数不能为空';
        }

        //查询行为,判断是否执行
        $action_info = Action::where('name', $action)->first()->toArray();
        if ($action_info['status'] != 1) {
            return '该行为被禁用或删除';
        }

        //插入行为日志
        $data['action_id'] = $action_info['id'];
        $data['user_id'] = $user_id;
        $data['action_ip'] = ip2long($this->getRealIP());
        $data['model'] = $model;
        $data['record_id'] = $record_id;
        $data['create_time'] = LARAVEL_START;

        //解析日志规则,生成日志备注
        if (!empty($action_info['log'])) {
            if (preg_match_all('/\[(\S+?)\]/', $action_info['log'], $match)) {
                $log['user'] = $user_id;
                $log['record'] = $record_id;
                $log['model'] = $model;
                $log['time'] = LARAVEL_START;
                $log['data'] = array('user' => $user_id, 'model' => $model, 'record' => $record_id, 'time' => LARAVEL_START);
                foreach ($match[1] as $value) {
                    $param = explode('|', $value);
                    if (isset($param[1])) {
                        $replace[] = call_user_func($param[1], $log[$param[0]]);
                    } else {
                        $replace[] = $log[$param[0]];
                    }
                }
                $data['remark'] = str_replace($match[0], $replace, $action_info['log']);
            } else {
                $data['remark'] = $action_info['log'];
            }
        } else {
            //未定义日志规则，记录操作url
            $data['remark'] = '操作url：' . $_SERVER['REQUEST_URI'];
        }

        $log_id = ActionLog::insertGetId($data);

        if (!empty($action_info['rule'])) {
            //解析行为
            $actionModel = new Action;
            $rules = $actionModel->parseAction($action, $user_id);
            //执行行为
            $actionLogModel = new ActionLog;
            $res = $actionLogModel->executeAction($rules, $action_info['id'], $user_id,$log_id);
        }
    }

    /**
     * 执行行为
     * @param array $rules 解析后的规则数组
     * @param int   $action_id 行为id
     * @param array $user_id 执行的用户id
     * @return boolean false 失败，true 成功
     */
    protected function executeAction($rules = false, $action_id = null, $user_id = null, $log_id = null)
    {
        $log_score = '';
        if (!$rules || empty($action_id) || empty($user_id)) {
            return false;
        }

        $return = true;
        foreach ($rules as $rule) {
            //检查执行周期
            $actionLogModel = new ActionLog;
            $actionLogModel->where('action_id', $action_id)->where('user_id', $user_id);
            $actionLogModel->where('create_time', '>', LARAVEL_START - intval($rule['cycle']) * 3600);

            $exec_count = $actionLogModel->count();
            if ($exec_count > $rule['max']) {
                continue;
            }
            //执行数据库操作
            $execTable = ucfirst($rule['table']);
            $execModel = new $execTable;
            $field = 'score' . $rule['field'];

            $res = $execModel->where('uid', $user_id)->where('status', 1)->increment($field, str_replace('+', '', $rule['rule']));

            $sType = D('ucenter_score_type')->where(array('id'=>$rule['field']))->find();
            $log_score .= '【' . $sType['title'] . '：' . $rule['rule'] . $sType['unit'] . '】';

            if (!$res) {
                $return = false;
            }
        }
        if($log_score){
            $actionLogModel = ActionLog::where('id', $log_id)->first();
            $actionLogModel->remark = $log_score;
            $actionLogModel->save();
        }
        return $return;
    }

    /**
     *
     * @return mixed|string
     */
    public function getRealIP()
    {
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