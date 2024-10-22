---
layout: post
title: "How GoDaddy uses the Global Tech Registry Platform to Track Resources and Services in AWS"
date: 2022-09-29 00:00:00 -0700
cover: /assets/images/track-aws-resources-using-globaltechregistry/cover.jpg
options:
  - full-bleed-cover
excerpt: Global Tech Registry (GTR) is a metadata registry service that provides insight into GoDaddy's AWS Cloud deployments. By combining metadata from various sources with active AWS health events, GTR is able to immediately discover the impact on GoDaddy products and notify the relevant teams with impacted services.
keywords: globaltechregistry, gtr, cloud operations, goDaddy metadata registry, Observability, aws service outage, aws resources discovery, aws health events, aws config, aws lambda, sns, sqs
canonical: https://godaddy.com/resources/news/track-aws-resources-using-globaltechregistry
authors:
  - name: Jan-Erik Carlsen
    title: Principal Software Engineer
    url: https://www.linkedin.com/in/janerikcarlsen, https://github.com/janerikcarlsen, https://twitter.com/janerikcarlsen
    photo: /assets/images/jan-erik.jpeg
  - name: Naser Bikas
    title: Software Engineering Manager
    url: https://www.linkedin.com/in/bikasbd
    photo: /assets/images/bikas.jpg
  - name: Ketan Patel
    title: Senior Director - Software Development
    url: https://www.linkedin.com/in/kpatel3
    photo: /assets/images/ketan.jpg
---


## Background

