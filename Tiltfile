allow_k8s_contexts('docker-desktop')

watch_file('infra/k8s')

k8s_yaml([
    f for f in listdir('infra/k8s')
    if f.endswith('.yaml') or f.endswith('.yml')
])

# ---------------------------------------------------------------------------
# Environment variables
#
# The image never contains a .env - it is in .dockerignore on purpose, so one
# image can run in any environment. The pod gets its environment from a
# ConfigMap instead, and in local dev that ConfigMap is generated from
# auth/.env, which stays the single source of truth.
#
# Two resources, because a ConfigMap change alone does NOT reach a running
# container: env vars are read once, when the container starts. The second
# resource is what makes `edit .env -> pod has the new value` work.
# ---------------------------------------------------------------------------

# image, context, deployment, host port, env file
SERVICES = [
    ('clevinmw/auth', 'auth', 'auth-deployment', 3000, 'auth/.env'),
]

for (_image, _context, deployment, _port, env_file) in SERVICES:
    config_name = deployment.replace('-deployment', '') + '-env'

    # 1. Turn the .env file into a ConfigMap. --dry-run=client just prints the
    #    YAML, which is piped into apply, so this both creates and updates it.
    local_resource(
        config_name,
        cmd='kubectl create configmap %s --from-env-file=%s --dry-run=client -o yaml | kubectl apply -f -'
        % (config_name, env_file),
        deps=[env_file],
        labels=['config'],
    )

    # 2. Restart the pod so it picks the new values up. auto_init=False keeps
    #    this from firing on `tilt up` (the pod is already starting with the
    #    current config); it then runs on every later edit of the .env file.
    local_resource(
        config_name + '-reload',
        cmd='kubectl rollout restart deployment/%s' % deployment,
        deps=[env_file],
        resource_deps=[deployment],
        auto_init=False,
        labels=['config'],
    )

for (image, context, deployment, host_port, env_file) in SERVICES:
    docker_build(
        image,
        context,
        target='dev',
        live_update=[
            fall_back_on([
                context + '/package.json',
                context + '/package-lock.json',
            ]),
            sync(context + '/src', '/app/src'),
        ],
    )

    k8s_resource(
        deployment,
        port_forwards='%d:3000' % host_port,
        labels=['services'],
        # The ConfigMap has to exist before the pod starts, or the container
        # comes up with no MONGO_URI and crashes on boot.
        resource_deps=[deployment.replace('-deployment', '') + '-env'],
    )

# ---------------------------------------------------------------------------
# Gateway: http://quickticket.test -> localhost:80 -> Envoy proxy
#
# Docker Desktop's kind-based cluster can't provision LoadBalancer Services,
# so the Envoy proxy Service is a ClusterIP (see EnvoyProxy in gateway.yaml)
# and is reached through this port-forward while Tilt is running.
# Requires: Envoy Gateway installed (see gateway.yaml) and a hosts entry
#   127.0.0.1  quickticket.test
# ---------------------------------------------------------------------------
local_resource(
    'gateway-port-forward',
    serve_cmd='kubectl port-forward -n envoy-gateway-system svc/envoy-quickticket 80:80',
    labels=['gateway'],
)
