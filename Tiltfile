allow_k8s_contexts('docker-desktop')

watch_file('infra/k8s')

k8s_yaml([
    f for f in listdir('infra/k8s')
    if f.endswith('.yaml') or f.endswith('.yml')
])

# image, context, deployment, host port
SERVICES = [
    ('clevinmw/auth', 'auth', 'auth-deployment', 3000),
]

for (image, context, deployment, host_port) in SERVICES:
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
    )
