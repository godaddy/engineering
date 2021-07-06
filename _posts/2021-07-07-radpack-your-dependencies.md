---
layout: post
title: Radpack your dependencies
date: 2021-07-07 10:00:00 -0700
cover: /assets/images/radpack-your-dependencies/cover.jpg
excerpt: Bundlers like Webpack do a great job at providing a toolset needed to deliver an optimal out-of-the-box delivery solution. Loaders on the other hand are focused on delivering only the requested assets, as they are needed, and have a much higher cacheability. Radpack offers the best of both worlds.
options:
  - full-bleed-cover
authors:
  - name: Aaron Silvas
    title: Sr Principal Architect
    url: https://www.linkedin.com/in/aaron-silvas-5817626/
    photo: /assets/images/asilvas.jpg
---

For applications that live in a bubble, isolated from having to play on the
same playground as other applications, there are many options available for
bundling! But for those of you that must play nice with other applications,
Radpack provides intuitive tools for developers to provide great customer
experiences and removes bundling pains that come with large
and complex multi-application shared dependencies.

Bold claim indeed, so let's unpack...


## Understanding the enterprise dependency dilemma

Before you can appreciate what Radpack is, it's important to
understand *why it exists* in the first place amongst a heap of bundling
tools intended to already address client performance.

Consider for a moment...

* Does your application share code with other applications?
* Is it time consuming for developers to deploy cross-application dependencies?
* Are your applications sometimes hampered with (unintentional) duplicated dependencies?
* Do you share complex UI experiences (modals and other embeds) across more than one application?
* Do you have inconsistent or fragile customer experiences due to shared dependencies?
* Do you find it difficult to optimize your bundles in large applications?

If one or more of the above problem statements are true, Radpack may be the answer.


### Accelerating embedded experiences

