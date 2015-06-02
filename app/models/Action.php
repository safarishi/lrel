<?php

class Action extends Eloquent
{
    protected $table = 'action';

    public function parseAction($action = null, $self)
    {
        if (empty($action)) {
            return false;
        }

        $actionModel = Action::select('*');
        //参数支持id或者name
        if (is_numeric($action)) {
            $actionModel->where('id', $action);
        } else {
            $actionModel->where('name', $action);
        }

        //查询行为信息
        $info = $actionModel->first()->toArray();

        if (!$info || $info['status'] != 1) {
            return false;
        }

        // 解析规则:table:$table|field:$field|condition:$condition|rule:$rule[|cycle:$cycle|max:$max][;......]
        $rules = unserialize($info['rule']);
        foreach ($rules as $key => &$rule) {
            foreach($rule as $k=>&$v){
                if(empty($v)){
                    unset($rule[$k]);
                }
            }
            unset($k,$v);
        }
        unset($key,$rule);

    /*    $rules = str_replace('{$self}', $self, $rules);
        $rules = explode(';', $rules);
        $return = array();
        foreach ($rules as $key => &$rule) {
            $rule = explode('|', $rule);
            foreach ($rule as $k => $fields) {
                $field = empty($fields) ? array() : explode(':', $fields);
                if (!empty($field)) {
                    $return[$key][$field[0]] = $field[1];
                }
            }
            //cycle(检查周期)和max(周期内最大执行次数)必须同时存在，否则去掉这两个条件
            if (!array_key_exists('cycle', $return[$key]) || !array_key_exists('max', $return[$key])) {
                unset($return[$key]['cycle'], $return[$key]['max']);
            }
        }*/

        return $rules;
    }
}