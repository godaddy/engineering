---
layout: post
title: "DNS-over-HTTPS: Privacy and Security Concerns"
date: 2019-09-04 09:00:00 -0700
cover: /assets/images/doh/DoH-blog-picture.png
excerpt: New DNS privacy standards (DoH and DoT) have been published by the IETF. DNS also has had backwards-compatible security extensions added via DNSSEC, for several years. This post examines the browser-supported DoH and compares it to DoT, and examines privacy, security, and risks.
authors:
  - name: Brian Dickson
    title: Principal Software Engineer
    url: https://www.linkedin.com/in/brianpeterdickson
    photo: https://avatars3.githubusercontent.com/u/54912895?s=400&v=4
---

## About the Author
Brian Dickson is a member of the DNS team at GoDaddy. This team is responsible for all internal and exteral DNS, including our DNS product (hosted authoritative DNS services), our corporate DNS domains (authoritative), and internal DNS resolution.

## About this Blog Post
This blog is intended to highlight concerns for anyone interested in security and privacy or who is responsible for managing software, networks, or DNS infrastructure, which includes ISPs, regulators, enterprises, personal (home) networks, power users, and travellers. It is intended to provide limited guidance for what to watch for, possible policies to respond to, and terminology for helping conversations on these subjects.

## What is DNS
The Domain Name System (DNS) is both a protocol and a distributed database of information concerning hosts and services on the public Internet. The most common information provided are the IP (Internet Protocol) addresses of hosts and services (including both IPv4 and IPv6). Communication between internet-connected devices occurs over the Internet Protocol (IP), and always uses IP addresses.

