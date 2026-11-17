# Safety: refuse to run against anything but a local cluster.
allow_k8s_contexts('docker-desktop')

# --- auth -----------------------------------------------------------------
k8s_yaml('infra/k8s/auth-depl.yaml')

docker_build(
    'clevinmw/auth',
    './auth',
    target='dev',
    live_update=[
        # Dependency change? Fall back to a full image rebuild.
        fall_back_on(['./auth/package.json', './auth/package-lock.json']),
        # Otherwise just copy changed source into the running container.
        sync('./auth/src', '/app/src'),
    ],
)

k8s_resource('auth-deployment', port_forwards='3000:3000')
