---
layout: post
title: Building a Scalable and Performant Website Hosting Platform in AWS
date: 2023/06/13
cover: /assets/images/hosting-in-aws/cover.jpg
options:
  - full-bleed-cover
excerpt: Learn how GoDaddy improved the performance and reliability of its on-prem Websites + Marketing hosting platform by migrating to AWS.
keywords: cloud platform, godaddy, agility, scale, aws, hosting
canonical: https://godaddy.com/resources/news/hosting-in-aws
authors:
  - name: Christopher Hinrichs
    title: Principal Software Engineer
    url: https://www.linkedin.com/in/chhinrichs/
    photo: /assets/images/chenrichs.jpg
---

GoDaddy is the world's largest services platform for entrepreneurs around the globe. We're on a mission to empower our worldwide community of over 20 million customers and entrepreneurs everywhere by giving them all the support and tools they need to grow online.

In 2019 GoDaddy launched Websites + Marketing. It integrates website building with marketing and eCommerce tools, pairs them with best-in-class guidance, and delivers easy to use tools and services to help business owners achieve their goals.

While GoDaddy Websites + Marketing was built on one of the fastest hosting platforms on the planet, we wanted to improve latency, availability, and reliability by leveraging AWS technologies. This article details how we rebuilt and rearchitected our hosting platform for Websites + Marketing from the ground up using AWS technologies.


## A brief history

GoDaddy has built several website builder products over the years, each building and refining on what we learned in the past. These products essentially consist of two distinct components: the website editor used to customize the site and the website hosting platform that serves the live site on the web. The website hosting platform for Websites + Marketing was originally built in 2013 as one of the company's first Node.js applications at scale. It leveraged Apache Cassandra as a globally-replicated and scalable data store, with Redis used for caching frequently used assets.

This stack provided excellent performance for many years, but it suffered from a couple of key drawbacks. First, because GoDaddy was running its own hardware, it became increasingly costly to scale and maintain our Cassandra clusters and Redis instances to accommodate the rapidly expanding customer base. Second, though GoDaddy has an impressive global data center presence, the largest cloud providers have a much larger global footprint, enabling teams to deploy their applications and store their data closer to their customers no matter where they reside.

## AWS architecture

We were confident that AWS provided the scalability and global presence that would allow us to improve our hosting platform's performance and availability and deliver better latency to our customers who were farther from our on-prem data centers. This section lays out the architectural decisions that we made as we migrated out system and the rationale behind those choices.

### Compute

We chose to run our Hosting Platform on Amazon EC2 Graviton instances, which provide the best price-to-performance ratio for our use case. We use Amazon Elastic Container Service (ECS) to manage our instances, which gives us the flexibility to optimize our costs and the ability to scale out to handle bursts of traffic whenever and wherever they occur. With this configuration, we are able to scale out from a few hundred to over a thousand EC2 instances in a matter of minutes and subsequently scale in when the burst subsides.

### Networking

On the networking side, our typical AWS application setup would likely include CloudFront with Web Access Firewall (WAF) in front of Application Load Balancers (ALBs). As a hosting provider, however, we need to terminate SSL for millions of domains that are routed to our platform. To support this, we leverage the Server Name Indication (SNI) extension to TLS so we receive the target hostname during the SSL handshake and our application looks up and serves the corresponding SSL certificate associated with that hostname. Because of this, we could not use a Layer 7 load balancer such as the AWS ALB and instead had to use the Layer 4 compatible Network Load Balancer (NLB).

Even though we were planning to deploy in several regions around the world, we also made the choice to leverage AWS Global Accelerator to provide even better latency to our more remote visitors. Global Accelerator provides two AnyCast IP addresses that automatically routes traffic to the nearest AWS Edge Location and uses the fast AWS backbone network to reach the nearest application region. No matter where a website visitor is located, they experience the shortest possible distance to a lightning fast network connection. Global Accelerator allows us to improve first byte latency by up to 50%, a huge benefit to customers who may not happen to be as close to our chosen regions.

### Data storage

Apache Cassandra provided us the scalability and performance that we desired for our on-prem deployment, however we chose not to use Cassandra in AWS as we wanted to use a data storage solution that was fully managed and would automatically scale for us as needed. DynamoDB (DDB) was the natural choice, as it most closely resembled Cassandra and met our replication (via Global Tables) and latency requirements. However, DDB has a 400KB per-row limit, which is not sufficient for storing our customer site pages like we were able to do with Cassandra. For this reason, we chose to store the actual website HTML as objects in S3 with bi-directional, cross-region replication enabled.

