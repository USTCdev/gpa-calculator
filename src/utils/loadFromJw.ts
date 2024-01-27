import { levelMap } from "./constants";
import { Course, Level, Score, failSym, passSym } from "./course";

export function loadFromJw(raw: string) {
  const lines = raw
    .trim()
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const courses: Course[] = [];

  for (const line of lines) {
    const [nameAndId, hour, credits, _gpa, scoreRaw] = line
      .split("\t")
      .map(s => s.trim());

    let id = nameAndId.match(/[A-Z0-9]+$/)?.[0] ?? "";
    let name = nameAndId.slice(0, -id.length);
    if (
      ["CS", "PHYS", "MATH", "FL", "HS"].some(v => id.slice(1).startsWith(v))
    ) {
      name += id[0];
      id = id.slice(1);
    }

    let score: Score;
    if (/\d+/.test(scoreRaw)) {
      score = parseFloat(scoreRaw);
    } else if (scoreRaw === "通过") {
      score = passSym;
    } else if (scoreRaw === "不通过") {
      score = failSym;
    } else if (levelMap[scoreRaw as Level] !== undefined) {
      score = scoreRaw as Level;
    } else {
      score = "???" as any;
    }

    courses.push(
      new Course(name, id, parseInt(hour), parseFloat(credits), score),
    );
  }

  return courses;
}
