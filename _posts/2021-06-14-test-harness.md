---
layout: post
title: Writing a Language-Agnostic Integration Test Suite
date: 2021-06-14 10:00:00 -0700
cover: /assets/images/test-harness/cover.jpg
excerpt: Writing APIs around SDKs in multiple languages proves to be an effective method of implementing a language-agnostic integration test suite.
options:
  - full-bleed-cover
authors:
  - name: Joe Bergeron
    title: Software Engineer III
    url: https://github.com/Jophish
    photo: /assets/images/jbergeron.jpg
---

My team at GoDaddy builds and maintains an internal platform for running controlled experiments on GoDaddy products. Partner teams across the company can use this
platform to run experiments, test hypotheses, and obtain automatic analyses of their experiments' results. (For a better sense of the kind of work
we do, take a look at these [blog](https://www.godaddy.com/engineering/2020/05/13/experimentation-practices/)
[posts](https://www.godaddy.com/engineering/2020/05/06/godaddy-splitio-collaboration/) by some of our team members.) The experimentation platform has a bunch
of moving pieces. Still, the primary way that partner teams integrate their products with our platform to run experiments is by using an SDK we've built
around various experimentation backend services.

Part of our team's goal is to make experimentation ubiquitous throughout the company; we want all teams to run experiments on their products,
with as little friction as possible. Engineering teams across the company implement their products in different languages. With our current model,
this means that for a partner team to integrate with the platform, an SDK needs to be made available in their product's language.

As you can probably imagine, this could mean a *lot* of SDKs to create and maintain. As it stands, our team directly owns and maintains a couple of SDK
implementations in particularly widely-used languages, while partner teams are responsible for maintaining all other SDK implementations. The SDKs themselves
include some complex logic and stitch together a number of different services, and are generally non-trivial to implement.

You might be asking, "Why not stick all the SDK logic behind some API, and use a client SDK code generation tool like
[Swagger Codegen](https://github.com/swagger-api/swagger-codegen) or [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator)?".
For performance reasons, the SDKs are responsible for some complicated custom caching in conjunction with background polling
to minimize impact on the partner products that are integrating with our platform. This prevents automatically generated SDKs
from being a viable solution.

As I mentioned, we maintain a couple of reference SDK implementations, but we'd like to allow partner teams to implement their own SDKs
in whatever language they prefer, and make those SDKs available for other teams to use. Of course, we also want (read: *require*)
those SDKs to be *correct*. This means testing. Because the SDKs interact with other backend services, integration tests can get messy, since
we might need to mock out certain services. While we want the process of writing SDKs to be as frictionless as possible, we also require that SDKs
include integration tests for the sake of correctness. Since all SDKs ostensibly implement identical interfaces with identical semantics,
it seems somewhat wasteful for all SDKs to include identical integration tests tailored to a specific language. How then, can we avoid partners having to
write their own complicated integration tests?

## Test Harness

If all SDKs exposed a common, language-agnostic interface, we could conceivably create a test harness and suite of integration tests to test against
this interface. Instead of having partners write and maintain their own integration tests, we would
require them to write a small, language-agnostic interface that wraps their SDK, and integrate that interface with a test harness and set of integration
tests that our team maintains. Our test harness would essentially query the interface with different inputs and verify its output against some expected values.
This approach treats the actual SDK implementations themselves as black boxes. Since the SDK wrapper needs to expose a
language-agnostic interface, and because SDKs may differ in implementation details, our test harness can't perform tasks such as unit testing
or code coverage checks; the SDK maintainers are still responsible for those tasks.

Given that this is our approach, we have to decide on the sort of wrapper interface that SDK repositories should include. The choice of interface is dependent
on the environment that the test harness is running in.

## CLI?

Our first strawperson proposal for the SDK interface required partners to provide a command line interface (CLI) wrapper implementing a particular
specification for their SDKs. Our test harness would have no knowledge, nor would it care what language the CLI is implemented in. From the perspective of the test
harness, all CLI implementations would look and behave identically. The proposed setup went a bit like this:

* We provide a Docker image containing integration test data and a small script to validate test data against a CLI.
* Partners who are implementing SDKs pull this image and run the container, providing it a copy of their CLI on a Docker volume.
* On container creation, the test script runs, looking for a CLI to test against at a predetermined path.
* Tests run, and results are output to stdout.

Sounds great, right? CLIs are cheap and easy to implement in most languages. This initial proposal quickly ran into one particularly nasty problem, however.
These CLIs would only be truly language-agnostic interfaces if they could be run in an environment that lacks any particular language-specific runtime. With this
setup, a partner implementing a Python SDK couldn't rely on `python` being available in the test harness Docker container. The test harness script would call all
CLIs in the same way within the container, e.g., `./cli-implementation {various input arguments}`. This means that for SDKs implemented in interpreted languages that
require a specific runtime, partners would have to provide a *binary* CLI that can run natively on whatever base image our test harness image uses. Needless to say,
this is a huge pain.

Our potential solution to this was to have partners make their CLI available in a Docker container of their own creation. Instead of mounting their CLI within the
test harness container, we would provide some shell script to communicate between the CLI container and the test harness container, and print out the results of
each test. This looked something like this:

* We provide a Docker image for our test harness, which contains facilities to get test inputs and validate actual CLI output against expected results.
* Partners provide a Docker image containing a CLI which can be accessed at a particular location.
* We provide a shell script that spins up both containers and runs commands inside of both containers to ferry data between them and validate the results.

This is starting to look a bit messy. Providing a shell script to run on the host and coordinate complicated communication between containers is not very elegant
and has its own shortcomings. If we provide a bash script, and one of our partner teams develops on Windows machines, that's an additional roadblock for them to overcome.
Communication between Docker containers is not really meant to be done by ad-hoc scripting from the host. Fortunately, there's a much simpler way to communicate
between containers.

## API

Instead of having partners wrap their SDK in a CLI with some particular spec, why not have them wrap it in a REST API instead? Pretty much all languages have
webserver libraries that make writing an API relatively painless, and inter-container communication over a network is dead simple, especially with `docker-compose`.
If all SDKs provide a lightweight API wrapper that adheres to a common spec, then the plan becomes:

* We provide a Docker image for our test harness/integration test data.
* Partners provide a Docker image containing their SDK API.
* We provide a `docker-compose.yml` that partners can use that spins up both containers and runs the tests.

This is a pretty clean solution! If we publish our test harness image in some registry, and partners provide a Dockerfile for their API at some known location in their
repository, we can write a small `docker-compose` file that partners only need to their repositories. Furthermore, if the integration tests
require us to mock out some network service (e.g., to validate logging), we can spin up a mock version of that service in our `docker-compose` file.

How might a setup like this look? Let's dig into some details.

### Defining an API Spec

Let's say your SDK (or whatever else you're testing, it doesn't have to be an SDK!) exposes two methods, one that "gets" some value, and another that "sets" it.
We could reasonably call these `getValue` and `setValue`, but different languages might have different conventions for method naming. The Python SDK might name
its methods `getValue` and `setValue`, but the Go SDK might name theirs `GetValue` and `SetValue`, and another still might name theirs `get_value` and `set_value`.
What's more, the method signatures and output value of these different implementations might also differ. Python's `getValue` might accept a dictionary of arguments,
while Go's `GetValue` might accept a number of individual arguments. While the *syntax* of these different implementations differs, they are by definition semantically
identical. As such, the specification you decide upon for your API will very likely be different than the actual spec for some of the SDK implementations, both in
endpoint name and request/response body schemas. This means that some API implementations will need to do some work to tease apart the request body and pass
arguments in the correct format along to the method under test as well as format the method output before returning it in the response body.
You should pick a spec for your API that minimizes this parsing work for the majority of SDKs.

### Test Harness Design

The actual design of the test harness script itself can be suprisingly simple, depending on the complexity of your setup. For our use case, we opted for a
[table-driven testing](https://en.wikipedia.org/wiki/Data-driven_testing) approach. Each test case is represented as a single file of data, containing
the method to test, the request body to pass to the API endpoint under test, and the expected response body. Expanding on our toy example from above, this might
look something like this:

```json
{
    "method": "setValue",
    "input": {
        "argOne": "foo",
        "argTwo": "bar"
    },
    "output": {
        "result": "baz"
    }
}
```

In our setup, we had a bunch of these test data files in a directory hierarchy, and just iterated over all the files, testing the data against the API one by one.
In pseudocode, a bit like this:

```python
for testFile in testFiles {
    result = queryAPI(testFile.method, testFile.input)
    resultsMatch = compareResults(result, testFile.output)
    if resultsMatch {
        printSuccess()
    } else {
        printError()
    }
}

```

`testFile` represents a single JSON blob like the one shown above; `testFiles` (which we're iterating over) is just a list of all JSON blobs, each representing
a single test case. `queryAPI` takes in a method name and input arguments, and queries the API at the correct endpoint
with the given arguments, returning the results. `compareResults` takes the API result and validates them against the expected output. The real setup is a bit more
robust than that, but you get the picture. If you use a test framework like [pytest](https://docs.pytest.org) for Python, or [Mocha](https://mochajs.org/)
for Javascript, you can dynamically generate test cases (and test suites, to group all tests for individual methods) based off whatever test data files exist at runtime.

### Docker

So what do the docker-related files look like for all this? There are three such files that we need to be concerned with. First is the Dockerfile for standing up the API in
a container. Since this Dockerfile is left to the SDK maintainer to provide, it will naturally vary between SDKs. Next, we need a Dockerfile to build an image of our actual
test harness script. This image, when run, will iterate over all the test files, testing against an API URL that's provided to it at container start. Finally, we have
the docker-compose.yml that we provide to SDK maintainers. This file spins up both the API and the test harness containers (and any other that might be necessary for
integration testing) and will run the test harness against the provided API container. SDK maintainers only need to copy this file into their SDK repositories, and everything
should work right out of the box. A minimal docker-compose file might look something like this:

```yaml
version: "3.3"

services:
    api:
        build:
            context: .
            dockerfile: ./api/Dockerfile
        expose:
            - 3000
        environment:
            - PORT=3000
            - SDK_API_KEY

    harness:
        image: test-harness-image:1
        environment:
            - API_ENDPOINT=http://api:3000
```

This docker-compose file assumes that a Dockerfile for building an SDK API image is available locally at `./api/Dockerfile`, and that a pre-built test harness image is available in
the current Docker registry at `test-harness-image`, with tag `1`. The API's port is parameterized by the `PORT` environment variable, and the test harness image is passed the API's URL
through the `API_ENDPOINT` variable. Since the test harness is running integration tests, the `SDK_API_KEY` variable is shown here as an example of how we might authenticate the SDK
with our backend services. This value is passed at runtime.

You may be wondering what the API Dockerfile looks like. This will vary depending on the language the API is implemented in, but at a minimum, it should copy over the necessary files to
run the API, install dependencies and (potentially) build the API, and finally spin up the API itself. For our SDK implemented in Node, the API Dockerfile looked something like this:

```dockerfile
FROM node

RUN mkdir -p /home/app/api
WORKDIR /home/app/api

COPY ./package.json ./package-lock.json /home/app/api/
RUN npm ci
COPY . .

CMD npm run api
```

In the case of the Node SDK, the SDK's `package.json` file contained an `api` script to spin up the API itself, which gets called after the container is created.

With this setup, all it takes is a simple `SDK_API_KEY={xxxxxxx} docker-compose run harness`, and the images will be built/pulled, containers will be started, and the test harness will
be run against the provided SDK/API! Before we close, there are a couple of important points to touch on if you decide to do something like this on a larger scale.

### Versioning

Over time, you'll probably want to add/remove/change features of your SDKs, which means updating the tests, and naturally, the test harness and API spec. Notice how, in the Dockerfile
above, we specify the image `test-harness-image:1`, rather than just `test-harness-image`, or `test-harness-image:latest`. If we only published a single version of the test harness image,
as soon as we update that one image, the tests would fail for SDKs that haven't yet been updated to support the new spec. It's a good idea to version the test harness images. We opted
for [semantic versioning](https://semver.org/) — major versions correspond to SDK spec changes. In order to upgrade to the next major image, SDKs need to be updated to support the new spec.
An image with tag `1` will always correspond to the latest minor version of major version 1. This way, partners still receive the latest, non-breaking minor-version updates, and are able
to update their SDK to the next major version at their own leisure.

### CICD

Of course, in a real-life setting, you'd probably want to run the test harness as part of your CICD pipeline. Fortunately, with the setup described above, this isn't really
any extra effort, and things should work pretty straightforwardly. The main question here is: where should these tests run? There are two primary options. Either have each SDK run the test harness
in its own CICD pipeline or maintain a single CICD pipeline/cronjob that gathers and tests *all* the SDKs periodically. Both options have their benefits — our team opted for the first approach,
where individual SDK maintainers integrate the test harness into their CICD pipelines, rather than maintain a job ourselves that aggregates all existing SDKs. The upside of this option is that
you don't have to maintain your own new CICD pipeline, although you have to trust partners to integrate themselves, and by default, there's no central place to view all SDK statuses at once. (This
could potentially be solved by having partners integrate with a [job monitoring plugin](https://github.com/jenkinsci/github-autostatus-plugin), and having all SDK integration test builds sent
to a central location.)

By maintaining your own pipeline to aggregate and test all SDKs, you don't have to trust/make partners integrate the test harness in their own CICD, and you have a central location for viewing the status of all
existing SDKs. Of course, this comes at the cost of having new infrastructure to maintain.

## Conclusion

This has been a pretty high-level overview of the details of writing a language-agnostic integration test suite. There are surely other ways to tackle this problem, but so far, this
solution has been working pretty well for our team. Development of the test harness even managed to surface a couple of bugs/discrepancies in our own reference SDK implementations!
If you ever run into a situation where you need to test many implementations in multiple languages for the same behavior, hopefully this serves as a useful reference.
