#!/bin/sh

CALLING_PM=$(basename "$0")

EXPECTED_PM="pnpm"

if [ "$CALLING_PM" != "$EXPECTED_PM" ] && [ "$CALLING_PM" != "enforce-pm.sh" ]; then
    echo "--------------------------------------------------------"
    echo "ERROR: This project uses '$EXPECTED_PM'. Please use '$EXPECTED_PM' for all package manager operations."
    echo "       Instead of '$CALLING_PM', run: $EXPECTED_PM install"
    echo "--------------------------------------------------------"
    exit 1
fi
