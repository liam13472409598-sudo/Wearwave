const screens = ['guideScreen', 'cameraScreen', 'confirmScreen', 'analysisScreen', 'resultsScreen'];

const i18n = {
  zh: {
    ready:'灵感引擎已就绪', account:'登录', logout:'退出登录', loginTitle:'登录 WEARWAVE', registerTitle:'创建 WEARWAVE 账号', loginSub:'登录后，你的收藏会在不同设备间同步。', registerSub:'创建账号后，你的收藏会在不同设备间同步。', emailLabel:'邮箱', passwordLabel:'密码', loginAction:'登录', registerAction:'注册', noAccount:'还没有账号？', hasAccount:'已经有账号？', authRequired:'请先登录后再保存灵感', authSuccess:'登录成功', registerSuccess:'账号创建成功', authError:'操作失败，请检查输入后重试', captureGuide:'拍摄指南', guideLede:'拍下你的单品。WEARWAVE 会从真实街头风格中，找到下一套适合你的穿搭参考。', startCamera:'开始拍摄', uploadInstead:'从电脑上传', noteLight:'光线明亮', noteBackground:'背景干净', noteComplete:'单品完整入镜', footerLine:'为好奇的穿衣者而做', cameraReady:'相机已准备', cameraCapturing:'正在拍摄', cameraSelected:'已选择示例单品', noResults:'没有符合条件的穿搭', captureAgain:'重新选择单品',
    heroTitle:'拍下单品，<br><em>找到合适的穿法。</em>', confirmTitle:'你的单品<br><em>已经被看见。</em>', analysisTitle:'正在读取你的<br><em>风格信号。</em>', resultsTitle:'找到你的<br><em>灵感。</em>',
    lookTitle0:'黑色牛仔裤的<br><em>城市夜行。</em>', lookTitle1:'用一点旧时光，<br><em>重写今天。</em>', lookTitle2:'不按规则穿，<br><em>才像你。</em>', lookTitle3:'少一点，<br><em>更有重量。</em>',
    match94:'匹配 94%', match91:'匹配 91%', match88:'匹配 88%', match84:'匹配 84%', itemTop:'上衣', itemPants:'裤子', itemCap:'帽子', visualStamp:'找<br>到<br>灵感', back:'返回', captureCounter:'拍摄 / 01', centerItem:'将单品放在框内', cameraReady:'相机已准备', cameraTip:'建议单独拍摄一件单品，轮廓越清晰，匹配越准确。', retake:'重新拍摄', itemCounter:'你的单品 / 01', imageItem:'你的单品 / 01', looksLike:'识别结果', confirmSub:'点击任意标签，调整 WEARWAVE 对这件单品的理解。', colorLabel:'颜色', materialLabel:'材质', fitLabel:'版型', typeLabel:'品类', editLabel:'编辑', findLooks:'确认，寻找穿搭', matchEngine:'匹配引擎', stepIdentify:'识别单品轮廓', stepMaterial:'分析颜色与材质', stepMatch:'匹配街头风格', stepFind:'寻找你的下一套', now:'现在', next:'接下来', done:'完成', matchesFor:'匹配结果', itemName:'黑色牛仔宽腿裤', waveWord:'灵感。', looksFound:'找到 04 套穿搭', filter:'筛选', exploreStyle:'探索风格', allStyle:'全部', streetStyle:'街头', vintageStyle:'复古', y2kStyle:'Y2K', minimalStyle:'极简', outdoorStyle:'户外', streetLabel:'街头', vintageLabel:'复古', y2kLabel:'Y2K', minimalLabel:'极简', saveInspo:'保存灵感', viewPost:'查看原帖', yourItem:'你的单品', modalDescription:'这套穿搭从黑色牛仔的宽松轮廓出发，用短款夹克和银色细节把比例拉回城市节奏。', openPost:'打开 Instagram 原帖 ↗', saved:'已保存', savedToast:'已保存到我的灵感', removedToast:'已取消保存', demoSelected:'已选择示例单品', switchedEnglish:'已切换为英文', switchedChinese:'已切换为中文', tagColorValue:'黑色', tagMaterialValue:'牛仔', tagFitValue:'宽腿', tagTypeValue:'裤子', collapseItem:'收起单品'
  },
  en: {
    ready:'Inspiration engine ready', account:'LOG IN', logout:'LOG OUT', loginTitle:'Log in to WEARWAVE', registerTitle:'Create a WEARWAVE account', loginSub:'Save inspiration and sync it across devices.', registerSub:'Create an account to sync saved inspiration across devices.', emailLabel:'EMAIL', passwordLabel:'PASSWORD', loginAction:'LOG IN', registerAction:'SIGN UP', noAccount:'New to WEARWAVE?', hasAccount:'Already have an account?', authRequired:'Log in to save inspiration', authSuccess:'Logged in', registerSuccess:'Account created', authError:'Something went wrong. Check your details and try again.', captureGuide:'CAPTURE GUIDE', guideLede:'Capture your item. WEARWAVE finds your next outfit reference from real street style.', startCamera:'Start camera', uploadInstead:'Upload from computer', noteLight:'Bright light', noteBackground:'Clean background', noteComplete:'Item in full frame', footerLine:'Made for curious dressers', cameraReady:'Camera ready', cameraCapturing:'Capturing', cameraSelected:'Demo item selected', noResults:'No looks match this filter', captureAgain:'Choose another item',
    heroTitle:'Photograph an item,<br><em>find a better way to wear it.</em>', confirmTitle:'Your item<br><em>has been seen.</em>', analysisTitle:'Reading your<br><em>style signal.</em>', resultsTitle:'Find your<br><em>wave.</em>',
    lookTitle0:'Black denim,<br><em>after dark.</em>', lookTitle1:'A little history,<br><em>rewritten for today.</em>', lookTitle2:'Dress outside<br><em>the rules.</em>', lookTitle3:'Less,<br><em>with more weight.</em>',
    match94:'MATCH 94%', match91:'MATCH 91%', match88:'MATCH 88%', match84:'MATCH 84%', itemTop:'TOPS', itemPants:'BOTTOMS', itemCap:'HEADWEAR', visualStamp:'FIND<br>YOUR<br>WAVE', back:'Back', captureCounter:'CAPTURE / 01', centerItem:'Place item inside frame', cameraReady:'Camera ready', cameraTip:'Capture one item at a time. Clear silhouettes create better matches.', retake:'Retake', itemCounter:'YOUR ITEM / 01', imageItem:'YOUR ITEM / 01', looksLike:'LOOKS LIKE', confirmSub:'Tap any tag to adjust how WEARWAVE sees your item.', colorLabel:'COLOR', materialLabel:'MATERIAL', fitLabel:'FIT', typeLabel:'TYPE', editLabel:'EDIT', findLooks:'Confirm and find looks', matchEngine:'MATCH ENGINE', stepIdentify:'Reading item silhouette', stepMaterial:'Analyzing color and material', stepMatch:'Matching street style', stepFind:'Finding your next look', now:'NOW', next:'NEXT', done:'DONE', matchesFor:'MATCHES FOR', itemName:'BLACK WIDE-LEG JEANS', waveWord:'wave.', looksFound:'04 looks found', filter:'FILTER', exploreStyle:'EXPLORE STYLE', allStyle:'ALL', streetStyle:'STREET', vintageStyle:'VINTAGE', y2kStyle:'Y2K', minimalStyle:'MINIMAL', outdoorStyle:'OUTDOOR', streetLabel:'STREET', vintageLabel:'VINTAGE', y2kLabel:'Y2K', minimalLabel:'MINIMAL', saveInspo:'Save inspiration', viewPost:'View post', yourItem:'YOUR ITEM', modalDescription:'This look starts with the relaxed shape of black denim, then brings the proportions back into the city rhythm with a cropped jacket and silver details.', openPost:'Open Instagram post ↗', saved:'Saved', savedToast:'Saved to My inspiration', removedToast:'Removed from saved', demoSelected:'Demo item selected', switchedEnglish:'Switched to English', switchedChinese:'Switched to Chinese', tagColorValue:'BLACK', tagMaterialValue:'DENIM', tagFitValue:'WIDE-LEG', tagTypeValue:'BOTTOMS', collapseItem:'Collapse item'
  }
};

