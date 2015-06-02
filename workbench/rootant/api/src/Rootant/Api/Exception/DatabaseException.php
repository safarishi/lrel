<?php

namespace Rootant\Api\Exception;

use Rootant\Api\Exception\ApiException;

class DatabaseException extends ApiException
{
    public function __construct()
    {
        parent::__construct('An error occured', 91001);
        $this->httpStatusCode = 500;
        $this->errorType = 'server_error';
    }
}