# Individual Reflection — William (Xing)

## CS 6650 Scalable Distributed Systems, Spring 2026

---

When I started this course, I knew how to build web apps, but I had no real intuition for what happens when you go from one server to many. Concepts like replication, quorum, consistency tradeoffs — they were just words on slides. By the end of this semester, I've built systems where those concepts showed up as real, measurable behavior in my own data. That shift from abstract to concrete is probably the biggest thing I'm taking away.

## The KV Store: Where Theory Clicked

The distributed key-value store assignment was the turning point for me. I built a 5-node replicated system in Go with both Leader-Follower and Leaderless architectures, and ran experiments across different quorum configurations (W/R parameters) and write ratios.

The moment things clicked was staring at my stale read results. W=3, R=3 gave 0% stale reads across every workload — not because I got lucky, but because W+R > N mathematically guarantees quorum intersection. Meanwhile, W=1, R=5 hit 95.8% stale reads under heavy writes. Same system, same code, completely different consistency behavior just from tuning two numbers. Before this, quorum intersection was a formula in a textbook. After running the experiments, I could actually feel why it works — and more importantly, why violating it breaks things so dramatically.

I also ran into something unexpected: W=5, R=1 showed a small amount of stale reads (3.4%) under high write concurrency, even though it theoretically should have been consistent. It took me a while to figure out this wasn't a replication bug — it was concurrent writers stepping on each other's version numbers. That distinction between "the replication protocol is correct" and "the system behaves perfectly" turned out to be a useful lesson in how to read experimental results without jumping to wrong conclusions.

## AWS Billing: The Expensive Lesson

One of my most memorable screw-ups had nothing to do with code. After finishing the MapReduce assignment, I checked my AWS bill and found $33+ in ECS charges. All my clusters showed zero running tasks, so I assumed I was safe. The next day, another $4 appeared.

It turned out a stopped EC2 instance from a previous assignment was still attached to an EBS volume, silently accumulating charges. "Stopped" is not the same as "terminated" — a distinction that cost me real money to learn. I cleaned everything up, wrote it up, and Yvonne asked me to post it on Piazza so other students could avoid the same mistake. It was a good reminder that in distributed systems and cloud infrastructure, what you don't see can still hurt you. Understanding the billing model is part of understanding the system.

## Smart Grocery: Coordination Is the Hard Part

For the final project, our team built Smart Grocery — an AI-powered grocery shopping assistant with five microservices. I owned the API Gateway (Node.js/Fastify), the React Native frontend, and all CI/CD infrastructure. Dako handled the User and List services in Go, and Kaiyue built the AI Service in Python.

The hardest part of this project was not any single service — it was making them work together. When Kaiyue's AI Service returned responses in a slightly different JSON shape than what my Gateway expected, nothing crashed, but the frontend silently showed empty results. Debugging across service boundaries — where the logs are in different containers, the data formats cross language boundaries, and the error might be in the contract rather than the code — was genuinely difficult in a way that no single-service project prepares you for.

We used RabbitMQ for async messaging between the Gateway and AI Service, implemented CRDT-based sync (LWW Register + OR-Set) for offline conflict resolution, and added a circuit breaker on Claude API calls. The circuit breaker demo was particularly eye-opening: when we killed the AI Service, the breaker tripped and the Gateway failed fast with a clear error instead of hanging. The insight is simple but important — the circuit breaker protects the upstream service by giving up quickly, not by fixing the downstream problem.

## What I'd Do Differently

If I could redo this semester, I'd set up monitoring earlier. We planned Prometheus and Grafana but kept deferring it. By the time we were running experiments, we were relying on manual log-reading and CloudWatch, which made it harder to correlate behavior across services. Observability isn't a nice-to-have — it's how you understand what your system is actually doing under load.

I'd also push for more structured integration testing earlier in the project timeline. We spent more time than necessary debugging cross-service issues that a contract test would have caught in minutes.

## My Role vs. AI's Role

This is worth addressing directly, since we used Claude's API as a core component of our product and I personally used AI tools throughout the course.

AI was useful for generating boilerplate, explaining unfamiliar concepts, and drafting initial versions of things. But the decisions that actually shaped our system were human decisions. Choosing RabbitMQ over a polling-based approach, deciding where to place the circuit breaker, designing the CRDT conflict resolution strategy, figuring out that our load test data showed a request composition shift rather than a real performance improvement — none of that came from a prompt. It came from understanding the system's context, reading the data carefully, and making judgment calls about tradeoffs where there was no single right answer.

The debugging workflow I developed — reproduce with curl, screenshot, fix, screenshot the diff, redeploy, verify — that's a methodology I built through trial and error. AI can suggest possible causes, but it can't look at your CloudWatch dashboard and decide which hypothesis to test first. And coordinating with Dako and Kaiyue on interface contracts, resolving integration conflicts, and making sure three people's independently-built services actually compose into a working system — that's fundamentally a human coordination problem.

The way I see it: AI is a multiplier, but it multiplies what you already understand. If I didn't understand quorum intersection, no amount of AI assistance would have helped me interpret why W=1, R=5 produced 95.8% stale reads. The understanding has to come first.