---
layout: post
title: API Gateway at GoDaddy
date: 2023-11-16
cover: /assets/images/api-gateway/cover.jpg
options:
  - full-bleed-cover
summary: We go over a new API Management initiative at GoDaddy using a self-serve API Gateway.
keywords: godaddy, api gateway, api management, envoy, oauth2, authentication, authorization, rate limiting, observability
authors:
  - name: Carsten Blecken
    title: Sr. Principal Engineer
    url: https://www.linkedin.com/in/cblecken/
    photo: /assets/images/cblecken.png
  - name: Praveen Alavilli
    title: VP Engineering
    photo: /assets/images/palavilli.png
---


From domain registrations to commerce, GoDaddy is known to be the platform that entrepreneurs build their businesses on. There's an obvious need to provide simple and great user experiences through web and mobile so our customers (and their customers) can access all the services we offer.

While GoDaddy is the leader in registering domains for individual businesses, there is a large but lesser-known customer base of resellers and partners that rely on GoDaddy. These resellers and partners use different GoDaddy APIs to build their own offerings for various niche markets. The need to provide quality APIs to this group is essential for our customers to expand the reach of our solutions. 

We laid the foundations for new omnichannel commerce solutions from GoDaddy in 2021 by building, consolidating, and optimizing various commerce services as a single, unified platform. This unified commerce platform drives all of our commerce solutions across all channels. Following standard modeling and design techniques like domain-driven design and an API-first approach has helped standardize all of our APIs and establish consistent authentication (authn) and authorization (authz) patterns. This ultimately led to building a common entry point for all our APIs to enforce consistent patterns and manage all APIs from a single location.

## Goals

An API gateway is a well-established pattern for centralized API management. API management generally includes aspects of:
- access control and security enforcement,
- usage policies and configurations,
- billing and metering,
- service level objective and service level agreement enforcement, and
- routing and observability of API requests.

Given these broad functional areas, it is important to define the core requirements for our design.

At GoDaddy, we began building our API Gateway with the following goals:
- A consistent API user experience - Provide a single user-endpoint and allow it to expose the service ‘zoo’ as a coherent set of APIs.

- Policy-control enforcement - Apply company-wide policy broadly, such as enforcing an authn and authz method and setting necessary rate limits and security controls.

- Self-service for service owners - Expose services through the gateway in a simple manner, ideally only involving the service team. The service team has the best overview of how the service should be exposed. If they can manage their service registration independently, the administrative overhead is minimal.

- Future-proof - Anticipate future developments so the technology stack and overall solution can evolve easily to support future needs. One area is modern protocol support, such as HTTP/2 and gRPC.



