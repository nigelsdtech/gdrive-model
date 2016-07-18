#!/bin/sh

. ~/bin/setup_node_env.sh

appname=${PWD##*/}
export NODE_APP_INSTANCE=${appname}"-test"

mocha -b test
