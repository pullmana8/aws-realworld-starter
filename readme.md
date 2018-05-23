# ![AWS Serverless RealWorld Example App](logo.png)

> Example Serverless+Typescript codebase that adheres to the [RealWorld](https://github.com/gothinkster/realworld-example-apps) API spec and opinionated patterns of the [aws-ts-starter](https://github.com/bakerstreet-industries/aws-ts-starter).

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/ec75304a9b8b494aaa6cf821e106ddb3)](https://www.codacy.com/app/Roustalski/aws-realworld-starter?utm_source=github.com&utm_medium=referral&utm_content=bakerstreet-industries/aws-realworld-starter&utm_campaign=badger)
[![Build Status](https://travis-ci.org/bakerstreet-industries/aws-realworld-starter.svg?branch=master)](https://travis-ci.org/bakerstreet-industries/aws-realworld-starter)
[![Coverage Status](https://coveralls.io/repos/github/bakerstreet-industries/aws-realworld-starter/badge.svg?branch=master)](https://coveralls.io/github/bakerstreet-industries/aws-realworld-starter?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)

# How it works

`aws-realworld-starter` is a [serverless](https://serverless.com/) seed written in Typescript that provides the following out of the box:

* Follows [The Repository Pattern](https://msdn.microsoft.com/en-us/library/ff649690.aspx)
* Structured in a way to have features carved out into microservices
* Strives for 100% unit test coverage to encourage BDD/TDD
* Fully functional end-to-end testing of the RealWorld API spec via a Serverless YAML
* A default Repository implementation against a Dynamo DB
* An AWS handler wrapper that takes care of the API Gateway callback and error handling, either by thrown errors or by caught promises

# Getting started

1. Fork / Clone this repository
1. Install the AWS CLI - `npm install -g aws`
1. Install the Serverless CLI - `npm install -g serverless`
1. Run `npm install` in your working directory
1. Configure your AWS CLI - `aws configure` with your `aws_access_key_id` and `aws_secret_access_key`
1. Create a JWT signing secret in the AWS System Manager's Parameter Store:
    * Parameter name: `real-world-auth-jwt-secret`
    * Gogo: https://console.aws.amazon.com/systems-manager/parameters/create?region=us-east-1
    * [![jwt-secret example](ssm.png)](https://console.aws.amazon.com/systems-manager/parameters/create?region=us-east-1)

TODO: Serverless Generator

### Integrate with Travis CI

A .travis.yml file is already included for you. If you do not have a Travis CI account, go [here](https://travis-ci.org/). Once registered, activate your repository, navigate to settings, and add the following Environment Variables:

1. `AWS_ACCESS_KEY_ID`
2. `AWS_SECRET_ACCESS_KEY`

This seed uses AWS as the provider by default and these credentials are used to deploy and run your serverless application.

### Integrate with Coveralls

A public place to display code coverage of your API. Add this Environment Variable to your Travis CI repository's settings:

1. `repo_token` - Coveralls token for uploading code coverage report

## Running the tests

Unit tests can be run via `npm test`. If you have never run the end to end tests, or have code changes that need to be deployed before running the end to end tests, use `npm run test:e2e:deploy`, otherwise to execute the end to end tests of what is deployed to your serverless provider, use `npm run test:e2e`.

`Note: ` that when you run the deploy routine, it will run a gulp task that will automatically replace the token `[[ENDPOINT]]` in each e2e test file and replace it with the base URL of the deployed AWS api gateway.
