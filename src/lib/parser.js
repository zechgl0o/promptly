// ================= 文本解析与格式化工具 =================

import { generateId } from './constants';

export const removeGarbage = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[\u0336\r]/g, '');
};

export const cleanDataForStorage = (inputsData) => {
  return inputsData.map(i => ({
    id: i.id || generateId(),
    text: i.text || '',
    title: i.title || '',
    isActive: i.isActive !== false,
    isTextMode: i.isTextMode || false,
    color: i.color || 'bg-white',
    isCollapsed: i.isCollapsed || false,
    showTitle: i.showTitle || false,
    lang: i.lang || 'zh',
    tags: (i.tags || []).map(t => ({
      id: t.id,
      text: t.text || '',
      rawText: t.rawText || '',
      delimiter: t.delimiter || '',
      isActive: t.isActive !== false
    }))
  }));
};

export const parseTextToTags = (text) => {
  const cleanText = removeGarbage(text);
  const tokens = cleanText.split(/([,，。\n]+)/);
  const tags = [];
  let pendingPrefix = '';
  for (let i = 0; i < tokens.length; i += 2) {
    const chunk = tokens[i];
    const delim = tokens[i + 1] || '';
    if (chunk.trim().length > 0) {
      let coreText = chunk.trim();
      let isActive = true;
      const strikeMatch = coreText.match(/^~~([\s\S]*)~~$/);
      if (strikeMatch) {
        isActive = false;
        coreText = strikeMatch[1];
      }
      tags.push({
        id: generateId() + '-' + Math.random().toString(36).substr(2, 5),
        text: coreText,
        rawText: pendingPrefix + chunk,
        delimiter: delim,
        isActive: isActive
      });
      pendingPrefix = '';
    } else {
      pendingPrefix += chunk + delim;
    }
  }
  if (pendingPrefix && tags.length > 0) {
    tags[tags.length - 1].delimiter += pendingPrefix;
  }
  return tags;
};

export const syncTextFromTags = (tags) => {
  return tags.map((t, i) => {
    let s = removeGarbage(t.rawText !== undefined ? t.rawText : t.text);
    const match = s.match(/(^\s*)~~([\s\S]*?)~~(\s*$)/);
    const hasStrike = !!match;

    if (t.isActive && hasStrike) {
      s = s.replace(/(^\s*)~~([\s\S]*?)~~(\s*$)/, '$1$2$3');
    } else if (!t.isActive && !hasStrike) {
      const trimMatch = s.match(/(^\s*)([\s\S]*?)(\s*$)/);
      if (trimMatch) {
         s = `${trimMatch[1]}~~${trimMatch[2]}~~${trimMatch[3]}`;
      }
    }
    let d = t.delimiter !== undefined ? t.delimiter : (i < tags.length - 1 ? ', ' : '');
    return s + d;
  }).join('');
};

export const normalizeTagDelimitersForOrder = (tags = []) => {
  if (!Array.isArray(tags) || tags.length === 0) return [];

  return tags.map((tag, index) => {
    const delimiter = typeof tag.delimiter === 'string' ? tag.delimiter : '';

    if (index === tags.length - 1) {
      return { ...tag, delimiter: delimiter.replace(/[,，。\r\n]+$/g, '') };
    }

    if (/[,，。\r\n]/.test(delimiter)) return { ...tag, delimiter };
    return { ...tag, delimiter: `${delimiter}, ` };
  });
};