const lookData = [
  { id:'street-night', styleKey:'street', styleZh:'街头', styleEn:'STREET', titleZh:'城市夜行。', titleEn:'City after dark.', creator:'@kai.makes', location:'New York, NY', image:'image-look-one', avatar:'avatar-one' },
  { id:'vintage-history', styleKey:'vintage', styleZh:'复古', styleEn:'VINTAGE', titleZh:'用一点旧时光，重写今天。', titleEn:'Rewrite today with a little history.', creator:'@mila.archive', location:'London, UK', image:'image-look-two', avatar:'avatar-two' },
  { id:'y2k-rules', styleKey:'y2k', styleZh:'Y2K', styleEn:'Y2K', titleZh:'不按规则穿，才像你。', titleEn:'The rules are not the look.', creator:'@nora.form', location:'Seoul, KR', image:'image-look-three', avatar:'avatar-three' },
  { id:'minimal-weight', styleKey:'minimal', styleZh:'极简', styleEn:'MINIMAL', titleZh:'少一点，更有重量。', titleEn:'Less, with more weight.', creator:'@soren.studio', location:'Copenhagen, DK', image:'image-look-four', avatar:'avatar-four' }
];

const state = {
  language: 'zh',
  selectedFilter: 'all',
  saved: new Set(),
  tags: {},
  analysisTimer: null,
  analysisFinishTimer: null,
  modalIndex: null,
  cameraBusy: false,
  uploadedAsset: null,
  user: null,
  authMode: 'login',
  authModalOpen: false
};

