---
layout: post
title: "Behind the scenes of GoDaddy's Webhosting infrastructure"
date: 2022-10-31 00:00:00 -0700
cover: /assets/images/optimized-hosting/cover.jpeg
options:
  - full-bleed-cover
excerpt: Did you ever wonder how GoDaddy runs your website? Or how one might go about hosting millions of websites? How about running a hundred thousand Virtual Private Servers (VPS)?
keywords: webhosting, vps, virtual private server, hosting, vserver, scale, reliability, availability
authors:
  - name: Robert Breker
    title: Senior Director, Software Development
    url: https://twitter.com/robertbreker
    photo: /assets/images/rbreker.jpeg
---

## Introduction to Optimized Hosting
Did you ever wonder how GoDaddy runs your website? Or how one might go about hosting millions of websites? How about running a hundred thousand Virtual Private Servers (VPSs)?

My name is Robert Breker, and my team runs Optimized Hosting, the infrastructure platform behind GoDaddy's hosting and VPS products. I am a software engineering manager, not a marketing or business guy, and I rarely write blog posts. But in this article, I want to share why I am proud of the engineers working on Optimized Hosting and what difference their work makes to GoDaddy's hosting and VPS customers. This blog post emphasizes the most impactful patterns the engineering team applied when creating Optimized Hosting and how each benefits customers.

The content in this blog post reflects the current state of the Optimized Hosting platform and is subject to change as we implement further improvements.

## Pattern: Do what's best for the customer
One overarching pattern you'll find in everything we do is that we obsess about doing what's best for our customers. We appreciate that customers trust us with their websites and servers, which are dear to them. The websites and servers are often critical to our customer's business and livelihood. Doing what's best means doing what we'd want to be done if it were our own website or server.

Here are two examples of what this means in practice:

* For customers that subscribe to a VPS with SSD storage, we typically host that instance on branded, datatcenter-grade NVMe drives with RAID redundancy. The NVMe drives are technically qualified and benchmarked by GoDaddy engineers before they're used. Customers might never know, but they gain extra availability, reliability, and performance.
* Where practicable, we make backups of all customer data, regardless of whether a customer package explicitly includes it as a marketed feature. We do this to protect against unforeseeable circumstances. If that once-in-a-lifetime catastrophe happens, we want to have our customers back! One day, it might save a customer's business, and it all will have been worth it.

## Pattern: One platform serves them all
Whether you leverage web-hosting from GoDaddy in the US, Web Hosting Plus from GoDaddy UK, or a VPS from GoDaddy India, each is enabled by the Optimized Hosting platform.

Optimized Hosting is an internal cloud specializing in web hosting and VPS workloads. The internal cloud provides GoDaddy teams with flexible access to virtually unlimited resources, including CPU cores, memory, disk space, public IP addresses, network bandwidth, and backup capacity. To make use of the resources, Virtualization and Containerization are key.

GoDaddy teams provision Virtual Machines (VMs) and containers on the Optimized Hosting platform. Some of the VMs are managed by GoDaddy, run the cPanel web hosting control panel software, and host multiple web hosting customers. Other VMs are customer VPS instances that only one individual customer can access.

Three significant customer benefits originate from GoDaddy's commitment to a single infrastructure platform:

* All GoDaddy customers worldwide get the same consistent, well-polished experience.
* All customers benefit from platform improvements. Given the size of the platform, we spent quite a bit of time optimizing the platform down to the last microsecond. If you're into this kind of thing, we tweak CPU C-states, the network TCP/IP stack, disk, and RAID settings, do NUMA-balancing, and customize myriads of software packages. This gives customers reduced page load times in hosting, faster VPS instances, and better quality.
* We keep plenty of capacity readily available. That means customers can get their order fulfilled or their package resized near-instantly.
* Once our hardware is installed in the rack,  software automation configures everything end-to-end. For networking, this, for example, means that IP assignments, Switches, Switch-ports, and Routes all get automatically configured based on a database. And then, for Quality Assurance, the configuration gets automatically validated using static analysis and end-to-end tests. Customers benefit from thorough testing and excellent quality.

