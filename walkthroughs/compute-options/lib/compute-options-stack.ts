import * as path from "path";
import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as servicediscovery from "@aws-cdk/aws-servicediscovery";
import * as lambda from "@aws-cdk/aws-lambda";
import { PythonFunction } from "@aws-cdk/aws-lambda-python";

export class ComputeOptionsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Infrastructure
    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAzs: 3 // Default is all AZs in region
    });

    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc: vpc,
      defaultCloudMapNamespace: {
        name: "local",
        type: servicediscovery.NamespaceType.DNS_PRIVATE,
        vpc: vpc
      }
    });

    // greeter server (container)
    var greeterTaskDef = new ecs.FargateTaskDefinition(this, "greeter_server_taskdef", {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    var greeterAppLogDriver = new ecs.AwsLogDriver({
      streamPrefix: "greeter"
    });
    var greeterAppContainer = greeterTaskDef.addContainer("greeter_server", {
      image: ecs.ContainerImage.fromRegistry("buzzsurfr/greeter_server"),
      memoryLimitMiB: 128,
      logging: greeterAppLogDriver,
      environment: {
        GREETER_VERSION: "v1"
      }
    });
    greeterAppContainer.addPortMappings({
      containerPort: 50051
    });

    var greeterService = new ecs.FargateService(this, "greeter_server", {
      cluster: cluster,
      desiredCount: 1,
      assignPublicIp: false,
      taskDefinition: greeterTaskDef,
      cloudMapOptions: {
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: cdk.Duration.seconds(10),
        failureThreshold: 2,
        name: "greeter"
      }
    });
    // greeterService.connections.allowFrom(greeterClient, ec2.Port.tcp(50051), "Allow inbound from client");
    
    // greeter client (function)
    var greeterClient = new PythonFunction(this, 'greeter_client', {
      entry: path.join(__dirname, '../../../examples/helloworld/greeter_client_python'),
      runtime: lambda.Runtime.PYTHON_3_7,
      vpc: vpc,
      environment: {
        "GREETER_ENDPOINT": greeterService.cloudMapService?.serviceName + "." + greeterService.cloudMapService?.namespace.namespaceName + ":" + greeterAppContainer.portMappings[0].containerPort.toString()
      },
    });
    greeterClient.connections.allowTo(greeterService, ec2.Port.tcp(50051), "Allow outbound to server");

    // Output (commands to test)
    var outputTestClientBash = new cdk.CfnOutput(this, 'TestClientBash', {
      description: "Use this command to invoke the lambda function and test the gRPC connection. (Linux/MacOS)",
      value: `aws lambda invoke --function-name ${greeterClient.functionName} --payload '{"name": "world"}' --log-type Tail --output text --query LogResult /dev/null | base64 -d`,
    });
    var outputTestServerBash = new cdk.CfnOutput(this, 'TestServerBash', {
      description: "Use this command to read the container logs after testing the gRPC connection. (Linux/MacOS)",
      value: `aws logs get-log-events --log-group-name ${greeterAppLogDriver.logGroup?.logGroupName} --log-stream-name $(aws logs describe-log-streams --log-group-name ${greeterAppLogDriver.logGroup?.logGroupName} --query "logStreams[0].logStreamName" --output text) --query "events[*].[message]" --output text`,
    });
    var outputTestClientPowerShell = new cdk.CfnOutput(this, 'TestClientPowerShell', {
      description: "Use this command to invoke the lambda function and test the gRPC connection. (Windows)",
      value: `Invoke-LMFunction -FunctionName  ${greeterClient.functionName} -Payload '{"name": "world"}' -LogType Tail | %{[System.Text.Encoding]::ASCII.GetString([System.Convert]::FromBase64String($_.LogResult))}`,
    });
    var outputTestServerPowerShell = new cdk.CfnOutput(this, 'TestServerPowerShell', {
      description: "Use this command to read the container logs after testing the gRPC connection. (Windows)",
      value: `Get-CWLLogEvents -LogGroupName ${greeterAppLogDriver.logGroup?.logGroupName} -LogStreamName "$(Get-CWLLogStreams -LogGroupName ${greeterAppLogDriver.logGroup?.logGroupName} | %{$_.LogStreamName})" | %{$_.Events.Message}`,
    });

  }
}