const clientId = localStorage.getItem('wearwave-client-id') || crypto.randomUUID();
localStorage.setItem('wearwave-client-id', clientId);

const api = {
  async auth(path, body) {
    const response = await fetch(`/api/auth/${path}`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'auth_failed');
    return result;
  },
  async me() {
    const response = await fetch('/api/auth/me');
    return response.json();
  },
  async health() {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error('health_failed');
    return response.json();
  },
  async analyze(tags, assetId = null) {
    const response = await fetch('/api/analyze', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ tags, assetId }) });
    if (!response.ok) throw new Error('analysis_failed');
    return response.json();
  },
  async upload(file) {
    const body = new FormData();
    body.append('image', file);
    const response = await fetch('/api/uploads', { method:'POST', body });
    if (!response.ok) throw new Error('upload_failed');
    return response.json();
  },
  async save(lookId, saved) {
    if (!state.user) throw new Error('authentication_required');
    const response = await fetch(`/api/saves/${lookId}`, { method: saved ? 'POST' : 'DELETE', headers: { 'x-client-id': clientId } });
    if (!response.ok) throw new Error('save_failed');
    return response.json();
  },
  async loadSaves() {
    const response = await fetch('/api/saves', { headers: { 'x-client-id': clientId } });
    if (!response.ok) throw new Error('saves_failed');
    return response.json();
  },
  async logout() {
    const response = await fetch('/api/auth/logout', { method:'POST' });
    if (!response.ok) throw new Error('logout_failed');
    return response.json();
  }
};

const $ = id => document.getElementById(id);
const t = key => i18n[state.language][key] || key;

