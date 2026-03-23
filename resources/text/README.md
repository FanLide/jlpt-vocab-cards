# resources/text

把每课的文本放到这里：`chXX-lYY.txt`

示例文件名：
- ch01-l01.txt
- ch01-l02.txt

## 推荐格式（你现在粘贴的格式即可）
第一行：
- `第2课 友達（27～49）`

之后每个条目 5~6 行：
- `27 友人（ゆうじん）`
- `friend：朋友，友人`
- `例：国から友人が遊びに来た。`
- `国内的朋友来玩。`

允许：
- 英文释义里出现逗号
- 中文释义里出现顿号/逗号

## 生成 JSON
在项目根目录执行：
```bash
node scripts/import-text-to-json.mjs
```
会输出到：
- `data/n2/lessons/chXX-lYY.json`

备注：课程标题（中日）来自 `data/n2-lesson-structure.json`；音频来自 `data/n2-audio-map.csv`。
