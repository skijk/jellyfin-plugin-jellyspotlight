(() => {
  'use strict';
  const ROOT_ID = 'jellySpotlight';
  let busy = false;
  const pick = (o, n) => o?.[n] ?? o?.[n[0].toUpperCase() + n.slice(1)];
  const api = options => ApiClient.ajax(options);
  function normalizeSettings(raw) {
    return {
      Enabled: pick(raw,'enabled') ?? true,
      Source: pick(raw,'source') || 'hot',
      Title: pick(raw,'title') || "What's hot right now",
      Density: pick(raw,'density') || 'compact',
      ItemCount: Number(pick(raw,'itemCount') || 8),
      ShowMetrics: pick(raw,'showMetrics') ?? true
    };
  }
  function homeHost() {
    return document.querySelector('#indexPage:not(.hide) .homeSectionsContainer,#indexPage:not(.hide) .sections,#indexPage:not(.hide) .content-primary,.homePage:not(.hide) .homeSectionsContainer,.homePage:not(.hide) .sections,.homePage:not(.hide) .content-primary');
  }
  async function details(ids) {
    if (!ids.length) return [];
    const result = await api({type:'GET',url:ApiClient.getUrl('Items',{Ids:ids.join(','),Fields:'Overview,PrimaryImageAspectRatio,BackdropImageTags,ImageTags'})});
    return pick(result,'items') || [];
  }
  async function load(settings) {
    if (settings.Source === 'recent') {
      const userId = ApiClient.getCurrentUserId();
      const result = await api({type:'GET',url:ApiClient.getUrl('Items',{UserId:userId,SortBy:'DateCreated',SortOrder:'Descending',IncludeItemTypes:'Movie,Series',Recursive:true,Limit:settings.ItemCount,Fields:'BackdropImageTags,ImageTags'})});
      return (pick(result,'items') || []).map(item => ({item}));
    }
    const snapshot = await api({type:'GET',url:ApiClient.getUrl('Jelana/Snapshot')});
    let rows = pick(snapshot,'trending') || [];
    if (settings.Source === 'newPopular') {
      const recent = pick(snapshot,'recent') || [];
      const trendById = new Map(rows.map(row => [pick(row,'id'),row]));
      rows = recent.map(row => trendById.get(pick(row,'id')) || row);
      rows.sort((a,b) => Number(pick(b,'currentPlays') || 0) - Number(pick(a,'currentPlays') || 0));
    }
    rows = rows.slice(0, settings.ItemCount);
    const byId = new Map((await details(rows.map(row => pick(row,'id')).filter(Boolean))).map(item => [item.Id || item.id,item]));
    return rows.map(row => ({row,item:byId.get(pick(row,'id'))})).filter(entry => entry.item);
  }
  function imageUrl(item) {
    const id = item.Id || item.id;
    const backdrop = (item.BackdropImageTags || item.backdropImageTags || [])[0];
    return backdrop ? ApiClient.getUrl(`Items/${id}/Images/Backdrop/0`,{maxWidth:720,quality:82})
      : ApiClient.getUrl(`Items/${id}/Images/Primary`,{maxWidth:520,quality:82});
  }
  function render(settings, entries) {
    const host = homeHost(); if (!host) return;
    document.getElementById(ROOT_ID)?.remove();
    const root = document.createElement('section'); root.id=ROOT_ID; root.className=`jellyspotlight-${settings.Density || 'compact'}`;
    const heading=document.createElement('div'); heading.className='jellyspotlight-heading';
    const title=document.createElement('h2'); title.textContent=settings.Title || "What's hot right now";
    const scope=document.createElement('small'); scope.textContent=settings.Source === 'recent' ? 'Recently added' : 'Server-wide · cached by Jelana';
    heading.append(title,scope); const track=document.createElement('div'); track.className='jellyspotlight-track';
    entries.forEach(({row,item}) => {
      const id=item.Id||item.id; const card=document.createElement('a'); card.className='jellyspotlight-card'; card.href=`#!/details?id=${encodeURIComponent(id)}`;
      const image=document.createElement('img'); image.loading='lazy'; image.alt=''; image.src=imageUrl(item);
      const copy=document.createElement('div'); copy.className='jellyspotlight-copy'; const name=document.createElement('strong'); name.textContent=item.Name||item.name;
      copy.append(name);
      if (settings.ShowMetrics && row) { const meta=document.createElement('span'); const plays=pick(row,'currentPlays') ?? pick(row,'plays'); const viewers=pick(row,'uniqueViewers'); meta.textContent=`${plays} plays${viewers == null ? '' : ` · ${viewers} viewers`}`; copy.append(meta); }
      card.append(image,copy); track.append(card);
    });
    root.append(heading,track); host.prepend(root);
  }
  async function refresh() {
    if (busy || !homeHost()) return; busy=true;
    try { const settings=normalizeSettings(await api({type:'GET',url:ApiClient.getUrl('JellySpotlight/Settings')}));
      if (!settings.Enabled) { document.getElementById(ROOT_ID)?.remove(); return; }
      render(settings,await load(settings)); }
    catch (error) { console.warn('JellySpotlight could not load its content.',error); }
    finally { busy=false; }
  }
  new MutationObserver(() => refresh()).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('hashchange',refresh); setInterval(refresh,60000); refresh();
})();
