// @guojing6/dsh-webchat
//
// One right-sidebar tab that hosts the web editions of eight chat assistants,
// with a compact provider switcher. Each provider gets its own lazily created
// Electron <webview> inside the shell's in-memory browser partition. Logins are
// mirrored into DSH's own localStorage (one key per provider) and restored
// before the provider app boots, so signing in survives a shell restart.
window.__ModuleLoader__.load({
  id: "@guojing6/dsh-webchat",
  factory: (require) => {
    const React = require("react");

    const PLUGIN_ID = "@guojing6/dsh-webchat";
    const TAB_KIND = "webchat";
    const TAB_ID = PLUGIN_ID + "/tab";
    const COMMAND_ID = "webchat.open";
    const GUIDE_ENTRY_ID = "webchat";
    const SWITCH_BUTTON_ID = "dsh-webchat-switch";
    const SWITCH_ORDER = -100;
    const WORKSPACE_KEY = "dsh-webchat";
    const STYLE_ID = "dsh-webchat-styles";
    const SESSION_PREFIX = "dsh-webchat:session:";
    const SESSION_VERSION = 2;
    const LAST_PROVIDER_KEY = "dsh-webchat:last-provider";
    const ENABLED_KEY = "dsh-webchat:enabled-providers";
    const CUSTOM_KEY = "dsh-webchat:custom-providers";
    const ORDER_KEY = "dsh-webchat:provider-order";
    const CUSTOM_LIMIT = 40;
    const CUSTOM_NAME_LIMIT = 24;
    const DEFAULT_ENABLED_IDS = [
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
    const SNAPSHOT_INTERVAL_MS = 60000;
    const SNAPSHOT_LIMIT = 200000;
    const COOKIE_LIMIT = 50000;
    const DISPOSE_CAPTURE_TIMEOUT_MS = 1500;
    const DEFAULT_PROVIDER_ID = "deepseek";

    const BODY_CLASS = "dsh-webchat-body";
    const TOOLBAR_CLASS = "dsh-webchat-toolbar";
    const PROVIDERS_CLASS = "dsh-webchat-providers";
    const PROVIDER_CLASS = "dsh-webchat-provider";
    const ACTIONS_CLASS = "dsh-webchat-actions";
    const ACTION_CLASS = "dsh-webchat-action";
    const STAGE_CLASS = "dsh-webchat-stage";
    const PANE_CLASS = "dsh-webchat-pane";
    const MOUNT_CLASS = "dsh-webchat-mount";
    const OVERLAY_CLASS = "dsh-webchat-overlay";
    const OVERLAY_ICON_CLASS = "dsh-webchat-overlay-icon";
    const OVERLAY_COPY_CLASS = "dsh-webchat-overlay-copy";
    const OVERLAY_TITLE_CLASS = "dsh-webchat-overlay-title";
    const OVERLAY_DETAIL_CLASS = "dsh-webchat-overlay-detail";
    const OVERLAY_HINT_CLASS = "dsh-webchat-overlay-hint";
    const OVERLAY_ACTIONS_CLASS = "dsh-webchat-overlay-actions";
    const GLYPH_CLASS = "dsh-webchat-glyph";
    const APP_GLYPH_CLASS = "dsh-webchat-app-glyph";
    const LOGO_CLASS = "dsh-webchat-logo";
    const TAB_TITLE_CLASS = "dsh-webchat-tabtitle";
    const TAB_TITLE_ICON_CLASS = "dsh-webchat-tabtitle-icon";
    const TAB_TITLE_TEXT_CLASS = "dsh-webchat-tabtitle-text";
    const SWITCH_CLASS = "dsh-webchat-switch";
    const SPINNER_CLASS = "dsh-webchat-spinner";
    const BUTTON_CLASS = "dsh-webchat-button";
    const SETTINGS_CLASS = "dsh-webchat-settings";
    const SETTINGS_PANEL_CLASS = "dsh-webchat-settings-panel";
    const SETTINGS_HEAD_CLASS = "dsh-webchat-settings-head";
    const SETTINGS_TITLE_CLASS = "dsh-webchat-settings-title";
    const SETTINGS_COUNT_CLASS = "dsh-webchat-settings-count";
    const SETTINGS_LIST_CLASS = "dsh-webchat-settings-list";
    const SETTINGS_ROW_CLASS = "dsh-webchat-settings-row";
    const SETTINGS_NAME_CLASS = "dsh-webchat-settings-name";
    const SETTINGS_CLOSE_CLASS = "dsh-webchat-settings-close";
    const SETTINGS_CONTROLS_CLASS = "dsh-webchat-settings-controls";
    const SETTINGS_MOVE_CLASS = "dsh-webchat-settings-move";
    const SETTINGS_DELETE_CLASS = "dsh-webchat-settings-delete";
    const SETTINGS_CONFIRM_CLASS = "dsh-webchat-settings-confirm";
    const SETTINGS_CONFIRM_TEXT_CLASS = "dsh-webchat-settings-confirm-text";
    const SETTINGS_CONFIRM_BUTTON_CLASS = "dsh-webchat-settings-confirm-button";
    const SETTINGS_ADD_CLASS = "dsh-webchat-settings-add";
    const SETTINGS_FORM_CLASS = "dsh-webchat-settings-form";
    const SETTINGS_INPUT_CLASS = "dsh-webchat-settings-input";
    const SETTINGS_ERROR_CLASS = "dsh-webchat-settings-error";
    const EMPTY_CLASS = "dsh-webchat-empty";
    const EMPTY_TITLE_CLASS = "dsh-webchat-empty-title";
    const EMPTY_TEXT_CLASS = "dsh-webchat-empty-text";

    const IS_DESKTOP =
      window.location.protocol === "dsh-app:" ||
      document.documentElement.dataset.platform !== undefined;

    const APP_GLYPH_SVG =
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M20.5 11.4c0 3.7-3.8 6.7-8.5 6.7-1.1 0-2.2-.17-3.2-.5L4 19.3l1.3-3.8C4.1 14.3 3.5 12.9 3.5 11.4c0-3.7 3.8-6.7 8.5-6.7s8.5 3 8.5 6.7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
      '<circle cx="8.5" cy="11.4" r="1.05" fill="currentColor"/>' +
      '<circle cx="12" cy="11.4" r="1.05" fill="currentColor"/>' +
      '<circle cx="15.5" cy="11.4" r="1.05" fill="currentColor"/>' +
      "</svg>";

    const CUSTOM_PROVIDER_SVG =
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="8.5" stroke="#6B7280" stroke-width="1.7"/>' +
      '<path d="M3.8 12h16.4M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5S14.2 18.2 12 20.5C9.8 18.2 8.6 15.2 8.6 12S9.8 5.8 12 3.5Z" stroke="#6B7280" stroke-width="1.5"/>' +
      "</svg>";

    const TRASH_SVG =
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M5 7h14M10 7V4.5h4V7M7.5 7l.9 12.5h7.2L16.5 7M10.2 10.5v6M13.8 10.5v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>";

    const RELOAD_SVG =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20 11a8 8 0 1 0-2.34 5.66"/>' +
      '<path d="M20 4v7h-7"/>' +
      "</svg>";

    const EXTERNAL_SVG =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M14 4h6v6"/>' +
      '<path d="M20 4 11 13"/>' +
      '<path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/>' +
      "</svg>";

    const SETTINGS_SVG =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="3"/>' +
      '<path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"/>' +
      "</svg>";

    // Inlined at build time from the providers' official favicons. PNG assets
    // are data URLs; DeepSeek, OpenAI and Gemini are inline SVGs.
    const ICON_ASSETS = {"deepseek":{"kind":"svg","value":"<svg viewBox=\"0 0 50 50\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n\t<path id=\"path\"\n\t\td=\"M48.8354 10.0479C48.3232 9.79199 48.1025 10.2798 47.8032 10.5278C47.7007 10.6079 47.6143 10.7119 47.5273 10.8076C46.7793 11.624 45.9048 12.1597 44.7622 12.0957C43.0923 12 41.666 12.5356 40.4058 13.8398C40.1377 12.2319 39.2476 11.272 37.8926 10.6558C37.1836 10.3359 36.4668 10.0156 35.9702 9.31982C35.6235 8.82373 35.5293 8.27197 35.356 7.72754C35.2456 7.3999 35.1353 7.06396 34.7651 7.00781C34.3633 6.94385 34.2056 7.2876 34.0479 7.57568C33.418 8.75195 33.1733 10.0479 33.1973 11.3599C33.2524 14.312 34.4736 16.6641 36.8999 18.3359C37.1758 18.5278 37.2466 18.7197 37.1597 19C36.9946 19.5757 36.7974 20.1357 36.624 20.7119C36.5137 21.0801 36.3486 21.1597 35.9624 21C34.6309 20.4321 33.481 19.5918 32.4644 18.5757C30.7393 16.8721 29.1792 14.9917 27.2334 13.52C26.7764 13.1758 26.3193 12.856 25.8467 12.5518C23.8618 10.584 26.1069 8.96777 26.627 8.77588C27.1704 8.57568 26.8159 7.8877 25.0591 7.896C23.3022 7.90381 21.6953 8.50391 19.647 9.30371C19.3477 9.42383 19.0322 9.51172 18.7095 9.58398C16.8501 9.22363 14.9199 9.14355 12.9033 9.37598C9.10596 9.80762 6.07275 11.6396 3.84326 14.7681C1.16455 18.5278 0.53418 22.7998 1.30664 27.2559C2.11768 31.9521 4.46582 35.8398 8.07373 38.8799C11.8159 42.0322 16.1255 43.5762 21.041 43.2803C24.0269 43.104 27.3516 42.6963 31.1016 39.4561C32.0469 39.936 33.0396 40.1279 34.686 40.272C35.9546 40.3921 37.1758 40.208 38.1211 40.0078C39.6021 39.688 39.4995 38.2881 38.9639 38.0322C34.623 35.9678 35.5762 36.8081 34.71 36.1279C36.9155 33.4639 40.2402 30.6958 41.54 21.728C41.6426 21.0161 41.5557 20.5679 41.54 19.9917C41.5322 19.6396 41.6108 19.5039 42.0049 19.4639C43.0923 19.3359 44.1479 19.0317 45.1167 18.4878C47.9292 16.9199 49.064 14.3438 49.3315 11.2559C49.3711 10.7837 49.3237 10.2959 48.8354 10.0479ZM24.3262 37.8398C20.1196 34.4639 18.0791 33.3521 17.2358 33.3999C16.4482 33.4482 16.5898 34.3682 16.7632 34.9678C16.9443 35.5601 17.1812 35.9683 17.5117 36.4878C17.7402 36.832 17.8979 37.3442 17.2832 37.728C15.9282 38.584 13.5728 37.4399 13.4624 37.3838C10.7207 35.7358 8.42822 33.5601 6.81348 30.584C5.25342 27.7197 4.34766 24.6479 4.19775 21.3677C4.1582 20.5757 4.38672 20.2959 5.15869 20.1519C6.17529 19.96 7.22314 19.9199 8.23926 20.0718C12.5327 20.7119 16.1885 22.6719 19.2529 25.7759C21.002 27.5439 22.3252 29.6558 23.6885 31.7202C25.1377 33.9121 26.6978 36 28.6831 37.7119C29.3843 38.312 29.9434 38.7681 30.479 39.104C28.8643 39.2881 26.1699 39.3281 24.3262 37.8398ZM26.3433 24.6001C26.3433 24.248 26.6191 23.9678 26.9658 23.9678C27.0444 23.9678 27.1152 23.9839 27.1782 24.0078C27.2651 24.04 27.3438 24.0879 27.4067 24.1602C27.5171 24.272 27.5801 24.4321 27.5801 24.6001C27.5801 24.9521 27.3042 25.2319 26.9575 25.2319C26.6108 25.2319 26.3433 24.9521 26.3433 24.6001ZM32.6064 27.8799C32.2046 28.0479 31.8027 28.1919 31.4165 28.208C30.8179 28.2397 30.1641 27.9922 29.8096 27.688C29.2583 27.2158 28.8643 26.9521 28.6987 26.1279C28.6279 25.7759 28.6675 25.2319 28.7305 24.9199C28.8721 24.248 28.7144 23.8159 28.2495 23.4238C27.8716 23.104 27.3911 23.0161 26.8633 23.0161C26.666 23.0161 26.4849 22.9277 26.3511 22.856C26.1304 22.7441 25.9492 22.4639 26.1226 22.1201C26.1777 22.0078 26.4458 21.7358 26.5088 21.688C27.2256 21.272 28.0527 21.4077 28.8169 21.7197C29.5259 22.0161 30.0615 22.5601 30.834 23.3281C31.6216 24.2559 31.7632 24.5117 32.2124 25.208C32.5669 25.752 32.8901 26.312 33.1104 26.9521C33.2446 27.3521 33.0713 27.6802 32.6064 27.8799Z\"\n\t\tfill=\"#4D6BFE\" fill-opacity=\"1.000000\" fill-rule=\"nonzero\" />\n</svg>"},"qwen":{"kind":"png","value":"data:image/png;base64,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"},"doubao":{"kind":"png","value":"data:image/png;base64,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"},"kimi":{"kind":"png","value":"data:image/png;base64,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"},"zhipu":{"kind":"png","value":"data:image/png;base64,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"},"openai":{"kind":"svg","value":"<svg fill=\"currentColor\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z\"/></svg>"},"gemini":{"kind":"svg","value":"<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"#4285F4\" d=\"M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81\"/></svg>"}};

    const PROVIDERS = [
      {
        id: "deepseek",
        origin: "https://chat.deepseek.com",
        url: "https://chat.deepseek.com/",
        accent: "#4D6BFE",
        ...ICON_ASSETS.deepseek,
      },
      {
        id: "qwen",
        origin: "https://chat.qwen.ai",
        url: "https://chat.qwen.ai/",
        accent: "#615CED",
        ...ICON_ASSETS.qwen,
      },
      {
        id: "doubao",
        origin: "https://www.doubao.com",
        url: "https://www.doubao.com/chat/",
        accent: "#FF6B9A",
        ...ICON_ASSETS.doubao,
      },
      {
        id: "kimi",
        origin: "https://www.kimi.com",
        url: "https://www.kimi.com/",
        accent: "#8A8F98",
        ...ICON_ASSETS.kimi,
      },
      {
        id: "zhipu",
        origin: "https://chatglm.cn",
        url: "https://chatglm.cn/",
        accent: "#2F6BFF",
        ...ICON_ASSETS.zhipu,
      },
      {
        id: "chatgpt",
        origin: "https://chatgpt.com",
        url: "https://chatgpt.com/",
        accent: "#10A37F",
        ...ICON_ASSETS.openai,
      },
      {
        id: "gemini",
        origin: "https://gemini.google.com",
        url: "https://gemini.google.com/app",
        accent: "#4285F4",
        ...ICON_ASSETS.gemini,
      },
      {
        "id": "grok",
        "origin": "https://grok.com",
        "url": "https://grok.com/",
        "accent": "#8A8F98",
        "kind": "png",
        "value": "data:image/png;base64,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"
      },
      {
        "id": "zai",
        "origin": "https://chat.z.ai",
        "url": "https://chat.z.ai/",
        "accent": "#6B7280",
        "kind": "svg",
        "value": "<svg viewBox=\"0 0 30 30\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M24.51,28.51H5.49c-2.21,0-4-1.79-4-4V5.49c0-2.21,1.79-4,4-4h19.03c2.21,0,4,1.79,4,4v19.03C28.51,26.72,26.72,28.51,24.51,28.51z\" fill=\"#2D2D2D\" stroke=\"#FFFFFF\" stroke-width=\"0.6317\"/><path d=\"M15.47,7.1l-1.3,1.85c-0.2,0.29-0.54,0.47-0.9,0.47h-7.1V7.09C6.16,7.1,15.47,7.1,15.47,7.1z\" fill=\"#FFFFFF\"/><path d=\"M14.53,22.91l1.31-1.86c0.2-0.29,0.54-0.47,0.9-0.47h7.09v2.33H14.53z\" fill=\"#FFFFFF\"/></svg>"
      },
    ];

    const PROVIDER_BY_ID = new Map(PROVIDERS.map((provider) => [provider.id, provider]));
    const BUILTIN_PROVIDER_IDS = new Set(PROVIDERS.map((provider) => provider.id));

    const MESSAGES = {
      zh: {
        "tab.title": "网页版 AI",
        "guide.title": "网页版 AI",
        "guide.description":
          "在侧栏里切换内置的 9 个网页版 AI 助手，也可以添加自定义站点；支持启用、关闭和排序。",
        "action.open": "打开网页版 AI",
        "action.configure": "选择网站",
        "action.reload": "重新加载",
        "action.openExternal": "在浏览器中打开",
        "action.retry": "重试",
        "toolbar.label": "网页版 AI 网站",
        "settings.title": "显示的网站",
        "settings.description": "勾选要显示的网站，用 ↑↓ 调整顺序；也可以添加自定义站点。",
        "settings.count": "已启用 {enabled}/{total}",
        "settings.close": "关闭",
        "settings.toggle": "显示 {name}",
        "settings.add": "添加自定义站点",
        "settings.addTitle": "自定义站点",
        "settings.name": "名称",
        "settings.namePlaceholder": "例如：我的 AI",
        "settings.url": "网址",
        "settings.urlPlaceholder": "https://example.com/chat",
        "settings.save": "添加",
        "settings.cancel": "取消",
        "settings.delete": "删除 {name}",
        "settings.confirmDelete": "确认删除“{name}”？",
        "settings.deleteConfirm": "删除",
        "settings.moveUp": "上移",
        "settings.moveDown": "下移",
        "settings.invalidName": "请输入名称（最多 24 个字符）。",
        "settings.invalidUrl": "请输入以 http:// 或 https:// 开头的网址。",
        "settings.limit": "自定义站点数量已达到上限。",
        "settings.all": "全部启用",
        "settings.reset": "恢复默认",
        "empty.title": "还没有启用网站",
        "empty.text": "打开“选择网站”，勾选你想用的 AI 助手。",
        "empty.action": "选择网站",
        "status.loading": "正在载入 {name}…",
        "status.errorTitle": "无法打开 {name}",
        "status.unsupported": "当前环境不支持内嵌网页。",
        "status.openFailed": "内置浏览器没有返回页面。",
        "status.networkHint":
          "当前网络无法直连该站点。若使用代理，请开启“系统代理”或 TUN 模式后点“重试”；必要时重启 DSH。",
        "command.noSession": "先打开一个会话",
        "provider.deepseek": "DeepSeek",
        "provider.qwen": "通义千问",
        "provider.doubao": "豆包",
        "provider.kimi": "Kimi",
        "provider.zhipu": "智谱清言",
        "provider.chatgpt": "ChatGPT",
        "provider.gemini": "Gemini",
        "provider.grok": "Grok",
        "provider.zai": "Z.ai",
      },
      en: {
        "tab.title": "Web AI",
        "guide.title": "Web AI",
        "guide.description":
          "Switch between 9 built-in web AI assistants plus your own custom sites; enable, disable, and reorder them.",
        "action.open": "Open Web AI",
        "action.configure": "Choose sites",
        "action.reload": "Reload",
        "action.openExternal": "Open in browser",
        "action.retry": "Retry",
        "toolbar.label": "Web AI sites",
        "settings.title": "Visible sites",
        "settings.description": "Check the sites to show, reorder them with the arrows, and add your own.",
        "settings.count": "{enabled} of {total} enabled",
        "settings.close": "Close",
        "settings.toggle": "Show {name}",
        "settings.add": "Add custom site",
        "settings.addTitle": "Custom site",
        "settings.name": "Name",
        "settings.namePlaceholder": "e.g. My AI",
        "settings.url": "URL",
        "settings.urlPlaceholder": "https://example.com/chat",
        "settings.save": "Add",
        "settings.cancel": "Cancel",
        "settings.delete": "Delete {name}",
        "settings.confirmDelete": "Delete “{name}”?",
        "settings.deleteConfirm": "Delete",
        "settings.moveUp": "Move up",
        "settings.moveDown": "Move down",
        "settings.invalidName": "Enter a name (up to 24 characters).",
        "settings.invalidUrl": "Enter an http:// or https:// URL.",
        "settings.limit": "The custom site limit has been reached.",
        "settings.all": "Enable all",
        "settings.reset": "Reset to defaults",
        "empty.title": "No sites are enabled",
        "empty.text": "Open Choose sites and check the assistants you want.",
        "empty.action": "Choose sites",
        "status.loading": "Loading {name}…",
        "status.errorTitle": "Could not open {name}",
        "status.unsupported": "Embedded web pages are not supported in this environment.",
        "status.openFailed": "The embedded browser did not return a page.",
        "status.networkHint":
          "This site is unreachable from the current network. If you use a proxy, enable system proxy or TUN mode, then retry; restart DSH if needed.",
        "command.noSession": "Open a session first",
        "provider.deepseek": "DeepSeek",
        "provider.qwen": "Qwen",
        "provider.doubao": "Doubao",
        "provider.kimi": "Kimi",
        "provider.zhipu": "Zhipu",
        "provider.chatgpt": "ChatGPT",
        "provider.gemini": "Gemini",
        "provider.grok": "Grok",
        "provider.zai": "Z.ai",
      },
    };

    const STYLES = `
.dsh-webchat-body {
  display: flex;
  flex-direction: column;
  flex: auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
}
.dsh-webchat-toolbar {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
  min-height: 40px;
  padding: 4px 6px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-specific-sidebar-fill, var(--dsw-alias-bg-layer-1));
}
.dsh-webchat-providers {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}
.dsh-webchat-providers::-webkit-scrollbar {
  display: none;
}
.dsh-webchat-provider {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
}
.dsh-webchat-provider:hover {
  background: var(--dsw-alias-bg-layer-2);
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);
}
.dsh-webchat-provider:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.dsh-webchat-provider[data-active="true"] {
  background: var(--dsw-alias-bg-layer-2);
  background: color-mix(in srgb, var(--dsh-webchat-accent, var(--dsw-alias-brand-primary)) 12%, transparent);
  border-color: color-mix(in srgb, var(--dsh-webchat-accent, var(--dsw-alias-brand-primary)) 32%, transparent);
}
.dsh-webchat-provider[data-active="true"]::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 2px;
  width: 14px;
  height: 2px;
  margin-left: -7px;
  border-radius: 2px;
  background: var(--dsh-webchat-accent, var(--dsw-alias-brand-primary));
}
.dsh-webchat-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
  margin-left: auto;
  padding-left: 4px;
  border-left: 1px solid var(--dsw-alias-border-l1);
}
.dsh-webchat-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.dsh-webchat-action:hover {
  background: var(--dsw-alias-bg-layer-2);
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);
  color: var(--dsw-alias-label-primary);
}
.dsh-webchat-action:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.dsh-webchat-action-glyph {
  display: inline-flex;
  width: 15px;
  height: 15px;
}
.dsh-webchat-action-glyph svg {
  width: 100%;
  height: 100%;
}
.dsh-webchat-stage {
  position: relative;
  display: flex;
  flex: auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-1);
}
.dsh-webchat-pane {
  position: relative;
  display: flex;
  flex: auto;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--dsw-alias-bg-base);
}
.dsh-webchat-pane[data-active="false"] {
  position: absolute;
  inset: 0;
  visibility: hidden;
  pointer-events: none;
}
.dsh-webchat-mount {
  position: absolute;
  inset: 0;
  display: flex;
  min-width: 0;
  min-height: 0;
}
.dsh-webchat-mount webview {
  display: flex;
  flex: auto;
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
  -webkit-app-region: no-drag;
}
.dsh-webchat-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  text-align: center;
}
.dsh-webchat-pane[data-visible="true"] .dsh-webchat-overlay {
  display: none;
}
.dsh-webchat-overlay-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.95;
}
.dsh-webchat-overlay-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 300px;
}
.dsh-webchat-overlay-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}
.dsh-webchat-overlay-detail {
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-secondary);
  word-break: break-word;
  max-width: 100%;
}
.dsh-webchat-overlay-hint {
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--dsw-alias-label-secondary);
  max-width: 340px;
}
.dsh-webchat-overlay-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}
.dsh-webchat-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.dsh-webchat-button:hover {
  background: var(--dsw-alias-bg-layer-2);
}
.dsh-webchat-button:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.dsh-webchat-button.is-primary {
  border-color: var(--dsw-alias-brand-primary);
  background: var(--dsw-alias-brand-primary);
  color: #fff;
}
.dsh-webchat-button.is-primary:hover {
  filter: brightness(1.06);
}
.dsh-webchat-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);
  border-top-color: var(--dsw-alias-brand-primary);
  animation: dsh-webchat-spin 0.8s linear infinite;
}
@keyframes dsh-webchat-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .dsh-webchat-spinner { animation: none; }
}
.dsh-webchat-app-glyph,
.dsh-webchat-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.dsh-webchat-app-glyph svg,
.dsh-webchat-glyph svg {
  display: block;
  width: 100%;
  height: 100%;
}
.dsh-webchat-logo {
  display: block;
  flex: none;
  object-fit: contain;
  border-radius: 4px;
}
.dsh-webchat-switch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.dsh-webchat-switch:hover {
  background: var(--dsw-alias-bg-layer-2);
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);
  color: var(--dsw-alias-label-primary);
}
.dsh-webchat-switch:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.dsh-webchat-tabtitle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}
.dsh-webchat-tabtitle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.dsh-webchat-tabtitle-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-webchat-settings {
  position: relative;
  display: inline-flex;
}
.dsh-webchat-settings-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 6;
  display: flex;
  flex-direction: column;
  width: 300px;
  max-height: min(440px, calc(100vh - 140px));
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-2);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}
.dsh-webchat-settings-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px 8px;
}
.dsh-webchat-settings-title {
  font-size: 12px;
  font-weight: 600;
}
.dsh-webchat-settings-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
}
.dsh-webchat-settings-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.dsh-webchat-settings-close:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);
  color: var(--dsw-alias-label-primary);
}
.dsh-webchat-settings-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.dsh-webchat-settings-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 2px 6px;
  border-radius: 6px;
  cursor: default;
}
.dsh-webchat-settings-row:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent);
}
.dsh-webchat-settings-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-webchat-settings-row input[type="checkbox"] {
  flex: none;
  width: 15px;
  height: 15px;
  margin: 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: pointer;
}
.dsh-webchat-settings-controls {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
}
.dsh-webchat-settings-move,
.dsh-webchat-settings-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}
.dsh-webchat-settings-move:hover,
.dsh-webchat-settings-delete:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);
  color: var(--dsw-alias-label-primary);
}
.dsh-webchat-settings-move:disabled {
  opacity: 0.3;
  cursor: default;
  background: transparent;
}
.dsh-webchat-settings-delete:hover {
  color: var(--dsw-alias-state-error-primary);
}
.dsh-webchat-settings-delete .dsh-webchat-action-glyph {
  width: 14px;
  height: 14px;
}
.dsh-webchat-settings-confirm {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 2px 6px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent);
}
.dsh-webchat-settings-confirm-text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--dsw-alias-label-primary);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-webchat-settings-confirm-button {
  flex: none;
  min-height: 22px;
  padding: 0 8px;
  border: 0;
  border-radius: 5px;
  background: var(--dsw-alias-state-error-primary);
  color: #fff;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.dsh-webchat-settings-confirm-button:hover {
  filter: brightness(1.08);
}
.dsh-webchat-settings-confirm-button.is-quiet {
  border: 1px solid var(--dsw-alias-border-l1);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
}
.dsh-webchat-settings-confirm-button.is-quiet:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);
  color: var(--dsw-alias-label-primary);
}
.dsh-webchat-settings-add {
  display: flex;
  justify-content: center;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.dsh-webchat-settings-form {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 5px;
  padding: 2px;
}
.dsh-webchat-settings-input {
  width: 100%;
  height: 26px;
  padding: 0 7px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 5px;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
}
.dsh-webchat-settings-input:focus {
  outline: none;
  border-color: var(--dsw-alias-brand-primary);
}
.dsh-webchat-settings-error {
  font-size: 11px;
  line-height: 1.4;
  color: var(--dsw-alias-state-error-primary);
}
.dsh-webchat-empty {
  display: flex;
  flex: auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
}
.dsh-webchat-empty-title {
  font-size: 13px;
  font-weight: 600;
}
.dsh-webchat-empty-text {
  max-width: 260px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--dsw-alias-label-secondary);
}
.dsh-webchat-empty .dsh-webchat-button {
  margin-top: 4px;
}
`;

    function createTranslator(ctx) {
      const locale = ctx.locale;
      if (!locale || typeof locale.register !== "function" || typeof locale.bind !== "function") {
        return (key, params) => fallbackTranslate(key, params);
      }
      try {
        const dispose = locale.register("webchat", { zh: MESSAGES.zh, en: MESSAGES.en });
        if (typeof dispose === "function") {
          ctx.effect(() => dispose, "webchat locale");
        }
      } catch (error) {
        console.error("[dsh-webchat] could not register the locale dictionaries", error);
      }
      try {
        return locale.bind("webchat");
      } catch (error) {
        console.error("[dsh-webchat] could not bind the locale dictionaries", error);
        return (key, params) => fallbackTranslate(key, params);
      }
    }

    function fallbackTranslate(key, params) {
      let text = MESSAGES.zh[key] ?? key;
      for (const [name, value] of Object.entries(params ?? {})) {
        text = text.split("{" + name + "}").join(String(value));
      }
      return text;
    }

    function standardUserAgent() {
      const source =
        typeof navigator !== "undefined" && typeof navigator.userAgent === "string"
          ? navigator.userAgent
          : "";
      const platform = /\(([^)]*)\)/.exec(source)?.[1] ?? "Windows NT 10.0; Win64; x64";
      const chromium = /Chrome\/([\d.]+)/.exec(source)?.[1] ?? "140.0.0.0";
      return (
        "Mozilla/5.0 (" +
        platform +
        ") AppleWebKit/537.36 (KHTML, like Gecko) Chrome/" +
        chromium +
        " Safari/537.36"
      );
    }

    function readHostStorage(key) {
      try {
        if (typeof localStorage === "undefined") return null;
        return localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    }

    function writeHostStorage(key, value) {
      try {
        if (typeof localStorage === "undefined") return false;
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.error("[dsh-webchat] could not persist a session snapshot", error);
        return false;
      }
    }

    function removeHostStorage(key) {
      try {
        if (typeof localStorage === "undefined") return false;
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        return false;
      }
    }

    function isSafeKey(key) {
      return key !== "__proto__" && key !== "constructor" && key !== "prototype";
    }

    function makeSessionKey(providerId) {
      return SESSION_PREFIX + providerId;
    }

    function normalizeCustomUrl(value) {
      try {
        const url = new URL(String(value).trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") return null;
        return url;
      } catch (error) {
        return null;
      }
    }

    function cleanCustomName(value) {
      return String(value)
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, CUSTOM_NAME_LIMIT);
    }

    function makeCustomId() {
      return (
        "custom-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 8)
      );
    }

    function makeCustomProvider(name, url) {
      return {
        id: makeCustomId(),
        origin: url.origin,
        url: url.href,
        accent: "#6B7280",
        kind: "svg",
        value: CUSTOM_PROVIDER_SVG,
        name,
        custom: true,
      };
    }

    function readCustomProviders() {
      const raw = readHostStorage(CUSTOM_KEY);
      if (raw === null) return [];
      let list = null;
      try {
        list = JSON.parse(raw);
      } catch (error) {
        return [];
      }
      if (!Array.isArray(list)) return [];
      const seen = new Set();
      const providers = [];
      for (const item of list) {
        if (item === null || typeof item !== "object") continue;
        const id = typeof item.id === "string" ? item.id : "";
        const name = typeof item.name === "string" ? cleanCustomName(item.name) : "";
        const url = normalizeCustomUrl(item.url);
        if (!id.startsWith("custom-") || !name || url === null) continue;
        if (BUILTIN_PROVIDER_IDS.has(id) || seen.has(id)) continue;
        seen.add(id);
        providers.push({
          id,
          origin: url.origin,
          url: url.href,
          accent: "#6B7280",
          kind: "svg",
          value: CUSTOM_PROVIDER_SVG,
          name,
          custom: true,
        });
        if (providers.length >= CUSTOM_LIMIT) break;
      }
      return providers;
    }

    function writeCustomProviders(providers) {
      writeHostStorage(
        CUSTOM_KEY,
        JSON.stringify(
          providers.map((provider) => ({
            id: provider.id,
            name: provider.name,
            url: provider.url,
          })),
        ),
      );
    }

    function deleteCustomProvider(providerId) {
      const customs = readCustomProviders();
      const nextCustoms = customs.filter((provider) => provider.id !== providerId);
      if (nextCustoms.length === customs.length) return null;
      writeCustomProviders(nextCustoms);
      const nextOrder = readProviderOrder(nextCustoms);
      writeProviderOrder(nextOrder);
      const nextEnabled = readEnabledProviders();
      nextEnabled.delete(providerId);
      const nextProviders = applyProviderOrder(nextCustoms, nextOrder);
      writeEnabledProviders(nextEnabled, nextProviders);
      return {
        customs: nextCustoms,
        order: nextOrder,
        enabled: nextEnabled,
        providers: nextProviders,
      };
    }

    function readProviderOrder(customs) {
      const list = typeof customs === "undefined" ? readCustomProviders() : customs;
      const all = PROVIDERS.concat(list);
      const known = new Set(all.map((provider) => provider.id));
      const order = [];
      const seen = new Set();
      const raw = readHostStorage(ORDER_KEY);
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const id of parsed) {
              if (typeof id === "string" && known.has(id) && !seen.has(id)) {
                seen.add(id);
                order.push(id);
              }
            }
          }
        } catch (error) {
          // Fall through to the catalog order.
        }
      }
      for (const provider of all) {
        if (!seen.has(provider.id)) {
          seen.add(provider.id);
          order.push(provider.id);
        }
      }
      return order;
    }

    function writeProviderOrder(ids) {
      writeHostStorage(ORDER_KEY, JSON.stringify(ids));
    }

    function applyProviderOrder(customs, order) {
      const all = PROVIDERS.concat(customs);
      const byId = new Map(all.map((provider) => [provider.id, provider]));
      const result = [];
      const seen = new Set();
      for (const id of order) {
        const provider = byId.get(id);
        if (provider && !seen.has(id)) {
          seen.add(id);
          result.push(provider);
        }
      }
      for (const provider of all) {
        if (!seen.has(provider.id)) result.push(provider);
      }
      return result;
    }

    function orderedProviders(customs) {
      const list = typeof customs === "undefined" ? readCustomProviders() : customs;
      return applyProviderOrder(list, readProviderOrder(list));
    }

    function findProvider(providerId) {
      if (BUILTIN_PROVIDER_IDS.has(providerId)) return PROVIDER_BY_ID.get(providerId);
      return readCustomProviders().find((provider) => provider.id === providerId);
    }

    function providerExists(providerId) {
      return findProvider(providerId) !== undefined;
    }

    function providerName(provider, t) {
      if (!provider) return t("tab.title");
      if (provider.custom) return provider.name;
      return t("provider." + provider.id);
    }

    function readLastProvider() {
      const stored = readHostStorage(LAST_PROVIDER_KEY);
      if (stored !== null && providerExists(stored)) return stored;
      return DEFAULT_PROVIDER_ID;
    }

    function writeLastProvider(providerId) {
      if (!providerExists(providerId)) return;
      writeHostStorage(LAST_PROVIDER_KEY, providerId);
    }

    function readEnabledProviders() {
      const known = new Set(BUILTIN_PROVIDER_IDS);
      for (const provider of readCustomProviders()) known.add(provider.id);
      const raw = readHostStorage(ENABLED_KEY);
      if (raw !== null) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            return new Set(
              list.filter((id) => typeof id === "string" && known.has(id)),
            );
          }
        } catch (error) {
          // Fall through to the defaults.
        }
      }
      return new Set(DEFAULT_ENABLED_IDS);
    }

    function writeEnabledProviders(ids, providers) {
      const list = (providers ?? orderedProviders())
        .filter((provider) => ids.has(provider.id))
        .map((provider) => provider.id);
      writeHostStorage(ENABLED_KEY, JSON.stringify(list));
    }

    function pickActiveProvider(preferred, enabled, providers) {
      if (preferred && enabled.has(preferred)) return preferred;
      const first = (providers ?? orderedProviders()).find((provider) =>
        enabled.has(provider.id),
      );
      return first ? first.id : "";
    }

    function readSnapshot(provider) {
      const raw = readHostStorage(makeSessionKey(provider.id));
      if (typeof raw !== "string" || raw === "") return null;
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch (error) {
        return null;
      }
      if (!data || data.version !== SESSION_VERSION || data.origin !== provider.origin) return null;
      if (!data.local || typeof data.local !== "object" || Array.isArray(data.local)) return null;
      const local = {};
      for (const [key, value] of Object.entries(data.local)) {
        if (!isSafeKey(key) || typeof value !== "string") continue;
        if (key.length === 0 || key.length > 4096 || value.length > SNAPSHOT_LIMIT) continue;
        local[key] = value;
      }
      const cookies = {};
      if (data.cookies && typeof data.cookies === "object" && !Array.isArray(data.cookies)) {
        for (const [key, value] of Object.entries(data.cookies)) {
          if (!isSafeKey(key) || typeof value !== "string") continue;
          if (key.length === 0 || key.length > 256 || value.length > 8192) continue;
          if (/[;\r\n]/.test(key) || /[;\r\n]/.test(value)) continue;
          cookies[key] = value;
        }
      }
      const savedAt = Number.isFinite(data.savedAt) ? data.savedAt : 0;
      return { version: SESSION_VERSION, origin: provider.origin, savedAt, local, cookies };
    }

    function writeSnapshot(provider, data, capturedAt, allowEmpty) {
      if (!data || data.origin !== provider.origin) return false;
      const local = {};
      if (data.local && typeof data.local === "object" && !Array.isArray(data.local)) {
        for (const [key, value] of Object.entries(data.local)) {
          if (!isSafeKey(key) || typeof value !== "string") continue;
          if (key.length === 0 || key.length > 4096 || value.length > SNAPSHOT_LIMIT) continue;
          local[key] = value;
        }
      }
      const cookies = {};
      if (data.cookies && typeof data.cookies === "object" && !Array.isArray(data.cookies)) {
        for (const [key, value] of Object.entries(data.cookies)) {
          if (!isSafeKey(key) || typeof value !== "string") continue;
          if (key.length === 0 || key.length > 256 || value.length > 8192) continue;
          if (/[;\r\n]/.test(key) || /[;\r\n]/.test(value)) continue;
          cookies[key] = value;
        }
      }
      const key = makeSessionKey(provider.id);
      if (Object.keys(local).length === 0 && Object.keys(cookies).length === 0) {
        if (allowEmpty) removeHostStorage(key);
        return true;
      }
      const existing = readSnapshot(provider);
      if (existing !== null && existing.savedAt >= capturedAt) return false;
      let serialized = "";
      try {
        serialized = JSON.stringify({
          version: SESSION_VERSION,
          origin: provider.origin,
          savedAt: Number.isFinite(capturedAt) ? capturedAt : Date.now(),
          local,
          cookies,
        });
      } catch (error) {
        return false;
      }
      if (serialized.length > SNAPSHOT_LIMIT + COOKIE_LIMIT + 4096) return false;
      return writeHostStorage(key, serialized);
    }

    function readStorageInPage(origin, limit, cookieLimit) {
      if (location.origin !== origin) return "";
      const entries = [];
      try {
        const count = Math.min(localStorage.length, 2000);
        for (let index = 0; index < count; index += 1) {
          const key = localStorage.key(index);
          if (typeof key !== "string" || key.length === 0 || key.length > 4096) continue;
          if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
          let value = null;
          try {
            value = localStorage.getItem(key);
          } catch (error) {
            continue;
          }
          if (typeof value !== "string" || value.length > limit) continue;
          entries.push([key, value]);
        }
      } catch (error) {
        return "";
      }
      entries.sort(
        (left, right) =>
          left[0].length + left[1].length - (right[0].length + right[1].length),
      );
      const local = {};
      let used = 0;
      for (const entry of entries) {
        const cost = entry[0].length + entry[1].length + 6;
        if (used + cost > limit) continue;
        local[entry[0]] = entry[1];
        used += cost;
      }
      let cookies = {};
      try {
        let cookieUsed = 0;
        for (const part of document.cookie.split(";")) {
          const index = part.indexOf("=");
          if (index <= 0) continue;
          const name = part.slice(0, index).trim();
          const value = part.slice(index + 1).trim();
          if (name.length === 0 || name.length > 256 || value.length > 8192) continue;
          if (name === "__proto__" || name === "constructor" || name === "prototype") continue;
          if (/[;\r\n]/.test(name) || /[;\r\n]/.test(value)) continue;
          const cost = name.length + value.length + 6;
          if (cookieUsed + cost > cookieLimit) continue;
          cookies[name] = value;
          cookieUsed += cost;
        }
      } catch (error) {
        cookies = {};
      }
      try {
        return JSON.stringify({ origin, local, cookies });
      } catch (error) {
        return "";
      }
    }

    function restoreStorageInPage(snapshot, limit) {
      if (!snapshot || snapshot.origin !== location.origin) return 0;
      let restored = 0;
      try {
        for (const [key, value] of Object.entries(snapshot.local || {})) {
          if (typeof key !== "string" || typeof value !== "string") continue;
          if (key.length === 0 || key.length > 4096 || value.length > limit) continue;
          if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
          try {
            localStorage.setItem(key, value);
            restored += 1;
          } catch (error) {}
        }
      } catch (error) {}
      try {
        for (const [name, value] of Object.entries(snapshot.cookies || {})) {
          if (typeof name !== "string" || typeof value !== "string") continue;
          if (name.length === 0 || name.length > 256 || value.length > 8192) continue;
          if (name === "__proto__" || name === "constructor" || name === "prototype") continue;
          if (/[;\r\n]/.test(name) || /[;\r\n]/.test(value)) continue;
          try {
            document.cookie =
              name + "=" + value + "; path=/; max-age=31536000; SameSite=Lax; Secure";
          } catch (error) {}
        }
      } catch (error) {}
      return restored;
    }

    function readStorageScript(provider) {
      return (
        "(" +
        readStorageInPage.toString() +
        ")(" +
        JSON.stringify(provider.origin) +
        ", " +
        SNAPSHOT_LIMIT +
        ", " +
        COOKIE_LIMIT +
        ")"
      );
    }

    function restoreStorageScript(provider, snapshot) {
      const payload = JSON.stringify({
        origin: provider.origin,
        local: snapshot.local,
        cookies: snapshot.cookies,
      })
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
      return (
        "(" + restoreStorageInPage.toString() + ")(" + payload + ", " + SNAPSHOT_LIMIT + ")"
      );
    }

    function createLinkOpener(ctx) {
      return (url) => {
        if (typeof url !== "string" || url === "" || !isHttpUrl(url)) return;
        try {
          const tabs = ctx.sidebarRightTabs;
          const sidebarRight = ctx.sidebarRight;
          if (
            tabs &&
            typeof tabs.get === "function" &&
            tabs.get("browser") !== undefined &&
            sidebarRight &&
            typeof sidebarRight.openTab === "function"
          ) {
            sidebarRight.openTab("browser", { params: { url } });
            return;
          }
        } catch (error) {
          console.error("[dsh-webchat] could not open the link in the Browser tab", error);
        }
        openExternalUrl(url);
      };
    }

    function openExternalUrl(url) {
      try {
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (error) {
        console.error("[dsh-webchat] could not open the URL in the system browser", error);
      }
    }

    function openProviderInBrowser(provider) {
      openExternalUrl(provider.url);
    }

    function isHttpUrl(url) {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch (error) {
        return false;
      }
    }

    function describeLoadError(event) {
      const text =
        event && typeof event.errorDescription === "string" && event.errorDescription !== ""
          ? event.errorDescription
          : "LOAD_FAILED";
      const code = event && typeof event.errorCode === "number" ? event.errorCode : null;
      return code === null ? text : text + " (" + code + ")";
    }

    function createProviderGuest(provider, container, ctx, t, onStatus) {
      const openLink = createLinkOpener(ctx);
      const snapshot = readSnapshot(provider);
      const seedUrl = provider.origin + "/robots.txt";
      let disposed = false;
      let released = false;
      let view = null;
      let lease = null;
      let browserApi = null;
      let unsubscribeOpen = null;
      let timer = null;
      let stage = "bootstrap";
      let appLoaded = false;
      let status = { kind: "loading" };

      function report(next) {
        status = next;
        if (!disposed) onStatus(next);
      }

      function stopTimer() {
        if (timer === null) return;
        try {
          window.clearInterval(timer);
        } catch (error) {}
        timer = null;
      }

      function startTimer() {
        if (timer !== null || disposed) return;
        try {
          timer = window.setInterval(() => {
            void capture(false);
          }, SNAPSHOT_INTERVAL_MS);
        } catch (error) {
          timer = null;
        }
      }

      function releaseLease() {
        const api = browserApi;
        const current = lease;
        lease = null;
        browserApi = null;
        if (current === null || api === null) return;
        try {
          const result = api.release(current);
          if (result && typeof result.catch === "function") result.catch(() => {});
        } catch (error) {
          console.error("[dsh-webchat] could not release the browser lease", error);
        }
      }

      function capture(allowEmpty) {
        if (disposed && !allowEmpty) return Promise.resolve();
        const current = view;
        if (current === null || stage !== "app") return Promise.resolve();
        const capturedAt = Date.now();
        let pending;
        try {
          pending = current.executeJavaScript(readStorageScript(provider));
        } catch (error) {
          return Promise.resolve();
        }
        return Promise.resolve(pending)
          .then((raw) => {
            if (typeof raw !== "string" || raw === "") return;
            let data = null;
            try {
              data = JSON.parse(raw);
            } catch (error) {
              return;
            }
            if (!data || data.origin !== provider.origin) return;
            writeSnapshot(provider, data, capturedAt, allowEmpty);
          })
          .catch((error) => {
            if (!disposed) {
              console.error("[dsh-webchat] could not capture the provider session", error);
            }
          });
      }

      function loadURL(url) {
        if (disposed || view === null) return;
        try {
          const result = view.loadURL(url);
          if (result && typeof result.catch === "function") {
            result.catch((error) => {
              if (disposed || view === null || isAbortError(error)) return;
              if (stage === "seed") {
                enterApp();
                return;
              }
              report({
                kind: "error",
                message: t("status.openFailed"),
                detail: String(error?.message ?? error),
              });
            });
          }
        } catch (error) {
          if (isAbortError(error)) return;
          if (stage === "seed") {
            enterApp();
            return;
          }
          report({
            kind: "error",
            message: t("status.openFailed"),
            detail: String(error?.message ?? error),
          });
        }
      }

      function enterApp() {
        if (disposed || view === null) return;
        stage = "app";
        appLoaded = false;
        report({ kind: "loading" });
        loadURL(provider.url);
      }

      function onDomReady() {
        if (disposed || view === null) return;
        startTimer();
        if (stage === "bootstrap") {
          Promise.resolve().then(() => {
            if (disposed || view === null) return;
            try {
              view.setUserAgent(standardUserAgent());
            } catch (error) {}
            if (snapshot === null) {
              enterApp();
              return;
            }
            stage = "seed";
            loadURL(seedUrl);
          });
          return;
        }
        if (stage === "seed") {
          stage = "restoring";
          let restore;
          try {
            restore = view.executeJavaScript(restoreStorageScript(provider, snapshot));
          } catch (error) {
            enterApp();
            return;
          }
          Promise.resolve(restore)
            .catch(() => 0)
            .then(() => {
              enterApp();
            });
          return;
        }
        if (stage === "app") {
          appLoaded = true;
          void capture(false);
        }
      }

      function onFailLoad(event) {
        if (disposed || view === null) return;
        if (event && (event.errorCode === -3 || event.isMainFrame === false)) return;
        if (stage === "seed") {
          enterApp();
          return;
        }
        if (stage === "restoring") return;
        report({
          kind: "error",
          message: t("status.openFailed"),
          detail: describeLoadError(event),
        });
      }

      function onStopLoading() {
        if (disposed || view === null) return;
        if (stage === "app" && appLoaded && status.kind !== "error") {
          report({ kind: "ready" });
        }
        void capture(false);
      }

      function start() {
        if (disposed || view !== null) return;
        const api = window.dshDesktop?.browser;
        if (!api || typeof api.acquire !== "function") {
          report({
            kind: "error",
            message: t("status.unsupported"),
            retryable: false,
          });
          return;
        }
        if (container === null) {
          report({ kind: "error", message: t("status.openFailed"), retryable: false });
          return;
        }
        browserApi = api;
        let pending;
        try {
          pending = api.acquire(WORKSPACE_KEY);
        } catch (error) {
          report({
            kind: "error",
            message: t("status.openFailed"),
            detail: String(error?.message ?? error),
          });
          return;
        }
        Promise.resolve(pending)
          .then((reservation) => {
            if (disposed) {
              releaseReservation(api, reservation);
              return;
            }
            lease = reservation.lease;
            const guest = document.createElement("webview");
            guest.setAttribute("name", reservation.lease);
            guest.setAttribute("partition", reservation.partition);
            guest.setAttribute("allowpopups", "");
            guest.setAttribute("src", "about:blank#" + reservation.lease);
            guest.addEventListener("dom-ready", onDomReady);
            guest.addEventListener("did-fail-load", onFailLoad);
            guest.addEventListener("did-stop-loading", onStopLoading);
            view = guest;
            try {
              if (typeof api.onOpenRequested === "function") {
                unsubscribeOpen = api.onOpenRequested(reservation.lease, (url) => {
                  if (isHttpUrl(url)) openLink(url);
                });
              }
            } catch (error) {
              console.error("[dsh-webchat] could not subscribe to popup requests", error);
            }
            try {
              container.appendChild(guest);
            } catch (error) {
              report({
                kind: "error",
                message: t("status.openFailed"),
                detail: String(error?.message ?? error),
              });
            }
          })
          .catch((error) => {
            if (disposed) return;
            report({
              kind: "error",
              message: t("status.openFailed"),
              detail: String(error?.message ?? error),
            });
          });
      }

      function reload() {
        if (disposed) return;
        if (view === null) {
          start();
          return;
        }
        stage = "app";
        appLoaded = false;
        report({ kind: "loading" });
        loadURL(provider.url);
      }

      function dispose() {
        if (disposed) return;
        disposed = true;
        stopTimer();
        if (unsubscribeOpen !== null) {
          try {
            unsubscribeOpen();
          } catch (error) {}
          unsubscribeOpen = null;
        }
        const pending = capture(true);
        let timeout = null;
        const release = () => {
          if (released) return;
          released = true;
          if (timeout !== null) {
            try {
              window.clearTimeout(timeout);
            } catch (error) {}
            timeout = null;
          }
          releaseLease();
          if (view !== null) {
            try {
              view.remove();
            } catch (error) {}
            view = null;
          }
        };
        try {
          timeout = window.setTimeout(release, DISPOSE_CAPTURE_TIMEOUT_MS);
        } catch (error) {
          timeout = null;
        }
        Promise.resolve(pending)
          .catch(() => {})
          .then(release);
      }

      return { start, reload, dispose, capture: () => capture(false) };
    }

    function isAbortError(error) {
      const message = String(error?.message ?? error);
      return message.includes("ERR_ABORTED") || message.includes("(-3)");
    }

    function releaseReservation(api, reservation) {
      if (!reservation || typeof reservation.lease !== "string") return;
      try {
        const result = api.release(reservation.lease);
        if (result && typeof result.catch === "function") result.catch(() => {});
      } catch (error) {}
    }

    const tabProviders = new Map();
    const tabProviderListeners = new Set();

    function subscribeTabProvider(listener) {
      tabProviderListeners.add(listener);
      return () => {
        tabProviderListeners.delete(listener);
      };
    }

    function getTabProvider(tabId) {
      return tabProviders.get(tabId);
    }

    function publishTabProvider(tabId, provider) {
      if (tabProviders.get(tabId) === provider) return;
      tabProviders.set(tabId, provider);
      for (const listener of tabProviderListeners) {
        try {
          listener();
        } catch (error) {
          console.error("[dsh-webchat] a title listener failed", error);
        }
      }
    }

    function clearTabProvider(tabId) {
      if (!tabProviders.has(tabId)) return;
      tabProviders.delete(tabId);
      for (const listener of tabProviderListeners) {
        try {
          listener();
        } catch (error) {
          console.error("[dsh-webchat] a title listener failed", error);
        }
      }
    }

    function AppGlyph(props) {
      const size = typeof props?.size === "number" ? props.size : 24;
      return React.createElement("span", {
        className: APP_GLYPH_CLASS,
        style: { width: size, height: size },
        dangerouslySetInnerHTML: { __html: APP_GLYPH_SVG },
      });
    }

    function GuideIcon(props) {
      const size = typeof props?.size === "number" ? props.size : 26;
      return React.createElement(AppGlyph, { size });
    }

    function ProviderIcon(props) {
      const provider = props?.provider;
      const size = typeof props?.size === "number" ? props.size : 18;
      if (!provider) return React.createElement(AppGlyph, { size });
      if (provider.kind === "svg") {
        return React.createElement("span", {
          className: GLYPH_CLASS,
          style: { width: size, height: size },
          dangerouslySetInnerHTML: { __html: provider.value },
        });
      }
      return React.createElement("img", {
        className: LOGO_CLASS,
        src: provider.value,
        width: size,
        height: size,
        alt: "",
        "aria-hidden": "true",
        draggable: false,
      });
    }

    function ReloadIcon() {
      return React.createElement("span", {
        className: "dsh-webchat-action-glyph",
        dangerouslySetInnerHTML: { __html: RELOAD_SVG },
      });
    }

    function ExternalIcon() {
      return React.createElement("span", {
        className: "dsh-webchat-action-glyph",
        dangerouslySetInnerHTML: { __html: EXTERNAL_SVG },
      });
    }

    function SettingsIcon() {
      return React.createElement("span", {
        className: "dsh-webchat-action-glyph",
        dangerouslySetInnerHTML: { __html: SETTINGS_SVG },
      });
    }

    function TrashIcon() {
      return React.createElement("span", {
        className: "dsh-webchat-action-glyph",
        dangerouslySetInnerHTML: { __html: TRASH_SVG },
      });
    }

    function createSwitchButton(openChat, t) {
      return function WebChatSwitchButton() {
        const label = t("action.open");
        return React.createElement(
          "button",
          {
            type: "button",
            className: SWITCH_CLASS,
            title: label,
            "aria-label": label,
            onClick: openChat,
          },
          React.createElement(AppGlyph, { size: 18 }),
        );
      };
    }

    function useTabProvider(tabId) {
      const [provider, setProvider] = React.useState(() => getTabProvider(tabId));
      React.useEffect(() => {
        setProvider(getTabProvider(tabId));
        return subscribeTabProvider(() => setProvider(getTabProvider(tabId)));
      }, [tabId]);
      return provider;
    }

    function createTitle(t) {
      return function WebChatTitle(props) {
        const info = typeof props?.useTabInfo === "function" ? props.useTabInfo() : undefined;
        const tabId = info?.tab?.id ?? "";
        const provider = useTabProvider(tabId);
        const name = providerName(provider, t);
        return React.createElement(
          "span",
          { className: TAB_TITLE_CLASS, title: name },
          React.createElement(
            "span",
            { className: TAB_TITLE_ICON_CLASS },
            React.createElement(ProviderIcon, { provider, size: 14 }),
          ),
          React.createElement("span", { className: TAB_TITLE_TEXT_CLASS }, name),
        );
      };
    }

    function ProviderPane(props) {
      const { provider, active, ctx, t, onApi } = props;
      const mountRef = React.useRef(null);
      const guestRef = React.useRef(null);
      const [status, setStatus] = React.useState({ kind: "loading" });
      React.useEffect(() => {
        const container = mountRef.current;
        if (container === null) {
          setStatus({ kind: "error", message: t("status.openFailed"), retryable: false });
          return undefined;
        }
        const guest = createProviderGuest(provider, container, ctx, t, (next) => setStatus(next));
        guestRef.current = guest;
        onApi(provider.id, {
          reload: () => {
            setStatus({ kind: "loading" });
            guest.reload();
          },
          openExternal: () => openProviderInBrowser(provider),
        });
        guest.start();
        return () => {
          onApi(provider.id, null);
          guestRef.current = null;
          guest.dispose();
        };
      }, [provider.id]);

      const name = providerName(provider, t);
      const isReady = status.kind === "ready";
      const isError = status.kind === "error";
      const detail =
        isError && typeof status.detail === "string" && status.detail !== ""
          ? status.detail
          : isError
            ? status.message
            : "";
      const networkHint =
        isError &&
        /ERR_(CONNECTION_TIMED_OUT|NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|PROXY_CONNECTION_FAILED)/.test(
          detail,
        );
      const overlay = isReady
        ? null
        : React.createElement(
            "div",
            { className: OVERLAY_CLASS },
            React.createElement(
              "span",
              { className: OVERLAY_ICON_CLASS },
              React.createElement(ProviderIcon, { provider, size: 36 }),
            ),
            React.createElement(
              "div",
              { className: OVERLAY_COPY_CLASS },
              React.createElement(
                "div",
                { className: OVERLAY_TITLE_CLASS },
                isError ? t("status.errorTitle", { name }) : t("status.loading", { name }),
              ),
              isError
                ? React.createElement("div", { className: OVERLAY_DETAIL_CLASS }, detail)
                : null,
              networkHint
                ? React.createElement(
                    "div",
                    { className: OVERLAY_HINT_CLASS },
                    t("status.networkHint"),
                  )
                : null,
              isError
                ? React.createElement(
                    "div",
                    { className: OVERLAY_ACTIONS_CLASS },
                    status.retryable === false
                      ? null
                      : React.createElement(
                          "button",
                          {
                            type: "button",
                            className: BUTTON_CLASS + " is-primary",
                            onClick: () => {
                              setStatus({ kind: "loading" });
                              guestRef.current?.reload();
                            },
                          },
                          t("action.retry"),
                        ),
                    React.createElement(
                      "button",
                      {
                        type: "button",
                        className: BUTTON_CLASS,
                        onClick: () => openProviderInBrowser(provider),
                      },
                      t("action.openExternal"),
                    ),
                  )
                : React.createElement("div", { className: SPINNER_CLASS, "aria-hidden": "true" }),
            ),
          );

      return React.createElement(
        "div",
        {
          className: PANE_CLASS,
          "data-active": active ? "true" : "false",
          "data-visible": isReady ? "true" : "false",
        },
        React.createElement("div", { className: MOUNT_CLASS, ref: mountRef }),
        overlay,
      );
    }

    function createWebChatBody(ctx, t) {
      return function WebChatBody(props) {
        const info = typeof props?.useTabInfo === "function" ? props.useTabInfo() : undefined;
        const tabId = info?.tab?.id ?? TAB_KIND;
        const [initial] = React.useState(() => {
          const customs = readCustomProviders();
          const enabledSet = readEnabledProviders();
          const order = readProviderOrder(customs);
          const providers = applyProviderOrder(customs, order);
          return {
            customs,
            enabled: enabledSet,
            order,
            active: pickActiveProvider(readLastProvider(), enabledSet, providers),
          };
        });
        const [customs, setCustoms] = React.useState(initial.customs);
        const [order, setOrder] = React.useState(initial.order);
        const [enabled, setEnabled] = React.useState(initial.enabled);
        const [active, setActive] = React.useState(initial.active);
        const [visited, setVisited] = React.useState(
          () => new Set(initial.active === "" ? [] : [initial.active]),
        );
        const [settingsOpen, setSettingsOpen] = React.useState(false);
        const [pendingDelete, setPendingDelete] = React.useState("");
        const [customForm, setCustomForm] = React.useState({
          open: false,
          name: "",
          url: "",
          error: "",
        });
        const paneApis = React.useRef(new Map());
        const providers = applyProviderOrder(customs, order);
        const providerById = new Map(providers.map((provider) => [provider.id, provider]));
        const activeProvider = enabled.has(active)
          ? providerById.get(active)
          : undefined;

        React.useEffect(() => {
          publishTabProvider(tabId, activeProvider);
        }, [tabId, activeProvider]);
        React.useEffect(
          () => () => {
            clearTabProvider(tabId);
          },
          [tabId],
        );

        const select = (id) => {
          if (!providerById.has(id) || !enabled.has(id)) return;
          setActive(id);
          writeLastProvider(id);
          setVisited((previous) => {
            if (previous.has(id)) return previous;
            const next = new Set(previous);
            next.add(id);
            return next;
          });
        };
        const rememberVisited = (id) => {
          if (id === "") return;
          setVisited((previous) => {
            if (previous.has(id)) return previous;
            const next = new Set(previous);
            next.add(id);
            return next;
          });
        };
        const toggleProvider = (id, on) => {
          if (!providerById.has(id)) return;
          const next = new Set(enabled);
          if (on) next.add(id);
          else next.delete(id);
          setEnabled(next);
          writeEnabledProviders(next, providers);
          if (!next.has(active)) {
            const fallback = pickActiveProvider("", next, providers);
            setActive(fallback);
            if (fallback !== "") {
              writeLastProvider(fallback);
              rememberVisited(fallback);
            }
          }
        };
        const moveProvider = (id, delta) => {
          const from = order.indexOf(id);
          const to = from + delta;
          if (from < 0 || to < 0 || to >= order.length) return;
          const next = order.slice();
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          setOrder(next);
          writeProviderOrder(next);
        };
        const addCustomProvider = () => {
          const name = cleanCustomName(customForm.name);
          const url = normalizeCustomUrl(customForm.url);
          if (name === "") {
            setCustomForm((form) => ({ ...form, error: t("settings.invalidName") }));
            return;
          }
          if (url === null) {
            setCustomForm((form) => ({ ...form, error: t("settings.invalidUrl") }));
            return;
          }
          if (customs.length >= CUSTOM_LIMIT) {
            setCustomForm((form) => ({ ...form, error: t("settings.limit") }));
            return;
          }
          const provider = makeCustomProvider(name, url);
          const nextCustoms = customs.concat(provider);
          const nextOrder = order.concat(provider.id);
          writeCustomProviders(nextCustoms);
          writeProviderOrder(nextOrder);
          setCustoms(nextCustoms);
          setOrder(nextOrder);
          const nextProviders = applyProviderOrder(nextCustoms, nextOrder);
          const nextEnabled = new Set(enabled);
          nextEnabled.add(provider.id);
          setEnabled(nextEnabled);
          writeEnabledProviders(nextEnabled, nextProviders);
          setActive(provider.id);
          writeLastProvider(provider.id);
          rememberVisited(provider.id);
          setCustomForm({ open: false, name: "", url: "", error: "" });
        };
        const removeCustomProvider = (id) => {
          const result = deleteCustomProvider(id);
          setPendingDelete("");
          if (result === null) return;
          setCustoms(result.customs);
          setOrder(result.order);
          setEnabled(result.enabled);
          paneApis.current.delete(id);
          if (active === id) {
            const fallback = pickActiveProvider("", result.enabled, result.providers);
            setActive(fallback);
            if (fallback !== "") {
              writeLastProvider(fallback);
              rememberVisited(fallback);
            }
          }
        };
        const registerPane = React.useCallback((id, api) => {
          if (api === null) paneApis.current.delete(id);
          else paneApis.current.set(id, api);
        }, []);
        const reload = () => {
          if (active === "") return;
          paneApis.current.get(active)?.reload();
        };
        const openExternal = () => {
          if (activeProvider) openProviderInBrowser(activeProvider);
        };

        const visibleProviders = providers.filter((provider) => enabled.has(provider.id));
        const providerButtons = visibleProviders.map((provider) => {
          const name = providerName(provider, t);
          const selected = provider.id === active;
          return React.createElement(
            "button",
            {
              key: provider.id,
              type: "button",
              className: PROVIDER_CLASS,
              "data-active": selected ? "true" : "false",
              "aria-pressed": selected,
              "aria-label": name,
              title: name,
              style: { "--dsh-webchat-accent": provider.accent },
              onClick: () => select(provider.id),
            },
            React.createElement(ProviderIcon, { provider, size: 18 }),
          );
        });

        const panes = visibleProviders
          .filter((provider) => visited.has(provider.id))
          .map((provider) =>
            React.createElement(ProviderPane, {
              key: provider.id,
              provider,
              active: provider.id === active,
              ctx,
              t,
              onApi: registerPane,
            }),
          );

        const settingsList = providers.map((provider, index) => {
          const name = providerName(provider, t);
          if (pendingDelete === provider.id) {
            return React.createElement(
              "div",
              { key: provider.id, className: SETTINGS_CONFIRM_CLASS },
              React.createElement(
                "span",
                { className: SETTINGS_CONFIRM_TEXT_CLASS, title: name },
                t("settings.confirmDelete", { name }),
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  className: SETTINGS_CONFIRM_BUTTON_CLASS,
                  onClick: () => removeCustomProvider(provider.id),
                },
                t("settings.deleteConfirm"),
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  className: SETTINGS_CONFIRM_BUTTON_CLASS + " is-quiet",
                  onClick: () => setPendingDelete(""),
                },
                t("settings.cancel"),
              ),
            );
          }
          return React.createElement(
            "div",
            { key: provider.id, className: SETTINGS_ROW_CLASS, title: name },
            React.createElement(ProviderIcon, { provider, size: 18 }),
            React.createElement("span", { className: SETTINGS_NAME_CLASS }, name),
            React.createElement("input", {
              type: "checkbox",
              checked: enabled.has(provider.id),
              "aria-label": t("settings.toggle", { name }),
              onChange: (event) => toggleProvider(provider.id, event.target.checked),
            }),
            React.createElement(
              "div",
              { className: SETTINGS_CONTROLS_CLASS },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: SETTINGS_MOVE_CLASS,
                  title: t("settings.moveUp"),
                  "aria-label": t("settings.moveUp", { name }),
                  disabled: index === 0,
                  onClick: () => moveProvider(provider.id, -1),
                },
                "↑",
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  className: SETTINGS_MOVE_CLASS,
                  title: t("settings.moveDown"),
                  "aria-label": t("settings.moveDown", { name }),
                  disabled: index === providers.length - 1,
                  onClick: () => moveProvider(provider.id, 1),
                },
                "↓",
              ),
              provider.custom
                ? React.createElement(
                    "button",
                    {
                      type: "button",
                      className: SETTINGS_DELETE_CLASS,
                      title: t("settings.delete", { name }),
                      "aria-label": t("settings.delete", { name }),
                      onClick: () => setPendingDelete(provider.id),
                    },
                    React.createElement(TrashIcon),
                  )
                : null,
            ),
          );
        });

        const customFormElement = React.createElement(
          "div",
          { className: SETTINGS_FORM_CLASS },
          React.createElement(
            "div",
            { className: SETTINGS_TITLE_CLASS },
            t("settings.addTitle"),
          ),
          React.createElement("input", {
            className: SETTINGS_INPUT_CLASS,
            type: "text",
            value: customForm.name,
            placeholder: t("settings.namePlaceholder"),
            maxLength: CUSTOM_NAME_LIMIT,
            "aria-label": t("settings.name"),
            onChange: (event) =>
              setCustomForm((form) => ({ ...form, name: event.target.value, error: "" })),
          }),
          React.createElement("input", {
            className: SETTINGS_INPUT_CLASS,
            type: "url",
            value: customForm.url,
            placeholder: t("settings.urlPlaceholder"),
            "aria-label": t("settings.url"),
            onChange: (event) =>
              setCustomForm((form) => ({ ...form, url: event.target.value, error: "" })),
          }),
          customForm.error === ""
            ? null
            : React.createElement(
                "div",
                { className: SETTINGS_ERROR_CLASS },
                customForm.error,
              ),
          React.createElement(
            "div",
            { className: SETTINGS_CONTROLS_CLASS },
            React.createElement(
              "button",
              {
                type: "button",
                className: BUTTON_CLASS + " is-primary",
                onClick: addCustomProvider,
              },
              t("settings.save"),
            ),
            React.createElement(
              "button",
              {
                type: "button",
                className: BUTTON_CLASS,
                onClick: () =>
                  setCustomForm({ open: false, name: "", url: "", error: "" }),
              },
              t("settings.cancel"),
            ),
          ),
        );

        const settingsPanel = React.createElement(
          "div",
          {
            className: SETTINGS_PANEL_CLASS,
            role: "dialog",
            "aria-label": t("settings.title"),
          },
          React.createElement(
            "div",
            { className: SETTINGS_HEAD_CLASS },
            React.createElement("span", { className: SETTINGS_TITLE_CLASS }, t("settings.title")),
            React.createElement(
              "span",
              { className: SETTINGS_COUNT_CLASS },
              t("settings.count", { enabled: enabled.size, total: providers.length }),
            ),
            React.createElement(
              "button",
              {
                type: "button",
                className: SETTINGS_CLOSE_CLASS,
                title: t("settings.close"),
                "aria-label": t("settings.close"),
                onClick: () => { setPendingDelete(""); setSettingsOpen(false); },
              },
              "×",
            ),
          ),
          React.createElement("div", { className: SETTINGS_LIST_CLASS }, settingsList),
          React.createElement(
            "div",
            { className: SETTINGS_ADD_CLASS },
            customForm.open
              ? customFormElement
              : React.createElement(
                  "button",
                  {
                    type: "button",
                    className: BUTTON_CLASS,
                    onClick: () =>
                      setCustomForm({ open: true, name: "", url: "", error: "" }),
                  },
                  t("settings.add"),
                ),
          ),
        );

        const emptyState = React.createElement(
          "div",
          { className: EMPTY_CLASS },
          React.createElement(AppGlyph, { size: 40 }),
          React.createElement("div", { className: EMPTY_TITLE_CLASS }, t("empty.title")),
          React.createElement("div", { className: EMPTY_TEXT_CLASS }, t("empty.text")),
          React.createElement(
            "button",
            {
              type: "button",
              className: BUTTON_CLASS + " is-primary",
              onClick: () => setSettingsOpen(true),
            },
            t("empty.action"),
          ),
        );

        return React.createElement(
          "div",
          { className: BODY_CLASS, "data-tab-id": tabId },
          React.createElement(
            "div",
            { className: TOOLBAR_CLASS, role: "group", "aria-label": t("toolbar.label") },
            React.createElement("div", { className: PROVIDERS_CLASS }, providerButtons),
            React.createElement(
              "div",
              { className: ACTIONS_CLASS },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: ACTION_CLASS,
                  title: t("action.reload"),
                  "aria-label": t("action.reload"),
                  onClick: reload,
                },
                React.createElement(ReloadIcon),
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  className: ACTION_CLASS,
                  title: t("action.openExternal"),
                  "aria-label": t("action.openExternal"),
                  onClick: openExternal,
                },
                React.createElement(ExternalIcon),
              ),
              React.createElement(
                "div",
                { className: SETTINGS_CLASS },
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: ACTION_CLASS,
                    title: t("action.configure"),
                    "aria-label": t("action.configure"),
                    "aria-expanded": settingsOpen,
                    onClick: () => { setPendingDelete(""); setSettingsOpen((open) => !open); },
                  },
                  React.createElement(SettingsIcon),
                ),
                settingsOpen ? settingsPanel : null,
              ),
            ),
          ),
          enabled.size === 0
            ? emptyState
            : React.createElement("div", { className: STAGE_CLASS }, panes),
        );
      };
    }

    function installStyles() {
      if (!document.head || document.getElementById(STYLE_ID) !== null) {
        return () => {};
      }
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.setAttribute("data-plugin", PLUGIN_ID);
      style.textContent = STYLES;
      document.head.appendChild(style);
      return () => {
        if (style.parentElement !== null) style.remove();
      };
    }

    function createSwitcher(ctx, t) {
      if (document.body === null) return () => {};
      const disposers = [];
      const fallbackProvider = () => {
        const customs = readCustomProviders();
        const providers = applyProviderOrder(customs, readProviderOrder(customs));
        const enabled = readEnabledProviders();
        const id = pickActiveProvider(readLastProvider(), enabled, providers);
        return (id === "" ? undefined : providers.find((provider) => provider.id === id)) ?? providers[0];
      };
      const openChat = () => {
        const sidebarRight = ctx.sidebarRight;
        if (!sidebarRight || typeof sidebarRight.openTab !== "function") {
          openProviderInBrowser(fallbackProvider());
          return;
        }
        try {
          sidebarRight.openTab(TAB_KIND);
        } catch (error) {
          console.error("[dsh-webchat] could not open the right-sidebar tab", error);
          openProviderInBrowser(fallbackProvider());
        }
      };

      if (ctx.sidebarRightTabs && typeof ctx.sidebarRightTabs.register === "function") {
        disposers.push(
          ctx.sidebarRightTabs.register({
            id: TAB_ID,
            kind: TAB_KIND,
            priority: "extension",
            keepMounted: true,
            title: () => t("tab.title"),
            guide: [
              {
                id: GUIDE_ENTRY_ID,
                commandId: COMMAND_ID,
                order: 35,
                title: () => t("guide.title"),
                description: () => t("guide.description"),
                icon: GuideIcon,
              },
            ],
          }),
        );
      }

      if (ctx.slots && typeof ctx.slots.register === "function") {
        disposers.push(
          ctx.slots.register(
            { name: "sidebar.right.pane.tab", key: TAB_ID },
            createWebChatBody(ctx, t),
          ),
        );
        disposers.push(
          ctx.slots.register(
            { name: "sidebar.right.pane.tab.title", key: TAB_ID },
            createTitle(t),
          ),
        );
      }

      if (ctx.slots && typeof ctx.slots.inject === "function") {
        disposers.push(
          ctx.slots.inject("conversation.session.header.utilities", () =>
            ctx.slots.register(
              {
                name: "conversation.session.header.utilities",
                id: SWITCH_BUTTON_ID,
                order: SWITCH_ORDER,
              },
              createSwitchButton(openChat, t),
            ),
          ),
        );
      }

      if (typeof ctx.inject === "function") {
        try {
          disposers.push(
            ctx.inject(["shortcuts"], (scope) => {
              if (!scope.shortcuts || typeof scope.shortcuts.register !== "function") {
                return undefined;
              }
              return scope.shortcuts.register({
                id: COMMAND_ID,
                label: () => t("action.open"),
                aliases: ["webchat", "web chat", "ai"],
                defaults: {
                  "desktop:windows": { code: "KeyQ", modifiers: ["primary"] },
                  "desktop:macos": { code: "KeyQ", modifiers: ["primary", "alt"] },
                },
                regions: ["page", "editable", "terminal"],
                modals: [],
                resolve: ({ target }) => {
                  let hasTarget = false;
                  try {
                    hasTarget =
                      ctx.sidebarRight &&
                      typeof ctx.sidebarRight.commandTarget === "function" &&
                      ctx.sidebarRight.commandTarget(target) !== undefined;
                  } catch (error) {
                    hasTarget = false;
                  }
                  if (!hasTarget) {
                    return { status: "blocked", reason: t("command.noSession") };
                  }
                  return { status: "handled", run: () => openChat() };
                },
              });
            }),
          );
        } catch (error) {
          console.error("[dsh-webchat] could not register the shortcut", error);
        }
      }

      return () => {
        for (let index = disposers.length - 1; index >= 0; index -= 1) {
          const dispose = disposers[index];
          if (typeof dispose !== "function") continue;
          try {
            dispose();
          } catch (error) {
            console.error("[dsh-webchat] teardown failed", error);
          }
        }
      };
    }

    function apply(ctx) {
      if (!IS_DESKTOP) return;
      const t = createTranslator(ctx);
      ctx.effect(() => installStyles(), "webchat styles");
      ctx.effect(() => createSwitcher(ctx, t), "webchat switcher");
    }

    const inject = ["slots", "sidebarRight", "sidebarRightTabs", "locale"];

    return { apply, inject };
  },
});
