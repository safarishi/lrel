<?php

use Illuminate\Routing\Controller;
use LucaDegasperi\OAuth2Server\Authorizer;

class OAuthApiController extends ApiController
{
    protected $authorizer;

    public function __construct(Authorizer $authorizer) {
        $this->authorizer = $authorizer;
    }

    public function postAccessToken() {
		return $this->authorizer->issueAccessToken();
    }

}
