#!/bin/bash

# script used to allow start the PoC setup.
#
# Can use specific tags:
#
# Official:
#   node:latest
#   node:14.16.1-stretch
#
# Bash based.

os_node=${1:-'node:14-buster'} # stick to 14 for lockfileVersion stability

# for the current branch - make sure name and S3 are setup to dev.
echo_section() {
    echo ""
    echo "$1"
    echo "****************"
    echo ""
}

cleanup() {
    # remove artifacts left locally by previous npm install
    rm -rf appoptics-legacy/node_modules 
    rm -rf appoptics-w3c/node_modules 
    rm -rf otel/node_modules

    rm -rf appoptics-legacy/package-lock.json
    rm -rf appoptics-w3c/package-lock.json
    rm -rf otel/package-lock.json

    docker rm "$container_id"
}

set -e
trap cleanup EXIT

echo_section "Zipkin Setup"

if [ "$(docker inspect -f '{{.State.Running}}' zipkin 2>/dev/null)" = "true" ]; then 
    echo "Zipkin is running." 
else 
    echo "Starting Zipkin." 
    docker run --rm -d -p 9411:9411 --name zipkin openzipkin/zipkin; 
fi

echo_section "Container Setup"

# pull a standard image
docker pull "$os_node"

# open a shell in detached mode
container_id=$(docker run -itd \
    -h "${os_node}" \
    -w /usr/src/work \
    -v "$(pwd)":/usr/src/work \
    -p 3000:3000 \
    -p 3100:3100 \
    -p 3200:3200 \
    -e NODE_ENV=production \
    --env-file .env \
    "$os_node" bash)


echo_section "NPM install"

docker exec "$container_id" bash -c "cd appoptics-legacy && npm install"
docker exec "$container_id" bash -c "cd appoptics-w3c && npm install"
docker exec "$container_id" bash -c "cd otel && npm install"

echo_section "Start Servers"

docker exec "$container_id" bash -c "npm run --prefix appoptics-w3c start &"
docker exec "$container_id" bash -c "npm run --prefix appoptics-legacy start &"
docker exec "$container_id" bash -c "npm run --prefix otel start &"

echo_section "System info"

echo "Container Id is ""$container_id"""
docker exec "$container_id" printenv
docker exec "$container_id" node --version
docker exec "$container_id" npm --version

# ready for work
docker attach "$container_id"
