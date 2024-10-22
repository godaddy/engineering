---
layout: post
title: GoDaddy benchmarking results in up to 24% better price-performance for their Spark workloads with AWS Graviton2 on Amazon EMR Serverless
date: 2023-11-20
cover: /assets/images/emr-serverless-on-arm64/cover.png
options:
  - full-bleed-cover
excerpt: Learn how GoDaddy is helping its developers provision infrastructure quickly and securely using AWS Cloud Development Kit.
keywords: Amazon EMR, Analytics, Best Practices, Graviton, Serverless
canonical: https://godaddy.com/resources/news/emr-serverless-on-arm64
authors:
  - name: Mukul Sharma
    title: Software Development Engineer
    photo: /assets/images/msharma.jpeg
  - name: Ozcan ILIKHAN
    title: Director of Engineering, Data & ML Platform
    url: https://www.linkedin.com/in/ilikhan/
    photo: /assets/images/oilikhan.jpeg
---


As a part of a larger benchmarking EMR Serverless for GoDaddy batch processing workloads study, we measured effect of architecture (arm64 vs. x86_64) on total cost and total runtime.

Amazon Web Services (AWS) had previously showcased a 27% boost in price-performance for Spark workloads with Graviton2 on EMR Serverless using the TPC-DS 3 TB scale performance benchmarks. Intrigued by these results, we conducted an in-depth investigation using GoDaddy's real-world production tasks to further understand the practical benefits of this integration. Our findings were astounding, as the EMR Serverless on arm64 consistently surpassed x86_64 in terms of cost-effectiveness. More specifically, we noted a 23.85% enhancement in price-performance across a range of jobs when using Graviton2.

Check out the blog post on the [AWS Big Data Blog](https://aws.amazon.com/blogs/big-data/godaddy-benchmarking-results-in-up-to-24-better-price-performance-for-their-spark-workloads-with-aws-graviton2-on-amazon-emr-serverless/) to see the full benchmarking results.

If you want to be part of an awesome team that works to solve problems and build solutions for millions of small businesses, check out [our current open roles](https://careers.godaddy.com/search-jobs).
