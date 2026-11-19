import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(testDir, "..");
const clientPath = path.join(pluginRoot, "lib/client.js");
const clientSource = fs.readFileSync(clientPath, "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8"));
const patchSource = fs.readFileSync(path.join(pluginRoot, "cordis.patch.yml"), "utf8");
const serverSource = fs.readFileSync(path.join(pluginRoot, "lib/index.js"), "utf8");

const PLUGIN_ID = "@guojing6/dsh-webchat";
const TAB_ID = PLUGIN_ID + "/tab";
const TAB_KIND = "webchat";
const COMMAND_ID = "webchat.open";
const SWITCH_BUTTON_ID = "dsh-webchat-switch";
const STYLE_ID = "dsh-webchat-styles";
const SESSION_PREFIX = "dsh-webchat:session:";
const LAST_PROVIDER_KEY = "dsh-webchat:last-provider";

const quietConsole = {
  log() {},
  warn() {},
  error() {},
  info() {},
  debug() {},
};

const EXPECTED_PROVIDERS = [
  "deepseek",
  "qwen",
  "doubao",
  "kimi",
  "zhipu",
  "chatgpt",
  "gemini",
  "grok",
  "zai",
];

function compareVersions(left, right) {
  const [leftMain, leftPre] = String(left).split("-", 2);
  const [rightMain, rightPre] = String(right).split("-", 2);
  const leftParts = leftMain.split(".").map((part) => Number(part));
  const rightParts = rightMain.split(".").map((part) => Number(part));
  for (let index = 0; index < 3; index += 1) {
    const a = leftParts[index] ?? 0;
    const b = rightParts[index] ?? 0;
    if (a !== b) return a - b;
  }
  if (leftPre === undefined && rightPre === undefined) return 0;
  if (leftPre === undefined) return 1;
  if (rightPre === undefined) return -1;
  const leftTokens = leftPre.split(".");
  const rightTokens = rightPre.split(".");
  const length = Math.max(leftTokens.length, rightTokens.length);
  for (let index = 0; index < length; index += 1) {
    const a = leftTokens[index] ?? "";
    const b = rightTokens[index] ?? "";
    if (a === b) continue;
    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) return Number(a) - Number(b);
    if (aNumeric) return -1;
    if (bNumeric) return 1;
    return a < b ? -1 : 1;
  }
  return 0;
}

function admitsVersion(version, range) {
  for (const match of range.matchAll(/(>=|<=|>|<)\s*([^\s<>=]+)/g)) {
    const operator = match[1];
    const bound = match[2];
    const comparison = compareVersions(version, bound);
    if (operator === ">=" && comparison < 0) return false;
    if (operator === "<=" && comparison > 0) return false;
    if (operator === ">" && comparison <= 0) return false;
    if (operator === "<" && comparison >= 0) return false;
  }
  return true;
}

function createStorage(initial = {}) {
  const data = initial instanceof Map ? new Map(initial) : new Map(Object.entries(initial ?? {}));
  return {
    get length() {
      return data.size;
    },
    key(index) {
      return Array.from(data.keys())[index] ?? null;
    },
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(String(key), String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
    _data: data,
  };
}

function createDomElement(tag = "div") {
  return {
    tagName: String(tag).toUpperCase(),
    id: "",
    className: "",
    textContent: "",
    style: {},
    attributes: {},
    children: [],
    parentElement: null,
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === "id") this.id = String(value);
    },
    getAttribute(name) {
      return this.attributes[name] ?? null;
    },
    appendChild(child) {
      if (child.parentElement) child.parentElement.removeChild(child);
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index >= 0) this.children.splice(index, 1);
      child.parentElement = null;
      return child;
    },
    remove() {
      if (this.parentElement) this.parentElement.removeChild(this);
    },
    addEventListener() {},
    removeEventListener() {},
  };
}

