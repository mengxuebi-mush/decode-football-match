export const dictionaries = {
  en: {
    brand: "Football Companion",
    context: "Match context",
    plays: "Key tactical plays",
    highlights: "View match highlights ↗",
    replay: "Replay sequence",
    replaying: "Replaying…",
    sources: "Sources",
    home: "Home",
    away: "Away",
    actors: "solid = event actors",
    contextPlayers: "faded = teaching context",
    watch: "WHAT TO WATCH",
    dilemma: "KEY DILEMMA",
    transfer: "RECOGNIZE IT NEXT TIME",
    noHighlight: "No verified highlight available"
  },
  "zh-CN": {
    brand: "足球战术伙伴",
    context: "比赛背景",
    plays: "关键战术回合",
    highlights: "查看比赛集锦 ↗",
    replay: "重播过程",
    replaying: "正在重播…",
    sources: "来源",
    home: "主队",
    away: "客队",
    actors: "实心 = 回合参与者",
    contextPlayers: "淡色 = 教学情境球员",
    watch: "看哪里",
    dilemma: "关键两难",
    transfer: "下次怎么认",
    noHighlight: "暂无可核实的比赛集锦"
  }
};

export function getDictionary(locale) {
  return dictionaries[locale] ?? dictionaries.en;
}