export const buildOutputTextFromInputs = (inputList = [], separator = '\\n\\n') => {
  const actualSeparator = (separator || '\\n\\n').replace(/\\n/g, '\n');

  return (inputList || [])
    .filter(input => input.isActive !== false)
    .map((input, inputIndex) => {
      const tempTags = input.isTextMode
        ? parseTextToTags(input.text || '')
        : (Array.isArray(input.tags) ? input.tags : parseTextToTags(input.text || ''));

      let joined = tempTags
        .filter(t => t.isActive !== false)
        .map((t, idx, arr) => {
          let s = removeGarbage(t.rawText !== undefined ? t.rawText : t.text).replace(/(^\s*)~~([\s\S]*?)~~(\s*$)/, '$1$2$3');
          if (idx === 0) s = s.trimStart();
          let d = t.delimiter !== undefined ? t.delimiter : (idx < arr.length - 1 ? ', ' : '');
          if (idx === arr.length - 1) d = d.replace(/[,，。\r\n\s]+$/, '');
          return s + d;
        })
        .join('')
        .trim();

      if (joined.length > 0 && input.showTitle) {
        joined = `${input.title || `片段 ${inputIndex + 1}`}\n${joined}`;
      }
      return joined;
    })
    .filter(text => text.length > 0)
    .join(actualSeparator);
};

export const normalizeSnapshotRecord = (snapshot) => {
  const folderId = typeof snapshot.folderId === 'string' && snapshot.folderId.trim()
    ? snapshot.folderId.trim()
    : null;
  const previewImage = snapshot.previewImage?.dataUrl
    ? {
        dataUrl: snapshot.previewImage.dataUrl,
        platform: snapshot.previewImage.platform || '',
      }
    : null;

  return {
    ...snapshot,
    inputs: Array.isArray(snapshot.inputs) ? snapshot.inputs : [],
    folderId,
    previewImage,
  };
};

export const normalizeSavedPromptsList = (list) => (Array.isArray(list) ? list.map(normalizeSnapshotRecord) : []);

export const extractImportedSnapshots = (importedData) => {
  if (Array.isArray(importedData)) return normalizeSavedPromptsList(importedData);
  if (importedData?.type === 'prompt_builder_export_v2' && Array.isArray(importedData.snapshots)) {
    return normalizeSavedPromptsList(importedData.snapshots);
  }
  return [];
};

export const sanitizeInputs = (loadedInputs) => {
  return loadedInputs.map(input => {
    const isTextMode = input.isTextMode || false;
    const color = input.color || 'bg-white';
    const isCollapsed = input.isCollapsed || false;
    const showTitle = input.showTitle || false;
    const lang = input.lang || 'zh';
    
    if (input.tags && Array.isArray(input.tags)) {
      const cleanTags = input.tags.map(t => ({
        ...t,
        text: removeGarbage(t.text),
        rawText: removeGarbage(t.rawText)
      }));
      return { ...input, tags: cleanTags, text: removeGarbage(input.text), isTextMode, color, isCollapsed, showTitle, lang, zhCache: null, enCache: null };
    }
    
    const tags = parseTextToTags(input.text);
    return { ...input, tags, text: removeGarbage(input.text), isTextMode, color, isCollapsed, showTitle, lang, zhCache: null, enCache: null };
  });
};

export const migrateTransConfig = (config) => {
  if (!config) return { activeProvider: 'google', customApis: [] };
  if (config.provider) { 
    const oldCustomApi = (config.apiBase || config.apiKey || config.modelName) ? {
      id: generateId(), name: '自定义大模型 1', apiBase: config.apiBase || '', apiKey: config.apiKey || '', modelName: config.modelName || ''
    } : null;
    return {
      activeProvider: config.provider === 'google' ? 'google' : (oldCustomApi ? oldCustomApi.id : 'google'),
      customApis: oldCustomApi ? [oldCustomApi] : []
    };
  }
  return config;
};

// ================= AI JSON 转换工具 =================

export const AI_JSON_SYSTEM_PROMPT = `你是一个专业的图像生成提示词优化器。用户会给你一段生图提示词，你需要将其转换为结构化的 JSON 格式。

输出格式（严格遵守，只输出JSON，不要其他文字）：
{
  "prompt": [
    { "text": "描述内容", "weight": 1.0, "category": "subject" }
  ],
  "negative_prompt": [
    { "text": "排除内容", "weight": 1.0 }
  ],
  "optimized_text": "优化后的纯文本提示词（带权重括号）"
}

规则：
1. weight 范围 0.5～1.5，1.0 为默认
2. 主体描述权重最高(1.2-1.5)，修饰词默认(1.0)，背景/次要(0.7-0.9)
3. category 可选：subject / quality / style / lighting / composition / color / background
4. 识别并提取 negative 内容（如 low quality, blurry 等）放入 negative_prompt
5. 合并语义重复的描述
6. optimized_text 用 (word:weight) 括号格式，如 (a beautiful girl:1.3), (oil painting:1.0)
7. 只输出 JSON，不要其他文字`;

