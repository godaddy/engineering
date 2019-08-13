---
layout: post
title: "Kubernetes Gated Deployments"
date: 2019-08-13 09:00:00 -0700
cover: /assets/images/kubernetes-gated-deployments/cover.jpg
excerpt: Kubernetes Gated Deployments is a Kubernetes controller that facilitates automatic regression testing and canary analysis on Kubernetes deployments. It is designed to augment existing deployment processes by analyzing key functionality and performance metrics associated with the application, and can detect and roll back changes if they cause undesirable behavior.
authors:
  - name: Steven Fu
    title: Software Engineer
    url: https://www.linkedin.com/in/stevenkfu
    photo: /assets/images/kubernetes-gated-deployments/stevenkfu.jpg
  - name: Satish Ravi
    title: Principal Software Engineer
    url: https://github.com/satish-ravi
    photo: /assets/images/kubernetes-gated-deployments/satish-ravi.jpg
  - name: Jacob Brooks
    title: Software Engineer
    url: https://github.com/jlbrooks
    photo: https://avatars.githubusercontent.com/jlbrooks
---

At GoDaddy, teams perform continuous deployments of their services dozens of
times a day to Kubernetes. Changes to a service may cause unintended effects
that unit and integration tests do not catch, resulting in a negative impact on
the customer experience. For example, an engineer might introduce a performance
regression that increases page load time. In this case, [it is
important](https://www.nngroup.com/articles/website-response-times/) to mitigate
the impact on customers by promptly removing the change from production.
Measuring the impact of a change and making a quick decision to roll back can be
challenging in an environment where there are many deploys each day. Existing
tools that facilitate this process require a more complex infrastructure than
our current setup that primarily uses native Kubernetes resources and
operations. For example, [Kayenta](https://github.com/spinnaker/kayenta)
requires teams to onboard to [Spinnaker](https://www.spinnaker.io/), which is
useful in some cases, but does not work well for all our DevOps patterns;
[Flagger](https://github.com/weaveworks/flagger) requires setting up an
additional service to route traffic and a webhook for custom metrics. To help
address this challenge, we designed, implemented, and open sourced an extension
for Kubernetes, called [Kubernetes Gated
Deployments](https://github.com/godaddy/kubernetes-gated-deployments), that
automates regression testing and canary analysis, and rolls back the changes if
they cause undesirable behavior. Getting started with Kubernetes Gated
Deployments is a lightweight process, and it does not require engineers to
deploy or configure additional services on their Kubernetes cluster.

## Challenges in analyzing application metrics

When changes impact application metrics, engineers need to consider if rolling
back is necessary. However, it is difficult to make data-driven decisions that
are statistically sound, and that process is often time-consuming, leading to
prolonged customer impact. Common techniques for assessing the impact of changes
on key metrics of an application's functionality and performance include
[pre-post analysis](https://www.cscu.cornell.edu/news/statnews/stnews79.pdf),
[load testing and
benchmarking](https://en.wikipedia.org/wiki/Software_performance_testing), and
[canary deploys](https://martinfowler.com/bliki/CanaryRelease.html) with manual
inspection of metrics. There are several drawbacks with these approaches:

* **They are laborious, and do not isolate and measure the impact of the change
  itself**: Manual assessments are time consuming and not scalable when teams
  are making a large number of deployments throughout the day, which also makes
  it challenging to determine the specific change that resulted in the impact on
  key metrics.
* **They are prone to human error**: Human analysis inherently leads to a
  subjective decision that can result from error or bias, and it is difficult to
  consistently determine if the metric deviations are due to random chance or
  from a deployed change.
* **They are not representative of the system under realistic circumstances**:
  For example, engineers might choose to load test using synthetic models for
  user requests, but it is difficult to ensure that those synthetic models
  produce a traffic pattern similar enough to real production traffic to
  guarantee the load test captures what engineers intend to measure.
* **It is difficult to monitor and respond to regressions in key metrics in a
  timely manner**: Teams may rely on monitors to show increased response times
  or complaints from users, but at this point the change has already adversely
  affected the customer experience, and engineers must roll back the change.

## Kubernetes Gated Deployments

To solve the problems described above, we've created Kubernetes Gated
Deployments, which we use in place of manual analysis of metrics and
intervention. It enables our engineering teams to run each deployment as a
controlled experiment. Just as teams run experiments on product metrics to test
client-side changes, they can use this Kubernetes extension to run experiments
on infrastructure and code changes to assess the impact of those changes and
detect issues by analyzing key metrics associated with the application's
functionality and performance. This system automatically analyzes the metrics
specified by engineers for the current and new versions of the application, and
either rolls back the change or promotes it to take all production traffic.
Kubernetes Gated Deployments does not require any application code changes, and
relies on native Kubernetes resources to route traffic and manage the deployed
application. It adds a new object type, called a `GatedDeployment`, that allows
engineers to specify metric sources and analysis techniques, which the
controller will use to compare versions. We designed this system to augment
existing deployment processes by comparing the deployed versions to validate
that the new one does no harm to the metrics specified in that object.

## How it works

The controller relies on Kubernetes `Deployments` to split traffic and manage
versions. Teams should configure their application as two `Deployments` and one
`Service` that routes requests to the pods of the two `Deployments`:

* A control `Deployment` that takes all traffic when no experiment is running
* A treatment `Deployment` that teams deploy new versions to, and that
  Kubernetes distributes traffic to when the experiment is running

The current implementation allows the native Kubernetes resources to perform
this traffic split, but we plan to allow for a more flexible configuration of
traffic flow in the future. As shown in the diagram below, the Kubernetes
`Service` that exposes the pods of the two `Deployments` will automatically load
balance and distribute traffic among them; this means that the number of replica
pods in each `Deployment` determines the split percentage of traffic in the
experiment. For example, if teams desire a 20% traffic split to the new version
of the application on every deployment, they might specify a configuration of
eight control replicas and two treatment replicas.

![Gated deployment path]({{site.baseurl}}/assets/images/kubernetes-gated-deployments/gated-deployment-path.svg)

When the controller detects that the treatment `Deployment` is eligible for
analysis, it will start the experiment. A treatment `Deployment` is eligible
when it meets the following conditions:

* It has a different pod spec than the control `Deployment`
* It has at least one replica

To deploy a new version and start an experiment, teams simply need to deploy to
the treatment `Deployment` with a new pod spec, which might contain a new image
tag, and the number of replicas corresponding to the proportion of traffic they
want the treatment to receive. We designed this to be similar to how teams
normally deploy their application in the absence of Kubernetes Gated
Deployments, so that they only need to make small changes to their deployment
infrastructure to support it. One limitation is that if multiple deployments
occur during an experiment, the control deployment could be multiple versions
behind the treatment; to avoid this, teams should ensure that a single
deployment and its corresponding experiment finish before a subsequent
deployment occurs.

![Architecture]({{site.baseurl}}/assets/images/kubernetes-gated-deployments/architecture.svg)

While the experiment is active, the controller periodically polls a set of
decision plugins that contain the logic for fetching and performing analysis on
functionality or performance data to determine if the treatment version is doing
harm to the metrics measured. If it is, the controller will either roll back the
treatment `Deployment` by setting the number of replicas to zero, or it will
promote the treatment by updating the control `Deployment`'s pod spec to match
that of the treatment and then scale down the treatment to zero replicas. The
controller will also set an annotation, `gatedDeployStatus`, on the treatment
`Deployment` to specify what the decision was. Teams can use this to observe the
outcome of the gated deployment or in CICD pipelines to programmatically halt
the deployment process on a failed experiment. A sample deployment process might
look like:
```
kubectl apply -f treatment-deployment.yaml

do
  gatedDeployStatus = kubectl get deploy treatment
                      -o jsonpath='{.metadata.annotations.gatedDeployStatus}'
while gatedDeployStatus == 'notSignificant'

if gatedDeployStatus == 'harm' then
  notify()
  fail()
else
  success()
```

## Decision plugins

Kubernetes Gated Deployments supports an abstraction of decision plugins, which
encapsulate the logic for fetching a metric from a backend, as well as the
analysis for that metric. We designed the system to be extensible so teams can
add their own backends, e.g., New Relic, Elastic APM, CloudWatch, or pod logs,
with their own analysis and judgement logic. Each `GatedDeployment` object that
teams set up contains at least one decision plugin, and the object contains the
configuration for those plugins.

The controller will query each plugin on a configurable polling interval that
defaults to 30 seconds. Each plugin can be configured with an experiment time
limit and returns one of three values:

* `WAIT`: if the analysis cannot make a conclusion about the metric yet, e.g.,
  it requires a minimum amount of time or if the result is not yet statistically
  significant
* `PASS`: if the treatment version does no harm to the metric analyzed, or if
  the experiment time exceeds the configured limit
* `FAIL`: if the treatment does harm to the metric analyzed

Teams can configure multiple plugins for a single deployment. For example, a
team might want to measure response time and error rate for multiple endpoints
in a single application. In this case, all plugins must return `PASS` for the
controller to decide that the experiment is a success; if any plugin returns
`FAIL`, it will decide that the experiment is a failure. Otherwise, the
controller will continue polling the metrics until the plugins satisfy one of
the two conditions above. Once the controller makes a decision for the
experiment, it will take action to roll back or continue deploying the treatment
version.

See
[here](https://github.com/godaddy/kubernetes-gated-deployments/tree/master/lib/plugins)
for a list of the decision plugins available, and
[here](https://github.com/godaddy/kubernetes-gated-deployments#contributing-plugins)
for a guide on how to contribute more.

## Usage of the New Relic decision plugin

A decision plugin that we implemented and have been using at GoDaddy is a
`newRelicPerformance` plugin, which analyzes response times to determine if the
newly deployed version is performing worse than the current version. Shown below
is a sample configuration of the plugin in the `GatedDeployment` object:

```yaml
apiVersion: 'kubernetes-client.io/v1'
kind: GatedDeployment
metadata:
  name: example-rest-service
deploymentDescriptor:
  control:
    name: example-rest-service-control
  treatment:
    name: example-rest-service-treatment
  decisionPlugins:
    - name: newRelicPerformance
      accountId: 807783
      secretName: newrelic-secrets
      secretKey: example-rest-service
      appName: example-rest-service
      minSamples: 50
      maxTime: 600
      testPath: /shopper/products
```

This plugin retrieves response times from New Relic for the control and
treatment versions, and tests if they are statistically significantly different
using the [Mann-Whitney U
test](https://en.wikipedia.org/wiki/Mann–Whitney_U_test). Because statistical
significance does not necessarily imply practical significance, the plugin
exposes a threshold setting before it marks the treatment version as causing
harm to the metric of response time. This is useful in the case when the
application does not receive much traffic, as small sample sizes can result in
erroneous statistically significant results. Depending on the traffic patterns
and response time distribution of the application, teams can also configure a
minimum number of samples before analyzing the response times, and a maximum
amount of time in seconds that the experiment will run for before automatically
deciding that it is a success.

## Kubernetes Gated Deployments in production

We have replaced log analysis of a single canary pod that some of our services
used with Kubernetes Gated Deployments, and we have been using the New Relic
response time decision plugin for a while with some production services. It has
already detected and rolled back a performance regression that resulted from
calling a new API with increased response times and has given engineers more
confidence in their deployed changes.

## Learn more and get started

With Kubernetes Gated Deployments, engineers are able to perform automated
regression testing and canary analysis with their continuous deployments, and
limit any negative impact resulting from their changes. By configuring this
Kubernetes extension with the functionality and performance metrics associated
with their application, they can rely on the controller to measure and analyze
those metrics in a statistically sound way, and automatically mitigate any
negative impact. Kubernetes Gated Deployments does not require any application
code changes, making it simple to apply to existing deployment pipelines.

If you want to learn more about or get started with Kubernetes Gated
Deployments, please visit
<https://github.com/godaddy/kubernetes-gated-deployments>. We welcome
contributions and would love to expand the decision plugins available to support
other metric backends and analysis techniques.

Our team of engineers and full-stack data scientists builds experimentally
validated services. Come join us and contribute to services that help us
leverage experimentation services and machine learning models to improve the
GoDaddy customer experience. We're looking for a
[principal](https://careers.godaddy.com/job/cambridge/principal-software-development-engineer-machine-learning-and-experimentation/18045/11812427)
and a
[senior](https://careers.godaddy.com/job/cambridge/senior-software-engineering-machine-learning-and-experimentation/18045/12444210)
back-end software engineer.
