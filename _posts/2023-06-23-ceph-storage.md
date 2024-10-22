---
layout: post
title: Page load times, do they really matter? You bet they do!
date: 2023/06/23
cover: /assets/images/ceph-storage/cover.jpg
options:
  - full-bleed-cover
excerpt:  Global Storage Engineering (GSE) migrated 2.5PB of Managed Word Press (MWP) data from vendor supported storage to opensource community supported Ceph storage utilizing CephFS in 9 months, resulting in improved customer experience.
keywords: Ceph, CephFS, MWP, Managed Word Press, Storage
canonical: https://godaddy.com/resources/news/ceph-storage
authors:
  - name: Joe Bardgett
    title: SRE Sr. Manager
    url: https://linkedin.com/in/joe-bardgett-a6004141/
    photo: /assets/images/jbardgett.png
---

## Introduction
With over 21 million customers, GoDaddy requires quite a bit of storage capacity. Outages, high latency, and low performance with storage can negatively impact our customers so it goes without saying that managing a storage infrastructure across nine facilities in three continents and ensuring effectiveness and efficiency is a crucial part of our business.

Production shared storage has been supplied by vendor-supported hardware since the beginning of Godaddy. It has a high initial purchase cost with subsequent maintenance and licensing costs in future years. Over the years, we added additional block storage formats and file system protocols to provide inexpensive options for internal teams so they didn't have to use the expensive vendor-supported hardware. But the hardware used was still based on spinning-disk solutions so the throughput was not enough for a production workload (Tier 0 or 1). In this post, I'll discuss how GoDaddy went from expensive, vendor-supported hardware, to a more cost-effective, open-source storage platform and how these changes ultimately created huge benefits for an internal team and their customers.

## The Challenge
There has always been a want within the company and Infrastructure organization to reduce or remove vendor-supported hardware costs while continuing to provide a positive customer experience and maintaining high performance and reliability. In 2014 the Global Storage Engineering (GSE) group started implementing a fairly new open-source storage platform called [Ceph](https://ceph.io/en/) to meet the needs of Tier 3 workloads (like backups) through an object-based S3 solution. It was built on commodity hardware and cost a fraction of the vendor-supported hardware. Though switching to Ceph provided an upgrade, we still needed to move away from spinning-disk solutions to more performant solutions.

In 2020 the GSE team implemented the first non-volatile memory express (NVMe) based Ceph solution to meet the performance needs of production workloads. At that time, the Managed Word Press (MWP) group had performance issues with their vendor-supported solution. These performance issues were negatively impacting their customers and Ceph was pitched as the answer. Starting in late 2021, GSE and MWP teams joined forces to accomplish one of GoDaddy’s company initiatives for 2022. The main issue that was addressed was sub-optimal performance for Tier 1 storage which caused outages and an unsatisfactory customer experience. The primary cause of the negative customer experience was slow server page load times (PLTs). PLTs were below acceptable levels due to two reasons. First, the storage tier was overloaded on customer counts and could not keep up with the requests per second. Second, the storage hardware was aging and failures caused service interruptions on a regular basis.

## The Plan
GSE researched possible solutions and compared them for performance viability and cost effectiveness. An all NVMe solution was tested by the GSE team at that time and showed response times that would meet MWP needs. We determined that shifting architecture from vendor-supported solutions to the in-house supported solution of Ceph (specifically CephFS) would improve performance and save $12M over the next 5 years. CephFS is the native file system to Ceph and is built into the kernel of Linux. MWP was using NFS for their solution and converting to CephFS was a simple conversion to switch the mount points from one protocol to another. Using the native file system for Ceph ensured higher performance throughput.

The business justification was approved, and a 2-year plan was put in place to acquire hardware and migrate customers to be completed by 2024. The initial plan was to implement a stepped approach to introducing Ceph as the replacement hardware for the existing storage solution. It would be rolled out into different data centers based on customer footprint size and ease of data migration. The migration environment capabilities dictated the rate at which data could be moved between environments (roughly 1000 customers per day). The results from the first set of customers migrated to Ceph was so positive that the MWP product owners requested development of an accelerated migration solution to achieve full migration within the 2022 calendar year. In order to meet this accelerated timeline, a focused effort was required from multiple teams. The GPE group created the A-Team from various infrastructure teams to fast-track hardware procurement and deployment across three data centers and two continents. The main focus was to increase the migration infrastructure to handle 3000 customers per day and was achieved with new hardware rollouts.

## Results
The following slides show the initial results of migrations to Ceph. The first slide shows the improvement in Storage Response Time (SRT) or latency.

![Improvement in Storage Response Time (SRT)]({{site.baseurl}}/assets/images/ceph-storage/latency.png)

Simply moving the customer workload to Ceph reduced the workload for the vendor-supported solution and resulted in improved SRT for both solutions. However, overall Ceph response times were lower by a factor of two. The next slide shows the PLTs for MWP.

![PLTs for MWP]({{site.baseurl}}/assets/images/ceph-storage/plt.png)

You can see when Ceph was introduced in September that PLTs dropped by half.

The efforts of the A-Team resulted in the completion of a two-year plan in nine months. In the nine months, GSE was able to migrate 2.5PB of MWP data from vendor-supported storage to open-source, community-supported Ceph.

By January 2023, all MWP customers were running on CephFS, and all storage-layer performance issues had been addressed. This resulted in increased website response times (1.5-2 second improvement) and a significant increase in Net Promoter Score (NPS) for the MWP product. The following slide shows the difference in SRT after migrating all customers in our Ashburn facility from vendor-purchased to Ceph storage.

![Difference in SRT]({{site.baseurl}}/assets/images/ceph-storage/ceph-performance.png)

## Conclusion
Vendor-supported hardware served GoDaddy well, but was expensive and relied on less performant, spinning-disk solutions. By switching to Ceph, CephFS, and NVMe, we were able to significantly improve performance and website response times for our MWP team. This improvement resulted in the highest NPS for MWP in over a year. After rolling out this solution to the MWP team, our Optimized Hosting team has adopted CephFS and additional use cases are planned for file system solution needs, specifically replacing existing NFS workloads.

