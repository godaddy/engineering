---
layout: post
title: "Better Sample Size Estimation: Accounting for False Discovery Rate Adjustment in Controlled Experiments"
date: 2022-09-19 00:00:00 -0700
cover: /assets/images/sample-size-calculator/cover.jpg
options:
  - full-bleed-cover
usemathjax: true
excerpt: GoDaddy's Hivemind team built a Python sample size calculator that handles a wide variety of experiment metric types and multiple testing scenarios.
keywords: sample size calculator, A/B test, false discovery rate adjustment, Python
authors:
  - name: Xinyu Zou
    title: Data Scientist-Experimentation Platform
    url: https://www.linkedin.com/in/xinyu-zou-a67265108/
    photo: /assets/images/xzou.jpeg
---

## Limits to Typical Sample Size Calculators

Online controlled experimentation (or A/B testing) is a useful tool to help companies make data-driven decisions on how to improve their products. Before running a fixed-horizon online controlled experiment, it's important to perform a power analysis to estimate the required sample size and determine the experiment duration. An accurate sample size helps detect the treatment effect in the shortest duration possible while controlling false positive and false negative rates below the desired level. A sample size calculator is commonly used to estimate experiment durations. Online sample size calculators are adequate to compute experiment durations with a baseline value, variance, minimum detectable effect (MDE), type I error rate (or alpha), and power inputs. But what if your experiment uses a ratio metric, like click-through rate, whose numerator and denominator are not independent of each other? What if multiple treatment variants or decision metrics exist, and you want to see the sample size required with a false discovery rate (FDR) adjustment? Existing sample size calculators cannot support these use cases, resulting in either an underpowered or unnecessarily overpowered experiment.

Hivemind is GoDaddy's internal experimentation platform for product and marketing teams to configure, execute, and analyze controlled experiments. The Hivemind team built a [Python sample size calculator](https://github.com/godaddy/sample-size) based on their use cases to handle a wide variety of experiment metric types and multiple testing scenarios.

## What Makes This Calculator Unique?

Most online calculators are adequate when computing sample size for boolean metrics. Some support numeric metrics. But what makes the Hivemind calculator unique is that in addition to boolean and numeric metrics, it also supports ratio metrics. Additionally, it can calculate the required sample size when there are multiple comparisons whose FDR is adjusted by the Benjamini-Hochberg procedure.

