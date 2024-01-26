export const levelMap = {
  "A+": [95, 98, 4.3],
  A: [90, 93, 4],
  "A-": [85, 88, 3.7],
  "B+": [82, 84, 3.3],
  B: [78, 80, 3],
  "B-": [75, 77, 2.7],
  "C+": [72, 74, 2.3],
  C: [68, 70, 2],
  "C-": [65, 67, 1.7],
  "D+": [64, 65, 1.5],
  D: [61, 63, 1.3],
  "D-": [60, 61, 1],
  F: [0, NaN, 0],
  P: [0, NaN, 0],
} as const;
export type Level = keyof typeof levelMap | "F";

export const passSym = Symbol("通过");
export const notPassSym = Symbol("不通过");

export type Score = number | Level | typeof passSym | typeof notPassSym;

export class Course {
  constructor(
    public name: string = "",
    public id: string = "",
    public hour: number = 120,
    public credits: number = 6,
    public score: Score = 100,
  ) {}

  get level() {
    if (typeof this.score === "string") return this.score;
    if (typeof this.score === "symbol") return this.score === passSym ? "P" : "F";
    for (const [level, [min]] of Object.entries(levelMap)) {
      if (this.score >= min) return level as Level;
    }
    return "F";
  }

  get gpa() {
    return levelMap[this.level][2];
  }

  get point() {
    if (typeof this.score === "number") return this.score;
    else return levelMap[this.level][1];
  }

  get pass() {
    return this.level !== "F";
  }

  get scoreStr() {
    if (typeof this.score === "number") return this.score.toString();
    else if (typeof this.score === "symbol")
      return this.score === passSym ? "通过" : "不通过";
    else return this.score;
  }

  clone() {
    return new Course(this.name, this.id, this.hour, this.credits, this.score);
  }
}
