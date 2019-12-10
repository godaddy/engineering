---
layout: post
title: "Kernel-Bypass Networking"
date: 2019-12-10 09:00:00 -0700
cover: /assets/images/kernel_bypass_networking.jpg
excerpt: The DNS Team explored the possibility of using a software-based router instead of a hardware router. This post examines the reasons for using a software-based router with Kernel-Bypass Networking.
authors:
  - name: Benjamin Bowen
    title: Senior Development Manager
    url: https://www.linkedin.com/in/benjamin-bowen-0a8b734/
    photo: /assets/images/kernel_bypass/user_profile.jpg
---


## The article

# About this Blog Post
The purpose of this article is to discuss uses for Kernel-Bypass Networking and its application for improving network performance on Linux-based systems. The DNS team at GoDaddy has started researching use cases for a Linux-based network switch to supplement hardware-based options within a DNS point of presence (POP). This post outlines initial conclusions for future research.

# Linux Networking Stack
The Linux networking stack is based on [Berkely sockets](https://en.wikipedia.org/wiki/Berkeley_sockets) (BSD) which goes back to the early 1980's. All modern operating systems implement a version of the Berkeley socket interface. When writing an application that communicates over a network, a socket is created that can be used to send and receive messages like a stream. Typically, an application using BSD uses system calls to read and write data to a socket. Those system calls have overhead due to context switching and other impacts. The overhead of the built-in kernel stack is documented in [numerous studies](https://www.redhat.com/en/blog/pushing-limits-kernel-networking).

As an example of the processing required to send or receive data over a network, a request for data within a client computer goes from the application to a system call for the read request. That request is translated to a socket which includes the protocol and port. The information is then sent to the network protocol layer where a packet is created with the key information, i.e. address, port, etc. At this point, the packet is prepared for submission from the kernel to the driver of the network interface card (NIC). The driver then translates the packet to the physical transmission format which is passed to the NIC for transmission.

For a server, this process is reversed. If that server is acting as a router, a networking device that forwards data between networks, then the entire networking stack may not be engaged since the router is only interested in retransmitting the packets. Typically, a router is considered a layer 3 device. Referencing the OSI model below, if you consider the network stack as layers, then the router only needs to look at the first three layers to operate on the packet.

## OSI Model
```
    Layer 7 (Application):  Applications (like email or web browsers) use Layer 7 application protocols.
    Layer 6 (Presentation): Converts data to and from the Application layer. Translates the application formatting to network formatting and vice versa.
    Layer 5 (Session): Establishes and terminates connections between devices. It also determines which packets belong to which text and image files.
    Layer 4 (Transport): Coordinates data transfer between system and hosts, including error-checking and data recovery.
    Layer 3 (Network): Determines how data is sent to the receiving device. It's responsible for packet forwarding, routing, and addressing.
    Layer 2 (Data Link): Translates binary into signals and allows upper layers to access media.
    Layer 1 (Physical): Transmits signals over media. Actual hardware sits at this layer. 
```

The design of the BSD imposes constraints on how the data from a network source is handled by the OS. When a packet arrives from the NIC, it’s wrapped in a buffer object. That allocation can interfere with the dynamic memory allocator of the OS. For example, the buffer object can be forwarded between CPU cores in a multi-CPU system and accessed from multiple threads, which then requires locks for concurrent accesses.

# Kernel Bypass Networking
By moving protocol processing to userspace, which is typically at the application layer, the in-kernel network overhead can be minimized or even eliminated. The OS can dedicate the NIC to an application or it can manage the NIC by allowing applications to map packet queues to their address space directly. This allows applications to get access to network packets with less overhead. However, with [less overhead](https://medium.com/@penberg/on-kernel-bypass-networking-and-programmable-packet-processing-799609b06898) comes the responsibility for the application to manage the rest of the network stack, abdicated by the OS. Depending on the application this can be a large impact on development since there may not be a standard library or API for accomplishing this.

# Routing Performance of Kernel Bypass Networking
In looking at improving the performance of DNS services at GoDaddy, it became apparent that the routing system needed an upgrade. Consequently, when studying possibilities for improving routers, the option of attempting a software-based router seemed appropriate. One of the more popular solutions to software-based routing is VPP from [fd.io](https://wiki.fd.io/view/VPP/What_is_VPP%3F). The routing table used by VPP needs to be managed by other processes, specifically a routing protocol known as BGP4 (Border Gateway Protocol version 4). This protocol is the one used by the global Internet community, including ISPs and large enterprises, which collectively comprise the Internet. Routing information is shared between ISPs using BGP, in order to determine reachability, select optimal paths, and create the routing tables used for forwarding packets. The implementation of BGP used for this study is Free Range Routing (FRR), a mature and popular open-source routing package. FRR manages the routing table used by VPP, thus facilitating the kernel bypass for forwarding packets.


Install and setup of VPP in Linux required supported NICs and drivers. Once the application was built and installed there were several inclusions that had to be made in order to use it as a router. That included using the [Netlink](https://github.com/Oryon/vpp-netlink) and [FRR](https://github.com/FRRouting/frr/wiki/Alternate-forwarding-planes:-VPP) add-ons to VPP. Once all the build issues were solved the testing produced the following results. The additional results were based on configuration changes to the test nodes as well as updates to the software.

<table>
<thead>
<tr>
<th align="center">Performance at Switch</th>
<th align="center">Destination Server (Packets per second)</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">8.86 Mpps</td>
<td align="center">8.86 Mpps</td>
</tr>
<tr>
<td align="center">14.88 Mpps</td>
<td align="center">11.73 Mpps</td>
</tr>
<tr>
<td align="center">13 Mpps</td>
<td align="center">11 Mpps</td>
</tr>
<tr>
<td align="center">13.8 Mpps</td>
<td align="center">12.7 Mpps</td>
</tr>
</tbody>
</table>

While looking at these results, take note that to properly assess the performance of a router, the theoretical maximum performance for a 10GbE NIC is 14.88M packets per second (pps). This is based on the calculations from [this source](https://www.fmad.io/blog-what-is-10g-line-rate.html).

The results in the table above, show it's possible to get very close to line rate with very little work using VPP. Given some additional development time, it should be possible to leverage the solution for full line rate performance. This experiment shows that a software-based Linux router is a viable alternative to a hardware-based router. At this time, it isn't necessary to pursue this further at GoDaddy, but should the need arise, this would be a technology worth investigating more to improve the current design of the GoDaddy DNS system.