## Choosing the technology stack
One of the biggest decisions we needed to make in order to accomplish the goals we set was whether we wanted to use an off-the-shelf API gateway or build our own. We evaluated different options using the lightweight architecture alternative assessment method and ultimately chose an [Envoy](https://www.envoyproxy.io/) proxy-based solution.

Envoy has very good runtime behavior in terms of stability and memory use, and it scored very well with its dynamic configuration interfaces. These dynamic Envoy interfaces allow the solution to configure a new service without the need to do any deployments or component restarts. This is a major advantage of Envoy over other off the shelf L7 proxies.

Envoy also allowed us to externalize the authn and authz interface. This solution gave us the flexibility to implement standard OAuth 2.0 and support a myriad of ‘legacy’ Godaddy specific authn approaches.

At GoDaddy, Envoy was already successfully implemented as the ‘Front Door’ edge proxy technology for all of our web sites on [godaddy.com](https://www.godaddy.com/), serving millions of requests per day. This internal experience and expertise with Envoy was an important criterion for us and has quickly helped in establishing the technical foundation for the API gateway.


## Features

We had to implement several authn methods to support a wide range of existing GoDaddy proprietary authn protocols and also support more common industry standards such as OAuth 2.0. The broad support for authn methods helped in not only enabling the existing services to seamlessly migrate behind the new API Gateway with little to no effort, but also immediately gave us the benefit of more modern authn and authz protocol support through OAuth 2.0 in new service implementations. Additionally, we also had the requirement to authorize the OAuth 2.0 scopes in order to support the full OAuth 2.0 specification.

We had a policy mandate to implement API rate limiting. We were able to implement both service-level and client-level rate limiting, taking into consideration various parameters like client IP addresses and business and store identifiers. The service-level rate limiting allows us to protect our upstream services from being flooded with too many requests. This rate limit can be adjusted by the service owners themselves through a UI. The client-level rate limiting helps lay the foundations for metering of API calls for future, potential monetization opportunities based on business needs. This has been primarily supported for the OAuth 2.0 based `client_id`.

To support the self-service objective, we designed our internal services developer portal (also called service registry), where service owners can register their services and configure essential routing and security properties. This component is the centerpiece of the externalized configuration interface for service owners. This functionality was implemented as a RESTful API first to facilitate more automated CICD processes.

The following is a sample API request to add a new service:
```
POST /services
{
  "name": "nerftoy-service",                           -- unique service name
  "displayName": "Nerftoy Service (dev)",
  "routeEndpoint": "nerftoy.api.commerce.dev-godaddy.com", -- service endpoint
  "criteria": [
    {
      "pathRegex": "/v1/commerce/stores/.*/nerftoy”. – incoming path to forward
    }
  ],
  “limitUnit”: “second”,       -- unit of time measurement for rate limit
  “limitCount: “10”,           -- value of time measurement for rate limit
  "swaggerDocPath": "/api-spec",
  "serviceSlackChannel": "#mcc-platypus",
  “pathRewritePrefix”: “/v1/auxservice/nerftoys”
}
```


In addition to the REST API outlined above, there's also a GUI available. In fact, this is the most common way our service owners manage their service gateway configuration. The GUI is implemented as a React application using an open source framework created at GoDaddy called [Gasket](https://gasket.dev/#/).

The following is a screenshot of the GUI used to register a service:

![Service Registry]({{site.baseurl}}/assets/images/api-gateway/ServiceRegistration.png)

The following table describes the fields in the GUI used to register a service:

| Field           | Description                                               |
|-----------------|-----------------------------------------------------------|
| Name            | The unique name of the service.                           |
| Display Name    | A human-readable name that displays.                      |
| Route Endpoint  | The domain address of the endpoint (without the gateway). |
| Path type       | The type of path (prefix or regex).                       |
| Path            | The path expression ('/v1/myservice').                    |
| Methods         | The standard HTTP method(s).                              |
| Headers         | The HTTP header(s).                                       |
| Query Params    | The HTTP query parameter(s).                              |
| Limit Count     | The number value for the rate limit count.                |
| Limit Unit      | Unit of time (second, minute, hour, or day) for the count.     |



## Architecture



The following diagram and sections illustrate and describe the primary components of the API gateway implementation.

![API Gateway Architecture]({{site.baseurl}}/assets/images/api-gateway/CGWArchitecture.png)


### Environment

Running Envoy inside [Amazon Elastic Kubernetes Service](https://aws.amazon.com/eks/) allowed us to manage infrastructure better for rate limiting, observables, reporting, and other API management features. For dynamic API management, we used an open-source solution, [Gloo Edge](https://docs.solo.io/gloo-edge/). We used the standard Envoy rate limiting server for API rate limiting, which integrates quite naturally with the Envoy proxy. The gateway runs in two different AWS regions in an active – active setup, with the traffic failover provided by our edge provider, [Akamai](https://www.akamai.com/). The multi-region deployment is one of the reasons why availability is already approaching our goal of five nines.

Each region-based Kubernetes cluster is an AWS auto-scaling group, and nodes are easily scaled up through the cluster autoscaler. The cluster has three nodes in three different availability zones to maximize availability. Every 24 hours, these nodes are rotated to comply with our corporate security policy.

The gateway is set up in five different environments: 
- Experimental - the cluster used for the internal gateway development.
- Development -  the cluster used for the initial internal integration setup for services.
- Test -  the cluster that allows service owners to run their automated integration tests. 
- Staging (or OTE) - the cluster primarily used to run load and automated end-to-end tests and provides services in a production-like, highly-performing environment.
- Production - the cluster where live traffic occurs.



### Authn and authz plugin

We knew that we needed tight control over authn and authz. Based on the goals we laid out, it was natural for us to have a GoDaddy specific component for the authn and authz we called the auth plugin. Luckily, Envoy provides an [interface for an external authz protocol](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/security/ext_authz_filter.html), which communicates through GRPC with the Envoy server. While a direct Envoy filter could have been used for this, the external plugin allows us to use a different language and mimimize the build efforts.

Our external plugin looks at the HTTP authn header token, finding out the authz scheme used, and pulls the information needed to verify it from a remote server. For example, for OAuth 2.0 authn, the standardized JSON Web Key Set is retrieved, and with these keys, the token can be verified, including the associated scope information in the token for authn.

After successful authn, HTTP headers are added identifying the user (for OAuth 2.0 the `GODADDY_CLIENT_ID` header) and the usage tier this client ID is part of (`GODADDY_CLIENT_TIER`) to simplify the rate limiting configuration.

The verification materials from the remote server have to be cached. For now, the gateway employs a local cache that refreshes after a certain amount of time (time to live), but we are planning to implement a distributed cache in place for the future in order to avoid having multiple copies of the verification information in the local caches.

### Rate limit server

Another requirement was to employ rate limiting as a policy measure. This was another reason why Envoy was a good fit for us, since it included a rate limit server out of the box with a flexible configuration API suitable for highly specialized rate limit schemes.
Two particular rate limit options have been implemented so far. First, there is the standard route level rate limiting, which allows each upstream service to limit the request influx depending on its available resources. This is a very common way of rate limiting, which protects each registered service at the end of a route from being overloaded.
The other rate limiting scheme implemented provides a rate by OAuth client ID. This ensures a single client can't hog the entire system and sets the foundation to provide a level of quality of service to users. This rate is calculated for all services and uses the client tier header we previously discussed to understand the rates supported for each client. We have a future goal to provide an additional rate limit type by route and client ID, where a particular client on a particular service will have a very specific rate defined.


### Service registry

The service registry has been implemented as a straightforward REST application running inside the main Kubernetes cluster. It is exposed through a different proxy than the main customer traffic and only allows internal GoDaddy users access since these correspond to our current service providers. The configuration information (mainly the service registration) is stored in [Amazon DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html), which is automatically replicated to the other active region. This way, the synchronization of configuration is managed, and the durability of the configuration information is enhanced.
For easier configuration of the Envoy proxy, we are making use of GlooEdge, which is a useful utility mapping the complex Envoy configuration as Kubernetes custom extensions or custom resource descriptors. This allows structured access to configuration items as well as better configuration validation, which is then synced by GlooEdge with the Envoy dynamic configuration interfaces (the [‘xDS’ APIs](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/operations/dynamic_configuration)). These interfaces are key to the instance configuration updates at runtime.



### Observables

The gateway uses [Fluent Bit](https://fluentbit.io/) to scrape the relevant logs from all the Kubernetes components and adds them to a [Prometheus](https://prometheus.io/) server for various time snapshots. These are fed into our [Grafana dashboards](https://grafana.com/grafana/dashboards/) to permit insights into the operational state of the system over time. This is the view exposed to the development and SRE teams, and it includes primary statistics in terms of request traffic as well as the overall state of the Kubernetes cluster in terms of resources (CPU, memory, and storage).

For more analytical needs by the service owners, we provide sharable [Kibana dashboards](https://www.elastic.co/kibana/kibana-dashboard). To accomplish this, several of the Fluent Bit logs (in particular, the web logs from the Envoy proxy and the logs from the auth plugin) also make it into our [Elasticsearch](https://www.elastic.co/) backend. From there, we provide a Kibana dashboard for each service. These include the number of service requests over time, the service response times, and the service error rates. The service-specific Kibana dashboard is shared with the service owners as an input for the overall SLA of the service. The data in Elasticsearch is kept longer and therefore allows displaying of longer-term trends.


### Deployment

There is a saying that each software solution is only as good as its automation support. This was the reason that substantial effort went into the CICD framework for the gateway solution. We used GitHub workflows for both the deployment of single artifacts and the entire solution.

Using GitHub workflows allowed tight integration with the development processes, like automatically running unit tests when a new check-in happens. When a pull request (PR) is created, the set of unit test runs, and the output is published. Once a PR is approved, the tests are automatically run, and if successful, deployment of artifacts into the lower environments is executed.

Deployment into the upper environments still requires a manual kickoff, largely due to the need for some extra testing (like a load test we execute on the staging environment). We've implemented a ‘sample’ service, which we usually spin up before we run a registration, and then use a load client based on the [Locust library](https://docs.solo.io/gloo-edge/latest/) to understand the impact of the changes.



## Conclusion

Our API Gateway has been in production since the beginning of summer 2023, proxying millions of requests per day to various GoDaddy commerce services like Orders, Product Catalog, Customers, Payments, and more. Other GoDaddy services from different domains are in the process of integrating or migrating to the API gateway – paving the way for a single, unified entry point for all GoDaddy services for partners and developers.
