# Secure DSA code execution

IntervuAI sends code submissions to a separate Judge0 CE service. Spring Boot never runs student code itself. The backend submits a fixed harness for the supported challenge and returns the public example result plus a hidden-test pass count. Hidden inputs and expected outputs are not returned by the API.

## Current support

- Challenges: **Two Sum** and **Best Time to Buy and Sell Stock**
- Languages: Java, Python, JavaScript, and C++
- Tests: one visible sample and three private cases
- Limits per runner request: 2 CPU seconds, 5 wall-clock seconds, 128,000 KB memory, 64,000 KB stack, one run, and network access disabled
- Rate limit: five code runs per signed-in account per minute per backend process. Multiple replicas need a shared rate-limit store before public scaling.

The code editor uses `Solution.solve(...)` for Two Sum and `Solution.maxProfit(...)` for Best Time to Buy and Sell Stock. Starter templates show the expected signature for each language. Other DSA questions still offer AI review; their execution adapters and hidden tests have not been added yet.

## Configure a runner

Judge0 runs untrusted code in a sandbox and accepts explicit resource limits. Its self-hosted Docker deployment uses privileged worker containers, so run it on a dedicated Linux VM or isolated machine. Do not run the worker on the same host that holds production secrets, and do not expose the Judge0 API publicly. Allow only the IntervuAI backend to reach it. Judge0 documents its [self-hosted deployment](https://github.com/judge0/judge0) and [submission API](https://ce.judge0.com/).

After Judge0 CE is running, configure the IntervuAI backend environment:

```text
CODE_RUNNER_URL=http://your-private-judge0-host:2358
CODE_RUNNER_AUTH_TOKEN=your-runner-token
CODE_RUNNER_AUTH_USER=
```

Configure Judge0's `AUTHN_HEADER` / `AUTHN_TOKEN` to match the token setting if you enable API authentication. Keep these values in your local `.env` or deployment secret store; never commit real tokens. `CODE_RUNNER_AUTH_USER` is sent as `X-Auth-User` only if your Judge0 setup requires it.

For local Docker Compose, the backend container must be able to resolve and reach the private runner host. For Kubernetes, set the same values as a Secret-backed environment variable. An empty `CODE_RUNNER_URL` leaves AI answer review working and returns a clear unavailable message when **Run tests** is selected.

The public Judge0 API may have separate access requirements. IntervuAI expects a private or otherwise explicitly authorized Judge0 endpoint and does not call the public service by default.
