#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ComputeOptionsStack } from '../lib/compute-options-stack';

const app = new cdk.App();
new ComputeOptionsStack(app, 'ComputeOptionsStack');
