oc_devtest_server := "https://api.arodevtest.hel.fi:6443"
oc_staging_production_server := "https://api.platta.hel.fi:6443"
az_tenant := "3feb6bc1-d722-4726-966c-5b58b64df752"
az_devops_resource := "499b84ac-1321-427f-aa17-267ca6975798"
az_org := "https://dev.azure.com/City-of-Helsinki"
az_project := "tilavarauspalvelu"

# List all available commands
help:
    @just --list

# Log in to OpenShift for an env (dev, test, staging, production)
oc-login env:
    #!/usr/bin/env bash
    set -euo pipefail

    case "{{ env }}" in
        dev|test)
            server="{{ oc_devtest_server }}"
            ;;
        staging|production)
            server="{{ oc_staging_production_server }}"
            if ! curl -sk --max-time 5 -o /dev/null "${server}/version"; then
                echo "Cannot reach ${server}. Connect to the azurehuolto.hel.fi VPN first." >&2
                exit 1
            fi
            ;;
        *)
            echo "Unknown env '{{ env }}'. Use dev, test, staging or production." >&2
            exit 1
            ;;
    esac

    # Keep the current context if it is already logged in to this server
    current_server=$(oc whoami --show-server 2>/dev/null || true)
    if [ "${current_server}" = "${server}" ] && oc whoami >/dev/null 2>&1; then
        exit 0
    fi

    # Reuse a saved context for this server if its token is still valid
    cluster=$(echo "${server#https://}" | tr . -)
    context=$(oc config get-contexts -o name | grep -F "/${cluster}/" | head -n 1 || true)
    context_server=$(oc --context="${context}" whoami --show-server 2>/dev/null || true)
    if [ -n "${context}" ] && [ "${context_server}" = "${server}" ] && oc --context="${context}" whoami >/dev/null 2>&1; then
        oc config use-context "${context}" >/dev/null
    else
        oc login --web --server="${server}"
    fi

# Log in to OpenShift and select the project for an env (dev, test, staging, production)
oc-select env: (oc-login env)
    #!/usr/bin/env bash
    set -euo pipefail

    case "{{ env }}" in
        dev)
            project="hki-kanslia-aok-tilavarauspalvelu-dev"
            ;;
        test)
            project="hki-kanslia-aok-tilavarauspalvelu-test"
            ;;
        staging)
            project="hki-kanslia-aok-tilavarauspalvelu-staging"
            ;;
        production)
            project="hki-kanslia-aok-tilavarauspalvelu-prod"
            ;;
        *)
            echo "Unknown env '{{ env }}'. Use dev, test, staging or production." >&2
            exit 1
            ;;
    esac

    oc project "${project}"

# Show the latest deploy of each app for an env
oc-status env: (oc-select env)
    #!/usr/bin/env bash
    set -euo pipefail

    oc get rc -o json \
        | jq -r '
            [.items[] | select(.metadata.annotations["openshift.io/deployment-config.name"] != null)]
            | group_by(.metadata.annotations["openshift.io/deployment-config.name"])
            | map(max_by(.metadata.annotations["openshift.io/deployment-config.latest-version"] | tonumber))
            | ["APP", "REVISION", "PHASE", "IMAGE", "CREATED", "READY"],
              (.[] | [
                .metadata.annotations["openshift.io/deployment-config.name"],
                .metadata.annotations["openshift.io/deployment-config.latest-version"],
                .metadata.annotations["openshift.io/deployment.phase"],
                (.spec.template.spec.containers[0].image | split("/") | last),
                .metadata.creationTimestamp,
                "\(.status.readyReplicas // 0)/\(.spec.replicas)"
              ])
            | @tsv' \
        | column -t -s $'\t'

# Follow the logs of an app (core, worker, scheduler, customer-ui, staff-ui) for an env
oc-logs app env: (oc-select env)
    #!/usr/bin/env bash
    set -euo pipefail

    case "{{ app }}" in
        core)
            deploymentconfig="tilavarauspalvelu-core"
            ;;
        worker)
            deploymentconfig="tilavarauspalvelu-core-worker"
            ;;
        scheduler)
            deploymentconfig="tilavarauspalvelu-core-scheduler"
            ;;
        customer-ui)
            deploymentconfig="tilavarauspalvelu-customer-ui"
            ;;
        staff-ui)
            deploymentconfig="tilavarauspalvelu-staff-ui"
            ;;
        *)
            echo "Unknown app '{{ app }}'. Use core, worker, scheduler, customer-ui or staff-ui." >&2
            exit 1
            ;;
    esac

    oc logs -l deploymentconfig="${deploymentconfig}" --prefix --tail=100 -f

# Log in to Azure DevOps in the City of Helsinki tenant
az-login:
    #!/usr/bin/env bash
    set -euo pipefail

    # Keep the current login if it can get an Azure DevOps token for this tenant
    if az account get-access-token --tenant "{{ az_tenant }}" --resource "{{ az_devops_resource }}" >/dev/null 2>&1; then
        exit 0
    fi

    az login --tenant "{{ az_tenant }}" --allow-no-subscriptions

# Show the status and steps of an Azure pipeline build
az-build id: az-login
    #!/usr/bin/env bash
    set -euo pipefail

    az pipelines runs show --org "{{ az_org }}" --project "{{ az_project }}" --id "{{ id }}" \
        --query '{pipeline: definition.name, branch: sourceBranch, result: result, start: startTime, finish: finishTime}' \
        -o yaml
    echo

    az devops invoke --org "{{ az_org }}" --area build --resource timeline \
        --route-parameters project="{{ az_project }}" buildId="{{ id }}" --api-version 7.1 -o json \
        | jq -r '.records | sort_by(.startTime) | .[] | select(.type == "Job" or .type == "Task")
            | "\(.result // .state)\tlog=\(.log.id // "-")\t\(if .type == "Job" then "" else "  " end)\(.name)"'

# Show the log of a build step. Without a log ID, show the logs of all failed steps.
az-build-log id log="": az-login
    #!/usr/bin/env bash
    set -euo pipefail

    if [ -n "{{ log }}" ]; then
        log_ids="{{ log }}"
    else
        log_ids=$(az devops invoke --org "{{ az_org }}" --area build --resource timeline \
            --route-parameters project="{{ az_project }}" buildId="{{ id }}" --api-version 7.1 -o json \
            | jq -r '.records[] | select(.type == "Task" and .result == "failed" and .log.id != null) | .log.id')
    fi

    for log_id in ${log_ids}; do
        echo "=== Log ${log_id} ==="
        az devops invoke --org "{{ az_org }}" --area build --resource logs \
            --route-parameters project="{{ az_project }}" buildId="{{ id }}" logId="${log_id}" --api-version 7.1 -o json \
            | jq -r '.value[]'
    done
