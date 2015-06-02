<?php

namespace Rootant\Api\Exception;

use Rootant\Api\Exception\ApiException;

class UserNonLoginException extends ApiException
{
    public function __construct($msg)
    {
        parent::__construct($msg, 14005);
        $this->httpStatusCode = 400;
        $this->errorType = 'invalid_user';
    }
}