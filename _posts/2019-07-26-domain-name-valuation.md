---
layout: post
title: "Using Deep Learning for Domain Name Valuation"
date: 2019-07-26 09:00:00 -0700
cover: /assets/images/domain-name-valuation/neuralnetwork.png
excerpt: How we built GoDaddy Domain Appraisals (GoValue) with deep neural networks and achieved accuracy better than a human expert.
authors:
  - name: Jason Ansel
    title: Senior Principal Engineer
    url: https://jasonansel.com/
    photo: https://avatars.githubusercontent.com/jansel
---

In 2017, GoDaddy launched [GoDaddy Domain Appraisals] also known
as GoValue for predicting the value of a domain name on the aftermarket.
Since 2017, we have continued to improve GoValue and it has been used by both
buyers and sellers on the domain name aftermarket to better price premium
domain names.  This post dives into some of the technical details of how
GoValue works.  We will start by exploring some of the challenges of domain
valuation in the aftermarket.

[GoDaddy Domain Appraisals]: https://www.godaddy.com/domain-value-appraisal


## What is a name worth?

This can be a very difficult question to answer, but it is one that domain name
investors need to answer every day.  If you compare valuing a domain to valuing
stocks, you can begin to see the difficulty of the problem.  With stocks,
you have vast amounts of data about a company’s financial performance,
but with a domain name you have at most 63 characters.  With stocks, there
are millions of shares and a robust bid/ask spread, but with a domain name
there is only one domain and once it is sold it may never be available again.
In some sense, buying domains names is closer to buying unique pieces of art.
It is a market dominated by experts who have developed the skill to value
domain names through years of experience.

A simple answer to the question of what a name is worth is that it is
worth what a buyer is willing to pay for it.  However, in domain name
investing there are two types of buyers.  The first type of buyer is the
domain name investor.  Domain name investors are looking for good value in
order to resell a name and typically either register new domain names or use
auction websites, such as [GoDaddy Auctions],
that have much lower prices.  The second type of buyer is an individual or
business intending to use the domain name to build a website.  If this
type of buyer is willing to pay for a premium name (as opposed to finding an
unregistered one), they may be willing to spend orders of magnitude more
money than the domain name investor.  However, for a specific name, there
is a low probability that this second type of buyer will exist.  What many domain
name investors are trying to estimate is: 1) the probability there will be
a buyer within a specific time period, and 2) how much that buyer will be
willing to pay if they appear.  The domain name investor will pay far less
for a name because they must use the proceeds from the small percentage of
the portfolio that sells to fund the names that don't sell.

Different sellers have distinctive strategies when listing domain names.
The following table shows the average ask price of ten of our top sellers in
2017 on [Afternic].  It also includes a portfolio quality score (normalized
predicted GoValue), which will be discussed in more detail below.


|           | Average Ask Price | Portfolio Quality | Ask Price / Quality |
|-----------|-------------------|-------------------|---------------------|
| Seller 1  | $29,157           | 1.4               | $20,797             |
| Seller 2  | $9,183            | 1.13              | $8,148              |
| Seller 3  | $3,795            | 1.21              | $3,145              |
| Seller 4  | $2,523            | 1.07              | $2,360              |
| Seller 5  | $2,268            | 1.11              | $2,037              |
| Seller 6  | $2,000            | 0.66              | $3,026              |
| Seller 7  | $1,637            | 0.9               | $1,811              |
| Seller 8  | $1,268            | 0.77              | $1,647              |
| Seller 9  | $971              | 0.97              | $1,004              |
| Seller 10 | $349              | 0.78              | $447                |


The average ask prices vary by almost two orders of magnitude between
different large sellers.  Some sellers price domains higher.  These sellers
will make fewer total sales, but each sale will be large.  Other sellers focus
more on volume and price their domains lower.  There is a complex trade-off
between sales magnitude and sales quantity.  This high variance in strategy
combined with haggling in the sales process makes pricing domains especially
difficult. If you ask each of these sellers what a single name is worth,
you may get 10 different answers.

[GoDaddy Auctions]: https://auctions.godaddy.com/
[Afternic]: https://www.afternic.com/


## Valuation with machine learning

There has been a history of using machine learning to value domains.
In 2012, GoDaddy released its first attempt at automated domain
valuation.  This system had underwhelming performance and thus
was not well received.  [Estibot] is another
automated appraisals service which predates GoValue.
[GoDaddy Domain Appraisals]
(GoValue) was released 2017 and its usage has been increasing since then.
Since each investor has a different pricing strategy, no one appraisal will
satisfy everyone.  We have recived positive feedback from many investors that
GoValue is a useful tool in helping them understand their domain portfolio.

GoValue is based on a novel approach to domain valuation.  This approach uses
[deep learning] to leverage the
vast amount of training data available only to GoDaddy as the world's largest
domain name marketplace.  Modern techniques and unrivaled amounts
of data have allowed GoDaddy to advance the state of the art in automated
domain valuation.

