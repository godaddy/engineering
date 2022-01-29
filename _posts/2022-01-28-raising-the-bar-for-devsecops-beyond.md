---
layout: post
title: Raising the Bar for DevSecFinOps and Beyond
date: 2022-01-28 16:00:00 -0700
cover: /assets/images/raising-the-bar-for-devsecops-beyond/cover.jpg
options:
  - full-bleed-cover
excerpt: DevSecFinOps (Development + Security + Finance + Operations) means developers are accountable for more and more disciplines related to the services they build. Organizations can ease this burden by building internal developer platforms that prioritize the developer experience.
keywords: DevOps, DevSecFinOps, Automation, Developer Platform
authors:
  - name: Keith Bartholomew
    title: Software Engineer
    url: https://keithbartholomew.com/
    photo: https://gravatar.com/avatar/477388166acd641cc7ab6779682cc26c?s=400
---

I started doing [DevOps] by accident. Long ago, I was responsible for managing a
handful of Linux servers at a small university. How I got this job in the first
place is beyond me, as until then my entire Linux experience consisted of a
summer spent in my dorm trying to get a laptop to dual boot Ubuntu. Regardless,
there I was spending all day shelling into servers one at a time just trying to
keep things patched and running.

We didn’t have any automation for our Linux servers at the time, and as eager as
I was to show off how fast I could type commands into my terminal, I knew there
had to be a better way of doing things. I started searching for ways to automate
my server management tasks and came across a few open-source tools like [Puppet]
and [Ansible], which were relatively new projects at the time and are still
popular automation tools today. I quickly realized that I could use these tools
to distill all my manual work into a push of a button.

It felt like cheating. Before, I was busy running manual commands all day—now
that work happened while I loitered around the coffee maker. I was able to use
code to define my infrastructure and simple scripts to ensure that every server
in my charge was always healthy and secure.

Little did I know, I had “discovered” DevOps. But I wouldn’t fully appreciate
that discovery until later in my career when my DevOps journey went decidedly
_backward_.

A few years later, I was working for a very small ad agency that built websites
for some very large (like Fortune 50 large) clients who, for obvious reasons,
didn’t fully trust our ragtag team of developers with direct access to their web
servers. Instead, we were assigned a tech liaison and had to deploy all our
website changes through him, usually by emailing him a `.zip` file of code and
handwritten instructions about what to do with them. If anything went wrong,
(and it often did) I would find myself on the telephone, verbally explaining
what sort of things should be done on a server that I couldn’t see or touch.
Needless to say, deployments were risky and difficult and we avoided them as
much as we could.

Compared to the total autonomy I experienced when I first discovered DevOps, the
complete lack of it highlighted its true value. I wasn’t cheating the system or
finding a sneaky way to do less work; I was experiencing the joy of controlling
my own destiny, of having complete ownership over the services I delivered. As a
happy side effect, this also meant I could build and ship a much better product,
much to my users’ delight.

## The True Meaning of DevOps

“DevOps” may sound like the simple conflation of two terms, the merging of
things traditionally handled by separate teams, but it’s really the first step
on a path towards full ownership of building and operating a modern web service.
This didn’t happen by accident. The developers didn’t wake up one day and decide
to take over all the operators’ jobs. The shift towards DevOps was enabled by
making mastery of both disciplines possible with one tool: code.

Unsurprisingly, in the land of software, code is king.

When developers have total ownership over both development and operations, they
can architect and scale their apps nimbly and independently. _Autonomy_ and
_total ownership_ are the keys to DevOps success.

Of course in large organizations, developers can’t do whatever they want; there
will always be standards and processes to adhere to. A healthy DevOps culture at
large organizations gives developers the freedom to decide _how_ they implement
the various DevOps disciplines, while still adhering to _what_ the organization
has decided is essential.

## Beyond DevOps: DevSecOps

Riding the coattails of DevOps’ success, our industry is intent on extending
that portmanteau to include more and more disciplines. “DevSecOps” has joined
the party, bringing security into the fold of developers’ ownership.

Security is a welcome addition in these times of inevitable data breaches. The
rise of machine-readable vulnerability databases means that developers can now
use code to identify weak spots in their systems, and with the advent of
vulnerability-fixing bots, patch them without painstakingly scanning CVE
websites or following all the news in the security research world. It’s taken
some time, but the tooling has matured to the point that such automated security
management is accessible to most developers.

Just as with DevOps, the value of DevSecOps is that developers can secure their
apps with small measures at every step of the development lifecycle, automating
detection and remediation at every step of the way. They don’t have to outsource
security to another team and have total ownership of yet another crucial
discipline.

## Even Further Beyond DevOps: DevSecFinOps

The autonomy of DevSecOps can make it all too easy for developers to build and
scale their apps to infinity without regard for how much all that scale is
costing their team. Of course, you’d expect services to cost more to run as they
take on more traffic, but how have your architectural decisions affected that
cost? End-of-month billing reports aren’t very useful at isolating big spenders,
especially in complex distributed systems. Imagine only being able to review
your application logs once a month!