function showScreen(id) {
  if (id !== 'analysisScreen') stopAnalysis();
  screens.forEach(screen => $(screen).classList.toggle('active-screen', screen === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-state]').forEach(el => { el.textContent = t(el.dataset.state); });
  document.querySelectorAll('[data-i18n-value]').forEach(el => { if (!el.closest('input')) el.textContent = t(el.dataset.i18nValue); });
  document.querySelectorAll('.tag-value').forEach(el => { const tag = el.closest('.editable-tag'); const key = tag?.dataset.tagKey; if (key && Object.prototype.hasOwnProperty.call(state.tags, key)) el.textContent = state.tags[key]; });
  document.querySelectorAll('.save-button').forEach(updateSaveButton);
  $('languageButton').textContent = state.language === 'zh' ? 'EN' : '中';
  document.documentElement.lang = state.language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  updateFilterResultCount();
  if (state.modalIndex !== null) renderModal(state.modalIndex);
  renderAuthModal();
}

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function openDemoConfirmation(message = null) {
  if (message) toast(message);
  showScreen('confirmScreen');
}

function openFilePicker() {
  $('fileInput').click();
}

async function handleFile(file) {
  if (!file) return;
  if (!state.user) {
    toast(t('authRequired'));
    openAuth();
    return;
  }
  if (!file.type.startsWith('image/')) {
    toast(state.language === 'zh' ? '请选择图片文件' : 'Choose an image file');
    return;
  }
  resetTags();
  try {
    const result = await api.upload(file);
    state.uploadedAsset = result.asset;
    document.querySelectorAll('.item-photo').forEach(el => { el.style.backgroundImage = `url(${result.asset.url})`; });
    toast(state.language === 'zh' ? '图片已上传' : 'Image uploaded');
    showScreen('confirmScreen');
  } catch (error) {
    toast(state.language === 'zh' ? '上传失败，请重试' : 'Upload failed, please try again');
  }
}

function setCameraStatus(key) {
  const status = $('cameraStatus');
  if (status) status.textContent = t(key);
}

function resetCameraStatus() {
  state.cameraBusy = false;
  $('cameraFrame')?.classList.remove('is-capturing');
  setCameraStatus('cameraReady');
}

function resetTags() {
  state.tags = {};
  const valueKeys = { color:'tagColorValue', material:'tagMaterialValue', fit:'tagFitValue', type:'tagTypeValue' };
  document.querySelectorAll('.editable-tag').forEach(tag => {
    const input = tag.querySelector('input');
    const value = input || tag.querySelector('.tag-value');
    if (input) {
      const span = document.createElement('span');
      span.className = 'tag-value';
      input.replaceWith(span);
    }
    const valueEl = tag.querySelector('.tag-value');
    if (valueEl) valueEl.dataset.i18nValue = valueKeys[tag.dataset.tagKey];
  });
  applyLanguage();
}

function stopAnalysis() {
  clearInterval(state.analysisTimer);
  clearTimeout(state.analysisFinishTimer);
  state.analysisTimer = null;
  state.analysisFinishTimer = null;
}

function setAnalysisStep(index) {
  const steps = [...document.querySelectorAll('.analysis-step')];
  steps.forEach((step, stepIndex) => {
    const stateEl = step.querySelector('.step-state');
    step.classList.toggle('current', stepIndex === index && index < steps.length);
    stateEl.dataset.state = stepIndex < index ? 'done' : stepIndex === index ? 'now' : 'next';
  });
}

function runAnalysis() {
  stopAnalysis();
  const bar = $('analysisBar');
  state.analysisIndex = 0;
  bar.style.width = '5%';
  setAnalysisStep(0);
  applyLanguage();

  state.analysisTimer = setInterval(() => {
    state.analysisIndex += 1;
    bar.style.width = `${Math.min(state.analysisIndex * 25, 100)}%`;
    setAnalysisStep(state.analysisIndex);
    applyLanguage();
    if (state.analysisIndex >= 4) {
      stopAnalysis();
      state.analysisFinishTimer = setTimeout(async () => {
        try {
          await api.analyze(state.tags, state.uploadedAsset?.id || null);
          showScreen('resultsScreen');
        } catch (error) {
          toast(state.language === 'zh' ? '分析服务暂时不可用，已载入示例结果' : 'Analysis service unavailable. Demo results loaded.');
          showScreen('resultsScreen');
        }
      }, 450);
    }
  }, 700);
}

function updateSaveButton(button) {
  const index = Number(button.closest('.look-card')?.dataset.index);
  const saved = state.saved.has(index);
  button.classList.toggle('saved', saved);
  const icon = button.querySelector('span:first-child');
  const label = button.querySelector('span:last-child');
  if (icon) icon.textContent = saved ? '♥' : '♡';
  if (label) label.textContent = saved ? t('saved') : t('saveInspo');
  button.setAttribute('aria-pressed', String(saved));
}

function updateFilterResultCount() {
  const count = state.selectedFilter === 'all' ? lookData.length : lookData.filter(item => item.styleKey === state.selectedFilter).length;
  const resultText = state.language === 'zh' ? `找到 ${String(count).padStart(2, '0')} 套穿搭` : `${String(count).padStart(2, '0')} looks found`;
  const counter = document.querySelector('[data-i18n="looksFound"]');
  if (counter) counter.textContent = resultText;
}

function applyFilter(selected) {
  state.selectedFilter = selected;
  document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.toggle('active', chip.dataset.styleKey === selected));
  document.querySelectorAll('.look-card').forEach(card => {
    const visible = selected === 'all' || card.dataset.styleKey === selected;
    card.style.display = visible ? 'grid' : 'none';
  });
  $('resultEmpty')?.classList.toggle('hidden', countVisibleCards() > 0);
  updateFilterResultCount();
}

