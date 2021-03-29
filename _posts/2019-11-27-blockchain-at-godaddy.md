---
layout: post
title: "Blockchain at GoDaddy"
date: 2019-11-27 09:00:00 -0700
excerpt:  "This post provides an overview of Trademark Keeper and its backing blockchain: Hyperledger Sawtooth."
authors:
  - name: Matthew Rubino
    title: Sr. Software Engineer
    url: https://github.com/mtrubs
    photo: https://avatars.githubusercontent.com/mtrubs
---

## Introduction

We launched a beta of [Trademark Keeper](https://trademarks.godaddy.com) in select markets a few weeks back.
Trademark Keeper helps our customers secure their trademarkable assets in an immutable
digital ledger with a timestamp that can be used to provide proof of use and date of
first use. Trademark Keeper is backed by a blockchain in order to provide infallible
proof of the timing and history of use of the assets which it protects. Specifically, the
blockchain technology we chose to use is the [Hyperledger Sawtooth](https://www.hyperledger.org/projects/sawtooth) framework. This post
dives into some of the engineering specifics of building Trademark Keeper and setting up
GoDaddy’s blockchain.

## Trademarks as a Service

In regions where trademark rights are earned by being first-to-use a trademark (vs the
first-to-file a trademark registration), some of the primary deciding factors in disputes
are being able to prove when and how a trademark was first used as well as proving
ongoing and continual use. In these regions, the typical small business owner might not
realize that they begin to earn common law rights as soon as they use their mark in
commerce.

[Trademark Keeper](https://trademarks.godaddy.com) is a portal that makes records of
customer’s trademark rights by periodically taking screen captures of their website
homepage and also allowing customers to define and manage their trademarks. Over time, it
enables customers to build a history of use as well as clearly defining a date of first
use as seen by the system. Even without defining a trademark these screen captures can
help prove use from day one of a website launch. 

## How a Blockchain can help with Trademarks

Securing a trademark comes down to defining and capturing the information needed to prove
a history of trademark use. As mentioned above, a website can constitute proof of use, so
we need to store screen captures of it, but we also need to provide proof of when those
captures were taken. Enter the blockchain. We can achieve this goal through a combination
of the data structures that comprise a blockchain, the infrastructure of the blockchain
network and information we are capturing within the chain. 

### Why use a Blockchain?

Let’s start with why a blockchain is a good solution for our problem. A blockchain is a
data structure consisting of "blocks" that are "chained" together via hashing functions.
Each block contains data which in most cases represents an ordered series of transactions
or transformations to the "world state" of the blockchain. If you were to start at block
zero and apply all these transactions/transformations to the underlying blockchain data
store up to the current block, you would have the current world state. But you can also
revisit older blocks to retrieve state at previous points in the chain.

Besides the data, each block also contains a data structure known as a Merkle tree
defined as a tree of hashes where the leaf nodes consist of the hashes of a set of
transactions (the data) being stored in that block. Each parent node is the hash of the
combined hashes of its two children. At the root of the tree you have a single hash which
represents a validator for the data of the entire block. If even a single byte of data in
the block were to be manipulated, that branch of the Merkle tree would change all the way
up to the root, thus resulting in a different hash and highlighting the manipulation. 

Each time a new block is created the Merkle root of the new block is hashed together with
the current block head (the hash representing the current top-level block) to get the new
block head of the entire chain. This creates the "chain" effect as the block head
represents a validator for the current block but also every block that came before it! As
we grow our blockchain, we have a series of blocks containing data, a short hash string
that represents that data and a series of hashes representing the data over time from
beginning to end. 

### A Private Blockchain as Secure as a Public Blockchain

This is great, but not all that useful on its own. For one, we are in control of this
blockchain data structure so we could re-write its history without much trouble, which
would in turn change the Merkle trees and the block hashes and neither we nor anyone else
could prove whether it remained consistent or not. Also, a single instance of our
blockchain faces similar vulnerabilities to any centralized data store. If a hacker were
to gain access, they could potentially re-write history, which brings into question the
legitimacy of the blockchain. In order to offer a product that proves the existence of a
document at a specific point in time, there were a couple of problems we needed to solve. 

First, we needed to make our blockchain more robust. One of the innovations of blockchain
technology is the idea of a shared ledger of information across a network of nodes. In
order for this to work the nodes need to work together to append new data (blocks) to the
shared ledger through a process called consensus. Explaining consensus in detail is a bit
out of scope here; in brief, it is the manner in which a blockchain network safely
appends new blocks to the shared data structure by agreeing upon the next block. Having a
shared ledger across multiples of nodes gives us two important features. First, it helps
to solve the robustness concern; a hacker would need to take over not just one node, but
rather many nodes spread across the world to compromise our network. Second, it gives us
the ability to safely share our network with third parties in order to participate, or to
audit the network just by allowing them to maintain a node. 

Consensus makes it nearly impossible for malicious parties to attack and rewrite our
blockchain history, but what’s to stop us - the all-powerful stewards of our private
blockchain network - from manipulating it? Well it comes back to the underlying data
structure detailed above. Every block head produces a new hash that represents all of the
data in the chain up to that point. If I were to write down the block hash for block #1267
in the chain at the time of its creation and revisit that block’s block hash 5 minutes, a
month, a year or even 20 years from now, it would be the same. If the hash has not changed,
we can say with absolute certainty (proven by the laws of mathematics) that the data in
our chain has not changed in that block or any block that came before it. But just writing
it down seems error prone, who audits what I wrote down? The last piece of this puzzle is
called anchoring. 

With a private blockchain there is always apprehension around one or a handful of
entities managing the ledger. After all, a private blockchain does not operate with an
anonymous network of thousands of peers working independently to mine coins for profit,
thereby maintaining the validity of the blockchain (e.g. Bitcoin). Rather than rely on
the credibility of GoDaddy alone, we used a technique known as anchoring. Anchoring is
the idea of storing only the current block head in a public ledger such as Ethereum or
Bitcoin. Before anchoring the next block, the previous can be checked against what
already exists publicly. Should a discrepancy be detected then the current state is known
to be tampered with and should be rolled back. If it matches, we can safely assert no
meddling and proceed. This helps to elevate the private ledger to the integrity level of
a public ledger. As we are only storing the block head the cost of such a public write is
cheap and due to the nature of hashes the data itself is kept private.

## Implementing Trademark Keeper

### Hyperledger Sawtooth

For this product we decided to build our implementation on top of Hyperledger Sawtooth.
Sawtooth is a private blockchain with a few unique features that we found attractive.
Firstly, it was built to be private, rather than a port of a public chain into the
private sector. This means that it offers different consensus algorithms that are still
crash fault tolerant but need not be byzantine fault tolerant. What that boils down to is
higher scale and throughput via less intensive validation and cheaper operational costs
as transactions are free and there is no form of crypto-currency or transaction fees. 

The configurability of Sawtooth allows us to change consensus from block to block. This
gives us flexibility in the future around inviting 3rd parties into our blockchain
network or, should the need arise, even make our chain more public. We kicked off our
chain with a consensus algorithm called
[Proof of Elapsed Time (PoET)](https://sawtooth.hyperledger.org/docs/core/releases/latest/architecture/poet.html)
. PoET is classified as a leader election algorithm similar to Proof of Work. PoET
however differs in its method for selecting the "leader" (the node that will create the
next block in the chain). It is able to select the next leader by having each node
generate a random amount of time the node must wait before submitting a block for
validation. PoET accomplishes this by using secure CPU instructions which can be proven
to have taken place so a node can’t fake its wait time or submit earlier than it is
allowed to. The node with the lowest wait time is the "leader" for a given block since it
will submit its block first. As a layer of security, there is an accompanying
[z-test](https://sawtooth.hyperledger.org/docs/core/releases/latest/architecture/poet.html#z-test)
that will blacklist a node if it is determined to be winning a disproportionate share of
block creation.

The final, and unique, aspect of Sawtooth that attracted us was the notion of batches and
dependencies. Batches represent a set of transactions related or otherwise. Transactions
themselves are able to define a list of dependencies (state addresses) from which they
read or to which they write. This helps the system process more at once. Since
dependencies are known up front, the system can process transactions in a more parallel
manner and optimize its throughput much more so than a first-in-first-out type of model.

### Addressing Schema for Sawtooth

The deterministic nature of the Sawtooth addressing schema also offers some interesting
abilities in terms of data discovery and organization. This is all self-defined, so a
good deal of thought needs to (and did) go into where we store domain and trademark data
on chain. For example, a word mark is defined as `<namespace:6> + 00 + <word:54> +
<area:4> + <class:4>`. Searching by namespace alone allows us to query all trademarks,
adding 00 would give all marks with words and adding the word itself would give us all
matching trademarks defined regardless of area of use or classification. As our data set
grows it should lead to an interesting trademark and brand registry all aimed at helping
consumers protect themselves and avoid possible infringement, hopefully from the
beginning of their story.

## Going Forward

We are very excited to have had this product enter beta and look forward to helping more
people document their trademark rights. Right now, users can only document their
trademarks, but we soon hope to offer an ability to add areas of use and classifications
to those trademarks, all backed on the sawtooth blockchain. Eventually we may implement a
means of ownership transfer and start to build and exchange monetary value behind one's
brand with their trademarks. There are plenty of interesting technological challenges
that a blockchain could help streamline at GoDaddy, one example being domain transfers.
Trademark Keeper represents one of GoDaddy's first steps into blockchain technology, but
it won't be the last.