[DevSecFinOps] is all about—you guessed it—autonomy and total ownership. Giving
developers the tools they need to understand and predict their operating costs
before they even ship can prevent the dreaded surprise AWS bill. And of course,
monitoring costs in real-time gives yet another perspective on ways to optimize
spending. When correlated with your service’s other metrics and traces, your
team can better understand how specific behaviors are affecting costs and make
small, iterative changes to optimize them.

## Raising the Bar: DevSecFinOps Without the Burnout

If you’ve made it this far in your DevSecFinOps journey, you’re probably feeling
a little overwhelmed. What used to be a simple development job has now turned
into development _and_ operations _and_ security _and_ finance. That’s a pretty
full plate! How can you give developers the autonomy they want, without
making them feel burdened by the need to master several new disciplines?

### Build Platforms

At GoDaddy, we believe teams need **carefully curated developer platforms** to
help implement DevSecFinOps in their daily work. While there are countless
vendors out there offering solutions at every corner of this space, this isn’t a
problem that any single piece of software can solve. If you were to carelessly
stitch together generic software to address operations, security, and finance
concerns separately, you’d end up with a tangled mess of integrations. Your
developers would spend more time navigating fragmented internal tools than they
would spend shipping their own software.

A single, coherent platform can abstract the details of exactly _how_ you
achieve DevSecFinOps, letting developers focus on building their app, getting
the DevOps insights they need with a simple, consistent interface. Just like no
two people have the same personality, no two organizations go about implementing
DevSecFinOps in exactly the same way. Your platform should focus on making the
idiosyncrasies of your organization’s implementation simple and intuitive for
developers to follow. You’ll probably still leverage generally-available DevOps
tools, but the role of your platform should be to abstract the lines between
those tools (within reason).

DevSecFinOps is all about autonomy, but it can be tricky to build a platform
that encourages developers to adopt those disciplines while still preserving
their autonomy. In our developer platforms, we do this by making it _easy_ for
developers to make the right architectural choices. (In behavioral science, this
is what’s known as a [choice architecture][choice-architecture]) Very little is
strictly mandatory, but we deliberately make it easier to follow approved
patterns than to go off the beaten path.

DevOps platforms can take on many forms. [GitHub’s developer platform][github-idp]
leaned heavily on “ChatOps” as the developer interface and completely
abstracted the company’s use of Kubernetes so that developers never had to
interact with it directly. [Mercado Libre goes even further][mercado-libre-platform]
and completely abstracts entire cloud providers with its “Fury”
platform-as-a-service. The right amount of abstraction depends heavily on how
mature your developer platform is and how much variability you want in the
services your organization operates.
[Don’t rush into abstractions][avoid-hasty-abstractions] though! Hasty
abstractions will paint your developers into corners, making it painful to adopt
and use your platform.

### Design for Automation

Expect developers to automate their use of your platform. Provide well-designed
APIs that allow them to make use of your DevOps platform programmatically, but
also provide tools like a UI or CLI for them to interact with the platform
manually if they have to.

Pay attention to how they’re automating their use of your platform; Somebody’s
automation project may have stemmed from a missing feature or even a novel way
of doing things you hadn’t considered before!

### Design for Composability

Don’t assume that all developers will use all your platform’s features all the
time. Making it an all-or-nothing proposition makes it difficult for developers
to onboard. In large organizations, each team may have different needs or
different levels of operational maturity, and they should be able to leverage
the parts of your platform that they’re ready to integrate with on an ad hoc
basis. Composability also means avoiding a single, rigid set of operations that
every developer has to follow. By giving them the necessary building blocks to
check the various DevSecFinOps boxes, they can assemble a workflow that aligns
with their normal ways of working.

### Treat Your Developers Like Customers

Spend the same amount of time and care on your platform as you would on an app
for your customers. This means having a clear and active roadmap, responding to
your developers’ feedback, and providing the support and features needed to keep
them happy and productive. Don’t assume that just because the
developers work for you that they’ll use the platform “because they have to”.
There’s always a marketplace of alternative choices out there, and your
customers—excuse me, developers—won’t use your platform if it isn’t the best
choice for their needs.

## Wrapping Up

The world of software development has grown a lot. What used to be a single
discipline has evolved to the point that a silly-looking term like
“DevSecFinOps” isn’t a joke—it’s the reality of work for high-performing,
autonomous teams. But don’t leave your developers stranded; invest the time and
effort to build thoughtful tools that guide them on their journey to
DevSecFinOps enlightenment.

Image Credit: Cowboy Wannabe on Unsplash

[DevOps]: https://aws.amazon.com/devops/what-is-devops/
[Puppet]: https://puppet.com/
[Ansible]: https://www.ansible.com/
[DevSecFinOps]: https://aws.amazon.com/blogs/enterprise-strategy/introducing-finops-excuse-me-devsecfinbizops/
[choice-architecture]: https://medium.com/10x-curiosity/helping-people-make-better-choices-nudge-theory-and-choice-architecture-431a3a40b688
[github-idp]: https://humanitec.com/blog/jason-warner-why-github-built-their-own-internal-developer-platform
[mercado-libre-platform]: https://www.youtube.com/watch?v=He5_ie1cPKg
[avoid-hasty-abstractions]: https://kentcdodds.com/blog/aha-programming
