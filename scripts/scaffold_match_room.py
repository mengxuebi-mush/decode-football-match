#!/usr/bin/env python3
"""Copy the immutable Match Room template into a new match workspace."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path


SUPPORTED_LOCALES = ("en", "zh-CN")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scaffold a Football Companion Match Room")
    parser.add_argument("output", type=Path, help="Output directory")
    parser.add_argument("--locale", choices=SUPPORTED_LOCALES, default="en")
    parser.add_argument("--key-plays", type=int, choices=range(1, 13), metavar="1-12", help="Target number of tactical plays")
    parser.add_argument("--data", type=Path, help="Optional match-data.json to install")
    parser.add_argument("--force", action="store_true", help="Replace an existing output directory")
    return parser.parse_args()


def localize_placeholder(data: dict, locale: str) -> dict:
    data["locale"] = locale
    if locale == "en":
        return data

    data["match"].update(
        competition="演示比赛",
        subtitle="请用有来源的真实比赛数据替换教学样例",
        sourceDisclosure="仅为模板演示，发布前必须替换。",
    )
    translations = {
        "Kick-off": "开场",
        "Both base shapes": "双方基础队形",
        "The two base shapes share one pitch": "双方基础队形放在同一球场",
        "Demo context": "演示背景",
        "Base shape": "基础队形",
        "A wide 2v1 develops": "边路形成二打一",
        "The ball carrier forces the last defender to choose": "持球者迫使最后一名防守者做选择",
        "Demo sequence + football concept": "演示回合 + 足球概念",
        "Setup": "起势",
        "Decision": "抉择",
        "Outcome": "结果",
        "Home 4–2–3–1 · Away 4–3–3": "主队 4–2–3–1 · 客队 4–3–3",
        "7 Runner + 9 Forward · one covering defender": "7号跑动者 + 9号前锋 · 一名补位防守者",
        "Each team occupies its own half; dashed lines show units, not passes.": "双方各自占据一个半场；虚线表示阵型层级，不是传球路线。",
        "Two attackers break toward one covering defender.": "两名进攻者冲向一名补位防守者。",
        "The carrier approaches the defender and opens the passing lane.": "持球者接近防守者，横传线路随之打开。",
        "The defender has committed; the free player receives beyond the cover.": "防守者已经做出选择；空位队友在其身后接球。",
        "2v1 area": "二打一核心区",
        "Passing lane": "传球线路",
        "Free player": "空位球员",
        "Carry": "带球推进",
        "Support run": "接应跑动",
        "Commit defender": "吸引防守者",
        "Pass option": "传球选择",
        "Release": "送出传球",
        "Attack goal": "冲击球门",
        "Keeper": "门将",
        "Full-back": "边后卫",
        "Centre-back": "中后卫",
        "Pivot": "后腰",
        "Winger": "边锋",
        "Playmaker": "组织者",
        "Forward": "前锋",
        "Midfielder": "中场",
        "Runner": "跑动者",
        "Cover": "补位者",
        "Recovering": "回追者",
        "Defender": "防守者",
        "52′": "52′",
        "A decoy run opens the inside lane": "一次诱饵跑动打开内线",
        "The wide runner moves a defender without receiving the ball": "边路跑动者没有接球，却带走了一名防守者",
        "11 Winger · 10 Playmaker · 2 Full-back": "11号边锋 · 10号组织者 · 2号边后卫",
        "The winger receives wide with an overlapping runner behind.": "边锋在宽位接球，身后有一名套边跑动者。",
        "The full-back runs outside and pulls the nearest defender wider.": "边后卫向外侧跑动，把最近的防守者带向边线。",
        "The winger drives inside while the decoy runner stays outside.": "边锋向内推进，诱饵跑动者留在外线。",
        "Trigger": "触发",
        "Decoy run": "诱饵跑动",
        "Attack inside": "向内推进",
        "Final pass": "最后一传",
        "Inside lane": "内线通道",
        "Opened space": "被打开的空间",
        "67′": "67′",
        "Three attackers overload the left": "三名进攻者在左路形成人数优势",
        "A side overload creates a free third player": "边路人数优势制造出空位第三人",
        "3 attackers · 2 defenders · left channel": "3名进攻者 · 2名防守者 · 左侧通道",
        "Three attackers form a triangle against two defenders on the left.": "三名进攻者在左侧形成三角，对抗两名防守者。",
        "The midfielder draws both defenders and finds the third player.": "中场吸引两名防守者，再找到第三人。",
        "The free winger receives beyond the two defenders.": "空位边锋在两名防守者身后接球。",
        "First pass": "第一传",
        "Third player": "第三人",
        "Attack box": "冲击禁区",
        "Free player": "空位球员",
        "81′": "81′",
        "The back line protects the counter": "后方结构保护反击空间",
        "Rest defense stays connected behind the attack": "进攻身后的剩余防守保持连接",
        "attacking support · two defenders + pivot": "进攻接应 · 两名后卫 + 一名后腰",
        "The attack advances while two centre-backs and a pivot hold behind it.": "进攻向前发展，两名中卫和一名后腰留在后方。",
        "The cross is cleared toward the opposing forward.": "传中被解围到对方前锋附近。",
        "The pivot contests the clearance while the centre-backs protect depth.": "后腰争抢解围球，两名中卫保护身后。",
        "Turnover": "转换",
        "Attack": "进攻",
        "Clearance": "解围",
        "Contest": "上前争抢",
        "Rest defense": "剩余防守",
        "Cover triangle": "保护三角",
        "Counter controlled": "反击受控",
    }
    for moment in data["moments"]:
        for key in ("time", "short", "title", "evidenceLabel"):
            moment[key] = translations.get(moment[key], moment[key])
        for phase in moment["phases"]:
            phase["label"] = translations.get(phase["label"], phase["label"])
            phase["note"] = translations.get(phase["note"], phase["note"])
            for player in phase["players"]:
                player["name"] = translations.get(player["name"], player["name"])
            for arrow in phase.get("arrows", []):
                if arrow.get("label"):
                    arrow["label"] = translations.get(arrow["label"], arrow["label"])
            for zone in phase.get("zones", []):
                zone["label"] = translations.get(zone["label"], zone["label"])
        moment["legendSummary"] = translations.get(moment["legendSummary"], moment["legendSummary"])
        if moment.get("concept"):
            concept_translations = {
                "Local overload · 2v1": {
                    "name": "局部人数优势",
                    "definition": "进攻方在球附近多出一人，让一名防守者无法同时封住全部选择。",
                    "watchCue": "先数球附近的人数，再追随传球。",
                    "dilemma": "扑向持球人会放空跑动者；保护传球线又会让出推进空间。",
                    "transferCue": "以后在边路三打二、四打三时寻找同样的选择。",
                },
                "Decoy run": {
                    "name": "诱饵跑动",
                    "definition": "跑动者把防守者带离队友真正想利用的空间。",
                    "watchCue": "不要只看球，也看哪名防守者跟随了跑动者。",
                    "dilemma": "跟随跑动者会打开内线；留守位置又会放空跑动者。",
                    "transferCue": "以后留意那些没有触球，却制造出机会的跑动。",
                },
                "Side overload · 3v2": {
                    "name": "边路人数优势",
                    "definition": "进攻方在一侧集中多一名球员，制造空位传球选择。",
                    "watchCue": "先数同一条纵向通道里的人数，再跟随球。",
                    "dilemma": "向球侧收缩会暴露远端；保持平衡又会让出局部空位。",
                    "transferCue": "以后寻找边线附近三名进攻者包围两名防守者的三角。",
                },
                "Rest defense": {
                    "name": "剩余防守",
                    "definition": "进攻身后的球员保持位置，用来控制解围球或反击。",
                    "watchCue": "球进入禁区时，把视线移到进攻身后的保护球员。",
                    "dilemma": "再增加一名禁区进攻者，还是保留足够的反击保护。",
                    "transferCue": "传中后数一数仍在球后保持连接的球员。",
                },
            }
            moment["concept"].update(concept_translations[moment["concept"]["canonicalTerm"]])
    return data


def apply_key_play_target(data: dict, target: int | None, locale: str) -> dict:
    if target is None:
        return data
    context = [moment for moment in data["moments"] if moment["group"] == "context"]
    plays = [moment for moment in data["moments"] if moment["group"] == "play"]
    included = min(target, len(plays))
    data["moments"] = context + plays[:included]
    note = ""
    if included < target:
        note = (
            f"演示模板只有{included}个回合；生成真实比赛时应研究最多{target}个有可靠证据的回合。"
            if locale == "zh-CN"
            else f"The demo contains {included} plays; research up to {target} evidence-backed plays for a real match."
        )
    data["keyPlaySelection"] = {
        "target": target,
        "included": included,
        "strategy": "explicit",
        "limitationNote": note,
    }
    return data


def main() -> int:
    args = parse_args()
    root = Path(__file__).resolve().parents[1]
    template = root / "assets" / "match-room-template"
    output = args.output.resolve()

    if output.exists():
        if not args.force:
            print(f"error: {output} already exists; pass --force to replace it", file=sys.stderr)
            return 2
        shutil.rmtree(output)

    shutil.copytree(template, output)
    target = output / "src" / "match-data.json"
    if args.data:
        source = args.data.resolve()
        with source.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        data["locale"] = args.locale
    else:
        with target.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        data = localize_placeholder(data, args.locale)

    data = apply_key_play_target(data, args.key_plays, args.locale)

    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Scaffolded Match Room at {output}")
    print(f"Locale: {args.locale}")
    print(f"Key plays: {data['keyPlaySelection']['included']}/{data['keyPlaySelection']['target']}")
    print("Next: replace src/match-data.json, validate, npm install, and npm run build")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