While Radpack was designed as a generic multi-application shared dependency delivery solution, the
initial inspiration came from the need to satisfy delivery of complex embedded experiences
out-of-band of the applications that integrated with them.
In our case Widgets in [GoDaddy Websites+Marketing](https://www.godaddy.com/websites/website-builder)
was fraught with complex needs, including but not limited to versioning and nested dependencies.
Widgets are more or less applications within applications, or applets if you will; experiences
provided by the application, but not necessarily understood by the application beyond an agreed
upon interface.

Our original solution was hacky at best, but it got the job done. Out of the necessity to solve
these problems, while providing the best user experience possible, Radpack was born to provide a
consistent set of tools to solve these fundamentally challenging vectors of multi-application design.



## What is Radpack, exactly?

The good news is that Radpack isn't a bundler at all, and it even plays nice with others!

![Concept]({{site.baseurl}}/assets/images/radpack-your-dependencies/radpack.jpg)

What does Radpack provide?

* Build-time **bundler plugins**:
  * [Rollup](https://rollupjs.org/) for exporting shared dependencies to radpack
  * [Webpack](https://webpack.js.org/) for bundling your applications with radpack
  * Additional bundlers could be supported if there is demand
* A run-time for loading cross-application dependencies, on demand
* Optional developer tools for deploying and testing exported dependencies out-of-band of applications

But most of all, Radpack provides a consistent pattern for building large
multi-application products by exporting your shared dependencies to a central registry.

By exporting with Radpack you get:

* Cross-application dependency sharing
* Automatic deduplication of exported dependencies
* Just-in-time dependency downloads with parallel resolution to prevent slow waterfalls
* High cache hit rates due to micro bundles at the export level
* Server-side rendering support against the same exported dependencies as your clients
* Increased velocity with out-of-band dependency deployments
* Soft deployments enable testing updated dependencies prior to applications consuming them



## Code you can sink your teeth into

![Export and Bundle]({{site.baseurl}}/assets/images/radpack-your-dependencies/export-and-bundle.jpg)

In the below contrived example we're going to export dependencies with radpack,
and consume them from our applications.

### Exporting with Radpack

Once you've identified code you wish to share across applications, you can begin
by exporting to Radpack via the rollup plugin for Radpack.

`package.json`:
```json
{ "name": "my-radpack-exports" }
```

`my-shared-code.js`:
```js
export default () => 'hello from Radpack';
```

`rollup.config.js`:
```js
import radpack from '@radpack/rollup-plugin';

export default {
  …, // your rollup config
  input: { mySharedCode: './my-shared-code.js' },
  plugins: [radpack()]
}
```

This build will produce something along the lines of:

```
dist/my-shared-code-67ef9c41.js
dist/radpack.json
```

Typically you'll want to copy your build assets to some form of web server or CDN,
but for the purpose of this example we'll point to the local file system.


### Bundling with Radpack

Now that we've got some code exported to Radpack, let's consume it from our application(s).

`app.js`:
```js
import mySharedCode from 'my-radpack-exports/mySharedCode';
```

`webpack.config.js`:
```js
const Radpack = require('@radpack/webpack-plugin');

module.exports = {
  entry: { app: './app.js' },
  plugins: [
    Radpack({
      register: '../my-radpack-exports/dist/radpack.json' // or a URL to the deployed registry
    })
  ]
};
```

Regardless if my shared code was installed as an npm dependency or not, Radpack plugin
will automatically remove any exported dependency from the application bundles.

That's all there is to exporting and building with Radpack. But wait, there's more!



## The internals

### Understanding the dependency graph

Anytime you run a Radpack build, be it for your application or shared dependencies,
the most critical output is the `radpack.json` file that describes the dependency
graph. This in turn allows the Radpack run-time loader to understand when an export
is imported, to download all child resources (and their children, and so on), all in
parallel. Unlike conventional loaders that have little to no up-front configuration
and result in complex and poor performing waterfall sequences, Radpack instead takes
advantage of the dependency graph determined at build-time.

This in turn provides the benefits of both on-demand loading of loaders, and of
anti-waterfall mechanics offered by bundlers.

Additional details can learned about the [graph format](https://godaddy.github.io/radpack/internals/graph),
but the main takeaway is that the registry is optimized for client performance and thus
not intended to be human readable.


### Versioning lite

Unfortunately we cannot afford to ship registry information for every version of every export ever
released to the client and not expect dire consequences to performance. We
instead opted for a middleground which we refer to as semantic versioning lite. This approach allows
the registry to retain a few versions only for known breaking changes. Breaking changes are classified
by major version bumps, and optionally also for minor versions in cases where you're supporting 3rd-party
exports where you don't control their versioning patterns.

The result is a performance-optimized registry that represents a very small number of versions of each export.
The perceived tradeoff is that it does put a greater burden on authors of exported dependencies to
ensure breaking changes result in a major version bump, but we believe this has always been a challenge
of any human versioning schema. These risks can be mitigated by enabling a healthy test pipeline on
dependent applications, or if you prefer, disabling live deployments.

Versioning is both a burden and a blessing, as it permits (but not forces) deployments of updated
dependencies out-of-band of application deployments, often greatly accelerating teams productivity.
For cases where you have divergent code that requires different versions of your dependencies,
version pinning comes to the rescue. By authors adding an explicit `(dev|peer)?Dependency` in their
`package.json` Radpack can automatically assign a specific version of a given dependency. If no
version is specified, the behavior defaults to `*`, which auto-pins the version to the latest
major at the time of the last application build. This allows for breaking changes to be caught
at build time. But generally it's a good practice to assign a major version to avoid any trouble.

Additional details can be [found here](https://godaddy.github.io/radpack/internals/version).


### To live deploy, or not to live deploy

The ability for authors of shared dependencies to deploy updates out-of-band of dependent
applications is an absurdly powerful capability of Radpack that cannot be overstated.
Whatever your rationale, live deployment is a feature, not a requirement. While it's most intuitive
to keep this feature by pointing your applications to your mutable Radpack URL, (ala
`//mycdn/radpack-registries/demo/radpack.json`), if you wish to disable this behavior your
application at build time can simply clone this object and copy it local to the application (ala
`//myapp/static/radpack.json`).

We hope you give it a shot in all its high velocity glory.



## Fitting your needs

While out of scope for this introduction to Radpack, additional use cases include:

* [Multi-project single registry](https://godaddy.github.io/radpack/usages/merge-exports)
* [Server-side rendering](https://godaddy.github.io/radpack/usages/server)
* [Applications without bundlers](https://godaddy.github.io/radpack/usages/no-bundle)
* [Testing](https://godaddy.github.io/radpack/usages/testing)



## Packing it up

We hope this introduction to Radpack piqued your interest enough to take it for a spin
and see if it fits your needs. While this technology is newly open sourced, it's been in use
at GoDaddy for months across several applications and registries with dozens
of exports and has served its purpose well. As always we [welcome feedback and contributions](https://github.com/godaddy/radpack/issues)!


### Resources

* [Source](https://github.com/godaddy/radpack/)
* [Docs](https://godaddy.github.io/radpack)
* [Examples](https://github.com/godaddy/radpack/tree/main/examples)