export const parseAiJsonResponse = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  let jsonStr = raw.trim();
  // 尝试提取 JSON：可能被 ```json ... ``` 包裹
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  // 去掉开头可能的非JSON字符
  const jsonStart = jsonStr.indexOf('{');
  if (jsonStart > 0) jsonStr = jsonStr.substring(jsonStart);
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      prompt: Array.isArray(parsed.prompt) ? parsed.prompt : [],
      negative_prompt: Array.isArray(parsed.negative_prompt) ? parsed.negative_prompt : [],
      optimized_text: parsed.optimized_text || '',
    };
  } catch {
    return null;
  }
};

export const formatJsonAsWeighted = (result) => {
  if (!result) return '';
  return JSON.stringify({ prompt: result.prompt, negative_prompt: result.negative_prompt }, null, 2);
};

export const formatJsonAsBracket = (result) => {
  if (!result) return '';
  if (result.optimized_text) return result.optimized_text;
  const parts = result.prompt.map(p => `(${p.text}:${p.weight})`);
  const negParts = result.negative_prompt.map(p => `(${p.text}:${p.weight})`);
  let output = parts.join(', ');
  if (negParts.length > 0) output += '\n\nNegative: ' + negParts.join(', ');
  return output;
};

export const formatJsonAsStructured = (result) => {
  if (!result) return '';
  const grouped = {};
  result.prompt.forEach(p => {
    const cat = p.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });
  if (result.negative_prompt && result.negative_prompt.length > 0) {
    grouped['negative'] = result.negative_prompt;
  }
  return JSON.stringify(grouped, null, 2);
};

// ================= AI API URL 构建 =================

/**
 * 智能拼接 AI API URL，避免 /chat/completions 重复
 * 用户可能把完整 URL 填入 apiBase（如 https://xxx/v1/chat/completions）
 */
export const buildApiUrl = (apiBase) => {
  const base = apiBase.replace(/\/$/, '');
  if (base.endsWith('/chat/completions')) return base;
  return `${base}/chat/completions`;
};

// ================= AI 提供商预设 =================

export const DEFAULT_GLM_PROVIDER_ID = 'preset-zhipu-glm-free';

export const DEFAULT_GLM_FREE_PROVIDER = {
  id: DEFAULT_GLM_PROVIDER_ID,
  name: '智谱 GLM 免费',
  apiBase: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: '',
  modelName: 'glm-4-flash-250414',
  isPreset: true,
  presetKey: 'zhipu-free',
  modelListUrl: 'https://docs.bigmodel.cn/cn/guide/models/free/glm-4-flash-250414',
  apiPageUrl: 'https://bigmodel.cn/usercenter/proj-mgmt/apikeys',
};

export const createDefaultAiConfig = () => ({
  providers: [{ ...DEFAULT_GLM_FREE_PROVIDER }],
  translationProviderId: 'google',
  conversionProviderId: DEFAULT_GLM_PROVIDER_ID,
});

