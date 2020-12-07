subscription-manager register --username $1 --password $2
subscription-manager attach --auto
subscription-manager repos --enable codeready-builder-for-rhel-8-x86_64-rpms