DNS was originally specified in the standards published by the [IETF](https://www.ietf.org), as [RFC882](https://tools.ietf.org/html/rfc882) and [RFC883](https://tools.ietf.org/html/rfc883), and later updated as [RFC1033](https://tools.ietf.org/html/rfc1033), [RFC1034](https://tools.ietf.org/html/rfc1034), and [RFC1035](https://tools.ietf.org/html/rfc1035).

DNS has scaled extremely well, handling the growth of the Internet for the last 35 years. Client systems make use of intermediaries known as "resolvers", which do the bulk of the "look-up" work in DNS, and which implement caching to avoid duplication of look-ups. The actual data in DNS is hosted on what are known as "authoritative" servers. In addition, the namespace for DNS is hierarchical, with each level of the hierarchy only needing to serve/maintain information about the next level down in the "tree" of names.

When a browser wants to access a website, such as www.example.com, the browser asks the local operating system to look up that name. The local system then sends a request to one of the configured DNS resolver(s) and waits for the response which will be an IP address that the browser needs. The resolver checks its cache for helpful answers, and whenever it does not find the information it needs, it talks to the corresponding authoritative DNS servers to get what it requires. It starts with the "root" servers, who tell it where to find the "com" top-level domain servers. Then it asks the "com" servers about "example.com", and finally it asks the "example.com" servers about www.example.com. 

If a site is popular, the resolver will typically have the data in its cache and return it immediately. This, in turn, not only ensures the DNS system is not overloaded, but also significantly improves the performance for the World Wide Web.

## Why does DNS need Security?
The design of DNS included an important architectural decision: the transport protocol used is user datagram protocol (UDP). Unlike transmission control protocol (TCP), UDP is connectionless, stateless, and lightweight. In contrast, TCP needs to establish connections between end systems and guarantees packet ordering and delivery. DNS handles the packet delivery reliability aspect internally and avoids all of the overhead of TCP.

There are two problems this introduces. The first is that UDP has no way of knowing whether the UDP packet it receives was sent by the actual IP address of the server, or if the IP address was forged ("spoofed") by someone else. This is because UDP is stateless and connectionless; there is nothing at the transport level protecting against spoofing.

The second problem is that DNS resolvers maintain a cache, which necessarily relies on trusting the answers it receives. This trust means that if an attacker succeeds in spoofing data towards a DNS resolver, then that data will be used repeatedly to provide forged answers to clients.

In 2008, a security researcher, Dan Kaminsky, presented a talk at the Black Hat conference on methods attackers could use to do this "cache poisoning" attack reliably and at scale. See [The Great DNS Vulnerability of 2008](https://duo.com/blog/the-great-dns-vulnerability-of-2008-by-dan-kaminsky).

### DNSSEC: DNS SECurity extensions
  The only long-term solution for the cache poisoning problem is to protect the data in the DNS system using cryptographic signatures. The specific kind of security required, which DNSSEC provides, is _data integrity_. This is an assurance, to an astronomical degree of certainty, that the data one receives is the same data that the owner inserted into the system.

The basic model of this is: if the data is signed by the real owner of the data, and the owner's legitimacy in signing its data is itself signed by the parent in the hierarchy, the data validity can be traced back to a single "root of trust". This was implemented in a series of updates to DNS, known collectively as DNSSEC, and documented in [RFC4033](https://tools.ietf.org/html/rfc4033), [RFC4034](https://tools.ietf.org/html/rfc4034), and [RFC4035](https://tools.ietf.org/html/rfc4035) with a number of subsequent additions and improvements.

Only DNSSEC can prove that the data a resolver receives is legitimate, and local systems must either blindly trust their resolver, or optionally can themselves validate DNSSEC-signed DNS answers. Performing this validation is moderate in terms of computational resource used by an end system. However, to do this, end systems require specific software upgrades, something that has not yet been done widely.

DNSSEC is backwards compatible with pre-DNSSEC DNS, and its use is optional. It is strongly encouraged, however, since the protections it provides are only available if it is enabled.

  Additionally, DNSSEC Authentication of Named Entities (DANE) provides mechanisms for securely publishing associations between DNS host/service names and server certificates ([RFC6698](https://tools.ietf.org/html/rfc6698)). DANE can be used for stronger validation of web server certificates (the primary use case). By linking the certificate for a server or service to DNS, the "rogue CA" problem can be eliminated via non-repudiation - only the domain owners' certificate can pass the validation process. The limitations of DANE are that it requires DNSSEC, including DNSSEC validation, as well as native browser support.

DANE also enables the opportunistic encryption of server-to-server email connections ([RFC7672](https://tools.ietf.org/html/rfc7672)), or the serving email public keys for end users via OpenPGP or S/MIME (using the OPENPGPKEY record type defined in [RFC7929](https://tools.ietf.org/html/rfc7929), and the SMIMEA record type defined in [RFC8162](https://tools.ietf.org/html/rfc8162)).

## Why does DNS need Privacy?
The Internet originally grew out of a small community of research and education networks, built on top of a network which was itself experimental and funded by the government. Those original networks were small enough and few enough that it was reasonable to trust the network and those operating and using it.

While improvements in security have been added onto the applications and protocols in use on the Internet, there was still a fundamental expectation that only the network operators, such as ISPs, had access to the infrastructure of the Internet.

In 2013, Edward Snowden disclosed the existence of a variety of comprehensive global surveillance systems. See [Global surveillance disclosures](https://en.wikipedia.org/wiki/Global_surveillance_disclosures_(2013%E2%80%93present)).

In response, the Internet Architecture Board of the IETF released [RFC7258](https://tools.ietf.org/html/rfc7258), which states:
> Pervasive monitoring is a technical attack that should be mitigated in the design of IETF protocols, where possible.

This in turn, lead to the requirement to protect DNS queries from surveillance on the "last mile" portion of the Internet, specifically between the local system (client) and the resolver, as detailed in [RFC7626](https://tools.ietf.org/html/rfc7626).

The first pair of protocols implementing this were DNS over TLS ("DoT"), and DNS over DTLS, published in [RFC7858](https://tools.ietf.org/html/rfc7858) and [RFC8094](https://tools.ietf.org/html/rfc8094) respectively.

Separately, and subsequently, a DNS over HTTPS ("DoH") standard was produced and published as [RFC8484](https://tools.ietf.org/html/rfc8484). The "S" in HTTPS refers to transport security, specifically the use of TLS (previously called SSL) to encrypt the HTTP traffic.

## DoT vs DoH vs "Classic" DNS/TCP and DNS/UDP
The four DNS transport protocols (DoT, DoH, DNS/TCP, and DNS/UDP) all support the underlying DNS protocol. The context in which we are specifically comparing these transport methods is the client-to-recursive communications channel. DNS resolution relies on recursive resolvers to do the "heavy lifting" of obtaining DNS answers. Clients are comparitively simple, and must send DNS requests to their respective resolvers. Thus, this channel is important from a privacy perspective, since it is used for host systems supporting personally identifiably users, such as laptops, desktops, mobile devices, and consumer devices such as gaming systems. DNS client queries are PII (personally identifiable information) that ties a user to a DNS query.

The recursive-to-authoritative channel is a separate concern. There, the recursive resolver acts on behalf of many clients. The resolver maintains a cache of DNS answers recently received, which is independent of which client requested the answer. Popular domains are mostly served from this cache, meaning very few client queries actually require the resolver to contact an authoritative server to get the answer on behalf of the client. Thus, the privacy concern is somewhat variable and/or diluted, depending on what specific domain is being queried, and how many clients each resolver has. More clients mean a higher probability that the resolver's cache may provider answers (avoiding any resolver-to-authoritative traffic). A larger pool of concurrent resolution traffic makes correlation of clients to queries more difficult.

All four DNS transport protocols support DNSSEC in theory. In practice, the issue of whether DNSSEC is used and whether validation occurs is dependent entirely on the resolvers' operators.


The main distinctions between the four _protocols_ are their channel security (visibility to on-path observers), and their interaction with network administrators for monitoring and blocking of DNS traffic. Both DoH and DoT provide channel security, since the DNS traffic itself is encrypted for both. All three of DNS/UDP, DNS/TCP, and DoT, are compatible with network monitoring and blocking at an IP level (address and port). However, DoT does encrypt the actual DNS queries, so only the existence of a DNS server would be visible to an observer (or possible to block).  Since DoH uses the same transport as HTTPS, it is (by design) not compatible with the network administrator's monitoring and blocking, as there is no way to distinguish DoH from other HTTPS traffic.
 
The other areas of comparison between DoH and DoT are the proposed deployment profiles, changes to the host "stack", and selection of DNS resolvers.

DoT was developed as an "upgrade" to client-resolver DNS communications. It was intended to operate on a dedicated port, specifically so that both the client and server agreed that communication would be TLS-only (encrypted). This avoided some of the early problems when older protocols attempted to do "opportunistic TLS", via STARTTLS. By doing enforced TLS, many attack methods are impossible (e.g. downgrade attacks on the protocol). DoT was also intended to act as a drop-in replacement (or upgrade) to existing DNS clients at the system level, so that applications could continue interacting with the host operating system (OS) without requiring modifications. Thus, the whole application-OS-DNS part of the client stack was conceptually identical, including all of the security, deployment, and management mechanisms. While DoT was compatible with third party DNS resolvers, it was not specifically intended for them, and was effectively resolver-neutral. Theoretically, any DNS resolver could be upgraded to DoT, and likewise, any network operator could choose to allow or block DoT traffic to DNS resolvers to whom it did not want to allow access (e.g. so that internal DNS resolvers could be exclusively used, for enterprise DNS).

On the other hand, DoH has largely been developed by web browser vendors and developers, with the primary design and intent to be incorporated directly in the browser. This intentionally bypasses the host OS "DNS stack", which manages DNS resolver choice, implements a host-wide DNS cache, and provides DNS service to all host applications.

There are several important changes resulting from the DoH functionality as implemented, and from the proposed DoH operational models. Those include:
* Changing the authority model for DNS Resolver selection, from being done exclusively by a privileged host administrator, to a per-user free-form choice
* Bypassing the OS stack, including ignoring any configured selections of DNS Resolver
* By separating each application into its own DNS "island", any expectation of completely uniform DNS results is weakened or destroyed.
* Since DoH uses the same port as HTTPS, changes to the user-specific DoH resolver will not be visible outside of the scope of the browser itself. All an external observer (including the host OS itself) will see is that an HTTPS connection has been established.
* At least two browser vendors (Firefox and Chrome) have announced an intent to override whatever system DNS resolver choice may be present, with their own list of public DNS resolvers (including a default choice for each vendor), and to change the resolver configurations to be "DoH on by default" at some unspecified date.

## Things That Can Go Wrong (when using a public DoH resolver)
* DNS information leakage
  - If an enterprise DNS resolver doing resolution for internal-only names is bypassed by configuring a public DoH resolver, the names being queried will be leaked to the public DoH resolver.
  - Internal names may expose sensitive information, including physical locations, security zones, function/role information, etc.
* Breaking internal DNS resolution
  - In addition to leaking information about internal names, replacing an internal resolver with a public DoH resolver will result in failure to resolve internal names, thus breaking services that depend on those names
* Preventing DNS-based passive malware detection
  - Existing systems (e.g. enterprise-grade commercial and open source products) detect malware by observing patterns in DNS traffic, and looking for anomalous behavior. Embedding these systems in DNS resolvers is a way to preserve this functionality but can only be done if the DNS resolver is under the control of the enterprise itself.
  - Third party resolvers reached via DoH, **cannot** be blocked (and by being blocked, forcing the users to use the administrator-configured DNS resolver)
  - Third party resolvers reached via DoT, **can** be blocked, thus preserving existing passive detection (by forcing the user to use the configured DNS resolver)
  - Malware configured to use DoH, can ironically determine whether it is talking to the DoH server of its choice, by use of TLS certificate validation. Only the operator of the DoH server would have the necessary private keys to construct the matching certificate, so it would be impossible to intercept the DNS queries from malware if it did validation.
* Preventing detection of change of DNS resolver
  - In both the vanilla DNS (port 53, UDP or TCP), and in DoT, the unique port number lets passive monitoring systems identify new DNS traffic, trivially.
  - In DoH, there is no unique port, and no way to identify that the HTTPS traffic is in fact DNS resolver traffic. A compromised host whose DoH resolver has been surreptitiously changed, will not be detectable externally. By its very nature, such a host may have had its host-level defenses defeated, and thus there would possibly be cases of undetected host compromise inside a network.
* Interfering with existing DNS-based services, including anti-malware, anti-adult-content, mandated national ISP controls, anti-spam, and similar services
  - Numerous services use DNS resolvers as the delivery mechanisms for filtering DNS responses. There are a large variety of such services, which generally require configuring hosts to use specified DNS resolvers. If DoH resolvers are used instead, this will automatically break these services.
* Putting ordinary users in (criminal or civil) jeopardy where bypassing network-provided DNS services may be policy violations (employment agreements), or subject to local/regional/national criminal laws
  - As a general rule, informed user consent should be necessary for an application to potentially put the user at jeopardy for either civil or criminal violations
* A browser may be configured with "helper" applications for any number of URI-types. Those helper applications, when resolving the hostname of any URI passed to them, may not obtain the same result as the browser
* The DoH resolver may be less **_secure_** than the pre-existing system OS-selected DNS resolver.
  - For example, the regular DNS resolver may do DNSSEC validation, preventing DNS cache poisoning or results tampering, or at least making such tampering evident to the application. If the DoH resolver does not do validation, it would be demonstrably less secure
* The DoH resolver may be less **_trustworthy_** than the regular DNS resolver, particularly depending on things like jurisdiction, respective policies of the DNS resolver operators, and any relationship the user/host has with either party.
* If the DoH resolver choice is changed, the new DoH resolver may be malicious. This could interfere with other in-browser components (plug-ins) which rely on DNS to perform their activity, possibly including malware prevention (among others).

## This Is Not A Test
"If this had not been a test, you would have been instructed where to tune in your area for news and official information." - [paraphrased EBS text](https://en.wikipedia.org/wiki/Emergency_Broadcast_System)

Browsers are **_already implementing_** DoH, although they do so as a "disabled" feature configurable via advanced user preference.
This includes both Chrome (Google) and Firefox (Mozilla) browsers. 

For Firefox, the code is present on releases since Firefox 62, and can be enabled and configured using the "about:config" method (browser bar entry), and looking for fields that start with "network.trr": 
* "network.trr.mode" being set as "2" turns on DoH.
* The default DoH resolver is CloudFlare, "https://mozilla.cloudflare-dns.com/dns-query"
* DoH resolver is selected via the "network.trr.uri" being configured as such



For Chrome, the code is available in version 66, minus control via the User Interface (UI).
From https://bugs.chromium.org/p/chromium/issues/detail?id=799753

> You can enable DNS-over-HTTPS via a command line flag, e.g.

`chrome.exe --enable-features="dns-over-https<DoHTrial" --force-fieldtrials="DoHTrial/Group1" --force-fieldtrial-params="DoHTrial.Group1:server/https%3A%2F%2Fcloudflare-dns%2Ecom%2Fdns-query/method/POST`

> (The above are Windows-specific instructions; presumably similar methods are available on other operating systems such as Linux and Mac OS X.)

By being implemented _already_, the malware bar has already been lowered considerably; malware would only need to make user-level changes to the browser preferences, to enable DoH and to change the specific DoH resolver. This would have the effect of bypassing all DNS-based controls and facilitating DNS-based malware C&C (command-and-control) communications which would no longer be visible or detectable. The scripting involved (to enable DoH and change resolver) is as close to trivial as can be imagined - it is the equivalent of writing "Hello world" into a file.

_Non-Browser_ Applications for mobile devices which use DoH have already been discovered on both the Google Play and the Apple App stores.

## Conclusions
If you have read this far, you may be concerned (to a greater or lesser degree) by some of what you have read.
What you should do, or whether you need to worry, is probably largely a factor of your specific environment:
* If you are an end user, with your own personal (non-employer-owned) machine, your main concerns should be about whether any alternative DNS resolver (beyond manually configured or DHCP provided) is enabled/configured. The main issue with this would be when you are using someone else's network, and whether you are violating their policies or expectations. This is particularly true when traveling to other countries, when this small change might violate local laws. This may also be true in a BYOD (bring your own device) environment, where this could violate your employer's policy, with potential employment-related consequences.
* If you make use of DNS policy based filtering services (common in home networks, and not uncommon in enterprise networks), enabling alternate DNS resolvers will probably prevent these services from working.
* If you are in an environment where there is a mixture of private and public DNS (typically an enterprise scenario), there are two consequences of enabling alternative DNS resolvers:
  * The private DNS will stop working
  * Data about the private DNS zones will leak to the alternative DNS resolver
* If DNS monitoring is in use for detection of malware, enabling alternate DNS resolvers will likely cause this monitoring to fail silently. The monitors will no longer see the DNS traffic, in a way that may not trigger any alarms.

There are not a lot of good options for addressing any of these problems.
* It may be advisable to begin inspecting browser configurations:
  * ...Particularly whenever there is an upgrade to browser software.
  * You may want to disable automatic updates
    * ...which in turn may result in a lowered security posture.
    * Automatic updates are preferable since they avoid leaving known vulnerabilities unpatched. 
* It may be advisable (or even necessary) to "black list" particular browers (or browser versions), if you need to have a stricter security posture.
  * Browsers which expose DNS configuration to unprivileged users:
    * May be more vulerable to malware that changes DNS settings.
      * Malware frequently uses DNS for contacting Command and Control (C2) hosts
      * Malware detection often relies on detecting these C2 DNS queries
      * Malware even uses DNS as a transport to download malicious payloads, to evade packet filtering and inspection
    * May enable bad actors to exfiltrate data over DNS.
      * Note that this exfiltration method would also bypass most anti-exfiltration systems
* It may even be necessary to deploy advanced "[Menace](https://en.wikipedia.org/wiki/Backronym) in the Middle" ([MitM](https://en.wikipedia.org/wiki/Man-in-the-middle_attack)) solutions to decrypt and inspect all HTTPS traffic exiting your network.
  * MitM is generally a bad idea, due to the risks associated with having unencrypted traffic (even if only inside the MitM machine).
  * It also has the potential to be used by malicious actors, should there be a compromise of the MitM infrastructure or control-plane elements (such as private keys).
  * MitM itself may encourage users to bypass the MitM, making it both risky and ineffective.

Given the general interest in DNS privacy, it may also be advisable to stand up your own DoT or DoH servers, or upgrade from regular DNS to DoT or DoH on your resolvers. This provides improved privacy to end users, and may discourage use of third party DNS resolvers operating on DoH.

Impacted parties may want to contact their vendors to express concerns. Other actions worth considering include joining DNS operator groups such as [DNS-OARC](https://www.dns-oarc.net), DNS standards development groups (IETF or RIPE), contacting representatives of their respective trade groups, or investigate other technical solutions (such as alternative browsers).

## Additional Suggested Reading
Geoff Huston's blogs on DoH:
* [Opinion: What Does DoH Really Mean For Privacy](https://blog.apnic.net/2019/04/08/opinion-what-does-doh-really-mean-for-privacy/)
* [Opinion: Clarifying What DoH Means For Privacy](https://blog.apnic.net/2019/04/15/opinion-clarifying-what-doh-means-for-privacy/)
