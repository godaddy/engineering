---
layout: post
title: GoDaddy's Journey to the Cloud | Part 1
date: 2021-05-07 03:00:00 -0700
cover: /assets/images/godaddys-journey-to-the-cloud/cover.jpg
excerpt: In this blog post, we share information about GoDaddy&#39;s cloud journey, which began in early 2018 when we announced our partnership with AWS. Specifically, we describe the GoDaddy Public Cloud Portal, an application used to onboard engineering teams to AWS.
options:
  - full-bleed-cover
authors:
  - name: Jared Beauchamp
    title: Senior Software Engineer Manager
    url: https://www.linkedin.com/in/jbeauchamp/
    photo: /assets/images/jbeauchamp.jpg
---


### GoDaddy&#39;s journey to the cloud and their Public Cloud Portal

In this blog post, we share information about [GoDaddy&#39;s](https://www.godaddy.com/) cloud journey, which began in early 2018 when they announced their partnership with AWS. Specifically, we describe the GoDaddy Public Cloud Portal, an application used to onboard engineering teams to AWS.

The purpose of the portal is to help GoDaddy teams build better products faster by delivering a seamless one-stop shop for learning, onboarding, and managing product and services in the AWS Cloud. This central interface helps GoDaddy developers:

- Accelerate time to market.
- Raise the bar on engineering rigor, quality, and security.
- Use leading-edge capabilities, including machine learning.
- Improve global scale and performance.
- Achieve velocity and flexibility that drives more agility.

![splashscreen]({{site.baseurl}}/assets/images/godaddys-journey-to-the-cloud/portalSplashScreen.png)

The GoDaddy Public Cloud Portal initiative set forth the following goals:

- Automate the process in a way that allows GoDaddy to iterate, continuously improve, and lower the TCO of the onboarding process.
- Communicate the steps involved, manage the workflow, and manage the movement through the onboarding process.
- Provide a central place to request, track, and view budgets versus actual spending.
- Provide a wizard interface and automation for the AWS onboarding process that includes standards, guardrails, and best practices.
- Provide curated learning paths aligned to the infrastructure architecture pattern the team selects for deployment.
- Provide an interface for teams to manage various components of their infrastructure through this abstracted layer.
- Onboard the teams to metrics collection and reporting by having them connect their applications to standard metric-collection endpoints for speed, performance, availability, and quality.
- Enable the testing of innovative ideas by allowing teams to request an experimental budget and account so they can start building the same day.

Meeting these goals is critical to the success of the GoDaddy cloud adoption journey.

### Supporting the move to cloud and needed cultural change 

This story about our journey here at GoDaddy is not just one of a technical feat. At the highest levels of the GoDaddy management team, there was an understanding that realizing the benefits and value from moving to the cloud will require cultural change. The key story communicated by the executive management team is the spirit of working together – we're in this 'move to the public cloud' together. Moreover, GoDaddy needs the participation, collaboration, and input/feedback from every engineer in the company to help navigate and optimize the journey. 

GoDaddy leadership has always professed there is no book they could pick up at the company store that says 'this is right way to take GoDaddy to the public cloud'. 'The book does not exist – they are actually writing it every day'. It takes the shared experience of everybody that is involved in the migration to the cloud to get it right. GoDaddy needed their engineers experiencing it all together, and providing feedback and input on refinements from their perspective. The Application Services team (GoDaddy Cloud Center of Excellence) is in place to be the nexus of that experience across all teams, so the organization overall can collect and expand experience drawn from other teams as they onboard over time.  

The culture and spirit of working together shows up in the GoDaddy initiative process, which is not just a centralized team defining the right solution with all others teams following. Instead, the process is where they gather a group of thought leaders across the company and agree on what the problem is – once they agree on the problem, they define and agree on what 'done' looks like (e.g. the form of done) – is it an application, a process, documentation, etc... Once they have this definition complete they ask the thought leaders to recommend and offer up a list of 8-10 contributors in the company that will contribute to the initiative to get to an actual answer. They've use this process, for example, for CDN architecture/design, defining tiers of applications and thus what level of security test should be applied to that tier of application and at what frequency, application encryption library innovations for teams, and creating the Must-Have's and Should-Do's list for raising the bar on engineering rigor that is discussed later.  

The culture of this contribution model was key for GoDaddy to leverage the expertise and diversity of their organization and to drive the speed of innovation they were looking to achieve with moving to the cloud. There's a well-defined pipeline for contributing. If someone can see a standard infrastructure-as-code architecture component or deployment product that can be better, or a new feature they want to have within an infrastructure product definition they're building with, they just submit a PR. There's a really good pipeline defined on how to get that into production for their team and thus to benefit all the other GoDaddy DevOps teams going forward. 

There's no doubt that there's more responsibility on teams moving to the AWS cloud than existed with the on-premises environment. In the new culture the company is asking teams to operate their own product, asking them to secure their own product, to be responsible for their own budget. This is definitely a lot of responsibility in the new 'DevSecFinOps' multi-responsibility model for teams. The culture needed to be supportive and make sure that teams are empowered to make their own decisions. Through the group-think type of Initiative Process we just discussed, GoDaddy has automated many of the things that used to be done on-premises manually, in some cases where they never had the ability to automate before. So, while there is more breadth of responsibility and things to do in the new world of cloud, there is much more automation across the board to offload each team also.  

Communicating a strong vision and explaining the motivation for moving to the cloud is a key component of cultural change management for the company. GoDaddy communicated their motivation in going to the AWS cloud – the 3 major goals for raising the bar on customer experience and product excellence. 

- Increased speed of delivery: get the features and the products to our customers faster 
- Increased application performance: getting the applications closer to our customer, as well as freeing up time for our engineers and giving them better tools so that we can actually accelerate our own applications. 
- Increased reliability & availability: This is the biggest goal that will drive architectural changes in the company as we move to the cloud. We need to build architectures that can withstand an entire AWS region going out, for example, and we stay up and running with no customer impact. The cloud allows new approaches that have not been available to us on-premises. 

To manage this change, GoDaddy worked to achieve each of these goals while observing and adhering to necessary constraints to the business as they proceeded. The thought was to achieve the goals AND conform to the constraints at the same time – constraints related to Security, Application Architecture, Operational Readiness, Budget, and Compliance & Privacy. E.g. they will achieve increased speed of delivery while adhering to the budget, and while adhering to the necessary security standards, etc…  

So how do they measure and make sure they get there? Within the defined constraints? The Must-Have's and Should-Do's list defines the bar. The Cloud Readiness Review implements the validation and approval against the bar. Then their standard S-P-A-Q metrics for measuring Speed, Performance, Availability, and Quality provide on-going metric measurement and reporting for achievement in production. We'll talk more about this in the next section.  

GoDaddy has applied the same Initiative approach to the definition and implementation of the S-P-A-Q metrics, including key members from various teams to improve and ratify the metrics over time. For example, measuring Availability has evolved, as originally many teams were measuring this differently making it difficult to compare and contrast team results. E.g. measuring by the second, the minute, from inside the datacenter, from outside the datacenter, if a ping failed once the service is down, or the ping must fail multiple times in succession for the service to be slated as down. There used to be a lack of consistency, and now the KPI dashboard shows consistently measured metrics across all services through the collaboration of initiative teams.  

Finally, they've set the terminology of the company to be consistent, with agreed definition of terms, and ultimately raising the bar for compliance across all teams driving overall service improvement for customers. All this is built on top of standard engineering practices, well-defined, communicated, and understood by all engineering teams. The final 'hurrah' is achieving increased Speed of Delivery. For this they focused on good CI-CD engineering processes and tools for starters. Team Engineering practices are defined and measured during onboarding through the cloud portal managed Cloud Readiness Review process. 

The needed cultural change has been a journey; all GoDaddy colleagues are clearly in this together. It continues to require the entire GoDaddy community to participate and make this move to the cloud successful and optimal – to achieve the outcomes the company strives to deliver to customers. GoDaddy is a work in progress; and continues to iterate toward the company vision. 

### Genesis of the Public Cloud Portal 

So, how is GoDaddy realizing the benefits and objectives of moving to the cloud, scaling across 1000’s of employees, 100’s of scrum teams, and creating an experience that accelerates engineering teams in serving their customers? Managing the deployment standards, setting up the cloud foundation and landing zones, organizing and collecting on-boarding information, tracking and reporting; is all too much to handle manually while supporting the scale and agility that is required. Enter the GoDaddy Public Cloud Portal, with the mission to deliver a seamless one stop shop for GoDaddy developers to learn, on-board, and manage their product and services in the cloud. Let's dive into the feature/functions brought together in the GoDaddy public cloud portal in support of development teams in the next section. 

## Public Cloud Portal ecosystem

![hub]({{site.baseurl}}/assets/images/godaddys-journey-to-the-cloud/portalHub.jpg)

### Budget and finance

With support from the [AWS Billing and Cost Management](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/billing-what-is.html) console and [AWS Pricing Calculator](https://calculator.aws/), teams use the portal to create and manage budget requests, receive billing alarms, and view their spending. Teams prepare and submit budget requests for experimentation and for dev, test, or production environment projects on AWS. Production environment requests require more scrutiny and levels of approval. After a team receives approval for the requested environment and development phase, they move along in the portal to the next stage of the onboarding workflow. The portal provides teams with visibility into their actual spending versus approved budget.

### Creating accounts and supporting architecture

The portal includes a wizard that collects the operational information (roles and security levels, communication channels, and monitoring and logging requirements) required to create a baseline account structure. The team&#39;s choice of an architectural pattern determines which portfolios are included in the account setup. Portfolios help manage who can use specific products and how they can use them. [AWS Service Catalog](https://aws.amazon.com/servicecatalog/), [AWS CloudFormation](https://aws.amazon.com/cloudformation/), and [AWS Systems Manager](https://aws.amazon.com/systems-manager/) are the primary supporting services for the controlled and standardized deployment of GoDaddy Landing Zones, and [AWS Config](https://aws.amazon.com/config/) provides guardrail controls for the created AWS environment and accounts.

During account creation, the portal provisions the number of Availability Zones, AWS Regions, and VPC/CIDR configuration option according to the team&#39;s selections. After the team receives email notification that the accounts have been created, the team can access the AWS CLI or AWS Management Console through the GoDaddy AWS chicklet in [OKTA](https://www.okta.com/) and assume [AWS Identity and Access Management](https://aws.amazon.com/iam/) (IAM) roles that are assigned to each account.

### Cloud Readiness Review

The Cloud Readiness Review is a key governance function that sets the bar for engineering rigor with the GoDaddy requirements (must-haves and should-dos). The must-have sand should-dos list is a superset of the [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) pillars and review requirements. The GoDaddy requirements cover:

- Security
- Application development
- Application architecture (Reliability and Performance Efficiency pillars)
- Operational readiness (Operational Excellence pillar)
- Budget/finance (Cost Optimization pillar)
- Compliance and privacy
- Machine learning

Before taking production traffic, teams must formally complete the Cloud Readiness Review to certify that their project meets the GoDaddy engineering standards and rigor set forth in the must-haves and should-dos document. Teams can use the portal as a centralized place where they can answer qualification questions and see reviewer comments and approvals. Reviewers can use the portal to review team responses and track team questionnaire completion.

### Process documentation

The portal provides a centralized, organized repository of all required process documentation (from submitting the onboarding request to supporting live production traffic). The portal includes a link to the optional [Infrastructure Event Management](https://aws.amazon.com/premiumsupport/programs/iem/) program available in the AWS Enterprise Support plan, which can be helpful for teams as they move toward a production go-live date in their AWS environment.

### Incident management

The portal includes a widget and status feed that integrates information from [AWS Service Health Dashboard](https://status.aws.amazon.com/), [AWS Personal Health Dashboard](https://aws.amazon.com/premiumsupport/technology/personal-health-dashboard/), and [AWS Knowledge Center](https://aws.amazon.com/premiumsupport/knowledge-center/) to show service availability and offer a process for managing and remediating issues that impact production operations and traffic.

### Security and compliance

The portal surfaces security findings from the GoDaddy implementation of [AWS Security Hub](https://aws.amazon.com/security-hub/) so that teams have a comprehensive view of their security and compliance state in AWS.

### KPI and metrics

The portal publishes a widget that displays the speed, performance, availability, and quality of the teams&#39; customer-facing applications and their backend APIs. The portal also measures and provides metrics on the time it takes for teams to move through each onboarding step. This information helps GoDaddy make decisions about where to make process improvements to continue to optimize the experience.

### Curated learning

The portal includes curated documents, videos, tutorials, and other learning links (for example, to AWS documentation and the AWS YouTube channel). The learning materials are curated based on the AWS Service Catalog products linked to the team&#39;s selected architectural pattern.

## Steps to production

![production]({{site.baseurl}}/assets/images/godaddys-journey-to-the-cloud/portalProductionSteps.png)

Although the Public Cloud Portal manages many steps directly, it simply tracks others (for example, the completion of an external process). The early steps include project preparation, budgeting, privacy assessment, and readiness review.

The onboarding checklist helps the team complete pre-wizard steps, including:

- Estimating costs for budget submission.
- Defining an on-call group.
- Defining service accounts.
- Creating an email distribution list and Slack webhook for team communications.

### Privacy impact and readiness assessments

After the business reviews and approves the spending required for the proposed product or service, it should conduct a GoDaddy privacy impact assessment to identify and reduce privacy risks and comply with their data protection obligations and meet end users&#39; expectations of privacy. During the GoDaddy Cloud Readiness Review, the engineering practices, as defined in the GoDaddy must-haves and should-dos document, are measured, and reviewed against pillars of public cloud constraints. The review ensures the bar for engineering rigor is being raised with each project. It also helps create a consistent approach for teams to follow to meet or exceed company goals for security, performance, availability, and quality. As a team moves from one of the three stages of development (experimental, development, production), the questions and checks in the review become more comprehensive accordingly.

### Creating an account and security scans

Using the cloud architecture, product, and team information, the portal invokes backend automation to create a multi-account Landing Zone with the selected architecture patterns, cloud services, security, audit, monitoring, logging, and networking options. If this step were completed manually, it would take several days, but with the portal it takes less than two hours.

The team must then conduct a vulnerability scan, initial penetration test, and the optional Infrastructure Event Management program available in the AWS Enterprise Support plan. The team is then ready to move to full production, start taking production traffic, and move to operational support.

## From experimental to development to production

If a GoDaddy DevOps team chooses the experimental stage of development, they get a dev-private account that includes administrator permissions and flexibility in the deployment of AWS services. They enter their project description in the portal, request an experimentation budget, discuss and get approval for the budget from the approving manager, and then run the account creation wizard. It&#39;s a great way to take an idea for a new product or service and start building quickly with cloud-native architectures.

Some teams might move from the experimental stage to the development stage. Others might skip the experimental stage and request a development budget and environment directly. The teams receive dev and test accounts for their projects. They must create a budget request in the portal that&#39;s based on their application architecture, requirements, and development timeline. Unlike the experimental stage of development, the teams must receive management approval at a higher level. They must also acknowledge GoDaddy requirements for the development phase.

Teams that move on to the production environment receive stage, and production accounts. They must enter their budget in the portal, receive approval, and complete a more stringent Cloud Readiness Review process to assure the proposed workload complies with GoDaddy standards and is ready to take production traffic.

The DevOps teams continue to use the portal for operational and financial management of their products or services.

## Measuring success

![success]({{site.baseurl}}/assets/images/godaddys-journey-to-the-cloud/portalMeasuringSuccess.png)

GoDaddy has achieved measurable success in four areas:

- **Application performance** : GoDaddy has automated the creation of more than 1,000 AWS Landing Zones, expediting and expanding its performance footprint around the globe.
- **Speed of delivery** : In 2020, the time required to launch a production workload was reduced by 58%.
- **Reliability and availability** : In two years of development, across 200 production workloads in eight AWS Regions, there have been no outages.
- **Contribution at scale** : More than 150 software development engineers have made more than 5,000 code commits to GoDaddy AWS Service Catalog products.

## Get to the Cloud. Make awesome happen!

Bottom line, GoDaddy has achieved significant, measurable success with the Public Cloud Portal. It has enabled GoDaddy teams to build better products faster, using AWS Service Catalog, AWS CloudFormation, and AWS Systems Manager. The portal offers a seamless one-stop shop for learning, onboarding, and managing product and services in the AWS Cloud.

Through collaboration with the business, IT, and finance teams, GoDaddy created a portal that not only enables the cloud engineering process, but drives cultural change, too. Now any GoDaddy engineer can quickly innovate on behalf of customers. And as they accelerate their cloud adoption journey, GoDaddy is looking ahead. They continue to add more management and workflow functionality into the portal based on a prioritized backlog.
