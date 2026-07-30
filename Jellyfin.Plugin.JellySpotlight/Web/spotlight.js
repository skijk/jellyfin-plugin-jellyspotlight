(() => {
  'use strict';
  const ROOT_ID = 'jellySpotlight';
  let busy = false;
  let lastSettings = null;
  const pick = (o, n) => o?.[n] ?? o?.[n[0].toUpperCase() + n.slice(1)];
  const api = options => ApiClient.ajax({...options,dataType:'json'});
  const migrateTitle = (title, source) => {
    if (title === "What's hot right now") return 'Trending this week';
    if (title === 'New and popular') return 'Popular new arrivals';
    return title || (source === 'newPopular'
      ? 'Popular new arrivals'
      : source === 'recent' ? 'Recently added' : 'Trending this week');
  };
  const sourceDescription = source => source === 'newPopular'
    ? 'Recently added and already being watched'
    : source === 'recent'
      ? 'Latest movies and series added to the library'
      : source === 'upcoming'
        ? 'Monitored movies approaching digital release'
      : 'Growing fastest compared with last week';
  function normalizeSettings(raw) {
    const configuredRows = pick(raw,'rows');
    const legacyRow = {
      Enabled:true,
      Source:pick(raw,'source') || 'hot',
      Title:pick(raw,'title') || "What's hot right now"
    };
    return {
      Enabled: pick(raw,'enabled') ?? true,
      Rows: (configuredRows?.length ? configuredRows : [legacyRow]).map(row => ({
        Enabled:pick(row,'enabled') ?? true,
        Source:pick(row,'source') || 'hot',
        Title:migrateTitle(pick(row,'title'),pick(row,'source') || 'hot')
      })),
      Density: pick(raw,'density') || 'feature',
      Position: pick(raw,'position') || 'afterBulletin',
      ItemCount: Number(pick(raw,'itemCount') || 8),
      ShowMetrics: pick(raw,'showMetrics') ?? true
    };
  }
  function homeHost() {
    return document.querySelector('#indexPage:not(.hide) .homeSectionsContainer,#indexPage:not(.hide) .sections,#indexPage:not(.hide) .content-primary,.homePage:not(.hide) .homeSectionsContainer,.homePage:not(.hide) .sections,.homePage:not(.hide) .content-primary');
  }
  async function details(ids) {
    if (!ids.length) return [];
    const result = await api({type:'GET',url:ApiClient.getUrl('Items',{
      UserId:ApiClient.getCurrentUserId(),
      Ids:ids.join(','),
      Recursive:true,
      Fields:'Overview,PrimaryImageAspectRatio,BackdropImageTags,ImageTags,CriticRating,CommunityRating'
    })});
    return pick(result,'items') || [];
  }
  async function load(rowSettings, settings, snapshotPromise) {
    if (rowSettings.Source === 'upcoming') {
      const movies = await api({
        type:'GET',
        url:ApiClient.getUrl('RadarrWatch/Upcoming',{limit:settings.ItemCount})
      });
      return (movies || []).map(movie => {
        const tmdbId = pick(movie,'tmdbId');
        return {
          item:{
            Id:'tmdb-' + tmdbId,
            Name:pick(movie,'title'),
            ProductionYear:pick(movie,'year'),
            SpotlightImageUrl:pick(movie,'imageUrl'),
            SpotlightUrl:'https://www.themoviedb.org/movie/' + tmdbId,
            DigitalRelease:pick(movie,'digitalRelease')
          }
        };
      });
    }
    if (rowSettings.Source === 'recent') {
      const userId = ApiClient.getCurrentUserId();
      const result = await api({type:'GET',url:ApiClient.getUrl('Items',{UserId:userId,SortBy:'DateCreated',SortOrder:'Descending',IncludeItemTypes:'Movie,Series',Recursive:true,Limit:settings.ItemCount,Fields:'BackdropImageTags,ImageTags,CriticRating,CommunityRating'})});
      return (pick(result,'items') || []).map(item => ({item}));
    }
    const snapshot = await snapshotPromise;
    let rows = pick(snapshot,'trending') || [];
    if (rowSettings.Source === 'newPopular') {
      const recent = pick(snapshot,'recent') || [];
      const trendById = new Map(rows.map(row => [pick(row,'id'),row]));
      rows = recent.map(row => trendById.get(pick(row,'id')) || row);
      rows.sort((a,b) => Number(pick(b,'currentPlays') || 0) - Number(pick(a,'currentPlays') || 0));
    }
    rows = rows.slice(0, settings.ItemCount);
    let enriched = [];
    try {
      enriched = await details(rows.map(row => pick(row,'id')).filter(Boolean));
    } catch (error) {
      console.warn('JellySpotlight could not enrich Jelana items with Jellyfin metadata.',error);
    }
    const byId = new Map(enriched.map(item => [item.Id || item.id,item]));
    return rows.map(row => {
      const id = pick(row,'id');
      return {
        row,
        item:byId.get(id) || {
          Id:id,
          Name:pick(row,'name')
        }
      };
    }).filter(entry => entry.item.Id);
  }
  function imageUrl(item) {
    if (item.SpotlightImageUrl || item.spotlightImageUrl) {
      return ApiClient.getUrl((item.SpotlightImageUrl || item.spotlightImageUrl).replace(/^\//,''));
    }
    const id = item.Id || item.id;
    const backdrop = (item.BackdropImageTags || item.backdropImageTags || [])[0];
    return backdrop ? ApiClient.getUrl(`Items/${id}/Images/Backdrop/0`,{maxWidth:720,quality:82})
      : ApiClient.getUrl(`Items/${id}/Images/Primary`,{maxWidth:520,quality:82});
  }
  function renderRow(settings, rowSettings, entries) {
    const section=document.createElement('section'); section.className='jellyspotlight-row';
    const heading=document.createElement('div'); heading.className='jellyspotlight-heading';
    const title=document.createElement('h2'); title.textContent=rowSettings.Title || 'Trending this week';
    const scope=document.createElement('small'); scope.textContent=sourceDescription(rowSettings.Source);
    heading.append(title,scope); const track=document.createElement('div'); track.className='jellyspotlight-track';
    isolateShelfGestures(track);
    entries.forEach(({row,item}) => {
      const id=item.Id||item.id; const card=document.createElement('a'); card.className='jellyspotlight-card';
      card.href=item.SpotlightUrl||item.spotlightUrl||`#!/details?id=${encodeURIComponent(id)}`;
      const image=document.createElement('img'); image.loading='lazy'; image.alt=''; image.src=imageUrl(item);
      const copy=document.createElement('div'); copy.className='jellyspotlight-copy'; const name=document.createElement('strong'); name.textContent=item.Name||item.name;
      copy.append(name);
      const digitalRelease=pick(item,'digitalRelease');
      if (digitalRelease) {
        const date=new Date(digitalRelease);
        if (!Number.isNaN(date.getTime())) {
          const release=document.createElement('span');
          release.className='jellyspotlight-meta jellyspotlight-release';
          release.textContent='Around ' + new Intl.DateTimeFormat('en-GB',{
            day:'numeric',
            month:'long',
            year:date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
          }).format(date);
          copy.append(release);
        }
      }
      if (settings.ShowMetrics) {
        const values=[];
        const plays=row && (pick(row,'currentPlays') ?? pick(row,'plays'));
        const viewers=row && pick(row,'uniqueViewers');
        const community=pick(item,'communityRating');
        const critic=pick(item,'criticRating');
        if (Number.isFinite(Number(plays))) values.push({text:`${plays} ${Number(plays) === 1 ? 'play' : 'plays'}`,className:'jellyspotlight-activity'});
        if (Number.isFinite(Number(viewers))) values.push({text:`${viewers} ${Number(viewers) === 1 ? 'viewer' : 'viewers'}`,className:'jellyspotlight-activity'});
        if (Number.isFinite(Number(community))) values.push({text:`★ ${Number(community).toFixed(1)}`,className:'jellyspotlight-rating'});
        if (Number.isFinite(Number(critic))) values.push({text:`🍅 ${Math.round(Number(critic))}%`,className:'jellyspotlight-critic'});
        if (values.length) {
          const meta=document.createElement('span'); meta.className='jellyspotlight-meta';
          values.forEach((value,index) => {
            if (index) meta.append(document.createTextNode(' · '));
            const part=document.createElement('span'); part.textContent=value.text;
            if (value.className) part.className=value.className;
            meta.append(part);
          });
          copy.append(meta);
        }
      }
      card.append(image,copy); track.append(card);
    });
    if (!entries.length) {
      const empty=document.createElement('p'); empty.className='jellyspotlight-error'; empty.textContent='No matching titles are available yet.'; track.append(empty);
    }
    section.append(heading,track);
    return section;
  }
  function isolateShelfGestures(track) {
    let startX=0;
    let startY=0;
    let horizontal=false;
    track.addEventListener('touchstart', event => {
      const touch=event.touches[0];
      startX=touch?.clientX || 0;
      startY=touch?.clientY || 0;
      horizontal=false;
      event.stopPropagation();
    },{passive:true});
    track.addEventListener('touchmove', event => {
      const touch=event.touches[0];
      if (touch && !horizontal) {
        const deltaX=Math.abs(touch.clientX-startX);
        const deltaY=Math.abs(touch.clientY-startY);
        horizontal=deltaX > deltaY && deltaX > 4;
      }
      if (horizontal) event.stopPropagation();
    },{passive:true});
    track.addEventListener('touchend', event => {
      if (horizontal) event.stopPropagation();
      horizontal=false;
    },{passive:true});
    track.addEventListener('touchcancel', event => {
      if (horizontal) event.stopPropagation();
      horizontal=false;
    },{passive:true});
  }
  function render(settings, rowResults) {
    const host = homeHost(); if (!host) return;
    document.getElementById(ROOT_ID)?.remove();
    const root = document.createElement('div'); root.id=ROOT_ID; root.className=`jellyspotlight-${settings.Density || 'feature'}`;
    rowResults.forEach(({row,entries}) => root.append(renderRow(settings,row,entries)));
    placeRoot(root,settings.Position);
  }
  function placeRoot(root, position) {
    const host=homeHost(); if (!host || !root) return;
    const bulletin=document.getElementById('jellyfinBulletin');
    if (!bulletin || bulletin.parentElement !== host) {
      host.prepend(root);
      return;
    }
    if (position === 'beforeBulletin') host.insertBefore(root,bulletin);
    else bulletin.insertAdjacentElement('afterend',root);
  }
  async function refresh() {
    if (busy || !homeHost()) return; busy=true;
    try { const settings=normalizeSettings(await api({type:'GET',url:ApiClient.getUrl('JellySpotlight/Settings')}));
      lastSettings=settings;
      if (!settings.Enabled) { document.getElementById(ROOT_ID)?.remove(); return; }
      const rows=settings.Rows.filter(row => row.Enabled);
      const needsJelana=rows.some(row => row.Source === 'hot' || row.Source === 'newPopular');
      const snapshotPromise=needsJelana
        ? api({type:'GET',url:ApiClient.getUrl('Jelana/Snapshot')})
        : Promise.resolve({});
      const rowResults=(await Promise.all(rows.map(async row => {
        try {
          return {row,entries:await load(row,settings,snapshotPromise)};
        } catch (error) {
          console.warn('JellySpotlight could not load row "' + row.Title + '".',error);
          return {row,entries:[]};
        }
      }))).filter(result => result.entries.length);
      render(settings,rowResults); }
    catch (error) { console.warn('JellySpotlight could not load its content.',error); }
    finally { busy=false; }
  }
  new MutationObserver(() => {
    const root=document.getElementById(ROOT_ID);
    if (!root) refresh();
    else {
      const bulletin=document.getElementById('jellyfinBulletin');
      if (bulletin && root.parentElement === bulletin.parentElement) {
        const shouldFollow=lastSettings?.Position !== 'beforeBulletin';
        const follows=bulletin.nextElementSibling === root;
        const precedes=root.nextElementSibling === bulletin;
        if ((shouldFollow && !follows) || (!shouldFollow && !precedes)) placeRoot(root,lastSettings?.Position);
      }
    }
  }).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('hashchange',refresh);
  window.addEventListener('jellyspotlight-refresh',refresh);
  setInterval(refresh,60000); refresh();
})();
