<?php

/**
 * 互动交流-群组-数据模型
 */
class InterConmuGroup extends Eloquent
{
    /**
     * The database table used by the model.
     *
     * @var string
     */
    protected $table = 'ic_groups';

    protected $touches = array('type');

    public function type() {
        return $this->belongsTo('Type');
    }

}