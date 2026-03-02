# SmartGroceryAssistant — Tiltfile
# Run: tilt up
# Requires: minikube running  (`minikube start`)

allow_k8s_contexts('minikube')

# ── Images ────────────────────────────────────────────────

docker_build(
    'sga/user-service',
    'services/user-service',
)

docker_build(
    'sga/list-service',
    'services/list-service',
)

docker_build(
    'sga/ai-service',
    'services/ai-service',
)

docker_build(
    'sga/api-gateway',
    'services/api-gateway',
)

docker_build(
    'sga/web',
    'web',
    build_args={'NEXT_PUBLIC_API_URL': 'http://localhost:3001'},
)

# ── Manifests ─────────────────────────────────────────────

k8s_yaml([
    'k8s/namespace.yaml',
    'k8s/secret.yaml',
    'k8s/postgres.yaml',
    'k8s/redis.yaml',
    'k8s/rabbitmq.yaml',
    'k8s/user-service.yaml',
    'k8s/list-service.yaml',
    'k8s/ai-service.yaml',
    'k8s/ai-worker.yaml',
    'k8s/api-gateway.yaml',
    'k8s/web.yaml',
])

# ── Resources & port-forwards ─────────────────────────────

k8s_resource('postgres',     port_forwards=['5432:5432'])
k8s_resource('redis',        port_forwards=['6379:6379'])
k8s_resource('rabbitmq',     port_forwards=['5672:5672', '15672:15672'])

k8s_resource(
    'user-service',
    port_forwards=['4001:4001'],
    resource_deps=['postgres'],
)

k8s_resource(
    'list-service',
    port_forwards=['4002:4002'],
    resource_deps=['postgres', 'rabbitmq', 'user-service'],
)

k8s_resource(
    'ai-service',
    port_forwards=['4003:4003'],
    resource_deps=['redis', 'rabbitmq'],
)

k8s_resource(
    'ai-worker',
    resource_deps=['redis', 'rabbitmq'],
)

k8s_resource(
    'api-gateway',
    port_forwards=['3001:3001'],
    resource_deps=['user-service', 'list-service', 'ai-service'],
)

k8s_resource(
    'web',
    port_forwards=['3000:3000'],
    resource_deps=['api-gateway'],
)