### Support for Different Types of Metrics
Online sample size calculators generally only support Boolean or numeric metrics, like conversion rate and revenue per user. An exhaustive search did not find a single calculator supporting the ratio metrics’ sample size calculation. For example, to calculate the sample size of click-through rate, the correlation between clicks and impressions must be accounted for since a ratio metric’s variance is a function of numerator mean and variance, denominator mean, and variance and their covariance. You also need to ensure you are applying trustworthy estimation and inference based on its distribution. Our calculator applies the [delta method](https://arxiv.org/pdf/1803.06336.pdf) to estimate ratio metrics' variance, making them eligible for sample size calculation.

Each type of metric has corresponding power analysis instances and p-value generators (used in multiple testing only) as its methods, so there's no need to specify the statistical hypothesis test.

### Support for Multiple Comparisons
The Hivemind calculator also supports multiple comparisons. Typical sample size calculators assume there are only one decision metric, one treatment, and one control variant in an experiment. Our sample size calculator:
- uses a Monte Carlo simulation to estimate the required sample size under FDR adjustments that do not have an easy closed-form solution.
- accepts multiple metrics and variants to solve complicated sample size calculations.
- asks for the decision metric’s metadata only once no matter the number of variants. It is assumed that each treatment variant has the same MDE.

## Computing Sample Size for Multiple Comparisons
When there is only one hypothesis test, the calculator uses the [statsmodels](https://www.statsmodels.org/stable/index.html) Python package to compute the required sample size. Computations (like the delta method) are applied to calculate the necessary arguments.
GoDaddy applies the [Benjamini-Hochberg adjustment](https://rss.onlinelibrary.wiley.com/doi/abs/10.1111/j.2517-6161.1995.tb02031.x) to multiple hypothesis testing. Because the procedure determines how to adjust p-values by ranking them, there is no closed-form formula solving for sample size in this scenario. We can adjust the family-wise error rate via the Bonferroni adjustment (alpha divided by the number of hypothesis tests), as it is a more conservative adjustment than Benjamini-Hochberg. However, using this conservative adjustment almost guarantees that the experiment will be overpowered and run longer than needed, slowing experimentation velocity.

The calculator follows the steps below to search for the minimum required sample size under a Benjamini-Hochberg adjustment.

### Step 1: Generate p-values
Each metric class has a class method that calculates p-values from sampled test statistics. If a null hypothesis is true, `sample_size` number of p-values are drawn from the p-value distribution under the null hypothesis (Uniform(0,1)); otherwise, the samples are drawn from the test statistic's distribution under the alternative hypothesis. After that, the survival function of the sampled test statistics will be the p-values when the alternative hypothesis is true.

It is worth noting that in the case of numeric metrics, in which we perform a t-test, the t-distribution under the alternative hypothesis is not simply shifting the null hypothesis by the amount of standardized MDE; instead, a noncentral t-distribution $$T=\frac{Z+\theta}{\sqrt{V/\mu}}$$ is used for sampling, with a noncentrality parameter $$\theta=\frac{\mu_1-\mu_2}{\sqrt{\frac{\sigma_1^2}{n_1}+\frac{\sigma_2^2}{n_2}}}$$, Z as a standard normal random variable, and V as a chi-squared distributed random variable with  `sample_size-1` as the degrees of freedom. We ran a simulation showing sampling numeric metric data points under the alternative hypothesis, then proved their t-statistics had the same distribution as the noncentral t-distribution, according to the result of the Kolmogorov-Smirnov test.

Here is a code snippet to sample numeric metric’s p-values under the alternative hypothesis in a t-test:
```
def _generate_alt_p_values(self, size: int, sample_size: int) -> npt.NDArray[np.float_]:
   nc = np.sqrt(sample_size / 2 / self.variance) * self.mde
   t_alt = stats.nct.rvs(nc=nc, df=2 * (sample_size - 1), size=size)
   p_values: npt.NDArray[np.float_] = 2 * stats.t.sf(np.abs(t_alt), 2 * (sample_size - 1))
   return p_values
```

### Step 2: Estimate Empirical Power
After calculating p-values for all comparisons, a function is used to calculate the expected average power with a provided sample size. For each replication, the calculator randomly picks some hypotheses to be true alternatives, simulates each comparison’s corresponding p-value, applies the Benjamini-Hochberg procedure, and concludes whether to reject the null hypothesis or not. After all the replications are complete, it computes the expected average power (the ratio of the number of true rejections to the number of true alternative hypotheses).

The function takes sample size as an input, which is used to sample test statistics and compute p-values in `_generate_alt_p_values`. This process is repeated 500 times by default.
```
def _expected_average_power(self, sample_size: int, replication: int = 500) -> float
```

### Step 3: Use a Binary Search to Find the Optimal Sample Size
With the estimated power, a binary search can find the minimum required sample size per cohort that generates average power close to 0.8. If the expected average power is less than 0.8, the sample size is inflated and the average power is recalculated; if it is higher than 0.8, the sample size is reduced and the average power is recalculated; In this function, the minimum of each metric's sample size (`lower`) and the maximum of each metric's sample size with Bonferroni correction (`upper`) determine the search interval.
```
def get_multiple_sample_size(self, lower: float, upper: float, max_recursion_depth: int = 20, ...) -> int
```

## How You Can Leverage the Hivemind Sample Size Calculator
At GoDaddy, we use a graphical user interface to leverage this open-source project to calculate the required sample size before running experiments. Integrating experiment configuration, reporting, and power analysis in one experimentation portal improves the user experience.

If you want to leverage this calculator for your experiments, install Python and the sample-size package. If you are interested in the power analysis for multiple variants or decision metrics but want to use an alternative FDR adjustment procedure, you can modify the calculator. Multiple testings' sample size estimation is based on Benjamini-Hochberg adjustment and is implemented by a one-line code using the [multipletests](https://www.statsmodels.org/dev/generated/statsmodels.stats.multitest.multipletests.html) package. You can calculate the sample size under any FDR adjustment procedure by replacing the current code with the package corresponding to that adjustment.

## Future Iterations
Without the help of [Chris Moore](https://www.linkedin.com/in/christophermoore12/), [Daniel Hedblom](https://www.linkedin.com/in/daniel-hedblom/), [Dannie Fu](https://www.linkedin.com/in/danniefu/), [Vaughn Johnson](https://www.linkedin.com/in/vaughn-johnson-207385104/), [Wendy Chiang](https://www.linkedin.com/in/pingjouchiang/), this blog post and current and future iterations of Hivemind calculator would not be possible. The Hivemind team continues working on additional features for the sample size calculator, including:

* Sample size calculation for guardrail metrics (e.g., one-sided tests)
* Sample size calculation for sequential testing
* Imbalanced A/B test design
* Unequal variance in treatment and control variants

## Conclusion
Hivemind’s calculator is a flexible power analysis tool supporting different metric types and multiple testing. It provides users with an accurate pre-experiment sample size, which in turn, provides improved decisions and optimizes testing velocity.

## References
Open-source project: https://github.com/godaddy/sample-size

Benjamini Y, Hochberg Y (1995) Controlling the false discovery rate: a practical and powerful approach to multiple hypothesis testing. J R Stat Soc B 57:289–300

Harrison, David A., and Anthony R. Brady (2004) Sample size and power calculations using the noncentral t-distribution. The Stata Journal 4.2: 142-153.
