---
layout: post
title: Leveraging Foreign Function Interfaces at GoDaddy
date: 2023-03-20
cover: /assets/images/leveraging-ffis/cover.jpg
options:
  - full-bleed-cover
excerpt: By leveraging foreign function interface and C shared libraries, GoDaddy can unify the implementation of libraries in Go or Rust and share those libraries with other languages.
keywords: FFI
authors:
  - name: Jeremiah Gowdy
    title: Senior Principal Architect
    url: https://www.linkedin.com/in/jgowdy/
    photo: /assets/images/jgowdy.png
---

## The Challenge
GoDaddy has built a large and diverse codebase as a 26-year-old technology company.  That codebase includes many different programming languages that have been adopted over the years, combined with many acquisitions bringing additional programming languages into the fold.  When we need a cross-cutting shared library, we implement the same library functionality in each language.  This naturally creates a significant maintenance burden even if we limit ourselves to the five actively used programming languages in GoDaddy.

Cross-cutting libraries at GoDaddy are maintained based on a contribution model where the teams that consume the library help maintain it.  Beyond the wasteful duplication in labor between different languages, we've found that the libraries tend to differ in how actively they're maintained and updated with the latest APIs and functionality.  Unfortunately, there can even be differences in implementation details as there's no effort to strictly synchronize the functionality between platforms.

## The Idea
Towards the end of 2021, I realized this problem was a significant drain on our resources and I had an idea to address it.  Most higher-level languages support some method of calling C shared libraries (.so, .dylib, .dll); a functionality typically referred to as foreign function interface (FFI).  However, it wouldn't be suitable to write our shared library code in C or C++ due to concerns about memory safety issues.

Fortunately, there are two higher level languages that do a reasonably good job creating C type shared libraries: Rust and Go.  I stood up a prototype project and recruited a few of my colleagues to assist me with creating a proof of concept which we called Cobhan.  [Cobhan](https://github.com/orgs/godaddy/repositories?q=cobhan&type=all) defined a set of standards for FFI development (e.g., all allocations across the boundary are provided by the caller) and a data type called a Cobhan buffer which is length delimited rather than null delimited.

One of the libraries used at GoDaddy, [Asherah](https://github.com/godaddy/asherah), has a Go implementation that is currently used as a sidecar.  We planned to take that Go implementation and wrap it as a C library, then attempt to consume it from Node.js, Ruby, Python, Java, and C#.

## Results
The results of our project were largely successful.  We now publish [Asherah-Node](https://github.com/godaddy/asherah-node), [Asherah-Ruby](https://github.com/godaddy/asherah-ruby), and [Asherah-Python](https://github.com/godaddy/asherah-python) on GitHub leveraging Cobhan methodologies.  The language specific libraries themselves are thin wrappers to the FFI calls, largely dealing with data marshaling, buffer allocation, and threading model concerns.  Each platform has its own best methods for making FFI calls, so for each platform we needed to run performance tests to validate the FFI approach.

An example of where performance implications were relevant is with Node.js.  Originally our Node.js implementation used the npm package `ffi-napi` which provided an easy-to-use, high-level interface for making FFI calls.  However, the performance of those calls impacted our applications to the point where we explored other solutions.  In the end, we created a thin Node-API add-on layer in C++ and compiled our module with `node-gyp`.

While leveraging FFI to unify our codebases is still a work in progress, we have had our FFI based Asherah libraries in production successfully for months.  Platform support for FFI has improved greatly across the board over the years.  For example, we've noticed that OpenJDK has a new FFI interface in incubation that will facilitate the consumption of C shared libraries rather than using Java Native Access.

## Go vs Rust
We're now working on a Rust based shared library that will provide shared configuration management.  We've found there are advantages and disadvantages to using Rust as the base language for the shared libraries versus Go.  With Go, we ran into a significant issue where Go does not play nicely with Alpine's use of musl libc.  Go's compiler only produces C shared libraries with the `init-exec` thread local storage model.  However, musl libc does not support using `dlopen()` to dynamically load libraries with the `init-exec` model, as this would require space to be reserved at initial load time.  If the Go compiler were able to produce shared libraries with the `global-dynamic` thread local storage model like gcc does, there wouldn't be a compatibility issue.  The Go standard library also makes glibc assumptions like the idea that shared libraries would be passed argc/argv despite incompatibility with the ELF standard, and crashes if those parameters are not passed.  Unfortunately, this means that any of our systems consuming Go based shared libraries on [Alpine](https://www.alpinelinux.org/), are forced to switch to a glibc based Linux distribution like Debian.  We hope to see these compatibility issues addressed in the future as the Go compiler evolves to better work with standardized systems and not presuming glibc behaviors.

## Conclusion
Given our results so far, we feel that despite the bumps along the way, our strategy of using a shared code base written in Rust or Go to develop libraries to be consumed by our other platforms is paying off and will continue to pay off, versus the strategy of implementing the same functionality repeatedly in each supported language.

If helping solve the challenge of shared libraries interests you, check out our [current job openings](https://careers.godaddy.com/search-jobs).

_*) Cover Photo Attribution: Photo by <a href="https://www.flickr.com/photos/nasawebbtelescope/52692145572/in/album-72177720305127361/">NASA’s Webb Reveals Intricate Networks of Gas and Dust in Nearby Galaxies</a> on <a href="https://www.flickr.com/photos/nasawebbtelescope/52692145572/in/album-72177720305127361/">NASA</a>_