In early 2018, GoDaddy began a [cloud migration journey](https://www.godaddy.com/engineering/2021/05/07/godaddys-journey-to-the-cloud) to move the company from on-prem data centers to the cloud, using AWS as a service provider. The transition to AWS was an important one for the company. It enabled GoDaddy teams to:
* build better experiences and products for our customers.
* iterate faster.
* run our products more reliably.
* provide better response times by having computing power closer to our customers.

The journey started from scratch, beginning with an entire migration and enablement strategy, and ending with executing on its delivery. Today, the Cloud Platform organization at GoDaddy manages over 2000 AWS accounts across multiple AWS Organizations for more than 300 projects across the company.

GoDaddy uses AWS Organizations to manage its multi-account setup, providing an array of benefits like streamlined access controls and aggregated billing, simplified access to cross-account resources, and the benefit of isolated workload environments to limit blast radius due to any service events.

While the number of teams and products migrated into AWS grew steadily, there was an equally increasing demand for improved observability into the footprint of GoDaddy’s cloud deployments. In the event of an AWS service event or outage, how would GoDaddy products be affected? How could GoDaddy create an observability platform that enables multiple stakeholders in the company to quickly identify a point of contact within impacted teams? How could the operations center quickly scope potential impact to its customers and services by filtering criteria like region and AWS services in use?


## Global Tech Registry

Over the past year, GoDaddy built and released the Global Tech Registry (GTR), an internal observability platform to provide insights into their AWS Cloud deployments. The objectives of the GTR are to:
* increase GoDaddy's observability into their AWS cloud deployments.
* create a metadata registry of the complete footprint of GoDaddy's cloud deployment landscape.
* allow auto-registration and auto-discovery of all resources and services deployed to the cloud.
* immediately discover the impact on GoDaddy products in the event of AWS service outages in specific regions.
* visually track the impact at AWS service outage event time and get regular updates as the event progresses.

The GTR is a metadata service that receives events about AWS accounts, infrastructure resources, and service endpoint information from different sources. The metadata is processed and made accessible through an API and dashboards in Kibana. Stitching metadata together enables faster response times and enhanced insights into service events as they take place, and the potential impact to its products. How does it achieve this? Let’s take a closer look at the different pieces of metadata collected by the GTR platform.


## AWS Accounts and GoDaddy Teams

The Public Cloud Portal, a developer gateway to a number of engineering services at capabilities at GoDaddy, was created out of the need to facilitate a common process to onboard and receive AWS accounts. It enables an automated process that vends a standardized GoDaddy Trusted Landing Zone (TLZ) AWS account for a team with various security and architecture best practices built in. As part of that automated account generation flow, GTR integrates with underlying APIs by subscribing to Amazon Simple Notification Service (SNS) topics and receiving an SNS message with account metadata whenever an AWS account is created or updated. An AWS Lambda function then processes the SNS messages to collect core GoDaddy team and AWS account metadata. The account metadata collected in this phase are AWS account IDs, account environment (e.g., Dev, Prod), account regions, VPCs, and network configurations. The team metadata collected in this phase are team name, budget id, budget owner, and team contact information like on-call group and email distribution list.


## AWS Resources Metadata

[AWS Config](https://aws.amazon.com/config) collects snapshots of all AWS resources deployed in GoDaddy's TLZs across all AWS organizations. Each time any AWS resource is created, updated, or deleted inside the GoDaddy TLZ account, AWS Config delivers the updated configuration states to an SNS topic inside the account that GTR subscribes to through a Config Delivery Channel. GTR then processes these config event notifications using an event-based architecture in real-time. In addition, AWS Config creates a snapshot on a regular cadence of all resources in the account for each region, which is replicated to an S3 bucket in a central logging account for ingestion.

The AWS Config events and snapshots are sent to an Amazon Simple Queue Service queue. From there, AWS Lambda functions pick up each event, process the individual resources, and store them in a DynamoDB database that can be queried and used for reporting dashboards and API access.

Some AWS resources need to be processed outside of the AWS Config pipeline because they aren't supported by AWS Config yet. For example, some Amazon Route53 resource types are discovered from the AWS accounts using Lambdas with CloudWatch Event Bridge and Python boto3 libraries.


## AWS Health API

By invoking the AWS Health API, AWS customers can retrieve relevant Service Health Events that impact AWS Services in specific regions, like the [AWS global service event in December](https://aws.amazon.com/message/12721) that impacted multiple services in the us-east-1 region.

GTR regularly polls the AWS Health API across all GoDaddy’s accounts using AWS Organizations. This allows GTR to receive and process all Health Events relevant to GoDaddy. When GTR receives a Health Event for an issue with an AWS Service (e.g., EC2) in a specific region (e.g., us-east-1), it quickly identifies the GoDaddy services, resources, accounts, and teams impacted by the Health Event. It summarizes the Health Event for the Global Operations Center (GOC) and can send an automated message to the relevant contact points. This creates an improved interface for the GOC in the event of an AWS incident because it provides a full picture of the affected services, accounts, and team contact points.


## Global Tech Registry Architecture High-Level Overview

The diagram below shows a high-level overview of the GTR architecture.

![GTR Overview]({{site.baseurl}}/assets/images/track-aws-resources-using-globaltechregistry/gtr-high-level-overview.png "GTR Overview")


## Accessing the Global Tech Registry

Internal GoDaddy teams can access the registry’s data through the GTR APIs or Kibana dashboards that help quickly visualize various data points. Access to the API is managed per endpoint, and [Kibana Spaces](https://www.elastic.co/guide/en/kibana/master/xpack-spaces.html) is used to provide granular access to the relevant Kibana dashboards, visualizations, and indices from Elastic to further distill the user experience to relevant datasets based on each persona. All access is programmatically handled as part of a workflow in GitHub and deployed through standard CI/CD pipelines.

So far, GoDaddy has achieved several benefits to multiple different personas using the GTR:
* The GOC and individual product teams now have an improved interface to get the full picture of the affected services, accounts, and contact points in the event of an AWS Service incident.
* The individual product teams across GoDaddy receive timely notifications for important account-specific issues, notifications, and scheduled maintenance for their AWS accounts.
* The AWS Technical Account Managers working with GoDaddy have additional tooling to determine business impact and find contact information during an AWS Service event to summarize and escalate to AWS service teams as needed.
* The Security teams have dashboards and API access to retrieve information about compromised resources in the event of a breach.
* The Security teams can query AWS resource data to verify that all eligible teams are running the relevant security scans in their AWS accounts.
* The Data Platform teams can pull platform usage metrics and adoption information for data producers and consumers in  the company.
* The SRE teams can pull resource information to sync with ServiceNow CMDB for certain inventory types.
* The Cloud Platform teams have a better tool to audit and monitor components of the AWS infrastructure and usage.


## What's Next?

The GoDaddy GTR team is working on the next phase of GTR, which will include service dependency mapping in addition to accounts, resources, and health metadata. GoDaddy uses [Elastic APM](https://www.elastic.co/observability/application-performance-monitoring) as part of all applications for telemetry and tracing. By combining trace data from Elastic APM and AWS resource metadata from all the AWS Accounts, GTR will be able to automatically discover the services and their dependencies running across AWS accounts. This will give an even more detailed picture of the impact GoDaddy is seeing in the event of outages. Stay tuned for a second installment to this blog post about this feature in the near future!



_Cover Photo Attribution: Photo by unsplash: https://unsplash.com/photos/Q1p7bh3SHj8_
