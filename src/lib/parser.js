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

  return {
    ...snapshot,
    inputs: Array.isArray(snapshot.inputs) ? snapshot.inputs : [],
    folderId,
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

export const createDefaultWorkspace = (nameIndex) => ({
  id: generateId(),
  name: `工作区 ${nameIndex}`,
  inputs: [
    { id: generateId(), text: '', title: '片段 1', isActive: true, tags: [], isTextMode: false, color: 'bg-white', isCollapsed: false, showTitle: false, lang: 'zh' },
    { id: generateId(), text: '', title: '片段 2', isActive: true, tags: [], isTextMode: false, color: 'bg-white', isCollapsed: false, showTitle: false, lang: 'zh' }
  ],
  separator: '\\n\\n',
  isDirty: false
});
