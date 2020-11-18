# Compute Options Walkthrough

This is a CDK project that deploys a greeter client written in Python running on a Lambda function to a greeter server written in Go running on a Fargate task (container).

This walkthrough is the code used in the AWS Open Source Blog post **The versatility of gRPC, an open source high-performance RPC framework** (link TBD).

## Useful commands

 * `npm run build && cdk deploy`   compile typescript to js and deploy this stack to your default AWS account/region
 * `cdk destroy`       removes the deployed CloudFormation stack
