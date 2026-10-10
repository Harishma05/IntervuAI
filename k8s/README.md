# Run IntervuAI on a local Kubernetes cluster

This setup runs the combined React and Spring Boot app as one Kubernetes Deployment. PostgreSQL stays outside the cluster (for example, a Neon project), and the app is reachable locally through `kubectl port-forward`.

## Requirements

- A running local Kubernetes cluster, such as Docker Desktop Kubernetes, Minikube, or kind.
- `kubectl` installed and pointed at that cluster.
- Docker available to build the root `Dockerfile`.
- A PostgreSQL database reachable from the cluster and a Groq API key.

## Configure credentials

From the repository root, copy the example and edit the values:

```powershell
Copy-Item .\k8s\secrets.env.example .\k8s\secrets.env
notepad .\k8s\secrets.env
```

Set `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, and `GROQ_API_KEY`. The database URL must be reachable from the Kubernetes cluster; `localhost` points to a Pod itself, not your Windows database. The real `secrets.env` file is ignored by Git. Never commit or share it. Kubernetes Secret values are not automatically encrypted just because Kubernetes encodes them; configure cluster encryption at rest and restrict Secret access before using real user data.

## Build and start

Build the app image from the repository root:

```powershell
docker build -t intervuai:local .
```

If using Minikube or kind, load the local image into that cluster:

```powershell
minikube image load intervuai:local
```

For kind, use `kind load docker-image intervuai:local` instead. Docker Desktop Kubernetes can use the image built by Docker Desktop directly.

Apply the Kubernetes resources and wait for the app to become ready:

```powershell
kubectl apply -k .\k8s
kubectl rollout status deployment/intervuai -n intervuai
```

Forward the app to your computer and open it in a browser:

```powershell
kubectl port-forward -n intervuai service/intervuai 8080:80
```

Open `http://localhost:8080`. Keep the port-forward terminal open while using the app. To inspect backend startup logs:

```powershell
kubectl logs -n intervuai deployment/intervuai
```

## Notes before a public deployment

- The Deployment uses one replica because login sessions are stored in app memory. A Pod restart signs users out. Add a shared session store before increasing replicas.
- The local ConfigMap sets `COOKIE_SECURE=false` for HTTP on localhost. For a public domain, configure HTTPS termination first and set `COOKIE_SECURE=true`.
- The Service is `ClusterIP`; this local setup is not publicly accessible. A cloud cluster needs a registry-hosted image, a public HTTPS ingress or load balancer, a domain and TLS, and provider-specific cluster access. Cloud Kubernetes and public load balancers can incur charges.
- No cluster or image is created by `kubectl apply -k`; those must exist before applying the manifests.
