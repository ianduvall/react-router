/**
 * @react-router/dev v7.15.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import {
  invariant
} from "./chunk-ICAYQJLQ.js";

// vite/node-adapter.ts
async function fromNodeRequest(nodeReq, nodeRes) {
  invariant(
    nodeReq.originalUrl,
    "Expected `nodeReq.originalUrl` to be defined"
  );
  nodeReq.url = nodeReq.originalUrl;
  const { createRequest } = await import("@remix-run/node-fetch-server");
  return createRequest(nodeReq, nodeRes);
}

export {
  fromNodeRequest
};
