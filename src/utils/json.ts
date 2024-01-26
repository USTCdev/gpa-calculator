import { version } from "./constants";
import { Course, failSym, passSym } from "./course";

export function dump(courses: Course[]) {
  return JSON.stringify({
    version,
    courses: courses.map(c => ({
      ...c,
      score:
        c.score === passSym
          ? "@@PASS"
          : c.score === failSym
            ? "@@FAIL"
            : c.score,
    })),
  });
}

export function load(json: string, noThrow = false): Course[] {
  const { version, courses } = JSON.parse(json);
  if (version === 1) {
    return courses.map(
      ({ name, id, hour, credits, score }: any) =>
        new Course(
          name,
          id,
          hour,
          credits,
          score === "@@PASS" ? passSym : score === "@@FAIL" ? failSym : score,
        ),
    );
  } else {
    if (!noThrow) {
      throw new Error("导入失败，版本不匹配");
    }
    return [];
  }
}