## Pattern: Be close to the customer
The Optimized Hosting platform has a presence within many data centers worldwide to achieve optimal global coverage.

Each of our data centers is carefully designed to maximize availability, reliability, and performance with redundant cooling, power, network backbone, and network peerings. Typically, our data centers are located close to internet exchanges, where many backbone network connections meet.

This is important to customers whether they're in sunny California, Europe, or South-East Asia; we have a quality data center nearby that ensures consistent quality and low latency. This benefits availability, reliability, and page load times, which are vital for search engine ranking.

## Pattern: Datacenter-grade hardware, without compromise
GoDaddy does not compromise on the hardware used for Optimized Hosting - every single server uses data center-grade hardware.

And this makes a real difference to customers because we use:

* Redundant power supplies, dual network interfaces, and drives in RAID configuration with self-correcting ECC memory. All these choices ensure optimal availability and reliability of the customer workloads.
* We use NVMe drives, dual 25GiB/s network cards, and dual-socket CPUs. These components leave plenty of headroom and are selected to enable optimal performance for customer workloads, even during load peaks.
* Datacenter grade chassis to get detailed insights into hardware health via thermostats and System Event Logs. We also have a dedicated engineering team focused on getting the most out of monitoring, so we can predict and fix many issues before they might impact customers.
* Datacenter-grade NVMe drives to ensure the disk performance does not degrade and data does not corrupt due to restricted write cycles. This way, we ensure optimal performance for customer workloads throughout the hardware lifecycle.

We continuously improve our HW platforms to delight customers. Another primary objective in this area is that GoDaddy strives to reduce its environmental impact and improve [sustainability](https://www.godaddy.com/en-uk/godaddy-for-good/sustainability). GoDaddy is committed to reducing scope 1 (direct emissions) and scope 2 (indirect emissions from energy purchases) Green House Gas emissions by at least 50% by 2025. GoDaddy's hosting workloads are the primary contributor to realizing this improvement. Our hardware enables a reduction of used data center space, uses less power, and produces less heat, which in turn lessens the need for cooling.

## Pattern: Utilize hardware optimally, but never overload it
Optimized Hosting works on the premise of using highly performant hardware. We aim to use the hardware optimally so we don't waste resources while, at the same time, we never want to overload it. Workloads should always get access to all the resources that they need.

The Optimized Hosting platform monitors dozens of performance, load, and usage metrics about each server and each workload to get this balance right - CPU load, memory bandwidth, IOPS, network bandwidth, etc. It then uses advanced placement algorithms to place customer workloads optimally - the motto is to use the hardware but never overload it. And in the rare case that we should get that placement wrong or the workload performance profiles changes, there'll be an alert notifying us. We then use automation to transparently migrate some workloads to another node without customers ever noticing.

From a customer perspective, this means all customer workloads get access to super-fast hardware when they need it. Customers benefit from quick page load times and VPS experiences.

## Conclusion
GoDaddy operates with Optimized Hosting one global platform that is the foundation of most GoDaddy hosting and VPS products. Its primary purpose is to delight customers with excellent availability, reliability, performance, and consistency.

The product specifications customers receive when they purchase web hosting and VPS services are typically brief.
Behind the scenes, the hoster makes countless design and implementation choices that define the actual product and heavily impact the customer experience. I am very proud of GoDaddy and the Optimized hosting engineers that consistently make these under-the-hood choices in the customer's best interest.

[Try hosting on GoDaddy](https://www.godaddy.com/hosting) to see the difference it makes, as I can't wait for us to serve you!

If you are an engineer interested in working with us on the latest open source hosting, virtualization, distributed storage, and monitoring technologies, check out our [Job Page](https://careers.godaddy.com/). We'd like to hear from you!