function countVisibleCards() {
  return [...document.querySelectorAll('.look-card')].filter(card => card.style.display !== 'none').length;
}

function startTagEdit(tag) {
  if (tag.querySelector('input')) return;
  const key = tag.dataset.tagKey;
  const valueEl = tag.querySelector('.tag-value');
  const original = Object.prototype.hasOwnProperty.call(state.tags, key) ? state.tags[key] : valueEl.textContent;
  const input = document.createElement('input');
  input.value = original;
  input.setAttribute('aria-label', tag.querySelector('.tag-label')?.textContent || 'Edit tag');
  valueEl.replaceWith(input);
  input.focus();
  input.select();

  const finish = cancelled => {
    const nextValue = cancelled ? original : input.value.trim() || original;
    state.tags[key] = nextValue;
    const span = document.createElement('span');
    span.className = 'tag-value';
    span.textContent = nextValue;
    input.replaceWith(span);
  };
  input.addEventListener('blur', () => finish(false), { once: true });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') input.blur();
    if (event.key === 'Escape') finish(true);
  });
}

function renderModal(index) {
  const data = lookData[index];
  if (!data) return;
  $('modalStyle').textContent = state.language === 'zh' ? data.styleZh : data.styleEn;
  $('modalTitle').textContent = state.language === 'zh' ? data.titleZh : data.titleEn;
  $('modalCreator').textContent = data.creator;
  $('modalLocation').textContent = data.location;
  $('modalImage').className = `modal-image ${data.image}`;
  $('modalAvatar').className = `avatar ${data.avatar}`;
}

function openModal(index) {
  state.modalIndex = index;
  renderModal(index);
  $('detailModal').classList.add('open');
  $('modalClose').focus();
}

function closeModal() {
  $('detailModal').classList.remove('open');
  state.modalIndex = null;
}

function renderAuthModal() {
  const register = state.authMode === 'register';
  $('accountButtonLabel').textContent = state.user ? t('logout') : t('account');
  $('authTitle').textContent = state.user ? (state.language === 'zh' ? '已登录 WEARWAVE' : 'WEARWAVE account') : t(register ? 'registerTitle' : 'loginTitle');
  $('authSubmitLabel').textContent = t(register ? 'registerAction' : 'loginAction');
  $('authSwitchPrompt').textContent = t(register ? 'hasAccount' : 'noAccount');
  $('authModeButton').textContent = t(register ? 'loginAction' : 'registerAction');
  $('authForm').classList.toggle('hidden', Boolean(state.user));
  $('authSwitchPrompt').parentElement.classList.toggle('hidden', Boolean(state.user));
  $('authError').textContent = '';
  document.querySelector('.auth-sub').textContent = t(register ? 'registerSub' : 'loginSub');
  $('authModal').classList.toggle('open', Boolean(state.authModalOpen));
}

function openAuth() {
  if (state.user) {
    api.logout().then(() => { state.user = null; state.saved.clear(); renderAuthModal(); applyLanguage(); toast(t('logout')); }).catch(() => toast(t('authError')));
    return;
  }
  state.authModalOpen = true;
  renderAuthModal();
  $('authEmail').focus();
}

function closeAuth() {
  state.authModalOpen = false;
  renderAuthModal();
}

async function submitAuth(event) {
  event.preventDefault();
  const error = $('authError');
  error.textContent = '';
  try {
    const result = await api.auth(state.authMode === 'register' ? 'register' : 'login', { email:$('authEmail').value, password:$('authPassword').value });
    state.user = result.user;
    state.authModalOpen = false;
    renderAuthModal();
    await hydrateSaves();
    toast(t(state.authMode === 'register' ? 'registerSuccess' : 'authSuccess'));
  } catch (requestError) {
    error.textContent = t('authError');
  }
}

async function hydrateSaves() {
  try {
    const result = await api.loadSaves();
    state.saved.clear();
    (result.lookIds || []).forEach(id => {
      const index = lookData.findIndex(look => look.id === id);
      if (index >= 0) state.saved.add(index);
    });
    document.querySelectorAll('.save-button').forEach(updateSaveButton);
  } catch (_) {}
}

