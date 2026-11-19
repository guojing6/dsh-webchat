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

    const IS_DESKTOP =
      window.location.protocol === "dsh-app:" ||
      document.documentElement.dataset.platform !== undefined;

    const APP_GLYPH_SVG =
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect x="2" y="2" width="9" height="9" rx="2.5" fill="#4D6BFE"/>' +
      '<rect x="13" y="2" width="9" height="9" rx="2.5" fill="#10A37F"/>' +
      '<rect x="2" y="13" width="9" height="9" rx="2.5" fill="#FF8A3D"/>' +
      '<rect x="13" y="13" width="9" height="9" rx="2.5" fill="#8B5CF6"/>' +
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

    // Inlined at build time from the providers' official favicons. PNG assets
    // are data URLs; DeepSeek, OpenAI and Gemini are inline SVGs.
    const ICON_ASSETS = {"deepseek":{"kind":"svg","value":"<svg viewBox=\"0 0 50 50\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n\t<path id=\"path\"\n\t\td=\"M48.8354 10.0479C48.3232 9.79199 48.1025 10.2798 47.8032 10.5278C47.7007 10.6079 47.6143 10.7119 47.5273 10.8076C46.7793 11.624 45.9048 12.1597 44.7622 12.0957C43.0923 12 41.666 12.5356 40.4058 13.8398C40.1377 12.2319 39.2476 11.272 37.8926 10.6558C37.1836 10.3359 36.4668 10.0156 35.9702 9.31982C35.6235 8.82373 35.5293 8.27197 35.356 7.72754C35.2456 7.3999 35.1353 7.06396 34.7651 7.00781C34.3633 6.94385 34.2056 7.2876 34.0479 7.57568C33.418 8.75195 33.1733 10.0479 33.1973 11.3599C33.2524 14.312 34.4736 16.6641 36.8999 18.3359C37.1758 18.5278 37.2466 18.7197 37.1597 19C36.9946 19.5757 36.7974 20.1357 36.624 20.7119C36.5137 21.0801 36.3486 21.1597 35.9624 21C34.6309 20.4321 33.481 19.5918 32.4644 18.5757C30.7393 16.8721 29.1792 14.9917 27.2334 13.52C26.7764 13.1758 26.3193 12.856 25.8467 12.5518C23.8618 10.584 26.1069 8.96777 26.627 8.77588C27.1704 8.57568 26.8159 7.8877 25.0591 7.896C23.3022 7.90381 21.6953 8.50391 19.647 9.30371C19.3477 9.42383 19.0322 9.51172 18.7095 9.58398C16.8501 9.22363 14.9199 9.14355 12.9033 9.37598C9.10596 9.80762 6.07275 11.6396 3.84326 14.7681C1.16455 18.5278 0.53418 22.7998 1.30664 27.2559C2.11768 31.9521 4.46582 35.8398 8.07373 38.8799C11.8159 42.0322 16.1255 43.5762 21.041 43.2803C24.0269 43.104 27.3516 42.6963 31.1016 39.4561C32.0469 39.936 33.0396 40.1279 34.686 40.272C35.9546 40.3921 37.1758 40.208 38.1211 40.0078C39.6021 39.688 39.4995 38.2881 38.9639 38.0322C34.623 35.9678 35.5762 36.8081 34.71 36.1279C36.9155 33.4639 40.2402 30.6958 41.54 21.728C41.6426 21.0161 41.5557 20.5679 41.54 19.9917C41.5322 19.6396 41.6108 19.5039 42.0049 19.4639C43.0923 19.3359 44.1479 19.0317 45.1167 18.4878C47.9292 16.9199 49.064 14.3438 49.3315 11.2559C49.3711 10.7837 49.3237 10.2959 48.8354 10.0479ZM24.3262 37.8398C20.1196 34.4639 18.0791 33.3521 17.2358 33.3999C16.4482 33.4482 16.5898 34.3682 16.7632 34.9678C16.9443 35.5601 17.1812 35.9683 17.5117 36.4878C17.7402 36.832 17.8979 37.3442 17.2832 37.728C15.9282 38.584 13.5728 37.4399 13.4624 37.3838C10.7207 35.7358 8.42822 33.5601 6.81348 30.584C5.25342 27.7197 4.34766 24.6479 4.19775 21.3677C4.1582 20.5757 4.38672 20.2959 5.15869 20.1519C6.17529 19.96 7.22314 19.9199 8.23926 20.0718C12.5327 20.7119 16.1885 22.6719 19.2529 25.7759C21.002 27.5439 22.3252 29.6558 23.6885 31.7202C25.1377 33.9121 26.6978 36 28.6831 37.7119C29.3843 38.312 29.9434 38.7681 30.479 39.104C28.8643 39.2881 26.1699 39.3281 24.3262 37.8398ZM26.3433 24.6001C26.3433 24.248 26.6191 23.9678 26.9658 23.9678C27.0444 23.9678 27.1152 23.9839 27.1782 24.0078C27.2651 24.04 27.3438 24.0879 27.4067 24.1602C27.5171 24.272 27.5801 24.4321 27.5801 24.6001C27.5801 24.9521 27.3042 25.2319 26.9575 25.2319C26.6108 25.2319 26.3433 24.9521 26.3433 24.6001ZM32.6064 27.8799C32.2046 28.0479 31.8027 28.1919 31.4165 28.208C30.8179 28.2397 30.1641 27.9922 29.8096 27.688C29.2583 27.2158 28.8643 26.9521 28.6987 26.1279C28.6279 25.7759 28.6675 25.2319 28.7305 24.9199C28.8721 24.248 28.7144 23.8159 28.2495 23.4238C27.8716 23.104 27.3911 23.0161 26.8633 23.0161C26.666 23.0161 26.4849 22.9277 26.3511 22.856C26.1304 22.7441 25.9492 22.4639 26.1226 22.1201C26.1777 22.0078 26.4458 21.7358 26.5088 21.688C27.2256 21.272 28.0527 21.4077 28.8169 21.7197C29.5259 22.0161 30.0615 22.5601 30.834 23.3281C31.6216 24.2559 31.7632 24.5117 32.2124 25.208C32.5669 25.752 32.8901 26.312 33.1104 26.9521C33.2446 27.3521 33.0713 27.6802 32.6064 27.8799Z\"\n\t\tfill=\"#4D6BFE\" fill-opacity=\"1.000000\" fill-rule=\"nonzero\" />\n</svg>"},"qwen":{"kind":"png","value":"data:image/png;base64,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"},"doubao":{"kind":"png","value":"data:image/png;base64,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"},"kimi":{"kind":"png","value":"data:image/png;base64,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"},"zhipu":{"kind":"png","value":"data:image/png;base64,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"},"yuanbao":{"kind":"png","value":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAABIdJREFUeAHFWUFsG0UUfetElACV3IAq0QqxUhACqai2SqqeyPoEt8Y3enKCxAkkbyTuse9IXh96tn2Bo8OxpzhckJpU2YoKAQKxFTQVEUVbgRqomrr/7a4dez3eXbuO86RZT2ZmZ97+/+f/mR8N42LbNOSZgYYlKRm0kZa/00GvK8XxShu35beFRauFMaCNNHrXTOMpirKo2UMm6UoOSDSFMrKWk/y15MTWA2LPDw31pETjCe6sFYF2CaNKLH5lR55lXLLqUcNSUZ24ZVb0U2csTJoc0YYupcY1ooapJUiVHqK5nL5g2I/24Dz+G8cMGzPIicrdcIdagofY1E/NG1fT702DHJGhQFQdgwR9kWcK84t4+OQAU4ShUnc/wVvmCneqSA+lcx/BPriHqYJeYts01QR3TV2e66waryzgxKAJB+6BAEcEfT+ns1o8u+Q1pWfmcALwfW4AnyCl18YKq1Rv5qXzXjM3ycRWnZ2Tuc94v7GgqgMpznoNPYwzc+e644zTb3mEnf/H28nG6QUUXr2MZfnQXm3Yj+6h/uAmvnl4Z/jcT7yoVeqo2DgieL5vXO3NaxgVlFJz4RNsvv05VoRg2FSoIeuNvPR/5pFXQpOYL5gJTiXdncMJOyomKEFi699fkQQc/907Jq68rMeOJfGP57O4fbCHH//bD3e/iE+vbFGCRtxEdDk1/VqXrHIxkdr66x9i990voL8wj1HAuYdsyMysiPIiEoCSZdlwv8fWP790fSTJXBSJq1SZFHzPPPsBSvdvhLsMbhK9t8U9jI4etJmO3di2DXfPhWEsDR3PMbquI52OPm8UXrs8SFCElwoTTBp7LctCNptFLpdDuVxWjmE7x+Tz+dj5qAmFBtIk2PdpthhsEjQajW69Xq8P9DuOg1Kp5NVd10USDCPYh5bYV5yaw4uqCFCyHTSbTSSBSnskODB746+bGAVhgpQeC5HJZDwbjMOQg4mbEkMcIGjtf4tREN4AJLS8vOwvLJukWq3GzsHoooCTkrhnD7SKqKv7W4hCr1QopTBqtVp3DDdUHMp7NwYb27hLgkomJXkhakdXKpWu+orF4kA/pUrb45hCoYBIcveHrmVrXqjTsKnqZchjZDhONB5sY8X5St3ZRi4V3PiVfoB2sep8jeNCVWx9KDleS4Wb72baGGrFPBblfr4+0csT3djaHxswf490Py0+fIKziLRi+sbcT9dFHaO5HxUYy7M/fAnrz+hN6GUe0Hsv3jFJsogY8BDLUwt/k4IS48dtuHe8j40FUyOXrFW/2oF/Wf8NCbMIjJ0keTV9oRtHeRwjGVeuq3S8d8UsSIq2nCQ6BeQckV6uk7fpzyzwyqehgpOEhtXefE1/LF70PGq82z8+VMPJJHVuZsekXzQwXdh438qGG9W5mRnkvRemh5aXPFIgOj+YcGc/J6oiuaGJ0ej8IF+k0frJxknDlQCxFkWOSJoC1sUFlaRWwGRQFZWWVPnAMEZNovtEmdlv999lEsD1QiqjVgJi4xHshX/hN4Jrqx6Uo39DaB4hOzjO2eP+G+IZG4OlRk0WCeAAAAAASUVORK5CYII="},"openai":{"kind":"svg","value":"<svg fill=\"currentColor\" role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z\"/></svg>"},"gemini":{"kind":"svg","value":"<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"#4285F4\" d=\"M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81\"/></svg>"}};

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
        id: "yuanbao",
        origin: "https://yuanbao.tencent.com",
        url: "https://yuanbao.tencent.com/",
        accent: "#16C06A",
        ...ICON_ASSETS.yuanbao,
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
    ];

    const PROVIDER_BY_ID = new Map(PROVIDERS.map((provider) => [provider.id, provider]));

    const MESSAGES = {
      zh: {
        "tab.title": "网页版 AI",
        "guide.title": "网页版 AI",
        "guide.description":
          "在侧栏里切换 DeepSeek、千问、豆包、Kimi、智谱清言、腾讯元宝、ChatGPT 和 Gemini。",
        "action.open": "打开网页版 AI",
        "action.reload": "重新加载",
        "action.openExternal": "在浏览器中打开",
        "action.retry": "重试",
        "toolbar.label": "网页版 AI 网站",
        "status.loading": "正在载入 {name}…",
        "status.errorTitle": "无法打开 {name}",
        "status.unsupported": "当前环境不支持内嵌网页。",
        "status.openFailed": "内置浏览器没有返回页面。",
        "command.noSession": "先打开一个会话",
        "provider.deepseek": "DeepSeek",
        "provider.qwen": "通义千问",
        "provider.doubao": "豆包",
        "provider.kimi": "Kimi",
        "provider.zhipu": "智谱清言",
        "provider.yuanbao": "腾讯元宝",
        "provider.chatgpt": "ChatGPT",
        "provider.gemini": "Gemini",
      },
      en: {
        "tab.title": "Web AI",
        "guide.title": "Web AI",
        "guide.description":
          "Switch between DeepSeek, Qwen, Doubao, Kimi, Zhipu, Yuanbao, ChatGPT and Gemini in the sidebar.",
        "action.open": "Open Web AI",
        "action.reload": "Reload",
        "action.openExternal": "Open in browser",
        "action.retry": "Retry",
        "toolbar.label": "Web AI sites",
        "status.loading": "Loading {name}…",
        "status.errorTitle": "Could not open {name}",
        "status.unsupported": "Embedded web pages are not supported in this environment.",
        "status.openFailed": "The embedded browser did not return a page.",
        "command.noSession": "Open a session first",
        "provider.deepseek": "DeepSeek",
        "provider.qwen": "Qwen",
        "provider.doubao": "Doubao",
        "provider.kimi": "Kimi",
        "provider.zhipu": "Zhipu",
        "provider.yuanbao": "Yuanbao",
        "provider.chatgpt": "ChatGPT",
        "provider.gemini": "Gemini",
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

    function readLastProvider() {
      const stored = readHostStorage(LAST_PROVIDER_KEY);
      if (stored !== null && PROVIDER_BY_ID.has(stored)) return stored;
      return DEFAULT_PROVIDER_ID;
    }

    function writeLastProvider(providerId) {
      if (!PROVIDER_BY_ID.has(providerId)) return;
      writeHostStorage(LAST_PROVIDER_KEY, providerId);
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
        const name = provider ? t("provider." + provider.id) : t("tab.title");
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

      const name = t("provider." + provider.id);
      const isReady = status.kind === "ready";
      const isError = status.kind === "error";
      const detail =
        isError && typeof status.detail === "string" && status.detail !== ""
          ? status.detail
          : isError
            ? status.message
            : "";
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
        const [initialProvider] = React.useState(() => readLastProvider());
        const [active, setActive] = React.useState(initialProvider);
        const [visited, setVisited] = React.useState(() => new Set([initialProvider]));
        const paneApis = React.useRef(new Map());
        const activeProvider = PROVIDER_BY_ID.get(active) ?? PROVIDERS[0];

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
          if (!PROVIDER_BY_ID.has(id)) return;
          setActive(id);
          writeLastProvider(id);
          setVisited((previous) => {
            if (previous.has(id)) return previous;
            const next = new Set(previous);
            next.add(id);
            return next;
          });
        };
        const registerPane = React.useCallback((id, api) => {
          if (api === null) paneApis.current.delete(id);
          else paneApis.current.set(id, api);
        }, []);
        const reload = () => {
          paneApis.current.get(active)?.reload();
        };
        const openExternal = () => {
          openProviderInBrowser(activeProvider);
        };

        const providerButtons = PROVIDERS.map((provider) => {
          const name = t("provider." + provider.id);
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

        const panes = PROVIDERS.filter((provider) => visited.has(provider.id)).map((provider) =>
          React.createElement(ProviderPane, {
            key: provider.id,
            provider,
            active: provider.id === active,
            ctx,
            t,
            onApi: registerPane,
          }),
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
            ),
          ),
          React.createElement("div", { className: STAGE_CLASS }, panes),
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
      const fallbackProvider = () => PROVIDER_BY_ID.get(readLastProvider()) ?? PROVIDERS[0];
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
