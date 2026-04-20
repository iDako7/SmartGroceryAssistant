# Lessons Learned — Kaiyue Wei (Sylvia)

**Course:** CS6650 Scalable Distributed Systems
**Project:** Smart Grocery — AI-Powered Grocery Shopping Assistant
**My scope:** User Service + List Service (Go/Gin), cross-service user-deletion saga, load tests

---

## 1. Where I started

On Day 1 I knew how to write a CRUD service. I did not really know what "microservices" meant beyond "multiple services." I thought the hard part was splitting the code. It turns out splitting the code is the easy part — splitting the **data** is where everything interesting happens.

I picked up the two services that own the core relational data: User Service (accounts, profiles, auth) and List Service (sections and items). The moment we agreed on database-per-service — one `user_db`, one `list_db`, no shared tables — every "normal" assumption I had about Postgres stopped applying. No foreign keys across the boundary. No `JOIN` across the boundary. No transactional `DELETE CASCADE` across the boundary. Every one of those became a design problem I had to answer explicitly.

## 2. The thing that broke my mental model: user deletion

The moment it clicked was when I tried to implement "delete my account."

In a monolith this is one line: `DELETE FROM users WHERE id = $1` and let the foreign keys cascade. In our system the user row lives in `user_db` and all their sections/items live in `list_db`. There is no transaction that spans both. If I delete the user first and then the list cleanup fails, I have an orphaned user with ghost data. If I delete the list data first and the user delete fails, I have a user with no lists who can log back in. Either way the system lies to someone.

I spent a full evening trying to talk myself into synchronous HTTP: user-service calls list-service, waits for 204, then deletes locally. It felt simple and the latency seemed fine in my head. Then I wrote it down and realized it buys nothing. If list-service is down, user deletion fails. If list-service is slow, user deletion is slow. And the coupling was the real killer: user-service now has to know list-service's URL, its auth scheme, its error contract. Every future service that owns user data would make the chain longer and more fragile. This was the first time the lecture on **temporal coupling** stopped being a definition and started being an actual bug I could see myself writing.

So I built a choreography saga instead: user-service deletes the row locally, publishes `user.deleted` to RabbitMQ, returns 204. List-service consumes asynchronously and soft-deletes. Fast response, failure-isolated, loosely coupled.

## 3. What went wrong with my first saga

My first version had a bug I am almost glad I shipped, because it made me actually understand the outbox pattern.

I wrote the code like this:

```go
// WRONG
repo.DeleteUser(ctx, userID)
publisher.Publish(ctx, "user.deleted", userID)
return 204
```

It works. Until it doesn't. If the process dies between the delete and the publish — OOM kill, a pod reschedule, literally anything — the user is gone from `user_db` and the event never happened. List-service will never learn. The data is orphaned forever, and I have no way to detect it because neither side logged an error.

The fix is the **transactional outbox**: write the event into an `outbox` table inside the same SQL transaction as the delete, and have a separate poller publish it. I did not fully implement it (scope), but I wrote it up in the saga experiment report as the recommended production upgrade, and I now reach for outbox-style thinking every time I see "do two things and hope both succeed." That lesson — that at-least-once delivery is not a library, it is a data-model decision — is probably the biggest single thing I take away from this course.

## 4. The bcrypt moment (Experiment 2a baseline)

The other thing I did not expect to learn this much from was the User Service load test. I ran Locust against register/login at 100, 500, 1000 concurrent users expecting to find something about Go, or Gin, or Postgres. What I actually found was bcrypt.

Average latency went **70ms at 100 users → 190ms at 500 → 930ms at 1000**. Zero failures at any tier, which initially looked great, until I realized "zero failures + rising avg latency" is the signature of a queue forming behind a CPU-bound operation. Median stayed at 1–7ms for reads — Postgres was fine. The bottleneck was bcrypt burning CPU on every login/register, and every other request was sitting politely behind it.

This was a concrete instance of something the course talked about abstractly: **the slowest synchronous step sets your throughput ceiling**, regardless of how fast everything else is. I had been optimizing the wrong layer in my head (database indexes, connection pools) when the actual ceiling was a single hashing function. Next time I will measure before I tune.

## 5. Cross-DB ownership (Experiment 2b)

This was the experiment that made me appreciate how much work a foreign key does silently. With `sections.user_id` pointing at a user row in a *different database*, I cannot ask Postgres to enforce ownership. I have to do it in application code: verify the JWT, then JOIN through `sections` on every item operation to prove the authenticated user actually owns the section. Forget that JOIN on one handler and you have a horizontal privilege escalation.

The trade-off matrix I put in the group doc (shared DB vs DB-per-service) came out of actually writing this code. Shared DB would have given me native FKs and one-line ownership enforcement for free. I still chose DB-per-service because the rest of the architecture — independent deploys, independent scaling, failure isolation — was worth it. But I no longer think of it as a free choice. Every time you split a DB you are signing up to re-implement, in application code, something the database was doing for you correctly and automatically.

## 6. What I would do differently

1. **Write the outbox first, not second.** I will never again write "delete then publish" in sequence without a transactional outbox. The cost of adding one table is trivial; the cost of finding orphaned data in production is not.
2. **Load-test earlier.** I found the bcrypt ceiling in week 7. If I had run even a tiny Locust smoke test in week 3, I would have known the shape of the service's performance curve before I built anything on top of it.
3. **Instrument before optimizing.** Every saga metric (`saga_publish_duration_seconds`, `saga_events_consumed_total`, `saga_sections_deleted_total`) paid for itself the first time I tried to debug the consistency window. I wish I had added them from the first commit, not retrofitted them.
4. **Accept eventual consistency explicitly.** My instinct was to make things "feel" synchronous by adding waits and polls. The saga is better when you let it be async and design the UI around "deletion queued" rather than "deletion done."

## 7. Where the course concepts actually showed up

Looking back, almost every core topic from the course turned into a concrete decision in my two services:

| Course concept | Where it showed up in my work |
|---|---|
| CAP / eventual consistency | The consistency window on user deletion (~10–200ms) |
| Saga pattern | `user.deleted` via RabbitMQ fanout, manual-ACK consumer |
| Transactional outbox | The bug I shipped and the fix I designed |
| Loose coupling | user-service and list-service share an event schema, not an API |
| Load testing | Finding bcrypt as the real ceiling, not Postgres |
| Observability | Prometheus metrics on publish time, cleanup time, and affected rows |
| Failure isolation | List-service down no longer blocks account deletion |

## 8. The high

The moment I watched `user.deleted` flow through RabbitMQ, the list-service consumer pick it up, soft-delete every row, and emit its own metric — all while user-service had already returned 204 to the client — was the first time the phrase "distributed system" felt like something I had actually built instead of something I had read about.

## 9. The low

The evening I realized my saga could drop events on a process crash, and that "it works on my machine" had been hiding a real correctness bug the whole time. That was humbling. It is also the single lesson I am most sure I will keep.
