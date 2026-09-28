(function(){
  const DEMO_CALLED = [
    {patient_profile_id:'P-10432', firstname:'Léa', lastname:'Girard', doctor_name:'Dr. Camille Fabre', patient_commitment_level:'Engagé', days_late:'0', patient_monitoring_url:'#', treatment:'Aligneurs', patient_age:'16', monitoring_start_date:'2026-03-02', last_scan_excl_pending_device_model:'iPhone 13', last_scan_scan_version:'v2', treatment_total_scans:'42'},
    {patient_profile_id:'P-10488', firstname:'Hugo', lastname:'Petit', doctor_name:'Dr. Antoine Morel', patient_commitment_level:'À risque', days_late:'9', patient_monitoring_url:'#', treatment:'Aligneurs', patient_age:'24', monitoring_start_date:'2025-12-11', last_scan_excl_pending_device_model:'Samsung A13', last_scan_scan_version:'v1', treatment_total_scans:'18'},
    {patient_profile_id:'P-10501', firstname:'Manon', lastname:'Roy', doctor_name:'Dr. Camille Fabre', patient_commitment_level:'Faible', days_late:'14', patient_monitoring_url:'#', treatment:'Retenteur', patient_age:'34', monitoring_start_date:'2025-06-20', last_scan_excl_pending_device_model:'Samsung A22', last_scan_scan_version:'v1', treatment_total_scans:'61'},
    {patient_profile_id:'P-10537', firstname:'Nathan', lastname:'Faure', doctor_name:'Dr. Nadia Haddad', patient_commitment_level:'Élevé', days_late:'2', patient_monitoring_url:'#', treatment:'Aligneurs', patient_age:'19', monitoring_start_date:'2026-05-14', last_scan_excl_pending_device_model:'iPhone 14', last_scan_scan_version:'v2', treatment_total_scans:'27'},
    {patient_profile_id:'P-10559', firstname:'Camille', lastname:'Blanc', doctor_name:'Dr. Antoine Morel', patient_commitment_level:'Modéré', days_late:'5', patient_monitoring_url:'#', treatment:'Aligneurs', patient_age:'29', monitoring_start_date:'2026-01-08', last_scan_excl_pending_device_model:'Pixel 7', last_scan_scan_version:'v2', treatment_total_scans:'33'},
    {patient_profile_id:'P-10602', firstname:'Sarah', lastname:'Nguyen', doctor_name:'Dr. Nadia Haddad', patient_commitment_level:'À risque', days_late:'11', patient_monitoring_url:'#', treatment:'Retenteur', patient_age:'41', monitoring_start_date:'2025-09-30', last_scan_excl_pending_device_model:'Samsung A15', last_scan_scan_version:'v1', treatment_total_scans:'54'},
  ];
  const DEMO_SCANNED = [
    {patient_profile_id:'P-10432', monitoring_last_published_scan:'2026-09-05', 'Upload date':'2026-09-05 09:12:00'},
    {patient_profile_id:'P-10537', monitoring_last_published_scan:'2026-09-05', 'Upload date':'2026-09-05 15:47:00'},
    {patient_profile_id:'P-10559', monitoring_last_published_scan:'2026-09-05', 'Upload date':'2026-09-05 20:03:00'},
  ];

  // === i18n — dictionnaires dans i18n.js (window.SRS_I18N). Langue : choix mémorisé, sinon celle
  //     du navigateur (FR si le navigateur est en français, EN sinon). ===
  const I18N = window.SRS_I18N;
  const LANG_STORAGE_KEY = 'src_lang_v1';
  function loadLang(){
    try{ const v = localStorage.getItem(LANG_STORAGE_KEY); return (v === 'en' || v === 'fr') ? v : null; }catch(e){ return null; }
  }
  function saveLang(lang){
    try{ localStorage.setItem(LANG_STORAGE_KEY, lang); }catch(e){}
  }
  let currentLang = loadLang() || ((navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en');

  function i18n(key, params){
    const dict = I18N[currentLang] || I18N.fr;
    let str = (dict && dict[key]) || I18N.fr[key] || key;
    if(params){
      Object.keys(params).forEach(k=>{ str = str.split('{' + k + '}').join(params[k]); });
    }
    return str;
  }
  function dateLocale(){ return currentLang === 'fr' ? 'fr-FR' : 'en-US'; }

  // Deux changelogs dans Documentation : celui de l'app (ex-outil collab, plus récent en premier)
  // et celui de l'outil individuel d'origine, conservé tel quel.
  function renderChangelog(){
    const appList = document.getElementById('appChangelogList');
    if(appList){
      appList.innerHTML = window.SRS_COLLAB_CHANGELOG.map(e=> `<li><span class="changelog-date" style="margin-left:0">${escapeHtml(e.date)}</span><span class="changelog-desc">${escapeHtml(currentLang === 'fr' ? e.fr : e.en)}</span></li>`).join('');
    }
    const list = document.getElementById('changelogList');
    if(list){
      list.innerHTML = window.SRS_TOOL_CHANGELOG.map(e=> `<li><span class="changelog-version">${e.v}</span><span class="changelog-date">${escapeHtml(currentLang === 'fr' ? e.dateFr : e.dateEn)}</span><span class="changelog-desc">${escapeHtml(currentLang === 'fr' ? e.fr : e.en)}</span></li>`).join('');
    }
  }

  const state = { called:null, scanned:null, rows:null, demo:true, sortKey:'priority', sortDir:1, history:[], historyView:null, historySortKey:'date', historySortDir:-1, calledRecovered:false, scannedRecovered:false, aircallCalls:null, aircallRawCalls:null, calledFileMeta:null, scannedFileMeta:null, trendsChannel:'', doctorScope:null };
  const els = {
    file1: document.getElementById('file1'), file2: document.getElementById('file2'),
    dz1: document.getElementById('dz1'), dz2: document.getElementById('dz2'),
    dz1file: document.getElementById('dz1file'), dz2file: document.getElementById('dz2file'),
    runBtn: document.getElementById('runBtn'), runHint: document.getElementById('runHint'),
    resetBtn: document.getElementById('resetBtn'), demoBanner: document.getElementById('demoBanner'),
    tiles: document.getElementById('tiles'), tbody: document.getElementById('tbody'),
    search: document.getElementById('search'), doctorFilter: document.getElementById('doctorFilter'),
    statusFilter: document.getElementById('statusFilter'), resultCount: document.getElementById('resultCount'),
    copyBtn: document.getElementById('copyBtn'), toast: document.getElementById('toast'),
    saveName: document.getElementById('saveName'),
    addHistoryBtn: document.getElementById('addHistoryBtn'), historyBody: document.getElementById('historyBody'),
    historyBanner: document.getElementById('historyBanner'),
    exportHistoryBtn: document.getElementById('exportHistoryBtn'),
    importHistoryBtn: document.getElementById('importHistoryBtn'), importHistoryFile: document.getElementById('importHistoryFile'),
    recoveryBanner: document.getElementById('recoveryBanner'),
    privacyModeToggle: document.getElementById('privacyModeToggle'),
    doctorScopeBanner: document.getElementById('doctorScopeBanner'), doctorScopeBannerLabel: document.getElementById('doctorScopeBannerLabel'),
    exitDoctorScopeBtn: document.getElementById('exitDoctorScopeBtn'),
    historyBannerLabel: document.getElementById('historyBannerLabel'), exitHistoryBtn: document.getElementById('exitHistoryBtn'),
    dailyChart: document.getElementById('dailyChart'), dailyChartWrap: document.getElementById('dailyChartWrap'),
    dailyTooltip: document.getElementById('dailyTooltip'), commitmentBreakdown: document.getElementById('commitmentBreakdown'),
    dailyChartExample: document.getElementById('dailyChartExample'), commitmentLegendExample: document.getElementById('commitmentLegendExample'),
    doctorScorecardSearch: document.getElementById('doctorScorecardSearch'), doctorScorecardList: document.getElementById('doctorScorecardList'),
    doctorScorecard: document.getElementById('doctorScorecard'),
    doctorLeaderboard: document.getElementById('doctorLeaderboard'),
    fileAircall: document.getElementById('fileAircall'), dzAircall: document.getElementById('dzAircall'),
    dzAircallLabel: document.getElementById('dzAircallLabel'), dzAircallFile: document.getElementById('dzAircallFile'),
    aircallBreakdown: document.getElementById('aircallBreakdown'),
    aircallRangeRow: document.getElementById('aircallRangeRow'), aircallRangeStart: document.getElementById('aircallRangeStart'),
    aircallRangeEnd: document.getElementById('aircallRangeEnd'), aircallRangeHint: document.getElementById('aircallRangeHint'),
    aircallFreezeRow: document.getElementById('aircallFreezeRow'), aircallFreezeTarget: document.getElementById('aircallFreezeTarget'),
    aircallFreezeBtn: document.getElementById('aircallFreezeBtn'), aircallFreezeHint: document.getElementById('aircallFreezeHint'),
    aircallPersonalControls: document.getElementById('aircallPersonalControls'),
    calledOverrideInput: document.getElementById('calledOverrideInput'),
    tableScroll: document.getElementById('tableScroll'), expandTableBtn: document.getElementById('expandTableBtn'),
    historyTableScroll: document.getElementById('historyTableScroll'), expandHistoryBtn: document.getElementById('expandHistoryBtn'),
    resultsTable: document.getElementById('resultsTable'), toggleColumnsBtn: document.getElementById('toggleColumnsBtn'),
    headerBrandTitle: document.getElementById('headerBrandTitle'),
    pageTabsRow: document.getElementById('pageTabsRow'),
    pageDashboard: document.getElementById('pageDashboard'), pageTrends: document.getElementById('pageTrends'),
    chartsPanel: document.getElementById('chartsPanel'),
    tabDashboardBtn: document.getElementById('tabDashboardBtn'), tabTrendsBtn: document.getElementById('tabTrendsBtn'),
    docsPanel: document.getElementById('docsPanel'), tabDocsBtn: document.getElementById('tabDocsBtn'),
    pageFiles: document.getElementById('pageFiles'), tabFilesBtn: document.getElementById('tabFilesBtn'),
    pageTeam: document.getElementById('pageTeam'), tabTeamBtn: document.getElementById('tabTeamBtn'),
    pageHome: document.getElementById('pageHome'), tabHomeBtn: document.getElementById('tabHomeBtn'),
    homeTeamBtn: document.getElementById('homeTeamBtn'), homeGreeting: document.getElementById('homeGreeting'),
    importedFilesBody: document.getElementById('importedFilesBody'),
    trendsChannelFilter: document.getElementById('trendsChannelFilter'),
  };

  const ACTIVE_PAGE_STORAGE_KEY = 'src_active_page_v1';
  const PAGES = ['home','dashboard','files','trends','team','docs'];

  // Un vrai rechargement (F5/Cmd+R ou bouton « Actualiser ») restaure l'état mémorisé (page active,
  // fiche docteur...) ; une ouverture fraîche de l'app repart toujours de l'Accueil.
  function isReloadNavigation(){
    try{
      const navEntries = performance.getEntriesByType && performance.getEntriesByType('navigation');
      if(navEntries && navEntries.length) return navEntries[0].type === 'reload';
      if(performance.navigation) return performance.navigation.type === 1;
    }catch(e){}
    return false;
  }

  let activePage = 'home';
  // Page Équipe demandée avant que le rôle soit connu (rechargement pendant la connexion) :
  // on l'affiche dès que le rôle confirme l'accès — voir applyRoleUi().
  let deferredTeamPage = false;
  function setActivePage(page){
    // L'onglet Équipe n'existe que pour les managers et admins : un CX qui y atterrirait (page
    // mémorisée d'une session précédente avec un autre rôle) est renvoyé sur le Dashboard.
    if(page === 'team' && !canSeeTeamTab()){
      if(!poolLoaded) deferredTeamPage = true;
      page = 'dashboard';
    } else if(page !== 'dashboard'){
      deferredTeamPage = false;
    }
    activePage = page;
    if(!deferredTeamPage){ try{ localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, page); }catch(e){ /* full/unavailable — ignore */ } }
    els.pageHome.hidden = page !== 'home';
    // Accueil : pas de barre du haut (seulement les cartes) — elle revient sur toutes les autres pages.
    document.body.classList.toggle('on-home', page === 'home');
    els.tabHomeBtn.classList.toggle('active', page === 'home');
    els.pageDashboard.hidden = page !== 'dashboard';
    els.pageTrends.hidden = page !== 'trends';
    els.docsPanel.hidden = page !== 'docs';
    els.pageFiles.hidden = page !== 'files';
    els.pageTeam.hidden = page !== 'team';
    els.doctorScopeBanner.style.display = (state.doctorScope && page !== 'home') ? 'flex' : 'none';
    els.tabDashboardBtn.classList.toggle('active', page === 'dashboard' || page === 'files');
    els.tabTrendsBtn.classList.toggle('active', page === 'trends');
    els.tabTeamBtn.classList.toggle('active', page === 'team');
    els.tabDocsBtn.classList.toggle('active', page === 'docs');
    els.tabFilesBtn.classList.toggle('active', page === 'files');
    if(page === 'team') renderTeamPage();
  }
  els.tabHomeBtn.addEventListener('click', ()=> setActivePage('home'));
  document.getElementById('homeDashboardBtn').addEventListener('click', ()=> setActivePage('dashboard'));
  document.getElementById('homeTrendsBtn').addEventListener('click', ()=> setActivePage('trends'));
  els.homeTeamBtn.addEventListener('click', ()=> setActivePage('team'));
  document.getElementById('homeDocsBtn').addEventListener('click', ()=> setActivePage('docs'));
  els.tabDashboardBtn.addEventListener('click', ()=> setActivePage('dashboard'));
  els.tabTrendsBtn.addEventListener('click', ()=> setActivePage('trends'));
  els.tabTeamBtn.addEventListener('click', ()=> setActivePage('team'));
  els.tabDocsBtn.addEventListener('click', ()=> setActivePage('docs'));
  els.tabFilesBtn.addEventListener('click', ()=> setActivePage('files'));

  els.trendsChannelFilter.addEventListener('change', ()=>{
    state.trendsChannel = els.trendsChannelFilter.value;
    trendsEntryFilterAnchor = null;
    renderCharts();
  });
  function initialPageFromStorage(){
    try{
      if(isReloadNavigation()){
        const savedPage = localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
        if(PAGES.includes(savedPage)) return savedPage;
      }
    }catch(e){ /* full/unavailable — ignore */ }
    return 'home';
  }

  els.toggleColumnsBtn.addEventListener('click', ()=>{
    const showing = els.resultsTable.classList.toggle('show-extra');
    els.toggleColumnsBtn.textContent = showing ? i18n('fewerColumnsBtn') : i18n('moreColumnsBtn');
  });

  function wireExpandToggle(scrollEl, btnEl){
    btnEl.addEventListener('click', ()=>{
      const isNowCapped = scrollEl.classList.toggle('capped');
      btnEl.textContent = isNowCapped ? i18n('expandListBtn') : i18n('collapseListBtn');
    });
  }
  wireExpandToggle(els.tableScroll, els.expandTableBtn);
  wireExpandToggle(els.historyTableScroll, els.expandHistoryBtn);

  const CALLED_STORAGE_KEY = 'src_called_list_v1';
  const SCANNED_STORAGE_KEY = 'src_scanned_list_v1';
  const AIRCALL_STORAGE_KEY = 'src_aircall_calls_v1';
  const AIRCALL_RANGE_STORAGE_KEY = 'src_aircall_range_v1';
  const CALLED_OVERRIDE_STORAGE_KEY = 'src_called_override_v1';
  const HISTORY_MAX_ENTRIES = 150;
  const CUSTOM_LINKS_STORAGE_KEY = 'src_custom_tool_links_v1';

  // Liens personnels (propres à chaque personne, gardés sur l'appareil) : rangés dans le menu
  // « Liens ▾ » de la barre du haut. Jusqu'à 8 liens.
  const CUSTOM_LINKS_MAX = 8;
  function loadCustomLinks(){
    try{
      const arr = JSON.parse(localStorage.getItem(CUSTOM_LINKS_STORAGE_KEY) || '[]');
      return Array.isArray(arr) ? arr.filter(l=> l && l.url && l.name).slice(0, CUSTOM_LINKS_MAX) : [];
    }catch(e){ return []; }
  }
  let customLinks = loadCustomLinks();
  function saveCustomLinks(){
    try{ localStorage.setItem(CUSTOM_LINKS_STORAGE_KEY, JSON.stringify(customLinks)); }catch(e){ /* full/unavailable — ignore */ }
  }
  function renderCustomLinks(){
    const box = document.getElementById('linksMenuItems');
    box.innerHTML = customLinks.length
      ? customLinks.map((link, i)=> `<div class="menu-link-row">
          <a class="menu-item" href="${escapeAttr(link.url)}" target="_blank" rel="noopener"><span class="menu-icon">↗</span><span>${escapeHtml(link.name)}</span></a>
          <button type="button" class="menu-mini-btn" data-edit-link="${i}" title="${escapeAttr(i18n('editLinkTitle'))}" aria-label="${escapeAttr(i18n('editLinkTitle'))}">✎</button>
        </div>`).join('')
      : `<p class="menu-hint" style="margin:4px 12px 6px;">${escapeHtml(i18n('noLinksYet'))}</p>`;
    document.getElementById('addLinkBtn').hidden = customLinks.length >= CUSTOM_LINKS_MAX;
  }
  // i = index d'un lien existant à modifier, ou customLinks.length pour en ajouter un.
  // Un nom vidé supprime le lien.
  function configureCustomLink(i){
    const current = customLinks[i] || { name:'', url:'' };
    const name = prompt(i18n(customLinks[i] ? 'promptToolNameEdit' : 'promptToolName'), current.name);
    if(name === null) return;
    const trimmedName = name.trim();
    if(!trimmedName){
      if(customLinks[i]) customLinks.splice(i, 1);
      saveCustomLinks();
      renderCustomLinks();
      return;
    }
    let url = prompt(i18n('promptToolUrl'), current.url || 'https://');
    if(url === null) return;
    url = url.trim();
    if(!url) return;
    if(!/^https?:\/\//i.test(url)) url = 'https://' + url;
    customLinks[i] = { name: trimmedName, url };
    saveCustomLinks();
    renderCustomLinks();
  }

  function saveCalledOverride(value, fileMeta){
    try{
      localStorage.setItem(CALLED_OVERRIDE_STORAGE_KEY, JSON.stringify({
        value,
        fileName: fileMeta ? fileMeta.name : null,
        fileCount: fileMeta ? fileMeta.count : null,
      }));
    }catch(e){ /* full/unavailable — ignore */ }
  }

  function loadCalledOverride(){
    try{
      const raw = localStorage.getItem(CALLED_OVERRIDE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }

  function saveFileToStorage(key, filename, rows, dataUrl){
    try{
      localStorage.setItem(key, JSON.stringify({filename, rows, dataUrl, savedAt: new Date().toISOString()}));
    }catch(e){ /* storage unavailable or full — the feature just degrades, nothing else depends on it */ }
  }
  function fileToDataUrl(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = e=> resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  function loadFileFromStorage(key){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }
  function clearFileStorage(key){
    try{ localStorage.removeItem(key); }catch(e){}
  }

  // L'historique n'est plus dans le localStorage : il est enregistré sur le Drive partagé, dans un
  // fichier par personne (voir « Drive : historique personnel » plus bas). saveHistory() garde son
  // nom et ses appels d'origine, mais planifie désormais cette synchronisation.
  function stripMetaDataUrl(meta){
    return meta ? { status: meta.status, name: meta.name, count: meta.count, message: meta.message, sourceFileId: meta.sourceFileId } : meta;
  }

  function saveHistory(){
    scheduleHistorySync();
  }

  function parseCsvFile(file){
    return new Promise((resolve, reject)=>{
      Papa.parse(file, {
        header:true, skipEmptyLines:true,
        transformHeader:h=>h.trim(),
        complete: res => resolve(res.data),
        error: err => reject(err),
      });
    });
  }

  function parseXlsxFile(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = e=>{
        try{
          const wb = XLSX.read(e.target.result, {type:'array'});
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, {defval:'', raw:false});
          resolve(rows.map(row=>{
            const obj = {};
            Object.keys(row).forEach(k=>{ obj[k.trim()] = row[k]; });
            return obj;
          }));
        }catch(err){ reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  function parseFile(file){
    const ext = file.name.split('.').pop().toLowerCase();
    return (ext === 'xlsx' || ext === 'xls') ? parseXlsxFile(file) : parseCsvFile(file);
  }

  function parseCsvRaw(file){
    return new Promise((resolve, reject)=>{
      Papa.parse(file, {
        header:false, skipEmptyLines:true,
        complete: res => resolve(res.data),
        error: err => reject(err),
      });
    });
  }

  function parseXlsxRaw(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = e=>{
        try{
          const wb = XLSX.read(e.target.result, {type:'array'});
          const sheet = wb.Sheets[wb.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json(sheet, {header:1, defval:'', raw:false}));
        }catch(err){ reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  function parseFileRaw(file){
    const ext = file.name.split('.').pop().toLowerCase();
    return (ext === 'xlsx' || ext === 'xls') ? parseXlsxRaw(file) : parseCsvRaw(file);
  }

  function dzLoadedTitle(){ return i18n('dzLoadedTitle'); }

  function setDropzoneLoaded(dz, labelEl, fileEl, file, count){
    dz.classList.remove('error', 'warn');
    dz.classList.add('loaded');
    labelEl.textContent = i18n('dzLoadedLabel');
    fileEl.innerHTML = `<span class="dz-file-name">${escapeHtml(file.name)}</span><span class="dz-file-meta">${i18n('rowsCountPlain', {count})}</span>`;
    dz.title = dzLoadedTitle();
  }

  function setDropzoneWarn(dz, labelEl, fileEl, file, count){
    dz.classList.remove('error', 'loaded');
    dz.classList.add('warn');
    labelEl.textContent = i18n('dzLoadedPartialLabel');
    fileEl.innerHTML = `<span class="dz-file-name">${escapeHtml(file.name)}</span><span class="dz-file-meta">${i18n('rowsCountInferred', {count})}</span>`;
    dz.title = dzLoadedTitle();
  }

  function setDropzoneError(dz, labelEl, fileEl, message){
    dz.classList.remove('loaded', 'warn');
    dz.classList.add('error');
    labelEl.textContent = i18n('dzErrorLabel');
    fileEl.textContent = message;
    dz.title = '';
  }

  function applyDropzoneMeta(dz, labelEl, fileEl, meta){
    dz.classList.remove('loaded', 'warn', 'error');
    if(!meta){
      labelEl.textContent = i18n('dzDefaultLabel');
      fileEl.textContent = '';
      dz.title = '';
      return;
    }
    if(meta.status === 'error'){
      dz.classList.add('error');
      labelEl.textContent = i18n('dzErrorLabel');
      fileEl.textContent = meta.message || '';
      dz.title = '';
      return;
    }
    dz.classList.add(meta.status);
    labelEl.textContent = meta.status === 'warn' ? i18n('dzLoadedPartialLabel') : i18n('dzLoadedLabel');
    fileEl.innerHTML = `<span class="dz-file-name">${escapeHtml(meta.name)}</span><span class="dz-file-meta">${meta.status === 'warn' ? i18n('rowsCountInferred', {count: meta.count}) : i18n('rowsCountPlain', {count: meta.count})}</span>`;
    dz.title = meta.dataUrl ? dzLoadedTitle() : '';
  }

  const ID_HEADER_ALIASES = ['patient_profile_id','patient_id','profile_id','patientid','id_patient'];

  function looksLikePatientId(value){
    const s = String(value||'').trim();
    if(!/^[0-9A-Za-z]{1,8}-[0-9A-Za-z]{2,8}-[0-9A-Za-z]{1,8}$/.test(s)) return false;
    if(!/[A-Za-z]/.test(s)) return false; // exclude pure-numeric shapes like dates (2026-09-06)
    return true;
  }

  function findIdColumnByHeaderAlias(data){
    if(!data.length) return null;
    const keys = Object.keys(data[0]);
    const norm = s => s.toLowerCase().replace(/[\s_-]/g,'');
    for(const alias of ID_HEADER_ALIASES){
      const found = keys.find(k=> norm(k) === norm(alias));
      if(found) return found;
    }
    return null;
  }

  function findIdColumnByValuePattern(data){
    if(!data.length) return null;
    const keys = Object.keys(data[0]).filter(k=> !/doctor/i.test(k));
    let best=null, bestUniqueness=-1;
    for(const key of keys){
      let matches=0, total=0; const seen=new Set();
      for(const row of data){
        const v = row[key];
        if(v){ total++; if(looksLikePatientId(v)){ matches++; seen.add(String(v).trim()); } }
      }
      if(total>0 && matches/total>0.7){
        const uniqueness = seen.size/matches;
        if(uniqueness>bestUniqueness){ bestUniqueness=uniqueness; best=key; }
      }
    }
    return best;
  }

  function headerRowLooksFabricated(data){
    // If the "header" names themselves look like patient IDs, URLs or dates, the real header
    // row is almost certainly missing and this row is actually the first data row — better to
    // let the lossless headerless-recovery path handle it than silently drop this row here.
    if(!data.length) return false;
    return Object.keys(data[0]).some(k=> looksLikePatientId(k) || /dental-monitoring\.com\/patient\//i.test(k) || /^\d{4}-\d{2}-\d{2}/.test(k));
  }

  function ensurePatientIdField(data){
    if(!data.length) return false;
    if(Object.keys(data[0]).some(k=>k.toLowerCase()==='patient_profile_id')) return true;
    if(headerRowLooksFabricated(data)) return false;
    const idKey = findIdColumnByHeaderAlias(data) || findIdColumnByValuePattern(data);
    if(!idKey) return false;
    data.forEach(row=>{ row.patient_profile_id = row[idKey]; });
    return true;
  }

  const PHONE_HEADER_ALIASES = ['patient_phone','phone','telephone','tel','numero_telephone','phone_number'];

  function normalizePhoneNumber(v){
    let digits = String(v||'').replace(/\D/g,'');
    if(!digits) return '';
    digits = digits.replace(/^00/, '');
    if(digits.length === 10 && digits.startsWith('0')) digits = '33' + digits.slice(1);
    return digits;
  }

  function findColumnByAliases(data, aliases, normalizeFn){
    if(!data.length) return null;
    const keys = Object.keys(data[0]);
    for(const alias of aliases){
      const found = keys.find(k=> normalizeFn(k) === alias);
      if(found) return found;
    }
    return null;
  }

  function looksLikePhoneNumber(value){
    const digits = String(value||'').replace(/\D/g,'');
    if(!digits) return false;
    if(digits.includes('336') || digits.includes('337')) return true;
    return digits.length >= 9 && digits.length <= 13;
  }

  function findPhoneColumnByValuePattern(data){
    if(!data.length) return null;
    const excludeNamePattern = /date|_id$|^id|age|score|scan|day|level|url|email|version|treatment|total/i;
    const keys = Object.keys(data[0]).filter(k=> !excludeNamePattern.test(k));
    let best=null, bestScore=-1;
    for(const key of keys){
      let matches=0, total=0;
      for(const row of data){
        const v = row[key];
        if(v){ total++; if(looksLikePhoneNumber(v)) matches++; }
      }
      if(total>2 && matches/total>0.8 && matches/total>bestScore){
        bestScore = matches/total; best = key;
      }
    }
    return best;
  }

  function ensurePhoneField(data){
    if(!data.length) return false;
    const norm = s => s.toLowerCase().replace(/[\s_-]/g,'');
    if(Object.keys(data[0]).some(k=>norm(k)==='patientphone')){
      data.forEach(row=>{ row.patient_phone = normalizePhoneNumber(row.patient_phone); });
      return true;
    }
    const key = findColumnByAliases(data, PHONE_HEADER_ALIASES.map(norm), norm) || findPhoneColumnByValuePattern(data);
    if(!key) return false;
    data.forEach(row=>{ row.patient_phone = normalizePhoneNumber(row[key]); });
    return true;
  }

  const TREATMENT_VOCAB = new Set(['aligners','braces','retainer','post-treatment','pre-treatment','others']);
  const COMMITMENT_VOCAB = new Set(['involved','detached','dedicated','scanned rookie','no scan published']);
  const SCANVERSION_VOCAB = new Set(['scanassist','previous scan version']);

  function detectColumnByPredicate(rows, predicate){
    const numCols = rows.reduce((m,r)=>Math.max(m,r.length), 0);
    for(let c=0;c<numCols;c++){
      let matches=0, total=0;
      for(const row of rows){ const v=row[c]; if(v){ total++; if(predicate(String(v))) matches++; } }
      if(total>0 && matches/total > 0.7) return c;
    }
    return -1;
  }

  function detectUrlColumn(rows){
    return detectColumnByPredicate(rows, v=>/dental-monitoring\.com\/patient\//i.test(v));
  }

  function detectIdPatternColumn(rows){
    const numCols = rows.reduce((m,r)=>Math.max(m,r.length), 0);
    let best=-1, bestUniqueness=-1;
    for(let c=0;c<numCols;c++){
      let matches=0, total=0; const seen=new Set();
      for(const row of rows){
        const v = row[c];
        if(v){ total++; if(looksLikePatientId(v)){ matches++; seen.add(String(v).trim()); } }
      }
      if(total>0 && matches/total>0.7){
        const uniqueness = seen.size/matches;
        if(uniqueness>bestUniqueness){ bestUniqueness=uniqueness; best=c; }
      }
    }
    return best;
  }

  function detectVocabColumn(rows, vocab){
    const numCols = rows.reduce((m,r)=>Math.max(m,r.length), 0);
    let best=-1, bestScore=0;
    for(let c=0;c<numCols;c++){
      let matches=0, total=0;
      for(const row of rows){ const v=String(row[c]||'').trim().toLowerCase(); if(v){ total++; if(vocab.has(v)) matches++; } }
      if(total>3){ const score=matches/total; if(score>0.7 && score>bestScore){ bestScore=score; best=c; } }
    }
    return best;
  }

  // Fixed column positions (0-indexed) matching this team's usual CSV export layout,
  // used only when headers aren't recognized — doctor=L, days late=AK, scan date=Y.
  const HEADERLESS_DM_LINK_COL = 13;
  const HEADERLESS_DOCTOR_COL = 11;
  const HEADERLESS_DAYS_LATE_COL = 36;
  const HEADERLESS_SCAN_DATE_COL = 24;

  function attemptHeaderlessRecovery(rawRows){
    const urlCol = detectUrlColumn(rawRows);
    const idCol = urlCol === -1 ? detectIdPatternColumn(rawRows) : -1;
    if(urlCol === -1 && idCol === -1) return null;
    const treatmentCol = detectVocabColumn(rawRows, TREATMENT_VOCAB);
    const commitmentCol = detectVocabColumn(rawRows, COMMITMENT_VOCAB);
    const scanVersionCol = detectVocabColumn(rawRows, SCANVERSION_VOCAB);
    const rows = rawRows.map(row=>{
      let id = null, url = '';
      if(urlCol !== -1){
        url = row[urlCol] || '';
        const m = url.match(/patient\/([A-Za-z0-9-]+)/i);
        id = m ? m[1] : null;
      } else {
        const raw = row[idCol];
        id = looksLikePatientId(raw) ? String(raw).trim() : null;
      }
      if(!url && row.length > HEADERLESS_DM_LINK_COL){
        url = row[HEADERLESS_DM_LINK_COL] || '';
        if(!id){
          const m2 = url.match(/patient\/([A-Za-z0-9-]+)/i);
          if(m2) id = m2[1];
        }
      }
      if(!id) return null;
      return {
        patient_profile_id: id,
        patient_monitoring_url: url,
        treatment: treatmentCol>=0 ? row[treatmentCol] : '',
        patient_commitment_level: commitmentCol>=0 ? row[commitmentCol] : '',
        last_scan_scan_version: scanVersionCol>=0 ? row[scanVersionCol] : '',
        doctor_name: row.length > HEADERLESS_DOCTOR_COL ? (row[HEADERLESS_DOCTOR_COL] || '') : '',
        days_late: row.length > HEADERLESS_DAYS_LATE_COL ? (row[HEADERLESS_DAYS_LATE_COL] || '') : '',
        monitoring_last_published_scan: row.length > HEADERLESS_SCAN_DATE_COL ? (row[HEADERLESS_SCAN_DATE_COL] || '') : '',
      };
    }).filter(Boolean);
    if(!rows.length) return null;
    return { rows, detected: { treatment: treatmentCol>=0, commitment: commitmentCol>=0, scanVersion: scanVersionCol>=0 } };
  }

  function wireDrop(inputEl, dzEl, onFile, getDownload){
    dzEl.addEventListener('dragover', e=>{ e.preventDefault(); dzEl.classList.add('drag'); });
    dzEl.addEventListener('dragleave', ()=> dzEl.classList.remove('drag'));
    dzEl.addEventListener('drop', e=>{
      e.preventDefault(); dzEl.classList.remove('drag');
      if(e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
    });
    inputEl.addEventListener('change', ()=>{ if(inputEl.files[0]) onFile(inputEl.files[0]); });
    if(getDownload){
      // Once a file is loaded, left-click re-downloads it (so it can be reopened) instead of
      // reopening the picker; right-click is how you swap in a different file.
      dzEl.addEventListener('click', e=>{
        e.preventDefault();
        const info = getDownload();
        if(info){
          const a = document.createElement('a');
          a.href = info.dataUrl;
          a.download = info.name || 'export';
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          inputEl.click();
        }
      });
      dzEl.addEventListener('contextmenu', e=>{
        e.preventDefault();
        inputEl.click();
      });
    }
  }

  wireDrop(els.file1, els.dz1, async file=>{
    const [data, dataUrl] = await Promise.all([parseFile(file), fileToDataUrl(file)]);
    if(!ensurePatientIdField(data)){
      const recovery = attemptHeaderlessRecovery(await parseFileRaw(file));
      if(!recovery){
        state.called = null; state.calledRecovered = false;
        state.calledFileMeta = { status:'error', message: i18n('toastIdColumnNotFound', {name: file.name}) };
        setDropzoneError(els.dz1, document.getElementById('dz1label'), els.dz1file, state.calledFileMeta.message);
        showToast(i18n('toastHeadersNotRecognized'));
        updateRunButton();
        return;
      }
      state.called = recovery.rows; state.calledRecovered = true;
      state.calledFileMeta = { status:'warn', name: file.name, count: recovery.rows.length, dataUrl };
      setDropzoneWarn(els.dz1, document.getElementById('dz1label'), els.dz1file, file, recovery.rows.length);
      saveFileToStorage(CALLED_STORAGE_KEY, file.name, recovery.rows, dataUrl);
      updateRunButton();
      return;
    }
    ensurePhoneField(data);
    state.called = data; state.calledRecovered = false;
    state.calledFileMeta = { status:'loaded', name: file.name, count: data.length, dataUrl };
    setDropzoneLoaded(els.dz1, document.getElementById('dz1label'), els.dz1file, file, data.length);
    saveFileToStorage(CALLED_STORAGE_KEY, file.name, data, dataUrl);
    updateRunButton();
  }, ()=> (!state.historyView && state.calledFileMeta && state.calledFileMeta.dataUrl) ? { name: state.calledFileMeta.name, dataUrl: state.calledFileMeta.dataUrl } : null);
  wireDrop(els.file2, els.dz2, async file=>{
    const [data, dataUrl] = await Promise.all([parseFile(file), fileToDataUrl(file)]);
    if(!ensurePatientIdField(data)){
      const recovery = attemptHeaderlessRecovery(await parseFileRaw(file));
      if(!recovery){
        state.scanned = null; state.scannedRecovered = false;
        state.scannedFileMeta = { status:'error', message: i18n('toastIdColumnNotFound', {name: file.name}) };
        setDropzoneError(els.dz2, document.getElementById('dz2label'), els.dz2file, state.scannedFileMeta.message);
        showToast(i18n('toastHeadersNotRecognized'));
        updateRunButton();
        return;
      }
      state.scanned = recovery.rows; state.scannedRecovered = true;
      state.scannedFileMeta = { status:'warn', name: file.name, count: recovery.rows.length, dataUrl };
      setDropzoneWarn(els.dz2, document.getElementById('dz2label'), els.dz2file, file, recovery.rows.length);
      saveFileToStorage(SCANNED_STORAGE_KEY, file.name, recovery.rows, dataUrl);
      updateRunButton();
      return;
    }
    ensurePhoneField(data);
    state.scanned = data; state.scannedRecovered = false;
    state.scannedFileMeta = { status:'loaded', name: file.name, count: data.length, dataUrl };
    setDropzoneLoaded(els.dz2, document.getElementById('dz2label'), els.dz2file, file, data.length);
    saveFileToStorage(SCANNED_STORAGE_KEY, file.name, data, dataUrl);
    updateRunButton();
  }, ()=> (!state.historyView && state.scannedFileMeta && state.scannedFileMeta.dataUrl) ? { name: state.scannedFileMeta.name, dataUrl: state.scannedFileMeta.dataUrl } : null);
  function saveAircallRange(start, end){
    try{ localStorage.setItem(AIRCALL_RANGE_STORAGE_KEY, JSON.stringify({start, end})); }catch(e){ /* full/unavailable — ignore */ }
  }
  function loadAircallRange(){
    try{
      const raw = localStorage.getItem(AIRCALL_RANGE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }

  function applyAircallRange(){
    const total = state.aircallRawCalls ? state.aircallRawCalls.length : 0;
    if(!total){
      state.aircallCalls = null;
      els.aircallRangeRow.style.display = 'none';
      renderAircallBreakdown();
      return;
    }
    els.aircallRangeRow.style.display = '';
    let start = parseInt(els.aircallRangeStart.value, 10);
    let end = parseInt(els.aircallRangeEnd.value, 10);
    if(isNaN(start) || start < 1) start = 1;
    if(isNaN(end) || end < start) end = total;
    if(start > total) start = total;
    if(end > total) end = total;
    els.aircallRangeStart.value = start;
    els.aircallRangeEnd.value = end;
    state.aircallCalls = state.aircallRawCalls.slice(start - 1, end);
    els.aircallRangeHint.textContent = i18n('aircallRangeSelected', {count: state.aircallCalls.length, total});
    saveAircallRange(start, end);
    renderAircallBreakdown();
  }

  wireDrop(els.fileAircall, els.dzAircall, async file=>{
    const raw = await parseFile(file);
    const calls = parseAircallCalls(raw);
    if(!calls){
      state.aircallRawCalls = null;
      state.aircallCalls = null;
      setDropzoneError(els.dzAircall, els.dzAircallLabel, els.dzAircallFile, i18n('toastPhoneColumnNotFound', {name: file.name}));
      els.aircallRangeRow.style.display = 'none';
      renderAircallBreakdown();
      return;
    }
    state.aircallRawCalls = calls;
    setDropzoneLoaded(els.dzAircall, els.dzAircallLabel, els.dzAircallFile, file, calls.length);
    saveFileToStorage(AIRCALL_STORAGE_KEY, file.name, calls);
    els.aircallRangeStart.value = 1;
    els.aircallRangeEnd.value = calls.length;
    applyAircallRange();
  });

  els.aircallRangeStart.addEventListener('change', applyAircallRange);
  els.aircallRangeEnd.addEventListener('change', applyAircallRange);

  els.aircallFreezeTarget.addEventListener('change', renderAircallBreakdown);

  els.aircallFreezeBtn.addEventListener('click', ()=>{
    if(readOnlyBlocked()) return;
    if(!state.aircallCalls){ showToast(i18n('toastLoadAircallFirst')); return; }
    const targetId = els.aircallFreezeTarget.value;
    const entry = state.history.find(e=>String(e.id) === targetId);
    if(!entry){ showToast(i18n('toastChooseHistoryEntry')); return; }
    const { buckets, matched, totalCalls } = computeAircallOutcomeBreakdown(entry.rows || [], state.aircallCalls);
    entry.aircallSnapshot = { buckets, matched, totalCalls, frozenAt: new Date().toISOString() };
    saveHistory();
    renderHistory();
    showToast(i18n('toastResultPinned', {label: entry.label}));
  });

  function restoreCachedFile(key, dz, labelEl, fileEl, targetProp, metaProp){
    const cached = loadFileFromStorage(key);
    if(!cached || !Array.isArray(cached.rows) || !cached.rows.length) return;
    state[targetProp] = cached.rows;
    if(metaProp) state[metaProp] = { status:'loaded', name: cached.filename, count: cached.rows.length, dataUrl: cached.dataUrl };
    dz.classList.add('loaded');
    labelEl.textContent = i18n('dzRestoredLabel');
    const savedDate = new Date(cached.savedAt);
    fileEl.innerHTML = `<span class="dz-file-name">${escapeHtml(cached.filename)}</span><span class="dz-file-meta">${escapeHtml(i18n('restoredMeta', {count: cached.rows.length, date: savedDate.toLocaleString(dateLocale())}))}</span>`;
    dz.title = cached.dataUrl ? dzLoadedTitle() : '';
  }

  function updateRunButton(){
    const ready = !!(state.called && state.scanned);
    els.runBtn.disabled = !ready;
    els.runHint.textContent = ready ? i18n('runHintReady') : i18n('runHintNotReady');
  }

  function classifyCommitment(raw){
    const v = (raw||'').toLowerCase();
    if(/(élev|engag|high|fort)/.test(v)) return 'good';
    if(/(modér|moyen|medium)/.test(v)) return 'warn';
    if(/(faible|risque|low|risk|disengag)/.test(v)) return 'bad';
    return 'neutral';
  }

  function pick(...vals){
    for(const v of vals){ if(v !== undefined && v !== null && v !== '') return v; }
    return '';
  }

  function daysSince(dateStr){
    if(!dateStr) return null;
    const d = new Date(dateStr);
    if(isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }

  // Columns already surfaced on the dashboard (as a dedicated field on the row, or via an
  // .extra-col toggle column) — everything else in the imported files ends up in r.extra,
  // available for the "Liste des patients" / "Scan rookie-NSPTM" extracts but never shown on
  // the dashboard itself, so exports stay complete without cluttering the screen.
  const KNOWN_COLUMN_KEYS = new Set([
    'patient_profile_id','firstname','lastname','patient_phone','patient_age','doctor_name',
    'patient_monitoring_url','monitoring_start_date','treatment','monitoring_last_published_scan',
    'last_scan_scan_version','treatment_total_scans','patient_commitment_level',
    'last_scan_excl_pending_device_model','days_late',
  ]);

  function extraFieldsFor(calledRow, scannedRow){
    const keys = new Set();
    if(calledRow) Object.keys(calledRow).forEach(k=> keys.add(k));
    if(scannedRow) Object.keys(scannedRow).forEach(k=> keys.add(k));
    const extra = {};
    keys.forEach(k=>{
      if(KNOWN_COLUMN_KEYS.has(k)) return;
      const v = pick(calledRow && calledRow[k], scannedRow && scannedRow[k]);
      if(v !== '') extra[k] = v;
    });
    return extra;
  }

  function extraColumnKeysForRows(rows){
    const keys = new Set();
    rows.forEach(r=>{ if(r.extra) Object.keys(r.extra).forEach(k=> keys.add(k)); });
    return Array.from(keys).sort();
  }

  function buildRows(called, scannedList){
    const scanMap = new Map();
    scannedList.forEach(r=>{
      const id = String(r.patient_profile_id||'').trim();
      if(id) scanMap.set(id, r);
    });
    return called.map(r=>{
      const id = String(r.patient_profile_id||'').trim();
      const match = scanMap.get(id);
      const daysLate = parseFloat(r.days_late);
      const startDate = pick(r.monitoring_start_date, match && match.monitoring_start_date);
      const treatmentDays = daysSince(startDate);
      return {
        id,
        name: [r.firstname, r.lastname].filter(Boolean).join(' ') || '—',
        doctor: r.doctor_name || '—',
        commitment: r.patient_commitment_level || '—',
        daysLate: isNaN(daysLate) ? 0 : daysLate,
        daysLateKnown: !isNaN(daysLate),
        url: r.patient_monitoring_url || '',
        scanned: !!match,
        scanDate: match ? (match.monitoring_last_published_scan || '') : '',
        treatment: pick(r.treatment, match && match.treatment) || '—',
        age: pick(r.patient_age, match && match.patient_age) || '—',
        deviceModel: pick(match && match.last_scan_excl_pending_device_model, r.last_scan_excl_pending_device_model) || '—',
        scanVersion: pick(match && match.last_scan_scan_version, r.last_scan_scan_version) || '—',
        treatmentDays: treatmentDays === null ? '—' : `${treatmentDays} j`,
        totalScans: pick(match && match.treatment_total_scans, r.treatment_total_scans) || '—',
        phone: pick(r.patient_phone, match && match.patient_phone) || '',
        extra: extraFieldsFor(r, match),
      };
    });
  }

  function runCrossReference(){
    const called = state.demo ? DEMO_CALLED : state.called;
    const scanned = state.demo ? DEMO_SCANNED : state.scanned;
    state.rows = buildRows(called, scanned);
    populateDoctorFilter(state.rows);
    els.calledOverrideInput.disabled = false;
    const saved = state.demo ? null : loadCalledOverride();
    const matchesCurrentFile = saved && state.calledFileMeta && saved.fileName === state.calledFileMeta.name && saved.fileCount === state.calledFileMeta.count;
    els.calledOverrideInput.value = matchesCurrentFile ? saved.value : state.rows.length;
    render();
  }

  function populateDoctorFilter(rows){
    const doctors = Array.from(new Set(rows.map(r=>r.doctor))).sort((a,b)=>a.localeCompare(b));
    els.doctorFilter.innerHTML = `<option value="">${i18n('doctorFilterAll')}</option>` +
      doctors.map(d=>`<option value="${escapeAttr(d)}">${escapeHtml(d)}</option>`).join('');
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(s){ return escapeHtml(s); }

  function activeRows(){
    const rows = state.historyView ? state.historyView.rows : (state.rows || []);
    return state.doctorScope ? rows.filter(r=> r.doctor === state.doctorScope) : rows;
  }

  function computeStats(rows, calledOverride){
    const importedTotal = rows.length;
    const scannedCount = rows.filter(r=>r.scanned).length;
    const calledTotal = (calledOverride != null && !isNaN(calledOverride) && calledOverride >= 0) ? calledOverride : importedTotal;
    const unscanned = Math.max(0, calledTotal - scannedCount);
    const pct = calledTotal ? Math.round(scannedCount/calledTotal*100) : 0;
    return {importedTotal, calledTotal, scannedCount, unscanned, pct};
  }

  function getCalledOverride(){
    if(els.calledOverrideInput.disabled) return null;
    const raw = els.calledOverrideInput.value;
    if(raw === '') return null;
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
  }

  function getFiltered(){
    const q = els.search.value.trim().toLowerCase();
    const doc = els.doctorFilter.value;
    const status = els.statusFilter.value;
    let rows = activeRows().filter(r=>{
      if(doc && r.doctor !== doc) return false;
      if(status === 'scanned' && !r.scanned) return false;
      if(status === 'unscanned' && r.scanned) return false;
      if(q && !(r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.doctor.toLowerCase().includes(q))) return false;
      return true;
    });
    rows = sortRows(rows);
    return rows;
  }

  function sortRows(rows){
    const key = state.sortKey, dir = state.sortDir;
    const arr = rows.slice();
    if(key === 'priority'){
      arr.sort((a,b)=> (a.scanned - b.scanned) || (b.daysLate - a.daysLate));
      return arr;
    }
    arr.sort((a,b)=>{
      let av = a[key], bv = b[key];
      if(key === 'daysLate') return (av - bv) * dir;
      if(key === 'scanned') return ((av===bv)?0:(av?1:-1)) * dir;
      av = String(av||'').toLowerCase(); bv = String(bv||'').toLowerCase();
      return av.localeCompare(bv) * dir;
    });
    return arr;
  }

  function daysClass(d){
    if(d >= 10) return 'days-bad';
    if(d >= 4) return 'days-warn';
    return '';
  }

  function renderRowHtml(r){
    return `
        <tr class="${r.scanned ? 'row-scanned' : 'row-unscanned'}">
          <td><span class="pid-main">${escapeHtml(r.id)}</span></td>
          <td>${escapeHtml(r.doctor)}</td>
          <td><span class="pill ${classifyCommitment(r.commitment)}">${escapeHtml(r.commitment)}</span></td>
          <td class="mono-num ${r.daysLateKnown ? daysClass(r.daysLate) : ''}">${r.daysLateKnown ? r.daysLate : '—'}</td>
          <td>${r.scanned ? `<span class="pill good">${i18n('statusScanned')}</span>` : `<span class="pill bad">${i18n('statusUnscanned')}</span>`}</td>
          <td class="mono-num">${escapeHtml(r.scanDate || '—')}</td>
          <td>${r.url ? `<a class="link" href="${escapeAttr(r.url)}" target="_blank" rel="noopener">${i18n('openLinkLabel')} <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 17 17 7M8 7h9v9"/></svg></a>` : '—'}</td>
          <td class="extra-col">${escapeHtml(r.treatment)}</td>
          <td class="extra-col mono-num">${escapeHtml(r.age)}</td>
          <td class="extra-col">${escapeHtml(r.deviceModel)}</td>
          <td class="extra-col mono-num">${escapeHtml(r.scanVersion)}</td>
          <td class="extra-col mono-num">${escapeHtml(r.treatmentDays)}</td>
          <td class="extra-col mono-num">${escapeHtml(r.totalScans)}</td>
          <td class="extra-col mono-num">${escapeHtml(r.phone || '—')}</td>
        </tr>`;
  }

  function defaultSnapshotName(){
    const d = new Date();
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = String(d.getFullYear()).slice(-2);
    return `scan-verifier-${dd}-${mm}-${yy}`;
  }

  function showToast(msg){
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    setTimeout(()=>els.toast.classList.remove('show'), 1800);
  }

  function saveViaBrowserDownload(filename, content, mimeType){
    const blob = new Blob([content], {type: mimeType || 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  }

  async function saveFile(filename, content, mimeType){
    if(window.claude && typeof window.claude.use === 'function'){
      try{
        const downloads = await window.claude.use('downloads');
        if(downloads){
          try{
            await downloads.save({filename, data: content});
            showToast(i18n('toastSaved'));
          }catch(err){
            if(!err || err.code !== 'declined') showToast(i18n('toastSaveFailed'));
          }
          return;
        }
      }catch(e){ /* no viewer support here — fall through to a plain browser download */ }
    }
    saveViaBrowserDownload(filename, content, mimeType);
  }

  async function exportHistoryAsJson(){
    if(!state.history.length){ showToast(i18n('toastNoHistoryToExport')); return; }
    const payload = {
      exportedAt: new Date().toISOString(),
      tool: i18n('brandTitle'),
      entryCount: state.history.length,
      entries: state.history.map(cleanEntryForStorage),
    };
    const json = JSON.stringify(payload, null, 2);
    const d = new Date();
    const filename = `${i18n('historyExportFilenamePrefix')}${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}.json`;
    await saveFile(filename, json, 'application/json');
  }

  async function importHistoryFromJson(file){
    if(readOnlyBlocked()) return;
    if(!poolLoaded){ showToast(i18n('toastWaitLoading')); return; }
    let payload;
    try{
      payload = JSON.parse(await file.text());
    }catch(e){
      showToast(i18n('toastInvalidJson'));
      return;
    }
    const entries = Array.isArray(payload) ? payload : payload.entries;
    if(!Array.isArray(entries) || !entries.length){
      showToast(i18n('toastNoEntriesFound'));
      return;
    }
    const existingIds = new Set(state.history.map(e=>String(e.id)));
    // Une vérification déjà partagée par un collègue reste la sienne : on ne la duplique pas dans
    // mon historique (elle serait sinon comptée deux fois dans les vues équipe).
    const me = currentUser ? currentUser.email : null;
    const othersIds = new Set(pool.entries.filter(e=> e._ownerEmail !== me).map(e=> String(e.id)));
    let added = 0, skippedOthers = 0;
    entries.forEach(entry=>{
      if(!entry || !entry.id || existingIds.has(String(entry.id))) return;
      if(othersIds.has(String(entry.id))){ skippedOthers++; return; }
      if(!Array.isArray(entry.rows) || !entry.stats) return;
      const clean = {};
      Object.keys(entry).forEach(k=>{ if(!k.startsWith('_')) clean[k] = entry[k]; });
      state.history.push(clean);
      existingIds.add(String(entry.id));
      added++;
    });
    if(state.history.length > HISTORY_MAX_ENTRIES){
      state.history.sort((a,b)=> a.savedAt.localeCompare(b.savedAt));
      state.history = state.history.slice(state.history.length - HISTORY_MAX_ENTRIES);
    }
    saveHistory();
    renderHistory();
    if(skippedOthers) showToast(i18n('toastEntriesImportedSkipped', {count: added, skipped: skippedOthers}));
    else showToast(added ? i18n('toastEntriesImported', {count: added}) : i18n('toastAllEntriesPresent'));
  }

  const DOMINANT_DOCTOR_THRESHOLD = 0.6;

  function computeDominantDoctor(rows){
    if(!rows || !rows.length) return '—';
    const counts = new Map();
    rows.forEach(r=>{
      const doc = r.doctor || '—';
      counts.set(doc, (counts.get(doc) || 0) + 1);
    });
    let topDoc = null, topCount = 0;
    counts.forEach((count, doc)=>{
      if(count > topCount){ topCount = count; topDoc = doc; }
    });
    return (topCount / rows.length) > DOMINANT_DOCTOR_THRESHOLD ? topDoc : i18n('multipleDoctorsLabel');
  }

  function sortHistoryEntries(entries){
    const key = state.historySortKey, dir = state.historySortDir;
    const arr = entries.slice();
    arr.sort((a,b)=>{
      let av, bv;
      if(key === 'called'){ av = a.stats.calledTotal; bv = b.stats.calledTotal; }
      else if(key === 'scanned'){ av = a.stats.scannedCount; bv = b.stats.scannedCount; }
      else if(key === 'pct'){ av = a.stats.pct; bv = b.stats.pct; }
      else if(key === 'doctor'){ av = computeDominantDoctor(a.rows); bv = computeDominantDoctor(b.rows); }
      else { av = a.savedAt; bv = b.savedAt; }
      if(typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      av = String(av||'').toLowerCase(); bv = String(bv||'').toLowerCase();
      return av.localeCompare(bv) * dir;
    });
    return arr;
  }

  // Trace, pour chaque vérification, les 2 fichiers exacts qui l'ont générée (nom + nb de lignes,
  // déjà conservés sur l'entrée via calledFileMeta/scannedFileMeta — voir addCurrentToHistory).
  // Pas de bouton de téléchargement ici : le contenu brut (dataUrl) est volontairement absent de
  // l'historique pour ne pas alourdir le localStorage sur des entrées gardées indéfiniment.
  function downloadDataUrl(dataUrl, filename){
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename || 'export';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function renderImportedFilesTable(){
    if(!els.importedFilesBody) return;
    if(!state.history.length){
      els.importedFilesBody.innerHTML = `<tr><td colspan="3" class="empty">${i18n('noImportedFilesYet')}</td></tr>`;
      return;
    }
    const sorted = state.history.slice().sort((a,b)=> b.savedAt.localeCompare(a.savedAt));
    const fileCell = (entry, field, meta) => {
      if(!meta || !meta.name) return `<span class="hint">—</span>`;
      const downloadBtn = (meta.dataUrl || meta.sourceFileId)
        ? `<button class="link-btn" data-download-imported="${entry.id}" data-field="${field}" title="${escapeAttr(i18n('downloadFileTitle', {name: meta.name}))}">${i18n('downloadBtnLabel')}</button>`
        : '';
      const rowsText = meta.status === 'warn' ? i18n('rowsCountInferred', {count: meta.count}) : i18n('rowsCountPlain', {count: meta.count});
      return `<span class="name">${escapeHtml(meta.name)}</span><span class="pid">${rowsText}${downloadBtn}</span>`;
    };
    els.importedFilesBody.innerHTML = sorted.map(entry=> `
      <tr>
        <td><span class="name">${escapeHtml(entry.label)}</span><span class="pid">${new Date(entry.savedAt).toLocaleString(dateLocale())}</span></td>
        <td>${fileCell(entry, 'calledFileMeta', entry.calledFileMeta)}</td>
        <td>${fileCell(entry, 'scannedFileMeta', entry.scannedFileMeta)}</td>
      </tr>`).join('');
    els.importedFilesBody.querySelectorAll('[data-download-imported]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const entry = state.history.find(e=> e.id === btn.getAttribute('data-download-imported'));
        const meta = entry && entry[btn.getAttribute('data-field')];
        if(meta) downloadEntrySource(meta);
      });
    });
  }

  function renderHistory(){
    renderImportedFilesTable();
    renderCharts();
    els.expandHistoryBtn.style.display = state.history.length > 10 ? '' : 'none';
    if(!state.history.length){
      els.historyBody.innerHTML = `<tr><td colspan="6" class="empty">${i18n('noHistoryYet')}</td></tr>`;
      return;
    }
    const sorted = sortHistoryEntries(state.history);
    els.historyBody.innerHTML = sorted.map(entry=>{
      const s = entry.stats;
      const aircallBadge = entry.aircallSnapshot ? `<span class="pill neutral" style="margin-left:6px;">${i18n('aircallPinnedBadge')}</span>` : '';
      const unlinkBtn = entry.aircallSnapshot ? `<button class="ghost btn-small" data-unlink-aircall="${entry.id}">${i18n('unlinkAircallBtn')}</button>` : '';
      return `
        <tr>
          <td><span class="name">${escapeHtml(entry.label)}</span>${aircallBadge}<span class="pid">${new Date(entry.savedAt).toLocaleString(dateLocale())}</span></td>
          <td class="mono-num">${s.calledTotal}</td>
          <td class="mono-num">${s.scannedCount}</td>
          <td class="mono-num">${s.pct}%</td>
          <td>${escapeHtml(computeDominantDoctor(entry.rows))}</td>
          <td>
            <button class="ghost btn-small" data-view="${entry.id}">${i18n('viewBtnLabel')}</button>
            <button class="ghost btn-small" data-rename="${entry.id}">${i18n('renameBtnLabel')}</button>
            ${unlinkBtn}
            <button class="ghost btn-small" data-del="${entry.id}">${i18n('deleteBtnLabel')}</button>
          </td>
        </tr>`;
    }).join('');
  }

  function addCurrentToHistory(){
    if(readOnlyBlocked()) return;
    if(!poolLoaded){ showToast(i18n('toastWaitLoading')); return; }
    if(state.demo){ showToast(i18n('toastGenerateFirst')); return; }
    if(state.historyView){ showToast(i18n('toastReturnToCurrentData')); return; }
    const label = (els.saveName.value || '').trim() || defaultSnapshotName();
    const rows = state.rows || [];
    // Copies de calledFileMeta/scannedFileMeta (avec leur dataUrl) : à la synchronisation, chaque
    // fichier d'origine est envoyé sur Drive comme fichier à part et l'entrée ne garde que son ID
    // (sourceFileId) — l'historique reste léger et les fichiers restent téléchargeables.
    const entry = { id: String(Date.now()), label, savedAt: new Date().toISOString(), rows, stats: computeStats(rows, getCalledOverride()), calledFileMeta: state.calledFileMeta ? Object.assign({}, state.calledFileMeta) : null, scannedFileMeta: state.scannedFileMeta ? Object.assign({}, state.scannedFileMeta) : null };
    state.history.push(entry);
    if(state.history.length > HISTORY_MAX_ENTRIES){
      state.history.sort((a,b)=> a.savedAt.localeCompare(b.savedAt));
      state.history = state.history.slice(state.history.length - HISTORY_MAX_ENTRIES);
    }
    saveHistory();
    renderHistory();
    showToast(i18n('toastAddedToHistory'));
  }

  function viewHistoryEntry(id){
    const entry = state.history.find(e=>e.id === id);
    if(!entry) return;
    state.historyView = entry;
    els.historyBannerLabel.textContent = i18n('historyViewingArchive', {label: entry.label, date: new Date(entry.savedAt).toLocaleString(dateLocale())});
    els.calledOverrideInput.disabled = true;
    els.calledOverrideInput.value = entry.stats.calledTotal;
    populateDoctorFilter(entry.rows);
    els.search.value=''; els.doctorFilter.value=''; els.statusFilter.value='';
    applyDropzoneMeta(els.dz1, document.getElementById('dz1label'), els.dz1file, entry.calledFileMeta);
    applyDropzoneMeta(els.dz2, document.getElementById('dz2label'), els.dz2file, entry.scannedFileMeta);
    els.aircallFreezeTarget.value = String(entry.id);
    render();
    renderAircallBreakdown();
  }

  function exitHistoryView(){
    if(!state.historyView) return;
    state.historyView = null;
    els.calledOverrideInput.disabled = false;
    els.calledOverrideInput.value = (state.rows || []).length;
    populateDoctorFilter(state.rows || []);
    els.search.value=''; els.doctorFilter.value=''; els.statusFilter.value='';
    applyDropzoneMeta(els.dz1, document.getElementById('dz1label'), els.dz1file, state.calledFileMeta);
    applyDropzoneMeta(els.dz2, document.getElementById('dz2label'), els.dz2file, state.scannedFileMeta);
    els.aircallFreezeTarget.value = '';
    render();
    renderAircallBreakdown();
  }

  function deleteHistoryEntry(id){
    if(readOnlyBlocked()) return;
    const removed = state.history.find(e=>e.id === id);
    if(!removed || !confirm(i18n('confirmDeleteEntry', {label: removed.label}))) return;
    state.history = state.history.filter(e=>e.id !== id);
    trashEntrySources(removed);
    saveHistory();
    if(state.historyView && state.historyView.id === id) exitHistoryView();
    renderHistory();
  }

  function renameHistoryEntry(id){
    if(readOnlyBlocked()) return;
    const entry = state.history.find(e=>e.id === id);
    if(!entry) return;
    const next = window.prompt(i18n('promptRenameEntry'), entry.label);
    if(next === null) return;
    const trimmed = next.trim();
    if(!trimmed) return;
    entry.label = trimmed;
    saveHistory();
    renderHistory();
    if(state.historyView && state.historyView.id === id){
      els.historyBannerLabel.textContent = i18n('historyViewingArchive', {label: entry.label, date: new Date(entry.savedAt).toLocaleString(dateLocale())});
    }
    showToast(i18n('toastEntryRenamed'));
  }

  function unlinkAircallSnapshot(id){
    if(readOnlyBlocked()) return;
    const entry = state.history.find(e=>e.id === id);
    if(!entry || !entry.aircallSnapshot) return;
    delete entry.aircallSnapshot;
    saveHistory();
    renderHistory();
    showToast(i18n('toastAircallUnlinked'));
  }

  function pad2(n){ return String(n).padStart(2,'0'); }
  function dayKeyFromISO(iso){
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  }
  function formatDayLabel(key){
    const [y,m,d] = key.split('-');
    return `${d}/${m}`;
  }

  // Renaming a history entry to include the date the calls/checks actually happened (e.g.
  // "Appels 16/09") often differs from when it was saved to history. When the name contains a
  // recognizable date, the Trends tab uses that instead of the save timestamp — so the daily
  // chart and doctor trends reflect when the work was really done, not when it was logged.
  function parseDateFromLabel(label, referenceIso){
    if(!label) return null;
    let m = label.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
    if(m){
      let d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = parseInt(m[3], 10);
      if(y < 100) y += 2000;
      if(d >= 1 && d <= 31 && mo >= 1 && mo <= 12){
        const date = new Date(Date.UTC(y, mo - 1, d));
        if(!isNaN(date.getTime())) return date.toISOString();
      }
    }
    m = label.match(/\b(\d{1,2})[\/\-](\d{1,2})\b/);
    if(m){
      let d = parseInt(m[1], 10), mo = parseInt(m[2], 10);
      if(d >= 1 && d <= 31 && mo >= 1 && mo <= 12){
        const refYear = referenceIso ? new Date(referenceIso).getFullYear() : new Date().getFullYear();
        const date = new Date(Date.UTC(refYear, mo - 1, d));
        if(!isNaN(date.getTime())) return date.toISOString();
      }
    }
    return null;
  }
  function effectiveDateForEntry(entry){
    return parseDateFromLabel(entry.label, entry.savedAt) || entry.savedAt;
  }

  // Entrées alimentant l'onglet Tendances : périmètre selon le rôle (mes données / une équipe /
  // toutes les équipes — voir trendsScopeEntries()), puis type de campagne, puis sélection
  // d'entrées cochées. Chaque étape restreint ce que propose la suivante.
  function entriesAfterChannelFilter(){
    const entries = trendsScopeEntries();
    if(!state.trendsChannel) return entries;
    return entries.filter(e=> inferCampaignChannel(e.label) === state.trendsChannel);
  }
  function getFilteredHistoryEntries(){
    const entries = entriesAfterChannelFilter();
    if(!trendsEntryFilter.length) return entries;
    return entries.filter(e=> trendsEntryFilter.includes(String(e.id)));
  }

  function dailySeriesByChannel(){
    const byChannelDay = { appel:new Map(), email:new Map(), sms:new Map(), other:new Map() };
    // Sur ses propres données : un point par jour = le dernier contrôle de ce jour (comportement
    // d'origine de l'outil individuel). Sur une équipe, plusieurs CX contrôlent le même jour : le
    // point devient le cumul de la journée (scannés / contactés, tous CX confondus).
    const aggregate = !isPersonalScope();
    getFilteredHistoryEntries().forEach(e=>{
      // With a doctor scope active, skip entries that have no patients for that doctor at all —
      // otherwise they'd show up as a misleading 0% point instead of just not appearing that day.
      if(state.doctorScope && !(e.rows||[]).some(r=> r.doctor === state.doctorScope)) return;
      const channel = inferCampaignChannel(e.label) || 'other';
      const key = dayKeyFromISO(effectiveDateForEntry(e));
      const map = byChannelDay[channel];
      if(aggregate){
        if(!map.has(key)) map.set(key, []);
        map.get(key).push(e);
        return;
      }
      const existing = map.get(key);
      if(!existing || e.savedAt > existing.savedAt) map.set(key, e);
    });
    const result = {};
    CHANNEL_ORDER.forEach(channel=>{
      const map = byChannelDay[channel];
      if(!map.size) return;
      result[channel] = Array.from(map.keys()).sort().map(key=>{
        const entries = aggregate ? map.get(key) : [map.get(key)];
        let value;
        if(state.doctorScope){
          const rows = entries.flatMap(en=> (en.rows||[]).filter(r=> r.doctor === state.doctorScope));
          value = rows.length ? Math.round(rows.filter(r=>r.scanned).length / rows.length * 100) : 0;
        } else if(entries.length === 1){
          value = entries[0].stats.pct;
        } else {
          const called = entries.reduce((s,en)=> s + entryCalledTotal(en), 0);
          const scanned = entries.reduce((s,en)=> s + (en.stats ? en.stats.scannedCount : 0), 0);
          value = called ? Math.round(scanned / called * 100) : 0;
        }
        return { dayKey: key, label: formatDayLabel(key), value };
      });
    });
    return result;
  }

  function commitmentColorVar(label){
    const cls = classifyCommitment(label);
    if(cls === 'good') return 'var(--good)';
    if(cls === 'warn') return 'var(--warn)';
    if(cls === 'bad') return 'var(--bad)';
    return 'var(--accent)';
  }

  function computeCommitmentBreakdown(rows){
    const grandTotal = rows.length;
    const groups = new Map();
    rows.forEach(r=>{
      const key = r.commitment || '—';
      if(!groups.has(key)) groups.set(key, {total:0, scanned:0});
      const g = groups.get(key);
      g.total++;
      if(r.scanned) g.scanned++;
    });
    return Array.from(groups.entries())
      .map(([label,g])=>({
        label, total:g.total, scanned:g.scanned,
        scanPct: g.total ? Math.round(g.scanned/g.total*100) : 0,
        sharePct: grandTotal ? Math.round(g.total/grandTotal*100) : 0,
      }))
      .sort((a,b)=> a.scanPct - b.scanPct);
  }

  function renderCommitmentBreakdown(rows){
    const data = computeCommitmentBreakdown(rows);
    if(!data.length){
      els.commitmentBreakdown.innerHTML = `<p class="hint">${i18n('commitmentEmptyState')}</p>`;
      els.commitmentLegendExample.textContent = '';
      return;
    }
    els.commitmentBreakdown.innerHTML = `<div class="timebars">${data.map(d=>{
      return `<div class="timebar-row">
        <span class="timebar-label">${escapeHtml(d.label)}</span>
        <div class="timebar-track">
          <div class="timebar-share" style="width:${d.sharePct}%">
            <div class="timebar-fill" style="width:${d.scanPct}%;background:${commitmentColorVar(d.label)}"></div>
          </div>
        </div>
        <span class="timebar-value"><strong>${d.scanPct}%</strong> scan <span class="timebar-count">(${d.scanned}/${d.total}) · ${d.sharePct}% pop.</span></span>
      </div>`;
    }).join('')}</div>`;

    const biggest = data.reduce((max,d)=> d.sharePct > max.sharePct ? d : max, data[0]);
    els.commitmentLegendExample.innerHTML = i18n('commitmentLegendDynamic', {sharePct: biggest.sharePct, label: escapeHtml(biggest.label), scanPct: biggest.scanPct, scanned: biggest.scanned, total: biggest.total});
  }

  function getAllDoctorNames(){
    const set = new Set();
    allHistoryRows().forEach(r=>{ if(r.doctor && r.doctor !== '—') set.add(r.doctor); });
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  }

  function inferCampaignChannel(label){
    const norm = normalizeAggressive(label);
    if(norm.includes('email') || norm.includes('mail')) return 'email';
    if(norm.includes('sms')) return 'sms';
    if(norm.includes('appel') || norm.includes('call') || norm.includes('telephone') || norm.includes('phone')) return 'appel';
    return null;
  }

  // 'other' catches entries whose campaign name doesn't match any known channel keyword (e.g. a
  // generic label like "test") — without it they'd silently vanish from the daily chart instead
  // of just not being color-coded.
  const CHANNEL_ORDER = ['appel','email','sms','other'];
  // A function (not a frozen object) so it re-evaluates via i18n() on every call — including
  // after a language switch, when renderCharts() re-runs as part of the applyI18n() cascade.
  function CHANNEL_LABEL(key){
    if(key === 'appel') return i18n('chanLabelCalls');
    if(key === 'email') return i18n('chanLabelEmail');
    if(key === 'sms') return i18n('chanLabelSms');
    return i18n('chanLabelOther');
  }
  const CHANNEL_SHAPES = { appel:'circle', email:'square', sms:'triangle', other:'diamond' };

  function computeDoctorTrends(timeline){
    const trends = [];
    ['appel','email','sms'].forEach(channel=>{
      const entries = timeline.filter(t=>t.channel === channel);
      if(entries.length < 2) return;
      const prev = entries[entries.length-2], last = entries[entries.length-1];
      const delta = last.pct - prev.pct;
      trends.push({ channel, delta, direction: delta > 0 ? 'up' : (delta < 0 ? 'down' : 'flat'), prev, last });
    });
    if(!trends.length && timeline.length >= 2){
      const prev = timeline[timeline.length-2], last = timeline[timeline.length-1];
      const delta = last.pct - prev.pct;
      trends.push({ channel: null, delta, direction: delta > 0 ? 'up' : (delta < 0 ? 'down' : 'flat'), prev, last });
    }
    return trends;
  }

  function computeDoctorScorecard(doctorName){
    const rows = allHistoryRows().filter(r=> r.doctor === doctorName);
    const total = rows.length;
    const scanned = rows.filter(r=>r.scanned).length;
    const pct = total ? Math.round(scanned/total*100) : 0;
    const timeline = getFilteredHistoryEntries().slice()
      .sort((a,b)=> effectiveDateForEntry(a).localeCompare(effectiveDateForEntry(b)))
      .map(entry=>{
        const entryRows = (entry.rows || []).filter(r=> r.doctor === doctorName);
        if(!entryRows.length) return null;
        const s = entryRows.filter(r=>r.scanned).length;
        return { savedAt: effectiveDateForEntry(entry), label: entry.label, total: entryRows.length, scanned: s, pct: Math.round(s/entryRows.length*100), channel: inferCampaignChannel(entry.label) };
      })
      .filter(Boolean);
    const trends = computeDoctorTrends(timeline);
    return { doctor: doctorName, total, scanned, pct, timeline, trends };
  }

  function trendChannelLabel(channel){
    if(channel === 'appel') return i18n('chanLabelCalls');
    if(channel === 'email') return i18n('chanLabelEmail');
    if(channel === 'sms') return i18n('chanLabelSms');
    return null;
  }

  function trendEmojiForDirection(direction){
    if(direction === 'up') return '↗️';
    if(direction === 'down') return '↘️';
    return '➡️';
  }

  function trendDescriptionForTrend(t){
    if(t.direction === 'flat') return i18n('trendStable', {pct: t.last.pct});
    const sign = t.delta > 0 ? '+' : '';
    return i18n('trendDelta', {sign, delta: t.delta, prevPct: t.prev.pct, lastPct: t.last.pct});
  }

  function trendLineFor(t){
    return `${trendEmojiForDirection(t.direction)} ${trendChannelLabel(t.channel) ? trendChannelLabel(t.channel) + ' — ' : ''}${trendDescriptionForTrend(t)}`;
  }

  function sanitizeSheetName(label, used){
    let name = String(label || 'Campagne').replace(/[\\/?*[\]:]/g, '-').trim();
    if(!name) name = 'Campagne';
    name = name.slice(0, 31);
    let base = name, n = 2;
    while(used.has(name)){
      const suffix = ` (${n})`;
      name = base.slice(0, 31 - suffix.length) + suffix;
      n++;
    }
    return name;
  }

  function downloadDoctorPatientDetail(doctorName){
    const sortedEntries = getFilteredHistoryEntries().slice().sort((a,b)=> a.savedAt.localeCompare(b.savedAt));
    const baseHeader = ['patient_profile_id','patient','doctor_name','patient_commitment_level','days_late',i18n('csvHeaderStatus'),i18n('csvHeaderScanDate'),'monitoring_url','phone'];
    const allRows = sortedEntries.flatMap(entry=> (entry.rows || []).filter(r=> r.doctor === doctorName));
    const extraKeys = extraColumnKeysForRows(allRows);
    const header = baseHeader.concat(extraKeys);
    const wb = XLSX.utils.book_new();
    const usedNames = new Set();
    let sheetsAdded = 0;
    sortedEntries.forEach(entry=>{
      const rows = (entry.rows || []).filter(r=> r.doctor === doctorName);
      if(!rows.length) return;
      const aoa = [header].concat(rows.map(r=>[
        r.id, r.name, r.doctor, r.commitment, r.daysLate, r.scanned ? i18n('statusScanned') : i18n('statusUnscanned'), r.scanDate, r.url, r.phone,
        ...extraKeys.map(k=> (r.extra && r.extra[k] !== undefined) ? r.extra[k] : '')
      ]));
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const sheetName = sanitizeSheetName(entry.label, usedNames);
      usedNames.add(sheetName);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      sheetsAdded++;
    });
    if(!sheetsAdded){ showToast(i18n('toastNoPatientsForDoctor')); return; }
    const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
    saveFile(`patients-detail-${slugifyFilename(doctorName)}.xlsx`, wbout, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  function buildDoctorScorecardText(data){
    const lines = [];
    lines.push(i18n('scorecardDoctorTitle', {doctor: data.doctor}));
    lines.push(i18n('scorecardGeneratedOn', {date: new Date().toLocaleString(dateLocale())}));
    lines.push('');
    lines.push(i18n('scorecardVolumeLine', {total: data.total}));
    lines.push(i18n('scorecardRateLine', {pct: data.pct, scanned: data.scanned, total: data.total}));
    lines.push('');
    if(data.trends.length){
      data.trends.forEach(t=> lines.push(trendLineFor(t)));
    } else {
      lines.push(i18n('scorecardNoTrend'));
    }
    lines.push('');
    if(data.timeline.length){
      lines.push(i18n('scorecardDetailLine'));
      data.timeline.forEach(t=>{
        lines.push(`- ${new Date(t.savedAt).toLocaleDateString(dateLocale())} — ${t.label} : ${t.pct}% (${t.scanned}/${t.total})`);
      });
    }
    return lines.join('\n');
  }

  function copyDoctorScorecard(doctorName){
    const data = computeDoctorScorecard(doctorName);
    navigator.clipboard.writeText(buildDoctorScorecardText(data)).then(()=> showToast(i18n('toastScorecardCopied'))).catch(()=>{});
  }

  function downloadDoctorScorecard(doctorName){
    const data = computeDoctorScorecard(doctorName);
    saveFile(`${i18n('scorecardFilenamePrefix')}${slugifyFilename(doctorName)}.txt`, buildDoctorScorecardText(data), 'text/plain');
  }

  function renderDoctorScorecardBody(){
    const doctorName = state.doctorScope;
    if(!doctorName){
      els.doctorScorecard.innerHTML = `<p class="hint">${i18n('scorecardEmptyHint')}</p>`;
      return;
    }
    const data = computeDoctorScorecard(doctorName);
    const trendHtml = data.trends.length
      ? data.trends.map(t=>{
          const label = trendChannelLabel(t.channel);
          return `<p class="trend-line hint"><span class="trend-emoji">${trendEmojiForDirection(t.direction)}</span> ${label ? `<strong>${escapeHtml(label)}</strong> — ` : ''}${escapeHtml(trendDescriptionForTrend(t))}</p>`;
        }).join('')
      : `<p class="hint" style="margin-top:10px;">${i18n('scorecardNoTrend')}</p>`;
    els.doctorScorecard.innerHTML = `
      <div class="scorecard-tiles">
        <div class="tile"><span class="tile-label">${i18n('scorecardVolumeLabel')}</span><span class="tile-value">${data.total}</span><span class="tile-sub">${i18n('scorecardVolumeSub')}</span></div>
        <div class="tile"><span class="tile-label">${i18n('scorecardRateLabel')}</span><span class="tile-value">${data.pct}%</span><span class="tile-sub">(${data.scanned}/${data.total})</span></div>
      </div>
      ${trendHtml}
      ${data.timeline.length ? `<ul class="scorecard-timeline">${data.timeline.map(t=>`<li><span>${new Date(t.savedAt).toLocaleDateString(dateLocale())} — ${escapeHtml(t.label)}</span><span><strong>${t.pct}%</strong> <span class="timebar-count">(${t.scanned}/${t.total})</span></span></li>`).join('')}</ul>` : ''}
      <div class="scorecard-actions">
        <button class="ghost btn-small" id="scorecardCopyBtn">${i18n('scorecardCopyBtn')}</button>
        <button class="ghost btn-small" id="scorecardDownloadBtn">${i18n('scorecardDownloadBtn')}</button>
        <button class="ghost btn-small" id="scorecardDetailBtn" title="${escapeAttr(i18n('scorecardDetailBtnTitle'))}">${i18n('scorecardDetailBtn')}</button>
      </div>
    `;
    document.getElementById('scorecardCopyBtn').addEventListener('click', ()=> copyDoctorScorecard(doctorName));
    document.getElementById('scorecardDownloadBtn').addEventListener('click', ()=> downloadDoctorScorecard(doctorName));
    document.getElementById('scorecardDetailBtn').addEventListener('click', ()=> downloadDoctorPatientDetail(doctorName));
  }

  function renderDoctorScorecardSelect(){
    const names = getAllDoctorNames();
    els.doctorScorecardList.innerHTML = names.map(n=>`<option value="${escapeAttr(n)}"></option>`).join('');
    if(state.doctorScope && !names.includes(state.doctorScope)){
      state.doctorScope = null;
      try{ localStorage.removeItem(DOCTOR_SCOPE_STORAGE_KEY); }catch(e){ /* full/unavailable — ignore */ }
    }
    if(document.activeElement !== els.doctorScorecardSearch) els.doctorScorecardSearch.value = state.doctorScope || '';
    renderDoctorScorecardBody();
  }

  const DOCTOR_LEADERBOARD_MIN_VOLUME = 20;
  const DOCTOR_LEADERBOARD_POOL_SIZE = 20;

  function isRiskyCommitment(label){
    const v = (label||'').trim().toLowerCase();
    return v === 'scanned rookie' || v === 'no scan published';
  }

  function computeDoctorRiskyBreakdown(rows){
    const groups = new Map();
    rows.forEach(r=>{
      const doc = r.doctor || '—';
      if(!groups.has(doc)) groups.set(doc, {total:0, risky:0, riskyScanned:0});
      const g = groups.get(doc);
      g.total++;
      if(isRiskyCommitment(r.commitment)){
        g.risky++;
        if(r.scanned) g.riskyScanned++;
      }
    });
    return Array.from(groups.entries())
      .map(([doctor,g])=>({
        doctor, total:g.total, risky:g.risky, riskyScanned:g.riskyScanned,
        riskyPct: g.total ? Math.round(g.risky/g.total*100) : 0,
        riskyScanPct: g.risky ? Math.round(g.riskyScanned/g.risky*100) : 0,
      }))
      .filter(d=> d.total >= DOCTOR_LEADERBOARD_MIN_VOLUME)
      .sort((a,b)=> b.riskyPct - a.riskyPct);
  }

  function renderDoctorLeaderboard(rows){
    const pool = computeDoctorRiskyBreakdown(rows).slice(0, DOCTOR_LEADERBOARD_POOL_SIZE);
    if(!pool.length){
      els.doctorLeaderboard.innerHTML = `<p class="hint">${i18n('leaderboardEmpty', {min: DOCTOR_LEADERBOARD_MIN_VOLUME})}</p>`;
      return;
    }
    els.doctorLeaderboard.innerHTML = `<table class="mini-table">
      <thead><tr><th>#</th><th>${i18n('thDoctor')}</th><th>${i18n('thScanRookie')}</th><th>${i18n('thRiskyScanned')}</th></tr></thead>
      <tbody>${pool.map((d,i)=>{
        const downloadBtn = d.risky ? `<button class="link-btn" data-download-doctor="${escapeAttr(d.doctor)}" title="${escapeAttr(i18n('downloadListOfNPatients', {count: d.risky}))}">⬇</button>` : '';
        return `<tr>
        <td class="rank">${i+1}</td>
        <td>${escapeHtml(d.doctor)}</td>
        <td class="pct">${d.riskyPct}% <span class="timebar-count" style="font-weight:400;">(${d.risky}/${d.total})</span>${downloadBtn}</td>
        <td class="pct">${d.riskyScanPct}% <span class="timebar-count" style="font-weight:400;">(${d.riskyScanned}/${d.risky})</span></td>
      </tr>`;
      }).join('')}</tbody>
    </table>`;
  }

  function getRiskyRowsForDoctor(doctorName){
    return allHistoryRows().filter(r=> (r.doctor || '—') === doctorName && isRiskyCommitment(r.commitment));
  }

  function csvEscape(value){
    const s = String(value === undefined || value === null ? '' : value);
    if(/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function slugifyFilename(s){
    var noAccents = String(s||'docteur').normalize('NFD').replace(new RegExp('[' + String.fromCharCode(768) + '-' + String.fromCharCode(879) + ']', 'g'), '');
    const slug = noAccents.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || 'docteur';
  }

  function downloadDoctorRiskyPatients(doctorName){
    const rows = getRiskyRowsForDoctor(doctorName);
    if(!rows.length){ showToast(i18n('toastNoPatientsForDoctor')); return; }
    const extraKeys = extraColumnKeysForRows(rows);
    const header = ['patient_profile_id','patient','doctor_name','patient_commitment_level','days_late',i18n('csvHeaderStatus'),i18n('csvHeaderScanDate'),'monitoring_url','phone'].concat(extraKeys);
    const lines = [header.join(',')].concat(rows.map(r=>[
      r.id, r.name, r.doctor, r.commitment, r.daysLate, r.scanned ? i18n('statusScanned') : i18n('statusUnscanned'), r.scanDate, r.url, r.phone,
      ...extraKeys.map(k=> (r.extra && r.extra[k] !== undefined) ? r.extra[k] : '')
    ].map(csvEscape).join(',')));
    saveFile(`patients-scan-rookie-nsptm-${slugifyFilename(doctorName)}.csv`, lines.join('\n'), 'text/csv');
  }

  const AIRCALL_DATE_ALIASES = ['date'];
  const AIRCALL_DURATION_ALIASES = ['durationsec','duration','duree','dureesec'];
  const AIRCALL_PHONE_ALIASES = ['telephone','tel','phone','phonenumber','numerodetelephone','numero'];
  const AIRCALL_TAG_ALIASES = ['tags','tag'];
  const AIRCALL_RESULT_ALIASES = ['resultat','result'];

  // Mappe le texte exact de la colonne "Résultat" produite par le script Apps Script
  // (fonction callResult_) vers nos 3 catégories. null = appel encore en cours, à exclure.
  const AIRCALL_RESULT_BUCKET = {
    voicemaildrop: 'messagerie',
    decroche: 'decroche',
    trescourtrepondeur: 'non_decroche',
    manque: 'non_decroche',
    messagevocallaisse: 'non_decroche',
    pasdereponse: 'non_decroche',
    encours: null,
  };

  function normalizeAggressive(s){
    var noAccents = String(s||'').normalize('NFD').replace(new RegExp('[' + String.fromCharCode(768) + '-' + String.fromCharCode(879) + ']', 'g'), '');
    return noAccents.toLowerCase().replace(/[^a-z0-9]/g,'');
  }

  const AIRCALL_ROW_LIMIT = 1000;

  function parseAircallCalls(data){
    const phoneKey = findColumnByAliases(data, AIRCALL_PHONE_ALIASES, normalizeAggressive);
    if(!phoneKey) return null;
    const dateKey = findColumnByAliases(data, AIRCALL_DATE_ALIASES, normalizeAggressive);
    const durationKey = findColumnByAliases(data, AIRCALL_DURATION_ALIASES, normalizeAggressive);
    const tagKey = findColumnByAliases(data, AIRCALL_TAG_ALIASES, normalizeAggressive);
    const resultKey = findColumnByAliases(data, AIRCALL_RESULT_ALIASES, normalizeAggressive);
    return data.slice(0, AIRCALL_ROW_LIMIT).map(row=>({
      date: dateKey ? row[dateKey] : '',
      duration: durationKey ? parseFloat(row[durationKey]) : NaN,
      phone: normalizePhoneNumber(row[phoneKey]),
      tag: tagKey ? String(row[tagKey]||'').trim() : '',
      result: resultKey ? String(row[resultKey]||'').trim() : '',
    })).filter(c=>c.phone);
  }

  // La colonne "Résultat" (script Apps Script Aircall) est la source de vérité : elle vient
  // directement de call.answered_at / call.voicemail / call.missed_call_reason côté API, contrairement
  // à "Duration (sec)" qui inclut la sonnerie et vaut donc quasi toujours >0 même pour un appel manqué.
  function classifyAircallCall(call){
    if(call.result){
      const bucket = AIRCALL_RESULT_BUCKET[normalizeAggressive(call.result)];
      if(bucket !== undefined) return bucket;
    }
    if(/^voicemail\s*drop$/i.test(call.tag)) return 'messagerie';
    const duration = isNaN(call.duration) ? 0 : call.duration;
    return duration > 0 ? 'decroche' : 'non_decroche';
  }

  function dedupeAircallCallsByPhone(calls){
    const byPhone = new Map();
    calls.forEach(call=>{
      const existing = byPhone.get(call.phone);
      if(!existing){ byPhone.set(call.phone, call); return; }
      const existingDate = existing.date ? new Date(existing.date) : null;
      const callDate = call.date ? new Date(call.date) : null;
      const existingValid = existingDate && !isNaN(existingDate.getTime());
      const callValid = callDate && !isNaN(callDate.getTime());
      if(callValid && (!existingValid || callDate > existingDate)) byPhone.set(call.phone, call);
    });
    return Array.from(byPhone.values());
  }

  function computeAircallOutcomeBreakdown(rows, calls){
    const dedupedCalls = dedupeAircallCallsByPhone(calls);
    const phoneMap = new Map();
    rows.forEach(r=>{ if(r.phone) phoneMap.set(r.phone, r); });
    const buckets = {
      messagerie: {key:'messagerie', label:i18n('aircallBucketVoicemail'), total:0, scannedAfter:0},
      decroche: {key:'decroche', label:i18n('aircallBucketAnswered'), total:0, scannedAfter:0},
      non_decroche: {key:'non_decroche', label:i18n('aircallBucketNotAnswered'), total:0, scannedAfter:0},
    };
    // Kept separately from `buckets` (which alone gets embedded in a frozen snapshot — see
    // aircallFreezeBtn) so freezing a campaign doesn't balloon history with full patient rows.
    const rowsByBucket = { messagerie: [], decroche: [], non_decroche: [] };
    let matched = 0;
    dedupedCalls.forEach(call=>{
      const patient = phoneMap.get(call.phone);
      if(!patient) return;
      matched++;
      const key = classifyAircallCall(call);
      if(!key) return; // appel encore en cours : issue inconnue, on l'exclut de la répartition
      const bucket = buckets[key];
      bucket.total++;
      if(patient.scanDate) bucket.scannedAfter++;
      rowsByBucket[key].push(patient);
    });
    return { buckets: [buckets.messagerie, buckets.decroche, buckets.non_decroche], matched, totalCalls: dedupedCalls.length, rowsByBucket };
  }

  function downloadAircallBucketPatients(bucketKey, rowsByBucket, buckets){
    const rows = (rowsByBucket && rowsByBucket[bucketKey]) || [];
    if(!rows.length){ showToast(i18n('toastNoPatientsForCategory')); return; }
    const bucketLabel = (buckets.find(b=>b.key===bucketKey) || {}).label || bucketKey;
    const extraKeys = extraColumnKeysForRows(rows);
    const header = ['patient_profile_id','patient','doctor_name','patient_commitment_level','days_late',i18n('csvHeaderStatus'),i18n('csvHeaderScanDate'),'monitoring_url','phone'].concat(extraKeys);
    const lines = [header.join(',')].concat(rows.map(r=>[
      r.id, r.name, r.doctor, r.commitment, r.daysLate, r.scanned ? i18n('statusScanned') : i18n('statusUnscanned'), r.scanDate, r.url, r.phone,
      ...extraKeys.map(k=> (r.extra && r.extra[k] !== undefined) ? r.extra[k] : '')
    ].map(csvEscape).join(',')));
    saveFile(`aircall-${slugifyFilename(bucketLabel)}.csv`, lines.join('\n'), 'text/csv');
  }

  function renderAircallTable(buckets, footerHtml, rowsByBucket){
    els.aircallBreakdown.innerHTML = `<table class="mini-table">
      <thead><tr><th>${i18n('aircallThCategory')}</th><th class="num">${i18n('aircallThVolume')}</th><th class="num">${i18n('aircallThScannedAfter')}</th></tr></thead>
      <tbody>${buckets.map(b=>{
        const bucketRows = rowsByBucket && rowsByBucket[b.key];
        const downloadBtn = bucketRows && bucketRows.length
          ? `<button class="link-btn" data-download-aircall-bucket="${b.key}" title="${escapeAttr(i18n('downloadListOfNPatients', {count: b.total}))}">⬇</button>`
          : '';
        return `<tr>
        <td>${escapeHtml(b.label)}</td>
        <td class="pct">${b.total}</td>
        <td class="pct">${b.total ? Math.round(b.scannedAfter/b.total*100) : 0}% <span class="timebar-count" style="font-weight:400;">(${b.scannedAfter}/${b.total})</span>${downloadBtn}</td>
      </tr>`;
      }).join('')}</tbody>
    </table>
    <p class="hint" style="margin-top:8px;">${footerHtml}</p>`;
    if(rowsByBucket){
      document.querySelectorAll('[data-download-aircall-bucket]').forEach(btn=>{
        btn.addEventListener('click', ()=> downloadAircallBucketPatients(btn.getAttribute('data-download-aircall-bucket'), rowsByBucket, buckets));
      });
    }
  }

  function aircallFreezePlaceholder(){ return i18n('aircallFreezePlaceholder'); }

  function populateAircallFreezeTarget(){
    if(!state.aircallCalls || !state.history.length){
      els.aircallFreezeRow.style.display = 'none';
      els.aircallFreezeHint.style.display = 'none';
      return;
    }
    els.aircallFreezeRow.style.display = '';
    els.aircallFreezeHint.style.display = '';
    const sorted = state.history.slice().sort((a,b)=> b.savedAt.localeCompare(a.savedAt));
    const prevTarget = els.aircallFreezeTarget.value;
    const placeholder = `<option value="">${aircallFreezePlaceholder()}</option>`;
    els.aircallFreezeTarget.innerHTML = placeholder + sorted.map(e=>
      `<option value="${e.id}">${escapeHtml(e.label)} (${new Date(e.savedAt).toLocaleString(dateLocale())})${e.aircallSnapshot ? ' — ' + i18n('aircallPinnedBadge') : ''}</option>`
    ).join('');
    const validIds = sorted.map(e=>String(e.id));
    els.aircallFreezeTarget.value = validIds.includes(prevTarget) ? prevTarget : '';
  }

  // Vue équipe (manager/admin) : pas d'import Aircall en direct — chaque CX fige ses résultats
  // d'appel sur ses propres entrées, et on cumule ici ces résultats figés sur les entrées affichées.
  function renderTeamAircallBreakdown(){
    const entries = getFilteredHistoryEntries();
    const withSnapshot = entries.filter(e=> e.aircallSnapshot && Array.isArray(e.aircallSnapshot.buckets));
    if(!withSnapshot.length){
      els.aircallBreakdown.innerHTML = `<p class="hint">${i18n('aircallTeamNoFrozenData')}</p>`;
      return;
    }
    const bucketMap = {
      messagerie: { key:'messagerie', label:i18n('aircallBucketVoicemail'), total:0, scannedAfter:0 },
      decroche: { key:'decroche', label:i18n('aircallBucketAnswered'), total:0, scannedAfter:0 },
      non_decroche: { key:'non_decroche', label:i18n('aircallBucketNotAnswered'), total:0, scannedAfter:0 },
    };
    let matched = 0, totalCalls = 0;
    withSnapshot.forEach(e=>{
      const snap = e.aircallSnapshot;
      matched += snap.matched || 0;
      totalCalls += snap.totalCalls || 0;
      snap.buckets.forEach(b=>{
        const target = bucketMap[b.key];
        if(!target) return;
        target.total += b.total || 0;
        target.scannedAfter += b.scannedAfter || 0;
      });
    });
    renderAircallTable(
      [bucketMap.messagerie, bucketMap.decroche, bucketMap.non_decroche],
      i18n('aircallTeamFrozenSummary', { withCount: withSnapshot.length, totalCount: entries.length, matched, totalCalls })
    );
  }

  function renderAircallBreakdown(){
    const personal = isPersonalScope();
    els.aircallPersonalControls.hidden = !personal;
    if(!personal){ renderTeamAircallBreakdown(); return; }
    populateAircallFreezeTarget();
    if(!state.aircallCalls){
      els.aircallBreakdown.innerHTML = '';
      return;
    }
    const selectedId = els.aircallFreezeTarget.value;
    const selectedEntry = selectedId ? state.history.find(e=>String(e.id) === selectedId) : null;
    // Une campagne figée garde ses stats en mémoire indépendamment du fichier Aircall actuellement
    // chargé — utile si ce fichier a depuis été remplacé et ne couvre plus la période de cette campagne.
    // Un résultat figé couvre toujours tous les docteurs de la campagne : avec une fiche docteur
    // ciblée, on l'ignore et on recalcule en direct pour rester filtré à ce seul docteur.
    if(selectedEntry && selectedEntry.aircallSnapshot && !state.doctorScope){
      const snap = selectedEntry.aircallSnapshot;
      const frozenLine = i18n('aircallFrozenSummary', {date: new Date(snap.frozenAt).toLocaleString(dateLocale())});
      renderAircallTable(snap.buckets, i18n('aircallFrozenSummaryFull', {frozenLine, label: escapeHtml(selectedEntry.label), matched: snap.matched, total: snap.totalCalls}));
      return;
    }
    // Sinon (campagne non figée, aucune sélection, ou fiche docteur ciblée) : calcul en direct à
    // partir du fichier Aircall actuellement chargé — ses propres patients si une campagne est
    // choisie, tout l'historique sinon — filtré au docteur ciblé le cas échéant.
    const rows = (selectedEntry ? (selectedEntry.rows || []) : allHistoryRows())
      .filter(r=> !state.doctorScope || r.doctor === state.doctorScope);
    const scopeLabel = selectedEntry ? i18n('aircallScopeCampaign', {label: escapeHtml(selectedEntry.label)}) : i18n('aircallScopeHistory');
    if(!rows.length){
      els.aircallBreakdown.innerHTML = `<p class="hint">${i18n('aircallNoHistoryRows')}</p>`;
      return;
    }
    const { buckets, matched, totalCalls, rowsByBucket } = computeAircallOutcomeBreakdown(rows, state.aircallCalls);
    if(!matched){
      els.aircallBreakdown.innerHTML = `<p class="hint">${i18n('aircallNoMatch', {total: totalCalls, scope: scopeLabel})}</p>`;
      return;
    }
    renderAircallTable(buckets, i18n('aircallMatchedSummary', {matched, total: totalCalls, scope: scopeLabel}), rowsByBucket);
  }

  // Draws one line per channel (Appels/Email/SMS/Autres) that has data, so trends can be
  // compared at a glance instead of only being visible one at a time via the channel filter.
  // channelData: { appel?: [{dayKey,label,value}], email?: [...], sms?: [...], other?: [...] }
  // Draws one of a few simple marker shapes at (cx,cy) — used both inside the chart SVG and,
  // at a smaller size, in the legend — so channels are told apart by shape, not color.
  function shapeMarkerSvg(shape, cx, cy, r, fill, stroke, sw){
    if(shape === 'square'){
      const s = r*1.7;
      return `<rect x="${(cx-s/2).toFixed(1)}" y="${(cy-s/2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    }
    if(shape === 'triangle'){
      const h = r*1.9;
      const top = `${cx.toFixed(1)},${(cy-h*0.6).toFixed(1)}`;
      const left = `${(cx-h*0.58).toFixed(1)},${(cy+h*0.45).toFixed(1)}`;
      const right = `${(cx+h*0.58).toFixed(1)},${(cy+h*0.45).toFixed(1)}`;
      return `<polygon points="${top} ${left} ${right}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" />`;
    }
    if(shape === 'diamond'){
      const s = r*1.5;
      const top = `${cx.toFixed(1)},${(cy-s).toFixed(1)}`;
      const right = `${(cx+s).toFixed(1)},${cy.toFixed(1)}`;
      const bottom = `${cx.toFixed(1)},${(cy+s).toFixed(1)}`;
      const left = `${(cx-s).toFixed(1)},${cy.toFixed(1)}`;
      return `<polygon points="${top} ${right} ${bottom} ${left}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" />`;
    }
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
  }

  function legendShapeSvg(shape){
    const size = 14, r = 4.2;
    const marker = shapeMarkerSvg(shape, size/2, size/2, r, 'var(--surface)', 'var(--accent)', 2);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">${marker}</svg>`;
  }

  function buildMultiLineChartSVG(channelData, opts){
    const o = Object.assign({width:520,height:190,padding:{top:18,right:16,bottom:26,left:32},min:0,max:100,suffix:'%'}, opts||{});
    const {width,height,padding,min,max,suffix} = o;
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const channelKeys = CHANNEL_ORDER.filter(k=> channelData[k] && channelData[k].length);
    const allDayKeys = Array.from(new Set(channelKeys.flatMap(k=> channelData[k].map(d=>d.dayKey)))).sort();
    const n = allDayKeys.length;

    if(!n){
      return {
        svgHtml: `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(i18n('noDataYet'))}"><text x="${width/2}" y="${height/2}" text-anchor="middle" fill="var(--muted)" font-size="12">${escapeHtml(i18n('noDataYet'))}</text></svg>`,
        points: [], legend: [],
      };
    }

    const stepX = n > 1 ? innerW/(n-1) : 0;
    const xForIndex = i => padding.left + (n>1 ? i*stepX : innerW/2);
    const yFor = v => padding.top + innerH - ((v-min)/(max-min))*innerH;
    const dayIndexOf = new Map(allDayKeys.map((k,i)=>[k,i]));

    let gridSvg = '';
    for(let g=0; g<=4; g++){
      const v = min + (max-min)*g/4;
      const y = yFor(v);
      gridSvg += `<line x1="${padding.left}" y1="${y.toFixed(1)}" x2="${width-padding.right}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="1" />`;
      gridSvg += `<text x="${padding.left-6}" y="${(y+3).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--muted)">${Math.round(v)}${suffix}</text>`;
    }

    const showEvery = n <= 7 ? 1 : Math.ceil(n/6);
    let xLabelsSvg = '';
    allDayKeys.forEach((key,i)=>{
      if(i % showEvery === 0 || i === n-1){
        xLabelsSvg += `<text x="${xForIndex(i).toFixed(1)}" y="${height-8}" text-anchor="middle" font-size="9" fill="var(--muted)">${escapeHtml(formatDayLabel(key))}</text>`;
      }
    });

    const single = channelKeys.length === 1;
    let linesSvg = '', markersSvg = '', endLabelSvg = '';
    const allPoints = [];
    const legend = [];

    channelKeys.forEach(channel=>{
      const shape = CHANNEL_SHAPES[channel];
      const data = channelData[channel];
      legend.push({ key: channel, label: CHANNEL_LABEL(channel), shape });

      const pts = data.map(d=>({
        cx: xForIndex(dayIndexOf.get(d.dayKey)),
        cy: yFor(d.value),
        label: d.label,
        value: d.value,
        channel,
        seriesLabel: CHANNEL_LABEL(channel),
      }));
      allPoints.push(...pts);

      if(pts.length > 1){
        // Connects every point for this channel in chronological order, even across days it
        // has no data for — a single continuous line per channel, same as the single-line chart.
        const path = pts.map((p,i)=> (i===0?'M':'L')+p.cx.toFixed(1)+','+p.cy.toFixed(1)).join(' ');
        if(single){
          const baseline = (padding.top+innerH).toFixed(1);
          const areaPath = `${path} L${pts[pts.length-1].cx.toFixed(1)},${baseline} L${pts[0].cx.toFixed(1)},${baseline} Z`;
          linesSvg += `<path d="${areaPath}" fill="var(--accent-soft)" stroke="none" />`;
        }
        linesSvg += `<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
      }
      markersSvg += pts.map(p=> shapeMarkerSvg(shape, p.cx, p.cy, single?4:3.6, 'var(--surface)', 'var(--accent)', 2)).join('');

      if(single && pts.length){
        const last = pts[pts.length-1];
        endLabelSvg = `<text x="${last.cx.toFixed(1)}" y="${(last.cy-10).toFixed(1)}" text-anchor="${pts.length>1?'end':'middle'}" font-size="11" font-weight="600" fill="var(--accent-strong)">${last.value}${suffix}</text>`;
      }
    });

    const svgHtml = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(i18n('chartAriaLabel'))}">
      ${gridSvg}${linesSvg}${markersSvg}${endLabelSvg}${xLabelsSvg}
    </svg>`;
    return {svgHtml, points: allPoints, legend};
  }

  function wireChartHover(wrapEl, tooltipEl, pointsGetter, suffix){
    wrapEl.addEventListener('mousemove', e=>{
      const points = pointsGetter();
      const svgEl = wrapEl.querySelector('svg');
      if(!points.length || !svgEl){ tooltipEl.style.opacity = 0; return; }
      const rect = svgEl.getBoundingClientRect();
      const vb = svgEl.viewBox.baseVal;
      const scaleXToVb = vb.width / rect.width;
      const mx = (e.clientX - rect.left) * scaleXToVb;
      let nearest = points[0], bestDist = Infinity;
      points.forEach(p=>{ const dist = Math.abs(p.cx - mx); if(dist < bestDist){ bestDist = dist; nearest = p; } });
      const pxPerVbX = rect.width / vb.width;
      const pxPerVbY = rect.height / vb.height;
      tooltipEl.style.left = (nearest.cx * pxPerVbX) + 'px';
      tooltipEl.style.top = (nearest.cy * pxPerVbY) + 'px';
      tooltipEl.textContent = nearest.seriesLabel ? `${nearest.label} · ${nearest.seriesLabel} : ${nearest.value}${suffix}` : `${nearest.label} · ${nearest.value}${suffix}`;
      tooltipEl.style.opacity = 1;
    });
    wrapEl.addEventListener('mouseleave', ()=>{ tooltipEl.style.opacity = 0; });
  }

  let dailyChartPoints = [];

  function renderDailyChart(){
    const legendEl = document.getElementById('dailyChartLegendText');
    if(legendEl) legendEl.textContent = i18n(isPersonalScope() ? 'dailyChartLegendText' : 'dailyChartLegendTeam');
    const channelData = dailySeriesByChannel();
    const {svgHtml, points, legend} = buildMultiLineChartSVG(channelData);
    els.dailyChart.innerHTML = svgHtml;
    dailyChartPoints = points;
    if(legend.length > 1){
      els.dailyChartExample.innerHTML = `<span class="channel-legend">${legend.map(l=>
        `<span class="channel-legend-item">${legendShapeSvg(l.shape)}${escapeHtml(l.label)}</span>`
      ).join('')}</span>`;
    } else if(legend.length === 1){
      const series = channelData[legend[0].key];
      const last = series[series.length - 1];
      els.dailyChartExample.innerHTML = i18n('dailyChartLastPoint', {label: escapeHtml(last.label), value: last.value});
    } else {
      els.dailyChartExample.textContent = '';
    }
  }

  function allHistoryRows(){
    const rows = getFilteredHistoryEntries().flatMap(e=> e.rows || []);
    return state.doctorScope ? rows.filter(r=> r.doctor === state.doctorScope) : rows;
  }

  function renderCharts(){
    renderTrendsControls();
    renderComparisonCard();
    renderDailyChart();
    renderCommitmentBreakdown(allHistoryRows());
    renderDoctorScorecardSelect();
    renderDoctorLeaderboard(allHistoryRows());
    renderAircallBreakdown();
  }

  wireChartHover(els.dailyChartWrap, els.dailyTooltip, ()=>dailyChartPoints, '%');

  function render(){
    els.demoBanner.style.display = (state.demo && !state.historyView) ? 'flex' : 'none';
    els.historyBanner.style.display = state.historyView ? 'flex' : 'none';
    els.recoveryBanner.style.display = (!state.demo && !state.historyView && (state.calledRecovered || state.scannedRecovered)) ? 'flex' : 'none';

    // Fiche docteur ciblée : verrouille le filtre docteur du dashboard sur ce même docteur (pour
    // éviter un double-filtrage contradictoire), lève le flou du mode confidentialité pour cette
    // vue déjà restreinte à un seul docteur, et affiche une bannière pour que ce soit sans ambiguïté.
    document.body.classList.toggle('doctor-scoped', !!state.doctorScope);
    els.doctorFilter.disabled = !!state.doctorScope;
    if(state.doctorScope) els.doctorFilter.value = state.doctorScope;
    els.doctorScopeBanner.style.display = (state.doctorScope && activePage !== 'home') ? 'flex' : 'none';
    if(state.doctorScope) els.doctorScopeBannerLabel.textContent = i18n('doctorScopeBannerLabel', {doctor: state.doctorScope});

    const rows = getFiltered();
    const stats = state.doctorScope
      ? computeStats(activeRows(), null)
      : (state.historyView ? state.historyView.stats : computeStats(activeRows(), getCalledOverride()));
    const {importedTotal, calledTotal, scannedCount, unscanned, pct} = stats;

    const calledSub = calledTotal !== importedTotal ? i18n('tileCalledSubOf', {total: importedTotal}) : i18n('tileCalledSubToday');
    els.tiles.innerHTML = `
      <div class="tile"><span class="tile-label">${i18n('tileCalledLabel')}</span><span class="tile-value">${calledTotal}</span><span class="tile-sub">${calledSub}</span></div>
      <div class="tile"><span class="tile-label">${i18n('tileScannedLabel')}</span><span class="tile-value good">${scannedCount}</span><span class="tile-sub">${i18n('tileScannedSub', {pct})}</span></div>
      <div class="tile"><span class="tile-label">${i18n('tileUnscannedLabel')}</span><span class="tile-value bad">${unscanned}</span><span class="tile-sub">${i18n('tileUnscannedSub')}</span></div>
    `;

    if(rows.length === 0){
      els.tbody.innerHTML = `<tr><td colspan="14" class="empty">${i18n('noPatientMatchesFilters')}</td></tr>`;
    } else {
      els.tbody.innerHTML = rows.map(renderRowHtml).join('');
    }
    els.resultCount.textContent = i18n('resultCountShown', {shown: rows.length, total: importedTotal});
    els.expandTableBtn.style.display = rows.length > 10 ? '' : 'none';
  }

  document.querySelectorAll('#tableScroll thead th[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.key;
      if(state.sortKey === key){ state.sortDir *= -1; } else { state.sortKey = key; state.sortDir = 1; }
      document.querySelectorAll('#tableScroll thead th').forEach(t=>t.classList.remove('sorted'));
      th.classList.add('sorted');
      document.getElementById('sortNote').textContent = i18n('sortPrefix') + th.textContent.trim() + (state.sortDir===1?' ↑':' ↓');
      render();
    });
  });

  document.querySelectorAll('#historyTableScroll thead th[data-hkey]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.hkey;
      if(state.historySortKey === key){ state.historySortDir *= -1; } else { state.historySortKey = key; state.historySortDir = 1; }
      document.querySelectorAll('#historyTableScroll thead th').forEach(t=>t.classList.remove('sorted'));
      th.classList.add('sorted');
      document.getElementById('historySortNote').textContent = i18n('sortPrefix') + th.textContent.trim() + (state.historySortDir===1?' ↑':' ↓');
      renderHistory();
    });
  });

  els.calledOverrideInput.addEventListener('input', ()=>{
    render();
    if(!state.demo) saveCalledOverride(els.calledOverrideInput.value, state.calledFileMeta);
  });
  els.search.addEventListener('input', render);
  els.doctorFilter.addEventListener('change', render);
  els.statusFilter.addEventListener('change', render);

  els.runBtn.addEventListener('click', ()=>{
    exitHistoryView();
    state.demo = false;
    runCrossReference();
  });

  els.exitHistoryBtn.addEventListener('click', exitHistoryView);

  els.addHistoryBtn.addEventListener('click', addCurrentToHistory);

  els.exportHistoryBtn.addEventListener('click', exportHistoryAsJson);

  els.importHistoryBtn.addEventListener('click', ()=> els.importHistoryFile.click());
  els.importHistoryFile.addEventListener('change', ()=>{
    const file = els.importHistoryFile.files[0];
    if(file) importHistoryFromJson(file);
    els.importHistoryFile.value = '';
  });

  els.doctorLeaderboard.addEventListener('click', e=>{
    const doctorName = e.target.getAttribute('data-download-doctor');
    if(doctorName) downloadDoctorRiskyPatients(doctorName);
  });

  const DOCTOR_SCOPE_STORAGE_KEY = 'src_doctor_scope_v1';

  function setDoctorScope(name){
    state.doctorScope = name || null;
    try{
      if(state.doctorScope) localStorage.setItem(DOCTOR_SCOPE_STORAGE_KEY, state.doctorScope);
      else localStorage.removeItem(DOCTOR_SCOPE_STORAGE_KEY);
    }catch(e){ /* full/unavailable — ignore */ }
    renderDoctorScorecardBody();
    render();
    renderCharts();
  }

  els.doctorScorecardSearch.addEventListener('input', ()=>{
    const typed = els.doctorScorecardSearch.value.trim();
    if(!typed){
      if(state.doctorScope) setDoctorScope(null);
      return;
    }
    const match = getAllDoctorNames().find(n=> n === typed);
    if(match && match !== state.doctorScope) setDoctorScope(match);
  });

  els.exitDoctorScopeBtn.addEventListener('click', ()=>{
    els.doctorScorecardSearch.value = '';
    setDoctorScope(null);
  });

  const PRIVACY_MODE_STORAGE_KEY = 'src_privacy_mode_v1';
  function setPrivacyMode(on){
    document.body.classList.toggle('privacy-mode', on);
    els.privacyModeToggle.classList.toggle('active', on);
    els.privacyModeToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    try{ localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, on ? '1' : '0'); }catch(e){ /* full/unavailable — ignore */ }
  }
  els.privacyModeToggle.addEventListener('click', ()=>{
    setPrivacyMode(!document.body.classList.contains('privacy-mode'));
  });
  {
    let savedPrivacyMode = false;
    try{ savedPrivacyMode = localStorage.getItem(PRIVACY_MODE_STORAGE_KEY) === '1'; }catch(e){ /* full/unavailable — ignore */ }
    setPrivacyMode(savedPrivacyMode);
  }

  els.historyBody.addEventListener('click', e=>{
    const viewId = e.target.getAttribute('data-view');
    const delId = e.target.getAttribute('data-del');
    const renameId = e.target.getAttribute('data-rename');
    const unlinkId = e.target.getAttribute('data-unlink-aircall');
    if(viewId) viewHistoryEntry(viewId);
    if(delId) deleteHistoryEntry(delId);
    if(renameId) renameHistoryEntry(renameId);
    if(unlinkId) unlinkAircallSnapshot(unlinkId);
  });

  els.resetBtn.addEventListener('click', ()=>{
    clearFileStorage(CALLED_STORAGE_KEY);
    clearFileStorage(SCANNED_STORAGE_KEY);
    state.historyView = null;
    els.historyBanner.style.display = 'none';
    state.called = null; state.scanned = null; state.demo = true;
    state.calledRecovered = false; state.scannedRecovered = false;
    state.calledFileMeta = null; state.scannedFileMeta = null;
    els.file1.value = ''; els.file2.value = '';
    [els.dz1, els.dz2].forEach(dz=>{ dz.classList.remove('loaded', 'error', 'warn'); dz.title = ''; });
    document.getElementById('dz1label').textContent = i18n('dzDefaultLabel');
    document.getElementById('dz2label').textContent = i18n('dzDefaultLabel');
    els.dz1file.textContent = ''; els.dz2file.textContent = '';
    els.search.value=''; els.doctorFilter.value=''; els.statusFilter.value='';
    els.doctorScorecardSearch.value = '';
    setDoctorScope(null);
    els.saveName.value = defaultSnapshotName();
    updateRunButton();
    runCrossReference();
    renderCharts();
  });

  els.copyBtn.addEventListener('click', async ()=>{
    const rows = getFiltered();
    const header = ['patient_profile_id','patient','doctor_name','patient_commitment_level','days_late',i18n('csvHeaderStatus'),i18n('csvHeaderScanDate'),'monitoring_url','treatment','age','device_model','scan_version','treatment_days','total_scans','phone'];
    const lines = [header.join('\t')].concat(rows.map(r=>[r.id, r.name, r.doctor, r.commitment, r.daysLate, r.scanned?i18n('statusScanned'):i18n('statusUnscanned'), r.scanDate, r.url, r.treatment, r.age, r.deviceModel, r.scanVersion, r.treatmentDays, r.totalScans, r.phone].join('\t')));
    try{
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast(i18n('toastCopied'));
    }catch(e){}
  });

  // =====================================================================================
  // Compte Google, profil, rôles et stockage Drive (repris de l'ex-outil collab).
  //
  // Stockage : tout vit dans le dossier Google Drive partagé, lu et écrit directement depuis le
  // navigateur avec le compte Google de la personne connectée (aucun serveur).
  //   - _team-directory.json : équipes + membres (surnom, équipe, rôle), indexé par email ;
  //   - history-<personne>.json : l'historique complet d'une personne (un fichier par personne,
  //     propriété kind=history) — réécrit à chaque ajout/suppression/renommage ;
  //   - source-… : les fichiers d'origine (liste à contacter, scan yesterday) de chaque
  //     vérification, pour pouvoir les retélécharger (propriété kind=source) ;
  //   - export-….json : anciens envois de l'outil collab (propriété absente) — toujours lus ;
  //     remplacés par le fichier history-… de leur auteur à sa première synchronisation.
  // =====================================================================================
  const GOOGLE_CLIENT_ID = '464525857093-e07onmr6jdbpoh6t3t1387nmlsr1fhk0.apps.googleusercontent.com';
  const DRIVE_FOLDER_ID = '1z_wEPjSz7YWrHmG-VKVM6zw-2_iEmCKS';
  const ADMIN_EMAILS = ['m.herberger@dental-monitoring.com'];
  // Seuls les comptes Google de l'entreprise peuvent entrer dans l'app (les deux orthographes du
  // domaine existent). Un autre compte est refusé et son jeton aussitôt révoqué.
  const ALLOWED_EMAIL_DOMAINS = ['dental-monitoring.com', 'dentalmonitoring.com'];
  function isAllowedEmail(email){
    const domain = String(email || '').toLowerCase().split('@')[1] || '';
    return ALLOWED_EMAIL_DOMAINS.includes(domain);
  }
  const DEFAULT_TEAMS = ['Dach', 'Frabel', 'CEE', 'NAM', 'UKI'];
  const TEAM_DIRECTORY_FILENAME = '_team-directory.json';
  const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email';
  const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
  const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
  const TOKEN_STORAGE_KEY = 'src_collab_session_v1';

  const authEls = {
    authGate: document.getElementById('authGate'),
    appShell: document.getElementById('appShell'),
    authSection: document.getElementById('authSection'),
    googleSignInBtn: document.getElementById('googleSignInBtn'),
    googleSignInBtnLabel: document.getElementById('googleSignInBtnLabel'),
    authStatus: document.getElementById('authStatus'),
    authStatusDot: document.getElementById('authStatusDot'),
    profileGateSection: document.getElementById('profileGateSection'),
    nicknameGatePicker: document.getElementById('nicknameGatePicker'),
    nicknameGateInput: document.getElementById('nicknameGateInput'),
    nicknameGateConfirmBtn: document.getElementById('nicknameGateConfirmBtn'),
    nicknameGateStatus: document.getElementById('nicknameGateStatus'),
    teamGatePicker: document.getElementById('teamGatePicker'),
    teamGateSelect: document.getElementById('teamGateSelect'),
    teamGateConfirmBtn: document.getElementById('teamGateConfirmBtn'),
    teamGateStatus: document.getElementById('teamGateStatus'),
    profileCancelBtn: document.getElementById('profileCancelBtn'),
    userChip: document.getElementById('userChip'),
    userChipName: document.getElementById('userChipName'),
    userChipMeta: document.getElementById('userChipMeta'),
    userChipRole: document.getElementById('userChipRole'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    signOutBtn: document.getElementById('signOutBtn'),
    syncStatus: document.getElementById('syncStatus'),
    syncRetryBtn: document.getElementById('syncRetryBtn'),
    trendsScopeSelect: document.getElementById('trendsScopeSelect'),
    trendsScopeFixed: document.getElementById('trendsScopeFixed'),
    trendsCxWrap: document.getElementById('trendsCxWrap'),
    trendsCxFilter: document.getElementById('trendsCxFilter'),
    trendsEntryFilterList: document.getElementById('trendsEntryFilterList'),
    trendsRefreshBtn: document.getElementById('trendsRefreshBtn'),
    trendsScopeNote: document.getElementById('trendsScopeNote'),
    comparisonTitle: document.getElementById('comparisonTitle'),
    comparisonBody: document.getElementById('comparisonBody'),
    teamScopeSelect: document.getElementById('teamScopeSelect'),
    teamRefreshBtn: document.getElementById('teamRefreshBtn'),
    teamSummary: document.getElementById('teamSummary'),
    teamByTeamCard: document.getElementById('teamByTeamCard'),
    teamByTeamBody: document.getElementById('teamByTeamBody'),
    teamByCxBody: document.getElementById('teamByCxBody'),
    teamFilesBody: document.getElementById('teamFilesBody'),
    manageTeamsSection: document.getElementById('manageTeamsSection'),
    manageTeamsListBody: document.getElementById('manageTeamsListBody'),
    newTeamNameInput: document.getElementById('newTeamNameInput'),
    addTeamBtn: document.getElementById('addTeamBtn'),
    manageTeamsBody: document.getElementById('manageTeamsBody'),
  };

  let accessToken = null;
  let currentUser = null;
  let tokenClient = null;
  let teamDirectory = { fileId: null, teams: DEFAULT_TEAMS.slice(), members: {} };
  let myNickname = null;
  let myTeam = null;
  let profileEditing = false;
  // pool : toutes les données du dossier Drive (toutes les personnes), chargées après connexion.
  // Mes propres entrées en sont extraites dans state.history, qui fait ensuite foi pour moi.
  let pool = { files: [], entries: [], byOwner: new Map() };
  let poolLoaded = false;
  let myHistoryFileId = null;
  let myLegacyFileIds = [];
  let pendingDoctorScope = null;

  function authExpiredError(){ const err = new Error('auth-expired'); err.authExpired = true; return err; }

  // ---------------------------- Rôles ----------------------------
  // CX (par défaut) : ses propres données, plus la moyenne de son équipe (sans détail nominatif).
  // Manager : toutes les équipes, comparaison entre équipes et détail par CX.
  // Admin : comme manager, plus la gestion des équipes, des rôles et des fichiers.
  function roleOfEmail(email){
    if(ADMIN_EMAILS.includes(email)) return 'admin';
    const m = teamDirectory.members[email];
    if(m && (m.role === 'admin' || m.role === 'manager')) return m.role;
    return 'cx';
  }
  // « Voir comme » (admin) : l'app s'affiche exactement comme pour un collègue — son rôle, son
  // équipe, son historique — en lecture seule. viewAs = { email } pendant ce mode ; realSelf garde
  // mon propre surnom/équipe/historique pour revenir à ma vue d'un clic.
  let viewAs = null;
  let realSelf = null;
  function effectiveEmail(){ return viewAs ? viewAs.email : (currentUser ? currentUser.email : null); }
  function realIsAdmin(){ return currentUser ? roleOfEmail(currentUser.email) === 'admin' : false; }
  function myRole(){ return currentUser ? roleOfEmail(effectiveEmail()) : 'cx'; }
  function isAdmin(){ return myRole() === 'admin' && !viewAs; }
  function canSeeTeamTab(){ const r = myRole(); return r === 'admin' || r === 'manager'; }
  function roleLabel(role){ return i18n(role === 'admin' ? 'roleAdmin' : role === 'manager' ? 'roleManager' : 'roleCx'); }

  function teamForEmail(email){
    const m = teamDirectory.members[email];
    return (m && m.team) || null;
  }
  function displayNameForEmail(email, fallback){
    const m = email ? teamDirectory.members[email] : null;
    if(m && m.name && m.name.trim()) return m.name.trim();
    return fallback || email || '?';
  }

  // Le nombre de patients réellement contactés (ajusté à la main dans Mon suivi) est déjà résolu
  // dans entry.stats.calledTotal ; repli sur le nombre de lignes pour les très vieilles entrées.
  function entryCalledTotal(entry){
    if(entry && entry.stats && typeof entry.stats.calledTotal === 'number') return entry.stats.calledTotal;
    return (entry && entry.rows || []).length;
  }
  function entryScannedCount(entry){
    if(entry && entry.stats && typeof entry.stats.scannedCount === 'number') return entry.stats.scannedCount;
    return (entry && entry.rows || []).filter(r=> r.scanned).length;
  }
  function sumRate(entries){
    const called = entries.reduce((s,e)=> s + entryCalledTotal(e), 0);
    const scanned = entries.reduce((s,e)=> s + entryScannedCount(e), 0);
    return { called, scanned, pct: called ? Math.round(scanned / called * 100) : 0 };
  }

  // ---------------------------- Périmètre des tendances ----------------------------
  let trendsScope = 'me';          // 'me' | 'all' | 'team:<nom>'
  let trendsCx = '';               // email d'un CX (vues équipe uniquement)
  let trendsEntryFilter = [];      // ids d'entrées cochées (vide = toutes)
  let trendsEntryFilterAnchor = null;

  function isPersonalScope(){ return trendsScope === 'me'; }

  function tagAs(entries, email, name){
    entries.forEach(e=>{ e._ownerEmail = email; e._ownerName = name || email; });
    return entries;
  }
  function tagMine(entries){
    const me = effectiveEmail();
    return tagAs(entries, me, myNickname || (!viewAs && currentUser && currentUser.name) || me);
  }
  // Toutes les entrées de l'équipe/de l'entreprise : celles des autres telles que chargées depuis
  // Drive, plus les miennes dans leur état le plus à jour (state.history). En « Voir comme »,
  // state.history est l'historique du collègue et le mien (à jour) vient de realSelf.
  function everyoneEntries(){
    const me = currentUser ? currentUser.email : null;
    const eff = effectiveEmail();
    let list = pool.entries.filter(e=> e._ownerEmail !== me && e._ownerEmail !== eff);
    if(viewAs && realSelf) list = list.concat(tagAs(realSelf.history, me, realSelf.nickname));
    return list.concat(tagMine(state.history));
  }
  function entriesForTeam(team){
    return everyoneEntries().filter(e=> team === '__unassigned__' ? !teamForEmail(e._ownerEmail) : teamForEmail(e._ownerEmail) === team);
  }
  function trendsScopeEntries(){
    if(isPersonalScope() || !canSeeTeamTab()) return state.history;
    let entries = trendsScope === 'all' ? everyoneEntries() : entriesForTeam(trendsScope.slice(5));
    if(trendsCx) entries = entries.filter(e=> e._ownerEmail === trendsCx);
    return entries;
  }

  function scopeOptionsHtml(selected, withMe){
    const opts = [];
    if(withMe) opts.push(`<option value="me">${escapeHtml(i18n('scopeMe'))}</option>`);
    opts.push(`<option value="all">${escapeHtml(i18n('scopeAllTeams'))}</option>`);
    teamDirectory.teams.forEach(t=> opts.push(`<option value="team:${escapeAttr(t)}">${escapeHtml(i18n('scopeTeam', {team: t}))}</option>`));
    opts.push(`<option value="team:__unassigned__">${escapeHtml(i18n('scopeUnassigned'))}</option>`);
    return opts.join('');
  }

  function renderTrendsControls(){
    const manager = canSeeTeamTab();
    if(!manager) trendsScope = 'me';
    authEls.trendsScopeSelect.hidden = !manager;
    authEls.trendsScopeFixed.hidden = manager;
    if(manager){
      authEls.trendsScopeSelect.innerHTML = scopeOptionsHtml(trendsScope, true);
      const valid = Array.from(authEls.trendsScopeSelect.options).some(o=> o.value === trendsScope);
      if(!valid) trendsScope = 'me';
      authEls.trendsScopeSelect.value = trendsScope;
    }
    authEls.trendsScopeNote.textContent = manager
      ? i18n(isPersonalScope() ? 'scopeNoteManagerMe' : 'scopeNoteManagerTeam')
      : i18n('scopeNoteCx', {team: myTeam || '—'});

    // Filtre CX : seulement sur une vue équipe, parmi les CX présents dans ce périmètre.
    const showCx = manager && !isPersonalScope();
    authEls.trendsCxWrap.hidden = !showCx;
    if(showCx){
      const scopeWithoutCx = trendsScope === 'all' ? everyoneEntries() : entriesForTeam(trendsScope.slice(5));
      const byEmail = new Map();
      scopeWithoutCx.forEach(e=>{ if(e._ownerEmail && !byEmail.has(e._ownerEmail)) byEmail.set(e._ownerEmail, displayNameForEmail(e._ownerEmail, e._ownerName)); });
      const options = Array.from(byEmail.entries()).sort((a,b)=> a[1].localeCompare(b[1]));
      if(trendsCx && !byEmail.has(trendsCx)) trendsCx = '';
      authEls.trendsCxFilter.innerHTML = `<option value="">${escapeHtml(i18n('cxFilterAll'))}</option>` +
        options.map(([email,name])=> `<option value="${escapeAttr(email)}">${escapeHtml(name)}</option>`).join('');
      authEls.trendsCxFilter.value = trendsCx;
    } else {
      trendsCx = '';
    }
    renderEntryFilterList();
  }

  function renderEntryFilterList(){
    const entries = entriesAfterChannelFilter().slice().sort((a,b)=> b.savedAt.localeCompare(a.savedAt));
    const validIds = new Set(entries.map(e=> String(e.id)));
    trendsEntryFilter = trendsEntryFilter.filter(id=> validIds.has(id));
    if(!entries.length){
      authEls.trendsEntryFilterList.innerHTML = `<p class="entry-filter-empty">${escapeHtml(i18n('entryFilterEmpty'))}</p>`;
      return;
    }
    const withOwner = !isPersonalScope();
    authEls.trendsEntryFilterList.innerHTML = entries.map(e=>{
      const idStr = String(e.id);
      const date = new Date(effectiveDateForEntry(e)).toLocaleDateString(dateLocale());
      const owner = withOwner ? `${displayNameForEmail(e._ownerEmail, e._ownerName)} — ` : '';
      const checked = trendsEntryFilter.includes(idStr);
      return `<label class="entry-filter-row${checked ? ' checked' : ''}">
        <input type="checkbox" value="${escapeAttr(idStr)}"${checked ? ' checked' : ''}>
        <span>${escapeHtml(owner + (e.label || '') + ' (' + date + ')')}</span>
      </label>`;
    }).join('');
  }

  authEls.trendsScopeSelect.addEventListener('change', ()=>{
    trendsScope = authEls.trendsScopeSelect.value;
    trendsCx = '';
    trendsEntryFilter = [];
    trendsEntryFilterAnchor = null;
    renderCharts();
  });
  authEls.trendsCxFilter.addEventListener('change', ()=>{
    trendsCx = authEls.trendsCxFilter.value;
    trendsEntryFilter = [];
    trendsEntryFilterAnchor = null;
    renderCharts();
  });
  // Shift-clic : coche/décoche toute la plage entre deux lignes (comme Finder/Gmail).
  authEls.trendsEntryFilterList.addEventListener('click', e=>{
    const checkbox = e.target.closest('input[type=checkbox]');
    if(!checkbox) return;
    const boxes = Array.from(authEls.trendsEntryFilterList.querySelectorAll('input[type=checkbox]'));
    const idx = boxes.indexOf(checkbox);
    if(e.shiftKey && trendsEntryFilterAnchor !== null && trendsEntryFilterAnchor !== idx){
      const [start, end] = idx < trendsEntryFilterAnchor ? [idx, trendsEntryFilterAnchor] : [trendsEntryFilterAnchor, idx];
      for(let i = start; i <= end; i++){ if(boxes[i]) boxes[i].checked = checkbox.checked; }
    }
    trendsEntryFilterAnchor = idx;
    trendsEntryFilter = boxes.filter(b=> b.checked).map(b=> b.value);
    renderCharts();
  });
  authEls.trendsRefreshBtn.addEventListener('click', ()=> reloadPool());

  // Carte « Comparaison » en tête des Tendances.
  //  - Vue personnelle (tous rôles) : mon taux vs la moyenne de mon équipe, par canal, sans aucun
  //    nom de collègue.
  //  - Vue « toutes les équipes » (manager/admin) : une ligne par équipe.
  //  - Vue d'une équipe (manager/admin) : une ligne par CX.
  function channelMatches(e){ return !state.trendsChannel || inferCampaignChannel(e.label) === state.trendsChannel; }

  function renderComparisonCard(){
    if(isPersonalScope()){
      authEls.comparisonTitle.textContent = i18n('comparisonMeVsTeamTitle', {team: myTeam || '—'});
      if(!myTeam){ authEls.comparisonBody.innerHTML = `<p class="hint">${escapeHtml(i18n('comparisonNoTeam'))}</p>`; return; }
      const teamEntries = entriesForTeam(myTeam);
      const teamCxCount = new Set(teamEntries.map(e=> e._ownerEmail)).size;
      const channels = [''].concat(['appel','email','sms'].filter(ch=> teamEntries.some(e=> inferCampaignChannel(e.label) === ch)));
      const rowsHtml = channels.map(ch=>{
        const mine = sumRate(state.history.filter(e=> !ch || inferCampaignChannel(e.label) === ch));
        const team = sumRate(teamEntries.filter(e=> !ch || inferCampaignChannel(e.label) === ch));
        const delta = mine.called && team.called ? mine.pct - team.pct : null;
        const deltaHtml = delta === null ? '—' : `<span class="${delta > 0 ? 'delta-up' : delta < 0 ? 'delta-down' : ''}">${delta > 0 ? '+' : ''}${delta} pts</span>`;
        return `<tr><td>${escapeHtml(ch ? CHANNEL_LABEL(ch) : i18n('trendsChannelAll'))}</td>
          <td class="pct">${mine.called ? mine.pct + '%' : '—'} <span class="timebar-count" style="font-weight:400;">(${mine.scanned}/${mine.called})</span></td>
          <td class="pct">${team.called ? team.pct + '%' : '—'} <span class="timebar-count" style="font-weight:400;">(${team.scanned}/${team.called})</span></td>
          <td class="pct">${deltaHtml}</td></tr>`;
      }).join('');
      authEls.comparisonBody.innerHTML = `<table class="mini-table">
        <thead><tr><th>${i18n('trendsChannelLabel')}</th><th class="num">${i18n('comparisonMe')}</th><th class="num">${escapeHtml(i18n('comparisonTeamAvg'))}</th><th class="num">${i18n('comparisonDelta')}</th></tr></thead>
        <tbody>${rowsHtml}</tbody></table>
        <p class="hint" style="margin:8px 0 0;">${escapeHtml(i18n('comparisonTeamNote', {count: teamCxCount}))}</p>`;
      return;
    }
    const entries = trendsScopeEntries().filter(channelMatches);
    if(trendsScope === 'all' && !trendsCx){
      authEls.comparisonTitle.textContent = i18n('comparisonByTeamTitle');
      authEls.comparisonBody.innerHTML = groupTableHtml(entries, e=> teamForEmail(e._ownerEmail) || '__unassigned__',
        key=> key === '__unassigned__' ? i18n('scopeUnassigned') : key, i18n('thTeam'));
      return;
    }
    authEls.comparisonTitle.textContent = i18n('comparisonByCxTitle');
    authEls.comparisonBody.innerHTML = groupTableHtml(entries, e=> e._ownerEmail, key=> displayNameForEmail(key), i18n('thCx'));
  }

  function groupTableHtml(entries, keyFn, labelFn, firstHeader){
    const groups = new Map();
    entries.forEach(e=>{
      const key = keyFn(e);
      if(!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    });
    if(!groups.size) return `<p class="hint">${escapeHtml(i18n('commitmentEmptyState'))}</p>`;
    const rows = Array.from(groups.entries()).map(([key, list])=> ({ key, label: labelFn(key), count: list.length, cx: new Set(list.map(e=> e._ownerEmail)).size, ...sumRate(list) }))
      .sort((a,b)=> b.pct - a.pct || b.called - a.called);
    return `<div class="table-scroll leaderboard-scroll"><table class="mini-table">
      <thead><tr><th>${escapeHtml(firstHeader)}</th><th class="num">${i18n('thVerifications')}</th><th class="num">${i18n('historyThCalled')}</th><th class="num">${i18n('historyThScannedPlural')}</th><th class="num">${i18n('historyThRate')}</th></tr></thead>
      <tbody>${rows.map(r=> `<tr><td>${escapeHtml(r.label)}</td><td class="pct">${r.count}</td><td class="pct">${r.called}</td><td class="pct">${r.scanned}</td><td class="pct">${r.pct}%</td></tr>`).join('')}</tbody>
    </table></div>`;
  }

  // ---------------------------- Session Google ----------------------------
  let authStatusState = { key: 'authLoading', params: {}, dot: null };
  function setAuthStatus(key, params, dot){ authStatusState = { key, params: params || {}, dot: dot || null }; renderAuthStatus(); }
  function renderAuthStatus(){
    authEls.authStatus.textContent = i18n(authStatusState.key, authStatusState.params);
    authEls.authStatusDot.className = 'status-dot' + (authStatusState.dot ? ' ' + authStatusState.dot : '');
  }
  function renderGoogleBtnLabel(){ authEls.googleSignInBtnLabel.textContent = i18n('googleBtnDefault'); }

  function saveSession(token, expiresInSec, user){
    try{ localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ token, user, expiresAt: Date.now() + (Number(expiresInSec)||3300) * 1000 })); }catch(e){}
  }
  function loadValidSession(){
    try{
      const data = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) || 'null');
      if(!data || !data.token || !data.expiresAt || data.expiresAt <= Date.now()) return null;
      return data;
    }catch(e){ return null; }
  }
  function clearSession(){ try{ localStorage.removeItem(TOKEN_STORAGE_KEY); }catch(e){} }

  // Avant connexion, la barre du haut ne montre que le nom de l'app et la langue ; une fois
  // connecté : onglets, Liens, Actualiser, Confidentialité et le menu de l'avatar.
  function showGate(){
    authEls.authGate.hidden = false;
    authEls.appShell.hidden = true;
    els.pageTabsRow.hidden = true;
    document.getElementById('topbarTools').hidden = true;
    document.getElementById('gateLangSwitch').hidden = false;
    document.body.classList.remove('signed-in');
    closeMenus();
  }
  function showApp(){
    authEls.authGate.hidden = true;
    authEls.appShell.hidden = false;
    els.pageTabsRow.hidden = false;
    document.getElementById('topbarTools').hidden = false;
    document.getElementById('gateLangSwitch').hidden = true;
    document.body.classList.add('signed-in');
    renderUserChip();
  }

  function resetSessionState(){
    viewAs = null;
    realSelf = null;
    document.body.classList.remove('impersonating');
    if(viewAsEls && viewAsEls.banner) viewAsEls.banner.hidden = true;
    accessToken = null;
    currentUser = null;
    myNickname = null;
    myTeam = null;
    pool = { files: [], entries: [], byOwner: new Map() };
    poolLoaded = false;
    myHistoryFileId = null;
    myLegacyFileIds = [];
    state.history = [];
    trendsScope = 'me'; trendsCx = ''; trendsEntryFilter = [];
    authEls.authSection.classList.remove('done');
    authEls.profileGateSection.hidden = true;
  }

  // Modifications pas encore envoyées quand la session expire : gardées en mémoire et renvoyées
  // automatiquement si la même personne se reconnecte (sans recharger la page).
  let unsavedStash = null;
  function handleSessionExpired(){
    const hadUnsaved = syncDirty || syncInFlight;
    if(hadUnsaved && currentUser) unsavedStash = { email: currentUser.email, history: state.history.slice() };
    clearTimeout(syncTimer);
    syncDirty = false;
    resetSessionState();
    clearSession();
    showGate();
    setAuthStatus(hadUnsaved ? 'authExpiredUnsaved' : 'authExpired', {}, 'err');
  }

  window.initGoogle = function initGoogle(){
    if(tokenClient || !window.google || !google.accounts) return;
    tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: DRIVE_SCOPE, callback: onTokenReceived });
    authEls.googleSignInBtn.disabled = false;
    if(!accessToken) setAuthStatus('authReady', {}, null);
  };

  async function onTokenReceived(response){
    if(response.error){ setAuthStatus('authDenied', {}, 'err'); return; }
    accessToken = response.access_token;
    try{
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: 'Bearer ' + accessToken } }).then(r=> r.json());
      currentUser = { email: userInfo.email || 'unknown', name: userInfo.name || userInfo.email || 'Unknown' };
    }catch(e){
      currentUser = { email: 'unknown', name: 'Unknown' };
    }
    if(!isAllowedEmail(currentUser.email)){ refuseAccount(currentUser.email); return; }
    saveSession(accessToken, response.expires_in, currentUser);
    enterConnectedState();
  }

  function refuseAccount(email){
    const token = accessToken;
    try{ if(token && window.google && google.accounts) google.accounts.oauth2.revoke(token, ()=>{}); }catch(e){}
    resetSessionState();
    clearSession();
    clearProfileCache();
    showGate();
    setAuthStatus('authWrongDomain', { email: email && email !== 'unknown' ? email : '?' }, 'err');
  }

  authEls.googleSignInBtn.addEventListener('click', ()=>{ if(tokenClient) tokenClient.requestAccessToken(); });

  authEls.signOutBtn.addEventListener('click', ()=>{
    if((syncDirty || syncInFlight) && !confirm(i18n('confirmSignOutUnsaved'))) return;
    clearTimeout(syncTimer);
    syncDirty = false;
    unsavedStash = null;
    try{ if(accessToken && window.google && google.accounts) google.accounts.oauth2.revoke(accessToken, ()=>{}); }catch(e){}
    resetSessionState();
    clearSession();
    clearProfileCache();
    showGate();
    setAuthStatus('authSignedOut', {}, null);
    renderHistory();
  });

  // Bouton « Actualiser » : indispensable dans l'app installée (fenêtre sans barre d'adresse ni
  // bouton de rechargement). Demande d'abord au service worker de vérifier une nouvelle version,
  // puis recharge — le service worker étant en « réseau d'abord », les fichiers à jour sont servis.
  document.getElementById('reloadAppBtn').addEventListener('click', async ()=>{
    if((syncDirty || syncInFlight) && !confirm(i18n('confirmReloadUnsaved'))) return;
    syncDirty = false;
    syncInFlight = false;
    try{
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if(reg){
        await reg.update();
        // Nouvelle version trouvée : on attend qu'elle soit active (3 s max) pour qu'un seul clic
        // suffise à l'afficher.
        const incoming = reg.installing || reg.waiting;
        if(incoming){
          await new Promise(resolve=>{
            const done = ()=> resolve();
            setTimeout(done, 3000);
            incoming.addEventListener('statechange', ()=>{ if(incoming.state === 'activated' || incoming.state === 'redundant') done(); });
          });
        }
      }
    }catch(e){ /* pas de service worker (navigateur, mode privé) — simple rechargement */ }
    location.reload();
  });

  function enterConnectedState(){
    setAuthStatus('authConnected', { name: currentUser.name, email: currentUser.email }, 'ok');
    authEls.authSection.classList.add('done');
    const cached = loadProfileCache(currentUser.email);
    if(cached){
      myNickname = cached.name;
      myTeam = cached.team;
      teamDirectory.members[currentUser.email] = { name: cached.name, team: cached.team, role: cached.role };
      finishProfile();
      return;
    }
    ensureOnboardingAndProceed();
  }

  // ---------------------------- Annuaire d'équipe (Drive) ----------------------------
  async function driveFetch(url, opts){
    const o = Object.assign({}, opts || {});
    o.headers = Object.assign({ Authorization: 'Bearer ' + accessToken }, o.headers || {});
    const res = await fetch(url, o);
    if(res.status === 401) throw authExpiredError();
    return res;
  }

  function multipartBody(metadata, content, contentType){
    const boundary = '-------srs' + Date.now() + Math.random().toString(16).slice(2);
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`, content, `\r\n--${boundary}--`,
    ]);
    return { body, contentType: `multipart/related; boundary=${boundary}` };
  }

  async function loadTeamDirectory(){
    const q = encodeURIComponent(`'${DRIVE_FOLDER_ID}' in parents and trashed=false and name='${TEAM_DIRECTORY_FILENAME}'`);
    const listJson = await (await driveFetch(`${DRIVE_API}?q=${q}&fields=files(id,name)`)).json();
    const file = (listJson.files || [])[0];
    if(!file) return { fileId: null, teams: DEFAULT_TEAMS.slice(), members: {} };
    let content = {};
    try{ content = await (await driveFetch(`${DRIVE_API}/${file.id}?alt=media`)).json(); }catch(e){ if(e && e.authExpired) throw e; content = {}; }
    const teams = (content && Array.isArray(content.teams) && content.teams.length) ? content.teams : DEFAULT_TEAMS.slice();
    return { fileId: file.id, teams, members: (content && content.members) || {} };
  }

  // Lecture-modification-écriture : l'annuaire est relu juste avant d'écrire pour réduire le
  // risque d'écraser une modification faite en même temps par quelqu'un d'autre.
  async function updateTeamDirectory(mutateFn){
    if(viewAs) throw new Error('read-only-impersonation');
    const fresh = await loadTeamDirectory();
    const draft = { teams: fresh.teams.slice(), members: Object.assign({}, fresh.members) };
    mutateFn(draft);
    const payload = JSON.stringify({ version: 3, updatedAt: new Date().toISOString(), teams: draft.teams, members: draft.members });
    let fileId = fresh.fileId;
    if(fileId){
      const res = await driveFetch(`${DRIVE_UPLOAD_API}/${fileId}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: payload });
      if(!res.ok) throw new Error('team-directory-update-failed');
    } else {
      const mp = multipartBody({ name: TEAM_DIRECTORY_FILENAME, parents: [DRIVE_FOLDER_ID] }, payload, 'application/json');
      const res = await driveFetch(`${DRIVE_UPLOAD_API}?uploadType=multipart`, { method: 'POST', headers: { 'Content-Type': mp.contentType }, body: mp.body });
      if(!res.ok) throw new Error('team-directory-create-failed');
      fileId = (await res.json()).id;
    }
    teamDirectory = { fileId, teams: draft.teams, members: draft.members };
    return teamDirectory;
  }

  // ---------------------------- Profil (surnom + équipe) ----------------------------
  function teamOptionsHtml(selected){
    return teamDirectory.teams.map(t=> `<option value="${escapeAttr(t)}" ${t === selected ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');
  }
  let nicknameGateStatusKey = null, teamGateStatusKey = null;
  function showNicknameGateStatus(key){ nicknameGateStatusKey = key; authEls.nicknameGateStatus.textContent = key ? i18n(key) : ''; }
  function showTeamGateStatus(key){ teamGateStatusKey = key; authEls.teamGateStatus.textContent = key ? i18n(key) : ''; }

  function showNicknameGatePicker(){
    authEls.profileGateSection.hidden = false;
    authEls.nicknameGatePicker.hidden = false;
    authEls.teamGatePicker.hidden = true;
    authEls.nicknameGateInput.placeholder = i18n('nicknameGatePlaceholder');
    authEls.nicknameGateInput.value = myNickname || '';
    authEls.nicknameGateConfirmBtn.disabled = !authEls.nicknameGateInput.value.trim();
    authEls.profileCancelBtn.hidden = !(profileEditing && myNickname && myTeam);
    showNicknameGateStatus(null);
  }
  function showTeamGatePicker(){
    authEls.profileGateSection.hidden = false;
    authEls.nicknameGatePicker.hidden = true;
    authEls.teamGatePicker.hidden = false;
    authEls.teamGateSelect.innerHTML = `<option value="">${escapeHtml(i18n('teamGatePlaceholder'))}</option>` + teamOptionsHtml(myTeam);
    authEls.teamGateSelect.value = myTeam || '';
    authEls.teamGateConfirmBtn.disabled = !authEls.teamGateSelect.value;
    authEls.profileCancelBtn.hidden = !(profileEditing && myNickname && myTeam);
    showTeamGateStatus(null);
  }

  authEls.nicknameGateInput.addEventListener('input', ()=>{ authEls.nicknameGateConfirmBtn.disabled = !authEls.nicknameGateInput.value.trim(); });
  authEls.nicknameGateInput.addEventListener('keydown', e=>{
    if(e.key === 'Enter' && !authEls.nicknameGateConfirmBtn.disabled){ e.preventDefault(); authEls.nicknameGateConfirmBtn.click(); }
  });
  authEls.nicknameGateConfirmBtn.addEventListener('click', async ()=>{
    const nickname = authEls.nicknameGateInput.value.trim();
    if(!nickname) return;
    authEls.nicknameGateConfirmBtn.disabled = true;
    showNicknameGateStatus('nicknameGateSaving');
    try{
      await updateTeamDirectory(draft=>{
        const prev = draft.members[currentUser.email] || {};
        draft.members[currentUser.email] = Object.assign({}, prev, { name: nickname, updatedAt: new Date().toISOString() });
      });
      myNickname = nickname;
      // Le surnom voyage aussi dans les propriétés de mon fichier d'historique : on le réécrit.
      if(poolLoaded) scheduleHistorySync();
      proceedToTeamGate();
    }catch(e){
      if(e && e.authExpired){ handleSessionExpired(); return; }
      showNicknameGateStatus('nicknameGateSaveError');
      authEls.nicknameGateConfirmBtn.disabled = false;
    }
  });

  authEls.teamGateSelect.addEventListener('change', ()=>{ authEls.teamGateConfirmBtn.disabled = !authEls.teamGateSelect.value; });
  authEls.teamGateConfirmBtn.addEventListener('click', async ()=>{
    const team = authEls.teamGateSelect.value;
    if(!team) return;
    authEls.teamGateConfirmBtn.disabled = true;
    showTeamGateStatus('teamGateSaving');
    try{
      await updateTeamDirectory(draft=>{
        const prev = draft.members[currentUser.email] || {};
        draft.members[currentUser.email] = Object.assign({}, prev, { team, updatedAt: new Date().toISOString() });
      });
      myTeam = team;
      finishProfile();
    }catch(e){
      if(e && e.authExpired){ handleSessionExpired(); return; }
      showTeamGateStatus('teamGateSaveError');
      authEls.teamGateConfirmBtn.disabled = false;
    }
  });

  authEls.profileCancelBtn.addEventListener('click', ()=> finishProfile());
  authEls.editProfileBtn.addEventListener('click', ()=>{
    profileEditing = true;
    authEls.authGate.hidden = false;
    authEls.authSection.hidden = true;
    showNicknameGatePicker();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function proceedToTeamGate(){
    const existing = teamDirectory.members[currentUser.email];
    if(!profileEditing && existing && teamDirectory.teams.includes(existing.team)){
      myTeam = existing.team;
      finishProfile();
      return;
    }
    showTeamGatePicker();
  }

  function finishProfile(){
    const wasEditing = profileEditing;
    profileEditing = false;
    saveProfileCache();
    authEls.profileGateSection.hidden = true;
    authEls.authSection.hidden = false;
    showApp();
    applyRoleUi();
    if(!poolLoaded) reloadPool();
    else { renderCharts(); if(activePage === 'team') renderTeamPage(); }
    if(wasEditing) showToast(i18n('toastProfileSaved'));
  }

  async function ensureOnboardingAndProceed(){
    authEls.profileGateSection.hidden = false;
    authEls.nicknameGatePicker.hidden = false;
    authEls.teamGatePicker.hidden = true;
    authEls.profileCancelBtn.hidden = true;
    showNicknameGateStatus('nicknameGateLoading');
    let dir;
    try{
      dir = await loadTeamDirectory();
    }catch(e){
      if(e && e.authExpired){ handleSessionExpired(); return; }
      dir = { fileId: null, teams: DEFAULT_TEAMS.slice(), members: {} };
    }
    teamDirectory = dir;
    const existing = teamDirectory.members[currentUser.email];
    if(existing && existing.name && existing.name.trim()){
      myNickname = existing.name.trim();
      proceedToTeamGate();
      return;
    }
    showNicknameGatePicker();
  }

  function renderUserChip(){
    if(!currentUser) return;
    authEls.userChipName.textContent = myNickname || currentUser.name;
    authEls.userChipMeta.textContent = (myTeam || '—') + ' · ' + effectiveEmail();
    authEls.userChipRole.textContent = roleLabel(myRole());
    authEls.userChipRole.className = 'role-badge role-' + myRole();
    const initial = (myNickname || currentUser.name || '?').trim().charAt(0).toUpperCase() || '?';
    document.getElementById('avatarInitial').textContent = initial;
    document.getElementById('avatarBtn').title = (myNickname || currentUser.name) + ' · ' + roleLabel(myRole());
    authEls.editProfileBtn.hidden = !!viewAs;
    renderViewAsUi();
  }

  // ---------------------------- « Voir comme » (admin) ----------------------------
  const viewAsEls = {
    select: document.getElementById('viewAsSelect'),
    banner: document.getElementById('viewAsBanner'),
    bannerLabel: document.getElementById('viewAsBannerLabel'),
    exitBtn: document.getElementById('exitViewAsBtn'),
  };
  function viewAsCandidates(){
    const emails = new Set(Object.keys(teamDirectory.members));
    pool.files.forEach(f=>{ if(f.ownerEmail) emails.add(f.ownerEmail); });
    emails.delete(currentUser ? currentUser.email : '');
    return Array.from(emails).map(email=> ({ email, name: displayNameForEmail(email), team: teamForEmail(email), role: roleOfEmail(email) }))
      .sort((a,b)=> a.name.localeCompare(b.name));
  }
  function renderViewAsUi(){
    const canUse = realIsAdmin() && poolLoaded && !viewAs;
    document.getElementById('viewAsRow').hidden = !canUse;
    if(canUse){
      viewAsEls.select.innerHTML = `<option value="">${escapeHtml(i18n('viewAsPlaceholder'))}</option>` +
        viewAsCandidates().map(c=> `<option value="${escapeAttr(c.email)}">${escapeHtml(c.name + ' — ' + (c.team || i18n('scopeUnassigned')) + ' · ' + roleLabel(c.role))}</option>`).join('');
      viewAsEls.select.value = '';
    }
    viewAsEls.banner.hidden = !viewAs;
    document.body.classList.toggle('impersonating', !!viewAs);
    if(viewAs){
      viewAsEls.bannerLabel.textContent = i18n('viewAsBanner', { name: myNickname || viewAs.email, role: roleLabel(myRole()), team: myTeam || i18n('scopeUnassigned') });
    }
  }
  function readOnlyBlocked(){
    if(!viewAs) return false;
    showToast(i18n('toastViewAsReadOnly'));
    return true;
  }
  function resetViewState(){
    trendsScope = 'me'; trendsCx = ''; trendsEntryFilter = []; trendsEntryFilterAnchor = null;
    teamPageScope = 'all';
    if(state.historyView) exitHistoryView();
    if(state.doctorScope){ els.doctorScorecardSearch.value = ''; state.doctorScope = null; }
  }
  function historyOf(email){
    return Array.from((pool.byOwner.get(email) || new Map()).values()).sort((a,b)=> a.savedAt.localeCompare(b.savedAt));
  }
  function enterViewAs(email, silent){
    if(!realIsAdmin() || !poolLoaded || !email || email === currentUser.email) return;
    if(syncInFlight){ showToast(i18n('toastWaitSync')); return; }
    realSelf = { nickname: myNickname, team: myTeam, history: state.history };
    viewAs = { email };
    myNickname = displayNameForEmail(email);
    myTeam = teamForEmail(email);
    state.history = historyOf(email);
    resetViewState();
    applyRoleUi();
    renderHistory();
    render();
    setActivePage(activePage);
    if(!silent) showToast(i18n('toastViewAsOn', { name: myNickname }));
  }
  function exitViewAs(silent){
    if(!viewAs) return null;
    const was = viewAs.email;
    viewAs = null;
    myNickname = realSelf.nickname;
    myTeam = realSelf.team;
    state.history = realSelf.history;
    realSelf = null;
    resetViewState();
    applyRoleUi();
    renderHistory();
    render();
    setActivePage(activePage);
    if(syncDirty) scheduleHistorySync();
    if(!silent) showToast(i18n('toastViewAsOff'));
    return was;
  }
  viewAsEls.select.addEventListener('change', ()=>{ if(viewAsEls.select.value){ closeMenus(); enterViewAs(viewAsEls.select.value); } });
  viewAsEls.exitBtn.addEventListener('click', ()=> exitViewAs());

  // Tout ce qui dépend du rôle, recalculé à la connexion et après un changement de rôle/équipe.
  function applyRoleUi(){
    els.tabTeamBtn.hidden = !canSeeTeamTab();
    els.homeTeamBtn.hidden = !canSeeTeamTab();
    authEls.manageTeamsSection.hidden = !isAdmin();
    renderUserChip();
    renderHomeGreeting();
    if(activePage === 'team' && !canSeeTeamTab()) setActivePage('dashboard');
    if(deferredTeamPage && canSeeTeamTab()){ deferredTeamPage = false; setActivePage('team'); }
    else if(poolLoaded) deferredTeamPage = false;
  }
  function renderHomeGreeting(){
    els.homeGreeting.textContent = currentUser ? i18n('homeGreeting', {name: myNickname || currentUser.name, team: myTeam || '—', role: roleLabel(myRole())}) : '';
  }

  // Profil mis en cache sur l'appareil : au rechargement (session Google encore valide), l'app
  // s'affiche tout de suite sur la page en cours au lieu de repasser par l'écran de connexion ;
  // l'annuaire réel est relu en arrière-plan juste après.
  const PROFILE_CACHE_KEY = 'src_profile_cache_v1';
  function saveProfileCache(){
    if(!currentUser || !myNickname || !myTeam) return;
    const m = teamDirectory.members[currentUser.email] || {};
    try{ localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ email: currentUser.email, name: myNickname, team: myTeam, role: m.role || '' })); }catch(e){}
  }
  function loadProfileCache(email){
    try{
      const c = JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY) || 'null');
      return c && c.email === email && c.name && c.team ? c : null;
    }catch(e){ return null; }
  }
  function clearProfileCache(){ try{ localStorage.removeItem(PROFILE_CACHE_KEY); }catch(e){} }

  // ---------------------------- Chargement des données (Drive) ----------------------------
  async function listFolderFiles(){
    const files = [];
    let pageToken = '';
    const q = encodeURIComponent(`'${DRIVE_FOLDER_ID}' in parents and trashed=false`);
    do{
      const url = `${DRIVE_API}?q=${q}&pageSize=1000&fields=nextPageToken,files(id,name,properties,createdTime,modifiedTime,size)` + (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
      const json = await (await driveFetch(url)).json();
      files.push(...(json.files || []));
      pageToken = json.nextPageToken || '';
    }while(pageToken);
    return files;
  }

  // Exécute fn sur chaque élément avec au plus `limit` appels en parallèle.
  async function mapLimit(items, limit, fn){
    const results = new Array(items.length);
    let next = 0;
    async function worker(){
      while(next < items.length){
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
  }

  async function fetchPool(){
    const listed = await listFolderFiles();
    const dataFiles = listed.filter(f=> f.name !== TEAM_DIRECTORY_FILENAME && !(f.properties && f.properties.kind === 'source'));
    const loaded = await mapLimit(dataFiles, 6, async f=>{
      const props = f.properties || {};
      const detail = {
        id: f.id, name: f.name, kind: props.kind === 'history' ? 'history' : 'export',
        ownerEmail: props.uploaderEmail || null, ownerName: props.uploaderName || f.name,
        createdTime: f.createdTime, modifiedTime: f.modifiedTime || f.createdTime, entryCount: 0, unreadable: false,
      };
      try{
        const content = await (await driveFetch(`${DRIVE_API}/${f.id}?alt=media`)).json();
        const entries = Array.isArray(content) ? content : content && content.entries;
        if(!Array.isArray(entries)){ detail.unreadable = true; return { detail, entries: [] }; }
        detail.entryCount = entries.length;
        return { detail, entries };
      }catch(e){
        if(e && e.authExpired) throw e;
        detail.unreadable = true;
        return { detail, entries: [] };
      }
    });
    // Une même entrée peut exister dans un ancien export ET dans le fichier history-… de la même
    // personne : la version du fichier history-… (la plus récente) l'emporte.
    // Dédoublonnage à deux niveaux : par personne (pour reconstruire son propre historique) et
    // global (pour les vues équipe, où une même vérification ne doit compter qu'une fois).
    const byId = new Map();
    const byOwner = new Map();
    const prefer = (existing, kind)=> !existing || (kind === 'history' && existing._fromKind !== 'history');
    loaded.forEach(({ detail, entries })=>{
      entries.forEach(entry=>{
        if(!entry || !entry.id || !Array.isArray(entry.rows) || !entry.stats) return;
        const id = String(entry.id);
        entry._ownerEmail = detail.ownerEmail;
        entry._ownerName = detail.ownerName;
        entry._fromKind = detail.kind;
        if(!byOwner.has(detail.ownerEmail)) byOwner.set(detail.ownerEmail, new Map());
        const mine = byOwner.get(detail.ownerEmail);
        if(prefer(mine.get(id), detail.kind)) mine.set(id, entry);
        if(prefer(byId.get(id), detail.kind)) byId.set(id, entry);
      });
    });
    return { files: loaded.map(l=> l.detail), entries: Array.from(byId.values()), byOwner };
  }

  function setPoolLoading(on){
    document.body.classList.toggle('pool-loading', on);
    if(on){
      els.historyBody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(i18n('historyLoading'))}</td></tr>`;
    }
  }

  async function reloadPool(){
    if(!accessToken) return;
    if(syncInFlight || (syncDirty && !viewAs)){ showToast(i18n('toastWaitSync')); return; }
    // « Voir comme » actif : on revient un instant à ma vue pour recharger mes propres données,
    // puis on rebascule sur le même collègue avec ses données fraîches.
    const viewingEmail = exitViewAs(true);
    setPoolLoading(true);
    try{
      const [dir, data] = await Promise.all([loadTeamDirectory(), fetchPool()]);
      teamDirectory = dir;
      const me = currentUser.email;
      const existing = teamDirectory.members[me];
      if(existing && existing.team && teamDirectory.teams.includes(existing.team)) myTeam = existing.team;
      if(existing && existing.name && existing.name.trim()) myNickname = existing.name.trim();
      saveProfileCache();
      pool = data;
      myHistoryFileId = (pool.files.find(f=> f.kind === 'history' && f.ownerEmail === me) || {}).id || null;
      myLegacyFileIds = pool.files.filter(f=> f.kind === 'export' && f.ownerEmail === me).map(f=> f.id);
      state.history = Array.from((pool.byOwner.get(me) || new Map()).values())
        .sort((a,b)=> a.savedAt.localeCompare(b.savedAt))
        .slice(-HISTORY_MAX_ENTRIES);
      let restoredUnsaved = false;
      if(unsavedStash && unsavedStash.email === me){
        state.history = unsavedStash.history;
        restoredUnsaved = true;
      }
      unsavedStash = null;
      poolLoaded = true;
      setPoolLoading(false);
      setSyncStatus(myLegacyFileIds.length ? 'pending' : 'ok');
      applyRoleUi();
      renderHistory();
      if(pendingDoctorScope){ const d = pendingDoctorScope; pendingDoctorScope = null; if(getAllDoctorNames().includes(d)) setDoctorScope(d); }
      if(activePage === 'team') renderTeamPage();
      // Mes anciens envois collab sont fusionnés dans mon fichier history-… dès la connexion.
      if(myLegacyFileIds.length || restoredUnsaved) scheduleHistorySync();
      if(viewingEmail) enterViewAs(viewingEmail, true);
    }catch(e){
      setPoolLoading(false);
      if(e && e.authExpired){ handleSessionExpired(); return; }
      els.historyBody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(i18n('historyLoadError'))}</td></tr>`;
      setSyncStatus('error');
    }
  }

  // ---------------------------- Synchronisation de mon historique ----------------------------
  let syncTimer = null;
  let syncInFlight = false;
  let syncDirty = false;
  let syncState = 'idle';

  function setSyncStatus(s){
    syncState = s;
    renderSyncStatus();
  }
  function renderSyncStatus(){
    const key = { ok: 'syncOk', pending: 'syncPending', saving: 'syncSaving', error: 'syncError', idle: '' }[syncState] || '';
    authEls.syncStatus.textContent = key ? i18n(key) : '';
    authEls.syncStatus.className = 'sync-status sync-' + syncState;
    authEls.syncRetryBtn.hidden = syncState !== 'error';
  }
  authEls.syncRetryBtn.addEventListener('click', ()=>{ if(poolLoaded) runHistorySync(); else reloadPool(); });

  function scheduleHistorySync(){
    if(!accessToken || !poolLoaded) return;
    syncDirty = true;
    // En « Voir comme », state.history est celui d'un collègue : on n'écrit rien. L'éventuelle
    // synchronisation en attente (la mienne) repart dès le retour à ma vue — voir exitViewAs().
    if(viewAs) return;
    setSyncStatus('pending');
    clearTimeout(syncTimer);
    syncTimer = setTimeout(runHistorySync, 700);
  }

  async function runHistorySync(){
    clearTimeout(syncTimer);
    if(viewAs){ syncDirty = true; return; }
    if(syncInFlight){ syncDirty = true; return; }
    if(!accessToken) return;
    syncInFlight = true;
    syncDirty = false;
    setSyncStatus('saving');
    try{
      await uploadPendingSources();
      await writeMyHistoryFile();
      await trashMyLegacyFiles();
      syncInFlight = false;
      if(syncDirty){ runHistorySync(); return; }
      setSyncStatus('ok');
      renderImportedFilesTable();
    }catch(e){
      syncInFlight = false;
      syncDirty = true;
      if(e && e.authExpired){ handleSessionExpired(); return; }
      setSyncStatus('error');
    }
  }

  window.addEventListener('beforeunload', e=>{
    if(syncDirty || syncInFlight){ e.preventDefault(); e.returnValue = ''; }
  });

  function dataUrlToBlob(dataUrl){
    const [head, b64] = dataUrl.split(',');
    const mime = (head.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64 || '');
    const bytes = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  function safeEmailSlug(){ return (currentUser.email || 'unknown').split('@')[0].replace(/[^a-zA-Z0-9]+/g, '-'); }

  // Envoie sur Drive, en fichiers séparés, les fichiers d'origine encore embarqués (dataUrl) dans
  // mes entrées, puis ne garde que leur ID — l'historique lui-même reste léger à charger.
  async function uploadPendingSources(){
    for(const entry of state.history){
      for(const field of ['calledFileMeta', 'scannedFileMeta']){
        const meta = entry[field];
        if(!meta || !meta.dataUrl || meta.sourceFileId) continue;
        const blob = dataUrlToBlob(meta.dataUrl);
        const mp = multipartBody({
          name: `source-${safeEmailSlug()}-${entry.id}-${field === 'calledFileMeta' ? 'called' : 'scanned'}-${meta.name || 'export'}`,
          parents: [DRIVE_FOLDER_ID],
          properties: { kind: 'source', uploaderEmail: currentUser.email, entryId: String(entry.id) },
        }, blob, blob.type || 'application/octet-stream');
        const res = await driveFetch(`${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': mp.contentType }, body: mp.body });
        if(!res.ok) throw new Error('source-upload-failed');
        meta.sourceFileId = (await res.json()).id;
        delete meta.dataUrl;
      }
    }
  }

  function cleanEntryForStorage(entry){
    const out = {};
    Object.keys(entry).forEach(k=>{ if(!k.startsWith('_')) out[k] = entry[k]; });
    out.calledFileMeta = stripMetaDataUrl(entry.calledFileMeta);
    out.scannedFileMeta = stripMetaDataUrl(entry.scannedFileMeta);
    return out;
  }

  async function writeMyHistoryFile(){
    const payload = JSON.stringify({
      version: 1, tool: 'Suivi Relance Scan', ownerEmail: currentUser.email, updatedAt: new Date().toISOString(),
      entries: state.history.map(cleanEntryForStorage),
    });
    const metadata = { properties: { kind: 'history', uploaderEmail: currentUser.email, uploaderName: myNickname || currentUser.name } };
    if(myHistoryFileId){
      const mp = multipartBody(metadata, payload, 'application/json');
      const res = await driveFetch(`${DRIVE_UPLOAD_API}/${myHistoryFileId}?uploadType=multipart&fields=id`, { method: 'PATCH', headers: { 'Content-Type': mp.contentType }, body: mp.body });
      if(res.status === 404){ myHistoryFileId = null; return writeMyHistoryFile(); }
      if(!res.ok) throw new Error('history-update-failed');
      return;
    }
    metadata.name = `history-${safeEmailSlug()}.json`;
    metadata.parents = [DRIVE_FOLDER_ID];
    const mp = multipartBody(metadata, payload, 'application/json');
    const res = await driveFetch(`${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': mp.contentType }, body: mp.body });
    if(!res.ok) throw new Error('history-create-failed');
    myHistoryFileId = (await res.json()).id;
  }

  // Mes anciens envois collab (export-….json) sont désormais entièrement contenus dans mon fichier
  // history-… : on les met à la corbeille Drive (récupérables), jamais supprimés définitivement.
  async function trashMyLegacyFiles(){
    const ids = myLegacyFileIds.slice();
    for(const id of ids){
      const res = await driveFetch(`${DRIVE_API}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }) });
      if(res.ok || res.status === 404) myLegacyFileIds = myLegacyFileIds.filter(x=> x !== id);
    }
  }

  function trashEntrySources(entry){
    if(!accessToken || !entry) return;
    ['calledFileMeta', 'scannedFileMeta'].forEach(field=>{
      const id = entry[field] && entry[field].sourceFileId;
      if(!id) return;
      driveFetch(`${DRIVE_API}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }) }).catch(()=>{});
    });
  }

  async function downloadEntrySource(meta){
    if(meta.dataUrl){ downloadDataUrl(meta.dataUrl, meta.name); return; }
    if(!meta.sourceFileId || !accessToken) return;
    try{
      const res = await driveFetch(`${DRIVE_API}/${meta.sourceFileId}?alt=media`);
      if(!res.ok){ showToast(i18n('toastDownloadFailed')); return; }
      const url = URL.createObjectURL(await res.blob());
      downloadDataUrl(url, meta.name);
      setTimeout(()=> URL.revokeObjectURL(url), 2000);
    }catch(e){
      if(e && e.authExpired){ handleSessionExpired(); return; }
      showToast(i18n('toastDownloadFailed'));
    }
  }

  // ---------------------------- Onglet Équipe (manager / admin) ----------------------------
  let teamPageScope = 'all';

  function renderTeamPage(){
    if(!canSeeTeamTab()) return;
    authEls.teamScopeSelect.innerHTML = scopeOptionsHtml(teamPageScope, false);
    if(!Array.from(authEls.teamScopeSelect.options).some(o=> o.value === teamPageScope)) teamPageScope = 'all';
    authEls.teamScopeSelect.value = teamPageScope;
    const entries = teamPageScope === 'all' ? everyoneEntries() : entriesForTeam(teamPageScope.slice(5));
    const total = sumRate(entries);
    const cxCount = new Set(entries.map(e=> e._ownerEmail)).size;
    authEls.teamSummary.innerHTML = `
      <div class="tile"><span class="tile-label">${i18n('tileActiveCx')}</span><span class="tile-value">${cxCount}</span><span class="tile-sub">${i18n('tileActiveCxSub')}</span></div>
      <div class="tile"><span class="tile-label">${i18n('thVerifications')}</span><span class="tile-value">${entries.length}</span><span class="tile-sub">${i18n('tileVerificationsSub')}</span></div>
      <div class="tile"><span class="tile-label">${i18n('tileCalledLabel')}</span><span class="tile-value">${total.called}</span><span class="tile-sub">${i18n('tilePatientsSub')}</span></div>
      <div class="tile"><span class="tile-label">${i18n('tileScanRateLabel')}</span><span class="tile-value good">${total.pct}%</span><span class="tile-sub">${i18n('tileScanRateSub', {scanned: total.scanned, total: total.called})}</span></div>`;

    authEls.teamByTeamCard.hidden = teamPageScope !== 'all';
    if(teamPageScope === 'all'){
      authEls.teamByTeamBody.innerHTML = groupTableHtml(entries, e=> teamForEmail(e._ownerEmail) || '__unassigned__',
        key=> key === '__unassigned__' ? i18n('scopeUnassigned') : key, i18n('thTeam'));
    }
    renderTeamByCx(entries);
    renderTeamFiles();
    if(isAdmin()) renderManageTeamsPanel();
  }

  function renderTeamByCx(entries){
    const byCx = new Map();
    entries.forEach(e=>{
      if(!byCx.has(e._ownerEmail)) byCx.set(e._ownerEmail, []);
      byCx.get(e._ownerEmail).push(e);
    });
    if(!byCx.size){ authEls.teamByCxBody.innerHTML = `<p class="hint">${escapeHtml(i18n('teamNoData'))}</p>`; return; }
    const rows = Array.from(byCx.entries()).map(([email, list])=>{
      const last = list.reduce((m,e)=> e.savedAt > m ? e.savedAt : m, '');
      return { email, name: displayNameForEmail(email, list[0]._ownerName), team: teamForEmail(email), count: list.length, last, ...sumRate(list) };
    }).sort((a,b)=> b.pct - a.pct || b.called - a.called);
    authEls.teamByCxBody.innerHTML = `<div class="table-scroll"><table class="mini-table">
      <thead><tr><th>${i18n('thCx')}</th><th>${i18n('thTeam')}</th><th class="num">${i18n('thVerifications')}</th><th class="num">${i18n('historyThCalled')}</th><th class="num">${i18n('historyThScannedPlural')}</th><th class="num">${i18n('historyThRate')}</th><th>${i18n('thLastCheck')}</th><th></th></tr></thead>
      <tbody>${rows.map(r=> `<tr>
        <td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.team || i18n('scopeUnassigned'))}</td>
        <td class="pct">${r.count}</td><td class="pct">${r.called}</td><td class="pct">${r.scanned}</td><td class="pct">${r.pct}%</td>
        <td class="hint">${r.last ? new Date(r.last).toLocaleDateString(dateLocale()) : '—'}</td>
        <td><button class="ghost btn-small" data-cx-trends="${escapeAttr(r.email)}">${i18n('seeTrendsBtn')}</button></td>
      </tr>`).join('')}</tbody></table></div>`;
    authEls.teamByCxBody.querySelectorAll('[data-cx-trends]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const email = btn.getAttribute('data-cx-trends');
        const team = teamForEmail(email);
        trendsScope = team ? 'team:' + team : 'team:__unassigned__';
        trendsCx = email;
        trendsEntryFilter = [];
        setActivePage('trends');
        renderCharts();
      });
    });
  }

  function renderTeamFiles(){
    const scopeTeam = teamPageScope === 'all' ? null : teamPageScope.slice(5);
    const files = pool.files.filter(f=> !scopeTeam || (scopeTeam === '__unassigned__' ? !teamForEmail(f.ownerEmail) : teamForEmail(f.ownerEmail) === scopeTeam))
      .sort((a,b)=> (b.modifiedTime || '').localeCompare(a.modifiedTime || ''));
    if(!files.length){ authEls.teamFilesBody.innerHTML = `<p class="hint">${escapeHtml(i18n('teamNoFiles'))}</p>`; return; }
    authEls.teamFilesBody.innerHTML = `<div class="table-scroll capped"><table class="mini-table">
      <thead><tr><th>${i18n('thCx')}</th><th>${i18n('thFileType')}</th><th>${i18n('thUpdated')}</th><th class="num">${i18n('thEntries')}</th><th></th></tr></thead>
      <tbody>${files.map(f=> `<tr>
        <td>${escapeHtml(displayNameForEmail(f.ownerEmail, f.ownerName))}</td>
        <td>${escapeHtml(i18n(f.kind === 'history' ? 'fileKindHistory' : 'fileKindExport'))}</td>
        <td class="hint">${f.modifiedTime ? new Date(f.modifiedTime).toLocaleString(dateLocale()) : '—'}</td>
        <td class="pct">${f.unreadable ? escapeHtml(i18n('unreadable')) : f.entryCount}</td>
        <td style="white-space:nowrap;">
          <button class="ghost btn-small" data-dl-file="${escapeAttr(f.id)}" data-dl-name="${escapeAttr(f.name)}">${i18n('downloadBtnLabel')}</button>
          ${isAdmin() ? `<button class="ghost btn-small" data-trash-file="${escapeAttr(f.id)}">${i18n('deleteBtnLabel')}</button>` : ''}
        </td></tr>`).join('')}</tbody></table></div>`;
    authEls.teamFilesBody.querySelectorAll('[data-dl-file]').forEach(btn=>{
      btn.addEventListener('click', ()=> downloadEntrySource({ sourceFileId: btn.getAttribute('data-dl-file'), name: btn.getAttribute('data-dl-name') }));
    });
    authEls.teamFilesBody.querySelectorAll('[data-trash-file]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-trash-file');
        if(id === teamDirectory.fileId || !confirm(i18n('confirmTrashFile'))) return;
        try{
          const res = await driveFetch(`${DRIVE_API}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }) });
          if(!res.ok){ showToast(i18n('toastDeleteFailed')); return; }
          if(id === myHistoryFileId) myHistoryFileId = null;
          reloadPool();
        }catch(e){
          if(e && e.authExpired){ handleSessionExpired(); return; }
          showToast(i18n('toastDeleteFailed'));
        }
      });
    });
  }

  authEls.teamScopeSelect.addEventListener('change', ()=>{ teamPageScope = authEls.teamScopeSelect.value; renderTeamPage(); });
  authEls.teamRefreshBtn.addEventListener('click', ()=> reloadPool());

  // ---------------------------- Gestion des équipes et rôles (admin) ----------------------------
  function renderTeamsListBody(){
    const counts = {};
    Object.values(teamDirectory.members).forEach(m=>{ if(m.team) counts[m.team] = (counts[m.team] || 0) + 1; });
    authEls.manageTeamsListBody.innerHTML = teamDirectory.teams.length
      ? `<div class="team-chip-list">${teamDirectory.teams.map(t=> `
          <span class="team-chip">${escapeHtml(t)} <span class="team-chip-count">${counts[t] || 0}</span>
            <button type="button" class="team-chip-remove" data-remove-team="${escapeAttr(t)}" title="${escapeAttr(i18n('removeTeamBtn'))}">&times;</button>
          </span>`).join('')}</div>`
      : `<p class="hint">${escapeHtml(i18n('noTeamsYet'))}</p>`;
    authEls.manageTeamsListBody.querySelectorAll('[data-remove-team]').forEach(btn=>{
      btn.addEventListener('click', ()=> removeTeam(btn.getAttribute('data-remove-team')));
    });
    authEls.newTeamNameInput.placeholder = i18n('newTeamNamePlaceholder');
  }

  async function addTeam(){
    const raw = authEls.newTeamNameInput.value.trim();
    if(!raw) return;
    authEls.addTeamBtn.disabled = true;
    try{
      await updateTeamDirectory(draft=>{ if(!draft.teams.some(t=> t.toLowerCase() === raw.toLowerCase())) draft.teams.push(raw); });
      authEls.newTeamNameInput.value = '';
      showToast(i18n('toastTeamAdded'));
      renderTeamPage();
    }catch(e){
      if(e && e.authExpired){ handleSessionExpired(); return; }
      showToast(i18n('toastTeamActionFailed'));
    }
    authEls.addTeamBtn.disabled = false;
  }
  authEls.addTeamBtn.addEventListener('click', addTeam);
  authEls.newTeamNameInput.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); addTeam(); } });

  async function removeTeam(team){
    const count = Object.values(teamDirectory.members).filter(m=> m.team === team).length;
    if(!confirm(count > 0 ? i18n('confirmRemoveTeamWithMembers', {team, count}) : i18n('confirmRemoveTeam', {team}))) return;
    try{
      await updateTeamDirectory(draft=>{
        draft.teams = draft.teams.filter(t=> t !== team);
        Object.keys(draft.members).forEach(email=>{
          if(draft.members[email].team === team) draft.members[email] = Object.assign({}, draft.members[email], { team: '' });
        });
      });
      if(myTeam === team) myTeam = null;
      if(teamPageScope === 'team:' + team) teamPageScope = 'all';
      if(trendsScope === 'team:' + team){ trendsScope = 'me'; trendsCx = ''; }
      showToast(i18n('toastTeamRemoved'));
      applyRoleUi();
      renderTeamPage();
      renderCharts();
    }catch(e){
      if(e && e.authExpired){ handleSessionExpired(); return; }
      showToast(i18n('toastTeamActionFailed'));
    }
  }

  function renderManageTeamsPanel(){
    if(!isAdmin()) return;
    renderTeamsListBody();
    const rows = new Map();
    Object.keys(teamDirectory.members).forEach(email=>{
      const m = teamDirectory.members[email];
      rows.set(email, { name: m.name || email, team: m.team || '', role: m.role || '' });
    });
    pool.files.forEach(f=>{
      if(f.ownerEmail && !rows.has(f.ownerEmail)) rows.set(f.ownerEmail, { name: f.ownerName || f.ownerEmail, team: '', role: '' });
    });
    const sorted = Array.from(rows.entries()).sort((a,b)=> a[1].name.localeCompare(b[1].name));
    if(!sorted.length){ authEls.manageTeamsBody.innerHTML = `<p class="hint">${escapeHtml(i18n('manageTeamsEmpty'))}</p>`; return; }
    authEls.manageTeamsBody.innerHTML = `<div class="table-scroll"><table class="mini-table">
      <thead><tr><th>${i18n('thName')}</th><th>${i18n('thEmail')}</th><th>${i18n('thTeam')}</th><th>${i18n('thRole')}</th></tr></thead>
      <tbody>${sorted.map(([email, r])=>{
        const teamCell = `<select class="inline-select" data-member-email="${escapeAttr(email)}"><option value="">${escapeHtml(i18n('scopeUnassigned'))}</option>${teamOptionsHtml(r.team)}</select>`;
        const roleCell = ADMIN_EMAILS.includes(email)
          ? `<span class="hint" title="${escapeAttr(i18n('roleFixedAdminHint'))}">${i18n('roleAdmin')}</span>`
          : `<select class="inline-select" data-member-role-email="${escapeAttr(email)}">
              <option value="" ${!r.role ? 'selected' : ''}>${i18n('roleCx')}</option>
              <option value="manager" ${r.role === 'manager' ? 'selected' : ''}>${i18n('roleManager')}</option>
              <option value="admin" ${r.role === 'admin' ? 'selected' : ''}>${i18n('roleAdmin')}</option>
            </select>`;
        return `<tr><td>${escapeHtml(r.name)}</td><td class="hint">${escapeHtml(email)}</td><td>${teamCell}</td><td>${roleCell}</td></tr>`;
      }).join('')}</tbody></table></div>`;
    const wire = (attr, field, toastOk, toastKo)=>{
      authEls.manageTeamsBody.querySelectorAll(`[${attr}]`).forEach(sel=>{
        sel.addEventListener('change', async ()=>{
          const email = sel.getAttribute(attr);
          const value = sel.value;
          sel.disabled = true;
          const fallbackName = (rows.get(email) && rows.get(email).name) || email;
          try{
            await updateTeamDirectory(draft=>{
              const prev = draft.members[email] || {};
              draft.members[email] = Object.assign({}, prev, { [field]: value, name: prev.name || fallbackName, updatedAt: new Date().toISOString() });
            });
            if(currentUser && email === currentUser.email && field === 'team') myTeam = value || null;
            showToast(i18n(toastOk));
            applyRoleUi();
            renderTeamPage();
            renderCharts();
          }catch(e){
            if(e && e.authExpired){ handleSessionExpired(); return; }
            showToast(i18n(toastKo));
          }
          sel.disabled = false;
        });
      });
    };
    wire('data-member-email', 'team', 'toastTeamUpdated', 'toastTeamUpdateFailed');
    wire('data-member-role-email', 'role', 'toastRoleUpdated', 'toastRoleUpdateFailed');
  }

  function refreshAuthI18n(){
    renderAuthStatus();
    renderGoogleBtnLabel();
    showNicknameGateStatus(nicknameGateStatusKey);
    showTeamGateStatus(teamGateStatusKey);
    authEls.nicknameGateInput.placeholder = i18n('nicknameGatePlaceholder');
    if(!authEls.teamGatePicker.hidden){
      const prev = authEls.teamGateSelect.value;
      authEls.teamGateSelect.innerHTML = `<option value="">${escapeHtml(i18n('teamGatePlaceholder'))}</option>` + teamOptionsHtml(prev);
      authEls.teamGateSelect.value = prev;
    }
    renderUserChip();
    renderHomeGreeting();
    renderSyncStatus();
    if(activePage === 'team') renderTeamPage();
  }


  els.saveName.value = defaultSnapshotName();
  restoreCachedFile(CALLED_STORAGE_KEY, els.dz1, document.getElementById('dz1label'), els.dz1file, 'called', 'calledFileMeta');
  restoreCachedFile(SCANNED_STORAGE_KEY, els.dz2, document.getElementById('dz2label'), els.dz2file, 'scanned', 'scannedFileMeta');
  restoreCachedFile(AIRCALL_STORAGE_KEY, els.dzAircall, els.dzAircallLabel, els.dzAircallFile, 'aircallRawCalls');
  {
    const savedRange = loadAircallRange();
    if(savedRange){
      els.aircallRangeStart.value = savedRange.start;
      els.aircallRangeEnd.value = savedRange.end;
    }
    applyAircallRange();
  }
  updateRunButton();
  state.history = [];
  renderHistory();
  runCrossReference();
  try{
    if(isReloadNavigation()){
      // La fiche docteur mémorisée ne peut être restaurée qu'une fois l'historique chargé depuis
      // Drive (sinon ce docteur n'existe pas encore dans les données) — voir reloadPool().
      pendingDoctorScope = localStorage.getItem(DOCTOR_SCOPE_STORAGE_KEY);
    } else {
      // Lancement frais : on ne restaure pas la fiche docteur mémorisée, et on nettoie la clé pour
      // qu'un rechargement ultérieur (sans nouvelle sélection) ne la fasse pas resurgir par surprise.
      localStorage.removeItem(DOCTOR_SCOPE_STORAGE_KEY);
    }
  }catch(e){ /* full/unavailable — ignore */ }

  document.getElementById('addLinkBtn').addEventListener('click', ()=>{ closeMenus(); configureCustomLink(customLinks.length); });
  document.getElementById('linksMenuItems').addEventListener('click', e=>{
    const btn = e.target.closest('[data-edit-link]');
    if(btn){ e.preventDefault(); closeMenus(); configureCustomLink(parseInt(btn.getAttribute('data-edit-link'), 10)); return; }
    if(e.target.closest('a')) closeMenus();
  });
  renderCustomLinks();

  // Menus de la barre du haut (Liens, avatar) : un clic sur le bouton ouvre/ferme, un clic
  // ailleurs ou Échap ferme. Les éléments d'action ferment aussi le menu.
  function closeMenus(except){
    document.querySelectorAll('.menu').forEach(m=>{ if(m !== except) m.hidden = true; });
    document.querySelectorAll('[data-menu-toggle]').forEach(b=>{ if(!except || b.getAttribute('data-menu-toggle') !== except.id) b.setAttribute('aria-expanded', 'false'); });
  }
  document.querySelectorAll('[data-menu-toggle]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const menu = document.getElementById(btn.getAttribute('data-menu-toggle'));
      const willOpen = menu.hidden;
      closeMenus(willOpen ? menu : null);
      menu.hidden = !willOpen;
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  });
  document.addEventListener('click', e=>{ if(!e.target.closest('.menu')) closeMenus(); });
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeMenus(); });
  ['editProfileBtn', 'signOutBtn'].forEach(id=> document.getElementById(id).addEventListener('click', ()=> closeMenus()));

  // === i18n cascade: mirrors collab's applyI18n(), adapted to this tool's own render
  //     functions (renderHistory() already triggers renderCharts() internally). ===
  function refreshToggleButtonLabels(){
    els.toggleColumnsBtn.textContent = els.resultsTable.classList.contains('show-extra') ? i18n('fewerColumnsBtn') : i18n('moreColumnsBtn');
    els.expandTableBtn.textContent = els.tableScroll.classList.contains('capped') ? i18n('expandListBtn') : i18n('collapseListBtn');
    els.expandHistoryBtn.textContent = els.historyTableScroll.classList.contains('capped') ? i18n('expandListBtn') : i18n('collapseListBtn');
  }
  function refreshSortNotes(){
    const sortNoteEl = document.getElementById('sortNote');
    if(state.sortKey === 'priority'){
      sortNoteEl.textContent = i18n('sortNoteDefault');
    } else {
      const activeTh = document.querySelector('#tableScroll thead th.sorted');
      if(activeTh) sortNoteEl.textContent = i18n('sortPrefix') + activeTh.textContent.trim() + (state.sortDir===1?' ↑':' ↓');
    }
    const historySortNoteEl = document.getElementById('historySortNote');
    if(state.historySortKey === 'date' && state.historySortDir === -1){
      historySortNoteEl.textContent = i18n('historySortNoteDefault');
    } else {
      const activeHth = document.querySelector('#historyTableScroll thead th.sorted');
      if(activeHth) historySortNoteEl.textContent = i18n('sortPrefix') + activeHth.textContent.trim() + (state.historySortDir===1?' ↑':' ↓');
    }
  }
  function applyI18n(){
    document.documentElement.lang = currentLang;
    document.title = i18n('brandTitle');
    document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = i18n(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-html]').forEach(el=>{ el.innerHTML = i18n(el.getAttribute('data-i18n-html')); });
    document.querySelectorAll('[data-i18n-title]').forEach(el=>{ el.title = i18n(el.getAttribute('data-i18n-title')); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ el.placeholder = i18n(el.getAttribute('data-i18n-placeholder')); });
    document.querySelectorAll('.lang-btn[data-lang]').forEach(b=> b.classList.toggle('active', b.getAttribute('data-lang') === currentLang));
    renderCustomLinks();
    updateRunButton();
    refreshToggleButtonLabels();
    const _prevDoctorFilterValue = els.doctorFilter.value;
    populateDoctorFilter(activeRows());
    els.doctorFilter.value = _prevDoctorFilterValue;
    if(state.historyView){
      els.historyBannerLabel.textContent = i18n('historyViewingArchive', {label: state.historyView.label, date: new Date(state.historyView.savedAt).toLocaleString(dateLocale())});
    }
    render();
    renderHistory();
    renderChangelog();
    refreshSortNotes();
    refreshAuthI18n();
  }
  function setLang(lang){
    if(lang === currentLang) return;
    currentLang = lang;
    saveLang(lang);
    applyI18n();
  }
  document.querySelectorAll('.lang-btn[data-lang]').forEach(b=> b.addEventListener('click', e=>{ e.stopPropagation(); setLang(b.getAttribute('data-lang')); }));
  applyI18n();

  // Session Google : restaurée tout de suite si un jeton encore valide est en mémoire (sans
  // attendre la librairie Google), sinon l'écran de connexion reste affiché.
  showGate();
  {
    const saved = loadValidSession();
    if(saved && !isAllowedEmail(saved.user && saved.user.email)){ clearSession(); clearProfileCache(); }
    else if(saved){
      accessToken = saved.token;
      currentUser = saved.user;
      enterConnectedState();
    }
  }
  setActivePage(initialPageFromStorage());
  document.documentElement.classList.remove('restoring');
  if(window.__gsiReady) window.initGoogle();
})();