function createWebview() {
  const element = createDomElement("webview");
  const listeners = new Map();
  element.listeners = listeners;
  element.loaded = [];
  element.userAgents = [];
  element.scripts = [];
  element.removed = false;
  element.loadError = null;
  element.scriptHandler = null;
  element.loadURL = (url) => {
    element.loaded.push(url);
    if (element.loadError) return Promise.reject(element.loadError);
    return Promise.resolve();
  };
  element.setUserAgent = (userAgent) => {
    element.userAgents.push(userAgent);
  };
  element.executeJavaScript = (script) => {
    element.scripts.push(script);
    try {
      const result = element.scriptHandler ? element.scriptHandler(script) : "";
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  };
  element.addEventListener = (type, listener) => {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(listener);
  };
  element.removeEventListener = (type, listener) => {
    const list = listeners.get(type);
    if (!list) return;
    const index = list.indexOf(listener);
    if (index >= 0) list.splice(index, 1);
  };
  element.emit = (type, detail) => {
    for (const listener of [...(listeners.get(type) ?? [])]) listener(detail);
  };
  element.remove = () => {
    element.removed = true;
    if (element.parentElement) element.parentElement.removeChild(element);
  };
  return element;
}

function createBrowser(overrides = {}) {
  const calls = {
    acquire: [],
    release: [],
    openRequested: [],
    listeners: [],
    unsubscribed: 0,
  };
  let leaseCounter = 0;
  const browser = {
    calls,
    acquire(workspace) {
      calls.acquire.push(workspace);
      if (overrides.acquire) return overrides.acquire(workspace);
      leaseCounter += 1;
      return Promise.resolve({
        lease: "lease-" + leaseCounter,
        partition: "persist:dsh-webchat-test-" + leaseCounter,
      });
    },
    release(lease) {
      calls.release.push(lease);
      if (overrides.release) return overrides.release(lease);
      return Promise.resolve();
    },
    onOpenRequested(lease, listener) {
      calls.openRequested.push(lease);
      calls.listeners.push(listener);
      if (overrides.onOpenRequested) return overrides.onOpenRequested(lease, listener);
      return () => {
        calls.unsubscribed += 1;
      };
    },
  };
  return browser;
}

function createReact() {
  return {
    createElement(type, props, ...children) {
      const normalized =
        children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
      return { type, props: { ...(props ?? {}), children: normalized } };
    },
    useRef(initial) {
      return { current: initial };
    },
    useState(initial) {
      return [typeof initial === "function" ? initial() : initial, () => {}];
    },
    useCallback(callback) {
      return callback;
    },
    useEffect() {},
  };
}

function createDocument(options = {}) {
  const head = createDomElement("head");
  const body = createDomElement("body");
  const webviews = [];
  const document = {
    documentElement: { dataset: options.dataset ?? {} },
    head,
    body,
    webviews,
    createElement(tag) {
      if (tag === "webview") {
        const webview = createWebview();
        webviews.push(webview);
        return webview;
      }
      return createDomElement(tag);
    },
    getElementById(id) {
      const find = (node) => {
        if (!node || typeof node !== "object") return null;
        if (node.id === id) return node;
        for (const child of node.children ?? []) {
          const found = find(child);
          if (found) return found;
        }
        return null;
      };
      return find(head) ?? find(body);
    },
  };
  return document;
}

function loadPlugin(options = {}) {
  const consoleObject = options.console ?? console;
  const react = options.react ?? createReact();
  const document = createDocument(options);
  const storage = options.storage ?? createStorage(options.hostStorage);
  const timers = {
    nextId: 1,
    intervals: [],
    timeouts: [],
    clearedIntervals: [],
    clearedTimeouts: [],
  };
  const window = {
    location: { protocol: options.protocol ?? "dsh-app:" },
    document,
    navigator: options.navigator ?? {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    },
    localStorage: storage,
    opened: [],
    open(url, target, features) {
      window.opened.push({ url, target, features });
      return null;
    },
    setInterval(callback, delay) {
      const id = timers.nextId;
      timers.nextId += 1;
      timers.intervals.push({ id, callback, delay });
      return id;
    },
    clearInterval(id) {
      timers.clearedIntervals.push(id);
    },
    setTimeout(callback, delay) {
      const id = timers.nextId;
      timers.nextId += 1;
      timers.timeouts.push({ id, callback, delay });
      return id;
    },
    clearTimeout(id) {
      timers.clearedTimeouts.push(id);
    },
    dshDesktop:
      options.browser === null
        ? undefined
        : { browser: options.browser ?? createBrowser(options.browserOptions) },
  };

  const context = {
    window,
    document,
    navigator: window.navigator,
    localStorage: storage,
    console: consoleObject,
    URL,
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    setInterval: window.setInterval,
    clearInterval: window.clearInterval,
  };
  vm.createContext(context);

  const probeNames = [
    "PROVIDERS",
    "PROVIDER_BY_ID",
    "MESSAGES",
    "TAB_ID",
    "TAB_KIND",
    "COMMAND_ID",
    "GUIDE_ENTRY_ID",
    "SWITCH_BUTTON_ID",
    "STYLE_ID",
    "SESSION_PREFIX",
    "SESSION_VERSION",
    "LAST_PROVIDER_KEY",
    "ENABLED_KEY",
    "CUSTOM_KEY",
    "ORDER_KEY",
    "CUSTOM_LIMIT",
    "DEFAULT_ENABLED_IDS",
    "readEnabledProviders",
    "writeEnabledProviders",
    "pickActiveProvider",
    "readCustomProviders",
    "writeCustomProviders",
    "deleteCustomProvider",
    "readProviderOrder",
    "writeProviderOrder",
    "applyProviderOrder",
    "orderedProviders",
    "makeCustomProvider",
    "normalizeCustomUrl",
    "providerName",
    "SNAPSHOT_LIMIT",
    "COOKIE_LIMIT",
    "WORKSPACE_KEY",
    "makeSessionKey",
    "readSnapshot",
    "writeSnapshot",
    "readStorageScript",
    "restoreStorageScript",
    "createProviderGuest",
    "createLinkOpener",
    "publishTabProvider",
    "getTabProvider",
    "clearTabProvider",
    "subscribeTabProvider",
  ];
  const needle = "    return { apply, inject };";
  assert.equal(
    clientSource.split(needle).length - 1,
    1,
    "the client source should contain exactly one return statement for apply/inject",
  );
  const probeCode = "    globalThis.__probe = { " + probeNames.join(", ") + " };\n";
  const source = clientSource.replace(needle, probeCode + needle);

  let factory = null;
  window.__ModuleLoader__ = {
    load(definition) {
      assert.equal(definition.id, PLUGIN_ID);
      assert.equal(typeof definition.factory, "function");
      factory = definition.factory;
    },
  };
  vm.runInContext(source, context, { filename: "lib/client.js" });
  assert.equal(typeof factory, "function", "the client module should register a factory");
  const exports = factory((id) => {
    assert.equal(id, "react");
    return react;
  });
  const probe = context.__probe;
  assert.ok(probe, "the test probe should be installed");

  return {
    exports,
    probe,
    context,
    window,
    document,
    storage,
    react,
    timers,
    console: consoleObject,
  };
}

function translate(dictionaries, locale, key, params) {
  const table = dictionaries?.[locale] ?? {};
  const fallback = dictionaries?.en ?? {};
  let text = table[key] ?? fallback[key] ?? key;
  for (const [name, value] of Object.entries(params ?? {})) {
    text = text.split("{" + name + "}").join(String(value));
  }
  return text;
}

function createContext(probe, options = {}) {
  const registrations = {
    slots: [],
    tabs: [],
    shortcuts: [],
    effects: [],
    openTabs: [],
    disposedSlots: 0,
    disposedTabs: 0,
    disposedShortcuts: 0,
    tabDisposers: [],
  };
  const dictionaries = {};
  const locale = {
    register(namespace, tables) {
      dictionaries[namespace] = tables;
      return () => {
        delete dictionaries[namespace];
      };
    },
    bind(namespace) {
      return (key, params) =>
        translate(dictionaries[namespace], options.locale ?? "zh", key, params);
    },
  };
  const slots = {
    register(spec, component) {
      registrations.slots.push({ spec, component });
      return () => {
        registrations.disposedSlots += 1;
      };
    },
    inject(slot, callback) {
      const dispose = callback();
      return () => {
        if (typeof dispose === "function") dispose();
      };
    },
  };
  const sidebarRight = options.sidebarRight === null ? null : {
    openTab(kind, params) {
      if (options.openTabError) throw new Error("no session surface is mounted");
      registrations.openTabs.push({ kind, params });
    },
    commandTarget(target) {
      if (options.commandTarget) return options.commandTarget(target);
      return { sessionId: "session-1" };
    },
  };
  const sidebarRightTabs = {
    register(definition) {
      registrations.tabs.push(definition);
      const dispose = () => {
        registrations.disposedTabs += 1;
      };
      registrations.tabDisposers.push(dispose);
      return dispose;
    },
    get(kind) {
      return kind === "browser" ? { id: "browser" } : undefined;
    },
  };
  const shortcuts = {
    register(definition) {
      registrations.shortcuts.push(definition);
      return () => {
        registrations.disposedShortcuts += 1;
      };
    },
  };
  const ctx = {
    locale,
    slots,
    sidebarRight,
    sidebarRightTabs,
    effect(callback, label) {
      const dispose = callback();
      registrations.effects.push({ dispose, label });
      return () => {
        if (typeof dispose === "function") dispose();
      };
    },
    inject(deps, callback) {
      assert.deepEqual(deps, ["shortcuts"]);
      if (options.shortcuts === null) return undefined;
      return callback({ shortcuts });
    },
  };
  return { ctx, registrations, dictionaries, locale, shortcuts };
}

function activate(options = {}) {
  const loaded = loadPlugin(options);
  const harness = createContext(loaded.probe, options);
  loaded.exports.apply(harness.ctx);
  return { ...loaded, ...harness };
}

function walk(node, visit) {
  if (node === null || node === undefined) return;
  if (typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (node.type !== undefined) visit(node);
  walk(node.props?.children, visit);
}

function findAll(root, predicate) {
  const found = [];
  walk(root, (node) => {
    if (predicate(node)) found.push(node);
  });
  return found;
}

function textOf(node) {
  const parts = [];
  walk(node, (element) => {
    if (typeof element.props?.children === "string") parts.push(element.props.children);
    if (Array.isArray(element.props?.children)) {
      for (const child of element.props.children) {
        if (typeof child === "string") parts.push(child);
      }
    }
  });
  return parts.join("");
}

async function flush() {
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

function findFailureStatus(statuses) {
  return statuses.find((status) => status.kind === "error");
}

function createGuest(loaded, options = {}) {
  const provider = loaded.probe.PROVIDER_BY_ID.get(options.providerId ?? "deepseek");
  assert.ok(provider, "the requested provider should exist");
  const container = createDomElement("div");
  const harness = createContext(loaded.probe, {});
  const statuses = [];
  const t = (key, params) => translate(loaded.probe.MESSAGES, "zh", key, params);
  const guest = loaded.probe.createProviderGuest(
    provider,
    container,
    harness.ctx,
    t,
    (status) => statuses.push(status),
  );
  return { guest, provider, container, harness, statuses, t };
}

function runGuestScript(script, options) {
  const storage = options.storage ?? createStorage(options.local ?? {});
  const document = options.document ?? { cookie: options.cookie ?? "" };
  const location = { origin: options.origin };
  const context = vm.createContext({
    localStorage: storage,
    document,
    location,
    JSON,
    Object,
    Array,
    Math,
    Date,
    RegExp,
    String,
    Number,
  });
  return vm.runInContext(script, context, { filename: "guest-script.js" });
}

function createCookieJar(initial = "") {
  const writes = [];
  return {
    writes,
    get cookie() {
      return initial;
    },
    set cookie(value) {
      writes.push(String(value));
    },
  };
}

test("manifest, patch and server entry are consistent", () => {
  assert.equal(packageJson.name, PLUGIN_ID);
  assert.equal(packageJson.version, "4.5.0");
  assert.equal(packageJson.type, "module");
  assert.equal(packageJson.main, "lib/index.js");
  assert.equal(packageJson.dsh.manifestVersion, 1);
  assert.equal(packageJson.dsh.client.platform, "web");
  assert.equal(packageJson.dsh.bundle.patch, "./cordis.patch.yml");
  assert.deepEqual(packageJson.files, [
    "lib/index.js",
    "lib/client.js",
    "cordis.patch.yml",
    "icon.svg",
  ]);
  assert.equal(packageJson.icon, "./icon.svg");
  assert.ok(packageJson.files.includes("lib/client.js"));
  assert.ok(admitsVersion("0.2.2-rc.5", packageJson.engines.dsh));
  assert.ok(!admitsVersion("0.2.3", packageJson.engines.dsh));
  assert.match(patchSource, /id:\s*webchat-entry/);
  assert.match(patchSource, /name:\s*'@guojing6\/dsh-webchat'/);
  assert.match(serverSource, /export function apply/);
  assert.match(clientSource, /id: "@guojing6\/dsh-webchat"/);
  assert.match(clientSource, /TAB_KIND = "webchat"/);
  assert.match(clientSource, /COMMAND_ID = "webchat\.open"/);
});

test("the client module is a lazy factory that only requires react", () => {
  assert.ok(!clientSource.includes("__ICON_ASSETS__"), "icon assets must be inlined");
  assert.doesNotMatch(clientSource, /^\s*import\s/m);
  const requires = [...clientSource.matchAll(/require\((["'])([^"']+)\1\)/g)].map(
    (match) => match[2],
  );
  assert.deepEqual([...new Set(requires)], ["react"]);
  const loaded = loadPlugin();
  assert.deepEqual(loaded.exports.inject, [
    "slots",
    "sidebarRight",
    "sidebarRightTabs",
    "locale",
  ]);
  assert.equal(loaded.window.__ModuleLoader__ !== undefined, true);
  assert.equal(loaded.probe.PROVIDERS.length, 9);
});

test("the provider catalog is nine distinct https origins with inline icons", () => {
  const loaded = loadPlugin();
  const providers = loaded.probe.PROVIDERS;
  assert.deepEqual(
    providers.map((provider) => provider.id),
    EXPECTED_PROVIDERS,
  );
  assert.equal(loaded.probe.PROVIDER_BY_ID.size, 9);
  for (const provider of providers) {
    assert.ok(provider.origin.startsWith("https://"), provider.id + " should use https");
    assert.ok(provider.url.startsWith(provider.origin + "/") || provider.url === provider.origin, provider.id);
    assert.equal(new URL(provider.url).origin, provider.origin);
    assert.match(provider.accent, /^#[0-9a-f]{6}$/i);
    assert.ok(["png", "svg"].includes(provider.kind), provider.id + " icon kind");
    assert.ok(provider.value.length > 100, provider.id + " icon payload");
    if (provider.kind === "png") assert.match(provider.value, /^data:image\/png;base64,/);
    if (provider.kind === "svg") assert.match(provider.value, /<svg[\s>]/);
  }
  const ids = new Set(providers.map((provider) => provider.id));
  assert.equal(ids.size, providers.length);
});

test("every locale dictionary has the same keys and provider labels", () => {
  const loaded = loadPlugin();
  const messages = loaded.probe.MESSAGES;
  assert.deepEqual(Object.keys(messages.zh).sort(), Object.keys(messages.en).sort());
  for (const providerId of EXPECTED_PROVIDERS) {
    assert.equal(typeof messages.zh["provider." + providerId], "string");
    assert.equal(typeof messages.en["provider." + providerId], "string");
  }
  for (const key of Object.keys(messages.zh)) {
    if (key.includes("{name}")) {
      assert.match(messages.zh[key], /\{name\}/);
      assert.match(messages.en[key], /\{name\}/);
    }
  }
});

test("the Web surface registers no UI", () => {
  const loaded = loadPlugin({ protocol: "http:" });
  const harness = createContext(loaded.probe);
  loaded.exports.apply(harness.ctx);
  assert.equal(harness.registrations.tabs.length, 0);
  assert.equal(harness.registrations.slots.length, 0);
  assert.equal(harness.registrations.shortcuts.length, 0);
  assert.equal(harness.registrations.effects.length, 0);
  assert.equal(loaded.document.head.children.length, 0);
});

test("apply registers the tab, guide, body, title, header button and shortcut", () => {
  const loaded = activate();
  const { registrations } = loaded;
  assert.equal(registrations.tabs.length, 1);
  const tab = registrations.tabs[0];
  assert.equal(tab.id, TAB_ID);
  assert.equal(tab.kind, TAB_KIND);
  assert.equal(tab.priority, "extension");
  assert.equal(tab.keepMounted, true);
  assert.equal(tab.title(), "网页版 AI");
  assert.equal(tab.guide.length, 1);
  const guide = tab.guide[0];
  assert.equal(guide.id, "webchat");
  assert.equal(guide.commandId, COMMAND_ID);
  assert.equal(guide.order, 35);
  assert.equal(guide.title(), "网页版 AI");
  assert.match(guide.description(), /9/);
  assert.match(guide.description(), /启用/);
  assert.equal(typeof guide.icon, "function");

  assert.equal(registrations.slots.length, 3);
  const bodySlot = registrations.slots.find((entry) => entry.spec.name === "sidebar.right.pane.tab");
  assert.equal(bodySlot.spec.key, TAB_ID);
  assert.equal(typeof bodySlot.component, "function");
  const titleSlot = registrations.slots.find(
    (entry) => entry.spec.name === "sidebar.right.pane.tab.title",
  );
  assert.equal(titleSlot.spec.key, TAB_ID);
  assert.equal(typeof titleSlot.component, "function");
  const headerSlot = registrations.slots.find(
    (entry) => entry.spec.name === "conversation.session.header.utilities",
  );
  assert.equal(headerSlot.spec.id, SWITCH_BUTTON_ID);
  assert.equal(headerSlot.spec.order, -100);

  assert.equal(registrations.shortcuts.length, 1);
  const shortcut = registrations.shortcuts[0];
  assert.equal(shortcut.id, COMMAND_ID);
  assert.equal(shortcut.label(), "打开网页版 AI");
  assert.deepEqual(shortcut.aliases, ["webchat", "web chat", "ai"]);
  assert.deepEqual(shortcut.defaults["desktop:windows"], {
    code: "KeyQ",
    modifiers: ["primary"],
  });
  assert.deepEqual(shortcut.defaults["desktop:macos"], {
    code: "KeyQ",
    modifiers: ["primary", "alt"],
  });
  assert.deepEqual(shortcut.regions, ["page", "editable", "terminal"]);
  assert.deepEqual(shortcut.modals, []);

  assert.equal(loaded.document.head.children.length, 1);
  const style = loaded.document.head.children[0];
  assert.equal(style.id, STYLE_ID);
  assert.equal(style.getAttribute("data-plugin"), PLUGIN_ID);
  assert.match(style.textContent, /\.dsh-webchat-toolbar/);
  assert.match(style.textContent, /\.dsh-webchat-overlay/);
  assert.match(style.textContent, /--dsw-alias-border-l1/);
  assert.doesNotMatch(style.textContent, /--dsw-alias-interactive-bg-hover/);
  assert.equal(registrations.effects.length, 3);
});

test("the English locale is wired through the locale service", () => {
  const loaded = activate({ locale: "en" });
  const tab = loaded.registrations.tabs[0];
  assert.equal(tab.title(), "Web AI");
  assert.equal(tab.guide[0].title(), "Web AI");
  assert.match(tab.guide[0].description(), /Switch between/);
  assert.equal(loaded.dictionaries.webchat.zh["action.open"], "打开网页版 AI");
  assert.equal(loaded.dictionaries.webchat.en["action.open"], "Open Web AI");
});

test("the header button opens the webchat tab, and falls back when it cannot", () => {
  const loaded = activate();
  const headerSlot = loaded.registrations.slots.find(
    (entry) => entry.spec.id === SWITCH_BUTTON_ID,
  );
  const button = headerSlot.component();
  assert.equal(button.type, "button");
  assert.equal(button.props["aria-label"], "打开网页版 AI");
  assert.equal(button.props.title, "打开网页版 AI");
  const glyph = button.props.children;
  assert.equal(typeof glyph.type, "function");
  const glyphElement = glyph.type(glyph.props);
  assert.match(glyphElement.props.dangerouslySetInnerHTML.__html, /<path/);
  assert.doesNotMatch(glyphElement.props.dangerouslySetInnerHTML.__html, /<rect/);
  button.props.onClick();
  assert.deepEqual(loaded.registrations.openTabs, [{ kind: TAB_KIND, params: undefined }]);

  const fallback = activate({
    openTabError: true,
    hostStorage: { [LAST_PROVIDER_KEY]: "kimi" },
  });
  const fallbackHeader = fallback.registrations.slots.find(
    (entry) => entry.spec.id === SWITCH_BUTTON_ID,
  );
  fallbackHeader.component().props.onClick();
  assert.equal(fallback.window.opened.length, 1);
  assert.equal(fallback.window.opened[0].url, "https://www.kimi.com/");
  assert.equal(fallback.window.opened[0].target, "_blank");
});

test("the shortcut is blocked without a session and opens the tab with one", () => {
  const blocked = activate({ commandTarget: () => undefined });
  const blockedShortcut = blocked.registrations.shortcuts[0];
  assert.deepEqual(blockedShortcut.resolve({ target: {} }), {
    status: "blocked",
    reason: "先打开一个会话",
  });

  const handled = activate();
  const shortcut = handled.registrations.shortcuts[0];
  const resolution = shortcut.resolve({ target: {} });
  assert.equal(resolution.status, "handled");
  resolution.run();
  assert.deepEqual(handled.registrations.openTabs, [{ kind: TAB_KIND, params: undefined }]);
});

test("the tab title follows the active provider published by the body", () => {
  const loaded = activate();
  const titleSlot = loaded.registrations.slots.find(
    (entry) => entry.spec.name === "sidebar.right.pane.tab.title",
  );
  const info = { useTabInfo: () => ({ tab: { id: "tab-1" } }) };
  const fallback = titleSlot.component(info);
  assert.equal(textOf(fallback), "网页版 AI");

  loaded.probe.publishTabProvider("tab-1", loaded.probe.PROVIDERS[1]);
  const qwen = titleSlot.component(info);
  assert.equal(textOf(qwen), "通义千问");
  const iconElement = findAll(qwen, (element) => element.props?.provider?.id === "qwen")[0];
  assert.ok(iconElement);
  const icon = iconElement.type(iconElement.props);
  assert.equal(icon.type, "img");
  assert.match(icon.props.src, /^data:image\/png;base64,/);

  loaded.probe.clearTabProvider("tab-1");
  assert.equal(textOf(titleSlot.component(info)), "网页版 AI");
});

test("the body shows nine provider buttons and lazily mounts only the active pane", () => {
  const loaded = activate();
  const bodySlot = loaded.registrations.slots.find(
    (entry) => entry.spec.name === "sidebar.right.pane.tab",
  );
  const body = bodySlot.component({ useTabInfo: () => ({ tab: { id: "tab-1" } }) });
  assert.equal(body.props.className, "dsh-webchat-body");
  const buttons = findAll(body, (element) => element.type === "button" && element.props["aria-label"]);
  const providerButtons = buttons.filter((button) =>
    button.props.className === "dsh-webchat-provider",
  );
  assert.equal(providerButtons.length, 9);
  assert.deepEqual(
    providerButtons.map((button) => button.props["aria-label"]),
    ["DeepSeek", "通义千问", "豆包", "Kimi", "智谱清言", "ChatGPT", "Gemini", "Grok", "Z.ai"],
  );
  assert.equal(providerButtons[0].props["data-active"], "true");
  assert.equal(providerButtons[0].props["aria-pressed"], true);
  assert.equal(providerButtons[1].props["data-active"], "false");
  const actionButtons = buttons.filter((button) => button.props.className === "dsh-webchat-action");
  assert.deepEqual(
    actionButtons.map((button) => button.props["aria-label"]),
    ["重新加载", "在浏览器中打开", "选择网站"],
  );
  const stage = findAll(body, (element) => element.props.className === "dsh-webchat-stage")[0];
  assert.equal(stage.props.children.length, 1);
  const paneElement = stage.props.children[0];
  assert.equal(typeof paneElement.type, "function");
  const pane = paneElement.type(paneElement.props);
  assert.equal(pane.props.className, "dsh-webchat-pane");
  assert.equal(pane.props["data-active"], "true");
  assert.equal(pane.props["data-visible"], "false");
  assert.equal(textOf(pane), "正在载入 DeepSeek…");
  const spinner = findAll(pane, (element) => element.props.className === "dsh-webchat-spinner");
  assert.equal(spinner.length, 1);
});

test("the body starts from the last provider stored by the host", () => {
  const loaded = loadPlugin();
  loaded.storage.setItem(LAST_PROVIDER_KEY, "kimi");
  const harness = createContext(loaded.probe);
  loaded.exports.apply(harness.ctx);
  const bodySlot = harness.registrations.slots.find(
    (entry) => entry.spec.name === "sidebar.right.pane.tab",
  );
  const body = bodySlot.component({ useTabInfo: () => ({ tab: { id: "tab-1" } }) });
  const providerButtons = findAll(
    body,
    (element) => element.props.className === "dsh-webchat-provider",
  );
  assert.equal(providerButtons.find((button) => button.props["data-active"] === "true").props["aria-label"], "Kimi");
  const stage = findAll(body, (element) => element.props.className === "dsh-webchat-stage")[0];
  assert.equal(stage.props.children.length, 1);
  assert.equal(stage.props.children[0].props.provider.id, "kimi");
});

test("the enabled-provider set defaults to the original nine and persists changes", () => {
  const loaded = loadPlugin();
  const enabled = loaded.probe.readEnabledProviders();
  assert.deepEqual([...enabled], loaded.probe.DEFAULT_ENABLED_IDS);
  assert.equal(enabled.has("zai"), true);
  assert.equal(enabled.has("grok"), true);

  loaded.probe.writeEnabledProviders(new Set(["grok", "kimi"]));
  assert.equal(
    loaded.storage.getItem(loaded.probe.ENABLED_KEY),
    JSON.stringify(["kimi", "grok"]),
  );
  assert.deepEqual([...loaded.probe.readEnabledProviders()], ["kimi", "grok"]);

  loaded.probe.writeEnabledProviders(new Set());
  assert.deepEqual([...loaded.probe.readEnabledProviders()], []);
});

test("a stored provider list filters unknown ids and activates an enabled fallback", () => {
  const loaded = loadPlugin();
  loaded.storage.setItem(loaded.probe.ENABLED_KEY, JSON.stringify(["grok", "nope"]));
  loaded.storage.setItem(LAST_PROVIDER_KEY, "deepseek");
  const harness = createContext(loaded.probe);
  loaded.exports.apply(harness.ctx);
  const bodySlot = harness.registrations.slots.find(
    (entry) => entry.spec.name === "sidebar.right.pane.tab",
  );
  const body = bodySlot.component({ useTabInfo: () => ({ tab: { id: "tab-1" } }) });
  const providerButtons = findAll(
    body,
    (element) => element.props.className === "dsh-webchat-provider",
  );
  assert.equal(providerButtons.length, 1);
  assert.equal(providerButtons[0].props["aria-label"], "Grok");
  assert.equal(providerButtons[0].props["data-active"], "true");
  const stage = findAll(body, (element) => element.props.className === "dsh-webchat-stage")[0];
  assert.equal(stage.props.children[0].props.provider.id, "grok");
});

test("custom sites validate, persist and participate in the provider order", () => {
  const loaded = loadPlugin();
  assert.equal(loaded.probe.normalizeCustomUrl("ftp://example.com/chat"), null);
  assert.equal(loaded.probe.normalizeCustomUrl("javascript:alert(1)"), null);
  const provider = loaded.probe.makeCustomProvider(
    "My AI",
    new URL("https://example.com/chat"),
  );
  assert.match(provider.id, /^custom-/);
  assert.equal(provider.origin, "https://example.com");
  assert.equal(provider.url, "https://example.com/chat");
  loaded.probe.writeCustomProviders([provider]);
  assert.deepEqual(
    loaded.probe.readCustomProviders().map((item) => [item.id, item.name, item.origin]),
    [[provider.id, "My AI", "https://example.com"]],
  );
  const order = loaded.probe.readProviderOrder();
  assert.equal(order[order.length - 1], provider.id);
  loaded.probe.writeProviderOrder([
    provider.id,
    ...order.filter((id) => id !== provider.id),
  ]);
  const providers = loaded.probe.applyProviderOrder(
    loaded.probe.readCustomProviders(),
    loaded.probe.readProviderOrder(),
  );
  assert.equal(providers[0].id, provider.id);
  assert.equal(loaded.probe.providerName(provider, (key) => key), "My AI");
});

test("custom sites reject unsafe URLs and unknown ids keep the defaults clean", () => {
  const loaded = loadPlugin();
  loaded.storage.setItem(
    loaded.probe.CUSTOM_KEY,
    JSON.stringify([
      { id: "custom-bad", name: "Bad", url: "javascript:alert(1)" },
      { id: "custom-good", name: "  Good  ", url: "https://example.org/app" },
    ]),
  );
  const list = loaded.probe.readCustomProviders();
  assert.deepEqual(list.map((item) => [item.id, item.name]), [
    ["custom-good", "Good"],
  ]);
  loaded.storage.setItem(
    loaded.probe.ENABLED_KEY,
    JSON.stringify([list[0].id, "kimi", "missing"]),
  );
  assert.deepEqual([...loaded.probe.readEnabledProviders()], [list[0].id, "kimi"]);
  loaded.probe.writeEnabledProviders(
    new Set([list[0].id, "kimi"]),
    [list[0], ...loaded.probe.PROVIDERS],
  );
  assert.equal(
    loaded.storage.getItem(loaded.probe.ENABLED_KEY),
    JSON.stringify([list[0].id, "kimi"]),
  );
});

test("deleting a custom site clears it from storage, order and the enabled set", () => {
  const loaded = loadPlugin();
  const provider = loaded.probe.makeCustomProvider(
    "Temp",
    new URL("https://temp.example/chat"),
  );
  loaded.probe.writeCustomProviders([provider]);
  loaded.probe.writeProviderOrder([provider.id, ...loaded.probe.readProviderOrder()]);
  loaded.probe.writeEnabledProviders(
    new Set([provider.id, "kimi"]),
    [provider, ...loaded.probe.PROVIDERS],
  );

  const result = loaded.probe.deleteCustomProvider(provider.id);
  assert.ok(result);
  assert.deepEqual(result.customs, []);
  assert.equal(result.order.includes(provider.id), false);
  assert.equal(result.enabled.has(provider.id), false);
  assert.equal(result.providers.some((item) => item.id === provider.id), false);
  assert.deepEqual(loaded.probe.readCustomProviders(), []);
  assert.equal(loaded.storage.getItem(loaded.probe.CUSTOM_KEY), "[]");
  assert.deepEqual([...loaded.probe.readEnabledProviders()], ["kimi"]);
  assert.equal(loaded.probe.deleteCustomProvider("custom-missing"), null);
});

test("unknown-only enabled lists do not silently re-enable the defaults", () => {
  const loaded = loadPlugin();
  loaded.storage.setItem(loaded.probe.ENABLED_KEY, JSON.stringify(["nope"]));
  assert.deepEqual([...loaded.probe.readEnabledProviders()], []);
});

test("the body renders an enabled custom site as a normal provider", () => {
  const loaded = activate();
  loaded.storage.setItem(
    loaded.probe.CUSTOM_KEY,
    JSON.stringify([
      { id: "custom-mine", name: "My AI", url: "https://example.com/chat" },
    ]),
  );
  loaded.storage.setItem(
    loaded.probe.ENABLED_KEY,
    JSON.stringify(["custom-mine"]),
  );
  const bodySlot = loaded.registrations.slots.find(
    (entry) => entry.spec.name === "sidebar.right.pane.tab",
  );
  const body = bodySlot.component({ useTabInfo: () => ({ tab: { id: "tab-1" } }) });
  const buttons = findAll(
    body,
    (element) => element.type === "button" && element.props.className === "dsh-webchat-provider",
  );
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].props["aria-label"], "My AI");
  assert.equal(buttons[0].props["data-active"], "true");
});

test("the body shows an empty state when every provider is disabled", () => {
  const loaded = loadPlugin();
  loaded.storage.setItem(loaded.probe.ENABLED_KEY, "[]");
  const harness = createContext(loaded.probe);
  loaded.exports.apply(harness.ctx);
  const bodySlot = harness.registrations.slots.find(
    (entry) => entry.spec.name === "sidebar.right.pane.tab",
  );
  const body = bodySlot.component({ useTabInfo: () => ({ tab: { id: "tab-1" } }) });
  const providerButtons = findAll(
    body,
    (element) => element.props.className === "dsh-webchat-provider",
  );
  assert.equal(providerButtons.length, 0);
  const empty = findAll(body, (element) => element.props.className === "dsh-webchat-empty")[0];
  assert.ok(empty);
  assert.match(textOf(empty), /还没有启用网站/);
  assert.equal(
    findAll(body, (element) => element.props.className === "dsh-webchat-stage").length,
    0,
  );
});

test("readStorageScript captures same-origin localStorage and cookies within the caps", () => {
  const loaded = loadPlugin();
  const provider = loaded.probe.PROVIDER_BY_ID.get("deepseek");
  const script = loaded.probe.readStorageScript(provider);
  const storage = createStorage({
    token: "abc",
    ui: "dark",
    big: "x".repeat(300000),
  });
  const cookieJar = { cookie: "sid=1; theme=dark" };
  const result = runGuestScript(script, {
    storage,
    cookie: "sid=1; theme=dark",
    origin: provider.origin,
    document: cookieJar,
  });
  const data = JSON.parse(result);
  assert.equal(data.origin, provider.origin);
  assert.equal(data.local.token, "abc");
  assert.equal(data.local.ui, "dark");
  assert.equal(data.local.big, undefined);
  assert.deepEqual(data.cookies, { sid: "1", theme: "dark" });

  const wrongOrigin = runGuestScript(script, {
    storage,
    origin: "https://evil.example",
  });
  assert.equal(wrongOrigin, "");
});

test("readStorageScript tolerates blocked localStorage and oversized values", () => {
  const loaded = loadPlugin();
  const provider = loaded.probe.PROVIDER_BY_ID.get("deepseek");
  const script = loaded.probe.readStorageScript(provider);
  const blocked = {
    get length() {
      throw new Error("blocked");
    },
  };
  const result = runGuestScript(script, {
    storage: blocked,
    origin: provider.origin,
    cookie: "",
  });
  assert.equal(result, "");

  const storage = createStorage({
    small: "ok",
    huge: "x".repeat(300000),
    "__proto__": "polluted",
  });
  const data = JSON.parse(
    runGuestScript(script, { storage, origin: provider.origin, cookie: "" }),
  );
  assert.equal(data.local.small, "ok");
  assert.equal(data.local.huge, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(data.local, "__proto__"), false);
});

test("restoreStorageScript writes localStorage and cookies and rejects unsafe values", () => {
  const loaded = loadPlugin();
  const provider = loaded.probe.PROVIDER_BY_ID.get("deepseek");
  const snapshot = {
    origin: provider.origin,
    local: { token: "t", huge: "x".repeat(300000), "__proto__": "nope" },
    cookies: { sid: "1", bad: "a; b" },
  };
  const script = loaded.probe.restoreStorageScript(provider, snapshot);
  const storage = createStorage();
  const cookieJar = createCookieJar("");
  const restored = runGuestScript(script, {
    storage,
    document: cookieJar,
    origin: provider.origin,
  });
  assert.equal(restored, 1);
  assert.equal(storage.getItem("token"), "t");
  assert.equal(storage.getItem("huge"), null);
  assert.equal(storage.getItem("__proto__"), null);
  assert.equal(cookieJar.writes.length, 1);
  assert.match(cookieJar.writes[0], /^sid=1; path=\//);

  const wrongOrigin = runGuestScript(script, {
    storage,
    document: cookieJar,
    origin: "https://evil.example",
  });
  assert.equal(wrongOrigin, 0);
});

test("host snapshots round-trip per provider, reject stale writes and clear on empty", () => {
  const loaded = loadPlugin();
  const provider = loaded.probe.PROVIDER_BY_ID.get("deepseek");
  const other = loaded.probe.PROVIDER_BY_ID.get("kimi");
  assert.equal(loaded.probe.makeSessionKey("deepseek"), SESSION_PREFIX + "deepseek");
  assert.notEqual(loaded.probe.makeSessionKey("deepseek"), loaded.probe.makeSessionKey("kimi"));

  const written = loaded.probe.writeSnapshot(
    provider,
    { origin: provider.origin, local: { token: "t" }, cookies: { sid: "1" } },
    1000,
    false,
  );
  assert.equal(written, true);
  const snapshot = loaded.probe.readSnapshot(provider);
  assert.equal(snapshot.savedAt, 1000);
  assert.deepEqual(snapshot.local, { token: "t" });
  assert.deepEqual(snapshot.cookies, { sid: "1" });
  assert.equal(loaded.probe.readSnapshot(other), null);

  assert.equal(
    loaded.probe.writeSnapshot(
      provider,
      { origin: provider.origin, local: { token: "old" }, cookies: {} },
      900,
      false,
    ),
    false,
  );
  assert.equal(loaded.probe.readSnapshot(provider).local.token, "t");

  assert.equal(
    loaded.probe.writeSnapshot(provider, { origin: provider.origin, local: {}, cookies: {} }, 1100, false),
    true,
  );
  assert.equal(loaded.probe.readSnapshot(provider).local.token, "t");

  assert.equal(
    loaded.probe.writeSnapshot(provider, { origin: provider.origin, local: {}, cookies: {} }, 1200, true),
    true,
  );
  assert.equal(loaded.probe.readSnapshot(provider), null);

  assert.equal(
    loaded.probe.writeSnapshot(
      provider,
      { origin: "https://evil.example", local: { token: "x" }, cookies: {} },
      1300,
      false,
    ),
    false,
  );
});

test("host snapshot validation rejects wrong versions and malformed payloads", () => {
  const loaded = loadPlugin();
  const provider = loaded.probe.PROVIDER_BY_ID.get("deepseek");
  const key = loaded.probe.makeSessionKey(provider.id);
  loaded.storage.setItem(key, JSON.stringify({ version: 1, origin: provider.origin, local: { a: "b" } }));
  assert.equal(loaded.probe.readSnapshot(provider), null);
  loaded.storage.setItem(key, "{not json");
  assert.equal(loaded.probe.readSnapshot(provider), null);
  loaded.storage.setItem(
    key,
    JSON.stringify({
      version: 2,
      origin: provider.origin,
      savedAt: 1,
      local: { token: "t", "__proto__": "x" },
      cookies: { sid: "1", bad: "a; b" },
    }),
  );
  const snapshot = loaded.probe.readSnapshot(provider);
  assert.equal(snapshot.local.token, "t");
  assert.equal(Object.prototype.hasOwnProperty.call(snapshot.local, "__proto__"), false);
  assert.deepEqual(snapshot.cookies, { sid: "1" });
});

test("writeSnapshot reports storage failures instead of throwing", () => {
  const throwing = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("quota exceeded");
    },
    removeItem() {},
    key() {
      return null;
    },
    length: 0,
  };
  const loaded = loadPlugin({ storage: throwing, console: quietConsole });
  const provider = loaded.probe.PROVIDER_BY_ID.get("deepseek");
  assert.equal(
    loaded.probe.writeSnapshot(
      provider,
      { origin: provider.origin, local: { token: "t" }, cookies: {} },
      1000,
      false,
    ),
    false,
  );
});

test("a guest leases a webview, sets a standard UA and loads the app without a snapshot", async () => {
  const loaded = loadPlugin();
  const { guest, provider, container, statuses } = createGuest(loaded);
  guest.start();
  await flush();
  assert.equal(loaded.window.dshDesktop.browser.calls.acquire[0], "dsh-webchat");
  const webview = loaded.document.webviews[0];
  assert.ok(webview);
  assert.equal(webview.getAttribute("name"), "lease-1");
  assert.equal(webview.getAttribute("partition"), "persist:dsh-webchat-test-1");
  assert.equal(webview.getAttribute("allowpopups"), "");
  assert.equal(webview.getAttribute("src"), "about:blank#lease-1");
  assert.equal(container.children.includes(webview), true);

  webview.emit("dom-ready");
  await flush();
  assert.equal(webview.userAgents.length, 1);
  assert.doesNotMatch(webview.userAgents[0], /Electron|dsh\//i);
  assert.match(webview.userAgents[0], /^Mozilla\/5\.0 \(/);
  assert.match(webview.userAgents[0], /Chrome\/140\.0\.0\.0 Safari\/537\.36$/);
  assert.deepEqual(webview.loaded, [provider.url]);

  webview.scriptHandler = () =>
    JSON.stringify({ origin: provider.origin, local: { token: "t" }, cookies: {} });
  webview.emit("dom-ready");
  await flush();
  const snapshot = loaded.probe.readSnapshot(provider);
  assert.equal(snapshot.local.token, "t");

  webview.emit("did-stop-loading");
  await flush();
  assert.equal(statuses.at(-1).kind, "ready");
});

test("a guest restores a stored snapshot through the seed page before the app", async () => {
  const loaded = loadPlugin();
  const provider = loaded.probe.PROVIDER_BY_ID.get("deepseek");
  loaded.probe.writeSnapshot(
    provider,
    { origin: provider.origin, local: { token: "seed" }, cookies: { sid: "1" } },
    500,
    false,
  );
  const { guest } = createGuest(loaded);
  guest.start();
  await flush();
  const webview = loaded.document.webviews[0];
  webview.emit("dom-ready");
  await flush();
  assert.deepEqual(webview.loaded, [provider.origin + "/robots.txt"]);
  assert.equal(webview.userAgents.length, 1);

  webview.scriptHandler = (script) => {
    if (script.includes("localStorage.setItem")) return 1;
    return JSON.stringify({ origin: provider.origin, local: { token: "seed" }, cookies: {} });
  };
  webview.emit("dom-ready");
  await flush();
  assert.deepEqual(webview.loaded, [provider.origin + "/robots.txt", provider.url]);
  assert.equal(webview.scripts.some((script) => script.includes("localStorage.setItem")), true);
  assert.equal(webview.scripts.some((script) => script.includes('"seed"')), true);

  webview.emit("dom-ready");
  webview.emit("did-stop-loading");
  await flush();
  assert.equal(loaded.probe.readSnapshot(provider).local.token, "seed");
});

test("a guest surfaces bridge failures, unsupported environments and load errors", async () => {
  const unsupported = loadPlugin({ browser: null });
  const unsupportedGuest = createGuest(unsupported);
  unsupportedGuest.guest.start();
  await flush();
  const unsupportedStatus = findFailureStatus(unsupportedGuest.statuses);
  assert.equal(unsupportedStatus.kind, "error");
  assert.equal(unsupportedStatus.message, "当前环境不支持内嵌网页。");
  assert.equal(unsupportedStatus.retryable, false);

  const rejected = loadPlugin({
    console: quietConsole,
    browser: {
      acquire: () => Promise.reject(new Error("nope")),
      release() {},
      onOpenRequested() {
        return () => {};
      },
    },
  });
  const rejectedGuest = createGuest(rejected);
  rejectedGuest.guest.start();
  await flush();
  const rejectedStatus = findFailureStatus(rejectedGuest.statuses);
  assert.equal(rejectedStatus.kind, "error");
  assert.equal(rejectedStatus.message, "内置浏览器没有返回页面。");
  assert.equal(rejectedStatus.detail, "nope");

  const loaded = loadPlugin();
  const { guest, statuses } = createGuest(loaded);
  guest.start();
  await flush();
  const webview = loaded.document.webviews[0];
  webview.emit("dom-ready");
  await flush();
  webview.emit("dom-ready");
  webview.emit("did-fail-load", {
    errorCode: -105,
    errorDescription: "NAME_NOT_RESOLVED",
    isMainFrame: true,
  });
  await flush();
  const failure = findFailureStatus(statuses);
  assert.equal(failure.detail, "NAME_NOT_RESOLVED (-105)");

  const aborted = loadPlugin();
  const abortedGuest = createGuest(aborted);
  abortedGuest.guest.start();
  await flush();
  const abortedWebview = aborted.document.webviews[0];
  abortedWebview.emit("dom-ready");
  await flush();
  const before = abortedGuest.statuses.length;
  abortedWebview.emit("did-fail-load", { errorCode: -3, errorDescription: "ABORTED" });
  await flush();
  assert.equal(abortedGuest.statuses.length, before);
});

test("a guest routes safe popups to the Browser tab and ignores unsafe URLs", async () => {
  const loaded = loadPlugin();
  const { guest, harness } = createGuest(loaded);
  guest.start();
  await flush();
  const listener = loaded.window.dshDesktop.browser.calls.listeners[0];
  assert.equal(typeof listener, "function");
  listener("https://example.com/page");
  assert.deepEqual(harness.registrations.openTabs, [
    { kind: "browser", params: { params: { url: "https://example.com/page" } } },
  ]);
  listener("file:///etc/passwd");
  listener("javascript:alert(1)");
  assert.equal(harness.registrations.openTabs.length, 1);
});

test("dispose captures the latest state, clears the timer and releases the lease", async () => {
  const loaded = loadPlugin();
  const { guest, provider } = createGuest(loaded);
  guest.start();
  await flush();
  const webview = loaded.document.webviews[0];
  webview.emit("dom-ready");
  await flush();
  webview.emit("dom-ready");
  webview.emit("did-stop-loading");
  await flush();
  assert.equal(loaded.timers.intervals.length, 1);

  webview.scriptHandler = () =>
    JSON.stringify({ origin: provider.origin, local: { token: "late" }, cookies: {} });
  guest.dispose();
  await flush();
  const snapshot = loaded.probe.readSnapshot(provider);
  assert.equal(snapshot.local.token, "late");
  assert.deepEqual(loaded.window.dshDesktop.browser.calls.release, ["lease-1"]);
  assert.equal(loaded.window.dshDesktop.browser.calls.unsubscribed, 1);
  assert.equal(webview.removed, true);
  assert.equal(loaded.timers.clearedIntervals.length, 1);
  assert.equal(loaded.timers.clearedTimeouts.length, 1);
});

test("the polling timer captures a session update", async () => {
  const loaded = loadPlugin();
  const { guest, provider } = createGuest(loaded);
  guest.start();
  await flush();
  const webview = loaded.document.webviews[0];
  webview.emit("dom-ready");
  await flush();
  webview.emit("dom-ready");
  webview.emit("did-stop-loading");
  await flush();
  webview.scriptHandler = () =>
    JSON.stringify({ origin: provider.origin, local: { token: "polled" }, cookies: {} });
  loaded.timers.intervals[0].callback();
  await flush();
  assert.equal(loaded.probe.readSnapshot(provider).local.token, "polled");
  guest.dispose();
  await flush();
});

test("the switcher teardown removes its style and disposes registrations", () => {
  const loaded = activate();
  assert.equal(loaded.document.getElementById(STYLE_ID) !== null, true);
  assert.equal(loaded.registrations.tabs.length, 1, "tab type should be registered");
  assert.equal(
    loaded.registrations.tabDisposers.length,
    1,
    "tab registration should return a disposer",
  );
  loaded.registrations.effects[2].dispose();
  assert.equal(loaded.registrations.disposedTabs, 1, "switcher should call the tab disposer");
  assert.equal(loaded.registrations.disposedShortcuts, 1);
  assert.ok(loaded.registrations.disposedSlots >= 2);
  loaded.registrations.effects[1].dispose();
  assert.equal(loaded.document.getElementById(STYLE_ID), null);
});
