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
  cleanBuildDirectory,
  cleanViteManifests,
  extractPluginContext,
  getEnvironmentOptionsResolvers,
  getServerEnvironmentKeys,
  resolveEnvironmentsOptions,
  resolveViteConfig
} from "./chunk-HO3IJYIN.js";
import {
  hasReactRouterRscPlugin
} from "./chunk-D6FNAMFC.js";
import "./chunk-7BT2VM7K.js";
import "./chunk-U5IPLNX6.js";
import {
  loadConfig
} from "./chunk-O2BPZOZQ.js";
import "./chunk-6MCKIN3Q.js";
import {
  getVite,
  preloadVite
} from "./chunk-2X6Y525O.js";
import {
  invariant
} from "./chunk-ICAYQJLQ.js";

// vite/build.ts
import colors from "picocolors";
async function build(root, viteBuildOptions) {
  await preloadVite();
  let vite = getVite();
  let configResult = await loadConfig({
    rootDirectory: root,
    mode: viteBuildOptions.mode ?? "production",
    // In this scope we only need future flags, so we can skip evaluating
    // routes.ts until we're within the Vite build context
    skipRoutes: true
  });
  if (!configResult.ok) {
    throw new Error(configResult.error);
  }
  let config = configResult.value;
  let viteMajor = parseInt(vite.version.split(".")[0], 10);
  if (config.future.v8_viteEnvironmentApi && viteMajor === 5) {
    throw new Error(
      "The future.v8_viteEnvironmentApi option is not supported in Vite 5"
    );
  }
  const useViteEnvironmentApi = config.future.v8_viteEnvironmentApi || await hasReactRouterRscPlugin({ root, viteBuildOptions });
  return await (useViteEnvironmentApi ? viteAppBuild(root, viteBuildOptions) : viteBuild(root, viteBuildOptions));
}
async function viteAppBuild(root, {
  assetsInlineLimit,
  clearScreen,
  config: configFile,
  emptyOutDir,
  force,
  logLevel,
  minify,
  mode,
  sourcemapClient,
  sourcemapServer
}) {
  let vite = getVite();
  let builder = await vite.createBuilder({
    root,
    mode,
    configFile,
    build: {
      assetsInlineLimit,
      emptyOutDir,
      minify
    },
    optimizeDeps: { force },
    clearScreen,
    logLevel,
    plugins: [
      {
        name: "react-router:cli-config",
        configEnvironment(name) {
          if (sourcemapClient && name === "client") {
            return {
              build: {
                sourcemap: sourcemapClient
              }
            };
          }
          if (sourcemapServer && name !== "client") {
            return {
              build: {
                sourcemap: sourcemapServer
              }
            };
          }
        },
        configResolved(config) {
          let hasReactRouterPlugin = config.plugins.find(
            (plugin) => plugin.name === "react-router" || plugin.name === "react-router/rsc"
          );
          if (!hasReactRouterPlugin) {
            throw new Error(
              "React Router Vite plugin not found in Vite config"
            );
          }
        }
      }
    ]
  });
  await builder.buildApp();
}
async function viteBuild(root, {
  assetsInlineLimit,
  clearScreen,
  config: configFile,
  emptyOutDir,
  force,
  logLevel,
  minify,
  mode,
  sourcemapClient,
  sourcemapServer
}) {
  let viteUserConfig = {};
  let viteConfig = await resolveViteConfig({
    configFile,
    mode,
    root,
    plugins: [
      {
        name: "react-router:extract-vite-user-config",
        config(config) {
          viteUserConfig = config;
        }
      }
    ]
  });
  let ctx = extractPluginContext(viteConfig);
  if (!ctx) {
    console.error(
      colors.red("React Router Vite plugin not found in Vite config")
    );
    process.exit(1);
  }
  async function buildEnvironment(environmentName) {
    let vite = getVite();
    let ssr = environmentName !== "client";
    let resolveOptions = environmentOptionsResolvers[environmentName];
    invariant(resolveOptions);
    let environmentBuildContext = {
      name: environmentName,
      resolveOptions
    };
    await vite.build({
      root,
      mode,
      configFile,
      build: {
        assetsInlineLimit,
        emptyOutDir,
        minify,
        ssr,
        sourcemap: ssr ? sourcemapServer : sourcemapClient
      },
      optimizeDeps: { force },
      clearScreen,
      logLevel,
      ...{
        __reactRouterPluginContext: ctx,
        __reactRouterEnvironmentBuildContext: environmentBuildContext
      }
    });
  }
  let { reactRouterConfig, buildManifest } = ctx;
  invariant(buildManifest, "Expected build manifest to be present");
  let environmentOptionsResolvers = await getEnvironmentOptionsResolvers(
    ctx,
    "build"
  );
  let environmentsOptions = resolveEnvironmentsOptions(
    environmentOptionsResolvers,
    { viteUserConfig }
  );
  await cleanBuildDirectory(viteConfig, ctx);
  await buildEnvironment("client");
  let serverEnvironmentNames = getServerEnvironmentKeys(
    ctx,
    environmentOptionsResolvers
  );
  await Promise.all(serverEnvironmentNames.map(buildEnvironment));
  await cleanViteManifests(environmentsOptions, ctx);
  await reactRouterConfig.buildEnd?.({
    buildManifest,
    reactRouterConfig,
    viteConfig
  });
}
export {
  build
};
