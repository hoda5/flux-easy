#!/bin/bash


flux-easy src/login.jsx build/login.jsx --map
babel build/login.jsx  --out-file build/login.js --source-maps inline