$('startCameraButton').addEventListener('click', () => { resetTags(); resetCameraStatus(); showScreen('cameraScreen'); });
$('uploadButton').addEventListener('click', openFilePicker);
$('cameraUploadButton').addEventListener('click', () => { resetTags(); setCameraStatus('cameraSelected'); openDemoConfirmation(t('demoSelected')); });
$('fileInput').addEventListener('change', event => { handleFile(event.target.files?.[0]); event.target.value = ''; });
$('captureButton').addEventListener('click', () => {
  if (state.cameraBusy) return;
  state.cameraBusy = true;
  $('cameraFrame')?.classList.add('is-capturing');
  setCameraStatus('cameraCapturing');
  setTimeout(() => { resetTags(); showScreen('confirmScreen'); }, 280);
});
$('homeButton').addEventListener('click', () => { closeModal(); showScreen('guideScreen'); });
document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => showScreen(button.dataset.back)));
$('languageButton').addEventListener('click', () => {
  state.language = state.language === 'zh' ? 'en' : 'zh';
  applyLanguage();
  toast(state.language === 'zh' ? t('switchedChinese') : t('switchedEnglish'));
});
document.querySelectorAll('.editable-tag').forEach(tag => tag.addEventListener('click', () => startTagEdit(tag)));
$('confirmItemButton').addEventListener('click', () => { showScreen('analysisScreen'); runAnalysis(); });
$('filterButton').addEventListener('click', () => {
  const panel = $('filterPanel');
  panel.classList.toggle('open');
  $('filterButton').setAttribute('aria-expanded', String(panel.classList.contains('open')));
});
document.querySelectorAll('.filter-chip').forEach(chip => chip.addEventListener('click', () => applyFilter(chip.dataset.styleKey)));
$('resetFilterButton').addEventListener('click', () => {
  applyFilter('all');
  $('filterPanel').classList.remove('open');
  $('filterButton').setAttribute('aria-expanded', 'false');
});
document.querySelectorAll('.save-button').forEach(button => button.addEventListener('click', async () => {
  const index = Number(button.closest('.look-card').dataset.index);
  if (!state.user) { toast(t('authRequired')); openAuth(); return; }
  const wasSaved = state.saved.has(index);
  if (wasSaved) state.saved.delete(index); else state.saved.add(index);
  updateSaveButton(button);
  try {
    await api.save(lookData[index].id, !wasSaved);
    toast(wasSaved ? t('removedToast') : t('savedToast'));
  } catch (error) {
    if (wasSaved) state.saved.add(index); else state.saved.delete(index);
    updateSaveButton(button);
    toast(state.language === 'zh' ? '保存服务暂时不可用' : 'Save service unavailable');
  }
}));
document.querySelectorAll('.detail-button').forEach(button => button.addEventListener('click', () => openModal(Number(button.closest('.look-card').dataset.index))));
$('collapseSource').addEventListener('click', () => { $('sourceFloat').classList.add('hidden'); $('reopenSource').classList.remove('hidden'); });
$('reopenSource').addEventListener('click', () => { $('sourceFloat').classList.remove('hidden'); $('reopenSource').classList.add('hidden'); });
$('modalClose').addEventListener('click', closeModal);
$('detailModal').addEventListener('click', event => { if (event.target === $('detailModal')) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && $('detailModal').classList.contains('open')) closeModal(); });

lookData.forEach((item, index) => {
  const card = document.querySelector(`.look-card[data-index="${index}"]`);
  if (card) card.dataset.styleKey = item.styleKey;
});

applyLanguage();
applyFilter('all');
$('accountButton').addEventListener('click', openAuth);
$('authClose').addEventListener('click', closeAuth);
$('authModal').addEventListener('click', event => { if (event.target === $('authModal')) closeAuth(); });
$('authModeButton').addEventListener('click', () => { state.authMode = state.authMode === 'login' ? 'register' : 'login'; renderAuthModal(); });
$('authForm').addEventListener('submit', submitAuth);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && $('authModal').classList.contains('open')) closeAuth(); });
api.me().then(result => { state.user = result.user || null; renderAuthModal(); return hydrateSaves(); }).catch(() => {});
