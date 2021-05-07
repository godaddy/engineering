---
layout: post
title: GoDaddy and AWS join forces to release a Serverless plugin for use with AWS Service Catalog
date: 2021-05-07 13:00:00 -0700
cover: /assets/images/serverless-aws-servicecatalog-plugin/cover.jpg
excerpt: The serverless-aws-servicecatalog plugin provides developers with the power of Serverless deployments while allowing companies to maintain governance over AWS resources by using AWS Service Catalog. This is one step on the path to unlock the power of no-managed-resource applications for enterprise uses. By taking advantage of higher order abstractions over CloudFormation, such as Service Catalog, teams working with self-created and managed custom products can also make use of Serverless to develop, maintain and deploy these innovative new runtimes.
options:
  - full-bleed-cover
authors:
  - name: John Smey
    title: Senior Software Engineer
    url: https://www.linkedin.com/in/john-smey
---

The serverless design pattern made possible by Amazon API Gateway and AWS Lambda allows developers to build and run applications without having to maintain any persistent infrastructure. Serverless applications are becoming increasingly popular as more organizations move to cloud providers.  Some of the core use cases for serverless applications include: auto-scaling web-sites and APIs, event processing and streaming, image or video processing and CICD.

The serverless architecture is a good fit for applications that fit the following criteria: 
1. You want the cloud provider to manage resources, availability and scaling
2. Some per-request latency isn’t a problem
3. You only want to pay for resources in active use

On AWS, a serverless application typically consists of a VPC, an API Gateway, a Lambda function and an IAM role.

![Serverless API Architecture]({{site.baseurl}}/assets/images/serverless-aws-servicecatalog-plugin/serverless-lambda-apigateway.png)

Deploying a serverless project can be complicated. The initial setup involves setting up API Gateway proxies to connect to the Lambda and configuring the correct permissions on the Lambda function. Testing Lambda code locally can be difficult as simulating the execution environment of AWS Lambda can be tricky.  Deploying code changes requires packaging the code, uploading the package to S3 and updating the function to use the new package. It can be even more complicated to manage if you’re attempting to do all this in AWS CloudFormation.

Many frameworks have been developed to manage serverless deployments. [Serverless](https://serverless.com) is one of the most popular. It takes care of configuring and deploying the AWS services and allows developers to test code locally and to easily package and deploy code changes. It does this by allowing developers to use the web framework and language of their choosing, and then, uses clever mapping and packaging mechanisms to ensure that the resulting deployment on AWS is functionally equivalent to what the developer sees locally.

## Infrastructure as Code
In AWS, the design principle of "infrastructure as code" is achieved by using CloudFormation templates to deploy products. AWS CloudFormation allows you to provision infrastructure using AWS-managed automation and a declarative resource description language. It works well for a single developer, but organizations may want to standardize and control how products are deployed by using AWS Service Catalog. Service Catalog allows organizations to create a catalog of products and services that are approved for use on AWS. It also allows the creation of large complex products by combining other products. For example, you might create a serverless Service Catalog product that consists of a Lambda, API Gateway and IAM products. Service Catalog allows organizations to share and iterate on these complex product definitions while maintaining governance of the usage of the underlying products.

## Serverless and Service Catalog

**Serverless** generates a CloudFormation template which is used to deploy the AWS products required by a Serverless application. This will not work for developers that are restricted to using only Service Catalog products. 

To solve this problem, GoDaddy and AWS joined forces to create the [serverless-aws-servicecatalog](https://github.com/godaddy/serverless-aws-servicecatalog) plugin. This plugin allows an AWS admin to deploy a custom serverless product in Service Catalog. This product ID is then added to the Serverless configuration file. The plugin overrides the Serverless package:compileFunctions hook and inserts the CloudFormation templates from the specified Service Catalog product.

## Workflow
In order to implement a project using Serverless with the serverless-aws-servicecatalog plugin, each different role in the deployment has a small number of steps to complete.

### Service Catalog Admin:

Create a Serverless Service Catalog CloudFormation template to create the Service Catalog product. The templates directory in the plugin contains a sample product configuration


### Developer:

1. Install the Serverless framework
    ```
    npm install -g serverless 
    ```


2. Create a Serverless project and add the plugin.
    ``` 
    serverless create --template aws-nodejs
    npm install serverless-aws-servicecatalog
    ```

3. Update the serverless.yml file to use the plugin and Service Catalog product.
    ```
    plugins:
        modules:
            - serverless-aws-servicecatalog
    ```
    ```
    provider:
        name: aws
        runtime: nodejs8.10
        deploymentBucket: my-template-bucket    # S3 bucket to deploy to (must exist)
        scProductId: prod-lxppsgzoseisw         # the Service Catalog product Id
        scProductVersion: "v1.0.0"               # the Service Catalog product version
    ```

4. Run the following to create the stack.
    ```
    serverless deploy 
    ```

Developers can then write CICD tools to encapsulate stages of this process and automate the deployment and management of their serverless services.

### Summary

The serverless-aws-servicecatalog plugin provides developers with the power of Serverless deployments while allowing companies to maintain governance over AWS resources by using AWS Service Catalog. This is one step on the path to unlock the power of no-managed-resource applications for enterprise uses. By taking advantage of higher order abstractions over CloudFormation, such as Service Catalog, teams working with self-created and managed custom products can also make use of Serverless to develop, maintain and deploy these innovative new runtimes.
 