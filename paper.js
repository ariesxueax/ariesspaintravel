(() => {
  "use strict";

  const C = window.ROADBOOK_CONTENT;
  const G = window.ROADBOOK_SPOT_GUIDES?.spots || {};
  const I = window.ROADBOOK_ITINERARY;
  const historyText = window.ROADBOOK_HISTORY || "";
  const book = document.querySelector("#book");
  const counter = document.querySelector("[data-page-counter]");
  const previousButton = document.querySelector("[data-prev-page]");
  const nextButton = document.querySelector("[data-next-page]");
  const imageKeys = new Set(["alcazar-seville", "alhambra", "april-bridge-new", "avenida-liberdade-new", "bacalhau-new", "balco-del-mediterrani", "barcelona", "belem-tower", "belem-tower-new", "cabo-da-roca", "casa-batllo", "casa-mila", "city-arts-sciences-new", "columbus-monument", "cover", "cover-peniscola", "discoveries-monument-new", "evora", "evora-cathedral", "evora-old-town", "flamenco", "generalife", "granada", "jeronimos-new", "lisbon", "madrid", "maestranza-bullring", "mijas", "paella", "palau-nacional", "park-guell", "pasteis-belem-new", "peniscola", "plaza-de-la-virgen", "plaza-espana-seville", "plaza-mayor-madrid", "puente-nuevo", "roman-temple-evora", "ronda", "rossio-new", "royal-palace-madrid", "sagrada-familia", "serranos-towers", "seville", "seville-cathedral", "tarragona", "tarragona-amphitheatre", "torre-del-oro", "valencia", "valencia-cathedral", "zaragoza", "zaragoza-city"]);
  const modeLabels = { inside: "入内", guided: "官导", outside: "外观", distant: "远观", walk: "步行", free_time: "自由活动", shopping: "购物", show: "演出", food: "品尝" };
  const pageFragments = [];

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const paragraphs = value => String(value || "").split(/\n{2,}/).filter(Boolean).map(part => `<p>${esc(part.replace(/\*\*/g, ""))}</p>`).join("");
  const image = (key, alt, className = "") => `<img class="${className}" src="assets/images/mobile/${imageKeys.has(key) ? key : "cover"}.jpg"" alt="${esc(alt)}">`;
  const localCity = city => C.localNames?.cities?.[city] || C.cities?.[city]?.en || "";
  const localSpot = spot => C.localNames?.spots?.[spot] || "";
  const imageKeyFor = (spot, city) => imageKeys.has(C.imageKeys?.[spot]) ? C.imageKeys[spot] : imageKeys.has(C.cities?.[city]?.image) ? C.cities[city].image : "cover";
  const minutes = value => value ? `${value} 分钟` : "以当日安排为准";
  const visibleVisits = I.days.flatMap(day => day.visits.filter(visit => !visit.modes.includes("conditional")).map(visit => ({ ...visit, day: day.day, date: day.date })));
  // The paper edition drops the standalone paella detail page while retaining it in the daily meal summary.
  const paperVisits = visibleVisits.filter(visit => visit.nameZh !== "西班牙海鲜饭");
  const rocaVisit = paperVisits.find(visit => visit.city === "罗卡角");
  const visitsForCity = city => paperVisits.filter(visit => visit.city === city || (city === "里斯本" && visit.city === "罗卡角"));
  const allCities = I.routeNodes.map(node => node.nameZh).filter((city, index, nodes) => C.cities?.[city] && city !== "罗卡角" && nodes.indexOf(city) === index);

  function page(className, content, title = "IBERIA ROADBOOK") {
    pageFragments.push(`<article class="magazine-page ${className}"><header class="page-running-head"><span>${esc(title)}</span></header>${content}<span class="folio"></span></article>`);
  }

  function coverPage() {
    pageFragments.push(`<article class="magazine-page cover-page"><img class="cover-photo" src="assets/images/mobile/cover.jpg" alt="西班牙葡萄牙旅程封面"><div class="cover-shade"></div><div class="cover-content"><p class="eyebrow">29 SEP - 09 OCT 2026</p><h1>伊比利亚<br>光影纪行<small>Iberian Peninsula · Spain & Portugal</small></h1><p>从马德里的王室尺度，穿过高迪的曲线与安达卢西亚白墙，抵达大西洋尽头。</p><div class="cover-meta"><span>11 DAYS</span><span>13 NODES</span><span>IBERIAN PENINSULA</span></div></div><span class="folio"></span></article>`);
  }

  function routeMap() {
    const nodes = I.routeNodes.filter(node => C.cityCoordinates?.[node.nameZh]);
    const coordinates = nodes.map(node => C.cityCoordinates[node.nameZh]);
    const xs = coordinates.map(point => point[0]);
    const ys = coordinates.map(point => point[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const point = coordinate => [24 + ((coordinate[0] - minX) / (maxX - minX || 1)) * 192, 22 + ((maxY - coordinate[1]) / (maxY - minY || 1)) * 106];
    const path = nodes.map((node, index) => `${index ? "L" : "M"}${point(C.cityCoordinates[node.nameZh]).join(",")}`).join(" ");
    return `<svg class="route-map" viewBox="0 0 240 150" role="img" aria-label="西班牙葡萄牙路线概览"><path class="map-route" d="${path}"></path>${nodes.map(node => { const [x, y] = point(C.cityCoordinates[node.nameZh]); return `<circle class="map-point" cx="${x}" cy="${y}" r="4"></circle><text class="map-label" x="${x + 6}" y="${y - 5}">${esc(node.nameZh)}</text>`; }).join("")}</svg>`;
  }

  function overviewPage() {
    pageFragments.push(`<article class="magazine-page full-poster-page"><img src="assets/route-title-page.png" alt="伊比利亚半岛西班牙葡萄牙完整路线图"></article>`);
  }

  function preflightPage() {
    const groups = [
      ["证件类", ["护照", "申根签证", "身份证", "旅行行程单", "护照电子版", "身份证电子版"]],
      ["支付类", ["VISA / MASTER 信用卡", "少量欧元[200-500]", "熟悉信用卡一键冻结功能（防止盗刷）"]],
      ["电子类", ["欧标 C / F 转换插头", "充电器", "充电线", "充电宝（3C）", "手机取卡针", "U盘", "pocket", "耳机", "其他电子设备"]],
      ["防护类", ["挎包", "防盗纽扣", "防盗手链"]],
      ["衣物类", ["步行鞋", "薄外套", "内衣袜子", "湿巾 / 脸巾 / 浴巾 / 卫生巾"]],
      ["日用类", ["洗护用品", "牙膏牙刷", "剃须刀", "化妆品", "耳塞"]],
      ["旅行类", ["雨伞", "口罩", "墨镜", "防晒霜", "帽子", "烧水杯", "拖鞋", "零食", "垃圾袋"]],
      ["药品类", ["泡腾片", "创可贴 / 碘伏棉签", "过敏药", "止泻药", "退烧药", "止疼片", "晕车药"]],
      ["APP类", ["Google Maps", "Google Translate", "Uber / Bolt", "Global Blue", "Omio"]]
    ];
    page("preflight-page", `<p class="eyebrow">Before departure</p><h1>行前准备</h1><section class="preflight-flight-grid"><section class="preflight-flight-card"><b>JD605</b><h3>杭州 - 马德里</h3><p>首都航空 · 杭州萧山机场 T4</p><p>09/29 00:35 起飞 · 09/30 08:35 抵达（当地时间）</p></section><section class="preflight-flight-card"><b>JD622</b><h3>里斯本 - 杭州</h3><p>首都航空 · 里斯本波尔特拉机场 T1</p><p>10/08 11:55 起飞 · 10/09 08:10 抵达（当地时间）</p></section></section><p class="preflight-note"><b>飞行提醒：</b>国际段建议提前 3 小时抵达；移动电源和备用锂电池必须随身携带。登机口、行李规则以航空公司及机场当日通知为准。</p><section class="preflight-packing-grid">${groups.map(([title, items]) => `<section class="preflight-check-card"><h3>${esc(title)}</h3><ul class="check-items">${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul></section>`).join("")}</section><section class="preflight-emergency"><h3>紧急事项</h3><div><b>当地报警</b><span>112</span></div><div><b>中驻西大使馆</b><span>+34 915438877 · +34 913206181</span></div><div><b>中驻葡大使馆</b><span>+351 214024855 · +351 213928430</span></div><div><b>外交部</b><span>+86 10 12308</span></div></section><p class="source-line">航班信息来源：行程单；行前物品与紧急联系方式来源：用户提供的既定清单。纸质阅读版不提供新增、勾选或保存功能。</p>`);
  }

  function sectionTitle(title, english, key, text) {
    pageFragments.push(`<article class="magazine-page section-title-page"><img class="section-photo" src="assets/images/mobile/${key}.jpg" alt="${esc(title)}"><section class="section-copy"><p class="eyebrow">${esc(english)}</p><h1>${esc(title)}</h1><p>${esc(text)}</p></section><span class="folio"></span></article>`);
  }

  function summaryTransport(day) {
    if (!day.segments.length) return day.transport.includes("flight") ? "国际航班" : "团队集合";
    return day.segments.map(segment => `${segment.mode === "coach" ? "大巴" : "航班"} ${segment.from}-${segment.to}${segment.distanceKm ? ` ${segment.distanceKm} km` : ""}`).join(" · ");
  }

  function itinerarySummaryPages() {
    const summaries = [
      { days: I.days.slice(0, 6), title: "第 1-6 天", english: "Days 01-06", key: "barcelona" },
      { days: I.days.slice(6), title: "第 7-11 天", english: "Days 07-11", key: "lisbon" }
    ];
    summaries.forEach(summary => {
      page("itinerary-summary-page", `<section class="itinerary-summary-hero"><img src="assets/images/mobile/${summary.key}.jpg" alt="${esc(summary.title)} 行程主视觉"><div class="itinerary-summary-shade"></div><div><p class="eyebrow">${esc(summary.english)}</p><h1>${esc(summary.title)}</h1><p>日期、路线、餐食、交通、游览与住宿一页查阅。</p></div></section><section class="itinerary-summary-list" style="--summary-days:${summary.days.length}">${summary.days.map(day => { const hotel = C.hotels?.find(item => item.days.includes(day.day)); const visits = day.visits.map(visit => `<span>${esc(visit.nameZh)}${visit.modes.includes("conditional") ? "（备选）" : ` · ${esc(visit.modes.map(mode => modeLabels[mode]).filter(Boolean).join("/") || "游览")}`}</span>`).join(""); return `<article class="summary-day"><header class="summary-day-heading"><b>D${String(day.day).padStart(2, "0")}</b><div><p>${esc(day.date)} · ${esc(day.weekday)}</p><h3>${esc(day.route.join(" - "))}</h3></div></header><div class="summary-day-body"><div class="summary-meals"><span><b>早</b>${esc(day.meals.breakfast)}</span><span><b>午</b>${esc(day.meals.lunch)}</span><span><b>晚</b>${esc(day.meals.dinner)}</span></div><p class="summary-transport"><b>交通</b>${esc(summaryTransport(day))}</p><p class="summary-visits"><b>游览</b>${visits || esc(day.notes?.[0] || "当日安排以领队通知为准")}</p>${hotel ? `<p class="summary-stay"><b>入住</b>${esc(hotel.name)} · ${esc(hotel.city)}</p>` : ""}</div></article>`; }).join("")}</section><p class="source-line">日期、路线、餐食、交通、游览方式、最短停留时间与住宿来源：出团通知。城市间公里数为行程单参考值。</p>`, `ITINERARY · ${summary.english}`);
    });
  }

  function cityPage(city) {
    const profile = C.cities[city];
    const visits = visitsForCity(city);
    const foods = profile.nearby || [];
    pageFragments.push(`<article class="magazine-page city-page"><img class="city-photo" src="assets/images/mobile/${imageKeyFor("", city)}.jpg" alt="${esc(city)} 城市图片"><div class="city-shade"></div><section class="city-content"><p class="eyebrow">${esc(profile.days)} · ${esc(profile.country)}</p><h1>${esc(city)}</h1><p class="city-local">${esc(localCity(city))}</p><p class="city-culture">${esc(profile.culture)}</p><div class="city-bottom"><section class="city-panel"><h3>建筑与塑城者</h3><p>${esc(profile.architecture?.style || "")}</p></section><section class="city-panel"><h3>关键影响人</h3><p>${esc(profile.architecture?.makers || "")}</p></section><section class="city-panel"><h3>本城行程节点</h3><ul class="city-route">${visits.map(visit => `<li>${esc(visit.nameZh)} · ${minutes(visit.minimumDurationMinutes)}</li>`).join("")}</ul></section><section class="city-panel"><h3>逛吃推荐</h3><ul class="city-route">${foods.map(item => `<li>${esc(item[0])} · ${esc(item[1])}</li>`).join("")}</ul></section></div></section><span class="folio"></span></article>`);
  }

  function fallbackGuide(visit) {
    const profile = C.cities[visit.city] || {};
    return {
      kind: "行程节点", position: `${visit.city}行程范围内。`, card: profile.culture || "以现场视角阅读这座城市。", story: "具体历史说明请以现场官方展板、讲解与保护提示为准。", people: profile.architecture?.makers || "城市由不同时代的建造者共同塑造。", culture: profile.architecture?.style || "行程保留此处以体会当地城市风貌。", focus: "请以团队集合时间、现场动线与拍摄规定为准。", route: "跟随领队与当地管理规则游览，不离开规定区域。", honor: "行程资料未列出独立保护等级。"
    };
  }

  function spotPage(visit) {
    const guide = G[visit.nameZh] || fallbackGuide(visit);
    const notice = C.spotNotices?.[visit.nameZh];
    const blocks = [["一句话名片", guide.card], ["在哪里", guide.position], ["时间留下的故事", guide.story], ["谁塑造了它", guide.people], ["为什么值得看", guide.culture], ["到现场看什么", guide.focus], ["这样走更顺", guide.route], ["保护与荣誉", guide.honor]];
    pageFragments.push(`<article class="magazine-page spot-page"><img class="spot-photo" src="assets/images/mobile/${imageKeyFor(visit.nameZh, visit.city)}.jpg" alt="${esc(visit.nameZh)}"><div class="spot-shade"></div><section class="spot-heading"><p class="eyebrow">D${String(visit.day).padStart(2, "0")} · ${esc(visit.city)} · ${esc(guide.kind || "行程景点")}</p><h1>${esc(visit.nameZh)}</h1><p class="spot-local">${esc(localSpot(visit.nameZh) || visit.nameEn || "")}</p></section><section class="spot-content"><div class="spot-facts"><div class="spot-fact"><b>${esc(visit.city)}</b><span>所在城市</span></div><div class="spot-fact"><b>${minutes(visit.minimumDurationMinutes)}</b><span>行程停留</span></div><div class="spot-fact"><b>${esc(visit.modes.map(mode => modeLabels[mode]).filter(Boolean).join(" / "))}</b><span>参观方式</span></div></div><div class="guide-grid">${blocks.map(([title, text]) => `<section class="guide-block"><h3>${esc(title)}</h3><p>${esc(text || "以现场信息为准。")}</p></section>`).join("")}${notice ? `<section class="spot-note"><h3>${esc(notice.title)}</h3><p>${esc(notice.text)}</p></section>` : ""}${visit.notes ? `<section class="spot-note"><h3>行程提示</h3><p>${esc(visit.notes)}</p></section>` : ""}</div></section><p class="source-line">行程停留与参观方式来源：出团通知；景点文化介绍来源：既有路书资料。现场开放、预约与拍摄规则以景区当日通知为准。</p><span class="folio"></span></article>`);
  }

  function compactSpotCard(visit, variant = "feature") {
    const guide = G[visit.nameZh] || fallbackGuide(visit);
    const notice = C.spotNotices?.[visit.nameZh];
    const expanded = variant === "feature" || variant === "duo" || variant === "single";
    const blocks = expanded
      ? [
        ["一句话名片", guide.card],
        ["时间留下的故事", guide.story],
        ["谁塑造了它", guide.people],
        ["为什么值得看", `${guide.culture} ${guide.honor}`],
        ["到现场看什么", guide.focus],
        ["这样走更顺", guide.route]
      ]
      : [
        ["一句话名片", guide.card],
        ["时间留下的故事", guide.story],
        ["现场看点", `${guide.focus} ${guide.route}`]
      ];
    const note = [notice?.text, visit.notes].filter(Boolean).join(" ");
    return `<article class="pair-spot-card ${variant}-spot-card"><img class="pair-spot-image" src="assets/images/mobile/${imageKeyFor(visit.nameZh, visit.city)}.jpg" alt="${esc(visit.nameZh)}"><section class="pair-spot-copy"><p class="pair-spot-kicker">D${String(visit.day).padStart(2, "0")} · ${esc(visit.city)}</p><h2>${esc(visit.nameZh)}</h2><p class="pair-spot-local">${esc(localSpot(visit.nameZh) || visit.nameEn || "")}</p><div class="pair-spot-facts"><span>${minutes(visit.minimumDurationMinutes)}</span><span>${esc(visit.modes.map(mode => modeLabels[mode]).filter(Boolean).join(" / ") || "游览")}</span><span>${esc(guide.position || `${visit.city}行程范围内。`)}</span></div><div class="pair-guide-grid">${blocks.map(([title, text]) => `<section><h3>${esc(title)}</h3><p>${esc(text || "以现场信息为准。")}</p></section>`).join("")}${note ? `<section class="pair-spot-note"><h3>行程提醒</h3><p>${esc(note)}</p></section>` : ""}</div></section></article>`;
  }

  function compactSpotPages(city, visits) {
    for (let index = 0; index < visits.length; index += 4) {
      const chunk = visits.slice(index, index + 4);
      // Keep itinerary order in the data; only give Sagrada Familia the lead visual card on its paper spread.
      const spots = city === "巴塞罗那"
        ? [...chunk.filter(visit => visit.nameZh === "圣家族大教堂"), ...chunk.filter(visit => visit.nameZh !== "圣家族大教堂")]
        : chunk;
      const layout = spots.length === 1
        ? compactSpotCard(spots[0], "single")
        : spots.length === 2
          ? spots.map(visit => compactSpotCard(visit, "duo")).join("")
          : `${compactSpotCard(spots[0], "feature")}${spots.slice(1).map(visit => compactSpotCard(visit, city === "埃武拉" && visit.nameZh === "埃武拉大教堂" ? "wide-side" : "side")).join("")}`;
      page(`spot-pair-page spot-count-${spots.length}`, `<section class="spot-pair-list">${layout}</section><p class="source-line">行程停留与参观方式来源：出团通知；景点文字来源：既有路书资料。现场开放、预约与拍摄规则以景区当日通知为准。</p>`, `CITY GUIDE · ${localCity(city) || city}`);
    }
  }

  function rocaLisbonPage(visit) {
    const guide = G[visit.nameZh] || fallbackGuide(visit);
    const profile = C.cities["罗卡角"] || {};
    const blocks = [
      ["大西洋的门槛", profile.culture],
      ["海崖怎样成了建筑", profile.architecture?.style],
      ["谁给它写下名字", profile.architecture?.makers],
      ["现场先看什么", guide.focus],
      ["30 分钟怎么走", guide.route],
      ["保护与边界", guide.honor]
    ];
    page("spot-pair-page single-spot-page roca-lisbon-page", `<section class="spot-pair-list" style="--pair-size:1"><article class="pair-spot-card single-spot-card"><img class="pair-spot-image" src="assets/images/mobile/${imageKeyFor(visit.nameZh, visit.city)}.jpg" alt="${esc(visit.nameZh)}"><section class="pair-spot-copy"><p class="pair-spot-kicker">D${String(visit.day).padStart(2, "0")} · 里斯本近郊延伸</p><h2>${esc(visit.nameZh)}</h2><p class="pair-spot-local">${esc(localSpot(visit.nameZh) || visit.nameEn || "Cabo da Roca")}</p><div class="pair-spot-facts"><span>${minutes(visit.minimumDurationMinutes)}</span><span>${esc(visit.modes.map(mode => modeLabels[mode]).filter(Boolean).join(" / ") || "游览")}</span><span>${esc(guide.position || "辛特拉山脉西端")}</span></div><div class="pair-guide-grid">${blocks.map(([title, text]) => `<section><h3>${esc(title)}</h3><p>${esc(text || "以现场信息为准。")}</p></section>`).join("")}</div></section></article></section><p class="source-line">行程停留与参观方式来源：出团通知；景点文字来源：既有路书资料。现场开放与安全提示以景区当日通知为准。</p>`, "LISBON EXTENSION · CABO DA ROCA");
  }

  function phrasePages() {
    const groups = Array.from({ length: Math.ceil(C.phrases.length / 10) }, (_, index) => C.phrases.slice(index * 10, index * 10 + 10));
    page("phrase-summary-page", `<section class="phrase-summary-intro"><img src="assets/images/mobile/madrid.jpg" alt="马德里街景"><div><p class="eyebrow">Phrasebook · 30 phrases</p><h1>常用西班牙语</h1><p>西语、音标、中文谐音与中文含义。</p></div></section><section class="phrase-compact-list">${groups.map((phrases, groupIndex) => `<section class="phrase-compact-column"><h2>${String(groupIndex * 10 + 1).padStart(2, "0")} - ${String(groupIndex * 10 + phrases.length).padStart(2, "0")}</h2>${phrases.map((phrase, phraseIndex) => `<article class="phrase-compact-row"><b>${String(groupIndex * 10 + phraseIndex + 1).padStart(2, "0")}</b><div><p class="phrase-compact-es">${esc(phrase[0])}</p><p class="phrase-compact-sound">${esc(phrase[1])} · ${esc(phrase[2])}</p><p class="phrase-compact-zh">${esc(phrase[3])}</p></div></article>`).join("")}</section>`).join("")}</section><p class="source-line">常用语来源：既有路书资料。纸质版仅供现场查阅，不提供语音和文字翻译功能。</p>`, "PHRASEBOOK · 30 PHRASES");
  }

  function historyPages() {
    const parts = historyText.trim().split(/(?=^\d{2}｜)/m).filter(Boolean);
    const groups = [
      { parts: parts.slice(0, 5), title: "多重文明与 1492", range: "罗马边疆 · 安达卢斯 · 格拉纳达", key: "alhambra", columns: 3 },
      { parts: parts.slice(5, 10), title: "帝国的扩张与代价", range: "大航海 · 黄金时代 · 帝国终结", key: "seville", columns: 3 },
      { parts: parts.slice(10), title: "内战、转型与今日西班牙", range: "1936 · 1975 · 现代欧洲", key: "barcelona", columns: 2 }
    ];
    groups.forEach((group, index) => page("history-summary-page", `<section class="history-summary-hero"><img src="assets/images/mobile/${group.key}.jpg" alt="${esc(group.title)}"><div class="history-summary-shade"></div><div><p class="eyebrow">Spain · history ${String(index + 1).padStart(2, "0")} / 03</p><h1>${esc(group.title)}</h1><p>${esc(group.range)}</p></div></section><section class="history-summary-copy" style="--history-columns:${group.columns}">${group.parts.map(part => { const [heading, ...body] = part.split("\n"); return `<article class="history-summary-entry"><h2>${esc(heading)}</h2>${paragraphs(body.join("\n").replace(/\*\*/g, ""))}</article>`; }).join("")}</section><p class="source-line">内容来源：用户提供的《西班牙简史 v2》。为纸质阅读重排，未删减历史正文。</p>`, `SPANISH HISTORY · ${String(index + 1).padStart(2, "0")} / 03`));
  }

  function figurePages() {
    sectionTitle("人与时代", "People and their times", "royal-palace-madrid", "六位人物，让王朝、航海、建筑与文学在这段旅程中有了可记住的面孔。");
    C.figures.forEach((figure, index) => {
      const key = ["royal-palace-madrid", "madrid", "sagrada-familia", "discoveries-monument-new", "jeronimos-new", "lisbon"][index];
      const details = [["身份", figure.identity], ["生平", figure.life], ["影响", figure.impact], ["争议", figure.controversy], ["性格", figure.personal], ["代表成果", figure.legacy]];
      pageFragments.push(`<article class="magazine-page figure-page"><img class="figure-photo" src="assets/images/mobile/${key}.jpg" alt="${esc(figure.name)} 相关城市景观"><div class="figure-shade"></div><section class="figure-content"><p class="eyebrow">Historical figure</p><h1>${esc(figure.name)}</h1><p class="figure-years">${esc(figure.years)}</p><p class="figure-intro">${esc(figure.intro)}</p><div class="figure-detail-grid">${details.map(([title, text]) => `<section class="figure-detail"><h3>${esc(title)}</h3><p>${esc(text)}</p></section>`).join("")}</div></section><p class="source-line">人物资料来源：既有路书资料。</p><span class="folio"></span></article>`);
    });
  }

  function closingPage() {
    pageFragments.push(`<article class="magazine-page closing-page"><img class="closing-photo" src="assets/images/mobile/plaza-espana-seville.jpg" alt="塞维利亚西班牙广场"><div class="closing-shade"></div><section class="closing-quote"><p>观天地之大，<br>涉险远之途，<br>窥壁垒之后，<br>近彼此之心，<br>觅同道之人，<br>感万物之道。</p><small>THE SECRET LIFE OF WALTER MITTY · 用户提供的旅程引文</small></section><span class="folio"></span></article>`);
  }

  coverPage();
  overviewPage();
  preflightPage();
  itinerarySummaryPages();
  allCities.forEach(city => {
    cityPage(city);
    if (city === "里斯本" && rocaVisit) rocaLisbonPage(rocaVisit);
    compactSpotPages(city, paperVisits.filter(visit => visit.city === city));
  });
  phrasePages();
  historyPages();

  book.innerHTML = pageFragments.join("");
  const pages = [...book.querySelectorAll(".magazine-page")];
  pages.forEach((pageElement, index) => {
    const folio = pageElement.querySelector(".folio");
    if (folio) folio.textContent = `${String(index + 1).padStart(2, "0")} / ${String(pages.length).padStart(2, "0")}`;
  });

  let activePage = 0;
  function scalePage() {
    const availableWidth = Math.max(280, window.innerWidth - 24);
    const availableHeight = Math.max(300, window.innerHeight - 112);
    const scale = Math.min(1, availableWidth / pages[0].offsetWidth, availableHeight / pages[0].offsetHeight);
    pages.forEach(pageElement => {
      pageElement.style.transform = `scale(${scale})`;
      pageElement.style.marginBottom = scale < 1 ? `${-(1 - scale) * pages[0].offsetHeight}px` : "0";
    });
  }
  function showPage(index, moveFocus = false) {
    activePage = Math.max(0, Math.min(index, pages.length - 1));
    pages.forEach((pageElement, pageIndex) => { pageElement.hidden = pageIndex !== activePage; });
    counter.textContent = `${activePage + 1} / ${pages.length}`;
    previousButton.disabled = activePage === 0;
    nextButton.disabled = activePage === pages.length - 1;
    scalePage();
    if (moveFocus) document.querySelector(".book-shell").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  previousButton.addEventListener("click", () => showPage(activePage - 1, true));
  nextButton.addEventListener("click", () => showPage(activePage + 1, true));
  document.querySelector("[data-print]").addEventListener("click", () => window.print());
  window.addEventListener("resize", scalePage);
  window.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") showPage(activePage - 1, true);
    if (event.key === "ArrowRight" || event.key === " ") { event.preventDefault(); showPage(activePage + 1, true); }
    if (event.key === "Home") showPage(0, true);
    if (event.key === "End") showPage(pages.length - 1, true);
  });
  let pointerStartX = null;
  book.addEventListener("pointerdown", event => { pointerStartX = event.clientX; });
  book.addEventListener("pointerup", event => {
    if (pointerStartX === null) return;
    const distance = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(distance) < 44) return;
    showPage(activePage + (distance < 0 ? 1 : -1), true);
  });
  showPage(0);
})();