To measure how well GoValue works, we asked two industry experts with years of
experience to predict the sale prices for 2,000 Afternic sales from late 2017.
These sales were a holdout set hidden from the GoValue model during training.
We also compared to Estibot and "No Model" which simply predicts that
everything will sell for the mean price.  The following chart compares the
[root mean squared error]
(RMSE) of humans and machine predictions.

![RMSE Chart]({{site.baseurl}}/assets/images/domain-name-valuation/rmse.png)

GoDaddy GoValue is significantly better at predicting past
sale prices than both human experts and Estibot.  RMSE is a standard metric for
predicting these type of problems, however, one issue we see with both humans
and Estibot is a bias where all predictions are either too high or too low.

To compare models in a way that ignores any systematic bias in the predictions,
we introduce a metric _rank score._  The rank score measures each model (or
human’s) ability to sort domains by the sales price, testing only if they
got them in the right order.  Rank score is defined as the probability that
two randomly chosen domain name sales are put in the the correct order of
higher and lower sales prices when ordered by the predicted sales prices.
"No Model" has a rank score of 50% because if one orders two domains
randomly, half the time they will be ordered correctly just by chance.
The following shows each method’s rank score.

![Rank Score Chart]({{site.baseurl}}/assets/images/domain-name-valuation/rankscore.png)

The results show that GoDaddy GoValue is better than human experts at
predicting past sale prices for aftermarket domain names.

[Estibot]: http://estibot.com
[deep learning]: https://en.wikipedia.org/wiki/Deep_learning
[root mean squared error]: https://en.wikipedia.org/wiki/Root-mean-square_deviation


## How does it work?

The first step is to tokenize the domain name into a series of words.  This can
sometimes be ambiguous, for example, bostonspark.com could either be Bostons
Park or Boston Spark.  To build a robust tokenizer, we need training data
which can provide true tokenizations of domain names. To get this data,
we crawled the web and used the content on each website to figure out the
correct tokenization of their domain names.  By finding the text from the
domain name in the text of the website, we can see how the author intended
a name to be tokenized.  We use this data to build a
[vector representation of words]
and a tokenization model that is able to correctly resolve ambiguity as
well as obscure words and phrases.  We also use this tokenization and vector
representation of words as an input to our domain valuation model.

The next issue that the model must solve is modeling the context of a sale.
Just as different sellers have drastically different strategies, different
marketplaces also have very different pricing trends that can change over time.
For example, GoDaddy Auctions, used mostly by domain investors, has an average
sale price of $170, while the Afternic reseller network has an average sale
price of over $1,500.  These differences in sale context can often account
for more of the differences in price than the names themselves.

We simultaneously build a model of the sale context contribution to the price
and a model of the domain name contribution to the price.  This modeling of
sales context allows us to train on data from a large variety of sellers
and contexts and extract meaningful insights about domain prices across
data sources.  It also allows our model to output different price predictions
for almost 300 different contexts where the sale might have happened.

There was also a large amount of feature engineering that went into building
the model.  Many of the model's features come from the words, characters,
and top-level domain (TLD).  These features include detailed dictionaries
spanning six different languages.  Other features detect places,
people, and things by using data from external sources such as Wikipedia.
We also use information about how other similar domains with different TLDs
are being used.  In total, there are hundreds of different features that go
into the model.

To put all of this together, we use a [recurrent neural
network] (RNN) to
process the words and per-word features of a domain.   The output of this
RNN feeds into a fully connected neural network to process the sale context
and domain-level features.  The following figure shows a simplified structure
of our neural network:

![Neural Network Structure]({{site.baseurl}}/assets/images/domain-name-valuation/neuralnetwork.png)

[vector representation of words]: http://papers.nips.cc/paper/5021-distributed-representations-of-words-and-phrases-and-their-compositionality.pdf
[recurrent neural network]: https://en.wikipedia.org/wiki/Recurrent_neural_network


## Try GoValue For Yourself

Check out the GoValue for your domain name with [GoDaddy Domain Appraisals].
You could [list your domain for sale] or buy domains on [GoDaddy Auctions]
or [Afternic].  In building GoValue and providing it for free, we hope that
we can expand the domain investing community by making it easier to buy and
sell domain names.

For more information about how GoDaddy Domain Appraisals work, check out
[this podcast].

[list your domain for sale]: https://www.godaddy.com/garage/unearth-your-gold-mine-how-to-list-domain-names-for-sale/
[GoDaddy Auctions]: https://auctions.godaddy.com/
[Afternic]: https://www.afternic.com/
[this podcast]: https://blogs.nvidia.com/blog/2018/03/08/ai-podcast-godaddy-ai-to-domains/


## Join us!

Interested in working on a challenging project like this? Check out the
[GoDaddy Jobs] page to learn about all our current openings across the company.

[GoDaddy Jobs]: https://careers.godaddy.com/