export const AI_PROVIDER_PRESETS = [
  {
    key: 'deepseek',
    name: 'DeepSeek',
    apiBase: 'https://api.deepseek.com/v1',
    modelName: 'deepseek-chat',
    modelListUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
    apiPageUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    key: 'openrouter',
    name: 'OpenRouter',
    apiBase: 'https://openrouter.ai/api/v1',
    modelName: 'google/gemma-4-31b:free',
    modelListUrl: 'https://openrouter.ai/models',
    apiPageUrl: 'https://openrouter.ai/settings/keys',
  },
  {
    key: 'siliconflow',
    name: '硅基流动',
    apiBase: 'https://api.siliconflow.cn/v1',
    modelName: 'deepseek-ai/DeepSeek-V3',
    modelListUrl: 'https://docs.siliconflow.com/quickstart/models',
    apiPageUrl: 'https://cloud.siliconflow.cn/account/ak',
  },
  {
    key: 'zhipu-free',
    name: '智谱 GLM 免费',
    apiBase: 'https://open.bigmodel.cn/api/paas/v4',
    modelName: 'glm-4-flash-250414',
    modelListUrl: 'https://docs.bigmodel.cn/cn/guide/models/free/glm-4-flash-250414',
    apiPageUrl: 'https://bigmodel.cn/usercenter/proj-mgmt/apikeys',
  },
  {
    key: 'modelscope',
    name: '魔搭社区',
    apiBase: 'https://api-inference.modelscope.cn/v1',
    modelName: 'Qwen/Qwen3.5-35B-A3B',
    modelListUrl: 'https://modelscope.cn/models',
    apiPageUrl: 'https://www.modelscope.cn/my/myaccesstoken',
  },
  {
    key: 'moonshot',
    name: 'Moonshot (Kimi)',
    apiBase: 'https://api.moonshot.cn/v1',
    modelName: 'moonshot-v1-8k',
    modelListUrl: 'https://platform.kimi.ai/docs/models',
    apiPageUrl: 'https://platform.moonshot.cn/console/api-keys',
  },
  {
    key: 'qwen',
    name: '通义千问',
    apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    modelName: 'qwen-turbo',
    modelListUrl: 'https://help.aliyun.com/zh/model-studio/models',
    apiPageUrl: 'https://bailian.console.aliyun.com/?tab=model#/api-key',
  },
];

export const normalizeAiConfig = (config) => {
  const base = config || createDefaultAiConfig();
  const providers = Array.isArray(base.providers) ? [...base.providers] : [];
  const hasDefaultGlm = providers.some(p => p.id === DEFAULT_GLM_PROVIDER_ID || p.presetKey === DEFAULT_GLM_FREE_PROVIDER.presetKey);
  const normalizedProviders = hasDefaultGlm
    ? providers.map(p => (p.id === DEFAULT_GLM_PROVIDER_ID || p.presetKey === DEFAULT_GLM_FREE_PROVIDER.presetKey ? { ...DEFAULT_GLM_FREE_PROVIDER, ...p, id: p.id || DEFAULT_GLM_PROVIDER_ID } : p))
    : [{ ...DEFAULT_GLM_FREE_PROVIDER }, ...providers];

  return {
    ...base,
    providers: normalizedProviders,
    translationProviderId: base.translationProviderId || 'google',
    conversionProviderId: base.conversionProviderId || DEFAULT_GLM_PROVIDER_ID,
  };
};

export const migrateTransConfigToAiConfig = (transConfig) => {
  if (!transConfig) return createDefaultAiConfig();
  // 如果已经是新格式（有 providers 字段），直接补齐默认 GLM 服务后返回
  if (transConfig.providers) return normalizeAiConfig(transConfig);
  // 旧格式迁移
  const providers = (transConfig.customApis || []).map(api => ({
    id: api.id,
    name: api.name || '自定义 API',
    apiBase: api.apiBase || '',
    apiKey: api.apiKey || '',
    modelName: api.modelName || '',
    isPreset: false,
    presetKey: null,
  }));
  return normalizeAiConfig({
    providers,
    translationProviderId: transConfig.activeProvider || 'google',
    conversionProviderId: DEFAULT_GLM_PROVIDER_ID,
  });
};

export const createDefaultWorkspace = (nameIndex) => ({
  id: generateId(),
  name: `工作区 ${nameIndex}`,
  inputs: [
    { id: generateId(), text: '', title: '片段 1', isActive: true, tags: [], isTextMode: true, color: 'bg-white', isCollapsed: false, showTitle: false, lang: 'zh' },
    { id: generateId(), text: '', title: '片段 2', isActive: true, tags: [], isTextMode: true, color: 'bg-white', isCollapsed: false, showTitle: false, lang: 'zh' }
  ],
  separator: '\\n\\n',
  isDirty: false
});