Pairing DDB and S3 provided the scalability and global replication of data that we required, but we noticed in our research (and subsequent testing) that the S3 object replication (even for small objects) was significantly slower than the DDB Global Table replication. A few extra seconds would have been tolerable, but we found that even 100KB S3 objects could take up to a minute or more to replicate to other regions. It's quite common for our customers to publish their site and immediately test it in their browser, so we knew that this delay would not be acceptable for our use cases. To solve this issue, we ended up storing the expected S3 version of each site asset in the DDB record and comparing it against the object that we got from S3. If we detect a mismatch in versions, we read directly from the S3 instance in the remote region where the asset was last written so that we avoid serving stale content.

### Caching

Redis caching helped us achieve excellent latency (~10ms) in our on-prem system. Even cache misses were fast (~30ms) due to Cassandra's impressive read performance. However, with the introduction of S3 we now had a data store which was an order of magnitude slower than our previous solution, making cache misses significantly more costly.

To avoid the latency penalty inherent in using S3, we leveraged ElastiCache Redis as a caching layer for our platform. ElastiCache gives us the flexibility to size our clusters at the region level to find the right balance between performance and cost. To keep our cache hit rates as high as possible, whenever a site asset is updated in S3 we trigger a Lambda which proactively updates any existing Redis records. We target a ~99% cache hit rate to keep latency low, and our Lambda trigger helps to keeps our cache up-to-date at all times and minimizes cache misses.

## Security

When thinking about security regarding Websites + Marketing's hosting platform, our focus has been on making sure that any sensitive data we store in our system is protected from unauthorized access, and that our system is resilient against attacks from bad actors looking to disrupt our service and take down our customers' sites.

### Data protection

Making sure our customer data is secure is always our top priority at GoDaddy. For our Websites + Marketing platform, this protection starts with leveraging the built-in at-rest encryption that AWS provides for S3 and DDB data. We then take the additional step of using application-level encryption with automatic key rotation for any sensitive customer or website information to make sure private customer data can't be read, even if it's somehow accessed.

### Distributed Denial-of-Service

The most common attack that we face as a hosting provider is a distributed denial-of-service (DDoS) attack. This is when a bad actor or set of bad actors attempts to overwhelm our system by spamming us with lots of requests from a variety of IP addresses. Typically, these attacks are directed against a particular domain in an attempt to take down the targeted website. Our hosting platform uses a number of strategies to mitigate these attacks and keep our customers' websites up and available to their users.

The first defense against attack occurs at the edge, where we have enabled AWS Shield Advanced on our Global Accelerator endpoints. This service automatically detects and protects against the most common infrastructure layer DDoS attacks. Stopping abuse at the edge is critical as it prevents these attacks from hitting our application servers and affecting our ability to serve legitimate customer traffic.

Of course Shield Advanced can't detect and block all illegitimate traffic, so some of it will make its way to our application. Using the Application Auto Scaling functionality of Amazon ECS allows us to quickly scale out our application capacity in any region at any time. This can help us absorb bursts of traffic, both legitimate and abusive alike. We configured Warm Pools to make sure that the scale out happens quickly and seamlessly, allowing us to absorb additional traffic when it occurs, and rapidly scale back in once it recedes.

Scale out occurs when our application servers are under increased load, causing CPU and memory usage to increase and trigger the expansion. Our application is constantly monitoring the amount of traffic it receives from different client endpoints, and tracks any traffic that seems to be generating more than a reasonable quantity of requests. If we detect an IP or set of IPs appearing to generate a considerable load, we have the ability to block these specific bad actors at the edge and to make sure they are not able to compromise application access for legitimate clients.

In practice, what we've seen with large-scale attacks is our application quickly scales out to absorb the load. As we begin to identify the bad actors and start blocking them at the edge, the traffic begins to fall at the application layer. Typically within an hour, our scale-in occurs and operations are back to normal with no negative impact on our legitimate traffic performance metrics.

## Results and conclusion

Our Websites + Marketing hosting platform running in AWS is serving millions of websites to tens of millions of customers around the globe with excellent reliability and performance. Below you can see our Availability and Response Time metrics over the last 7 and 30 day periods based on our monitoring using Site24x7:

![Site24x7 7 Day Results]({{site.baseurl}}/assets/images/hosting-in-aws/site24x7-7.png)

![Site24x7 30 Day Results]({{site.baseurl}}/assets/images/hosting-in-aws/site24x7-30.png)

Based on performance data from [Is my host fast yet?](https://ismyhostfastyet.com/), we are the fastest host that is being tracked:

![isMyHostFastYet Results]({{site.baseurl}}/assets/images/hosting-in-aws/isMyHostFastYet.png)

It's clear based on our results that AWS provided us with the tools necessary to build a best-in-class web hosting platform. We continue to monitor and improve our application and infrastructure to provide the very best foundation upon which our customers can build successful online ventures.
