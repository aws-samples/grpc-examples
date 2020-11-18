# Copyright 2015 gRPC authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""The Python implementation of the GRPC helloworld.Greeter client."""

from __future__ import print_function
import logging
import os
import sys

import grpc

import helloworld_pb2
import helloworld_pb2_grpc

endpoint = os.getenv("GREETER_ENDPOINT", "localhost:50051")

def handler(event, context):
    with grpc.insecure_channel(endpoint) as channel:
        stub = helloworld_pb2_grpc.GreeterStub(channel)
        response = stub.SayHello(helloworld_pb2.HelloRequest(name=event['name']))
    print("Received from backend: " + response.message)

if __name__ == "__main__":
    event = {}
    event['name'] = " ".join(sys.argv[1:])
    handler(event, None)